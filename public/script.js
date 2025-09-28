// Socket.io connection
const socket = io();

// DOM elements
const taskInput = document.getElementById('taskInput');
const startBtn = document.getElementById('startBtn');
const screenshotBtn = document.getElementById('screenshotBtn');
const stopBtn = document.getElementById('stopBtn');
const refreshBtn = document.getElementById('refreshBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const browserView = document.getElementById('browserView');
const connectionStatus = document.getElementById('connectionStatus');
const statusText = document.getElementById('statusText');
const statusIndicator = document.getElementById('statusIndicator');

// New ChatGPT-like interface elements
const chatInput = document.getElementById('chatInput');
const sendMessage = document.getElementById('sendMessage');
const chatMessages = document.getElementById('chatMessages');
const newChatBtn = document.getElementById('newChatBtn');
const exploreBtn = document.getElementById('exploreBtn');
const settingsBtn = document.getElementById('settingsBtn');
const browserModal = document.getElementById('browserModal');
const closeModal = document.getElementById('closeModal');

// Avatar panel elements
const avatarPanel = document.getElementById('avatarPanel');
const avatarSlideToggle = document.getElementById('avatarSlideToggle');
const avatarToggleHeader = document.getElementById('avatarToggleHeader');
const avatarCloseBtn = document.getElementById('avatarCloseBtn');
const sidebarHeader = document.querySelector('.sidebar-header');

// Dynamic layout elements
const appContainer = document.querySelector('.app-container');
const sidebar = document.getElementById('sidebar');
const mainChat = document.getElementById('mainChat');
const minimizedSidebar = document.getElementById('minimizedSidebar');
const browserViewArea = document.getElementById('browserViewArea');
const closeBrowserBtn = document.getElementById('closeBrowserBtn');

// Vision model elements
const visionPanel = document.getElementById('visionPanel');
const visionSlideToggle = document.getElementById('visionSlideToggle');
const visionCloseBtn = document.getElementById('visionCloseBtn');
const captureBtn = document.getElementById('captureBtn');
const uploadImageBtn = document.getElementById('uploadImageBtn');
const imageUpload = document.getElementById('imageUpload');
const cameraVideo = document.getElementById('cameraVideo');
const captureCanvas = document.getElementById('captureCanvas');
const cameraPlaceholder = document.getElementById('cameraPlaceholder');
const analysisResults = document.getElementById('analysisResults');

// Voice elements
const voiceInputBtn = document.getElementById('voiceInputBtn');
const voiceOutputBtn = document.getElementById('voiceOutputBtn');

// State
let isAutomationRunning = false;
let currentScript = '';
// Removed: uploadedFilesList - file upload functionality removed
let chatMinimized = false;
let browserViewWindow = null;
let currentSessionId = null;
let isExploreMode = false;
let isAvatarPanelOpen = false;
let isVisionPanelOpen = false;
let cameraStream = null;
let isCameraActive = false;

// Voice state
let speechRecognition = null;
let isListening = false;
let isVoiceOutputEnabled = false;
let speechSynthesis = window.speechSynthesis;
let selectedVoice = null;
let voicesLoaded = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    updateConnectionStatus(false);
    addActivityMessage('Dakota initialized. Ready to help!', 'success');
    
    // Initialize activity display
    updateActivityDisplay();
    
    // Initialize dynamic layout
    initializeDynamicLayout();
    
    // Initialize voice functionality
    initializeVoice();
});

// Socket events
socket.on('connect', () => {
    updateConnectionStatus(true);
    addActivityMessage('Connected to server', 'success');
});

socket.on('disconnect', () => {
    updateConnectionStatus(false);
    addActivityMessage('Disconnected from server', 'warning');
});

socket.on('screenshot', (screenshotData) => {
    // Hide screenshot display and chat message
    hideLoading();
});

socket.on('scriptGenerated', (data) => {
    // Hide script generation chat message
    hideLoading();
});

socket.on('imageAnalysis', (data) => {
    // Hide image analysis chat message
});

socket.on('executionResult', (result) => {
    if (result.success) {
        addLogEntry(`Execution completed: ${result.message}`, 'success');
        showStatus('Task completed!', 'ready');
    } else {
        addLogEntry(`Execution failed: ${result.error}`, 'error');
        showStatus('Task failed', 'error');
    }
    hideLoading();
});

socket.on('sessionInfo', (data) => {
    addLogEntry(`BrowserBase session created: ${data.sessionId}`, 'info');
    addLogEntry(`View replay at: ${data.replayUrl}`, 'info');
    // Hide session info chat message
});

socket.on('error', (data) => {
    addLogEntry(`Error: ${data.message}`, 'error');
    // Only show error in status, not chat
    hideLoading();
    isAutomationRunning = false;
    updateButtons();
});

// Enhanced BrowserAgent event handlers
socket.on('automationResult', (data) => {
    hideLoading();
    isAutomationRunning = false;
    updateButtons();
    // Hide automation result chat message
});

socket.on('actionResult', (data) => {
    // Hide action result activity message
});

socket.on('analysisResult', (data) => {
    // Hide analysis result chat message
});

socket.on('activityUpdate', (data) => {
    // Only show activity in status, not chat
});

// New socket events for autonomous task execution
socket.on('taskProgress', (data) => {
    // Hide progress and reasoning chat messages
    const { url } = data;
    // Update browser view URL if changed
    if (url && browserView) {
        browserView.src = url;
    }
});

socket.on('taskComplete', (data) => {
    // Hide task completion chat messages
    isAutomationRunning = false;
    updateButtons();
    hideLoading();
    // Show status indicator only
});

socket.on('taskAnalysis', (data) => {
    // Hide task analysis chat message
});

