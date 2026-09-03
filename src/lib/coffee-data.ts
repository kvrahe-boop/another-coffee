import caramelMacchiato from "@/assets/caramel-macchiato.png";
import icedAmericano from "@/assets/iced-americano.png";
import cappuccino from "@/assets/cappuccino.png";
import mochaFrappe from "@/assets/mocha-frappe.png";
import donutChocolate from "@/assets/donut-chocolate.png";
import donutPink from "@/assets/donut-pink.png";

export type Drink = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
};

export type Sweet = {
  id: string;
  name: string;
  price: number;
  image: string;
};

export const drinks: Drink[] = [
  {
    id: "caramel-macchiato",
    name: "Caramelo Macchiato",
    description: "Espresso, leite vaporizado e calda de caramelo",
    price: 18,
    image: caramelMacchiato,
  },
  {
    id: "iced-americano",
    name: "Americano Gelado",
    description: "Espresso duplo sobre gelo",
    price: 12,
    image: icedAmericano,
  },
  {
    id: "cappuccino",
    name: "Cappuccino",
    description: "Espresso, leite e espuma com cacau",
    price: 14,
    image: cappuccino,
  },
  {
    id: "mocha-frappe",
    name: "Mocha Frappé",
    description: "Café gelado batido com chocolate e chantilly",
    price: 22,
    image: mochaFrappe,
  },
];

export const sweets: Sweet[] = [
  { id: "donut-chocolate", name: "Donut de Chocolate", price: 9, image: donutChocolate },
  { id: "donut-pink", name: "Donut Morango Granulado", price: 9.5, image: donutPink },
];

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

export type OrderItem = {
  key: string;
  name: string;
  image: string;
  price: number;
  details: string;
};

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
