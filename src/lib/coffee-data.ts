import caramelMacchiato from "@/assets/caramel-macchiato.png";
import icedAmericano from "@/assets/iced-americano.png";
import cappuccino from "@/assets/cappuccino.png";
import mochaFrappe from "@/assets/mocha-frappe.png";
import espresso from "@/assets/espresso.png";
import icedLatte from "@/assets/iced-latte.png";
import donutChocolate from "@/assets/donut-chocolate.png";
import donutPink from "@/assets/donut-pink.png";
import brownie from "@/assets/brownie.png";
import croissant from "@/assets/croissant.png";
import paoDeQueijo from "@/assets/pao-de-queijo.png";
import coxinha from "@/assets/coxinha.png";
import aguaSemGas from "@/assets/agua-sem-gas.png";
import aguaComGas from "@/assets/agua-com-gas.png";

export type CategoryId = "quentes" | "geladas" | "doces" | "salgados" | "agua";

export type Category = {
  id: CategoryId;
  label: string;
  /** Drinks get size / milk / sugar options; food and water are added as-is. */
  kind: "drink" | "food" | "water";
};

export const categories: Category[] = [
  { id: "quentes", label: "Quentes", kind: "drink" },
  { id: "geladas", label: "Geladas", kind: "drink" },
  { id: "doces", label: "Doces", kind: "food" },
  { id: "salgados", label: "Salgados", kind: "food" },
  { id: "agua", label: "Água", kind: "water" },
];

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: CategoryId;
};

/** Kept for backwards compatibility with older components. */
export type Drink = Product;
export type Sweet = Product;

export const products: Product[] = [
  // Quentes
  {
    id: "espresso",
    name: "Espresso",
    description: "Dose curta e intensa, crema dourada",
    price: 8,
    image: espresso,
    category: "quentes",
  },
  {
    id: "cappuccino",
    name: "Cappuccino",
    description: "Espresso, leite e espuma com cacau",
    price: 14,
    image: cappuccino,
    category: "quentes",
  },
  {
    id: "caramel-macchiato",
    name: "Caramelo Macchiato",
    description: "Espresso, leite vaporizado e calda de caramelo",
    price: 18,
    image: caramelMacchiato,
    category: "quentes",
  },
  // Geladas
  {
    id: "iced-americano",
    name: "Americano Gelado",
    description: "Espresso duplo sobre gelo",
    price: 12,
    image: icedAmericano,
    category: "geladas",
  },
  {
    id: "iced-latte",
    name: "Latte Gelado",
    description: "Espresso, leite frio e gelo em camadas",
    price: 16,
    image: icedLatte,
    category: "geladas",
  },
  {
    id: "mocha-frappe",
    name: "Mocha Frappé",
    description: "Café gelado batido com chocolate e chantilly",
    price: 22,
    image: mochaFrappe,
    category: "geladas",
  },
  // Doces
  {
    id: "donut-chocolate",
    name: "Donut de Chocolate",
    description: "Massa fofinha com cobertura de chocolate",
    price: 9,
    image: donutChocolate,
    category: "doces",
  },
  {
    id: "donut-pink",
    name: "Donut Morango",
    description: "Cobertura de morango com granulado",
    price: 9.5,
    image: donutPink,
    category: "doces",
  },
  {
    id: "brownie",
    name: "Brownie",
    description: "Chocolate meio amargo, casquinha crocante",
    price: 11,
    image: brownie,
    category: "doces",
  },
  // Salgados
  {
    id: "croissant",
    name: "Croissant",
    description: "Folhado amanteigado assado na hora",
    price: 12,
    image: croissant,
    category: "salgados",
  },
  {
    id: "pao-de-queijo",
    name: "Pão de Queijo",
    description: "Porção com 3 unidades",
    price: 8,
    image: paoDeQueijo,
    category: "salgados",
  },
  {
    id: "coxinha",
    name: "Coxinha",
    description: "Frango com catupiry, empanada",
    price: 9,
    image: coxinha,
    category: "salgados",
  },
  // Água
  {
    id: "agua-sem-gas",
    name: "Água sem Gás",
    description: "500 ml, gelada",
    price: 5,
    image: aguaSemGas,
    category: "agua",
  },
  {
    id: "agua-com-gas",
    name: "Água com Gás",
    description: "300 ml, gelada",
    price: 6,
    image: aguaComGas,
    category: "agua",
  },
];

export const productsByCategory = (c: CategoryId) => products.filter((p) => p.category === c);

export const drinks = products.filter((p) => p.category === "quentes" || p.category === "geladas");
export const sweets = products.filter((p) => p.category === "doces");

export const sizes = [
  { id: "P", label: "P", extra: 0 },
  { id: "M", label: "M", extra: 3 },
  { id: "G", label: "G", extra: 6 },
] as const;

export const milks = ["Integral", "Desnatado", "Aveia", "Amêndoa"] as const;
export const sugars = ["Sem", "Pouco", "Normal"] as const;

export type SizeId = (typeof sizes)[number]["id"];
export type Milk = (typeof milks)[number];
export type Sugar = (typeof sugars)[number];

export type OrderType = "local" | "levar";
export const orderTypes: { id: OrderType; label: string; hint: string }[] = [
  { id: "local", label: "Consumir no local", hint: "Levamos até a sua mesa" },
  { id: "levar", label: "Para levar", hint: "Embalado para viagem" },
];

export type Payment = "pix" | "cartao" | "caixa";
export const payments: { id: Payment; label: string; hint: string }[] = [
  { id: "pix", label: "Pix", hint: "QR Code na tela" },
  { id: "cartao", label: "Cartão", hint: "Débito ou crédito" },
  { id: "caixa", label: "Pagar no caixa", hint: "Dinheiro ou outros" },
];

export type OrderItem = {
  key: string;
  name: string;
  image: string;
  price: number;
  details: string;
};

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
