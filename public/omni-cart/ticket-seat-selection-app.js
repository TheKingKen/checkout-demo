// public/ticket-seat-selection-app.js

const SEAT_ROWS = {
    'A': { seats: 4, color: '#fcd34d' },    // Gold
    'B': { seats: 8, color: '#86efac' },    // Green
    'C': { seats: 8, color: '#60a5fa' },    // Blue
    'D': { seats: 4, color: '#f87171' }     // Red
};
const MAX_TICKETS = 8;

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
        status: params.get('status') || 'presale',
        presaleFlow: params.get('presaleFlow') || ''
    };
}

function buildNextUrl(context, nextPage) {
    const flowParam = context.presaleFlow ? `&presaleFlow=${encodeURIComponent(context.presaleFlow)}` : '';
    const query = `event=${encodeURIComponent(context.event)}&price=${context.price}&index=${context.index}&status=${context.status}${flowParam}`;
    return `${nextPage}?${query}`;
}

function formatCurrency(amount) {
    return `HKD ${amount}`;
}

function formatCardNumber(value) {
    const digits = value.replace(/\D/g, '').slice(0, 19);
    const groups = digits.match(/.{1,4}/g) || [];
    return groups.join(' ');
}

function setEligibilityStatus(message, type) {
    const statusEl = document.getElementById('eligibility-status');
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = `eligibility-status ${type || ''}`.trim();
}

function setBinEligibilityStatus(message, type) {
    const statusEl = document.getElementById('bin-eligibility-status');
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = `eligibility-status ${type || ''}`.trim();
}

