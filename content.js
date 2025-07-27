// Bandcamp Player Enhancer - Content Script
(function() {
    'use strict';
    
    console.log('Bandcamp Player Enhancer chargé');
    
    // Détection du navigateur et API de stockage compatible
    const browserAPI = (() => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            return chrome;
        } else if (typeof browser !== 'undefined' && browser.storage) {
            return browser;
        } else {
            console.warn('Aucune API de navigateur détectée, utilisation du localStorage comme fallback');
            return null;
        }
    })();
    
    console.log('Navigateur détecté:', browserAPI ? (typeof chrome !== 'undefined' ? 'Chrome/Chromium' : 'Firefox') : 'Inconnu');
    
    let audioElement = null;
    let volumeSlider = null;
    let progressBar = null;
    let progressFill = null;
    let progressHandle = null;
    let currentTimeDisplay = null;
    let durationDisplay = null;
    let isDragging = false;
    let savedVolume = 1; // Volume par défaut
    
    // Fonction pour sauvegarder le volume (compatible Chrome + Firefox)
    function saveVolume(volume) {
        savedVolume = volume;
        
        if (browserAPI && browserAPI.storage && browserAPI.storage.local) {
            // Chrome/Firefox avec API extension
            browserAPI.storage.local.set({ 'bandcamp_volume': volume });
        } else {
            // Fallback avec localStorage
            try {
                localStorage.setItem('bandcamp_volume', volume.toString());
            } catch (e) {
                console.warn('Impossible de sauvegarder le volume:', e);
            }
        }
    }
    
    // Fonction pour charger le volume sauvegardé (compatible Chrome + Firefox)
    function loadSavedVolume() {
        return new Promise((resolve) => {
            if (browserAPI && browserAPI.storage && browserAPI.storage.local) {
                // Chrome/Firefox avec API extension
                browserAPI.storage.local.get(['bandcamp_volume'], (result) => {
                    const volume = result.bandcamp_volume || 1; // 1 = 100% par défaut
                    savedVolume = volume;
                    resolve(volume);
                });
            } else {
                // Fallback avec localStorage
                try {
                    const storedVolume = localStorage.getItem('bandcamp_volume');
                    const volume = storedVolume ? parseFloat(storedVolume) : 1;
                    savedVolume = volume;
                    resolve(volume);
                } catch (e) {
                    console.warn('Impossible de charger le volume:', e);
                    savedVolume = 1;
                    resolve(1);
                }
            }
        });
    }
    
    // Fonction pour formater le temps en MM:SS
    function formatTime(seconds) {
        if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
    
    // Fonction pour trouver l'élément audio
    async function findAudioElement() {
        const audio = document.querySelector('audio');
        if (audio) {
            console.log('Élément audio trouvé:', audio);
            
            // Charger et appliquer immédiatement le volume sauvegardé
            await loadSavedVolume();
            audio.volume = savedVolume;
            console.log(`Volume restauré: ${Math.round(savedVolume * 100)}%`);
            
            return audio;
        }
        return null;
    }
    
    // Fonction pour créer le slider de volume
    async function createVolumeSlider() {
        if (!audioElement || volumeSlider) return;
        
        // Charger le volume sauvegardé
        await loadSavedVolume();
        
        const container = document.createElement('div');
        container.className = 'bpe-volume-container';
        
        const label = document.createElement('label');
        label.className = 'bpe-volume-label';
        label.textContent = 'Volume';
        
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '0';
        slider.max = '100';
        slider.value = Math.round(savedVolume * 100);
        slider.className = 'bpe-volume-slider';
        
        // Appliquer le volume sauvegardé à l'élément audio
        audioElement.volume = savedVolume;
        
        const valueDisplay = document.createElement('div');
        valueDisplay.className = 'bpe-volume-value';
        valueDisplay.textContent = `${slider.value}%`;
        
        // Event listener pour le changement de volume
        slider.addEventListener('input', function() {
            const volume = this.value / 100;
            audioElement.volume = volume;
            valueDisplay.textContent = `${this.value}%`;
            
            // Sauvegarder le nouveau volume
            saveVolume(volume);
        });
        
        container.appendChild(label);
        container.appendChild(slider);
        container.appendChild(valueDisplay);
        
        volumeSlider = slider;
        return container;
    }
    
    // Fonction pour cacher les éléments du player original
    function hideOriginalPlayerElements() {
        // Sélecteurs des éléments du player Bandcamp à cacher
        const elementsToHide = [
            '.progbar',
            '.progbar_empty', 
            '.timeindicator',
            '.time_indicator',
            '.volume_ctrl',
            '.vol_slider',
            '.volumeslider',
            '.progress',
            '.progress-bar',
            '.tracktime',
            '.time_total',
            '.time_elapsed',
            '.scrubber',
            '.playhead',
            '.track-progress',
            '.playbar'
        ];
        
        elementsToHide.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                element.style.display = 'none';
                element.classList.add('bpe-hidden-original');
            });
        });
        
        // Cacher aussi les contrôles de volume natifs s'ils existent
        const volumeControls = document.querySelectorAll('[class*="volume"], [class*="vol"]');
        volumeControls.forEach(element => {
            if (element.tagName.toLowerCase() === 'input' && element.type === 'range') {
                element.style.display = 'none';
                element.classList.add('bpe-hidden-original');
            }
        });
        
        // Cacher les barres de progression natives
        const progressBars = document.querySelectorAll('div[style*="width"][style*="%"]');
        progressBars.forEach(element => {
            const parent = element.parentElement;
            if (parent && (parent.className.includes('prog') || parent.className.includes('time') || parent.className.includes('scrub'))) {
                parent.style.display = 'none';
                parent.classList.add('bpe-hidden-original');
            }
        });
        
        console.log('Éléments du player original cachés');
    }
    
    // Fonction pour restaurer les éléments du player original (si nécessaire)
    function restoreOriginalPlayerElements() {
        const hiddenElements = document.querySelectorAll('.bpe-hidden-original');
        hiddenElements.forEach(element => {
            element.style.display = '';
            element.classList.remove('bpe-hidden-original');
        });
        
        console.log('Éléments du player original restaurés');
    }
    
    // Fonction de débogage pour identifier les contrôles Bandcamp
    function debugBandcampControls() {
        console.log('=== DEBUG: Éléments de contrôle détectés ===');
        
        // Chercher tous les boutons et liens possibles
        const allButtons = document.querySelectorAll('button, a, div[role="button"], span[onclick]');
        const relevantControls = [];
        
        allButtons.forEach((element, index) => {
            const classes = element.className || '';
            const title = element.title || '';
            const text = element.textContent || '';
            const onclick = element.onclick || '';
            
            // Filtrer les éléments qui pourraient être des contrôles
            if (classes.includes('play') || classes.includes('pause') || classes.includes('next') || 
                classes.includes('prev') || classes.includes('skip') || classes.includes('control') ||
                title.toLowerCase().includes('play') || title.toLowerCase().includes('next') || 
                title.toLowerCase().includes('prev') || title.toLowerCase().includes('skip')) {
                
                relevantControls.push({
                    index,
                    tagName: element.tagName,
                    classes,
                    title,
                    text: text.trim().substring(0, 20),
                    onclick: onclick.toString().substring(0, 50)
                });
            }
        });
        
        console.log('Contrôles potentiels trouvés:', relevantControls);
        console.log('=== FIN DEBUG ===');
        
        return relevantControls;
    }
    
    // Fonction pour créer les contrôles de lecture personnalisés
    function createPlaybackControls() {
        const container = document.createElement('div');
        container.className = 'bpe-playback-controls';
        
        // Bouton Play/Pause
        const playPauseBtn = document.createElement('button');
        playPauseBtn.className = 'bpe-play-pause-btn';
        playPauseBtn.innerHTML = '▶️';
        playPauseBtn.title = 'Play/Pause';
        
        // Bouton Previous (reculer 10s)
        const prevBtn = document.createElement('button');
        prevBtn.className = 'bpe-prev-btn';
        prevBtn.innerHTML = '⏪';
        prevBtn.title = 'Reculer de 10 secondes';
        
        // Bouton Next (avancer 10s)
        const nextBtn = document.createElement('button');
        nextBtn.className = 'bpe-next-btn';
        nextBtn.innerHTML = '⏩';
        nextBtn.title = 'Avancer de 10 secondes';
        
        // Event listeners pour les boutons
        playPauseBtn.addEventListener('click', function() {
            if (!audioElement) return;
            
            if (audioElement.paused) {
                audioElement.play();
                playPauseBtn.innerHTML = '⏸️';
            } else {
                audioElement.pause();
                playPauseBtn.innerHTML = '▶️';
            }
        });
        
        prevBtn.addEventListener('click', function() {
            console.log('Bouton Reculer 10s cliqué');
            
            if (!audioElement) {
                console.log('Aucun élément audio trouvé');
                return;
            }
            
            // Reculer de 10 secondes
            const newTime = Math.max(0, audioElement.currentTime - 10);
            audioElement.currentTime = newTime;
            console.log(`Temps reculé à: ${Math.round(newTime)}s`);
        });
        
        nextBtn.addEventListener('click', function() {
            console.log('Bouton Avancer 10s cliqué');
            
            if (!audioElement) {
                console.log('Aucun élément audio trouvé');
                return;
            }
            
            // Avancer de 10 secondes (sans dépasser la durée)
            const newTime = Math.min(audioElement.duration || 0, audioElement.currentTime + 10);
            audioElement.currentTime = newTime;
            console.log(`Temps avancé à: ${Math.round(newTime)}s`);
        });
        
        // Mettre à jour l'état du bouton play/pause
        if (audioElement) {
            audioElement.addEventListener('play', () => {
                playPauseBtn.innerHTML = '⏸️';
            });
            
            audioElement.addEventListener('pause', () => {
                playPauseBtn.innerHTML = '▶️';
            });
            
            // État initial
            playPauseBtn.innerHTML = audioElement.paused ? '▶️' : '⏸️';
        }
        
        container.appendChild(prevBtn);
        container.appendChild(playPauseBtn);
        container.appendChild(nextBtn);
        
        return container;
    }
    
    // Fonction pour créer la barre de progression custom
    function createCustomProgressBar() {
        if (!audioElement || progressBar) return;
        
        const container = document.createElement('div');
        container.className = 'bpe-progress-container';
        
        const progressBarElement = document.createElement('div');
        progressBarElement.className = 'bpe-progress-bar';
        
        const progressFillElement = document.createElement('div');
        progressFillElement.className = 'bpe-progress-fill';
        progressFillElement.style.width = '0%';
        
        const progressHandleElement = document.createElement('div');
        progressHandleElement.className = 'bpe-progress-handle';
        
        progressFillElement.appendChild(progressHandleElement);
        progressBarElement.appendChild(progressFillElement);
        
        const timeDisplay = document.createElement('div');
        timeDisplay.className = 'bpe-time-display';
        
        const currentTime = document.createElement('span');
        currentTime.textContent = '0:00';
        
        const duration = document.createElement('span');
        duration.textContent = '0:00';
        
        timeDisplay.appendChild(currentTime);
        timeDisplay.appendChild(duration);
        
        container.appendChild(progressBarElement);
        container.appendChild(timeDisplay);
        
        // Event listeners pour la barre de progression
        let isMouseDown = false;
        
        function updateProgress(event) {
            const rect = progressBarElement.getBoundingClientRect();
            const percent = Math.max(0, Math.min(100, (event.clientX - rect.left) / rect.width * 100));
            const newTime = (percent / 100) * audioElement.duration;
            
            if (!isNaN(newTime) && isFinite(newTime)) {
                audioElement.currentTime = newTime;
            }
        }
        
        progressBarElement.addEventListener('mousedown', function(e) {
            isMouseDown = true;
            isDragging = true;
            updateProgress(e);
        });
        
        document.addEventListener('mousemove', function(e) {
            if (isMouseDown) {
                updateProgress(e);
            }
        });
        
        document.addEventListener('mouseup', function() {
            isMouseDown = false;
            isDragging = false;
        });
        
        progressBarElement.addEventListener('click', updateProgress);
        
        progressBar = progressBarElement;
        progressFill = progressFillElement;
        progressHandle = progressHandleElement;
        currentTimeDisplay = currentTime;
        durationDisplay = duration;
        
        return container;
    }
    
    // Fonction pour mettre à jour la barre de progression
    function updateProgressBar() {
        if (!audioElement || !progressFill || isDragging) return;
        
        const currentTime = audioElement.currentTime;
        const duration = audioElement.duration;
        
        if (!isNaN(duration) && duration > 0) {
            const percent = (currentTime / duration) * 100;
            progressFill.style.width = `${percent}%`;
            
            if (currentTimeDisplay) {
                currentTimeDisplay.textContent = formatTime(currentTime);
            }
            
            if (durationDisplay) {
                durationDisplay.textContent = formatTime(duration);
            }
        }
    }
    
    // Fonction pour injecter les améliorations
    async function injectEnhancements() {
        // Chercher le conteneur du player
        const playerSelectors = [
            '.inline_player',
            '#trackInfoInner',
            '.track_play_auxiliary',
            '.track_play_hilite',
            '.track_play_area'
        ];
        
        let playerContainer = null;
        for (const selector of playerSelectors) {
            playerContainer = document.querySelector(selector);
            if (playerContainer) break;
        }
        
        if (!playerContainer) {
            console.log('Conteneur du player non trouvé, recherche alternative...');
            // Chercher près des éléments audio
            if (audioElement) {
                playerContainer = audioElement.closest('div') || audioElement.parentElement;
            }
        }
        
        if (!playerContainer) {
            console.log('Impossible de trouver un conteneur approprié');
            return;
        }
        
        // Cacher ou supprimer les éléments de l'ancien player
        hideOriginalPlayerElements();
        
        // Créer le conteneur principal pour nos améliorations
        const enhancementsContainer = document.createElement('div');
        enhancementsContainer.className = 'bpe-enhancements';
        
        // 1. Ajouter la barre de progression en haut
        const progressContainer = createCustomProgressBar();
        if (progressContainer) {
            enhancementsContainer.appendChild(progressContainer);
        }
        
        // 2. Créer les contrôles de lecture au milieu
        const playbackControls = createPlaybackControls();
        if (playbackControls) {
            enhancementsContainer.appendChild(playbackControls);
        }
        
        // 3. Ajouter le slider de volume en bas
        const volumeContainer = await createVolumeSlider();
        if (volumeContainer) {
            enhancementsContainer.appendChild(volumeContainer);
        }
        
        // Insérer notre player à la place de l'ancien
        playerContainer.appendChild(enhancementsContainer);
        
        console.log('Player original remplacé avec succès');
    }
    
    // Fonction pour initialiser les event listeners audio
    function setupAudioListeners() {
        if (!audioElement) return;
        
        // Mettre à jour la barre de progression
        audioElement.addEventListener('timeupdate', updateProgressBar);
        audioElement.addEventListener('loadedmetadata', updateProgressBar);
        audioElement.addEventListener('durationchange', updateProgressBar);
        
        // Synchroniser le volume avec notre slider
        audioElement.addEventListener('volumechange', function() {
            if (volumeSlider) {
                volumeSlider.value = Math.round(audioElement.volume * 100);
                const valueDisplay = volumeSlider.parentElement.querySelector('.bpe-volume-value');
                if (valueDisplay) {
                    valueDisplay.textContent = `${volumeSlider.value}%`;
                }
                
                // Sauvegarder le volume quand il change (même si ce n'est pas via notre slider)
                saveVolume(audioElement.volume);
            }
        });
        
        console.log('Event listeners audio configurés');
    }
    
    // Fonction principale d'initialisation
    async function init() {
        console.log('Initialisation de Bandcamp Player Enhancer...');
        
        // Attendre que la page soit complètement chargée
        if (document.readyState !== 'complete') {
            window.addEventListener('load', init);
            return;
        }
        
        // Chercher l'élément audio
        audioElement = await findAudioElement();
        
        if (!audioElement) {
            console.log('Élément audio non trouvé, nouvelle tentative dans 2s...');
            setTimeout(init, 2000);
            return;
        }
        
        // Vérifier si les améliorations sont déjà injectées
        if (document.querySelector('.bpe-enhancements')) {
            console.log('Améliorations déjà présentes');
            return;
        }
        
        // Injecter les améliorations
        await injectEnhancements();
        setupAudioListeners();
        
        // Debug: afficher les contrôles détectés
        debugBandcampControls();
        
        console.log('Bandcamp Player Enhancer initialisé avec succès');
    }
    
    // Observer les changements de DOM pour les players qui se chargent dynamiquement
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(async function(mutation) {
            if (mutation.type === 'childList') {
                // Vérifier si un nouvel élément audio a été ajouté
                const newAudio = document.querySelector('audio');
                if (newAudio && newAudio !== audioElement) {
                    console.log('Nouvel élément audio détecté');
                    
                    // Charger et appliquer le volume sauvegardé au nouvel élément
                    await loadSavedVolume();
                    newAudio.volume = savedVolume;
                    console.log(`Volume appliqué au nouvel audio: ${Math.round(savedVolume * 100)}%`);
                    
                    audioElement = newAudio;
                    
                    // Réinitialiser si nécessaire
                    if (!document.querySelector('.bpe-enhancements')) {
                        setTimeout(init, 500);
                    }
                }
            }
        });
    });
    
    // Démarrer l'observation
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Lancer l'initialisation
    init();
    
    // Support pour les navigations SPA (Single Page Application)
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            console.log('Navigation détectée, réinitialisation...');
            setTimeout(init, 1000);
        }
    }).observe(document, { subtree: true, childList: true });
    
})();
