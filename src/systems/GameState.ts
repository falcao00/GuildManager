import { ENERGY_MAX, ENERGY_REGEN_MS, STARTING_GOLD } from '../data/config';
import type { CityId } from '../data/world';
import { DAILY_CANDIDATES, RECRUIT_COST } from '../data/recruitment';
import { upgradeCost, upgradeValue, maxUpgradeLevel, UPGRADES, type UpgradeId } from '../data/upgrades';
import {
  HOUR_MS, LABYRINTH_ENERGY_COST, LABYRINTH_GOLD_PER_HOUR, LABYRINTH_LOOT, LABYRINTH_LOOT_CHANCE_PER_HOUR,
  TRAINING_DURATION_MS, TRAINING_ENERGY_COST, TRAINING_GAIN, type TrainableStat,
} from '../data/activities';
import { STAT_LABELS } from '../data/adventurers';
import { STAT_MAX } from '../data/config';
import { addHeldItem, addHistory, type AdventurerData } from './Adventurer';
import { generateCandidates } from './AdventurerGenerator';
import { gameDayIndex } from './GameClock';

/** Símbolo da guilda: um dos prontos ou uma imagem enviada pelo jogador (data URL). */
export type GuildEmblem = { kind: 'preset'; id: string } | { kind: 'custom'; dataUrl: string };

export type GuildData = {
  name: string;
  emblem: GuildEmblem;
  gold: number;
  prestige: number;
  adventurers: AdventurerData[];
  /** Loot da guilda (ainda sem itens no jogo). */
  inventory?: InventoryItem[];
  /** Times escolhidos para os Duelos (ids): 1 para o Single 1x1, 3 para o Equipe 3x3. */
  duelTeams?: { single?: string[]; team?: string[] };
  /** Nível de cada melhoria (começa no 1). */
  upgrades?: Partial<Record<UpgradeId, number>>;
};

/** Item de loot. Formato provisório: será detalhado quando existirem itens. */
export type InventoryItem = { id: string; name: string; quantity: number };

/** Candidatos do Recrutamento do dia `day` (dia do jogo, 0 = fundação). */
export type RecruitmentData = { day: number; candidates: AdventurerData[] };

/** Mensagem do Correio. */
export type MailMessage = { id: string; from: string; to: string; subject: string; body: string; at: number; read: boolean };

export type SaveData = {
  version: 1;
  city: CityId;
  guild: GuildData;
  energy: number;
  lastEnergyTick: number;
  /** Quando a guilda foi fundada (ms). É o "Dia 01, Ano 01" do calendário do jogo. */
  foundedAt: number;
  recruitment?: RecruitmentData;
  /** Correio: mensagens recebidas e enviadas. */
  mail?: { inbox: MailMessage[]; sent: MailMessage[] };
};

/** Um único save por jogador: uma guilda só, numa cidade só. */
const SAVE_KEY = 'guildmanager:save';
/** Versões antigas guardavam um save por cidade. */
const LEGACY_PREFIX = 'guildmanager:save:';

/**
 * Estado global do jogo. O jogador tem UMA guilda; para jogar em outra cidade
 * precisa excluir a guilda atual e começar do zero.
 * A energia regenera com o tempo real, mesmo com o jogo fechado.
 */
export class GameState {
  private static current: GameState | null = null;

  private constructor(public data: SaveData) {}

  static get(): GameState {
    if (!GameState.current) throw new Error('Nenhum jogo carregado');
    return GameState.current;
  }

