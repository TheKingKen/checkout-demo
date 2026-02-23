// public/ticket-eligibility-app.js

const eligibilityState = {
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

function buildNextUrl({ event, price, index, status }, nextPage) {
    const query = `event=${encodeURIComponent(event)}&price=${price}&index=${index}&status=${status}`;
    return `${nextPage}?${query}`;
}

function formatCardNumber(value) {
    const digits = value.replace(/\D/g, '').slice(0, 19);
    const groups = digits.match(/.{1,4}/g) || [];
    return groups.join(' ');
}

function setEligibilityStatus(message, type) {
    const statusEl = document.getElementById('eligibility-status');
    statusEl.textContent = message;
    statusEl.className = `eligibility-status ${type || ''}`.trim();
}

async function checkCardMetadata(number) {
    const response = await fetch('/card-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            number,
            type: 'card',
            format: 'basic',
            reference: `PRECHECK-${Date.now()}`
        })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Unable to check card eligibility');
    }

    return response.json();
}

function parseExpiry(expiryValue) {
    const cleaned = expiryValue.replace(/\s/g, '');
    const match = cleaned.match(/^(\d{2})\/(\d{2,4})$/);
    if (!match) return null;

    const month = parseInt(match[1], 10);
    let year = parseInt(match[2], 10);
    if (month < 1 || month > 12) return null;

    if (year < 100) {
        year += 2000;
    }

    return { month, year };
}

async function tokenizeCard(payload) {
    const tokenResponse = await fetch('/tokenize-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
        throw new Error(tokenData.error_type || tokenData.error_codes?.[0] || tokenData.error || 'Tokenization failed');
    }

    return tokenData;
}

function saveCardToken(tokenData) {
    const savedCard = {
        token: tokenData.token,
        scheme: tokenData.scheme,
        last4: tokenData.last4,
        expiry_month: tokenData.expiry_month,
        expiry_year: tokenData.expiry_year
    };
    localStorage.setItem('ticketSavedCard', JSON.stringify(savedCard));
}

function showFormSections() {
    const sections = document.getElementById('eligibility-form-sections');
    if (!sections) return;
    sections.classList.remove('hidden');
    sections.classList.remove('hiding');
}

function hideFormSections() {
    const sections = document.getElementById('eligibility-form-sections');
    if (!sections) return new Promise(resolve => resolve());
    
    return new Promise(resolve => {
        sections.classList.add('hiding');
        setTimeout(() => {
            sections.classList.add('hidden');
            sections.classList.remove('hiding');
            resolve();
        }, 400);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const context = getQueryParams();
    const cardInput = document.getElementById('card-number');
    const confirmBtn = document.getElementById('confirm-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const saveCardCheckbox = document.getElementById('save-card');
    const saveCardFields = document.getElementById('save-card-fields');
    const eventSummary = document.getElementById('ticket-event-summary');

    if (context.event) {
        eventSummary.textContent = `Selected event: ${context.event}`;
    }

    let debounceTimer = null;
    let lastBin = '';

    cardInput.addEventListener('input', (event) => {
        const formatted = formatCardNumber(event.target.value);
        event.target.value = formatted;

        const digits = formatted.replace(/\D/g, '');
        eligibilityState.cardNumber = digits;

        if (digits.length < 16) {
            eligibilityState.isEligible = false;
            confirmBtn.disabled = true;
            setEligibilityStatus('', '');
            lastBin = ''; // Reset lastBin so check will run again when full card is entered
            hideFormSections();
            return;
        }

        const bin = digits.slice(0, 8);
        if (bin === lastBin) return;
        lastBin = bin;

        setEligibilityStatus('Checking card eligibility...', 'pending');
        confirmBtn.disabled = true;

        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            try {
                const metadata = await checkCardMetadata(digits);
                const scheme = (metadata.scheme || '').toLowerCase();
                eligibilityState.scheme = scheme;
                eligibilityState.issuer = metadata.issuer || '';

                if (scheme === 'visa') {
                    eligibilityState.isEligible = true;
                    setEligibilityStatus('Eligible card detected. You can continue to seat selection.', 'success');
                    confirmBtn.disabled = false;
                    showFormSections();
                } else {
                    eligibilityState.isEligible = false;
                    setEligibilityStatus('This pre-sale accepts Visa only. Please use an eligible card.', 'error');
                    confirmBtn.disabled = true;
                    showFormSections();
                }
            } catch (error) {
                eligibilityState.isEligible = false;
                setEligibilityStatus(error.message, 'error');
                confirmBtn.disabled = true;
                showFormSections();
            }
        }, 350);
    });

    saveCardCheckbox.addEventListener('change', (event) => {
        if (event.target.checked) {
            saveCardFields.classList.remove('hidden');
            return;
        }
        saveCardFields.classList.add('hidden');
    });

    cancelBtn.addEventListener('click', () => {
        window.location.href = '/tickets.html';
    });

    const form = document.getElementById('eligibility-form');
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!eligibilityState.isEligible) {
            setEligibilityStatus('Please use an eligible Visa card before continuing.', 'error');
            return;
        }

        if (saveCardCheckbox.checked) {
            const cardholderName = document.getElementById('cardholder-name').value.trim();
            const expiryValue = document.getElementById('expiry-date').value.trim();
            const cvv = document.getElementById('cvv').value.trim();
            const expiry = parseExpiry(expiryValue);

            if (!cardholderName || !expiry || !cvv) {
                setEligibilityStatus('Complete the card details to save this card.', 'error');
                return;
            }

            try {
                const tokenData = await tokenizeCard({
                    number: eligibilityState.cardNumber,
                    expiry_month: expiry.month,
                    expiry_year: expiry.year,
                    cvv,
                    name: cardholderName
                });
                saveCardToken(tokenData);
                localStorage.setItem('ticketSavedCardEligible', 'true');
            } catch (error) {
                setEligibilityStatus(error.message || 'Unable to save card right now.', 'error');
                return;
            }
        }

        window.location.href = buildNextUrl(context, '/ticket-seat-selection.html');
    });
});
