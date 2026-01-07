// public/insurance-form-app.js

// Global payload variable so redirectToPayment() can access it
let payload;

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('insurance-form');
    const errorMessage = document.getElementById('error-message');
    const level2Toggle = document.getElementById('level2-toggle');
    const qrContainer = document.getElementById('qr-container');

    // Initialize Level-2 toggle state and UI
    if (level2Toggle) {
        const level2Enabled = localStorage.getItem('level2Mode') === 'true';
        level2Toggle.innerText = level2Enabled ? 'Level-2: ON' : 'Enable Level-2 Mode';
        level2Toggle.classList.toggle('active', level2Enabled);
        level2Toggle.addEventListener('click', () => {
            const now = !(localStorage.getItem('level2Mode') === 'true');
            localStorage.setItem('level2Mode', now ? 'true' : 'false');
            level2Toggle.innerText = now ? 'Level-2: ON' : 'Enable Level-2 Mode';
            level2Toggle.classList.toggle('active', now);
            // hide QR if toggled off
            if (!now && qrContainer) {
                qrContainer.style.display = 'none';
                qrContainer.innerHTML = '';
            }
        });
    }

    // Flow/HPP toggle moved to payment-flow page; default to Flow here

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        errorMessage.textContent = "";

        const submitBtn = form.querySelector('.submit-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = 'Submitting...';
        }
        // Disable Level-2 toggle once the form is submitted to prevent changing modes mid-flow
        const level2ToggleEl = document.getElementById('level2-toggle');
        if (level2ToggleEl) {
            level2ToggleEl.disabled = true;
            level2ToggleEl.setAttribute('aria-disabled', 'true');
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
        
        // Define success message
        const successMessage = document.getElementById('success-message');

        // If Level-2 mode is enabled, generate and show QR code instead of pay button
        const level2EnabledAfterSubmit = localStorage.getItem('level2Mode') === 'true';
        const payBtn = document.getElementById('pay-btn');
        const loadingContainer = document.getElementById('loading-container');
        if (level2EnabledAfterSubmit) {
            // generate base64 of payload safely
            function base64EncodeUnicode(str) {
                return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
                    return String.fromCharCode('0x' + p1);
                }));
            }

            
            // Flow/HPP toggle is on the payment-flow page; always use Flow for insurance-form
            const useFlow = true;

            if (qrContainer) {
                // Display loading spinner while we load the QR image
                if (loadingContainer) {
                    loadingContainer.style.display = 'block';
                    loadingContainer.setAttribute('role', 'status');
                    loadingContainer.setAttribute('aria-live', 'polite');
                    loadingContainer.setAttribute('aria-label', 'Loading QR code');
                }
            }
            
            // Function to generate and display QR code
            const generateQRCode = (link) => {
                const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(link)}&size=240x240`;
                if (qrContainer) {
                //     // Display loading spinner while we load the QR image
                //     if (loadingContainer) {
                //         loadingContainer.style.display = 'block';
                //         loadingContainer.setAttribute('role', 'status');
                //         loadingContainer.setAttribute('aria-live', 'polite');
                //         loadingContainer.setAttribute('aria-label', 'Loading QR code');
                //     }

                    // Set accessibility attributes on QR container
                    qrContainer.setAttribute('role', 'region');
                    qrContainer.setAttribute('aria-label', 'QR code for payment');
                    qrContainer.setAttribute('aria-live', 'polite');

                    // Create an Image and wait for it to load before inserting into DOM
                    const img = new Image();
                    img.alt = 'QR code: Scan to continue payment';
                    // When image finishes loading, hide spinner and append image inside a link
                    img.onload = () => {
                        // Clear any previous content
                        qrContainer.innerHTML = '';
                        const a = document.createElement('a');
                        a.href = link;
                        a.setAttribute('aria-label', 'Link to payment page (or scan QR code)');
                        a.appendChild(img);
                        qrContainer.appendChild(a);
                        qrContainer.style.display = 'block';

                        // Update success message with scanning instruction
                        successMessage.textContent = 'Thank you! Your application has been submitted successfully. Please scan the QR code above with another device to continue the payment.';
                        successMessage.setAttribute('role', 'status');
                        successMessage.setAttribute('aria-live', 'polite');
                        successMessage.classList.add('show');
                        if (loadingContainer) loadingContainer.style.display = 'none';
                    };

                    // Handle loading errors (show a fallback link and hide spinner)
                    img.onerror = () => {
                        qrContainer.innerHTML = `<div class="note">Unable to load QR code image. <a href="${link}" aria-label="Open payment link">Open payment link</a></div>`;
                        qrContainer.style.display = 'block';
                        qrContainer.setAttribute('aria-label', 'QR code loading failed, use payment link instead');
                        successMessage.textContent = 'Thank you! Your application has been submitted. Click the link to continue the payment.';
                        successMessage.setAttribute('role', 'alert');
                        successMessage.classList.add('show');
                        if (loadingContainer) loadingContainer.style.display = 'none';
                    };

                    // Fallback timeout: if image doesn't load in 10s, show link and hide spinner
                    const fallbackTimer = setTimeout(() => {
                        if (!img.complete) {
                            img.onload = img.onerror = null; // prevent later handlers
                            qrContainer.innerHTML = `<div class="note">QR generation is taking longer than expected. <a href="${link}" aria-label="Open payment link (QR timeout)">Open payment link</a></div>`;
                            qrContainer.style.display = 'block';
                            qrContainer.setAttribute('aria-label', 'QR code loading timeout, use payment link instead');
                            successMessage.textContent = 'Thank you! Your application has been submitted. Use the link to continue the payment.';
                            successMessage.setAttribute('role', 'alert');
                            successMessage.classList.add('show');
                            if (loadingContainer) loadingContainer.style.display = 'none';
                        }
                    }, 10000);

                    // Start loading the QR image (this triggers onload/onerror)
                    img.src = qrSrc;
                }
            };

            // Generate QR code based on Flow/HPP mode
            if (useFlow) {
                // Flow mode: generate QR with encoded payload and payment-flow.html URL
                // Try to fetch a public tunnel URL from the server (if cloudflared is running)
                const encoded = base64EncodeUnicode(JSON.stringify(payload));
                const buildAndGenerate = (base) => {
                    const link = `${base.replace(/\/+$/,'')}/user-auth.html?data=${encodeURIComponent(encoded)}`;
                    generateQRCode(link);
                };

                // Try to fetch a public tunnel URL from the server (if cloudflared is running)
                // If the public URL exists but is not reachable from this client (VPN or network blocking),
                // fall back to using the current origin so the developer can test on the same device.
                const probeUrlReachable = async (baseUrl, timeout = 3000) => {
                    try {
                        const probe = `${baseUrl.replace(/\/+$/,'')}/user-auth.html`;
                        const controller = new AbortController();
                        const id = setTimeout(() => controller.abort(), timeout);
                        const resp = await fetch(probe, { method: 'GET', cache: 'no-store', signal: controller.signal });
                        clearTimeout(id);
                        return resp.ok;
                    } catch (e) {
                        return false;
                    }
                };

                fetch('/tunnel-url').then(r => {
                    if (!r.ok) throw new Error('no tunnel');
                    return r.json();
                }).then(async (json) => {
                    if (json && json.url) {
                        const ok = await probeUrlReachable(json.url, 3000);
                        if (ok) {
                            buildAndGenerate(json.url);
                        } else {
                            // public URL not reachable from this client; fallback to origin
                            buildAndGenerate(window.location.origin);
                        }
                    } else {
                        buildAndGenerate(window.location.origin);
                    }
                }).catch(() => {
                    // fallback to current origin if tunnel URL not available
                    buildAndGenerate(window.location.origin);
                });
            } else {
                // HPP mode: fetch payment link from /create-payment-link2 and generate QR with that link
                (async () => {
                    try {
                        const response = await fetch('/create-payment-link2', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });

                        const text = await response.text();
                        let data;
                        try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }

                        if (response.ok && data.link) {
                            // Generate QR with HPP link
                            generateQRCode(data.link);
                        } else {
                            // Error: show fallback message
                            const errMsg = data.error || data.details || data.message || JSON.stringify(data);
                            if (qrContainer) {
                                qrContainer.innerHTML = `<div class="note">Error creating payment link: ${errMsg}</div>`;
                                qrContainer.style.display = 'block';
                                qrContainer.setAttribute('aria-label', 'Error generating QR code');
                            }
                            if (loadingContainer) loadingContainer.style.display = 'none';
                            successMessage.textContent = 'Error creating payment link. Please try again.';
                            successMessage.setAttribute('role', 'alert');
                            successMessage.classList.add('show');
                        }
                    } catch (err) {
                        // Network error
                        const errMsg = err.message || err;
                        if (qrContainer) {
                            qrContainer.innerHTML = `<div class="note">Network error: ${errMsg}</div>`;
                            qrContainer.style.display = 'block';
                            qrContainer.setAttribute('aria-label', 'Network error generating QR code');
                        }
                        if (loadingContainer) loadingContainer.style.display = 'none';
                        successMessage.textContent = 'Network error creating payment link. Please try again.';
                        successMessage.setAttribute('role', 'alert');
                        successMessage.classList.add('show');
                    }
                })();
            }

            // Hide pay button when Level-2 is enabled
            if (payBtn) payBtn.classList.remove('show');
        } else {
            // Show pay button for same-device flow
            if (payBtn) payBtn.classList.add('show');

            // Set success message for pay button flow
            successMessage.textContent = 'Thank you! Your application has been submitted successfully. Please continue the payment by clicking the button below.';
            successMessage.setAttribute('role', 'status');
            successMessage.setAttribute('aria-live', 'polite');
            successMessage.classList.add('show');
        }

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
    // Disable the Pay button while redirecting to HPP
    const payBtn = document.getElementById('pay-btn');
    payBtn.disabled = true;
    payBtn.innerText = 'Redirecting...';

    // Insurance form always uses Flow for redirecting to payment-flow
    const useFlow = true;

    if (typeof payload === 'undefined') {
        alert('Payment data not found. Please submit the form again.');
        return;
    }

    if (useFlow) {
        // Flow mode: redirect to payment-flow.html via sessionStorage
        sessionStorage.setItem('paymentPayload', JSON.stringify(payload));
        window.location.href = '/user-auth.html';
    } else {
        // HPP mode: call /create-payment-link2 and redirect to HPP
        (async () => {
            try {
                const response = await fetch('/create-payment-link2', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const text = await response.text();
                let data;
                try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }

                if (response.ok && data.link) {
                    // Redirect to Hosted Payments Page
                    window.location.href = data.link;
                    return;
                }

                // Not ok: show server-provided details
                console.error('Create payment link failed', response.status, data);
                console.error('payload', payload);
                const errMsg = data.error || data.details || data.message || JSON.stringify(data);
                alert('Error creating payment link: ' + errMsg);
            } catch (err) {
                console.error('Network or unexpected error:', err);
                alert('Network error creating payment link: ' + (err.message || err));
            }
        })();
    }
}