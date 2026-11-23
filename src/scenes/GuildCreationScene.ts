import * as Phaser from 'phaser';
import { getCity, type CityId } from '../data/world';
import type { GuildEmblem } from '../systems/GameState';
import { Button } from '../ui/Button';
import { loadEmblemTexture, pickImageFromComputer, PRESET_EMBLEMS } from '../ui/emblems';
import { createTextInput } from '../ui/TextInput';
import { COLORS, FONT, css } from '../ui/theme';

export type GuildDraft = { city: CityId; guildName: string; emblem: GuildEmblem };

/** Passo 1: nome e símbolo da guilda. */
export class GuildCreationScene extends Phaser.Scene {
  private draft!: GuildDraft;
  private preview!: Phaser.GameObjects.Image;
  private presetButtons: { id: string; frame: Phaser.GameObjects.Rectangle }[] = [];
  private uploadFrame!: Phaser.GameObjects.Rectangle;

  constructor() {
    super('GuildCreation');
  }

  init(data: Partial<GuildDraft> & { city: CityId }) {
    this.draft = {
      city: data.city,
      guildName: data.guildName ?? '',
      emblem: data.emblem ?? { kind: 'preset', id: PRESET_EMBLEMS[0].id },
    };
    this.presetButtons = [];
  }

  create() {
    const { width } = this.scale;
    const city = getCity(this.draft.city);
    this.add.text(width / 2, 60, `Funde sua guilda em ${city.name}`, FONT.title).setOrigin(0.5);
    this.add.text(width / 2, 110, 'Passo 1 de 2: nome e símbolo', FONT.small).setOrigin(0.5);

    // Nome
    this.add.text(width / 2, 170, 'Nome da guilda', FONT.heading).setOrigin(0.5);
    const { input: nameInput } = createTextInput(this, width / 2, 220, 420, 'Ex.: Lâminas de Prata', 30);
    nameInput.value = this.draft.guildName;

    // Símbolo
    this.add.text(width / 2, 300, 'Símbolo da guilda', FONT.heading).setOrigin(0.5);
    const size = 96;
    const gap = 18;
    const count = PRESET_EMBLEMS.length + 1;
    const startX = width / 2 - ((size + gap) * count - gap) / 2 + size / 2;
    const rowY = 400;

    PRESET_EMBLEMS.forEach((e, i) => {
      const x = startX + i * (size + gap);
      const frame = this.add.rectangle(x, rowY, size + 10, size + 10, COLORS.panel).setStrokeStyle(3, COLORS.gold, 0);
      this.add.image(x, rowY, `emblem-${e.id}`).setDisplaySize(size, size);
      frame.setInteractive({ useHandCursor: true }).on('pointerup', () => this.setEmblem({ kind: 'preset', id: e.id }));
      this.add.text(x, rowY + size / 2 + 16, e.name, FONT.small).setOrigin(0.5);
      this.presetButtons.push({ id: e.id, frame });
    });

    // Enviar imagem do computador
    const ux = startX + PRESET_EMBLEMS.length * (size + gap);
    this.uploadFrame = this.add
      .rectangle(ux, rowY, size + 10, size + 10, COLORS.panel)
      .setStrokeStyle(3, COLORS.gold, 0);
    this.add.rectangle(ux, rowY, size, size, COLORS.panelLight).setStrokeStyle(2, COLORS.muted);
    this.add.text(ux, rowY, '+', { ...FONT.title, color: css(COLORS.muted) }).setOrigin(0.5);
    this.add.text(ux, rowY + size / 2 + 16, 'Do computador', FONT.small).setOrigin(0.5);
    // O seletor de arquivo só abre a partir de um clique "real" do navegador,
    // por isso este botão é um elemento HTML transparente por cima do quadro.
    const uploadHit = this.add.dom(ux, rowY, 'div', {
      width: `${size + 10}px`,
      height: `${size + 10}px`,
      cursor: 'pointer',
    });
    uploadHit.node.addEventListener('click', async () => {
      const dataUrl = await pickImageFromComputer();
      if (dataUrl) this.setEmblem({ kind: 'custom', dataUrl });
    });

    // Prévia
    this.add.text(width / 2, 520, 'Escolhido:', FONT.small).setOrigin(0.5);
    this.preview = this.add.image(width / 2, 590, `emblem-${PRESET_EMBLEMS[0].id}`).setDisplaySize(96, 96);
    this.setEmblem(this.draft.emblem);

    // Navegação
    const error = this.add.text(width / 2, 655, '', { ...FONT.body, color: css(COLORS.danger) }).setOrigin(0.5);
    new Button(this, 140, 680, 'Voltar', () => this.scene.start('CitySelect'), { width: 180 });
    new Button(this, width - 160, 680, 'Próximo: aventureiros', () => {
      const name = nameInput.value.trim();
      if (name.length < 2) {
        error.setText('Dê um nome para a guilda (mínimo 2 letras).');
        nameInput.focus();
        return;
      }
      this.draft.guildName = name;
      this.scene.start('AdventurerCreation', this.draft);
    }, { width: 260, primary: true });
  }

  private async setEmblem(emblem: GuildEmblem) {
    this.draft.emblem = emblem;
    for (const b of this.presetButtons) {
      b.frame.setStrokeStyle(3, COLORS.gold, emblem.kind === 'preset' && emblem.id === b.id ? 1 : 0);
    }
    this.uploadFrame.setStrokeStyle(3, COLORS.gold, emblem.kind === 'custom' ? 1 : 0);
    const key = await loadEmblemTexture(this, emblem);
    if (this.preview.active) this.preview.setTexture(key).setDisplaySize(96, 96);
  }
}
