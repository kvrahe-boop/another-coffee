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
import type { MenuState, Product } from "./menu-types";

const sizesPMG = (p: number, m: number, g: number) => [
  { id: "P", label: "P", price: p },
  { id: "M", label: "M", price: m },
  { id: "G", label: "G", price: g },
];

const product = (
  p: Omit<Product, "available" | "hidden" | "upsellProductIds" | "garnish"> &
    Partial<Pick<Product, "available" | "hidden" | "upsellProductIds" | "garnish">>,
): Product => ({
  available: true,
  hidden: false,
  upsellProductIds: [],
  garnish: "",
  ...p,
});

const sweets = ["donut-chocolate", "donut-pink", "brownie"];

export const defaultMenu: MenuState = {
  version: 1,
  settings: {
    storeName: "ANOTHER COFFEE",
    pin: "1234",
    welcomeTitle: "Faça seu pedido aqui",
    welcomeSubtitle: "Sem fila, direto para a cozinha",
    heroProductId: "caramel-macchiato",
    autoPrint: false,
  },
  categories: [
    { id: "quentes", label: "Quentes", kind: "drink", sortOrder: 0, hidden: false },
    { id: "geladas", label: "Geladas", kind: "drink", sortOrder: 1, hidden: false },
    { id: "doces", label: "Doces", kind: "food", sortOrder: 2, hidden: false },
    { id: "salgados", label: "Salgados", kind: "food", sortOrder: 3, hidden: false },
    { id: "agua", label: "Água", kind: "water", sortOrder: 4, hidden: false },
  ],
  modifierGroups: [
    {
      id: "leite",
      name: "Leite",
      type: "single",
      required: true,
      max: 1,
      options: [
        { id: "integral", label: "Integral", price: 0 },
        { id: "desnatado", label: "Desnatado", price: 0 },
        { id: "aveia", label: "Aveia", price: 3 },
        { id: "amendoa", label: "Amêndoa", price: 3 },
      ],
    },
    {
      id: "acucar",
      name: "Açúcar",
      type: "single",
      required: true,
      max: 1,
      options: [
        { id: "sem", label: "Sem", price: 0 },
        { id: "pouco", label: "Pouco", price: 0 },
        { id: "normal", label: "Normal", price: 0 },
      ],
    },
    {
      id: "extras",
      name: "Extras",
      type: "multiple",
      required: false,
      max: 0,
      options: [
        { id: "shot", label: "Shot extra de espresso", price: 4 },
        { id: "chantilly", label: "Chantilly", price: 3 },
        { id: "canela", label: "Canela", price: 0 },
      ],
    },
    {
      id: "gelo",
      name: "Gelo",
      type: "single",
      required: false,
      max: 1,
      options: [
        { id: "normal", label: "Normal", price: 0 },
        { id: "pouco", label: "Pouco gelo", price: 0 },
        { id: "sem", label: "Sem gelo", price: 0 },
      ],
    },
  ],
  products: [
    product({
      id: "espresso",
      name: "Espresso",
      description: "Dose curta e intensa, crema dourada",
      categoryId: "quentes",
      image: espresso,
      price: 8,
      sizes: [],
      modifierGroupIds: ["acucar"],
      upsellProductIds: sweets,
      sortOrder: 0,
      cupStyle: "kraft",
    }),
    product({
      id: "cappuccino",
      name: "Cappuccino",
      description: "Espresso, leite e espuma com cacau",
      categoryId: "quentes",
      image: cappuccino,
      price: 14,
      sizes: sizesPMG(14, 17, 20),
      modifierGroupIds: ["leite", "acucar", "extras"],
      upsellProductIds: sweets,
      sortOrder: 1,
      cupStyle: "kraft",
    }),
    product({
      id: "caramel-macchiato",
      name: "Caramelo Macchiato",
      description: "Espresso, leite vaporizado e calda de caramelo",
      categoryId: "quentes",
      image: caramelMacchiato,
      price: 18,
      sizes: sizesPMG(18, 21, 24),
      modifierGroupIds: ["leite", "acucar", "extras"],
      upsellProductIds: sweets,
      sortOrder: 2,
      cupStyle: "kraft",
    }),
    product({
      id: "iced-americano",
      name: "Americano Gelado",
      description: "Espresso duplo sobre gelo",
      categoryId: "geladas",
      image: icedAmericano,
      price: 12,
      sizes: sizesPMG(12, 15, 18),
      modifierGroupIds: ["acucar", "gelo"],
      upsellProductIds: sweets,
      sortOrder: 0,
      cupStyle: "flat",
    }),
    product({
      id: "iced-latte",
      name: "Latte Gelado",
      description: "Espresso, leite frio e gelo em camadas",
      categoryId: "geladas",
      image: icedLatte,
      price: 16,
      sizes: sizesPMG(16, 19, 22),
      modifierGroupIds: ["leite", "acucar", "gelo", "extras"],
      upsellProductIds: sweets,
      sortOrder: 1,
      cupStyle: "flat",
    }),
    product({
      id: "mocha-frappe",
      name: "Mocha Frappé",
      description: "Café gelado batido com chocolate e chantilly",
      categoryId: "geladas",
      image: mochaFrappe,
      price: 22,
      sizes: sizesPMG(22, 25, 28),
      modifierGroupIds: ["leite", "extras"],
      upsellProductIds: sweets,
      sortOrder: 2,
      cupStyle: "dome",
      garnish: "chantilly e calda de chocolate",
    }),
    product({
      id: "donut-chocolate",
      name: "Donut de Chocolate",
      description: "Massa fofinha com cobertura de chocolate",
      categoryId: "doces",
      image: donutChocolate,
      price: 9,
      sizes: [],
      modifierGroupIds: [],
      sortOrder: 0,
      cupStyle: "none",
    }),
    product({
      id: "donut-pink",
      name: "Donut Morango",
      description: "Cobertura de morango com granulado",
      categoryId: "doces",
      image: donutPink,
      price: 9.5,
      sizes: [],
      modifierGroupIds: [],
      sortOrder: 1,
      cupStyle: "none",
    }),
    product({
      id: "brownie",
      name: "Brownie",
      description: "Chocolate meio amargo, casquinha crocante",
      categoryId: "doces",
      image: brownie,
      price: 11,
      sizes: [],
      modifierGroupIds: [],
      sortOrder: 2,
      cupStyle: "none",
    }),
    product({
      id: "croissant",
      name: "Croissant",
      description: "Folhado amanteigado assado na hora",
      categoryId: "salgados",
      image: croissant,
      price: 12,
      sizes: [],
      modifierGroupIds: [],
      sortOrder: 0,
      cupStyle: "none",
    }),
    product({
      id: "pao-de-queijo",
      name: "Pão de Queijo",
      description: "Porção com 3 unidades",
      categoryId: "salgados",
      image: paoDeQueijo,
      price: 8,
      sizes: [],
      modifierGroupIds: [],
      sortOrder: 1,
      cupStyle: "none",
    }),
    product({
      id: "coxinha",
      name: "Coxinha",
      description: "Frango com catupiry, empanada",
      categoryId: "salgados",
      image: coxinha,
      price: 9,
      sizes: [],
      modifierGroupIds: [],
      sortOrder: 2,
      cupStyle: "none",
    }),
    product({
      id: "agua-sem-gas",
      name: "Água sem Gás",
      description: "500 ml, gelada",
      categoryId: "agua",
      image: aguaSemGas,
      price: 5,
      sizes: [],
      modifierGroupIds: [],
      sortOrder: 0,
      cupStyle: "none",
    }),
    product({
      id: "agua-com-gas",
      name: "Água com Gás",
      description: "300 ml, gelada",
      categoryId: "agua",
      image: aguaComGas,
      price: 6,
      sizes: [],
      modifierGroupIds: [],
      sortOrder: 1,
      cupStyle: "none",
    }),
  ],
};

/** Imagens padrão por id, para restaurar após o usuário substituir uma foto. */
export const defaultImages: Record<string, string> = Object.fromEntries(
  defaultMenu.products.map((p) => [p.id, p.image]),
);
