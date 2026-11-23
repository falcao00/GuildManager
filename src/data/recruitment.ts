import type { Rank } from './adventurers';

/** Quantos candidatos aparecem por dia no Recrutamento. */
export const DAILY_CANDIDATES = 5;

/** Preço em ouro para recrutar um aventureiro de cada rank. */
export const RECRUIT_COST: Record<Rank, number> = {
  D: 100,
  C: 300,
  B: 700,
  A: 1200,
  S: 2000,
  SS: 5000,
};

/**
 * Chance (em %) de cada rank aparecer entre os candidatos, conforme o prestígio
 * da guilda. Cada faixa vale a partir de `minPrestige` até a próxima faixa.
 */
export const RANK_ODDS_BY_PRESTIGE: { minPrestige: number; odds: Partial<Record<Rank, number>> }[] = [
  { minPrestige: 0, odds: { D: 85, C: 14, B: 1 } }, //       0 a 100
  { minPrestige: 101, odds: { D: 50, C: 30, B: 15, A: 5 } }, // 101 a 500
  { minPrestige: 501, odds: { D: 20, C: 50, B: 20, A: 10 } }, // 501 a 1000
  { minPrestige: 1001, odds: { B: 50, A: 40, S: 10 } }, //   1001 a 2000
  { minPrestige: 2001, odds: { A: 60, S: 40 } }, //            acima de 2000
];

export function rankOddsFor(prestige: number) {
  let current = RANK_ODDS_BY_PRESTIGE[0];
  for (const tier of RANK_ODDS_BY_PRESTIGE) if (prestige >= tier.minPrestige) current = tier;
  return current.odds;
}
