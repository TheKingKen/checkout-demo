// public/phone-case-shop-app.js

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('checkout-form');
    const errorMessage = document.getElementById('error-message');
    const hkdElem = document.querySelector('.hkd-price');
    const eurElem = document.querySelector('.eur-price');
    const sarElem = document.querySelector('.sar-price');
    const countryRadios = document.getElementsByName('country');

    // Update price based on country selection
    function updatePrice() {
        if (document.querySelector('input[name="country"]:checked').value === 'HK') {
            hkdElem.classList.add('active');
            eurElem.classList.remove('active');
            sarElem.classList.remove('active');
        } else if (document.querySelector('input[name="country"]:checked').value === 'CN') {
            hkdElem.classList.remove('active');
            eurElem.classList.add('active');
            sarElem.classList.remove('active');
        } else {
            hkdElem.classList.remove('active');
            eurElem.classList.remove('active');
            sarElem.classList.add('active');
        }
    }

    countryRadios.forEach(radio =>
        radio.addEventListener('change', updatePrice)
    );
    updatePrice();

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        errorMessage.textContent = "";

        const country = form.country.value;
        let amount, currency, price, phone_country_code;

        if (country === 'HK') {
            amount = 12900; // 129.00 HKD in cents
            currency = 'HKD';
            price = 12900;
            phone_country_code = '+852';
        } else if (country === 'CN') {
            amount = 12000; // 120.00 CNY in cents
            currency = 'CNY';
            price = 12000;
            phone_country_code = '+86';
        } else {
            amount = 6200; // 62.00 SAR in cents
            currency = 'SAR';
            price = 6200;
            phone_country_code = '+966';
        }

        // Basic client-side validation
        let customerPhone = form.phone.value.replace(/\D/g, '');
        if (customerPhone.length < 7) {
            errorMessage.textContent = "Please enter a valid phone number.";
            return;
        }

        const payload = {
            country: country,
            currency: currency,
            amount: amount,
            customer: {
                name: form['customer-name'].value,
                email: form['customer-email'].value,
                phone_country_code: phone_country_code,
                phone_number: customerPhone
            },
            product: {
                name: 'Classic iPhone Case',
                quantity: 1,
                unit_price: price,
                reference: 'iphone-case-demo'
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
            button.disabled = false;
            button.innerText = 'Checkout (Pay Securely)';
        }
    });
});