// Event listeners
function initializeEventListeners() {
    // Start automation button
    startBtn?.addEventListener('click', startAutomation);
    
    // Screenshot button
    screenshotBtn?.addEventListener('click', takeScreenshot);
    
    // Stop button
    stopBtn?.addEventListener('click', stopAutomation);
    
    // Refresh button
    refreshBtn?.addEventListener('click', refreshBrowserView);
    
    // Fullscreen button
    fullscreenBtn?.addEventListener('click', toggleFullscreen);
    
    // Chat input
    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
            }
        });
        
        // Auto-resize textarea
        chatInput.addEventListener('input', (e) => {
            autoResizeTextarea(e.target);
        });
        
        console.log('Chat input event listeners attached');
    } else {
        console.error('Chat input element not found!');
    }
    
    // Send message button
    sendMessage?.addEventListener('click', sendChatMessage);
    
    // Fallback: Add click handler to the entire input container
    const inputContainer = document.querySelector('.input-container');
    if (inputContainer) {
        inputContainer.addEventListener('click', () => {
            console.log('Input container clicked, focusing textarea');
            if (chatInput) {
                chatInput.focus();
            }
        });
    }
    
    // New chat button
    newChatBtn?.addEventListener('click', startNewChat);
    
    // Explore button
    exploreBtn?.addEventListener('click', openBrowserModal);
    
    // Settings button
    settingsBtn?.addEventListener('click', openSettings);
    
    // Modal controls
    closeModal?.addEventListener('click', closeBrowserModal);
    
    // Close modal on backdrop click
    browserModal?.addEventListener('click', (e) => {
        if (e.target === browserModal) {
            closeBrowserModal();
        }
    });
    
    // Quick action buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('quick-action')) {
            const action = e.target.getAttribute('data-action');
            handleQuickAction(action);
        }
    });

    if (avatarPanel && sidebarHeader) {
        document.addEventListener('click', handleAvatarOutsideClick);
        avatarSlideToggle?.addEventListener('click', () => toggleAvatarPanel('slide-toggle'));
        avatarToggleHeader?.addEventListener('click', () => toggleAvatarPanel('header'));
        avatarCloseBtn?.addEventListener('click', closeAvatarPanel);
        document.addEventListener('keydown', handleAvatarKeydown);
    }
}

function toggleAvatarPanel(source = 'toggle') {
    if (!avatarPanel || !sidebarHeader) {
        return;
    }

    if (isAvatarPanelOpen) {
        closeAvatarPanel();
    } else {
        openAvatarPanel(source);
    }
}

function openAvatarPanel(source = 'toggle') {
    if (!avatarPanel || !sidebarHeader || isAvatarPanelOpen) {
        return;
    }

    sidebarHeader.classList.add('avatar-open');
    avatarPanel.setAttribute('aria-hidden', 'false');
    avatarSlideToggle?.setAttribute('aria-expanded', 'true');
    avatarToggleHeader?.setAttribute('aria-expanded', 'true');
    isAvatarPanelOpen = true;

    // Focus the close button for accessibility when opened via keyboard interaction
    if (source === 'header' || source === 'slide-toggle') {
        setTimeout(() => {
            avatarCloseBtn?.focus();
        }, 150);
    }
}

function closeAvatarPanel() {
    if (!avatarPanel || !sidebarHeader || !isAvatarPanelOpen) {
        return;
    }

    sidebarHeader.classList.remove('avatar-open');
    avatarPanel.setAttribute('aria-hidden', 'true');
    avatarSlideToggle?.setAttribute('aria-expanded', 'false');
    avatarToggleHeader?.setAttribute('aria-expanded', 'false');
    isAvatarPanelOpen = false;
}

function handleAvatarOutsideClick(event) {
    if (!isAvatarPanelOpen || !avatarPanel) {
        return;
    }

    const clickedToggle = avatarSlideToggle?.contains(event.target) || avatarToggleHeader?.contains(event.target);
    if (!clickedToggle && !avatarPanel.contains(event.target)) {
        closeAvatarPanel();
    }
}

function handleAvatarKeydown(event) {
    if (!isAvatarPanelOpen) {
        return;
    }

    if (event.key === 'Escape') {
        closeAvatarPanel();
    }
}

// Chat functions
function sendChatMessage() {
    console.log('sendChatMessage called');
    const message = chatInput.value.trim();
    console.log('Message:', message);
    
    if (!message) {
        console.log('Empty message, returning');
        return;
    }
    
    addChatMessage(message, 'user');
    chatInput.value = '';
    
    // Reset textarea height after clearing
    if (chatInput.tagName.toLowerCase() === 'textarea') {
        chatInput.style.height = 'auto';
        chatInput.style.height = '24px';
    }
    
    chatInput.focus(); // Keep focus on input
    
    // Process the message as a command or automation task
    processUserMessage(message);
}

function processUserMessage(message) {
    const lowerMessage = message.toLowerCase();
    
    // Handle Web Explore mode
    if (isExploreMode) {
        // In explore mode, process web automation requests
    if (lowerMessage.includes('screenshot') || lowerMessage.includes('capture')) {
            addActivityMessage('Taking screenshot...', 'info');
        takeScreenshot();
        return;
    }
    
    if (lowerMessage.includes('analyze') && lowerMessage.includes('page')) {
            addActivityMessage('Analyzing page...', 'info');
        analyzeCurrentPage(message);
            return;
        }
        
        // For other messages in explore mode, provide web-focused response
        addActivityMessage('Processing web automation request...', 'info');
        return;
    }
    
    // Only use web tools when explicitly requested via Web Explore button
    if (lowerMessage.includes('explore') || lowerMessage.includes('web') || lowerMessage.includes('browse')) {
        enterExploreMode();
        addActivityMessage('Web Explore mode activated. Send your web automation request.', 'info');
        return;
    }
    
    // Regular chatbot responses for non-web requests
    addActivityMessage('Processing your message...', 'info');
    
    // Check for autonomous task keywords - only for web exploration
    const webTaskKeywords = [
        'search for', 'find', 'book', 'apply', 'buy', 'order', 
        'navigate to', 'go to', 'visit', 'open', 'complete',
        'watch', 'browse', 'explore', 'look for'
    ];
    
    const isWebTask = webTaskKeywords.some(keyword => 
        lowerMessage.includes(keyword)
    ) || lowerMessage.includes('flight') || lowerMessage.includes('job') || 
       lowerMessage.includes('music') || lowerMessage.includes('bollywood') ||
       lowerMessage.includes('chatgpt') || lowerMessage.includes('youtube');
    
    if (isWebTask) {
        // Use Enhanced BrowserAgent for autonomous execution
        addActivityMessage('Starting web task...', 'info');
        startAutonomousTask(message);
        return;
    }
    
    // Default to text-based response (like ChatGPT)
    addChatMessage('I understand you want help with that. For web automation tasks, please use the "Explore" button or mention "explore" in your message.', 'ai');
}

