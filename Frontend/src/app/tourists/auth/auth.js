/**
 * Tourist Auth Controller
 * Sonbhadra Tourism — Tourist Platform
 */

import { TouristService } from '../../../services/tourist.service.js';
import { isTouristLoggedIn } from '../../../scripts/utils/tourist-state.js';

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, redirect to dashboard unless forcing login
  const urlParams = new URLSearchParams(window.location.search);
  const force = urlParams.get('force');
  if (isTouristLoggedIn() && !force) {
    window.location.href = getRedirectUrl();
    return;
  }

  initTabs();
  initPasswordToggles();
  initPasswordStrength();
  initAvatarPreview();
  initSignIn();
  initSignUp();
  initDemoLogin();
});

/* --------------------------------------------------------------------------
   REDIRECT HELPER
   -------------------------------------------------------------------------- */
function getRedirectUrl() {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get('redirect');
  if (!redirect || redirect === 'dashboard') {
    return '../dashboard/index.html';
  }
  return redirect;
}

/* --------------------------------------------------------------------------
   TABS & HASH NAVIGATION
   -------------------------------------------------------------------------- */
function initTabs() {
  const tabs = $$('.auth-tab');
  const panels = $$('.auth-panel');

  function switchTab(targetTab) {
    tabs.forEach(t => {
      const isActive = t.dataset.tab === targetTab;
      t.classList.toggle('is-active', isActive);
      t.setAttribute('aria-selected', String(isActive));
    });

    panels.forEach(p => {
      const isActive = p.id === `auth-panel-${targetTab}`;
      p.classList.toggle('is-active', isActive);
    });

    clearGlobalMessages();
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchTab(tab.dataset.tab);
    });
  });

  // Switch links (inside form footers)
  $$('[data-switch-to]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab(link.dataset.switchTo);
    });
  });

  // Sync with URL Hash
  const hash = window.location.hash.toLowerCase().replace('#', '');
  if (hash === 'signup' || hash === 'register') {
    switchTab('signup');
  } else {
    switchTab('signin');
  }
}

/* --------------------------------------------------------------------------
   PASSWORD VISIBILITY TOGGLES
   -------------------------------------------------------------------------- */
function initPasswordToggles() {
  $$('.auth-toggle-pwd').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = $(`#${targetId}`);
      if (!input) return;

      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';

      const eye = btn.querySelector('.icon-eye');
      const eyeOff = btn.querySelector('.icon-eye-off');
      if (eye && eyeOff) {
        eye.classList.toggle('is-hidden', isPassword);
        eyeOff.classList.toggle('is-hidden', !isPassword);
      }
    });
  });
}

/* --------------------------------------------------------------------------
   PASSWORD STRENGTH METER
   -------------------------------------------------------------------------- */
function initPasswordStrength() {
  const pwdInput = $('#signup-password');
  const bar = $('#pwd-strength-bar');
  const fill = $('#pwd-strength-fill');
  const label = $('#pwd-strength-label');

  if (!pwdInput || !bar || !fill) return;

  pwdInput.addEventListener('input', () => {
    const val = pwdInput.value;
    if (!val) {
      bar.classList.remove('is-active');
      return;
    }

    bar.classList.add('is-active');

    let strength = 0;
    if (val.length >= 6) strength++;
    if (val.length >= 8) strength++;
    if (/[A-Z]/.test(val) && /[0-9]/.test(val)) strength++;
    if (/[^A-Za-z0-9]/.test(val)) strength++;

    fill.className = 'pwd-strength__fill';
    if (strength <= 1) {
      fill.classList.add('weak');
      label.textContent = 'Weak password (try adding letters & numbers)';
    } else if (strength === 2 || strength === 3) {
      fill.classList.add('medium');
      label.textContent = 'Good password';
    } else {
      fill.classList.add('strong');
      label.textContent = 'Strong password 🛡️';
    }
  });
}

/* --------------------------------------------------------------------------
   AVATAR PREVIEW
   -------------------------------------------------------------------------- */
