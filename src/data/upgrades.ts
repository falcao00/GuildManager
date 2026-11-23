/** Melhorias da guilda (expansões compradas com ouro no salão). Valores são padrões e podem mudar. */

export type UpgradeId = 'dormitorios' | 'quadro' | 'arsenal';

export type UpgradeDef = {
  name: string;
  description: string;
  /** Rótulo do valor, ex.: "aventureiros". */
  unit: string;
  /** Valor em cada nível (índice 0 = nível 1). */
  values: number[];
  /** Custo em ouro para subir do nível N para o N+1 (índice 0 = do 1 para o 2). */
  costs: number[];
};

export const UPGRADES: Record<UpgradeId, UpgradeDef> = {
  dormitorios: {
    name: 'Dormitórios',
    description: 'Aumenta o limite de aventureiros da guilda.',
    unit: 'aventureiros',
    values: [6, 10, 15, 20, 30],
    costs: [300, 800, 2000, 5000],
  },
  quadro: {
    name: 'Quadro de Missões',
    description: 'Aumenta o número de missões disponíveis.',
    unit: 'missões',
    values: [3, 5, 7, 10, 15],
    costs: [250, 700, 1800, 4500],
  },
  arsenal: {
    name: 'Arsenal',
    description: 'Aumenta o número de espaços de loot do inventário.',
    unit: 'espaços de loot',
    values: [16, 24, 32, 40, 48],
    costs: [200, 600, 1500, 4000],
  },
};

export const UPGRADE_IDS = Object.keys(UPGRADES) as UpgradeId[];
export const maxUpgradeLevel = (id: UpgradeId) => UPGRADES[id].values.length;
export const upgradeValue = (id: UpgradeId, level: number) => UPGRADES[id].values[Math.min(level, maxUpgradeLevel(id)) - 1];
/** Custo para subir a partir de `level`, ou null se já está no máximo. */
export const upgradeCost = (id: UpgradeId, level: number): number | null => UPGRADES[id].costs[level - 1] ?? null;
