(function (global) {
  'use strict';

  const DEFAULT_COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#94a3b8'];

  function escapeColor(value, fallback) {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
  }

  function render(options) {
    const config = options || {};
    const element = typeof config.element === 'string'
      ? document.getElementById(config.element)
      : config.element;
    if (!element) return false;

    const segments = Array.isArray(config.segments) ? config.segments : [];
    const total = segments.reduce(function (sum, segment) {
      const value = Number(segment && segment.value);
      return sum + (Number.isFinite(value) && value > 0 ? value : 0);
    }, 0);
    const fallbackColor = escapeColor(config.emptyColor, '#203247');
    let cursor = 0;
    const stops = [];

    segments.forEach(function (segment, index) {
      const value = Number(segment && segment.value);
      if (!Number.isFinite(value) || value <= 0 || total <= 0) return;
      const start = cursor;
      cursor += (value / total) * 360;
      const color = escapeColor(segment.color, DEFAULT_COLORS[index % DEFAULT_COLORS.length]);
      stops.push(color + ' ' + start.toFixed(3) + 'deg ' + cursor.toFixed(3) + 'deg');
    });

    element.style.background = total > 0
      ? 'conic-gradient(' + stops.join(', ') + ')'
      : fallbackColor;
    element.setAttribute('role', 'img');
    element.setAttribute('aria-label', config.label || ('Donut chart, total ' + total));
    element.dataset.graphicDonutTotal = String(total);

    if (config.totalElement) {
      const totalElement = typeof config.totalElement === 'string'
        ? document.getElementById(config.totalElement)
        : config.totalElement;
      if (totalElement) totalElement.textContent = config.formatTotal
        ? config.formatTotal(total)
        : String(total);
    }

    return true;
  }

  function clear(target) {
    const element = typeof target === 'string' ? document.getElementById(target) : target;
    if (!element) return false;
    element.style.removeProperty('background');
    element.removeAttribute('aria-label');
    delete element.dataset.graphicDonutTotal;
    return true;
  }

  global.LithositeGraphicDonut = Object.freeze({ render: render, clear: clear });
})(window);
