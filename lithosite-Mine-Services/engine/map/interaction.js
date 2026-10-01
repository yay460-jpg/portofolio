/* ============================================================
 * MINE SERVICES — Map Engine Interaction
 * Stage 20.7 — Map Interaction
 *
 * Platform-neutral interaction state. No renderer or UI dependency.
 * ============================================================ */

(function (global) {
  'use strict';

  const EVENTS = Object.freeze({
    SELECT: 'select',
    CLEAR_SELECTION: 'clear-selection',
    HOVER: 'hover',
    CLEAR_HOVER: 'clear-hover'
  });

  function requiredId(value, field) {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new TypeError(field + ' is required');
    }
    return value.trim();
  }

  function createInteraction() {
    let selectedFeatureId = null;
    let hoveredFeatureId = null;
    const listeners = new Map();

    function emit(type, detail) {
      const handlers = listeners.get(type) || [];
      handlers.slice().forEach(function (handler) {
        handler(detail);
      });
    }

    function on(type, handler) {
      if (!Object.values(EVENTS).includes(type)) {
        throw new TypeError('unsupported interaction event');
      }
      if (typeof handler !== 'function') {
        throw new TypeError('interaction handler must be a function');
      }

      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(handler);

      return function unsubscribe() {
        const handlers = listeners.get(type) || [];
        const index = handlers.indexOf(handler);
        if (index >= 0) handlers.splice(index, 1);
      };
    }

    function select(featureId) {
      selectedFeatureId = requiredId(featureId, 'feature.id');
      emit(EVENTS.SELECT, { featureId: selectedFeatureId });
      return selectedFeatureId;
    }

    function clearSelection() {
      const previous = selectedFeatureId;
      selectedFeatureId = null;
      emit(EVENTS.CLEAR_SELECTION, { featureId: previous });
      return previous;
    }

    function getSelectedFeatureId() {
      return selectedFeatureId;
    }

    function hover(featureId) {
      hoveredFeatureId = requiredId(featureId, 'feature.id');
      emit(EVENTS.HOVER, { featureId: hoveredFeatureId });
      return hoveredFeatureId;
    }

    function clearHover() {
      const previous = hoveredFeatureId;
      hoveredFeatureId = null;
      emit(EVENTS.CLEAR_HOVER, { featureId: previous });
      return previous;
    }

    function getHoveredFeatureId() {
      return hoveredFeatureId;
    }

    function clear() {
      clearSelection();
      clearHover();
    }

    return Object.freeze({
      on,
      select,
      clearSelection,
      getSelectedFeatureId,
      hover,
      clearHover,
      getHoveredFeatureId,
      clear
    });
  }

  global.MineServicesMapInteraction = Object.freeze({
    EVENTS,
    createInteraction
  });
})(window);
