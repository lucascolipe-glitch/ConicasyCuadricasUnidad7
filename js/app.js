
const sections = [...document.querySelectorAll('.content-section')];
const navLinks = [...document.querySelectorAll('.nav-link')];
const sidebar = document.querySelector('.sidebar');
const menuToggle = document.querySelector('.menu-toggle');

function loadSectionFrames(section) {
  if (!section) return;
  section.querySelectorAll('iframe[data-src]').forEach(frame => {
    if (!frame.getAttribute('src')) frame.src = frame.dataset.src;
  });
}

function pauseVideos(container = document) {
  container.querySelectorAll('iframe[data-youtube]').forEach(frame => {
    try { frame.contentWindow.postMessage(JSON.stringify({event:'command',func:'pauseVideo',args:[]}), '*'); } catch (_) {}
  });
}

function setInteractiveFramesState(container, state) {
  container.querySelectorAll('iframe.lab-frame').forEach(frame => {
    try { frame.contentWindow.postMessage({type: state}, '*'); } catch (_) {}
  });
}

function showSection(id, pushHash = true) {
  pauseVideos();
  sections.forEach(section => setInteractiveFramesState(section, 'pause-animation'));
  sections.forEach(s => s.classList.toggle('active', s.id === id));
  navLinks.forEach(b => b.classList.toggle('active', b.dataset.section === id));
  if (pushHash) history.replaceState(null, '', `#${id}`);
  sidebar?.classList.remove('open');
  window.scrollTo({top:0, behavior:'smooth'});
  const active = document.getElementById(id);
  loadSectionFrames(active);
  if (active) setInteractiveFramesState(active, 'resume-animation');
  if (window.MathJax?.typesetPromise && active) MathJax.typesetPromise([active]);
}

navLinks.forEach(b => b.addEventListener('click', () => showSection(b.dataset.section)));
menuToggle?.addEventListener('click', () => sidebar?.classList.toggle('open'));
document.addEventListener('keydown', e => { if (e.key === 'Escape') sidebar?.classList.remove('open'); });

const requested = location.hash.slice(1);
showSection(document.getElementById(requested) ? requested : 'inicio', false);

// Carruseles de videos: cada panel usa un único iframe para que navegar sea simple.
const videoLists = {
  'videos-conicas-teoria': [
    ['6WiFDz6pntE','Tipos de cónicas: circunferencia, parábola, elipse e hipérbola'],
    ['PNAs2hCyHxY','Ecuaciones y elementos principales de las cónicas'],
    ['Hfa-dSaSsec','Cónicas desde cero']
  ],
  'videos-conicas-practica': [
    ['PTVkUffQJys','Completar cuadrados e identificar una cónica'],
    ['8NamXvH76AM','Ejercicios para identificar y graficar cónicas'],
    ['CnvE3tuU9KA','Diez ejercicios resueltos de identificación']
  ],
  'videos-completar-practica': [
    ['PTVkUffQJys','Completar cuadrados e identificar una cónica'],
    ['8NamXvH76AM','Ejercicios para identificar y graficar cónicas'],
    ['CnvE3tuU9KA','Diez ejercicios resueltos de identificación']
  ],
  'videos-completar-teoria': [
    ['6WiFDz6pntE','Tipos de cónicas: circunferencia, parábola, elipse e hipérbola'],
    ['PNAs2hCyHxY','Ecuaciones y elementos principales de las cónicas'],
    ['Hfa-dSaSsec','Cónicas desde cero']
  ],
  'videos-circ-teoria': [
    ['PNAs2hCyHxY','Circunferencia: ecuaciones y elementos'],
    ['v3ILBTjnGCY','Posición relativa entre recta y circunferencia']
  ],
  'videos-circ-practica': [
    ['8PnHOvkYe98','Circunferencia y completamiento de cuadrados'],
    ['vB4sqbZCLBM','Ejemplos y ejercicios de circunferencia']
  ],
  'videos-parabola-teoria': [
    ['FLlxuhr1heA','Parábola: introducción, foco, vértice y directriz'],
    ['_Q9RXHL66oU','Ecuación canónica u ordinaria de la parábola'],
    ['FlsYCYbmJGU','Conceptos básicos de la parábola']
  ],
  'videos-parabola-practica': [
    ['DXrwxQlLs5E','Encontrar foco, vértice y directriz: ejemplo'],
    ['jTZqmYNHe4E','Graficar una parábola con vértice y foco conocidos']
  ],
  'videos-elipse-teoria': [
    ['PNAs2hCyHxY','Elipse: definición, forma ordinaria y focos'],
    ['6WiFDz6pntE','Comparación visual de las secciones cónicas']
  ],
  'videos-elipse-practica': [
    ['8NamXvH76AM','Reconocer y graficar cónicas: ejercicios'],
    ['PTVkUffQJys','Reducir ecuaciones mediante cuadrados completos']
  ],
  'videos-hiperbola-teoria': [
    ['Se7nSqmYUJE','Hipérbola: trazado, focos, vértices y asíntotas'],
    ['PNAs2hCyHxY','Ecuaciones y elementos de la hipérbola']
  ],
  'videos-hiperbola-practica': [
    ['8NamXvH76AM','Ejercicios de clasificación y representación'],
    ['IbDbgobH6Lg','Completamiento de cuadrados para cónicas y cuádricas']
  ],
  'videos-cuadricas-teoria': [
    ['KlQOyuPZ6po','Superficies cuádricas y cilindros: explicación completa'],
    ['PWZpK2Hf6bs','Elipsoide, cono e hiperboloides'],
    ['u97Y57nSZBk','Paraboloides, silla de montar y cilindros']
  ],
  'videos-cuadricas-practica': [
    ['mImLt2akJsA','Seis ejercicios de examen sobre superficies cuádricas'],
    ['BT2c2dgg0wE','Identificar, hallar trazas y graficar un elipsoide'],
    ['1DFaLeqMX5Q','Graficar una superficie cuádrica paso a paso']
  ],
  'videos-trazas-teoria': [
    ['cWWIg5bpJes','Superficies cuádricas, trazas y esfera'],
    ['KlQOyuPZ6po','Trazas y cilindros en tres dimensiones']
  ],
  'videos-trazas-practica': [
    ['mImLt2akJsA','Ejercicios de trazas e identificación'],
    ['bMl6nHC0SEM','Método para graficar superficies cuádricas']
  ]
};

