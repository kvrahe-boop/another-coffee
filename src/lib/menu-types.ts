/** Tipos do cardápio editável, pedidos e configurações do totem. */

export type CategoryKind = "drink" | "food" | "water";

export type Category = {
  id: string;
  label: string;
  kind: CategoryKind;
  sortOrder: number;
  hidden: boolean;
};

export type ModifierOption = {
  id: string;
  label: string;
  price: number;
};

export type ModifierGroup = {
  id: string;
  name: string;
  /** single = escolhe 1 (ex.: leite); multiple = vários (ex.: extras). */
  type: "single" | "multiple";
  required: boolean;
  /** máximo de escolhas quando type = multiple (0 = ilimitado). */
  max: number;
  options: ModifierOption[];
};

/** Formato do copo usado pela geração de imagem por IA. */
export type CupStyle = "kraft" | "flat" | "dome" | "none";

export type SizeOption = {
  id: string;
  label: string;
  price: number;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  /** URL da imagem (asset do app ou data URL salvo no dispositivo). Sempre PNG sem fundo. */
  image: string;
  /** Preço quando não há tamanhos. */
  price: number;
  /** Tamanhos com preço próprio. Lista vazia = sem escolha de tamanho. */
  sizes: SizeOption[];
  modifierGroupIds: string[];
  /** Produtos sugeridos ("Quer adicionar um docinho?"). */
  upsellProductIds: string[];
  /** Combo: produtos do cardápio incluídos neste item. Vazio = produto normal. */
  comboProductIds: string[];
  available: boolean;
  hidden: boolean;
  sortOrder: number;
  cupStyle: CupStyle;
  /** Descrição do enfeite/cobertura para a IA (ex.: "chantilly e calda de chocolate"). */
  garnish: string;
  /** Texto extra enviado à IA só para este produto. */
  imagePrompt: string;
};

export type Settings = {
  storeName: string;
  pin: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  heroProductId: string | null;
  /** Imprime automaticamente ao confirmar o pedido no totem. */
  autoPrint: boolean;
  /** Marca impressa no copo pela IA. */
  logoText: string;
  /** Texto fixo somado ao comando de geração de todas as fotos. */
  imagePromptExtra: string;
};

export type MenuState = {
  version: 1;
  categories: Category[];
  products: Product[];
  modifierGroups: ModifierGroup[];
  settings: Settings;
};

export type OrderType = "local" | "levar";
export type Payment = "pix" | "cartao" | "caixa";

export type ChosenOption = { group: string; label: string; price: number };

export type OrderItem = {
  key: string;
  productId: string;
  name: string;
  image: string;
  unitPrice: number;
  qty: number;
  size: string | null;
  options: ChosenOption[];
  /** Resumo legível: "M · Aveia · sem açúcar". */
  details: string;
};

export type OrderStatus = "novo" | "preparando" | "pronto" | "entregue" | "cancelado";

export type Order = {
  id: string;
  number: number;
  customerName: string;
  orderType: OrderType;
  payment: Payment;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: number;
  updatedAt: number;
};

export const orderTypes: { id: OrderType; label: string; hint: string }[] = [
  { id: "local", label: "Consumir no local", hint: "Levamos até a sua mesa" },
  { id: "levar", label: "Para levar", hint: "Embalado para viagem" },
];

export const payments: { id: Payment; label: string; hint: string }[] = [
  { id: "pix", label: "Pix", hint: "QR Code na tela" },
  { id: "cartao", label: "Cartão", hint: "Débito ou crédito" },
  { id: "caixa", label: "Pagar no caixa", hint: "Dinheiro ou outros" },
];

export const orderStatuses: { id: OrderStatus; label: string }[] = [
  { id: "novo", label: "Novos" },
  { id: "preparando", label: "Preparando" },
  { id: "pronto", label: "Prontos" },
  { id: "entregue", label: "Entregues" },
];

export const cupStyles: { id: CupStyle; label: string; hint: string }[] = [
  { id: "kraft", label: "Kraft", hint: "Copo de papel kraft, tampa reta — bebidas quentes" },
  { id: "flat", label: "Tampa reta", hint: "Copo transparente com tampa reta — geladas sem enfeite" },
  { id: "dome", label: "Cúpula", hint: "Copo transparente com tampa cúpula — geladas com enfeite" },
  { id: "none", label: "Sem copo", hint: "Produto solto (doces, salgados, garrafa)" },
];

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const uid = () => Math.random().toString(36).slice(2, 10);

export const itemTotal = (it: OrderItem) =>
  (it.unitPrice + it.options.reduce((a, o) => a + o.price, 0)) * it.qty;