// Start autonomous task execution using Enhanced BrowserAgent
function startAutonomousTask(taskDescription) {
    if (isAutomationRunning) {
        addChatMessage('I\'m already working on a task. Please wait for it to complete.', 'ai');
        return;
    }
    
    isAutomationRunning = true;
    updateButtons();
    showLoading('Starting autonomous task...');
    
    addChatMessage(`🚀 Starting autonomous task: "${taskDescription}"`, 'ai');
    addChatMessage('I will use my Observe → Decide → Act → Evaluate cycle to complete this task step by step.', 'ai');
    
    socket.emit('startAutonomousTask', {
        taskDescription: taskDescription,
        options: {
            maxSteps: 20,
            confidenceThreshold: 0.7
        }
    });
}

function analyzeCurrentPage(instruction) {
    showLoading('Analyzing page...');
    addActivityMessage('Starting page analysis with AI', 'info');
    
    socket.emit('analyzePage', {
        instruction: instruction,
        options: {
            includeScreenshot: true,
            includeDom: true,
            executeActions: false
        }
    });
}

function addChatMessage(message, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Determine avatar icon
    let avatarIcon = 'fas fa-user';
    if (sender === 'ai') {
        avatarIcon = 'fas fa-sparkles';
    } else if (sender === 'system') {
        avatarIcon = 'fas fa-info-circle';
    }
    
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <i class="${avatarIcon}"></i>
        </div>
        <div class="message-content">
            <div class="message-text">${formatMessage(message)}</div>
            <div class="message-time">${timestamp}</div>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Avatar integration hooks
    if (sender === 'user') {
        // User speaking ends any AI speaking/typing state
        if (window.AvatarController) {
            try {
                window.AvatarController.stopTyping?.();
                window.AvatarController.stopSpeaking?.();
                // Scan user message for triggers like thanks / goodbye
                window.AvatarController.scanAndTrigger?.(message);
            } catch (e) { console.warn('Avatar user hook error', e); }
        }
    }
    
    // Add typewriter effect & avatar compose lifecycle for AI messages
    if (sender === 'ai') {
        const el = messageDiv.querySelector('.message-text');
        if (window.AvatarController) {
            try { window.AvatarController.notifyAIComposeStart?.(); } catch(e){ console.warn('Avatar compose start error', e); }
        }
        typeWriterEffect(el, message, () => {
            if (window.AvatarController) {
                try {
                    window.AvatarController.notifyAIComposeEnd?.();
                    window.AvatarController.scanAndTrigger?.(message);
                } catch(e){ console.warn('Avatar compose end error', e); }
            }
            
            // Add text-to-speech for AI responses
            if (isVoiceOutputEnabled) {
                // Small delay to let typewriter finish
                setTimeout(() => {
                    speakText(message);
                }, 500);
            }
        });
    }
}

function formatMessage(message) {
    // Convert markdown-style formatting
    return message
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
}

function typeWriterEffect(element, text, done) {
    element.innerHTML = '';
    let i = 0;
    const formattedText = formatMessage(text);
    const total = formattedText.length;
    
    function type() {
        if (i < total) {
            element.innerHTML += formattedText.charAt(i);
            i++;
            setTimeout(type, 10);
        } else {
            if (typeof done === 'function') {
                try { done(); } catch(e){ console.warn('typeWriterEffect callback error', e); }
            }
        }
    }
    type();
}

// Activity message function - minimalistic with dropdown
let activityMessages = [];
let currentActivity = null;

function addActivityMessage(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const activity = {
        id: Date.now(),
        message: message,
        type: type,
        timestamp: timestamp
    };
    
    activityMessages.unshift(activity); // Add to beginning
    activityMessages = activityMessages.slice(0, 10); // Keep only last 10
    
    currentActivity = activity;
    updateActivityDisplay();
    console.log(`[${type.toUpperCase()}] ${message}`);
}

