import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CupCarousel } from "@/components/coffee/CupCarousel";
import { DrinkSheet } from "@/components/coffee/DrinkSheet";
import { OrderView } from "@/components/coffee/OrderView";
import { drinks, type Drink, type OrderItem } from "@/lib/coffee-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Café Alvorada — Autoatendimento" },
      {
        name: "description",
        content:
          "Escolha seu café, personalize tamanho, leite e açúcar e envie o pedido direto para a cozinha.",
      },
      { property: "og:title", content: "Café Alvorada — Autoatendimento" },
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

type View = "menu" | "order";

function Kiosk() {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<Drink | null>(null);
  const [view, setView] = useState<View>("menu");
  const [items, setItems] = useState<OrderItem[]>([]);

  const back = () => {
    if (view === "order") setView("menu");
    else if (selected) setSelected(null);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(120%_80%_at_50%_-10%,oklch(0.975_0.01_85)_0%,var(--background)_45%,oklch(0.93_0.016_82)_100%)]">
      <main className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between px-5 pt-5">
          <button
            type="button"
            onClick={back}
            aria-label="Voltar"
            className={`grid size-10 place-items-center rounded-full ring-1 ring-border transition-opacity active:scale-95 ${
              selected || view === "order" ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
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
            onClick={() => setView("order")}
            aria-label={`Meu pedido, ${items.length} itens`}
            className="relative grid size-10 place-items-center rounded-full ring-1 ring-border active:scale-95"
          >
            <svg className="size-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M6 7h8l-.8 9a1.2 1.2 0 0 1-1.2 1.1H8a1.2 1.2 0 0 1-1.2-1.1L6 7Z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
              <path
                d="M7.5 7a2.5 2.5 0 0 1 5 0"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            {items.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-primary text-[9px] font-medium text-primary-foreground">
                {items.length}
              </span>
            )}
          </button>
        </header>

        {view === "order" ? (
          <div className="flex flex-1 flex-col pt-6">
            <OrderView
              items={items}
              onRemove={(key) => setItems((p) => p.filter((i) => i.key !== key))}
              onBack={() => setView("menu")}
              onClear={() => setItems([])}
            />
          </div>
        ) : (
          <>
            <div className={`shrink-0 ${selected ? "pt-2" : "pt-6"}`}>
              <CupCarousel
                drinks={drinks}
                index={index}
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
                    setView("order");
                  }}
                />
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-end gap-4 pb-8">
                <div className="flex gap-1.5" aria-hidden="true">
                  {drinks.map((d, k) => (
                    <span
                      key={d.id}
                      className={`h-1.5 rounded-full bg-foreground transition-all duration-500 ${
                        k === index ? "w-6 opacity-100" : "w-1.5 opacity-25"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Deslize · toque no copo
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
