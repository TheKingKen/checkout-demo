// public/phone-case-shop-app.js

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('checkout-form');
    const errorMessage = document.getElementById('error-message');
    const hkdElem = document.querySelector('.hkd-price');
    const usdElem = document.querySelector('.usd-price');
    const eurElem = document.querySelector('.eur-price');
    const sarElem = document.querySelector('.sar-price');
    const countryRadios = document.getElementsByName('country');

    // Update price based on country selection
    function updatePrice() {
        if (document.querySelector('input[name="country"]:checked').value === 'HK') {
            hkdElem.classList.add('active');
            usdElem.classList.remove('active');
            eurElem.classList.remove('active');
            sarElem.classList.remove('active');
        } else if (document.querySelector('input[name="country"]:checked').value === 'US') {
            hkdElem.classList.remove('active');
            usdElem.classList.add('active');
            eurElem.classList.remove('active');
            sarElem.classList.remove('active');
        } else if (document.querySelector('input[name="country"]:checked').value === 'CN') {
            hkdElem.classList.remove('active');
            usdElem.classList.remove('active');
            eurElem.classList.add('active');
            sarElem.classList.remove('active');
        } else {
            hkdElem.classList.remove('active');
            usdElem.classList.remove('active');
            eurElem.classList.remove('active');
            sarElem.classList.add('active');
        }
    }

    countryRadios.forEach(radio =>
        radio.addEventListener('change', updatePrice)
    );
    updatePrice();

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

            // Validate form
            const customerName = form['customer-name'].value.trim();
            const customerEmail = form['customer-email'].value.trim();
            const country = form.country.value;
            const address = form['customer-address'].value.trim();
            const phone = form['customer-phone'].value.trim();
            const productName = document.getElementById('product-name').value.trim();
            const productDescription = document.getElementById('product-description').value.trim();

            if (!customerName || !customerEmail || !address || !phone) {
                errorMessage.textContent = "Please fill in all required fields.";
                return;
            }

            let currency;
            if (country === 'HK') {
                currency = 'HKD';
            } else if (country === 'US') {
                currency = 'USD';
            } else if (country === 'CN') {
                currency = 'CNY';
            } else {
                currency = 'SAR';
            }

            // Store customer data in sessionStorage
            const customerData = {
                name: customerName,
                email: customerEmail,
                phone: phone.replace(/\D/g, ''),
                country: country,
                address: address,
                currency: currency,
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

        const country = form.country.value;
        let amount, currency, price, phone_country_code;

        if (country === 'HK') {
            amount = 12900; // 129.00 HKD in cents
            currency = 'HKD';
            price = 12900;
            phone_country_code = '+852';
        } else if (country === 'US') {
            amount = 1600; // 16.00 USD in cents
            currency = 'USD';
            price = 1600;
            phone_country_code = '+1';
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

        // Get product name and description from inputs
        const productName = document.getElementById('product-name').value.trim() || 'Classic iPhone Case';
        const productDescription = document.getElementById('product-description').value.trim();

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
            button.disabled = false;
            button.innerText = 'Checkout (Pay Securely)';
        }
    });
});
