import { typeset } from '../../../common/mathlab/latex.js';

const EXAMPLES = {
  circle: {
    preview: '../explorador-conicas/index.html?type=circle&a=5&h=2&k=-3',
    steps: [
      [
        'Ecuación general',
        String.raw`
          \[x^2+y^2-4x+6y-12=0.\]
          <p>Los coeficientes de \(x^2\) e \(y^2\) son iguales.</p>
        `
      ],
      [
        'Agrupar',
        String.raw`
          \[(x^2-4x)+(y^2+6y)=12.\]
        `
      ],
      [
        'Completar cuadrados',
        String.raw`
          \[(x^2-4x+4)+(y^2+6y+9)=12+4+9,\]
          \[(x-2)^2+(y+3)^2=25.\]
        `
      ],
      [
        'Identificar',
        String.raw`
          \[C=(2,-3),\qquad r=5.\]
        `
      ],
      [
        'Construcción',
        String.raw`
          <p>Todos los puntos verifican</p>
          \[d(P,C)=5.\]
        `
      ]
    ]
  },

  ellipse: {
    preview: '../explorador-conicas/index.html?type=ellipse&a=3&b=2&h=1&k=-2',
    steps: [
      [
        'Ecuación general',
        String.raw`
          \[4x^2+9y^2-8x+36y+4=0.\]
        `
      ],
      [
        'Agrupar y factorizar',
        String.raw`
          \[4(x^2-2x)+9(y^2+4y)=-4.\]
        `
      ],
      [
        'Completar cuadrados',
        String.raw`
          \[4(x-1)^2+9(y+2)^2=36.\]
        `
      ],
      [
        'Forma reducida',
        String.raw`
          \[\frac{(x-1)^2}{9}+\frac{(y+2)^2}{4}=1.\]
        `
      ],
      [
        'Construcción',
        String.raw`
          \[c=\sqrt{5},\qquad d(P,F_1)+d(P,F_2)=6.\]
        `
      ]
    ]
  },

  hyperbola: {
    preview: '../explorador-conicas/index.html?type=hyperbola&a=2&b=3&h=1&k=-1',
    steps: [
      [
        'Ecuación general',
        String.raw`
          \[9x^2-4y^2-18x-8y-31=0.\]
        `
      ],
      [
        'Agrupar',
        String.raw`
          \[9(x^2-2x)-4(y^2+2y)=31.\]
        `
      ],
      [
        'Completar cuadrados',
        String.raw`
          \[9(x-1)^2-4(y+1)^2=36.\]
        `
      ],
      [
        'Forma reducida',
        String.raw`
          \[\frac{(x-1)^2}{4}-\frac{(y+1)^2}{9}=1.\]
        `
      ],
      [
        'Construcción',
        String.raw`
          \[c=\sqrt{13},\qquad \left|d(P,F_1)-d(P,F_2)\right|=4.\]
        `
      ]
    ]
  },

  sphere: {
    preview: '../explorador-cuadricas/index.html?type=sphere&a=4&h=1&k=-2&l=3&traceAxis=z&traceValue=3',
    steps: [
      [
        'Ecuación general',
        String.raw`
          \[x^2+y^2+z^2-2x+4y-6z-2=0.\]
        `
      ],
      [
        'Agrupar',
        String.raw`
          \[(x^2-2x)+(y^2+4y)+(z^2-6z)=2.\]
        `
      ],
      [
        'Completar cuadrados',
        String.raw`
          \[(x-1)^2+(y+2)^2+(z-3)^2=16.\]
        `
      ],
      [
        'Identificar',
        String.raw`
          \[C=(1,-2,3),\qquad r=4.\]
        `
      ],
      [
        'Trazas',
        String.raw`
          \[(x-1)^2+(y+2)^2=16-(q-3)^2.\]
        `
      ]
    ]
  }
};

const byId = (id) => document.getElementById(id);

const exampleSelect = byId('example');
const stepsContainer = byId('steps');
const progressContainer = byId('step-progress');
const previewFrame = byId('preview');
const previewMessage = byId('preview-message');

let currentStep = 0;

function buildSteps() {
  stepsContainer.replaceChildren();
  progressContainer.replaceChildren();

  const selectedExample = EXAMPLES[exampleSelect.value];

  selectedExample.steps.forEach(([title, body], index) => {
    const card = document.createElement('article');
    card.className = 'step-card';
    card.innerHTML = `
      <h2>${index + 1}. ${title}</h2>
      ${body}
    `;
    stepsContainer.append(card);

    const dot = document.createElement('span');
    dot.className = 'step-dot';
    progressContainer.append(dot);
  });

  currentStep = 0;
  previewFrame.removeAttribute('src');
  previewFrame.hidden = true;
  previewMessage.hidden = false;

  renderStep();
}

function renderStep() {
  const selectedExample = EXAMPLES[exampleSelect.value];

  [...stepsContainer.children].forEach((card, index) => {
    card.classList.toggle('active', index === currentStep);
  });

  [...progressContainer.children].forEach((dot, index) => {
    dot.classList.toggle('active', index === currentStep);
    dot.classList.toggle('done', index < currentStep);
  });

  byId('previous').disabled = currentStep === 0;
  byId('next').disabled = currentStep === selectedExample.steps.length - 1;

  if (currentStep === selectedExample.steps.length - 1) {
    previewFrame.hidden = false;
    previewMessage.hidden = true;

    if (!previewFrame.getAttribute('src')) {
      previewFrame.src = selectedExample.preview;
    }
  } else {
    previewFrame.hidden = true;
    previewMessage.hidden = false;
  }

  typeset([stepsContainer]);
}

byId('previous').addEventListener('click', () => {
  currentStep = Math.max(0, currentStep - 1);
  renderStep();
});

byId('next').addEventListener('click', () => {
  currentStep = Math.min(
    EXAMPLES[exampleSelect.value].steps.length - 1,
    currentStep + 1
  );
  renderStep();
});

byId('restart').addEventListener('click', () => {
  currentStep = 0;
  renderStep();
});

exampleSelect.addEventListener('change', buildSteps);

buildSteps();
