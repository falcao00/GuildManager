import * as Phaser from 'phaser';
import { screenLayout } from '../ui/ScreenLayout';
import { FONT } from '../ui/theme';

/** Missões. Ainda sem nenhuma missão cadastrada. */
export class MissionsScene extends Phaser.Scene {
  constructor() {
    super('Missions');
  }

  create() {
    screenLayout(this, 'Missões');
    this.add.text(this.scale.width / 2, 380, 'Nenhuma missão disponível ainda.', FONT.body).setOrigin(0.5);
  }
}
