import {
  implicitValue,
  surfaceEquationLatex
} from './surfaces.js';
import { formatNumber } from './latex.js';

function pointOnPlane(axis, value, u, v) {
  if (axis === 'x') return [value, u, v];
  if (axis === 'y') return [u, value, v];
  return [u, v, value];
}

function planeNormal(axis) {
  if (axis === 'x') return [1, 0, 0];
  if (axis === 'y') return [0, 1, 0];
  return [0, 0, 1];
}

function planeCenter(axis, value) {
  if (axis === 'x') return [value, 0, 0];
  if (axis === 'y') return [0, value, 0];
  return [0, 0, value];
}

function interpolate(a, b, fa, fb) {
  const denominator = fb - fa;
  if (Math.abs(denominator) < 1e-12) return (a + b) / 2;
  return a + (b - a) * (-fa) / denominator;
}

export function marchingSquaresTrace(config, trace = {}) {
  const axis = trace.axis ?? 'z';
  const value = Number(trace.value ?? 0);
  const range = Number(trace.range ?? 7);
  const resolution = Math.max(Number(trace.resolution ?? 92), 24);
  const segments2d = [];
  const segments3d = [];

  const evaluate = (u, v) => {
    const point = pointOnPlane(axis, value, u, v);
    return implicitValue(config, ...point);
  };

  for (let i = 0; i < resolution; i += 1) {
    for (let j = 0; j < resolution; j += 1) {
      const u0 = -range + (2 * range * i) / resolution;
      const u1 = -range + (2 * range * (i + 1)) / resolution;
      const v0 = -range + (2 * range * j) / resolution;
      const v1 = -range + (2 * range * (j + 1)) / resolution;

      const f00 = evaluate(u0, v0);
      const f10 = evaluate(u1, v0);
      const f11 = evaluate(u1, v1);
      const f01 = evaluate(u0, v1);
      const crossings = [];

      if (![f00, f10, f11, f01].every(Number.isFinite)) continue;

      if (f00 * f10 < 0) {
        crossings.push([interpolate(u0, u1, f00, f10), v0]);
      }
      if (f10 * f11 < 0) {
        crossings.push([u1, interpolate(v0, v1, f10, f11)]);
      }
      if (f11 * f01 < 0) {
        crossings.push([interpolate(u1, u0, f11, f01), v1]);
      }
      if (f01 * f00 < 0) {
        crossings.push([u0, interpolate(v1, v0, f01, f00)]);
      }

      if (crossings.length === 2) {
        segments2d.push([crossings[0], crossings[1]]);
      } else if (crossings.length === 4) {
        segments2d.push(
          [crossings[0], crossings[1]],
          [crossings[2], crossings[3]]
        );
      }
    }
  }

  segments2d.forEach(([first, second]) => {
    segments3d.push([
      pointOnPlane(axis, value, ...first),
      pointOnPlane(axis, value, ...second)
    ]);
  });

  return {
    axis,
    value,
    range,
    segments2d,
    segments3d,
    labels: axis === 'x'
      ? ['y', 'z']
      : axis === 'y'
        ? ['x', 'z']
        : ['x', 'y']
  };
}

export function renderTrace3D(scene, traceData) {
  scene.clearTrace();

  scene.addPlane(
    planeCenter(traceData.axis, traceData.value),
    [2 * traceData.range, 2 * traceData.range],
    planeNormal(traceData.axis),
    {
      color: '#f59e0b',
      opacity: 0.13
    },
    scene.traceGroup
  );

  const points = [];
  traceData.segments3d.forEach(segment => points.push(...segment));

  if (points.length) {
    scene.addLine(
      points,
      {
        color: '#d85a12',
        segments: true
      },
      scene.traceGroup
    );
  }
}

function createSVGElement(name, attributes = {}) {
  const element = document.createElementNS(
    'http://www.w3.org/2000/svg',
    name
  );

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, String(value));
  });

  return element;
}

export function renderTraceSVG(svg, traceData) {
  svg.replaceChildren();
  const range = traceData.range;
  svg.setAttribute('viewBox', `${-range} ${-range} ${2 * range} ${2 * range}`);

  for (let value = Math.ceil(-range); value <= Math.floor(range); value += 1) {
    svg.append(
      createSVGElement('line', {
        x1: value,
        y1: -range,
        x2: value,
        y2: range,
        class: 'svg-grid-line'
      }),
      createSVGElement('line', {
        x1: -range,
        y1: -value,
        x2: range,
        y2: -value,
        class: 'svg-grid-line'
      })
    );
  }

  svg.append(
    createSVGElement('line', {
      x1: -range,
      y1: 0,
      x2: range,
      y2: 0,
      class: 'svg-axis-line'
    }),
    createSVGElement('line', {
      x1: 0,
      y1: -range,
      x2: 0,
      y2: range,
      class: 'svg-axis-line'
    })
  );

  traceData.segments2d.forEach(([first, second]) => {
    svg.appendChild(createSVGElement('line', {
      x1: first[0],
      y1: -first[1],
      x2: second[0],
      y2: -second[1],
      class: 'svg-trace'
    }));
  });

  const labels = [
    [traceData.labels[0], range - 0.55, -0.25],
    [traceData.labels[1], 0.18, -range + 0.5]
  ];

  labels.forEach(([text, x, y]) => {
    const label = createSVGElement('text', {
      x,
      y,
      class: 'svg-label'
    });
    label.textContent = text;
    svg.appendChild(label);
  });
}

export function traceEquationLatex(config, traceData) {
  return `\\left.${surfaceEquationLatex(config)}`
    + `\\right|_{${traceData.axis}=${formatNumber(traceData.value)}}`;
}

export function traceDescription(traceData) {
  if (traceData.segments2d.length === 0) {
    return 'En esta posición no aparece una curva real visible.';
  }

  if (traceData.segments2d.length < 5) {
    return 'La intersección está cerca de una situación degenerada.';
  }

  return `Intersección con el plano `
    + `${traceData.axis}=${formatNumber(traceData.value)}.`;
}