async function checkCardMetadata(number, type = 'card') {
    const payload = {
        number,
        type,
        format: 'basic',
        reference: `PRECHECK-${Date.now()}`
    };
    console.log('[Client] Sending to /card-metadata:', JSON.stringify(payload, null, 2));
    
    const response = await fetch('/card-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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
        expiry_year: tokenData.expiry_year,
        requires3ds: true
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
    if (!sections) return;

    sections.classList.add('hiding');
    setTimeout(() => {
        sections.classList.add('hidden');
        sections.classList.remove('hiding');
    }, 400);
}

function getCriteria() {
    return {
        scheme: document.getElementById('criteria-scheme')?.value || 'all',
        issuer: document.getElementById('criteria-issuer')?.value || 'all',
        product: document.getElementById('criteria-product')?.value || 'all'
    };
}

function getIssuerDisplayName(issuerId) {
    const issuerMap = {
        'river_valley': 'RIVER VALLEY CREDIT UNION',
        'lloyds': 'LLOYDS BANK PLC',
        'sbm': 'SBM BANK (MAURITIUS) LTD',
        'euro': 'EURO KARTENSYSTEME GMBH'
    };
    return issuerMap[issuerId] || 'Any issuer';
}

function updateCriteriaDisplay() {
    const criteria = getCriteria();
    const parts = [];

    const schemeText = criteria.scheme === 'all' ? 'Any scheme' : criteria.scheme.charAt(0).toUpperCase() + criteria.scheme.slice(1);
    const issuerText = criteria.issuer === 'all' ? 'Any issuer' : getIssuerDisplayName(criteria.issuer);
    const productText = criteria.product === 'all' ? 'Any product type' : 'Visa Classic';

    const display = document.getElementById('criteria-display');
    if (display) {
        display.textContent = `${schemeText}, ${issuerText}, ${productText}`;
    }
}

function saveCriteriaPreferences() {
    const criteria = getCriteria();
    localStorage.setItem('ticketCriteriaPreferences', JSON.stringify(criteria));
}

function loadCriteriaPreferences() {
    const saved = localStorage.getItem('ticketCriteriaPreferences');
    if (!saved) return;

    try {
        const criteria = JSON.parse(saved);
        const schemeSelect = document.getElementById('criteria-scheme');
        const issuerSelect = document.getElementById('criteria-issuer');
        const productSelect = document.getElementById('criteria-product');
        if (schemeSelect) schemeSelect.value = criteria.scheme || 'all';
        if (issuerSelect) issuerSelect.value = criteria.issuer || 'all';
        if (productSelect) productSelect.value = criteria.product || 'all';
        updateCriteriaDisplay();
    } catch (error) {
        console.error('Failed to load criteria preferences:', error);
    }
}

function resetCriteriaToDefaults() {
    const schemeSelect = document.getElementById('criteria-scheme');
    const issuerSelect = document.getElementById('criteria-issuer');
    const productSelect = document.getElementById('criteria-product');
    if (schemeSelect) schemeSelect.value = 'all';
    if (issuerSelect) issuerSelect.value = 'all';
    if (productSelect) productSelect.value = 'all';
    updateCriteriaDisplay();
    saveCriteriaPreferences();
}

function checkEligibilityAgainstCriteria(metadata) {
    const criteria = getCriteria();
    const scheme = (metadata.scheme || '').toLowerCase();
    const issuer = (metadata.issuer || '').toLowerCase();

    if (criteria.scheme !== 'all' && scheme !== criteria.scheme) {
        return false;
    }

    if (criteria.issuer !== 'all') {
        const criteriaIssuer = criteria.issuer.toLowerCase();
        if (!issuer.includes(criteriaIssuer.replace(/_/g, ' '))) {
            return false;
        }
    }

    return true;
}

function getCardTypeBadge(metadata) {
    const type = (metadata.card_type || '').toLowerCase();
    const scheme = (metadata.scheme || '').toUpperCase();
    if (type === 'credit') {
        return ` (${scheme} Credit)`;
    } else if (type === 'debit') {
        return ` (${scheme} Debit)`;
    }
    return ` (${scheme})`;
}

function buildSeatGrid() {
    const grid = document.getElementById('seat-grid');
    if (!grid) return;
    grid.innerHTML = '';

    Object.entries(SEAT_ROWS).forEach(([row, config]) => {
        const rowContainer = document.createElement('div');
        rowContainer.className = `seat-row seat-${row.toLowerCase()}`;
        rowContainer.dataset.category = row;
        
        for (let col = 1; col <= config.seats; col++) {
            const seatId = `${row}${col}`;
            const seatButton = document.createElement('button');
            seatButton.type = 'button';
            seatButton.className = 'seat';
            seatButton.textContent = seatId;
            seatButton.dataset.seat = seatId;
            seatButton.dataset.category = row;
            seatButton.disabled = true;

            if (Math.random() < 0.15) {
                seatButton.classList.add('unavailable');
            }

            rowContainer.appendChild(seatButton);
        }
        grid.appendChild(rowContainer);
    });
}

function formatSessionLabel(date) {
    const day = date.getDate();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}, 7:00 PM`;
}

function populateSessionOptions() {
    const select = document.getElementById('seat-session');
    if (!select) return;

    const now = new Date();
    const base = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate(), 19, 0, 0);

    select.innerHTML = '';
    for (let i = 0; i < 5; i++) {
        const date = new Date(base);
        date.setDate(base.getDate() + i);
        const option = document.createElement('option');
        option.value = date.toISOString();
        let label = formatSessionLabel(date);
        if (i >= 3) {
            label += ' (Unavailable)';
            option.dataset.unavailable = 'true';
            option.disabled = true;
        }
        option.textContent = label;
        select.appendChild(option);
    }
}

function updateSessionAvailabilityTag() {
    const select = document.getElementById('seat-session');
    const tag = document.getElementById('session-unavailable-tag');
    if (!select || !tag) return;
    const selectedOption = select.selectedOptions[0];
    if (selectedOption?.dataset.unavailable === 'true') {
        tag.classList.remove('hidden');
    } else {
        tag.classList.add('hidden');
    }
}

function generateSeatLabel(eventName, sessionValue) {
    const seed = `${eventName || ''}|${sessionValue || ''}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
    }
    const rows = Object.keys(SEAT_ROWS);
    const rowIndex = Math.abs(hash) % rows.length;
    const selectedRow = rows[rowIndex];
    const maxCols = SEAT_ROWS[selectedRow].seats;
    const colIndex = (Math.abs(hash) % maxCols) + 1;
    return `${selectedRow}${colIndex}`;
}

