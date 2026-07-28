import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';
import { MathScene, mathToThree } from '../../../common/mathlab/scene.js';
import { AnimationController } from '../../../common/mathlab/animations.js';
import { fmt, setLatex } from '../../../common/mathlab/latex.js';

const byId = (id) => document.getElementById(id);

const CONE_SLOPE = 0.75;
const CONE_HEIGHT = 5.6;
const CRITICAL_ANGLE = Math.atan(1 / CONE_SLOPE) * 180 / Math.PI;

const scene = new MathScene(byId('stage'), {
  camera: [9, 7, 11],
  target: [0, 0, 0.7],
  gridSize: 16,
  axisSize: 6.5
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
  96,
  58
);

const cone = scene.addMesh(coneGeometry, {
  color: '#b7c0cc',
  opacity: 0.46,
  roughness: 0.62
});

let cuttingPlane;
let intersectionCurve;

function interpolateZero(a, b, valueA, valueB) {
  return a + (b - a) * (-valueA) / (valueB - valueA);
}

/**
 * Aproxima la intersección entre el cono y el plano z = m y + d.
 * La curva se obtiene con una versión sencilla de marching squares.
 */
function calculateIntersection(slope, offset) {
  const range = 5.4;
  const subdivisions = 112;
  const points = [];

  const implicitFunction = (x, y) => (
    x * x
    + y * y
    - CONE_SLOPE * CONE_SLOPE * (slope * y + offset) ** 2
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
          points.push([x, y, slope * y + offset]);
        });
      }
    }
  }

  return points;
}

const SECTION_NAMES = {
  circle: 'Circunferencia',
  ellipse: 'Elipse',
  parabola: 'Parábola',
  hyperbola: 'Hipérbola',
  degenerate: 'Sección degenerada'
};

const SECTION_DESCRIPTIONS = {
  circle: 'El plano es perpendicular al eje y corta una sola hoja.',
  ellipse: 'El plano es oblicuo y corta una sola hoja.',
  parabola: 'El plano es paralelo a una generatriz.',
  hyperbola: 'El plano corta las dos hojas.',
  degenerate: 'El plano pasa por el vértice.'
};

function classifySection(angle, offset) {
  if (Math.abs(offset) < 0.05) {
    return 'degenerate';
  }

  if (angle < 1.5) {
    return 'circle';
  }

  if (angle < CRITICAL_ANGLE - 0.7) {
    return 'ellipse';
  }

  if (Math.abs(angle - CRITICAL_ANGLE) <= 0.7) {
    return 'parabola';
  }

  return 'hyperbola';
}

function disposeObject(parentGroup, object) {
  if (!object) {
    return;
  }

  parentGroup.remove(object);
  object.geometry?.dispose();
  object.material?.dispose();
}

function renderSection() {
  const angle = Number(byId('angle').value);
  const offset = Number(byId('offset').value);
  const slope = Math.tan(angle * Math.PI / 180);

  byId('angle-output').textContent = `${fmt(angle, 1)}°`;
  byId('offset-output').textContent = fmt(offset, 1);

  disposeObject(scene.helperGroup, cuttingPlane);
  disposeObject(scene.traceGroup, intersectionCurve);

  cuttingPlane = scene.addPlane(
    [0, 0, offset],
    [11, 11],
    [0, -slope, 1],
    {
      color: '#9bb7ff',
      opacity: 0.42
    },
    scene.helperGroup
  );

  intersectionCurve = scene.addLine(
    calculateIntersection(slope, offset),
    {
      color: '#0b46cc',
      segments: true
    },
    scene.traceGroup
  );

  const sectionType = classifySection(angle, offset);

  byId('classification').textContent = SECTION_NAMES[sectionType];
  byId('description').textContent = SECTION_DESCRIPTIONS[sectionType];
  byId('critical-angle').textContent = (
    `Ángulo crítico: ${fmt(CRITICAL_ANGLE, 2)}°.`
  );

  setLatex(
    byId('equation'),
    String.raw`
      x^2+y^2=${fmt(CONE_SLOPE ** 2, 4)}z^2,
      \qquad
      z=${fmt(slope, 3)}y+${fmt(offset, 2)}
    `
  );
}

const animation = new AnimationController((deltaTime) => {
  let nextAngle = Number(byId('angle').value) + 13 * deltaTime;

  if (nextAngle > 72) {
    nextAngle = 0;
  }

  byId('angle').value = nextAngle;
  renderSection();
});

byId('play').addEventListener('click', () => {
  byId('play').textContent = animation.toggle() ? 'Pausar' : 'Animar';
});

byId('angle').addEventListener('input', renderSection);
byId('offset').addEventListener('input', renderSection);

document.querySelectorAll('[data-preset]').forEach((button) => {
  button.addEventListener('click', () => {
    const presetAngles = {
      circle: 0,
      ellipse: 30,
      parabola: CRITICAL_ANGLE,
      hyperbola: 68
    };

    byId('angle').value = presetAngles[button.dataset.preset];
    byId('offset').value = 1.8;

    animation.pause();
    byId('play').textContent = 'Animar';

    renderSection();
  });
});

byId('reset-camera').addEventListener('click', () => {
  scene.resetCamera([9, 7, 11], [0, 0, 0.7]);
});

byId('toggle-cone').addEventListener('click', () => {
  cone.visible = !cone.visible;
});

byId('toggle-plane').addEventListener('click', () => {
  if (cuttingPlane) {
    cuttingPlane.visible = !cuttingPlane.visible;
  }
});

byId('export-png').addEventListener('click', () => {
  scene.exportPNG('secciones-conicas.png');
});

renderSection();
