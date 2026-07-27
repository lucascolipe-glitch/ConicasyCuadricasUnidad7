# Cónicas y superficies cuádricas — unidad web

## Publicación

Subir el contenido completo de esta carpeta a un repositorio de GitHub y activar **Settings → Pages → Deploy from a branch**.

Para probar localmente, abrir una terminal dentro de la carpeta y ejecutar:

```bash
python3 -m http.server 8000
```

Luego visitar `http://localhost:8000`.

## Estructura

- `index.html`: aplicación principal por secciones.
- `css/` y `js/`: estilos y navegación.
- `graficos-3d/`: 50 carpetas, una por entorno Asymptote del TeX.
- `common/`: motor compartido Three.js para los gráficos 3D.
- `graficos-2d/`: exploradores SVG/HTML.
- `materiales/`: TeX y PDF originales.

## Dependencias externas

La página carga Three.js y MathJax desde jsDelivr, y los videos desde YouTube. Por eso necesita conexión a internet para esas funciones.

## Adaptación matemática

No se realizó una traducción literal de Asymptote. Cada escena reconstruye el objeto matemático mediante parametrizaciones web equivalentes. Las superficies infinitas se muestran en dominios acotados. La sección «Notas de revisión» del sitio registra discrepancias detectadas entre comentarios, títulos y ecuaciones efectivas.
