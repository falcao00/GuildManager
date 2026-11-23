/** Regras dos aventureiros: ranks, classes, raças e status base. */

export type Stats = { strength: number; speed: number; intelligence: number };

export const STAT_LABELS: Record<keyof Stats, string> = {
  strength: 'Força',
  speed: 'Velocidade',
  intelligence: 'Inteligência',
};

// ---------- Ranks ----------
export const RANKS = ['D', 'C', 'B', 'A', 'S', 'SS'] as const;
export type Rank = (typeof RANKS)[number];

/** XP necessária para subir DESTE rank para o próximo (a XP zera ao subir). */
export const XP_TO_NEXT_RANK: Record<Rank, number | null> = {
  D: 100,
  C: 300,
  B: 800,
  A: 2000,
  S: 5000,
  SS: null, // rank máximo
};

/** Multiplicador de Vida e Stamina/Mana por rank. */
export const RANK_MULTIPLIER: Record<Rank, number> = {
  D: 1,
  C: 1.2,
  B: 1.4,
  A: 1.7,
  S: 2,
  SS: 2.5,
};

// ---------- Classes ----------
export type ResourceType = 'stamina' | 'mana';
export const RESOURCE_LABELS: Record<ResourceType, string> = { stamina: 'Stamina', mana: 'Mana' };

export const CLASSES = {
  guerreiro: { name: 'Guerreiro', resource: 'stamina', baseStats: { strength: 6, speed: 4, intelligence: 2 }, health: 120, resourceMax: 100 },
  ladino: { name: 'Ladino', resource: 'stamina', baseStats: { strength: 3, speed: 7, intelligence: 4 }, health: 90, resourceMax: 100 },
  mago: { name: 'Mago', resource: 'mana', baseStats: { strength: 1, speed: 4, intelligence: 7 }, health: 70, resourceMax: 100 },
  clerigo: { name: 'Clérigo', resource: 'mana', baseStats: { strength: 3, speed: 3, intelligence: 6 }, health: 90, resourceMax: 100 },
} as const satisfies Record<string, { name: string; resource: ResourceType; baseStats: Stats; health: number; resourceMax: number }>;

export type ClassId = keyof typeof CLASSES;

// ---------- Raças ----------
export const RACES = {
  humano: { name: 'Humano', statBonus: { strength: 1, speed: 1, intelligence: 0 }, healthBonus: 0 },
  elfo: { name: 'Elfo', statBonus: { strength: -1, speed: 1, intelligence: 2 }, healthBonus: -10 },
  anao: { name: 'Anão', statBonus: { strength: 2, speed: -1, intelligence: 1 }, healthBonus: 20 },
  goblin: { name: 'Goblin', statBonus: { strength: -1, speed: 2, intelligence: 1 }, healthBonus: -10 },
} as const satisfies Record<string, { name: string; statBonus: Stats; healthBonus: number }>;

export type RaceId = keyof typeof RACES;
