/**
 * Symplissime AI Chat - Application JavaScript avec Streaming
 * Configuration: workspace support-windows, utilisateur symplissime-backoffice
 */

class SymplissimeAIApp {
    constructor() {
        // Provide credentials like API_KEY via the global SYMPLISSIME_CONFIG
        // object before loading this script, e.g.:
        // window.SYMPLISSIME_CONFIG = { API_KEY: 'votre_cle', WORKSPACE: 'id', USER: 'nom' };
        this.config = window.SYMPLISSIME_CONFIG || {};
        // Increase base font scale for better readability
        this.fontScale = 1.2;
        this.isProcessing = false;
        this.messageHistory = [];
        this.currentStreamingMessage = null;
        this.streamingInterval = null;
        this.currentTheme = 'symplissime';
        this.currentFont = 'inter';

        this.themes = {
            'symplissime': {
                name: 'Symplissime Green',
                icon: '🌿',
                attribute: null // Thème par défaut, pas d'attribut data-theme
            },
            'ocean': {
                name: 'Ocean Blue',
                icon: '🌊',
                attribute: 'ocean-blue'
            },
            'sunset': {
                name: 'Sunset Orange',
                icon: '🌅',
                attribute: 'sunset-orange'
            },
            'purple': {
                name: 'Royal Purple',
                icon: '💜',
                attribute: 'royal-purple'
            },
            'crimson': {
                name: 'Crimson Red',
                icon: '🔥',
                attribute: 'crimson-red'
            },
            'dark': {
                name: 'Midnight Dark',
                icon: '🌙',
                attribute: 'midnight-dark'
            },
            'rainbow': {
                name: 'Rainbow',
                icon: '🌈',
                attribute: 'rainbow-theme'
            }
        };

        this.fonts = {
            'inter': {
                name: 'Inter',
                css: "'Inter', sans-serif"
            },
            'roboto': {
                name: 'Roboto',
                css: "'Roboto', sans-serif"
            },
            'opensans': {
                name: 'Open Sans',
                css: "'Open Sans', sans-serif"
            },
            'lato': {
                name: 'Lato',
                css: "'Lato', sans-serif"
            },
            'montserrat': {
                name: 'Montserrat',
                css: "'Montserrat', sans-serif"
            }
        };

        this.easterEggs = ['/confettis','/darkflip','/fortune','/matrix','/cameleon','/eastereggs'];
        
        this.init();
    }

    init() {
        if (window.marked) {
            marked.setOptions({ breaks: true });
        }

        this.loadSavedPreferences();
        this.loadPromptSuggestions();
        this.bindEvents();
        this.updateStatus('connected', 'Connecté');
        this.showWelcomeMessage();
        this.focusInput();
        this.createThemeSelector();
        this.createFontSelector();
        this.initParallax();
    }

    loadSavedPreferences() {
        const savedFontScale = localStorage.getItem('symplissime_fontScale');
        if (savedFontScale) {
            this.fontScale = parseFloat(savedFontScale);
        }
        document.documentElement.style.setProperty('--font-scale', this.fontScale);
        
        const savedTheme = localStorage.getItem('symplissime_theme');
        if (savedTheme && this.themes[savedTheme]) {
            this.currentTheme = savedTheme;
            this.applyTheme(savedTheme);
        }

        const savedFont = localStorage.getItem('symplissime_font');
        if (savedFont && this.fonts[savedFont]) {
            this.currentFont = savedFont;
            this.applyFont(savedFont);
        }
    }

    loadPromptSuggestions() {
        const stored = localStorage.getItem('symplissime_prompt_suggestions');
        if (stored) {
            try {
                const suggestions = JSON.parse(stored);
                suggestions.forEach(s => this.addPromptSuggestion(s, false));
            } catch (e) {
                console.error('Erreur chargement suggestions:', e);
            }
        }
    }

    addPromptSuggestion(text, save = true) {
        const datalist = document.getElementById('promptSuggestions');
        if (!datalist || !text) return;
        const exists = Array.from(datalist.options).some(opt => opt.value === text);
        if (!exists) {
            const option = document.createElement('option');
            option.value = text;
            datalist.appendChild(option);
        }
        if (save) {
            const values = Array.from(datalist.options).map(opt => opt.value);
            localStorage.setItem('symplissime_prompt_suggestions', JSON.stringify(values));
        }
    }

