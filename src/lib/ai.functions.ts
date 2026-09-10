import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const input = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(200).default(""),
  cupStyle: z.enum(["kraft", "flat", "dome", "none"]),
  garnish: z.string().max(120).default(""),
  categoryKind: z.enum(["drink", "food", "water"]).default("drink"),
  /** Texto da marca impresso no copo. Vazio = sem logo. */
  logoText: z.string().max(40).default("ANOTHER COFFEE"),
  /** Texto livre somado ao comando de geração. */
  extraPrompt: z.string().max(400).default(""),
});

const CUP_PROMPTS = {
  kraft:
    "a tall kraft brown paper hot-coffee cup with a flat matte black plastic sip lid and a plain kraft sleeve",
  flat: "a tall clear plastic cold-drink cup with a flat clear lid and a black straw, the drink visible inside with ice",
  dome: "a tall clear plastic cold-drink cup with a clear dome lid and a black straw, generously topped with",
  none: "the product itself, no cup",
} as const;

/** Gera a foto do produto no padrão visual da Another Coffee (fundo branco liso para remover no navegador). */
export const generateProductImage = createServerFn({ method: "POST" })
  .inputValidator((d) => input.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Geração por IA não configurada");

    const logo = data.logoText.trim();
    // Marca sempre idêntica: wordmark em duas linhas com um grão de café simples abaixo.
    const branding = logo
      ? ` The cup carries the exact same brand mark every time: the wordmark "${logo}" in clean minimal black sans-serif capital letters with wide letter-spacing, centered on the front of the cup, and directly below it one small solid black minimal coffee-bean icon (an oval with a single centre line). Spelled exactly like that, same size and placement always, no other text, no symbols, no extra logos.`
      : " No logo, no text on the cup.";

    const subject =
      data.cupStyle === "none"
        ? `${data.name}${data.description ? ` — ${data.description}` : ""}, a single serving of the real product`
        : `${CUP_PROMPTS[data.cupStyle]}${data.cupStyle === "dome" ? ` ${data.garnish || "whipped cream"}` : ""}, containing ${data.name}${data.description ? ` (${data.description})` : ""}.${branding}`;

    const extra = data.extraPrompt.trim();
    const prompt = `Photorealistic studio product shot of ${subject}. Centered, front view, slightly below eye level, entire product fully visible with generous margin around it, soft diffused daylight, no cast shadow on the background, isolated on a pure flat solid white background (#FFFFFF) with completely even lighting and no gradient or vignette, crisp clean edges, no props, no table, no watermark. Vertical 2:3 composition.${extra ? ` ${extra}` : ""}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      if (res.status === 429) throw new Error("Muitas gerações seguidas. Aguarde um instante.");
      if (res.status === 402) throw new Error("Créditos de IA esgotados.");
      throw new Error(`Falha ao gerar imagem (${res.status}): ${txt.slice(0, 200)}`);
    }
    const json = (await res.json()) as {
      choices?: { message?: { images?: { image_url?: { url?: string } }[] } }[];
    };
    const url = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!url) throw new Error("A IA não devolveu imagem. Tente novamente.");
    return { image: url };
  });
