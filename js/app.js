// PyPSA Energy Journey - Main App
// Tab-based navigation with banner

// REAL DATA from PyPSA simulations (germany-2025-true-baseline-v2)
const baseDataReal = {
    '2025-6h': {
        totalCost: 89.25,
        avgPrice: 38.5,
        dhPenetration: 14.2,
        co2Emissions: 310.5,
        renewableShare: 42,
        peakDemand: 125000,
        totalGeneration: 580000,
        peakHeat: 85000,
        tesCapacity: 45,
        electrification: 35
    },
    '2025-12h': {
        totalCost: 89.25,
        avgPrice: 38.5,
        dhPenetration: 14.2,
        co2Emissions: 315.2,
        renewableShare: 41,
        peakDemand: 128000,
        totalGeneration: 585000,
        peakHeat: 87000,
        tesCapacity: 43,
        electrification: 34
    }
};

// State
let currentTab = 'generator';
let currentGenScreen = 0;
const totalGenScreens = 7;  // 0:Countries, 1:Temporal, 2:CO2, 3:Tech, 4:Storage, 5:Pendientes, 6:Generate

let journeyState = {
    countries: [],
    timePeriod: 'quarter',
    snapshot: 2024,
    horizon: 2050,
    nodes: 40,
    co2Political: 100,
    co2Mechanism: 'none',
    co2CapLevel: 75,
    co2Price: 100,
    selectedTechs: ['solar', 'onwind'],
    techCapacities: {},
    storage: {
        battery: 4,
        hydrogen: 168
    },
    speed: {
        clusters: 40,
        resolution: 3
    },
    sectors: [],
    foresight: 'overnight'
};

let baseData = {};

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

function selectSnapshot(year) {
    journeyState.snapshot = year;
    
    // Update UI
    document.querySelectorAll('.year-card').forEach(card => {
        card.classList.toggle('active', parseInt(card.dataset.year) === year);
    });
    
    updateTemporalDisplay();
}

// ==================== TIME PERIOD ====================

function selectTimePeriod(period) {
    if (!period || !timePeriodConfig[period]) {
        console.warn('Invalid time period:', period);
        return;
    }
    
    journeyState.timePeriod = period;
    
    // Update UI safely
    const cards = document.querySelectorAll('.time-card');
    if (cards.length === 0) {
        console.warn('No time cards found');
        return;
    }
    
    cards.forEach(card => {
        const isActive = card.dataset.time === period;
        card.classList.toggle('active', isActive);
    });
    
    updateTemporalDisplay();
    
    // Log para debug
    console.log('Time period selected:', period, timePeriodConfig[period]);
}

const timePeriodConfig = {
    week: { days: 7, label: 'Week', hours: 168 },
    month: { days: 30, label: 'Month', hours: 720 },
    quarter: { days: 90, label: 'Quarter', hours: 2160 },
    semester: { days: 180, label: 'Semester', hours: 4320 },
    year: { days: 365, label: 'Year', hours: 8760 }
};

// ==================== NODES ====================

function setNodes(count) {
    journeyState.nodes = count;
    
    // Update slider
    const slider = document.getElementById('nodesSlider');
    if (slider) slider.value = count;
    
    // Update value display
    const valueEl = document.getElementById('nodesValue');
    if (valueEl) valueEl.textContent = count;
    
    // Update chips
    document.querySelectorAll('.nodes-presets .preset-chip').forEach(chip => {
        chip.classList.toggle('active', parseInt(chip.textContent) === count);
    });
    
    // Update description
    const descEl = document.getElementById('nodesDesc');
    if (descEl) {
        if (count <= 10) descEl.textContent = 'Low resolution - fast, coarse';
        else if (count <= 40) descEl.textContent = 'Medium resolution - good balance';
        else if (count <= 100) descEl.textContent = 'High resolution - detailed, slower';
        else descEl.textContent = 'Very high resolution - most detailed';
    }
    
    updateTemporalDisplay();
}

function updateNodes(value) {
    const count = parseInt(value);
    journeyState.nodes = count;
    
    // Update value display
    const valueEl = document.getElementById('nodesValue');
    if (valueEl) valueEl.textContent = count;
    
    // Update chips (none active if custom value)
    document.querySelectorAll('.nodes-presets .preset-chip').forEach(chip => {
        chip.classList.toggle('active', parseInt(chip.textContent) === count);
    });
    
    // Update description
    const descEl = document.getElementById('nodesDesc');
    if (descEl) {
        if (count <= 10) descEl.textContent = 'Low resolution - fast, coarse';
        else if (count <= 40) descEl.textContent = 'Medium resolution - good balance';
        else if (count <= 100) descEl.textContent = 'High resolution - detailed, slower';
        else descEl.textContent = 'Very high resolution - most detailed';
    }
    
    updateTemporalDisplay();
}

function setHorizon(year) {
    journeyState.horizon = year;
    
    // Update input
    const input = document.getElementById('horizonYear');
    if (input) input.value = year;
    
    // Update chips
    document.querySelectorAll('.horizon-presets .preset-chip').forEach(chip => {
        chip.classList.toggle('active', chip.textContent === year.toString());
    });
    
    updateTemporalDisplay();
}

function updateHorizon(value) {
    const year = parseInt(value);
    if (year >= 2025 && year <= 2100) {
        journeyState.horizon = year;
        
        // Update chips
        document.querySelectorAll('.horizon-presets .preset-chip').forEach(chip => {
            chip.classList.toggle('active', parseInt(chip.textContent) === year);
        });
        
        updateTemporalDisplay();
    }
}

function updateTemporalDisplay() {
    const timeEl = document.getElementById('timeDisplay');
    const snapshotEl = document.getElementById('snapshotDisplay');
    const nodesEl = document.getElementById('nodesDisplay');
    const horizonEl = document.getElementById('horizonDisplay');
    const spanEl = document.getElementById('spanDisplay');
    
    const timeConfig = timePeriodConfig[journeyState.timePeriod];
    
    if (!timeConfig) {
        console.warn('No time config for:', journeyState.timePeriod);
        return;
    }
    
    if (timeEl) {
        timeEl.textContent = `${timeConfig.label} (${timeConfig.days} days)`;
    }
    if (snapshotEl) {
        snapshotEl.textContent = journeyState.snapshot || 'N/A';
    }
    if (nodesEl) {
        nodesEl.textContent = journeyState.nodes || 'N/A';
    }
    if (horizonEl) {
        horizonEl.textContent = journeyState.horizon || 'N/A';
    }
    if (spanEl) {
        const years = (journeyState.horizon || 0) - (journeyState.snapshot || 0);
        spanEl.textContent = `${years} year${years !== 1 ? 's' : ''}`;
    }
}

function initGenerator() {
    initMap();
    initSliders();
    initTechCards();
    selectMechanism(journeyState.co2Mechanism);
    selectCapLevel(journeyState.co2CapLevel);
    selectPrice(journeyState.co2Price);
    selectSnapshot(journeyState.snapshot);
    selectTimePeriod(journeyState.timePeriod);
    setNodes(journeyState.nodes);
    setHorizon(journeyState.horizon);
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
        'group1': ['DE'],
        'group2': ['DE', 'AT', 'CH', 'NL', 'BE', 'FR', 'DK', 'PL', 'CZ', 'LU'],
        'group3': ['DE', 'AT', 'CH', 'NL', 'BE', 'FR', 'DK', 'PL', 'CZ', 'LU', 'SE', 'NO'],
        'group4': ['AL', 'AT', 'BA', 'BE', 'BG', 'CH', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GB', 'GR', 'HR', 'HU', 'IE', 'IS', 'IT', 'LT', 'LU', 'LV', 'ME', 'MK', 'NL', 'NO', 'PL', 'PT', 'RO', 'RS', 'SE', 'SI', 'SK', 'XK']
    };
    
    // Clear current selection safely
    const countries = document.querySelectorAll('.country');
    if (countries.length > 0) {
        countries.forEach(c => c.classList.remove('selected'));
    }
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
    
    // Update visual state of buttons
    const presetBtns = document.querySelectorAll('.preset-btn');
    presetBtns.forEach(btn => btn.classList.remove('active'));
    event?.target?.classList?.add('active');
}

function clearAll() {
    const countries = document.querySelectorAll('.country');
    if (countries.length > 0) {
        countries.forEach(c => c.classList.remove('selected'));
    }
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
    // CO2 Political slider
    const ambitionSlider = document.getElementById('ambitionSlider');
    if (ambitionSlider) {
        ambitionSlider.value = journeyState.co2Political;
        ambitionSlider.addEventListener('input', (e) => {
            journeyState.co2Political = parseInt(e.target.value);
            updateCO2PoliticalDisplay();
        });
        updateCO2PoliticalDisplay();
    }
    
    // CO2 Price slider (when Price mechanism selected)
    const co2PriceSlider = document.getElementById('co2PriceSlider');
    if (co2PriceSlider) {
        co2PriceSlider.value = journeyState.co2Price;
        co2PriceSlider.addEventListener('input', (e) => {
            journeyState.co2Price = parseInt(e.target.value);
            const valueEl = document.getElementById('co2PriceValue');
            if (valueEl) valueEl.textContent = `€${e.target.value}/t`;
            // Also update mechanism label display
            updateCO2PoliticalDisplay();
        });
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
    
    // Speed sliders (now in Temporal screen)
    const clustersSlider = document.getElementById('clustersSlider');
    if (clustersSlider) {
        clustersSlider.value = journeyState.speed.clusters;
        clustersSlider.addEventListener('input', (e) => {
            journeyState.speed.clusters = parseInt(e.target.value);
            document.getElementById('clustersValue').textContent = e.target.value;
            const summary = document.getElementById('clustersDisplay');
            if (summary) summary.textContent = e.target.value;
            // Update preset buttons
            document.querySelectorAll('.resolution-presets .preset-chip').forEach(btn => {
                btn.classList.remove('active');
                if (parseInt(btn.textContent) === parseInt(e.target.value)) {
                    btn.classList.add('active');
                }
            });
        });
    }
    
    const resolutionSlider = document.getElementById('resolutionSlider');
    if (resolutionSlider) {
        resolutionSlider.value = getResolutionIndex(journeyState.speed.resolution);
        resolutionSlider.addEventListener('input', (e) => {
            const resolutions = [1, 3, 6, 12];
            journeyState.speed.resolution = resolutions[parseInt(e.target.value)];
            document.getElementById('resolutionValue').textContent = `${journeyState.speed.resolution}h`;
            const summary = document.getElementById('resolutionDisplay');
            if (summary) summary.textContent = `${journeyState.speed.resolution}h`;
            // Update preset buttons
            const currentRes = `${journeyState.speed.resolution}h`;
            document.querySelectorAll('.resolution-presets .preset-chip').forEach(btn => {
                btn.classList.remove('active');
                if (btn.textContent === currentRes) {
                    btn.classList.add('active');
                }
            });
        });
    }
}

function getResolutionIndex(res) {
    const resolutions = [1, 3, 6, 12];
    return resolutions.indexOf(res);
}

// Model Resolution helpers
function setClusters(value) {
    journeyState.speed.clusters = value;
    const slider = document.getElementById('clustersSlider');
    if (slider) slider.value = value;
    const display = document.getElementById('clustersValue');
    if (display) display.textContent = value;
    const summary = document.getElementById('clustersDisplay');
    if (summary) summary.textContent = value;
    
    // Update preset buttons
    document.querySelectorAll('.resolution-presets .preset-chip').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.textContent) === value);
    });
}

function setResolution(value) {
    journeyState.speed.resolution = value;
    const resIndex = getResolutionIndex(value);
    const slider = document.getElementById('resolutionSlider');
    if (slider) slider.value = resIndex;
    const display = document.getElementById('resolutionValue');
    if (display) display.textContent = `${value}h`;
    const summary = document.getElementById('resolutionDisplay');
    if (summary) summary.textContent = `${value}h`;
    
    // Update preset buttons
    document.querySelectorAll('.resolution-presets .preset-chip').forEach(btn => {
        btn.classList.toggle('active', btn.textContent === `${value}h`);
    });
}

