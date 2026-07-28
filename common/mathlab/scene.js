import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  CSS2DObject,
  CSS2DRenderer
} from 'three/addons/renderers/CSS2DRenderer.js';

export function mathToThree(point) {
  const [x, y, z] = point;
  return new THREE.Vector3(y, z, x);
}

export class MathScene {
  constructor(stage, options = {}) {
    if (!stage) {
      throw new Error('Se necesita un contenedor para crear la escena 3D.');
    }

    this.stage = stage;
    this.options = options;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    stage.appendChild(this.renderer.domElement);

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.inset = '0';
    this.labelRenderer.domElement.style.pointerEvents = 'none';
    stage.appendChild(this.labelRenderer.domElement);

    this.perspective = new THREE.PerspectiveCamera(42, 1, 0.05, 800);
    this.orthographic = new THREE.OrthographicCamera(-7, 7, 7, -7, 0.05, 800);
    this.camera = this.perspective;

    this.defaultPosition = options.camera ?? [10, 8, 11];
    this.defaultTarget = options.target ?? [0, 0, 0];
    this.perspective.position.set(...this.defaultPosition);
    this.orthographic.position.set(...this.defaultPosition);
    this.controls = this.createControls(this.camera);

    this.surfaceGroup = new THREE.Group();
    this.traceGroup = new THREE.Group();
    this.helperGroup = new THREE.Group();
    this.axisGroup = new THREE.Group();
    this.scene.add(
      this.surfaceGroup,
      this.traceGroup,
      this.helperGroup,
      this.axisGroup
    );

    this.materials = new Set();
    this.grid = new THREE.GridHelper(
      options.gridSize ?? 18,
      options.gridDivisions ?? 18,
      0x8f9bab,
      0xe2e7ef
    );
    this.grid.material.transparent = true;
    this.grid.material.opacity = 0.55;
    this.scene.add(this.grid);

    this.addLights();
    this.buildAxes(options.axisSize ?? 7);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(stage);
    this.resize();

    this.running = true;
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    window.addEventListener('message', event => {
      if (event.data?.type === 'pause-animation') {
        this.running = false;
      }

      if (event.data?.type === 'resume-animation' && !this.running) {
        this.running = true;
        requestAnimationFrame(this.animate);
      }
    });
  }

