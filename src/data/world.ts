/** As cidades funcionam como "servidores": cada uma tem o seu próprio save. */
export const CITIES = [
  { id: 'krest', name: 'Krest', description: '(inserir aqui descrição da cidade)' },
  { id: 'talgran', name: 'Talgran', description: '(inserir aqui descrição da cidade)' },
  { id: 'ulic', name: 'Ulic', description: '(inserir aqui descrição da cidade)' },
  { id: 'zorac', name: 'Zorac', description: '(inserir aqui descrição da cidade)' },
  { id: 'valgrind', name: 'Valgrind', description: '(inserir aqui descrição da cidade)' },
] as const;

export type CityId = (typeof CITIES)[number]['id'];

export function getCity(id: CityId) {
  return CITIES.find((c) => c.id === id)!;
}
