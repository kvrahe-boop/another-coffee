import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { useMenu } from "@/lib/menu-store";
import { generateProductImage } from "@/lib/ai.functions";
import { fileToDataUrl, hasTransparency, removeBackground, trimAndShrink } from "@/lib/image-tools";
import { bluetoothSupported, connectPrinter, printerConnected } from "@/lib/printer";
import {
  brl,
  cupStyles,
  uid,
  type Category,
  type CupStyle,
  type ModifierGroup,
  type Product,
} from "@/lib/menu-types";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel do cardápio — Another Coffee" },
      { name: "description", content: "Edite fotos, preços, descrições, complementos e categorias do totem." },
      { property: "og:title", content: "Painel do cardápio — Another Coffee" },
      { property: "og:description", content: "Gestão do cardápio do totem de autoatendimento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

/* ── peças de UI ─────────────────────────────────────────────── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl bg-background px-3 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-foreground";

function Toggle({ on, onChange, children }: { on: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      aria-pressed={on}
      className={`rounded-full px-3 py-2 text-xs font-medium transition-colors ${
        on ? "bg-primary text-primary-foreground" : "text-muted-foreground ring-1 ring-border"
      }`}
    >
      {children}
    </button>
  );
}

/* ── página ──────────────────────────────────────────────────── */

type Tab = "produtos" | "complementos" | "categorias" | "ajustes";

function Admin() {
  const { menu, ready } = useMenu();
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [tab, setTab] = useState<Tab>("produtos");

  if (!ready) return <p className="p-8 text-sm text-muted-foreground">Carregando…</p>;

  if (!unlocked) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6">
        <form
          className="w-full max-w-xs space-y-4 text-center"
          onSubmit={(e) => {
            e.preventDefault();
            if (pin === menu.settings.pin) setUnlocked(true);
            else setPin("");
          }}
        >
          <h1 className="font-display text-3xl tracking-tight">Painel</h1>
          <p className="text-sm text-muted-foreground">Digite o código de acesso</p>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            inputMode="numeric"
            autoFocus
            maxLength={8}
            placeholder="••••"
            className="w-full rounded-2xl bg-card px-4 py-4 text-center font-display text-2xl tracking-[0.4em] outline-none ring-1 ring-border focus:ring-foreground"
          />
          <button type="submit" className="w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground">
            Entrar
          </button>
          <Link to="/" className="block text-xs text-muted-foreground">
            Voltar ao totem
          </Link>
        </form>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "produtos", label: "Produtos" },
    { id: "complementos", label: "Complementos" },
    { id: "categorias", label: "Categorias" },
    { id: "ajustes", label: "Ajustes" },
  ];

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link to="/" className="rounded-full px-3 py-2 text-sm ring-1 ring-border">
            ← Totem
          </Link>
          <h1 className="font-display text-xl tracking-tight">Cardápio</h1>
          <Link to="/expedicao" className="ml-auto rounded-full px-3 py-2 text-xs ring-1 ring-border">
            Expedição
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] ${
                tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="mx-auto max-w-3xl p-4">
        {tab === "produtos" && <Products />}
        {tab === "complementos" && <Groups />}
        {tab === "categorias" && <Categories />}
        {tab === "ajustes" && <SettingsTab />}
      </div>
    </div>
  );
}

/* ── produtos ────────────────────────────────────────────────── */

