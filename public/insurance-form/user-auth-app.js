// public/user-auth-app.js

document.addEventListener('DOMContentLoaded', function () {
  // If payload passed via URL (level-2 QR scan), decode and store into sessionStorage
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has('data')) {
      const data = params.get('data');
      try {
        const jsonStr = decodeURIComponent(escape(atob(decodeURIComponent(data))));
        const parsed = JSON.parse(jsonStr);
        sessionStorage.setItem('paymentPayload', JSON.stringify(parsed));
        // Clean the URL
        history.replaceState(null, '', window.location.pathname);
      } catch (e) {
        console.warn('Failed to decode payment payload from URL', e);
      }
    }
  } catch (e) {
    console.warn('No URL params to process', e);
  }

  // Load payload from sessionStorage
  const payloadStr = sessionStorage.getItem('paymentPayload');
  if (!payloadStr) {
    document.getElementById('error-container').innerHTML = '<div class="error-message show">Payment data not found. Please return to the form.</div>' +
      '<div style="margin-top:12px;"><button class="btn btn-back" onclick="window.location.href=\'/insurance-form/insurance-form.html\'">Back to Form</button></div>';
    document.getElementById('back-btn').style.display = 'none';
    return;
  }
  const payload = JSON.parse(payloadStr);
  console.log('user-auth: loaded paymentPayload from sessionStorage:', payload);

  // Ensure content-container is visible and back-btn shown
  document.getElementById('content-container').style.display = 'block';
  document.getElementById('back-btn').style.display = 'block';

  // Initialize Geolocation Fencing
  initGeolocationFencing();

  // Setup first4 input boxes
  const first4Inputs = [
    document.getElementById('phone-first4-d1'),
    document.getElementById('phone-first4-d2'),
    document.getElementById('phone-first4-d3'),
    document.getElementById('phone-first4-d4')
  ];

  // Setup last4 input boxes
  const last4Inputs = [
    document.getElementById('phone-last4-d1'),
    document.getElementById('phone-last4-d2'),
    document.getElementById('phone-last4-d3'),
    document.getElementById('phone-last4-d4')
  ];

  // Combine all phone inputs for continuous focus flow
  const allPhoneInputs = [...first4Inputs, ...last4Inputs];

  // Keep inputs empty by default - user must fill them

  // Setup OTP input boxes
  const otpInputs = [
    document.getElementById('otp-input-d1'),
    document.getElementById('otp-input-d2'),
    document.getElementById('otp-input-d3'),
    document.getElementById('otp-input-d4'),
    document.getElementById('otp-input-d5'),
    document.getElementById('otp-input-d6')
  ];

  const sendOtpBtn = document.getElementById('send-otp');
  const confirmBtn = document.getElementById('confirm-btn');

  // Helper: get all digits from an input array
  const getAllDigits = (inputs) => inputs.map(inp => inp.value).join('');

  // Helper: move focus to next input on digit entry
  const setupDigitInput = (inputs, allInputs = null) => {
    inputs.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        // Allow only digits
        const val = e.target.value.replace(/\D/g, '');
        e.target.value = val.slice(0, 1); // Only 1 digit max

        // Move to next input if digit entered
        if (val.length > 0) {
          // Use allInputs for continuous focus flow (first4 -> last4)
          const focusArray = allInputs || inputs;
          const focusIndex = focusArray.indexOf(input);
          if (focusIndex < focusArray.length - 1) {
            focusArray[focusIndex + 1].focus();
          }
        }

        // Check if confirm should be enabled (all OTP filled)
        if (inputs === otpInputs) {
          const allFilled = getAllDigits(otpInputs).length === 6;
          confirmBtn.disabled = !allFilled;
        }

        // Check if send-otp should be enabled (all 8 digits filled)
        if (inputs === first4Inputs || inputs === last4Inputs) {
          const allFilled = getAllDigits(first4Inputs).length === 4 && getAllDigits(last4Inputs).length === 4;
          sendOtpBtn.disabled = !allFilled;
        }
      });

      // Handle backspace
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !input.value) {
          // Use allInputs for continuous backspace flow (last4 -> first4)
          const focusArray = allInputs || inputs;
          const focusIndex = focusArray.indexOf(input);
          if (focusIndex > 0) {
            focusArray[focusIndex - 1].focus();
          }
        }
      });
    });
  };

  setupDigitInput(first4Inputs, allPhoneInputs);
  setupDigitInput(last4Inputs, allPhoneInputs);
  setupDigitInput(otpInputs);

  // Send OTP: validate all 8 digits filled, then auto-fill OTP with 260121 after 2s
  sendOtpBtn.addEventListener('click', () => {
    const first4Val = getAllDigits(first4Inputs);
    const last4Val = getAllDigits(last4Inputs);
    if (first4Val.length !== 4 || last4Val.length !== 4) {
      alert('Please enter all 8 digits of your phone number.');
      return;
    }
    sendOtpBtn.disabled = true;
    sendOtpBtn.textContent = 'Sending...';
    setTimeout(() => {
      // Fill OTP boxes with 260121
      const otpCode = '260121';
      for (let i = 0; i < 6; i++) {
        otpInputs[i].value = otpCode[i];
      }
      sendOtpBtn.disabled = false;
      sendOtpBtn.textContent = 'Send OTP';
      // Enable confirm
      confirmBtn.disabled = false;
      // Focus first OTP input for convenience
      otpInputs[0].focus();
    }, 2000);
  });

  // Confirm click: redirect to payment-flow.html (sessionStorage already set)
  confirmBtn.addEventListener('click', () => {
    if (confirmBtn.disabled) return;
    window.location.href = '/insurance-form/payment-flow.html';
  });

});

