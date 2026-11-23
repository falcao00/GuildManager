import * as Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { CitySelectScene } from './scenes/CitySelectScene';
import { GuildCreationScene } from './scenes/GuildCreationScene';
import { AdventurerCreationScene } from './scenes/AdventurerCreationScene';
import { GuildHallScene } from './scenes/GuildHallScene';
import { MissionsScene } from './scenes/MissionsScene';
import { RecruitmentScene } from './scenes/RecruitmentScene';
import { GuildVsGuildScene } from './scenes/GuildVsGuildScene';
import { InventoryScene } from './scenes/InventoryScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#1b1424',
  dom: { createContainer: true }, // permite campos de texto HTML (nomes)
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
  },
  scene: [BootScene, PreloadScene, CitySelectScene, GuildCreationScene, AdventurerCreationScene, GuildHallScene, MissionsScene, RecruitmentScene, GuildVsGuildScene, InventoryScene],
};

export default new Phaser.Game(config);
