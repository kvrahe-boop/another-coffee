import { useState } from "react";
import {
  brl,
  categories,
  milks,
  sizes,
  sugars,
  sweets,
  type Milk,
  type OrderItem,
  type Product,
  type SizeId,
  type Sugar,
} from "@/lib/coffee-data";

type Props = {
  drink: Product;
  onAdd: (items: OrderItem[]) => void;
};

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors active:scale-95 ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-foreground/60 ring-1 ring-border hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export function DrinkSheet({ drink, onAdd }: Props) {
  const kind = categories.find((c) => c.id === drink.category)?.kind ?? "food";
  const isDrink = kind === "drink";

  const [size, setSize] = useState<SizeId>("M");
  const [milk, setMilk] = useState<Milk>("Integral");
  const [sugar, setSugar] = useState<Sugar>("Normal");
  const [qty, setQty] = useState(1);
  const [pickedSweets, setPickedSweets] = useState<string[]>([]);

  const sizeExtra = isDrink ? sizes.find((s) => s.id === size)!.extra : 0;
  const unitPrice = drink.price + sizeExtra;
  const sweetsTotal = sweets
    .filter((s) => pickedSweets.includes(s.id))
    .reduce((a, s) => a + s.price, 0);
  const total = unitPrice * qty + sweetsTotal;

  const toggleSweet = (id: string) =>
    setPickedSweets((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const add = () => {
    const stamp = Date.now();
    const items: OrderItem[] = [
      ...Array.from({ length: qty }, (_, i) => ({
        key: `${drink.id}-${stamp}-${i}`,
        name: drink.name,
        image: drink.image,
        price: unitPrice,
        details: isDrink ? `${size} · ${milk} · açúcar ${sugar.toLowerCase()}` : "Unidade",
      })),
      ...sweets
        .filter((s) => pickedSweets.includes(s.id))
        .map((s) => ({
          key: `${s.id}-${stamp}`,
          name: s.name,
          image: s.image,
          price: s.price,
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
        <p className="mt-2 text-sm font-medium tracking-[0.18em]">{brl(unitPrice)}</p>
      </div>

      {isDrink ? (
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Tamanho
            </p>
            <div className="flex gap-2">
              {sizes.map((s) => (
                <Chip key={s.id} active={size === s.id} onClick={() => setSize(s.id)}>
                  {s.label}
                  {s.extra > 0 && <span className="ml-1 opacity-60">+{s.extra}</span>}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Leite
            </p>
            <div className="flex flex-wrap gap-2">
              {milks.map((m) => (
                <Chip key={m} active={milk === m} onClick={() => setMilk(m)}>
                  {m}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Açúcar
            </p>
            <div className="flex gap-2">
              {sugars.map((s) => (
                <Chip key={s} active={sugar === s} onClick={() => setSugar(s)}>
                  {s}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Quantidade
          </p>
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
      )}

      {isDrink && (
        <div className="rounded-2xl bg-card/70 p-4 ring-1 ring-border">
          <p className="font-display text-base italic">Quer adicionar um docinho?</p>
          <div className="mt-3 space-y-3">
            {sweets.map((s) => {
              const active = pickedSweets.includes(s.id);
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
                    onClick={() => toggleSweet(s.id)}
                    aria-pressed={active}
                    aria-label={active ? `Remover ${s.name}` : `Adicionar ${s.name}`}
                    className={`grid size-9 shrink-0 place-items-center rounded-full text-lg leading-none transition-colors active:scale-95 ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "ring-1 ring-foreground text-foreground"
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
        className="w-full rounded-full bg-primary py-4 text-sm font-medium tracking-wide text-primary-foreground transition-transform active:scale-[0.99]"
      >
        Adicionar ao pedido ({brl(total)})
      </button>
    </div>
  );
}
