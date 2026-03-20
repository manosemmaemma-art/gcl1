// ── Paywall Module ──
// Manages entitlement state using RevenueCat (when running in Capacitor)
// with a localStorage-based trial fallback for web/preview.
//
// States:
//   'trial'    — within 7-day window, full access
//   'locked'   — trial expired, not purchased
//   'unlocked' — purchased

const paywall = (() => {
  const TRIAL_DAYS = (typeof GC_CONFIG !== 'undefined') ? GC_CONFIG.TRIAL_DAYS : 7;
  const ENTITLEMENT = (typeof GC_CONFIG !== 'undefined') ? GC_CONFIG.ENTITLEMENT_ID : 'premium';
  let _state = 'trial';
  let _trialStart = null;

  function getTrialDaysLeft() {
    if (!_trialStart) return TRIAL_DAYS;
    const elapsed = (Date.now() - _trialStart) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(TRIAL_DAYS - elapsed));
  }

  function isUnlocked() { return _state === 'unlocked'; }
  function isLocked()   { return _state === 'locked'; }
  function isTrial()    { return _state === 'trial'; }

  async function _checkRevenueCat() {
    try {
      // Capacitor RevenueCat plugin
      const { Purchases } = window;
      if (!Purchases) return false;
      const { customerInfo } = await Purchases.getCustomerInfo();
      const active = customerInfo?.entitlements?.active || {};
      return !!active[ENTITLEMENT];
    } catch {
      return false;
    }
  }

  async function _configureRevenueCat() {
    try {
      const { Purchases } = window;
      if (!Purchases || !GC_CONFIG?.REVENUECAT_API_KEY) return;
      if (GC_CONFIG.REVENUECAT_API_KEY === 'YOUR_REVENUECAT_IOS_PUBLIC_KEY') return;
      await Purchases.configure({ apiKey: GC_CONFIG.REVENUECAT_API_KEY });
    } catch { /* Not in Capacitor — ignore */ }
  }

  async function init() {
    await _configureRevenueCat();

    // Check if already purchased via RevenueCat
    const rcUnlocked = await _checkRevenueCat();
    if (rcUnlocked) {
      _state = 'unlocked';
      _applyGoldUI();
      return;
    }

    // Check localStorage for purchased flag (set after successful purchase)
    const purchased = localStorage.getItem('gc:purchased');
    if (purchased === '1') {
      _state = 'unlocked';
      _applyGoldUI();
      return;
    }

    // Check trial window
    const ts = localStorage.getItem('gc:trial_start');
    if (ts) {
      _trialStart = parseInt(ts);
      const elapsed = (Date.now() - _trialStart) / (1000 * 60 * 60 * 24);
      _state = elapsed < TRIAL_DAYS ? 'trial' : 'locked';
    } else {
      // No trial started yet — onboarding will call initTrial()
      _state = 'trial';
    }
  }

  function initTrial() {
    if (localStorage.getItem('gc:trial_start')) return; // already set
    _trialStart = Date.now();
    localStorage.setItem('gc:trial_start', String(_trialStart));
    _state = 'trial';
  }

  function _applyGoldUI() {
    document.body.classList.add('premium');
    localStorage.setItem('gc:purchased', '1');
  }

  async function purchase() {
    // Try RevenueCat in Capacitor
    try {
      const { Purchases } = window;
      if (Purchases) {
        const offerings = await Purchases.getOfferings();
        const pkg = offerings?.current?.availablePackages?.[0];
        if (!pkg) { _showAlert('No offerings found. Try again later.'); return; }
        const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
        const active = customerInfo?.entitlements?.active || {};
        if (active[ENTITLEMENT]) {
          _state = 'unlocked';
          _applyGoldUI();
          if (typeof render === 'function') render();
          if (typeof showToast === 'function') showToast('Unlocked — welcome to Gritcore');
          return;
        }
      }
    } catch (e) {
      if (e?.userCancelled) return; // user cancelled — no error
      _showAlert('Purchase failed. Please try again.');
      return;
    }

    // Web preview fallback (dev only)
    if (window.location.hostname === 'localhost' || window.location.protocol === 'file:') {
      _state = 'unlocked';
      _applyGoldUI();
      if (typeof render === 'function') render();
      if (typeof showToast === 'function') showToast('Dev unlock — premium active');
    }
  }

  async function restore() {
    try {
      const { Purchases } = window;
      if (Purchases) {
        const { customerInfo } = await Purchases.restorePurchases();
        const active = customerInfo?.entitlements?.active || {};
        if (active[ENTITLEMENT]) {
          _state = 'unlocked';
          _applyGoldUI();
          if (typeof render === 'function') render();
          if (typeof showToast === 'function') showToast('Purchase restored');
          return;
        }
        if (typeof showToast === 'function') showToast('No purchase found');
        return;
      }
    } catch {
      if (typeof showToast === 'function') showToast('Restore failed — try again');
    }
    if (typeof showToast === 'function') showToast('No purchase found');
  }

  function _showAlert(msg) {
    if (typeof showToast === 'function') showToast(msg);
    else alert(msg);
  }

  return { init, initTrial, purchase, restore, isUnlocked, isLocked, isTrial, getTrialDaysLeft };
})();