// ==================== CO2 MECHANISM ====================

function selectMechanism(mechanism) {
    journeyState.co2Mechanism = mechanism;
    
    // Update UI
    document.querySelectorAll('.mechanism-card').forEach(card => {
        card.classList.toggle('active', card.dataset.mechanism === mechanism);
    });
    
    // Show/hide appropriate option group
    document.querySelectorAll('.option-group').forEach(group => {
        group.style.display = group.dataset.for === mechanism ? 'block' : 'none';
    });
    
    // Update ambient background
    updateAmbientBackground(mechanism);
    
    // Update summary
    updateCO2Summary();
}

function updateAmbientBackground(mechanism) {
    const bg = document.getElementById('ambientBg');
    if (!bg) return;
    
    // Remove all mechanism classes
    bg.classList.remove('ambient-none', 'ambient-cap', 'ambient-price');
    
    // Add appropriate class
    bg.classList.add(`ambient-${mechanism}`);
}

function selectCapLevel(level) {
    // Handle both old string values and new numeric slider values
    let reduction;
    if (level === 'relaxed' || level === '50') reduction = 50;
    else if (level === 'moderate' || level === '75') reduction = 75;
    else if (level === 'strict' || level === '100') reduction = 100;
    else reduction = parseInt(level) || 75;
    
    journeyState.co2CapLevel = reduction;
    
    // Update slider
    const slider = document.getElementById('co2CapSlider');
    if (slider) slider.value = reduction;
    
    // Update value display
    const valueEl = document.getElementById('co2CapValue');
    if (valueEl) valueEl.textContent = `-${reduction}%`;
    
    // Update presets
    document.querySelectorAll('.cap-preset').forEach(btn => {
        const btnReduction = parseInt(btn.dataset.cap);
        btn.classList.toggle('active', btnReduction === reduction);
    });
    
    // Update impact text
    const impactEl = document.getElementById('capImpact');
    if (impactEl) {
        if (reduction === 0) impactEl.textContent = 'No reduction - high emissions allowed';
        else if (reduction < 50) impactEl.textContent = 'Low ambition - weak climate action';
        else if (reduction < 75) impactEl.textContent = 'Moderate reduction - below EU targets';
        else if (reduction < 90) impactEl.textContent = 'Strong reduction - aligned with Fit for 55';
        else if (reduction < 100) impactEl.textContent = 'Very strong - near Net Zero';
        else impactEl.textContent = 'Net Zero - Full decarbonization required';
    }
    
    // Update context info
    const emissionsEl = document.getElementById('capEmissions');
    const referenceEl = document.getElementById('capReference');
    
    if (emissionsEl) {
        const allowed = 100 - reduction;
        emissionsEl.textContent = allowed === 0 ? '0% (or captured)' : `${allowed}% of baseline`;
    }
    
    if (referenceEl) {
        if (reduction <= 50) referenceEl.textContent = 'Below EU ambition';
        else if (reduction <= 62) referenceEl.textContent = 'EU ETS 2025 (-62%)';
        else if (reduction <= 75) referenceEl.textContent = 'Fit for 55 target';
        else if (reduction <= 90) referenceEl.textContent = 'EU 2040 target (-90%)';
        else referenceEl.textContent = '2050 Net Zero target';
    }
    
    updateCO2Summary();
}

function selectCapSlider(value) {
    const reduction = parseInt(value);
    journeyState.co2CapLevel = reduction;
    
    // Update value display
    const valueEl = document.getElementById('co2CapValue');
    if (valueEl) valueEl.textContent = `-${reduction}%`;
    
    // Update presets (deactivate all since it's a custom value)
    document.querySelectorAll('.cap-preset').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Reactivate if matches a preset
    const matchingPreset = document.querySelector(`.cap-preset[data-cap="${reduction}"]`);
    if (matchingPreset) matchingPreset.classList.add('active');
    
    // Update impact text
    const impactEl = document.getElementById('capImpact');
    if (impactEl) {
        if (reduction === 0) impactEl.textContent = 'No reduction - high emissions allowed';
        else if (reduction < 50) impactEl.textContent = 'Low ambition - weak climate action';
        else if (reduction < 75) impactEl.textContent = 'Moderate reduction - below EU targets';
        else if (reduction < 90) impactEl.textContent = 'Strong reduction - aligned with Fit for 55';
        else if (reduction < 100) impactEl.textContent = 'Very strong - near Net Zero';
        else impactEl.textContent = 'Net Zero - Full decarbonization required';
    }
    
    // Update context info
    const emissionsEl = document.getElementById('capEmissions');
    const referenceEl = document.getElementById('capReference');
    
    if (emissionsEl) {
        const allowed = 100 - reduction;
        emissionsEl.textContent = allowed === 0 ? '0% (or captured)' : `${allowed}% of baseline`;
    }
    
    if (referenceEl) {
        if (reduction <= 50) referenceEl.textContent = 'Below EU ambition';
        else if (reduction <= 62) referenceEl.textContent = 'EU ETS 2025 (-62%)';
        else if (reduction <= 75) referenceEl.textContent = 'Fit for 55 target';
        else if (reduction <= 90) referenceEl.textContent = 'EU 2040 target (-90%)';
        else referenceEl.textContent = '2050 Net Zero target';
    }
    
    updateCO2Summary();
}

function selectPrice(price) {
    const value = parseInt(price);
    journeyState.co2Price = value;
    
    // Update slider
    const slider = document.getElementById('co2PriceSlider');
    if (slider) slider.value = value;
    
    // Update value display
    const valueEl = document.getElementById('co2PriceValue');
    if (valueEl) valueEl.textContent = `€${value}/t`;
    
    // Update presets
    document.querySelectorAll('.price-preset').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.price) === value);
    });
    
    // Update impact text
    const impactEl = document.getElementById('priceImpact');
    if (impactEl) {
        if (value === 0) impactEl.textContent = 'No carbon cost';
        else if (value < 50) impactEl.textContent = 'Weak incentive';
        else if (value < 100) impactEl.textContent = 'Moderate incentive';
        else if (value < 200) impactEl.textContent = 'Strong incentive for renewables';
        else impactEl.textContent = 'Very strong incentive - pushes rapid decarbonization';
    }
    
    updateCO2Summary();
}

function updateCO2Summary() {
    const mechanismEl = document.getElementById('mechanismSummary');
    const targetRow = document.getElementById('targetSummaryRow');
    const targetEl = document.getElementById('targetSummary');
    
    if (mechanismEl) {
        const labels = { none: 'None', cap: 'Cap', price: 'Price' };
        mechanismEl.textContent = labels[journeyState.co2Mechanism];
    }
    
    if (targetRow) {
        if (journeyState.co2Mechanism === 'none') {
            targetRow.style.display = 'none';
        } else if (journeyState.co2Mechanism === 'cap') {
            targetRow.style.display = 'flex';
            const reduction = journeyState.co2CapLevel || 75;
            targetEl.textContent = `-${reduction}% reduction`;
        } else if (journeyState.co2Mechanism === 'price') {
            targetRow.style.display = 'flex';
            targetEl.textContent = `€${journeyState.co2Price}/t`;
        }
    }
}

function updateCO2PoliticalDisplay() {
    const valueEl = document.getElementById('ambitionValue');
    const policyEl = document.getElementById('policyLabel');
    const mechanismIconEl = document.getElementById('mechanismIcon');
    const mechanismLabelEl = document.getElementById('mechanismLabel');
    const target2030El = document.getElementById('target2030');
    const target2040El = document.getElementById('target2040');
    const target2050El = document.getElementById('target2050');
    
    const val = journeyState.co2Political;
    
    // Main slider label
    if (valueEl) {
        if (val === 0) valueEl.textContent = 'No Policy (0%)';
        else if (val < 30) valueEl.textContent = `Low (${val}%)`;
        else if (val < 55) valueEl.textContent = `Fit for 55 (${val}%)`;
        else if (val < 75) valueEl.textContent = `Intermediate (${val}%)`;
        else if (val < 90) valueEl.textContent = `Ambitious (${val}%)`;
        else valueEl.textContent = `Net Zero 2050 (${val}%)`;
    }
    
    // Policy framework label
    if (policyEl) {
        if (val === 0) policyEl.textContent = 'No Policy';
        else if (val < 30) policyEl.textContent = 'Minimal';
        else if (val < 55) policyEl.textContent = 'Paris Lite';
        else if (val < 75) policyEl.textContent = 'EU Green Deal';
        else if (val < 90) policyEl.textContent = 'Green Deal+';
        else policyEl.textContent = 'Net Zero';
    }
    
    // Mechanism display
    if (mechanismIconEl) {
        mechanismIconEl.textContent = journeyState.co2Mechanism === 'none' ? '🚫' :
                                      journeyState.co2Mechanism === 'cap' ? '⛔' : '💶';
    }
    if (mechanismLabelEl) {
        if (journeyState.co2Mechanism === 'none') mechanismLabelEl.textContent = 'None';
        else if (journeyState.co2Mechanism === 'cap') mechanismLabelEl.textContent = 'Cap';
        else mechanismLabelEl.textContent = `€${journeyState.co2Price}/t`;
    }
    
    // Intermediate targets (linear interpolation)
    // 2030: ~30% of the way to 2050 target (historical EU approach)
    // 2040: ~70% of the way to 2050 target
    const target2030 = Math.round(val * 0.3);
    const target2040 = Math.round(val * 0.7);
    
    if (target2030El) target2030El.textContent = `-${Math.min(target2030, 55)}%`;
    if (target2040El) target2040El.textContent = `-${Math.min(target2040, 90)}%`;
    if (target2050El) target2050El.textContent = `-${val}%`;
}

// ==================== TECH CARDS ====================

const techSpecs = {
    // Solar variants
    solar: { minCost: 30, maxCost: 50, cf: 0.15, emissions: 0, category: 'renewable' },
    'solar-rooftop': { minCost: 40, maxCost: 70, cf: 0.13, emissions: 0, category: 'renewable' },
    'solar-hsat': { minCost: 25, maxCost: 45, cf: 0.18, emissions: 0, category: 'renewable' },
    
    // Wind variants (offshore AC/DC/floating)
    onwind: { minCost: 35, maxCost: 55, cf: 0.30, emissions: 0, category: 'renewable' },
    'offwind-ac': { minCost: 45, maxCost: 75, cf: 0.45, emissions: 0, category: 'renewable' },
    'offwind-dc': { minCost: 50, maxCost: 80, cf: 0.48, emissions: 0, category: 'renewable' },
    'offwind-float': { minCost: 55, maxCost: 85, cf: 0.50, emissions: 0, category: 'renewable' },
    
    // Hydro variants
    hydro: { minCost: 20, maxCost: 40, cf: 0.40, emissions: 24, category: 'renewable' },
    'hydro-reservoir': { minCost: 15, maxCost: 30, cf: 0.35, emissions: 24, category: 'renewable' },
    
    // Other renewables
    biomass: { minCost: 60, maxCost: 100, cf: 0.60, emissions: 18, category: 'renewable' },
    geothermal: { minCost: 50, maxCost: 80, cf: 0.80, emissions: 15, category: 'renewable' },
    wave: { minCost: 150, maxCost: 300, cf: 0.25, emissions: 12, category: 'renewable' },
    tidal: { minCost: 120, maxCost: 250, cf: 0.22, emissions: 12, category: 'renewable' },
    
    // Fossil/thermal dispatchable
    ccgt: { minCost: 60, maxCost: 90, cf: 0.60, emissions: 350, category: 'dispatchable' },
    ocgt: { minCost: 100, maxCost: 150, cf: 0.10, emissions: 450, category: 'dispatchable' },
    coal: { minCost: 80, maxCost: 120, cf: 0.50, emissions: 850, category: 'dispatchable' },
    lignite: { minCost: 60, maxCost: 100, cf: 0.55, emissions: 950, category: 'dispatchable' },
    oil: { minCost: 150, maxCost: 250, cf: 0.05, emissions: 700, category: 'dispatchable' },
    nuclear: { minCost: 70, maxCost: 100, cf: 0.85, emissions: 12, category: 'dispatchable' },
    waste: { minCost: 80, maxCost: 140, cf: 0.70, emissions: 450, category: 'dispatchable' },
    
    // Storage technologies
    battery: { minCost: 80, maxCost: 120, cf: null, emissions: 0, category: 'storage' },
    hydrogen: { minCost: 60, maxCost: 150, cf: null, emissions: 0, category: 'storage' },
    pumped: { minCost: 40, maxCost: 80, cf: null, emissions: 0, category: 'storage' },
    caes: { minCost: 100, maxCost: 180, cf: null, emissions: 0, category: 'storage' }
};

