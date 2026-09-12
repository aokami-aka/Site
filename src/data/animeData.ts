import { AnimeItem, SeasonDefinition, Season } from '../types';
import { YEAR_SEASON_POOLS } from './folderStamps';

/**
 * ============================================================================
 * DETECÇÃO AUTOMÁTICA DA TEMPORADA ATUAL (BASEADA NA DATA DO SISTEMA)
 * ============================================================================
 * 
 * Calcula dinamicamente a temporada oficial e o ano atual usando a data do sistema (new Date()):
 * - Janeiro ~ Março (meses 0, 1, 2): Inverno (WINTER)
 * - Abril ~ Junho (meses 3, 4, 5): Primavera (SPRING)
 * - Julho ~ Setembro (meses 6, 7, 8): Verão (SUMMER)
 * - Outubro ~ Dezembro (meses 9, 10, 11): Outono (FALL)
 */
export function getSystemSeasonConfig(date: Date = new Date()): { year: number; season: Season } {
  const month = date.getMonth(); // 0 a 11
  const year = date.getFullYear();

  let season: Season = 'WINTER';
  if (month >= 0 && month <= 2) {
    season = 'WINTER';
  } else if (month >= 3 && month <= 5) {
    season = 'SPRING';
  } else if (month >= 6 && month <= 8) {
    season = 'SUMMER';
  } else {
    season = 'FALL';
  }

  return { year, season };
}

// Configuração calculada automaticamente pelo sistema em tempo real:
export const CURRENT_SEASON_CONFIG: { year: number; season: Season } = getSystemSeasonConfig();

export const SEASONS_LIST: SeasonDefinition[] = [
  {
    key: 'WINTER',
    labelPt: 'Inverno',
    monthPt: 'Janeiro',
    quarterPt: 'Janeiro - Março',
    monthsRange: 'Jan ~ Mar',
    iconName: 'Snowflake',
    order: 1,
  },
  {
    key: 'SPRING',
    labelPt: 'Primavera',
    monthPt: 'Abril',
    quarterPt: 'Abril - Junho',
    monthsRange: 'Abr ~ Jun',
    iconName: 'Sakura',
    order: 2,
  },
  {
    key: 'SUMMER',
    labelPt: 'Verão',
    monthPt: 'Julho',
    quarterPt: 'Julho - Setembro',
    monthsRange: 'Jul ~ Set',
    iconName: 'SunHanabi',
    order: 3,
  },
  {
    key: 'FALL',
    labelPt: 'Outono',
    monthPt: 'Outubro',
    quarterPt: 'Outubro - Dezembro',
    monthsRange: 'Out ~ Dez',
    iconName: 'MapleLeaf',
    order: 4,
  },
];

export const GENRES_LIST = [
  'Mostrar Todos',
  'Aventura',
  'Ação',
  "Boy's Love",
  'Comédia',
  'Drama',
  'Ecchi',
  'Escolar',
  'Esporte',
  'Fantasia',
  'Ficção Científica',
  'Histórico',
  'Isekai',
  'Josei',
  'Mecha',
  'Mistério',
  'Psicológico',
  'Romance',
  'Seinen',
  'Shoujo',
  'Shounen',
  'Slice of Life',
  'Sobrenatural',
  'Suspense',
  'Terror',
  'Yuri',
];

export const TYPES_LIST = [
  'Todos os Tipos',
  'Continuação',
  'Especial - TV',
  'Estréia',
  'Filme',
  'OVA',
  'ONA',
] as const;

