/**
 * Creator Auth Page — JS Controller
 * Sonbhadra Tourism
 *
 * Handles: tab switching, form validation, register, login, avatar preview,
 *          social links manager, address toggle, loading states, error display.
 */

import { CreatorService } from '../../../services/creator.service.js';
import { setCreator, setTokens } from '../../../scripts/utils/auth-state.js';

/* --------------------------------------------------------------------------
   DOM HELPERS
   -------------------------------------------------------------------------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* --------------------------------------------------------------------------
   TAB SWITCHING
   -------------------------------------------------------------------------- */
function initTabs() {
  const tabs = $$('.auth-tab');
  const panels = $$('.auth-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      tabs.forEach(t => t.classList.remove('is-active'));
      panels.forEach(p => p.classList.remove('is-active'));

      tab.classList.add('is-active');
      const panel = $(`#auth-panel-${target}`);
      if (panel) panel.classList.add('is-active');

      // Clear all errors on tab switch
      clearAllErrors();
    });
  });

  // On load: activate from URL hash or default to login
  const hash = window.location.hash.replace('#', '');
  if (hash === 'register') {
    const registerTab = $('[data-tab="register"]');
    if (registerTab) registerTab.click();
  }
}

/* --------------------------------------------------------------------------
   REDIRECT AFTER AUTH
   -------------------------------------------------------------------------- */
function getRedirectUrl() {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get('redirect');
  if (redirect === 'dashboard' || !redirect) {
    return '../dashboard/index.html';
  }
  return redirect;
}

/* --------------------------------------------------------------------------
   ERROR / SUCCESS DISPLAY
   -------------------------------------------------------------------------- */
function showGlobalError(formId, message) {
  const el = $(`#${formId}-error`);
  if (!el) return;
  el.textContent = message;
  el.classList.add('is-visible');
  el.classList.remove('is-success');
}

function showGlobalSuccess(formId, message) {
  const el = $(`#${formId}-error`);
  if (!el) return;
  el.textContent = message;
  el.classList.remove('is-visible');
  el.className = 'auth-global-success is-visible';
}

function clearGlobalMessage(formId) {
  const el = $(`#${formId}-error`);
  if (!el) return;
  el.classList.remove('is-visible');
  el.className = 'auth-global-error';
}

function showFieldError(inputId, message) {
  const input = $(`#${inputId}`);
  const errorEl = $(`#${inputId}-error`);
  if (input) input.classList.add('is-error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add('is-visible');
  }
}

function clearFieldError(input) {
  input.classList.remove('is-error');
  const errorEl = document.getElementById(`${input.id}-error`);
  if (errorEl) errorEl.classList.remove('is-visible');
}

function clearAllErrors() {
  $$('.auth-input.is-error, .auth-textarea.is-error').forEach(el => el.classList.remove('is-error'));
  $$('.auth-field-error.is-visible').forEach(el => el.classList.remove('is-visible'));
  $$('.auth-global-error, .auth-global-success').forEach(el => {
    el.classList.remove('is-visible');
  });
}

/* --------------------------------------------------------------------------
   LOADING STATE
   -------------------------------------------------------------------------- */
function setLoading(btnId, isLoading) {
  const btn = $(`#${btnId}`);
  if (!btn) return;
  if (isLoading) {
    btn.disabled = true;
    btn.classList.add('is-loading');
  } else {
    btn.disabled = false;
    btn.classList.remove('is-loading');
  }
}

/* --------------------------------------------------------------------------
   PASSWORD SHOW / HIDE
   -------------------------------------------------------------------------- */
function initPasswordToggles() {
  $$('.auth-input-icon[data-toggle-password]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.togglePassword;
      const input = document.getElementById(targetId);
      if (!input) return;

      if (input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = eyeOffIcon();
      } else {
        input.type = 'password';
        btn.innerHTML = eyeIcon();
      }
    });
  });
}

function eyeIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
}

function eyeOffIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
}

/* --------------------------------------------------------------------------
   AVATAR UPLOAD PREVIEW
   -------------------------------------------------------------------------- */
