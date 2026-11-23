import * as Phaser from 'phaser';
import { GameState } from '../systems/GameState';
import { screenLayout } from '../ui/ScreenLayout';
import { FONT } from '../ui/theme';

/** Missões. Ainda sem nenhuma missão cadastrada. O Quadro de Missões (Melhorias) define quantas ficam disponíveis. */
export class MissionsScene extends Phaser.Scene {
  constructor() {
    super('Missions');
  }

  create() {
    const state = GameState.get();
    screenLayout(this, 'Missões', `Quadro de Missões: até ${state.missionSlots} missões disponíveis`);
    this.add.text(this.scale.width / 2, 380, 'Nenhuma missão disponível ainda.', FONT.body).setOrigin(0.5);
  }
}
