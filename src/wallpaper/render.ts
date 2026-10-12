import type { WallContent } from "./content";

export const SIZES = {
  "iPhone 14/15/16": [1179, 2556],
  "iPhone Pro Max / Plus": [1290, 2796],
  "iPhone 12/13 mini": [1080, 2340],
} as const;

const C = {
  bg: "#0D1524", ink: "#EAF0FA", muted: "#94A2BC", line: "#26344F",
  amber: "#FFB627", teal: "#35C2AC", card: "#162238",
};

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const out: string[] = [];
  let cur = "";
  for (const w of text.split(/\s+/)) {
    const t = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(t).width <= width) cur = t;
    else { if (cur) out.push(cur); cur = w; }
  }
  if (cur) out.push(cur);
  return out;
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

export async function loadFonts() {
  if (!("fonts" in document)) return;
  await Promise.all([
    document.fonts.load('700 100px "Barlow Condensed"'),
    document.fonts.load('600 100px "Barlow Condensed"'),
    document.fonts.load('400 40px "Barlow"'),
    document.fonts.load('600 40px "Barlow"'),
  ]).catch(() => undefined);
}

/**
 * Draw one wallpaper. Layout is designed at 1179 px wide and scaled, keeping the top ~38% clear
 * for the lock-screen clock and the bottom ~9% clear for the flashlight and camera buttons.
 */
export function drawWallpaper(canvas: HTMLCanvasElement, c: WallContent, size: readonly [number, number] = SIZES["iPhone 14/15/16"]) {
  const [W, H] = size;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const k = W / 1179;
  const vy = H / 2556;
  const D = (w: number, s: number) => `${w} ${Math.round(s * k)}px "Barlow Condensed", "Arial Narrow", sans-serif`;
  const B = (w: number, s: number) => `${w} ${Math.round(s * k)}px Barlow, "Helvetica Neue", Arial, sans-serif`;

  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  const M = 84 * k;
  const CW = W - 2 * M;

  // Countdown
  const y0 = 1010 * vy;
  const num = c.daysToGo > 0 ? String(c.daysToGo) : "21.1";
  ctx.textBaseline = "alphabetic";
  ctx.font = D(700, 470);
  ctx.fillStyle = c.daysToGo <= 7 ? C.amber : C.ink;
  ctx.fillText(num, M - 12 * k, y0);
  const nw = ctx.measureText(num).width;
  ctx.font = D(600, 64);
  ctx.fillStyle = C.ink;
  ctx.fillText(c.daysToGo > 1 ? "DAYS TO GO" : c.daysToGo === 1 ? "DAY TO GO" : "RACE DAY", M + nw + 22 * k, y0 - 96 * k);
  ctx.font = B(500, 34);
  ctx.fillStyle = C.muted;
  ctx.fillText("HALF MARATHON", M + nw + 22 * k, y0 - 26 * k);

  // Progress
  let y = y0 + 50 * k;
  ctx.fillStyle = C.line;
  rr(ctx, M, y, CW, 14 * k, 7 * k);
  ctx.fillStyle = C.teal;
  rr(ctx, M, y, Math.max(14 * k, CW * c.progress), 14 * k, 7 * k);
  y += 64 * k;
  ctx.textBaseline = "top";
  ctx.font = D(600, 64);
  ctx.fillStyle = C.ink;
  ctx.fillText(c.dateLabel, M, y);
  y += 104 * k;

  // Card
  ctx.font = B(400, 40);
  const lineH = 50 * k;
  const heights = c.blocks.map((b) => 144 * k + b.lines.reduce((a, l) => a + wrap(ctx, l.text, CW - 72 * k).length * lineH + 10 * k, 0));
  const maxBottom = 2290 * vy;
  const cardH = Math.min(heights.reduce((a, b) => a + b, 0) + 40 * k * (c.blocks.length - 1) + 60 * k, maxBottom - y);
  ctx.fillStyle = C.card;
  rr(ctx, M - 24 * k, y, CW + 48 * k, cardH, 34 * k);
  let cy = y + 36 * k;
  c.blocks.forEach((b, i) => {
    if (i) {
      ctx.fillStyle = C.line;
      ctx.fillRect(M + 12 * k, cy - 20 * k, CW - 24 * k, 2 * k);
    }
    ctx.font = D(600, 82);
    ctx.fillStyle = b.race ? C.amber : C.ink;
    ctx.fillText(b.title, M + 12 * k, cy);
    cy += 92 * k;
    ctx.font = B(500, 34);
    ctx.fillStyle = C.muted;
    ctx.fillText(b.where, M + 12 * k, cy);
    cy += 52 * k;
    for (const l of b.lines) {
      ctx.font = B(l.haze ? 600 : 400, 40);
      ctx.fillStyle = l.haze ? C.teal : C.ink;
      for (const wl of wrap(ctx, l.text, CW - 72 * k)) {
        if (cy > y + cardH - 50 * k) break;
        ctx.fillText(wl, M + 12 * k, cy);
        cy += lineH;
      }
      cy += 10 * k;
    }
    cy += 40 * k;
  });

  // Quote
  ctx.font = B(500, 44);
  ctx.fillStyle = C.muted;
  ctx.textAlign = "center";
  let qy = 2330 * vy;
  for (const wl of wrap(ctx, c.quote, CW)) {
    ctx.fillText(wl, W / 2, qy);
    qy += 56 * k;
  }
  ctx.textAlign = "left";
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("Couldn't render the image."))), "image/png"));
}