let ticketQuantity = 1;

function updateQuantityControls() {
    const qtyValue = document.getElementById('ticket-qty-value');
    const minusBtn = document.getElementById('ticket-qty-minus');
    const plusBtn = document.getElementById('ticket-qty-plus');
    if (qtyValue) qtyValue.textContent = String(ticketQuantity);
    if (minusBtn) minusBtn.disabled = ticketQuantity <= 1;
    if (plusBtn) plusBtn.disabled = ticketQuantity >= MAX_TICKETS;
}

function updatePriceDisplay() {
    const categorySelect = document.getElementById('seat-category');
    const priceEl = document.getElementById('seat-price');
    if (!categorySelect || !priceEl) return;
    const basePrice = parseInt(categorySelect.value, 10);
    const total = basePrice * ticketQuantity;
    priceEl.textContent = formatCurrency(total);
}

function persistSelection(context) {
    const categorySelect = document.getElementById('seat-category');
    const sessionSelect = document.getElementById('seat-session');
    if (!categorySelect || !sessionSelect) return false;

    const categoryPrice = parseInt(categorySelect.value, 10);
    const selectedSession = sessionSelect.selectedOptions[0];
    const seatLabel = generateSeatLabel(context.event, selectedSession?.value);
    const selection = {
        event: context.event,
        seat: seatLabel,
        session: selectedSession?.value || '',
        sessionLabel: selectedSession?.textContent || '',
        categoryPrice,
        quantity: ticketQuantity,
        totalPrice: categoryPrice * ticketQuantity,
        status: context.status,
        index: context.index,
        presaleFlow: context.presaleFlow || ''
    };

    sessionStorage.setItem('ticketSeatSelection', JSON.stringify(selection));
    return true;
}

function openBinModal(title) {
    const overlay = document.getElementById('bin-modal-overlay');
    const titleEl = document.getElementById('bin-modal-title');
    const input = document.getElementById('bin-input');
    setBinEligibilityStatus('', '');
    if (titleEl) titleEl.textContent = title;
    if (input) {
        input.value = '';
        input.focus();
    }
    if (overlay) overlay.classList.add('show');
}

function closeBinModal() {
    const overlay = document.getElementById('bin-modal-overlay');
    if (overlay) overlay.classList.remove('show');
}

