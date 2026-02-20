// PyPSA Energy Journey - Main App
// Tab-based navigation with banner

// State
let currentTab = 'generator';
let currentGenScreen = 0;
const totalGenScreens = 7;  // Updated: Countries, Temporal, CO2, Tech, Storage, Speed, Generate

let journeyState = {
    countries: [],
    timePeriod: 'quarter',  // week, month, quarter, semester, year
    snapshot: 2024,  // Historical data year (2013, 2024, 2025)
    horizon: 2050,   // Planning horizon (future year)
    nodes: 40,       // Number of network nodes
    co2Political: 100,
    co2Mechanism: 'none',
    co2CapLevel: 75,  // 0-100% reduction
    co2Price: 100,
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
    journeyState.timePeriod = period;
    
    // Update UI
    document.querySelectorAll('.time-card').forEach(card => {
        card.classList.toggle('active', card.dataset.time === period);
    });
    
    updateTemporalDisplay();
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
    if (timeEl) timeEl.textContent = `${timeConfig.label} (${timeConfig.days} days)`;
    if (snapshotEl) snapshotEl.textContent = journeyState.snapshot;
    if (nodesEl) nodesEl.textContent = journeyState.nodes;
    if (horizonEl) horizonEl.textContent = journeyState.horizon;
    if (spanEl) {
        const years = journeyState.horizon - journeyState.snapshot;
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
        solar: 0.15, onwind: 0.30, offwind: 0.45, hydro: 0.40,
        ccgt: 0.60, ocgt: 0.10, coal: 0.50, nuclear: 0.85
    };
    
    // Calculate generation contribution (capacity × CF)
    const generation = {};
    let totalGen = 0;
    let cfSum = 0;
    let cfCount = 0;
    let renewableGen = 0;
    let dispatchableGen = 0;
    const renewableTechs = ['solar', 'onwind', 'offwind', 'hydro'];
    const dispatchableTechs = ['ccgt', 'ocgt', 'coal', 'nuclear'];
    
    selected.forEach(tech => {
        const cf = capacityFactors[tech];
        if (cf) {
            // Assume normalized capacity = 1 for each selected tech
            const gen = cf;
            generation[tech] = gen;
            totalGen += gen;
            cfSum += cf;
            cfCount++;
            
            if (renewableTechs.includes(tech)) renewableGen += gen;
            if (dispatchableTechs.includes(tech)) dispatchableGen += gen;
        }
    });
    
    // Calculate percentages
    const mix = {};
    Object.entries(generation).forEach(([tech, gen]) => {
        mix[tech] = totalGen > 0 ? Math.round((gen / totalGen) * 100) : 0;
    });
    
    // Sort by percentage
    const sorted = Object.entries(mix).sort((a, b) => b[1] - a[1]).filter(([, pct]) => pct > 0);
    
    // Calculate stats
    const renewableShare = Math.round((renewableGen / totalGen) * 100) || 0;
    const dispatchableShare = Math.round((dispatchableGen / totalGen) * 100) || 0;
    const avgCF = cfCount > 0 ? Math.round((cfSum / cfCount) * 100) : 0;
    
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
    
    if (index === -1) {
        journeyState.selectedTechs.push(techId);
        if (card) card.classList.add('selected');
    } else {
        journeyState.selectedTechs.splice(index, 1);
        if (card) card.classList.remove('selected');
    }
    
    updateTechSummary();
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
    const { countries, timePeriod, snapshot, horizon, nodes, co2Mechanism, co2CapLevel, co2Price, selectedTechs, storage, speed } = journeyState;
    
    const generators = selectedTechs.filter(t => 
        ['solar', 'onwind', 'offwind', 'hydro', 'nuclear', 'ccgt', 'ocgt', 'coal'].includes(t)
    );
    const stores = selectedTechs.filter(t => 
        ['battery', 'hydrogen', 'pumped'].includes(t)
    );
    
    const timeConfig = timePeriodConfig[timePeriod];
    
    let yaml = `# PyPSA-Eur Configuration\n`;
    yaml += `# Generated by Energy Journey\n`;
    yaml += `# Date: ${new Date().toISOString().split('T')[0]}\n\n`;
    
    yaml += `run:\n`;
    yaml += `  name: energy-journey-${Date.now()}\n\n`;
    
    yaml += `# Temporal Settings\n`;
    yaml += `time_period: ${timePeriod}  # ${timeConfig.label} (${timeConfig.days} days)\n`;
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
    
    yaml += `  extendable_carriers:\n`;
    
    // Generators
    const generatorList = generators.length > 0 ? generators.join(', ') : 'solar, onwind';
    yaml += `    Generator: [${generatorList}]\n`;
    
    // Storage Units (pumped hydro)
    const storageUnits = stores.filter(s => s === 'pumped');
    if (storageUnits.length > 0) {
        yaml += `    StorageUnit: [${storageUnits.join(', ')}]\n`;
    }
    
    // Stores (battery, hydrogen)
    const storeList = stores.filter(s => ['battery', 'hydrogen'].includes(s));
    if (storeList.length > 0) {
        yaml += `    Store: [${storeList.join(', ')}]\n`;
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
