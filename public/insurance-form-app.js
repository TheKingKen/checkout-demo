// public/insurance-form-app.js

// Global payload variable so redirectToPayment() can access it
let payload;

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('insurance-form');
    const errorMessage = document.getElementById('error-message');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        errorMessage.textContent = "";

        const submitBtn = form.querySelector('.submit-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = 'Submitting...';
        }
        
        // Get form values
        const customerName = document.getElementById('customer-name').value;
        const customerEmail = document.getElementById('customer-email').value;

        // Static policy value in HKD amount and related details
        const amount = 120000; // 1200.00 HKD in cents
        const currency = 'HKD';
        const price = 120000;
        const country = "HK";
        const phone_country_code = '+852';

        // Basic client-side validation
        let customerPhone = form.phone.value.replace(/\D/g, '');
        if (customerPhone.length < 7) {
            errorMessage.textContent = "Please enter a valid phone number.";
            errorMessage.classList.add('show');

            // Re-enable submit button so user can correct input
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerText = 'Submit Application';
            }

            // Hide error message after 5 seconds
            setTimeout(() => {
                errorMessage.classList.remove('show');
            }, 5000);

            return;
        }

        payload = {
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
                name: 'Comprehensive Insurance',
                quantity: 1,
                unit_price: price,
                reference: 'comprehensive-insurance-00001'
            }
        };
        
        // Log form data (can be replaced with actual submission logic)
        console.log('Insurance Application Submitted:');
        console.log('Name:', customerName);
        console.log('Email:', customerEmail);
        console.log('amount:', phone_country_code);
        console.log('Phone:', customerPhone);
        console.log('currency:', currency);
        console.log('amount:', amount);
        console.log('amount:', country);
        
        // Show success message
        document.getElementById('success-message').classList.add('show');

        // Show pay button
        document.getElementById('pay-btn').classList.add('show');

        // Replace submit button with a non-clickable confirmation label
        const confirmationEl = document.getElementById('submit-confirmation');
        if (submitBtn && confirmationEl) {
            // hide the button and show confirmation label
            submitBtn.style.display = 'none';
            confirmationEl.style.display = 'block';
            confirmationEl.setAttribute('aria-hidden', 'false');
        } else if (submitBtn) {
            // fallback: update button text
            submitBtn.innerText = 'Submitted';
        }
    })
});

// Function to redirect to payment page with payload data
function redirectToPayment() {
    // Store payload in sessionStorage for secure transfer
    if (typeof payload !== 'undefined') {
        sessionStorage.setItem('paymentPayload', JSON.stringify(payload));
        window.location.href = '/payment-flow.html';
    } else {
        alert('Payment data not found. Please submit the form again.');
    }
}