/**
 * Jikan API Integration
 * Busca dados de animes dinamicamente da Jikan API (MyAnimeList)
 */

// Cache para evitar requisições repetidas
// Chave única para o LocalStorage para persistência entre sessões
const CACHE_STORAGE_KEY = 'jikan_anime_cache_v1';
const CACHE_EXPIRATION_MS = 3 * 24 * 60 * 60 * 1000; // 3 dias em milissegundos

// Inicializa o cache a partir do LocalStorage ou como um objeto vazio
const jikanCache = (() => {
    try {
        const saved = localStorage.getItem(CACHE_STORAGE_KEY);
        if (!saved) return {};

        const parsed = JSON.parse(saved);
        const lastCleanup = parsed._metadata?.lastGlobalCleanup || 0;

        // Verifica se o cache global expirou (3 dias)
        if (Date.now() - lastCleanup > CACHE_EXPIRATION_MS) {
            console.log('[Cache] Expiração de 3 dias atingida. Limpando cache para renovação total...');
            localStorage.removeItem(CACHE_STORAGE_KEY);
            return {};
        }
        return parsed;
    } catch (e) {
        console.error('[Cache] Erro ao carregar do LocalStorage:', e);
        return {};
    }
})();

/**
 * Salva o estado atual do jikanCache no LocalStorage
 */
function saveCacheToLocalStorage() {
    try {
        // Garante que o timestamp de limpeza global exista nos metadados
        if (!jikanCache._metadata) jikanCache._metadata = {};
        if (!jikanCache._metadata.lastGlobalCleanup) {
            jikanCache._metadata.lastGlobalCleanup = Date.now();
        }

        localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(jikanCache));
    } catch (e) {
        // Caso o LocalStorage esteja cheio (limite de ~5MB atingido), avisa no console
        console.warn('[Cache] Erro ao salvar no LocalStorage (provavelmente limite excedido):', e);
    }
}

// Flag para controlar se a temporada foi carregada
let seasonDataLoaded = false;
let seasonLoadingPromise = null;

/**
 * Função auxiliar para realizar fetch na Jikan com tratamento de erro 429 (Rate Limit)
 */
