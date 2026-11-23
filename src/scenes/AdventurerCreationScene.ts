import * as Phaser from 'phaser';
import { CLASSES, RACES, RESOURCE_LABELS } from '../data/adventurers';
import { STARTING_ADVENTURERS } from '../data/config';
import { effectiveStats, maxHealth, maxResource, resourceType, type AdventurerData } from '../systems/Adventurer';
import { generateAdventurers } from '../systems/AdventurerGenerator';
import { GameState } from '../systems/GameState';
import { Button } from '../ui/Button';
import { StatBars } from '../ui/StatBars';
import { createTextInput } from '../ui/TextInput';
import { COLORS, FONT, css } from '../ui/theme';
import type { GuildDraft } from './GuildCreationScene';

type DraftWithAdventurers = GuildDraft & { adventurers?: AdventurerData[] };

/**
 * Passo 2: os aventureiros iniciais. Classe, raça e status são sorteados;
 * o jogador só escolhe o nome (vem um sugerido, que dá para editar).
 */
export class AdventurerCreationScene extends Phaser.Scene {
  private draft!: DraftWithAdventurers;
  private adventurers: AdventurerData[] = [];
  private finishEdits: (() => void)[] = [];

  constructor() {
    super('AdventurerCreation');
  }

  init(data: DraftWithAdventurers) {
    this.draft = data;
    // Mantém os mesmos aventureiros se o jogador voltar e avançar de novo.
    this.adventurers = data.adventurers ?? generateAdventurers(STARTING_ADVENTURERS);
    this.draft.adventurers = this.adventurers;
    this.finishEdits = [];
  }

  create() {
    const { width } = this.scale;
    this.add.text(width / 2, 40, `Aventureiros da guilda ${this.draft.guildName}`, { ...FONT.title, fontSize: '34px' }).setOrigin(0.5);
    this.add.text(width / 2, 78, `Passo 2 de 2: estes são seus ${STARTING_ADVENTURERS} primeiros aventureiros. Você pode mudar os nomes.`, FONT.small).setOrigin(0.5);

    const colW = 380;
    const gap = 25;
    const startX = width / 2 - ((colW + gap) * this.adventurers.length - gap) / 2 + colW / 2;
    this.adventurers.forEach((a, i) => this.card(a, startX + i * (colW + gap), colW));

    const error = this.add.text(width / 2, 690, '', { ...FONT.body, color: css(COLORS.danger) }).setOrigin(0.5);
    new Button(this, 120, 690, 'Voltar', () => {
      this.finishEdits.forEach((f) => f());
      this.scene.start('GuildCreation', this.draft);
    }, { width: 180 });
    new Button(this, width - 140, 690, 'Fundar guilda', () => {
      this.finishEdits.forEach((f) => f());
      const missing = this.adventurers.findIndex((a) => a.name.trim().length < 2);
      if (missing >= 0) {
        error.setText(`O aventureiro ${missing + 1} precisa de um nome (mínimo 2 letras).`);
        return;
      }
      GameState.newGame(this.draft.city, {
        name: this.draft.guildName,
        emblem: this.draft.emblem,
        adventurers: this.adventurers,
      });
      this.scene.start('GuildHall');
    }, { width: 220, primary: true });
  }

  private card(a: AdventurerData, cx: number, colW: number) {
    this.add.rectangle(cx, 380, colW, 540, COLORS.panel).setStrokeStyle(2, COLORS.gold, 0.5);

    // Nome + botão de editar
    const nameText = this.add.text(cx, 145, a.name, FONT.heading).setOrigin(0.5);
    let input: HTMLInputElement | null = null;
    let inputObj: Phaser.GameObjects.DOMElement | null = null;
    const finish = () => {
      if (!input) return;
      const v = input.value.trim();
      if (v.length >= 2) a.name = v;
      nameText.setText(a.name).setVisible(true);
      inputObj?.destroy();
      input = null;
      inputObj = null;
      editBtn.setText('Editar nome');
    };
    const editBtn = new Button(this, cx, 200, 'Editar nome', () => {
      if (input) return finish();
      nameText.setVisible(false);
      ({ input, element: inputObj } = createTextInput(this, cx, 145, 300, 'Nome do aventureiro', 20));
      input!.value = a.name;
      input!.focus();
      input!.select();
      input!.addEventListener('keydown', (e) => { if (e.key === 'Enter') finish(); });
      editBtn.setText('OK');
    }, { width: 160, height: 36, fontSize: 16 });
    this.finishEdits.push(finish);

    // Rank, classe e raça (sorteados)
    this.add.rectangle(cx, 265, 60, 40, COLORS.gold);
    this.add.text(cx, 265, a.rank, { ...FONT.heading, color: css(COLORS.bg) }).setOrigin(0.5);
    this.add.text(cx, 320, `${CLASSES[a.classId].name} · ${RACES[a.raceId].name}`, { ...FONT.heading, fontSize: '22px', color: css(COLORS.text) }).setOrigin(0.5);

    new StatBars(this, cx - 150, 400, 140).setStats(effectiveStats(a));
    this.add.text(cx, 510, `Vida ${maxHealth(a)}`, FONT.body).setOrigin(0.5);
    this.add.text(cx, 545, `${RESOURCE_LABELS[resourceType(a)]} ${maxResource(a)}`, FONT.body).setOrigin(0.5);
  }
}
