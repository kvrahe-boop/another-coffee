import { useState } from "react";
import {
  brl,
  itemTotal,
  orderTypes,
  payments,
  type OrderItem,
  type OrderType,
  type Payment,
} from "@/lib/menu-types";

type Props = {
  items: OrderItem[];
  orderType: OrderType;
  onChangeOrderType: (t: OrderType) => void;
  onConfirm: (data: { name: string; payment: Payment }) => void;
};

export function CheckoutView({ items, orderType, onChangeOrderType, onConfirm }: Props) {
  const [name, setName] = useState("");
  const [payment, setPayment] = useState<Payment>("pix");
  const total = items.reduce((a, i) => a + itemTotal(i), 0);
  const canConfirm = name.trim().length >= 2;

  return (
    <form
      className="animate-sheet-up flex flex-1 flex-col gap-6 px-6 pb-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (canConfirm) onConfirm({ name: name.trim(), payment });
      }}
    >
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Quase lá
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Checkout</h1>
      </div>

      <label className="block">
        <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Seu nome
        </span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Como devemos te chamar?"
          autoComplete="off"
          maxLength={30}
          className="w-full rounded-2xl bg-card/70 px-4 py-4 font-display text-xl outline-none ring-1 ring-border placeholder:font-sans placeholder:text-base placeholder:text-muted-foreground focus:ring-foreground"
        />
      </label>

      <fieldset>
        <legend className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Onde vai consumir
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {orderTypes.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onChangeOrderType(t.id)}
              aria-pressed={orderType === t.id}
              className={`rounded-2xl px-4 py-3 text-left text-sm font-medium transition-colors ${
                orderType === t.id
                  ? "bg-primary text-primary-foreground"
                  : "ring-1 ring-border text-foreground/70"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Pagamento
        </legend>
        <div className="space-y-2">
          {payments.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPayment(p.id)}
              aria-pressed={payment === p.id}
              className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition-colors ${
                payment === p.id
                  ? "bg-primary text-primary-foreground"
                  : "ring-1 ring-border text-foreground/80"
              }`}
            >
              <span className="text-sm font-medium">{p.label}</span>
              <span className={`text-xs ${payment === p.id ? "opacity-70" : "text-muted-foreground"}`}>
                {p.hint}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-auto">
        <div className="flex items-baseline justify-between border-t border-border pt-4">
          <span className="font-display text-lg">
            {items.length} {items.length === 1 ? "item" : "itens"}
          </span>
          <span className="font-display text-2xl font-semibold tracking-tight">{brl(total)}</span>
        </div>
        <button
          type="submit"
          disabled={!canConfirm}
          className="mt-4 w-full rounded-full bg-primary py-4 text-sm font-medium tracking-wide text-primary-foreground transition-all active:scale-[0.99] disabled:opacity-40"
        >
          Confirmar e pagar ({brl(total)})
        </button>
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          Após o pagamento, o pedido vai direto para a cozinha
        </p>
      </div>
    </form>
  );
}
