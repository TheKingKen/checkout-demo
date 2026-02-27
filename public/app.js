// public/app.js
// Entrance portal navigation

document.addEventListener('DOMContentLoaded', function () {
    const phoneCaseBtn = document.getElementById('phone-case-btn');
    const newPhoneCaseBtn = document.getElementById('new-phone-case-btn');
    const insuranceBtn = document.getElementById('insurance-btn');
    const loginModal = document.getElementById('insurance-login-modal');
    const loginForm = document.getElementById('insurance-login-form');
    const loginCancel = document.getElementById('insurance-login-cancel');
    const loginError = document.getElementById('insurance-login-error');
    const usernameInput = document.getElementById('insurance-username');
    const passwordInput = document.getElementById('insurance-password');

    const INSURANCE_USERNAME = 'CKO-GCR';
    const INSURANCE_PASSWORD = 'Checkout1!';

    // Navigate to phone case shop
    if (phoneCaseBtn) {
        phoneCaseBtn.addEventListener('click', function () {
            window.location.href = '/easy-checkout-demo/phone-case-shop.html';
        });
    }

    // Navigate to new phone case shop (product catalog)
    if (newPhoneCaseBtn) {
        newPhoneCaseBtn.addEventListener('click', function () {
            window.location.href = '/omni-cart/all-products.html?from=index';
        });
    }

    // Navigate to insurance form
    if (insuranceBtn) {
        insuranceBtn.addEventListener('click', function () {
            if (!loginModal) {
                window.location.href = '/insurance-form/insurance-form.html';
                return;
            }

            loginError.textContent = '';
            loginModal.classList.add('show');
            loginModal.setAttribute('aria-hidden', 'false');
            if (usernameInput) {
                usernameInput.value = INSURANCE_USERNAME;
            }
            if (passwordInput) {
                passwordInput.value = '';
                passwordInput.focus();
            }
        });
    }

    if (loginCancel) {
        loginCancel.addEventListener('click', function () {
            if (!loginModal) {
                return;
            }
            loginModal.classList.remove('show');
            loginModal.setAttribute('aria-hidden', 'true');
        });
    }

    if (loginModal) {
        loginModal.addEventListener('click', function (event) {
            if (event.target === loginModal) {
                loginModal.classList.remove('show');
                loginModal.setAttribute('aria-hidden', 'true');
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const enteredUsername = usernameInput ? usernameInput.value.trim() : '';
            const enteredPassword = passwordInput ? passwordInput.value : '';

            if (enteredUsername === INSURANCE_USERNAME && enteredPassword === INSURANCE_PASSWORD) {
                window.location.href = '/insurance-form/insurance-form.html';
                return;
            }

            if (loginError) {
                loginError.textContent = 'Invalid username or password.';
            }
            if (passwordInput) {
                passwordInput.value = '';
                passwordInput.focus();
            }
        });
    }
});
