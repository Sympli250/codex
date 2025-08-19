<?php
session_start();

// Configuration
$BASE_URL = 'http://storage.symplissime.fr:3002';
$API_KEY = 'SGX7AC2-CXY4E72-MAYXJAQ-HDS0R5A';
$DEFAULT_WORKSPACE = 'workspace-symplissime-a';
$CURRENT_USER = 'Sympli250';

// Set timezone to UTC
date_default_timezone_set('UTC');

if (!isset($_SESSION['messages'])) {
    $_SESSION['messages'] = [];
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    $action = $_POST['action'] ?? '';

    if ($action === 'chat') {
        $message = $_POST['message'] ?? '';
        $messageId = $_POST['messageId'] ?? uniqid('msg_');
        $workspaceSlug = $_POST['workspace'] ?? $DEFAULT_WORKSPACE;
        $sessionId = $_SESSION['chat_session_id'] ?? uniqid('session_');

        $_SESSION['chat_session_id'] = $sessionId;
        $_SESSION['messages'][$messageId] = [
            'current' => $message,
            'revisions' => $_SESSION['messages'][$messageId]['revisions'] ?? []
        ];

        $url = "$BASE_URL/api/v1/workspace/$workspaceSlug/chat";
        $postData = [
            'message' => $message,
            'mode' => 'chat',
            'sessionId' => $sessionId
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $API_KEY,
            'Accept: application/json'
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            echo json_encode(['error' => 'Erreur de connexion: ' . $curlError]);
            exit;
        }

        if ($httpCode < 200 || $httpCode >= 300) {
            echo json_encode(['error' => 'Erreur HTTP: ' . $httpCode]);
            exit;
        }

        $responseData = json_decode($response, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            echo json_encode(['error' => 'Format de réponse invalide']);
            exit;
        }

        $assistantMessage =
            $responseData['textResponse'] ??
            $responseData['response'] ??
            $responseData['message'] ??
            'Aucune réponse reçue';

        echo json_encode([
            'success' => true,
            'message' => $assistantMessage
        ]);
        exit;
    }

    if ($action === 'edit') {
        $messageId = $_POST['messageId'] ?? '';
        $newMessage = $_POST['newMessage'] ?? '';
        if ($messageId && isset($_SESSION['messages'][$messageId])) {
            $current = $_SESSION['messages'][$messageId]['current'];
            $_SESSION['messages'][$messageId]['revisions'][] = $current;
            $_SESSION['messages'][$messageId]['current'] = $newMessage;
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['error' => 'Message introuvable']);
        }
        exit;
    }

    if ($action === 'history') {
        $messageId = $_POST['messageId'] ?? '';
        if ($messageId && isset($_SESSION['messages'][$messageId])) {
            echo json_encode([
                'success' => true,
                'revisions' => $_SESSION['messages'][$messageId]['revisions']
            ]);
        } else {
            echo json_encode(['error' => 'Aucune révision']);
        }
        exit;
    }

    if ($action === 'restore') {
        $messageId = $_POST['messageId'] ?? '';
        $index = intval($_POST['index'] ?? -1);
        if (
            $messageId &&
            isset($_SESSION['messages'][$messageId]) &&
            isset($_SESSION['messages'][$messageId]['revisions'][$index])
        ) {
            $current = $_SESSION['messages'][$messageId]['current'];
            $selected = $_SESSION['messages'][$messageId]['revisions'][$index];
            $_SESSION['messages'][$messageId]['revisions'][] = $current;
            $_SESSION['messages'][$messageId]['current'] = $selected;
            echo json_encode(['success' => true, 'message' => $selected]);
        } else {
            echo json_encode(['error' => 'Révision introuvable']);
        }
        exit;
    }

    echo json_encode(['error' => 'Action inconnue']);
    exit;
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Symplissime IA - Support Technique Professionnel</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="chat-styles.css">
</head>
<body class="dark-theme">
    <!-- Controls Panel -->
    <div class="controls-panel">
        <button class="control-btn" onclick="decreaseFontSize()" title="Réduire le texte">A-</button>
        <button class="control-btn" onclick="increaseFontSize()" title="Agrandir le texte">A+</button>
        <button class="control-btn" onclick="toggleTheme()" title="Basculer le thème" id="themeToggle">🌙</button>
        <div class="theme-selector">
            <button class="control-btn" onclick="toggleThemeDropdown()" title="Changer les couleurs">🎨</button>
            <div class="theme-dropdown" id="themeDropdown">
                <div class="theme-option active" data-theme="default" onclick="changeColorTheme('default')">
                    <span class="theme-color" style="background: linear-gradient(135deg, #6366f1, #ec4899)"></span>
                    <span>Original</span>
                </div>
                <div class="theme-option" data-theme="indigo" onclick="changeColorTheme('indigo')">
                    <span class="theme-color" style="background: linear-gradient(135deg, #5046e5, #e11d48)"></span>
                    <span>Indigo Deep</span>
                </div>
                <div class="theme-option" data-theme="purple" onclick="changeColorTheme('purple')">
                    <span class="theme-color" style="background: linear-gradient(135deg, #9333ea, #f59e0b)"></span>
                    <span>Purple Dream</span>
                </div>
                <div class="theme-option" data-theme="blue" onclick="changeColorTheme('blue')">
                    <span class="theme-color" style="background: linear-gradient(135deg, #2563eb, #06b6d4)"></span>
                    <span>Blue Ocean</span>
                </div>
                <div class="theme-option" data-theme="emerald" onclick="changeColorTheme('emerald')">
                    <span class="theme-color" style="background: linear-gradient(135deg, #059669, #14b8a6)"></span>
                    <span>Emerald</span>
                </div>
            </div>
        </div>
    </div>
    
    <div class="main-container">
        <div class="chat-container" id="chatContainer">
            <div class="chat-header">
                <div class="header-left">
                    <div class="logo">S</div>
                    <div class="header-info">
                        <h1>Symplissime IA</h1>
                        <div class="subtitle">
                            <span>👤 Utilisateur : <?php echo $CURRENT_USER; ?></span>
                            <span>🏢 Support Technique Professionnel</span>
                        </div>
                    </div>
                </div>
                <div style="display: flex; gap: 12px; align-items: center;">
                    <div class="datetime" id="datetime"><?php echo gmdate('Y-m-d H:i:s'); ?></div>
                    <div class="status-badge">
                        <div class="status-dot" id="statusDot"></div>
                        <span id="statusText">Connexion...</span>
                    </div>
                </div>
            </div>
            
            <div class="chat-messages" id="chatMessages"></div>
            
            <div class="chat-input-container">
                <form class="input-form" id="chatForm">
                    <input 
                        type="text" 
                        class="message-input" 
                        id="messageInput" 
                        placeholder="Décrivez votre problème technique..."
                        autocomplete="off"
                        required
                    >
                    <button type="submit" class="send-button" id="sendButton">
                        <span>Envoyer</span>
                    </button>
                </form>
            </div>
        </div>
        
        <div class="help-panel collapsed" id="helpPanel">
            <div class="help-panel-header">
                <h2>📋 Support Rapide</h2>
                <p>Solutions aux problèmes fréquents</p>
            </div>
            
            <div class="help-categories">
                <!-- Windows Section -->
                <div class="os-section">
                    <div class="os-title windows-title">
                        🪟 Support Windows
                    </div>
                    
                    <button class="help-category-btn windows-btn" data-question="Comment optimiser les performances de Windows 11 et accélérer mon ordinateur ?" onclick="askHelp(this.getAttribute('data-question'))">
                        <div class="category-icon windows-icon">⚡</div>
                        <div class="category-content">
                            <div class="category-title">Optimisation des performances</div>
                            <div class="category-desc">Accélérer votre PC Windows</div>
                        </div>
                    </button>
                    
                    <button class="help-category-btn windows-btn" data-question="Comment résoudre les problèmes de connexion réseau et WiFi sous Windows ?" onclick="askHelp(this.getAttribute('data-question'))">
                        <div class="category-icon windows-icon">📶</div>
                        <div class="category-content">
                            <div class="category-title">Réseau et connectivité</div>
                            <div class="category-desc">Réparer internet et le WiFi</div>
                        </div>
                    </button>
                    
                    <button class="help-category-btn windows-btn" data-question="Comment sécuriser Windows 11 et se protéger contre les virus et malwares ?" onclick="askHelp(this.getAttribute('data-question'))">
                        <div class="category-icon windows-icon">🔒</div>
                        <div class="category-content">
                            <div class="category-title">Sécurité et confidentialité</div>
                            <div class="category-desc">Protéger votre système</div>
                        </div>
                    </button>
                    
                    <button class="help-category-btn windows-btn" data-question="Comment corriger les erreurs Windows Update et les problèmes d'installation ?" onclick="askHelp(this.getAttribute('data-question'))">
                        <div class="category-icon windows-icon">🔄</div>
                        <div class="category-content">
                            <div class="category-title">Windows Update</div>
                            <div class="category-desc">Résoudre les mises à jour</div>
                        </div>
                    </button>
                    
                    <button class="help-category-btn windows-btn" data-question="Comment gérer le stockage Windows et libérer de l'espace disque ?" onclick="askHelp(this.getAttribute('data-question'))">
                        <div class="category-icon windows-icon">💾</div>
                        <div class="category-content">
                            <div class="category-title">Gestion du stockage</div>
                            <div class="category-desc">Libérer l'espace disque</div>
                        </div>
                    </button>
                </div>
                
                <!-- macOS Section -->
                <div class="os-section">
                    <div class="os-title macos-title">
                        🍎 Support macOS
                    </div>
                    
                    <button class="help-category-btn macos-btn" data-question="Comment optimiser les performances de macOS et accélérer mon Mac ?" onclick="askHelp(this.getAttribute('data-question'))">
                        <div class="category-icon macos-icon">🚀</div>
                        <div class="category-content">
                            <div class="category-title">Performances Mac</div>
                            <div class="category-desc">Optimiser la vitesse du Mac</div>
                        </div>
                    </button>
                    
                    <button class="help-category-btn macos-btn" data-question="Comment utiliser Time Machine pour sauvegarder et restaurer sur macOS ?" onclick="askHelp(this.getAttribute('data-question'))">
                        <div class="category-icon macos-icon">⏰</div>
                        <div class="category-content">
                            <div class="category-title">Sauvegarde Time Machine</div>
                            <div class="category-desc">Sauvegarder et restaurer</div>
                        </div>
                    </button>
                    
                    <button class="help-category-btn macos-btn" data-question="Comment gérer le stockage iCloud et la synchronisation sur Mac ?" onclick="askHelp(this.getAttribute('data-question'))">
                        <div class="category-icon macos-icon">☁️</div>
                        <div class="category-content">
                            <div class="category-title">Gestion iCloud</div>
                            <div class="category-desc">Synchroniser et gérer iCloud</div>
                        </div>
                    </button>
                    
                    <button class="help-category-btn macos-btn" data-question="Comment réparer les plantages d'applications et problèmes de compatibilité sur macOS ?" onclick="askHelp(this.getAttribute('data-question'))">
                        <div class="category-icon macos-icon">🔧</div>
                        <div class="category-content">
                            <div class="category-title">Dépannage applications</div>
                            <div class="category-desc">Réparer les apps qui plantent</div>
                        </div>
                    </button>
                    
                    <button class="help-category-btn macos-btn" data-question="Comment sécuriser mon Mac avec FileVault et les paramètres de confidentialité ?" onclick="askHelp(this.getAttribute('data-question'))">
                        <div class="category-icon macos-icon">🛡️</div>
                        <div class="category-content">
                            <div class="category-title">Sécurité Mac</div>
                            <div class="category-desc">Sécuriser vos données</div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    </div>
    
    <button class="toggle-help-panel" onclick="toggleHelpPanel()" title="Support rapide">
        📋
    </button>
    
    <div class="toast" id="toast"></div>

    <!-- Configuration JavaScript -->
    <script>
        const WORKSPACE = '<?php echo $DEFAULT_WORKSPACE; ?>';
        const USER = '<?php echo $CURRENT_USER; ?>';
    </script>
    
    <!-- Scripts -->
    <script src="chat-app.js"></script>
</body>
</html>