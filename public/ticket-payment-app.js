// public/ticket-payment-app.js

const paymentEligibilityState = {
    isEligible: false,
    scheme: '',
    issuer: '',
    cardNumber: ''
};

function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        event: params.get('event') || '',
        price: params.get('price') || '',
        index: params.get('index') || '',
        status: params.get('status') || 'presale'
    };
}

function buildNextUrl(context, nextPage) {
    const query = `event=${encodeURIComponent(context.event)}&price=${context.price}&index=${context.index}&status=${context.status}`;
    return `${nextPage}?${query}`;
}

// Breadcrumb navigation functions
function goToEligibility(event) {
    event.preventDefault();
    const context = getQueryParams();
    window.location.href = buildNextUrl(context, '/ticket-eligibility.html');
}

function goToSeatSelection(event) {
    event.preventDefault();
    const context = getQueryParams();
    window.location.href = buildNextUrl(context, '/ticket-seat-selection.html');
}

function formatCurrency(amount) {
    return `HKD ${amount}`;
}

function formatCardNumber(value) {
    const digits = value.replace(/\D/g, '').slice(0, 19);
    const groups = digits.match(/.{1,4}/g) || [];
    return groups.join(' ');
}

function getHoldExpiry() {
    const stored = sessionStorage.getItem('ticketHoldExpiresAt');
    return stored ? parseInt(stored, 10) : null;
}

function clearSavedToken() {
    localStorage.removeItem('ticketSavedCard');
    localStorage.removeItem('ticketSavedCardEligible');
}

function handleHoldExpiry(context, timerId) {
    sessionStorage.removeItem('ticketHoldExpiresAt');
    sessionStorage.removeItem('ticketSeatSelection');
    clearSavedToken();
    if (timerId) {
        clearInterval(timerId);
    }
    window.location.href = buildNextUrl(context, '/ticket-eligibility.html');
}

function renderTimer(expiresAt, context) {
    const timerEl = document.getElementById('payment-timer');
    let hasExpired = false;
    let timerId = null;

    const update = () => {
        const remaining = Math.max(0, expiresAt - Date.now());
        const minutes = Math.floor(remaining / 60000).toString().padStart(2, '0');
        const seconds = Math.floor((remaining % 60000) / 1000).toString().padStart(2, '0');
        timerEl.textContent = `${minutes}:${seconds}`;

        if (remaining <= 0 && !hasExpired) {
            hasExpired = true;
            timerEl.textContent = '00:00';
            handleHoldExpiry(context, timerId);
        }
    };

    update();
    timerId = setInterval(update, 1000);
    return timerId;
}

function renderSummary(selection) {
    const summary = document.getElementById('ticket-payment-summary');
    if (!selection) {
        summary.textContent = 'No seat selection found.';
        return;
    }

    summary.innerHTML = `
        <div class="seat-summary-row">
            <span>Seat</span>
            <strong>${selection.seat}</strong>
        </div>
        <div class="seat-summary-row">
            <span>Category price</span>
            <strong>${formatCurrency(selection.categoryPrice)}</strong>
        </div>
    `;
}

function renderSavedCard() {
    const panel = document.getElementById('saved-card-panel');
    const raw = localStorage.getItem('ticketSavedCard');
    if (!raw) {
        return null;
    }

    const saved = JSON.parse(raw);
    panel.innerHTML = `
        <div class="saved-card-detail">
            <span>Saved card</span>
            <strong>${(saved.scheme || 'card').toUpperCase()} •••• ${saved.last4 || '0000'}</strong>
        </div>
        <div class="saved-card-detail">
            <span>Expiry</span>
            <strong>${saved.expiry_month}/${saved.expiry_year}</strong>
        </div>
    `;
    return saved;
}

// Criteria functions (shared with eligibility page)
function getCriteria() {
    const scheme = document.getElementById('criteria-scheme')?.value || 'all';
    const issuer = document.getElementById('criteria-issuer')?.value || 'all';
    const product = document.getElementById('criteria-product')?.value || 'all';
    return { scheme, issuer, product };
}

function saveCriteriaPreferences() {
    const criteria = getCriteria();
    localStorage.setItem('ticketCriteriaPreferences', JSON.stringify(criteria));
}