function updateTechSummary() {
    const countEl = document.getElementById('techCount');
    const lcoeEl = document.getElementById('lcoeRange');
    const emissionsEl = document.getElementById('avgEmissions');
    
    const selected = journeyState.selectedTechs;
    
    if (countEl) countEl.textContent = selected.length;
    
    if (selected.length === 0) {
        if (lcoeEl) lcoeEl.textContent = '-';
        if (emissionsEl) emissionsEl.textContent = '-';
        return;
    }
    
    // Calculate LCOE range
    let minLCOE = Infinity, maxLCOE = 0;
    let totalEmissions = 0;
    let emissionCount = 0;
    
    selected.forEach(tech => {
        const spec = techSpecs[tech];
        if (spec) {
            minLCOE = Math.min(minLCOE, spec.minCost);
            maxLCOE = Math.max(maxLCOE, spec.maxCost);
            if (spec.emissions !== null) {
                totalEmissions += spec.emissions;
                emissionCount++;
            }
        }
    });
    
    if (lcoeEl) {
        lcoeEl.textContent = `€${minLCOE}-${maxLCOE}/MWh`;
    }
    
    if (emissionsEl) {
        const avgEmissions = emissionCount > 0 ? Math.round(totalEmissions / emissionCount) : 0;
        emissionsEl.textContent = avgEmissions === 0 ? '0 gCO₂/kWh' : `~${avgEmissions} gCO₂/kWh`;
        emissionsEl.style.color = avgEmissions === 0 ? '#10b981' : avgEmissions < 50 ? '#059669' : avgEmissions < 200 ? '#f59e0b' : '#ef4444';
    }
    
    // Calculate and display generation mix
    updateGenerationMix(selected);
}

function updateGenerationMix(selected) {
    // Capacity Factors from PyPSA-Eur (annual averages)
    const capacityFactors = {
        // Solar
        solar: 0.15, 'solar-rooftop': 0.13, 'solar-hsat': 0.18,
        // Wind
        onwind: 0.30, offwind: 0.45, 'offwind-ac': 0.45, 'offwind-dc': 0.48, 'offwind-float': 0.50,
        // Hydro
        hydro: 0.40, 'hydro-reservoir': 0.35,
        // Other renewables
        biomass: 0.60, geothermal: 0.80, wave: 0.25, tidal: 0.22,
        // Fossil
        ccgt: 0.60, ocgt: 0.10, coal: 0.50, lignite: 0.55, oil: 0.05, nuclear: 0.85, waste: 0.70
    };
    
    // Calculate generation contribution (capacity % × CF)
    const generation = {};
    let totalGen = 0;
    let cfSum = 0;
    let cfCount = 0;
    let capacitySum = 0;
    let renewableGen = 0;
    let dispatchableGen = 0;
    const renewableTechs = ['solar', 'solar-rooftop', 'solar-hsat', 'onwind', 'offwind', 'offwind-ac', 'offwind-dc', 'offwind-float', 'hydro', 'hydro-reservoir', 'biomass', 'geothermal', 'wave', 'tidal'];
    const dispatchableTechs = ['ccgt', 'ocgt', 'coal', 'lignite', 'oil', 'nuclear', 'waste'];
    
    selected.forEach(tech => {
        const cf = capacityFactors[tech];
        const capacity = journeyState.techCapacities[tech] || 0;
        
        if (cf && capacity > 0) {
            // Generation = capacity percentage × capacity factor
            const gen = capacity * cf;
            generation[tech] = gen;
            totalGen += gen;
            capacitySum += capacity;
            cfSum += cf;
            cfCount++;
            
            if (renewableTechs.includes(tech)) renewableGen += gen;
            if (dispatchableTechs.includes(tech)) dispatchableGen += gen;
        }
    });
    
    // Calculate percentages based on generation share
    const mix = {};
    Object.entries(generation).forEach(([tech, gen]) => {
        mix[tech] = totalGen > 0 ? Math.round((gen / totalGen) * 100) : 0;
    });
    
    // Sort by percentage
    const sorted = Object.entries(mix).sort((a, b) => b[1] - a[1]).filter(([, pct]) => pct > 0);
    
    // Calculate stats
    const renewableShare = Math.round((renewableGen / totalGen) * 100) || 0;
    const dispatchableShare = Math.round((dispatchableGen / totalGen) * 100) || 0;
    const avgCF = capacitySum > 0 ? Math.round((cfSum / cfCount) * 100) : 0;
    
    // Update UI stats
    const renewableShareEl = document.getElementById('renewableShare');
    const dispatchableBackupEl = document.getElementById('dispatchableBackup');
    const avgCfEl = document.getElementById('avgCapacityFactor');
    
    if (renewableShareEl) renewableShareEl.textContent = totalGen > 0 ? `${renewableShare}%` : '0%';
    if (dispatchableBackupEl) dispatchableBackupEl.textContent = totalGen > 0 ? `${dispatchableShare}%` : '0%';
    if (avgCfEl) avgCfEl.textContent = totalGen > 0 ? `${avgCF}%` : '0%';
    
    // Update visualization
    updateMixChart(sorted);
}

function updateMixChart(sortedTechs) {
    const barContainer = document.querySelector('.mix-bar-container');
    const legend = document.querySelector('.mix-legend');
    
    if (!barContainer || !legend) return;
    
    // Tech colors matching CSS
    const techColors = {
        // Solar variants
        solar: { color: 'linear-gradient(90deg, #fbbf24, #f59e0b)', label: 'Solar PV Utility', icon: '☀️' },
        'solar-rooftop': { color: 'linear-gradient(90deg, #fbbf24, #d97706)', label: 'Solar Rooftop', icon: '🏠' },
        'solar-hsat': { color: 'linear-gradient(90deg, #fbbf24, #d97706)', label: 'Solar Tracking', icon: '🌞' },
        
        // Wind variants (AC/DC/floating)
        onwind: { color: 'linear-gradient(90deg, #34d399, #10b981)', label: 'Onshore Wind', icon: '🌬️' },
        offwind: { color: 'linear-gradient(90deg, #3b82f6, #1d4ed8)', label: 'Offshore Wind AC', icon: '⚡' },
        'offwind-ac': { color: 'linear-gradient(90deg, #3b82f6, #1d4ed8)', label: 'Offshore Wind AC', icon: '⚡' },
        'offwind-dc': { color: 'linear-gradient(90deg, #0ea5e9, #0284c7)', label: 'Offshore Wind HVDC', icon: '🔌' },
        'offwind-float': { color: 'linear-gradient(90deg, #06b6d4, #0891b2)', label: 'Offshore Floating', icon: '🌊' },
        
        // Hydro variants
        hydro: { color: 'linear-gradient(90deg, #06b6d4, #0891b2)', label: 'Run-of-River Hydro', icon: '💧' },
        'hydro-reservoir': { color: 'linear-gradient(90deg, #22c55e, #16a34a)', label: 'Reservoir Hydro', icon: '🏞️' },
        
        // Other renewables
        biomass: { color: 'linear-gradient(90deg, #84cc16, #65a30d)', label: 'Biomass', icon: '🌱' },
        geothermal: { color: 'linear-gradient(90deg, #dc2626, #b91c1c)', label: 'Geothermal', icon: '🌋' },
        wave: { color: 'linear-gradient(90deg, #0ea5e9, #0284c7)', label: 'Wave', icon: '🌊' },
        tidal: { color: 'linear-gradient(90deg, #6366f1, #4f46e5)', label: 'Tidal', icon: '🌙' },
        
        // Fossil/thermal
        ccgt: { color: 'linear-gradient(90deg, #f97316, #ea580c)', label: 'Natural Gas CCGT', icon: '🔥' },
        ocgt: { color: 'linear-gradient(90deg, #f43f5e, #e11d48)', label: 'Gas Peaker', icon: '🔧' },
        coal: { color: 'linear-gradient(90deg, #6b7280, #374151)', label: 'Coal', icon: '🪨' },
        lignite: { color: 'linear-gradient(90deg, #92400e, #78350f)', label: 'Lignite', icon: '🟤' },
        oil: { color: 'linear-gradient(90deg, #18181b, #09090b)', label: 'Oil', icon: '⛽' },
        nuclear: { color: 'linear-gradient(90deg, #a855f7, #7c3aed)', label: 'Nuclear', icon: '⚛️' },
        waste: { color: 'linear-gradient(90deg, #10b981, #059669)', label: 'Waste-to-Energy', icon: '♻️' }
    };
    
    // Build bars
    let barsHTML = '';
    sortedTechs.forEach(([tech, pct]) => {
        if (techColors[tech]) {
            barsHTML += `<div class="mix-bar ${tech}-bar" style="width: ${pct}%; background: ${techColors[tech].color};" title="${techColors[tech].label}: ${pct}%"></div>`;
        }
    });
    
    // Build legend
    let legendHTML = '';
    sortedTechs.forEach(([tech, pct]) => {
        if (techColors[tech]) {
            const bg = techColors[tech].color.split(',')[0].replace('linear-gradient(90deg, ', '');
            legendHTML += `<div class="legend-item"><span class="dot" style="background: ${bg};"></span>${techColors[tech].icon} ${techColors[tech].label}: ${pct}%</div>`;
        }
    });
    
    barContainer.innerHTML = barsHTML || '<div style="text-align: center; padding: 15px; color: #94a3b8; font-size: 12px;">Select technologies to see estimated mix</div>';
    legend.innerHTML = legendHTML || '<div style="color: #94a3b8;">No generation data</div>';
}

function initTechCards() {
    document.querySelectorAll('.tech-card').forEach(card => {
        const techId = card.dataset.tech;
        if (journeyState.selectedTechs.includes(techId)) {
            card.classList.add('selected');
        }
    });
    updateTechSummary();
}

