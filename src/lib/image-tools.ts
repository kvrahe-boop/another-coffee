/** Ferramentas de imagem no navegador: ler arquivo, remover fundo liso, recortar bordas e reduzir. */

export const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Não foi possível abrir a imagem"));
    img.src = src;
  });

function toCanvas(img: HTMLImageElement, maxH = 1400) {
  const scale = Math.min(1, maxH / img.naturalHeight);
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(img.naturalWidth * scale));
  c.height = Math.max(1, Math.round(img.naturalHeight * scale));
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c;
}

/** Já tem transparência? (algum pixel com alpha baixo) */
export async function hasTransparency(src: string) {
  const c = toCanvas(await loadImage(src), 300);
  const d = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
  for (let i = 3; i < d.length; i += 4 * 7) if (d[i]! < 250) return true;
  return false;
}

/**
 * Remove o fundo liso (branco/bege) por preenchimento a partir das bordas,
 * depois recorta as margens transparentes. Retorna PNG data URL.
 */
export async function removeBackground(src: string, tolerance = 26) {
  const c = toCanvas(await loadImage(src));
  const ctx = c.getContext("2d")!;
  const { width: w, height: h } = c;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;

  // Cor de fundo = mediana das bordas (mais estável que os 4 cantos).
  const edge: number[][] = [[], [], []];
  const sample = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    for (let ch = 0; ch < 3; ch++) edge[ch]!.push(d[i + ch]!);
  };
  for (let x = 0; x < w; x += 2) {
    sample(x, 0);
    sample(x, h - 1);
  }
  for (let y = 0; y < h; y += 2) {
    sample(0, y);
    sample(w - 1, y);
  }
  const bg = edge.map((v) => v.sort((a, b) => a - b)[Math.floor(v.length / 2)]!);
  const dist = (i: number) =>
    Math.max(Math.abs(d[i]! - bg[0]!), Math.abs(d[i + 1]! - bg[1]!), Math.abs(d[i + 2]! - bg[2]!));

  const visited = new Uint8Array(w * h);
  const stack: number[] = [];
  const push = (x: number, y: number) => {
    const p = y * w + x;
    if (!visited[p]) {
      visited[p] = 1;
      stack.push(p);
    }
  };
  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }
  const soft = tolerance * 2;
  while (stack.length) {
    const p = stack.pop()!;
    const i = p * 4;
    const dd = dist(i);
    if (dd > soft) continue;
    if (dd <= tolerance) {
      d[i + 3] = 0;
      const x = p % w;
      const y = (p - x) / w;
      if (x > 0) push(x - 1, y);
      if (x < w - 1) push(x + 1, y);
      if (y > 0) push(x, y - 1);
      if (y < h - 1) push(x, y + 1);
    } else {
      // Borda suave: alpha proporcional à distância da cor de fundo.
      d[i + 3] = Math.round(((dd - tolerance) / (soft - tolerance)) * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  return trimCanvas(c).toDataURL("image/png");
}

/** Recorta margens transparentes e limita altura (mantém PNG). */
export async function trimAndShrink(src: string, maxH = 1400) {
  const c = toCanvas(await loadImage(src), maxH);
  return trimCanvas(c).toDataURL("image/png");
}

function trimCanvas(c: HTMLCanvasElement) {
  const ctx = c.getContext("2d")!;
  const { width: w, height: h } = c;
  const d = ctx.getImageData(0, 0, w, h).data;
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3]! > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return c;
  const pad = 4;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad);
  maxY = Math.min(h - 1, maxY + pad);
  const out = document.createElement("canvas");
  out.width = maxX - minX + 1;
  out.height = maxY - minY + 1;
  out.getContext("2d")!.drawImage(c, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}
