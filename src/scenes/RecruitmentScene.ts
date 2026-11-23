import * as Phaser from 'phaser';
import { CLASSES, RACES } from '../data/adventurers';
import { RECRUIT_COST, rankOddsFor } from '../data/recruitment';
import { effectiveStats, maxHealth } from '../systems/Adventurer';
import { msUntilNextDay } from '../systems/GameClock';
import { GameState } from '../systems/GameState';
import { adventurerCard, combatSummary } from '../ui/AdventurerCard';
import { Button } from '../ui/Button';
import { confirmDialog, toast } from '../ui/Dialog';
import { screenLayout } from '../ui/ScreenLayout';
import { COLORS, FONT, css } from '../ui/theme';

type Tab = 'candidates' | 'roster';
const ROWS_PER_PAGE = 8;

/**
 * Recrutamento: 5 candidatos por dia (somem na virada do dia) e a lista dos
 * aventureiros da guilda, com a opção de liberá-los.
 */
export class RecruitmentScene extends Phaser.Scene {
  private tab: Tab = 'candidates';
  private page = 0;

  constructor() {
    super('Recruitment');
  }

  init(data: { tab?: Tab; page?: number }) {
    this.tab = data.tab ?? 'candidates';
    this.page = data.page ?? 0;
  }

  create() {
    const state = GameState.get();
    const { guild } = state;
    const top = screenLayout(this, 'Recrutamento', `Ouro ${guild.gold}   ·   Prestígio ${guild.prestige}`);
    const { width } = this.scale;

    const tabs: [Tab, string][] = [
      ['candidates', 'Candidatos de hoje'],
      ['roster', `Seus aventureiros (${guild.adventurers.length})`],
    ];
    tabs.forEach(([id, label], i) => {
      new Button(this, width / 2 + (i === 0 ? -150 : 150), top + 10, label, () => this.scene.restart({ tab: id }), {
        width: 280,
        height: 40,
      }).setSelected(this.tab === id);
    });

    if (this.tab === 'candidates') this.showCandidates(top + 60);
    else this.showRoster(top + 60);
  }

  private showCandidates(y: number) {
    const state = GameState.get();
    const { width } = this.scale;
    const candidates = state.getCandidates();

    const ms = msUntilNextDay();
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    const odds = Object.entries(rankOddsFor(state.guild.prestige))
      .map(([rank, p]) => `${rank} ${p}%`)
      .join(' · ');
    this.add.text(width / 2, y, `Novos candidatos em ${h}h ${String(m).padStart(2, '0')}min   ·   Chances de rank: ${odds}`, FONT.small).setOrigin(0.5);

    if (!candidates.length) {
      this.add.text(width / 2, y + 180, 'Você já recrutou todos os candidatos de hoje. Volte amanhã!', FONT.body).setOrigin(0.5);
      return;
    }

    const cardW = 228;
    const gap = 14;
    const cardH = 300;
    const startX = width / 2 - ((cardW + gap) * candidates.length - gap) / 2 + cardW / 2;
    const cy = y + 40 + cardH / 2;
    candidates.forEach((c, i) => {
      const x = startX + i * (cardW + gap);
      adventurerCard(this, x, cy, cardW, cardH, c, 'compact');
      const cost = RECRUIT_COST[c.rank];
      const affordable = state.guild.gold >= cost;
      this.add
        .text(x, cy + 80, `${cost} de ouro`, { ...FONT.heading, fontSize: '20px', color: css(affordable ? COLORS.gold : COLORS.danger) })
        .setOrigin(0.5);
      new Button(this, x, cy + 122, 'Recrutar', () => {
        const error = state.recruit(c.id);
        if (error) return toast(this, error, COLORS.danger);
        this.scene.restart({ tab: 'candidates' });
      }, { width: cardW - 30, height: 38, primary: affordable }).setEnabled(affordable);
    });
  }

  private showRoster(y: number) {
    const state = GameState.get();
    const { width } = this.scale;
    const list = state.guild.adventurers;
    const pages = Math.max(1, Math.ceil(list.length / ROWS_PER_PAGE));
    this.page = Math.min(this.page, pages - 1);

    const cols = { name: 60, rank: 250, kind: 300, stats: 480, health: 610, combat: 730, action: 1170 };
    const headerStyle = { ...FONT.small, color: css(COLORS.gold) };
    this.add.text(cols.name, y, 'Nome', headerStyle).setOrigin(0, 0.5);
    this.add.text(cols.rank, y, 'Rank', headerStyle).setOrigin(0, 0.5);
    this.add.text(cols.kind, y, 'Classe · Raça', headerStyle).setOrigin(0, 0.5);
    this.add.text(cols.stats, y, 'For / Vel / Int', headerStyle).setOrigin(0, 0.5);
    this.add.text(cols.health, y, 'Vida', headerStyle).setOrigin(0, 0.5);
    this.add.text(cols.combat, y, 'Combate', headerStyle).setOrigin(0, 0.5);

    list.slice(this.page * ROWS_PER_PAGE, (this.page + 1) * ROWS_PER_PAGE).forEach((a, i) => {
      const ry = y + 40 + i * 50;
      this.add.rectangle(width / 2, ry, width - 80, 44, i % 2 ? COLORS.bg : COLORS.panel);
      const s = effectiveStats(a);
      this.add.text(cols.name, ry, a.name, FONT.body).setOrigin(0, 0.5);
      this.add.text(cols.rank, ry, a.rank, { ...FONT.body, color: css(COLORS.gold) }).setOrigin(0, 0.5);
      this.add.text(cols.kind, ry, `${CLASSES[a.classId].name} · ${RACES[a.raceId].name}`, FONT.body).setOrigin(0, 0.5);
      this.add.text(cols.stats, ry, `${s.strength} / ${s.speed} / ${s.intelligence}`, FONT.body).setOrigin(0, 0.5);
      this.add.text(cols.health, ry, `${a.health} / ${maxHealth(a)}`, FONT.body).setOrigin(0, 0.5);
      this.add.text(cols.combat, ry, combatSummary(a), { ...FONT.body, fontSize: '16px' }).setOrigin(0, 0.5);
      new Button(this, cols.action, ry, 'Liberar', () => {
        confirmDialog(this, {
          title: `Liberar ${a.name}?`,
          message: `${a.name} vai deixar a guilda para sempre. O ouro gasto no recrutamento não volta.`,
          confirmLabel: 'Liberar',
          onConfirm: () => {
            const error = state.release(a.id);
            if (error) return toast(this, error, COLORS.danger);
            this.scene.restart({ tab: 'roster', page: this.page });
          },
        });
      }, { width: 120, height: 34, fontSize: 16 }).setEnabled(list.length > 1);
    });

    if (list.length <= 1) {
      this.add.text(width / 2, 640, 'A guilda precisa ter pelo menos 1 aventureiro.', FONT.small).setOrigin(0.5);
    }
    if (pages > 1) {
      const go = (d: number) => this.scene.restart({ tab: 'roster', page: (this.page + d + pages) % pages });
      new Button(this, width / 2 - 80, 670, '◀', () => go(-1), { width: 44, height: 36 });
      this.add.text(width / 2, 670, `${this.page + 1} / ${pages}`, FONT.body).setOrigin(0.5);
      new Button(this, width / 2 + 80, 670, '▶', () => go(1), { width: 44, height: 36 });
    }
  }
}