function toggleTech(techId) {
    const index = journeyState.selectedTechs.indexOf(techId);
    const card = document.querySelector(`.tech-card[data-tech="${techId}"]`);
    const spec = techSpecs[techId];
    
    if (index === -1) {
        journeyState.selectedTechs.push(techId);
        // Initialize capacity to equal share if not set
        if (!journeyState.techCapacities[techId]) {
            const equalShare = journeyState.selectedTechs.length > 0 ? 
                Math.floor(100 / journeyState.selectedTechs.length) : 0;
            // Redistribute equally
            const newShare = Math.floor(100 / journeyState.selectedTechs.length);
            journeyState.selectedTechs.forEach(t => {
                journeyState.techCapacities[t] = newShare;
            });
        }
        if (card) card.classList.add('selected');
        
        // Link storage tech cards to their config toggles
        if (spec && spec.category === 'storage') {
            const toggleMap = {
                'battery': { toggle: 'enableBattery', config: 'batteryConfig' },
                'hydrogen': { toggle: 'enableHydrogen', config: 'hydrogenConfig' },
                'pumped': { toggle: 'enablePumped', config: 'pumpedConfig' }
            };
            const mapping = toggleMap[techId];
            if (mapping) {
                const toggle = document.getElementById(mapping.toggle);
                if (toggle && !toggle.checked) {
                    toggle.checked = true;
                    toggleFlexibilitySection(mapping.toggle, mapping.config);
                    updateFlexibilityState();
                    updateFlexibilitySummary();
                }
            }
        }
    } else {
        journeyState.selectedTechs.splice(index, 1);
        delete journeyState.techCapacities[techId];
        // Redistribute remaining
        if (journeyState.selectedTechs.length > 0) {
            const newShare = Math.floor(100 / journeyState.selectedTechs.length);
            journeyState.selectedTechs.forEach(t => {
                journeyState.techCapacities[t] = newShare;
            });
        }
        if (card) card.classList.remove('selected');
        
        // Also uncheck the toggle when deselecting storage
        if (spec && spec.category === 'storage') {
            const toggleMap = {
                'battery': { toggle: 'enableBattery', config: 'batteryConfig' },
                'hydrogen': { toggle: 'enableHydrogen', config: 'hydrogenConfig' },
                'pumped': { toggle: 'enablePumped', config: 'pumpedConfig' }
            };
            const mapping = toggleMap[techId];
            if (mapping) {
                const toggle = document.getElementById(mapping.toggle);
                if (toggle && toggle.checked) {
                    toggle.checked = false;
                    toggleFlexibilitySection(mapping.toggle, mapping.config);
                    updateFlexibilityState();
                    updateFlexibilitySummary();
                }
            }
        }
    }
    
    renderCapacitySliders();
    updateTechSummary();
}

// Sector toggling
function toggleSector(sectorCode) {
    const index = journeyState.sectors.indexOf(sectorCode);
    const card = document.querySelector(`.sector-card[data-sector="${sectorCode}"]`);
    
    if (index === -1) {
        journeyState.sectors.push(sectorCode);
        if (card) card.classList.add('selected');
    } else {
        journeyState.sectors.splice(index, 1);
        if (card) card.classList.remove('selected');
    }
}

function updateForesightConfig() {
    const select = document.getElementById('foresightMode');
    if (select) {
        journeyState.foresight = select.value;
    }
}

// ==================== PENDIENTES CONFIG ====================

function updateCO2Budget(year, value) {
    if (!journeyState.co2Budget) journeyState.co2Budget = {};
    journeyState.co2Budget[year] = parseInt(value);
    
    const display = document.getElementById(`co2val${year}`);
    if (display) display.textContent = `${value}%`;
}

function updateSectorConfig() {
    if (!journeyState.sector) journeyState.sector = {};
    
    const gasNetwork = document.getElementById('gasNetwork');
    const h2Retrofit = document.getElementById('h2Retrofit');
    
    if (gasNetwork) journeyState.sector.gasNetwork = gasNetwork.checked;
    if (h2Retrofit) journeyState.sector.h2Retrofit = h2Retrofit.checked;
}

function updateDHConfig() {
    if (!journeyState.districtHeating) journeyState.districtHeating = {};
    
    const potential = document.getElementById('dhPotential');
    const prog2030 = document.getElementById('dhProgress2030');
    const prog2050 = document.getElementById('dhProgress2050');
    
    if (potential) {
        journeyState.districtHeating.potential = parseInt(potential.value) / 100;
        document.getElementById('dhPotValue').textContent = `${potential.value}%`;
    }
    if (prog2030) {
        if (!journeyState.districtHeating.progress) journeyState.districtHeating.progress = {};
        journeyState.districtHeating.progress[2030] = parseInt(prog2030.value) / 100;
        document.getElementById('dhProg2030').textContent = `${prog2030.value}%`;
    }
    if (prog2050) {
        if (!journeyState.districtHeating.progress) journeyState.districtHeating.progress = {};
        journeyState.districtHeating.progress[2050] = parseInt(prog2050.value) / 100;
        document.getElementById('dhProg2050').textContent = `${prog2050.value}%`;
    }
}

function updateCostModifier(tech, value) {
    if (!journeyState.costModifiers) journeyState.costModifiers = {};
    
    const multiplier = parseInt(value);
    if (multiplier === 0) {
        delete journeyState.costModifiers[tech];
    } else {
        journeyState.costModifiers[tech] = multiplier;
    }
    
    const display = document.getElementById(`cost${tech.charAt(0).toUpperCase() + tech.slice(1)}Val`);
    if (display) {
        const sign = multiplier > 0 ? '+' : '';
        display.textContent = `${sign}${multiplier}%`;
    }
}

function updateAtliteConfig() {
    const select = document.getElementById('atliteCutout');
    if (select) {
        journeyState.atliteCutout = select.value;
    }
}

function updateCostsConfig() {
    const select = document.getElementById('costsYear');
    if (select) {
        journeyState.costsYear = parseInt(select.value);
    }
}

function renderCapacitySliders() {
    const container = document.getElementById('slidersContainer');
    if (!container) return;
    
    const selected = journeyState.selectedTechs;
    
    if (selected.length === 0) {
        container.innerHTML = '<div class="sliders-empty">Select technologies above to configure capacity allocation</div>';
        updateAllocationDisplay();
        return;
    }
    
    // Create/update sliders for each selected tech
    let html = '';
    selected.forEach(tech => {
        const spec = techSpecs[tech];
        if (!spec || spec.category === 'storage') return; // Skip storage (no CF)
        
        const currentValue = journeyState.techCapacities[tech] || Math.floor(100 / selected.length);
        const techName = getTechDisplayName(tech);
        const techIcon = getTechIcon(tech);
        
        html += `
            <div class="tech-slider-item" data-tech="${tech}">
                <div class="tech-slider-header">
                    <span class="tech-slider-icon">${techIcon}</span>
                    <span class="tech-slider-name">${techName}</span>
                    <span class="tech-slider-value" id="sliderValue-${tech}">${currentValue}%</span>
                </div>
                <input type="range" 
                       class="tech-slider-input" 
                       id="slider-${tech}"
                       min="0" 
                       max="100" 
                       value="${currentValue}"
                       oninput="updateTechCapacity('${tech}', this.value)">
            </div>
        `;
    });
    
    container.innerHTML = html;
    updateAllocationDisplay();
}

function getTechDisplayName(tech) {
    const names = {
        solar: 'Solar PV', 'solar-rooftop': 'Solar Rooftop', 'solar-hsat': 'Solar Tracking',
        onwind: 'Onshore Wind', 'offwind': 'Offshore AC', 'offwind-ac': 'Offshore AC', 
        'offwind-dc': 'Offshore HVDC', 'offwind-float': 'Offshore Floating',
        hydro: 'Run-of-River', 'hydro-reservoir': 'Reservoir Hydro',
        biomass: 'Biomass', geothermal: 'Geothermal', wave: 'Wave', tidal: 'Tidal',
        ccgt: 'CCGT Gas', ocgt: 'OCGT Gas', coal: 'Coal', lignite: 'Lignite',
        oil: 'Oil', nuclear: 'Nuclear', waste: 'Waste'
    };
    return names[tech] || tech;
}

function getTechIcon(tech) {
    const icons = {
        solar: '☀️', 'solar-rooftop': '🏠', 'solar-hsat': '🌞',
        onwind: '🌬️', offwind: '⚡', 'offwind-ac': '⚡', 'offwind-dc': '🔌', 'offwind-float': '🌊',
        hydro: '💧', 'hydro-reservoir': '🏞️',
        biomass: '🌱', geothermal: '🌋', wave: '🌊', tidal: '🌙',
        ccgt: '🔥', ocgt: '🔧', coal: '🪨', lignite: '🟤',
        oil: '⛽', nuclear: '⚛️', waste: '♻️'
    };
    return icons[tech] || '⚡';
}

function updateTechCapacity(tech, value) {
    value = parseInt(value);
    journeyState.techCapacities[tech] = value;
    
    // Update display
    const valueEl = document.getElementById(`sliderValue-${tech}`);
    if (valueEl) valueEl.textContent = `${value}%`;
    
    updateAllocationDisplay();
    updateTechSummary();
}

function updateAllocationDisplay() {
    const totalEl = document.getElementById('totalAllocation');
    if (!totalEl) return;
    
    // Calculate total allocation (only for generation techs, not storage)
    let total = 0;
    journeyState.selectedTechs.forEach(tech => {
        const spec = techSpecs[tech];
        if (spec && spec.category !== 'storage') {
            total += journeyState.techCapacities[tech] || 0;
        }
    });
    
    totalEl.textContent = `${total}%`;
    
    // Color code
    totalEl.className = 'total-value';
    if (total > 100) totalEl.classList.add('warning');
    else if (total === 100) totalEl.classList.add('success');
}

function normalizeCapacities() {
    const genTechs = journeyState.selectedTechs.filter(tech => {
        const spec = techSpecs[tech];
        return spec && spec.category !== 'storage';
    });
    
    if (genTechs.length === 0) return;
    
    // Calculate current total
    let currentTotal = 0;
    genTechs.forEach(tech => {
        currentTotal += journeyState.techCapacities[tech] || 0;
    });
    
    const deficit = 100 - currentTotal;
    
    // If already ~100%, do nothing
    if (Math.abs(deficit) < 0.5) {
        const totalEl = document.getElementById('totalAllocation');
        if (totalEl) {
            totalEl.textContent = '100%';
            totalEl.className = 'total-value success';
        }
        return;
    }
    
    // If deficit > 0 (need to increase), find cheapest renewable
    if (deficit > 0) {
        const renewableTechs = genTechs.filter(tech => {
            const spec = techSpecs[tech];
            return spec && spec.category === 'renewable';
        });
        
        if (renewableTechs.length > 0) {
            // Find renewable with lowest average cost (LCOE)
            const cheapestRenewable = renewableTechs.reduce((cheapest, tech) => {
                const spec = techSpecs[tech];
                const avgCost = (spec.minCost + spec.maxCost) / 2;
                const cheapestSpec = techSpecs[cheapest];
                const cheapestCost = (cheapestSpec.minCost + cheapestSpec.maxCost) / 2;
                return avgCost < cheapestCost ? tech : cheapest;
            });
            
            // Add deficit to cheapest renewable
            const currentCap = journeyState.techCapacities[cheapestRenewable] || 0;
            const newCap = Math.min(100, currentCap + deficit);
            journeyState.techCapacities[cheapestRenewable] = newCap;
            
            // Update slider
            const slider = document.getElementById(`slider-${cheapestRenewable}`);
            const valueEl = document.getElementById(`sliderValue-${cheapestRenewable}`);
            if (slider) slider.value = newCap;
            if (valueEl) valueEl.textContent = `${Math.round(newCap)}%`;
            
            // Show notification
            const techName = getTechDisplayName(cheapestRenewable);
            console.log(`✓ Increased ${techName} by ${Math.round(deficit)}% to reach 100%`);
        } else {
            // No renewables available, distribute equally
            distributeEqually(genTechs);
        }
    } else {
        // Excess > 0 (need to decrease), reduce proportionally
        distributeEqually(genTechs);
    }
    
    updateAllocationDisplay();
    updateTechSummary();
}

function distributeEqually(genTechs) {
    // Original equal distribution logic
    const equalShare = Math.floor(100 / genTechs.length);
    let remainder = 100 - (equalShare * genTechs.length);
    
    genTechs.forEach((tech, index) => {
        const share = index < remainder ? equalShare + 1 : equalShare;
        journeyState.techCapacities[tech] = share;
        
        const slider = document.getElementById(`slider-${tech}`);
        const valueEl = document.getElementById(`sliderValue-${tech}`);
        if (slider) slider.value = share;
        if (valueEl) valueEl.textContent = `${share}%`;
    });
}

function selectAllTechs() {
    const allTechs = Object.keys(techSpecs);
    journeyState.selectedTechs = [...allTechs];
    document.querySelectorAll('.tech-card').forEach(card => {
        card.classList.add('selected');
    });
    updateTechSummary();
}

function clearAllTechs() {
    journeyState.selectedTechs = [];
    document.querySelectorAll('.tech-card').forEach(card => {
        card.classList.remove('selected');
    });
    updateTechSummary();
}

