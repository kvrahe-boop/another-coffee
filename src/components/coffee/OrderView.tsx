import { useState } from "react";
import { brl, type OrderItem } from "@/lib/coffee-data";

type Props = {
  items: OrderItem[];
  onRemove: (key: string) => void;
  onBack: () => void;
  onClear: () => void;
};

export function OrderView({ items, onRemove, onBack, onClear }: Props) {
  const [sent, setSent] = useState<number | null>(null);
  const total = items.reduce((a, i) => a + i.price, 0);

  if (sent !== null) {
    return (
      <div className="animate-sheet-up flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Pedido nº {String(sent).padStart(3, "0")}
        </p>
        <h1 className="font-display text-[2.4rem] leading-[0.95] tracking-tight text-balance">
          Enviado para a cozinha
        </h1>
        <p className="max-w-[28ch] text-sm text-muted-foreground">
          Seu pedido já está sendo preparado. Retire no balcão quando o número for chamado.
        </p>
        <button
          type="button"
          onClick={() => {
            onClear();
            onBack();
          }}
          className="mt-4 rounded-full bg-primary px-8 py-4 text-sm font-medium text-primary-foreground"
        >
          Novo pedido
        </button>
      </div>
    );
  }

  return (
    <div className="animate-sheet-up flex flex-1 flex-col px-6 pb-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Meu Pedido</h1>

      {items.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Nenhum item ainda. Toque em um copo para começar.
        </p>
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

          <div className="relative mx-auto my-6 flex h-56 w-full max-w-[280px] items-end justify-center">
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
              onClick={() => setSent(Math.floor(Math.random() * 900) + 100)}
              className="mt-4 w-full rounded-full bg-primary py-4 text-sm font-medium tracking-wide text-primary-foreground transition-transform active:scale-[0.99]"
            >
              Finalizar pedido ({brl(total)})
            </button>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              Vai direto para a cozinha
            </p>
          </div>
        </>
      )}
    </div>
  );
}