function initAvatarUpload() {
  const fileInput = $('#reg-avatar');
  const previewImg = $('#avatar-preview-img');
  const previewIcon = $('#avatar-preview-icon');

  if (!fileInput) return;

  // Trigger hidden input on button click
  const uploadBtn = $('#avatar-upload-btn');
  if (uploadBtn) {
    uploadBtn.addEventListener('click', () => fileInput.click());
  }

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showFieldError('reg-avatar', 'Please select a valid image file (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showFieldError('reg-avatar', 'Avatar must be under 5MB.');
      return;
    }

    clearFieldError(fileInput);
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (previewImg) {
        previewImg.src = ev.target.result;
        previewImg.classList.add('is-loaded');
      }
      if (previewIcon) previewIcon.style.display = 'none';
    };
    reader.readAsDataURL(file);
  });
}

/* --------------------------------------------------------------------------
   SOCIAL LINKS MANAGER
   -------------------------------------------------------------------------- */
let socialLinkCount = 1;

function initSocialLinks() {
  const addBtn = $('#add-social-link');
  if (!addBtn) return;

  addBtn.addEventListener('click', () => {
    if (socialLinkCount >= 5) return; // max 5 links
    addSocialLinkRow();
  });
}

function addSocialLinkRow(value = '') {
  socialLinkCount++;
  const list = $('#social-links-list');
  if (!list) return;

  const item = document.createElement('div');
  item.className = 'auth-social-item';
  item.dataset.linkId = socialLinkCount;
  item.innerHTML = `
    <input type="url" class="auth-input auth-social-input" placeholder="https://instagram.com/yourhandle" value="${value}">
    <button type="button" class="auth-social-remove" aria-label="Remove link">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  `;

  item.querySelector('.auth-social-remove').addEventListener('click', () => {
    item.remove();
    socialLinkCount--;
  });

  list.appendChild(item);
}

function getSocialLinks() {
  return $$('.auth-social-input')
    .map(i => i.value.trim())
    .filter(v => v !== '');
}

/* --------------------------------------------------------------------------
   ADDRESS COLLAPSIBLE
   -------------------------------------------------------------------------- */
function initAddressToggle() {
  const toggle = $('#address-toggle');
  const collapsible = $('#address-collapsible');
  if (!toggle || !collapsible) return;

  toggle.addEventListener('click', () => {
    const isOpen = toggle.classList.toggle('is-open');
    collapsible.classList.toggle('is-open', isOpen);
  });
}

/* --------------------------------------------------------------------------
   CHARACTER COUNT FOR BIO
   -------------------------------------------------------------------------- */
function initCharCount() {
  const bioInput = $('#reg-bio');
  const counter = $('#bio-char-count');
  if (!bioInput || !counter) return;

  const maxLen = 300;
  bioInput.addEventListener('input', () => {
    const len = bioInput.value.length;
    counter.textContent = `${len} / ${maxLen}`;
    if (len > maxLen) {
      counter.style.color = '#ff8080';
    } else {
      counter.style.color = '';
    }
  });
}

/* --------------------------------------------------------------------------
   VALIDATION HELPERS
   -------------------------------------------------------------------------- */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));
}

/* --------------------------------------------------------------------------
   LOGIN FORM
   -------------------------------------------------------------------------- */
function initLoginForm() {
  const form = $('#login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllErrors();

    const emailOrUsername = $('#login-email').value.trim();
    const password = $('#login-password').value;

    let hasError = false;

    if (!emailOrUsername) {
      showFieldError('login-email', 'Please enter your email or creator username.');
      hasError = true;
    }

    if (!password) {
      showFieldError('login-password', 'Please enter your password.');
      hasError = true;
    }

    if (hasError) return;

    setLoading('login-submit', true);
    clearGlobalMessage('login');

    const { ok, data, error } = await CreatorService.login({ emailOrUsername, password });

    setLoading('login-submit', false);

    if (!ok) {
      showGlobalError('login', error || 'Login failed. Please check your credentials.');
      return;
    }

    // Persist creator in session and redirect
    const creator = data?.creator || data;
    if (creator) setCreator(creator);
    if (data?.accessToken) {
      setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    }

    showGlobalSuccess('login', 'Login successful! Redirecting to your dashboard…');

    setTimeout(() => {
      window.location.href = getRedirectUrl();
    }, 800);
  });

  // Live clear on input
  $$('#login-form .auth-input').forEach(input => {
    input.addEventListener('input', () => clearFieldError(input));
  });
}

