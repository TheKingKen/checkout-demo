// public/ticket-payment-app.js

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

function formatCurrency(amount) {
    return `HKD ${amount}`;
}

function getHoldExpiry() {
    const stored = sessionStorage.getItem('ticketHoldExpiresAt');
    return stored ? parseInt(stored, 10) : null;
}

function renderTimer(expiresAt) {
    const timerEl = document.getElementById('payment-timer');

    const update = () => {
        const remaining = Math.max(0, expiresAt - Date.now());
        const minutes = Math.floor(remaining / 60000).toString().padStart(2, '0');
        const seconds = Math.floor((remaining % 60000) / 1000).toString().padStart(2, '0');
        timerEl.textContent = `${minutes}:${seconds}`;

        if (remaining <= 0) {
            timerEl.textContent = '00:00';
            document.getElementById('pay-now-btn').disabled = true;
        }
    };

    update();
    return setInterval(update, 1000);
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
        panel.innerHTML = '<p>No saved card found. Please go back and save a card during eligibility check.</p>';
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

document.addEventListener('DOMContentLoaded', () => {
    const context = getQueryParams();
    const selectionRaw = sessionStorage.getItem('ticketSeatSelection');
    const selection = selectionRaw ? JSON.parse(selectionRaw) : null;
    document.getElementById('payment-event').textContent = context.event ? `Event: ${context.event}` : '';

    renderSummary(selection);
    const savedCard = renderSavedCard();

    const expiresAt = getHoldExpiry();
    if (!expiresAt || expiresAt <= Date.now()) {
        document.getElementById('pay-now-btn').disabled = true;
        document.getElementById('payment-timer').textContent = '00:00';
    } else {
        renderTimer(expiresAt);
    }

    const payBtn = document.getElementById('pay-now-btn');
    if (!savedCard) {
        payBtn.disabled = true;
    }

    payBtn.addEventListener('click', () => {
        if (!savedCard) return;
        alert('Payment simulated with saved token.');
        sessionStorage.removeItem('ticketHoldExpiresAt');
        sessionStorage.removeItem('ticketSeatSelection');
    });

    const backBtn = document.getElementById('back-to-seat');
    backBtn.addEventListener('click', () => {
        window.location.href = buildNextUrl(context, '/ticket-seat-selection.html');
    });
});
