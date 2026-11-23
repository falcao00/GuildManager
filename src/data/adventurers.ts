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
  guerreiro: { name: 'Guerreiro', resource: 'stamina', baseStats: { strength: 60, speed: 40, intelligence: 20 }, health: 1200, resourceMax: 100 },
  ladino: { name: 'Ladino', resource: 'stamina', baseStats: { strength: 30, speed: 70, intelligence: 40 }, health: 900, resourceMax: 100 },
  mago: { name: 'Mago', resource: 'mana', baseStats: { strength: 10, speed: 40, intelligence: 70 }, health: 700, resourceMax: 100 },
  clerigo: { name: 'Clérigo', resource: 'mana', baseStats: { strength: 30, speed: 30, intelligence: 60 }, health: 900, resourceMax: 100 },
} as const satisfies Record<string, { name: string; resource: ResourceType; baseStats: Stats; health: number; resourceMax: number }>;

export type ClassId = keyof typeof CLASSES;

// ---------- Raças ----------
export const RACES = {
  humano: { name: 'Humano', statBonus: { strength: 10, speed: 10, intelligence: 0 }, healthBonus: 0 },
  elfo: { name: 'Elfo', statBonus: { strength: -10, speed: 10, intelligence: 20 }, healthBonus: -100 },
  anao: { name: 'Anão', statBonus: { strength: 20, speed: -10, intelligence: 10 }, healthBonus: 200 },
  goblin: { name: 'Goblin', statBonus: { strength: -10, speed: 20, intelligence: 10 }, healthBonus: -100 },
} as const satisfies Record<string, { name: string; statBonus: Stats; healthBonus: number }>;

export type RaceId = keyof typeof RACES;
