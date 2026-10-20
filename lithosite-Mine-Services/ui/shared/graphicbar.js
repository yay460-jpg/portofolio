(function (global) {
  'use strict';

  function resolveElement(target) {
    return typeof target === 'string' ? document.getElementById(target) : target;
  }

  function render(options) {
    const config = options || {};
    const container = resolveElement(config.element);
    if (!container) return false;

    const values = Array.isArray(config.values) ? config.values : [];
    const numeric = values.map(function (item) {
      return Number(item && typeof item === 'object' ? item.value : item);
    }).map(function (value) {
      return Number.isFinite(value) && value > 0 ? value : 0;
    });
    const maximum = numeric.reduce(function (max, value) { return Math.max(max, value); }, 0);
    const fragment = document.createDocumentFragment();

    numeric.forEach(function (value, index) {
      const bar = document.createElement('span');
      bar.className = 'graphic-bar__item';
      bar.style.height = (maximum > 0 ? (value / maximum) * 100 : 0).toFixed(2) + '%';
      bar.setAttribute('role', 'img');
      const label = values[index] && typeof values[index] === 'object' ? values[index].label : '';
      bar.setAttribute('aria-label', (label ? label + ': ' : '') + value);
      fragment.appendChild(bar);
    });

    container.replaceChildren(fragment);
    container.classList.add('graphic-bar');
    return true;
  }

  function renderMaterialMovement(options) {
    const config = options || {};
    const container = resolveElement(config.element);
    const legend = resolveElement(config.legendElement);
    if (!container || !legend) return false;

    const groups = Array.isArray(config.groups) ? config.groups : [];
    const maximum = Number.isFinite(Number(config.maximum)) && Number(config.maximum) > 0
      ? Number(config.maximum) : 0;
    const fragment = document.createDocumentFragment();

    if (!groups.length) {
      const empty = document.createElement('div');
      empty.className = 'graphic-bar__empty';
      empty.textContent = config.emptyMessage || 'No data recorded';
      fragment.appendChild(empty);
    } else {
      groups.forEach(function (groupData) {
        const group = document.createElement('div');
        group.className = 'graphic-bar__group';
        const area = document.createElement('div');
        area.className = 'graphic-bar__group-area';

        (Array.isArray(groupData.values) ? groupData.values : []).forEach(function (item) {
          const value = Number(item.value);
          const safeValue = Number.isFinite(value) && value > 0 ? value : 0;
          const bar = document.createElement('span');
          bar.className = 'v chart-material-bar ' + String(item.className || '');
          bar.style.height = String(maximum > 0 ? safeValue / maximum * 100 : 0) + '%';
          bar.title = item.title || ((item.label || 'Value') + ': ' + safeValue);
          bar.setAttribute('role', 'img');
          bar.setAttribute('aria-label', bar.title);
          area.appendChild(bar);
        });

        const label = document.createElement('span');
        label.className = 'graphic-bar__group-label';
        label.textContent = String(groupData.label || '');
        group.appendChild(area);
        group.appendChild(label);
        fragment.appendChild(group);
      });
    }

    container.replaceChildren(fragment);
    container.classList.add('graphic-bar', 'graphic-bar--material');

    const legendFragment = document.createDocumentFragment();
    (Array.isArray(config.legendItems) ? config.legendItems : []).forEach(function (item) {
      const row = document.createElement('span');
      row.className = 'chartkey' + (item.extraClass ? ' ' + item.extraClass : '');
      const dot = document.createElement('i');
      dot.className = 'chartdot ' + String(item.colorClass || '');
      const label = document.createElement('span');
      label.className = 'chartkey-name';
      label.textContent = String(item.label || '');
      const value = document.createElement('span');
      value.className = 'chartkey-value';
      value.textContent = String(item.value || '');
      row.appendChild(dot);
      row.appendChild(label);
      row.appendChild(value);
      legendFragment.appendChild(row);
    });
    legend.replaceChildren(legendFragment);

    const totalElement = config.totalElement;
    if (totalElement) totalElement.textContent = String(config.totalText || '');
    return true;
  }

  function renderRainfallRecords(options) {
    const config = options || {};
    const container = resolveElement(config.element);
    if (!container) return false;

    const rows = Array.isArray(config.rows) ? config.rows : [];
    const numeric = rows.map(function (row) {
      const value = Number(row && row.total_rainfall_mm);
      return Number.isFinite(value) && value > 0 ? value : 0;
    });
    const maximum = numeric.reduce(function (max, value) { return Math.max(max, value); }, 0);
    const fragment = document.createDocumentFragment();

    if (!rows.length) {
      const empty = document.createElement('p');
      empty.className = 'graphic-bar__record-empty';
      empty.textContent = config.emptyMessage || 'No saved rainfall records with date and rainfall values yet.';
      fragment.appendChild(empty);
    } else {
      rows.forEach(function (row, index) {
        const item = document.createElement('div');
        item.className = 'graphic-bar__record-row';

        const meta = document.createElement('div');
        meta.className = 'graphic-bar__record-meta';
        const title = document.createElement('strong');
        title.textContent = String(row.scenario_name || 'Rainfall Scenario');
        const date = document.createElement('span');
        const parsed = new Date(row.created_at);
        date.textContent = Number.isNaN(parsed.getTime())
          ? String(row.created_at || '')
          : parsed.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
        meta.appendChild(title);
        meta.appendChild(date);

        const track = document.createElement('div');
        track.className = 'graphic-bar__record-track';
        track.setAttribute('role', 'img');
        track.setAttribute('aria-label', title.textContent + ', ' +
          Number(row.total_rainfall_mm).toLocaleString('id-ID', { maximumFractionDigits: 2 }) + ' mm total rainfall');
        const fill = document.createElement('div');
        fill.className = 'graphic-bar__record-fill';
        fill.style.width = (maximum > 0 ? Math.max(1, numeric[index] / maximum * 100) : 0) + '%';
        track.appendChild(fill);

        const value = document.createElement('strong');
        value.className = 'graphic-bar__record-value';
        value.textContent = Number(row.total_rainfall_mm).toLocaleString('id-ID', { maximumFractionDigits: 2 }) + ' mm';

        item.appendChild(meta);
        item.appendChild(track);
        item.appendChild(value);
        fragment.appendChild(item);
      });
    }

    container.replaceChildren(fragment);
    container.classList.add('graphic-bar', 'graphic-bar--rainfall-records');
    return true;
  }

  function clear(target) {
    const container = resolveElement(target);
    if (!container) return false;
    container.replaceChildren();
    container.classList.remove('graphic-bar', 'graphic-bar--material', 'graphic-bar--rainfall-records');
    return true;
  }

  global.LithositeGraphicBar = Object.freeze({
    render: render,
    renderMaterialMovement: renderMaterialMovement,
    renderRainfallRecords: renderRainfallRecords,
    clear: clear
  });
})(window);
