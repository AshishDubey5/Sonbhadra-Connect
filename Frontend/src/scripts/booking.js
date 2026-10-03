/**
 * Sonbhadra Tourism - Booking / Order Checkout Controller
 * Simple, accessible, interactive static frontend prototype
 * Handles destination prefill, live cost calculation, coupon discounts,
 * and staging confirmation modal.
 */

const DESTINATION_CONFIG = {
  'lakhaniya-dari': {
    name: 'Lakhaniya Dari Falls & Canyon Expedition',
    shortName: 'Lakhaniya Dari Falls',
    location: 'Near Ahraura / Robertsganj, Sonbhadra',
    image: '../../public/assets/images/destinations/lakhaniya-dari.webp',
    basePrice: 1499,
    creatorFee: 750,
    permitFee: 150,
    duration: 'Full Day Expedition'
  },
  'rihand-dam': {
    name: 'Govind Ballabh Pant Sagar (Rihand Dam) Cruise',
    shortName: 'Rihand Dam',
    location: 'Pipri, Sonbhadra District',
    image: '../../public/assets/images/destinations/rihand-dam.webp',
    basePrice: 1699,
    creatorFee: 850,
    permitFee: 100,
    duration: 'Sunset & Cruise Tour'
  },
  'vijaygarh-fort': {
    name: 'Vijaygarh Fort Ancient Heritage Trek',
    shortName: 'Vijaygarh Fort',
    location: 'Mau Kalan, Sonbhadra',
    image: '../../public/assets/images/destinations/vijaygarh-fort.webp',
    basePrice: 1299,
    creatorFee: 650,
    permitFee: 100,
    duration: 'Half Day Heritage Climb'
  },
  'agori-fort': {
    name: 'Agori Fort & Son Riverboat Crossing',
    shortName: 'Agori Fort',
    location: 'Chopan, Sonbhadra',
    image: '../../public/assets/images/destinations/agori-fort.webp',
    basePrice: 1399,
    creatorFee: 700,
    permitFee: 100,
    duration: 'Riverboat & Ruins Tour'
  },
  'mukha-falls': {
    name: 'Mukha Falls & Prehistoric Rock Art Trek',
    shortName: 'Mukha Falls',
    location: 'Ghorawal Region, Sonbhadra',
    image: '../../public/assets/images/destinations/mukha-falls.webp',
    basePrice: 1499,
    creatorFee: 750,
    permitFee: 120,
    duration: 'Canyon & Archaeology Day'
  }
};

class BookingController {
  constructor() {
    this.currentDest = this.resolveDestination();
    this.travelers = 1;
    this.includeCreator = true;
    this.couponDiscount = 0;
    this.appliedCouponCode = '';
  }

  resolveDestination() {
    const params = new URLSearchParams(window.location.search);
    const destParam = params.get('dest') || params.get('slug') || 'lakhaniya-dari';
    return DESTINATION_CONFIG[destParam] || DESTINATION_CONFIG['lakhaniya-dari'];
  }

  init() {
    this.initDates();
    this.populateDestinationInfo();
    this.bindEvents();
    this.recalculate();
  }

  initDates() {
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');

    // Default start date = tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(tomorrow);
    nextWeek.setDate(nextWeek.getDate() + 2);

    const formatDate = (d) => d.toISOString().split('T')[0];

    if (startDateInput) {
      startDateInput.min = formatDate(tomorrow);
      startDateInput.value = formatDate(tomorrow);
    }
    if (endDateInput) {
      endDateInput.min = formatDate(tomorrow);
      endDateInput.value = formatDate(nextWeek);
    }
  }

  populateDestinationInfo() {
    const dest = this.currentDest;
    const titleEl = document.getElementById('tourBannerTitle');
    const locEl = document.getElementById('tourBannerLoc');
    const thumbEl = document.getElementById('summaryThumb');
    const summaryNameEl = document.getElementById('summaryDestName');
    const destSelect = document.getElementById('destSelect');

    if (titleEl) titleEl.textContent = dest.name;
    if (locEl) locEl.textContent = dest.location;
    if (thumbEl) {
      thumbEl.src = dest.image;
      thumbEl.alt = dest.name;
    }
    if (summaryNameEl) summaryNameEl.textContent = dest.shortName;

    // Set select dropdown value if exists
    if (destSelect) {
      const currentKey = Object.keys(DESTINATION_CONFIG).find(k => DESTINATION_CONFIG[k] === dest) || 'lakhaniya-dari';
      destSelect.value = currentKey;
    }
  }

  bindEvents() {
    // Destination selector dropdown
    const destSelect = document.getElementById('destSelect');
    if (destSelect) {
      destSelect.addEventListener('change', (e) => {
        const key = e.target.value;
        if (DESTINATION_CONFIG[key]) {
          this.currentDest = DESTINATION_CONFIG[key];
          this.populateDestinationInfo();
          this.recalculate();
        }
      });
    }

    // Travelers Count change
    const travelersInput = document.getElementById('travelersCount');
    if (travelersInput) {
      travelersInput.addEventListener('input', (e) => {
        let val = parseInt(e.target.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        if (val > 20) val = 20;
        this.travelers = val;
        this.recalculate();
      });
    }

    // Travel with Creator checkbox
    const creatorCheckbox = document.getElementById('creatorAddonCheckbox');
    if (creatorCheckbox) {
      creatorCheckbox.addEventListener('change', (e) => {
        this.includeCreator = e.target.checked;
        this.recalculate();
      });
    }

    // Coupon Apply button
    const couponInput = document.getElementById('couponCodeInput');
    const couponBtn = document.getElementById('couponApplyBtn');
    const couponMsg = document.getElementById('couponMessage');

    if (couponBtn && couponInput) {
      couponBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const code = couponInput.value.trim().toUpperCase();
        if (!code) return;

        if (code === 'WELCOME2026' || code === 'SONBHADRA10' || code === 'CREATOR10') {
          this.appliedCouponCode = code;
          this.couponDiscount = 300; // Flat ₹300 off
          couponMsg.textContent = `Coupon "${code}" applied! You saved ₹300.`;
          couponMsg.style.color = '#52b788';
        } else {
          this.appliedCouponCode = '';
          this.couponDiscount = 0;
          couponMsg.textContent = `Invalid coupon code. Try WELCOME2026`;
          couponMsg.style.color = '#ff9e80';
        }
        this.recalculate();
      });
    }

