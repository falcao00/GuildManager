import * as Phaser from 'phaser';
import { CLASSES, RACES } from '../data/adventurers';
import { effectiveStats } from '../systems/Adventurer';
import { GameState } from '../systems/GameState';
import { Button } from '../ui/Button';
import { toast } from '../ui/Dialog';
import { screenLayout } from '../ui/ScreenLayout';
import { COLORS, FONT, css } from '../ui/theme';

export type DuelMode = 'single' | 'team';
export const DUEL_MODES: Record<DuelMode, { label: string; size: number }> = {
  single: { label: 'Duelo Single 1x1', size: 1 },
  team: { label: 'Duelo Equipe 3x3', size: 3 },
};
const ROWS_PER_PAGE = 7;

/**
 * Duelos contra outras guildas: Single (1 contra 1) ou Equipe (3 contra 3).
 * Por enquanto só a escolha de quem luta; ainda não existem guildas adversárias nem recompensas.
 */
export class DuelsScene extends Phaser.Scene {
  private page = 0;
  private mode: DuelMode = 'single';

  constructor() {
    super('Duels');
  }

  init(data: { page?: number; mode?: DuelMode }) {
    this.page = data.page ?? 0;
    this.mode = data.mode ?? 'single';
  }

  create() {
    const state = GameState.get();
    const { guild } = state;
    const { width } = this.scale;
    const size = DUEL_MODES[this.mode].size;
    const subtitle = size === 1 ? 'Escolha 1 aventureiro para enfrentar 1 de outra guilda' : `Escolha ${size} aventureiros para enfrentar ${size} de outra guilda`;
    const top0 = screenLayout(this, 'Duelos', subtitle);
    (Object.keys(DUEL_MODES) as DuelMode[]).forEach((m, i) => {
      new Button(this, width / 2 + (i === 0 ? -150 : 150), top0 + 10, DUEL_MODES[m].label, () => this.scene.restart({ mode: m }), {
        width: 280,
        height: 40,
      }).setSelected(this.mode === m);
    });
    const top = top0 + 50;
    const ids = new Set(guild.adventurers.map((a) => a.id));
    const team = (guild.duelTeams?.[this.mode] ?? []).filter((id) => ids.has(id));

    const toggle = (id: string) => {
      const i = team.indexOf(id);
      if (i >= 0) team.splice(i, 1);
      else if (size === 1) team.splice(0, team.length, id); // no 1x1, clicar em outro troca o duelista
      else if (team.length >= size) return toast(this, `O time já tem ${size} aventureiros. Tire um antes.`, COLORS.danger);
      else team.push(id);
      guild.duelTeams = { ...guild.duelTeams, [this.mode]: team };
      state.save();
      this.scene.restart({ page: this.page, mode: this.mode });
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
      const go = (d: number) => this.scene.restart({ page: (this.page + d + pages) % pages, mode: this.mode });
      new Button(this, 320, 670, '◀', () => go(-1), { width: 44, height: 36 });
      this.add.text(400, 670, `${this.page + 1} / ${pages}`, FONT.body).setOrigin(0.5);
      new Button(this, 480, 670, '▶', () => go(1), { width: 44, height: 36 });
    }

    // Time escolhido (direita)
    const px = 1020;
    this.add.rectangle(px, top + 205, 420, 420, COLORS.panel).setStrokeStyle(2, COLORS.gold, 0.5);
    this.add.text(px, top + 25, size === 1 ? 'Seu duelista' : `Seu time (${team.length}/${size})`, FONT.heading).setOrigin(0.5);
    for (let i = 0; i < size; i++) {
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
    new Button(this, px, top + 340, 'Procurar adversário', () => undefined, { width: 300, primary: team.length === size }).setEnabled(false);
    this.add
      .text(px, top + 390, 'Em breve: ainda não existem outras guildas para desafiar.', { ...FONT.small, align: 'center', wordWrap: { width: 360 } })
      .setOrigin(0.5);
  }
}
