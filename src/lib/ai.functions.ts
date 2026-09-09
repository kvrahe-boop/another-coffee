import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const input = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(200).default(""),
  cupStyle: z.enum(["kraft", "flat", "dome", "none"]),
  garnish: z.string().max(120).default(""),
  categoryKind: z.enum(["drink", "food", "water"]).default("drink"),
  /** Texto da marca impresso no copo (ex.: ANOTHER COFFEE). Vazio = sem logo. */
  logoText: z.string().max(40).default(""),
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

    const subject =
      data.cupStyle === "none"
        ? `${data.name}${data.description ? ` — ${data.description}` : ""}, a single serving of the real product`
        : `${CUP_PROMPTS[data.cupStyle]}${data.cupStyle === "dome" ? ` ${data.garnish || "whipped cream"}` : ""}, containing ${data.name}${data.description ? ` (${data.description})` : ""}. No logo, no text on the cup.`;

    const prompt = `Photorealistic studio product shot of ${subject}. Centered, front view, slightly below eye level, entire product fully visible with margin around it, soft diffused daylight, subtle natural shadow only directly under the product, isolated on a pure solid white background (#FFFFFF), no props, no table, no text, no watermark. Vertical 2:3 composition.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
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