function initAvatarPreview() {
  const fileInput = $('#signup-avatar-input');
  const imgEl = $('#signup-avatar-img');
  const iconEl = $('#signup-avatar-icon');

  if (!fileInput || !imgEl) return;

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showGlobalError('signup', 'Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showGlobalError('signup', 'Avatar file size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      imgEl.src = e.target.result;
      imgEl.classList.remove('is-hidden');
      if (iconEl) iconEl.classList.add('is-hidden');
    };
    reader.readAsDataURL(file);
  });
}

/* --------------------------------------------------------------------------
   NOTIFICATIONS / FIELD ERRORS
   -------------------------------------------------------------------------- */
function showGlobalError(panel, msg) {
  const el = $(`#${panel}-global-msg`);
  if (!el) return;
  el.textContent = msg;
  el.className = 'auth-global-msg is-error';
}

function showGlobalSuccess(panel, msg) {
  const el = $(`#${panel}-global-msg`);
  if (!el) return;
  el.textContent = msg;
  el.className = 'auth-global-msg is-success';
}

function clearGlobalMessages() {
  $$('.auth-global-msg').forEach(el => {
    el.textContent = '';
    el.className = 'auth-global-msg';
  });
  $$('.auth-input').forEach(input => input.classList.remove('is-error'));
  $$('.auth-field-error').forEach(err => err.classList.remove('is-visible'));
}

function setFieldError(fieldId, msg) {
  const input = $(`#${fieldId}`);
  const errEl = $(`#${fieldId}-error`);
  if (input) input.classList.add('is-error');
  if (errEl) {
    errEl.textContent = msg;
    errEl.classList.add('is-visible');
  }
}

function clearFieldError(fieldId) {
  const input = $(`#${fieldId}`);
  const errEl = $(`#${fieldId}-error`);
  if (input) input.classList.remove('is-error');
  if (errEl) {
    errEl.textContent = '';
    errEl.classList.remove('is-visible');
  }
}

function setButtonLoading(btn, isLoading, defaultText = 'Submit') {
  if (!btn) return;
  btn.disabled = isLoading;
  const textEl = btn.querySelector('.btn-text');
  const spinner = btn.querySelector('.btn-spinner');

  if (isLoading) {
    if (textEl) textEl.textContent = 'Authenticating...';
    if (spinner) spinner.classList.remove('is-hidden');
  } else {
    if (textEl) textEl.textContent = defaultText;
    if (spinner) spinner.classList.add('is-hidden');
  }
}

/* --------------------------------------------------------------------------
   SIGN IN SUBMISSION
   -------------------------------------------------------------------------- */
function initSignIn() {
  const form = $('#signin-form');
  const submitBtn = $('#signin-submit-btn');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearGlobalMessages();

    const email = $('#signin-email').value.trim();
    const password = $('#signin-password').value;

    let hasError = false;
    if (!email) {
      setFieldError('signin-email', 'Email address is required');
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError('signin-email', 'Please enter a valid email address');
      hasError = true;
    }

    if (!password) {
      setFieldError('signin-password', 'Password is required');
      hasError = true;
    }

    if (hasError) return;

    setButtonLoading(submitBtn, true);

    try {
      const res = await TouristService.login({ email, password });

      if (res.ok) {
        showGlobalSuccess('signin', '🌿 Welcome back! Redirecting to your dashboard...');
        setTimeout(() => {
          window.location.href = getRedirectUrl();
        }, 800);
      } else {
        setButtonLoading(submitBtn, false, 'Sign In to Dashboard');
        showGlobalError('signin', res.error || 'Invalid email or password.');
      }
    } catch (err) {
      setButtonLoading(submitBtn, false, 'Sign In to Dashboard');
      showGlobalError('signin', 'An unexpected connection error occurred. Please try again.');
    }
  });

  // Clear errors on input
  $('#signin-email')?.addEventListener('input', () => clearFieldError('signin-email'));
  $('#signin-password')?.addEventListener('input', () => clearFieldError('signin-password'));
}

/* --------------------------------------------------------------------------
   SIGN UP SUBMISSION
   -------------------------------------------------------------------------- */
