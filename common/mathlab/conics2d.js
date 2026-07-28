import {
  formatNumber,
  translatedVariable
} from './latex.js';

function distance(first, second) {
  return Math.hypot(
    first[0] - second[0],
    first[1] - second[1]
  );
}

function rotatePoint(point, center, orientation) {
  if (orientation !== 'vertical') return point;

  return [
    center[0] - (point[1] - center[1]),
    center[1] + (point[0] - center[0])
  ];
}

export function conicModel(config) {
  const type = config.type ?? 'ellipse';
  const h = Number(config.h ?? 0);
  const k = Number(config.k ?? 0);
  const a = Math.max(Number(config.a ?? 4), 0.2);
  const b = Math.max(Number(config.b ?? 2.5), 0.2);
  const p = Number(config.p ?? 1.5);
  const t = Number(config.t ?? 0);
  const branch = Number(config.branch ?? 1) >= 0 ? 1 : -1;
  const orientation = config.orientation ?? 'horizontal';
  const center = [h, k];

  let curve = [];
  let point = center;
  let foci = [];
  let directrix = null;
  let invariant = '';
  let invariantValue = 0;
  let equation = '';
  let viewRange = 8;

  if (type === 'circle') {
    for (let index = 0; index <= 320; index += 1) {
      const angle = (2 * Math.PI * index) / 320;
      curve.push([
        h + a * Math.cos(angle),
        k + a * Math.sin(angle)
      ]);
    }

    point = [
      h + a * Math.cos(t),
      k + a * Math.sin(t)
    ];
    foci = [center];
    invariant = 'd(P,C)';
    invariantValue = distance(point, center);
    equation = `${translatedVariable('x', h)}^2`
      + `+${translatedVariable('y', k)}^2`
      + `=${formatNumber(a * a)}`;
    viewRange = Math.max(
      7,
      Math.abs(h) + a + 2,
      Math.abs(k) + a + 2
    );
  }

  if (type === 'ellipse') {
    const major = Math.max(a, b + 0.1);
    const minor = Math.min(b, major - 0.1);
    const focalDistance = Math.sqrt(major * major - minor * minor);

    for (let index = 0; index <= 360; index += 1) {
      const angle = (2 * Math.PI * index) / 360;
      const basePoint = [
        h + major * Math.cos(angle),
        k + minor * Math.sin(angle)
      ];
      curve.push(rotatePoint(basePoint, center, orientation));
    }

    point = rotatePoint([
      h + major * Math.cos(t),
      k + minor * Math.sin(t)
    ], center, orientation);

    foci = orientation === 'vertical'
      ? [[h, k - focalDistance], [h, k + focalDistance]]
      : [[h - focalDistance, k], [h + focalDistance, k]];

    invariant = 'd(P,F₁)+d(P,F₂)';
    invariantValue = distance(point, foci[0]) + distance(point, foci[1]);

    equation = orientation === 'vertical'
      ? `\\dfrac{${translatedVariable('x', h)}^2}{${formatNumber(minor * minor)}}`
        + `+\\dfrac{${translatedVariable('y', k)}^2}{${formatNumber(major * major)}}=1`
      : `\\dfrac{${translatedVariable('x', h)}^2}{${formatNumber(major * major)}}`
        + `+\\dfrac{${translatedVariable('y', k)}^2}{${formatNumber(minor * minor)}}=1`;

    viewRange = Math.max(
      7,
      Math.abs(h) + major + 2,
      Math.abs(k) + major + 2
    );
  }

  if (type === 'hyperbola') {
    const focalDistance = Math.sqrt(a * a + b * b);
    const maximumParameter = 1.65;

    [-1, 1].forEach(side => {
      const branchPoints = [];

      for (let index = 0; index <= 240; index += 1) {
        const parameter = -maximumParameter
          + (2 * maximumParameter * index) / 240;

        const basePoint = [
          h + side * a * Math.cosh(parameter),
          k + b * Math.sinh(parameter)
        ];

        branchPoints.push(rotatePoint(basePoint, center, orientation));
      }

      curve.push(branchPoints);
    });

    point = rotatePoint([
      h + branch * a * Math.cosh(t),
      k + b * Math.sinh(t)
    ], center, orientation);

    foci = orientation === 'vertical'
      ? [[h, k - focalDistance], [h, k + focalDistance]]
      : [[h - focalDistance, k], [h + focalDistance, k]];

    invariant = '|d(P,F₁)-d(P,F₂)|';
    invariantValue = Math.abs(
      distance(point, foci[0]) - distance(point, foci[1])
    );

    equation = orientation === 'vertical'
      ? `\\dfrac{${translatedVariable('y', k)}^2}{${formatNumber(a * a)}}`
        + `-\\dfrac{${translatedVariable('x', h)}^2}{${formatNumber(b * b)}}=1`
      : `\\dfrac{${translatedVariable('x', h)}^2}{${formatNumber(a * a)}}`
        + `-\\dfrac{${translatedVariable('y', k)}^2}{${formatNumber(b * b)}}=1`;

    viewRange = Math.max(
      8,
      a * Math.cosh(maximumParameter) + Math.abs(h) + 1,
      b * Math.sinh(maximumParameter) + Math.abs(k) + 1
    );
  }

  if (type === 'parabola') {
    const maximumParameter = 3.2;

    for (let index = 0; index <= 320; index += 1) {
      const parameter = -maximumParameter
        + (2 * maximumParameter * index) / 320;

      curve.push(rotatePoint([
        h + p * parameter * parameter,
        k + 2 * p * parameter
      ], center, orientation));
    }

    point = rotatePoint([
      h + p * t * t,
      k + 2 * p * t
    ], center, orientation);

    if (orientation === 'vertical') {
      foci = [[h, k + p]];
      directrix = {
        axis: 'y',
        value: k - p
      };
      equation = `${translatedVariable('x', h)}^2`
        + `=${formatNumber(4 * p)}`
        + `${translatedVariable('y', k)}`;
    } else {
      foci = [[h + p, k]];
      directrix = {
        axis: 'x',
        value: h - p
      };
      equation = `${translatedVariable('y', k)}^2`
        + `=${formatNumber(4 * p)}`
        + `${translatedVariable('x', h)}`;
    }

    const nearestPoint = directrix.axis === 'x'
      ? [directrix.value, point[1]]
      : [point[0], directrix.value];

    invariant = 'd(P,F)-d(P,L)';
    invariantValue = distance(point, foci[0])
      - distance(point, nearestPoint);

    viewRange = Math.max(
      8,
      Math.abs(p) * maximumParameter * maximumParameter + Math.abs(h) + 2,
      Math.abs(p) * 2 * maximumParameter + Math.abs(k) + 2
    );
  }

  return {
    type,
    curve,
    point,
    foci,
    directrix,
    invariant,
    invariantValue,
    equation,
    viewRange: Math.min(viewRange, 22)
  };
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

function pathFromPoints(points) {
  return points
    .map((point, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${command} ${point[0]} ${-point[1]}`;
    })
    .join(' ');
}

export function renderConicSVG(svg, model, options = {}) {
  svg.replaceChildren();
  const range = model.viewRange;
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

  if (model.directrix && options.showHelpers !== false) {
    const line = model.directrix.axis === 'x'
      ? createSVGElement('line', {
          x1: model.directrix.value,
          y1: -range,
          x2: model.directrix.value,
          y2: range,
          class: 'svg-helper'
        })
      : createSVGElement('line', {
          x1: -range,
          y1: -model.directrix.value,
          x2: range,
          y2: -model.directrix.value,
          class: 'svg-helper'
        });

    svg.appendChild(line);
  }

  const curveSets = Array.isArray(model.curve[0]?.[0])
    ? model.curve
    : [model.curve];

  curveSets.forEach(points => {
    svg.appendChild(createSVGElement('path', {
      d: pathFromPoints(points),
      class: 'svg-curve'
    }));
  });

  if (options.showDistances !== false) {
    model.foci.forEach(focus => {
      svg.appendChild(createSVGElement('line', {
        x1: model.point[0],
        y1: -model.point[1],
        x2: focus[0],
        y2: -focus[1],
        class: 'svg-distance'
      }));
    });

    if (model.directrix) {
      const nearestPoint = model.directrix.axis === 'x'
        ? [model.directrix.value, model.point[1]]
        : [model.point[0], model.directrix.value];

      svg.appendChild(createSVGElement('line', {
        x1: model.point[0],
        y1: -model.point[1],
        x2: nearestPoint[0],
        y2: -nearestPoint[1],
        class: 'svg-distance'
      }));
    }
  }

  if (options.showHelpers !== false) {
    model.foci.forEach((focus, index) => {
      svg.appendChild(createSVGElement('circle', {
        cx: focus[0],
        cy: -focus[1],
        r: 0.15,
        class: 'svg-focus'
      }));

      const label = createSVGElement('text', {
        x: focus[0] + 0.2,
        y: -focus[1] - 0.2,
        class: 'svg-label'
      });
      label.textContent = model.foci.length > 1
        ? `F${index + 1}`
        : model.type === 'circle'
          ? 'C'
          : 'F';
      svg.appendChild(label);
    });
  }

  svg.appendChild(createSVGElement('circle', {
    cx: model.point[0],
    cy: -model.point[1],
    r: 0.18,
    class: 'svg-point'
  }));

  const pointLabel = createSVGElement('text', {
    x: model.point[0] + 0.22,
    y: -model.point[1] - 0.2,
    class: 'svg-label'
  });
  pointLabel.textContent = 'P';
  svg.appendChild(pointLabel);
}
