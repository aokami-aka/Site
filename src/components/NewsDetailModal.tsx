import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Calendar,
  Clock,
  Share2,
  ExternalLink,
  BookOpen,
  Bookmark,
  Check,
  Building2,
  Tag,
  ArrowLeft,
  ArrowRight,
  Newspaper,
} from 'lucide-react';
import { PaperTextureOverlay } from './PaperTextureOverlay';
import { sanitizeNewsText } from '../utils/newsFallback';

export interface NewsArticle {
  id: string;
  title: string;
  titlePt: string;
  excerpt: string;
  excerptPt: string;
  contentPt?: string;
  date: string;
  formattedDatePt: string;
  image: string;
  source: string;
  link: string;
  tags: string[];
  category: string;
  readTimeMin: number;
  author?: string;
}

interface NewsDetailModalProps {
  article: NewsArticle | null;
  onClose: () => void;
  onSelectArticle?: (article: NewsArticle) => void;
  allArticles?: NewsArticle[];
}

export const NewsDetailModal: React.FC<NewsDetailModalProps> = ({
  article,
  onClose,
  onSelectArticle,
  allArticles = [],
}) => {
  const [copied, setCopied] = useState(false);
  const [expandedBody, setExpandedBody] = useState<string[]>([]);
  const [loadingBody, setLoadingBody] = useState(false);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Fetch full article paragraphs if available
  useEffect(() => {
    if (!article) return;
    setCopied(false);
    setExpandedBody([]);

    if (article.link && article.link.startsWith('http')) {
      setLoadingBody(true);
      fetch(`/api/anime-news/article?url=${encodeURIComponent(article.link)}&title=${encodeURIComponent(article.title)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && Array.isArray(data.paragraphs) && data.paragraphs.length > 0) {
            const cleaned = data.paragraphs
              .map((p: string) => sanitizeNewsText(p))
              .filter((p: string) => p.length > 30);
            if (cleaned.length > 0) {
              setExpandedBody(cleaned);
            }
          }
        })
        .catch((err) => console.warn('Could not expand article paragraphs:', err))
        .finally(() => setLoadingBody(false));
    }
  }, [article]);

  if (!article) return null;

  const currentIndex = allArticles.findIndex((a) => a.id === article.id);
  const prevArticle = currentIndex > 0 ? allArticles[currentIndex - 1] : null;
  const nextArticle = currentIndex >= 0 && currentIndex < allArticles.length - 1 ? allArticles[currentIndex + 1] : null;

  const handleShare = () => {
    const url = article.link || window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-8 overflow-y-auto">
        {/* Backdrop with frosted dark blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
        />

        {/* Newspaper Reader Card Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl sm:rounded-3xl bg-[#fbf9f4] text-[#1a1714] shadow-[0_25px_60px_rgba(0,0,0,0.85)] border-4 border-[#2b261f]/20 overflow-hidden font-serif"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Paper Texture Overlay */}
          <PaperTextureOverlay opacity={0.16} />

          {/* Newspaper Top Masthead / Folio */}
          <div className="relative z-10 bg-[#f2ece1] px-4 sm:px-6 py-3 border-b-2 border-[#2b261f]/25 flex items-center justify-between text-[#3f3830] select-none">
            <div className="flex items-center gap-2 sm:gap-3">
              <Newspaper className="w-4 h-4 sm:w-5 sm:h-5 text-[#6c5e4e]" />
              <div>
                <span className="text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase font-sans">
                  Notícias de Anime • Leitura Completa
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] text-[#786b5c] font-sans font-medium">
                  {article.formattedDatePt}
                </span>
              </div>
            </div>

            {/* Actions: Prev, Next, Share, Close */}
            <div className="flex items-center gap-1.5 sm:gap-2 font-sans">
              {prevArticle && onSelectArticle && (
                <button
                  onClick={() => onSelectArticle(prevArticle)}
                  className="p-1.5 rounded-lg bg-black/5 hover:bg-black/10 text-[#3f3830] transition-colors cursor-pointer"
                  title="Notícia anterior"
                >
                  <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              )}
              {nextArticle && onSelectArticle && (
                <button
                  onClick={() => onSelectArticle(nextArticle)}
                  className="p-1.5 rounded-lg bg-black/5 hover:bg-black/10 text-[#3f3830] transition-colors cursor-pointer"
                  title="Próxima notícia"
                >
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              )}
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-black/5 hover:bg-black/10 text-[#3f3830] text-xs font-medium transition-colors cursor-pointer"
                title="Copiar link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? 'Copiado!' : 'Compartilhar'}</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-black/10 hover:bg-black/20 text-[#1a1714] hover:text-rose-700 transition-colors cursor-pointer"
                title="Fechar (ESC)"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Newspaper Body */}
          <div className="overflow-y-auto p-4 sm:p-7 md:p-9 space-y-6">
            {/* Kicker / Category & Dateline */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2b261f]/15 pb-3 font-sans">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-[#2b261f] text-[#fbf9f4]">
                  {article.category}
                </span>
                <span className="text-xs text-[#6e6355] font-semibold flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {article.source}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-[#786b5c]">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {article.formattedDatePt}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  ~{article.readTimeMin} min de leitura
                </span>
              </div>
            </div>

            {/* Headline (Manchete de Jornal) */}
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#141210] tracking-tight leading-[1.15] font-serif">
                {article.titlePt || article.title}
              </h1>
              {article.titlePt && article.titlePt !== article.title && (
                <p className="text-xs sm:text-sm text-[#736657] italic mt-1 font-sans">
                  Título original: &ldquo;{article.title}&rdquo;
                </p>
              )}
            </div>

            {/* Byline */}
            <div className="flex items-center justify-between border-y border-[#2b261f]/20 py-2 text-xs text-[#52473b] font-sans">
              <span>
                Por <strong>{article.author || article.source}</strong> • Correspondente Especial
              </span>
              <span className="italic">Notícias do Mundo dos Animes</span>
            </div>

            {/* Featured Image with vintage newspaper photo frame */}
            {article.image && (
              <div className="my-4">
                <div className="relative rounded-lg overflow-hidden border-2 border-[#3d3429]/25 shadow-md bg-[#eee7db]">
                  <img
                    src={article.image}
                    alt={article.titlePt}
                    referrerPolicy="no-referrer"
                    className="w-full max-h-[420px] object-cover filter contrast-[1.03]"
                  />
                  <div className="absolute inset-0 border border-black/10 pointer-events-none" />
                </div>
                <p className="text-[11px] sm:text-xs text-[#685d50] mt-2 italic font-sans flex items-center justify-between">
                  <span>[Foto ilustrativa oficial da produção de anime / Divulgação]</span>
                  <span className="font-semibold">Fonte: {article.source}</span>
                </p>
              </div>
            )}

            {/* Highlights Lead Box */}
            <div className="rounded-xl bg-[#f0e9dc] p-4 sm:p-5 border-l-4 border-[#332b21] shadow-inner">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#3d3429] mb-1 font-sans">
                <BookOpen className="w-3.5 h-3.5 text-[#6c5e4e]" />
                <span>Resumo da Matéria</span>
              </div>
              <p className="text-sm sm:text-base text-[#241f19] font-serif leading-relaxed italic">
                &ldquo;{article.excerptPt || article.excerpt}&rdquo;
              </p>
            </div>

            {/* Full Story Content with Editorial Typography */}
            <div className="prose max-w-none text-[#1f1b16] font-serif text-base sm:text-lg leading-relaxed space-y-4">
              {loadingBody ? (
                <div className="py-6 flex flex-col items-center justify-center gap-2 text-sm text-[#736657] font-sans">
                  <div className="w-5 h-5 border-2 border-[#2b261f] border-t-transparent rounded-full animate-spin" />
                  <span>Obtendo detalhes da publicação...</span>
                </div>
              ) : expandedBody.length > 0 ? (
                expandedBody.map((paragraph, idx) => (
                  <p key={idx} className={idx === 0 ? 'first-letter:text-4xl first-letter:font-black first-letter:float-left first-letter:mr-2 first-letter:leading-none text-[#1b1713]' : ''}>
                    {paragraph}
                  </p>
                ))
              ) : (
                <>
                  <p className="first-letter:text-5xl first-letter:font-black first-letter:float-left first-letter:mr-3 first-letter:leading-none text-[#1b1713]">
                    {article.excerptPt || article.excerpt}
                  </p>
                  <p>
                    Segundo informações confirmadas pelos canais oficiais e veículos especializados, novidades adicionais e cronogramas de transmissão devem ser divulgados nos próximos dias. As repercussões entre os fãs já movimentam fóruns e comunidades globais.
                  </p>
                  <p>
                    Para conferir todos os detalhes, comunicados na íntegra, entrevistas com a equipe criativa e materiais promocionais adicionais, acesse a matéria completa no portal oficial.
                  </p>
                </>
              )}
            </div>

            {/* Tags / Categories Bar */}
            {article.tags && article.tags.length > 0 && (
              <div className="pt-4 border-t border-[#2b261f]/15 flex flex-wrap items-center gap-1.5 font-sans">
                <Tag className="w-3 h-3 text-[#786b5c] mr-1" />
                <span className="text-xs text-[#786b5c] font-medium mr-1">Tópicos:</span>
                {article.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#eae3d5] text-[#3d3429] border border-[#2b261f]/15"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Original Source Link Button */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t-2 border-[#2b261f]/20 font-sans">
              <div className="text-xs text-[#6e6355]">
                Publicação original por <strong>{article.source}</strong>
              </div>

              <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#241e17] hover:bg-[#3d3326] text-[#fbf9f4] font-bold text-xs transition-all shadow-md cursor-pointer group"
              >
                <span>Acessar Notícia na Fonte Original</span>
                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