function youtubeSrc(id) {
  return `https://www.youtube-nocookie.com/embed/${id}?enablejsapi=1&rel=0&modestbranding=1`;
}

document.querySelectorAll('[data-video-carousel]').forEach(panel => {
  const list = videoLists[panel.id] || [];
  if (!list.length) return;
  let index = 0;
  const frame = panel.querySelector('iframe');
  const title = panel.querySelector('.video-title');
  const count = panel.querySelector('.video-index');
  const render = () => {
    pauseVideos(panel);
    frame.src = youtubeSrc(list[index][0]);
    frame.dataset.youtube = 'true';
    frame.title = list[index][1];
    title.textContent = list[index][1];
    count.textContent = `${index + 1} de ${list.length}`;
  };
  panel.querySelector('[data-prev]').addEventListener('click', () => { index = (index - 1 + list.length) % list.length; render(); });
  panel.querySelector('[data-next]').addEventListener('click', () => { index = (index + 1) % list.length; render(); });
  render();
});

// Actividades de opción múltiple.
let correctAnswers = 0;
let completed = new Set();
function updateProgress() {
  const total = document.querySelectorAll('.question[data-question]').length;
  const pct = total ? Math.round(completed.size / total * 100) : 0;
  document.querySelectorAll('.progress-fill').forEach(el => el.style.width = `${pct}%`);
  document.querySelectorAll('[data-progress-text]').forEach(el => el.textContent = `${completed.size} de ${total} actividades respondidas`);
}

document.querySelectorAll('.question[data-question]').forEach(q => {
  q.querySelectorAll('.option').forEach(option => {
    option.addEventListener('click', () => {
      if (completed.has(q.dataset.question)) return;
      const ok = option.dataset.correct === 'true';
      option.classList.add(ok ? 'correct' : 'incorrect');
      if (ok) correctAnswers++;
      q.querySelector('.feedback').textContent = ok ? '¡Correcto!' : (q.dataset.explain || 'Revisá la forma ordinaria y los signos.');
      completed.add(q.dataset.question);
      updateProgress();
    });
  });
});

document.querySelectorAll('.short-answer').forEach(box => {
  const q = box.closest('.question');
  box.querySelector('button').addEventListener('click', () => {
    if (completed.has(q.dataset.question)) return;
    const input = box.querySelector('input');
    const value = Number(String(input.value).replace(',','.'));
    const answer = Number(input.dataset.answer);
    const tol = Number(input.dataset.tolerance || .001);
    const ok = Number.isFinite(value) && Math.abs(value-answer) <= tol;
    q.querySelector('.feedback').textContent = ok ? '¡Correcto!' : `Todavía no. Pista: ${q.dataset.explain || 'completá cuadrados.'}`;
    input.style.borderColor = ok ? '#22c55e' : '#ef4444';
    completed.add(q.dataset.question);
    updateProgress();
  });
});
updateProgress();

// Botones internos que llevan a otra sección.
document.querySelectorAll('[data-go-section]').forEach(a => a.addEventListener('click', e => {
  e.preventDefault(); showSection(a.dataset.goSection);
}));
