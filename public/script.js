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

// State
let isAutomationRunning = false;
let currentScript = '';
// Removed: uploadedFilesList - file upload functionality removed
let chatMinimized = false;
let browserViewWindow = null;
let currentSessionId = null;
let isExploreMode = false;
let isAvatarPanelOpen = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    updateConnectionStatus(false);
    addActivityMessage('Dakota initialized. Ready to help!', 'success');
    
    // Initialize activity display
    updateActivityDisplay();
    
    // Initialize dynamic layout
    initializeDynamicLayout();
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
            if (e.key === 'Enter') {
            e.preventDefault();
            sendChatMessage();
        }
    });
        
        // Test click handler
        chatInput.addEventListener('click', () => {
            console.log('Input clicked');
        });
        
        // Test focus handler
        chatInput.addEventListener('focus', () => {
            console.log('Input focused');
        });
        
        // Test input handler
        chatInput.addEventListener('input', (e) => {
            console.log('Input value:', e.target.value);
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
    try {
        // Get debug info from Browserbase
        const response = await fetch(`/api/session/${sessionId}/debug`);
        const debugInfo = await response.json();
        
        if (debugInfo.debuggerFullscreenUrl) {
            // Update the browser view in modal
            const browserView = document.getElementById('browserView');
            
            // Replace content with iframe
                browserView.innerHTML = `
                    <iframe 
                        src="${debugInfo.debuggerFullscreenUrl}"
                        style="width: 100%; height: 100%; border: none;"
                        title="Live Browser Automation">
                    </iframe>
                `;
                
                currentSessionId = sessionId;
            addActivityMessage('🎬 Live browser view loaded!', 'success');
        } else {
            throw new Error('Debug URL not available');
        }
    } catch (error) {
        console.error('Failed to load browser view:', error);
        addActivityMessage('⚠️ Failed to load live browser view. Using external link.', 'warning');
        
        // Show error in browser panel
        const browserView = document.getElementById('browserView');
        browserView.innerHTML = `
            <div class="placeholder error">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Browser View Unavailable</h3>
                <p>Unable to load live view. Click below to open externally.</p>
                <button onclick="openExternalBrowserView('${sessionId}')" class="btn btn-primary">
                    <i class="fas fa-external-link-alt"></i> Open External View
                </button>
            </div>
        `;
    }
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
    minimizedSidebar?.addEventListener('click', toggleSidebar);
    closeBrowserBtn?.addEventListener('click', exitExploreMode);
    
    // Update explore button text
    if (exploreBtn) {
        const btnText = exploreBtn.querySelector('.btn-text');
        if (btnText) {
            btnText.textContent = 'Web Explore';
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

// Make test function available globally
window.testTextInput = testTextInput;
