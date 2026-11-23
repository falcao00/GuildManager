import { CLASSES, RACES, type ClassId, type RaceId, type Rank, type Stats } from '../data/adventurers';
import { rankOddsFor } from '../data/recruitment';
import { STARTING_STAT_TOTAL, STAT_MAX, STAT_MIN } from '../data/config';
import { createAdventurer, type AdventurerData } from './Adventurer';

/** Nomes sugeridos por raça. */
export const NAMES: Record<RaceId, string[]> = {
  humano: ['Aldric', 'Mara', 'Tomas', 'Elena', 'Gareth', 'Isolde', 'Bram', 'Lucia', 'Cedric', 'Rowena', 'Duncan', 'Agnes'],
  elfo: ['Lyra', 'Faelar', 'Sylwen', 'Thalion', 'Aerin', 'Nimue', 'Elandor', 'Ilyana', 'Caelum', 'Vaeris', 'Lothiel', 'Erevan'],
  anao: ['Borin', 'Hilda', 'Thrain', 'Dagna', 'Gromli', 'Brunna', 'Durgan', 'Kelda', 'Orik', 'Svala', 'Balin', 'Thora'],
  goblin: ['Snik', 'Grizzle', 'Vexa', 'Krag', 'Nitwick', 'Zabba', 'Pox', 'Rikka', 'Gobbo', 'Skritch', 'Mubb', 'Fizzla'],
};

const randInt = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
const pick = <T>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];
function shuffle<T>(list: readonly T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Status iniciais: distribuídos de forma aleatória, cada um entre 0 e 10, somando sempre
 * STARTING_STAT_TOTAL (15). Classe e raça não influenciam o sorteio.
 * Todas as combinações válidas têm a mesma chance.
 */
export function rollStats(_classId?: ClassId, _raceId?: RaceId): Stats {
  for (;;) {
    const strength = randInt(STAT_MIN, STAT_MAX);
    const speed = randInt(STAT_MIN, STAT_MAX);
    const intelligence = STARTING_STAT_TOTAL - strength - speed;
    if (intelligence >= STAT_MIN && intelligence <= STAT_MAX) return { strength, speed, intelligence };
  }
}

/** Nome aleatório para a raça, evitando os nomes já usados. */
export function suggestName(raceId: RaceId, taken: string[] = []): string {
  const free = NAMES[raceId].filter((n) => !taken.includes(n));
  return pick(free.length ? free : NAMES[raceId]);
}

/**
 * Gera `count` aventureiros rank D diferentes entre si: classes diferentes
 * (enquanto houver classes), raça e status sorteados, e um nome sugerido.
 */
export function generateAdventurers(count: number): AdventurerData[] {
  const classIds = Object.keys(CLASSES) as ClassId[];
  const raceIds = Object.keys(RACES) as RaceId[];
  let classPool: ClassId[] = [];
  const result: AdventurerData[] = [];
  for (let i = 0; i < count; i++) {
    if (!classPool.length) classPool = shuffle(classIds);
    const classId = classPool.pop()!;
    const raceId = pick(raceIds);
    const name = suggestName(raceId, result.map((a) => a.name));
    result.push(createAdventurer(name, classId, raceId, rollStats(classId, raceId)));
  }
  return result;
}

/** Sorteia um rank usando a tabela de chances do prestígio da guilda. */
export function rollRank(prestige: number): Rank {
  const odds = Object.entries(rankOddsFor(prestige)) as [Rank, number][];
  const total = odds.reduce((sum, [, p]) => sum + p, 0);
  let r = Math.random() * total;
  for (const [rank, p] of odds) {
    r -= p;
    if (r < 0) return rank;
  }
  return odds[0][0];
}

/** Candidatos do Recrutamento: classe, raça, status e rank sorteados. */
export function generateCandidates(count: number, prestige: number, takenNames: string[]): AdventurerData[] {
  const classIds = Object.keys(CLASSES) as ClassId[];
  const raceIds = Object.keys(RACES) as RaceId[];
  const taken = [...takenNames];
  const result: AdventurerData[] = [];
  for (let i = 0; i < count; i++) {
    const classId = pick(classIds);
    const raceId = pick(raceIds);
    const name = suggestName(raceId, taken);
    taken.push(name);
    result.push(createAdventurer(name, classId, raceId, rollStats(classId, raceId), rollRank(prestige)));
  }
  return result;
}
