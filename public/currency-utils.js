// Currency conversion utility
// Base currency is HKD (Hong Kong Dollar)

// Global currency state
let currentCurrency = localStorage.getItem('selectedCurrency') || 'HKD';
let fxRates = {};

// Exchange rates (live rates from exchangerate-api.com or similar)
// Base: 1 HKD = X currency
const FX_API_URL = 'https://api.exchangerate-api.com/v4/latest/HKD';

// Fetch live FX rates
async function fetchFXRates() {
    try {
        const response = await fetch(FX_API_URL);
        const data = await response.json();
        fxRates = data.rates;
        console.log('FX rates loaded:', fxRates);
        return fxRates;
    } catch (error) {
        console.error('Failed to fetch FX rates, using fallback rates:', error);
        // Fallback rates (approximate)
        fxRates = {
            HKD: 1,
            USD: 0.128,
            GBP: 0.100,
            AED: 0.470,
            CNY: 0.925,
            JPY: 19.50,
            SGD: 0.172
        };
        return fxRates;
    }
}

// Convert price from HKD to target currency
function convertPrice(hkdPrice, targetCurrency = currentCurrency) {
    if (!fxRates[targetCurrency]) {
        console.warn(`No FX rate for ${targetCurrency}, using HKD`);
        return hkdPrice;
    }
    
    const converted = hkdPrice * fxRates[targetCurrency];
    
    // Round to 2 decimal places for most currencies, 0 for JPY (no decimal)
    if (targetCurrency === 'JPY') {
        return Math.round(converted);
    }
    return Math.round(converted * 100) / 100;
}

// Format price with currency code
function formatPrice(hkdPrice, targetCurrency = currentCurrency) {
    const converted = convertPrice(hkdPrice, targetCurrency);
    
    // Format based on currency
    if (targetCurrency === 'JPY') {
        return `${targetCurrency} ${converted.toLocaleString()}`;
    }
    return `${targetCurrency} ${converted.toFixed(2)}`;
}

// Get current currency
function getCurrentCurrency() {
    return currentCurrency;
}

// Set current currency
function setCurrentCurrency(currency) {
    currentCurrency = currency;
    localStorage.setItem('selectedCurrency', currency);
}

// Initialize currency selector
function initCurrencySelector(onCurrencyChange) {
    const selector = document.getElementById('currency-selector');
    if (!selector) return;
    
    // Set saved currency
    selector.value = currentCurrency;
    
    // Handle currency change
    selector.addEventListener('change', async (e) => {
        setCurrentCurrency(e.target.value);
        if (onCurrencyChange) {
            onCurrencyChange(e.target.value);
        }
    });
}

// Export functions
window.CurrencyUtils = {
    fetchFXRates,
    convertPrice,
    formatPrice,
    getCurrentCurrency,
    setCurrentCurrency,
    initCurrencySelector
};
