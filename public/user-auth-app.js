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
      '<div style="margin-top:12px;"><button class="btn btn-back" onclick="window.location.href=\'/insurance-form.html\'">Back to Form</button></div>';
    document.getElementById('back-btn').style.display = 'none';
    return;
  }
  const payload = JSON.parse(payloadStr);
  console.log('user-auth: loaded paymentPayload from sessionStorage:', payload);

  // Ensure content-container is visible and back-btn shown
  document.getElementById('content-container').style.display = 'block';
  document.getElementById('back-btn').style.display = 'block';

  // Populate customer info
  document.getElementById('display-name').textContent = payload.customer?.name || '-';
  const phoneFull = (payload.customer?.phone_country_code || '') + ' ' + (payload.customer?.phone_number || '');
//   document.getElementById('display-phone').textContent = phoneFull;

  // Extract digits for phone first4 and last4
  const digits = (payload.customer?.phone_number || '').replace(/\D/g, '');
  const first4Digits = digits.slice(0, 4);
  const last4Digits = digits.slice(-4);

  // Populate first4 as individual digit spans
  const first4DigitArray = first4Digits.split('');
  for (let i = 1; i <= 4; i++) {
    const digitSpan = document.getElementById(`phone-first4-d${i}`);
    if (digitSpan) {
      digitSpan.textContent = first4DigitArray[i - 1] || '-';
    }
  }

  // Setup last4 input boxes
  const last4Inputs = [
    document.getElementById('phone-last4-d1'),
    document.getElementById('phone-last4-d2'),
    document.getElementById('phone-last4-d3'),
    document.getElementById('phone-last4-d4')
  ];

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
  const setupDigitInput = (inputs) => {
    inputs.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        // Allow only digits
        const val = e.target.value.replace(/\D/g, '');
        e.target.value = val.slice(0, 1); // Only 1 digit max

        // Move to next input if digit entered
        if (val.length > 0 && index < inputs.length - 1) {
          inputs[index + 1].focus();
        }

        // Check if confirm should be enabled (all OTP filled)
        if (inputs === otpInputs) {
          const allFilled = getAllDigits(otpInputs).length === 6;
          confirmBtn.disabled = !allFilled;
        }

        // Check if send-otp should be enabled (all last4 filled)
        if (inputs === last4Inputs) {
          const allFilled = getAllDigits(last4Inputs).length === 4;
          sendOtpBtn.disabled = !allFilled;
        }
      });

      // Handle backspace
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !input.value && index > 0) {
          inputs[index - 1].focus();
        }
      });
    });
  };

  setupDigitInput(last4Inputs);
  setupDigitInput(otpInputs);

  // Send OTP: validate last4 is filled (4 digits), then auto-fill OTP with 260121 after 2s
  sendOtpBtn.addEventListener('click', () => {
    const last4Val = getAllDigits(last4Inputs);
    if (last4Val.length !== 4) {
      alert('Please enter the last 4 digits of your phone.');
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
    window.location.href = '/payment-flow.html';
  });

});
