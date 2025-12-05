const toTop = document.querySelector(".to-top");

window.addEventListener("scroll", () => {
  if (window.pageYOffset > 700) {
    toTop.classList.add("active");
  } else {
    toTop.classList.remove("active");
  }
});

// Adiciona o evento de clique para rolagem suave ao topo
toTop.addEventListener('click', (e) => {
  e.preventDefault(); // Previne o salto instantâneo do link #
  window.scrollTo({
    top: 0,
    behavior: 'smooth' // A mágica da rolagem suave acontece aqui
  });
});

// // ------------------- Topnav Function --------------------------------------------------------------------------------------------------------------------------------
// Mobile nav: robust toggle + click-outside + Escape to close
function toggleMobileNav(open) {
  const btn = document.getElementById("phoneIcon");
  const nav = document.getElementById("banner");
  if (!btn || !nav) { console.warn('toggleMobileNav: missing elements', {btn, nav}); return; }

  if (open) {
    btn.setAttribute("aria-expanded", "true");
    nav.setAttribute("aria-hidden", "false");
    nav.classList.add("open");
    // force visible by inline style (overrides problematic CSS)
    nav.style.display = 'flex';
    nav.style.flexDirection = 'column';
    nav.style.maxHeight = nav.scrollHeight + 'px';
    nav.style.opacity = '1';
    document.body.classList.add("nav-open");
    console.log('Mobile nav opened');
  } else {
    btn.setAttribute("aria-expanded", "false");
    nav.setAttribute("aria-hidden", "true");
    nav.classList.remove("open");
    // collapse with inline style
    nav.style.maxHeight = '0';
    nav.style.opacity = '0';
    // keep display none after transition (small timeout to let CSS transition run)
    setTimeout(() => {
      if (btn.getAttribute("aria-expanded") !== "true") nav.style.display = '';
    }, 360);
    document.body.classList.remove("nav-open");
    console.log('Mobile nav closed');
  }
}

function myFunction() {
  const btn = document.getElementById("phoneIcon");
  if (!btn) { console.warn('myFunction: phoneIcon not found'); return; }
  const isOpen = btn.getAttribute("aria-expanded") === "true";
  toggleMobileNav(!isOpen);
}

// initialize and bind more robustly on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("phoneIcon");
  const nav = document.getElementById("banner");
  if (!btn || !nav) { console.warn('DOMContentLoaded: missing phoneIcon or banner'); return; }

  // ensure initial accessibility state
  btn.setAttribute("role", "button");
  btn.tabIndex = 0;
  if (!btn.hasAttribute("aria-expanded")) btn.setAttribute("aria-expanded", "false");
  if (!nav.hasAttribute("aria-hidden")) nav.setAttribute("aria-hidden", "true");

  // handlers
  btn.addEventListener("click", (e) => { e.preventDefault(); myFunction(); });
  btn.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); myFunction(); } });

  // stop propagation from nav so document click doesn't immediately close it
  nav.addEventListener("click", (e) => e.stopPropagation());

  // click outside closes nav
  document.addEventListener("click", (e) => {
    const isOpen = btn.getAttribute("aria-expanded") === "true";
    if (!isOpen) return;
    if (!nav.contains(e.target) && !btn.contains(e.target)) toggleMobileNav(false);
  });

  // escape closes nav
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") toggleMobileNav(false); });

  // on resize: reset inline styles when switching to desktop
  window.addEventListener("resize", () => {
    if (window.innerWidth > 880) {
      nav.style.display = '';
      nav.style.maxHeight = '';
      nav.style.opacity = '';
      btn.setAttribute("aria-expanded", "false");
      nav.setAttribute("aria-hidden", "false"); // keep visible on desktop per CSS
      document.body.classList.remove("nav-open");
    } else {
      // mobile default collapsed
      btn.setAttribute("aria-expanded", "false");
      nav.setAttribute("aria-hidden", "true");
      nav.style.maxHeight = '0';
      nav.style.opacity = '0';
    }
  });

  console.log('Mobile nav init', { btn, nav });
});

function ShowHidden(el) {
	var display = document.getElementById(el).style.display;
	if(display == "none")
		document.getElementById(el).style.display = 'block';
	else
		document.getElementById(el).style.display = 'none';
}

