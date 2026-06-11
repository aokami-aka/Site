// --- CARREGAMENTO DA API DO YOUTUBE ---
if (!window.YT) {
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

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


// Função para abrir o modal de vídeo
function openVideoModal(vData, playerIndex) {
    const modal = document.getElementById('video-modal');
    const modalPlayer = document.getElementById('video-modal-player');
    const modalTitle = document.getElementById('video-modal-title');

    if (!modal) {
        console.error('Modal element not found!');
        return;
    }
    if (!modalPlayer) {
        console.error('Modal player element not found!');
        return;
    }
    if (!modalTitle) {
        console.error('Modal title element not found!');
        return;
    }

    // Garanta que os controles estejam visíveis
    const controls = modal.querySelector('.video-modal-controls');
    if (controls) {
        controls.style.display = 'flex';
        controls.classList.remove('inactive');
    }

    // Define o título do modal
    modalTitle.textContent = vData.caption || 'Vídeo';

    // Limpa o player anterior
    modalPlayer.innerHTML = '';

    // Limpa qualquer intervalo de progresso anterior
    if (window.currentProgressInterval) {
        clearInterval(window.currentProgressInterval);
        window.currentProgressInterval = null;
    }

    // Destrói players antigos
    if (window.currentModalPlayer) {
        if (typeof window.currentModalPlayer.destroy === 'function') {
            window.currentModalPlayer.destroy();
        }
        window.currentModalPlayer = null;
    }

    const videoId = getYouTubeVideoId(vData.video);

    if (videoId) {
        // Cria player do YouTube no modal
        const player = new YT.Player('video-modal-player', {
            videoId: videoId,
            playerVars: {
                'playsinline': 1,
                'controls': 0,
                'rel': 0,
                'modestbranding': 1,
                'iv_load_policy': 3, // Oculta anotações e cards informativos
                'fs': 0,             // Desativa o botão de tela cheia nativo do YouTube
                'disablekb': 1,      // Desativa os atalhos de teclado nativos (evita conflitos)
                'showinfo': 0,       // Remove informações do vídeo
                'autohide': 1,       // Auto-hide da barra de progresso
                'widget_referrer': window.location.origin,
                'cc_lang_pref': 'pt',
                'cc_load_policy': 1,
                'autoplay': 1,  // Auto-play quando abrir o modal
                'vq': 'highres' // Hint para iniciar na maior qualidade disponível
            },
            events: {
                'onReady': (event) => {
                    const player = event.target;

                    // Força a maior qualidade disponível (highres/hd1080/etc)
                    try {
                        player.setPlaybackQuality('highres');
                    } catch (e) {
                        console.warn('Erro ao definir qualidade:', e);
                    }

                    // Configuração inteligente de legendas
                    setTimeout(() => {
                        try {
                            player.loadModule('captions');
                            
                            // Pequeno delay para o módulo de legendas processar as opções do vídeo
                            setTimeout(() => {
                                try {
                                    const captionTracks = player.getOption('captions', 'tracklist') || [];
                                    const translations = player.getOption('captions', 'translationLanguages') || [];
                                    
                                    const ptTrack = captionTracks.find(t => t.languageCode.startsWith('pt'));
                                    const ptTranslation = translations.find(t => t.languageCode.startsWith('pt'));
                                    const enTrack = captionTracks.find(t => t.languageCode.startsWith('en'));

                                    if (ptTrack) {
                                        player.setOption('captions', 'track', ptTrack);
                                    } else if (ptTranslation) {
                                        // Se não há PT nativo, tenta tradução automática para PT vinda do Inglês ou primeiro disponível
                                        const baseTrack = enTrack || captionTracks[0];
                                        if (baseTrack) {
                                            player.setOption('captions', 'track', {
                                                languageCode: baseTrack.languageCode,
                                                translationLanguage: ptTranslation
                                            });
                                        }
                                    } else if (enTrack) {
                                        player.setOption('captions', 'track', enTrack);
                                    }
                                } catch (e) {
                                    console.warn('Erro ao acessar tracks de legenda:', e);
                                }
                            }, 1000);
                        } catch (e) {
                            console.warn('Erro ao configurar legendas automaticamente:', e);
                        }
                    }, 500);
                    
                    window.initializeCustomControls(modal, player, 'youtube');
                },
                'onError': (event) => {
                    console.error('Erro ao carregar vídeo do YouTube:', vData.video, 'Código de erro:', event.data);
                    modalPlayer.innerHTML = `
                        <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #000; color: #fff; padding: 20px; text-align: center;">
                            <div>
                                <i class="fab fa-youtube" style="font-size: 64px; margin-bottom: 20px;"></i>
                                <br>
                                <p style="font-size: 18px; margin-bottom: 20px;">Vídeo não disponível para incorporação</p>
                                <a href="${vData.video}" target="_blank" style="color: #ff0000; text-decoration: none; font-size: 20px; padding: 10px 20px; border: 2px solid #ff0000; border-radius: 5px;">
                                    Ver no YouTube
                                </a>
                            </div>
                        </div>
                    `;
                },
                'onStateChange': (event) => {
                    // Armazena o estado atual do player para ser usado na lógica de auto-hide
                    const state = event.data;
                    const playing = window.YT ? YT.PlayerState.PLAYING : 1;
                    const paused = window.YT ? YT.PlayerState.PAUSED : 2;
                    
                    window.playerState = state;
                    if (state === paused) {
                        window.isPausedModal = true;
                    } else if (state === playing) {
                        window.isPausedModal = false;
                    }
                }
            }
        });
        window.currentModalPlayer = player;
    } else {
        // Link não reconhecido
        const isXLink = isTwitterUrl(vData.video);
        const iconClass = isXLink ? 'fa-brands fa-x-twitter' : 'fab fa-youtube';
        const iconColor = isXLink ? '#ffffff' : '#ff0000';
        const linkText = isXLink ? 'Abrir postagem original' : 'Ver no YouTube';
        modalPlayer.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #000; color: #fff; padding: 20px; text-align: center;">
                <div>
                    <i class="${iconClass}" style="font-size: 64px; margin-bottom: 20px; color: ${iconColor};"></i>
                    <br>
                    <a href="${vData.video}" target="_blank" style="color: ${iconColor}; text-decoration: none; font-size: 20px; padding: 10px 20px; border: 2px solid ${iconColor}; border-radius: 5px;">
                        ${linkText}
                    </a>
                </div>
            </div>
        `;
    }

    // Mostra o modal
    modal.classList.add('active');

    // Fecha o modal ao clicar fora do conteúdo
    modal.onclick = (e) => {
        if (e.target === modal) {
            closeVideoModal();
        }
    };

    // Auto-hide controles quando mouse parado
    let controlsTimeout;
    let mouseInPlayer = false;
    
    const playerElement = modal.querySelector('.video-modal-player');

    const hideControls = () => {
        // Se o vídeo está pausado, nunca esconda os controles
        if (window.isPausedModal) {
            return;
        }
        if (controls) {
            controls.classList.add('inactive');
        }
        if (playerElement) {
            playerElement.classList.remove('controls-visible');
        }
    };
    
    const showControls = () => {
        if (controls) {
            controls.classList.remove('inactive');
        }
        if (playerElement) {
            playerElement.classList.add('controls-visible');
        }
        clearTimeout(controlsTimeout);
        // Esconde após 3 segundos apenas se o vídeo estiver tocando
        if (!window.isPausedModal && mouseInPlayer) {
            controlsTimeout = setTimeout(hideControls, 3000);
        }
    };
    
    if (playerElement) {
        playerElement.addEventListener('mouseenter', () => {
            mouseInPlayer = true;
            showControls();
        });
        playerElement.addEventListener('mousemove', showControls);
        playerElement.addEventListener('mouseleave', () => {
            mouseInPlayer = false;
            controlsTimeout = setTimeout(hideControls, 1000);
        });
    }
    
    if (controls) {
        controls.addEventListener('mouseenter', () => {
            clearTimeout(controlsTimeout);
        });
        controls.addEventListener('mouseleave', () => {
            if (!window.isPausedModal) {
                controlsTimeout = setTimeout(hideControls, 3000);
            }
        });
    }

    // Closes the modal with ESC key
    document.addEventListener('keydown', handleEscapeKey);


    // Fecha o modal com tecla ESC
    document.addEventListener('keydown', handleEscapeKey);
}

function closeVideoModal() {
    const modal = document.getElementById('video-modal');
    if (modal) {
        modal.classList.remove('active');

        // Limpa o intervalo de atualização do progresso
        if (window.currentProgressInterval) {
            clearInterval(window.currentProgressInterval);
            window.currentProgressInterval = null;
        }

        // Destrói o player atual
        if (window.currentModalPlayer) {
            if (typeof window.currentModalPlayer.destroy === 'function') {
                window.currentModalPlayer.destroy();
            }
            window.currentModalPlayer = null;
        }
    }
    document.removeEventListener('keydown', handleEscapeKey);
}

function handleEscapeKey(e) {
    if (e.key === 'Escape') {
        closeVideoModal();
        e.stopPropagation(); // Impede que o evento ESC feche outros elementos (como o topnav)
    }
}

// Função para extrair o ID de um link do YouTube
function getYouTubeVideoId(url) {
    if (!url || url === "false") return null;
    let videoId = null;
    try {
        // Remove query parameters e hash se existirem
        const cleanUrl = url.split('?')[0].split('#')[0];
        const urlObj = new URL(cleanUrl);
        
        if (urlObj.hostname === 'youtu.be') {
            videoId = urlObj.pathname.slice(1).split('/')[0];
        } else if (urlObj.hostname.includes('youtube.com')) {
            if (urlObj.pathname === '/watch') {
                // Tenta pegar do URL original se tem parâmetros
                const originalUrl = new URL(url);
                videoId = originalUrl.searchParams.get('v');
            } else if (urlObj.pathname.startsWith('/embed/')) {
                videoId = urlObj.pathname.split('/')[2];
            } else if (urlObj.pathname.startsWith('/live/')) {
                videoId = urlObj.pathname.split('/')[2];
            } else if (urlObj.pathname.startsWith('/shorts/')) {
                videoId = urlObj.pathname.split('/')[2];
            } else if (urlObj.pathname.startsWith('/v/')) {
                videoId = urlObj.pathname.split('/')[2];
            }
        }
        
        // Valida se o ID tem o formato correto (11 caracteres alfanuméricos, underscore, hífen)
        if (videoId && !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
            videoId = null;
        }
    } catch (e) { 
        console.warn('Erro ao parsear URL do YouTube:', url, e);
    }
    return videoId;
}

// --- INICIALIZAÇÃO DO PLAYER DE VÍDEO CUSTOMIZADO ---
window.initializeCustomControls = (container, player, type) => {
    const isModal = container.id === 'video-modal';
    const playPauseBtn = container.querySelector(isModal ? '.video-modal-controls .play-pause-btn' : '.play-pause-btn');
    const playPauseIcon = playPauseBtn ? playPauseBtn.querySelector('i') : null;
    const progressBar = container.querySelector(isModal ? '.video-modal-controls .progress-bar' : '.progress-bar');
    const progressBarContainer = container.querySelector(isModal ? '.video-modal-controls .progress-bar-container' : '.progress-bar-container');
    const timeDisplay = container.querySelector(isModal ? '.video-modal-controls .time-display' : '.time-display');
    const volumeBtn = container.querySelector(isModal ? '.video-modal-controls .volume-btn' : '.volume-btn');
    const volumeIcon = volumeBtn.querySelector('i');
    const volumeSlider = container.querySelector(isModal ? '.video-modal-controls .volume-slider' : '.volume-slider');

    function togglePlayPause() {
        if (type === 'youtube') {
            const state = player.getPlayerState();
            if (state === (window.YT ? YT.PlayerState.PLAYING : 1)) {
                player.pauseVideo();
            } else {
                player.playVideo();
            }
        } else {
            if (player.paused) player.play();
            else player.pause();
        }
    }

    function updatePlayPauseIcon() {
        let isPaused;
        if (type === 'youtube') {
            const state = player.getPlayerState();
            isPaused = state !== (window.YT ? YT.PlayerState.PLAYING : 1);
        } else {
            isPaused = player.paused;
        }
        if (playPauseIcon) playPauseIcon.className = `fas ${isPaused ? 'fa-play' : 'fa-pause'}`;

        // Adiciona classe de estado para o CSS controlar visibilidade do botão central
        const controls = container.querySelector(isModal ? '.video-modal-controls' : null);
        if (controls) controls.classList.toggle('is-paused', isPaused);
    }

    function updateProgress() {
        const currentTime = type === 'youtube' ? player.getCurrentTime() : player.currentTime;
        const duration = type === 'youtube' ? player.getDuration() : player.duration;
        
        if (duration && duration > 0 && !isNaN(currentTime)) {
            const progressPercentage = (currentTime / duration) * 100;
            progressBar.style.width = `${Math.min(progressPercentage, 100)}%`;
            timeDisplay.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
        }
    }

    function scrub(e) {
        const duration = type === 'youtube' ? player.getDuration() : player.duration;
        const scrubTime = (e.offsetX / progressBarContainer.offsetWidth) * duration;
        if (type === 'youtube') player.seekTo(scrubTime, true);
        else player.currentTime = scrubTime;
    }

    function toggleMute() {
        if (type === 'youtube') {
            if (player.isMuted()) player.unMute();
            else player.mute();
        } else {
            player.muted = !player.muted;
        }
        updateVolumeIcon();
    }

    function updateVolumeIcon() {
        const isMuted = type === 'youtube' ? player.isMuted() : player.muted;
        const volume = type === 'youtube' ? player.getVolume() / 100 : player.volume;

        volumeIcon.className = 'fas';
        if (isMuted || volume === 0) volumeIcon.classList.add('fa-volume-mute');
        else if (volume < 0.5) volumeIcon.classList.add('fa-volume-down');
        else volumeIcon.classList.add('fa-volume-up');
    }

    function handleVolumeChange() {
        const newVolume = volumeSlider.value;
        if (type === 'youtube') {
            player.setVolume(newVolume * 100);
            if (newVolume > 0 && player.isMuted()) player.unMute();
        } else {
            player.volume = newVolume;
            if (newVolume > 0) player.muted = false;
        }
    }

    function formatTime(seconds) {
        if (isNaN(seconds)) return "0:00";
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    if (type === 'html5') {
        player.addEventListener('click', togglePlayPause);
        player.addEventListener('play', () => {
            window.videoPlayers.forEach(p => {
                if (p !== player) {
                    if (p.pauseVideo) p.pauseVideo();
                    if (p.pause) p.pause();
                }
            });
            updatePlayPauseIcon();
        });
        player.addEventListener('pause', updatePlayPauseIcon);
        player.addEventListener('timeupdate', updateProgress);
        player.addEventListener('volumechange', updateVolumeIcon);
    } else {
        window.currentProgressInterval = setInterval(() => {
            if (player.getDuration && player.getDuration() > 0) updateProgress();
            updatePlayPauseIcon();
        }, 500);
    }

    if (playPauseBtn) playPauseBtn.addEventListener('click', togglePlayPause);
    progressBarContainer.addEventListener('click', scrub);
    volumeBtn.addEventListener('click', toggleMute);
    volumeSlider.addEventListener('input', handleVolumeChange);
};

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
            status: this.card.querySelector('#anime-status'),
            score: this.card.querySelector('#anime-score'),
            type: this.card.querySelector('#anime-type'),
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
            cardLoader: this.card.querySelector('#card-loader'),
        };
    }

    // Controla a visibilidade do loading interno do card
    setLoading(isLoading) {
        if (!this.elements.cardLoader) return;
        
        if (isLoading) {
            this.card.style.display = 'block';
            this.elements.cardLoader.style.display = 'flex';
            // Garante que o scroll vá para o card enquanto carrega
            this.card.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Diminui opacidade do conteúdo antigo se houver
            const content = this.card.querySelector('.grid-thumb');
            if (content) content.style.opacity = '0.3';
        } else {
            this.elements.cardLoader.style.display = 'none';
            const content = this.card.querySelector('.grid-thumb');
            if (content) content.style.opacity = '1';
        }
    }

    // Função genérica para preencher texto
    _setText(element, text) {
        if (element && text !== undefined) element.innerHTML = text;
    }

    // Função específica para comentário (pode ser texto ou imagem)
    _setCommentary(text) {
        const element = this.elements.commentary;
        if (!element) return;

        // Se for URL de imagem, exibe como sticker
        if (typeof text === 'string' && /^https?:\/\//i.test(text)) {
            const isDirectImage = /\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(text);
            const isGoogleThumb = /tbn:|gstatic\.com|googleusercontent\.com/i.test(text);
            if (isDirectImage || isGoogleThumb) {
                element.innerHTML = `<img src="${text}" alt="Comentário" class="commentary-sticker">`;
                return;
            }
        }

        // Caso padrão: texto com eventuais quebras de linha
        element.innerHTML = text;
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

    // Função para formatar caption de vídeo com música e banda em itálico para OP/ED
    // Aceita formato: "OP | nome da música | nome da banda"
    _formatVideoCaption(element, vData) {
        if (!element) return;
        
        const caption = vData.caption || '';
        
        // Se contém "|", faz parsing
        if (caption.includes('|')) {
            const parts = caption.split('|').map(p => p.trim());
            const title = parts[0]; // OP ou ED
            const music = parts[1] || '';
            const band = parts[2] || '';
            
            let html = `<b>${title}</b>`;
            if (music) {
                html += `<br><i>${music}</i>`;
            }
            if (band) {
                html += `<br><i>${band}</i>`;
            }
            element.innerHTML = html;
        } else {
            // Se não tem "|", exibe o texto normal
            this._setText(element, caption);
        }
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
        // A exibição do card e a rolagem são agora gerenciadas por setLoading(true)
        
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
        this._setText(this.elements.type, data.type);
        this._setText(this.elements.status, data.status);
        this._setText(this.elements.score, data.score);
        this._setCommentary(data.commentary);

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

        // Configura imagens de estúdio com suporte híbrido (Objeto API / String Local)
        if (this.elements.studio && data.studio) {
            const studioImg = this.elements.studio;
            const studioLinkEl = this.elements.studioLink;

            // 1. Limpa qualquer texto de fallback inserido em um clique anterior
            if (studioLinkEl) {
                const activeFallback = studioLinkEl.querySelector('.studio-text-fallback');
                if (activeFallback) activeFallback.remove();
            }

            // 2. Torna a tag de imagem visível por padrão
            studioImg.style.display = 'inline-block';

            // 3. DETECÇÃO HÍBRIDA: Verifica se o dado é um Objeto (API) ou String (Local)
            if (typeof data.studio === 'object' && data.studio !== null) {
                // Caso venha da Jikan API (Objeto)
                studioImg.src = data.studio.url || '';

                // Captura de erro para links quebrados da API externa
                studioImg.onerror = function() {
                    console.warn(`[Estúdio] Imagem corrompida na API para: ${data.studio.name}. Injetando texto.`);
                    this.style.display = 'none';

                    const fallbackText = document.createElement('span');
                    fallbackText.className = 'studio-text-fallback';
                    fallbackText.style.fontWeight = 'bold';
                    fallbackText.style.fontSize = '1.1em';
                    fallbackText.style.color = 'var(--text-color, #ffffff)';
                    fallbackText.textContent = data.studio.name;

                    if (studioLinkEl) {
                        studioLinkEl.appendChild(fallbackText);
                    } else if (this.parentElement) {
                        this.parentElement.appendChild(fallbackText);
                    }
                };
            } else if (typeof data.studio === 'string') {
                // Caso seja uma página local/estática (String com o caminho da imagem)
                studioImg.src = data.studio;
                
                // Desativa o tratamento de erro para imagens locais para evitar conflitos
                studioImg.onerror = null; 
            }
        }

        // Ajuste preventivo para o segundo estúdio (caso possua)
        if (this.elements.studio2 && data.studio2) {
            if (typeof data.studio2 === 'object' && data.studio2 !== null) {
                this.elements.studio2.src = data.studio2.url || '';
            } else {
                this.elements.studio2.src = data.studio2;
            }
        }

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
            { video: data.video1, caption: data.caption1 },
            { video: data.video2, caption: data.caption2 },
            { video: data.video3, caption: data.caption3 }
        ];

        // Destrói players antigos antes de criar novos
        if (window.videoPlayers && window.videoPlayers.length) {
            window.videoPlayers.forEach(p => {
                if (p && typeof p.destroy === 'function') {
                    p.destroy();
                }
            });
        }
        window.videoPlayers = [];

        this.elements.videoContainers.forEach((container, index) => {
            const vData = videoData[index];
            const playerId = `video-player-${index + 1}`;
            const playerContainer = container.querySelector(`#${playerId}`);
            const captionSpan = container.querySelector('.video-caption-text');

            // Limpa o container do player anterior
            playerContainer.innerHTML = '';

            if (vData.video && vData.video !== "false" && playerContainer) {
                container.style.display = 'flex';
                
                // Formata o caption com música e banda em itálico para OP/ED
                this._formatVideoCaption(captionSpan, vData);

                // Cria uma thumbnail/placeholder clicável em vez do player completo
                const thumbnailDiv = document.createElement('div');
                thumbnailDiv.className = 'video-thumbnail';

                const videoId = getYouTubeVideoId(vData.video);
                if (videoId) {
                    // Thumbnail para YouTube
                    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
                    thumbnailDiv.innerHTML = `
                        <img src="${thumbnailUrl}" alt="${vData.caption}" style="width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0;">
                        <div style="position: absolute; bottom: 10px; right: 10px; background: rgba(11,18,32,0.8); padding: 4px 8px; border-radius: 6px; font-size: 12px; color: white; display: flex; align-items: center; gap: 4px; backdrop-filter: blur(4px);">
                            <i class="fab fa-youtube"></i> YouTube
                        </div>
                    `;
                } else if (isTwitterUrl(vData.video)) {
                    // Thumbnail para Twitter/X
                    console.log('Criando thumbnail para Twitter:', vData.video);
                    thumbnailDiv.innerHTML = `
                        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #000; display: flex; align-items: center; justify-content: center; color: white; pointer-events: none;">
                            <i class="fa-brands fa-x-twitter" style="font-size: 48px;"></i>
                        </div>
                        <div style="position: absolute; bottom: 10px; right: 10px; background: rgba(11,18,32,0.8); padding: 4px 8px; border-radius: 6px; font-size: 12px; color: white; display: flex; align-items: center; gap: 4px; backdrop-filter: blur(4px); pointer-events: none;">
                            <i class="fa-brands fa-x-twitter"></i>
                        </div>
                    `;
                } else {
                    // Placeholder para outros
                    thumbnailDiv.innerHTML = `
                        <div style="width: 100%; height: 100%; background: #000; display: flex; align-items: center; justify-content: center; color: white;">
                            <i class="fas fa-play-circle" style="font-size: 48px;"></i>
                        </div>
                        <div style="position: absolute; bottom: 10px; right: 10px; background: rgba(11,18,32,0.8); padding: 4px 8px; border-radius: 6px; font-size: 12px; color: white; display: flex; align-items: center; gap: 4px; backdrop-filter: blur(4px);">
                            <i class="fas fa-external-link-alt"></i> Link
                        </div>
                    `;
                }

                // Adiciona evento de clique para abrir modal
                thumbnailDiv.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Thumbnail clicked for video:', vData.caption, 'URL:', vData.video);
                    if (typeof openVideoModal === 'function') {
                        console.log('Calling openVideoModal');
                        openVideoModal(vData, index + 1);
                    } else {
                        console.error('openVideoModal function not found');
                    }
                });

                playerContainer.appendChild(thumbnailDiv);

                // Remove os controles inline já que agora usamos modal
                const controls = container.querySelector('.video-controls');
                if (controls) controls.style.display = 'none';
            } else {
                container.style.display = 'none';
            }
        });
    }
}