function Products() {
  const { menu, saveProduct, deleteProduct } = useMenu();
  const [editing, setEditing] = useState<Product | null>(null);

  const novo = (): Product => ({
    id: uid(),
    name: "",
    description: "",
    categoryId: menu.categories[0]?.id ?? "quentes",
    image: "",
    price: 0,
    sizes: [],
    modifierGroupIds: [],
    upsellProductIds: [],
    comboProductIds: [],
    available: true,
    hidden: false,
    sortOrder: menu.products.length,
    cupStyle: "kraft",
    garnish: "",
    imagePrompt: "",
  });

  if (editing)
    return (
      <ProductForm
        key={editing.id}
        product={editing}
        onCancel={() => setEditing(null)}
        onSave={(p) => {
          saveProduct(p);
          setEditing(null);
        }}
        onDelete={() => {
          deleteProduct(editing.id);
          setEditing(null);
        }}
      />
    );

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setEditing(novo())}
        className="w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground"
      >
        + Novo produto
      </button>
      {menu.categories
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((c) => (
          <section key={c.id}>
            <h2 className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {c.label}
            </h2>
            <ul className="space-y-2">
              {menu.products
                .filter((p) => p.categoryId === c.id)
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setEditing(p)}
                      className="flex w-full items-center gap-3 rounded-2xl bg-card/60 p-3 text-left ring-1 ring-border"
                    >
                      {p.image ? (
                        <img src={p.image} alt="" width={96} height={96} loading="lazy" className="size-12 object-contain" />
                      ) : (
                        <span className="grid size-12 place-items-center rounded-xl text-xs text-muted-foreground ring-1 ring-border">
                          foto
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{p.name || "(sem nome)"}</span>
                        <span className="block text-xs text-muted-foreground">
                          {p.sizes.length ? `${p.sizes.length} tamanhos` : brl(p.price)}
                          {!p.available && " · esgotado"}
                          {p.hidden && " · oculto"}
                        </span>
                      </span>
                      <span className="text-muted-foreground">›</span>
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        ))}
    </div>
  );
}

