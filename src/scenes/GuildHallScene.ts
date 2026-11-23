import * as Phaser from 'phaser';
import { getCity } from '../data/world';
import { GameState } from '../systems/GameState';
import { adventurerCard } from '../ui/AdventurerCard';
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
const CARDS_PER_PAGE = 3;

/** Tela principal: o salão da guilda. */
export class GuildHallScene extends Phaser.Scene {
  private page = 0;
  private cards: Phaser.GameObjects.Container[] = [];

  constructor() {
    super('GuildHall');
  }

  async create() {
    const state = GameState.get();
    const { guild } = state;
    const { width } = this.scale;
    this.page = 0;
    this.cards = [];

    new TopBar(this);

    // Cabeçalho da guilda
    const top = TOP_BAR_HEIGHT + 14;
    this.add.rectangle(width / 2, top + 60, width - 40, 120, COLORS.panel).setStrokeStyle(2, COLORS.gold, 0.5);
    const emblem = this.add.image(90, top + 60, 'emblem-espada').setDisplaySize(96, 96).setVisible(false);
    this.add.text(160, top + 30, guild.name, FONT.title).setOrigin(0, 0.5);
    this.add.text(162, top + 72, `Guilda de ${getCity(state.data.city).name}`, FONT.small).setOrigin(0, 0.5);
    this.add.text(162, top + 100, `Ouro ${guild.gold}    Prestígio ${guild.prestige}`, FONT.body).setOrigin(0, 0.5);

    // Atividades: botões no centro, logo abaixo das informações da guilda
    const btnW = 230;
    const gap = 20;
    const startX = width / 2 - ((btnW + gap) * ACTIVITIES.length - gap) / 2 + btnW / 2;
    ACTIVITIES.forEach((act, i) => {
      new Button(this, startX + i * (btnW + gap), 230, act.label, () => this.scene.start(act.scene), { width: btnW, height: 48, fontSize: 19 });
    });

    // Aventureiros (3 por página)
    this.add.text(40, 285, `Aventureiros (${guild.adventurers.length})`, FONT.heading).setOrigin(0, 0.5);
    const pages = Math.ceil(guild.adventurers.length / CARDS_PER_PAGE);
    if (pages > 1) {
      const pageText = this.add.text(width - 130, 285, '', FONT.body).setOrigin(0.5);
      const go = (delta: number) => {
        this.page = (this.page + delta + pages) % pages;
        pageText.setText(`${this.page + 1} / ${pages}`);
        this.showPage();
      };
      new Button(this, width - 200, 285, '◀', () => go(-1), { width: 44, height: 36 });
      new Button(this, width - 60, 285, '▶', () => go(1), { width: 44, height: 36 });
      pageText.setText(`1 / ${pages}`);
    }
    this.showPage();

    const key = await loadEmblemTexture(this, guild.emblem);
    if (emblem.active) emblem.setTexture(key).setDisplaySize(96, 96).setVisible(true);
  }

  private showPage() {
    this.cards.forEach((c) => c.destroy());
    const list = GameState.get().guild.adventurers.slice(this.page * CARDS_PER_PAGE, (this.page + 1) * CARDS_PER_PAGE);
    const cardW = 390;
    const gap = 20;
    this.cards = list.map((a, i) => adventurerCard(this, 40 + cardW / 2 + i * (cardW + gap), 480, cardW, 320, a, 'full').container);
  }
}
