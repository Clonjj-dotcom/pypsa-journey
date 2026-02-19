// PyPSA Energy Journey - Main JavaScript
// State management and navigation

const screens = ['welcome', 'ambition', 'mix', 'storage', 'speed', 'results', 'yaml'];
let currentScreenIndex = 0;

// State object (synced with localStorage)
let journeyState = {
    countries: [],
    ambition: 66,
    renewablesConfidence: 66,
    storageImportance: 50,
    transitionSpeed: 33,
    fossilReliance: 33
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    initMap();
    initSliders();
    initCharts();
    updateProgress();
    updateUI();
});

// ==================== NAVIGATION ====================

function nextScreen() {
    if (currentScreenIndex < screens.length - 1) {
        saveState();
        currentScreenIndex++;
        showScreen(currentScreenIndex);
    }
}

function prevScreen() {
    if (currentScreenIndex > 0) {
        currentScreenIndex--;
        showScreen(currentScreenIndex);
    }
}

function showScreen(index) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show current screen
    const screenId = `screen-${screens[index]}`;
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('active');
    }
    
    // Update progress
    updateProgress();
    
    // Update progress labels
    document.querySelectorAll('.progress-labels span').forEach((label, i) => {
        label.classList.toggle('active', i === index);
    });
    
    // Update charts if on ambition screen
    if (screens[index] === 'ambition') {
        updateAmbitionChart();
    }
}

function updateProgress() {
    const progress = ((currentScreenIndex + 1) / screens.length) * 100;
    const fill = document.getElementById('progressFill');
    if (fill) {
        fill.style.width = `${progress}%`;
    }
}

// ==================== STATE MANAGEMENT ====================

function saveState() {
    localStorage.setItem('pypsaJourney', JSON.stringify(journeyState));
}

function loadState() {
    const saved = localStorage.getItem('pypsaJourney');
    if (saved) {
        journeyState = { ...journeyState, ...JSON.parse(saved) };
    }
}

// ==================== MAP INTERACTION ====================

function initMap() {
    const countries = document.querySelectorAll('.country');
    
    countries.forEach(country => {
        country.addEventListener('click', () => toggleCountry(country.id));
        
        // Restore selection from state
        if (journeyState.countries.includes(country.id)) {
            country.classList.add('selected');
        }
    });
    
    updateCountryDisplay();
}

function toggleCountry(countryId) {
    const country = document.getElementById(countryId);
    const index = journeyState.countries.indexOf(countryId);
    
    if (index === -1) {
        journeyState.countries.push(countryId);
        country.classList.add('selected');
    } else {
        journeyState.countries.splice(index, 1);
        country.classList.remove('selected');
    }
    
    updateCountryDisplay();
    saveState();
}

function selectPreset(preset) {
    const presets = {
        'eu-core': ['DE', 'FR', 'IT', 'ES', 'PL'],
        'renewables-leaders': ['ES', 'DE', 'DK'],
        'all': ['DE', 'FR', 'IT', 'ES', 'GB', 'PL', 'NO', 'SE', 'NL', 'BE']
    };
    
    // Clear current
    document.querySelectorAll('.country').forEach(c => c.classList.remove('selected'));
    journeyState.countries = [];
    
    // Apply preset
    const selected = presets[preset] || [];
    selected.forEach(id => {
        const country = document.getElementById(id);
        if (country) {
            country.classList.add('selected');
            journeyState.countries.push(id);
        }
    });
    
    updateCountryDisplay();
    saveState();
}

function clearAll() {
    document.querySelectorAll('.country').forEach(c => c.classList.remove('selected'));
    journeyState.countries = [];
    updateCountryDisplay();
    saveState();
}

function updateCountryDisplay() {
    const count = document.getElementById('selectedCount');
    const list = document.getElementById('selectedList');
    
    if (count) count.textContent = journeyState.countries.length;
    
    if (list) {
        list.innerHTML = journeyState.countries.map(code => {
            const country = document.getElementById(code);
            const name = country ? country.dataset.name : code;
            return `<span class="country-tag">${name}</span>`;
        }).join('');
    }
}

// ==================== SLIDERS ====================

