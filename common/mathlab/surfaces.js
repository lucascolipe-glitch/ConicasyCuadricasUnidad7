import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';
import { mathToThree } from './scene.js';
import { formatNumber, translatedVariable } from './latex.js';

function getCenter(config) {
  return [
    Number(config.h ?? 0),
    Number(config.k ?? 0),
    Number(config.l ?? 0)
  ];
}

function getAxisCoordinates(axis, x, y, z, center) {
  const X = x - center[0];
  const Y = y - center[1];
  const Z = z - center[2];

  if (axis === 'x') return { axial: X, p: Y, q: Z };
  if (axis === 'y') return { axial: Y, p: X, q: Z };
  return { axial: Z, p: X, q: Y };
}

function fromAxisCoordinates(axis, axial, p, q, center) {
  const [h, k, l] = center;

  if (axis === 'x') return [h + axial, k + p, l + q];
  if (axis === 'y') return [h + p, k + axial, l + q];
  return [h + p, k + q, l + axial];
}

function createParametricGeometry(callback, segmentsU = 80, segmentsV = 48) {
  return new ParametricGeometry((u, v, target) => {
    const converted = mathToThree(callback(u, v));
    target.set(converted.x, converted.y, converted.z);
  }, segmentsU, segmentsV);
}

export function buildSurface(scene, config) {
  const type = config.type ?? 'ellipsoid';
  const axis = config.axis ?? 'z';
  const center = getCenter(config);
  const a = Math.max(Number(config.a ?? 2.4), 0.1);
  const b = Math.max(Number(config.b ?? 1.8), 0.1);
  const c = Math.max(Number(config.c ?? 1.5), 0.1);
  const domain = Math.max(Number(config.domain ?? 2.2), 0.25);
  const sign = Number(config.sign ?? 1) >= 0 ? 1 : -1;
  const materialOptions = {
    color: '#2563eb',
    opacity: Number(config.opacity ?? 0.72)
  };

  scene.clearSurface();

  if (type === 'sphere' || type === 'ellipsoid') {
    const semiaxisX = a;
    const semiaxisY = type === 'sphere' ? a : b;
    const semiaxisZ = type === 'sphere' ? a : c;

    const geometry = createParametricGeometry((u, v) => {
      const theta = 2 * Math.PI * u;
      const phi = Math.PI * (v - 0.5);

      return [
        center[0] + semiaxisX * Math.cos(phi) * Math.cos(theta),
        center[1] + semiaxisY * Math.cos(phi) * Math.sin(theta),
        center[2] + semiaxisZ * Math.sin(phi)
      ];
    }, 88, 52);

    scene.addMesh(geometry, materialOptions);
    return;
  }

  if (type === 'ellipticParaboloid') {
    const geometry = createParametricGeometry((u, v) => {
      const radius = domain * u;
      const theta = 2 * Math.PI * v;

      return fromAxisCoordinates(
        axis,
        sign * c * radius * radius,
        a * radius * Math.cos(theta),
        b * radius * Math.sin(theta),
        center
      );
    }, 84, 48);

    scene.addMesh(geometry, materialOptions);
    return;
  }

  if (type === 'hyperbolicParaboloid') {
    const geometry = createParametricGeometry((u, v) => {
      const p = (2 * u - 1) * domain;
      const q = (2 * v - 1) * domain;

      return fromAxisCoordinates(
        axis,
        sign * c * (p * p - q * q),
        a * p,
        b * q,
        center
      );
    }, 72, 72);

    scene.addMesh(geometry, materialOptions);
    return;
  }

  if (type === 'oneSheetHyperboloid') {
    const geometry = createParametricGeometry((u, v) => {
      const theta = 2 * Math.PI * u;
      const parameter = (2 * v - 1) * domain;

      return fromAxisCoordinates(
        axis,
        c * Math.sinh(parameter),
        a * Math.cosh(parameter) * Math.cos(theta),
        b * Math.cosh(parameter) * Math.sin(theta),
        center
      );
    }, 88, 52);

    scene.addMesh(geometry, materialOptions);
    return;
  }

  if (type === 'twoSheetHyperboloid') {
    [-1, 1].forEach(side => {
      const geometry = createParametricGeometry((u, v) => {
        const theta = 2 * Math.PI * u;
        const parameter = domain * v;

        return fromAxisCoordinates(
          axis,
          side * c * Math.cosh(parameter),
          a * Math.sinh(parameter) * Math.cos(theta),
          b * Math.sinh(parameter) * Math.sin(theta),
          center
        );
      }, 84, 40);

      scene.addMesh(geometry, materialOptions);
    });
    return;
  }

  if (type === 'ellipticCone') {
    const geometry = createParametricGeometry((u, v) => {
      const theta = 2 * Math.PI * u;
      const parameter = (2 * v - 1) * domain;

      return fromAxisCoordinates(
        axis,
        c * parameter,
        a * parameter * Math.cos(theta),
        b * parameter * Math.sin(theta),
        center
      );
    }, 88, 50);

    scene.addMesh(geometry, materialOptions);
    return;
  }

  if (type === 'ellipticCylinder' || type === 'circularCylinder') {
    const secondSemiaxis = type === 'circularCylinder' ? a : b;

    const geometry = createParametricGeometry((u, v) => {
      const theta = 2 * Math.PI * u;
      const axial = (2 * v - 1) * domain * 2;

      return fromAxisCoordinates(
        axis,
        axial,
        a * Math.cos(theta),
        secondSemiaxis * Math.sin(theta),
        center
      );
    }, 88, 28);

    scene.addMesh(geometry, materialOptions);
    return;
  }

  if (type === 'hyperbolicCylinder') {
    [-1, 1].forEach(side => {
      const geometry = createParametricGeometry((u, v) => {
        const parameter = (2 * u - 1) * domain;
        const axial = (2 * v - 1) * domain * 2;

        return fromAxisCoordinates(
          axis,
          axial,
          side * a * Math.cosh(parameter),
          b * Math.sinh(parameter),
          center
        );
      }, 52, 26);

      scene.addMesh(geometry, materialOptions);
    });
    return;
  }

  if (type === 'parabolicCylinder') {
    const geometry = createParametricGeometry((u, v) => {
      const parameter = (2 * u - 1) * domain;
      const axial = (2 * v - 1) * domain * 2;

      return fromAxisCoordinates(
        axis,
        axial,
        a * parameter,
        sign * b * parameter * parameter,
        center
      );
    }, 64, 28);

    scene.addMesh(geometry, materialOptions);
  }
}

