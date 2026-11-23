import { STAT_MAX, STAT_MIN } from '../data/config';
import {
  CLASSES, RACES, RANKS, RANK_MULTIPLIER, XP_TO_NEXT_RANK,
  type ClassId, type RaceId, type Rank, type ResourceType, type Stats,
} from '../data/adventurers';

/** Algo que altera status: arma, armadura, maldição ou buff. */
export type StatModifier = {
  id: string;
  source: 'arma' | 'armadura' | 'maldicao' | 'buff';
  name: string;
  stats: Partial<Stats>;
};

/** Dados salvos de um aventureiro (JSON puro, vai para o save). */
export type AdventurerData = {
  id: string;
  name: string;
  classId: ClassId;
  raceId: RaceId;
  /** Status base sorteados na criação. Fixos: só mudam via modificadores. */
  stats: Stats;
  rank: Rank;
  xp: number;
  health: number;
  resource: number;
  modifiers: StatModifier[];
};

export const clampStat = (v: number) => Math.max(STAT_MIN, Math.min(STAT_MAX, v));

/** Status típicos de uma classe + raça (o gerador sorteia variações em cima disso). */
export function typicalStats(classId: ClassId, raceId: RaceId): Stats {
  const c = CLASSES[classId].baseStats;
  const r = RACES[raceId].statBonus;
  return {
    strength: clampStat(c.strength + r.strength),
    speed: clampStat(c.speed + r.speed),
    intelligence: clampStat(c.intelligence + r.intelligence),
  };
}

/** Status final: base + equipamentos, maldições e buffs, sempre entre 0 e 10. */
export function effectiveStats(a: Pick<AdventurerData, 'classId' | 'raceId' | 'stats' | 'modifiers'>): Stats {
  const s = { ...(a.stats ?? typicalStats(a.classId, a.raceId)) };
  for (const m of a.modifiers) {
    s.strength += m.stats.strength ?? 0;
    s.speed += m.stats.speed ?? 0;
    s.intelligence += m.stats.intelligence ?? 0;
  }
  return { strength: clampStat(s.strength), speed: clampStat(s.speed), intelligence: clampStat(s.intelligence) };
}

export function maxHealth(a: Pick<AdventurerData, 'classId' | 'raceId' | 'rank'>): number {
  return Math.round((CLASSES[a.classId].health + RACES[a.raceId].healthBonus) * RANK_MULTIPLIER[a.rank]);
}

export function resourceType(a: Pick<AdventurerData, 'classId'>): ResourceType {
  return CLASSES[a.classId].resource;
}

export function maxResource(a: Pick<AdventurerData, 'classId' | 'rank'>): number {
  return Math.round(CLASSES[a.classId].resourceMax * RANK_MULTIPLIER[a.rank]);
}

export function createAdventurer(name: string, classId: ClassId, raceId: RaceId, stats: Stats, rank: Rank = 'D'): AdventurerData {
  const a: AdventurerData = {
    id: crypto.randomUUID(),
    name,
    classId,
    raceId,
    stats: { ...stats },
    rank,
    xp: 0,
    health: 0,
    resource: 0,
    modifiers: [],
  };
  a.health = maxHealth(a);
  a.resource = maxResource(a);
  return a;
}

/** Dá experiência e sobe de rank quantas vezes for preciso. Retorna os ranks alcançados. */
export function addExperience(a: AdventurerData, amount: number): Rank[] {
  const promoted: Rank[] = [];
  a.xp += amount;
  let needed = XP_TO_NEXT_RANK[a.rank];
  while (needed !== null && a.xp >= needed) {
    a.xp -= needed;
    a.rank = RANKS[RANKS.indexOf(a.rank) + 1];
    promoted.push(a.rank);
    needed = XP_TO_NEXT_RANK[a.rank];
  }
  if (needed === null) a.xp = 0;
  if (promoted.length) {
    a.health = maxHealth(a);
    a.resource = maxResource(a);
  }
  return promoted;
}
