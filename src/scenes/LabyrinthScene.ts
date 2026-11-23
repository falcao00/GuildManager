import * as Phaser from 'phaser';
import { LABYRINTH_ENERGY_COST, LABYRINTH_GOLD_PER_HOUR, LABYRINTH_LOOT_CHANCE_PER_HOUR } from '../data/activities';
import { activityLabel, formatDuration, GameState } from '../systems/GameState';
import { adventurerPicker } from '../ui/AdventurerPicker';
import { Button } from '../ui/Button';
import { toast } from '../ui/Dialog';
import { screenLayout } from '../ui/ScreenLayout';
import { COLORS, FONT, css } from '../ui/theme';

/**
 * Labirinto, a Dungeon Eterna: o aventureiro fica lá pelo tempo que o mestre quiser,
 * achando ouro e loot a cada hora real. Enquanto está lá, não pode fazer mais nada.
 */
export class LabyrinthScene extends Phaser.Scene {
  private page = 0;
  private selectedId?: string;

  constructor() {
    super('Labyrinth');
  }

  init(data: { page?: number; selectedId?: string }) {
    this.page = data.page ?? 0;
    this.selectedId = data.selectedId;
  }

  create() {
    const state = GameState.get();
    const top = screenLayout(
      this,
      'Labirinto',
      `A Dungeon Eterna: entrar custa ${LABYRINTH_ENERGY_COST} de energia; o aventureiro acha ouro e loot a cada hora até você retirá-lo`,
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

    const px = 1020;
    const py = top + 215;
    this.add.rectangle(px, py, 420, 430, COLORS.panel).setStrokeStyle(2, COLORS.gold, 0.5);
    const a = this.selectedId ? state.adventurer(this.selectedId) : undefined;
    if (!a) {
      this.add.text(px, py, 'Escolha um aventureiro na lista.', FONT.body).setOrigin(0.5);
      return;
    }
    const t = py - 215;
    const rate = LABYRINTH_GOLD_PER_HOUR[a.rank];
    this.add.text(px, t + 30, `${a.name}  (${a.rank})`, FONT.heading).setOrigin(0.5);
    this.add
      .text(px, t + 75, `Rank ${a.rank}: ${rate} de ouro por hora\n${Math.round(LABYRINTH_LOOT_CHANCE_PER_HOUR * 100)}% de chance de achar um item a cada hora`, {
        ...FONT.small,
        align: 'center',
      })
      .setOrigin(0.5);

    const act = a.activity;
    if (act?.kind === 'treino') {
      this.add.text(px, t + 220, `${a.name} está no Campo de Treino.\nEspere o treino acabar.`, { ...FONT.body, align: 'center' }).setOrigin(0.5);
      return;
    }
    if (act?.kind === 'labirinto') {
      const time = this.add.text(px, t + 150, '', FONT.body).setOrigin(0.5);
      const gold = this.add.text(px, t + 200, '', { ...FONT.title, fontSize: '36px' }).setOrigin(0.5);
      this.add.text(px, t + 238, 'de ouro acumulado', FONT.small).setOrigin(0.5);
      const refresh = () => {
        const p = state.labyrinthProgress(a);
        time.setText(`Lá dentro há ${formatDuration(p.elapsedMs)}`);
        gold.setText(String(p.gold));
      };
      refresh();
      this.time.addEvent({ delay: 30_000, loop: true, callback: refresh });
      this.add.text(px, t + 275, 'Os itens são revelados quando ele sair.', FONT.small).setOrigin(0.5);
      new Button(this, px, t + 330, 'Retirar do Labirinto', () => {
        const result = state.leaveLabyrinth(a.id);
        if (typeof result === 'string') return toast(this, result, COLORS.danger);
        const items = result.items.length ? ` e achou: ${result.items.join(', ')}` : '';
        toast(this, `${a.name} voltou com ${result.gold} de ouro${items}.`, COLORS.gold);
        this.time.delayedCall(1500, () => restart());
      }, { width: 300, primary: true });
      return;
    }

    this.add.text(px, t + 170, `${a.name} está livre no salão.`, FONT.body).setOrigin(0.5);
    this.add
      .text(px, t + 215, 'Enquanto estiver no Labirinto, ele não pode treinar,\nduelar nem ser liberado.', {
        ...FONT.small,
        align: 'center',
        color: css(COLORS.muted),
      })
      .setOrigin(0.5);
    new Button(this, px, t + 290, `Enviar ao Labirinto (${LABYRINTH_ENERGY_COST} energia)`, () => {
      const error = state.enterLabyrinth(a.id);
      if (error) return toast(this, error, COLORS.danger);
      restart();
    }, { width: 340, primary: true });
  }
}
