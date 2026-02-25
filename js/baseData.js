// Base Results Data - 6h vs 12h Resolution Comparison
// Data from PyPSA simulations: germany-2025-true-baseline-v2

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
        electrification: 35,
        peakCapacity: 275
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
        electrification: 34,
        peakCapacity: 275
    }
};

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { baseDataReal };
}