import * as Phaser from 'phaser';
import { generatePresetEmblems } from '../ui/emblems';

/** Carrega todos os assets do jogo e mostra uma barra de progresso. */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    const { width, height } = this.scale;
    const bar = this.add.rectangle(width / 2 - 200, height / 2, 0, 16, 0xe0b04a).setOrigin(0, 0.5);
    this.add.rectangle(width / 2, height / 2, 404, 20).setStrokeStyle(2, 0xe0b04a);

    this.load.on('progress', (p: number) => {
      bar.width = 400 * p;
    });

    // Coloque os assets em public/assets e carregue aqui, por exemplo:
    // this.load.image('logo', 'assets/logo.png');
  }

  create() {
    generatePresetEmblems(this);
    this.scene.start('CitySelect');
  }
}