function initSliders() {
    const ambitionSlider = document.getElementById('ambitionSlider');
    if (ambitionSlider) {
        ambitionSlider.value = journeyState.ambition;
        ambitionSlider.addEventListener('input', (e) => {
            journeyState.ambition = parseInt(e.target.value);
            updateAmbitionUI();
            updateAmbitionChart();
            saveState();
        });
        updateAmbitionUI();
    }
}

function updateAmbitionUI() {
    const valueEl = document.getElementById('ambitionValue');
    const tempEl = document.getElementById('tempImpact');
    const co2El = document.getElementById('co2Impact');
    
    if (valueEl) valueEl.textContent = `${journeyState.ambition}%`;
    
    // Calculate impacts (simplified model)
    const tempRise = 2.5 - (journeyState.ambition / 100 * 1.5);
    if (tempEl) tempEl.textContent = `+${tempRise.toFixed(1)}°C`;
    if (co2El) co2El.textContent = `-${journeyState.ambition}%`;
}

function updateUI() {
    updateCountryDisplay();
    updateAmbitionUI();
}

// ==================== CHARTS ====================

let ambitionChart = null;

function initCharts() {
    // Ambition chart will be initialized when screen is shown
}

function updateAmbitionChart() {
    const ctx = document.getElementById('ambitionChart');
    if (!ctx) return;
    
    const ambition = journeyState.ambition;
    const years = [2025, 2030, 2035, 2040, 2045, 2050];
    
    // Generate trajectory based on ambition
    const baseline = [100, 95, 90, 85, 80, 75]; // MtCO2 baseline
    const target = baseline.map((val, i) => {
        const reduction = (ambition / 100) * (i / 5); // Linear reduction to target
        return val * (1 - reduction);
    });
    
    if (ambitionChart) {
        ambitionChart.destroy();
    }
    
    ambitionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [{
                label: 'Emissions Baseline',
                data: baseline,
                borderColor: '#ff6464',
                backgroundColor: 'rgba(255, 100, 100, 0.1)',
                fill: true,
                tension: 0.4
            }, {
                label: 'Your Scenario',
                data: target,
                borderColor: '#00ff88',
                backgroundColor: 'rgba(0, 255, 136, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#9ca3af' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'MtCO₂',
                        color: '#9ca3af'
                    },
                    ticks: { color: '#9ca3af' },
                    grid: { color: '#1f2937' }
                },
                x: {
                    ticks: { color: '#9ca3af' },
                    grid: { color: '#1f2937' }
                }
            }
        }
    });
}

// ==================== YAML GENERATION ====================

function generateYAML() {
    const yaml = generateYAMLOutput();
    const output = document.getElementById('yamlOutput');
    if (output) {
        output.textContent = yaml;
    }
    saveState();
}

function generateYAMLOutput() {
    const { countries, ambition, renewablesConfidence, storageImportance, transitionSpeed } = journeyState;
    
    let yaml = `# PyPSA-Eur Configuration\n`;
    yaml += `# Generated by Energy Journey\n`;
    yaml += `# Target: ${ambition}% CO₂ reduction by 2050\n\n`;
    
    yaml += `run:\n`;
    yaml += `  name: energy-journey-${new Date().toISOString().slice(0, 10)}\n\n`;
    
    yaml += `countries:\n`;
    countries.forEach(c => {
        yaml += `  - ${c}\n`;
    });
    yaml += `\n`;
    
    // Ambition → CO2 settings
    const co2limit = ambition >= 80 ? 10e6 : ambition >= 50 ? 50e6 : 100e6;
    yaml += `electricity:\n`;
    yaml += `  co2limit_enable: ${ambition > 0 ? 'true' : 'false'}\n`;
    yaml += `  co2limit: ${co2limit}\n\n`;
    
    // Transition speed → clusters
    const clusters = transitionSpeed >= 66 ? 50 : transitionSpeed >= 33 ? 40 : 20;
    yaml += `scenario:\n`;
    yaml += `  clusters: [${clusters}]\n\n`;
    
    yaml += `# Generated configuration ready for PyPSA-Eur\n`;
    
    return yaml;
}

function downloadYAML() {
    const yaml = generateYAMLOutput();
    const blob = new Blob([yaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `pypsa-config-${new Date().toISOString().slice(0, 10)}.yaml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
