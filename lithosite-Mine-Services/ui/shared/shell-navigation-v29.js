(function (global) {
  'use strict';

  const SCREENS = Object.freeze({
    Dashboard:'dashboardScreen', Operations:'operationsScreen', Equipment:'equipmentScreen',
    'Work Front':'workfrontScreen', Maintenance:'maintenanceScreen', Issues:'issuesScreen',
    Plans:'plansScreen', HSE:'hseScreen', Reports:'reportsScreen'
  });
  const STORAGE_KEY = 'lithosite-v29-active-screen';
  let currentScreen = 'Dashboard';
  let initialized = false;

  function setScreen(name, persist) {
    if (!SCREENS[name]) return false;
    currentScreen = name;
    if (persist !== false) { try { sessionStorage.setItem(STORAGE_KEY,name); } catch (_) {} }
    Object.keys(SCREENS).forEach(function (screenName) {
      const el = document.getElementById(SCREENS[screenName]);
      if (!el) return;
      const active = screenName === name;
      el.hidden = !active; el.setAttribute('aria-hidden',String(!active)); el.classList.toggle('active',active);
    });
    document.querySelectorAll('.sidebar .nav-item').forEach(function (item) {
      const screen = item.getAttribute('data-screen');
      const active = screen === name;
      item.classList.toggle('active',active); item.setAttribute('aria-current',active ? 'page' : 'false');
    });
    try { window.dispatchEvent(new CustomEvent('lithosite:screen-changed',{detail:{screen:name}})); } catch (_) {}
    return true;
  }

  function validateShellContract() {
    const required = Object.keys(SCREENS);
    const missing = required.filter(function (name) { return !document.getElementById(SCREENS[name]); });
    if (missing.length) { console.error('[Lithosite Shell] Missing screen DOM:',missing.join(', ')); return false; }
    if (!document.getElementById('side') || !document.getElementById('toggle')) {
      console.error('[Lithosite Shell] Missing sidebar/toggle DOM.'); return false;
    }
    return true;
  }

  function readInitialScreen() {
    try { const saved=sessionStorage.getItem(STORAGE_KEY); return saved && SCREENS[saved] ? saved : 'Dashboard'; }
    catch (_) { return 'Dashboard'; }
  }

  function init() {
    if (initialized) return true;
    if (!validateShellContract()) return false;
    initialized=true;
    const side=document.getElementById('side');
    const toggle=document.getElementById('toggle');
    if (toggle && side) toggle.addEventListener('click',function(event){event.preventDefault();event.stopPropagation();side.classList.toggle('expanded');});
    const nav=document.querySelector('.sidebar .nav');
    if (nav) nav.addEventListener('click',function(event){
      const item=event.target.closest('.nav-item');
      if (!item || !nav.contains(item)) return;
      event.preventDefault(); event.stopPropagation();
      const screen=item.getAttribute('data-screen');
      if (screen && SCREENS[screen]) { setScreen(screen); return; }
      const labelNode=item.querySelector('.nav-text');
      const label=labelNode ? labelNode.textContent.trim() : '';
      if (label === 'Data Manage' && global.LithositeDataManagement) { global.LithositeDataManagement.open(); return; }
      if (label === 'Settings') { window.alert('Settings module belum tersedia pada Desktop Master.'); return; }
      window.alert(label + ' module belum tersedia pada Desktop Master.');
    });
    setScreen(readInitialScreen(),false);
    return true;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();

  global.LithositeShellNavigation=Object.freeze({init,setScreen,screens:SCREENS,getCurrentScreen:function(){return currentScreen;}});
})(window);