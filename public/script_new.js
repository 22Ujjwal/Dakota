// Socket.io connection
const socket = io();

// DOM elements
const chatInput = document.getElementById('chatInput');
const sendMessage = document.getElementById('sendMessage');
const chatMessages = document.getElementById('chatMessages');
const toggleMessagesBtn = document.getElementById('toggleMessagesBtn');
const exploreBtn = document.getElementById('exploreBtn');
const settingsBtn = document.getElementById('settingsBtn');
const browserModal = document.getElementById('browserModal');
const closeModal = document.getElementById('closeModal');

// State
let isAutomationRunning = false;
let currentSessionId = null;
let areMessagesHidden = false;
let isWebExploreMode = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    updateConnectionStatus(false);
});

// Event Listeners
function initializeEventListeners() {
    // Chat input handling
    chatInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    });

    // Auto-resize textarea
    chatInput?.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
    });

    // Send message button
    sendMessage?.addEventListener('click', sendChatMessage);

    // Toggle messages visibility
    toggleMessagesBtn?.addEventListener('click', toggleMessages);

    // Web explore button
    exploreBtn?.addEventListener('click', () => {
        isWebExploreMode = true;
        openBrowserModal();
    });

    // Settings button
    settingsBtn?.addEventListener('click', openSettings);

    // Quick action buttons
    document.addEventListener('click', (e) => {
        if (e.target.closest('.action-toggle')) {
            const type = e.target.closest('.action-toggle').dataset.type;
            handleMessageAction(type, e.target.closest('.message'));
        }
    });

    // Message actions
    document.addEventListener('click', (e) => {
        const actionBtn = e.target.closest('.action-toggle');
        if (actionBtn) {
            const type = actionBtn.dataset.type;
            const message = actionBtn.closest('.message');
            handleMessageAction(type, message);
        }
    });
}

// Chat Functions
function sendChatMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Add user message
    addChatMessage(message, 'user');
    chatInput.value = '';
    chatInput.style.height = 'auto';

    // Only process as web automation if in web explore mode
    if (isWebExploreMode) {
        processWebAutomation(message);
    } else {
        processNormalChat(message);
    }
}

function processWebAutomation(message) {
    showLoading('Processing web automation...');
    socket.emit('startAutomation', { 
        task: message,
        options: { executeActions: true }
    });
}

function processNormalChat(message) {
    // Process as normal chat (like ChatGPT)
    addChatMessage("I understand you'd like to interact with web content. Please click the 'Web Explore' button first to enable web automation mode.", 'ai');
}

function addChatMessage(message, sender, options = {}) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message ${areMessagesHidden ? 'hidden' : ''}`;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const avatarIcon = sender === 'ai' ? 'fas fa-sparkles' : 'fas fa-user';
    
    messageDiv.innerHTML = `
        <div class="message-avatar glass-effect">
            <i class="${avatarIcon}"></i>
        </div>
        <div class="message-content glass-effect">
            <div class="message-text elegant-font">${formatMessage(message)}</div>
            ${sender === 'ai' ? `
                <div class="message-actions">
                    <button class="action-toggle" data-type="debug">
                        <i class="fas fa-code"></i>
                    </button>
                    <button class="action-toggle" data-type="screenshot">
                        <i class="fas fa-image"></i>
                    </button>
                </div>
            ` : ''}
            <div class="message-time">${timestamp}</div>
        </div>
    `;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    if (sender === 'ai') {
        typeWriterEffect(messageDiv.querySelector('.message-text'), message);
    }
}

// UI Functions
function toggleMessages() {
    areMessagesHidden = !areMessagesHidden;
    document.querySelectorAll('.message').forEach(msg => {
        msg.classList.toggle('hidden', areMessagesHidden);
    });
    toggleMessagesBtn.innerHTML = `<i class="fas fa-${areMessagesHidden ? 'eye-slash' : 'eye'}"></i> ${areMessagesHidden ? 'Show' : 'Hide'} Messages`;
}

function handleMessageAction(type, messageElement) {
    switch (type) {
        case 'debug':
            toggleDebugInfo(messageElement);
            break;
        case 'screenshot':
            toggleScreenshot(messageElement);
            break;
    }
}

function toggleDebugInfo(messageElement) {
    const debugInfo = messageElement.querySelector('.debug-info');
    if (debugInfo) {
        debugInfo.remove();
    } else {
        const debugDiv = document.createElement('div');
        debugDiv.className = 'debug-info glass-effect';
        debugDiv.innerHTML = `
            <pre><code>${JSON.stringify({
                timestamp: new Date().toISOString(),
                messageType: messageElement.classList.contains('ai-message') ? 'AI' : 'User',
                content: messageElement.querySelector('.message-text').textContent
            }, null, 2)}</code></pre>
        `;
        messageElement.querySelector('.message-content').appendChild(debugDiv);
    }
}

function toggleScreenshot(messageElement) {
    const screenshot = messageElement.querySelector('.screenshot');
    if (screenshot) {
        screenshot.classList.toggle('screenshot-hidden');
    }
}

// Helper Functions
function formatMessage(message) {
    return message
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
}

function typeWriterEffect(element, text) {
    element.innerHTML = '';
    let i = 0;
    const formattedText = formatMessage(text);
    
    function type() {
        if (i < formattedText.length) {
            element.innerHTML += formattedText.charAt(i);
            i++;
            setTimeout(type, 10);
        }
    }
    
    type();
}

// Status Functions
function showLoading(message) {
    const statusIndicator = document.getElementById('statusIndicator');
    if (statusIndicator) {
        statusIndicator.innerHTML = `
            <div class="status-content glass-effect">
                <div class="status-icon">
                    <i class="fas fa-circle-notch fa-spin"></i>
                </div>
                <span class="status-text">${message}</span>
            </div>
        `;
        statusIndicator.classList.add('show');
    }
}

function hideLoading() {
    const statusIndicator = document.getElementById('statusIndicator');
    if (statusIndicator) {
        statusIndicator.classList.remove('show');
    }
}

// Socket Event Handlers
socket.on('connect', () => {
    updateConnectionStatus(true);
});

socket.on('disconnect', () => {
    updateConnectionStatus(false);
});

socket.on('automationResult', (data) => {
    hideLoading();
    if (data.success) {
        addChatMessage(data.message || 'Task completed successfully!', 'ai');
    } else {
        addChatMessage(data.error || 'Task failed. Please try again.', 'ai');
    }
});

socket.on('error', (data) => {
    hideLoading();
    addChatMessage(`Error: ${data.message}`, 'ai');
});

// Initialize on load
updateConnectionStatus(false);
