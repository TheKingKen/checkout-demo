// public/ticket-login-app.js

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

function redirectToNextStep(context) {
    if (context.status === 'presale') {
        window.location.href = buildNextUrl(context, '/ticket-eligibility.html');
        return;
    }

    window.location.href = buildNextUrl(context, '/ticket-seat-selection.html');
}

document.addEventListener('DOMContentLoaded', () => {
    const context = getQueryParams();
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    if (isLoggedIn) {
        redirectToNextStep(context);
        return;
    }

    const title = document.getElementById('login-title');
    const subtitle = document.getElementById('login-subtitle');
    if (context.status === 'onsale') {
        title.textContent = 'Login / Email Verification';
        subtitle.textContent = 'Verify your email to continue.';
    }

    const form = document.getElementById('ticket-login-form');
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        localStorage.setItem('isLoggedIn', 'true');
        redirectToNextStep(context);
    });

    const createAccountBtn = document.getElementById('create-account-btn');
    createAccountBtn.addEventListener('click', () => {
        // No-op for now
    });
});
