import * as Phaser from 'phaser';
import { STAT_LABELS, type Stats } from '../data/adventurers';
import { STAT_MAX } from '../data/config';
import { COLORS, FONT } from './theme';

/** Barras de Força / Velocidade / Inteligência (0 a 10). */
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
      this.bars[k].value.setText(String(s[k]));
    }
    return this;
  }
}
