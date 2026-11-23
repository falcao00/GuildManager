import * as Phaser from 'phaser';
import { MAIL_BODY_MAX, MAIL_SUBJECT_MAX, OTHER_GUILDS } from '../data/activities';
import { formatGameDate, gameDate } from '../systems/GameClock';
import { GameState, type MailMessage } from '../systems/GameState';
import { Button } from '../ui/Button';
import { toast } from '../ui/Dialog';
import { screenLayout } from '../ui/ScreenLayout';
import { createTextInput } from '../ui/TextInput';
import { COLORS, FONT, css } from '../ui/theme';

type Tab = 'inbox' | 'sent' | 'compose';
const ROWS_PER_PAGE = 7;

/**
 * Correio: mensagens para outras guildas.
 * Ainda não há servidor: as guildas são fictícias e as mensagens ficam só neste navegador.
 */
export class MailScene extends Phaser.Scene {
  private tab: Tab = 'inbox';
  private openId?: string;
  private page = 0;

  constructor() {
    super('Mail');
  }

  init(data: { tab?: Tab; openId?: string; page?: number }) {
    this.tab = data.tab ?? 'inbox';
    this.openId = data.openId;
    this.page = data.page ?? 0;
  }

  create() {
    const state = GameState.get();
    const mail = state.mail;
    const unread = mail.inbox.filter((m) => !m.read).length;
    const top = screenLayout(this, 'Correio', 'Mande mensagens para as outras guildas da cidade');
    const { width } = this.scale;

    const tabs: [Tab, string][] = [
      ['inbox', unread ? `Caixa de entrada (${unread})` : 'Caixa de entrada'],
      ['sent', `Enviadas (${mail.sent.length})`],
      ['compose', 'Escrever'],
    ];
    tabs.forEach(([id, label], i) => {
      new Button(this, width / 2 + (i - 1) * 270, top + 10, label, () => this.scene.restart({ tab: id }), { width: 250, height: 40 }).setSelected(
        this.tab === id,
      );
    });

    if (this.tab === 'compose') this.compose(top + 60);
    else this.list(top + 60, this.tab === 'inbox' ? [...mail.inbox].reverse() : [...mail.sent].reverse());
  }

  private list(y: number, messages: MailMessage[]) {
    const state = GameState.get();
    const foundedAt = state.data.foundedAt;
    const inbox = this.tab === 'inbox';
    if (!messages.length) {
      this.add.text(this.scale.width / 2, y + 180, inbox ? 'Nenhuma mensagem recebida.' : 'Você ainda não mandou nenhuma mensagem.', FONT.body).setOrigin(0.5);
      return;
    }
    const pages = Math.ceil(messages.length / ROWS_PER_PAGE);
    const page = Math.min(this.page, pages - 1);
    messages.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE).forEach((m, i) => {
      const ry = y + 20 + i * 54;
      const open = m.id === this.openId;
      this.add
        .rectangle(400, ry, 720, 48, open ? COLORS.panelLight : COLORS.panel)
        .setStrokeStyle(2, COLORS.gold, open ? 1 : 0.2)
        .setInteractive({ useHandCursor: true })
        .on('pointerup', () => {
          if (inbox) state.markRead(m.id);
          this.scene.restart({ tab: this.tab, openId: m.id, page });
        });
      const bold = inbox && !m.read;
      this.add.text(60, ry - 10, inbox ? `De: ${m.from}` : `Para: ${m.to}`, { ...FONT.small, color: css(bold ? COLORS.gold : COLORS.muted) }).setOrigin(0, 0.5);
      this.add.text(60, ry + 11, m.subject, { ...FONT.body, fontSize: '16px', fontStyle: bold ? 'bold' : 'normal' }).setOrigin(0, 0.5);
      this.add.text(740, ry, formatGameDate(gameDate(foundedAt, m.at)), FONT.small).setOrigin(1, 0.5);
    });
    if (pages > 1) {
      const go = (d: number) => this.scene.restart({ tab: this.tab, page: (page + d + pages) % pages });
      new Button(this, 320, 670, '◀', () => go(-1), { width: 44, height: 36 });
      this.add.text(400, 670, `${page + 1} / ${pages}`, FONT.body).setOrigin(0.5);
      new Button(this, 480, 670, '▶', () => go(1), { width: 44, height: 36 });
    }