  createControls(camera) {
    const controls = new OrbitControls(camera, this.renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.screenSpacePanning = true;
    controls.target.copy(mathToThree(this.defaultTarget));
    controls.update();
    return controls;
  }

  addLights() {
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xd8e0ef, 2.1));

    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(7, 11, 8);
    key.castShadow = true;
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0xffffff, 1.1);
    fill.position.set(-8, 5, -6);
    this.scene.add(fill);
  }

  createMaterial(options = {}) {
    const material = new THREE.MeshStandardMaterial({
      color: options.color ?? '#2563eb',
      side: THREE.DoubleSide,
      transparent: (options.opacity ?? 0.72) < 1,
      opacity: options.opacity ?? 0.72,
      roughness: options.roughness ?? 0.45,
      metalness: 0.03,
      wireframe: Boolean(options.wireframe)
    });

    this.materials.add(material);
    return material;
  }

  addMesh(geometry, options = {}, group = this.surfaceGroup) {
    const mesh = new THREE.Mesh(geometry, this.createMaterial(options));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  addLine(points, options = {}, group = this.helperGroup) {
    const geometry = new THREE.BufferGeometry().setFromPoints(
      points.map(mathToThree)
    );

    const material = options.dashed
      ? new THREE.LineDashedMaterial({
          color: options.color ?? '#174ea6',
          dashSize: 0.18,
          gapSize: 0.1
        })
      : new THREE.LineBasicMaterial({
          color: options.color ?? '#174ea6'
        });

    const line = options.segments
      ? new THREE.LineSegments(geometry, material)
      : new THREE.Line(geometry, material);

    if (options.dashed) line.computeLineDistances();
    group.add(line);
    return line;
  }

  addPlane(center, size, normal, options = {}, group = this.helperGroup) {
    const geometry = new THREE.PlaneGeometry(size[0], size[1]);
    const mesh = new THREE.Mesh(
      geometry,
      this.createMaterial({
        color: options.color ?? '#f59e0b',
        opacity: options.opacity ?? 0.18,
        roughness: 0.8
      })
    );

    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      mathToThree(normal).normalize()
    );
    mesh.position.copy(mathToThree(center));
    group.add(mesh);
    return mesh;
  }

  addSphere(center, radius, options = {}, group = this.helperGroup) {
    const mesh = this.addMesh(
      new THREE.SphereGeometry(radius, 48, 30),
      {
        color: options.color ?? '#f6b73c',
        opacity: options.opacity ?? 0.68
      },
      group
    );

    mesh.position.copy(mathToThree(center));
    return mesh;
  }

  addPoint(point, options = {}, group = this.helperGroup) {
    return this.addSphere(
      point,
      options.radius ?? 0.11,
      {
        color: options.color ?? '#b4232f',
        opacity: 1
      },
      group
    );
  }

  addLabel(text, point, group = this.axisGroup) {
    const element = document.createElement('div');
    element.className = 'label3d';
    element.textContent = text;

    const object = new CSS2DObject(element);
    object.position.copy(mathToThree(point));
    group.add(object);
    return object;
  }

  buildAxes(size) {
    this.axisGroup.clear();

    const axes = [
      [[-size, 0, 0], [size, 0, 0], 'x'],
      [[0, -size, 0], [0, size, 0], 'y'],
      [[0, 0, -size], [0, 0, size], 'z']
    ];

    axes.forEach(([from, to, name]) => {
      const start = mathToThree(from);
      const end = mathToThree(to);
      const direction = end.clone().sub(start);

      const arrow = new THREE.ArrowHelper(
        direction.clone().normalize(),
        start,
        direction.length(),
        0x111827,
        0.22,
        0.1
      );

      this.axisGroup.add(arrow);
      this.addLabel(name, to);
    });
  }

  clearGroup(group) {
    group.traverse(object => {
      object.geometry?.dispose();

      const materials = object.material
        ? (Array.isArray(object.material) ? object.material : [object.material])
        : [];

      materials.forEach(material => {
        this.materials.delete(material);
        material.dispose();
      });
    });

    group.clear();
  }

  clearSurface() {
    this.clearGroup(this.surfaceGroup);
  }

  clearTrace() {
    this.clearGroup(this.traceGroup);
  }

  clearHelpers() {
    this.clearGroup(this.helperGroup);
  }

  setOpacity(value) {
    const opacity = Number(value);

    this.materials.forEach(material => {
      material.opacity = opacity;
      material.transparent = opacity < 1;
      material.needsUpdate = true;
    });
  }

  setProjection(mode) {
    const nextCamera = mode === 'ortho'
      ? this.orthographic
      : this.perspective;

    if (nextCamera === this.camera) return;

    nextCamera.position.copy(this.camera.position);
    nextCamera.quaternion.copy(this.camera.quaternion);
    this.camera = nextCamera;

    this.controls.dispose();
    this.controls = this.createControls(nextCamera);
    this.resize();
  }

  resetCamera(position = this.defaultPosition, target = this.defaultTarget) {
    this.camera.position.set(...position);
    this.controls.target.copy(mathToThree(target));
    this.controls.update();
  }

  resize() {
    const width = Math.max(this.stage.clientWidth, 1);
    const height = Math.max(this.stage.clientHeight, 1);

    this.renderer.setSize(width, height, false);
    this.labelRenderer.setSize(width, height);

    this.perspective.aspect = width / height;
    this.perspective.updateProjectionMatrix();

    const span = this.options.orthoSpan ?? 7;
    const aspect = width / height;
    this.orthographic.left = -span * aspect;
    this.orthographic.right = span * aspect;
    this.orthographic.top = span;
    this.orthographic.bottom = -span;
    this.orthographic.updateProjectionMatrix();
  }

  exportPNG(filename = 'grafico.png') {
    this.renderer.render(this.scene, this.camera);

    const link = document.createElement('a');
    link.download = filename;
    link.href = this.renderer.domElement.toDataURL('image/png');
    link.click();
  }

  animate() {
    if (!this.running) return;

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);
  }
}

export { THREE };
