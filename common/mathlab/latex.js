export function formatNumber(value, digits = 2) {
  const rounded = Number(Number(value).toFixed(digits));
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

export function translatedVariable(variable, center) {
  const value = Number(center);
  if (Math.abs(value) < 1e-9) return variable;

  const sign = value > 0 ? '-' : '+';
  return `(${variable}${sign}${formatNumber(Math.abs(value))})`;
}

export async function typesetMath(elements = []) {
  if (!window.MathJax?.typesetPromise) return;

  const nodes = elements.filter(Boolean);
  if (!nodes.length) return;

  try {
    window.MathJax.typesetClear?.(nodes);
    await window.MathJax.typesetPromise(nodes);
  } catch (error) {
    console.warn('MathJax no pudo actualizar una expresión.', error);
  }
}

export function setLatex(element, latex, display = true) {
  if (!element) return;

  element.textContent = display
    ? `\\[${latex}\\]`
    : `\\(${latex}\\)`;

  typesetMath([element]);
}