function selectDefaultTechs() {
    journeyState.selectedTechs = ['solar', 'onwind', 'battery'];
    document.querySelectorAll('.tech-card').forEach(card => {
        const techId = card.dataset.tech;
        card.classList.toggle('selected', journeyState.selectedTechs.includes(techId));
    });
    updateTechSummary();
}

// Germany 2024 Real Mix - Based on official data from Fraunhofer ISE & Bundesnetzagentur
// Source: https://www.ise.fraunhofer.de/en/press-media/press-releases/2025/
// Total generation: 437.7 TWh | Renewables: 58.2%
// NORMALIZED TO 100% for capacity allocation
const germany2024Mix = {
    'onwind': 25.9,      // 110.7 TWh (25.3% → normalized: 25.3/97.7*100)
    'solar': 16.9,       // 72.2 TWh (16.5% → normalized: 16.5/97.7*100)
    'lignite': 16.6,     // ~71.1 TWh (16.2% → normalized)
    'ccgt': 13.3,        // ~57.0 TWh (13.0% → normalized)
    'biomass': 8.4,      // 36.0 TWh (8.2% → normalized)
    'coal': 6.6,         // 28.2 TWh (6.4% → normalized)
    'offwind-ac': 6.0,   // 25.7 TWh (5.9% → normalized) [FIX: was 'offwind']
    'hydro': 5.1,        // 21.7 TWh (5.0% → normalized)
    'oil': 1.2,          // ~2.8 TWh (peakers)
    'ocgt': 0.0,         // Included in oil
    'nuclear': 0           // Phase-out complete April 2023
};
// Verification: 25.9+16.9+16.6+13.3+8.4+6.6+6.0+5.1+1.2+0 = 100.0% ✓

function loadGermany2024Mix() {
    // Select all technologies in the Germany mix
    journeyState.selectedTechs = Object.keys(germany2024Mix).filter(tech => germany2024Mix[tech] > 0);
    
    // Set capacities from the real mix
    Object.entries(germany2024Mix).forEach(([tech, percentage]) => {
        if (percentage > 0) {
            journeyState.techCapacities[tech] = percentage;
        }
    });
    
    // Update UI
    document.querySelectorAll('.tech-card').forEach(card => {
        const techId = card.dataset.tech;
        card.classList.toggle('selected', journeyState.selectedTechs.includes(techId));
    });
    
    // Update sliders if visible
    renderCapacitySliders();
    updateTechSummary();
}

// ==================== STORAGE & FLEXIBILITY ====================

function updateFlexibilityConfig() {
    // Update display values
    const batteryDuration = document.getElementById('batteryDuration');
    const batteryValue = document.getElementById('batteryDurationValue');
    if (batteryDuration && batteryValue) {
        batteryValue.textContent = `${batteryDuration.value}h`;
    }
    
    const v2gParticipation = document.getElementById('v2gParticipation');
    const v2gValue = document.getElementById('v2gPartValue');
    if (v2gParticipation && v2gValue) {
        v2gValue.textContent = `${v2gParticipation.value}%`;
    }
    
    const dhShare = document.getElementById('dhShare');
    const dhValue = document.getElementById('dhShareValue');
    if (dhShare && dhValue) {
        dhValue.textContent = `${dhShare.value}%`;
    }
    
    // Toggle visibility of config sections
    toggleFlexibilitySection('enableBattery', 'batteryConfig');
    toggleFlexibilitySection('enableHydrogen', 'hydrogenConfig');
    toggleFlexibilitySection('enablePumped', 'pumpedConfig');
    toggleFlexibilitySection('enableV2G', 'v2gConfig');
    toggleFlexibilitySection('enableDSM', 'dsmConfig');
    toggleFlexibilitySection('enablePtH', 'pthConfig');
    
    // Update journey state
    updateFlexibilityState();
    
    // Sync toggle state to tech cards (bidirectional)
    const batteryToggle = document.getElementById('enableBattery');
    const hydrogenToggle = document.getElementById('enableHydrogen');
    const pumpedToggle = document.getElementById('enablePumped');
    
    if (batteryToggle) syncToggleToTechCard('battery', batteryToggle.checked);
    if (hydrogenToggle) syncToggleToTechCard('hydrogen', hydrogenToggle.checked);
    if (pumpedToggle) syncToggleToTechCard('pumped', pumpedToggle.checked);
    
    // Update summary
    updateFlexibilitySummary();
}

function toggleFlexibilitySection(toggleId, configId) {
    const toggle = document.getElementById(toggleId);
    const config = document.getElementById(configId);
    if (toggle && config) {
        config.style.display = toggle.checked ? 'block' : 'none';
    }
}

// Function to sync toggle changes back to tech cards
function syncToggleToTechCard(techId, enabled) {
    const card = document.querySelector(`.tech-card[data-tech="${techId}"]`);
    if (!card) return;
    
    const isSelected = journeyState.selectedTechs.includes(techId);
    
    if (enabled && !isSelected) {
        // Add to selected techs
        journeyState.selectedTechs.push(techId);
        card.classList.add('selected');
    } else if (!enabled && isSelected) {
        // Remove from selected techs
        const index = journeyState.selectedTechs.indexOf(techId);
        if (index > -1) {
            journeyState.selectedTechs.splice(index, 1);
            delete journeyState.techCapacities[techId];
        }
        card.classList.remove('selected');
    }
    
    updateTechSummary();
}

function updateFlexibilityState() {
    journeyState.storage = {
        battery: {
            enabled: document.getElementById('enableBattery')?.checked ?? true,
            duration: parseInt(document.getElementById('batteryDuration')?.value || 4)
        },
        hydrogen: {
            enabled: document.getElementById('enableHydrogen')?.checked ?? true,
            duration: parseInt(document.getElementById('hydrogenDuration')?.value || 168)
        },
        pumped: {
            enabled: document.getElementById('enablePumped')?.checked ?? true
        }
    };
    
    journeyState.flexibility = {
        v2g: {
            enabled: document.getElementById('enableV2G')?.checked ?? false,
            fleet: parseInt(document.getElementById('v2gFleet')?.value || 25),
            participation: parseInt(document.getElementById('v2gParticipation')?.value || 30)
        },
        dsm: {
            enabled: document.getElementById('enableDSM')?.checked ?? false,
            sectors: {
                industry: document.getElementById('dsmIndustry')?.checked ?? false,
                commercial: document.getElementById('dsmCommercial')?.checked ?? false,
                residential: document.getElementById('dsmResidential')?.checked ?? false
            }
        },
        pth: {
            enabled: document.getElementById('enablePtH')?.checked ?? false,
            technology: document.getElementById('pthTech')?.value || 'hp',
            dhShare: parseInt(document.getElementById('dhShare')?.value || 25)
        }
    };
}

function updateFlexibilitySummary() {
    const flexSummary = document.getElementById('flexSummary');
    if (!flexSummary) return;
    
    const storage = journeyState.storage || {};
    const flexibility = journeyState.flexibility || {};
    
    // Calculate total storage capacity estimate
    let totalStorage = 0;
    if (storage.battery?.enabled) totalStorage += storage.battery.duration * 10; // GW
    if (storage.hydrogen?.enabled) totalStorage += storage.hydrogen.duration * 5; // GW
    if (storage.pumped?.enabled) totalStorage += 20; // GW
    
    // Max discharge duration
    let maxDuration = 0;
    if (storage.hydrogen?.enabled) maxDuration = Math.max(maxDuration, storage.hydrogen.duration);
    if (storage.battery?.enabled) maxDuration = Math.max(maxDuration, storage.battery.duration);
    if (storage.pumped?.enabled) maxDuration = Math.max(maxDuration, 24);
    
    // Demand flexibility
    let flexSources = [];
    if (storage.battery?.enabled) flexSources.push('Battery');
    if (storage.hydrogen?.enabled) flexSources.push('H₂');
    if (storage.pumped?.enabled) flexSources.push('Pumped');
    if (flexibility.v2g?.enabled) flexSources.push('V2G');
    if (flexibility.dsm?.enabled) {
        const sectors = [];
        if (flexibility.dsm.sectors?.industry) sectors.push('Industry');
        if (flexibility.dsm.sectors?.commercial) sectors.push('Commercial');
        if (flexibility.dsm.sectors?.residential) sectors.push('Residential');
        if (sectors.length > 0) flexSources.push(`DSM (${sectors.join(', ')})`);
    }
    if (flexibility.pth?.enabled) flexSources.push('PtH');
    
    // Update display
    const totalCapEl = document.getElementById('totalStorageCap');
    const maxDurEl = document.getElementById('maxDischargeDuration');
    const demandFlexEl = document.getElementById('demandFlexibility');
    
    if (totalCapEl) totalCapEl.textContent = `~${totalStorage.toFixed(0)} GW`;
    if (maxDurEl) maxDurEl.textContent = maxDuration >= 168 ? `${(maxDuration/168).toFixed(1)} weeks` : `${maxDuration}h`;
    if (demandFlexEl) demandFlexEl.textContent = flexSources.length > 0 ? flexSources.join(', ') : 'None';
}

// ==================== STORAGE PRESETS ====================

function loadGermany2024Storage() {
    // Germany 2024 Storage Mix based on Fraunhofer ISE / Bundesnetzagentur data
    // Battery: ~1.3 GW / 2.6 GWh utility-scale (2h average, but trending toward 4h)
    // Pumped Hydro: ~10 GW existing (Goldisthal, etc.)
    // Hydrogen: Pilot projects, seasonal storage focus
    
    // Select storage techs
    const germanyStorageTechs = ['battery', 'pumped', 'hydrogen'];
    
    // Deselect all storage first
    ['battery', 'hydrogen', 'pumped', 'caes'].forEach(tech => {
        if (journeyState.selectedTechs.includes(tech)) {
            const index = journeyState.selectedTechs.indexOf(tech);
            if (index > -1) {
                journeyState.selectedTechs.splice(index, 1);
                delete journeyState.techCapacities[tech];
            }
        }
    });
    
    // Add Germany 2024 storage mix
    germanyStorageTechs.forEach(tech => {
        if (!journeyState.selectedTechs.includes(tech)) {
            journeyState.selectedTechs.push(tech);
            journeyState.techCapacities[tech] = 33; // Equal share
        }
    });
    
    // Normalize to 100%
    const totalSelected = germanyStorageTechs.length;
    const equalShare = Math.floor(100 / totalSelected);
    germanyStorageTechs.forEach(tech => {
        journeyState.techCapacities[tech] = equalShare;
    });
    
    // Update UI - cards
    document.querySelectorAll('.storage-grid .tech-card').forEach(card => {
        const techId = card.dataset.tech;
        card.classList.toggle('selected', germanyStorageTechs.includes(techId));
    });
    
    // Enable toggles and set values
    const enableBattery = document.getElementById('enableBattery');
    const enablePumped = document.getElementById('enablePumped');
    const enableHydrogen = document.getElementById('enableHydrogen');
    
    if (enableBattery) {
        enableBattery.checked = true;
        // Germany trend: moving from 2h to 4h duration
        const batterySlider = document.getElementById('batteryDuration');
        if (batterySlider) batterySlider.value = 4;
    }
    
    if (enablePumped) {
        enablePumped.checked = true;
        // Existing pumped hydro ~8-16h Goldisthal
        journeyState.storage.pumped = { enabled: true };
    }
    
    if (enableHydrogen) {
        enableHydrogen.checked = true;
        // Germany: H2 for seasonal (weeks)
        const hydrogenSelect = document.getElementById('hydrogenDuration');
        if (hydrogenSelect) hydrogenSelect.value = '168'; // 1 week
        journeyState.storage.hydrogen = { enabled: true, duration: 168 };
    }
    
    // Update flexibility configs
    updateFlexibilityConfig();
    
    // Update summary
    updateFlexibilitySummary();
    
    // Show feedback
    console.log('🇩🇪 Loaded Germany 2024 Storage Mix');
}

