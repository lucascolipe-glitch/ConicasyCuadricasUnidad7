export class AnimationController {
  constructor(step) {
    this.step = step;
    this.running = false;
    this.lastTime = 0;
    this.frame = null;
    this.loop = this.loop.bind(this);

    window.addEventListener('message', event => {
      if (event.data?.type === 'pause-animation') {
        this.pause();
      }
    });
  }

  loop(time) {
    if (!this.running) return;

    const delta = this.lastTime
      ? Math.min((time - this.lastTime) / 1000, 0.1)
      : 0;

    this.lastTime = time;
    this.step(delta, time);
    this.frame = requestAnimationFrame(this.loop);
  }

  play() {
    if (this.running) return;

    this.running = true;
    this.lastTime = 0;
    this.frame = requestAnimationFrame(this.loop);
  }

  pause() {
    this.running = false;

    if (this.frame) {
      cancelAnimationFrame(this.frame);
      this.frame = null;
    }
  }

  toggle() {
    this.running ? this.pause() : this.play();
    return this.running;
  }
}