async function fetchJikan(url, retries = 2, delay = 1500) {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        if (response.status === 429 && retries > 0) {
            console.warn(`[Jikan] Rate limit atingido. Tentando novamente em ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchJikan(url, retries - 1, delay * 2);
        }
        return response;
    } catch (error) {
        throw error;
    }
}

/**
 * Formata APENAS dados essenciais para carregamento rápido
 * Incluindo: titulo, generos, data de lançamento, tipo, e thumb da imagem
 * Não faz traduções, não busca imagens extras, apenas o essencial
 */
function formatJikanDataMinimal(anime) {
    const releaseType = determineReleaseType(anime);
    
    // Extrai a URL da imagem (thumbnail)
    const thumbUrl = anime.images?.jpg?.image_url || 
                     anime.images?.jpg?.large_image_url || 
                     '';
    
    return {
        title: anime.title || anime.title_japanese || 'N/A',
        titleEnglish: anime.title_english || anime.title || '',
        thumb1: thumbUrl,  // ✅ URL da thumbnail já carregada
        genre: formatGenres(anime.genres),
        time: formatAiredDate(anime.aired),
        type: releaseType,
        status: formatStatus(anime.status),
        score: anime.score ? anime.score.toFixed(2) : 'N/A',
        // Campos vazios que serão preenchidos quando o usuario clicar
        synopsis: '',
        director: '',
        directorLink: '',
        directorWorks: 'N/A',
        director2: '',
        director2Link: '',
        studioWorks: 'N/A',
        studio: { url: '', name: 'N/A' },
        studioLink: '',
        studio2: '',
        studio2Link: '',
        duration: formatDuration(anime.episodes, anime.duration),
        commentary: '',
        anidb: 'false',
        mal: anime.url || '',
        cr: 'false',
        netflix: 'false',
        youtube: 'false',
        disney: 'false',
        caption2: 'Opening',
        caption3: 'Ending',
        _isMinimal: true  // Flag para indicar que é versão simplificada
    };
}

/**
 * Formata status de forma simples (sem esperar tradução)
 */
function formatStatus(status) {
    if (!status) return 'Desconhecido';
    const statusStr = status.toLowerCase();
    if (statusStr.includes('not yet aired')) return 'Ainda irá lançar';
    if (statusStr.includes('currently airing')) return 'Em lançamento';
    if (statusStr.includes('finished airing')) return 'Completo';
    return 'Desconhecido';
}

/**
 * Busca TODOS os animes de uma temporada em UMA ÚNICA REQUISIÇÃO (VERSÃO OTIMIZADA)
 * Carrega APENAS: titulo, generos, data de lançamento, tipo (estreia/continuação)
 * Muito mais eficiente que fazer requisições individuais
 * @param {number} year - Ano (ex: 2026)
 * @param {string} season - Temporada (ex: 'summer', 'spring', 'winter', 'fall')
 * @returns {Promise<void>}
 */
async function fetchSeasonAnimes(year, season) {
    if (seasonDataLoaded) {
        console.log('Dados da temporada já foram carregados');
        return;
    }

    // Se já há uma requisição em andamento, aguarda
    if (seasonLoadingPromise) {
        return await seasonLoadingPromise;
    }

    seasonLoadingPromise = (async () => {
        try {
            const seasonKey = `${season}_${year}`;

            // Se os dados desta temporada já estão no cache, não fazemos novas requisições.
            // A renovação ocorrerá automaticamente quando o cache global de 3 dias expirar.
            if (jikanCache._metadata?.[seasonKey]) {
                console.log(`[Cache] Usando dados salvos para a temporada ${seasonKey}.`);
                seasonDataLoaded = true;
                return;
            }

            console.log(`Iniciando busca da temporada ${season} ${year} na API...`);
            
            let page = 1;
            let hasNextPage = true;
            let totalBuscados = 0;
            const startTime = performance.now();

            // Reutiliza o resultado da primeira chamada para a página 1
            while (hasNextPage && page <= 3) {
                const response = await fetchJikan(`https://api.jikan.moe/v4/seasons/${year}/${season}?page=${page}&limit=25`);
                if (!response.ok) break;
                
                const result = await response.json();
                const animes = result.data || [];

                if (animes.length === 0) {
                    hasNextPage = false;
                    break;
                }

                // Para cada anime da temporada, armazena em cache (APENAS DADOS ESSENCIAIS)
                for (const anime of animes) {
                    if (!anime.mal_id) continue;
                    
                    // Se já existe um cache COMPLETO (não minimal) vindo do LocalStorage, 
                    // não sobrescrevemos com o minimal da temporada para não perder dados detalhados.
                    if (jikanCache[anime.mal_id] && !jikanCache[anime.mal_id]._isMinimal) continue;

                    // Formata APENAS dados mínimos - sem traduções, sem requisições extras
                    const minimalData = formatJikanDataMinimal(anime);
                    
                    jikanCache[anime.mal_id] = minimalData;
                    totalBuscados++;
                }

                // Salva metadados da temporada na primeira página
                if (page === 1 && result.pagination?.items?.total) {
                    if (!jikanCache._metadata) jikanCache._metadata = {};
                    jikanCache._metadata[seasonKey] = { total: result.pagination.items.total, timestamp: Date.now() };
                }

                saveCacheToLocalStorage();

                // Verifica se há próxima página
                hasNextPage = result.pagination?.has_next_page || false;
                page++;

                // NÃO aguarda entre páginas - pode fazer requisições em paralelo
                // A API não vai bloquear para requisições de /seasons (diferente de /anime/{id}/full)
            }

            const endTime = performance.now();
            const loadTime = (endTime - startTime).toFixed(2);
            console.log(`✓ Temporada carregada em ${loadTime}ms! ${totalBuscados} animes em cache`);
            seasonDataLoaded = true;

        } catch (error) {
            console.error('Erro ao buscar temporada:', error);
        }
    })();

    return await seasonLoadingPromise;
}

/**
 * Busca dados completos de um anime (com detalhes extras como diretor, imagens)
 * Se encontrar dados minimalistas em cache, faz upgrade para dados completos
 * @param {number} animeId - ID do anime no MyAnimeList
 * @returns {Promise<Object>} Dados do anime formatados para o site
 */
async function fetchAnimeFromJikan(animeId) {
    if (!animeId) {
        console.warn('Nenhum ID de anime fornecido');
        return null;
    }

    // Se os dados em cache são minimalistas, fazer upgrade para completos
    const cachedData = jikanCache[animeId];
    if (cachedData && cachedData._isMinimal) {
        console.log(`Upgrading dados minimalistas para completos - ID: ${animeId}`);
        // Continua para fazer requisição completa
    } else if (cachedData) {
        console.log(`Usando cache completo para anime ID: ${animeId}`);
        return cachedData;
    }

    try {
        console.log(`Buscando dados completos do anime ID: ${animeId}...`);
        
        const response = await fetchJikan(`https://api.jikan.moe/v4/anime/${animeId}/full`);

        if (!response.ok) {
            console.error(`Erro na requisição Jikan API: ${response.status}`);
            return cachedData || null; // Retorna dados minimalistas se disponíveis
        }

        const result = await response.json();
        const anime = result.data;

        if (!anime) {
            console.error('Dados do anime não encontrados');
            return cachedData || null;
        }

        const producerId = anime.studios && anime.studios[0] ? anime.studios[0].mal_id : null;

        // Buscamos o endpoint de imagens extras da API para a galeria ao abrir o card
        console.log(`Buscando galeria de imagens para anime ID: ${animeId}...`);
        const picturesResponse = await fetchJikan(`https://api.jikan.moe/v4/anime/${animeId}/pictures`).catch(() => null);
        let extraImages = [];
        if (picturesResponse && picturesResponse.ok) {
            const picsResult = await picturesResponse.json();
            extraImages = picsResult.data || [];
        }

        // Executa a busca do Diretor e das Obras do Estúdio em paralelo
        const [directorData, studioWorksData] = await Promise.all([
            fetchDirectorFromJikan(animeId, anime.title || anime.title_english),
            fetchStudioWorks(producerId)
        ]);

        // Passamos a lista de imagens extras obtidas para a formatação
        const formattedData = await formatJikanData(anime, directorData, studioWorksData, producerId, extraImages);
        
        // Mescla com dados minimalistas que já tínhamos (se houver)
        if (cachedData) {
            formattedData._isMinimal = false; // Marca como agora completo
        }
        
        jikanCache[animeId] = formattedData;
        saveCacheToLocalStorage();
        
        console.log('Dados do anime buscados com sucesso:', formattedData);
        return formattedData;

    } catch (error) {
        console.error('Erro ao buscar dados da Jikan API:', error);
        return cachedData || null;
    }
}

