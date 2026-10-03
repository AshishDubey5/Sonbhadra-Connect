/**
 * Video Modal Lightbox Module
 * Allows users to paste any video link (YouTube, Vimeo, MP4) into video cards
 * and play them in a seamless, cinematic modal lightbox.
 */

export function initVideoModal() {
  // Ensure modal DOM elements exist
  let modal = document.getElementById('cinemaVideoModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'cinemaVideoModal';
    modal.className = 'video-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Video Player');
    modal.innerHTML = `
      <div class="video-modal__backdrop" data-modal-close></div>
      <div class="video-modal__container">
        <div class="video-modal__header">
          <div class="video-modal__info">
            <h3 class="video-modal__title" id="videoModalTitle">Destination Cinema</h3>
            <span class="video-modal__author" id="videoModalAuthor">SonbhadraConnect Creators</span>
          </div>
          <button class="video-modal__close" data-modal-close aria-label="Close Video">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="video-modal__player-wrapper" id="videoModalPlayer"></div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const playerContainer = modal.querySelector('#videoModalPlayer');
  const titleEl = modal.querySelector('#videoModalTitle');
  const authorEl = modal.querySelector('#videoModalAuthor');

  // Convert raw URL (YouTube, Vimeo, MP4) to playable embed markup
  function getEmbedMarkup(url) {
    if (!url || url === '#' || url.trim() === '') {
      return `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#fff;text-align:center;padding:2rem;">
          <p style="font-size:1.25rem;font-weight:600;margin-bottom:0.5rem;color:var(--color-sunset)">Video Link Needed</p>
          <p style="font-size:0.875rem;color:rgba(255,255,255,0.7);max-width:400px;">
            Please put your YouTube, Vimeo, or MP4 video URL in the <code>data-video-url</code> attribute of this card.
          </p>
        </div>
      `;
    }

    // YouTube matches (standard, youtu.be, embed, shorts)
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
      const videoId = ytMatch[1];
      return `<iframe src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1" 
                title="YouTube video player" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowfullscreen></iframe>`;
    }

    // Vimeo match
    const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
    if (vimeoMatch && vimeoMatch[1]) {
      const vimeoId = vimeoMatch[1];
      return `<iframe src="https://player.vimeo.com/video/${vimeoId}?autoplay=1&badge=0&autopause=0" 
                title="Vimeo video player" 
                allow="autoplay; fullscreen; picture-in-picture" 
                allowfullscreen></iframe>`;
    }

    // Direct video file (mp4, webm, ogg)
    if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) {
      return `<video src="${url}" controls autoplay playsinline style="width:100%;height:100%;object-fit:contain;"></video>`;
    }

    // Generic fallback iframe
    return `<iframe src="${url}" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
  }

  function openModal(url, title, author) {
    if (titleEl) titleEl.textContent = title || 'Through the Lens of Creators';
    if (authorEl) authorEl.textContent = author || 'SonbhadraConnect Verified Creator';
    if (playerContainer) {
      playerContainer.innerHTML = getEmbedMarkup(url);
    }
    modal.classList.add('is-active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('is-active');
    document.body.style.overflow = '';
    // Stop any playing audio/video by clearing player
    setTimeout(() => {
      if (playerContainer) playerContainer.innerHTML = '';
    }, 300);
  }

  // Event delegation for opening cards
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.video-card[data-video-url]');
    if (card) {
      e.preventDefault();
      const videoUrl = card.getAttribute('data-video-url') || '';
      const videoTitle = card.getAttribute('data-video-title') || card.querySelector('.video-card__title')?.textContent || '';
      const videoAuthor = card.getAttribute('data-video-author') || card.querySelector('.video-card__author span')?.textContent || '';
      openModal(videoUrl, videoTitle, videoAuthor);
      return;
    }

    // Close buttons and backdrop
    if (e.target.closest('[data-modal-close]')) {
      e.preventDefault();
      closeModal();
    }
  });

  // Keyboard shortcut: Escape to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-active')) {
      closeModal();
    }
  });
}