function loadCriteriaPreferences() {
    const stored = localStorage.getItem('ticketCriteriaPreferences');
    if (!stored) return;
    
    const criteria = JSON.parse(stored);
    if (document.getElementById('criteria-scheme')) {
        document.getElementById('criteria-scheme').value = criteria.scheme || 'all';
    }
    if (document.getElementById('criteria-issuer')) {
        document.getElementById('criteria-issuer').value = criteria.issuer || 'all';
    }
    if (document.getElementById('criteria-product')) {
        document.getElementById('criteria-product').value = criteria.product || 'all';
    }
}

function updateCriteriaDisplay() {
    const criteria = getCriteria();
    const parts = [];
    
    if (criteria.scheme !== 'all') {
        parts.push(criteria.scheme.charAt(0).toUpperCase() + criteria.scheme.slice(1));
    } else {
        parts.push('Any scheme');
    }
    
    if (criteria.issuer !== 'all') {
        const issuerNames = {
            'river_valley': 'River Valley',
            'lloyds': 'Lloyds',
            'sbm': 'SBM',
            'euro': 'Euro'
        };
        parts.push(issuerNames[criteria.issuer] || criteria.issuer);
    } else {
        parts.push('Any issuer');
    }
    
    if (criteria.product !== 'all') {
        parts.push(criteria.product);
    } else {
        parts.push('Any product type');
    }

    const display = document.getElementById('criteria-display');
    if (display) {
        display.textContent = parts.join(', ');
    }
}

function resetCriteriaToDefaults() {
    if (document.getElementById('criteria-scheme')) {
        document.getElementById('criteria-scheme').value = 'all';
    }
    if (document.getElementById('criteria-issuer')) {
        document.getElementById('criteria-issuer').value = 'all';
    }
    if (document.getElementById('criteria-product')) {
        document.getElementById('criteria-product').value = 'all';
    }
    updateCriteriaDisplay();
    saveCriteriaPreferences();
}

// Card metadata checking  
async function checkCardMetadata(cardNumber) {
    try {
        const response = await fetch('/card-metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ number: cardNumber, type: 'card', format: 'basic' })
        });
        
        if (!response.ok) {
            throw new Error('Card check failed');
        }
        
        return await response.json();
    } catch (error) {
        throw new Error('Unable to check card: ' + error.message);
    }
}

function checkEligibilityAgainstCriteria(metadata) {
    const criteria = getCriteria();
    
    if (criteria.scheme !== 'all') {
        const scheme = (metadata.scheme || '').toLowerCase();
        if (scheme !== criteria.scheme) return false;
    }
    
    if (criteria.issuer !== 'all') {
        const issuer = (metadata.issuer || '').toLowerCase();
        if (!issuer.includes(criteria.issuer)) return false;
    }
    
    return true;
}

function getCardTypeBadge(metadata) {
    const scheme = (metadata.scheme || '').toUpperCase();
    const type = (metadata.card_type || '').toLowerCase();
    if (type === 'credit') {
        return ` (${scheme} Credit)`;
    } else if (type === 'debit') {
        return ` (${scheme} Debit)`;
    }
    return ` (${scheme})`;
}

function setPaymentEligibilityStatus(message, status) {
    const el = document.getElementById('payment-eligibility-status');
    if (!el) return;
    
    el.textContent = message;
    el.className = `payment-eligibility-status status-${status}`;
    if (status === 'success') {
        el.classList.add('success');
    }
}

function showPaymentFormSections() {
    const el = document.getElementById('payment-form-sections');
    if (el) {
        el.classList.remove('hidden');
    }
}

function hidePaymentFormSections() {
    const el = document.getElementById('payment-form-sections');
    if (el) {
        el.classList.add('hidden');
    }
}

// Only show form sections if card is complete AND eligible
function updatePaymentFormVisibility() {
    const cardInput = document.getElementById('payment-card-number');
    if (!cardInput) return;
    
    const digits = cardInput.value.replace(/\D/g, '');
    const isComplete = digits.length === 16;
    const isEligible = paymentEligibilityState.isEligible;
    
    if (isComplete && isEligible) {
        showPaymentFormSections();
    } else {
        hidePaymentFormSections();
    }
}

