// public/ticket-seat-selection-app.js

const SEAT_ROWS = ['A', 'B', 'C', 'D'];
const SEAT_COLUMNS = 8;
const HOLD_DURATION_MS = 5 * 60 * 1000;

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

// Breadcrumb navigation function
function goToEligibility(event) {
    event.preventDefault();
    const context = getQueryParams();
    window.location.href = buildNextUrl(context, '/ticket-eligibility.html');
}

function formatCurrency(amount) {
    return `HKD ${amount}`;
}

function getHoldExpiry() {
    const stored = sessionStorage.getItem('ticketHoldExpiresAt');
    return stored ? parseInt(stored, 10) : null;
}

function setHoldExpiry() {
    const expiresAt = Date.now() + HOLD_DURATION_MS;
    sessionStorage.setItem('ticketHoldExpiresAt', String(expiresAt));
    return expiresAt;
}

function clearHoldExpiry() {
    sessionStorage.removeItem('ticketHoldExpiresAt');
}

function clearSavedToken() {
    localStorage.removeItem('ticketSavedCard');
    localStorage.removeItem('ticketSavedCardEligible');
}

function handleHoldExpiry(context, timerId) {
    clearHoldExpiry();
    sessionStorage.removeItem('ticketSeatSelection');
    clearSavedToken();
    if (timerId) {
        clearInterval(timerId);
    }
    window.location.href = buildNextUrl(context, '/ticket-eligibility.html');
}

function renderTimer(expiresAt, context) {
    const timerEl = document.getElementById('seat-timer-value');
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

function buildSeatGrid() {
    const grid = document.getElementById('seat-grid');
    grid.innerHTML = '';

    SEAT_ROWS.forEach((row) => {
        for (let col = 1; col <= SEAT_COLUMNS; col++) {
            const seatId = `${row}${col}`;
            const seatButton = document.createElement('button');
            seatButton.type = 'button';
            seatButton.className = 'seat';
            seatButton.textContent = seatId;
            seatButton.dataset.seat = seatId;

            if (Math.random() < 0.15) {
                seatButton.classList.add('unavailable');
                seatButton.disabled = true;
            }

            grid.appendChild(seatButton);
        }
    });
}

function attachSeatHandlers() {
    const seatButtons = document.querySelectorAll('.seat');
    const selectedSeatEl = document.getElementById('selected-seat');

    seatButtons.forEach((button) => {
        button.addEventListener('click', () => {
            if (button.classList.contains('unavailable')) return;

            seatButtons.forEach((item) => item.classList.remove('selected'));
            button.classList.add('selected');
            selectedSeatEl.textContent = button.dataset.seat;
        });
    });
}

function updatePriceDisplay() {
    const categorySelect = document.getElementById('seat-category');
    const priceEl = document.getElementById('seat-price');
    priceEl.textContent = formatCurrency(categorySelect.value);
}

function persistSelection(context) {
    const selectedSeat = document.getElementById('selected-seat').textContent;
    const categorySelect = document.getElementById('seat-category');

    if (!selectedSeat || selectedSeat === 'None') {
        alert('Please select a seat before continuing.');
        return false;
    }

    const selection = {
        event: context.event,
        seat: selectedSeat,
        categoryPrice: parseInt(categorySelect.value, 10),
        status: context.status,
        index: context.index
    };

    sessionStorage.setItem('ticketSeatSelection', JSON.stringify(selection));
    return true;
}

document.addEventListener('DOMContentLoaded', () => {
    const context = getQueryParams();
    const eventName = document.getElementById('seat-event');
    eventName.textContent = context.event ? `Event: ${context.event}` : '';

    buildSeatGrid();
    attachSeatHandlers();
    updatePriceDisplay();

    const categorySelect = document.getElementById('seat-category');
    categorySelect.addEventListener('change', updatePriceDisplay);

    let expiresAt = getHoldExpiry();
    if (!expiresAt || expiresAt <= Date.now()) {
        expiresAt = setHoldExpiry();
    }

    const timerId = renderTimer(expiresAt, context);

    const continueBtn = document.getElementById('continue-to-payment');
    continueBtn.addEventListener('click', () => {
        if (!persistSelection(context)) return;
        window.location.href = buildNextUrl(context, '/ticket-payment.html');
    });

    const cancelBtn = document.getElementById('cancel-seat');
    cancelBtn.addEventListener('click', () => {
        clearInterval(timerId);
        clearHoldExpiry();
        sessionStorage.removeItem('ticketSeatSelection');
        window.location.href = '/tickets.html';
    });
});
