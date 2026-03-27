// public/phone-case-shop-app.js

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('checkout-form');
    const errorMessage = document.getElementById('error-message');
    const countrySelect = document.getElementById('country-select');
    const customCurrencyInput = document.getElementById('custom-currency');
    const customAmountInput = document.getElementById('custom-amount');
    const shared = window.CheckoutShared || {};
    const CURRENCY_COUNTRY_MAP = shared.CURRENCY_COUNTRY_MAP || {};
    const isCurrencyValidForCountry = shared.isCurrencyValidForCountry || function (currencyCode, countryCode) {
        const validCountries = CURRENCY_COUNTRY_MAP[(currencyCode || '').toUpperCase()] || [];
        return validCountries.includes(countryCode);
    };
    const getValidCurrenciesForCountry = shared.getValidCurrenciesForCountry || function (countryCode) {
        return Object.keys(CURRENCY_COUNTRY_MAP).filter((currencyCode) => CURRENCY_COUNTRY_MAP[currencyCode].includes(countryCode));
    };
    function prepareAndRedirect(storedCardMode, defaultUseFlow) {
        errorMessage.textContent = "";
        errorMessage.classList.remove('show');

        const customerName = form['customer-name'].value.trim();
        const customerEmail = form['customer-email'].value.trim();
        const country = countrySelect.value;
        const address = form['customer-address'].value.trim();
        const phone = form['customer-phone'].value.trim();
        const productName = document.getElementById('product-name').value.trim();
        const productDescription = document.getElementById('product-description').value.trim();

        if (!customerName || !customerEmail || !country || !address || !phone) {
            errorMessage.textContent = "Please fill in all required fields.";
            errorMessage.classList.add('show');
            return;
        }

        const currency = customCurrencyInput.value.trim().toUpperCase();
        const amountStr = customAmountInput.value.trim();
        if (!currency || !amountStr) {
            errorMessage.textContent = "Please enter both currency code and amount.";
            errorMessage.classList.add('show');
            return;
        }

        const amountFloat = parseFloat(amountStr);
        if (isNaN(amountFloat) || amountFloat <= 0) {
            errorMessage.textContent = "Please enter a valid amount.";
            errorMessage.classList.add('show');
            return;
        }

        if (!isCurrencyValidForCountry(currency, country)) {
            const validCurrencies = getValidCurrenciesForCountry(country).join(', ');
            errorMessage.textContent = `Currency ${currency} is not valid for ${countrySelect.options[countrySelect.selectedIndex].text}. Valid currencies: ${validCurrencies || 'None registered'}`;
            errorMessage.classList.add('show');
            return;
        }

        const customerData = {
            name: customerName,
            email: customerEmail,
            phone: phone.replace(/\D/g, ''),
            country: country,
            address: address,
            currency: currency,
            amount: Math.round(amountFloat * 100),
            productName: productName,
            productDescription: productDescription
        };

        sessionStorage.setItem('phoneShopCustomerData', JSON.stringify(customerData));
        sessionStorage.setItem('phoneShopStoredCardMode', storedCardMode);
        sessionStorage.setItem('phoneShopDefaultUseFlow', defaultUseFlow ? 'true' : 'false');
        window.location.href = '/easy-checkout-demo/phone-case-shop-payment.html';
    }

    const rememberMeBtn = document.getElementById('checkout-rememberme-btn');
    if (rememberMeBtn) {
        rememberMeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            prepareAndRedirect('remember_me', false);
        });
    }

    const merchantStoredBtn = document.getElementById('checkout-merchant-stored-btn');
    if (merchantStoredBtn) {
        merchantStoredBtn.addEventListener('click', (e) => {
            e.preventDefault();
            prepareAndRedirect('merchant_stored_card', true);
        });
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        prepareAndRedirect('remember_me', false);
    });
});