function onYouTubeIframeAPIReady() {
    // A API está pronta.
}

// Função auxiliar para detectar temporada e ano da URL
function getSeasonFromURL() {
    const url = window.location.pathname;
    
    // Procura padrões como "Janeiro2026", "Abr2026", "Jul2026", "Outubro2026"
    const monthMatch = url.match(/(janeiro|jan|april|abril|abr|julho|jul|outubro|out|july)/i);
    const yearMatch = url.match(/(\d{4})/);
    
    if (!monthMatch || !yearMatch) {
        console.warn('Não foi possível detectar a temporada/ano da URL');
        return { year: 2026, season: 'summer' };
    }
    
    const month = monthMatch[0].toLowerCase();
    const year = parseInt(yearMatch[1]);
    
    let season = 'summer';
    if (month.includes('jan')) season = 'winter';
    else if (month.includes('abr') || month.includes('apr')) season = 'spring';
    else if (month.includes('jul')) season = 'summer';
    else if (month.includes('out')) season = 'fall';
    
    return { year, season };
}

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', async () => {
    const animeCardManager = new AnimeCardManager('.animeCard');
    const animeChart = document.getElementById('anime-chart');

    // 1. Registra o evento de clique IMEDIATAMENTE
    if (animeChart) {
        animeChart.addEventListener('click', async (e) => {
            const trigger = e.target.closest('.anime-card-trigger');
            if (!trigger) return;

            e.preventDefault();

            const isCurrentAnime = animeCardManager.card.style.display === 'block' && 
                                   animeCardManager.elements.title.innerHTML === trigger.dataset.title;
            
            if (isCurrentAnime) {
                animeCardManager.card.style.display = 'none';
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            // --- FEEDBACK INSTANTÂNEO ---
            // Ativa o loading, exibe o card e sobe para o topo/card na hora
            animeCardManager.setLoading(true);
            
            let animeData = { ...trigger.dataset };

            if (animeData.animeData) {
                const jikanId = parseInt(animeData.animeData);
                const jikanData = await fetchAnimeFromJikan(jikanId);
                animeData = mergeJikanData(animeData, jikanData);
            }

            animeCardManager.populate(animeData);
            animeCardManager.setLoading(false);
        });
    }

    // 2. Busca os dados da temporada em background (sem bloquear os cliques)
    const { year, season } = getSeasonFromURL();
    fetchSeasonAnimes(year, season).then(() => {
        populateTitleOverlays();
        updateAnimeCount('anime-chart');
        
        // Inicializa filtros após os dados estarem prontos
        initializeTypeFilters('anime-chart', 'type-filter-container');
        initializeGenreFilters('anime-chart', 'genre-filter-container');
        initializeSorting('anime-chart', 'sort-select');
        initializeClearButton('anime-chart', 'type-filter-container', 'genre-filter-container', 'sort-select');
        console.log(`✅ Dados da temporada ${season} carregados e filtros prontos.`);
    });

    // 3. Função única para popular os títulos (removendo as duplicatas abaixo)
    preloadAllImages();
});

