import * as Phaser from 'phaser';
import type { GuildEmblem } from '../systems/GameState';

/** Símbolos prontos, desenhados por código (dá para trocar por imagens depois). */
export const PRESET_EMBLEMS = [
  { id: 'espada', name: 'Espada', color: '#8a2c2c' },
  { id: 'estrela', name: 'Estrela', color: '#2c4f8a' },
  { id: 'lua', name: 'Lua', color: '#3d2c6e' },
  { id: 'coroa', name: 'Coroa', color: '#6e5a1f' },
  { id: 'chama', name: 'Chama', color: '#8a4b1f' },
  { id: 'arvore', name: 'Árvore', color: '#2c6e3b' },
] as const;

export const EMBLEM_SIZE = 128;
const GOLD = '#e0b04a';

function shield(ctx: CanvasRenderingContext2D, color: string) {
  const s = EMBLEM_SIZE;
  ctx.beginPath();
  ctx.moveTo(s * 0.12, s * 0.1);
  ctx.lineTo(s * 0.88, s * 0.1);
  ctx.lineTo(s * 0.88, s * 0.5);
  ctx.quadraticCurveTo(s * 0.88, s * 0.82, s * 0.5, s * 0.95);
  ctx.quadraticCurveTo(s * 0.12, s * 0.82, s * 0.12, s * 0.5);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = GOLD;
  ctx.stroke();
}

function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.42 : r;
    ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

function drawSymbol(ctx: CanvasRenderingContext2D, id: string) {
  const s = EMBLEM_SIZE;
  ctx.fillStyle = GOLD;
  switch (id) {
    case 'espada':
      ctx.beginPath(); // lâmina com ponta
      ctx.moveTo(s * 0.5, s * 0.17);
      ctx.lineTo(s * 0.55, s * 0.26);
      ctx.lineTo(s * 0.55, s * 0.6);
      ctx.lineTo(s * 0.45, s * 0.6);
      ctx.lineTo(s * 0.45, s * 0.26);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(s * 0.32, s * 0.6, s * 0.36, s * 0.06); // guarda
      ctx.fillRect(s * 0.47, s * 0.66, s * 0.06, s * 0.1); // cabo
      ctx.beginPath(); // pomo
      ctx.arc(s * 0.5, s * 0.79, s * 0.045, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'estrela':
      star(ctx, s * 0.5, s * 0.48, s * 0.26);
      break;
    case 'lua':
      ctx.beginPath();
      ctx.arc(s * 0.5, s * 0.48, s * 0.24, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = PRESET_EMBLEMS.find((e) => e.id === 'lua')!.color;
      ctx.beginPath();
      ctx.arc(s * 0.6, s * 0.42, s * 0.21, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      break;
    case 'coroa':
      ctx.beginPath();
      ctx.moveTo(s * 0.26, s * 0.66);
      ctx.lineTo(s * 0.26, s * 0.32);
      ctx.lineTo(s * 0.38, s * 0.48);
      ctx.lineTo(s * 0.5, s * 0.26);
      ctx.lineTo(s * 0.62, s * 0.48);
      ctx.lineTo(s * 0.74, s * 0.32);
      ctx.lineTo(s * 0.74, s * 0.66);
      ctx.closePath();
      ctx.fill();
      break;
    case 'chama':
      ctx.beginPath();
      ctx.moveTo(s * 0.5, s * 0.2);
      ctx.bezierCurveTo(s * 0.72, s * 0.42, s * 0.74, s * 0.6, s * 0.5, s * 0.76);
      ctx.bezierCurveTo(s * 0.26, s * 0.6, s * 0.3, s * 0.44, s * 0.42, s * 0.36);
      ctx.bezierCurveTo(s * 0.42, s * 0.48, s * 0.48, s * 0.5, s * 0.5, s * 0.2);
      ctx.fill();
      break;
    case 'arvore':
      ctx.fillRect(s * 0.46, s * 0.6, s * 0.08, s * 0.18);
      for (const [y, w] of [[0.2, 0.18], [0.34, 0.24], [0.46, 0.3]]) {
        ctx.beginPath();
        ctx.moveTo(s * 0.5, s * y);
        ctx.lineTo(s * (0.5 + w), s * (y + 0.18));
        ctx.lineTo(s * (0.5 - w), s * (y + 0.18));
        ctx.closePath();
        ctx.fill();
      }
      break;
  }
}

/** Gera as texturas `emblem-<id>` dos símbolos prontos. Chamar uma vez no Preload. */
export function generatePresetEmblems(scene: Phaser.Scene) {
  for (const e of PRESET_EMBLEMS) {
    const key = `emblem-${e.id}`;
    if (scene.textures.exists(key)) continue;
    const tex = scene.textures.createCanvas(key, EMBLEM_SIZE, EMBLEM_SIZE)!;
    const ctx = tex.getContext();
    shield(ctx, e.color);
    drawSymbol(ctx, e.id);
    tex.refresh();
  }
}

/** Garante que a textura do símbolo da guilda existe e devolve a chave dela. */
export function loadEmblemTexture(scene: Phaser.Scene, emblem: GuildEmblem): Promise<string> {
  if (emblem.kind === 'preset') return Promise.resolve(`emblem-${emblem.id}`);
  const key = 'emblem-custom-' + hash(emblem.dataUrl);
  if (scene.textures.exists(key)) return Promise.resolve(key);
  return new Promise((resolve) => {
    scene.textures.once(`addtexture-${key}`, () => resolve(key));
    scene.textures.once('onerror', () => resolve('emblem-espada'));
    scene.textures.addBase64(key, emblem.dataUrl);
  });
}

/** Abre o seletor de arquivo e devolve a imagem reduzida para 128x128 (para caber no save). */
export function pickImageFromComputer(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = EMBLEM_SIZE;
        const ctx = canvas.getContext('2d')!;
        const scale = Math.max(EMBLEM_SIZE / img.width, EMBLEM_SIZE / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (EMBLEM_SIZE - w) / 2, (EMBLEM_SIZE - h) / 2, w, h);
        URL.revokeObjectURL(img.src);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(null);
      img.src = URL.createObjectURL(file);
    };
    input.click();
  });
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
