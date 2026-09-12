import { Season } from '../types';

/**
 * CONFIGURAÇÃO DAS IMAGENS DOS SELOS (POSTERS NAS PASTAS)
 * =========================================================
 * Para trocar as imagens dos selos que aparecem nas pastas das temporadas e dos anos:
 *
 * 1. VOCÊ PODE ALTERAR DIRETAMENTE AS URLs ABAIXO (coloque qualquer link de imagem .jpg, .png, .webp ou caminho local '/assets/...').
 * 2. OU PODE USAR A CONSTANTE `CUSTOM_GLOBAL_STAMP_OVERRIDE` CASO QUEIRA FIXAR UMA IMAGEM ESPECÍFICA PARA TODAS AS PASTAS.
 */

export interface SeasonAnimeHit {
  title: string;
  posterUrl: string;
}

/**
 * SOBREPOSIÇÃO GLOBAL OPCIONAL (Se você quiser forçar imagens específicas personalizadas):
 * Exemplo:
 * export const CUSTOM_GLOBAL_STAMP_OVERRIDE: Partial<Record<Season, SeasonAnimeHit[]>> = {
 *   WINTER: [{ title: 'Meu Poster de Inverno', posterUrl: 'https://exemplo.com/inverno.jpg' }],
 *   SPRING: [{ title: 'Meu Poster de Primavera', posterUrl: 'https://exemplo.com/primavera.jpg' }],
 * };
 */
export const CUSTOM_GLOBAL_STAMP_OVERRIDE: Partial<Record<Season, SeasonAnimeHit[]>> = {};

/**
 * POOL DE IMAGENS POR ANO E TEMPORADA
 * Você pode editar, adicionar ou trocar livremente as imagens de cada temporada aqui.
 * 
 * 💡 COMO ADICIONAR UM NOVO ANO (EX: 2027) E SUAS TEMPORADAS:
 * 
 * - Se você quiser adicionar APENAS a temporada de Janeiro (Inverno):
 *   Basta adicionar apenas a chave WINTER:
 * 
 *   2027: {
 *     WINTER: [
 *       { title: 'Anime Exemplo 1', posterUrl: 'https://link-da-imagem-1.jpg' },
 *       { title: 'Anime Exemplo 2', posterUrl: 'https://link-da-imagem-2.jpg' },
 *     ],
 *   },
 * 
 *   ✨ Automaticamente a pasta do ano 2027 terá APENAS 1 SELO e APENAS 1 PASTA (Janeiro)!
 * 
 * - Futuramente, ao adicionar Abril (Primavera), basta incluir a chave SPRING:
 *   2027: {
 *     WINTER: [ ... ],
 *     SPRING: [ ... ],
 *   },
 *   ✨ Automaticamente o ano passará a ter 2 selos e 2 pastas, e assim por diante!
 */
export const YEAR_SEASON_POOLS: Record<number, Partial<Record<Season, SeasonAnimeHit[]>>> = {
  2026: {
    WINTER: [
      {
        title: 'Sousou no Frieren 2nd Season',
        posterUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx182255-butzrqd4I0aC.jpg',
      },
      {
        title: 'Jujutsu Kaisen: Shimetsu Kaiyu',
        posterUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx172463-LnXqHzt74SJL.jpg',
      },
      {
        title: "Fate/strange Fake",
        posterUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx166617-34fpC9y47tTx.png',
      },
    ],
    SPRING: [
      {
        title: 'Re:zero 4',
        posterUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx189046-yaHWtS5FII46.jpg',
      },
      {
        title: 'Witch hat Atelier',
        posterUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx147105-rwOX8qyUy8gV.jpg',
      },
      {
        title: 'Yomi no Tsugai',
        posterUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx195600-moI0UFArtOme.jpg',
      },
    ],
    SUMMER: [
      {
        title: 'Bleach: Sennen Kessen-hen',
        posterUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx185874-aU3e6tBT6wwA.jpg',
      },
      {
        title: 'Jaadugar',
        posterUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx190569-KnCQLI3Z8hPX.jpg',
      },
      {
        title: 'the ghost in the shell',
        posterUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx177699-VHMezCGf48nM.jpg',
      },
    ],
    FALL: [
      {
        title: 'the apothecary diaries 3',
        posterUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx195516-MJpUZlOberqH.jpg',
      },
      {
        title: 'cyberpunk: edgerunners 2',
        posterUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx195539-jaarfaxv6K0Z.jpg',
      },
      {
        title: 'Black clover 2',
        posterUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx195604-8xUI10lVVhPY.jpg',
      },
    ],
  },
};

/**
 * Retorna os selos para uma determinada temporada e ano
 */
export function getSeasonStampHits(year: number, season: Season): SeasonAnimeHit[] {
  // 1. Verifica se existe override customizado global
  if (CUSTOM_GLOBAL_STAMP_OVERRIDE[season] && CUSTOM_GLOBAL_STAMP_OVERRIDE[season]!.length > 0) {
    return CUSTOM_GLOBAL_STAMP_OVERRIDE[season]!;
  }

  // 2. Busca no pool do ano
  const pool = YEAR_SEASON_POOLS[year]?.[season] || YEAR_SEASON_POOLS[2026]?.[season];
  if (!pool || pool.length <= 3) return pool || [];
  
  // Retorna os hits
  return pool;
}

/**
 * Seleciona 3 hits aleatórios do pool para rotação suave
 */
export function selectThreeRandomSeasonHits(year: number, season: Season): SeasonAnimeHit[] {
  const pool = getSeasonStampHits(year, season);
  if (!pool || pool.length <= 3) return pool || [];
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
}