async function populateTitleOverlays() {
    const animeTriggers = document.querySelectorAll('.anime-card-trigger');
    animeTriggers.forEach((trigger) => {
        const titleOverlay = trigger.querySelector('.title-overlay');
        const animeImage = trigger.querySelector('.image');
        const jikanId = trigger.dataset.animeData;

        if (jikanId) {
            // Usa dados em cache se disponível
            // NÃO faz requisição - isso é para carregamento inicial apenas!
            const cachedData = jikanCache[parseInt(jikanId)];
            
            if (cachedData) {
                trigger.dataset.title = cachedData.title;
                if (!trigger.dataset.genre) trigger.dataset.genre = cachedData.genre;
                if (!trigger.dataset.type) trigger.dataset.type = cachedData.type;
                if (!trigger.dataset.time) trigger.dataset.time = cachedData.time

                if (cachedData.thumb1 && animeImage) {
                    animeImage.src = cachedData.thumb1;
                }
                if (titleOverlay) titleOverlay.textContent = cachedData.title;
            } else if (titleOverlay && trigger.dataset.title) {
                titleOverlay.textContent = trigger.dataset.title;
            }
        } else {
            if (titleOverlay && trigger.dataset.title) {
                titleOverlay.textContent = trigger.dataset.title;
            }
        }
    });
}