/**
 * Formata dados da Jikan API para o formato esperado pelo site
 */
async function formatJikanData(anime, directorData = { name: 'N/A', link: '', works: 'N/A' }, studioWorksData = 'N/A', producerId = null, extraImages = []) {
    const rawSynopsis = anime.synopsis || 'Sinopse não disponível';
    const translatedSynopsis = await translateToPortuguese(rawSynopsis);
    const releaseType = determineReleaseType(anime);

    // Link direto da CDN do MyAnimeList para o logo do estúdio
    let remoteStudioLogo = '';
    if (producerId) {
        remoteStudioLogo = `https://cdn.myanimelist.net/images/company/${producerId}.png`;
    }

    // Captura o nome do estúdio principal com fallback seguro para 'N/A'
    const cleanStudioName = (anime.studios && anime.studios[0]) ? anime.studios[0].name : 'N/A';
    

    // Processamento das imagens da galeria (para quando o card for expandido)
    const allPosters = [];
    const mainPoster = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;
    if (mainPoster) {
        allPosters.push(mainPoster);
    }
    extraImages.forEach(imgObj => {
        const highQualImg = imgObj.jpg?.large_image_url || imgObj.jpg?.image_url;
        if (highQualImg && !allPosters.includes(highQualImg)) {
            allPosters.push(highQualImg);
        }
    });

        // Função auxiliar interna para limpar caracteres japoneses e parênteses extras
    const cleanThemeText = (text) => {
        return text
            .replace(/[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF\u2605-\u2606\u2190-\u2195\u203B]/g, '') // Remove Kanji, Hiragana, Katakana e símbolos asiáticos
            .replace(/\s*\([^)]*\)/g, '') // Remove qualquer texto entre parênteses, ex: (Onboard), (eps 1-12)
            .replace(/\s+/g, ' ') // Remove espaços duplicados
            .trim();
    };

