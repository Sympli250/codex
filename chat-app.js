// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const datetime = document.getElementById('datetime');
const toast = document.getElementById('toast');
const helpPanel = document.getElementById('helpPanel');
const themeToggle = document.getElementById('themeToggle');
const themeDropdown = document.getElementById('themeDropdown');

// Speech synthesis
let speechSynthesis = window.speechSynthesis;
let currentUtterance = null;

// Font size control
let fontScale = 1;

// Functions declarations
function toggleHelpPanel() {
    helpPanel.classList.toggle('collapsed');
}

function askHelp(question) {
    console.log('askHelp appelé avec:', question);
    messageInput.value = question;
    toggleHelpPanel();
    // Déclencher l'envoi du formulaire via l'événement de soumission
    chatForm.dispatchEvent(new Event('submit', { cancelable: true }));
}

function toggleThemeDropdown() {
    themeDropdown.classList.toggle('show');
}

function changeColorTheme(theme) {
    if (theme === 'default') {
        document.body.removeAttribute('data-theme');
    } else {
        document.body.setAttribute('data-theme', theme);
    }
    
    document.querySelectorAll('.theme-option').forEach(option => {
        option.classList.toggle('active', option.getAttribute('data-theme') === theme);
    });
    
    localStorage.setItem('colorTheme', theme);
    showToast('Thème de couleur changé !', 'success');
    themeDropdown.classList.remove('show');
}

function toggleTheme() {
    const body = document.body;
    if (body.classList.contains('light-theme')) {
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
        themeToggle.textContent = '🌙';
        localStorage.setItem('theme', 'dark');
    } else {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
        themeToggle.textContent = '☀️';
        localStorage.setItem('theme', 'light');
    }
    showToast('Thème changé !', 'success');
}

function increaseFontSize() {
    if (fontScale < 1.5) {
        fontScale += 0.1;
        document.documentElement.style.setProperty('--font-scale', fontScale);
        localStorage.setItem('fontScale', fontScale);
        showToast('Taille du texte augmentée', 'success');
    }
}

function decreaseFontSize() {
    if (fontScale > 0.7) {
        fontScale -= 0.1;
        document.documentElement.style.setProperty('--font-scale', fontScale);
        localStorage.setItem('fontScale', fontScale);
        showToast('Taille du texte réduite', 'success');
    }
}

function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function updateDateTime() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');
    
    datetime.textContent = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Copié dans le presse-papiers !', 'success');
    } catch (err) {
        showToast('Échec de la copie', 'error');
    }
}

function saveAsFile(text, filename = 'symplissime-ia-reponse.txt') {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Fichier enregistré !', 'success');
}

function sendByEmail(text) {
    const subject = 'Réponse Support Technique Symplissime';
    const body = encodeURIComponent(text);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    showToast('Ouverture du client mail...', 'success');
}

function speakText(text) {
    if (currentUtterance) {
        speechSynthesis.cancel();
    }
    
    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.lang = 'fr-FR';
    currentUtterance.rate = 1.0;
    currentUtterance.pitch = 1.0;
    
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
        voice.lang === 'fr-FR' && voice.name.includes('Microsoft')
    ) || voices.find(voice => voice.lang === 'fr-FR');
    
    if (preferredVoice) {
        currentUtterance.voice = preferredVoice;
    }
    
    currentUtterance.onend = () => {
        showToast('Lecture terminée', 'success');
        currentUtterance = null;
    };
    
    speechSynthesis.speak(currentUtterance);
    showToast('Lecture en cours...', 'success');
}

function updateStatus(connected, text = null) {
    if (connected) {
        statusDot.classList.remove('error');
        statusText.textContent = text || 'Connecté';
    } else {
        statusDot.classList.add('error');
        statusText.textContent = text || 'Erreur';
    }
}

function scrollToBottom() {
    setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 100);
}

