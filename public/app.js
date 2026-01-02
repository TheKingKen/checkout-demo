// public/app.js
// Entrance portal navigation

document.addEventListener('DOMContentLoaded', function () {
    const phoneCaseBtn = document.getElementById('phone-case-btn');
    const insuranceBtn = document.getElementById('insurance-btn');

    // Navigate to phone case shop
    if (phoneCaseBtn) {
        phoneCaseBtn.addEventListener('click', function () {
            window.location.href = '/phone-case-shop.html';
        });
    }

    // Navigate to insurance form
    if (insuranceBtn) {
        insuranceBtn.addEventListener('click', function () {
            window.location.href = '/insurance-form.html';
        });
    }
});
