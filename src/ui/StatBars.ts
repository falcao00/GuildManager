import * as Phaser from 'phaser';
import { STAT_LABELS, type Stats } from '../data/adventurers';
import { STAT_MAX } from '../data/config';
import { COLORS, FONT } from './theme';

/**
 * Cor da barra por faixa de 10 pontos: muda a cada 10 (0-9, 10-19, ... 90-99, 100),
 * indo do cinza ao dourado/vermelho para mostrar em que faixa o status está.
 */
export const STAT_BAND_COLORS = [
  0x6b6478, // 0-9
  0x8a7f6a, // 10-19
  0x9c8a4a, // 20-29
  0x7fa04a, // 30-39
  0x4aa05a, // 40-49
  0x3fa59a, // 50-59
  0x4a7bc9, // 60-69
  0x8a5ad0, // 70-79
  0xc95ab0, // 80-89
  0xe0b04a, // 90-99
  0xff6a3a, // 100
];

export const statBandColor = (v: number) => STAT_BAND_COLORS[Math.max(0, Math.min(STAT_BAND_COLORS.length - 1, Math.floor(v / 10)))];

/** Barras de Força / Velocidade / Inteligência (0 a 100). */
export class StatBars extends Phaser.GameObjects.Container {
  private bars: Record<keyof Stats, { fill: Phaser.GameObjects.Rectangle; value: Phaser.GameObjects.Text }>;

  constructor(scene: Phaser.Scene, x: number, y: number, private barWidth = 160, labelWidth = 110, rowHeight = 28) {
    super(scene, x, y);
    const keys = Object.keys(STAT_LABELS) as (keyof Stats)[];
    this.bars = {} as typeof this.bars;
    keys.forEach((k, i) => {
      const row = i * rowHeight;
      const label = scene.add.text(0, row, STAT_LABELS[k], FONT.small).setOrigin(0, 0.5);
      const bg = scene.add.rectangle(labelWidth, row, barWidth, 12, COLORS.bg).setOrigin(0, 0.5);
      const fill = scene.add.rectangle(labelWidth, row, 0, 12, COLORS.gold).setOrigin(0, 0.5);
      const value = scene.add.text(labelWidth + 10 + barWidth, row, '0', FONT.body).setOrigin(0, 0.5);
      this.add([label, bg, fill, value]);
      this.bars[k] = { fill, value };
    });
    scene.add.existing(this);
  }

  setStats(s: Stats) {
    for (const k of Object.keys(this.bars) as (keyof Stats)[]) {
      this.bars[k].fill.width = (this.barWidth * s[k]) / STAT_MAX;
      this.bars[k].fill.setFillStyle(statBandColor(s[k]));
      this.bars[k].value.setText(String(s[k]));
    }
    return this;
  }
}
