(function (global) {
  'use strict';

  const CRS = Object.freeze({
    id: 'MINE-SERVICES-LOCAL',
    type: 'projected',
    axis: 'xy',
    units: 'meter'
  });

  function coordinate(x, y) {
    return Object.freeze({ x: x, y: y, crs: CRS });
  }

  function createSampleGeometry() {
    return {
      site: {
        type: 'Polygon',
        rings: [[
          coordinate(-500, -300),
          coordinate(500, -300),
          coordinate(500, 300),
          coordinate(-500, 300),
          coordinate(-500, -300)
        ]]
      },
      workfronts: [
        { id: 'WF-01', name: 'PIT NORTH', x: -280, y: 130 },
        { id: 'WF-02', name: 'DEVELOPMENT', x: 280, y: 150 },
        { id: 'WF-03', name: 'LAND CLEARING', x: -320, y: -170 },
        { id: 'WF-04', name: 'STOCKPILE', x: 250, y: -150 }
      ],
      routes: [
        { id: 'RT-01', name: 'Hauling Road A', points: [[-420, -80], [420, 120]] },
        { id: 'RT-02', name: 'Hauling Road B', points: [[-420, 120], [420, -100]] },
        { id: 'RT-03', name: 'Hauling Road C', points: [[20, -40], [420, -240]] }
      ]
    };
  }

  function createMapBootstrap(options) {
    options = options || {};

    const layers = options.layerManager;
    const features = options.featureRegistry;
    const model = options.model;
    const engine = options.engine;
    const navigation = options.navigation;
    const interaction = options.interaction;

    if (!layers || !features || !model || !engine || !navigation || !interaction) {
      throw new TypeError('map engine bootstrap components are required');
    }

    let initialized = false;

    function initialize() {
      if (initialized) return getSnapshot();

      layers.addLayer({ id: 'site', type: 'site', name: 'Site', order: 10 });
      layers.addLayer({ id: 'workfront', type: 'workfront', name: 'Work Front', order: 20 });
      layers.addLayer({ id: 'route', type: 'route', name: 'Hauling Road', order: 30 });
      layers.addLayer({ id: 'equipment', type: 'equipment', name: 'Equipment', order: 40 });
      layers.addLayer({ id: 'operations', type: 'operations', name: 'Operations', order: 50 });
      layers.addLayer({ id: 'maintenance', type: 'maintenance', name: 'Maintenance', order: 60 });
      layers.addLayer({ id: 'hse', type: 'hse', name: 'HSE', order: 70 });
      layers.addLayer({ id: 'issue', type: 'issue', name: 'Issue', order: 80 });

      const sample = createSampleGeometry();

      features.addFeature({
        id: 'SITE-01',
        layerId: 'site',
        type: 'site',
        geometry: sample.site,
        properties: { name: 'Mine Services Site' }
      });

      sample.workfronts.forEach(function (item) {
        features.addFeature({
          id: item.id,
          layerId: 'workfront',
          type: 'workfront',
          geometry: { type: 'Point', coordinate: coordinate(item.x, item.y) },
          properties: { name: item.name }
        });
      });

      sample.routes.forEach(function (item) {
        features.addFeature({
          id: item.id,
          layerId: 'route',
          type: 'route',
          geometry: {
            type: 'LineString',
            coordinates: item.points.map(function (point) {
              return coordinate(point[0], point[1]);
            })
          },
          properties: { name: item.name }
        });
      });

      navigation.setViewport({
        center: coordinate(0, 0),
        width: 1000,
        height: 560,
        scale: 1,
        zoom: 0
      });

      engine.prepare({
        crs: CRS,
        viewport: navigation.getViewport(),
        model: model,
        navigation: navigation,
        interaction: interaction
      });
      engine.ready();

      initialized = true;
      return getSnapshot();
    }

    function getSnapshot() {
      return Object.freeze({
        initialized: initialized,
        crs: CRS,
        viewport: navigation.getViewport(),
        model: model.snapshot()
      });
    }

    return Object.freeze({
      initialize: initialize,
      getSnapshot: getSnapshot
    });
  }

  global.MineServicesMapBootstrap = Object.freeze({
    CRS: CRS,
    createMapBootstrap: createMapBootstrap
  });
})(window);