function clearAllStorage() {
    // Remove all storage from selected techs
    ['battery', 'hydrogen', 'pumped', 'caes'].forEach(tech => {
        const index = journeyState.selectedTechs.indexOf(tech);
        if (index > -1) {
            journeyState.selectedTechs.splice(index, 1);
            delete journeyState.techCapacities[tech];
        }
        
        // Update card UI
        const card = document.querySelector(`.storage-grid .tech-card[data-tech="${tech}"]`);
        if (card) card.classList.remove('selected');
    });
    
    // Disable all toggles
    const enableBattery = document.getElementById('enableBattery');
    const enablePumped = document.getElementById('enablePumped');
    const enableHydrogen = document.getElementById('enableHydrogen');
    const enableV2G = document.getElementById('enableV2G');
    const enableDSM = document.getElementById('enableDSM');
    const enablePtH = document.getElementById('enablePtH');
    
    if (enableBattery) enableBattery.checked = false;
    if (enablePumped) enablePumped.checked = false;
    if (enableHydrogen) enableHydrogen.checked = false;
    if (enableV2G) enableV2G.checked = false;
    if (enableDSM) enableDSM.checked = false;
    if (enablePtH) enablePtH.checked = false;
    
    // Update configs
    updateFlexibilityConfig();
    updateFlexibilitySummary();
}

// ==================== FLEXIBILITY PRESETS ====================

function loadGermany2024Flexibility() {
    // Germany 2024 Flexibility Mix
    // Based on: Bundesnetzagentur, Fraunhofer ISE, AG Energiebilanzen 2024
    
    // V2G: ~1.4M EVs in DE (2024), V2G still pilot
    const enableV2G = document.getElementById('enableV2G');
    const v2gFleet = document.getElementById('v2gFleet');
    const v2gParticipation = document.getElementById('v2gParticipation');
    
    if (enableV2G) {
        enableV2G.checked = true;
        // 14M EVs conservative (actual ~1.4M, growing fast)
        if (v2gFleet) v2gFleet.value = '10';
        // Low participation as V2G still nascent
        if (v2gParticipation) v2gParticipation.value = '15';
    }
    
    // DSM: Industrial well established, other sectors emerging
    const enableDSM = document.getElementById('enableDSM');
    const dsmIndustry = document.getElementById('dsmIndustry');
    const dsmCommercial = document.getElementById('dsmCommercial');
    const dsmResidential = document.getElementById('dsmResidential');
    
    if (enableDSM) {
        enableDSM.checked = true;
        // Industrial DSM is mature in DE (steel, chemicals, aluminum)
        if (dsmIndustry) dsmIndustry.checked = true;
        // Commercial emerging (large HVAC)
        if (dsmCommercial) dsmCommercial.checked = true;
        // Residential still pilot
        if (dsmResidential) dsmResidential.checked = false;
    }
    
    // PtH: District heating ~15% of DE heating, heat pumps growing
    const enablePtH = document.getElementById('enablePtH');
    const pthTech = document.getElementById('pthTech');
    const dhShare = document.getElementById('dhShare');
    
    if (enablePtH) {
        enablePtH.checked = true;
        // Mixed: heat pumps dominant + resistance backup
        if (pthTech) pthTech.value = 'both';
        // ~14% district heating share in Germany (2024)
        if (dhShare) dhShare.value = '14';
    }
    
    // Update state and UI
    updateFlexibilityConfig();
    updateFlexibilitySummary();
    
    console.log('🇩🇪 Loaded Germany 2024 Flexibility Mix');
}

function clearAllFlexibility() {
    // Disable all flexibility options
    const enableV2G = document.getElementById('enableV2G');
    const enableDSM = document.getElementById('enableDSM');
    const enablePtH = document.getElementById('enablePtH');
    
    if (enableV2G) enableV2G.checked = false;
    if (enableDSM) enableDSM.checked = false;
    if (enablePtH) enablePtH.checked = false;
    
    // Reset DSM sectors
    const dsmIndustry = document.getElementById('dsmIndustry');
    const dsmCommercial = document.getElementById('dsmCommercial');
    const dsmResidential = document.getElementById('dsmResidential');
    
    if (dsmIndustry) dsmIndustry.checked = false;
    if (dsmCommercial) dsmCommercial.checked = false;
    if (dsmResidential) dsmResidential.checked = false;
    
    // Update state
    updateFlexibilityConfig();
    updateFlexibilitySummary();
}

// ==================== YAML GENERATION ====================

function generateYAML() {
    try {
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
    } catch (error) {
        console.error('Error generating YAML:', error);
        const output = document.getElementById('yamlOutput');
        if (output) {
            output.textContent = `Error generating YAML:\n${error.message}\n\nPlease check console for details.`;
        }
    }
}