// --- ALTERAR ESTE BLOCO DENTRO DE formatJikanData ---
    
        // Captura e formata os dados de Abertura da API (/full)
    let dynamicCaption2 = 'Opening';
    if (anime.theme && anime.theme.openings && anime.theme.openings.length > 0) {
        let rawOp = anime.theme.openings[0];
        // Limpa números iniciais (ex: "1: ") e aspas da string
        let cleanOp = rawOp.replace(/^\d+:\s*/, '').replace(/"/g, '');
        
        // Divide no padrão " by " para isolar o nome da música e da banda
        if (cleanOp.includes(' by ')) {
        let parts = cleanOp.split(' by ');
        let musica = cleanThemeText(parts[0]);
        let banda = cleanThemeText(parts[1]);
        dynamicCaption2 = `OP | ${musica} | ${banda}`;
    } else {
        dynamicCaption2 = `OP | ${cleanThemeText(cleanOp)}`;
    }
}

    // Captura e formata os dados de Encerramento da API (/full)
    let dynamicCaption3 = 'Ending';
    if (anime.theme && anime.theme.endings && anime.theme.endings.length > 0) {
        let rawEd = anime.theme.endings[0];
        let cleanEd = rawEd.replace(/^\d+:\s*/, '').replace(/"/g, '');
        
        if (cleanEd.includes(' by ')) {
        let parts = cleanEd.split(' by ');
        let musica = cleanThemeText(parts[0]);
        let banda = cleanThemeText(parts[1]);
        dynamicCaption3 = `ED | ${musica} | ${banda}`;
    } else {
        dynamicCaption3 = `ED | ${cleanThemeText(cleanEd)}`;
    }
}

        // Descobre o status formatado em PT-BR
    let dynamicStatus = 'Desconhecido';
    const apiStatus = anime.status ? anime.status.toLowerCase() : '';

    if (apiStatus.includes('not yet aired')) {
        dynamicStatus = 'Ainda irá lançar';
    } else if (apiStatus.includes('currently airing')) {
        // Se o total de episódios for conhecido (ex: 12), mostra "Em lançamento"
        // Nota: Como a API principal não dá o número exato do episódio de hoje em tempo real de forma simples,
        // o padrão "Em lançamento" com a informação de episódios ao lado já resolve visualmente muito bem.
        dynamicStatus = 'Em lançamento';
    } else if (apiStatus.includes('finished airing')) {
        dynamicStatus = 'Completo';
    }

    const animeScore = anime.score ? anime.score.toFixed(2) : 'N/A';

    const data = {
        title: anime.title || anime.title_japanese || 'N/A',
        titleEnglish: anime.title_english || anime.title || '',
        synopsis: translatedSynopsis.replace(/\n/g, '\n'),
        genre: formatGenres(anime.genres),
        
        director: directorData.name, 
        directorLink: directorData.link,
        directorWorks: directorData.works, 
        director2: '',
        director2Link: '',
        
        studioWorks: studioWorksData,
        studio: {
            url: remoteStudioLogo,
            name: cleanStudioName
        }, 
        studioLink: anime.studios && anime.studios[0] ? anime.studios[0].url : '',
        studio2: '',
        studio2Link: '',
        
        time: formatAiredDate(anime.aired),
        duration: formatDuration(anime.episodes, anime.duration),
        type: releaseType,
        status: dynamicStatus,
        score: animeScore,
        commentary: '', 
        anidb: (anime.external && anime.external.length > 0) 
        ? (anime.external.find(item => item.name.toLowerCase() === 'anidb')?.url || 'false') 
        : 'false',
        mal: anime.url || '',
        cr: getStreamingLink(anime, 'crunchyroll'),
        netflix: getStreamingLink(anime, 'netflix'),
        youtube: getStreamingLink(anime, 'youtube'),
        disney: getStreamingLink(anime, 'disney'),

        // ALTERE ESSAS DUAS LINHAS ABAIXO (Troque 'opening' por 'caption2' e 'ending' por 'caption3')
        caption2: dynamicCaption2,
        caption3: dynamicCaption3
    };

    // Mapeia sequencialmente as thumbs da galeria obtidas da API
    allPosters.forEach((posterUrl, index) => {
        data[`thumb${index + 1}`] = posterUrl;
    });

    return data;
}

/**
 * Traduz e formata a lista de gêneros em PT-BR
 */
function formatGenres(genres) {
    if (!genres || genres.length === 0) return 'N/A';

    const genreTranslations = {
        'Action': 'Ação', 'Adventure': 'Aventura', 'Comedy': 'Comédia', 'Drama': 'Drama',
        'Fantasy': 'Fantasia', 'Horror': 'Terror', 'Mystery': 'Mistério', 'Romance': 'Romance',
        'Sci-Fi': 'Ficção Científica', 'Slice of Life': 'Slice of Life', 'Sports': 'Esportes',
        'Supernatural': 'Sobrenatural', 'Suspense': 'Suspense', 'Award Winning': 'Premiado',
        'Boys Love': 'Boys Love', 'Girls Love': 'Yuri', 'Gourmet': 'Culinária', 'Ecchi': 'Ecchi',
        'Avant Garde': 'Vanguarda'
    };

    return genres.map(g => genreTranslations[g.name] || g.name).join(', ');
}

/**
 * Formata lista nominal padrão de estúdios
 */
function formatStudios(studios) {
    if (!studios || studios.length === 0) return 'N/A';
    return studios.map(s => s.name).join(', ');
}

/**
 * Formata data de lançamento (DD/MM)
 */
function formatAiredDate(aired) {
    if (!aired || !aired.from) return 'TBA';
    
    const date = new Date(aired.from);
    if (isNaN(date.getTime())) return 'TBA';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    return `${day}/${month}`;
}

/**
 * Formata informação de duração/episódios
 */
function formatDuration(episodes, duration) {
    if (!episodes || String(episodes).toUpperCase() === 'TBA') return '???';
    return String(episodes);
}

/**
 * Obtém link de plataforma de streaming
 */
function getStreamingLink(anime, platform) {
    if (!anime || !anime.streaming) return 'false';
    
    const found = anime.streaming.find(s => 
        s.name.toLowerCase().includes(platform.toLowerCase())
    );
    
    return found && found.url ? found.url : 'false';
}

/**
 * Merge dados da Jikan API com dados existentes (Preservando as fotos da galeria)
 */
function mergeJikanData(existingData, jikanData) {
    if (!jikanData) return existingData;
    
    const merged = {
        ...existingData,
        title: jikanData.title || existingData.title,
        titleEnglish: jikanData.titleEnglish || existingData.titleEnglish,
        synopsis: jikanData.synopsis || existingData.synopsis,
        genre: jikanData.genre || existingData.genre,
        type: jikanData.type || existingData.type,
        duration: jikanData.duration || existingData.duration,
        time: jikanData.time || existingData.time,
        status: existingData.status || jikanData.status,
        score: existingData.score || jikanData.score,
        
        director: existingData.director || jikanData.director,
        directorLink: existingData.directorLink || jikanData.directorLink,
        director2: existingData.director2,
        directorWorks: jikanData.directorWorks !== 'N/A' ? jikanData.directorWorks : (existingData.directorWorks || 'N/A'),
        director2Link: existingData.director2Link,
        
        studioWorks: jikanData.studioWorks !== 'N/A' ? jikanData.studioWorks : (existingData.studioWorks || 'N/A'),
        studio: jikanData.studio || existingData.studio,
        studioLink: jikanData.studioLink || existingData.studioLink,
        studio2: existingData.studio2,
        studio2Link: existingData.studio2Link,
        commentary: existingData.commentary,
        mal: (existingData.mal && existingData.mal !== '#' && existingData.mal !== '') ? existingData.mal : jikanData.mal,
        anidb: (existingData.anidb && existingData.anidb !== 'nolink' && existingData.anidb !== 'false' && existingData.anidb.trim() !== '') 
        ? existingData.anidb 
        : jikanData.anidb,
        cr: (existingData.cr && existingData.cr !== '' && existingData.cr !== 'false') ? existingData.cr : jikanData.cr,
        netflix: (existingData.netflix && existingData.netflix !== '' && existingData.netflix !== 'false') ? existingData.netflix : jikanData.netflix,
        youtube: (existingData.youtube && existingData.youtube !== '' && existingData.youtube !== 'false') ? existingData.youtube : jikanData.youtube,
        disney: (existingData.disney && existingData.disney !== '' && existingData.disney !== 'false') ? existingData.disney : jikanData.disney,

        // ADICIONE ESTAS DUAS LINHAS AQUI NO FINAL DO OBJETO:
        caption2: (existingData.caption2 && existingData.caption2 !== 'Opening') ? existingData.caption2 : jikanData.caption2,
        caption3: (existingData.caption3 && existingData.caption3 !== 'Ending') ? existingData.caption3 : jikanData.caption3
    };

    // Repasse automático das chaves de thumbs adicionais da galeria vindas da API
    Object.keys(jikanData).forEach(key => {
        if (key.startsWith('thumb')) {
            merged[key] = jikanData[key];
        }
    });

    Object.keys(existingData).forEach(key => {
        if (key.startsWith('thumb') && existingData[key] && existingData[key] !== '' && existingData[key] !== '#') {
            merged[key] = existingData[key];
        }
    });

    return merged;
}

/**
 * Busca obras populares do estúdio, filtrando continuações repetidas
 */
async function fetchStudioWorks(producerId) {
    if (!producerId || isNaN(producerId)) return 'N/A';
    
    try {
        const url = `https://api.jikan.moe/v4/anime?producers=${producerId}&order_by=members&sort=desc&page=1&limit=15`;
        const response = await fetchJikan(url);

        if (!response.ok) return 'N/A';

        const result = await response.json();
        const animeList = result.data;

        if (!animeList || animeList.length === 0) return 'N/A';

        const uniqueWorks = [];
        const seenKeywords = new Set();

        for (const anime of animeList) {
            if (uniqueWorks.length >= 3) break;

            const title = anime.title;
            const cleanTitle = title.toLowerCase().replace(/[^a-z0-9\s]/g, ''); 
            const words = cleanTitle.split(' ').filter(w => w.length > 2); 
            const mainKeyword = words.slice(0, 2).join(' '); 

            if (seenKeywords.has(mainKeyword)) continue; 

            uniqueWorks.push(title);
            seenKeywords.add(mainKeyword);
        }

        return uniqueWorks.length > 0 ? uniqueWorks.join(', ') : 'N/A';

    } catch (error) {
        return 'N/A';
    }
}

/**
 * Função auxiliar para normalizar título de anime e extrair a série base
 * Remove termos de sequência como Season, Part, etc.
 */
function getBaseSeriesName(title) {
    if (!title) return '';
    return title
        .toLowerCase()
        .replace(/\s*(season|s)\s*\d+/gi, '')
        .replace(/\s*(part|pt\.?)\s*[2-9ivxlcdm]/gi, '')
        .replace(/\s*(2nd|3rd|4th|5th|second|third|fourth|fifth)\s+(season|series)/gi, '')
        .replace(/:\s*(season|part).*$/gi, '')
        // Remove numeração romana isolada (II, III, etc) antes de dois pontos ou fim da linha
        .replace(/\s+[ivx]+\s*(?=:|$)/gi, '')
        .replace(/[\s\.]*[2-9]\s*$/i, '') // Remove " 2", ". 2", etc. no final da string
        .replace(/[\s\.]+$/i, '') // Remove espaços/pontos finais restantes
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Busca obras famosas do diretor usando a API GraphQL estável do AniList (Evita Rate Limits do Jikan)
 */
async function fetchDirectorWorksFromAniList(directorName, currentAnimeTitle = '') {
    if (!directorName || directorName === 'N/A') return 'N/A';

    // Query GraphQL para buscar a pessoa pelo nome e trazer seus animes de maior sucesso (Popularidade)
    const query = `
    query ($search: String) {
      Staff (search: $search) {
        staffMedia (sort: POPULARITY_DESC, perPage: 25) {
          edges {
            staffRole
            node {
              title {
                romaji
                english
              }
              type
            }
          }
        }
      }
    }`;

    try {
        const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                variables: { search: directorName }
            })
        });

        if (!response.ok) return 'N/A';

        const result = await response.json();
        const mediaEdges = result?.data?.Staff?.staffMedia?.edges;

        if (!mediaEdges || mediaEdges.length === 0) return 'primeiro trabalho';

        const currentAnimeSeries = getBaseSeriesName(currentAnimeTitle);
        const uniqueTitles = [];
        const seenBaseSeries = new Set();
        
        for (const edge of mediaEdges) {
            if (uniqueTitles.length >= 3) break;

            const media = edge.node;
            if (media.type !== 'ANIME') continue;

            const sRole = (edge.staffRole || '').toLowerCase();
            
            // Filtro rigoroso: Deve ser diretor principal (Director/Chief Director)
            // Exclui cargos secundários (Episódio, Assistente, Unidade, Arte, Som, Animação)
            const isMainDirector = sRole.includes('director') && 
                                  !sRole.includes('episode') && 
                                  !sRole.includes('assistant') && 
                                  !sRole.includes('unit') && 
                                  !sRole.includes('art') && 
                                  !sRole.includes('sound') && 
                                  !sRole.includes('animation');

            if (!isMainDirector) continue;

            const title = media.title.romaji;
            if (title) {
                const baseSeries = getBaseSeriesName(title);
                if (baseSeries && !seenBaseSeries.has(baseSeries) && baseSeries !== currentAnimeSeries) {
                    uniqueTitles.push(title);
                    seenBaseSeries.add(baseSeries);
                }
            }
        }

        return uniqueTitles.length > 0 ? uniqueTitles.join(', ') : 'primeiro trabalho';

    } catch (error) {
        console.error('[AniList] Erro ao buscar obras do diretor:', error);
        return 'primeiro trabalho';
    }
}