function ProductForm({
  product,
  onSave,
  onCancel,
  onDelete,
}: {
  product: Product;
  onSave: (p: Product) => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const { menu } = useMenu();
  const [p, setP] = useState<Product>(product);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const generate = useServerFn(generateProductImage);
  const set = <K extends keyof Product>(k: K, v: Product[K]) => setP((x) => ({ ...x, [k]: v }));

  const applyImage = async (raw: string) => {
    const clean = (await hasTransparency(raw)) ? await trimAndShrink(raw) : await removeBackground(raw);
    set("image", clean);
  };

  const onUpload = async (file: File) => {
    setErr("");
    setBusy("Preparando a foto…");
    try {
      await applyImage(await fileToDataUrl(file));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha ao abrir a imagem");
    }
    setBusy("");
  };

  const onGenerate = async () => {
    setErr("");
    setBusy("Gerando a foto…");
    try {
      const kind = menu.categories.find((c) => c.id === p.categoryId)?.kind ?? "drink";
      const res = await generate({
        data: {
          name: p.name,
          description: p.description,
          cupStyle: p.cupStyle,
          garnish: p.garnish,
          categoryKind: kind,
        },
      });
      await applyImage(res.image);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha ao gerar a foto");
    }
    setBusy("");
  };

  const toggleIn = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (p.name.trim()) onSave({ ...p, name: p.name.trim() });
      }}
    >
      <div className="flex items-center gap-2">
        <button type="button" onClick={onCancel} className="rounded-full px-3 py-2 text-sm ring-1 ring-border">
          ← Voltar
        </button>
        <h2 className="font-display text-xl tracking-tight">{p.name || "Novo produto"}</h2>
      </div>

      {/* foto */}
      <div className="rounded-3xl bg-card/60 p-4 ring-1 ring-border">
        <div className="flex items-center gap-4">
          <div className="grid size-28 shrink-0 place-items-center rounded-2xl bg-background ring-1 ring-border">
            {p.image ? (
              <img src={p.image} alt="" width={224} height={224} className="max-h-24 object-contain" />
            ) : (
              <span className="text-xs text-muted-foreground">sem foto</span>
            )}
          </div>
          <div className="flex flex-1 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-full px-3 py-2 text-xs font-medium ring-1 ring-border"
            >
              Enviar foto
            </button>
            <button
              type="button"
              onClick={() => void onGenerate()}
              disabled={!p.name.trim() || !!busy}
              className="rounded-full bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-40"
            >
              Gerar com IA
            </button>
            {p.image && (
              <button
                type="button"
                onClick={() => void applyImage(p.image)}
                className="rounded-full px-3 py-2 text-xs ring-1 ring-border"
              >
                Tirar fundo
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onUpload(f);
                e.target.value = "";
              }}
            />
          </div>
        </div>
        {busy && <p className="mt-3 text-xs text-muted-foreground">{busy}</p>}
        {err && <p className="mt-3 text-xs text-destructive">{err}</p>}
      </div>

      <Field label="Nome">
        <input className={inputCls} value={p.name} onChange={(e) => set("name", e.target.value)} />
      </Field>
      <Field label="Descrição">
        <input
          className={inputCls}
          value={p.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Categoria">
          <select
            className={inputCls}
            value={p.categoryId}
            onChange={(e) => set("categoryId", e.target.value)}
          >
            {menu.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Ordem na fila">
          <input
            type="number"
            className={inputCls}
            value={p.sortOrder}
            onChange={(e) => set("sortOrder", Number(e.target.value))}
          />
        </Field>
      </div>

      <Field label="Copo (usado ao gerar a foto)">
        <div className="flex flex-wrap gap-2">
          {cupStyles.map((c) => (
            <Toggle key={c.id} on={p.cupStyle === c.id} onChange={() => set("cupStyle", c.id as CupStyle)}>
              {c.label}
            </Toggle>
          ))}
        </div>
        <span className="mt-1 block text-xs text-muted-foreground">
          {cupStyles.find((c) => c.id === p.cupStyle)?.hint}
        </span>
      </Field>

      {p.cupStyle === "dome" && (
        <Field label="Enfeite por cima">
          <input
            className={inputCls}
            placeholder="chantilly e calda de chocolate"
            value={p.garnish}
            onChange={(e) => set("garnish", e.target.value)}
          />
        </Field>
      )}

      {/* preço / tamanhos */}
      <div className="rounded-3xl bg-card/60 p-4 ring-1 ring-border">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Preço
          </span>
          <Toggle
            on={p.sizes.length > 0}
            onChange={(on) =>
              set(
                "sizes",
                on
                  ? [
                      { id: "P", label: "P", price: p.price || 0 },
                      { id: "M", label: "M", price: (p.price || 0) + 2 },
                      { id: "G", label: "G", price: (p.price || 0) + 4 },
                    ]
                  : [],
              )
            }
          >
            Tem tamanhos
          </Toggle>
        </div>
        {p.sizes.length === 0 ? (
          <Field label="Preço único (R$)">
            <input
              type="number"
              step="0.5"
              className={inputCls}
              value={p.price}
              onChange={(e) => set("price", Number(e.target.value))}
            />
          </Field>
        ) : (
          <div className="space-y-2">
            {p.sizes.map((s, i) => (
              <div key={s.id} className="flex gap-2">
                <input
                  className={inputCls}
                  value={s.label}
                  onChange={(e) =>
                    set(
                      "sizes",
                      p.sizes.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)),
                    )
                  }
                />
                <input
                  type="number"
                  step="0.5"
                  className={inputCls}
                  value={s.price}
                  onChange={(e) =>
                    set(
                      "sizes",
                      p.sizes.map((x, k) => (k === i ? { ...x, price: Number(e.target.value) } : x)),
                    )
                  }
                />
                <button
                  type="button"
                  aria-label={`Remover tamanho ${s.label}`}
                  onClick={() => set("sizes", p.sizes.filter((_, k) => k !== i))}
                  className="shrink-0 rounded-xl px-3 text-sm ring-1 ring-border"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => set("sizes", [...p.sizes, { id: uid(), label: "Novo", price: 0 }])}
              className="rounded-full px-3 py-2 text-xs ring-1 ring-border"
            >
              + tamanho
            </button>
          </div>
        )}
      </div>

      <Field label="Complementos que aparecem neste produto">
        <div className="flex flex-wrap gap-2">
          {menu.modifierGroups.map((g) => (
            <Toggle
              key={g.id}
              on={p.modifierGroupIds.includes(g.id)}
              onChange={() => set("modifierGroupIds", toggleIn(p.modifierGroupIds, g.id))}
            >
              {g.name}
            </Toggle>
          ))}
        </div>
        <span className="mt-1 block text-xs text-muted-foreground">
          Só o que estiver ligado aparece para o cliente (sem leite → nada de leite).
        </span>
      </Field>

      <Field label="Sugerir junto (Quer adicionar algo mais?)">
        <div className="flex flex-wrap gap-2">
          {menu.products
            .filter((x) => x.id !== p.id)
            .map((x) => (
              <Toggle
                key={x.id}
                on={p.upsellProductIds.includes(x.id)}
                onChange={() => set("upsellProductIds", toggleIn(p.upsellProductIds, x.id))}
              >
                {x.name}
              </Toggle>
            ))}
        </div>
      </Field>

      <div className="flex flex-wrap gap-2">
        <Toggle on={p.available} onChange={(v) => set("available", v)}>
          {p.available ? "Disponível" : "Esgotado"}
        </Toggle>
        <Toggle on={!p.hidden} onChange={(v) => set("hidden", !v)}>
          {p.hidden ? "Oculto no totem" : "Visível no totem"}
        </Toggle>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={!p.name.trim()}
          className="flex-1 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-40"
        >
          Salvar
        </button>
        <button type="button" onClick={onDelete} className="rounded-full px-4 py-3 text-sm ring-1 ring-border">
          Excluir
        </button>
      </div>
    </form>
  );
}