/**
 * ============================================================================
 * CONFIGURAÇÃO DE ANOS E TEMPORADAS DISPONÍVEIS
 * ============================================================================
 * 
 * 📌 COMO ADICIONAR UM NOVO ANO (EX: 2027) E SUAS TEMPORADAS:
 * 
 * 1. Para adicionar APENAS a temporada de Janeiro (Inverno):
 *    No objeto `ACTIVE_SEASONS_BY_YEAR` abaixo, adicione:
 *        2027: ['WINTER'],
 *    (OU adicione diretamente no arquivo `src/data/folderStamps.ts` na constante `YEAR_SEASON_POOLS`:
 *        2027: { WINTER: [ ... ] })
 * 
 *    ✨ RESULTADO AUTOMÁTICO:
 *    - O ano 2027 aparecerá automaticamente na lista de anos.
 *    - Terá APENAS 1 SELO (da temporada de Janeiro) na pasta do ano.
 *    - Ao abrir o ano 2027, haverá APENAS a pasta de Janeiro (Inverno).
 * 
 * 2. Quando você quiser liberar a temporada de Abril (Primavera):
 *    Altere para:
 *        2027: ['WINTER', 'SPRING'],
 *    ✨ RESULTADO: Passará a ter automaticamente 2 SELOS e 2 PASTAS!
 * 
 * 3. Quando liberar Julho (Verão):
 *        2027: ['WINTER', 'SPRING', 'SUMMER'],
 *    ✨ RESULTADO: Passará a ter automaticamente 3 SELOS e 3 PASTAS!
 * 
 * 4. Quando liberar o ano completo com as 4 estações:
 *        2027: ['WINTER', 'SPRING', 'SUMMER', 'FALL'],
 *    ✨ RESULTADO: 4 SELOS e 4 PASTAS completas!
 */

export type SeasonKey = Season;

export const ACTIVE_SEASONS_BY_YEAR: Record<number, SeasonKey[]> = {
  // Exemplo para quando você quiser adicionar 2027 com apenas Janeiro:
  // 2027: ['WINTER'],
  2026: ['WINTER', 'SPRING', 'SUMMER', 'FALL'],
};

/**
 * Retorna as chaves das temporadas ativas configuradas para determinado ano.
 * Se o ano foi configurado com apenas 1 temporada (ex: ['WINTER']), retornará APENAS essa temporada,
 * garantindo que apenas 1 selo e 1 pasta sejam exibidos.
 */
export function getActiveSeasonKeysForYear(year: number): SeasonKey[] {
  // 1. Prioridade: Se configurado explicitamente em ACTIVE_SEASONS_BY_YEAR
  if (ACTIVE_SEASONS_BY_YEAR[year] && ACTIVE_SEASONS_BY_YEAR[year].length > 0) {
    return ACTIVE_SEASONS_BY_YEAR[year];
  }

  // 2. Se o usuário cadastrou temporadas diretamente em YEAR_SEASON_POOLS (folderStamps.ts)
  const pool = YEAR_SEASON_POOLS[year];
  if (pool) {
    const validSeasons: SeasonKey[] = ['WINTER', 'SPRING', 'SUMMER', 'FALL'];
    const keysInPool = validSeasons.filter((k) => pool[k] && pool[k]!.length > 0);
    if (keysInPool.length > 0) {
      return keysInPool;
    }
  }

  // 4. Se for um ano futuro ainda sem configuração, começa somente com Janeiro (1 selo, 1 pasta)
  return ['WINTER'];
}

/**
 * Retorna as definições de temporadas ativas configuradas para determinado ano.
 */
export function getActiveSeasonsForYear(year: number): SeasonDefinition[] {
  const activeKeys = getActiveSeasonKeysForYear(year);
  return SEASONS_LIST.filter((s) => activeKeys.includes(s.key as SeasonKey));
}

// Lista dinâmica de anos: detecta automaticamente anos adicionados em ACTIVE_SEASONS_BY_YEAR ou YEAR_SEASON_POOLS
const systemYear = CURRENT_SEASON_CONFIG.year;
const defaultYears = [2026];
export const YEARS_LIST: number[] = Object.keys(ACTIVE_SEASONS_BY_YEAR)
  .map(Number)
  .filter((y): y is number => !isNaN(y) && y >= 2000)
  .sort((a, b) => b - a);