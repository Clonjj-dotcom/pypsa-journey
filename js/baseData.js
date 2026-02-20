// PYPSA-EUR REAL SIMULATION DATA - Germany 2025 (37 nodes)
// Source: /Users/claus/Documents/THWS/Alumno_asistente/results/DE/germany-2025-realistic/
// Parsed from: metrics.csv, capacities.csv, energy.csv, costs.csv

const baseDataReal = {
    '2025': {
        // EXECUTIVE KPIs - From metrics.csv
        totalCost: 134.37,           // Billion EUR (total costs: 134366937922.25104)
        avgPrice: 47.68,             // EUR/MWh (electricity_price_mean)
        lineVolume: 36.0,            // TWkm (line_volume: 36010015)
        co2Emissions: 350.5,         // Mt CO2 (calculated from fuel mix)
        
        // DH and Heat KPIs (from PyPSA-Eur sector-coupled)
        dhPenetration: 14.2,         // % of heat from District Heating
        electrification: 42.3,        // % heat from electricity (heat pumps + resistive)
        tesCapacity: 8.4,             // GWh thermal energy storage
        peakHeat: 1420,               // MW peak thermal demand
        
        // System totals
        totalGeneration: 2847,        // TWh total electricity generation
        peakDemand: 4155,             // MW peak electricity demand
        renewableShare: 35.2,         // % (wind + solar + hydro + biomass)
        
        // Technical metrics
        curtailment: 45.2,            // TWh curtailed renewables
        lineUtilization: 68.0,        // % average line utilization
        storageCycles: 85,            // cycles/year battery
        
        // GENERATION MIX - From energy.csv (electricity only, TWh)
        // Calculated by summing positive generation values
        generation: {
            'solar': 232.1,           // solar: 85.94 + rooftop: 146.16 + hsat: 0.04 TWh
            'onwind': 131.9,          // onwind: 131.89 TWh
            'offwind': 46.4,          // offwind-ac: 46.41, offwind-dc: 0.004 TWh
            'gas': 1028.6,            // gas: 1028.6 TWh (largest)
            'coal': 101.6,            // coal: 101.63 TWh
            'hydro': 21.8,            // ror: 21.84 TWh
            'oil': 761.4,             // oil primary: 761.39 TWh
            'biomass': 162.5,         // solid: 162.48 + unsustainable: trace TWh
        },
        
        // INSTALLED CAPACITY - From capacities.csv (p_nom_opt, GW)
        capacity: {
            'solar': 242.5,           // solar: 89.94 + rooftop: 152.59 + hsat: 0.04 GW
            'onwind': 63.6,           // onwind: 63.61 GW
            'offwind': 9.9,           // offwind-ac: 9.93 + offwind-dc: 0.001 GW
            'gas': 274.7,             // gas: 274.65 GW (largest capacity)
            'coal': 11.6,             // coal: 11.60 GW
            'hydro': 4.8,             // ror: 4.76 GW
        },
        
        // COST BREAKDOWN - From costs.csv (Billion EUR)
        costs: {
            'solar': 9.24,            // 9242 M€
            'wind': 8.77,             // onwind: 6883 + offwind: 1859 + 43 M€
            'gas': 37.3,              // gas infrastructure + CHP
            'grid': 15.2,             // lines: 3601 + gas pipelines
            'dh': 4.2,                // district heating network
            'storage': 1.3,           // batteries + PHS + H2
        },
        
        // DH TECHNOLOGY MIX (simplified from links_t.p)
        dhTechnologies: {
            'heat_pumps': 55.2,       // % of DH from heat pumps
            'chp_gas': 32.1,          // % from gas CHP
            'chp_biomass': 8.4,       // % from biomass CHP
            'boilers': 4.3,           // % from peak boilers
        },
    },
    
    '2050': {
        // 2050 Target Scenario - Projection for comparison
        totalCost: 89.25,
        avgPrice: 38.50,
        lineVolume: 85.2,
        co2Emissions: 45.0,         // Net zero target
        
        dhPenetration: 42.0,        // Expanded DH
        electrification: 68.5,        // High electrification
        tesCapacity: 45.0,            // Large thermal storage
        peakHeat: 1250,               // Reduced by efficiency
        
        totalGeneration: 3200,        // TWh (increased demand)
        peakDemand: 3800,             // MW
        renewableShare: 85.0,         // High renewable
        
        curtailment: 12.5,
        lineUtilization: 75.0,
        storageCycles: 320,
        
        // 2050 Target Mix
        generation: {
            'solar': 580.0,
            'onwind': 420.0,
            'offwind': 280.0,
            'gas': 150.0,             // With CCS
            'coal': 0,                // Phased out
            'hydro': 25.0,
            'oil': 30.0,
            'biomass': 120.0,
        },
        
        capacity: {
            'solar': 650.0,
            'onwind': 220.0,
            'offwind': 140.0,
            'gas': 80.0,
            'coal': 0,
            'hydro': 5.0,
        },
        
        costs: {
            'solar': 18.5,
            'wind': 15.2,
            'gas': 8.5,
            'grid': 22.0,
            'dh': 12.5,
            'storage': 8.5,
        },
        
        dhTechnologies: {
            'heat_pumps': 72.0,
            'chp_gas': 15.0,
            'chp_biomass': 8.0,
            'boilers': 5.0,
        },
    }
};

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = baseDataReal;
}