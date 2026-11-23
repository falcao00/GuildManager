import * as Phaser from 'phaser';
import { CLASSES, RACES, RESOURCE_LABELS, XP_TO_NEXT_RANK } from '../data/adventurers';
import { effectiveStats, maxHealth, maxResource, resourceType, type AdventurerData } from '../systems/Adventurer';
import { formatGameDate, gameDate } from '../systems/GameClock';
import { GameState } from '../systems/GameState';
import { bar } from './AdventurerCard';
import { Button } from './Button';
import { StatBars } from './StatBars';
import { COLORS, FONT, css } from './theme';

const RESOURCE_COLOR = { mana: 0x4a7bc9, stamina: 0x5aa05a } as const;
const MAX_HISTORY_LINES = 9;

/**
 * Painel de detalhes do aventureiro (abre ao clicar nele): status, Vida, Stamina/Mana,
 * experiência, loot que está carregando e histórico de aventuras.
 */
export function adventurerPanel(scene: Phaser.Scene, a: AdventurerData) {
  const { width, height } = scene.scale;
  const pw = 940;
  const ph = 580;
  const left = width / 2 - pw / 2 + 30;
  const top = height / 2 - ph / 2;
  const colX = width / 2 + 10;

  const layer = scene.add.container(0, 0).setDepth(2000);
  const close = () => layer.destroy();
  const overlay = scene.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0).setInteractive();
  overlay.on('pointerup', close);
  // O painel bloqueia o clique para não fechar ao clicar dentro dele.
  const panel = scene.add.rectangle(width / 2, height / 2, pw, ph, COLORS.panel).setStrokeStyle(3, COLORS.gold).setInteractive();
  layer.add([overlay, panel]);

  // Cabeçalho
  layer.add([
    scene.add.text(left, top + 40, a.name, FONT.title).setOrigin(0, 0.5),
    scene.add.rectangle(left + pw - 110, top + 40, 56, 40, COLORS.gold),
    scene.add.text(left + pw - 110, top + 40, a.rank, { ...FONT.heading, color: css(COLORS.bg) }).setOrigin(0.5),
    scene.add.text(left, top + 82, `${CLASSES[a.classId].name} · ${RACES[a.raceId].name}`, FONT.body).setOrigin(0, 0.5),
  ]);

  // Coluna da esquerda: status e recursos
  const colW = pw / 2 - 60;
  layer.add(scene.add.text(left, top + 125, 'Status', { ...FONT.heading, fontSize: '22px' }).setOrigin(0, 0.5));
  const stats = new StatBars(scene, left, top + 165, colW - 160, 120, 32);
  stats.setStats(effectiveStats(a));
  layer.add(stats);
  const res = resourceType(a);
  const resources = scene.add.container(0, 0);
  bar(scene, resources, left, top + 275, colW, 'Vida', a.health, maxHealth(a), COLORS.danger);
  bar(scene, resources, left, top + 325, colW, RESOURCE_LABELS[res], a.resource, maxResource(a), RESOURCE_COLOR[res]);
  const next = XP_TO_NEXT_RANK[a.rank];
  if (next === null) resources.add(scene.add.text(left, top + 375, 'Rank máximo', FONT.small).setOrigin(0, 0.5));
  else bar(scene, resources, left, top + 375, colW, 'Experiência', a.xp, next, COLORS.gold);
  layer.add(resources);

  // Coluna da direita: loot e histórico
  layer.add(scene.add.text(colX, top + 125, 'Loot carregado', { ...FONT.heading, fontSize: '22px' }).setOrigin(0, 0.5));
  const items = a.items ?? [];
  const itemText = items.length ? items.map((it) => `${it.name}${it.quantity > 1 ? ` ×${it.quantity}` : ''}`).join('\n') : 'Nenhum item no momento.';
  layer.add(scene.add.text(colX, top + 150, itemText, { ...FONT.body, lineSpacing: 4, wordWrap: { width: colW } }).setOrigin(0, 0));

  layer.add(scene.add.text(colX, top + 255, 'Histórico de aventuras', { ...FONT.heading, fontSize: '22px' }).setOrigin(0, 0.5));
  const history = [...(a.history ?? [])].reverse(); // mais recente primeiro
  const foundedAt = GameState.readSave()?.foundedAt ?? Date.now();
  if (!history.length) {
    layer.add(scene.add.text(colX, top + 280, 'Nenhuma aventura ainda.', FONT.body).setOrigin(0, 0));
  } else {
    history.slice(0, MAX_HISTORY_LINES).forEach((h, i) => {
      const y = top + 290 + i * 26;
      layer.add([
        scene.add.text(colX, y, formatGameDate(gameDate(foundedAt, h.at)), { ...FONT.small, color: css(COLORS.gold) }).setOrigin(0, 0.5),
        scene.add.text(colX + 130, y, h.text, { ...FONT.small, color: css(COLORS.text) }).setOrigin(0, 0.5),
      ]);
    });
    if (history.length > MAX_HISTORY_LINES) {
      layer.add(scene.add.text(colX, top + 290 + MAX_HISTORY_LINES * 26, `e mais ${history.length - MAX_HISTORY_LINES} registros antigos`, FONT.small).setOrigin(0, 0.5));
    }
  }

  layer.add(new Button(scene, width / 2, top + ph - 40, 'Fechar', close, { width: 200 }));
  return layer;
}
