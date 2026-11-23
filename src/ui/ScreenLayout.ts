import * as Phaser from 'phaser';
import { Button } from './Button';
import { TopBar, TOP_BAR_HEIGHT } from './TopBar';
import { FONT } from './theme';

/** Moldura padrão das telas da guilda: barra superior, título e botão de voltar ao salão. Devolve o Y onde o conteúdo começa. */
export function screenLayout(scene: Phaser.Scene, title: string, subtitle?: string): number {
  new TopBar(scene);
  const y = TOP_BAR_HEIGHT + 40;
  new Button(scene, 110, y, '← Salão', () => scene.scene.start('GuildHall'), { width: 160, height: 38, fontSize: 16 });
  scene.add.text(scene.scale.width / 2, y, title, { ...FONT.title, fontSize: '36px' }).setOrigin(0.5);
  if (subtitle) scene.add.text(scene.scale.width / 2, y + 36, subtitle, FONT.small).setOrigin(0.5);
  return y + (subtitle ? 66 : 46);
}
