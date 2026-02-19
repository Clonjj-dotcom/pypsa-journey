// PyPSA Energy Journey - Main App
// Tab-based navigation with banner

// State
let currentTab = 'generator';
let currentGenScreen = 0;
const totalGenScreens = 6;

let journeyState = {
    countries: [],
    ambition: 80,
    selectedTechs: ['solar', 'onwind'],
    storage: {
        battery: 4,
        hydrogen: 168
    },
    speed: {
        clusters: 40,
        resolution: 3
    }
};

// PyPSA Base Data
let baseData = {
    '2025': {
        totalCost: 49.55,
        avgPrice: 1557,
        peakDemand: 4155,
        renewableShare: 45
    },
    '2050': {
        totalCost: 41.14,
        avgPrice: 121,
        peakDemand: 7862,
        renewableShare: 65
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // Start with generator tab
    switchTab('generator');
    initGenerator();
}

// ==================== TAB SWITCHING ====================

function switchTab(tab) {
    currentTab = tab;
    
    // Update banner tabs
    document.querySelectorAll('.banner-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`tab-${tab}`).classList.add('active');
    
    // Show/hide generator progress bar
    const progressBar = document.getElementById('generatorProgress');
    if (progressBar) {
        progressBar.style.display = tab === 'generator' ? 'block' : 'none';
    }
    
    // Tab-specific init
    if (tab === 'results') {
        initBaseResults();
    } else if (tab === 'custom') {
        updateCustomResults();
    }
}

// ==================== GENERATOR NAVIGATION ====================

function initGenerator() {
    initMap();
    initSliders();
    initTechCards();
    updateGeneratorProgress();
    showGenScreen(0);
}

function showGenScreen(index) {
    currentGenScreen = index;
    
    // Hide all screens
    document.querySelectorAll('.gen-screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show current screen
    const screen = document.querySelector(`.gen-screen[data-screen="${index}"]`);
    if (screen) {
        screen.classList.add('active');
    }
    
    // Update progress
    updateGeneratorProgress();
    
    // Update step indicators
    document.querySelectorAll('.progress-steps .step').forEach((step, i) => {
        step.classList.toggle('active', i === index);
    });
}

function nextGenScreen() {
    if (currentGenScreen < totalGenScreens - 1) {
        showGenScreen(currentGenScreen + 1);
    }
}

function prevGenScreen() {
    if (currentGenScreen > 0) {
        showGenScreen(currentGenScreen - 1);
    }
}

function updateGeneratorProgress() {
    const fill = document.getElementById('generatorProgressFill');
    if (fill) {
        const progress = ((currentGenScreen + 1) / totalGenScreens) * 100;
        fill.style.width = `${progress}%`;
    }
}

// ==================== MAP ====================

function initMap() {
    const countries = document.querySelectorAll('.country');
    countries.forEach(country => {
        country.addEventListener('click', () => toggleCountry(country.id));
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
}

function selectPreset(preset) {
    const presets = {
        'eu-core': ['DE', 'FR', 'IT', 'ES', 'PL'],
        'renewables-leaders': ['ES', 'DE', 'DK'],
        'all': ['DE', 'FR', 'IT', 'ES', 'GB', 'PL', 'NO', 'SE', 'NL', 'BE', 'CH', 'AT', 'CZ']
    };
    
    document.querySelectorAll('.country').forEach(c => c.classList.remove('selected'));
    journeyState.countries = [];
    
    const selected = presets[preset] || [];
    selected.forEach(id => {
        const country = document.getElementById(id);
        if (country) {
            country.classList.add('selected');
            journeyState.countries.push(id);
        }
    });
    
    updateCountryDisplay();
}

function clearAll() {
    document.querySelectorAll('.country').forEach(c => c.classList.remove('selected'));
    journeyState.countries = [];
    updateCountryDisplay();
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
    // Ambition slider
    const ambitionSlider = document.getElementById('ambitionSlider');
    if (ambitionSlider) {
        ambitionSlider.value = journeyState.ambition;
        ambitionSlider.addEventListener('input', (e) => {
            journeyState.ambition = parseInt(e.target.value);
            updateAmbitionDisplay();
        });
        updateAmbitionDisplay();
    }
    
    // Storage sliders
    const batterySlider = document.getElementById('batteryDuration');
    if (batterySlider) {
        batterySlider.value = journeyState.storage.battery;
        batterySlider.addEventListener('input', (e) => {
            journeyState.storage.battery = parseInt(e.target.value);
            document.getElementById('batteryDurationValue').textContent = `${e.target.value}h`;
        });
    }
    
    const hydrogenSlider = document.getElementById('hydrogenDuration');
    if (hydrogenSlider) {
        hydrogenSlider.value = journeyState.storage.hydrogen;
        hydrogenSlider.addEventListener('input', (e) => {
            journeyState.storage.hydrogen = parseInt(e.target.value);
            const hours = parseInt(e.target.value);
            const label = hours >= 168 ? '168h (1 week)' : `${hours}h`;
            document.getElementById('hydrogenDurationValue').textContent = label;
        });
    }
    
    // Speed sliders
    const clustersSlider = document.getElementById('clustersSlider');
    if (clustersSlider) {
        clustersSlider.value = journeyState.speed.clusters;
        clustersSlider.addEventListener('input', (e) => {
            journeyState.speed.clusters = parseInt(e.target.value);
            document.getElementById('clustersValue').textContent = e.target.value;
        });
    }
    
    const resolutionSlider = document.getElementById('resolutionSlider');
    if (resolutionSlider) {
        resolutionSlider.value = getResolutionIndex(journeyState.speed.resolution);
        resolutionSlider.addEventListener('input', (e) => {
            const resolutions = [1, 3, 6, 12];
            journeyState.speed.resolution = resolutions[parseInt(e.target.value)];
            document.getElementById('resolutionValue').textContent = `${journeyState.speed.resolution}h`;
        });
    }
}

function getResolutionIndex(res) {
    const resolutions = [1, 3, 6, 12];
    return resolutions.indexOf(res);
}

function updateAmbitionDisplay() {
    const valueEl = document.getElementById('ambitionValue');
    const tempEl = document.getElementById('tempImpact');
    const co2El = document.getElementById('co2Impact');
    
    if (valueEl) valueEl.textContent = `${journeyState.ambition}%`;
    
    const tempRise = 2.5 - (journeyState.ambition / 100 * 1.7);
    if (tempEl) tempEl.textContent = `+${tempRise.toFixed(1)}°C`;
    if (co2El) co2El.textContent = `-${journeyState.ambition}%`;
}

// ==================== TECH CARDS ====================

function initTechCards() {
    document.querySelectorAll('.tech-card').forEach(card => {
        const techId = card.dataset.tech;
        if (journeyState.selectedTechs.includes(techId)) {
            card.classList.add('selected');
        }
    });
    updateTechCount();
}

function toggleTech(techId) {
    const index = journeyState.selectedTechs.indexOf(techId);
    const card = document.querySelector(`.tech-card[data-tech="${techId}"]`);
    
    if (index === -1) {
        journeyState.selectedTechs.push(techId);
        if (card) card.classList.add('selected');
    } else {
        journeyState.selectedTechs.splice(index, 1);
        if (card) card.classList.remove('selected');
    }
    
    updateTechCount();
}

function updateTechCount() {
    const count = document.getElementById('techCount');
    if (count) count.textContent = journeyState.selectedTechs.length;
}

// ==================== YAML GENERATION ====================

function generateYAML() {
    const yaml = buildYAML();
    const output = document.getElementById('yamlOutput');
    
    if (output) {
        output.textContent = yaml;
    }
    
    // Enable download
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) downloadBtn.disabled = false;
    
    // Update summary
    updateYAMLSummary();
}

function buildYAML() {
    const { countries, ambition, selectedTechs, storage, speed } = journeyState;
    
    const generators = selectedTechs.filter(t => 
        ['solar', 'onwind', 'offwind', 'hydro', 'nuclear', 'ccgt', 'biomass'].includes(t)
    );
    const stores = selectedTechs.filter(t => 
        ['battery', 'hydrogen', 'pumped'].includes(t)
    );
    
    let yaml = `# PyPSA-Eur Configuration\n`;
    yaml += `# Generated by Energy Journey\n`;
    yaml += `# Date: ${new Date().toISOString().split('T')[0]}\n\n`;
    
    yaml += `run:\n`;
    yaml += `  name: energy-journey-${Date.now()}\n\n`;
    
    yaml += `countries:\n`;
    const finalCountries = countries.length > 0 ? countries : ['DE'];
    finalCountries.forEach(c => yaml += `  - ${c}\n`);
    yaml += `\n`;
    
    yaml += `scenario:\n`;
    yaml += `  clusters: [${speed.clusters}]\n\n`;
    
    yaml += `electricity:\n`;
    yaml += `  co2limit_enable: ${ambition > 0 ? 'true' : 'false'}\n`;
    if (ambition > 0) {
        const co2limit = ambition >= 90 ? 0 : ambition >= 70 ? 20e6 : 50e6;
        yaml += `  co2limit: ${co2limit}\n`;
    }
    yaml += `  extendable_carriers:\n`;
    yaml += `    Generator: [${generators.join(', ') || 'solar, onwind'}]\n`;
    if (stores.length > 0) {
        yaml += `    Store: [${stores.join(', ')}]\n`;
    }
    yaml += `\n`;
    
    if (stores.length > 0) {
        yaml += `  max_hours:\n`;
        if (selectedTechs.includes('battery')) {
            yaml += `    battery: ${storage.battery}\n`;
        }
        if (selectedTechs.includes('hydrogen')) {
            yaml += `    H2: ${storage.hydrogen}\n`;
        }
        yaml += `\n`;
    }
    
    yaml += `clustering:\n`;
    yaml += `  temporal:\n`;
    yaml += `    resolution_elec: ${speed.resolution}h\n\n`;
    
    yaml += `solver:\n`;
    yaml += `  name: gurobi\n`;
    yaml += `  threads: 4\n\n`;
    
    yaml += `# Ready for PyPSA-Eur\n`;
    
    return yaml;
}

function downloadYAML() {
    const yaml = buildYAML();
    const blob = new Blob([yaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `pypsa-config-${new Date().toISOString().split('T')[0]}.yaml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function updateYAMLSummary() {
    const countriesEl = document.getElementById('summaryCountries');
    const ambitionEl = document.getElementById('summaryAmbition');
    const techsEl = document.getElementById('summaryTechs');
    
    if (countriesEl) {
        countriesEl.textContent = journeyState.countries.length > 0 
            ? journeyState.countries.slice(0, 4).join(', ') + (journeyState.countries.length > 4 ? '...' : '')
            : 'DE (default)';
    }
    
    if (ambitionEl) {
        ambitionEl.textContent = `${journeyState.ambition}% reduction`;
    }
    
    if (techsEl) {
        techsEl.textContent = `${journeyState.selectedTechs.length} selected`;
    }
}

// ==================== BASE RESULTS ====================

function initBaseResults() {
    switchBaseYear('2025');
}

function switchBaseYear(year) {
    // Update buttons
    document.querySelectorAll('.year-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.year === year);
    });
    
    // Update display
    if (year === 'compare') {
        showComparison();
    } else {
        showYearData(year);
    }
}

function showYearData(year) {
    const data = baseData[year];
    
    document.getElementById('baseTotalCost').textContent = `€${data.totalCost}B`;
    document.getElementById('baseAvgPrice').textContent = `€${data.avgPrice}`;
    document.getElementById('basePeakDemand').textContent = data.peakDemand;
    document.getElementById('baseRenewableShare').textContent = `${data.renewableShare}%`;
}

function showComparison() {
    // Build comparison table
    const tbody = document.getElementById('baseComparisonTable');
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td>Total Cost</td>
            <td>€${baseData['2025'].totalCost}B</td>
            <td>€${baseData['2050'].totalCost}B</td>
            <td style="color: #00ff88">-17%</td>
        </tr>
        <tr>
            <td>Avg Price</td>
            <td>€${baseData['2025'].avgPrice}/MWh</td>
            <td>€${baseData['2050'].avgPrice}/MWh</td>
            <td style="color: #00ff88">-92%</td>
        </tr>
        <tr>
            <td>Peak Demand</td>
            <td>${baseData['2025'].peakDemand} MW</td>
            <td>${baseData['2050'].peakDemand} MW</td>
            <td style="color: #ffaa00">+89%</td>
        </tr>
    `;
}

// ==================== CUSTOM RESULTS ====================

function updateCustomResults() {
    // Calculate projected values
    const cost = 41.14 + (journeyState.ambition - 80) * 0.1;
    const co2 = -Math.round(journeyState.ambition * 0.9);
    const renewable = Math.round(50 + journeyState.selectedTechs.filter(t => 
        ['solar', 'onwind', 'offwind', 'hydro'].includes(t)
    ).length * 8);
    
    document.getElementById('projCost').textContent = `€${cost.toFixed(1)}B`;
    document.getElementById('projCO2').textContent = `${co2}%`;
    document.getElementById('projRenewable').textContent = `${Math.min(renewable, 95)}%`;
}
