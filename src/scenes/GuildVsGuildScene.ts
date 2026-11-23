import * as Phaser from 'phaser';
import { CLASSES, RACES } from '../data/adventurers';
import { effectiveStats } from '../systems/Adventurer';
import { GameState } from '../systems/GameState';
import { Button } from '../ui/Button';
import { toast } from '../ui/Dialog';
import { screenLayout } from '../ui/ScreenLayout';
import { COLORS, FONT, css } from '../ui/theme';

export const GVG_TEAM_SIZE = 3;
const ROWS_PER_PAGE = 8;

/**
 * Guilda vs Guilda: o mestre escolhe 3 aventureiros para enfrentar 3 de outra guilda.
 * Por enquanto só a escolha do time; ainda não existem outras guildas nem regras de combate.
 */
export class GuildVsGuildScene extends Phaser.Scene {
  private page = 0;

  constructor() {
    super('GuildVsGuild');
  }

  init(data: { page?: number }) {
    this.page = data.page ?? 0;
  }

  create() {
    const state = GameState.get();
    const { guild } = state;
    const top = screenLayout(this, 'Guilda vs Guilda', `Escolha ${GVG_TEAM_SIZE} aventureiros para lutar contra ${GVG_TEAM_SIZE} de outra guilda`);
    const ids = new Set(guild.adventurers.map((a) => a.id));
    const team = (guild.gvgTeam ?? []).filter((id) => ids.has(id));

    const toggle = (id: string) => {
      const i = team.indexOf(id);
      if (i >= 0) team.splice(i, 1);
      else if (team.length >= GVG_TEAM_SIZE) return toast(this, `O time já tem ${GVG_TEAM_SIZE} aventureiros. Tire um antes.`, COLORS.danger);
      else team.push(id);
      guild.gvgTeam = team;
      state.save();
      this.scene.restart({ page: this.page });
    };

    // Lista de aventureiros (esquerda)
    const list = guild.adventurers;
    const pages = Math.max(1, Math.ceil(list.length / ROWS_PER_PAGE));
    this.page = Math.min(this.page, pages - 1);
    this.add.text(40, top + 10, 'Seus aventureiros (clique para escolher)', { ...FONT.small, color: css(COLORS.gold) }).setOrigin(0, 0.5);
    list.slice(this.page * ROWS_PER_PAGE, (this.page + 1) * ROWS_PER_PAGE).forEach((a, i) => {
      const y = top + 50 + i * 50;
      const chosen = team.includes(a.id);
      const row = this.add
        .rectangle(400, y, 720, 44, chosen ? COLORS.panelLight : COLORS.panel)
        .setStrokeStyle(2, COLORS.gold, chosen ? 1 : 0.2)
        .setInteractive({ useHandCursor: true });
      row.on('pointerup', () => toggle(a.id));
      const s = effectiveStats(a);
      this.add.text(60, y, chosen ? '✔' : '○', { ...FONT.body, color: css(COLORS.gold) }).setOrigin(0, 0.5);
      this.add.text(95, y, a.name, FONT.body).setOrigin(0, 0.5);
      this.add.text(290, y, a.rank, { ...FONT.body, color: css(COLORS.gold) }).setOrigin(0, 0.5);
      this.add.text(340, y, `${CLASSES[a.classId].name} · ${RACES[a.raceId].name}`, FONT.small).setOrigin(0, 0.5);
      this.add.text(740, y, `${s.strength} / ${s.speed} / ${s.intelligence}`, FONT.body).setOrigin(1, 0.5);
    });
    if (pages > 1) {
      const go = (d: number) => this.scene.restart({ page: (this.page + d + pages) % pages });
      new Button(this, 320, 670, '◀', () => go(-1), { width: 44, height: 36 });
      this.add.text(400, 670, `${this.page + 1} / ${pages}`, FONT.body).setOrigin(0.5);
      new Button(this, 480, 670, '▶', () => go(1), { width: 44, height: 36 });
    }

    // Time escolhido (direita)
    const px = 1020;
    this.add.rectangle(px, top + 230, 420, 470, COLORS.panel).setStrokeStyle(2, COLORS.gold, 0.5);
    this.add.text(px, top + 25, `Seu time (${team.length}/${GVG_TEAM_SIZE})`, FONT.heading).setOrigin(0.5);
    for (let i = 0; i < GVG_TEAM_SIZE; i++) {
      const y = top + 90 + i * 80;
      const a = guild.adventurers.find((x) => x.id === team[i]);
      this.add.rectangle(px, y, 380, 66, COLORS.bg).setStrokeStyle(1, COLORS.muted, 0.5);
      if (a) {
        this.add.text(px - 170, y - 12, `${a.name}  (${a.rank})`, FONT.body).setOrigin(0, 0.5);
        this.add.text(px - 170, y + 14, `${CLASSES[a.classId].name} · ${RACES[a.raceId].name}`, FONT.small).setOrigin(0, 0.5);
      } else {
        this.add.text(px, y, 'Vaga livre', FONT.small).setOrigin(0.5);
      }
    }
    new Button(this, px, top + 360, 'Procurar adversário', () => undefined, { width: 300, primary: team.length === GVG_TEAM_SIZE }).setEnabled(false);
    this.add
      .text(px, top + 420, 'Em breve: ainda não existem outras guildas para enfrentar.', { ...FONT.small, align: 'center', wordWrap: { width: 360 } })
      .setOrigin(0.5);
  }
}
