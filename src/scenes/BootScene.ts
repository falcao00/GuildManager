import * as Phaser from 'phaser';

/** Primeira cena: configurações mínimas antes de carregar os assets. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    this.scene.start('Preload');
  }
}