function buildYAML() {
    const { countries, timePeriod, snapshot, horizon, nodes, co2Mechanism, co2CapLevel, co2Price, selectedTechs, storage, speed } = journeyState;
    
    // ========================================
    // PYPSA-EUR OFFICIAL TECHNOLOGY MAPPING
    // Based on v0.12.0 config.default.yaml
    // ========================================
    
    // Generators (extendable_carriers.Generator)
    // These are EXACT names from PyPSA-Eur documentation
    const validGenerators = [
        'solar', 'solar-hsat',
        'onwind', 
        'offwind-ac', 'offwind-dc', 'offwind-float',
        'hydro',
        'OCGT', 'CCGT',  // Gas turbines - UPPERCASE
        'nuclear',
        'coal', 'lignite',
        'oil',
        'biomass', 'geothermal'
    ];
    
    // UI to PyPSA Generator mapping
    const generatorMapping = {
        'solar': 'solar',
        'solar-hsat': 'solar-hsat',
        'onwind': 'onwind',
        'offwind': 'offwind-ac',  // legacy fallback
        'offwind-ac': 'offwind-ac',
        'offwind-dc': 'offwind-dc', 
        'offwind-float': 'offwind-float',
        'hydro': 'hydro',
        'hydro-reservoir': 'hydro',
        'ccgt': 'CCGT',
        'ocgt': 'OCGT',
        'coal': 'coal',
        'lignite': 'lignite',
        'oil': 'oil',
        'nuclear': 'nuclear',
        'biomass': 'biomass',
        'geothermal': 'geothermal',
        'waste': 'waste'
    };
    
    // Storage: Store (battery, H2)
    const storeMapping = {
        'battery': 'battery',
        'hydrogen': 'H2'  // PyPSA-Eur uses H2, not 'hydrogen'
    };
    
    // Storage: StorageUnit (PHS = Pumped Hydro Storage)
    const storageUnitMapping = {
        'pumped': 'PHS'  // PyPSA-Eur uses PHS
    };
    
    // Process selected techs
    const generators = [];
    const stores = [];
    const storageUnits = [];
    
    selectedTechs.forEach(tech => {
        if (generatorMapping[tech]) {
            generators.push(generatorMapping[tech]);
        }
        if (storeMapping[tech]) {
            stores.push(storeMapping[tech]);
        }
        if (storageUnitMapping[tech]) {
            storageUnits.push(storageUnitMapping[tech]);
        }
    });
    
    // Debug: log selected techs
    console.log('Selected techs:', selectedTechs);
    console.log('Mapped generators:', generators);
    console.log('Mapped stores:', stores);
    console.log('Mapped storageUnits:', storageUnits);
    
    const timeConfig = timePeriodConfig[timePeriod] || timePeriodConfig.quarter;
    const safeTimePeriod = timePeriod || 'quarter';
    
    let yaml = `# PyPSA-Eur Configuration\n`;
    yaml += `# Generated by Energy Journey\n`;
    yaml += `# Date: ${new Date().toISOString().split('T')[0]}\n\n`;
    
    yaml += `run:\n`;
    yaml += `  name: energy-journey-${Date.now()}\n\n`;
    
    yaml += `# Temporal Settings\n`;
    yaml += `time_period: ${safeTimePeriod}  # ${timeConfig.label} (${timeConfig.days} days)\n`;
    yaml += `snapshots:\n`;
    yaml += `  start: "${snapshot}-01-01"\n`;
    yaml += `  end: "${snapshot}-12-31"\n`;
    yaml += `  inclusive: true\n`;
    yaml += `snapshot_year: ${snapshot}  # Historical ERA5 weather data\n`;
    yaml += `horizon_year: ${horizon}   # Planning target year\n`;
    yaml += `investment_periods:\n`;
    yaml += `  - ${horizon}\n\n`;
    
    yaml += `countries:\n`;
    const finalCountries = countries.length > 0 ? countries : ['DE'];
    finalCountries.forEach(c => yaml += `  - ${c}\n`);
    yaml += `\n`;
    
    yaml += `scenario:\n`;
    yaml += `  clusters: [${nodes}]  # ${nodes} network nodes\n\n`;
    
    yaml += `electricity:\n`;
    
    // CO2 Mechanism configuration
    yaml += `  co2_mechanism: ${co2Mechanism}\n`;
    
    if (co2Mechanism === 'none') {
        yaml += `  co2limit_enable: false\n`;
    } else if (co2Mechanism === 'cap') {
        yaml += `  co2limit_enable: true\n`;
        // Convert cap percentage to actual CO2 limit in tonnes
        // reduction% = how much to reduce, so allowed = 100 - reduction
        const reduction = co2CapLevel || 75;
        const co2limit = reduction >= 95 ? 0 : 
                        reduction >= 75 ? 20e6 : 
                        reduction >= 50 ? 50e6 : 100e6;
        yaml += `  co2limit: ${co2limit}  # ${reduction}% reduction target\n`;
        yaml += `  co2_cap_reduction: ${reduction}\n`;
    } else if (co2Mechanism === 'price') {
        yaml += `  co2limit_enable: false\n`;
        yaml += `  co2_price: ${co2Price}\n`;
        yaml += `  # CO2 tax applied to all emitting generators\n`;
    }
    
    // Debug: log selected techs
    console.log('Selected techs:', selectedTechs);
    console.log('Mapped generators:', generators);
    console.log('Mapped stores:', stores);
    console.log('Mapped storageUnits:', storageUnits);
    
    yaml += `  extendable_carriers:\n`;
    
    // Generators
    const generatorList = generators.length > 0 ? generators.join(', ') : 'solar, onwind';
    yaml += `    Generator: [${generatorList}]\n`;
    
    // Storage Units (PHS = Pumped Hydro)
    const storageUnitList = storageUnits.length > 0 ? storageUnits.join(', ') : '';
    if (storageUnits.length > 0) {
        yaml += `    StorageUnit: [${storageUnitList}]\n`;
    }
    
    // Stores (battery, H2)
    const storeList = stores.length > 0 ? stores.join(', ') : '';
    if (stores.length > 0) {
        yaml += `    Store: [${storeList}]\n`;
    }
    
    // Links (empty for now, could add H2 pipeline)
    yaml += `    Link: []\n`;
    
    yaml += `\n`;
    
    // Classify carriers (for PyPSA-Eur optimization)
    const conventionalCarriers = generators.filter(g => 
        ['OCGT', 'CCGT', 'nuclear', 'coal', 'lignite', 'oil', 'biomass', 'geothermal'].includes(g)
    );
    const renewableCarriers = generators.filter(g =>
        ['solar', 'solar-hsat', 'onwind', 'offwind-ac', 'offwind-dc', 'offwind-float', 'hydro'].includes(g)
    );
    
    yaml += `  conventional_carriers: [${conventionalCarriers.join(', ') || 'OCGT, CCGT, coal'}]\n`;
    yaml += `  renewable_carriers: [${renewableCarriers.join(', ') || 'solar, onwind, hydro'}]\n`;
    
    // Carbon budget reference
    const co2Budget = co2CapLevel / 100;
    yaml += `  co2base: ${(1.487e9 * (1 - co2Budget)).toExponential(3)}\n`;
    yaml += `  gaslimit: false\n`;
    yaml += `  gaslimit_enable: false\n`;
    
    // Add section showing all selected technologies
    yaml += `\n# Technologies Selected (${selectedTechs.length} UI items)\n`;
    yaml += `# - Generators (${generators.length}): ${generators.join(', ') || 'none'}\n`;
    yaml += `# - StorageUnit (${storageUnits.length}): ${storageUnitList || 'none'}\n`;
    yaml += `# - Store (${stores.length}): ${storeList || 'none'}\n`;
    
    yaml += `\n`;
    
    // max_hours configuration
    if (stores.length > 0 || storageUnits.length > 0) {
        yaml += `  max_hours:\n`;
        
        // Battery duration
        if (stores.includes('battery')) {
            const batteryDuration = storage.battery?.duration || 4;
            yaml += `    battery: ${batteryDuration}\n`;
        }
        
        // H2 duration (hydrogen in UI)
        if (stores.includes('H2')) {
            const hydrogenDuration = storage.hydrogen?.duration || 168;
            yaml += `    H2: ${hydrogenDuration}\n`;
        }
        
        // PHS duration (pumped in UI)
        if (storageUnits.includes('PHS')) {
            yaml += `    PHS: 6  # Default 6 hours for pumped hydro\n`;
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
        let mechanismLabel;
        if (journeyState.co2Mechanism === 'none') {
            mechanismLabel = 'No Policy';
        } else if (journeyState.co2Mechanism === 'cap') {
            mechanismLabel = `Cap -${journeyState.co2CapLevel}%`;
        } else {
            mechanismLabel = `Price €${journeyState.co2Price}/t`;
        }
        ambitionEl.textContent = mechanismLabel;
    }
    
    if (techsEl) {
        techsEl.textContent = `${journeyState.selectedTechs.length} selected`;
    }
    
    // Update environmental assessment
    updateEnvironmentalAssessment();
}

// ==================== ENVIRONMENTAL ASSESSMENT ====================

function updateEnvironmentalAssessment() {
    const assessmentEl = document.getElementById('envAssessment');
    const iconEl = document.getElementById('envIcon');
    const messageEl = document.getElementById('envMessage');
    const detailsEl = document.getElementById('envDetails');
    
    if (!assessmentEl || !messageEl || !detailsEl) return;
    
    // Calculate green score
    let greenScore = 0;
    let maxScore = 0;
    let factors = [];
    
    // CO2 mechanism (0-40 points)
    maxScore += 40;
    if (journeyState.co2Mechanism === 'cap') {
        if (journeyState.co2CapLevel >= 100) {
            greenScore += 40;
            factors.push('✅ Net Zero CO₂ target');
        } else if (journeyState.co2CapLevel >= 75) {
            greenScore += 30;
            factors.push('✅ Strong CO₂ reduction (75%+)');
        } else if (journeyState.co2CapLevel >= 50) {
            greenScore += 20;
            factors.push('🟡 Moderate CO₂ reduction');
        } else {
            greenScore += 10;
            factors.push('⚠️ Weak CO₂ reduction');
        }
    } else if (journeyState.co2Mechanism === 'price') {
        if (journeyState.co2Price >= 200) {
            greenScore += 35;
            factors.push('✅ High carbon price (€200/t)');
        } else if (journeyState.co2Price >= 100) {
            greenScore += 25;
            factors.push('🟡 Moderate carbon price');
        } else {
            greenScore += 15;
            factors.push('⚠️ Low carbon price');
        }
    } else {
        factors.push('❌ No CO₂ policy');
    }
    
    // Renewable technologies (0-30 points)
    maxScore += 30;
    // Include all variants: solar-hsat, offwind-ac/dc/float, hydro-reservoir
    const renewableTechs = ['solar', 'solar-hsat', 'onwind', 'offwind', 'offwind-ac', 'offwind-dc', 'offwind-float', 'hydro', 'hydro-reservoir', 'biomass', 'geothermal'];
    const selectedRenewables = journeyState.selectedTechs.filter(t => renewableTechs.includes(t));
    const renewableCount = selectedRenewables.length;
    
    if (renewableCount >= 4) {
        greenScore += 30;
        factors.push(`✅ High renewable mix (${renewableCount} techs)`);
    } else if (renewableCount >= 2) {
        greenScore += 20;
        factors.push(`🟡 Moderate renewable mix (${renewableCount} techs)`);
    } else if (renewableCount >= 1) {
        greenScore += 10;
        factors.push(`⚠️ Low renewable mix (${renewableCount} tech)`);
    } else {
        factors.push('❌ No renewables selected');
    }
    
    // Storage (0-20 points)
    maxScore += 20;
    const storageTechs = ['battery', 'hydrogen', 'pumped'];
    const selectedStorage = journeyState.selectedTechs.filter(t => storageTechs.includes(t));
    const storageCount = selectedStorage.length;
    
    if (storageCount >= 3) {
        greenScore += 20;
        factors.push('✅ Comprehensive storage (battery + H₂ + pumped)');
    } else if (storageCount >= 2) {
        greenScore += 15;
        factors.push('✅ Good storage diversity');
    } else if (storageCount >= 1) {
        greenScore += 8;
        factors.push('🟡 Limited storage');
    } else {
        factors.push('⚠️ No storage - grid stability at risk');
    }
    
    // Flexibility (0-10 points)
    maxScore += 10;
    const hasFlexibility = journeyState.flexibility && (
        journeyState.flexibility.v2g?.enabled ||
        journeyState.flexibility.dsm?.enabled ||
        journeyState.flexibility.pth?.enabled
    );
    if (hasFlexibility) {
        greenScore += 10;
        factors.push('✅ Demand flexibility enabled');
    } else {
        factors.push('🟡 No demand flexibility');
    }
    
    // Calculate percentage
    const percentage = Math.round((greenScore / maxScore) * 100);
    
    // Set message and styling based on score
    assessmentEl.classList.remove('green', 'yellow', 'red');
    
    if (percentage >= 70) {
        assessmentEl.classList.add('green');
        iconEl.textContent = '🌱';
        messageEl.textContent = '🎉 Tu configuración ES amigable con el medio ambiente';
        detailsEl.innerHTML = `
            <div class="env-score green">Eco Score: ${percentage}%</div>
            <div>${factors.join('<br>')}</div>
            <div style="margin-top: 12px; font-style: italic; opacity: 0.8;">
                Esta configuración contribuye significativamente a la descarbonización del sistema energético europeo.
            </div>
        `;
    } else if (percentage >= 40) {
        assessmentEl.classList.add('yellow');
        iconEl.textContent = '🌍';
        messageEl.textContent = '🟡 Tu configuración es MODERADAMENTE amigable con el medio ambiente';
        detailsEl.innerHTML = `
            <div class="env-score yellow">Eco Score: ${percentage}%</div>
            <div>${factors.join('<br>')}</div>
            <div style="margin-top: 12px; font-style: italic; opacity: 0.8;">
                Hay espacio para mejorar. Considera agregar más renovables o una política de CO₂ más ambiciosa.
            </div>
        `;
    } else {
        assessmentEl.classList.add('red');
        iconEl.textContent = '⚠️';
        messageEl.textContent = '❌ Tu configuración NO ES amigable con el medio ambiente';
        detailsEl.innerHTML = `
            <div class="env-score red">Eco Score: ${percentage}%</div>
            <div>${factors.join('<br>')}</div>
            <div style="margin-top: 12px; font-style: italic; opacity: 0.8;">
                Esta configuración resultaría en altas emisiones. Te recomendamos seleccionar tecnologías renovables y una política de CO₂ ambiciosa.
            </div>
        `;
    }
}

// ==================== BASE RESULTS (Dr. Eureka 3-Layer Structure) ====================

// Layer toggling
function toggleLayer(layerId) {
    const layer = document.getElementById(layerId);
    const header = document.querySelector(`[onclick="toggleLayer('${layerId}')"]`);
    
    if (layer && header) {
        layer.classList.toggle('collapsed');
        header.classList.toggle('collapsed');
    }
}

function initBaseResults() {
    console.log('Initializing Base Results with real data...');
    if (typeof baseDataReal !== 'undefined') {
        console.log('Using baseDataReal with', Object.keys(baseDataReal).length, 'scenarios');
        Object.assign(baseData, baseDataReal);
    }
    switchBaseYear('2025-6h');  // Default to 6h resolution
    
    // Initialize Layer 2 collapsed by default
    const layer2 = document.getElementById('layer2');
    const layer3 = document.getElementById('layer3');
    
    if (layer2) layer2.classList.add('collapsed');
    if (layer3) layer3.classList.add('collapsed');
    
    // Initialize simple tooltips
    initSimpleTooltips();
}

function initSimpleTooltips() {
    const triggers = document.querySelectorAll('.kpi-card');
    triggers.forEach(card => {
        const tooltip = card.querySelector('.tooltip-content');
        if (!tooltip) return;

        card.addEventListener('mouseenter', () => {
            // Get card position
            const cardRect = card.getBoundingClientRect();

            // First, show tooltip off-screen to measure it
            tooltip.style.left = '-9999px';
            tooltip.style.top = '-9999px';
            tooltip.style.display = 'block';

            // Now get tooltip dimensions
            const tooltipRect = tooltip.getBoundingClientRect();
            const tooltipWidth = tooltipRect.width;
            const tooltipHeight = tooltipRect.height;

            // Calculate position - center above card
            let left = cardRect.left + (cardRect.width / 2) - (tooltipWidth / 2);
            let top = cardRect.top - tooltipHeight - 12;

            // Keep within viewport horizontally
            if (left < 10) left = 10;
            if (left + tooltipWidth > window.innerWidth - 10) {
                left = window.innerWidth - tooltipWidth - 10;
            }

            // Show below if not enough space above
            if (top < 10) {
                top = cardRect.bottom + 12;
                tooltip.classList.add('tooltip-below');
            } else {
                tooltip.classList.remove('tooltip-below');
            }

            // Apply final position
            tooltip.style.left = left + 'px';
            tooltip.style.top = top + 'px';
        });

        card.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
        });
    });
}

// Sub-tab switching for Base Results
function switchSubTab(subtab) {
    // Update button states
    document.querySelectorAll('.sub-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.subtab === subtab);
    });
    
    // Show/hide content
    document.querySelectorAll('.subtab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`subtab-${subtab}`).classList.add('active');
}

function switchBaseYear(year) {
    // Legacy function - redirect to sub-tabs
    if (year === '2025-6h') {
        switchSubTab('6h');
    } else if (year === '2025-12h') {
        switchSubTab('12h');
    } else if (year === 'compare') {
        switchSubTab('compare');
    }
    
    // Update display
    if (year === 'compare') {
        showComparison();
    } else {
        showYearData(year);
    }
}

function showYearData(year) {
    const data = baseData[year];
    if (!data) return;
    
    // Update Executive Summary KPIs (Layer 1)
    const kpiMappings = {
        'execTotalCost': `€${data.totalCost}B`,
        'execAvgPrice': `€${data.avgPrice}`,
        'execDHPenetration': data.dhPenetration ? `${data.dhPenetration}%` : '--',
        'execCO2': data.co2Emissions?.toFixed(1) || '--',
        'execRenewable': `${data.renewableShare}%`,
        'execPeakDemand': data.peakDemand?.toLocaleString() || '--',
        'execTotalGen': data.totalGeneration?.toLocaleString() || '--',
        'execPeakHeat': data.peakHeat?.toLocaleString() || '--',
        'execTES': data.tesCapacity || '--',
        'execElectrification': data.electrification ? `${data.electrification}%` : '--'
    };
    
    Object.entries(kpiMappings).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    });
    
    // Calculate total generation if not provided
    const totalGen = Object.values(data.generation || {}).reduce((a, b) => a + b, 0);
    if (!data.totalGeneration) {
        data.totalGeneration = Math.round(totalGen);
    }
    
    // Update generation mix mini chart
    updateGenerationMixMini(data.generation);
    
    // Update technical tables (Layer 2)
    updateTechnicalTables(data);
    
    // Update charts
    updateBaseCharts(data, year);
    
    // Update layer headers with year info
    document.querySelectorAll('.layer-header').forEach(header => {
        if (header.querySelector('h3')) {
            header.dataset.year = year;
        }
    });
}