/* ── complementos ────────────────────────────────────────────── */

function Groups() {
  const { menu, saveGroup, deleteGroup } = useMenu();
  const add = () =>
    saveGroup({ id: uid(), name: "Novo grupo", type: "single", required: false, max: 1, options: [] });

  return (
    <div className="space-y-4">
      <button type="button" onClick={add} className="w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground">
        + Novo grupo de complementos
      </button>
      {menu.modifierGroups.map((g) => (
        <GroupCard key={g.id} group={g} onSave={saveGroup} onDelete={() => deleteGroup(g.id)} />
      ))}
    </div>
  );
}

function GroupCard({
  group,
  onSave,
  onDelete,
}: {
  group: ModifierGroup;
  onSave: (g: ModifierGroup) => void;
  onDelete: () => void;
}) {
  const [g, setG] = useState(group);
  const set = <K extends keyof ModifierGroup>(k: K, v: ModifierGroup[K]) => {
    const next = { ...g, [k]: v };
    setG(next);
    onSave(next);
  };

  return (
    <section className="space-y-3 rounded-3xl bg-card/60 p-4 ring-1 ring-border">
      <div className="flex gap-2">
        <input className={inputCls} value={g.name} onChange={(e) => set("name", e.target.value)} />
        <button type="button" onClick={onDelete} className="shrink-0 rounded-xl px-3 text-sm ring-1 ring-border">
          Excluir
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Toggle on={g.type === "single"} onChange={() => set("type", g.type === "single" ? "multiple" : "single")}>
          {g.type === "single" ? "Escolhe 1" : "Escolhe vários"}
        </Toggle>
        <Toggle on={g.required} onChange={(v) => set("required", v)}>
          {g.required ? "Obrigatório" : "Opcional"}
        </Toggle>
        {g.type === "multiple" && (
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            máximo
            <input
              type="number"
              min={0}
              value={g.max}
              onChange={(e) => set("max", Number(e.target.value))}
              className="w-16 rounded-xl bg-background px-2 py-1.5 text-sm ring-1 ring-border"
            />
          </label>
        )}
      </div>
      <ul className="space-y-2">
        {g.options.map((o, i) => (
          <li key={o.id} className="flex gap-2">
            <input
              className={inputCls}
              value={o.label}
              onChange={(e) =>
                set("options", g.options.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))
              }
            />
            <input
              type="number"
              step="0.5"
              className="w-24 rounded-xl bg-background px-3 py-2.5 text-sm ring-1 ring-border"
              value={o.price}
              onChange={(e) =>
                set("options", g.options.map((x, k) => (k === i ? { ...x, price: Number(e.target.value) } : x)))
              }
            />
            <button
              type="button"
              aria-label={`Remover ${o.label}`}
              onClick={() => set("options", g.options.filter((_, k) => k !== i))}
              className="shrink-0 rounded-xl px-3 text-sm ring-1 ring-border"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => set("options", [...g.options, { id: uid(), label: "Nova opção", price: 0 }])}
        className="rounded-full px-3 py-2 text-xs ring-1 ring-border"
      >
        + opção
      </button>
    </section>
  );
}

/* ── categorias ──────────────────────────────────────────────── */

function Categories() {
  const { menu, saveCategory, deleteCategory } = useMenu();
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() =>
          saveCategory({
            id: uid(),
            label: "Nova",
            kind: "drink",
            sortOrder: menu.categories.length,
            hidden: false,
          })
        }
        className="w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground"
      >
        + Nova categoria
      </button>
      {menu.categories
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((c) => (
          <CategoryRow key={c.id} category={c} onSave={saveCategory} onDelete={() => deleteCategory(c.id)} />
        ))}
      <p className="text-xs text-muted-foreground">
        Excluir uma categoria também remove os produtos dela.
      </p>
    </div>
  );
}

