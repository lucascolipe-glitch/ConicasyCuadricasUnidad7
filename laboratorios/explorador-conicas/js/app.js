import {
  conicModel,
  renderConicSVG
} from '../../../common/mathlab/conics2d.js';
import { AnimationController } from '../../../common/mathlab/animations.js';
import {
  formatNumber,
  setLatex,
  typesetMath
} from '../../../common/mathlab/latex.js';

const elements = {
  type: document.getElementById('type'),
  orientation: document.getElementById('orientation'),
  a: document.getElementById('a'),
  b: document.getElementById('b'),
  p: document.getElementById('p'),
  h: document.getElementById('h'),
  k: document.getElementById('k'),
  t: document.getElementById('t'),
  branch: document.getElementById('branch'),
  showHelpers: document.getElementById('show-helpers'),
  showDistances: document.getElementById('show-distances'),
  svg: document.getElementById('conic-svg'),
  equation: document.getElementById('equation'),
  invariantName: document.getElementById('invariant-name'),
  invariantValue: document.getElementById('invariant-value'),
  invariantComment: document.getElementById('invariant-comment'),
  play: document.getElementById('play')
};

const defaults = {
  type: 'ellipse',
  orientation: 'horizontal',
  a: 4,
  b: 2.5,
  p: 1.5,
  h: 0,
  k: 0,
  t: 0,
  branch: 1
};

function applyQueryParameters() {
  const parameters = new URLSearchParams(location.search);

  Object.keys(defaults).forEach(key => {
    if (parameters.has(key) && elements[key]) {
      elements[key].value = parameters.get(key);
    }
  });
}

function currentConfig() {
  let a = Number(elements.a.value);
  let b = Number(elements.b.value);
  let p = Number(elements.p.value);

  if (elements.type.value === 'ellipse' && b >= a) {
    b = Math.max(0.4, a - 0.1);
    elements.b.value = b;
  }

  if (elements.type.value === 'parabola' && Math.abs(p) < 0.15) {
    p = p < 0 ? -0.15 : 0.15;
    elements.p.value = p;
  }

  return {
    type: elements.type.value,
    orientation: elements.orientation.value,
    a,
    b,
    p,
    h: Number(elements.h.value),
    k: Number(elements.k.value),
    t: Number(elements.t.value),
    branch: Number(elements.branch.value)
  };
}

function updateVisibility(type) {
  document.querySelector('[data-parameter="a"]').hidden = type === 'parabola';
  document.querySelector('[data-parameter="b"]').hidden = type === 'circle'
    || type === 'parabola';
  document.querySelector('[data-parameter="p"]').hidden = type !== 'parabola';
  document.getElementById('branch-row').hidden = type !== 'hyperbola';
  document.getElementById('orientation-row').hidden = type === 'circle';
  document.getElementById('a-label').textContent = type === 'circle'
    ? 'Radio \\(r\\)'
    : 'Semieje \\(a\\)';

  if (type === 'circle' || type === 'ellipse') {
    elements.t.min = 0;
    elements.t.max = 2 * Math.PI;
  } else if (type === 'hyperbola') {
    elements.t.min = -1.65;
    elements.t.max = 1.65;
  } else {
    elements.t.min = -3.2;
    elements.t.max = 3.2;
  }
}

function updateOutputs() {
  ['a', 'b', 'p', 'h', 'k', 't'].forEach(key => {
    document.getElementById(`${key}-output`).textContent = formatNumber(
      elements[key].value
    );
  });
}

function render() {
  const config = currentConfig();
  updateVisibility(config.type);
  updateOutputs();

  const model = conicModel(config);
  renderConicSVG(elements.svg, model, {
    showHelpers: elements.showHelpers.checked,
    showDistances: elements.showDistances.checked
  });

  setLatex(elements.equation, model.equation);
  elements.invariantName.textContent = model.invariant;
  elements.invariantValue.textContent = formatNumber(model.invariantValue, 4);

  if (model.type === 'parabola') {
    elements.invariantComment.textContent = 'La diferencia debe ser cero.';
  } else if (model.type === 'circle') {
    elements.invariantComment.textContent = 'El valor coincide con el radio.';
  } else {
    elements.invariantComment.textContent = 'El valor coincide con \\(2a\\).';
  }

  typesetMath([elements.invariantComment]);
}

const animation = new AnimationController(delta => {
  const speed = elements.type.value === 'circle'
    || elements.type.value === 'ellipse'
    ? 1.15
    : 0.7;

  let nextValue = Number(elements.t.value) + delta * speed;

  if (nextValue > Number(elements.t.max)) {
    nextValue = Number(elements.t.min);
  }

  elements.t.value = nextValue;
  render();
});

elements.play.addEventListener('click', () => {
  const running = animation.toggle();
  elements.play.textContent = running ? 'Pausar' : 'Animar';
});

document.getElementById('reset').addEventListener('click', () => {
  animation.pause();
  elements.play.textContent = 'Animar';

  Object.entries(defaults).forEach(([key, value]) => {
    elements[key].value = value;
  });

  render();
});

Object.values(elements).forEach(element => {
  if (!(element instanceof HTMLInputElement)
      && !(element instanceof HTMLSelectElement)) {
    return;
  }

  element.addEventListener('input', render);
  element.addEventListener('change', render);
});

applyQueryParameters();
render();