export function implicitValue(config, x, y, z) {
  const type = config.type ?? 'ellipsoid';
  const axis = config.axis ?? 'z';
  const center = getCenter(config);
  const a = Math.max(Number(config.a ?? 2.4), 0.1);
  const b = Math.max(Number(config.b ?? 1.8), 0.1);
  const c = Math.max(Number(config.c ?? 1.5), 0.1);
  const sign = Number(config.sign ?? 1) >= 0 ? 1 : -1;

  const X = x - center[0];
  const Y = y - center[1];
  const Z = z - center[2];
  const coordinates = getAxisCoordinates(axis, x, y, z, center);

  if (type === 'sphere') {
    return (X * X + Y * Y + Z * Z) / (a * a) - 1;
  }

  if (type === 'ellipsoid') {
    return X * X / (a * a)
      + Y * Y / (b * b)
      + Z * Z / (c * c)
      - 1;
  }

  if (type === 'ellipticParaboloid') {
    return coordinates.p * coordinates.p / (a * a)
      + coordinates.q * coordinates.q / (b * b)
      - sign * coordinates.axial / c;
  }

  if (type === 'hyperbolicParaboloid') {
    return coordinates.p * coordinates.p / (a * a)
      - coordinates.q * coordinates.q / (b * b)
      - sign * coordinates.axial / c;
  }

  if (type === 'oneSheetHyperboloid') {
    return coordinates.p * coordinates.p / (a * a)
      + coordinates.q * coordinates.q / (b * b)
      - coordinates.axial * coordinates.axial / (c * c)
      - 1;
  }

  if (type === 'twoSheetHyperboloid') {
    return -coordinates.p * coordinates.p / (a * a)
      - coordinates.q * coordinates.q / (b * b)
      + coordinates.axial * coordinates.axial / (c * c)
      - 1;
  }

  if (type === 'ellipticCone') {
    return coordinates.p * coordinates.p / (a * a)
      + coordinates.q * coordinates.q / (b * b)
      - coordinates.axial * coordinates.axial / (c * c);
  }

  if (type === 'ellipticCylinder') {
    return coordinates.p * coordinates.p / (a * a)
      + coordinates.q * coordinates.q / (b * b)
      - 1;
  }

  if (type === 'circularCylinder') {
    return (coordinates.p * coordinates.p + coordinates.q * coordinates.q)
      / (a * a)
      - 1;
  }

  if (type === 'hyperbolicCylinder') {
    return coordinates.p * coordinates.p / (a * a)
      - coordinates.q * coordinates.q / (b * b)
      - 1;
  }

  if (type === 'parabolicCylinder') {
    return coordinates.q
      - sign * b * (coordinates.p / a) ** 2;
  }

  return Number.NaN;
}

