# Cónicas y superficies cuádricas — unidad web interactiva

Proyecto web elaborado a partir del apunte teórico y del Trabajo Práctico N.º 7 de Álgebra y Geometría I.

## Cambios de esta versión

- Todos los archivos HTML fueron ordenados y tabulados para facilitar su edición.
- Las ecuaciones visibles se escribieron con LaTeX y se renderizan mediante MathJax.
- Las secciones de la página principal incorporan ventanas con los gráficos 3D relacionados.
- Las variantes según los ejes principales se organizan en tres columnas en pantallas grandes.
- Se conservan los 50 gráficos reconstruidos desde Asymptote y se agregan dos variantes didácticas:
  - paraboloide hiperbólico con eje principal `x`;
  - cono con eje principal `x`.
- Los iframes se cargan únicamente al abrir su sección para evitar una carga inicial excesiva.
- Los videos se pausan al cambiar de sección.
- La sección «Lugares geométricos y cónicas» incorpora las cuatro definiciones métricas y un applet SVG interactivo en `graficos-2d/lugares-geometricos/`.
- El applet permite mover un punto sobre cada cónica y comparar las distancias que permanecen constantes.
- Se amplió el puente conceptual entre las definiciones como lugares geométricos y las secciones de un cono circular doble.

## Probar localmente

Desde la carpeta del proyecto:

```bash
python3 -m http.server 8000
```

Luego abrir:

```text
http://localhost:8000
```

## Publicación

La carpeta puede publicarse directamente con GitHub Pages. Three.js, MathJax y YouTube requieren conexión a internet porque se cargan desde servicios externos.

## Laboratorios incorporados

La versión incluye los puntos 1 a 9 de la ampliación:

1. Explorador de circunferencia, parábola, elipse e hipérbola con parámetros, traslaciones, focos, directriz, distancias y punto móvil.
2. Explorador 3D de esfera, elipsoide, paraboloides, hiperboloides, cono y cilindros.
3. Trazas dinámicas mediante planos `x=q`, `y=q` y `z=q`.
4. Ecuaciones en LaTeX que se actualizan al mover los controles.
5. Vista doble de superficie 3D y traza 2D.
6. Completamiento de cuadrados paso a paso con representación final.
7. Animación del plano que genera las cuatro secciones cónicas.
8. Modelo 3D de las esferas de Dandelin.
9. Módulos reutilizables en `common/mathlab/`.

### Estructura modular

- `scene.js`: escena Three.js, cámaras, ejes, malla, luces y exportación PNG.
- `surfaces.js`: geometrías paramétricas, funciones implícitas y ecuaciones reducidas.
- `traces.js`: cálculo de trazas por *marching squares* y representación 3D/SVG.
- `conics2d.js`: definiciones métricas y dibujo SVG de las cónicas.
- `latex.js`: actualización de MathJax.
- `animations.js`: reproducción y pausa de animaciones.
- `base.css`: diseño responsive común.

Los gráficos 3D anteriores continúan usando `common/three-viewer.js`; los nuevos laboratorios usan `common/mathlab/`. La migración completa de la galería puede realizarse posteriormente.

Los exploradores aceptan parámetros en la URL, por ejemplo:

```text
laboratorios/explorador-conicas/index.html?type=ellipse&a=4&b=2&h=1&k=-2
laboratorios/explorador-cuadricas/index.html?type=ellipticCone&axis=z&a=3&b=2&c=1
```
