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
        this.fontScale = 1.1;
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
    }

    loadSavedPreferences() {
        const savedFontScale = localStorage.getItem('symplissime_fontScale');
        if (savedFontScale) {
            this.fontScale = parseFloat(savedFontScale);
            document.documentElement.style.setProperty('--font-scale', this.fontScale);
        }
        
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
        document.body.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
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

    bindEvents() {
        // Événement de soumission du formulaire
        const chatForm = document.getElementById('chatForm');
        if (chatForm) {
            chatForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Animations des boutons
        document.querySelectorAll('.control-btn, .send-button').forEach(btn => {
            btn.addEventListener('click', () => {
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

        messageInput.value = '';
        this.addPromptSuggestion(message);
        await this.sendMessage(message);
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

        // Convertir le contenu en HTML sécurisé avant le streaming
        const html = DOMPurify.sanitize(marked.parse(content));

        // Variables pour le streaming par blocs
        const totalChars = html.length;
        let currentIndex = 0;
        const chunkSize = 10; // nombre de caractères affichés à chaque tick

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
        
        messageContent.appendChild(message);
        wrapper.appendChild(avatar);
        wrapper.appendChild(messageContent);
        chatMessages.appendChild(wrapper);
        
        this.scrollToBottom();
        
        return wrapper;
    }

    renderMarkdown(element, content) {
        if (!element) return;
        const html = DOMPurify.sanitize(marked.parse(content));
        element.innerHTML = html;
        element.querySelectorAll('pre code').forEach(block => {
            hljs.highlightElement(block);
        });
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
        
        actions.appendChild(copyBtn);
        actions.appendChild(saveBtn);
        actions.appendChild(emailBtn);
        
        return actions;
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
            }, 50);
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