function initSignUp() {
  const form = $('#signup-form');
  const submitBtn = $('#signup-submit-btn');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearGlobalMessages();

    const fullName = $('#signup-name').value.trim();
    const email = $('#signup-email').value.trim();
    const phone = $('#signup-phone').value.trim();
    const hometown = $('#signup-hometown').value.trim();
    const password = $('#signup-password').value;
    const terms = $('#signup-terms').checked;
    const avatarInput = $('#signup-avatar-input');
    const avatarFile = avatarInput?.files?.[0];

    let hasError = false;

    if (!fullName) {
      setFieldError('signup-name', 'Full name is required');
      hasError = true;
    }

    if (!email) {
      setFieldError('signup-email', 'Email is required');
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError('signup-email', 'Enter a valid email address');
      hasError = true;
    }

    if (!password) {
      setFieldError('signup-password', 'Password is required');
      hasError = true;
    } else if (password.length < 6) {
      setFieldError('signup-password', 'Password must be at least 6 characters');
      hasError = true;
    }

    if (!terms) {
      setFieldError('signup-terms', 'Please agree to the eco-tourism guidelines');
      hasError = true;
    }

    if (hasError) return;

    setButtonLoading(submitBtn, true, 'Creating Profile...');

    const formData = new FormData();
    formData.append('fullName', fullName);
    formData.append('email', email);
    formData.append('password', password);
    if (phone) formData.append('phone', phone);
    if (hometown) formData.append('hometown', hometown);
    if (avatarFile) formData.append('avatar', avatarFile);

    try {
      const regRes = await TouristService.register(formData);

      if (regRes.ok) {
        showGlobalSuccess('signup', '🎉 Profile created! Logging you in...');

        // Auto login
        const loginRes = await TouristService.login({ email, password });
        if (loginRes.ok) {
          setTimeout(() => {
            window.location.href = getRedirectUrl();
          }, 900);
        } else {
          // Switch to sign in tab
          setTimeout(() => {
            const tabBtn = $('[data-tab="signin"]');
            if (tabBtn) tabBtn.click();
            $('#signin-email').value = email;
            showGlobalSuccess('signin', 'Account created! Please sign in with your password.');
          }, 1000);
        }
      } else {
        setButtonLoading(submitBtn, false, 'Create Free Tourist Profile');
        showGlobalError('signup', regRes.error || 'Failed to register. Please check details.');
      }
    } catch (err) {
      setButtonLoading(submitBtn, false, 'Create Free Tourist Profile');
      showGlobalError('signup', 'Network error. Please try again.');
    }
  });

  // Clear errors on typing
  $('#signup-name')?.addEventListener('input', () => clearFieldError('signup-name'));
  $('#signup-email')?.addEventListener('input', () => clearFieldError('signup-email'));
  $('#signup-password')?.addEventListener('input', () => clearFieldError('signup-password'));
}

/* --------------------------------------------------------------------------
   QUICK DEMO LOGIN
   -------------------------------------------------------------------------- */
function initDemoLogin() {
  const demoBtn = $('#demo-signin-btn');
  if (!demoBtn) return;

  demoBtn.addEventListener('click', async () => {
    clearGlobalMessages();
    demoBtn.disabled = true;
    demoBtn.style.opacity = '0.7';

    $('#signin-email').value = 'aarav.test@example.com';
    $('#signin-password').value = 'password123';

    showGlobalSuccess('signin', '⚡ Connecting with demo tourist profile (Aarav Sharma)...');

    try {
      const res = await TouristService.login({
        email: 'aarav.test@example.com',
        password: 'password123',
      });

      if (res.ok) {
        setTimeout(() => {
          window.location.href = getRedirectUrl();
        }, 600);
      } else {
        demoBtn.disabled = false;
        demoBtn.style.opacity = '1';
        showGlobalError('signin', res.error || 'Demo login failed.');
      }
    } catch {
      demoBtn.disabled = false;
      demoBtn.style.opacity = '1';
      showGlobalError('signin', 'Could not reach API. Please check server.');
    }
  });
}
