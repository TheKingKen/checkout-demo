// public/checkout-shared.js
(function () {
    const COUNTRY_PHONE_CODE_MAP = {
        'HK': '+852',
        'US': '+1',
        'CN': '+86',
        'SA': '+966',
        'SG': '+65',
        'JP': '+81',
        'TH': '+66',
        'GB': '+44',
        'AU': '+61',
        'NL': '+31',
        'FR': '+33',
        'DE': '+49',
        'KW': '+965',
        'AE': '+971',
        'QA': '+974',
        'BH': '+973',
        'OM': '+968',
        'CL': '+56',
        'MX': '+52',
        'BR': '+55',
        'IN': '+91',
        'KR': '+82',
        'TW': '+886',
        'MO': '+853'
    };

    const CURRENCY_COUNTRY_MAP = {
        'HKD': ['HK', 'MO'],
        'CNY': ['CN'],
        'USD': ['US'],
        'GBP': ['GB'],
        'AUD': ['AU'],
        'JPY': ['JP'],
        'SGD': ['SG'],
        'THB': ['TH'],
        'KRW': ['KR'],
        'TWD': ['TW'],
        'MOP': ['MO'],
        'EUR': ['NL', 'FR', 'DE'],
        'SAR': ['SA'],
        'AED': ['AE'],
        'QAR': ['QA'],
        'KWD': ['KW'],
        'BHD': ['BH'],
        'OMR': ['OM'],
        'MXN': ['MX'],
        'BRL': ['BR'],
        'CLP': ['CL'],
        'INR': ['IN']
    };

    function getPhoneCountryCode(countryCode) {
        return COUNTRY_PHONE_CODE_MAP[countryCode] || '+1';
    }

    function isCurrencyValidForCountry(currencyCode, countryCode) {
        const normalizedCurrency = (currencyCode || '').toUpperCase();
        const validCountries = CURRENCY_COUNTRY_MAP[normalizedCurrency] || [];
        return validCountries.includes(countryCode);
    }

    function getValidCurrenciesForCountry(countryCode) {
        return Object.keys(CURRENCY_COUNTRY_MAP).filter((currency) => CURRENCY_COUNTRY_MAP[currency].includes(countryCode));
    }

    window.CheckoutShared = {
        COUNTRY_PHONE_CODE_MAP,
        CURRENCY_COUNTRY_MAP,
        getPhoneCountryCode,
        isCurrencyValidForCountry,
        getValidCurrenciesForCountry
    };
})();
