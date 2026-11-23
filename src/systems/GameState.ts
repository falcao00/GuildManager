import { ENERGY_MAX, ENERGY_REGEN_MS, STARTING_GOLD } from '../data/config';
import type { CityId } from '../data/world';
import { DAILY_CANDIDATES, RECRUIT_COST } from '../data/recruitment';
import { upgradeCost, upgradeValue, maxUpgradeLevel, UPGRADES, type UpgradeId } from '../data/upgrades';
import { addHistory, type AdventurerData } from './Adventurer';
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

export type SaveData = {
  version: 1;
  city: CityId;
  guild: GuildData;
  energy: number;
  lastEnergyTick: number;
  /** Quando a guilda foi fundada (ms). É o "Dia 01, Ano 01" do calendário do jogo. */
  foundedAt: number;
  recruitment?: RecruitmentData;
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
    this.guild.adventurers = this.guild.adventurers.filter((a) => a.id !== adventurerId);
    const teams = this.guild.duelTeams;
    if (teams) {
      teams.single = teams.single?.filter((id) => id !== adventurerId);
      teams.team = teams.team?.filter((id) => id !== adventurerId);
    }
    this.save();
    return null;
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