    // Form Submit (Confirm Booking & Proceed to Payment)
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
      bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleBookingSubmit();
      });
    }

    // Modal Close
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalPrintBtn = document.getElementById('modalPrintBtn');
    const modal = document.getElementById('bookingConfirmationModal');

    if (modalCloseBtn && modal) {
      modalCloseBtn.addEventListener('click', () => {
        modal.classList.remove('is-active');
      });
    }

    if (modalPrintBtn) {
      modalPrintBtn.addEventListener('click', () => {
        window.print();
      });
    }
  }

  recalculate() {
    const dest = this.currentDest;
    const baseTotal = dest.basePrice * this.travelers;
    const creatorTotal = this.includeCreator ? (dest.creatorFee * this.travelers) : 0;
    const permitTotal = dest.permitFee * this.travelers;
    const subtotal = baseTotal + creatorTotal + permitTotal;
    const finalTotal = Math.max(0, subtotal - this.couponDiscount);

    // Update Banner Price
    const bannerPriceEl = document.getElementById('bannerPriceVal');
    if (bannerPriceEl) bannerPriceEl.textContent = `₹${dest.basePrice.toLocaleString('en-IN')}`;

    // Update Breakdown Table
    const baseLabel = document.getElementById('baseExpenseLabel');
    const baseVal = document.getElementById('baseExpenseVal');
    if (baseLabel) baseLabel.textContent = `Expedition Package (₹${dest.basePrice} × ${this.travelers})`;
    if (baseVal) baseVal.textContent = `₹${baseTotal.toLocaleString('en-IN')}`;

    const creatorRow = document.getElementById('creatorExpenseRow');
    const creatorVal = document.getElementById('creatorExpenseVal');
    if (creatorRow && creatorVal) {
      if (this.includeCreator) {
        creatorRow.style.display = 'flex';
        creatorVal.textContent = `+₹${creatorTotal.toLocaleString('en-IN')}`;
      } else {
        creatorRow.style.display = 'none';
      }
    }

    const permitVal = document.getElementById('permitExpenseVal');
    if (permitVal) permitVal.textContent = `₹${permitTotal.toLocaleString('en-IN')}`;

    // Coupon Row
    const discountRow = document.getElementById('discountExpenseRow');
    const discountVal = document.getElementById('discountExpenseVal');
    if (discountRow && discountVal) {
      if (this.couponDiscount > 0) {
        discountRow.style.display = 'flex';
        discountVal.textContent = `-₹${this.couponDiscount.toLocaleString('en-IN')}`;
      } else {
        discountRow.style.display = 'none';
      }
    }

    // Total Due
    const totalDueEl = document.getElementById('totalDueVal');
    if (totalDueEl) totalDueEl.textContent = `₹${finalTotal.toLocaleString('en-IN')}`;

    // Currencies estimation
    const currNote = document.getElementById('currencyNote');
    if (currNote) {
      const usd = (finalTotal / 84).toFixed(2);
      const eur = (finalTotal / 92).toFixed(2);
      const gbp = (finalTotal / 108).toFixed(2);
      currNote.textContent = `≈ $${usd} USD • €${eur} EUR • £${gbp} GBP (indicative conversion)`;
    }
  }

  handleBookingSubmit() {
    const givenName = document.getElementById('givenName').value.trim();
    const surname = document.getElementById('surname').value.trim();
    const email = document.getElementById('email').value.trim();
    const mobile = document.getElementById('contactPhone').value.trim();
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const nationality = document.getElementById('nationality').value;
    const gender = document.querySelector('input[name="gender"]:checked')?.value || 'Not specified';

    if (!givenName || !email || !mobile) {
      alert('Please fill in your Name, Email, and Mobile Number.');
      return;
    }

    // Generate random reference code
    const randomRef = 'SB-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);

    // Calculate total
    const totalDue = document.getElementById('totalDueVal').textContent;

    // Populate confirmation modal
    document.getElementById('receiptRef').textContent = `Order Ref: ${randomRef}`;
    document.getElementById('receiptCustomer').textContent = `${givenName} ${surname} (${gender}, ${nationality})`;
    document.getElementById('receiptDest').textContent = this.currentDest.name;
    document.getElementById('receiptDates').textContent = `${startDate} to ${endDate} (${this.travelers} traveler${this.travelers > 1 ? 's' : ''})`;
    document.getElementById('receiptCreator').textContent = this.includeCreator ? 'Yes (Verified Local Creator & Drone Guide)' : 'No (Standard Ranger Guide)';
    document.getElementById('receiptContact').textContent = `${mobile} | ${email}`;
    document.getElementById('receiptTotal').textContent = totalDue;

    // Show modal
    const modal = document.getElementById('bookingConfirmationModal');
    if (modal) modal.classList.add('is-active');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const controller = new BookingController();
  controller.init();
});