// Geolocation Fencing initialization
function initGeolocationFencing() {
  const geoLoading = document.getElementById('geo-loading');
  const geoResult = document.getElementById('geo-result');
  const geoAddress = document.getElementById('geo-address');
  const geoLat = document.getElementById('geo-lat');
  const geoLng = document.getElementById('geo-lng');
  const geoAccuracy = document.getElementById('geo-accuracy');
  const geoStatus = document.getElementById('geo-status');

  // Show loading for 3 seconds minimum
  const minLoadingTime = 3000;
  const loadingStartTime = Date.now();

  // Try to get actual geolocation
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const elapsed = Date.now() - loadingStartTime;
        const remainingTime = Math.max(0, minLoadingTime - elapsed);

        setTimeout(() => {
          // Display actual coordinates
          const lat = position.coords.latitude.toFixed(6);
          const lng = position.coords.longitude.toFixed(6);
          const accuracy = Math.round(position.coords.accuracy);

          geoLat.textContent = lat + '°';
          geoLng.textContent = lng + '°';
          geoAccuracy.textContent = `±${accuracy}m`;

          // Use reverse geocoding approximation or fallback address
          // For real implementation, you would call a reverse geocoding API
          // For demo purposes, show a realistic address format
          geoAddress.textContent = 'Wan Chai, Hong Kong Island, Hong Kong';

          geoLoading.style.display = 'none';
          geoResult.style.display = 'block';
        }, remainingTime);
      },
      (error) => {
        // Geolocation failed - use fallback location
        const elapsed = Date.now() - loadingStartTime;
        const remainingTime = Math.max(0, minLoadingTime - elapsed);

        setTimeout(() => {
          // Fallback to Five Pacific Place coordinates
          geoLat.textContent = '22.278042°';
          geoLng.textContent = '114.172661°';
          geoAccuracy.textContent = '±50m';
          geoAddress.textContent = '88 Queensway, Admiralty, Hong Kong Island, Hong Kong';
          
          geoLoading.style.display = 'none';
          geoResult.style.display = 'block';
        }, remainingTime);

        console.warn('Geolocation error:', error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0
      }
    );
  } else {
    // Browser doesn't support geolocation - use fallback
    setTimeout(() => {
      geoLat.textContent = '22.278042°';
      geoLng.textContent = '114.172661°';
      geoAccuracy.textContent = '±50m';
      geoAddress.textContent = '88 Queensway, Admiralty, Hong Kong Island, Hong Kong';
      
      geoLoading.style.display = 'none';
      geoResult.style.display = 'block';
    }, minLoadingTime);

    console.warn('Geolocation not supported by browser');
  }
}
