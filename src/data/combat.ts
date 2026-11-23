/** Regras e constantes de combate (definidas pelo usuário; os valores marcados como "padrão" podem mudar). */
import type { ClassId } from './adventurers';

/** Dano corpo a corpo (armado ou desarmado) = multiplicador da classe × Força. */
export const MELEE_MULTIPLIER: Record<ClassId, number> = {
  guerreiro: 2,
  ladino: 1.5,
  clerigo: 1.8,
  mago: 1.2,
};

/** Dano mágico = multiplicador da classe × Inteligência. Guerreiro e Ladino não usam magia (padrão). */
export const MAGIC_MULTIPLIER: Record<ClassId, number> = {
  mago: 2,
  clerigo: 1.8,
  guerreiro: 0,
  ladino: 0,
};

/** Chance base de dar 2 ataques na rodada. */
export const DOUBLE_ATTACK_BASE = 0.3;
/** +5% de chance de ataque duplo a cada 10 pontos completos de Velocidade (Velocidade 100 = 80%). */
export const DOUBLE_ATTACK_BONUS_PER_10_SPEED = 0.05;

/** Stamina/Mana gasta por ataque (padrão). Ataque duplo gasta o dobro. */
export const RESOURCE_COST_PER_ATTACK = 10;

/** Sem Stamina/Mana suficiente, o personagem ainda ataca uma vez, mas cansado: dano × 0,5 (padrão). */
export const EXHAUSTED_DAMAGE_MULTIPLIER = 0.5;

/** Limite de rodadas de uma luta; depois disso é empate (padrão). */
export const MAX_ROUNDS = 50;