class Accordion {
	constructor(el) {
	  // Store the <details> element
	  this.el = el;
	  // Store the <summary> element
	  this.summary = el.querySelector('summary');
	  // Store the <div class="content"> element
	  this.content = el.querySelector('.content');
  
	  // Store the animation object (so we can cancel it if needed)
	  this.animation = null;
	  // Store if the element is closing
	  this.isClosing = false;
	  // Store if the element is expanding
	  this.isExpanding = false;
	  // Detect user clicks on the summary element
	  this.summary.addEventListener('click', (e) => this.onClick(e));
	}
  
	onClick(e) {
	  // Stop default behaviour from the browser
	  e.preventDefault();
	  // Add an overflow on the <details> to avoid content overflowing
	  this.el.style.overflow = 'hidden';
	  // Check if the element is being closed or is already closed
	  if (this.isClosing || !this.el.open) {
		this.open();
	  // Check if the element is being openned or is already open
	  } else if (this.isExpanding || this.el.open) {
		this.shrink();
	  }
	}
  
	shrink() {
	  // Set the element as "being closed"
	  this.isClosing = true;
	  
	  // Store the current height of the element
	  const startHeight = `${this.el.offsetHeight}px`;
	  // Calculate the height of the summary
	  const endHeight = `${this.summary.offsetHeight}px`;
	  
	  // If there is already an animation running
	  if (this.animation) {
		// Cancel the current animation
		this.animation.cancel();
	  }
	  
	  // Start a WAAPI animation
	  this.animation = this.el.animate({
		// Set the keyframes from the startHeight to endHeight
		height: [startHeight, endHeight]
	  }, {
		duration: 200,
		easing: 'ease-out'
	  });
	  
	  // When the animation is complete, call onAnimationFinish()
	  this.animation.onfinish = () => this.onAnimationFinish(false);
	  // If the animation is cancelled, isClosing variable is set to false
	  this.animation.oncancel = () => this.isClosing = false;
	}
  
	open() {
	  // Apply a fixed height on the element
	  this.el.style.height = `${this.el.offsetHeight}px`;
	  // Force the [open] attribute on the details element
	  this.el.open = true;
	  // Wait for the next frame to call the expand function
	  window.requestAnimationFrame(() => this.expand());
	}
  
	expand() {
	  // Set the element as "being expanding"
	  this.isExpanding = true;
	  // Get the current fixed height of the element
	  const startHeight = `${this.el.offsetHeight}px`;
	  // Calculate the open height of the element (summary height + content height)
	  const endHeight = `${this.summary.offsetHeight + this.content.offsetHeight}px`;
	  
	  // If there is already an animation running
	  if (this.animation) {
		// Cancel the current animation
		this.animation.cancel();
	  }
	  
	  // Start a WAAPI animation
	  this.animation = this.el.animate({
		// Set the keyframes from the startHeight to endHeight
		height: [startHeight, endHeight]
	  }, {
		duration: 200,
		easing: 'ease-out'
	  });
	  // When the animation is complete, call onAnimationFinish()
	  this.animation.onfinish = () => this.onAnimationFinish(true);
	  // If the animation is cancelled, isExpanding variable is set to false
	  this.animation.oncancel = () => this.isExpanding = false;
	}
  
	onAnimationFinish(open) {
	  // Set the open attribute based on the parameter
	  this.el.open = open;
	  // Clear the stored animation
	  this.animation = null;
	  // Reset isClosing & isExpanding
	  this.isClosing = false;
	  this.isExpanding = false;
	  // Remove the overflow hidden and the fixed height
	  this.el.style.height = this.el.style.overflow = '';
	}
  }
  
  document.querySelectorAll('details').forEach((el) => {
	new Accordion(el);
});

// ---------------- Lightbox (Modal de Imagem) Function ---------------------------------------------
class Lightbox {
    constructor() {
        this.createLightboxDOM();
        this.images = [];
        this.currentIndex = 0;
        this.zoomLevel = 1;
        this.addEventListeners();

        // Propriedades para arrastar a imagem com zoom
        this.isDragging = false;
        this.startDragX = 0;
        this.startDragY = 0;
        this.translateX = 0;
        this.translateY = 0;
    }

