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

function buildNextUrl(context, nextPage) {
    const query = `event=${encodeURIComponent(context.event)}&price=${context.price}&index=${context.index}&status=${context.status}`;
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
        expiry_year: tokenData.expiry_year,
        requires3ds: true  // Flag indicating this card should use 3DS for payment
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

function getEventEmoji(eventName) {
    if (eventName.includes('Concert')) {
        return Math.random() > 0.5 ? '🎸' : '🎤';
    } else if (eventName.includes('Sport')) {
        return Math.random() > 0.5 ? '⚽' : '🏀';
    } else if (eventName.includes('Cultural')) {
        return Math.random() > 0.5 ? '🎭' : '🎨';
    }
    return '🎪';
}

function getCriteria() {
    return {
        scheme: document.getElementById('criteria-scheme')?.value || 'all',
        issuer: document.getElementById('criteria-issuer')?.value || 'all',
        product: document.getElementById('criteria-product')?.value || 'all'
    };
}

function updateCriteriaDisplay() {
    const criteria = getCriteria();
    const parts = [];
    
    const schemeText = criteria.scheme === 'all' ? 'Any scheme' : criteria.scheme.charAt(0).toUpperCase() + criteria.scheme.slice(1);
    const issuerText = criteria.issuer === 'all' ? 'Any issuer' : getIssuerDisplayName(criteria.issuer);
    const productText = criteria.product === 'all' ? 'Any product' : 'Visa Classic';
    
    document.getElementById('criteria-display').textContent = `${schemeText}, ${issuerText}, ${productText}`;
}

function getIssuerDisplayName(issuerId) {
    const issuerMap = {
        'river_valley': 'RIVER VALLEY CREDIT UNION',
        'lloyds': 'LLOYDS BANK PLC',
        'sbm': 'SBM BANK (MAURITIUS) LTD',
        'euro': 'EURO KARTENSYSTEME GMBH'
    };
    return issuerMap[issuerId] || '';
}

function saveCriteriaPreferences() {
    const criteria = getCriteria();
    localStorage.setItem('ticketCriteriaPreferences', JSON.stringify(criteria));
}

function loadCriteriaPreferences() {
    const saved = localStorage.getItem('ticketCriteriaPreferences');
    if (saved) {
        try {
            const criteria = JSON.parse(saved);
            document.getElementById('criteria-scheme').value = criteria.scheme || 'all';
            document.getElementById('criteria-issuer').value = criteria.issuer || 'all';
            document.getElementById('criteria-product').value = criteria.product || 'all';
            updateCriteriaDisplay();
        } catch (e) {
            console.error('Failed to load criteria preferences:', e);
        }
    }
}

function resetCriteriaToDefaults() {
    document.getElementById('criteria-scheme').value = 'all';
    document.getElementById('criteria-issuer').value = 'all';
    document.getElementById('criteria-product').value = 'all';
    updateCriteriaDisplay();
    saveCriteriaPreferences();
}

function checkEligibilityAgainstCriteria(metadata) {
    const criteria = getCriteria();
    const scheme = (metadata.scheme || '').toLowerCase();
    const issuer = (metadata.issuer || '').toLowerCase();

    // Check scheme
    if (criteria.scheme !== 'all' && scheme !== criteria.scheme) {
        return false;
    }

    // Check issuer
    if (criteria.issuer !== 'all') {
        const criteriaIssuer = criteria.issuer.toLowerCase();
        if (!issuer.includes(criteriaIssuer.replace(/_/g, ' '))) {
            return false;
        }
    }

    // Check product type (simplified - would need more metadata from API)
    if (criteria.product !== 'all') {
        // For demo, we only check if product is "all" or assume success
        // In production, API would return product_type in metadata
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

function getEventPromotion(eventName) {
    const promos = {
        'Concert A': {
            emoji: '🎸',
            category: 'Concert',
            description: 'Experience the live energy of our top world-class performers. Feel the rhythm, sing along, and create unforgettable memories with thousands of passionate fans. Premium sound quality and seating arrangements await you!'
        },
        'Concert B': {
            emoji: '🎤',
            category: 'Concert',
            description: 'Join us for an evening of exceptional music. Our line-up features renowned international and local artists performing their biggest hits. Limited seats available for this exclusive concert experience!'
        },
        'Sport Games X': {
            emoji: '⚽',
            category: 'Sports',
            description: 'Witness the passion, skill, and drama of professional sports. Cheer for your favorite team from the best seats in the house. Feel the intensity, celebrate every goal, and be part of sports history!'
        },
        'Sport Games Y': {
            emoji: '🏀',
            category: 'Sports',
            description: 'Experience the thrill of live sports action. High-flying plays, nail-biting finishes, and unforgettable moments await. Get your tickets now and witness championship-level competition up close!'
        },
        'Cultural Activities 1': {
            emoji: '🎭',
            category: 'Cultural',
            description: 'Immerse yourself in world-class theatrical performances. From classic dramas to contemporary works, our cultural events showcase exceptional artistry and creativity. Enhance your cultural experience with premium seating!'
        },
        'Cultural Activities 2': {
            emoji: '🎨',
            category: 'Cultural',
            description: 'Celebrate the vibrant world of arts and culture. Our curated exhibitions and performances feature local and international talent. Discover, appreciate, and celebrate human creativity at its finest!'
        }
    };

    return promos[eventName] || {
        emoji: '🎪',
        category: 'Event',
        description: 'Join us for an amazing event. Limited seats available. Secure your spot today for an unforgettable experience!'
    };
}

function renderEventPromotion(context) {
    const promoImage = document.getElementById('event-promo-image');
    const promoTitle = document.getElementById('event-promo-title');
    const promoCategory = document.getElementById('event-promo-category');
    const promoDescription = document.getElementById('event-promo-description');

    const promo = getEventPromotion(context.event);
    promoImage.textContent = promo.emoji;
    promoTitle.textContent = context.event;
    promoCategory.textContent = promo.category;
    promoDescription.textContent = promo.description;
}

function showEligibilitySection(show) {
    const section = document.getElementById('eligibility-section');
    if (show) {
        section.classList.remove('hidden');
    } else {
        section.classList.add('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const context = getQueryParams();
    const cardInput = document.getElementById('card-number');
    const confirmBtn = document.getElementById('confirm-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const saveCardCheckbox = document.getElementById('save-card');
    const saveCardFields = document.getElementById('save-card-fields');
    const expiryInput = document.getElementById('expiry-date');
    const cvvInput = document.getElementById('cvv');
    const eventSummary = document.getElementById('ticket-event-summary');
    const eventEmojiEl = document.getElementById('event-emoji');
    const criteriaSettingsBtn = document.getElementById('criteria-settings-btn');
    const criteriaModal = document.getElementById('criteria-modal-overlay');
    const closeCriteriaBtn = document.getElementById('close-criteria-btn');
    const onsaleNextSection = document.getElementById('onsale-next-section');
    const proceedToSeatsBtn = document.getElementById('proceed-to-seats-btn');

    // Render event promotion and conditionally show eligibility section
    renderEventPromotion(context);
    showEligibilitySection(context.status === 'presale');
    
    // Show on-sale next button for on-sale flow
    if (context.status === 'onsale') {
        onsaleNextSection.classList.remove('hidden');
    }

    // Display event emoji
    if (eventEmojiEl && context.event) {
        eventEmojiEl.textContent = getEventEmoji(context.event);
    }

    if (context.event) {
        eventSummary.textContent = `Selected event: ${context.event}`;
    }

    // Load and setup criteria panel
    loadCriteriaPreferences();

    const schemeSelect = document.getElementById('criteria-scheme');
    const issuerSelect = document.getElementById('criteria-issuer');
    const productSelect = document.getElementById('criteria-product');
    const resetBtn = document.getElementById('reset-criteria-btn');

    const onCriteriaChange = () => {
        updateCriteriaDisplay();
        saveCriteriaPreferences();
    };

    if (schemeSelect) {
        schemeSelect.addEventListener('change', onCriteriaChange);
    }

    if (issuerSelect) {
        issuerSelect.addEventListener('change', onCriteriaChange);
    }

    if (productSelect) {
        productSelect.addEventListener('change', onCriteriaChange);
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', resetCriteriaToDefaults);
    }

    // Modal open/close handlers
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

    // Close modal when clicking overlay backdrop
    if (criteriaModal) {
        criteriaModal.addEventListener('click', (e) => {
            if (e.target === criteriaModal) {
                criteriaModal.classList.remove('show');
            }
        });
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
                    const criteria = getCriteria();
                    const criteriaDisplay = document.getElementById('criteria-display').textContent;
                    const badge = getCardTypeBadge(metadata);
                    setEligibilityStatus(`This${badge} is not eligible for priority booking. Required criteria: ${criteriaDisplay}`, 'error');
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

    cancelBtn.addEventListener('click', () => {
        window.location.href = '/tickets.html';
    });

    if (proceedToSeatsBtn) {
        proceedToSeatsBtn.addEventListener('click', () => {
            window.location.href = buildNextUrl(context, '/ticket-seat-selection.html');
        });
    }

    const form = document.getElementById('eligibility-form');
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!eligibilityState.isEligible) {
            const criteriaDisplay = document.getElementById('criteria-display').textContent;
            setEligibilityStatus(`Please use a card matching the criteria: ${criteriaDisplay}`, 'error');
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
