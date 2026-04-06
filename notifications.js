// notifications.js — @capacitor/local-notifications wrapper
// Provides requestPermission, scheduleDailyReminder, cancelReminder.
// Gracefully no-ops when running outside Capacitor (web preview).

const gcNotifications = (() => {
  const NOTIF_ID = 1;

  function _plugin() {
    return window?.Capacitor?.Plugins?.LocalNotifications || null;
  }

  async function requestPermission() {
    const p = _plugin();
    if (!p) return false;
    try {
      const { display } = await p.checkPermissions();
      if (display === 'granted') return true;
      const { display: result } = await p.requestPermissions();
      return result === 'granted';
    } catch { return false; }
  }

  async function scheduleDailyReminder(hour = 9, minute = 0) {
    const p = _plugin();
    if (!p) return;
    try {
      const granted = await requestPermission();
      if (!granted) return;
      await cancelReminder();
      const at = new Date();
      at.setHours(hour, minute, 0, 0);
      if (at.getTime() <= Date.now()) at.setDate(at.getDate() + 1);
      await p.schedule({
        notifications: [{
          id: NOTIF_ID,
          title: 'GritCore',
          body: 'Your disciplines are waiting.',
          schedule: { at, repeats: true, every: 'day' },
          smallIcon: 'ic_stat_icon_config_sample',
        }]
      });
    } catch(e) { console.warn('gcNotifications.scheduleDailyReminder:', e); }
  }

  async function cancelReminder() {
    const p = _plugin();
    if (!p) return;
    try {
      await p.cancel({ notifications: [{ id: NOTIF_ID }] });
    } catch { /* not scheduled — safe to ignore */ }
  }

  return { requestPermission, scheduleDailyReminder, cancelReminder };
})();
