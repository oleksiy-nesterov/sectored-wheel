const debounceCallback = (callback: (...args: unknown[]) => void, time = 0): ((...args: unknown[]) => void) => {
  // run callback one time after an interval
  let debounceTimer: number;
  return () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(callback, time);
  };
};

const MIN_WHEEL_SIZE = '100px';
const PI2 = Math.PI * 2;

class CustomElement extends HTMLElement {
  shadow: ShadowRoot | null = null;

  onConnect() {}

  onDisconnect() {}

  constructor() {
    super();
  }

  emit(eventName: string, eventData: unknown) {
    const detail = { element: this, data: eventData };
    const callback = this[`on${eventName}` as keyof HTMLElement] as unknown;
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true,
      cancelable: true,
    });

    if (typeof callback === 'function') {
      callback.call(this, event);
    } else {
      const source = this.getAttribute(`on${eventName}`);
      if (source) {
        new Function('e', `var event = e; return ${source}`)(event);
      } else {
        this.dispatchEvent(event);
      }
    }
  }

  connectedCallback() {
    this.shadow = this.attachShadow({ mode: 'open' });
    this.onConnect();
  }

  disconnectedCallback() {
    this.onDisconnect();
  }
}

export class SectoredWheelItemElement extends CustomElement {
  onConnect() {
    super.onConnect();

    const template = document.createElement('template');
    template.innerHTML = `<style>
      :host {
        display: flex;
        flex-direction: row;
        justify-content: flex-end;
        align-items: center;
        box-sizing: border-box;
        position: absolute;
        color: #000;
        left: 50%;
        font-weight: bold;
        font-family: sans-serif;
        text-transform: uppercase;
        transform-origin: 0 50%;
        z-index: 1;
        width: var(--sector-width);
        height: var(--sector-height);
        padding-right: calc(var(--sector-width) * 0.15);
        font-size: min(calc(var(--sector-height) * 0.2), calc(var(--sector-width) / 8));
      }
   </style><slot></slot>`;

    if (this.shadow) {
      this.shadow.appendChild(template.content);
    }
  }

  static get observedAttributes() {
    return ['clipping'];
  }

  attributeChangedCallback() {
    if (this.hasAttribute('clipping')) {
      this.style.clipPath = 'polygon(0 50%, 100% 0, 100% 100%)';
    } else {
      this.style.clipPath = 'none';
    }
  }
}

declare global {
  interface Window {
    SectoredWheelItemElement: typeof SectoredWheelItemElement;
  }
}

if (!window.customElements.get('sectored-wheel-item')) {
  window.SectoredWheelItemElement = SectoredWheelItemElement;
  window.customElements.define('sectored-wheel-item', SectoredWheelItemElement);
}

export class SectoredWheelElement extends CustomElement {
  #observer: MutationObserver | null = null;
  #wheel: HTMLElement | null = null;
  #canvas: HTMLCanvasElement | null = null;
  #ctx: CanvasRenderingContext2D | null = null;

  #rotation = 0;
  #init = true;
  #items: HTMLElement[] = [];

