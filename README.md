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
