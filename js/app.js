// ==========================================
// PyPSA Energy Journey - SIMPLIFIED APP.JS
// ==========================================

// Global app state
let currentTab = 'generator';
let currentSubTab = '6h';

// ==========================================
// TAB SWITCHING - MAIN TABS
// ==========================================
function switchTab(tab) {
    console.log('Switching to tab:', tab);
    currentTab = tab;
    
    // Update main tab buttons
    document.querySelectorAll('.banner-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    // Show/hide main sections
    document.querySelectorAll('.tab-content').forEach(section => {
        section.classList.remove('active');
    });
    
    const activeSection = document.getElementById(`tab-${tab}`);
    if (activeSection) {
        activeSection.classList.add('active');
    }
    
    // Initialize tab-specific content
    if (tab === 'results') {
        initBaseResults();
    }
}

// ==========================================
// SUB-TAB SWITCHING - BASE RESULTS
// ==========================================
function switchSubTab(subtab) {
    console.log('Switching to sub-tab:', subtab);
    currentSubTab = subtab;
    
    // Update sub-tab buttons
    document.querySelectorAll('.sub-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.subtab === subtab);
    });
    
    // Show/hide sub-tab content
    document.querySelectorAll('.subtab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const activeContent = document.getElementById(`subtab-${subtab}`);
    if (activeContent) {
        activeContent.classList.add('active');
    }
    
    console.log('Sub-tab switched to:', subtab);
}

// ==========================================
// INITIALIZATION
// ==========================================
function initApp() {
    console.log('Initializing PyPSA Journey...');
    
    // Set initial state
    currentTab = 'generator';
    currentSubTab = '6h';
    
    // Initialize default tab
    switchTab('generator');
    
    console.log('App initialized successfully');
}

function initBaseResults() {
    console.log('Initializing Base Results...');
    // Default to 6h resolution
    switchSubTab('6h');
}

// ==========================================
// DOM READY - Initialize app when DOM is ready
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    initApp();
});