    createThemeSelector() {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;
        
        // Modifier le bouton pour afficher le thème actuel
        themeToggle.innerHTML = this.themes[this.currentTheme].icon;
        
        // Créer le wrapper du sélecteur
        const themeSelector = document.createElement('div');
        themeSelector.className = 'theme-selector';
        
        // Créer le dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'theme-dropdown';
        dropdown.id = 'themeDropdown';
        
        // Créer les options de thème
        Object.entries(this.themes).forEach(([key, theme]) => {
            const option = document.createElement('div');
            option.className = `theme-option ${key === this.currentTheme ? 'active' : ''}`;
            option.dataset.theme = key;
            
            const preview = document.createElement('div');
            preview.className = `theme-preview ${key}`;
            
            const name = document.createElement('span');
            name.textContent = theme.name;
            
            option.appendChild(preview);
            option.appendChild(name);
            
            option.addEventListener('click', () => {
                this.selectTheme(key);
                this.hideThemeDropdown();
            });
            
            dropdown.appendChild(option);
        });
        
        // Remplacer le bouton par le sélecteur
        themeToggle.parentNode.insertBefore(themeSelector, themeToggle);
        themeSelector.appendChild(themeToggle);
        themeSelector.appendChild(dropdown);
        
        // Event listeners
        themeToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleThemeDropdown();
        });
        
        // Fermer le dropdown en cliquant ailleurs
        document.addEventListener('click', (e) => {
            if (!themeSelector.contains(e.target)) {
                this.hideThemeDropdown();
            }
        });
    }

    toggleThemeDropdown() {
        const dropdown = document.getElementById('themeDropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    }

    hideThemeDropdown() {
        const dropdown = document.getElementById('themeDropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
    }

    selectTheme(themeKey) {
        if (this.themes[themeKey] && themeKey !== this.currentTheme) {
            this.currentTheme = themeKey;
            this.applyTheme(themeKey);
            
            // Mettre à jour l'icône du bouton
            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle) {
                themeToggle.innerHTML = this.themes[themeKey].icon;
            }
            
            // Mettre à jour les options actives
            document.querySelectorAll('.theme-option').forEach(option => {
                if (option.dataset.theme === themeKey) {
                    option.classList.add('active');
                } else {
                    option.classList.remove('active');
                }
            });
            
            // Sauvegarder le choix
            localStorage.setItem('symplissime_theme', themeKey);
            
            // Afficher un toast avec transition fluide
            this.showToast(`Thème ${this.themes[themeKey].name} appliqué`, 'success');
        }
    }

    applyTheme(themeKey) {
        const themeAttribute = this.themes[themeKey]?.attribute;
        
        if (themeAttribute) {
            document.documentElement.setAttribute('data-theme', themeAttribute);
        } else {
            // Thème par défaut, supprimer l'attribut
            document.documentElement.removeAttribute('data-theme');
        }
        
        // Animation fluide de transition
        document.body.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 600);
    }

    toggleTheme() {
        // Conserve la compatibilité avec l'ancien bouton
        // en ouvrant simplement le sélecteur de thèmes
        this.toggleThemeDropdown();
    }

    createFontSelector() {
        const fontToggle = document.getElementById('fontToggle');
        if (!fontToggle) return;

        const fontSelector = document.createElement('div');
        fontSelector.className = 'font-selector';

        const dropdown = document.createElement('div');
        dropdown.className = 'font-dropdown';
        dropdown.id = 'fontDropdown';

        Object.entries(this.fonts).forEach(([key, font]) => {
            const option = document.createElement('div');
            option.className = `font-option ${key === this.currentFont ? 'active' : ''}`;
            option.dataset.font = key;

            const name = document.createElement('span');
            name.textContent = font.name;
            name.style.fontFamily = font.css;

            option.appendChild(name);

            option.addEventListener('click', () => {
                this.selectFont(key);
                this.hideFontDropdown();
            });

            dropdown.appendChild(option);
        });

        fontToggle.parentNode.insertBefore(fontSelector, fontToggle);
        fontSelector.appendChild(fontToggle);
        fontSelector.appendChild(dropdown);

        fontToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFontDropdown();
        });

        document.addEventListener('click', (e) => {
            if (!fontSelector.contains(e.target)) {
                this.hideFontDropdown();
            }
        });
    }

    toggleFontDropdown() {
        const dropdown = document.getElementById('fontDropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    }

    hideFontDropdown() {
        const dropdown = document.getElementById('fontDropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
    }

    selectFont(fontKey) {
        if (this.fonts[fontKey] && fontKey !== this.currentFont) {
            this.currentFont = fontKey;
            this.applyFont(fontKey);

            document.querySelectorAll('.font-option').forEach(option => {
                if (option.dataset.font === fontKey) {
                    option.classList.add('active');
                } else {
                    option.classList.remove('active');
                }
            });

            localStorage.setItem('symplissime_font', fontKey);
            this.showToast(`Police ${this.fonts[fontKey].name} appliquée`, 'success');
        }
    }

    applyFont(fontKey) {
        const font = this.fonts[fontKey]?.css;
        if (font) {
            document.documentElement.style.setProperty('--font-sans', font);
        }
    }

    toggleFont() {
        this.toggleFontDropdown();
    }

    initParallax() {
        const header = document.querySelector('.chat-header');
        if (!header) return;
        window.addEventListener('scroll', () => {
            const offset = window.scrollY * 0.1;
            header.style.transform = `translateZ(${offset}px)`;
        });
    }

    bindEvents() {
        // Événement de soumission du formulaire
        const chatForm = document.getElementById('chatForm');
        if (chatForm) {
            chatForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.addEventListener('scroll', () => this.updateScrollIndicator());
        }

        // Animations et ripple sur les boutons
        document.querySelectorAll('.control-btn, .send-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.createRipple(btn, e);
                btn.classList.add('bounce');
                btn.addEventListener('animationend', () => btn.classList.remove('bounce'), { once: true });
            });
        });

        // Raccourcis clavier
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Prévention de la fermeture accidentelle avec des données non sauvegardées
        window.addEventListener('beforeunload', (e) => {
            if (this.messageHistory.length > 1) { // Plus que le message de bienvenue
                e.preventDefault();
                e.returnValue = '';
            }
        });

        this.updateScrollIndicator();
    }

    // Crée un effet ripple basé sur la position du clic
    createRipple(btn, e) {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const rect = btn.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
        btn.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
    }

    handleKeyboardShortcuts(e) {
        // Press "/" to focus input
        if (e.key === '/' && document.activeElement !== this.getMessageInput()) {
            e.preventDefault();
            this.focusInput();
        }
        
        // Ctrl+Enter pour envoyer
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            const form = document.getElementById('chatForm');
            if (form) {
                form.dispatchEvent(new Event('submit'));
            }
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();

        if (this.isProcessing) return;

        const messageInput = this.getMessageInput();
        const message = messageInput.value.trim();

        if (!message) {
            this.showToast('Veuillez saisir un message', 'warning');
            return;
        }

        if (message.length > 1000) {
            this.showToast('Message trop long (max 1000 caractères)', 'error');
            return;
        }

        if (message.startsWith('/')) {
            if (this.handleCommand(message)) {
                messageInput.value = '';
                return;
            }
        }

        messageInput.value = '';
        this.addPromptSuggestion(message);
        await this.sendMessage(message);
    }

    handleCommand(cmd) {
        const command = cmd.slice(1).toLowerCase();
        switch (command) {
            case 'confettis':
                this.launchConfetti();
                this.showToast('🎉 Party time!');
                return true;
            case 'darkflip':
                this.darkFlip();
                return true;
            case 'fortune':
                this.showFortune();
                return true;
            case 'matrix':
                this.launchMatrix();
                this.showToast('💻 Welcome to the Matrix');
                return true;
            case 'cameleon':
                this.cameleonMode();
                this.showToast('🦎 Le caméléon vous observe…');
                return true;
            case 'eastereggs':
                this.addMessage(`Easter Eggs disponibles: ${this.easterEggs.join(', ')}`, false);
                return true;
            default:
                return false;
        }
    }

    async sendMessage(message) {
        this.addMessage(message, true);
        this.showTyping();
        this.setProcessingState(true);
        
        try {
            const formData = new FormData();
            formData.append('action', 'chat');
            formData.append('message', message);
            formData.append('workspace', this.config.WORKSPACE);
            
            const response = await fetch(this.config.API_ENDPOINT, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            
            this.hideTyping();
            
            if (data.error) {
                this.addMessage(`Erreur : ${data.error}`, false, true);
                this.updateStatus('error', 'Erreur');
                this.showToast('Erreur lors de la communication', 'error');
            } else if (data.success && data.message) {
                // Utiliser l'effet de streaming pour afficher la réponse
                await this.streamMessage(data.message);
            } else {
                this.addMessage('Aucune réponse reçue du serveur', false, true);
                this.updateStatus('error', 'Pas de réponse');
            }
        } catch (error) {
            console.error('Erreur de communication:', error);
            this.hideTyping();
            this.addMessage(`Erreur de connexion : ${error.message}`, false, true);
            this.updateStatus('error', 'Erreur connexion');
            this.showToast('Problème de connexion', 'error');
        } finally {
            this.setProcessingState(false);
        }
    }

    async streamMessage(content) {
        // Créer la structure du message
        const messageElement = this.createMessageElement('', false, false);
        const messageContentDiv = messageElement.querySelector('.message');

        // Convertir le contenu en HTML sécurisé et nettoyé avant le streaming
        const html = this.generateHTML(content);

        // Variables pour le streaming par blocs
        const totalChars = html.length;
        let currentIndex = 0;
        const chunkSize = 15; // nombre de caractères affichés à chaque tick

        const streamNextChunk = () => {
            if (currentIndex < totalChars) {
                currentIndex = Math.min(currentIndex + chunkSize, totalChars);
                messageContentDiv.innerHTML = html.slice(0, currentIndex);
                this.scrollToBottom();
                const progress = Math.round((currentIndex / totalChars) * 100);
                this.updateStatus('processing', 'Réponse en cours', progress);
                // Affichage quasi instantané
                this.streamingInterval = setTimeout(streamNextChunk, 0);
            } else {
                // Streaming terminé
                this.finishStreaming(messageElement, content);
            }
        };

        // Démarrer le streaming
        streamNextChunk();
    }

    createMessageElement(content, isUser = false, isError = false) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return null;

        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper ${isUser ? 'user' : 'bot'} fade-in`;
        
        const avatar = document.createElement('div');
        avatar.className = `avatar ${isUser ? 'user' : 'bot'}`;
        avatar.textContent = isUser ? 'U' : 'AI';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        const message = document.createElement('div');
        message.className = `message ${isUser ? 'user' : 'bot'} ${isError ? 'error' : ''}`;

        // Sécurisation du contenu
        message.textContent = content;

        const meta = document.createElement('div');
        meta.className = 'message-meta';
        const timeSpan = document.createElement('span');
        timeSpan.className = 'timestamp';
        timeSpan.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        meta.appendChild(timeSpan);

        if (isUser) {
            const readSpan = document.createElement('span');
            readSpan.className = 'read-status';
            meta.appendChild(readSpan);
        }

        messageContent.appendChild(message);
        messageContent.appendChild(meta);
        wrapper.appendChild(avatar);
        wrapper.appendChild(messageContent);
        chatMessages.appendChild(wrapper);

        this.scrollToBottom();

        return wrapper;
    }

    renderMarkdown(element, content) {
        if (!element) return;

        const html = this.generateHTML(content);
        element.innerHTML = html;

        if (window.hljs) {
            element.querySelectorAll('pre code').forEach(block => {
                hljs.highlightElement(block);
            });
        }

        element.querySelectorAll('p').forEach(p => {
            p.classList.add('formatted-paragraph');
        });

        element.querySelectorAll('ul, ol').forEach(list => {
            list.classList.add('formatted-list');
        });
    }

    generateHTML(content) {
        // 1. Nettoyer le contenu brut avant tout traitement
        let processed = this.cleanRawContent(content);

        // 2. Configurer marked pour un meilleur rendu
        if (window.marked) {
            marked.setOptions({
                breaks: false, // IMPORTANT: false pour éviter les doubles breaks
                gfm: true,
                headerIds: false,
                mangle: false,
                pedantic: false,
                sanitize: false,
                smartLists: true,
                smartypants: true,
                xhtml: false
            });

            processed = marked.parse(processed);
        }

        // 3. Nettoyer et sanitizer le HTML
        if (window.DOMPurify) {
            processed = DOMPurify.sanitize(processed, {
                ALLOWED_TAGS: [
                    'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                    'blockquote', 'code', 'pre', 'ol', 'ul', 'li', 'a', 'img', 'table',
                    'thead', 'tbody', 'tr', 'td', 'th', 'hr', 'span', 'div'
                ],
                ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'target', 'start', 'value'],
                ALLOW_DATA_ATTR: false,
                KEEP_CONTENT: true
            });
        }

        // 4. Post-traitement du HTML
        processed = this.postProcessHTML(processed);

        return processed;
    }

    cleanRawContent(content) {
        if (!content) return '';

        let cleaned = content;

        // Normaliser les fins de ligne
        cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

        // Supprimer les espaces en début et fin
        cleaned = cleaned.trim();

        // Réduire les multiples retours à la ligne consécutifs à maximum 2
        cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

        // Nettoyer les espaces multiples sur une même ligne
        cleaned = cleaned.replace(/[^\S\n]{2,}/g, ' ');

        // Préserver la structure des listes et blocs de code
        cleaned = this.preserveListStructure(cleaned);
        cleaned = this.preserveCodeBlocks(cleaned);

        return cleaned;
    }

    preserveListStructure(content) {
        const listPattern = /^(\s*[-*+•]\s+.+)$/gm;
        const numberedListPattern = /^(\s*\d+\.\s+.+)$/gm;

        content = content.replace(listPattern, '{{LIST}}$1{{/LIST}}');
        content = content.replace(numberedListPattern, '{{NUMLIST}}$1{{/NUMLIST}}');

        content = content.replace(/\n{2,}({{LIST}})/g, '\n\n$1');
        content = content.replace(/({{\/LIST}})\n{2,}/g, '$1\n\n');

        content = content.replace(/{{LIST}}/g, '').replace(/{{\/LIST}}/g, '');
        content = content.replace(/{{NUMLIST}}/g, '').replace(/{{\/NUMLIST}}/g, '');

        return content;
    }

    preserveCodeBlocks(content) {
        const codeBlockRegex = /```[\s\S]*?```/g;
        const codeBlocks = [];
        let index = 0;

        content = content.replace(codeBlockRegex, (match) => {
            codeBlocks.push(match);
            return `{{CODEBLOCK_${index++}}}`;
        });

        const inlineCodeRegex = /`[^`]+`/g;
        const inlineCodes = [];
        let inlineIndex = 0;

        content = content.replace(inlineCodeRegex, (match) => {
            inlineCodes.push(match);
            return `{{INLINECODE_${inlineIndex++}}}`;
        });

        content = content.replace(/\n{3,}/g, '\n\n');

        for (let i = 0; i < codeBlocks.length; i++) {
            content = content.replace(`{{CODEBLOCK_${i}}}`, codeBlocks[i]);
        }

        for (let i = 0; i < inlineCodes.length; i++) {
            content = content.replace(`{{INLINECODE_${i}}}`, inlineCodes[i]);
        }

        return content;
    }

    postProcessHTML(html) {
        if (!html) return '';

        const temp = document.createElement('div');
        temp.innerHTML = html;

        // Nettoyer les paragraphes vides
        temp.querySelectorAll('p').forEach(p => {
            if (!p.textContent.trim() && !p.querySelector('img')) {
                p.remove();
            } else {
                p.classList.add('formatted-paragraph');
            }
        });

        // Nettoyer les doubles <br>
        temp.innerHTML = temp.innerHTML.replace(/(<br\s*\/?>){2,}/gi, '<br>');

        // Améliorer les listes
        temp.querySelectorAll('ul, ol').forEach(list => {
            list.classList.add('formatted-list');
            list.querySelectorAll('li').forEach(li => {
                if (li.children.length === 1 && li.firstElementChild.tagName === 'P') {
                    li.innerHTML = li.firstElementChild.innerHTML;
                }
            });
        });

        // Améliorer les blocs de code
        temp.querySelectorAll('pre').forEach(pre => {
            pre.classList.add('formatted-code');
            if (pre.firstElementChild && pre.firstElementChild.tagName === 'CODE') {
                pre.firstElementChild.textContent = pre.firstElementChild.textContent.trim();
            }
        });

        let finalHTML = temp.innerHTML;
        finalHTML = finalHTML.replace(/>\s+</g, '><');
        finalHTML = finalHTML.replace(/<\/(p|div|blockquote|h[1-6])>/gi, '</$1>\n');
        finalHTML = finalHTML.replace(/<(p|div|blockquote|h[1-6])/gi, '\n<$1');
        finalHTML = finalHTML.replace(/\n{3,}/g, '\n\n');

        return finalHTML.trim();
    }

    finishStreaming(messageElement, content) {
        const messageDiv = messageElement.querySelector('.message');
        // Appliquer la coloration syntaxique après insertion complète
        messageDiv.querySelectorAll('pre code').forEach(block => {
            hljs.highlightElement(block);
        });

        // Enregistrer dans l'historique
        this.messageHistory.push({ content, isUser: false, isError: false, timestamp: new Date() });

        // Ajouter les actions pour les messages du bot
        const messageContent = messageElement.querySelector('.message-content');
        const actions = this.createMessageActions(content);
        messageContent.appendChild(actions);

        // Nettoyer les références de streaming
        this.currentStreamingMessage = null;
        if (this.streamingInterval) {
            clearTimeout(this.streamingInterval);
            this.streamingInterval = null;
        }

        this.scrollToBottom();
        this.markLastUserMessageAsRead();
        this.updateStatus('done', 'Terminé', 100);
        setTimeout(() => this.updateStatus('connected', 'Connecté'), 1500);
    }

    setProcessingState(processing) {
        this.isProcessing = processing;
        const messageInput = this.getMessageInput();
        const sendButton = document.getElementById('sendButton');
        
        if (messageInput) {
            messageInput.disabled = processing;
        }
        
        if (sendButton) {
            sendButton.disabled = processing;
            if (processing) {
                sendButton.classList.add('loading');
            } else {
                sendButton.classList.remove('loading');
            }
        }
        
        if (processing) {
            this.updateStatus('processing', 'Analyse en cours');
        }
    }

    addMessage(content, isUser = false, isError = false) {
        // Pour les messages utilisateur et d'erreur, pas de streaming
        const messageElement = this.createMessageElement(content, isUser, isError);

        // Actions et rendu Markdown pour les messages du bot (non-erreur)
        if (!isUser && !isError) {
            const messageDiv = messageElement.querySelector('.message');
            this.renderMarkdown(messageDiv, content);

            const messageContent = messageElement.querySelector('.message-content');
            const actions = this.createMessageActions(content);
            messageContent.appendChild(actions);
        }

        // Enregistrer dans l'historique
        this.messageHistory.push({ content, isUser, isError, timestamp: new Date() });
        if (!isUser && !isError) {
            this.markLastUserMessageAsRead();
        }

        this.scrollToBottom();
    }

    createMessageActions(content) {
        const actions = document.createElement('div');
        actions.className = 'message-actions';
        
        // Bouton Copier
        const copyBtn = document.createElement('button');
        copyBtn.className = 'action-btn';
        copyBtn.innerHTML = '📋 Copier';
        copyBtn.onclick = () => this.copyToClipboard(content);
        
        // Bouton Enregistrer
        const saveBtn = document.createElement('button');
        saveBtn.className = 'action-btn';
        saveBtn.innerHTML = '💾 Enregistrer';
        saveBtn.onclick = () => this.saveAsFile(content);
        
        // Bouton Email
        const emailBtn = document.createElement('button');
        emailBtn.className = 'action-btn';
        emailBtn.innerHTML = '📧 Email';
        emailBtn.onclick = () => this.sendByEmail(content);

        const feedback = document.createElement('div');
        feedback.className = 'message-feedback';
        const up = document.createElement('span');
        up.className = 'thumb thumb-up';
        up.textContent = '👍';
        up.onclick = () => {
            this.showToast('Merci pour votre retour!');
            this.launchConfetti();
            setTimeout(() => {
                this.addMessage(
                    "Nous serions ravis d'avoir votre avis sur [Trustpilot](https://fr.trustpilot.com/review/symplissime.fr)",
                    false
                );
            }, 500);
        };
        const down = document.createElement('span');
        down.className = 'thumb thumb-down';
        down.textContent = '👎';
        down.onclick = () => {
            this.showToast('Merci pour votre retour!');
            setTimeout(() => {
                this.addMessage(
                    'Comment pouvons-nous améliorer cette réponse ?',
                    false
                );
            }, 500);
        };
        feedback.appendChild(up);
        feedback.appendChild(down);

        actions.appendChild(copyBtn);
        actions.appendChild(saveBtn);
        actions.appendChild(emailBtn);
        actions.appendChild(feedback);

        return actions;
    }

    launchConfetti() {
        const container = document.createElement('div');
        container.className = 'confetti-container';
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = `hsl(${Math.random() * 360},100%,50%)`;
            confetti.style.animationDelay = Math.random() * 3 + 's';
            container.appendChild(confetti);
        }
        document.body.appendChild(container);
        setTimeout(() => container.remove(), 5000);
    }

    darkFlip() {
        const original = this.currentTheme;
        const target = original === 'dark' ? 'symplissime' : 'dark';
        this.applyTheme(target);
        this.showToast(target === 'dark' ? '🌙 Mode secret activé' : '☀️ Retour à la normale');
        setTimeout(() => {
            this.applyTheme(original);
            this.showToast(original === 'dark' ? '🌙 Mode secret activé' : '☀️ Retour à la normale');
        }, 5000);
    }

    showFortune() {
        const fortunes = [
            'Une sauvegarde réussie illumine ta journée.',
            'Chaque bug est une chance de briller.',
            'Un redémarrage bien placé vaut mille correctifs.',
            'La patience est la meilleure optimisation.',
            'Les logs conduisent à la sagesse.'
        ];
        const fortune = fortunes[Math.floor(Math.random() * fortunes.length)];
        this.addMessage(`(Easter Egg) ${fortune}`, false);
    }

    launchMatrix() {
        const container = document.createElement('div');
        container.className = 'matrix-container';
        
        // Version optimisée avec Canvas pour de meilleures performances
        const canvas = document.createElement('canvas');
        canvas.className = 'matrix-canvas';
        container.appendChild(canvas);
        document.body.appendChild(container);
        
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Configuration Matrix
        const matrix = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%+-/~{[|`]}01";
        const matrixArray = matrix.split("");
        const fontSize = 14;
        const columns = canvas.width / fontSize;
        
        // Tableau pour stocker la position Y de chaque colonne
        const drops = [];
        for(let x = 0; x < columns; x++) {
            drops[x] = Math.random() * -100;
        }
        
        // Fonction de dessin
        let animationId;
        const draw = () => {
            // Effet de traînée avec fond semi-transparent
            ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#0F0';
            ctx.font = fontSize + 'px monospace';
            
            // Dessiner les caractères
            for(let i = 0; i < drops.length; i++) {
                // Caractère aléatoire
                const text = matrixArray[Math.floor(Math.random() * matrixArray.length)];
                
                // Position x et y
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                
                // Réinitialiser la colonne qui atteint le bas
                if(drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                
                // Faire tomber le caractère
                drops[i]++;
            }
            
            animationId = requestAnimationFrame(draw);
        };
        
        // Démarrer l'animation
        draw();
        
        // Nettoyer après 8 secondes
        setTimeout(() => {
            cancelAnimationFrame(animationId);
            container.remove();
        }, 8000);
        
        // Gérer le redimensionnement
        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);
        
        // Nettoyer l'event listener à la fin
        setTimeout(() => {
            window.removeEventListener('resize', handleResize);
        }, 8000);
    }

    launchMatrixFallback() {
        const container = document.createElement('div');
        container.className = 'matrix-container fallback';
        
        // Version allégée avec moins d'éléments DOM
        const columns = Math.floor(window.innerWidth / 20);
        const chars = '01';
        
        for (let i = 0; i < columns; i++) {
            const column = document.createElement('div');
            column.className = 'matrix-column';
            column.style.left = (i * 20) + 'px';
            column.style.animationDuration = (3 + Math.random() * 4) + 's';
            column.style.animationDelay = Math.random() * 2 + 's';
            
            // Générer une colonne de caractères
            let text = '';
            for (let j = 0; j < 30; j++) {
                text += chars[Math.floor(Math.random() * chars.length)] + '\n';
            }
            column.textContent = text;
            
            container.appendChild(column);
        }
        
        document.body.appendChild(container);
        setTimeout(() => container.remove(), 8000);
    }
    cameleonMode() {
        const container = document.getElementById('chatContainer');
        if (!container) return;
        container.classList.add('cameleon-mode');
        const mascot = document.createElement('div');
        mascot.className = 'cameleon-mascot';
        mascot.textContent = '🦎';
        container.appendChild(mascot);
        setTimeout(() => {
            container.classList.remove('cameleon-mode');
            mascot.remove();
        }, 10000);
    }

    showTyping() {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        // Supprimer l'indicateur existant s'il y en a un
        this.hideTyping();

        const wrapper = document.createElement('div');
        wrapper.className = 'message-wrapper';
        wrapper.id = 'typingIndicator';
        
        const avatar = document.createElement('div');
        avatar.className = 'avatar bot';
        avatar.textContent = 'AI';
        
        const typing = document.createElement('div');
        typing.className = 'typing-indicator';
        typing.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
        
        wrapper.appendChild(avatar);
        wrapper.appendChild(typing);
        chatMessages.appendChild(wrapper);
        
        this.scrollToBottom();
    }

    hideTyping() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }

    showWelcomeMessage() {
        const welcomeMessage = `👋 Bonjour ! Je suis Symplissime AI, votre assistant intelligent pour le support Windows et plus encore.

🎯 Je peux vous aider avec :
• 🖥️ Support technique Windows (dépannage, configuration, optimisation)
• 🔧 Résolution de problèmes système et applications
• 📚 Documentation et guides techniques
• 🛠️ Automatisation et scripts PowerShell
• 🔍 Diagnostics et analyses de performance
• 🛡️ Sécurité et mises à jour système
• 📋 Procédures et bonnes pratiques IT

Comment puis-je vous assister aujourd'hui dans votre support technique ?`;

        setTimeout(async () => {
            await this.streamMessage(welcomeMessage);
        }, 1000);
    }
    updateStatus(state, message = null, progress = null) {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        const statusProgress = document.getElementById('statusProgress');

        if (!statusDot || !statusText || !statusProgress) return;

        statusDot.className = 'status-dot';
        switch (state) {
            case 'connected':
                statusText.textContent = message || 'Connecté';
                break;
            case 'processing':
                statusDot.classList.add('processing');
                statusText.textContent = message || 'Analyse en cours';
                break;
            case 'error':
                statusDot.classList.add('error');
                statusText.textContent = message || 'Erreur';
                break;
            case 'done':
                statusDot.classList.add('done');
                statusText.textContent = message || 'Terminé';
                break;
            default:
                statusText.textContent = message || '';
        }

        statusProgress.textContent = progress != null ? ` ${progress}%` : '';
    }

    scrollToBottom() {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            setTimeout(() => {
                chatMessages.scrollTop = chatMessages.scrollHeight;
                this.updateScrollIndicator();
            }, 50);
        }
    }

    updateScrollIndicator() {
        const chatMessages = document.getElementById('chatMessages');
        const progress = document.getElementById('scrollProgress');
        if (!chatMessages || !progress) return;
        const { scrollTop, scrollHeight, clientHeight } = chatMessages;
        const percent = scrollHeight > clientHeight ? (scrollTop / (scrollHeight - clientHeight)) * 100 : 0;
        progress.style.width = `${percent}%`;
    }

    markLastUserMessageAsRead() {
        const userMessages = document.querySelectorAll('.message-wrapper.user');
        const lastUserMessage = userMessages[userMessages.length - 1];
        if (lastUserMessage) {
            const readStatus = lastUserMessage.querySelector('.read-status');
            if (readStatus) {
                readStatus.textContent = 'Vu';
            }
        }
    }

    focusInput() {
        const messageInput = this.getMessageInput();
        if (messageInput && !messageInput.disabled) {
            messageInput.focus();
        }
    }

    getMessageInput() {
        return document.getElementById('messageInput');
    }

    // Méthodes utilitaires
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Copié dans le presse-papiers !', 'success');
        } catch (err) {
            console.error('Erreur de copie:', err);
            this.showToast('Échec de la copie', 'error');
        }
    }

    saveAsFile(text, filename = null) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const defaultFilename = `symplissimeai-${timestamp}.txt`;
        
        try {
            const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || defaultFilename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            this.showToast('Fichier enregistré !', 'success');
        } catch (err) {
            console.error('Erreur de sauvegarde:', err);
            this.showToast('Erreur lors de la sauvegarde', 'error');
        }
    }

    sendByEmail(text) {
        try {
            const subject = encodeURIComponent('Support Symplissime AI');
            const body = encodeURIComponent(text);
            const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
            window.location.href = mailtoLink;
            this.showToast('Ouverture du client mail...', 'success');
        } catch (err) {
            console.error('Erreur email:', err);
            this.showToast('Erreur lors de l\'ouverture du mail', 'error');
        }
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        if (!toast) return;

        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Contrôles de police
    increaseFontSize() {
        if (this.fontScale < 1.5) {
            this.fontScale += 0.1;
            this.updateFontScale();
            this.showToast('Taille du texte augmentée', 'success');
        } else {
            this.showToast('Taille maximale atteinte', 'warning');
        }
    }

    decreaseFontSize() {
        if (this.fontScale > 0.7) {
            this.fontScale -= 0.1;
            this.updateFontScale();
            this.showToast('Taille du texte réduite', 'success');
        } else {
            this.showToast('Taille minimale atteinte', 'warning');
        }
    }

    updateFontScale() {
        document.documentElement.style.setProperty('--font-scale', this.fontScale);
        localStorage.setItem('symplissime_fontScale', this.fontScale);
        
        // Animation de feedback visuel
        document.body.style.transform = 'scale(1.01)';
        setTimeout(() => {
            document.body.style.transform = '';
        }, 150);
    }

    // Méthode pour exporter tout l'historique
    exportChatHistory() {
        if (this.messageHistory.length <= 1) {
            this.showToast('Aucun historique à exporter', 'warning');
            return;
        }

        const history = this.messageHistory
            .filter(msg => !msg.isError)
            .map(msg => {
                const sender = msg.isUser ? 'Utilisateur' : 'Symplissime AI';
                const timestamp = msg.timestamp.toLocaleString('fr-FR');
                return `[${timestamp}] ${sender}:\n${msg.content}\n`;
            })
            .join('\n---\n\n');

        const header = `Historique de conversation - Symplissime AI
Support technique Windows et IT
Généré le: ${new Date().toLocaleString('fr-FR')}

===================================================

`;

        this.saveAsFile(header + history, `historique-symplissimeai-${new Date().toISOString().slice(0, 10)}.txt`);
    }

    // Méthode pour vider l'historique
    clearHistory() {
        if (confirm('Êtes-vous sûr de vouloir effacer l\'historique de conversation ?')) {
            // Arrêter tout streaming en cours
            if (this.streamingInterval) {
                clearTimeout(this.streamingInterval);
                this.streamingInterval = null;
            }
            
            const chatMessages = document.getElementById('chatMessages');
            if (chatMessages) {
                chatMessages.querySelectorAll('.message-wrapper').forEach(msg => msg.classList.add('fade-out'));
                setTimeout(() => {
                    chatMessages.innerHTML = '';
                    this.showWelcomeMessage();
                }, 300);
            }
            this.messageHistory = [];
            this.showToast('Historique effacé', 'success');
        }
    }
}

// Initialisation de l'application
let symplissimeApp;

document.addEventListener('DOMContentLoaded', function() {
    symplissimeApp = new SymplissimeAIApp();
});

// Exposition globale pour les boutons HTML
window.symplissimeApp = {
    increaseFontSize: () => symplissimeApp?.increaseFontSize(),
    decreaseFontSize: () => symplissimeApp?.decreaseFontSize(),
    toggleTheme: () => symplissimeApp?.toggleTheme(),
    toggleFont: () => symplissimeApp?.toggleFont(),
    exportHistory: () => symplissimeApp?.exportChatHistory(),
    clearHistory: () => symplissimeApp?.clearHistory()
};
