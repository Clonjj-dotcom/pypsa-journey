// Lazy-loaded D3 Map Module
// Cargado solo cuando se necesita el mapa

(function() {
    // Map state
    window.selectedCountries = new Set();
    let mapLoaded = false;
    
    // Country codes mapping (consolidated)
    const countryCodes = {
        "Norway": "NO", "Sweden": "SE", "Finland": "FI", "Denmark": "DK", "Iceland": "IS",
        "United Kingdom": "GB", "Ireland": "IE", "France": "FR", 
        "Netherlands": "NL", "Belgium": "BE", "Luxembourg": "LU",
        "Germany": "DE", "Switzerland": "CH", "Austria": "AT",
        "Czech Republic": "CZ", "Czechia": "CZ", "Poland": "PL", "Slovakia": "SK",
        "Hungary": "HU", "Slovenia": "SI",
        "Spain": "ES", "Portugal": "PT", "Italy": "IT", "Greece": "GR", "Croatia": "HR",
        "Serbia": "RS", "Bosnia and Herzegovina": "BA", "Bosnia and Herz.": "BA", 
        "Montenegro": "ME", "Macedonia": "MK", "North Macedonia": "MK", 
        "Albania": "AL", "Kosovo": "XK",
        "Estonia": "EE", "Latvia": "LV", "Lithuania": "LT",
        "Romania": "RO", "Bulgaria": "BG"
    };
    
    // Label positions for main countries
    const labelData = [
        {code: "DE", name: "Germany"}, {code: "FR", name: "France"},
        {code: "ES", name: "Spain"}, {code: "IT", name: "Italy"},
        {code: "GB", name: "United Kingdom"}, {code: "PL", name: "Poland"},
        {code: "SE", name: "Sweden"}, {code: "NO", name: "Norway"},
        {code: "NL", name: "Netherlands"}, {code: "BE", name: "Belgium"},
        {code: "FI", name: "Finland"}, {code: "DK", name: "Denmark"},
        {code: "AT", name: "Austria"}, {code: "CZ", name: "Czech Republic"},
        {code: "CH", name: "Switzerland"}, {code: "PT", name: "Portugal"},
        {code: "IE", name: "Ireland"}, {code: "GR", name: "Greece"},
        {code: "HU", name: "Hungary"}, {code: "RO", name: "Romania"},
        {code: "BG", name: "Bulgaria"}, {code: "RS", name: "Serbia"},
        {code: "HR", name: "Croatia"}
    ];
    
    window.initD3Map = function() {
        if (mapLoaded) return;
        
        const container = document.getElementById('d3Map');
        if (!container) return;
        
        container.innerHTML = '<div style="padding: 40px; text-align: center; color: #94a3b8;">🗺️ Loading map...</div>';
        
        // Load D3 and TopoJSON dynamically
        Promise.all([
            loadScript('https://d3js.org/d3.v7.min.js'),
            loadScript('https://unpkg.com/topojson@3')
        ]).then(() => {
            renderMap();
        }).catch(err => {
            console.error('Failed to load map libraries:', err);
            container.innerHTML = '<div style="padding: 40px; text-align: center; color: #ef4444;">⚠️ Unable to load map. Please check your connection.</div>';
        });
    };
    
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    function renderMap() {
        const container = document.getElementById('d3Map');
        if (!container) return;
        
        container.innerHTML = '';
        
        const width = 900, height = 550;
        const svg = d3.select('#d3Map')
            .append('svg')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('width', '100%')
            .attr('height', '100%');
        
        const projection = d3.geoMercator()
            .center([18, 50])
            .scale(520)
            .translate([width / 2, height / 2]);
        
        const path = d3.geoPath().projection(projection);
        
        // Load world atlas
        d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json').then(function(world) {
            const countries = topojson.feature(world, world.objects.countries).features;
            const euCountries = countries.filter(d => countryCodes[d.properties.name]);
            
            svg.selectAll('path.country')
                .data(euCountries)
                .join('path')
                .attr('class', 'country')
                .attr('d', path)
                .attr('id', d => countryCodes[d.properties.name])
                .attr('data-name', d => d.properties.name)
                .on('click', function(event, d) {
                    const code = countryCodes[d.properties.name];
                    if (code && typeof toggleCountry === 'function') {
                        toggleCountry(code);
                    }
                });
            
            // Add labels for main countries
            labelData.forEach(l => {
                const country = euCountries.find(c => c.properties.name === l.name);
                if (country) {
                    const centroid = path.centroid(country);
                    l.x = centroid[0];
                    l.y = centroid[1];
                }
            });
            
            const validLabels = labelData.filter(l => l.x && l.y);
            
            svg.selectAll('text.map-label')
                .data(validLabels)
                .join('text')
                .attr('class', 'map-label')
                .attr('x', d => d.x)
                .attr('y', d => d.y)
                .text(d => d.code)
                .style('font-size', '10px')
                .style('fill', '#94a3b8')
                .style('font-weight', '600')
                .style('pointer-events', 'none')
                .style('text-anchor', 'middle')
                .style('text-shadow', '0 1px 2px rgba(0,0,0,0.8)');
            
            // Restore selected countries visual state
            window.selectedCountries.forEach(code => {
                const el = document.getElementById(code);
                if (el) el.classList.add('selected');
            });
            
            mapLoaded = true;
            
        }).catch(err => {
            console.error('Map load error:', err);
            container.innerHTML = '<div style="padding: 40px; text-align: center; color: #ef4444;">⚠️ Unable to load map data. Please refresh.</div>';
        });
    }
})();
