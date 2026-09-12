/**
 * ============================================================================
 * CONFIGURAÇÃO DO PLANO DE FUNDO (BACKGROUND CONFIGURATION)
 * ============================================================================
 * 
 * Você pode personalizar facilmente o plano de fundo da aplicação alterando
 * as opções abaixo:
 * 
 * 1. Para trocar para uma IMAGEM ÚNICA (Wallpaper/Arte personalizada):
 *    - Mude `mode: 'custom-image'`
 *    - Coloque o link da sua imagem em `customImageUrl`
 * 
 * 2. Para usar uma LISTA PERSONALIZADA DE IMAGENS no mural deslizante:
 *    - Mude `mode: 'custom-posters'`
 *    - Adicione os links em `customPostersList`
 * 
 * 3. Para usar os POSTERS DINÂMICOS DA TEMPORADA (padrão):
 *    - Mantenha `mode: 'posters'`
 */

export interface BackgroundConfig {
  /** Ativa ou desativa o plano de fundo */
  enabled: boolean;
  
  /** 
   * Modo do plano de fundo:
   * - 'posters': Mural dinâmico com os animes da temporada atual
   * - 'custom-image': Uma única imagem estática/paralaxe de alta qualidade
   * - 'custom-posters': Mural deslizante usando sua própria lista de imagens
   */
  mode: 'posters' | 'custom-image' | 'custom-posters';

  /** 
   * URL da imagem personalizada única (usada quando mode = 'custom-image')
   * Exemplos:
   * - URL externa: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1920&q=90'
   * - Imagem local: '/background.jpg' (coloque o arquivo na pasta public/)
   */
  customImageUrl: string;

  /**
   * Lista de URLs personalizadas para o mural deslizante (usada quando mode = 'custom-posters')
   */
  customPostersList: string[];

  /**
   * Opacidade no Desktop / Telas Maiores (0.0 a 1.0)
   * Valor padrão: 0.45 para ser bem visível e nítido
   */
  desktopOpacity: number;

  /**
   * Velocidade da animação no Desktop em segundos
   * Padrão: 65s (mais rápido = número menor, mais lento = número maior)
   */
  animationDurationSeconds: number;

  /**
   * Intensidade do efeito de vinheta/escurecimento nas bordas (0.0 a 1.0)
   * Quanto menor, mais vívidas e visíveis ficam as imagens
   */
  vignetteIntensity: number;
}

export const BACKGROUND_CONFIG: BackgroundConfig = {
  enabled: true,
  mode: 'posters', // Opções: 'posters' | 'custom-image' | 'custom-posters'

  // Caso queira usar uma imagem única personalizada, insira o link aqui:
  customImageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1920&auto=format&fit=crop&q=85',

  // Caso queira definir pôsteres personalizados fixos:
  customPostersList: [
    'https://media.kitsu.app/anime/46474/poster_image/medium-23e1293e41a0b54b6621eb589c3f0d62.jpeg',
    'https://media.kitsu.app/anime/42765/poster_image/medium-d34c203fcd7c3a03a29645f1e44ce747.jpeg',
    'https://media.kitsu.app/anime/44012/poster_image/medium-b7adf5b796a614ae3630153229fe4469.jpeg',
    'https://media.kitsu.app/anime/48915/poster_image/medium-83bb1f545c139c563ecacc57b97f6d40.jpeg',
    'https://media.kitsu.app/anime/poster_images/42080/medium.jpg',
    'https://media.kitsu.app/anime/46231/poster_image/medium-d75b57ef0c9056044cc0e277ac34d6e5.jpeg',
    'https://media.kitsu.app/anime/48269/poster_image/medium-9feb265c75b7016c63b21e122f69a84b.jpeg',
    'https://media.kitsu.app/anime/46300/poster_image/medium-c1c025bbee42bed048e628b1eae278c0.jpeg',
    'https://media.kitsu.app/anime/47271/poster_image/medium-90a981a5a5570ba5fdb809a3152c8348.jpeg',
  ],

  desktopOpacity: 0.42, // Bem visível, permitindo contemplar a arte e a animação
  animationDurationSeconds: 65,
  vignetteIntensity: 0.65,
};
