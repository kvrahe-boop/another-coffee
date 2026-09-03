import { brl, type OrderItem } from "@/lib/coffee-data";

type Props = {
  items: OrderItem[];
  onRemove: (key: string) => void;
  onCheckout: () => void;
  onContinue: () => void;
};

export function OrderView({ items, onRemove, onCheckout, onContinue }: Props) {
  const total = items.reduce((a, i) => a + i.price, 0);

  return (
    <div className="animate-sheet-up flex flex-1 flex-col px-6 pb-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Meu Pedido</h1>

      {items.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-muted-foreground">Nenhum item ainda.</p>
          <button
            type="button"
            onClick={onContinue}
            className="rounded-full px-6 py-3 text-sm font-medium ring-1 ring-foreground"
          >
            Ver cardápio
          </button>
        </div>
      ) : (
        <>
          <ul className="mt-5 divide-y divide-border">
            {items.map((it) => (
              <li key={it.key} className="flex items-center gap-4 py-3">
                <img
                  src={it.image}
                  alt=""
                  width={512}
                  height={512}
                  loading="lazy"
                  className="size-12 shrink-0 object-contain"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{it.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{it.details}</p>
                </div>
                <p className="text-sm">{brl(it.price)}</p>
                <button
                  type="button"
                  onClick={() => onRemove(it.key)}
                  aria-label={`Remover ${it.name}`}
                  className="grid size-7 place-items-center rounded-full text-muted-foreground ring-1 ring-border hover:text-foreground"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>

          <div className="relative mx-auto my-6 flex h-48 w-full max-w-[280px] items-end justify-center">
            {items.slice(0, 3).map((it, i) => (
              <img
                key={it.key}
                src={it.image}
                alt=""
                width={512}
                height={512}
                loading="lazy"
                className="absolute bottom-0 h-full w-auto object-contain drop-shadow-[0_30px_40px_rgba(60,40,15,0.25)]"
                style={{
                  transform: `translateX(${(i - 1) * 30}%) scale(${1 - i * 0.12})`,
                  zIndex: 10 - i,
                  opacity: 1 - i * 0.15,
                }}
              />
            ))}
          </div>

          <div className="mt-auto">
            <div className="flex items-baseline justify-between border-t border-border pt-4">
              <span className="font-display text-lg">Total</span>
              <span className="font-display text-2xl font-semibold tracking-tight">{brl(total)}</span>
            </div>
            <button
              type="button"
              onClick={onCheckout}
              className="mt-4 w-full rounded-full bg-primary py-4 text-sm font-medium tracking-wide text-primary-foreground transition-transform active:scale-[0.99]"
            >
              Finalizar pedido ({brl(total)})
            </button>
            <button
              type="button"
              onClick={onContinue}
              className="mt-3 w-full py-2 text-center text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
            >
              + Adicionar mais itens
            </button>
          </div>
        </>
      )}
    </div>
  );
}