function getAxisVariables(axis, center) {
  if (axis === 'x') {
    return {
      axial: translatedVariable('x', center[0]),
      p: translatedVariable('y', center[1]),
      q: translatedVariable('z', center[2])
    };
  }

  if (axis === 'y') {
    return {
      axial: translatedVariable('y', center[1]),
      p: translatedVariable('x', center[0]),
      q: translatedVariable('z', center[2])
    };
  }

  return {
    axial: translatedVariable('z', center[2]),
    p: translatedVariable('x', center[0]),
    q: translatedVariable('y', center[1])
  };
}

export function surfaceEquationLatex(config) {
  const type = config.type ?? 'ellipsoid';
  const axis = config.axis ?? 'z';
  const center = getCenter(config);
  const a = Number(config.a ?? 2.4);
  const b = Number(config.b ?? 1.8);
  const c = Number(config.c ?? 1.5);
  const a2 = formatNumber(a * a);
  const b2 = formatNumber(b * b);
  const c2 = formatNumber(c * c);
  const sign = Number(config.sign ?? 1) >= 0 ? 1 : -1;

  const X = translatedVariable('x', center[0]);
  const Y = translatedVariable('y', center[1]);
  const Z = translatedVariable('z', center[2]);
  const variables = getAxisVariables(axis, center);

  if (type === 'sphere') {
    return `${X}^2+${Y}^2+${Z}^2=${a2}`;
  }

  if (type === 'ellipsoid') {
    return `\\dfrac{${X}^2}{${a2}}`
      + `+\\dfrac{${Y}^2}{${b2}}`
      + `+\\dfrac{${Z}^2}{${c2}}=1`;
  }

  if (type === 'ellipticParaboloid') {
    return `\\dfrac{${variables.p}^2}{${a2}}`
      + `+\\dfrac{${variables.q}^2}{${b2}}`
      + `=\\dfrac{${sign > 0 ? '' : '-'}${variables.axial}}{${formatNumber(c)}}`;
  }

  if (type === 'hyperbolicParaboloid') {
    return `\\dfrac{${variables.p}^2}{${a2}}`
      + `-\\dfrac{${variables.q}^2}{${b2}}`
      + `=\\dfrac{${sign > 0 ? '' : '-'}${variables.axial}}{${formatNumber(c)}}`;
  }

  if (type === 'oneSheetHyperboloid') {
    return `\\dfrac{${variables.p}^2}{${a2}}`
      + `+\\dfrac{${variables.q}^2}{${b2}}`
      + `-\\dfrac{${variables.axial}^2}{${c2}}=1`;
  }

  if (type === 'twoSheetHyperboloid') {
    return `-\\dfrac{${variables.p}^2}{${a2}}`
      + `-\\dfrac{${variables.q}^2}{${b2}}`
      + `+\\dfrac{${variables.axial}^2}{${c2}}=1`;
  }

  if (type === 'ellipticCone') {
    return `\\dfrac{${variables.p}^2}{${a2}}`
      + `+\\dfrac{${variables.q}^2}{${b2}}`
      + `-\\dfrac{${variables.axial}^2}{${c2}}=0`;
  }

  if (type === 'ellipticCylinder') {
    return `\\dfrac{${variables.p}^2}{${a2}}`
      + `+\\dfrac{${variables.q}^2}{${b2}}=1`;
  }

  if (type === 'circularCylinder') {
    return `\\dfrac{${variables.p}^2}{${a2}}`
      + `+\\dfrac{${variables.q}^2}{${a2}}=1`;
  }

  if (type === 'hyperbolicCylinder') {
    return `\\dfrac{${variables.p}^2}{${a2}}`
      + `-\\dfrac{${variables.q}^2}{${b2}}=1`;
  }

  return `${variables.q}`
    + `=${sign > 0 ? '' : '-'}`
    + `${formatNumber(b)}`
    + `\\left(\\dfrac{${variables.p}}{${formatNumber(a)}}\\right)^2`;
}

export function surfaceName(type) {
  const names = {
    sphere: 'Esfera',
    ellipsoid: 'Elipsoide',
    ellipticParaboloid: 'Paraboloide elíptico',
    hyperbolicParaboloid: 'Paraboloide hiperbólico',
    oneSheetHyperboloid: 'Hiperboloide de una hoja',
    twoSheetHyperboloid: 'Hiperboloide de dos hojas',
    ellipticCone: 'Cono elíptico',
    circularCylinder: 'Cilindro circular',
    ellipticCylinder: 'Cilindro elíptico',
    hyperbolicCylinder: 'Cilindro hiperbólico',
    parabolicCylinder: 'Cilindro parabólico'
  };

  return names[type] ?? 'Superficie cuádrica';
}
