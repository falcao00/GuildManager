import * as Phaser from 'phaser';
import { CITIES, type CityId } from '../data/world';
import { GameState } from '../systems/GameState';
import { Button } from '../ui/Button';
import { confirmDialog } from '../ui/Dialog';
import { COLORS, FONT } from '../ui/theme';

/**
 * Escolha da cidade. O jogador tem uma guilda só: depois de fundada, só a
 * cidade dela fica disponível, até que ele exclua a guilda e recomece.
 */
export class CitySelectScene extends Phaser.Scene {
  constructor() {
    super('CitySelect');
  }

  create() {
    const { width } = this.scale;
    const save = GameState.readSave();

    this.add.text(width / 2, 70, 'Guild Manager', FONT.title).setOrigin(0.5);
    this.add
      .text(width / 2, 130, save ? `Sua guilda ${save.guild.name} fica em ${CITIES.find((c) => c.id === save.city)?.name}` : 'Escolha a cidade onde sua guilda vai nascer', FONT.body)
      .setOrigin(0.5);

    const cardW = 220;
    const gap = 20;
    const startX = width / 2 - ((cardW + gap) * CITIES.length - gap) / 2 + cardW / 2;

    CITIES.forEach((city, i) => {
      const x = startX + i * (cardW + gap);
      const y = 380;
      const isMine = save?.city === city.id;
      const available = !save || isMine;

      // O cartão inteiro é o botão.
      const card = this.add.rectangle(x, y, cardW, 340, COLORS.panel).setStrokeStyle(2, COLORS.gold, isMine ? 1 : 0.5);
      const texts = [
        this.add.text(x, y - 130, city.name, FONT.heading).setOrigin(0.5),
        this.add
          .text(x, y - 70, city.description, { ...FONT.small, align: 'center', wordWrap: { width: cardW - 30 } })
          .setOrigin(0.5, 0),
        this.add
          .text(x, y + 90, isMine ? `Sua guilda:\n${save!.guild.name}\n\nClique para entrar` : save ? 'Indisponível' : 'Nenhuma guilda ainda', {
            ...FONT.body,
            align: 'center',
            wordWrap: { width: cardW - 20 },
          })
          .setOrigin(0.5),
      ];

      if (!available) {
        card.setAlpha(0.4);
        texts.forEach((t) => t.setAlpha(0.4));
        return;
      }
      card.setInteractive({ useHandCursor: true });
      card.on('pointerover', () => card.setFillStyle(COLORS.panelLight).setStrokeStyle(3, COLORS.gold, 1));
      card.on('pointerout', () => card.setFillStyle(COLORS.panel).setStrokeStyle(2, COLORS.gold, isMine ? 1 : 0.5));
      card.on('pointerup', () => this.pick(city.id));
    });

    if (save) {
      this.add.text(width / 2, 600, 'Para jogar em outra cidade, é preciso excluir a guilda atual e começar do zero.', FONT.small).setOrigin(0.5);
      new Button(this, width / 2, 650, 'Excluir guilda', () => this.confirmDelete(save.guild.name), { width: 220 });
    }
  }

  private pick(city: CityId) {
    if (GameState.load()) this.scene.start('GuildHall');
    else this.scene.start('GuildCreation', { city });
  }

  private confirmDelete(guildName: string) {
    confirmDialog(this, {
      title: `Excluir ${guildName}?`,
      message: 'A guilda, os aventureiros, o ouro e todo o progresso serão apagados para sempre. Não dá para desfazer.',
      confirmLabel: 'Excluir para sempre',
      onConfirm: () => {
        GameState.deleteGuild();
        this.scene.restart();
      },
    });
  }
}
