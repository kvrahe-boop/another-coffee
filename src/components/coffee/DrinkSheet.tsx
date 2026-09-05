import { useMemo, useState } from "react";
import { useMenu } from "@/lib/menu-store";
import { brl, uid, type ChosenOption, type ModifierGroup, type OrderItem, type Product } from "@/lib/menu-types";

type Props = {
  drink: Product;
  onAdd: (items: OrderItem[]) => void;
};

function Chip({
  active,
  children,
  onClick,
  disabled,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors active:scale-95 disabled:opacity-40 ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-foreground/60 ring-1 ring-border hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </p>
  );
}

export function DrinkSheet({ drink, onAdd }: Props) {
  const { menu, product } = useMenu();

  // Só os grupos ligados a este produto aparecem (sem leite → não mostra leite).
  const groups = useMemo(
    () =>
      drink.modifierGroupIds
        .map((id) => menu.modifierGroups.find((g) => g.id === id))
        .filter((g): g is ModifierGroup => !!g && g.options.length > 0),
    [drink, menu.modifierGroups],
  );
  const upsells = drink.upsellProductIds
    .map(product)
    .filter((p): p is Product => !!p && !p.hidden && p.available);

  const hasSizes = drink.sizes.length > 0;
  const [sizeId, setSizeId] = useState(drink.sizes[Math.min(1, drink.sizes.length - 1)]?.id ?? "");
  const [choice, setChoice] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(
      groups.map((g) => [g.id, g.required && g.type === "single" && g.options[0] ? [g.options[0].id] : []]),
    ),
  );
  const [qty, setQty] = useState(1);
  const [pickedUpsell, setPickedUpsell] = useState<string[]>([]);

  const size = drink.sizes.find((s) => s.id === sizeId);
  const unitPrice = hasSizes ? (size?.price ?? drink.price) : drink.price;

  const chosen: ChosenOption[] = groups.flatMap((g) =>
    (choice[g.id] ?? [])
      .map((oid) => g.options.find((o) => o.id === oid))
      .filter((o): o is NonNullable<typeof o> => !!o)
      .map((o) => ({ group: g.name, label: o.label, price: o.price })),
  );
  const optionsTotal = chosen.reduce((a, o) => a + o.price, 0);
  const upsellTotal = upsells.filter((u) => pickedUpsell.includes(u.id)).reduce((a, u) => a + u.price, 0);
  const total = (unitPrice + optionsTotal) * qty + upsellTotal;

  const missingRequired = groups.some((g) => g.required && (choice[g.id]?.length ?? 0) === 0);

  const toggle = (g: ModifierGroup, oid: string) =>
    setChoice((prev) => {
      const cur = prev[g.id] ?? [];
      if (g.type === "single") return { ...prev, [g.id]: cur[0] === oid && !g.required ? [] : [oid] };
      if (cur.includes(oid)) return { ...prev, [g.id]: cur.filter((x) => x !== oid) };
      if (g.max > 0 && cur.length >= g.max) return prev;
      return { ...prev, [g.id]: [...cur, oid] };
    });

  const add = () => {
    const details = [
      size?.label,
      ...chosen.map((o) => (o.group === "Açúcar" ? `açúcar ${o.label.toLowerCase()}` : o.label)),
    ]
      .filter(Boolean)
      .join(" · ");
    const items: OrderItem[] = [
      {
        key: uid(),
        productId: drink.id,
        name: drink.name,
        image: drink.image,
        unitPrice,
        qty,
        size: size?.label ?? null,
        options: chosen,
        details: details || "Unidade",
      },
      ...upsells
        .filter((u) => pickedUpsell.includes(u.id))
        .map((u) => ({
          key: uid(),
          productId: u.id,
          name: u.name,
          image: u.image,
          unitPrice: u.price,
          qty: 1,
          size: null,
          options: [],
          details: "Unidade",
        })),
    ];
    onAdd(items);
  };

  return (
    <div className="animate-sheet-up flex flex-col gap-6 px-6 pb-8 pt-2">
      <div className="text-center">
        <h1 className="font-display text-[2.4rem] leading-[0.95] tracking-tight text-balance">
          {drink.name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{drink.description}</p>
        <p className="mt-2 text-sm font-medium tracking-[0.18em]">{brl(unitPrice + optionsTotal)}</p>
      </div>

      {!drink.available && (
        <p className="rounded-2xl bg-card px-4 py-3 text-center text-sm ring-1 ring-border">
          Esgotado no momento
        </p>
      )}

      <div className="space-y-4">
        {hasSizes && (
          <div>
            <Label>Tamanho</Label>
            <div className="flex flex-wrap gap-2">
              {drink.sizes.map((s) => (
                <Chip key={s.id} active={sizeId === s.id} onClick={() => setSizeId(s.id)}>
                  {s.label}
                  <span className="ml-1.5 opacity-60">{brl(s.price)}</span>
                </Chip>
              ))}
            </div>
          </div>
        )}

        {groups.map((g) => (
          <div key={g.id}>
            <Label>
              {g.name}
              {!g.required && <span className="ml-1 normal-case tracking-normal opacity-70">(opcional)</span>}
              {g.type === "multiple" && g.max > 0 && (
                <span className="ml-1 normal-case tracking-normal opacity-70">até {g.max}</span>
              )}
            </Label>
            <div className="flex flex-wrap gap-2">
              {g.options.map((o) => (
                <Chip key={o.id} active={(choice[g.id] ?? []).includes(o.id)} onClick={() => toggle(g, o.id)}>
                  {o.label}
                  {o.price > 0 && <span className="ml-1 opacity-60">+{o.price}</span>}
                </Chip>
              ))}
            </div>
          </div>
        ))}

        <div>
          <Label>Quantidade</Label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              aria-label="Diminuir quantidade"
              className="grid size-10 place-items-center rounded-full text-lg ring-1 ring-foreground active:scale-95"
            >
              −
            </button>
            <span className="w-6 text-center font-display text-2xl" aria-live="polite">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(9, q + 1))}
              aria-label="Aumentar quantidade"
              className="grid size-10 place-items-center rounded-full bg-primary text-lg text-primary-foreground active:scale-95"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {upsells.length > 0 && (
        <div className="rounded-2xl bg-card/70 p-4 ring-1 ring-border">
          <p className="font-display text-base italic">Quer adicionar algo mais?</p>
          <div className="mt-3 space-y-3">
            {upsells.map((s) => {
              const active = pickedUpsell.includes(s.id);
              return (
                <div key={s.id} className="flex items-center gap-3">
                  <img
                    src={s.image}
                    alt={s.name}
                    width={768}
                    height={768}
                    loading="lazy"
                    className="size-14 shrink-0 object-contain drop-shadow-md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{brl(s.price)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setPickedUpsell((p) => (p.includes(s.id) ? p.filter((x) => x !== s.id) : [...p, s.id]))
                    }
                    aria-pressed={active}
                    aria-label={active ? `Remover ${s.name}` : `Adicionar ${s.name}`}
                    className={`grid size-9 shrink-0 place-items-center rounded-full text-lg leading-none transition-colors active:scale-95 ${
                      active ? "bg-primary text-primary-foreground" : "ring-1 ring-foreground text-foreground"
                    }`}
                  >
                    {active ? "✓" : "+"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={add}
        disabled={missingRequired || !drink.available}
        className="w-full rounded-full bg-primary py-4 text-sm font-medium tracking-wide text-primary-foreground transition-transform active:scale-[0.99] disabled:opacity-40"
      >
        Adicionar ao pedido ({brl(total)})
      </button>
    </div>
  );
}