    createLightboxDOM() {
        if (document.getElementById('lightbox')) return;

        const lightboxHTML = `
            <div id="lightbox" class="lightbox-modal" style="display: none;">
                <span class="lightbox-close">&times;</span>
                <div class="lightbox-content">
                    <a class="lightbox-prev">&#10094;</a>
                    <div class="lightbox-image-container">
                        <img id="lightbox-img" src="">
                    </div>
                    <a class="lightbox-next">&#10095;</a>
                </div>
                <div class="lightbox-controls">
                    <button id="zoom-in">+</button>
                    <button id="zoom-out">-</button>
                </div>
                <div class="lightbox-caption" id="lightbox-caption"></div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', lightboxHTML);

        this.lightbox = document.getElementById('lightbox');
        this.imgElement = document.getElementById('lightbox-img');
        this.captionElement = document.getElementById('lightbox-caption');
        this.closeBtn = this.lightbox.querySelector('.lightbox-close');
        this.prevBtn = this.lightbox.querySelector('.lightbox-prev');
        this.nextBtn = this.lightbox.querySelector('.lightbox-next');
        this.zoomInBtn = document.getElementById('zoom-in');
        this.zoomOutBtn = document.getElementById('zoom-out');
    }

    open(images, index) {
        this.images = images.filter(img => img && img !== "false");
        if (this.images.length === 0) return;

        this.currentIndex = index;
        this.lightbox.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        this.updateImage();
    }

    close() {
        this.lightbox.style.display = 'none';
        document.body.style.overflow = '';
        this.resetImageState();
    }

    changeImage(direction) {
        this.currentIndex += direction;
        if (this.currentIndex >= this.images.length) {
            this.currentIndex = 0;
        } else if (this.currentIndex < 0) {
            this.currentIndex = this.images.length - 1;
        }
        this.updateImage();
    }

    updateImage() {
        this.resetImageState();
        this.imgElement.src = this.images[this.currentIndex];
        this.captionElement.textContent = `${this.currentIndex + 1} / ${this.images.length}`;
        this.prevBtn.style.display = this.images.length > 1 ? 'block' : 'none';
        this.nextBtn.style.display = this.images.length > 1 ? 'block' : 'none';
    }

    applyZoom(direction) {
        this.zoomLevel += direction * 0.2;
        if (this.zoomLevel < 1) this.zoomLevel = 1; // Nível mínimo de zoom é 1x
        
        // Se o zoom voltar para 1x, reseta a posição
        if (this.zoomLevel === 1) {
            this.resetImageState();
        } else {
            this.applyTransform();
        }
    }

    resetImageState() {
        this.zoomLevel = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.applyTransform();
    }

    addEventListeners() {
        this.closeBtn.addEventListener('click', () => this.close());
        this.prevBtn.addEventListener('click', () => this.changeImage(-1));
        this.nextBtn.addEventListener('click', () => this.changeImage(1));

        // Eventos de zoom contínuo
        ['mousedown', 'touchstart'].forEach(type => {
            this.zoomInBtn.addEventListener(type, () => this.startZoom(1));
            this.zoomOutBtn.addEventListener(type, () => this.startZoom(-1));
        });
        ['mouseup', 'mouseleave', 'touchend'].forEach(type => {
            this.zoomInBtn.addEventListener(type, () => this.stopZoom());
            this.zoomOutBtn.addEventListener(type, () => this.stopZoom());
        });

        // Eventos de teclado
        document.addEventListener('keydown', (e) => {
            if (this.lightbox.style.display === 'flex') {
                if (e.key === 'Escape') this.close();
                if (e.key === 'ArrowLeft') this.changeImage(-1);
                if (e.key === 'ArrowRight') this.changeImage(1);
                if (e.key === '+') this.applyZoom(1);
                if (e.key === '-') this.applyZoom(-1);
            }
        });

        // Eventos para arrastar a imagem
        this.imgElement.addEventListener('mousedown', (e) => this.startDrag(e));
        window.addEventListener('mousemove', (e) => this.drag(e));
        window.addEventListener('mouseup', () => this.stopDrag());

        // Evento de zoom com a roda do mouse
        this.lightbox.addEventListener('wheel', (e) => this.handleWheelZoom(e));
    }

    // --- Funções de Zoom Contínuo ---
    startZoom(direction) {
        this.stopZoom(); // Garante que não haja intervalos múltiplos
        this.applyZoom(direction);
        this.zoomInterval = setInterval(() => this.applyZoom(direction), 100);
    }

    stopZoom() {
        clearInterval(this.zoomInterval);
    }

    // --- Funções para Arrastar (Pan) ---
    startDrag(e) {
        if (this.zoomLevel <= 1) return;
        e.preventDefault();
        this.isDragging = true;
        this.startDragX = e.clientX - this.translateX;
        this.startDragY = e.clientY - this.translateY;
        this.imgElement.classList.add('zooming');
    }

    drag(e) {
        if (!this.isDragging) return;
        this.translateX = e.clientX - this.startDragX;
        this.translateY = e.clientY - this.startDragY;
        this.applyTransform();
    }

    stopDrag() {
        this.isDragging = false;
        this.imgElement.classList.remove('zooming');
    }

    applyTransform() {
        this.imgElement.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.zoomLevel})`;
    }

