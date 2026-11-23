import * as Phaser from 'phaser';
import { COLORS, css } from './theme';

type ButtonOptions = { width?: number; height?: number; fontSize?: number; primary?: boolean };

/** Botão simples com estado "selecionado" e "desativado". */
export class Button extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private selected = false;
  private enabled = true;
  private hovered = false;

  constructor(scene: Phaser.Scene, x: number, y: number, text: string, onClick: () => void, private opts: ButtonOptions = {}) {
    super(scene, x, y);
    const w = opts.width ?? 200;
    const h = opts.height ?? 44;
    this.bg = scene.add.rectangle(0, 0, w, h, COLORS.panelLight).setStrokeStyle(2, COLORS.gold, 0.4);
    this.label = scene.add
      .text(0, 0, text, { fontFamily: 'sans-serif', fontSize: `${opts.fontSize ?? 18}px`, color: css(COLORS.text) })
      .setOrigin(0.5);
    this.add([this.bg, this.label]);
    this.setSize(w, h);
    this.bg.setInteractive({ useHandCursor: true });
    this.bg.on('pointerover', () => { this.hovered = true; this.refresh(); });
    this.bg.on('pointerout', () => { this.hovered = false; this.refresh(); });
    this.bg.on('pointerup', () => { if (this.enabled) onClick(); });
    scene.add.existing(this);
    this.refresh();
  }

  setSelected(v: boolean) { this.selected = v; this.refresh(); return this; }
  setEnabled(v: boolean) { this.enabled = v; this.refresh(); return this; }
  setText(t: string) { this.label.setText(t); return this; }

  private refresh() {
    const fill = this.opts.primary || this.selected ? COLORS.gold : this.hovered && this.enabled ? COLORS.panel : COLORS.panelLight;
    this.bg.setFillStyle(fill);
    this.bg.setStrokeStyle(2, COLORS.gold, this.selected || this.hovered ? 1 : 0.4);
    this.label.setColor(this.opts.primary || this.selected ? css(COLORS.bg) : css(COLORS.text));
    this.setAlpha(this.enabled ? 1 : 0.4);
  }
}