  /** Lê o save (ou null se o jogador ainda não tem guilda). */
  static readSave(): SaveData | null {
    try {
      GameState.migrateLegacy();
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw) as SaveData;
      data.foundedAt ??= Date.now();
      GameState.undoScaleExperiment(data);
      // "Guilda vs Guilda" virou "Duelos": o time de 3 antigo passa a ser o time do Duelo Equipe.
      const legacy = data.guild as typeof data.guild & { gvgTeam?: string[] };
      if (legacy.gvgTeam) {
        legacy.duelTeams = { ...legacy.duelTeams, team: legacy.duelTeams?.team ?? legacy.gvgTeam };
        delete legacy.gvgTeam;
      }
      return data;
    } catch {
      return null;
    }
  }

  static load(): GameState | null {
    const data = GameState.readSave();
    GameState.current = data ? new GameState(data) : null;
    return GameState.current;
  }

  static newGame(city: CityId, guild: Omit<GuildData, 'gold' | 'prestige'>): GameState {
    if (GameState.readSave()) throw new Error('O jogador já tem uma guilda');
    const now = Date.now();
    for (const a of guild.adventurers) addHistory(a, 'entrada', `Membro fundador da guilda ${guild.name}`, now);
    GameState.current = new GameState({
      version: 1,
      city,
      guild: { ...guild, gold: STARTING_GOLD, prestige: 0 },
      energy: ENERGY_MAX,
      lastEnergyTick: now,
      foundedAt: now,
    });
    GameState.current.save();
    return GameState.current;
  }

  /** Apaga a guilda para sempre. Depois disso o jogador pode fundar outra em qualquer cidade. */
  static deleteGuild() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      /* sem storage, nada a apagar */
    }
    GameState.current = null;
  }

  /**
   * Por um tempo os status foram de 0 a 100 e a Vida foi 10x maior (statScale/healthScale no save).
   * Isso foi desfeito: saves convertidos naquela época voltam para status 0 a 10 e Vida normal.
   */
  private static undoScaleExperiment(data: SaveData & { statScale?: number; healthScale?: number }) {
    if (data.statScale === undefined && data.healthScale === undefined) return;
    for (const a of [...data.guild.adventurers, ...(data.recruitment?.candidates ?? [])]) {
      if (data.statScale === 100) {
        for (const k of ['strength', 'speed', 'intelligence'] as const) {
          if (a.stats) a.stats[k] = Math.round(a.stats[k] / 10);
          for (const m of a.modifiers ?? []) if (m.stats[k] !== undefined) m.stats[k] = Math.round(m.stats[k]! / 10);
        }
      }
      if (data.healthScale === 10) a.health = Math.round(a.health / 10);
    }
    delete data.statScale;
    delete data.healthScale;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch {
      /* sem storage */
    }
  }

  /** Converte saves antigos (um por cidade) no save único, ficando com o primeiro encontrado. */
  private static migrateLegacy() {
    if (localStorage.getItem(SAVE_KEY)) return;
    const legacyKeys = Object.keys(localStorage).filter((k) => k.startsWith(LEGACY_PREFIX));
    if (!legacyKeys.length) return;
    localStorage.setItem(SAVE_KEY, localStorage.getItem(legacyKeys[0])!);
    legacyKeys.forEach((k) => localStorage.removeItem(k));
  }

  get guild() {
    return this.data.guild;
  }

  /** Candidatos de hoje. Na virada do dia somem e são sorteados 5 novos. */
  getCandidates(now = Date.now()): AdventurerData[] {
    const day = gameDayIndex(this.data.foundedAt, now);
    if (this.data.recruitment?.day !== day) {
      this.data.recruitment = {
        day,
        candidates: generateCandidates(DAILY_CANDIDATES, this.guild.prestige, this.guild.adventurers.map((a) => a.name)),
      };
      this.save();
    }
    return this.data.recruitment.candidates;
  }

  /** Recruta um candidato de hoje. Retorna uma mensagem de erro, ou null se deu certo. */
  recruit(candidateId: string): string | null {
    const candidates = this.getCandidates();
    const c = candidates.find((x) => x.id === candidateId);
    if (!c) return 'Este aventureiro não está mais disponível.';
    const cost = RECRUIT_COST[c.rank];
    if (this.guild.adventurers.length >= this.adventurerLimit)
      return `Dormitórios cheios (${this.adventurerLimit} aventureiros). Melhore os Dormitórios para recrutar mais.`;
    if (this.guild.gold < cost) return `Ouro insuficiente: precisa de ${cost}.`;
    this.guild.gold -= cost;
    addHistory(c, 'entrada', `Recrutado pela guilda por ${cost} de ouro`);
    this.guild.adventurers.push(c);
    candidates.splice(candidates.indexOf(c), 1);
    this.save();
    return null;
  }

  upgradeLevel(id: UpgradeId): number {
    return this.guild.upgrades?.[id] ?? 1;
  }

  /** Limite de aventureiros (Dormitórios). */
  get adventurerLimit() {
    return upgradeValue('dormitorios', this.upgradeLevel('dormitorios'));
  }

  /** Quantas missões ficam disponíveis no quadro. */
  get missionSlots() {
    return upgradeValue('quadro', this.upgradeLevel('quadro'));
  }

  /** Espaços de loot do inventário (Arsenal). */
  get lootSlots() {
    return upgradeValue('arsenal', this.upgradeLevel('arsenal'));
  }

  /** Compra o próximo nível de uma melhoria. Retorna uma mensagem de erro, ou null se deu certo. */
  buyUpgrade(id: UpgradeId): string | null {
    const level = this.upgradeLevel(id);
    const cost = upgradeCost(id, level);
    if (cost === null || level >= maxUpgradeLevel(id)) return `${UPGRADES[id].name} já está no nível máximo.`;
    if (this.guild.gold < cost) return `Ouro insuficiente: precisa de ${cost}.`;
    this.guild.gold -= cost;
    this.guild.upgrades = { ...this.guild.upgrades, [id]: level + 1 };
    this.save();
    return null;
  }

  /** Libera (dispensa) um aventureiro da guilda para sempre. */
  release(adventurerId: string): string | null {
    if (this.guild.adventurers.length <= 1) return 'A guilda precisa ter pelo menos 1 aventureiro.';
    const a = this.adventurer(adventurerId);
    if (a?.activity) return `${a.name} está ocupado (${activityLabel(a)}). Espere ele voltar para liberar.`;
    this.guild.adventurers = this.guild.adventurers.filter((a) => a.id !== adventurerId);
    const teams = this.guild.duelTeams;
    if (teams) {
      teams.single = teams.single?.filter((id) => id !== adventurerId);
      teams.team = teams.team?.filter((id) => id !== adventurerId);
    }
    this.save();
    return null;
  }

  adventurer(id: string) {
    return this.guild.adventurers.find((a) => a.id === id);
  }

  get energy() {
    this.regenerateEnergy(Date.now());
    return this.data.energy;
  }

  /** Gasta energia. Retorna uma mensagem de erro, ou null se deu certo. */
  private spendEnergy(amount: number): string | null {
    if (this.energy < amount) return `Energia insuficiente: precisa de ${amount}.`;
    if (this.data.energy >= ENERGY_MAX) this.data.lastEnergyTick = Date.now();
    this.data.energy -= amount;
    return null;
  }

  // ---------- Campo de Treino ----------

  /** Começa a treinar um status. O ganho vem quando o treino termina e é concluído. */
  startTraining(id: string, stat: TrainableStat, now = Date.now()): string | null {
    const a = this.adventurer(id);
    if (!a) return 'Aventureiro não encontrado.';
    if (a.activity) return `${a.name} está ocupado (${activityLabel(a)}).`;
    if (a.stats[stat] >= STAT_MAX) return `${STAT_LABELS[stat]} de ${a.name} já está no máximo.`;
    const error = this.spendEnergy(TRAINING_ENERGY_COST);
    if (error) return error;
    a.activity = { kind: 'treino', stat, since: now, until: now + TRAINING_DURATION_MS };
    this.save();
    return null;
  }

  /** Conclui um treino que já terminou: +1 no status treinado. */
  finishTraining(id: string, now = Date.now()): string | null {
    const a = this.adventurer(id);
    const act = a?.activity;
    if (!a || act?.kind !== 'treino') return 'Este aventureiro não está treinando.';
    if (now < act.until) return 'O treino ainda não terminou.';
    a.stats[act.stat] = Math.min(STAT_MAX, a.stats[act.stat] + TRAINING_GAIN);
    addHistory(a, 'treino', `Treinou ${STAT_LABELS[act.stat]} (+${TRAINING_GAIN}, agora ${a.stats[act.stat]})`, now);
    delete a.activity;
    this.save();
    return null;
  }

  /** Desiste do treino (a energia gasta não volta). */
  cancelTraining(id: string) {
    const a = this.adventurer(id);
    if (a?.activity?.kind === 'treino') delete a.activity;
    this.save();
  }

  // ---------- Labirinto ----------

  enterLabyrinth(id: string, now = Date.now()): string | null {
    const a = this.adventurer(id);
    if (!a) return 'Aventureiro não encontrado.';
    if (a.activity) return `${a.name} está ocupado (${activityLabel(a)}).`;
    const error = this.spendEnergy(LABYRINTH_ENERGY_COST);
    if (error) return error;
    a.activity = { kind: 'labirinto', since: now };
    addHistory(a, 'labirinto', 'Entrou no Labirinto', now);
    this.save();
    return null;
  }

  /** Horas completas e ouro acumulado até agora por quem está no Labirinto. */
  labyrinthProgress(a: AdventurerData, now = Date.now()) {
    const since = a.activity?.kind === 'labirinto' ? a.activity.since : now;
    const hours = Math.max(0, Math.floor((now - since) / HOUR_MS));
    return { hours, gold: hours * LABYRINTH_GOLD_PER_HOUR[a.rank], elapsedMs: now - since };
  }

  /** Tira do Labirinto: o ouro vai para a guilda e os itens achados ficam com o aventureiro. */
  leaveLabyrinth(id: string, now = Date.now()): { gold: number; items: string[] } | string {
    const a = this.adventurer(id);
    if (!a || a.activity?.kind !== 'labirinto') return 'Este aventureiro não está no Labirinto.';
    const { hours, gold } = this.labyrinthProgress(a, now);
    const items: string[] = [];
    for (let h = 0; h < hours; h++) {
      if (Math.random() < LABYRINTH_LOOT_CHANCE_PER_HOUR) items.push(LABYRINTH_LOOT[Math.floor(Math.random() * LABYRINTH_LOOT.length)]);
    }
    items.forEach((name) => addHeldItem(a, name));
    this.guild.gold += gold;
    const itemText = items.length ? ` e ${items.length} ${items.length === 1 ? 'item' : 'itens'}` : '';
    addHistory(a, 'labirinto', `Voltou do Labirinto após ${hours}h com ${gold} de ouro${itemText}`, now);
    delete a.activity;
    this.save();
    return { gold, items };
  }

  // ---------- Correio ----------

  get mail() {
    if (!this.data.mail) {
      this.data.mail = {
        inbox: [
          {
            id: crypto.randomUUID(),
            from: 'Conselho das Guildas',
            to: this.guild.name,
            subject: 'Bem-vindo ao Correio',
            body: `Saudações, Mestre da guilda ${this.guild.name}! Pelo Correio você pode mandar mensagens para as outras guildas da cidade. As respostas delas vão chegar nesta caixa de entrada.`,
            at: this.data.foundedAt,
            read: false,
          },
        ],
        sent: [],
      };
      this.save();
    }
    return this.data.mail;
  }

  sendMail(to: string, subject: string, body: string): string | null {
    if (!to) return 'Escolha a guilda que vai receber.';
    if (!subject.trim()) return 'Escreva um assunto.';
    if (!body.trim()) return 'Escreva a mensagem.';
    this.mail.sent.push({ id: crypto.randomUUID(), from: this.guild.name, to, subject: subject.trim(), body: body.trim(), at: Date.now(), read: true });
    this.save();
    return null;
  }

  markRead(id: string) {
    const m = this.mail.inbox.find((x) => x.id === id);
    if (m && !m.read) {
      m.read = true;
      this.save();
    }
  }

  get maxEnergy() {
    return ENERGY_MAX;
  }

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Não foi possível salvar o jogo', e);
    }
  }

  /** Atualiza a energia pelo tempo passado. Retorna true se mudou. */
  regenerateEnergy(now: number): boolean {
    const d = this.data;
    if (d.energy >= ENERGY_MAX) {
      d.lastEnergyTick = now;
      return false;
    }
    const gained = Math.floor((now - d.lastEnergyTick) / ENERGY_REGEN_MS);
    if (gained <= 0) return false;
    d.energy = Math.min(ENERGY_MAX, d.energy + gained);
    d.lastEnergyTick += gained * ENERGY_REGEN_MS;
    this.save();
    return true;
  }
}

/** Texto curto do que o aventureiro está fazendo (ou "Livre"). */
export function activityLabel(a: AdventurerData, now = Date.now()): string {
  const act = a.activity;
  if (!act) return 'Livre';
  if (act.kind === 'labirinto') return `No Labirinto há ${formatDuration(now - act.since)}`;
  if (now >= act.until) return `Treino de ${STAT_LABELS[act.stat]} pronto`;
  return `Treinando ${STAT_LABELS[act.stat]} · falta ${formatDuration(act.until - now)}`;
}

/** Ex.: "3h 05min", "12min", "2d 4h". */
export function formatDuration(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60_000));
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}min`;
  return `${m}min`;
}
