import { ENERGY_MAX, ENERGY_REGEN_MS, STARTING_GOLD } from '../data/config';
import type { CityId } from '../data/world';
import { DAILY_CANDIDATES, RECRUIT_COST } from '../data/recruitment';
import type { AdventurerData } from './Adventurer';
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
  /** Os 3 aventureiros escolhidos para Guilda vs Guilda (ids). */
  gvgTeam?: string[];
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
  /** Escala dos status. Saves antigos (sem isso) usavam 0 a 10 e são convertidos para 0 a 100. */
  statScale?: 100;
  /** Escala da Vida. Saves antigos (sem isso) tinham Vida 10x menor e são convertidos. */
  healthScale?: 10;
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
      GameState.migrateStatScale(data);
      GameState.migrateHealthScale(data);
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
    GameState.current = new GameState({
      version: 1,
      city,
      guild: { ...guild, gold: STARTING_GOLD, prestige: 0 },
      energy: ENERGY_MAX,
      lastEnergyTick: now,
      foundedAt: now,
      statScale: 100,
      healthScale: 10,
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

  /** Status passaram de 0-10 para 0-100: multiplica por 10 os status de saves antigos. */
  private static migrateStatScale(data: SaveData) {
    if (data.statScale === 100) return;
    const all = [...data.guild.adventurers, ...(data.recruitment?.candidates ?? [])];
    for (const a of all) {
      for (const k of ['strength', 'speed', 'intelligence'] as const) {
        if (a.stats) a.stats[k] *= 10;
        for (const m of a.modifiers ?? []) if (m.stats[k] !== undefined) m.stats[k]! *= 10;
      }
    }
    data.statScale = 100;
    GameState.save(data);
  }

  /** Vida passou a ser 10x maior (para acompanhar o dano dos status 0-100): multiplica a Vida atual de saves antigos. */
  private static migrateHealthScale(data: SaveData) {
    if (data.healthScale === 10) return;
    for (const a of [...data.guild.adventurers, ...(data.recruitment?.candidates ?? [])]) a.health *= 10;
    data.healthScale = 10;
    GameState.save(data);
  }

  private static save(data: SaveData) {
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
    if (this.guild.gold < cost) return `Ouro insuficiente: precisa de ${cost}.`;
    this.guild.gold -= cost;
    this.guild.adventurers.push(c);
    candidates.splice(candidates.indexOf(c), 1);
    this.save();
    return null;
  }

  /** Libera (dispensa) um aventureiro da guilda para sempre. */
  release(adventurerId: string): string | null {
    if (this.guild.adventurers.length <= 1) return 'A guilda precisa ter pelo menos 1 aventureiro.';
    this.guild.adventurers = this.guild.adventurers.filter((a) => a.id !== adventurerId);
    this.guild.gvgTeam = this.guild.gvgTeam?.filter((id) => id !== adventurerId);
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
