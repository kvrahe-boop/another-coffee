import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMenu } from "@/lib/menu-store";
import { useOrders } from "@/lib/orders-store";
import { brl, orderStatuses, orderTypes, payments, type Order, type OrderStatus } from "@/lib/menu-types";
import { bluetoothSupported, connectPrinter, printOrder, printerConnected } from "@/lib/printer";

export const Route = createFileRoute("/expedicao")({
  head: () => ({
    meta: [
      { title: "Expedição de pedidos — Another Coffee" },
      { name: "description", content: "Acompanhe os pedidos da cafeteria: novos, preparando, prontos e entregues." },
      { property: "og:title", content: "Expedição de pedidos — Another Coffee" },
      { property: "og:description", content: "Painel da cozinha para mover pedidos até a entrega." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Expedicao,
});

const nextOf: Record<OrderStatus, OrderStatus | null> = {
  novo: "preparando",
  preparando: "pronto",
  pronto: "entregue",
  entregue: null,
  cancelado: null,
};

function Expedicao() {
  const { orders, setStatus, clearFinished } = useOrders();
  const { menu } = useMenu();
  const [msg, setMsg] = useState("");

  const connect = async () => {
    try {
      const name = await connectPrinter();
      setMsg(`Impressora ${name} conectada`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Não foi possível conectar");
    }
  };

  const print = async (o: Order) => {
    try {
      if (!printerConnected()) await connectPrinter();
      await printOrder(o, menu.settings.storeName);
      setMsg(`Comanda do pedido ${o.number} enviada`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Falha ao imprimir");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <Link to="/" className="rounded-full px-3 py-2 text-sm ring-1 ring-border">
          ← Totem
        </Link>
        <h1 className="font-display text-xl tracking-tight">Expedição</h1>
        <div className="ml-auto flex gap-2">
          {bluetoothSupported() && (
            <button
              type="button"
              onClick={connect}
              className="rounded-full px-3 py-2 text-xs font-medium ring-1 ring-border"
            >
              {printerConnected() ? "Impressora ok" : "Conectar impressora"}
            </button>
          )}
          <button
            type="button"
            onClick={clearFinished}
            className="rounded-full px-3 py-2 text-xs font-medium ring-1 ring-border"
          >
            Limpar entregues
          </button>
        </div>
      </header>

      {msg && <p className="px-4 pt-3 text-xs text-muted-foreground">{msg}</p>}

      <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
        {orderStatuses.map((col) => {
          const list = orders.filter((o) => o.status === col.id);
          return (
            <section key={col.id} className="rounded-3xl bg-card/60 p-3 ring-1 ring-border">
              <h2 className="mb-3 flex items-center justify-between px-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {col.label}
                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">
                  {list.length}
                </span>
              </h2>
              <ul className="space-y-3">
                {list.length === 0 && <li className="px-1 text-xs text-muted-foreground">Nada aqui.</li>}
                {list.map((o) => (
                  <li key={o.id} className="rounded-2xl bg-background p-3 ring-1 ring-border">
                    <div className="flex items-baseline justify-between">
                      <span className="font-display text-2xl tracking-tight">
                        #{String(o.number).padStart(3, "0")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(o.createdAt).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{o.customerName}</p>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      {orderTypes.find((t) => t.id === o.orderType)?.label} ·{" "}
                      {payments.find((p) => p.id === o.payment)?.label}
                    </p>
                    <ul className="mt-2 space-y-1 border-t border-border pt-2 text-xs">
                      {o.items.map((it) => (
                        <li key={it.key}>
                          <span className="font-medium">
                            {it.qty}× {it.name}
                          </span>
                          {it.details && <span className="text-muted-foreground"> — {it.details}</span>}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-sm font-medium">{brl(o.total)}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {nextOf[o.status] && (
                        <button
                          type="button"
                          onClick={() => setStatus(o.id, nextOf[o.status]!)}
                          className="rounded-full bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
                        >
                          {orderStatuses.find((s) => s.id === nextOf[o.status])?.label ?? "Avançar"} →
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void print(o)}
                        className="rounded-full px-3 py-2 text-xs ring-1 ring-border"
                      >
                        Imprimir
                      </button>
                      {o.status !== "entregue" && (
                        <button
                          type="button"
                          onClick={() => setStatus(o.id, "cancelado")}
                          className="rounded-full px-3 py-2 text-xs text-muted-foreground ring-1 ring-border"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
