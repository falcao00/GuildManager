import * as Phaser from 'phaser';
import { GameState } from '../systems/GameState';
import { screenLayout } from '../ui/ScreenLayout';
import { COLORS, FONT, css } from '../ui/theme';

const COLS = 8;
const MAX_SLOT = 76;
const GAP = 10;

/** Inventário da guilda: dinheiro e loot. O número de espaços vem do Arsenal (Melhorias). */
export class InventoryScene extends Phaser.Scene {
  constructor() {
    super('Inventory');
  }

  create() {
    const state = GameState.get();
    const { guild } = state;
    const { width } = this.scale;
    const top = screenLayout(this, 'Inventário da Guilda');

    // Dinheiro
    this.add.rectangle(width / 2, top + 45, 560, 70, COLORS.panel).setStrokeStyle(2, COLORS.gold, 0.5);
    this.add.text(width / 2 - 250, top + 45, 'Ouro', FONT.heading).setOrigin(0, 0.5);
    this.add.text(width / 2 + 250, top + 45, String(guild.gold), { ...FONT.title, fontSize: '34px' }).setOrigin(1, 0.5);

    // Loot
    const items = guild.inventory ?? [];
    const slots = state.lootSlots;
    this.add.text(width / 2, top + 120, `Loot (${items.length}/${slots})`, FONT.heading).setOrigin(0.5);
    const ROWS = Math.ceil(slots / COLS);
    // Encolhe os espaços se o Arsenal tiver muitas linhas, para caber na tela.
    const SLOT = Math.min(MAX_SLOT, Math.floor((this.scale.height - (top + 170) - 50) / ROWS) - GAP);
    const gridW = COLS * SLOT + (COLS - 1) * GAP;
    const x0 = width / 2 - gridW / 2 + SLOT / 2;
    const y0 = top + 170 + SLOT / 2;
    for (let i = 0; i < slots; i++) {
      const x = x0 + (i % COLS) * (SLOT + GAP);
      const y = y0 + Math.floor(i / COLS) * (SLOT + GAP);
      this.add.rectangle(x, y, SLOT, SLOT, COLORS.panel).setStrokeStyle(1, COLORS.muted, 0.4);
      const item = items[i];
      if (item) {
        this.add.text(x, y, item.name, { ...FONT.small, color: css(COLORS.text), align: 'center', wordWrap: { width: SLOT - 8 } }).setOrigin(0.5);
        if (item.quantity > 1) this.add.text(x + SLOT / 2 - 6, y + SLOT / 2 - 4, `x${item.quantity}`, FONT.small).setOrigin(1);
      }
    }
    if (!items.length) {
      this.add.text(width / 2, y0 + ROWS * (SLOT + GAP) - SLOT / 2 + 14, 'Nenhum item ainda. O loot das missões vai aparecer aqui.', FONT.small).setOrigin(0.5);
    }
  }
}
