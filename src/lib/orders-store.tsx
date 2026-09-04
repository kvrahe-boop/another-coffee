import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { get, set } from "idb-keyval";
import { itemTotal, uid, type Order, type OrderStatus } from "./menu-types";

const KEY = "another-coffee-orders-v1";
const CHANNEL = "another-coffee-orders";

type Ctx = {
  ready: boolean;
  orders: Order[];
  createOrder: (o: Omit<Order, "id" | "number" | "status" | "createdAt" | "updatedAt" | "total">) => Order;
  setStatus: (id: string, status: OrderStatus) => void;
  clearFinished: () => void;
};

const OrdersContext = createContext<Ctx | null>(null);

/** Número do pedido reinicia a cada dia (001, 002…). */
function nextNumber(orders: Order[]) {
  const today = new Date().toDateString();
  const todays = orders.filter((o) => new Date(o.createdAt).toDateString() === today);
  return todays.reduce((m, o) => Math.max(m, o.number), 0) + 1;
}

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [ready, setReady] = useState(false);
  const channel = useRef<BroadcastChannel | null>(null);
  const ordersRef = useRef<Order[]>([]);
  ordersRef.current = orders;

  useEffect(() => {
    let alive = true;
    get<Order[]>(KEY).then((saved) => {
      if (!alive) return;
      setOrders(saved ?? []);
      setReady(true);
    });
    if ("BroadcastChannel" in window) {
      channel.current = new BroadcastChannel(CHANNEL);
      channel.current.onmessage = () => get<Order[]>(KEY).then((s) => setOrders(s ?? []));
    }
    return () => {
      alive = false;
      channel.current?.close();
    };
  }, []);

  const persist = useCallback((next: Order[]) => {
    ordersRef.current = next;
    setOrders(next);
    void set(KEY, next).then(() => channel.current?.postMessage("changed"));
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      ready,
      orders,
      createOrder: (o) => {
        const now = Date.now();
        const order: Order = {
          ...o,
          id: uid(),
          number: nextNumber(ordersRef.current),
          status: "novo",
          total: o.items.reduce((a, i) => a + itemTotal(i), 0),
          createdAt: now,
          updatedAt: now,
        };
        // Mantém no máximo 500 pedidos no dispositivo.
        persist([order, ...ordersRef.current].slice(0, 500));
        return order;
      },
      setStatus: (id, status) =>
        persist(
          ordersRef.current.map((o) => (o.id === id ? { ...o, status, updatedAt: Date.now() } : o)),
        ),
      clearFinished: () =>
        persist(ordersRef.current.filter((o) => o.status !== "entregue" && o.status !== "cancelado")),
    }),
    [orders, ready, persist],
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders precisa estar dentro de OrdersProvider");
  return ctx;
}