/* --------------------------------------------------------------------------
   REGISTER FORM
   -------------------------------------------------------------------------- */
function initRegisterForm() {
  const form = $('#register-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllErrors();

    const creatorName = $('#reg-creatorName').value.trim();
    const fullName    = $('#reg-fullName').value.trim();
    const email       = $('#reg-email').value.trim();
    const phone       = $('#reg-phone').value.trim();
    const password    = $('#reg-password').value;
    const confirm     = $('#reg-confirm').value;
    const avatarFile  = $('#reg-avatar').files[0];
    const coveringCity = $('#reg-coveringCity').value.trim();
    const bio         = $('#reg-bio').value.trim();

    let hasError = false;

    if (!creatorName || creatorName.length < 3) {
      showFieldError('reg-creatorName', 'Creator username must be at least 3 characters.');
      hasError = true;
    } else if (!/^[a-z0-9_]+$/.test(creatorName)) {
      showFieldError('reg-creatorName', 'Only lowercase letters, numbers, and underscores allowed.');
      hasError = true;
    }

    if (!fullName) {
      showFieldError('reg-fullName', 'Full name is required.');
      hasError = true;
    }

    if (!email || !isValidEmail(email)) {
      showFieldError('reg-email', 'Please enter a valid email address.');
      hasError = true;
    }

    if (!phone || !isValidPhone(phone)) {
      showFieldError('reg-phone', 'Please enter a valid 10-digit Indian mobile number.');
      hasError = true;
    }

    if (!password || password.length < 8) {
      showFieldError('reg-password', 'Password must be at least 8 characters.');
      hasError = true;
    }

    if (password !== confirm) {
      showFieldError('reg-confirm', 'Passwords do not match.');
      hasError = true;
    }

    if (!avatarFile) {
      showFieldError('reg-avatar', 'A profile photo is required.');
      hasError = true;
    }

    if (hasError) return;

    setLoading('register-submit', true);
    clearGlobalMessage('register');

    // Build FormData for multipart/form-data
    const formData = new FormData();
    formData.append('creatorName', creatorName.toLowerCase());
    formData.append('fullName', fullName);
    formData.append('email', email.toLowerCase());
    formData.append('phone', phone);
    formData.append('password', password);
    formData.append('avatar', avatarFile);
    if (coveringCity) formData.append('coveringCity', coveringCity);
    if (bio) formData.append('bio', bio);

    // Social links as JSON string
    const socialLinks = getSocialLinks();
    if (socialLinks.length) formData.append('socialLinks', JSON.stringify(socialLinks));

    // Address (optional)
    const street  = $('#reg-street').value.trim();
    const city    = $('#reg-city').value.trim();
    const state   = $('#reg-state').value.trim();
    const pincode = $('#reg-pincode').value.trim();
    if (street || city || state || pincode) {
      formData.append('address', JSON.stringify({ street, city, state, pincode, country: 'India' }));
    }

    const { ok, data, error } = await CreatorService.register(formData);

    setLoading('register-submit', false);

    if (!ok) {
      showGlobalError('register', error || 'Registration failed. Please try again.');
      return;
    }

    showGlobalSuccess('register', 'Account created! Logging you in…');

    // Auto-login after registration
    const { ok: loginOk, data: loginData, error: loginError } =
      await CreatorService.login({ emailOrUsername: email, password });

    if (loginOk) {
      const creator = loginData?.creator || loginData;
      if (creator) setCreator(creator);
      if (loginData?.accessToken) {
        setTokens({ accessToken: loginData.accessToken, refreshToken: loginData.refreshToken });
      }
      setTimeout(() => { window.location.href = getRedirectUrl(); }, 900);
    } else {
      // Registration succeeded but auto-login failed — send to login tab
      setTimeout(() => {
        $('[data-tab="login"]').click();
        showGlobalError('login', 'Account created! Please log in to continue.');
      }, 1200);
    }
  });

  // Live clear on input
  $$('#register-form .auth-input, #register-form .auth-textarea').forEach(input => {
    input.addEventListener('input', () => clearFieldError(input));
  });
}

/* --------------------------------------------------------------------------
   INIT
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initPasswordToggles();
  initAvatarUpload();
  initSocialLinks();
  initAddressToggle();
  initCharCount();
  initLoginForm();
  initRegisterForm();
});