    // Mensagem aberta (direita)
    const px = 1020;
    this.add.rectangle(px, y + 200, 420, 430, COLORS.panel).setStrokeStyle(2, COLORS.gold, 0.5);
    const m = messages.find((x) => x.id === this.openId);
    if (!m) {
      this.add.text(px, y + 200, 'Clique numa mensagem para ler.', FONT.body).setOrigin(0.5);
      return;
    }
    const t = y - 15;
    this.add.text(px - 190, t + 30, inbox ? `De: ${m.from}` : `Para: ${m.to}`, { ...FONT.small, color: css(COLORS.gold) }).setOrigin(0, 0.5);
    this.add.text(px - 190, t + 55, formatGameDate(gameDate(foundedAt, m.at)), FONT.small).setOrigin(0, 0.5);
    this.add.text(px - 190, t + 90, m.subject, { ...FONT.heading, fontSize: '22px', wordWrap: { width: 380 } }).setOrigin(0, 0.5);
    this.add.text(px - 190, t + 120, m.body, { ...FONT.body, fontSize: '16px', wordWrap: { width: 380 }, lineSpacing: 4 }).setOrigin(0, 0);
  }

  private compose(y: number) {
    const state = GameState.get();
    const { width } = this.scale;
    let to = '';
    this.add.text(width / 2 - 420, y + 10, 'Para:', FONT.body).setOrigin(0, 0.5);
    const buttons = OTHER_GUILDS.map((g, i) => {
      const b = new Button(this, width / 2 - 182 + (i % 3) * 250, y + 10 + Math.floor(i / 3) * 50, g, () => {
        to = g;
        buttons.forEach((x, j) => x.setSelected(OTHER_GUILDS[j] === to));
      }, { width: 236, height: 40, fontSize: 16 });
      return b;
    });

    this.add.text(width / 2 - 420, y + 120, 'Assunto:', FONT.body).setOrigin(0, 0.5);
    const { input: subject } = createTextInput(this, width / 2 + 80, y + 120, 760, 'Ex.: Proposta de aliança', MAIL_SUBJECT_MAX);

    this.add.text(width / 2 - 420, y + 175, 'Mensagem:', FONT.body).setOrigin(0, 0);
    const el = this.add.dom(width / 2 + 80, y + 270, 'textarea', {
      width: '760px',
      height: '190px',
      padding: '10px 12px',
      fontSize: '17px',
      fontFamily: 'sans-serif',
      color: '#f2e9dc',
      background: '#2a2036',
      border: '2px solid #e0b04a',
      borderRadius: '4px',
      outline: 'none',
      resize: 'none',
      boxSizing: 'border-box',
    });
    const body = el.node as HTMLTextAreaElement;
    body.maxLength = MAIL_BODY_MAX;
    body.placeholder = 'Escreva sua mensagem...';

    new Button(this, width / 2 + 350, y + 410, 'Enviar', () => {
      const error = state.sendMail(to, subject.value, body.value);
      if (error) return toast(this, error, COLORS.danger);
      toast(this, `Mensagem enviada para ${to}.`, COLORS.gold);
      this.time.delayedCall(900, () => this.scene.restart({ tab: 'sent' }));
    }, { width: 220, primary: true });
    this.add
      .text(width / 2 - 420, y + 410, 'Por enquanto as outras guildas são fictícias: as mensagens ficam salvas só aqui.', FONT.small)
      .setOrigin(0, 0.5);
  }
}
