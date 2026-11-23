import * as Phaser from 'phaser';
import { UPGRADES, UPGRADE_IDS, maxUpgradeLevel, upgradeCost, upgradeValue } from '../data/upgrades';
import { GameState } from '../systems/GameState';
import { Button } from '../ui/Button';
import { toast } from '../ui/Dialog';
import { screenLayout } from '../ui/ScreenLayout';
import { COLORS, FONT, css } from '../ui/theme';

/** Melhorias: o Mestre da Guilda gasta ouro para expandir a guilda (Dormitórios, Quadro de Missões, Arsenal). */
export class UpgradesScene extends Phaser.Scene {
  constructor() {
    super('Upgrades');
  }

  create() {
    const state = GameState.get();
    const { guild } = state;
    const { width } = this.scale;
    const top = screenLayout(this, 'Melhorias', `Expanda a guilda   ·   Ouro ${guild.gold}`);

    const cardW = 360;
    const cardH = 400;
    const gap = 30;
    const startX = width / 2 - (cardW + gap) + 0;
    const cy = top + 30 + cardH / 2;

    UPGRADE_IDS.forEach((id, i) => {
      const def = UPGRADES[id];
      const x = startX + i * (cardW + gap);
      const level = state.upgradeLevel(id);
      const max = maxUpgradeLevel(id);
      const cost = upgradeCost(id, level);
      const t = cy - cardH / 2;

      this.add.rectangle(x, cy, cardW, cardH, COLORS.panel).setStrokeStyle(2, COLORS.gold, 0.5);
      this.add.text(x, t + 36, def.name, FONT.heading).setOrigin(0.5);
      this.add.text(x, t + 78, def.description, { ...FONT.small, align: 'center', wordWrap: { width: cardW - 40 } }).setOrigin(0.5);

      // Níveis (bolinhas)
      for (let l = 1; l <= max; l++) {
        const dx = (l - (max + 1) / 2) * 34;
        this.add.circle(x + dx, t + 125, 11, l <= level ? COLORS.gold : COLORS.bg).setStrokeStyle(2, COLORS.gold, 0.6);
      }
      this.add.text(x, t + 155, `Nível ${level} de ${max}`, FONT.small).setOrigin(0.5);

      this.add.text(x, t + 205, `${upgradeValue(id, level)}`, { ...FONT.title, fontSize: '48px' }).setOrigin(0.5);
      this.add.text(x, t + 245, def.unit, FONT.body).setOrigin(0.5);

      if (cost === null) {
        this.add.text(x, t + 300, 'Nível máximo', { ...FONT.heading, fontSize: '20px' }).setOrigin(0.5);
        return;
      }
      this.add.text(x, t + 290, `Próximo nível: ${upgradeValue(id, level + 1)} ${def.unit}`, FONT.small).setOrigin(0.5);
      const affordable = guild.gold >= cost;
      this.add
        .text(x, t + 318, `${cost} de ouro`, { ...FONT.heading, fontSize: '20px', color: css(affordable ? COLORS.gold : COLORS.danger) })
        .setOrigin(0.5);
      new Button(this, x, t + 362, 'Melhorar', () => {
        const error = state.buyUpgrade(id);
        if (error) return toast(this, error, COLORS.danger);
        this.scene.restart();
      }, { width: cardW - 60, height: 42, primary: affordable }).setEnabled(affordable);
    });
  }
}
