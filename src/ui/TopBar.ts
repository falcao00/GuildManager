import * as Phaser from 'phaser';
import { formatGameDate, formatGameTime, gameDate } from '../systems/GameClock';
import { GameState } from '../systems/GameState';
import { COLORS, FONT, css } from './theme';

export const TOP_BAR_HEIGHT = 56;
const ENERGY_COLOR = 0x4caf50;
const ENERGY_BAR_W = 260;
const ENERGY_BAR_H = 26;

/** Barra superior fixa: data e hora do jogo, energia. Atualiza sozinha. */
export class TopBar extends Phaser.GameObjects.Container {
  private dateText: Phaser.GameObjects.Text;
  private timeText: Phaser.GameObjects.Text;
  private energyFill: Phaser.GameObjects.Rectangle;
  private energyText: Phaser.GameObjects.Text;
  private lastKey = '';

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    const { width } = scene.scale;
    const cy = TOP_BAR_HEIGHT / 2;

    const bg = scene.add.rectangle(0, 0, width, TOP_BAR_HEIGHT, COLORS.panel).setOrigin(0);
    const line = scene.add.rectangle(0, TOP_BAR_HEIGHT - 2, width, 2, COLORS.gold, 0.6).setOrigin(0);

    // Data e hora (esquerda)
    this.dateText = scene.add.text(24, cy, '', { ...FONT.body, color: css(COLORS.gold) }).setOrigin(0, 0.5);
    this.timeText = scene.add.text(200, cy, '', FONT.body).setOrigin(0, 0.5);

    // Energia (direita): barra verde com o número dentro
    const barX = width - 24 - ENERGY_BAR_W;
    const label = scene.add.text(barX - 12, cy, 'Energia', FONT.small).setOrigin(1, 0.5);
    const barBg = scene.add
      .rectangle(barX, cy, ENERGY_BAR_W, ENERGY_BAR_H, COLORS.bg)
      .setOrigin(0, 0.5)
      .setStrokeStyle(2, ENERGY_COLOR, 0.8);
    this.energyFill = scene.add.rectangle(barX, cy, ENERGY_BAR_W, ENERGY_BAR_H, ENERGY_COLOR).setOrigin(0, 0.5);
    this.energyText = scene.add
      .text(barX + ENERGY_BAR_W / 2, cy, '', { ...FONT.body, fontStyle: 'bold', color: '#ffffff', stroke: '#1b1424', strokeThickness: 3 })
      .setOrigin(0.5);

    this.add([bg, line, this.dateText, this.timeText, label, barBg, this.energyFill, this.energyText]);
    this.setDepth(1000);
    scene.add.existing(this);

    this.refresh();
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.refresh, this);
    this.once(Phaser.GameObjects.Events.DESTROY, () => scene.events.off(Phaser.Scenes.Events.UPDATE, this.refresh, this));
  }

  private refresh() {
    const state = GameState.get();
    const now = Date.now();
    if (state.regenerateEnergy(now)) this.lastKey = '';
    const d = gameDate(state.data.foundedAt, now);
    const key = `${d.day}-${d.year}-${d.hours}-${d.minutes}-${state.data.energy}`;
    if (key === this.lastKey) return; // só redesenha quando algo muda
    this.lastKey = key;

    this.dateText.setText(formatGameDate(d));
    this.timeText.setText(formatGameTime(d));
    const { energy } = state.data;
    this.energyFill.width = (ENERGY_BAR_W * energy) / state.maxEnergy;
    this.energyText.setText(`${energy}/${state.maxEnergy}`);
  }
}
