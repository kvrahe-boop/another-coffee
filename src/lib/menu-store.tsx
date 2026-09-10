import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { get, set } from "idb-keyval";
import { defaultMenu } from "./menu-defaults";
import { uid, type Category, type MenuState, type ModifierGroup, type Product, type Settings } from "./menu-types";

const KEY = "another-coffee-menu-v1";
const CHANNEL = "another-coffee-menu";

type Ctx = {
  ready: boolean;
  menu: MenuState;
  /** Produtos visíveis no totem, ordenados. */
  visibleProducts: (categoryId: string) => Product[];
  visibleCategories: Category[];
  product: (id: string) => Product | undefined;
  group: (id: string) => ModifierGroup | undefined;
  update: (fn: (m: MenuState) => MenuState) => void;
  saveProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  saveGroup: (g: ModifierGroup) => void;
  deleteGroup: (id: string) => void;
  saveCategory: (c: Category) => void;
  deleteCategory: (id: string) => void;
  saveSettings: (s: Partial<Settings>) => void;
  resetToDefaults: () => void;
  exportJson: () => string;
  importJson: (json: string) => boolean;
};

const MenuContext = createContext<Ctx | null>(null);

/** Garante que estados antigos ganhem campos novos. */
function normalize(raw: Partial<MenuState> | undefined): MenuState {
  if (!raw) return defaultMenu;
  return {
    version: 1,
    settings: { ...defaultMenu.settings, ...(raw.settings ?? {}) },
    categories: raw.categories ?? defaultMenu.categories,
    modifierGroups: raw.modifierGroups ?? defaultMenu.modifierGroups,
    products: (raw.products ?? defaultMenu.products).map((p: Partial<Product>) => ({
      id: p.id ?? uid(),
      name: p.name ?? "",
      description: p.description ?? "",
      categoryId: p.categoryId ?? "quentes",
      image: p.image ?? "",
      price: p.price ?? 0,
      sortOrder: p.sortOrder ?? 0,
      sizes: p.sizes ?? [],
      modifierGroupIds: p.modifierGroupIds ?? [],
      upsellProductIds: p.upsellProductIds ?? [],
      comboProductIds: p.comboProductIds ?? [],
      available: p.available ?? true,
      hidden: p.hidden ?? false,
      cupStyle: p.cupStyle ?? "none",
      garnish: p.garnish ?? "",
      imagePrompt: p.imagePrompt ?? "",
    })),
  };
}

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [menu, setMenu] = useState<MenuState>(defaultMenu);
  const [ready, setReady] = useState(false);
  const channel = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    let alive = true;
    get<MenuState>(KEY).then((saved) => {
      if (!alive) return;
      setMenu(normalize(saved));
      setReady(true);
    });
    if ("BroadcastChannel" in window) {
      channel.current = new BroadcastChannel(CHANNEL);
      channel.current.onmessage = () => get<MenuState>(KEY).then((s) => s && setMenu(normalize(s)));
    }
    return () => {
      alive = false;
      channel.current?.close();
    };
  }, []);

  const update = useCallback((fn: (m: MenuState) => MenuState) => {
    setMenu((prev) => {
      const next = fn(prev);
      void set(KEY, next).then(() => channel.current?.postMessage("changed"));
      return next;
    });
  }, []);

  const value = useMemo<Ctx>(() => {
    const sorted = <T extends { sortOrder: number }>(l: T[]) =>
      [...l].sort((a, b) => a.sortOrder - b.sortOrder);
    return {
      ready,
      menu,
      visibleCategories: sorted(menu.categories).filter(
        (c) => !c.hidden && menu.products.some((p) => p.categoryId === c.id && !p.hidden),
      ),
      visibleProducts: (categoryId) =>
        sorted(menu.products.filter((p) => p.categoryId === categoryId && !p.hidden)),
      product: (id) => menu.products.find((p) => p.id === id),
      group: (id) => menu.modifierGroups.find((g) => g.id === id),
      update,
      saveProduct: (p) =>
        update((m) => ({
          ...m,
          products: m.products.some((x) => x.id === p.id)
            ? m.products.map((x) => (x.id === p.id ? p : x))
            : [...m.products, p],
        })),
      deleteProduct: (id) =>
        update((m) => ({
          ...m,
          products: m.products
            .filter((p) => p.id !== id)
            .map((p) => ({ ...p, upsellProductIds: p.upsellProductIds.filter((u) => u !== id) })),
        })),
      saveGroup: (g) =>
        update((m) => ({
          ...m,
          modifierGroups: m.modifierGroups.some((x) => x.id === g.id)
            ? m.modifierGroups.map((x) => (x.id === g.id ? g : x))
            : [...m.modifierGroups, g],
        })),
      deleteGroup: (id) =>
        update((m) => ({
          ...m,
          modifierGroups: m.modifierGroups.filter((g) => g.id !== id),
          products: m.products.map((p) => ({
            ...p,
            modifierGroupIds: p.modifierGroupIds.filter((g) => g !== id),
          })),
        })),
      saveCategory: (c) =>
        update((m) => ({
          ...m,
          categories: m.categories.some((x) => x.id === c.id)
            ? m.categories.map((x) => (x.id === c.id ? c : x))
            : [...m.categories, c],
        })),
      deleteCategory: (id) =>
        update((m) => ({
          ...m,
          categories: m.categories.filter((c) => c.id !== id),
          products: m.products.filter((p) => p.categoryId !== id),
        })),
      saveSettings: (s) => update((m) => ({ ...m, settings: { ...m.settings, ...s } })),
      resetToDefaults: () => update(() => defaultMenu),
      exportJson: () => JSON.stringify(menu, null, 2),
      importJson: (json) => {
        try {
          const parsed = JSON.parse(json) as Partial<MenuState>;
          if (!Array.isArray(parsed.products)) return false;
          update(() => normalize(parsed));
          return true;
        } catch {
          return false;
        }
      },
    };
  }, [menu, ready, update]);

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error("useMenu precisa estar dentro de MenuProvider");
  return ctx;
}
