const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const source = fs.readFileSync(require('path').join(__dirname, '../../scripts/map/map-feature-drawing.js'), 'utf8');
let listener = null;
const status = { innerHTML: '' };
const context = {
  console,
  setTimeout: () => 0,
  requestAnimationFrame: (fn) => fn(),
  addEventListener: () => {},
  Number,
  String,
  Math,
  Date,
  JSON,
  document: {
    addEventListener(type, fn, capture) { if (type === 'click' && capture === true) listener = fn; },
    getElementById(id) { return id === 'mg1-feature-drawing-status' ? status : null; },
    createElement() { return { id:'mg1-feature-drawing-status', innerHTML:'', }; },
    body: { appendChild(){} }
  },
  computeResponsiveDisplayBounds_: () => ({minT:0,maxT:1000,minU:0,maxU:1000}),
  buildMapData: () => ({}),
  getMapSvgViewportSize_: () => ({viewW:1000,viewH:1000}),
  getMapViewBox_: () => ({x:0,y:0,w:1000,h:1000}),
  projectToSvg: (x,y,b,w,h) => ({x:((x-b.minT)/(b.maxT-b.minT))*w,y:h-((y-b.minU)/(b.maxU-b.minU))*h}),
  setSemanticFeatureGeometryFromMap_: (layerId, geometry) => { context.saved = {layerId,geometry}; },
  openLayerManagementPanel_: () => { context.reopened = true; },
  closeLayerManagementPanel_: () => { context.closed = true; },
  DOMPoint: function(x,y){ this.x=x; this.y=y; this.matrixTransform=function(m){ return {x:m.a*this.x + m.c*this.y + m.e, y:m.b*this.x + m.d*this.y + m.f}; }; },
  window: null
};
context.window = context;
vm.runInNewContext(source, context, { filename:'map-feature-drawing.js' });
assert(context.MG1MapFeatureDrawing);
assert.strictEqual(context.MG1MapFeatureDrawing.start('layer-1','line'), false);
assert.strictEqual(context.MG1MapFeatureDrawing.start('layer-1','point'), true);
assert.strictEqual(context.MG1MapFeatureDrawing.isActive(), true);
assert.strictEqual(context.closed, undefined); // picker must not call render()/closeLayerManagementPanel_
const svg = { getBoundingClientRect:()=>({left:0,top:0,width:100,height:100}), getScreenCTM:()=>({inverse:()=>({a:10,b:0,c:0,d:10,e:0,f:0})}) };
const event = { clientX:25, clientY:75, target:{closest:(sel)=> sel === 'svg[data-map-gesture="true"]' ? svg : null}, preventDefault(){this.prevented=true;}, stopPropagation(){this.stopped=true;} };
listener(event);
assert.strictEqual(context.saved.layerId,'layer-1');
assert.strictEqual(JSON.stringify(context.saved.geometry), JSON.stringify({type:'Point',coordinates:[250,250],coordinateSpace:'native'}));
assert.strictEqual(context.reopened, undefined); // panel is restored in-place, without global render()
assert.strictEqual(context.MG1MapFeatureDrawing.isActive(), false);
console.log('PASS v25-feature-drawing.test.js');
