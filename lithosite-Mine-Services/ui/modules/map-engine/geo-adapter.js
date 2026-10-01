/* Lithosite Mine Services — Geo Engine adapter.
 * The shared geo-engine.js remains the single geospatial implementation.
 * This adapter only supplies explicit Mine Services configuration and a small
 * integration surface for the map host. It does not duplicate projection math.
 */
(function(global){
  'use strict';

  function validateConfig(config){
    var c=config||{};
    var zone=Number(c.zone);
    var hemisphere=String(c.hemisphere||'').toUpperCase();
    if(!Number.isInteger(zone)||zone<1||zone>60)throw new Error('Invalid UTM zone');
    if(hemisphere!=='N'&&hemisphere!=='S')throw new Error('Invalid UTM hemisphere');
    return {zone:zone,hemisphere:hemisphere};
  }

  function create(config){
    if(typeof global.inverseUtm_!=='function'||
       typeof global.computeConvergenceForPoint_!=='function'||
       typeof global.bearingDistanceGrid_!=='function'){
      throw new Error('Lithosite Geo Engine is not loaded');
    }
    var crs=validateConfig(config);
    return {
      crs:crs,
      inverseUtm:function(easting,northing){
        return global.inverseUtm_(Number(easting),Number(northing),crs.zone,crs.hemisphere);
      },
      convergence:function(easting,northing){
        return global.computeConvergenceForPoint_(Number(easting),Number(northing),crs.zone,crs.hemisphere);
      },
      bearingDistance:function(eastingFrom,northingFrom,eastingTo,northingTo){
        return global.bearingDistanceGrid_(Number(eastingFrom),Number(northingFrom),Number(eastingTo),Number(northingTo));
      }
    };
  }

  global.LithositeMineServicesGeo={
    create:create,
    validateConfig:validateConfig
  };
})(window);
