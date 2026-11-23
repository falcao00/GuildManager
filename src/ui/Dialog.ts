import * as Phaser from 'phaser';
import { Button } from './Button';
import { COLORS, FONT, css } from './theme';

/** Caixa de confirmação por cima da tela. `onConfirm` só roda se o jogador confirmar. */
export function confirmDialog(scene: Phaser.Scene, opts: { title: string; message: string; confirmLabel: string; onConfirm: () => void }) {
  const { width, height } = scene.scale;
  const layer = scene.add.container(0, 0).setDepth(2000);
  const overlay = scene.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0).setInteractive();
  const panel = scene.add.rectangle(width / 2, height / 2, 620, 280, COLORS.panel).setStrokeStyle(3, COLORS.danger);
  const title = scene.add.text(width / 2, height / 2 - 90, opts.title, { ...FONT.heading, color: css(COLORS.danger) }).setOrigin(0.5);
  const body = scene.add
    .text(width / 2, height / 2 - 20, opts.message, { ...FONT.body, align: 'center', wordWrap: { width: 540 } })
    .setOrigin(0.5);
  layer.add([overlay, panel, title, body]);
  const cancel = new Button(scene, width / 2 - 150, height / 2 + 80, 'Cancelar', () => layer.destroy(), { width: 240 });
  const confirm = new Button(scene, width / 2 + 150, height / 2 + 80, opts.confirmLabel, () => {
    layer.destroy();
    opts.onConfirm();
  }, { width: 240 });
  layer.add([cancel, confirm]);
  return layer;
}

/** Mensagem curta que some sozinha (ex.: "Ouro insuficiente"). */
export function toast(scene: Phaser.Scene, message: string, color = COLORS.text) {
  const { width, height } = scene.scale;
  const t = scene.add
    .text(width / 2, height - 100, message, { ...FONT.body, color: css(color), backgroundColor: css(COLORS.panel), padding: { x: 16, y: 8 } })
    .setOrigin(0.5)
    .setDepth(1500);
  scene.tweens.add({ targets: t, alpha: 0, delay: 2200, duration: 400, onComplete: () => t.destroy() });
}