    // --- Função de Zoom com a Roda do Mouse ---
    handleWheelZoom(e) {
        e.preventDefault(); // Impede que a página role para cima ou para baixo
        const direction = e.deltaY < 0 ? 1 : -1; // Roda para cima = zoom in, roda para baixo = zoom out
        this.applyZoom(direction);
    }
}

const lightbox = new Lightbox();

// // ------------------ Nova Função de Slideshow (Reformulada) -------------------------------------------------------------------------------------------------------------

class Slideshow {
    constructor(containerSelector, images) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) {
            console.error(`Container do slideshow "${containerSelector}" não encontrado.`);
            return;
        }
        this.images = images.filter(img => img && img !== "false");
        this.currentIndex = 0;
        this.createSlides();
        this.showSlide(this.currentIndex);
    }

    createSlides() {
        // Limpa o conteúdo anterior
        this.container.innerHTML = '';

        if (this.images.length === 0) {
            this.container.innerHTML = '<p>Nenhuma imagem disponível.</p>';
            return;
        }

        // Cria os slides
        this.images.forEach((src, index) => {
            const slide = document.createElement('div');
            slide.className = 'slideshow-slide fade';
            
            const text = document.createElement('div');
            text.className = 'numbertext';
            text.textContent = `${index + 1} / ${this.images.length}`;
            
            const img = document.createElement('img');
            img.src = src;
            // Adiciona o evento de clique para abrir o lightbox
            img.addEventListener('click', () => {
                lightbox.open(this.images, index);
            });
            
            slide.appendChild(text);
            slide.appendChild(img);
            this.container.appendChild(slide);
        });

        // Adiciona botões de navegação se houver mais de uma imagem
        if (this.images.length > 1) {
            const prev = document.createElement('a');
            prev.className = 'prev';
            prev.innerHTML = '&#10094;';
            prev.onclick = () => this.changeSlide(-1);

            const next = document.createElement('a');
            next.className = 'next';
            next.innerHTML = '&#10095;';
            next.onclick = () => this.changeSlide(1);

            this.container.appendChild(prev);
            this.container.appendChild(next);
        }

        this.slides = this.container.querySelectorAll('.slideshow-slide');
    }

    changeSlide(n) {
        this.currentIndex += n;
        if (this.currentIndex >= this.images.length) {
            this.currentIndex = 0;
        }
        if (this.currentIndex < 0) {
            this.currentIndex = this.images.length - 1;
        }
        this.showSlide(this.currentIndex);
    }

    showSlide(index) {
        if (!this.slides || this.slides.length === 0) return;
        this.slides.forEach(slide => {
            slide.style.display = 'none';
        });
        this.slides[index].style.display = 'block';
    }
}

// Guarda a instância do slideshow atual para ser usada
let currentSlideshow = null;