  #toRad = (angle: string = '0'): number => {
    // 90deg = 100grad = 0.25turn ≈ 1.5708rad
    const value = parseFloat(angle);
    if (angle.indexOf('deg') > 0) {
      return (value * Math.PI) / 180;
    } else if (angle.indexOf('grad') > 0) {
      return (value / 400) * PI2;
    } else if (angle.indexOf('turn') > 0) {
      return value * PI2;
    }
    return value;
  };

  #getActualAngle = (): number => {
    if (this.#wheel) {
      const actualStyles = getComputedStyle(this.#wheel);
      const actualTransformMatrix = actualStyles
        .getPropertyValue('transform')
        .replace(/[^\d.\-e,]+/g, '')
        .split(',');
      return Math.atan2(parseFloat(actualTransformMatrix[1]), parseFloat(actualTransformMatrix[0]));
    }
    return 0;
  };

  #getRotationFromIndex = (fromIndex: number, toIndex: number, acceleration = 1): number => {
    const from = Math.max(fromIndex, 0);
    const to = Math.max(Math.min(toIndex, this.#items.length - 1), 0);
    const angle = PI2 / this.#items.length;

    if (this.#direction === 'cw') {
      return PI2 * acceleration + angle * (from < to ? this.#items.length - (to - from) : from - to);
    } else {
      return (PI2 * acceleration + angle * (from < to ? to - from : this.#items.length - (from - to))) * -1;
    }
  };

  #getRotationFromAngle = (fromAngle: number, toIndex: number, acceleration = 1): number => {
    const to = Math.max(Math.min(toIndex, this.#items.length - 1), 0);
    const angle = PI2 / this.#items.length;
    let realAngle;

    if (this.#direction === 'cw') {
      realAngle = PI2 - Math.abs(fromAngle);
      return PI2 * acceleration + realAngle + (this.#items.length - to) * angle + Math.abs(fromAngle);
    } else {
      realAngle = Math.abs(fromAngle) - PI2;
      return realAngle - to * angle - Math.abs(fromAngle) - PI2 * acceleration;
    }
  };

  #unselectItems = () => {
    this.#items.forEach((el) => el.classList.remove('selected', 'preselected'));
  };

  rotate = (fromIndex: number, toIndex: number, noAnimate = false, reset = false) => {
    if (this.#wheel && this.#items.length) {
      this.#unselectItems();

      if (reset) {
        this.#rotation = 0;
      }

      if (this.inSpinning) {
        const actualAngle = this.#getActualAngle();
        // stop animation
        this.#wheel.style.animation = '';
        this.#wheel.style.transform = `rotate(${actualAngle}rad)`;
        this.#rotation = this.#getRotationFromAngle(actualAngle, toIndex, this.rotationAcceleration);
      } else {
        this.#rotation += this.#getRotationFromIndex(reset ? 0 : fromIndex, toIndex, this.rotationAcceleration);
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // rendering issue fix
          if (this.#wheel) {
            this.#wheel.style.transitionDuration = noAnimate ? '0s' : this.rotationTime;
            this.#wheel.style.transitionTimingFunction = 'cubic-bezier(0.25, 1, 0.5, 1)';
            this.#wheel.style.transform = `rotate(${this.#rotation + this.#toRad(this.azimuth)}rad)`;
          }
        });
      });
    }
  };

  spin = () => {
    if (!this.#wheel || this.inSpinning) {
      return;
    }
    this.#unselectItems();
    const actualAngle = this.#getActualAngle();
    this.#wheel.style.transitionDuration = '0s';
    this.#wheel.style.transform = 'none';
    this.#wheel.style.transitionTimingFunction = 'linear';
    this.#wheel.style.setProperty('--spin-angle', `${actualAngle}rad`);
    this.#wheel.style.animation = `calc(${this.rotationTime} / ${this.rotationAcceleration} * 0.1) linear infinite ${
      this.#direction === 'acw' ? 'reverse' : ''
    } spin`;
  };

  realign = debounceCallback((redrawOnly) => {
    if (!redrawOnly) {
      this.#items = Array.from(this.querySelectorAll('sectored-wheel-item'));
    }

    const angle = PI2 / this.#items.length;

    if (this.#canvas && this.#ctx) {
      const width = this.#canvas.clientWidth;
      const height = this.#canvas.clientHeight;
      const x = width / 2;
      const y = height / 2;

      const offset = -angle / 2;
      const radius = Math.max(width, height) / 2;

      this.#canvas.width = width;
      this.#canvas.height = height;
      for (let i = 0; i < this.#items.length; i++) {
        this.#ctx.beginPath();
        this.#ctx.moveTo(x, y);
        this.#ctx.arc(
          x,
          y,
          radius - this.padding - (this.stroke ? this.stroke / 2 : 0),
          offset + angle * i,
          offset + angle * (i + 1)
        );
        this.#ctx.lineTo(x, y);
        this.#ctx.fillStyle = this.#items[i].getAttribute('color') || this.#colors[i % this.#colors.length];
        this.#ctx.fill();
        if (this.stroke) {
          this.#ctx.lineWidth = this.stroke;
          this.#ctx.strokeStyle = this.strokeColor;
          this.#ctx.stroke();
        }
      }
    }

    if (!this.#items[this.index]) {
      this.index = -1;
      this.#unselectItems();
    }

    if (!redrawOnly && this.#wheel) {
      this.#wheel.style.setProperty('--count', String(this.#items.length));
      this.#wheel.style.setProperty('--sector-height', `calc(${Math.PI} * ${this.size} / ${this.#items.length})`);
      this.#wheel.style.setProperty('--sector-width', `calc(${this.size} / 2)`);
      this.#wheel.style.setProperty('--sector-angle', `${angle}rad`);

      this.#items.forEach((el, i) => {
        el.style.transform = `rotate(${angle * i}rad)`;
      });

      this.rotate(this.index, this.index, true, true);
    }

    if (this.#init) {
      this.#items.forEach((el) => el.classList.remove('preselected'));
      this.#items[this.index]?.classList.add('preselected');
      this.#init = false;
      this.style.opacity = '1';
    }
  }, 100);

  setIndexAsync = async (callback: () => Promise<number>) => {
    this.spin();
    try {
      this.index = await callback();
    } catch (error) {
      this.index = -1;
      console?.error(error);
    }
  };

  static get observedAttributes() {
    return [
      'index',
      'size',
      'colors',
      'stroke',
      'strokeColor',
      'stroke-color',
      'padding',
      'azimuth',
      'direction',
      'rotationAcceleration',
      'rotation-acceleration',
      'rotationTime',
      'rotation-time',
    ];
  }

  attributeChangedCallback(attributeName: string, oldValue: string, newValue: string) {
    if (attributeName === 'index' || oldValue !== newValue) {
      const key = attributeName.replace(/-+[a-z]/g, (v) => v[v.length - 1].toUpperCase());
      (this as Record<string, unknown>)[key] = newValue;
    }
  }

  #index = -1;
  set index(v: number | string) {
    if (typeof v === 'string') {
      v = parseInt(v || '0', 10);
    }
    if (v >= -1) {
      const newIndex = Math.max(v, -1);
      this.rotate(this.#index, newIndex);
      this.#index = newIndex;
    }
  }

  get index(): number {
    return this.#index;
  }

  #size = MIN_WHEEL_SIZE;
  set size(v: string) {
    this.#size = v || MIN_WHEEL_SIZE;
    this.style.width = this.#size;
    this.style.height = this.#size;
    this.realign();
  }

  get size(): string {
    return this.#size;
  }

  #colors: string[] = [];
  set colors(v: string[] | string) {
    if (Array.isArray(v)) {
      this.#colors = v;
    } else {
      this.#colors = String(v)
        .split(/\s*[;|]+\s*/)
        .filter(Boolean);
    }
    this.realign(true);
  }

  get colors(): string[] {
    return this.#colors;
  }

  #stroke = 0;
  set stroke(v: number | string) {
    if (typeof v === 'string') {
      v = parseInt(v || '0', 10);
    }
    this.#stroke = Math.max(v, 0);
    this.realign(true);
  }

  get stroke(): number {
    return this.#stroke;
  }

  #strokeColor = 'transparent';
  set strokeColor(v: string) {
    this.#strokeColor = v || 'transparent';
    this.realign(true);
  }

  get strokeColor(): string {
    return this.#strokeColor;
  }

  #padding = 0;
  set padding(v: number | string) {
    if (typeof v === 'string') {
      v = parseInt(v || '0', 10);
    }
    this.#padding = Math.max(v, 0);
    this.realign(true);
  }

  get padding(): number {
    return this.#padding;
  }

  #azimuth: string = '0deg';
  set azimuth(v: string) {
    this.#azimuth = v;
  }

  get azimuth(): string {
    return this.#azimuth;
  }

  #direction = 'acw';
  set direction(v: string) {
    this.#direction = ['acw', 'cw'].includes(v) ? v : 'acw';
  }

  get direction(): string {
    return this.#direction;
  }

  #rotationAcceleration = 1;
  set rotationAcceleration(v: number | string) {
    if (typeof v === 'string') {
      v = parseInt(v || '1', 10);
    }
    this.#rotationAcceleration = Math.max(v, 1);
  }

  get rotationAcceleration(): number {
    return this.#rotationAcceleration;
  }

  #rotationTime = '5s';
  set rotationTime(v: string) {
    this.#rotationTime = v || '5s';
  }

  get rotationTime(): string {
    return this.#rotationTime;
  }

  get inRotation(): boolean {
    if (this.#wheel) {
      return !!parseFloat(this.#wheel.style.transitionDuration);
    }
    return false;
  }

  get inSpinning(): boolean {
    if (this.#wheel) {
      return !!this.#wheel.style.animation;
    }
    return false;
  }

  onConnect() {
    super.onConnect();

    const template = document.createElement('template');
    template.innerHTML = `<style>
      @keyframes spin {
        from {
          transform: rotate(var(--spin-angle));
        }
        to {
          transform: rotate(calc(var(--spin-angle) + 360deg));
        }
      }
      :host {
        position: relative;
        display: inline-flex;
        justify-content: center;
        align-items: center;
        flex-grow: 0;
        flex-shrink: 0;
        user-select: none;
        min-width: ${MIN_WHEEL_SIZE};
        min-height: ${MIN_WHEEL_SIZE};
        border-radius: 50%;
        opacity: 0;
        transition: opacity 0.3s linear;
        will-change: opacity;
      }
      :host > div {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        aspect-ratio: 1/1;
        border-radius: 50%;
        overflow: hidden;
        transition: transform;
        will-change: transform;
      }
      :host > div > canvas {
        width: 100%;
        aspect-ratio: 1/1;
      }
    </style><div><canvas></canvas><slot></slot></div>`;

    if (this.shadow) {
      this.shadow.appendChild(template.content);
      this.#wheel = this.shadow.querySelector(':host > div');
      if (this.#wheel) {
        this.#canvas = this.#wheel.querySelector('canvas');
        if (this.#canvas) {
          this.#ctx = this.#canvas.getContext('2d');
          this.#observer = new MutationObserver(() => this.realign());
          this.#observer.observe(this, { childList: true });

          this.#wheel.addEventListener('transitionend', () => {
            this.#wheel && (this.#wheel.style.transitionDuration = '0s');
            if (this.inSpinning) {
              return;
            }
            if (!this.#init && !this.inSpinning) {
              this.emit('change', this.index);
              this.#items[this.index]?.classList.add('selected');
            }
          });

          this.realign();
        }
      }
    }
  }

  onDisconnect() {
    if (this.#observer) {
      this.#observer.disconnect();
    }
    super.onDisconnect();
  }
}

declare global {
  interface Window {
    SectoredWheelElement: typeof SectoredWheelElement;
  }
}

if (!window.customElements.get('sectored-wheel')) {
  window.SectoredWheelElement = SectoredWheelElement;
  window.customElements.define('sectored-wheel', SectoredWheelElement);
}