// Payment functions
async function payWithStoredCardToken(context, selection, savedCard) {
    try {
        const amount = parseInt(selection.categoryPrice) * 100; // Convert to cents
        
        const paymentRequest = {
            source: {
                type: 'token',
                token: savedCard.token
            },
            amount: amount,
            currency: 'HKD',
            customer: {
                name: savedCard.cardholderName || 'Ticket Buyer'
            },
            products: [
                {
                    name: `Ticket - ${context.event}`,
                    quantity: 1,
                    unit_price: amount,
                    reference: `TICKET-${context.index || 0}`
                }
            ],
            payment_type: 'Regular',
            reference: `TICKET-${Date.now()}`,
            description: `Ticket for ${context.event}`,
            '3ds': {
                enabled: true,
                challenge_indicator: 'challenge_requested_mandate'
            }
        };

        const response = await fetch('/pay-with-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentRequest)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Payment failed: ' + response.statusText);
        }

        const result = await response.json();
        
        // Check if 3DS authentication is required
        if (result._links?.redirect?.href) {
            console.log('3DS authentication required for saved card, redirecting to:', result._links.redirect.href);
            // Redirect to 3DS authentication page
            window.location.href = result._links.redirect.href;
            // Don't return yet - the redirect will take over
            return new Promise(() => {}); // Keep promise pending during redirect
        }
        
        console.log('Saved card payment successful without 3DS redirect:', result);
        return result;
    } catch (error) {
        throw new Error('Payment processing failed: ' + error.message);
    }
}

async function payWithNewCard(context, selection, cardData) {
    try {
        const amount = parseInt(selection.categoryPrice) * 100; // Convert to cents
        
        // Prepare payment data with card source - skip tokenization step
        const paymentRequest = {
            source: {
                type: 'card',
                number: cardData.cardNumber,
                expiry_month: cardData.expiryMonth,
                expiry_year: cardData.expiryYear,
                cvv: cardData.cvv
            },
            amount: amount,
            currency: 'HKD',
            customer: {
                name: cardData.cardholderName
            },
            products: [
                {
                    name: `Ticket - ${context.event}`,
                    quantity: 1,
                    unit_price: amount,
                    reference: `TICKET-${context.index || 0}`
                }
            ],
            payment_type: 'Regular',
            reference: `TICKET-${Date.now()}`,
            description: `Ticket for ${context.event}`,
            '3ds': {
                enabled: true,
                challenge_indicator: 'challenge_requested_mandate'
            }
        };

        // Call process-payment endpoint directly with card source
        const response = await fetch('/process-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentRequest)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Payment failed: ' + response.statusText);
        }

        const result = await response.json();
        
        // Check if 3DS authentication is required
        if (result._links?.redirect?.href) {
            console.log('3DS authentication required, redirecting to:', result._links.redirect.href);
            // Redirect to 3DS authentication page
            window.location.href = result._links.redirect.href;
            // Don't return yet - the redirect will take over
            return new Promise(() => {}); // Keep promise pending during redirect
        }
        
        console.log('Payment successful without 3DS redirect:', result);
        return result;
    } catch (error) {
        throw new Error('Payment processing failed: ' + error.message);
    }
}

function parseExpiry(value) {
    const match = value.match(/^(\d{1,2})\/(\d{2})$/);
    if (!match) return null;
    return { month: parseInt(match[1]), year: 2000 + parseInt(match[2]) };
}

