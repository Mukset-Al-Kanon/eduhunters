/**
 * src/utils/securityShield.js
 * Comprehensive Client-Side Security & Anti-Inspection Shield for EduHunters.
 * Protects against Inspect Element, DevTools reverse-engineering, asset theft,
 * and credential tampering.
 */

export function initSecurityShield() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // 1. GLOBAL RIGHT-CLICK (CONTEXTMENU) PROTECTION
  // Prevents "Inspect Element" and "View Page Source" via mouse context menu
  document.addEventListener('contextmenu', (e) => {
    // Allow right-click ONLY inside text input fields and textareas for pasting
    const target = e.target;
    const isTextInput = target && (
      target.tagName === 'INPUT' || 
      target.tagName === 'TEXTAREA' || 
      target.isContentEditable
    );

    if (isTextInput) {
      return true; // Allow students to paste credentials or exam answers
    }

    e.preventDefault();
    e.stopPropagation();
    return false;
  }, true);

  // 2. DEVTOOLS & KEYBOARD SHORTCUTS BLOCKER
  // Blocks F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U, Ctrl+S
  document.addEventListener('keydown', (e) => {
    // F12 key (DevTools shortcut on all major browsers)
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    const isCtrlOrMeta = e.ctrlKey || e.metaKey;

    // Ctrl+Shift+I (Inspect Element), Ctrl+Shift+J (Console), Ctrl+Shift+C (Element Inspector), Ctrl+Shift+K (Firefox Console)
    if (isCtrlOrMeta && e.shiftKey) {
      const key = (e.key || '').toLowerCase();
      if (['i', 'j', 'c', 'k', 's'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }

    // Ctrl+U (View Page Source)
    if (isCtrlOrMeta && (e.key === 'u' || e.key === 'U')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+S (Save Webpage / Asset Stealing)
    if (isCtrlOrMeta && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);

  // 3. IMAGE & MEDIA DRAGGING PROTECTION
  // Prevents dragging course banners, thumbnails, or diagrams to desktop
  document.addEventListener('dragstart', (e) => {
    if (e.target && (e.target.nodeName === 'IMG' || e.target.nodeName === 'VIDEO')) {
      e.preventDefault();
      return false;
    }
  }, true);

  // 4. DEVTOOLS OPEN DETECTION & CONSOLE SANITIZATION
  // Clears console and suppresses sensitive outputs
  try {
    const isProd = import.meta.env.PROD;

    if (isProd) {
      // Overwrite sensitive console methods in production
      const noop = () => {};
      window.console.log = noop;
      window.console.info = noop;
      window.console.debug = noop;
      window.console.dir = noop;
      window.console.table = noop;
    }

    // Prominent Warning in Console
    const printSecurityWarning = () => {
      try {
        console.clear();
        console.log(
          '%c🛑 সতর্কতা / SECURITY WARNING',
          'color: #e11438; font-size: 24px; font-weight: 900; -webkit-text-stroke: 1px black;'
        );
        console.log(
          '%cEduHunters প্ল্যাটফর্মের কনটেন্ট ও ডেটা অ্যান্টি-পাইরেসি সিকিউরিটি শিল্ড দ্বারা সুরক্ষিত। কোনো সোর্স কোড বা ডেটা স্ক্র্যাপ করা সাইবার নিরাপত্তা আইনে কঠোরভাবে নিষিদ্ধ।',
          'color: #ffffff; font-size: 13px; font-weight: 600; line-height: 1.5;'
        );
      } catch (e) {}
    };

    // Periodic DevTools dimension check
    let devToolsOpen = false;
    const threshold = 160;

    const checkDevTools = () => {
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;
      if (widthDiff || heightDiff) {
        if (!devToolsOpen) {
          devToolsOpen = true;
          printSecurityWarning();
        }
      } else {
        devToolsOpen = false;
      }
    };

    window.addEventListener('resize', checkDevTools);
    setInterval(checkDevTools, 2000);
  } catch (err) {}

  // 5. LOCAL STORAGE PRIVILEGE TAMPERING SHIELD
  // Ensures standard students cannot self-escalate role to 'admin' in localStorage
  try {
    const checkRoleTampering = () => {
      try {
        const rawUser = localStorage.getItem('eh_current_user');
        const rawAdminSession = localStorage.getItem('eh_admin_session') || sessionStorage.getItem('eh_admin_session');
        
        if (rawUser) {
          const userObj = JSON.parse(rawUser);
          if (userObj && userObj.role === 'admin' && !rawAdminSession) {
            // Role tampering detected without valid admin session
            userObj.role = 'student';
            localStorage.setItem('eh_current_user', JSON.stringify(userObj));
          }
        }
      } catch (e) {}
    };

    checkRoleTampering();
    window.addEventListener('storage', checkRoleTampering);
  } catch (err) {}
}
