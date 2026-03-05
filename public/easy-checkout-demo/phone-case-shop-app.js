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
    const getPhoneCountryCode = shared.getPhoneCountryCode || function () { return '+1'; };

    // Handle HPP button (form submit)
    const hppBtn = document.getElementById('checkout-hpp-btn');
    if (hppBtn) {
        hppBtn.addEventListener('click', (e) => {
            e.preventDefault();
            form.dispatchEvent(new Event('submit'));
        });
    }

    // Handle Flow button (navigate to payment-flow page)
    const flowBtn = document.getElementById('checkout-flow-btn');
    if (flowBtn) {
        flowBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            errorMessage.textContent = "";
            errorMessage.classList.remove('show');

            // Validate form
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

            // Currency is determined by custom input
            const currency = customCurrencyInput.value.trim().toUpperCase();
            const amountStr = customAmountInput.value.trim();
            
            if (!currency) {
                errorMessage.textContent = "Please enter a currency code.";
                errorMessage.classList.add('show');
                return;
            }

            if (!amountStr) {
                errorMessage.textContent = "Please enter an amount.";
                errorMessage.classList.add('show');
                return;
            }

            const amountFloat = parseFloat(amountStr);
            if (isNaN(amountFloat) || amountFloat <= 0) {
                errorMessage.textContent = "Please enter a valid amount.";
                errorMessage.classList.add('show');
                return;
            }

            const amount = Math.round(amountFloat * 100); // Convert to minor units

            // Validate that currency code matches the selected country
            if (!isCurrencyValidForCountry(currency, country)) {
                const validCurrencies = getValidCurrenciesForCountry(country).join(', ');
                errorMessage.textContent = `Currency ${currency} is not valid for ${countrySelect.options[countrySelect.selectedIndex].text}. Valid currencies: ${validCurrencies || 'None registered'}`;
                errorMessage.classList.add('show');
                return;
            }

            // Store customer data in sessionStorage
            const customerData = {
                name: customerName,
                email: customerEmail,
                phone: phone.replace(/\D/g, ''),
                country: country,
                address: address,
                currency: currency,
                amount: amount,
                productName: productName,
                productDescription: productDescription
            };

            sessionStorage.setItem('phoneShopCustomerData', JSON.stringify(customerData));

            // Navigate to phone case payment page
            window.location.href = '/easy-checkout-demo/phone-case-shop-payment.html';
        });
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        errorMessage.textContent = "";
        errorMessage.classList.remove('show');

        // Basic client-side validation
        const customerName = form['customer-name'].value.trim();
        const customerEmail = form['customer-email'].value.trim();
        const country = countrySelect.value;
        const address = form['customer-address'].value.trim();
        const productName = document.getElementById('product-name').value.trim() || 'Classic iPhone Case';
        const productDescription = document.getElementById('product-description').value.trim();
        
        if (!customerName || !customerEmail || !country || !address) {
            errorMessage.textContent = "Please fill in all required fields.";
            errorMessage.classList.add('show');
            return;
        }

        let customerPhone = form.phone.value.replace(/\D/g, '');
        if (customerPhone.length < 7) {
            errorMessage.textContent = "Please enter a valid phone number.";
            errorMessage.classList.add('show');
            return;
        }

        // Validate custom currency and amount
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

        // Validate that currency code matches the selected country
        if (!isCurrencyValidForCountry(currency, country)) {
            const validCurrencies = getValidCurrenciesForCountry(country).join(', ');
            errorMessage.textContent = `Currency ${currency} is not valid for ${countrySelect.options[countrySelect.selectedIndex].text}. Valid currencies: ${validCurrencies || 'None registered'}`;
            errorMessage.classList.add('show');
            return;
        }

        const amount = Math.round(amountFloat * 100); // Convert to cents
        const price = amount;
        const phone_country_code = getPhoneCountryCode(country);

        const payload = {
            country: country,
            currency: currency,
            amount: amount,
            customer: {
                name: customerName,
                email: customerEmail,
                phone_country_code: phone_country_code,
                phone_number: customerPhone
            },
            product: {
                name: productName,
                quantity: 1,
                unit_price: price,
                reference: 'iphone-case-demo',
                description: productDescription
            }
        };

        // Disable button and show loading state
        const button = form.querySelector('.checkout-btn');
        button.disabled = true;
        button.innerText = 'Redirecting...';

        try {
            const resp = await fetch('/create-payment-link', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });
            
            /*const data = await resp.json();
            if (data.url) {
                window.location.href = data.url;
            } else if (data.error) {
                throw new Error(data.error);
            } else {
                throw new Error('Unknown error occurred creating payment link.');
            }*/

            const text = await resp.text();
            let data;
            try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }

            if (resp.ok && data.link) {
              // redirect to Hosted Payments Page
              window.location.href = data.link;
              return;
            }

            // Not ok: show server-provided details (helpful during debug)
            console.error('Create payment link failed', resp.status, data);
            console.error('payload', payload);
            const errMsg = data.error || data.details || data.message || JSON.stringify(data);
            alert('Error creating payment link: ' + errMsg);
        } catch (err) {
            console.error('Network or unexpected error:', err);
            alert('Network error creating payment link: ' + (err.message || err));
            
            errorMessage.textContent = 'Error: ' + (err.message || 'Failed to create payment link.');
            errorMessage.classList.add('show');
            button.disabled = false;
            button.innerText = 'Checkout (Pay Securely)';
        }
    });
});
