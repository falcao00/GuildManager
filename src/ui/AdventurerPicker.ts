import * as Phaser from 'phaser';
import { CLASSES, RACES } from '../data/adventurers';
import type { AdventurerData } from '../systems/Adventurer';
import { GameState } from '../systems/GameState';
import { Button } from './Button';
import { COLORS, FONT, css } from './theme';

/**
 * Lista paginada de aventureiros da guilda para escolher um (Campo de Treino, Labirinto...).
 * Cada linha mostra nome, rank, classe/raça e um texto de situação à direita.
 */
export function adventurerPicker(
  scene: Phaser.Scene,
  opts: {
    x: number;
    y: number;
    width: number;
    page: number;
    selectedId?: string;
    status: (a: AdventurerData) => string;
    onSelect: (a: AdventurerData) => void;
    onPage: (page: number) => void;
    rowsPerPage?: number;
  },
) {
  const rowsPerPage = opts.rowsPerPage ?? 7;
  const list = GameState.get().guild.adventurers;
  const pages = Math.max(1, Math.ceil(list.length / rowsPerPage));
  const page = Math.min(opts.page, pages - 1);
  const cx = opts.x + opts.width / 2;
  scene.add.text(opts.x, opts.y, 'Seus aventureiros (clique para escolher)', { ...FONT.small, color: css(COLORS.gold) }).setOrigin(0, 0.5);
  list.slice(page * rowsPerPage, (page + 1) * rowsPerPage).forEach((a, i) => {
    const y = opts.y + 40 + i * 50;
    const selected = a.id === opts.selectedId;
    scene.add
      .rectangle(cx, y, opts.width, 44, selected ? COLORS.panelLight : COLORS.panel)
      .setStrokeStyle(2, COLORS.gold, selected ? 1 : 0.2)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => opts.onSelect(a));
    scene.add.text(opts.x + 16, y - 9, a.name, FONT.body).setOrigin(0, 0.5);
    scene.add.text(opts.x + 16, y + 12, `${a.rank} · ${CLASSES[a.classId].name} · ${RACES[a.raceId].name}`, { ...FONT.small, fontSize: '13px' }).setOrigin(0, 0.5);
    const status = opts.status(a);
    scene.add
      .text(opts.x + opts.width - 16, y, status, { ...FONT.small, color: css(a.activity ? COLORS.gold : COLORS.muted) })
      .setOrigin(1, 0.5);
  });
  if (pages > 1) {
    const py = opts.y + 40 + rowsPerPage * 50;
    new Button(scene, cx - 80, py, '◀', () => opts.onPage((page - 1 + pages) % pages), { width: 44, height: 36 });
    scene.add.text(cx, py, `${page + 1} / ${pages}`, FONT.body).setOrigin(0.5);
    new Button(scene, cx + 80, py, '▶', () => opts.onPage((page + 1) % pages), { width: 44, height: 36 });
  }
}