function updateActivityDisplay() {
    const activityContainer = document.getElementById('activityContainer');
    if (!activityContainer) return;
    
    if (currentActivity) {
        activityContainer.innerHTML = `
            <div class="activity-current">
                <span class="activity-text">${currentActivity.message}</span>
                <button class="activity-toggle" onclick="toggleActivityDropdown()">
                    <i class="fas fa-chevron-down"></i>
                </button>
            </div>
            <div class="activity-dropdown" id="activityDropdown" style="display: none;">
                ${activityMessages.map(activity => `
                    <div class="activity-item ${activity.type}">
                        <span class="activity-time">${activity.timestamp}</span>
                        <span class="activity-msg">${activity.message}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

function toggleActivityDropdown() {
    const dropdown = document.getElementById('activityDropdown');
    const toggle = document.querySelector('.activity-toggle i');
    
    if (dropdown.style.display === 'none') {
        dropdown.style.display = 'block';
        toggle.className = 'fas fa-chevron-up';
    } else {
        dropdown.style.display = 'none';
        toggle.className = 'fas fa-chevron-down';
    }
}

function toggleChatMinimize() {
    chatMinimized = !chatMinimized;
    const chatContainer = document.querySelector('.chat-container');
    
    if (chatMinimized) {
        chatContainer.classList.add('minimized');
        minimizeChat.innerHTML = '<i class="fas fa-expand"></i>';
    } else {
        chatContainer.classList.remove('minimized');
        minimizeChat.innerHTML = '<i class="fas fa-minus"></i>';
    }
}

// New ChatGPT-like interface functions
function startNewChat() {
    // Clear all chat messages to provide a fresh canvas
    chatMessages.innerHTML = '';

    // Reset state
    isAutomationRunning = false;
    updateButtons();
    hideLoading();
}

function openBrowserModal() {
    browserModal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // If we have a current session, load it
    if (currentSessionId) {
        openBrowserView(currentSessionId);
    }
}

function closeBrowserModal() {
    browserModal.classList.remove('show');
    document.body.style.overflow = '';
}

function openSettings() {
    addChatMessage('Settings panel coming soon! For now, you can configure API keys in the .env file.', 'ai');
}

// Quick actions - minimalistic
function handleQuickAction(action) {
    if (action === 'explore') {
        openBrowserModal();
        addActivityMessage('Opening web exploration', 'info');
        return;
    }

    addChatMessage(`I'm not sure how to handle "${action}". Can you describe what you'd like me to do?`, 'ai');
}

// Automation functions
function startAutomation() {
    const task = taskInput?.value?.trim() || '';
    
    if (!task) {
        addChatMessage('Please provide a task description so I know what to automate.', 'ai');
        return;
    }
    
    startAutomationWithTask(task);
}

function startAutomationWithTask(task, url = '') {
    if (isAutomationRunning) {
        addChatMessage('I\'m already working on a task. Please wait for it to complete.', 'ai');
        return;
    }
    
    isAutomationRunning = true;
    updateButtons();
    showLoading('Starting automation...');
    
    addChatMessage(`Starting automation task: "${task}"${url ? ` on ${url}` : ''}`, 'ai');
    addActivityMessage('Initializing browser automation', 'info');
    
    socket.emit('startAutomation', { task, url });
}

function takeScreenshot() {
    showLoading('Taking screenshot...');
    addActivityMessage('Capturing page screenshot', 'info');
    socket.emit('takeScreenshot');
}

function stopAutomation() {
    isAutomationRunning = false;
    updateButtons();
    hideLoading();
    addChatMessage('Automation stopped.', 'ai');
    addActivityMessage('Automation stopped by user', 'warning');
}

function refreshBrowserView() {
    if (browserView) {
        // Just take a new screenshot to refresh
        takeScreenshot();
    }
}

function toggleFullscreen() {
    const browserContainer = document.querySelector('.browser-container');
    if (browserContainer) {
        browserContainer.classList.toggle('fullscreen');
        
        if (browserContainer.classList.contains('fullscreen')) {
            fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
        } else {
            fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
        }
    }
}

// UI update functions
function updateButtons() {
    if (startBtn) {
        startBtn.disabled = isAutomationRunning;
    }
    if (stopBtn) {
        stopBtn.disabled = !isAutomationRunning;
    }
    if (screenshotBtn) {
        screenshotBtn.disabled = isAutomationRunning;
    }
}

function updateConnectionStatus(connected) {
    if (connectionStatus) {
        connectionStatus.className = `connection-status ${connected ? 'connected' : 'disconnected'}`;
    }
    if (statusText) {
        statusText.textContent = connected ? 'Connected' : 'Disconnected';
    }
}

function showLoading(message = 'Dyna is processing...') {
    if (statusIndicator) {
        const statusText = statusIndicator.querySelector('.status-text');
        if (statusText) {
            statusText.textContent = message;
        }
        statusIndicator.className = 'status-indicator show processing';
    }
}

function hideLoading() {
    if (statusIndicator) {
        const statusText = statusIndicator.querySelector('.status-text');
        if (statusText) {
            statusText.textContent = 'Ready';
        }
        statusIndicator.className = 'status-indicator show';
        
        // Hide after a short delay
        setTimeout(() => {
            statusIndicator.className = 'status-indicator';
        }, 2000);
    }
}

function showStatus(message, type = 'ready') {
    if (statusIndicator) {
        const statusText = statusIndicator.querySelector('.status-text');
        if (statusText) {
            statusText.textContent = message;
        }
        statusIndicator.className = `status-indicator show ${type}`;
        
        // Auto-hide after 3 seconds unless it's processing
        if (type !== 'processing') {
            setTimeout(() => {
                statusIndicator.className = 'status-indicator';
            }, 3000);
        }
    }
}

function displayScreenshot(imageData) {
    if (browserView) {
        browserView.src = imageData;
        browserView.style.display = 'block';
    }
}

// File upload functions
// File upload functionality removed for cleaner UI experience
// Users can provide context directly through chat messages

// Legacy function for compatibility
function addLogEntry(message, type = 'info') {
    // Convert to activity message for the new UI
    addActivityMessage(message, type);
}

// Browser View Modal Functions
async function openBrowserView(sessionId) {
    const browserView = document.getElementById('browserView');
    
    if (!browserView) {
        console.error('Browser view element not found');
        return;
    }
    
    // Show loading state
    browserView.innerHTML = `
        <div class="placeholder">
            <i class="fas fa-spinner fa-spin"></i>
            <h3>Loading Browser View</h3>
            <p>Connecting to automation session...</p>
        </div>
    `;
    
    try {
        console.log('Fetching debug info for session:', sessionId);
        
        // Get debug info from Browserbase
        const response = await fetch(`/api/session/${sessionId}/debug`);
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const debugInfo = await response.json();
        console.log('Debug info received:', debugInfo);
        
        if (debugInfo.debuggerFullscreenUrl) {
            // Create iframe with proper error handling
            const iframe = document.createElement('iframe');
            iframe.src = debugInfo.debuggerFullscreenUrl;
            iframe.style.cssText = 'width: 100%; height: 100%; border: none; border-radius: 8px;';
            iframe.title = 'Live Browser Automation';
            iframe.allow = 'fullscreen';
            
            // Handle iframe load events
            iframe.onload = () => {
                console.log('Browser view iframe loaded successfully');
                addActivityMessage('🎬 Live browser view loaded!', 'success');
            };
            
            iframe.onerror = (error) => {
                console.error('Iframe loading error:', error);
                showBrowserViewError(sessionId, 'Failed to load browser view iframe');
            };
            
            // Set a timeout for iframe loading
            const loadTimeout = setTimeout(() => {
                console.warn('Browser view iframe load timeout');
                addActivityMessage('⚠️ Browser view taking longer than expected to load', 'warning');
            }, 10000);
            
            iframe.onload = () => {
                clearTimeout(loadTimeout);
                addActivityMessage('🎬 Live browser view loaded!', 'success');
            };
            
            // Clear the loading state and add iframe
            browserView.innerHTML = '';
            browserView.appendChild(iframe);
            
            currentSessionId = sessionId;
            
            // Show fallback message if using mock URL
            if (debugInfo.fallback) {
                addActivityMessage('⚠️ Using fallback browser view - Browserbase API unavailable', 'warning');
            }
            
        } else {
            throw new Error('Debug URL not available in response');
        }
    } catch (error) {
        console.error('Failed to load browser view:', error);
        showBrowserViewError(sessionId, error.message);
    }
}

function showBrowserViewError(sessionId, errorMessage) {
    const browserView = document.getElementById('browserView');
    
    addActivityMessage('⚠️ Failed to load live browser view', 'error');
    
    // Show comprehensive error information and options
    browserView.innerHTML = `
        <div class="placeholder error">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Browser View Unavailable</h3>
            <p>Unable to load live automation view.</p>
            <div class="error-details">
                <small>Error: ${errorMessage}</small>
            </div>
            <div class="error-actions">
                <button onclick="openExternalBrowserView('${sessionId}')" class="btn glassmorphic-button">
                    <i class="fas fa-external-link-alt"></i>
                    <span>Open External View</span>
                </button>
                <button onclick="openBrowserView('${sessionId}')" class="btn glassmorphic-button">
                    <i class="fas fa-sync-alt"></i>
                    <span>Retry</span>
                </button>
                <button onclick="requestBrowserScreenshot('${sessionId}')" class="btn glassmorphic-button">
                    <i class="fas fa-camera"></i>
                    <span>Get Screenshot</span>
                </button>
            </div>
        </div>
    `;
}

function openExternalBrowserView(sessionId) {
    const externalUrl = `https://www.browserbase.com/sessions/${sessionId}`;
    window.open(externalUrl, '_blank');
    addActivityMessage('🌐 Opened browser view in new tab', 'info');
}

async function requestBrowserScreenshot(sessionId) {
    try {
        addActivityMessage('📸 Requesting browser screenshot...', 'info');
        
        const response = await fetch(`/api/session/${sessionId}/screenshot`);
        
        if (!response.ok) {
            throw new Error(`Screenshot request failed: ${response.status}`);
        }
        
        // Convert response to blob
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        
        // Display screenshot in browser view
        const browserView = document.getElementById('browserView');
        browserView.innerHTML = `
            <div class="screenshot-view">
                <div class="screenshot-header">
                    <h4><i class="fas fa-camera"></i> Browser Screenshot</h4>
                    <div class="screenshot-actions">
                        <button onclick="openBrowserView('${sessionId}')" class="btn glassmorphic-button">
                            <i class="fas fa-sync-alt"></i>
                            <span>Try Live View</span>
                        </button>
                        <button onclick="downloadScreenshot('${imageUrl}', '${sessionId}')" class="btn glassmorphic-button">
                            <i class="fas fa-download"></i>
                            <span>Download</span>
                        </button>
                    </div>
                </div>
                <img src="${imageUrl}" alt="Browser Screenshot" class="screenshot-image">
                <p class="screenshot-info">
                    <i class="fas fa-info-circle"></i>
                    Static screenshot from session ${sessionId}
                </p>
            </div>
        `;
        
        addActivityMessage('📸 Browser screenshot loaded!', 'success');
        
    } catch (error) {
        console.error('Failed to get screenshot:', error);
        addActivityMessage('⚠️ Failed to get browser screenshot', 'error');
    }
}

function downloadScreenshot(imageUrl, sessionId) {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `browser-screenshot-${sessionId}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addActivityMessage('💾 Screenshot downloaded', 'success');
}

function refreshBrowserView(sessionId) {
    if (sessionId) {
        openBrowserView(sessionId);
    }
}

function openExternalBrowserView(sessionId) {
    const fallbackUrl = `https://app.browserbase.com/sessions/${sessionId}`;
    window.open(fallbackUrl, '_blank');
}

function reopenBrowserView() {
    if (currentSessionId) {
        openBrowserView(currentSessionId);
    }
}

function closeBrowserView() {
    const browserView = document.getElementById('browserView');
    browserView.innerHTML = `
        <div class="placeholder">
            <i class="fas fa-globe"></i>
            <h3>Ready to Start</h3>
            <p>Ask Dyna to automate a web task to begin</p>
        </div>
    `;
    currentSessionId = null;
}

// Initialize on load
updateButtons();

// Quota management functions removed - no longer displaying quota status

// Dynamic Layout Functions
function initializeDynamicLayout() {
    // Add event listeners for dynamic layout
    exploreBtn?.addEventListener('click', toggleExploreMode);
    visionSlideToggle?.addEventListener('click', toggleVisionPanel);
    minimizedSidebar?.addEventListener('click', toggleSidebar);
    closeBrowserBtn?.addEventListener('click', exitExploreMode);
    visionCloseBtn?.addEventListener('click', closeVisionPanel);
    
    // Vision model event listeners
    captureBtn?.addEventListener('click', captureImage);
    uploadImageBtn?.addEventListener('click', () => imageUpload?.click());
    imageUpload?.addEventListener('change', handleImageUpload);
    
    // Voice event listeners
    voiceInputBtn?.addEventListener('click', toggleVoiceInput);
    voiceOutputBtn?.addEventListener('click', toggleVoiceOutput);
    
    // Update explore button text
    if (exploreBtn) {
        const btnText = exploreBtn.querySelector('.btn-text');
        if (btnText) {
            btnText.textContent = 'Web Explore';
        }
    }
    
    // Update vision button text
    if (visionSlideToggle) {
        const btnText = visionSlideToggle.querySelector('.btn-text');
        if (btnText) {
            btnText.textContent = 'Vision';
        }
    }
}

function toggleExploreMode() {
    if (isExploreMode) {
        exitExploreMode();
    } else {
        enterExploreMode();
    }
}

function enterExploreMode() {
    isExploreMode = true;
    appContainer?.classList.add('explore-mode');
    browserViewArea?.style.setProperty('display', 'flex');
    
    // Update explore button
    if (exploreBtn) {
        const btnText = exploreBtn.querySelector('.btn-text');
        if (btnText) {
            btnText.textContent = 'Exit Explore';
        }
    }
    
    addActivityMessage('Web Explore mode activated', 'info');
}

function exitExploreMode() {
    isExploreMode = false;
    appContainer?.classList.remove('explore-mode');
    browserViewArea?.style.setProperty('display', 'none');
    
    // Update explore button
    if (exploreBtn) {
        const btnText = exploreBtn.querySelector('.btn-text');
        if (btnText) {
            btnText.textContent = 'Web Explore';
        }
    }
    
    addActivityMessage('Web Explore mode deactivated', 'info');
}

// Vision Panel Functions
function toggleVisionPanel() {
    if (isVisionPanelOpen) {
        closeVisionPanel();
    } else {
        openVisionPanel();
    }
}

function openVisionPanel() {
    // Close avatar panel if open
    if (isAvatarPanelOpen) {
        closeAvatarPanel();
    }
    
    isVisionPanelOpen = true;
    
    if (visionPanel) {
        visionPanel.setAttribute('aria-hidden', 'false');
    }
    
    if (visionSlideToggle) {
        visionSlideToggle.setAttribute('aria-expanded', 'true');
    }
    
    addActivityMessage('Vision panel opened', 'info');
    
    // Auto-start camera when panel opens
    setTimeout(() => {
        startCamera();
    }, 300); // Wait for panel animation to complete
}

function closeVisionPanel() {
    isVisionPanelOpen = false;
    
    if (visionPanel) {
        visionPanel.setAttribute('aria-hidden', 'true');
    }
    
    if (visionSlideToggle) {
        visionSlideToggle.setAttribute('aria-expanded', 'false');
    }
    
    // Stop camera when panel closes
    if (isCameraActive) {
        stopCamera();
    }
    
    addActivityMessage('Vision panel closed', 'info');
}

// Camera Functions
async function startCamera() {
    try {
        const constraints = {
            video: {
                width: { ideal: 320 },
                height: { ideal: 240 },
                facingMode: 'user'
            }
        };
        
        cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (cameraVideo && cameraPlaceholder) {
            cameraVideo.srcObject = cameraStream;
            cameraVideo.style.display = 'block';
            cameraPlaceholder.style.display = 'none';
            
            isCameraActive = true;
            
            if (captureBtn) {
                captureBtn.disabled = false;
            }
            
            addActivityMessage('Camera started successfully', 'success');
        }
    } catch (error) {
        console.error('Error accessing camera:', error);
        addActivityMessage('Camera access denied or unavailable', 'error');
        
        // Show error in placeholder
        if (cameraPlaceholder) {
            const icon = cameraPlaceholder.querySelector('i');
            const span = cameraPlaceholder.querySelector('span');
            
            if (icon) icon.className = 'fas fa-exclamation-triangle';
            if (span) span.textContent = 'Camera access denied';
        }
    }
}

function stopCamera() {
    if (cameraStream) {
        const tracks = cameraStream.getTracks();
        tracks.forEach(track => track.stop());
        cameraStream = null;
    }
    
    if (cameraVideo && cameraPlaceholder) {
        cameraVideo.style.display = 'none';
        cameraPlaceholder.style.display = 'flex';
        
        // Reset placeholder content
        const icon = cameraPlaceholder.querySelector('i');
        const span = cameraPlaceholder.querySelector('span');
        
        if (icon) icon.className = 'fas fa-video';
        if (span) span.textContent = 'Starting camera...';
    }
    
    isCameraActive = false;
    
    if (captureBtn) {
        captureBtn.disabled = true;
    }
    
    addActivityMessage('Camera stopped', 'info');
}

// Image Capture Functions
function captureImage() {
    if (!isCameraActive || !cameraVideo || !captureCanvas) {
        addActivityMessage('Camera not active or elements not found', 'error');
        return;
    }
    
    const canvas = captureCanvas;
    const video = cameraVideo;
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get original image as base64 for display
    const originalImageBase64 = canvas.toDataURL('image/jpeg', 0.8);
    
    // Convert to blob and process
    canvas.toBlob((blob) => {
        processImageBlob(blob, originalImageBase64);
    }, 'image/jpeg', 0.8);
    
    addActivityMessage('Image captured from camera', 'success');
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        // Create a preview of the uploaded image
        const reader = new FileReader();
        reader.onload = function(e) {
            const originalImageBase64 = e.target.result;
            processImageBlob(file, originalImageBase64);
        };
        reader.readAsDataURL(file);
        addActivityMessage(`Image uploaded: ${file.name}`, 'success');
    }
}

async function processImageBlob(blob, originalImageBase64) {
    try {
        showAnalysisLoading();
        
        const formData = new FormData();
        formData.append('image', blob);
        
        const response = await fetch('/api/vision/analyze', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        result.originalImageBase64 = originalImageBase64;
        displayAnalysisResults(result);
        
    } catch (error) {
        console.error('Error processing image:', error);
        addActivityMessage('Error processing image', 'error');
        hideAnalysisLoading();
    }
}

function showAnalysisLoading() {
    if (analysisResults) {
        analysisResults.innerHTML = `
            <div class="results-placeholder">
                <i class="fas fa-spinner fa-spin"></i>
                <h3>Analyzing Image</h3>
                <p>Processing with AI vision model...</p>
            </div>
        `;
    }
}

function hideAnalysisLoading() {
    if (analysisResults) {
        analysisResults.innerHTML = `
            <div class="results-placeholder">
                <i class="fas fa-brain"></i>
                <h3>AI Vision Analysis</h3>
                <p>Results will appear here after processing</p>
            </div>
        `;
    }
}

function displayAnalysisResults(result) {
    if (!analysisResults) return;
    
    const emotionLabels = {
        '-2': 'Angry',
        '-1': 'Sad',
        '0': 'Neutral',
        '1': 'Happy',
        '2': 'Very Happy'
    };
    
    const emotionLabel = emotionLabels[result.emotion_numeric.toString()] || 'Unknown';
    
    let resultsHTML = `
        <div class="result-item">
            <div class="result-label">Emotion Detected</div>
            <div class="result-value">${emotionLabel}</div>
            <div class="result-confidence">Confidence Score: ${result.emotion_numeric}</div>
        </div>
    `;
    
    // Show original captured image
    if (result.originalImageBase64) {
        resultsHTML += `
            <div class="result-item">
                <div class="result-label">Captured Image</div>
                <img src="${result.originalImageBase64}" 
                     class="analysis-image original-image" 
                     alt="Original captured image">
            </div>
        `;
    }
    
    // Show processed image with facial landmarks/vectors
    if (result.image_base64) {
        resultsHTML += `
            <div class="result-item">
                <div class="result-label">Facial Analysis & Vectors</div>
                <img src="data:image/jpeg;base64,${result.image_base64}" 
                     class="analysis-image processed-image" 
                     alt="Processed image with facial landmarks and vectors">
                <div class="vector-info">
                    <small>• Red dots: Facial landmarks</small>
                    <small>• Blue lines: Eye vectors</small>
                    <small>• Green lines: Lip vectors</small>
                    <small>• Purple lines: Face edges</small>
                </div>
            </div>
        `;
    }
    
    // Show fallback message if using mock data
    if (result.fallback) {
        resultsHTML += `
            <div class="result-item">
                <div class="result-label">Service Status</div>
                <div class="result-value" style="color: var(--warning);">Mock Mode</div>
                <div class="result-confidence">${result.message}</div>
            </div>
        `;
    }
    
    analysisResults.innerHTML = resultsHTML;
    const statusMessage = result.fallback 
        ? `Mock analysis complete: ${emotionLabel} (Python service offline)`
        : `Analysis complete: ${emotionLabel} detected`;
    addActivityMessage(statusMessage, result.fallback ? 'warning' : 'success');
}

function toggleSidebar() {
    if (sidebar) {
        sidebar.style.display = sidebar.style.display === 'none' ? 'flex' : 'none';
    }
}

// Test function for debugging text input
function testTextInput() {
    console.log('Testing text input...');
    if (chatInput) {
        console.log('Chat input element found:', chatInput);
        console.log('Chat input value:', chatInput.value);
        console.log('Chat input disabled:', chatInput.disabled);
        console.log('Chat input readonly:', chatInput.readOnly);
        console.log('Chat input type:', chatInput.type);
        
        // Try to focus and add text
        chatInput.focus();
        chatInput.value = 'Test message';
        console.log('Set test message, new value:', chatInput.value);
        
        // Try to trigger input event
        chatInput.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Try to trigger keydown event
        chatInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        
        // Test send function directly
        console.log('Testing sendChatMessage function...');
        sendChatMessage();
    } else {
        console.error('Chat input element not found!');
    }
}

// Auto-resize textarea function
function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

// Voice Functionality
function initializeVoice() {
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        speechRecognition = new SpeechRecognition();
        
        speechRecognition.continuous = false;
        speechRecognition.interimResults = true;
        speechRecognition.lang = 'en-US';
        
        speechRecognition.onstart = () => {
            isListening = true;
            voiceInputBtn?.classList.add('recording');
            addActivityMessage('Listening...', 'info');
        };
        
        speechRecognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }
            
            if (finalTranscript) {
                chatInput.value = finalTranscript;
                autoResizeTextarea(chatInput);
                addActivityMessage('Voice input captured', 'success');
            }
        };
        
        speechRecognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            isListening = false;
            voiceInputBtn?.classList.remove('recording');
            addActivityMessage(`Voice input error: ${event.error}`, 'error');
        };
        
        speechRecognition.onend = () => {
            isListening = false;
            voiceInputBtn?.classList.remove('recording');
        };
        
        addActivityMessage('Speech recognition initialized', 'success');
    } else {
        addActivityMessage('Speech recognition not supported in this browser', 'warning');
        if (voiceInputBtn) {
            voiceInputBtn.style.display = 'none';
        }
    }
    
    // Initialize Text-to-Speech
    if ('speechSynthesis' in window) {
        loadVoices();
        
        // Listen for voice changes (voices load asynchronously)
        speechSynthesis.addEventListener('voiceschanged', loadVoices);
        
        addActivityMessage('Text-to-speech initialized', 'success');
    } else {
        addActivityMessage('Text-to-speech not supported in this browser', 'warning');
        if (voiceOutputBtn) {
            voiceOutputBtn.style.display = 'none';
        }
    }
}