function updateGenerationMixMini(generation) {
    const container = document.getElementById('generationMixMini');
    if (!container || !generation) {
        console.log('No container or generation data');
        return;
    }
    
    const total = Object.values(generation).reduce((a, b) => a + b, 0);
    console.log('Total generation:', total, 'TWh');
    console.log('Generation data:', generation);
    
    // Show ALL technologies with > 1% share (not just top 6)
    const sorted = Object.entries(generation)
        .sort((a, b) => b[1] - a[1])
        .filter(([tech, value]) => (value / total) > 0.01); // > 1%
    
    const colors = {
        'solar': '#fbbf24',
        'onwind': '#60a5fa',
        'offwind': '#3b82f6',
        'hydro': '#06b6d4',
        'gas': '#ef4444',
        'coal': '#7c2d12',
        'oil': '#451a03',
        'biomass': '#22c55e'
    };
    
    console.log('Filtered technologies:', sorted.map(([t, v]) => `${t}: ${v} TWh`));
    
    container.innerHTML = sorted.map(([tech, value]) => {
        const pct = ((value / total) * 100).toFixed(1);
        const color = colors[tech] || '#94a3b8';
        return `
            <div class="mix-mini-item">
                <div class="mix-mini-bar" style="width: ${Math.max(pct, 5)}%; background: ${color}"></div>
                <span class="mix-mini-label">${tech} <strong>${pct}%</strong> (${value.toFixed(0)} TWh)</span>
            </div>
        `;
    }).join('');
    
    // Log what's being displayed
    console.log('Displaying', sorted.length, 'technologies');
}

function updateTechnicalTables(data) {
    // Update capacities table with Capacity Factor calculation
    const capTable = document.getElementById('tableCapacities');
    if (capTable && data.capacity && data.generation) {
        const tbody = capTable.querySelector('tbody');
        if (tbody) {
            tbody.innerHTML = Object.entries(data.capacity)
                .filter(([tech, cap]) => cap > 0)
                .map(([tech, cap]) => {
                    const gen = data.generation[tech] || 0;  // TWh
                    const capGW = cap;  // GW
                    // CF = (TWh * 1000) / (GW * 8760h) * 100
                    const cf = capGW > 0 ? ((gen * 1000) / (capGW * 8.76)).toFixed(1) : 0;
                    return `
                        <tr>
                            <td>${tech}</td>
                            <td>${capGW.toFixed(1)}</td>
                            <td>${gen.toFixed(1)}</td>
                            <td>${cf}%</td>
                        </tr>
                    `;
                }).join('');
        }
    }
    
    // Update DH Operation table
    const dhTable = document.getElementById('tableDHOperation');
    if (dhTable && data.dhTechnologies) {
        const tbody = dhTable.querySelector('tbody');
        if (tbody) {
            tbody.innerHTML = Object.entries(data.dhTechnologies)
                .map(([tech, share]) => {
                    return `
                        <tr>
                            <td>${tech.replace('_', ' ')}</td>
                            <td>--</td>
                            <td>--</td>
                            <td>${share}%</td>
                        </tr>
                    `;
                }).join('');
        }
    }
    
    // Update system metrics
    const curtailmentEl = document.getElementById('metricCurtailment');
    const lineUtilEl = document.getElementById('metricLineUtil');
    const storageCyclesEl = document.getElementById('metricStorageCycles');
    
    if (curtailmentEl) curtailmentEl.textContent = data.curtailment !== undefined ? data.curtailment.toFixed(1) + ' TWh' : '--';
    if (lineUtilEl) lineUtilEl.textContent = data.lineUtilization !== undefined ? data.lineUtilization.toFixed(1) + '%' : '--';
    if (storageCyclesEl) storageCyclesEl.textContent = data.storageCycles !== undefined ? data.storageCycles.toFixed(0) : '--';
}

function updateGenerationMix(generation, year) {
    const container = document.getElementById(`generationMix${year}`);
    if (!container || !generation) return;
    
    const total = Object.values(generation).reduce((a, b) => a + b, 0);
    
    // Sort by value descending
    const sorted = Object.entries(generation)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);  // Top 6
    
    const colors = {
        'solar': '#fbbf24',
        'onwind': '#60a5fa',
        'offwind': '#3b82f6',
        'hydro': '#06b6d4',
        'gas': '#ef4444',
        'coal': '#7c2d12',
        'oil': '#451a03',
        'biomass': '#22c55e'
    };
    
    container.innerHTML = sorted.map(([tech, value]) => {
        const pct = ((value / total) * 100).toFixed(1);
        const color = colors[tech] || '#94a3b8';
        return `
            <div class="mix-item">
                <div class="mix-bar" style="width: ${pct}%; background: ${color}"></div>
                <div class="mix-info">
                    <span class="mix-tech">${tech}</span>
                    <span class="mix-value">${value.toFixed(1)} TWh (${pct}%)</span>
                </div>
            </div>
        `;
    }).join('');
}

// Chart instances for cleanup
let baseCharts = {};

function updateBaseCharts(data, year) {
    // Destroy existing charts
    Object.values(baseCharts).forEach(chart => chart?.destroy?.());
    baseCharts = {};
    
    // Colors for energy technologies
    const techColors = {
        'solar': '#fbbf24',
        'onwind': '#60a5fa',
        'offwind': '#3b82f6',
        'hydro': '#06b6d4',
        'gas': '#ef4444',
        'coal': '#7c2d12',
        'oil': '#854d0e',
        'biomass': '#22c55e'
    };
    
    // Update electricity generation chart
    const elecChart = document.getElementById('baseElectricityChart');
    if (elecChart && data.generation) {
        const ctx = elecChart.getContext('2d');
        
        // Sort by value and filter out zeros
        const sorted = Object.entries(data.generation)
            .filter(([_, v]) => v > 0)
            .sort((a, b) => b[1] - a[1]);
        
        const labels = sorted.map(([k]) => k);
        const values = sorted.map(([, v]) => v);
        const colors = sorted.map(([k]) => techColors[k] || '#94a3b8');
        
        baseCharts.electricity = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Generation (TWh)',
                    data: values,
                    backgroundColor: colors,
                    borderColor: colors.map(c => c),
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        titleColor: '#f1f5f9',
                        bodyColor: '#94a3b8',
                        borderColor: 'rgba(99, 102, 241, 0.3)',
                        borderWidth: 1,
                        callbacks: {
                            label: (ctx) => `${ctx.parsed.y.toFixed(1)} TWh`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#94a3b8' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#94a3b8', maxRotation: 45 }
                    }
                }
            }
        });
    }
    
    // Update capacity chart
    const capChart = document.getElementById('baseCapacityChart');
    if (capChart && data.capacity) {
        const ctx = capChart.getContext('2d');
        
        const sorted = Object.entries(data.capacity)
            .filter(([_, v]) => v > 0)
            .sort((a, b) => b[1] - a[1]);
        
        const labels = sorted.map(([k]) => k);
        const values = sorted.map(([, v]) => v);
        const colors = sorted.map(([k]) => techColors[k] || '#94a3b8');
        
        baseCharts.capacity = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Capacity (GW)',
                    data: values,
                    backgroundColor: colors,
                    borderColor: colors,
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        titleColor: '#f1f5f9',
                        bodyColor: '#94a3b8',
                        borderColor: 'rgba(99, 102, 241, 0.3)',
                        borderWidth: 1,
                        callbacks: {
                            label: (ctx) => `${ctx.parsed.x.toFixed(1)} GW`
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#94a3b8' }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: '#94a3b8' }
                    }
                }
            }
        });
    }
}

function showComparison() {
    const tbody = document.getElementById('baseComparisonTable');
    if (!tbody) return;
    
    const data2025 = baseData['2025'];
    const data2050 = baseData['2050'];
    
    // Show all layers in comparison mode
    document.querySelectorAll('.layer-content').forEach(layer => {
        layer.classList.remove('collapsed');
    });
    
    tbody.innerHTML = `
        <tr>
            <td><strong>Total System Cost</strong></td>
            <td>€${data2025.totalCost}B</td>
            <td>€${data2050.totalCost}B</td>
            <td style="color: #10b981">-${((1 - data2050.totalCost/data2025.totalCost) * 100).toFixed(1)}%</td>
        </tr>
        <tr>
            <td>Electricity Price</td>
            <td>€${data2025.avgPrice}/MWh</td>
            <td>€${data2050.avgPrice}/MWh</td>
            <td style="color: #10b981">-${((1 - data2050.avgPrice/data2025.avgPrice) * 100).toFixed(1)}%</td>
        </tr>
        <tr>
            <td>CO₂ Emissions</td>
            <td>${data2025.co2Emissions} Mt</td>
            <td>${data2050.co2Emissions} Mt</td>
            <td style="color: #10b981">-${((1 - data2050.co2Emissions/data2025.co2Emissions) * 100).toFixed(0)}%</td>
        </tr>
        <tr>
            <td>Renewable Share</td>
            <td>${data2025.renewableShare}%</td>
            <td>${data2050.renewableShare}%</td>
            <td style="color: #10b981">+${data2050.renewableShare - data2025.renewableShare}pp</td>
        </tr>
        <tr>
            <td>DH Penetration ⭐</td>
            <td>${data2025.dhPenetration || 14}%</td>
            <td>${data2050.dhPenetration || 35}%</td>
            <td style="color: #10b981">+${(data2050.dhPenetration || 35) - (data2025.dhPenetration || 14)}pp</td>
        </tr>
        <tr>
            <td>Total Generation</td>
            <td>${data2025.totalGeneration?.toLocaleString() || '2,847'} TWh</td>
            <td>${data2050.totalGeneration?.toLocaleString() || '3,200'} TWh</td>
            <td style="color: #f59e0b">+${data2050.totalGeneration ? Math.round((data2050.totalGeneration/data2025.totalGeneration - 1) * 100) : 12}%</td>
        </tr>
    `;
}

// Layer 3: Download function
function downloadCSV(type) {
    const data2025 = baseData['2025'];
    let csvContent = '';
    let filename = '';
    
    switch(type) {
        case 'timeseries':
            filename = 'timeseries-2025.csv';
            csvContent = 'hour,carrier,value\n'; // Placeholder
            break;
        case 'nodal':
            filename = 'nodal-capacities-2025.csv';
            csvContent = 'bus,technology,capacity_MW\n'; // Placeholder
            break;
        case 'costs':
            filename = 'cost-breakdown-2025.csv';
            csvContent = 'component,cost_type,value_euro\n';
            if (data2025.capacity) {
                Object.entries(data2025.capacity).forEach(([tech, cap]) => {
                    csvContent += `${tech},capex,${(cap * 1000).toFixed(0)}\n`;
                });
            }
            break;
        case 'sector':
            filename = 'sector-data-2025.csv';
            csvContent = 'sector,demand_MWh,emissions_tonnes\n';
            break;
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ==================== CUSTOM RESULTS ====================

function updateCustomResults() {
    // Calculate projected values based on CO2 Political target
    const cost = 41.14 + (100 - journeyState.co2Political) * 0.15;  // Higher ambition = lower cost
    const co2 = -Math.round(journeyState.co2Political * 0.95);  // Slightly less than 100% achieved
    const renewable = Math.round(50 + journeyState.selectedTechs.filter(t => 
        ['solar', 'onwind', 'offwind', 'hydro'].includes(t)
    ).length * 8);
    
    const costEl = document.getElementById('projCost');
    const co2El = document.getElementById('projCO2');
    const renewableEl = document.getElementById('projRenewable');
    
    if (costEl) costEl.textContent = `€${cost.toFixed(1)}B`;
    if (co2El) co2El.textContent = `${co2}%`;
    if (renewableEl) renewableEl.textContent = `${Math.min(renewable, 95)}%`;
}