document.addEventListener('DOMContentLoaded', () => {
    const context = getQueryParams();
    const selectionRaw = sessionStorage.getItem('ticketSeatSelection');
    const selection = selectionRaw ? JSON.parse(selectionRaw) : null;
    
    if (document.getElementById('payment-event')) {
        document.getElementById('payment-event').textContent = context.event ? `Event: ${context.event}` : '';
    }

    renderSummary(selection);
    const savedCard = renderSavedCard();

    const expiresAt = getHoldExpiry();
    if (!expiresAt || expiresAt <= Date.now()) {
        handleHoldExpiry(context);
        return;
    }

    renderTimer(expiresAt, context);

    // Determine whether to show saved card or new card form
    const savedCardActions = document.getElementById('saved-card-actions');
    const paymentForm = document.getElementById('payment-form');
    const criteriaBtn = document.getElementById('criteria-settings-btn');
    const criteriaModal = document.getElementById('criteria-modal-overlay');
    
    const shouldShowSavedCard = savedCard && context.status === 'presale';
    const shouldShowNewCardForm = !savedCard || context.status === 'onsale';

    if (shouldShowSavedCard) {
        savedCardActions.classList.remove('hidden');
        paymentForm.classList.add('hidden');
        if (criteriaBtn) criteriaBtn.style.display = 'none';
    } else if (shouldShowNewCardForm) {
        savedCardActions.classList.add('hidden');
        paymentForm.classList.remove('hidden');
        if (criteriaBtn) criteriaBtn.style.display = 'block';
        
        // Setup criteria for new card form
        loadCriteriaPreferences();
        updateCriteriaDisplay();
    }

    // Setup criteria modal for new card form
    const closeCriteriaBtn = document.getElementById('close-criteria-btn');
    const resetCriteriaBtn = document.getElementById('reset-criteria-btn');
    const schemeSelect = document.getElementById('criteria-scheme');
    const issuerSelect = document.getElementById('criteria-issuer');
    const productSelect = document.getElementById('criteria-product');

    if (criteriaBtn) {
        criteriaBtn.addEventListener('click', () => {
            criteriaModal.classList.add('show');
        });
    }

    if (closeCriteriaBtn) {
        closeCriteriaBtn.addEventListener('click', () => {
            criteriaModal.classList.remove('show');
        });
    }

    if (criteriaModal) {
        criteriaModal.addEventListener('click', (e) => {
            if (e.target === criteriaModal) {
                criteriaModal.classList.remove('show');
            }
        });
    }

    const onCriteriaChange = () => {
        updateCriteriaDisplay();
        saveCriteriaPreferences();
    };

    if (schemeSelect) schemeSelect.addEventListener('change', onCriteriaChange);
    if (issuerSelect) issuerSelect.addEventListener('change', onCriteriaChange);
    if (productSelect) productSelect.addEventListener('change', onCriteriaChange);
    if (resetCriteriaBtn) {
        resetCriteriaBtn.addEventListener('click', resetCriteriaToDefaults);
    }

    // New card form input handlers
    const cardInput = document.getElementById('payment-card-number');
    const payNewCardBtn = document.getElementById('pay-new-card-btn');
    const backToSeatForm = document.getElementById('back-to-seat-form');
    let debounceTimer = null;
    let lastBin = '';

    if (cardInput) {
        cardInput.addEventListener('input', (event) => {
            const formatted = formatCardNumber(event.target.value);
            event.target.value = formatted;

            const digits = formatted.replace(/\D/g, '');
            paymentEligibilityState.cardNumber = digits;

            if (digits.length < 16) {
                paymentEligibilityState.isEligible = false;
                payNewCardBtn.disabled = true;
                setPaymentEligibilityStatus('', '');
                lastBin = '';
                updatePaymentFormVisibility();
                return;
            }

            const bin = digits.slice(0, 8);
            if (bin === lastBin) return;
            lastBin = bin;

            setPaymentEligibilityStatus('Checking card eligibility...', 'pending');
            payNewCardBtn.disabled = true;

            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(async () => {
                try {
                    const metadata = await checkCardMetadata(digits);
                    paymentEligibilityState.scheme = (metadata.scheme || '').toLowerCase();
                    paymentEligibilityState.issuer = metadata.issuer || '';
                    paymentEligibilityState.cardType = metadata.card_type || '';

                    const isEligible = checkEligibilityAgainstCriteria(metadata);
                    if (isEligible) {
                        paymentEligibilityState.isEligible = true;
                        const badge = getCardTypeBadge(metadata);
                        setPaymentEligibilityStatus(`Eligible card detected!${badge}`, 'success');
                        payNewCardBtn.disabled = false;
                        updatePaymentFormVisibility();
                    } else {
                        paymentEligibilityState.isEligible = false;
                        const criteriaDisplay = document.getElementById('criteria-display').textContent;
                        const badge = getCardTypeBadge(metadata);
                        setPaymentEligibilityStatus(`This${badge} does not meet criteria: ${criteriaDisplay}`, 'error');
                        payNewCardBtn.disabled = true;
                        updatePaymentFormVisibility();
                    }
                } catch (error) {
                    paymentEligibilityState.isEligible = false;
                    setPaymentEligibilityStatus(error.message, 'error');
                    payNewCardBtn.disabled = true;
                    updatePaymentFormVisibility();
                }
            }, 350);
        });
    }

    // Expiry input handler
    const expiryInput = document.getElementById('payment-expiry-date');
    const cvvInput = document.getElementById('payment-cvv');

    if (expiryInput) {
        expiryInput.addEventListener('keydown', (event) => {
            if (event.key !== 'Backspace') return;
            const value = event.target.value;
            if (value.length === 3 && value[2] === '/') {
                event.preventDefault();
                event.target.value = value.slice(0, 2);
            }
        });

        expiryInput.addEventListener('input', (event) => {
            const raw = event.target.value;
            const digits = raw.replace(/\D/g, '').slice(0, 4);
            const formatted = digits.length >= 2
                ? `${digits.slice(0, 2)}/${digits.slice(2)}`
                : digits;
            event.target.value = formatted;

            const caretAtEnd = event.target.selectionStart === formatted.length;
            if (digits.length === 4 && caretAtEnd && cvvInput) {
                cvvInput.focus();
            }
        });
    }

    // Payment form submit
    const paymentFormEl = document.getElementById('payment-form');
    if (paymentFormEl) {
        paymentFormEl.addEventListener('submit', async (event) => {
            event.preventDefault();

            if (!paymentEligibilityState.isEligible) {
                setPaymentEligibilityStatus('Please use an eligible card', 'error');
                return;
            }

            const cardNumber = document.getElementById('payment-card-number').value.replace(/\s/g, '');
            const cardholderName = document.getElementById('payment-cardholder-name').value.trim();
            const expiryValue = document.getElementById('payment-expiry-date').value.trim();
            const cvv = document.getElementById('payment-cvv').value.trim();

            const expiry = parseExpiry(expiryValue);
            if (!expiry) {
                setPaymentEligibilityStatus('Invalid expiry date', 'error');
                return;
            }

            try {
                payNewCardBtn.disabled = true;
                const result = await payWithNewCard(context, selection, {
                    cardNumber,
                    cardholderName,
                    expiryMonth: expiry.month,
                    expiryYear: expiry.year,
                    cvv
                });

                // Check if 3DS redirect already happened in payWithNewCard
                console.log('Payment result:', result);
                
                // Clear session data after successful payment
                sessionStorage.removeItem('ticketHoldExpiresAt');
                sessionStorage.removeItem('ticketSeatSelection');
                clearSavedToken();
                
                // Only redirect to success if not already redirected by 3DS
                setTimeout(() => {
                    window.location.href = '/success.html';
                }, 500);
            } catch (error) {
                setPaymentEligibilityStatus(error.message, 'error');
                payNewCardBtn.disabled = false;
            }
        });
    }

    // Saved card payment
    const payNowBtn = document.getElementById('pay-now-btn');
    if (payNowBtn) {
        payNowBtn.addEventListener('click', async () => {
            try {
                payNowBtn.disabled = true;
                const result = await payWithStoredCardToken(context, selection, savedCard);
                
                // Check if 3DS redirect already happened in payWithStoredCardToken
                console.log('Saved card payment result:', result);
                
                // Clear session data after successful payment
                sessionStorage.removeItem('ticketHoldExpiresAt');
                sessionStorage.removeItem('ticketSeatSelection');
                clearSavedToken();
                
                // Only redirect to success if not already redirected by 3DS
                setTimeout(() => {
                    window.location.href = '/success.html';
                }, 500);
            } catch (error) {
                alert('Payment failed: ' + error.message);
                payNowBtn.disabled = false;
            }
        });
    }

    // Use different card button
    const useDifferentCard = document.getElementById('use-different-card');
    if (useDifferentCard) {
        useDifferentCard.addEventListener('click', () => {
            savedCardActions.classList.add('hidden');
            paymentForm.classList.remove('hidden');
            if (criteriaBtn) criteriaBtn.style.display = 'block';
            loadCriteriaPreferences();
            updateCriteriaDisplay();
        });
    }

    // Back buttons
    const backBtns = [
        document.getElementById('back-to-seat'),
        backToSeatForm
    ];
    
    backBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                window.location.href = buildNextUrl(context, '/ticket-seat-selection.html');
            });
        }
    });
});
