import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CupCarousel } from "@/components/coffee/CupCarousel";
import { DrinkSheet } from "@/components/coffee/DrinkSheet";
import { OrderView } from "@/components/coffee/OrderView";
import { CheckoutView } from "@/components/coffee/CheckoutView";
import {
  categories,
  orderTypes,
  payments,
  productsByCategory,
  type CategoryId,
  type OrderItem,
  type OrderType,
  type Payment,
  type Product,
} from "@/lib/coffee-data";
import heroCup from "@/assets/caramel-macchiato.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Another Coffee — Autoatendimento" },
      {
        name: "description",
        content:
          "Totem de autoatendimento: escolha bebidas quentes, geladas, doces, salgados e água, personalize e pague sem fila.",
      },
      { property: "og:title", content: "Another Coffee — Autoatendimento" },
      {
        property: "og:description",
        content: "Cardápio digital de cafeteria: deslize entre os copos, personalize e finalize.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Kiosk,
});

type Step = "start" | "type" | "menu" | "order" | "checkout" | "done";

function Kiosk() {
  const [step, setStep] = useState<Step>("start");
  const [orderType, setOrderType] = useState<OrderType>("local");
  const [category, setCategory] = useState<CategoryId>("quentes");
  const [indexByCat, setIndexByCat] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<Product | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [receipt, setReceipt] = useState<{ number: number; name: string; payment: Payment } | null>(
    null,
  );

  const list = productsByCategory(category);
  const index = Math.min(indexByCat[category] ?? 0, list.length - 1);
  const setIndex = (i: number) => setIndexByCat((p) => ({ ...p, [category]: i }));

  const reset = () => {
    setItems([]);
    setSelected(null);
    setReceipt(null);
    setCategory("quentes");
    setIndexByCat({});
    setStep("start");
  };

  const back = () => {
    if (step === "checkout") setStep("order");
    else if (step === "order") setStep("menu");
    else if (step === "menu" && selected) setSelected(null);
    else if (step === "menu") setStep("type");
    else if (step === "type") setStep("start");
  };

  // ── Tela inicial ──────────────────────────────────────────────
  if (step === "start") {
    return (
      <Shell>
        <button
          type="button"
          onClick={() => setStep("type")}
          className="flex min-h-screen w-full flex-col items-center justify-between px-6 pb-10 pt-12 text-center"
        >
          <span className="font-display text-[15px] uppercase tracking-[0.28em] text-foreground/80">
            ANOTHER COFFEE
          </span>
          <img
            src={heroCup}
            alt="Caramelo Macchiato"
            width={1024}
            height={1536}
            className="animate-float-cup h-[52vh] w-auto object-contain drop-shadow-[0_40px_50px_rgba(60,40,15,0.28)]"
          />
          <div className="flex flex-col items-center gap-3">
            <h1 className="font-display text-[2.6rem] leading-[0.95] tracking-tight text-balance">
              Faça seu pedido aqui
            </h1>
            <p className="text-sm text-muted-foreground">Sem fila, direto para a cozinha</p>
            <span className="mt-4 animate-pulse rounded-full bg-primary px-8 py-4 text-sm font-medium tracking-wide text-primary-foreground">
              Toque para começar
            </span>
          </div>
        </button>
      </Shell>
    );
  }

  // ── Confirmação ───────────────────────────────────────────────
  if (step === "done" && receipt) {
    const pay = payments.find((p) => p.id === receipt.payment)!;
    return (
      <Shell>
        <div className="animate-sheet-up flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Pedido nº {String(receipt.number).padStart(3, "0")}
          </p>
          <h1 className="font-display text-[2.6rem] leading-[0.95] tracking-tight text-balance">
            Obrigado, {receipt.name}!
          </h1>
          <p className="max-w-[30ch] text-sm text-muted-foreground">
            {receipt.payment === "caixa"
              ? "Apresente o número no caixa para pagar. Depois é só aguardar seu nome ser chamado."
              : `Pagamento via ${pay.label} confirmado. Seu pedido já foi para a cozinha — aguarde seu nome ser chamado.`}
          </p>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {orderTypes.find((t) => t.id === orderType)?.label}
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 rounded-full bg-primary px-8 py-4 text-sm font-medium text-primary-foreground"
          >
            Novo pedido
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <header className="flex shrink-0 items-center justify-between px-5 pt-5">
        <button
          type="button"
          onClick={back}
          aria-label="Voltar"
          className="grid size-10 place-items-center rounded-full ring-1 ring-border transition-opacity active:scale-95"
        >
          <svg className="size-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M13 4l-6 6 6 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <span className="font-display text-[15px] uppercase tracking-[0.28em] text-foreground/80">
          ANOTHER COFFEE
        </span>
        <button
          type="button"
          onClick={() => setStep("order")}
          aria-label={`Meu pedido, ${items.length} itens`}
          className={`relative grid size-10 place-items-center rounded-full ring-1 ring-border active:scale-95 ${
            step === "type" ? "pointer-events-none opacity-0" : ""
          }`}
        >
          <svg className="size-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M6 7h8l-.8 9a1.2 1.2 0 0 1-1.2 1.1H8a1.2 1.2 0 0 1-1.2-1.1L6 7Z"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path d="M7.5 7a2.5 2.5 0 0 1 5 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          {items.length > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-primary text-[9px] font-medium text-primary-foreground">
              {items.length}
            </span>
          )}
        </button>
      </header>

      {/* ── Local ou levar ── */}
      {step === "type" && (
        <div className="animate-sheet-up flex flex-1 flex-col justify-center gap-6 px-6 pb-16">
          <h1 className="font-display text-[2.6rem] leading-[0.95] tracking-tight text-balance">
            Como vai ser hoje?
          </h1>
          <div className="grid gap-3">
            {orderTypes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setOrderType(t.id);
                  setStep("menu");
                }}
                className="flex items-center justify-between rounded-3xl bg-card/70 px-6 py-6 text-left ring-1 ring-border transition-all hover:ring-foreground active:scale-[0.99]"
              >
                <span>
                  <span className="block font-display text-2xl">{t.label}</span>
                  <span className="block text-sm text-muted-foreground">{t.hint}</span>
                </span>
                <span className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground">
                  →
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Meu pedido ── */}
      {step === "order" && (
        <div className="flex flex-1 flex-col pt-6">
          <OrderView
            items={items}
            onRemove={(key) => setItems((p) => p.filter((i) => i.key !== key))}
            onCheckout={() => setStep("checkout")}
            onContinue={() => setStep("menu")}
          />
        </div>
      )}

      {/* ── Checkout ── */}
      {step === "checkout" && (
        <div className="flex flex-1 flex-col pt-6">
          <CheckoutView
            items={items}
            orderType={orderType}
            onChangeOrderType={setOrderType}
            onConfirm={({ name, payment }) => {
              setReceipt({ number: Math.floor(Math.random() * 900) + 100, name, payment });
              setStep("done");
            }}
          />
        </div>
      )}

      {/* ── Cardápio ── */}
      {step === "menu" && (
        <>
          <div className={`shrink-0 ${selected ? "pt-2" : "pt-4"}`}>
            <CupCarousel
              key={category}
              drinks={list}
              index={index}
              label={categories.find((c) => c.id === category)?.label}
              onIndexChange={(i) => {
                setIndex(i);
                setSelected(null);
              }}
              onSelect={setSelected}
              compact={!!selected}
            />
          </div>

          {selected ? (
            <div className="flex-1 overflow-y-auto">
              <DrinkSheet
                key={selected.id}
                drink={selected}
                onAdd={(newItems) => {
                  setItems((p) => [...p, ...newItems]);
                  setSelected(null);
                  setStep("order");
                }}
              />
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-end gap-3 pb-3">
              <div className="text-center">
                <p className="font-display text-2xl leading-none tracking-tight">{list[index]?.name}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Deslize · toque para escolher
                </p>
              </div>
              <div className="flex gap-1.5" aria-hidden="true">
                {list.map((d, k) => (
                  <span
                    key={d.id}
                    className={`h-1.5 rounded-full bg-foreground transition-all duration-500 ${
                      k === index ? "w-6 opacity-100" : "w-1.5 opacity-25"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Categorias (menu inferior) */}
          <nav
            aria-label="Categorias"
            className="sticky bottom-0 shrink-0 border-t border-border bg-background/85 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur"
          >
            <ul className="flex justify-between gap-1">
              {categories.map((c) => {
                const active = c.id === category;
                return (
                  <li key={c.id} className="flex-1">
                    <button
                      type="button"
                      aria-current={active ? "true" : undefined}
                      onClick={() => {
                        setCategory(c.id);
                        setSelected(null);
                      }}
                      className={`w-full rounded-full px-1 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {c.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(120%_80%_at_50%_-10%,oklch(0.975_0.01_85)_0%,var(--background)_45%,oklch(0.93_0.016_82)_100%)]">
      <main className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