function addMessage(content, isUser = false, isError = false, id = null) {
    const wrapper = document.createElement('div');
    wrapper.className = `message-wrapper ${isUser ? 'user' : 'bot'}`;
    if (id) {
        wrapper.dataset.id = id;
    }
    
    const avatar = document.createElement('div');
    avatar.className = `avatar ${isUser ? 'user' : 'bot'}`;
    avatar.textContent = isUser ? 'S' : 'IA';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    const message = document.createElement('div');
    message.className = `message ${isUser ? 'user' : 'bot'} ${isError ? 'error' : ''}`;
    message.textContent = content;
    
    messageContent.appendChild(message);

    if (isUser) {
        const actions = document.createElement('div');
        actions.className = 'message-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'action-btn';
        editBtn.textContent = 'Éditer';
        editBtn.onclick = () => editUserMessage(wrapper, message);

        const historyBtn = document.createElement('button');
        historyBtn.className = 'action-btn';
        historyBtn.textContent = 'Historique';
        historyBtn.onclick = () => showHistory(wrapper, message);

        actions.appendChild(editBtn);
        actions.appendChild(historyBtn);
        messageContent.appendChild(actions);
    } else if (!isError) {
        const actions = document.createElement('div');
        actions.className = 'message-actions';
        
        const copyBtn = document.createElement('button');
        copyBtn.className = 'action-btn';
        copyBtn.innerHTML = `
            <svg fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/>
            </svg>
            Copier
        `;
        copyBtn.onclick = () => copyToClipboard(content);
        
        const saveBtn = document.createElement('button');
        saveBtn.className = 'action-btn';
        saveBtn.innerHTML = `
            <svg fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"/>
            </svg>
            Enregistrer
        `;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        saveBtn.onclick = () => saveAsFile(content, `symplissime-support-${timestamp}.txt`);
        
        const emailBtn = document.createElement('button');
        emailBtn.className = 'action-btn';
        emailBtn.innerHTML = `
            <svg fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
            </svg>
            Email
        `;
        emailBtn.onclick = () => sendByEmail(content);
        
        const speakBtn = document.createElement('button');
        speakBtn.className = 'action-btn';
        speakBtn.innerHTML = `
            <svg fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"/>
            </svg>
            Lire
        `;
        speakBtn.onclick = () => speakText(content);
        
        actions.appendChild(copyBtn);
        actions.appendChild(saveBtn);
        actions.appendChild(emailBtn);
        actions.appendChild(speakBtn);
        
        messageContent.appendChild(actions);
    }
    
    wrapper.appendChild(avatar);
    wrapper.appendChild(messageContent);
    chatMessages.appendChild(wrapper);
    
    scrollToBottom();
}

async function editUserMessage(wrapper, messageEl) {
    const current = messageEl.textContent;
    const updated = prompt('Modifier le message :', current);
    if (updated && updated !== current) {
        messageEl.textContent = updated;
        const formData = new FormData();
        formData.append('action', 'edit');
        formData.append('messageId', wrapper.dataset.id);
        formData.append('newMessage', updated);
        try {
            await fetch('chatv2.php', { method: 'POST', body: formData });
            showToast('Message modifié', 'success');
        } catch (err) {
            showToast('Erreur lors de la modification', 'error');
        }
    }
}

async function showHistory(wrapper, messageEl) {
    const formData = new FormData();
    formData.append('action', 'history');
    formData.append('messageId', wrapper.dataset.id);
    try {
        const response = await fetch('chatv2.php', { method: 'POST', body: formData });
        const data = await response.json();
        if (!data.success || !data.revisions || data.revisions.length === 0) {
            showToast('Aucune révision', 'error');
            return;
        }
        const list = data.revisions
            .map((rev, i) => `${i + 1}. ${rev}`)
            .join('\n');
        const choice = prompt(`Historique des révisions:\n${list}\nNuméro à restaurer :`);
        const index = parseInt(choice) - 1;
        if (!isNaN(index) && data.revisions[index]) {
            const restoreData = new FormData();
            restoreData.append('action', 'restore');
            restoreData.append('messageId', wrapper.dataset.id);
            restoreData.append('index', index);
            const restoreResp = await fetch('chatv2.php', { method: 'POST', body: restoreData });
            const restoreJson = await restoreResp.json();
            if (restoreJson.success && restoreJson.message) {
                messageEl.textContent = restoreJson.message;
                showToast('Révision restaurée', 'success');
            } else {
                showToast('Échec de la restauration', 'error');
            }
        }
    } catch (err) {
        showToast('Erreur lors de la récupération', 'error');
    }
}

function showTyping() {
    const wrapper = document.createElement('div');
    wrapper.className = 'message-wrapper';
    wrapper.id = 'typingIndicator';
    
    const avatar = document.createElement('div');
    avatar.className = 'avatar bot';
    avatar.textContent = 'IA';
    
    const typing = document.createElement('div');
    typing.className = 'typing-indicator';
    typing.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    
    wrapper.appendChild(avatar);
    wrapper.appendChild(typing);
    chatMessages.appendChild(wrapper);
    
    scrollToBottom();
}

