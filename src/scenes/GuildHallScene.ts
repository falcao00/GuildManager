import * as Phaser from 'phaser';
import { getCity } from '../data/world';
import { GameState } from '../systems/GameState';
import { Button } from '../ui/Button';
import { loadEmblemTexture } from '../ui/emblems';
import { TopBar, TOP_BAR_HEIGHT } from '../ui/TopBar';
import { COLORS, FONT } from '../ui/theme';

const ACTIVITIES = [
  { label: 'Missões', scene: 'Missions' },
  { label: 'Recrutamento', scene: 'Recruitment' },
  { label: 'Guilda vs Guilda', scene: 'GuildVsGuild' },
  { label: 'Inventário', scene: 'Inventory' },
];

/** Tela principal: o salão da guilda. */
export class GuildHallScene extends Phaser.Scene {
  constructor() {
    super('GuildHall');
  }

  async create() {
    const state = GameState.get();
    const { guild } = state;
    const { width } = this.scale;

    new TopBar(this);

    // Cabeçalho da guilda
    const top = TOP_BAR_HEIGHT + 14;
    this.add.rectangle(width / 2, top + 60, width - 40, 120, COLORS.panel).setStrokeStyle(2, COLORS.gold, 0.5);
    const emblem = this.add.image(90, top + 60, 'emblem-espada').setDisplaySize(96, 96).setVisible(false);
    this.add.text(160, top + 30, guild.name, FONT.title).setOrigin(0, 0.5);
    this.add.text(162, top + 72, `Guilda de ${getCity(state.data.city).name}`, FONT.small).setOrigin(0, 0.5);
    this.add.text(162, top + 100, `Ouro ${guild.gold}    Prestígio ${guild.prestige}    Aventureiros ${guild.adventurers.length}`, FONT.body).setOrigin(0, 0.5);

    // Atividades: grade 2x2 no centro do espaço abaixo do cabeçalho
    const btnW = 340;
    const btnH = 96;
    const gap = 30;
    const centerY = (top + 120 + this.scale.height) / 2;
    ACTIVITIES.forEach((act, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = width / 2 + (col === 0 ? -1 : 1) * (btnW + gap) / 2;
      const y = centerY + (row === 0 ? -1 : 1) * (btnH + gap) / 2;
      new Button(this, x, y, act.label, () => this.scene.start(act.scene), { width: btnW, height: btnH, fontSize: 24 });
    });

    const key = await loadEmblemTexture(this, guild.emblem);
    if (emblem.active) emblem.setTexture(key).setDisplaySize(96, 96).setVisible(true);
  }
}
