/** Atividades do salão: Campo de Treino, Labirinto e Correio. Valores são padrões e podem mudar. */
import type { Rank, Stats } from './adventurers';

// ---------- Campo de Treino ----------
export const TRAINING_ENERGY_COST = 10;
export const TRAINING_DURATION_MS = 4 * 60 * 60 * 1000; // 4 horas reais
/** Pontos ganhos no status treinado (o máximo continua 10). */
export const TRAINING_GAIN = 1;
export type TrainableStat = keyof Stats;

// ---------- Labirinto (Dungeon Eterna) ----------
export const LABYRINTH_ENERGY_COST = 10;
export const HOUR_MS = 60 * 60 * 1000;
/** Ouro encontrado por hora completa dentro do Labirinto, pelo rank do aventureiro. */
export const LABYRINTH_GOLD_PER_HOUR: Record<Rank, number> = { D: 5, C: 8, B: 12, A: 18, S: 25, SS: 35 };
/** Chance de achar um item a cada hora completa. */
export const LABYRINTH_LOOT_CHANCE_PER_HOUR = 0.1;
/** Itens provisórios do Labirinto (até existir a tabela de loot de verdade). */
export const LABYRINTH_LOOT = ['Moeda antiga', 'Poção de vida', 'Gema bruta', 'Adaga enferrujada', 'Pergaminho rasgado', 'Anel de cobre'];

// ---------- Correio ----------
/** Guildas fictícias para o Correio, até existir servidor com guildas de outros jogadores. */
export const OTHER_GUILDS = ['Lâminas de Prata', 'Corvos do Norte', 'Escudo de Ferro', 'Irmandade da Lua', 'Mercadores do Abismo'];
export const MAIL_SUBJECT_MAX = 40;
export const MAIL_BODY_MAX = 500;