class AnimeCardManager {
    constructor(selector) {
        this.card = document.querySelector(selector);
        this.elements = {
            title: this.card.querySelector('#anime-title'),
            titleEnglish: this.card.querySelector('#anime-title-english'),
            synopsis: this.card.querySelector('#anime-synopsis'),
            genre: this.card.querySelector('#anime-genre'),
            directorLink: this.card.querySelector('#anime-director-link'),
            director2Link: this.card.querySelector('#anime-director2-link'),
            director: this.card.querySelector('#anime-director'),
            director2: this.card.querySelector('#anime-director2'),
            directorWorks: this.card.querySelector('#anime-director-works'),
            studioLink: this.card.querySelector('#anime-studio-link'),
            studio2Link: this.card.querySelector('#anime-studio2-link'),
            studio: this.card.querySelector('#anime-studio'),
            studio2: this.card.querySelector('#anime-studio2'),
            studioWorks: this.card.querySelector('#anime-studio-works'),
            time: this.card.querySelector('#anime-time'),
            duration: this.card.querySelector('#anime-duration'),
            commentary: this.card.querySelector('#anime-commentary'),
            anidb: this.card.querySelector('#anime-anidb'),
            mal: this.card.querySelector('#anime-mal'),
            cr: this.card.querySelector('#anime-cr'),
            netflix: this.card.querySelector('#anime-netflix'),
            youtube: this.card.querySelector('#anime-youtube'),
            disney: this.card.querySelector('#anime-disney'),
            crImage: this.card.querySelector('#cr-image'),
            netflixImage: this.card.querySelector('#netflix-image'),
            youtubeImage: this.card.querySelector('#youtube-image'),
            disneyImage: this.card.querySelector('#disney-image'),
            videoContainers: this.card.querySelectorAll('.video-player-container'),
        };
    }

    // Função genérica para preencher texto
    _setText(element, text) {
        if (element && text !== undefined) element.innerHTML = text;
    }

    // Função genérica para configurar links
    _setLink(element, url, imageElement) {
        if (!element) return;
        const isNoLink = url === 'nolink';
        const isFalse = url === 'false';

        if (imageElement) imageElement.style.display = isFalse ? 'none' : 'inherit';
        if (isFalse) return;

        element.href = isNoLink ? '#anime-card' : url;
        element.target = isNoLink ? '' : '_blank';
        if (imageElement) {
            imageElement.style.opacity = isNoLink ? '0.4' : '1';
            imageElement.style.cursor = isNoLink ? 'default' : 'pointer';
        }
    }

    // Função para mostrar ou esconder elementos
    _setVisibility(element, condition) {
        if (element) element.style.display = condition ? '' : 'none';
    }

    // Função para lidar com a sinopse e o "Ler mais"
    _setSynopsis(text) {
        const synopsisEl = this.elements.synopsis;
        if (!synopsisEl) return;

        const maxLength = 250; // Limite de caracteres para a sinopse

        // Remove qualquer listener de clique anterior para evitar duplicatas
        if (this._synopsisClickListener) {
            synopsisEl.removeEventListener('click', this._synopsisClickListener);
            this._synopsisClickListener = null;
        }

        const fullTextHtml = text.replace(/\n/g, '<br>');

        // Se o texto for curto, apenas exibe e encerra
        if (text.length <= maxLength) {
            synopsisEl.innerHTML = fullTextHtml;
            return;
        }

        // Prepara as versões do HTML
        const truncatedText = text.substring(0, text.lastIndexOf(' ', maxLength));
        const truncatedHtml = `${truncatedText.replace(/\n/g, '<br>')}... <button class="read-more-btn">Ler mais</button>`;
        const expandedHtml = `${fullTextHtml} <button class="read-less-btn">Ler menos</button>`;

        // Define o estado inicial como recolhido
        synopsisEl.innerHTML = truncatedHtml;

        // Adiciona um único listener que gerencia os dois botões
        this._synopsisClickListener = (e) => {
            if (e.target.classList.contains('read-more-btn')) {
                synopsisEl.innerHTML = expandedHtml;
            } else if (e.target.classList.contains('read-less-btn')) {
                synopsisEl.innerHTML = truncatedHtml;
            }
        };
        synopsisEl.addEventListener('click', this._synopsisClickListener);
    }