// Remova as funções repetidas que estavam no final do arquivo original,
// mantendo apenas as utilitárias de filtro e preloading

    // Pré‑carrega todas as imagens visíveis para popularem o cache do navegador
    function preloadAllImages() {
        const selectors = ['.image-container img', '.slideshow-container img'];
        selectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(img => {
                const src = img.dataset.src || img.src;
                if (src) {
                    const picture = new Image();
                    picture.src = src;
                }
            });
        });
    }
    preloadAllImages();

    let currentGenreFilter = 'all';
    let currentTypeFilter = 'all';
    // --- LÓGICA DE FILTRO POR GÊNERO ---
    function initializeGenreFilters(chartId, filterContainerId) {
        const chart = document.getElementById(chartId);
        if (!chart) return;

        const animeTriggers = chart.querySelectorAll('.anime-card-trigger');
        const filterContainer = document.getElementById(filterContainerId);
        const animeContainers = chart.querySelectorAll('.image-container');

        // Se não houver container de filtro ou animes na grade, não faz nada.
        if (!filterContainer || animeTriggers.length === 0) return;

        // 1. Coletar todos os gêneros únicos
        const allGenres = new Set();
        animeTriggers.forEach(trigger => {
            const genres = trigger.dataset.genre;
            if (genres) {
                genres.split(',').forEach(genre => {
                    allGenres.add(genre.trim());
                });
            }
        });

        // 2. Criar e adicionar os botões de filtro
        filterContainer.innerHTML = ''; // Limpa filtros existentes

        // Botão "Mostrar Todos"
        const allButton = document.createElement('button');
        allButton.className = 'filter-btn active';
        allButton.textContent = 'Mostrar Todos';
        allButton.addEventListener('click', (e) => {
            filterAnimes('all');
            setActiveButton(allButton);
        });
        filterContainer.appendChild(allButton);

        // Botões para cada gênero
        [...allGenres].sort().forEach(genre => {
            const button = document.createElement('button');
            button.className = 'filter-btn';
            button.textContent = genre;
            button.addEventListener('click', (e) => {
                filterAnimes(genre);
                setActiveButton(button);
            });
            filterContainer.appendChild(button);
        });

        // 3. Funções de filtro
        function filterAnimes(selectedGenre) {
            currentGenreFilter = selectedGenre;
            applyAllFilters(chartId);
        }

        function setActiveButton(activeBtn) {
            filterContainer.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            activeBtn.classList.add('active');
        }
    }

    // --- LÓGICA DE FILTRO POR TIPO ---
    function initializeTypeFilters(chartId, filterContainerId) {
        const chart = document.getElementById(chartId);
        if (!chart) return;

        const animeTriggers = chart.querySelectorAll('.anime-card-trigger');
        const filterContainer = document.getElementById(filterContainerId);

        if (!filterContainer || animeTriggers.length === 0) return;

        const allTypes = new Set();
        animeTriggers.forEach(trigger => {
            const type = trigger.dataset.type;
            if (type) allTypes.add(type.trim());
        });

        filterContainer.innerHTML = '';

        const allButton = document.createElement('button');
        allButton.className = 'filter-btn active';
        allButton.textContent = 'Todos os Tipos';
        allButton.addEventListener('click', () => {
            filterByType('all');
            setActiveButton(allButton);
        });
        filterContainer.appendChild(allButton);

        [...allTypes].sort().forEach(type => {
            const button = document.createElement('button');
            button.className = 'filter-btn';
            button.textContent = type;
            button.addEventListener('click', () => {
                filterByType(type);
                setActiveButton(button);
            });
            filterContainer.appendChild(button);
        });

        function filterByType(selectedType) {
            currentTypeFilter = selectedType;
            applyAllFilters(chartId);
        }

        function setActiveButton(activeBtn) {
            filterContainer.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            activeBtn.classList.add('active');
        }
    }

    // --- FUNÇÃO PARA ATUALIZAR A CONTAGEM DE ANIMES ---
    function updateAnimeCount(chartId) {
        const chart = document.getElementById(chartId);
        const countElement = document.getElementById('anime-count');
        if (!chart || !countElement) return;

        const visibleItems = chart.querySelectorAll('.image-container:not(.hidden)').length;
        countElement.textContent = visibleItems;
    }
    // --- FUNÇÃO MESTRA DE FILTRAGEM ---
    function applyAllFilters(chartId) {
        const loader = document.getElementById('loader');
        const chart = document.getElementById(chartId);
        if (!chart || !loader) return;

        // Mostra o loader
        loader.style.display = 'flex';

        const animeContainers = chart.querySelectorAll('.image-container');
        animeContainers.forEach(container => {
            const trigger = container.querySelector('.anime-card-trigger');
            const matchesGenre = currentGenreFilter === 'all' || (trigger.dataset.genre || '').includes(currentGenreFilter);
            const matchesType = currentTypeFilter === 'all' || (trigger.dataset.type || '') === currentTypeFilter;
            container.classList.toggle('hidden', !(matchesGenre && matchesType));
        });

        // Esconde o loader após um pequeno atraso para garantir que a animação seja visível
        setTimeout(() => {
            loader.style.display = 'none';
            
            // Atualiza a contagem de animes visíveis
            updateAnimeCount(chartId);
        }, 400); // 400ms é um bom ponto de partida
    }
    // --- LÓGICA DE ORDENAÇÃO ---
    function initializeSorting(chartId, sortSelectId) {
        const sortSelect = document.getElementById(sortSelectId);
        const animeChart = document.getElementById(chartId);

        if (!sortSelect || !animeChart) {
            // Se o seletor ou a grade não existirem, não faz nada.
            return;
        }

        sortSelect.addEventListener('change', () => {
            sortAnimes(sortSelect.value);
        });

        function sortAnimes(sortValue) {
            const animeContainers = Array.from(animeChart.querySelectorAll('.image-container'));

            const sortFunction = (a, b) => {
                const triggerA = a.querySelector('.anime-card-trigger');
                const triggerB = b.querySelector('.anime-card-trigger');

                switch (sortValue) {
                    case 'alpha-asc':
                        return triggerA.dataset.title.localeCompare(triggerB.dataset.title);
                    case 'alpha-desc':
                        return triggerB.dataset.title.localeCompare(triggerA.dataset.title);
                    case 'date-desc':
                        const [dayA, monthA] = triggerA.dataset.time.split('/').map(Number);
                        const [dayB, monthB] = triggerB.dataset.time.split('/').map(Number);
                        
                        let mA = monthA;
                        let mB = monthB;
                        
                        // Lógica de mês circular: Se a diferença entre os meses for muito grande (ex: 1 e 12),
                        // significa que houve uma virada de ano/temporada. Ajustamos o peso para manter a ordem.
                        if (mA - mB > 6) mB += 12;
                        if (mB - mA > 6) mA += 12;
                        
                        // Ordenação cronológica: Mês*100 + Dia garante que 30/06 venha antes de 05/07
                        return (mA * 100 + dayA) - (mB * 100 + dayB);
                    case 'default':
                    default:
                        // Retorna à ordem original do DOM
                        return parseInt(a.dataset.originalOrder) - parseInt(b.dataset.originalOrder);
                }
            };

            animeContainers.sort(sortFunction);

            // Reanexa os elementos na nova ordem
            animeContainers.forEach(container => animeChart.appendChild(container));
        }

        // Armazena a ordem original para a opção "Padrão"
        animeChart.querySelectorAll('.image-container').forEach((container, index) => {
            container.dataset.originalOrder = index;
        });
    }

    // --- LÓGICA PARA LIMPAR FILTROS ---
    function initializeClearButton(chartId, typeContainerId, genreContainerId, sortSelectId) {
        const clearBtn = document.getElementById('clear-filters-btn');
        if (!clearBtn) return;

        clearBtn.addEventListener('click', () => {
            // Reseta as variáveis de estado
            currentTypeFilter = 'all';
            currentGenreFilter = 'all';

            // Reseta os botões de filtro de tipo
            const typeContainer = document.getElementById(typeContainerId);
            typeContainer.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            typeContainer.querySelector('.filter-btn').classList.add('active'); // Ativa o primeiro botão ("Todos os Tipos")

            // Reseta os botões de filtro de gênero
            const genreContainer = document.getElementById(genreContainerId);
            genreContainer.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            genreContainer.querySelector('.filter-btn').classList.add('active'); // Ativa o primeiro botão ("Mostrar Todos")

            // Reseta a ordenação e aplica todos os filtros
            document.getElementById(sortSelectId).value = 'default';
            applyAllFilters(chartId); // Mostra/esconde os cards
            
            // Dispara um evento de 'change' para que a função de ordenação seja executada
            document.getElementById(sortSelectId).dispatchEvent(new Event('change'));
        });
    }

    // Preenche os títulos e a contagem inicial assim que a página carrega
    populateTitleOverlays();
    updateAnimeCount('anime-chart');

    // Inicializa os filtros e a ordenação para a grade de "Estréias"
    initializeTypeFilters('anime-chart', 'type-filter-container');
    initializeGenreFilters('anime-chart', 'genre-filter-container');
    initializeSorting('anime-chart', 'sort-select');
    initializeClearButton('anime-chart', 'type-filter-container', 'genre-filter-container', 'sort-select');

    function isTwitterUrl(url) {
    if (!url || url === "false") return false;
    try {
        const urlObj = new URL(url);
        return urlObj.hostname === 'x.com' || urlObj.hostname === 'twitter.com';
    } catch (e) {
        return false;
    }
}