function showPresaleEligibilitySection() {
    const section = document.getElementById('presale-eligibility-section');
    const nextBtn = document.getElementById('next-step-btn');
    const cancelBtn = document.getElementById('cancel-seat');
    if (!section) return;
    section.classList.remove('hidden');
    if (nextBtn) nextBtn.classList.add('hidden');
    if (cancelBtn) cancelBtn.classList.add('hidden');
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.addEventListener('DOMContentLoaded', () => {
    const context = getQueryParams();
    const seatTitle = document.getElementById('seat-title');
    const eventName = document.getElementById('seat-event');
    if (seatTitle) seatTitle.textContent = context.event || 'Seat Map';
    if (eventName) eventName.textContent = context.event ? 'Select your session and category.' : '';

    buildSeatGrid();
    populateSessionOptions();
    updateSessionAvailabilityTag();
    updateQuantityControls();
    updatePriceDisplay();

    const sessionSelect = document.getElementById('seat-session');
    const categorySelect = document.getElementById('seat-category');
    const qtyMinus = document.getElementById('ticket-qty-minus');
    const qtyPlus = document.getElementById('ticket-qty-plus');

    if (sessionSelect) {
        sessionSelect.addEventListener('change', updateSessionAvailabilityTag);
    }

    if (categorySelect) {
        categorySelect.addEventListener('change', updatePriceDisplay);
    }

    if (qtyMinus) {
        qtyMinus.addEventListener('click', () => {
            if (ticketQuantity <= 1) return;
            ticketQuantity -= 1;
            updateQuantityControls();
            updatePriceDisplay();
        });
    }

    if (qtyPlus) {
        qtyPlus.addEventListener('click', () => {
            if (ticketQuantity >= MAX_TICKETS) return;
            ticketQuantity += 1;
            updateQuantityControls();
            updatePriceDisplay();
        });
    }

    // Criteria modal setup
    loadCriteriaPreferences();
    updateCriteriaDisplay();

    const criteriaSettingsBtn = document.getElementById('criteria-settings-btn');
    const criteriaModal = document.getElementById('criteria-modal-overlay');
    const closeCriteriaBtn = document.getElementById('close-criteria-btn');
    const resetCriteriaBtn = document.getElementById('reset-criteria-btn');
    const schemeSelect = document.getElementById('criteria-scheme');
    const issuerSelect = document.getElementById('criteria-issuer');
    const productSelect = document.getElementById('criteria-product');

    if (criteriaSettingsBtn) {
        criteriaSettingsBtn.addEventListener('click', () => {
            criteriaModal.classList.add('show');
        });
    }

    if (closeCriteriaBtn) {
        closeCriteriaBtn.addEventListener('click', () => {
            criteriaModal.classList.remove('show');
        });
    }

    if (criteriaModal) {
        criteriaModal.addEventListener('click', (event) => {
            if (event.target === criteriaModal) {
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
    if (resetCriteriaBtn) resetCriteriaBtn.addEventListener('click', resetCriteriaToDefaults);

    // BIN modal handlers
    const binModal = document.getElementById('bin-modal-overlay');
    const binCancelBtn = document.getElementById('bin-cancel-btn');
    const binOkBtn = document.getElementById('bin-ok-btn');
    const binInput = document.getElementById('bin-input');

    if (binModal) {
        binModal.addEventListener('click', (event) => {
            if (event.target === binModal) {
                closeBinModal();
            }
        });
    }

    if (binCancelBtn) {
        binCancelBtn.addEventListener('click', () => {
            closeBinModal();
        });
    }

    if (binOkBtn) {
        binOkBtn.addEventListener('click', async () => {
            const raw = binInput?.value || '';
            const digits = raw.replace(/\D/g, '');
            if (digits.length !== 6) {
                setBinEligibilityStatus('Please enter a valid 6-digit BIN.', 'error');
                return;
            }

            setBinEligibilityStatus('Checking card eligibility...', 'pending');

            try {
                const metadata = await checkCardMetadata(digits, 'bin');
                const isEligible = checkEligibilityAgainstCriteria(metadata);
                if (!isEligible) {
                    const criteriaDisplay = document.getElementById('criteria-display')?.textContent || '';
                    const badge = getCardTypeBadge(metadata);
                    setBinEligibilityStatus(`This${badge} is not eligible for priority booking. Required criteria: ${criteriaDisplay}`, 'error');
                    return;
                }

                setBinEligibilityStatus('Eligible card detected. Redirecting...', 'success');
                
                // Show loading overlay for 3 seconds
                const loadingOverlay = document.getElementById('loading-overlay');
                if (loadingOverlay) {
                    loadingOverlay.classList.add('show');
                }

                // Redirect after 3 seconds
                setTimeout(() => {
                    persistSelection(context);
                    window.location.href = buildNextUrl(context, '/omni-cart/ticket-payment.html');
                }, 3000);
            } catch (error) {
                setBinEligibilityStatus(error.message, 'error');
            }
        });
    }

    // Eligibility form logic (token flow)
    const cardInput = document.getElementById('card-number');
    const confirmBtn = document.getElementById('confirm-btn');
    const cancelBtn = document.getElementById('eligibility-cancel-btn');
    const saveCardCheckbox = document.getElementById('save-card');
    const saveCardFields = document.getElementById('save-card-fields');
    const expiryInput = document.getElementById('expiry-date');
    const cvvInput = document.getElementById('cvv');

    let debounceTimer = null;
    let lastBin = '';

    if (cardInput) {
        cardInput.addEventListener('input', (event) => {
            const formatted = formatCardNumber(event.target.value);
            event.target.value = formatted;

            const digits = formatted.replace(/\D/g, '');
            eligibilityState.cardNumber = digits;

            if (digits.length < 16) {
                eligibilityState.isEligible = false;
                confirmBtn.disabled = true;
                setEligibilityStatus('', '');
                lastBin = '';
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
                    const metadata = await checkCardMetadata(digits, 'card');
                    eligibilityState.scheme = (metadata.scheme || '').toLowerCase();
                    eligibilityState.issuer = metadata.issuer || '';
                    eligibilityState.cardType = metadata.card_type || '';

                    const isEligible = checkEligibilityAgainstCriteria(metadata);
                    if (isEligible) {
                        eligibilityState.isEligible = true;
                        const badge = getCardTypeBadge(metadata);
                        setEligibilityStatus(`Eligible card detected!${badge} This card meets the priority booking criteria.`, 'success');
                        confirmBtn.disabled = false;
                        showFormSections();
                    } else {
                        eligibilityState.isEligible = false;
                        const criteriaDisplay = document.getElementById('criteria-display')?.textContent || '';
                        const badge = getCardTypeBadge(metadata);
                        setEligibilityStatus(`This${badge} is not eligible for priority booking. Required criteria: ${criteriaDisplay}`, 'error');
                        confirmBtn.disabled = true;
                        hideFormSections();
                    }
                } catch (error) {
                    eligibilityState.isEligible = false;
                    setEligibilityStatus(error.message, 'error');
                    confirmBtn.disabled = true;
                    hideFormSections();
                }
            }, 350);
        });
    }

    if (saveCardCheckbox) {
        saveCardCheckbox.addEventListener('change', (event) => {
            if (event.target.checked) {
                saveCardFields.classList.remove('hidden');
                return;
            }
            saveCardFields.classList.add('hidden');
        });
    }

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

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            sessionStorage.removeItem('ticketSeatSelection');
            window.location.href = '/omni-cart/tickets.html';
        });
    }

    const eligibilityForm = document.getElementById('presale-eligibility-form');
    if (eligibilityForm) {
        eligibilityForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            if (!eligibilityState.isEligible) {
                const criteriaDisplay = document.getElementById('criteria-display')?.textContent || '';
                setEligibilityStatus(`Please use a card matching the criteria: ${criteriaDisplay}`, 'error');
                return;
            }

            if (saveCardCheckbox?.checked) {
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

            // Show loading overlay for 3 seconds
            const loadingOverlay = document.getElementById('loading-overlay');
            if (loadingOverlay) {
                loadingOverlay.classList.add('show');
            }

            // Redirect after 3 seconds
            setTimeout(() => {
                persistSelection(context);
                window.location.href = buildNextUrl(context, '/omni-cart/ticket-payment.html');
            }, 3000);
        });
    }

    // Next button behavior
    const nextBtn = document.getElementById('next-step-btn');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (context.status === 'presale' && context.presaleFlow === 'bin') {
                const criteria = getCriteria();
                const issuerName = criteria.issuer === 'all' ? 'Any issuer' : getIssuerDisplayName(criteria.issuer);
                openBinModal(`${issuerName} Cardmember Presale`);
                return;
            }

            if (context.status === 'presale' && context.presaleFlow === 'token') {
                const criteria = getCriteria();
                const issuerName = criteria.issuer === 'all' ? 'Any issuer' : getIssuerDisplayName(criteria.issuer);
                const titleEl = document.getElementById('presale-issuer-title');
                if (titleEl) titleEl.textContent = `${issuerName} Cardmember Presale`;
                showPresaleEligibilitySection();
                return;
            }

            persistSelection(context);
            window.location.href = buildNextUrl(context, '/omni-cart/ticket-payment.html');
        });
    }

    const cancelSeatBtn = document.getElementById('cancel-seat');
    if (cancelSeatBtn) {
        cancelSeatBtn.addEventListener('click', () => {
            sessionStorage.removeItem('ticketSeatSelection');
            window.location.href = '/omni-cart/tickets.html';
        });
    }
});
