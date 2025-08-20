/**
 * Conseiller RGPD IA - Application JavaScript
 * Powered by Symplissime AI
 */

class ConseillerRGPDApp {
    constructor() {
        this.config = window.RGPD_CONFIG || {};
        this.fontScale = 1;
        this.isProcessing = false;
        this.messageHistory = [];
        
        this.init();
    }

    init() {
        this.loadSavedPreferences();
        this.bindEvents();
        this.updateDateTime();
        this.showWelcomeMessage();
        this.focusInput();
        
        // Mise à jour de l'heure chaque seconde
        setInterval(() => this.updateDateTime(), 1000);
    }

    loadSavedPreferences() {
        const savedFontScale = localStorage.getItem('rgpd_fontScale');
        if (savedFontScale) {
            this.fontScale = parseFloat(savedFontScale);
            document.documentElement.style.setProperty('--font-scale', this.fontScale);
        }
    }

    bindEvents() {
        // Événement de soumission du formulaire
        const chatForm = document.getElementById('chatForm');
        if (chatForm) {
            chatForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
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
                this.updateStatus(false, 'Erreur');
                this.showToast('Erreur lors de la communication', 'error');
            } else if (data.success && data.message) {
                this.addMessage(data.message, false, false);
                this.updateStatus(true, 'Connecté');
            } else {
                this.addMessage('Aucune réponse reçue du serveur', false, true);
                this.updateStatus(false, 'Pas de réponse');
            }
        } catch (error) {
            console.error('Erreur de communication:', error);
            this.hideTyping();
            this.addMessage(`Erreur de connexion : ${error.message}`, false, true);
            this.updateStatus(false, 'Erreur connexion');
            this.showToast('Problème de connexion', 'error');
        } finally {
            this.setProcessingState(false);
        }
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
        
        this.updateStatus(processing ? null : true, processing ? 'Traitement...' : 'Connecté');
    }

    addMessage(content, isUser = false, isError = false) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper ${isUser ? 'user' : 'bot'}`;
        
        const avatar = document.createElement('div');
        avatar.className = `avatar ${isUser ? 'user' : 'bot'}`;
        avatar.textContent = isUser ? 'U' : 'R';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const message = document.createElement('div');
        message.className = `message ${isUser ? 'user' : 'bot'} ${isError ? 'error' : ''}`;
        
        // Sécurisation du contenu
        message.textContent = content;
        
        messageContent.appendChild(message);
        
        // Actions pour les messages du bot (non-erreur)
        if (!isUser && !isError) {
            const actions = this.createMessageActions(content);
            messageContent.appendChild(actions);
        }
        
        wrapper.appendChild(avatar);
        wrapper.appendChild(messageContent);
        chatMessages.appendChild(wrapper);
        
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
        avatar.textContent = 'R';
        
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
        const welcomeMessage = `👋 Bonjour ! Je suis votre Conseiller RGPD IA powered by Symplissime AI. Je peux vous accompagner sur tous les aspects de la protection des données :

• 📋 Conformité RGPD et réglementations européennes
• 🔒 Protection et sécurisation des données personnelles  
• 📝 Rédaction de politiques de confidentialité et mentions légales
• ⚖️ Droits des personnes concernées (accès, rectification, effacement...)
• 🛡️ Mesures de sécurité techniques et organisationnelles
• 📊 Analyses d'impact relatives à la protection des données (AIPD)
• 🏢 Mise en conformité des entreprises et organisations
• 📞 Gestion des violations de données et notifications CNIL

Comment puis-je vous accompagner dans votre démarche de conformité RGPD aujourd'hui ?`;

        setTimeout(() => {
            this.addMessage(welcomeMessage, false);
            this.updateStatus(true, 'Connecté');
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

    updateStatus(connected, text = null) {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        
        if (!statusDot || !statusText) return;

        if (connected === true) {
            statusDot.classList.remove('error');
            statusText.textContent = text || 'Connecté';
        } else if (connected === false) {
            statusDot.classList.add('error');
            statusText.textContent = text || 'Erreur';
        } else {
            // État neutre (en cours de traitement)
            statusText.textContent = text || 'En cours...';
        }
    }

    scrollToBottom() {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            requestAnimationFrame(() => {
                chatMessages.lastElementChild?.scrollIntoView({ behavior: 'smooth' });
            });
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
        const defaultFilename = `conseil-rgpd-${timestamp}.txt`;
        
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
            const subject = encodeURIComponent('Conseil RGPD - IA Symplissime');
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
        localStorage.setItem('rgpd_fontScale', this.fontScale);
    }

    toggleTheme() {
        // Pour l'instant, on garde le thème sombre optimisé pour RGPD
        this.showToast('Thème sombre optimisé pour RGPD', 'success');
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
                const sender = msg.isUser ? 'Utilisateur' : 'Conseiller RGPD IA';
                const timestamp = msg.timestamp.toLocaleString('fr-FR');
                return `[${timestamp}] ${sender}:\n${msg.content}\n`;
            })
            .join('\n---\n\n');

        const header = `Historique de conversation - Conseiller RGPD IA
Powered by Symplissime AI
Généré le: ${new Date().toLocaleString('fr-FR')}

===================================================

`;

        this.saveAsFile(header + history, `historique-rgpd-${new Date().toISOString().slice(0, 10)}.txt`);
    }

    // Méthode pour vider l'historique
    clearHistory() {
        if (confirm('Êtes-vous sûr de vouloir effacer l\'historique de conversation ?')) {
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
let rgpdApp;

document.addEventListener('DOMContentLoaded', function() {
    rgpdApp = new ConseillerRGPDApp();
});

// Exposition globale pour les boutons HTML
window.rgpdApp = {
    increaseFontSize: () => rgpdApp?.increaseFontSize(),
    decreaseFontSize: () => rgpdApp?.decreaseFontSize(),
    toggleTheme: () => rgpdApp?.toggleTheme(),
    exportHistory: () => rgpdApp?.exportChatHistory(),
    clearHistory: () => rgpdApp?.clearHistory()
};