    populate(data) {
        // Lógica para abrir/fechar o card
        if (this.card.style.display === 'block' && this.elements.title.innerHTML === data.title) {
            this.card.style.display = 'none';
            return;
        }
        this.card.style.display = 'block';

        // Preenche os dados
        this._setText(this.elements.title, data.title);
        this._setText(this.elements.titleEnglish, data.titleEnglish);
        this._setSynopsis(data.synopsis); // Usa a nova função para a sinopse
        this._setText(this.elements.genre, data.genre);
        this._setText(this.elements.director, data.director);
        this._setText(this.elements.director2, data.director2);
        this._setText(this.elements.directorWorks, data.directorWorks);
        this._setText(this.elements.studioWorks, data.studioWorks);
        this._setText(this.elements.time, data.time);
        this._setText(this.elements.duration, data.duration);
        this._setText(this.elements.commentary, data.commentary);

        // Configura links
        this._setLink(this.elements.anidb, data.anidb);
        this._setLink(this.elements.mal, data.mal);
        this._setLink(this.elements.cr, data.cr, this.elements.crImage);
        this._setLink(this.elements.netflix, data.netflix, this.elements.netflixImage);
        this._setLink(this.elements.youtube, data.youtube, this.elements.youtubeImage);
        this._setLink(this.elements.disney, data.disney, this.elements.disneyImage);
        this._setLink(this.elements.directorLink, data.directorLink);
        this._setLink(this.elements.director2Link, data.director2Link);
        this._setLink(this.elements.studioLink, data.studioLink);
        this._setLink(this.elements.studio2Link, data.studio2Link);

        // Configura imagens de estúdio
        if (this.elements.studio) this.elements.studio.src = data.studio;
        if (this.elements.studio2) this.elements.studio2.src = data.studio2;
        this._setVisibility(this.elements.studioLink, data.studioLink);
        this._setVisibility(this.elements.studio2Link, data.studio2Link);

        // Cria o slideshow
        const images = [];
        let i = 1;
        while (data[`thumb${i}`]) {
            images.push(data[`thumb${i}`]);
            i++;
        }
        currentSlideshow = new Slideshow('.slideshow-container', images);

        // Atualiza os players de vídeo
        const videoData = [
            { video: data.video1, poster: data.poster1, caption: data.caption1, subtitle: data.subtitle1 || "false" },
            { video: data.video2, poster: data.poster2, caption: data.caption2, subtitle: data.subtitle2 || "false" },
            { video: data.video3, poster: data.poster3, caption: data.caption3, subtitle: data.subtitle3 || "false" }
        ];

                this.elements.videoContainers.forEach((container, index) => {
            const vData = videoData[index];
            const videoPlayer = container.querySelector('.video-player');
            const captionSpan = container.querySelector('.video-caption-text');
            const trackElement = container.querySelector('track');
            const subtitlesBtn = container.querySelector('.subtitles-btn');

            if (vData.video && vData.video !== "false") {
                container.style.display = 'flex';
                videoPlayer.src = vData.video;
                videoPlayer.poster = vData.poster;
                this._setText(captionSpan, vData.caption);
                videoPlayer.currentTime = 0;
                videoPlayer.load();

                // Lógica das legendas
                if (trackElement && subtitlesBtn) {
                    if (vData.subtitle && vData.subtitle !== "false") {
                        trackElement.src = vData.subtitle;
                        
                        // Aguarda o vídeo carregar os metadados para manipular a trilha de texto
                        videoPlayer.onloadedmetadata = () => {
                            if (videoPlayer.textTracks && videoPlayer.textTracks.length > 0) {
                                // Garante que a legenda comece desativada
                                videoPlayer.textTracks[0].mode = 'showing';
                            }
                        };

                        subtitlesBtn.style.display = 'inline-block';
                        subtitlesBtn.classList.add('subtitles-active');
                    } else {
                        trackElement.src = '';
                        subtitlesBtn.style.display = 'none';
                    }
                }
            } else {
                container.style.display = 'none';
            }
        });
    }
}

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    const animeCardManager = new AnimeCardManager('.animeCard');
    const animeChart = document.getElementById('anime-chart');

    if (animeChart) {
        animeChart.addEventListener('click', (e) => {
            // Encontra o link pai que aciona o card
            const trigger = e.target.closest('.anime-card-trigger');
            if (!trigger) return;

            e.preventDefault(); // Previne o comportamento padrão do link

            // Coleta todos os atributos data-* e os transforma em um objeto
            const animeData = { ...trigger.dataset };

            // Popula o card com os dados coletados
            animeCardManager.populate(animeData);
        });
    }

    // --- INICIALIZAÇÃO DO PLAYER DE VÍDEO CUSTOMIZADO ---
    const videoPlayers = document.querySelectorAll('.video-player-container');

    videoPlayers.forEach(container => {
        const video = container.querySelector('.video-player');
        const playPauseBtn = container.querySelector('.play-pause-btn');
        const playPauseIcon = playPauseBtn.querySelector('i');
        const progressBar = container.querySelector('.progress-bar');
        const progressBarContainer = container.querySelector('.progress-bar-container');
        const timeDisplay = container.querySelector('.time-display');
        const volumeBtn = container.querySelector('.volume-btn');
        const volumeIcon = volumeBtn.querySelector('i');
        const volumeSlider = container.querySelector('.volume-slider');
        const fullscreenBtn = container.querySelector('.fullscreen-btn');
        const subtitlesBtn = container.querySelector('.subtitles-btn');

        // --- Funções de Controle ---
        function togglePlayPause() {
            if (video.paused) {
                video.play();
            } else {
                video.pause();
            }
        }

        function updatePlayPauseIcon() {
            playPauseIcon.className = `fas ${video.paused ? 'fa-play' : 'fa-pause'}`;
        }

        function updateProgress() {
            const progressPercentage = (video.currentTime / video.duration) * 100;
            progressBar.style.width = `${progressPercentage}%`;
            timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration || 0)}`;
        }

        function scrub(e) {
            const scrubTime = (e.offsetX / progressBarContainer.offsetWidth) * video.duration;
            video.currentTime = scrubTime;
        }

        function toggleMute() {
            video.muted = !video.muted;
        }

        function updateVolumeIcon() {
            volumeIcon.className = 'fas';
            if (video.muted || video.volume === 0) {
                volumeIcon.classList.add('fa-volume-mute');
            } else if (video.volume < 0.5) {
                volumeIcon.classList.add('fa-volume-down');
            } else {
                volumeIcon.classList.add('fa-volume-up');
            }
        }
        
        function handleVolumeChange() {
            video.volume = volumeSlider.value;
            if (video.volume > 0) {
                video.muted = false;
            }
        }

        function toggleFullscreen() {
            if (!document.fullscreenElement) {
                video.closest('.video-player-container').requestFullscreen().catch(err => {
                    alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                });
            } else {
                document.exitFullscreen();
            }
        }

        function toggleSubtitles() {
            const track = video.textTracks[0];
            if (!track) return;

            const isShowing = track.mode === 'showing';
            track.mode = isShowing ? 'hidden' : 'showing';
            subtitlesBtn.classList.toggle('subtitles-active', !isShowing);
        }

        function formatTime(seconds) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.floor(seconds % 60);
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }

        // --- Event Listeners ---
        video.addEventListener('click', togglePlayPause);
        playPauseBtn.addEventListener('click', togglePlayPause);
        video.addEventListener('play', () => {
            // Pausa todos os outros vídeos quando este começar a tocar
            videoPlayers.forEach(otherContainer => {
                const otherVideo = otherContainer.querySelector('.video-player');
                if (otherVideo !== video) {
                    otherVideo.pause();
                }
            });
            updatePlayPauseIcon();
        });
        video.addEventListener('pause', updatePlayPauseIcon);
        video.addEventListener('timeupdate', updateProgress);
        video.addEventListener('loadedmetadata', updateProgress);
        
        progressBarContainer.addEventListener('click', scrub);
        
        volumeBtn.addEventListener('click', toggleMute);
        volumeSlider.addEventListener('input', handleVolumeChange);
        video.addEventListener('volumechange', updateVolumeIcon);

        fullscreenBtn.addEventListener('click', toggleFullscreen);
        
        if (subtitlesBtn) {
            subtitlesBtn.addEventListener('click', toggleSubtitles);
        }
        
        // Inicializa o ícone de volume
        updateVolumeIcon();
    });
});
