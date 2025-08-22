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
        this.fontScale = 1;
        this.isProcessing = false;
        this.messageHistory = [];
        this.currentStreamingMessage = null;
        this.streamingInterval = null;
        this.currentTheme = 'symplissime';
        this.uploadApiUrl = 'http://storage.symplissime.fr:3003/api/v1/document/upload';
        
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
        
        this.init();
    }

    init() {
        if (window.marked) {
            marked.setOptions({ breaks: true });
        }

        this.loadSavedPreferences();
        this.loadPromptSuggestions();
        this.bindEvents();
        this.updateDateTime();
        this.updateStatus('connected', 'Connecté');
        this.showWelcomeMessage();
        this.focusInput();
        this.createThemeSelector();
        
        // Mise à jour de l'heure chaque seconde
        setInterval(() => this.updateDateTime(), 1000);
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
        // Cette méthode est maintenant remplacée par le sélecteur de thèmes
        this.toggleThemeDropdown();
    }

    bindEvents() {
        // Événement de soumission du formulaire
        const chatForm = document.getElementById('chatForm');
        if (chatForm) {
            chatForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        const fileButton = document.getElementById('fileButton');
        const fileInput = document.getElementById('fileInput');
        if (fileButton && fileInput) {
            fileButton.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        }

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

    async handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!this.config.API_KEY) {
            // Éviter les appels inutiles si la clé API n'est pas configurée
            this.addMessage('Clé API requise pour l\'upload de fichiers.', false, true);
            this.updateStatus('error', 'Clé API manquante');
            e.target.value = '';
            return;
        }

        const formData = new FormData();
        formData.append('document', file);
        formData.append('workspace', this.config.WORKSPACE);
        formData.append('user', this.config.USER);
        formData.append('apiKey', this.config.API_KEY);

        this.updateStatus('processing', 'Upload du fichier', 0);

        try {
            // Inclure la clé API dans l'en-tête pour l'authentification côté serveur
            const headers = {
                'Authorization': `Bearer ${this.config.API_KEY}`
            };

            const response = await fetch(this.uploadApiUrl, {
                method: 'POST',
                body: formData,
                headers
            });

            const responseBody = await response.text();
            console.log('Upload response body:', responseBody);

            if (response.status === 403) {
                this.addMessage('Accès refusé : clé API manquante ou invalide.', false, true);
                this.updateStatus('error', 'Clé API invalide');
                return;
            }

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            let data = {};
            try {
                data = JSON.parse(responseBody);
            } catch (e) {}
            const docId = data.documentId || data.id || '';
            const info = docId
                ? `📄 Fichier ${file.name} téléchargé (ID: ${docId})`
                : `📄 Fichier ${file.name} téléchargé`;
            this.addMessage(info, false);
            this.updateStatus('done', 'Upload terminé', 100);
        } catch (err) {
            console.error('Erreur upload:', err);
            this.addMessage("Erreur lors de l'upload du fichier", false, true);
            this.updateStatus('error', 'Erreur upload fichier');
        } finally {
            setTimeout(() => this.updateStatus('connected', 'Connecté'), 1500);
            e.target.value = '';
        }
    }

    analyzeTextFile(content, file) {
        const lines = content.split(/\r?\n/);
        const errors = lines.filter(l => /error/i.test(l)).length;
        const warnings = lines.filter(l => /warn/i.test(l)).length;
        let severity = 'Faible';
        if (errors > 0) severity = 'Élevée';
        else if (warnings > 0) severity = 'Moyenne';
        const actions = errors > 0
            ? 'Corriger les erreurs détectées'
            : warnings > 0
                ? 'Vérifier les avertissements'
                : 'Aucune action critique';
        return `📄 Analyse de ${file.name}\n• Taille : ${this.formatFileSize(file.size)}\n• Lignes : ${lines.length}\n• Erreurs : ${errors}\n• Avertissements : ${warnings}\n• Gravité : ${severity}\n• Actions : ${actions}`;
    }

    formatFileSize(bytes) {
        const units = ['octets', 'Ko', 'Mo', 'Go'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }

    async streamMessage(content) {
        // Créer la structure du message
        const messageElement = this.createMessageElement('', false, false);
        const messageContentDiv = messageElement.querySelector('.message');

        // Convertir le contenu en HTML sécurisé avant le streaming
        const html = DOMPurify.sanitize(marked.parse(content));

        // Variables pour le streaming caractère par caractère
        const totalChars = html.length;
        let currentIndex = 0;

        const streamNextChar = () => {
            if (currentIndex < totalChars) {
                messageContentDiv.innerHTML = html.slice(0, currentIndex + 1);
                this.scrollToBottom();
                currentIndex++;
                const progress = Math.round((currentIndex / totalChars) * 100);
                this.updateStatus('processing', 'Réponse en cours', progress);
                // Vitesse de streaming rapide par caractère
                this.streamingInterval = setTimeout(streamNextChar, 5);
            } else {
                // Streaming terminé
                this.finishStreaming(messageElement, content);
            }
        };

        // Démarrer le streaming
        streamNextChar();
    }

    createMessageElement(content, isUser = false, isError = false) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return null;

        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper ${isUser ? 'user' : 'bot'}`;
        
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
    updateDateTime() {
        const datetimeElement = document.getElementById('datetime');
        if (!datetimeElement) return;

        const now = new Date();
        const year = now.getUTCFullYear();
        const month = String(now.getUTCMonth() + 1).padStart(2, '0');
        const day = String(now.getUTCDate()).padStart(2, '0');
        const hours = String(now.getUTCHours()).padStart(2, '0');
        const minutes = String(now.getUTCMinutes()).padStart(2, '0');
        const seconds = String(now.getUTCSeconds()).padStart(2, '0');
        
        datetimeElement.textContent = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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
        const defaultFilename = `symplissime-ai-${timestamp}.txt`;
        
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

    toggleTheme() {
        this.showToast('Thème Symplissime actif', 'success');
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

        this.saveAsFile(header + history, `historique-symplissime-ai-${new Date().toISOString().slice(0, 10)}.txt`);
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
                chatMessages.innerHTML = '';
            }
            this.messageHistory = [];
            this.showWelcomeMessage();
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
    exportHistory: () => symplissimeApp?.exportChatHistory(),
    clearHistory: () => symplissimeApp?.clearHistory()
};
