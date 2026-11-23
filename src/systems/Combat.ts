import {
  DOUBLE_ATTACK_BASE, DOUBLE_ATTACK_BONUS_PER_10_SPEED, EXHAUSTED_DAMAGE_MULTIPLIER,
  MAGIC_MULTIPLIER, MAX_ROUNDS, MELEE_MULTIPLIER, RESOURCE_COST_PER_ATTACK,
} from '../data/combat';
import { effectiveStats, type AdventurerData } from './Adventurer';

/** Gerador de números entre 0 e 1 (troque por um com semente para lutas reproduzíveis). */
export type Rng = () => number;

type Combatant = Pick<AdventurerData, 'classId' | 'raceId' | 'stats' | 'modifiers'>;

const round1 = (v: number) => Math.round(v * 10) / 10;

/** Dano corpo a corpo, armado ou desarmado: multiplicador da classe × Força. */
export function meleeDamage(a: Combatant): number {
  return round1(MELEE_MULTIPLIER[a.classId] * effectiveStats(a).strength);
}

/** Dano mágico: 2 × Int (Mago), 1,8 × Int (Clérigo), 0 para quem não usa magia. */
export function magicDamage(a: Combatant): number {
  return round1(MAGIC_MULTIPLIER[a.classId] * effectiveStats(a).intelligence);
}

/** Dano de um ataque: o personagem usa o melhor entre corpo a corpo e magia. */
export function attackDamage(a: Combatant): number {
  return Math.max(meleeDamage(a), magicDamage(a));
}

/** Chance (0 a 1) de dar 2 ataques na rodada: 30% + 5% a cada 10 de Velocidade (proporcional). */
export function doubleAttackChance(a: Combatant): number {
  const speed = effectiveStats(a).speed;
  return DOUBLE_ATTACK_BASE + DOUBLE_ATTACK_BONUS_PER_10_SPEED * (speed / 10);
}

/** Ordem de ação: maior Velocidade primeiro; empate é decidido no sorteio. */
export function turnOrder<T extends Combatant>(list: T[], rng: Rng = Math.random): T[] {
  return list
    .map((a) => ({ a, speed: effectiveStats(a).speed, tie: rng() }))
    .sort((x, y) => y.speed - x.speed || x.tie - y.tie)
    .map((x) => x.a);
}

// ---------- Simulação de luta ----------

export type Fighter = {
  adventurer: AdventurerData;
  team: 0 | 1;
  health: number;
  resource: number;
};

export type CombatEvent = {
  round: number;
  attacker: string;
  target: string;
  /** Quantos ataques deu nesta ação (1 ou 2). */
  hits: 1 | 2;
  damage: number;
  resourceSpent: number;
  exhausted: boolean;
  targetDefeated: boolean;
};

export type CombatResult = {
  /** Time vencedor (0 ou 1) ou null se empatou no limite de rodadas. */
  winner: 0 | 1 | null;
  rounds: number;
  log: CombatEvent[];
  /** Vida e Stamina/Mana de cada lutador no fim (pelo id do aventureiro). */
  final: Record<string, { health: number; resource: number }>;
};

/** Uma ação de um lutador contra um alvo, aplicando ataque duplo e gasto de recurso. */
export function performAction(attacker: Fighter, target: Fighter, round: number, rng: Rng = Math.random): CombatEvent {
  const a = attacker.adventurer;
  const wantsDouble = rng() < doubleAttackChance(a);
  let hits: 1 | 2 = 1;
  let exhausted = false;
  let cost = RESOURCE_COST_PER_ATTACK;
  if (wantsDouble && attacker.resource >= cost * 2) {
    hits = 2;
    cost *= 2; // ataque duplo gasta o dobro de Stamina/Mana
  } else if (attacker.resource < cost) {
    exhausted = true;
    cost = 0;
  }
  attacker.resource -= cost;

  const perHit = attackDamage(a) * (exhausted ? EXHAUSTED_DAMAGE_MULTIPLIER : 1);
  const damage = Math.round(perHit * hits);
  target.health = Math.max(0, target.health - damage);
  return {
    round,
    attacker: a.name,
    target: target.adventurer.name,
    hits,
    damage,
    resourceSpent: cost,
    exhausted,
    targetDefeated: target.health === 0,
  };
}

/**
 * Luta entre dois times (ex.: Guilda vs Guilda, 3 contra 3).
 * A cada rodada todos os vivos agem, do mais rápido para o mais lento, contra um inimigo vivo sorteado.
 * Usa a Vida e Stamina/Mana atuais dos aventureiros, sem alterar os dados originais.
 */
export function simulateBattle(teamA: AdventurerData[], teamB: AdventurerData[], rng: Rng = Math.random): CombatResult {
  const fighters: Fighter[] = [
    ...teamA.map((a) => ({ adventurer: a, team: 0 as const, health: a.health, resource: a.resource })),
    ...teamB.map((a) => ({ adventurer: a, team: 1 as const, health: a.health, resource: a.resource })),
  ];
  const alive = (team: 0 | 1) => fighters.filter((f) => f.team === team && f.health > 0);
  const log: CombatEvent[] = [];
  let round = 0;

  while (alive(0).length && alive(1).length && round < MAX_ROUNDS) {
    round++;
    const order = turnOrder(fighters.filter((f) => f.health > 0).map((f) => ({ ...f.adventurer, fighter: f })), rng);
    for (const { fighter } of order) {
      if (fighter.health <= 0) continue; // caiu antes de agir
      const enemies = alive(fighter.team === 0 ? 1 : 0);
      if (!enemies.length) break;
      const target = enemies[Math.floor(rng() * enemies.length)];
      log.push(performAction(fighter, target, round, rng));
    }
  }

  const a = alive(0).length;
  const b = alive(1).length;
  const winner = a && !b ? 0 : b && !a ? 1 : null;
  const final = Object.fromEntries(fighters.map((f) => [f.adventurer.id, { health: f.health, resource: f.resource }]));
  return { winner, rounds: round, log, final };
}
