import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';
import { MathScene, mathToThree } from '../../../common/mathlab/scene.js';
import { fmt, setLatex, typeset } from '../../../common/mathlab/latex.js';

const byId = (id) => document.getElementById(id);

const CONE_SLOPE = 0.75;
const CONE_HEIGHT = 7;
const PLANE_SLOPE = 0.3;
const PLANE_OFFSET = 1.5;

const coneHalfAngle = Math.atan(CONE_SLOPE);
const sineHalfAngle = Math.sin(coneHalfAngle);
const normalLength = Math.sqrt(1 + PLANE_SLOPE ** 2);

/*
 * Centros y radios de las dos esferas tangentes al cono y al plano.
 * Los centros están sobre el eje z del cono.
 */
const lowerCenterZ = (
  PLANE_OFFSET / (1 + normalLength * sineHalfAngle)
);
const upperCenterZ = (
  PLANE_OFFSET / (1 - normalLength * sineHalfAngle)
);

const lowerRadius = lowerCenterZ * sineHalfAngle;
const upperRadius = upperCenterZ * sineHalfAngle;

const scene = new MathScene(byId('stage'), {
  camera: [10, 7, 12],
  target: [0, 0, 2.2],
  gridSize: 18,
  axisSize: 7.5
});

const coneGeometry = new ParametricGeometry(
  (u, v, target) => {
    const theta = 2 * Math.PI * u;
    const z = (2 * v - 1) * CONE_HEIGHT;
    const radius = CONE_SLOPE * Math.abs(z);

    const point = mathToThree([
      radius * Math.cos(theta),
      radius * Math.sin(theta),
      z
    ]);

    target.set(point.x, point.y, point.z);
  },
  104,
  64
);

const cone = scene.addMesh(coneGeometry, {
  color: '#bac3ce',
  opacity: 0.38,
  roughness: 0.65
});

const plane = scene.addPlane(
  [0, 0, PLANE_OFFSET],
  [12, 12],
  [0, -PLANE_SLOPE, 1],
  {
    color: '#a9c1ff',
    opacity: 0.42
  },
  scene.helperGroup
);

const lowerSphere = scene.addSphere(
  [0, 0, lowerCenterZ],
  lowerRadius,
  {
    color: '#f6b73c',
    opacity: 0.7
  }
);

const upperSphere = scene.addSphere(
  [0, 0, upperCenterZ],
  upperRadius,
  {
    color: '#f08c3a',
    opacity: 0.62
  }
);

function interpolateZero(a, b, valueA, valueB) {
  return a + (b - a) * (-valueA) / (valueB - valueA);
}

/**
 * Construye la elipse de intersección entre el cono y el plano.
 * Se emplea marching squares sobre la proyección en el plano xy.
 */
function createEllipseIntersection() {
  const range = 5.4;
  const subdivisions = 125;
  const points = [];

  const implicitFunction = (x, y) => (
    x * x
    + y * y
    - CONE_SLOPE * CONE_SLOPE
      * (PLANE_SLOPE * y + PLANE_OFFSET) ** 2
  );

  for (let i = 0; i < subdivisions; i += 1) {
    for (let j = 0; j < subdivisions; j += 1) {
      const x0 = -range + 2 * range * i / subdivisions;
      const x1 = -range + 2 * range * (i + 1) / subdivisions;
      const y0 = -range + 2 * range * j / subdivisions;
      const y1 = -range + 2 * range * (j + 1) / subdivisions;

      const f00 = implicitFunction(x0, y0);
      const f10 = implicitFunction(x1, y0);
      const f11 = implicitFunction(x1, y1);
      const f01 = implicitFunction(x0, y1);

      const edgePoints = [];

      if (f00 * f10 < 0) {
        edgePoints.push([interpolateZero(x0, x1, f00, f10), y0]);
      }

      if (f10 * f11 < 0) {
        edgePoints.push([x1, interpolateZero(y0, y1, f10, f11)]);
      }

      if (f11 * f01 < 0) {
        edgePoints.push([interpolateZero(x1, x0, f11, f01), y1]);
      }

      if (f01 * f00 < 0) {
        edgePoints.push([x0, interpolateZero(y1, y0, f01, f00)]);
      }

      if (edgePoints.length === 2 || edgePoints.length === 4) {
        edgePoints.forEach(([x, y]) => {
          points.push([
            x,
            y,
            PLANE_SLOPE * y + PLANE_OFFSET
          ]);
        });
      }
    }
  }

  return scene.addLine(
    points,
    {
      color: '#0b46cc',
      segments: true
    },
    scene.traceGroup
  );
}

const ellipseCurve = createEllipseIntersection();

/**
 * Punto de tangencia entre una esfera de centro (0,0,z) y el plano.
 * Es la proyección ortogonal del centro de la esfera sobre el plano.
 */
function focusFromSphere(centerZ) {
  const parameter = (
    (centerZ - PLANE_OFFSET) / (1 + PLANE_SLOPE ** 2)
  );

  return [
    0,
    PLANE_SLOPE * parameter,
    centerZ - parameter
  ];
}

const focus1 = focusFromSphere(lowerCenterZ);
const focus2 = focusFromSphere(upperCenterZ);

const focusPoint1 = scene.addPoint(focus1, {
  radius: 0.13,
  color: '#b4232f'
});

const focusPoint2 = scene.addPoint(focus2, {
  radius: 0.13,
  color: '#b4232f'
});

const focusLabel1 = scene.addLabel('F₁', focus1, scene.helperGroup);
const focusLabel2 = scene.addLabel('F₂', focus2, scene.helperGroup);

const generators = [0, Math.PI].map((theta) => (
  scene.addLine(
    [
      [0, 0, 0],
      [
        CONE_SLOPE * CONE_HEIGHT * Math.cos(theta),
        CONE_SLOPE * CONE_HEIGHT * Math.sin(theta),
        CONE_HEIGHT
      ]
    ],
    {
      color: '#5f6f82',
      dashed: true
    },
    scene.helperGroup
  )
));

setLatex(
  byId('equation'),
  String.raw`
    x^2+y^2=${fmt(CONE_SLOPE ** 2, 4)}z^2,
    \qquad
    z=${fmt(PLANE_SLOPE)}y+${fmt(PLANE_OFFSET)}
  `
);

byId('focus-data').innerHTML = String.raw`
  \(
    F_1=(${fmt(focus1[0])},${fmt(focus1[1])},${fmt(focus1[2])})
  \),
  \(
    F_2=(${fmt(focus2[0])},${fmt(focus2[1])},${fmt(focus2[2])})
  \).
`;

typeset([byId('focus-data')]);

function bindVisibilityControl(controlId, objects) {
  byId(controlId).addEventListener('change', () => {
    const isVisible = byId(controlId).checked;

    objects.forEach((object) => {
      object.visible = isVisible;
    });
  });
}

bindVisibilityControl('show-cone', [cone]);
bindVisibilityControl('show-plane', [plane]);
bindVisibilityControl('show-spheres', [lowerSphere, upperSphere]);
bindVisibilityControl('show-curve', [ellipseCurve]);
bindVisibilityControl(
  'show-foci',
  [focusPoint1, focusPoint2, focusLabel1, focusLabel2]
);
bindVisibilityControl('show-generators', generators);

byId('reset-camera').addEventListener('click', () => {
  scene.resetCamera([10, 7, 12], [0, 0, 2.2]);
});

byId('export-png').addEventListener('click', () => {
  scene.exportPNG('esferas-dandelin.png');
});