function hideTyping() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}

async function sendMessage(message) {
    console.log('Envoi du message:', message);

    const messageId = `msg-${Date.now()}`;
    addMessage(message, true, false, messageId);
    showTyping();
    
    messageInput.disabled = true;
    sendButton.disabled = true;
    updateStatus(true, 'Traitement...');
    
    try {
        const formData = new FormData();
        formData.append('action', 'chat');
        formData.append('message', message);
        formData.append('workspace', WORKSPACE);
        formData.append('messageId', messageId);
        
        const response = await fetch('chatv2.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        hideTyping();
        
        if (data.error) {
            addMessage(`Erreur : ${data.error}`, false, true);
            updateStatus(false, 'Erreur');
        } else if (data.success && data.message) {
            addMessage(data.message, false, false);
            updateStatus(true, 'Connecté');
        } else {
            addMessage('Aucune réponse reçue', false, true);
            updateStatus(false, 'Pas de réponse');
        }
    } catch (error) {
        hideTyping();
        addMessage(`Erreur de connexion : ${error.message}`, false, true);
        updateStatus(false, 'Erreur connexion');
    } finally {
        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.focus();
    }
}

// Event listeners
document.addEventListener('click', (e) => {
    if (!e.target.closest('.theme-selector')) {
        themeDropdown.classList.remove('show');
    }
});

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    if (!message) return;
    
    messageInput.value = '';
    await sendMessage(message);
});

// Initialize on load
window.addEventListener('load', () => {
    console.log('Page chargée - Initialisation...');
    
    // Load saved preferences
    const savedColorTheme = localStorage.getItem('colorTheme');
    if (savedColorTheme && savedColorTheme !== 'default') {
        document.body.setAttribute('data-theme', savedColorTheme);
        const activeOption = document.querySelector(`[data-theme="${savedColorTheme}"]`);
        if (activeOption) {
            activeOption.classList.add('active');
            document.querySelector('[data-theme="default"]')?.classList.remove('active');
        }
    }
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        themeToggle.textContent = '☀️';
    }
    
    const savedFontScale = localStorage.getItem('fontScale');
    if (savedFontScale) {
        fontScale = parseFloat(savedFontScale);
        document.documentElement.style.setProperty('--font-scale', fontScale);
    }
    
    // Load voices for speech synthesis
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => {
            console.log('Voix chargées');
        };
    }
    
    // Welcome message
    addMessage('Bienvenue sur le support technique Symplissime. Je suis votre assistant IA spécialisé. Comment puis-je vous aider aujourd\'hui ?', false);
    updateStatus(true, 'Connecté');
    messageInput.focus();
    
    // Configuration des boutons d'aide - MÉTHODE DIRECTE
    setTimeout(() => {
        console.log('Configuration des boutons d\'aide...');
        
        // Méthode 1: onclick direct
        const helpButtons = document.querySelectorAll('.help-category-btn');
        console.log('Boutons trouvés:', helpButtons.length);
        
        helpButtons.forEach((button, index) => {
            const question = button.getAttribute('data-question');
            if (question) {
                console.log(`Configuration bouton ${index + 1}:`, question);
                
                // Supprimer tous les anciens event listeners
                const newButton = button.cloneNode(true);
                button.parentNode.replaceChild(newButton, button);
                
                // Ajouter le nouveau onclick
                newButton.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('CLIC détecté sur:', question);
                    askHelp(question);
                };
            }
        });
        
        console.log('Configuration terminée');
    }, 500);
});

// Update datetime every second
setInterval(updateDateTime, 1000);
updateDateTime();

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Press "/" to focus input
    if (e.key === '/' && document.activeElement !== messageInput) {
        e.preventDefault();
        messageInput.focus();
    }
    
    // Press "Ctrl+H" to toggle Help panel
    if (e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        toggleHelpPanel();
    }
    
    // Press "Escape" to stop speech
    if (e.key === 'Escape' && speechSynthesis.speaking) {
        speechSynthesis.cancel();
        showToast('Lecture arrêtée', 'success');
    }
});

// FONCTION DE TEST GLOBALE
window.testQuestion = function() {
    console.log('Test de la fonction askHelp');
    askHelp("Test: Comment optimiser les performances de Windows 11 ?");
};