function loadVoices() {
    const voices = speechSynthesis.getVoices();
    console.log('Available voices:', voices.length);
    
    if (voices.length === 0) {
        console.warn('No voices available yet, will retry');
        setTimeout(loadVoices, 1000); // Retry after 1 second
        return;
    }
    
    // Look for American male voices, preferring "John" or similar
    const preferredVoices = [
        'Google US English Male',
        'Microsoft David - English (United States)', 
        'Microsoft David Desktop - English (United States)',
        'Alex',
        'Daniel', 
        'Fred',
        'Google US English'
    ];
    
    // Log all available voices for debugging
    console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
    
    // First try to find a preferred voice
    for (const preferred of preferredVoices) {
        const voice = voices.find(v => v.name.includes(preferred));
        if (voice) {
            selectedVoice = voice;
            console.log('Selected preferred voice:', voice.name);
            break;
        }
    }
    
    // If no preferred voice found, look for any US English male voice
    if (!selectedVoice) {
        selectedVoice = voices.find(v => 
            v.lang.includes('en-US') && 
            (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('man'))
        );
        if (selectedVoice) console.log('Selected US male voice:', selectedVoice.name);
    }
    
    // Fallback to first US English voice
    if (!selectedVoice) {
        selectedVoice = voices.find(v => v.lang.includes('en-US') || v.lang.includes('en_US'));
        if (selectedVoice) console.log('Selected US English voice:', selectedVoice.name);
    }
    
    // Last resort - first available voice
    if (!selectedVoice && voices.length > 0) {
        selectedVoice = voices[0];
        console.log('Selected fallback voice:', selectedVoice.name);
    }
    
    voicesLoaded = true;
    
    if (selectedVoice) {
        console.log('Final voice selection:', selectedVoice.name, selectedVoice.lang);
        addActivityMessage(`Voice ready: ${selectedVoice.name}`, 'success');
    } else {
        console.error('No voice could be selected');
        addActivityMessage('No voice available for text-to-speech', 'warning');
    }
}

