(function (global) {
  'use strict';

  function requiredTransform(transform) {
    if (!transform || typeof transform.worldToScreen !== 'function') {
      throw new TypeError('coordinate transform is required');
    }
    return transform;
  }

  function projectPoint(coordinate, transform, viewport) {
    return transform.worldToScreen(coordinate, viewport);
  }

  function projectGeometry(geometry, transform, viewport) {
    if (!geometry || typeof geometry !== 'object') {
      throw new TypeError('geometry is required');
    }
    requiredTransform(transform);

    switch (geometry.type) {
      case 'Point':
        return Object.freeze({
          type: 'Point',
          coordinate: projectPoint(geometry.coordinate, transform, viewport)
        });
      case 'LineString':
        return Object.freeze({
          type: 'LineString',
          coordinates: Object.freeze(geometry.coordinates.map(function (coordinate) {
            return projectPoint(coordinate, transform, viewport);
          }))
        });
      case 'Polygon':
        return Object.freeze({
          type: 'Polygon',
          rings: Object.freeze(geometry.rings.map(function (ring) {
            return Object.freeze(ring.map(function (coordinate) {
              return projectPoint(coordinate, transform, viewport);
            }));
          }))
        });
      default:
        throw new TypeError('Unsupported geometry type');
    }
  }

  function projectFeature(feature, transform, viewport) {
    if (!feature || typeof feature !== 'object' || !feature.id) {
      throw new TypeError('feature is required');
    }

    return Object.freeze({
      id: feature.id,
      layerId: feature.layerId,
      type: feature.type || 'feature',
      geometry: projectGeometry(feature.geometry, transform, viewport),
      properties: feature.properties || {}
    });
  }

  function projectSnapshot(snapshot, transform) {
    if (!snapshot || !snapshot.viewport || !snapshot.model) {
      throw new TypeError('map snapshot is required');
    }
    requiredTransform(transform);

    const features = Array.isArray(snapshot.model.features)
      ? snapshot.model.features.map(function (feature) {
          return projectFeature(feature, transform, snapshot.viewport);
        })
      : [];

    return Object.freeze({
      initialized: Boolean(snapshot.initialized),
      viewport: snapshot.viewport,
      features: Object.freeze(features)
    });
  }

  global.MineServicesMapGeometryProjection = Object.freeze({
    projectGeometry,
    projectFeature,
    projectSnapshot
  });
})(window);
