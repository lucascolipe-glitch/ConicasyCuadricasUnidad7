import { MathScene } from '../../../common/mathlab/scene.js';
import {
  buildSurface,
  surfaceEquationLatex,
  surfaceName
} from '../../../common/mathlab/surfaces.js';
import {
  marchingSquaresTrace,
  renderTrace3D,
  renderTraceSVG,
  traceDescription,
  traceEquationLatex
} from '../../../common/mathlab/traces.js';
import {
  formatNumber,
  setLatex,
  typesetMath
} from '../../../common/mathlab/latex.js';

const inputIds = [
  'type',
  'axis',
  'sign',
  'a',
  'b',
  'c',
  'domain',
  'h',
  'k',
  'l',
  'trace-axis',
  'trace-value',
  'trace-range',
  'opacity',
  'projection'
];

const elements = Object.fromEntries(
  inputIds.map(id => [id, document.getElementById(id)])
);

const scene = new MathScene(document.getElementById('stage'), {
  camera: [11, 8, 12],
  target: [0, 0, 0],
  gridSize: 20,
  axisSize: 8,
  orthoSpan: 8
});

function applyQueryParameters() {
  const parameters = new URLSearchParams(location.search);
  const map = {
    type: 'type',
    axis: 'axis',
    sign: 'sign',
    a: 'a',
    b: 'b',
    c: 'c',
    domain: 'domain',
    h: 'h',
    k: 'k',
    l: 'l',
    traceAxis: 'trace-axis',
    traceValue: 'trace-value',
    traceRange: 'trace-range'
  };

  Object.entries(map).forEach(([queryKey, elementId]) => {
    if (parameters.has(queryKey)) {
      elements[elementId].value = parameters.get(queryKey);
    }
  });
}

function numericValue(id) {
  return Number(elements[id].value);
}

function currentConfig() {
  return {
    type: elements.type.value,
    axis: elements.axis.value,
    sign: numericValue('sign'),
    a: numericValue('a'),
    b: numericValue('b'),
    c: numericValue('c'),
    domain: numericValue('domain'),
    h: numericValue('h'),
    k: numericValue('k'),
    l: numericValue('l'),
    opacity: numericValue('opacity')
  };
}

function currentTrace() {
  return {
    axis: elements['trace-axis'].value,
    value: numericValue('trace-value'),
    range: numericValue('trace-range'),
    resolution: 96
  };
}

function updateControlVisibility(config) {
  document.getElementById('axis-row').hidden = [
    'sphere',
    'ellipsoid'
  ].includes(config.type);

  document.getElementById('sign-row').hidden = ![
    'ellipticParaboloid',
    'hyperbolicParaboloid',
    'parabolicCylinder'
  ].includes(config.type);

  document.getElementById('b-row').hidden = [
    'sphere',
    'circularCylinder'
  ].includes(config.type);

  document.getElementById('c-row').hidden = [
    'circularCylinder',
    'ellipticCylinder',
    'hyperbolicCylinder',
    'parabolicCylinder'
  ].includes(config.type);
}

function updateOutputs() {
  const ids = [
    'a',
    'b',
    'c',
    'domain',
    'h',
    'k',
    'l',
    'trace-value',
    'trace-range',
    'opacity'
  ];

  ids.forEach(id => {
    document.getElementById(`${id}-output`).textContent = formatNumber(
      elements[id].value
    );
  });
}

function render() {
  const config = currentConfig();
  const trace = currentTrace();

  updateControlVisibility(config);
  updateOutputs();
  buildSurface(scene, config);

  const traceData = marchingSquaresTrace(config, trace);
  renderTrace3D(scene, traceData);
  renderTraceSVG(document.getElementById('trace-svg'), traceData);

  document.getElementById('surface-title').textContent =
    `Explorador: ${surfaceName(config.type)}`;

  setLatex(
    document.getElementById('surface-equation'),
    surfaceEquationLatex(config)
  );

  setLatex(
    document.getElementById('trace-equation'),
    traceEquationLatex(config, traceData),
    false
  );

  document.getElementById('trace-description').textContent =
    traceDescription(traceData);

  const planeLabel = document.getElementById('trace-plane-label');
  planeLabel.textContent =
    `\\(${traceData.axis}=${formatNumber(traceData.value)}\\)`;
  typesetMath([planeLabel]);
}

let renderScheduled = false;

function scheduleRender() {
  if (renderScheduled) return;
  renderScheduled = true;

  requestAnimationFrame(() => {
    renderScheduled = false;
    render();
  });
}

Object.values(elements).forEach(element => {
  element.addEventListener('input', scheduleRender);
  element.addEventListener('change', scheduleRender);
});

elements.projection.addEventListener('change', event => {
  scene.setProjection(event.target.value);
});

elements.opacity.addEventListener('input', event => {
  scene.setOpacity(event.target.value);
});

document.getElementById('reset-camera').addEventListener('click', () => {
  const config = currentConfig();
  scene.resetCamera([11, 8, 12], [config.h, config.k, config.l]);
});

document.getElementById('toggle-grid').addEventListener('click', () => {
  scene.grid.visible = !scene.grid.visible;
});

document.getElementById('toggle-axes').addEventListener('click', () => {
  scene.axisGroup.visible = !scene.axisGroup.visible;
});

document.getElementById('export-png').addEventListener('click', () => {
  scene.exportPNG(`explorador-${elements.type.value}.png`);
});

applyQueryParameters();
render();
