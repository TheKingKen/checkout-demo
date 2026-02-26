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
    window.location.href = buildNextUrl(context, '/ticket-seat-selection.html');
}

function persistLoginProfile() {
    const userData = {
        name: 'Ken So',
        email: 'ken.so@checkout.com',
        phone_number: '64416246',
        phone_country_code: '+852',
        firstName: 'Ken',
        lastName: 'So',
        addressLine1: 'Level 14, Five Pacific Place',
        addressLine2: '28 Hennessy Road',
        region: 'Wan Chai',
        country: 'HK'
    };
    localStorage.setItem('userShippingAddress', JSON.stringify(userData));
    localStorage.setItem('userEmail', userData.email);
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
        persistLoginProfile();
        redirectToNextStep(context);
    });

    const createAccountBtn = document.getElementById('create-account-btn');
    createAccountBtn.addEventListener('click', () => {
        // No-op for now
    });
});
