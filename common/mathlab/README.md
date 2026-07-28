# Módulos de los laboratorios matemáticos

Esta carpeta contiene la capa reutilizable de los nuevos applets.

- `scene.js`: administra la escena 3D y la interacción.
- `surfaces.js`: construye superficies y evalúa ecuaciones implícitas.
- `traces.js`: calcula y dibuja trazas.
- `conics2d.js`: implementa los modelos métricos de las cónicas.
- `latex.js`: formatea y actualiza MathJax.
- `animations.js`: controla las animaciones.
- `base.css`: comparte el diseño responsive.

Las funciones públicas usan coordenadas matemáticas `(x,y,z)`. La conversión al sistema interno de Three.js se centraliza en `mathToThree()`.