/**
 * Inverte o formato do nome de "Sobrenome, Nome" para "Nome Sobrenome"
 * Exemplo: "Shibuya, Ryousuke" → "Ryousuke Shibuya"
 */
function normalizeDirectorName(name) {
    if (!name || typeof name !== 'string') return name;
    
    // Verifica se o nome está no formato "Sobrenome, Nome"
    if (name.includes(',')) {
        const parts = name.split(',').map(part => part.trim());
        if (parts.length === 2) {
            return `${parts[1]} ${parts[0]}`; // Inverte: Nome Sobrenome
        }
    }
    
    return name; // Retorna o nome original se não estiver em formato "Sobrenome, Nome"
}

/**
 * Busca o diretor principal de um anime através da Jikan API com Fallback para AniList API
 * Garante o retorno do objeto estruturado para evitar erros de 'undefined'
 * @param {number} animeId - ID do anime no MyAnimeList
 * @param {string} currentAnimeTitle - Título do anime atual para evitar que ele apareça nas obras
 * @returns {Promise<Object>} Objeto contendo { name, link, works }
 */
async function fetchDirectorFromJikan(animeId, currentAnimeTitle = '') {
    // Objeto padrão seguro para evitar quebras
    const defaultDirector = { name: 'N/A', link: '', works: 'N/A' };

    if (!animeId) return defaultDirector;

    try {
        console.log(`[Diretor] Buscando equipe na Jikan para ID: ${animeId}...`);
        const response = await fetchJikan(`https://api.jikan.moe/v4/anime/${animeId}/staff`);
        
        // Se der erro 429 (Too Many Requests) ou qualquer outro problema, aciona AniList
        if (!response.ok) {
            console.warn(`[Diretor] Jikan retornou status ${response.status}. Ativando fallback para AniList.`);
            return await fetchDirectorFromAniList(animeId, currentAnimeTitle);
        }

        const result = await response.json();
        const staffList = result.data;

        if (!staffList || !Array.isArray(staffList)) {
            console.warn("[Diretor] Lista de staff inválida na Jikan. Ativando AniList.");
            return await fetchDirectorFromAniList(animeId);
        }

        // Filtro aprimorado para capturar variações do cargo de Diretor Geral
        const directorStaff = staffList.find(member => 
            member.positions && member.positions.some(pos => {
                const p = pos.toLowerCase();
                return p.includes('director') && 
                      !p.includes('sound') && 
                      !p.includes('animation') && 
                      !p.includes('episode') && 
                      !p.includes('art');
            })
        );

        if (directorStaff && directorStaff.person && directorStaff.person.name) {
            const directorName = normalizeDirectorName(directorStaff.person.name);
            // Busca as obras do diretor na AniList (mais estável para isso)
            const directorWorks = await fetchDirectorWorksFromAniList(directorName, currentAnimeTitle);
            
            return {
                name: directorName, // ✅ Normaliza formato
                link: directorStaff.person.url || '',
                works: directorWorks
            };
        }

        // Se a Jikan respondeu mas não mapeou o diretor, tenta na AniList
        console.warn("[Diretor] Diretor não identificado na Jikan. Tentando AniList.");
        return await fetchDirectorFromAniList(animeId, currentAnimeTitle);

    } catch (error) {
        console.error("[Diretor] Erro crítico na requisição Jikan. Migrando para AniList:", error);
        return await fetchDirectorFromAniList(animeId, currentAnimeTitle);
    }
}