function toggleVoiceInput() {
    if (!speechRecognition) {
        addActivityMessage('Speech recognition not available', 'error');
        return;
    }
    
    if (isListening) {
        speechRecognition.stop();
    } else {
        try {
            speechRecognition.start();
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            addActivityMessage('Could not start voice input', 'error');
        }
    }
}

function toggleVoiceOutput() {
    isVoiceOutputEnabled = !isVoiceOutputEnabled;
    
    if (isVoiceOutputEnabled) {
        voiceOutputBtn?.classList.add('enabled');
        addActivityMessage('Voice responses enabled', 'success');
    } else {
        voiceOutputBtn?.classList.remove('enabled');
        addActivityMessage('Voice responses disabled', 'info');
        
        // Stop any current speech
        speechSynthesis.cancel();
    }
}

function speakText(text) {
    console.log('speakText called:', { isVoiceOutputEnabled, speechSynthesis: !!speechSynthesis, voicesLoaded, text: text.substring(0, 50) });
    
    if (!isVoiceOutputEnabled) {
        console.log('Voice output not enabled');
        return;
    }
    
    if (!speechSynthesis) {
        console.error('Speech synthesis not supported');
        addActivityMessage('Text-to-speech not supported', 'error');
        return;
    }
    
    if (!voicesLoaded) {
        console.log('Voices not loaded yet, trying to load...');
        loadVoices();
        // Retry after a short delay
        setTimeout(() => speakText(text), 1000);
        return;
    }
    
    // Cancel any ongoing speech
    speechSynthesis.cancel();
    
    // Clean up text for speech
    const cleanText = text
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
        .replace(/\*(.*?)\*/g, '$1')     // Remove italic markdown
        .replace(/`(.*?)`/g, '$1')       // Remove code markdown
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
        .replace(/#+\s*/g, '')           // Remove headers
        .replace(/\n+/g, '. ')           // Replace newlines with periods
        .trim();
    
    if (cleanText.length === 0) {
        console.log('No text to speak after cleaning');
        return;
    }
    
    console.log('Creating utterance for text:', cleanText.substring(0, 100));
    
    try {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        if (selectedVoice) {
            utterance.voice = selectedVoice;
            console.log('Using voice:', selectedVoice.name);
        } else {
            console.warn('No voice selected, using default');
        }
        
        utterance.rate = 0.9;    // Slightly slower for clarity
        utterance.pitch = 1.0;   // Normal pitch
        utterance.volume = 0.8;  // Slightly quieter
        
        utterance.onstart = () => {
            console.log('Speech started');
            addActivityMessage('Speaking response...', 'info');
            voiceOutputBtn?.classList.add('speaking');
        };
        
        utterance.onend = () => {
            console.log('Speech ended');
            addActivityMessage('Finished speaking', 'success');
            voiceOutputBtn?.classList.remove('speaking');
        };
        
        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event.error, event);
            addActivityMessage(`Speech error: ${event.error}`, 'error');
            voiceOutputBtn?.classList.remove('speaking');
        };
        
        console.log('Starting speech synthesis...');
        speechSynthesis.speak(utterance);
        
    } catch (error) {
        console.error('Error creating speech utterance:', error);
        addActivityMessage('Failed to create speech', 'error');
        voiceOutputBtn?.classList.remove('speaking');
    }
}

// Make test function available globally
window.testTextInput = testTextInput;
