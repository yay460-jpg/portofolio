(function (global) {
  'use strict';

  function createVisualBinding(root, projection) {
    if (!root) throw new TypeError('map root is required');
    if (!projection || !Array.isArray(projection.features)) {
      throw new TypeError('projected snapshot is required');
    }

    const surface = root.querySelector('.ms-map-engine__surface');
    if (!surface) throw new Error('map surface is required');

    function clearGenerated() {
      surface.querySelectorAll('[data-map-engine-generated="true"]').forEach(function (node) {
        node.remove();
      });
    }

    function screenPoint(point) {
      const width = root.clientWidth || 1;
      const height = root.clientHeight || 1;
      return {
        left: point.x + 'px',
        top: point.y + 'px',
        width: width,
        height: height
      };
    }

    function renderPoint(feature) {
      const point = feature.geometry.coordinate;
      const node = document.createElement('div');
      node.dataset.mapEngineGenerated = 'true';
      node.dataset.featureId = feature.id;
      node.className = 'ms-map-engine__generated-point';
      const p = screenPoint(point);
      node.style.left = p.left;
      node.style.top = p.top;
      node.title = feature.properties && feature.properties.name
        ? feature.properties.name
        : feature.id;
      surface.appendChild(node);
    }

    function renderLine(feature) {
      const node = document.createElement('div');
      node.dataset.mapEngineGenerated = 'true';
      node.dataset.featureId = feature.id;
      node.className = 'ms-map-engine__generated-line';
      const points = feature.geometry.coordinates;
      if (points.length >= 2) {
        const start = points[0];
        const end = points[points.length - 1];
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        node.style.left = start.x + 'px';
        node.style.top = start.y + 'px';
        node.style.width = length + 'px';
        node.style.transform = 'rotate(' + angle + 'deg)';
      }
      surface.appendChild(node);
    }

    function renderPolygon(feature) {
      const node = document.createElement('div');
      node.dataset.mapEngineGenerated = 'true';
      node.dataset.featureId = feature.id;
      node.className = 'ms-map-engine__generated-polygon';
      const ring = feature.geometry.rings[0] || [];
      if (ring.length) {
        let minX = ring[0].x;
        let minY = ring[0].y;
        let maxX = ring[0].x;
        let maxY = ring[0].y;
        ring.forEach(function (point) {
          minX = Math.min(minX, point.x);
          minY = Math.min(minY, point.y);
          maxX = Math.max(maxX, point.x);
          maxY = Math.max(maxY, point.y);
        });
        node.style.left = minX + 'px';
        node.style.top = minY + 'px';
        node.style.width = Math.max(1, maxX - minX) + 'px';
        node.style.height = Math.max(1, maxY - minY) + 'px';
      }
      surface.appendChild(node);
    }

    function render() {
      clearGenerated();
      projection.features.forEach(function (feature) {
        switch (feature.geometry.type) {
          case 'Point':
            renderPoint(feature);
            break;
          case 'LineString':
            renderLine(feature);
            break;
          case 'Polygon':
            renderPolygon(feature);
            break;
          default:
            break;
        }
      });
      return projection.features.length;
    }

    return Object.freeze({
      render,
      clear: clearGenerated
    });
  }

  global.MineServicesMapVisualBinding = Object.freeze({
    createVisualBinding
  });
})(window);
