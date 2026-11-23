import * as Phaser from 'phaser';
import { TRAINING_DURATION_MS, TRAINING_ENERGY_COST, TRAINING_GAIN, type TrainableStat } from '../data/activities';
import { STAT_LABELS } from '../data/adventurers';
import { STAT_MAX } from '../data/config';
import { activityLabel, formatDuration, GameState } from '../systems/GameState';
import { adventurerPicker } from '../ui/AdventurerPicker';
import { Button } from '../ui/Button';
import { toast } from '../ui/Dialog';
import { screenLayout } from '../ui/ScreenLayout';
import { StatBars } from '../ui/StatBars';
import { COLORS, FONT } from '../ui/theme';

/** Campo de Treino: o aventureiro treina um status por algumas horas e ganha +1 nele (máximo 10). */
export class TrainingScene extends Phaser.Scene {
  private page = 0;
  private selectedId?: string;

  constructor() {
    super('Training');
  }

  init(data: { page?: number; selectedId?: string }) {
    this.page = data.page ?? 0;
    this.selectedId = data.selectedId;
  }

  create() {
    const state = GameState.get();
    const top = screenLayout(
      this,
      'Campo de Treino',
      `Treinar custa ${TRAINING_ENERGY_COST} de energia e leva ${formatDuration(TRAINING_DURATION_MS)}: +${TRAINING_GAIN} no status escolhido (máximo ${STAT_MAX})`,
    );
    const restart = (d: { page?: number; selectedId?: string } = {}) =>
      this.scene.restart({ page: this.page, selectedId: this.selectedId, ...d });

    adventurerPicker(this, {
      x: 40,
      y: top + 10,
      width: 700,
      page: this.page,
      selectedId: this.selectedId,
      status: (a) => activityLabel(a),
      onSelect: (a) => restart({ selectedId: a.id }),
      onPage: (page) => restart({ page }),
    });

    // Painel da direita
    const px = 1020;
    const py = top + 215;
    this.add.rectangle(px, py, 420, 430, COLORS.panel).setStrokeStyle(2, COLORS.gold, 0.5);
    const a = this.selectedId ? state.adventurer(this.selectedId) : undefined;
    if (!a) {
      this.add.text(px, py, 'Escolha um aventureiro na lista.', FONT.body).setOrigin(0.5);
      return;
    }
    const t = py - 215;
    this.add.text(px, t + 30, a.name, FONT.heading).setOrigin(0.5);
    const bars = new StatBars(this, px - 185, t + 75, 170, 110, 30);
    bars.setStats(a.stats);
    this.add.text(px - 185, t + 160, 'Status base (sem itens e buffs)', FONT.small).setOrigin(0, 0.5);

    const act = a.activity;
    if (act?.kind === 'labirinto') {
      this.add.text(px, t + 250, `${a.name} está no Labirinto.\nRetire-o de lá para treinar.`, { ...FONT.body, align: 'center' }).setOrigin(0.5);
      return;
    }
    if (act?.kind === 'treino') {
      const status = this.add.text(px, t + 220, '', { ...FONT.body, align: 'center' }).setOrigin(0.5);
      const refresh = () => status.setText(activityLabel(a));
      refresh();
      this.time.addEvent({ delay: 30_000, loop: true, callback: refresh });
      if (Date.now() >= act.until) {
        new Button(this, px, t + 290, 'Concluir treino', () => {
          const error = state.finishTraining(a.id);
          if (error) return toast(this, error, COLORS.danger);
          toast(this, `${a.name} ganhou +${TRAINING_GAIN} de ${STAT_LABELS[act.stat]}!`);
          this.time.delayedCall(600, () => restart());
        }, { width: 300, primary: true });
      } else {
        new Button(this, px, t + 290, 'Desistir do treino', () => {
          state.cancelTraining(a.id);
          restart();
        }, { width: 300 });
        this.add.text(px, t + 330, 'A energia gasta não volta.', FONT.small).setOrigin(0.5);
      }
      return;
    }

    this.add.text(px, t + 205, 'Treinar qual status?', FONT.body).setOrigin(0.5);
    (Object.keys(STAT_LABELS) as TrainableStat[]).forEach((stat, i) => {
      const maxed = a.stats[stat] >= STAT_MAX;
      new Button(this, px, t + 250 + i * 54, maxed ? `${STAT_LABELS[stat]} (máximo)` : `Treinar ${STAT_LABELS[stat]}  +${TRAINING_GAIN}`, () => {
        const error = state.startTraining(a.id, stat);
        if (error) return toast(this, error, COLORS.danger);
        restart();
      }, { width: 300, height: 44 }).setEnabled(!maxed);
    });
  }
}
