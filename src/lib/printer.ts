/**
 * Impressora térmica via Bluetooth (Web Bluetooth + comandos ESC/POS).
 * Funciona no Chrome/Edge Android com impressoras BLE (58/80 mm) que expõem
 * uma característica de escrita — a maioria das genéricas (MTP, PT-210, etc).
 */
import { brl, itemTotal, orderTypes, payments, type Order } from "./menu-types";

const KNOWN_SERVICES = [
  "000018f0-0000-1000-8000-00805f9b34fb",
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
  "49535343-fe7d-4ae5-8fa9-9fafd205e455",
  "0000ff00-0000-1000-8000-00805f9b34fb",
  "0000ffe0-0000-1000-8000-00805f9b34fb",
];

type BTCharacteristic = {
  properties: { write: boolean; writeWithoutResponse: boolean };
  writeValue: (v: BufferSource) => Promise<void>;
  writeValueWithoutResponse?: (v: BufferSource) => Promise<void>;
};
type BTDevice = {
  name?: string;
  gatt?: {
    connected: boolean;
    connect: () => Promise<{
      getPrimaryServices: () => Promise<{ getCharacteristics: () => Promise<BTCharacteristic[]> }[]>;
    }>;
    disconnect: () => void;
  };
  addEventListener: (ev: string, cb: () => void) => void;
};

let device: BTDevice | null = null;
let characteristic: BTCharacteristic | null = null;

export const bluetoothSupported = () =>
  typeof navigator !== "undefined" && "bluetooth" in navigator;

export const printerName = () => device?.name ?? null;
export const printerConnected = () => !!device?.gatt?.connected && !!characteristic;

export async function connectPrinter() {
  if (!bluetoothSupported()) throw new Error("Este navegador não tem Bluetooth Web. Use o Chrome no Android.");
  const nav = navigator as unknown as {
    bluetooth: { requestDevice: (o: unknown) => Promise<BTDevice> };
  };
  const dev = await nav.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: KNOWN_SERVICES,
  });
  const server = await dev.gatt!.connect();
  const services = await server.getPrimaryServices();
  let found: BTCharacteristic | null = null;
  for (const s of services) {
    for (const ch of await s.getCharacteristics()) {
      if (ch.properties.write || ch.properties.writeWithoutResponse) {
        found = ch;
        break;
      }
    }
    if (found) break;
  }
  if (!found) {
    dev.gatt!.disconnect();
    throw new Error("A impressora não aceita envio de dados por Bluetooth LE.");
  }
  dev.addEventListener("gattserverdisconnected", () => {
    characteristic = null;
  });
  device = dev;
  characteristic = found;
  return dev.name ?? "Impressora";
}

export function disconnectPrinter() {
  device?.gatt?.disconnect();
  device = null;
  characteristic = null;
}

async function write(bytes: Uint8Array) {
  if (!characteristic) throw new Error("Impressora não conectada");
  const CHUNK = 100;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const slice = bytes.slice(i, i + CHUNK);
    if (characteristic.properties.writeWithoutResponse && characteristic.writeValueWithoutResponse) {
      await characteristic.writeValueWithoutResponse(slice);
    } else {
      await characteristic.writeValue(slice);
    }
    await new Promise((r) => setTimeout(r, 25));
  }
}

/** Remove acentos: a maioria das térmicas baratas não tem tabela pt-BR. */
const ascii = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const ESC = 0x1b, GS = 0x1d;
const enc = new TextEncoder();

class Ticket {
  parts: number[] = [];
  raw(...b: number[]) { this.parts.push(...b); return this; }
  text(s: string) { this.parts.push(...enc.encode(ascii(s))); return this; }
  line(s = "") { return this.text(s + "\n"); }
  align(a: 0 | 1 | 2) { return this.raw(ESC, 0x61, a); }
  bold(on: boolean) { return this.raw(ESC, 0x45, on ? 1 : 0); }
  size(w: 0 | 1 | 2, h: 0 | 1 | 2) { return this.raw(GS, 0x21, (w << 4) | h); }
  feed(n = 3) { return this.raw(ESC, 0x64, n); }
  cut() { return this.raw(GS, 0x56, 0x42, 0x00); }
  bytes() { return new Uint8Array(this.parts); }
}

const COLS = 32; // 58 mm
const row = (l: string, r: string) => {
  const room = COLS - r.length - 1;
  const left = l.length > room ? l.slice(0, room) : l.padEnd(room);
  return `${left} ${r}`;
};

export function buildTicket(order: Order, storeName: string, copy: "cozinha" | "cliente" = "cozinha") {
  const t = new Ticket().raw(ESC, 0x40); // init
  t.align(1).bold(true).size(1, 1).line(storeName).size(0, 0).bold(false);
  t.line(copy === "cozinha" ? "--- COZINHA ---" : "--- CLIENTE ---");
  t.size(2, 2).bold(true).line(`#${String(order.number).padStart(3, "0")}`).size(0, 0).bold(false);
  t.size(1, 1).line(order.customerName).size(0, 0);
  t.line(orderTypes.find((o) => o.id === order.orderType)?.label ?? "");
  t.line(new Date(order.createdAt).toLocaleString("pt-BR"));
  t.align(0).line("-".repeat(COLS));
  for (const it of order.items) {
    t.bold(true).line(row(`${it.qty}x ${it.name}`, brl(itemTotal(it)))).bold(false);
    if (it.details) t.line(`   ${it.details}`);
  }
  t.line("-".repeat(COLS));
  t.bold(true).size(1, 1).line(row("TOTAL", brl(order.total))).size(0, 0).bold(false);
  t.line(`Pagamento: ${payments.find((p) => p.id === order.payment)?.label ?? ""}`);
  if (order.payment === "caixa") t.align(1).line("* PAGAR NO CAIXA *");
  t.align(1).line().line("Obrigado!").feed(4).cut();
  return t.bytes();
}

export async function printOrder(order: Order, storeName: string, copy: "cozinha" | "cliente" = "cozinha") {
  await write(buildTicket(order, storeName, copy));
}