function CategoryRow({
  category,
  onSave,
  onDelete,
}: {
  category: Category;
  onSave: (c: Category) => void;
  onDelete: () => void;
}) {
  const [c, setC] = useState(category);
  const set = <K extends keyof Category>(k: K, v: Category[K]) => {
    const next = { ...c, [k]: v };
    setC(next);
    onSave(next);
  };
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-card/60 p-3 ring-1 ring-border">
      <input className="flex-1 rounded-xl bg-background px-3 py-2 text-sm ring-1 ring-border" value={c.label} onChange={(e) => set("label", e.target.value)} />
      <input
        type="number"
        aria-label="Ordem"
        className="w-16 rounded-xl bg-background px-2 py-2 text-sm ring-1 ring-border"
        value={c.sortOrder}
        onChange={(e) => set("sortOrder", Number(e.target.value))}
      />
      <Toggle on={!c.hidden} onChange={(v) => set("hidden", !v)}>
        {c.hidden ? "Oculta" : "Visível"}
      </Toggle>
      <button type="button" onClick={onDelete} className="rounded-xl px-3 py-2 text-sm ring-1 ring-border">
        Excluir
      </button>
    </div>
  );
}

/* ── ajustes ─────────────────────────────────────────────────── */

function SettingsTab() {
  const { menu, saveSettings, exportJson, importJson, resetToDefaults } = useMenu();
  const s = menu.settings;
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");

  const download = () => {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cardapio-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-5">
      <Field label="Nome da loja">
        <input className={inputCls} value={s.storeName} onChange={(e) => saveSettings({ storeName: e.target.value })} />
      </Field>
      <Field label="Título da tela inicial">
        <input className={inputCls} value={s.welcomeTitle} onChange={(e) => saveSettings({ welcomeTitle: e.target.value })} />
      </Field>
      <Field label="Frase da tela inicial">
        <input
          className={inputCls}
          value={s.welcomeSubtitle}
          onChange={(e) => saveSettings({ welcomeSubtitle: e.target.value })}
        />
      </Field>
      <Field label="Produto em destaque na abertura">
        <select
          className={inputCls}
          value={s.heroProductId ?? ""}
          onChange={(e) => saveSettings({ heroProductId: e.target.value || null })}
        >
          <option value="">(primeiro do cardápio)</option>
          {menu.products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Código de acesso do painel">
        <input className={inputCls} value={s.pin} onChange={(e) => saveSettings({ pin: e.target.value })} />
      </Field>

      <div className="space-y-2 rounded-3xl bg-card/60 p-4 ring-1 ring-border">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Impressora</p>
        {bluetoothSupported() ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                connectPrinter()
                  .then((n) => setMsg(`${n} conectada`))
                  .catch((e: Error) => setMsg(e.message))
              }
              className="rounded-full px-3 py-2 text-xs ring-1 ring-border"
            >
              {printerConnected() ? "Reconectar" : "Conectar impressora Bluetooth"}
            </button>
            <Toggle on={s.autoPrint} onChange={(v) => saveSettings({ autoPrint: v })}>
              Imprimir ao confirmar
            </Toggle>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Este navegador não conecta a impressoras Bluetooth. Use o Chrome no tablet Android.
          </p>
        )}
      </div>

      <div className="space-y-2 rounded-3xl bg-card/60 p-4 ring-1 ring-border">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Backup</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={download} className="rounded-full px-3 py-2 text-xs ring-1 ring-border">
            Baixar cardápio
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-full px-3 py-2 text-xs ring-1 ring-border"
          >
            Restaurar de arquivo
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm("Voltar ao cardápio original? Suas edições serão perdidas.")) resetToDefaults();
            }}
            className="rounded-full px-3 py-2 text-xs text-muted-foreground ring-1 ring-border"
          >
            Restaurar padrão
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              setMsg(importJson(await f.text()) ? "Cardápio restaurado" : "Arquivo inválido");
            }}
          />
        </div>
      </div>

      {msg && <p className="text-xs text-muted-foreground">{msg}</p>}

      <div className="rounded-3xl bg-card/60 p-4 text-xs leading-relaxed text-muted-foreground ring-1 ring-border">
        <p className="mb-1 font-medium text-foreground">Instalar no tablet Android</p>
        Abra este endereço no Chrome do tablet, toque no menu (⋮) e escolha “Adicionar à tela inicial”. O
        totem abre em tela cheia, como um aplicativo.
      </div>
    </div>
  );
}