/**
 * Função Auxiliar de Fallback: Busca o diretor na AniList e extrai apenas as obras onde ele atuou como Diretor Geral
 */
async function fetchDirectorFromAniList(idMal, currentAnimeTitle = '') {
    const defaultDirector = { name: 'N/A', link: '', works: 'N/A' };
    
    try {
        console.log(`[AniList Fallback] Consultando ficha técnica e direção de obras do ID MAL: ${idMal}`);
        
        // Query GraphQL corrigida garantindo a estrutura limpa de títulos
        const query = `
            query ($idMal: Int) {
                Media (idMal: $idMal, type: ANIME) {
                    siteUrl
                    staff {
                        edges {
                            role
                            node {
                                name {
                                    full
                                }
                                siteUrl
                                staffMedia (sort: POPULARITY_DESC, perPage: 15) {
                                    edges {
                                        staffRole
                                        node {
                                            title {
                                                romaji
                                                english
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                variables: { idMal: parseInt(idMal) }
            })
        });

        if (!response.ok) {
            console.error(`[AniList Fallback] Falha na API AniList: ${response.status}`);
            return defaultDirector;
        }

        const result = await response.json();
        const mediaData = result?.data?.Media;
        const edges = mediaData?.staff?.edges;

        if (!edges || !Array.isArray(edges)) return defaultDirector;

        // Procura pelo diretor geral da obra atual
        const directorEdge = edges.find(edge => {
            if (!edge.role) return false;
            const role = edge.role.toLowerCase();
            return role.includes('director') && 
                  !role.includes('sound') && 
                  !role.includes('assistant') && 
                  !role.includes('unit') && 
                  !role.includes('animation') && 
                  !role.includes('episode') && 
                  !role.includes('art');
        });

        if (directorEdge && directorEdge.node && directorEdge.node.name && directorEdge.node.name.full) {
            const directorNode = directorEdge.node;
            
            let worksString = 'primeiro trabalho';
            const mediaEdges = directorNode?.staffMedia?.edges;
            const currentAnimeSeries = getBaseSeriesName(currentAnimeTitle);
            
            if (mediaEdges && Array.isArray(mediaEdges) && mediaEdges.length > 0) {
                const seenBaseSeries = new Set();
                
                // Filtra as obras garantindo o cargo de direção principal
                const filteredWorks = mediaEdges
                    .filter(edge => {
                        if (!edge.staffRole) return false;
                        const sRole = edge.staffRole.toLowerCase();
                        return sRole.includes('director') && 
                              !sRole.includes('episode') && 
                              !sRole.includes('assistant') && 
                              !sRole.includes('unit') && 
                              !sRole.includes('sound') && 
                              !sRole.includes('art') && 
                              !sRole.includes('animation');
                    })
                    .map(edge => {
                        // Coleta o título de forma segura da estrutura node do edge
                        if (!edge.node || !edge.node.title) return null;
                        const title = edge.node.title.english || edge.node.title.romaji || null;
                        if (!title) return null;
                        
                        const baseSeries = getBaseSeriesName(title);
                        if (baseSeries === currentAnimeSeries || seenBaseSeries.has(baseSeries)) return null;
                        
                        seenBaseSeries.add(baseSeries);
                        return title;
                    })
                    .filter(Boolean); // Remove nulos ou vazios

                // Seleciona os 3 primeiros trabalhos
                const finalWorks = filteredWorks.slice(0, 3);
                
                if (finalWorks.length > 0) {
                    worksString = finalWorks.join(', ');
                }
            }

            console.log(`[AniList Fallback] Sucesso! Diretor: ${directorNode.name.full} | Apenas Obras Dirigidas: ${worksString}`);
            
            return {
                name: normalizeDirectorName(directorNode.name.full),
                link: directorNode.siteUrl || mediaData.siteUrl || '',
                works: worksString
            };
        }

        return defaultDirector;
    } catch (err) {
        console.error("[AniList Fallback] Erro na requisição GraphQL:", err);
        return defaultDirector;
    }
}


/**
 * Traduz a sinopse para o português usando o Google Translate
 * E aplica correções inteligentes de contexto para evitar confusão de gênero (Masculino/Feminino)
 */
async function translateToPortuguese(text) {
    if (!text || text.trim() === '') return text;

    try {
        // Endpoint estável do ecossistema do Google Translate
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt-BR&dt=t&q=${encodeURIComponent(text)}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) return text;

        const result = await response.json();
        
        if (result && result[0]) {
            let translatedText = result[0].map(sentence => sentence[0]).join('');
            
            // --- CAMADA DE CORREÇÃO INTELIGENTE DE GÊNERO ---
            const lowerText = translatedText.toLowerCase();
            
            // Gatilhos que indicam que o anime é focado em uma protagonista feminina
            const femininoTriggers = [
                "uma jovem", "uma garota", "uma estudante", "ela é", "sua vida", 
                "mulher", "princesa", "rainha", "garota do ensino"
            ];
            
            // Verifica se as primeiras 150 letras do texto sugerem contexto feminino
            const isFeminineContext = femininoTriggers.some(trigger => lowerText.substring(0, 150).includes(trigger));
            
            if (isFeminineContext) {
                // Correções cirúrgicas de concordância para contextos de protagonista feminina
                // Usamos expressões regulares (\b) para garantir que mude apenas palavras inteiras e não pedaços
                const corrections = [
                    { mal: /\bdele\b/gi, correto: "dela" },
                    { mal: /\bele é\b/gi, correto: "ela é" },
                    { mal: /\bcomo um jovem\b/gi, correto: "como uma jovem" },
                    { mal: /\bcomo um estudante\b/gi, correto: "como uma estudante" },
                    { mal: /\bsozinho\b/gi, correto: "sozinha" },
                    { mal: /\bdeterminado\b/gi, correto: "determinada" },
                    { mal: /\bobrigado\b/gi, correto: "obrigada" },
                    { mal: /\bencantado\b/gi, correto: "encantada" },
                    { mal: /\b-se ele\b/gi, correto: "-se ela" }
                ];
                
                // Aplica cada uma das correções no texto final
                corrections.forEach(item => {
                    translatedText = translatedText.replace(item.mal, item.correto);
                });
            }
            
            return translatedText;
        }

        return text;

    } catch (error) {
        console.error("[Tradutor] Erro ao traduzir/tratar sinopse:", error);
        return text;
    }
}

/**
 * Determina se o anime é uma Estréia ou uma Continuação
 */
function determineReleaseType(anime) {
    if (!anime) return 'Estréia';

    const title = (anime.title || '').toLowerCase();
    const titleEnglish = (anime.title_english || '').toLowerCase();

    // 1. Padrões de texto explícitos que indicam continuação
    const continuationPatterns = [
        'season', '2nd', '3rd', '4th', '5th', '6th', 'part 2', 'part 3', 'sequel', 
        ' s2', ' s3', ' s4', 'segunda temporada', 'terceira temporada', 
        'final chapter', 'final season', 'cour 2', 'zenpen', 'kouhen'
    ];

    const isContinuationByTitle = continuationPatterns.some(pattern => 
        title.includes(pattern) || titleEnglish.includes(pattern)
    );

    // 2. Regex para detectar numeração (II, III, 2, 3, etc) no final ou seguida de pontuação
    const sequelRegex = /\s(ii|iii|iv|v|vi|2|3|4|5|6)(\s|:|$)/i;
    const hasSequelNumber = sequelRegex.test(title) || sequelRegex.test(titleEnglish);

    if (isContinuationByTitle || hasSequelNumber) {
        return 'Continuação';
    }

    // 3. Verificação de relações (Prequel ou Parent Story indicam que não é a primeira obra)
    if (anime.relations && Array.isArray(anime.relations)) {
        const isContinuationByRelation = anime.relations.some(rel => {
            const r = (rel.relation || '').toLowerCase();
            return r.includes('prequel') || r.includes('parent story');
        });
        
        if (isContinuationByRelation) {
            return 'Continuação';
        }
    }

    return 'Estréia';
}

/**
 * Limpa o cache de animes
 */
function clearJikanCache() {
    Object.keys(jikanCache).forEach(key => delete jikanCache[key]);
    localStorage.removeItem(CACHE_STORAGE_KEY);
    console.log('Cache da Jikan API limpo e LocalStorage removido');
}

/**
 * Valida se os metadados da temporada no cache estão desatualizados.
 * Se detectar diferença (ex: total de itens diferente), limpa o cache local e retorna true.
 * Retorna false caso nada tenha sido alterado ou em caso de erro.
 */
async function validateSeasonCache(year, season) {
    try {
        const seasonKey = `${season}_${year}`;

        // Faz uma requisição leve apenas para verificar o total de itens
        const response = await fetchJikan(`https://api.jikan.moe/v4/seasons/${year}/${season}?page=1&limit=1`);
        if (!response || !response.ok) return false;

        const result = await response.json();
        const total = result?.pagination?.items?.total || 0;
        const cachedTotal = jikanCache._metadata && jikanCache._metadata[seasonKey] && jikanCache._metadata[seasonKey].total;

        // Se não temos total em cache, não eliminamos (será populado normalmente)
        if (typeof cachedTotal === 'undefined') return false;

        if (cachedTotal !== total) {
            console.log(`[Cache] Diferença detectada na temporada ${seasonKey} (cache=${cachedTotal} api=${total}). Limpando cache...`);
            try {
                localStorage.removeItem(CACHE_STORAGE_KEY);
            } catch (e) {
                console.warn('[Cache] Erro ao remover item do LocalStorage:', e);
            }

            // Limpa o objeto em memória sem reatribuir a const
            Object.keys(jikanCache).forEach(k => delete jikanCache[k]);
            jikanCache._metadata = {};
            // Marca o tempo da limpeza global
            jikanCache._metadata.lastGlobalCleanup = Date.now();
            saveCacheToLocalStorage();

            return true;
        }

        return false;
    } catch (error) {
        console.error('[Cache] Erro ao validar metadados da temporada:', error);
        return false;
    }
}
