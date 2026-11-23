import * as Phaser from 'phaser';
import { CLASSES, RACES, RESOURCE_LABELS, XP_TO_NEXT_RANK } from '../data/adventurers';
import { effectiveStats, maxHealth, maxResource, resourceType, type AdventurerData } from '../systems/Adventurer';
import { adventurerPanel } from './AdventurerPanel';
import { StatBars } from './StatBars';
import { COLORS, FONT, css } from './theme';

const RESOURCE_COLOR = { mana: 0x4a7bc9, stamina: 0x5aa05a } as const;

/**
 * Cartão de aventureiro. Clicar no cartão abre o painel com os detalhes.
 * - full: nome, rank, classe/raça, status, Vida, Stamina/Mana e experiência (salão).
 * - compact: versão menor para listas (recrutamento, Guilda vs Guilda).
 */
export function adventurerCard(
  scene: Phaser.Scene,
  cx: number,
  cy: number,
  w: number,
  h: number,
  a: AdventurerData,
  mode: 'full' | 'compact' = 'full',
) {
  const c = scene.add.container(cx, cy);
  const top = -h / 2;
  const left = -w / 2 + 16;
  const bg = scene.add.rectangle(0, 0, w, h, COLORS.panel).setStrokeStyle(2, COLORS.gold, 0.5);
  const headingSize = mode === 'full' ? '26px' : '21px';
  c.add([
    bg,
    scene.add.text(left, top + 26, a.name, { ...FONT.heading, fontSize: headingSize }).setOrigin(0, 0.5),
    scene.add.rectangle(w / 2 - 34, top + 26, 44, 32, COLORS.gold),
    scene.add.text(w / 2 - 34, top + 26, a.rank, { ...FONT.heading, fontSize: '22px', color: css(COLORS.bg) }).setOrigin(0.5),
    scene.add.text(left, top + 56, `${CLASSES[a.classId].name} · ${RACES[a.raceId].name}`, FONT.small).setOrigin(0, 0.5),
  ]);

  const res = resourceType(a);
  if (mode === 'full') {
    c.add(new StatBars(scene, left, top + 96, w - 210, 110));
    (c.last as StatBars).setStats(effectiveStats(a));
    bar(scene, c, left, top + 190, w - 32, 'Vida', a.health, maxHealth(a), COLORS.danger);
    bar(scene, c, left, top + 235, w - 32, RESOURCE_LABELS[res], a.resource, maxResource(a), RESOURCE_COLOR[res]);
    const next = XP_TO_NEXT_RANK[a.rank];
    if (next === null) c.add(scene.add.text(left, top + 280, 'Rank máximo', FONT.small).setOrigin(0, 0.5));
    else bar(scene, c, left, top + 280, w - 32, 'Experiência', a.xp, next, COLORS.gold);
  } else {
    const stats = new StatBars(scene, left, top + 90, w - 150, 92, 24);
    stats.setStats(effectiveStats(a));
    c.add(stats);
    c.add(scene.add.text(left, top + 160, `Vida ${maxHealth(a)} · ${RESOURCE_LABELS[res]} ${maxResource(a)}`, FONT.small).setOrigin(0, 0.5));
  }
  bg.setInteractive({ useHandCursor: true });
  bg.on('pointerup', () => adventurerPanel(scene, a));
  return { container: c, background: bg };
}

export function bar(scene: Phaser.Scene, c: Phaser.GameObjects.Container, x: number, y: number, w: number, label: string, value: number, max: number, color: number) {
  c.add([
    scene.add.text(x, y, label, FONT.small).setOrigin(0, 0.5),
    scene.add.text(x + w, y, `${value} / ${max}`, FONT.small).setOrigin(1, 0.5),
    scene.add.rectangle(x, y + 18, w, 10, COLORS.bg).setOrigin(0, 0.5),
    scene.add.rectangle(x, y + 18, (w * Math.min(value, max)) / max, 10, color).setOrigin(0, 0.5),
  ]);
}

