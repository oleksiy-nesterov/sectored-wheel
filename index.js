class CustomElement extends HTMLElement {
    shadow = null;

    onConnect() {
    }

    onDisconnect() {
    }

    constructor() {
        super();
    }

    emit(eventName, eventData) {
        const detail = {element: this, data: eventData};
        const event = new CustomEvent(eventName, {detail});
        const callback = this[`on${eventName}`];

        if (typeof callback === 'function') {
            callback.call(this, event);
        } else {
            const source = this.getAttribute(`on${eventName}`);
            if (source) {
                const func = new Function('e', `var event = e; return ${source}`);
            } else {
                this.dispatchEvent(event);
            }
        }
    }

    connectedCallback() {
        this.shadow = this.attachShadow({mode: 'open'});
        this.onConnect();
    }

    disconnectedCallback() {
        this.onDisconnect();
    }
}

class SectoredWheelItemElement extends CustomElement {
    #slot;

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

        this.shadow.appendChild(template.content);
        this.#slot = this.shadow.querySelector(':host > slot');
    }

    static get observedAttributes() {
        return ['clipping'];
    }

    attributeChangedCallback(attributeName, oldValue, newValue) {
        if (this.hasAttribute('clipping')) {
            this.style.clipPath = 'polygon(0 50%, 100% 0, 100% 100%)';
        } else {
            this.style.clipPath = 'none';
        }
    }
}

if (!window.customElements.get('sectored-wheel-item')) {
    window.SectorElement = SectoredWheelItemElement;
    window.customElements.define('sectored-wheel-item', SectoredWheelItemElement);
}

class SectoredWheelElement extends CustomElement {
    MIN_SIZE = '100px';
    PI2 = Math.PI * 2;

    #observer;
    #wheel;
    #canvas;
    #ctx;

    #rotation = 0;
    #init = true;
    #items = [];

    #getDebounceCallback = (callback, time) => {
        // run callback one time after an interval
        let debounceTimer;
        return () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(callback, time);
        };
    };

    #toRad = (angle = '0') => {
        // 90deg = 100grad = 0.25turn ≈ 1.5708rad
        const value = parseFloat(angle);
        if (angle.indexOf('deg') > 0) {
            return value * Math.PI / 180;
        } else if (angle.indexOf('grad') > 0) {
            return value / 400 * this.PI2;
        } else if (angle.indexOf('turn') > 0) {
            return value * this.PI2;
        }
        return value;
    };

    #getActualAngle = () => {
        const actualStyles = getComputedStyle(this.#wheel);
        const actualTransformMatrix = actualStyles.transform.replace(/[^\d\.\-e,]+/g, '').split(',');
        return Math.atan2(actualTransformMatrix[1], actualTransformMatrix[0]);
    };

    #getRotationFromIndex = (fromIndex, toIndex, acceleration) => {
        const from = Math.max(fromIndex, 0);
        const to = Math.max(Math.min(toIndex, this.#items.length - 1), 0);
        const angle = this.PI2 / this.#items.length;

        if (this.#direction === 'cw') {
            return (this.PI2 * acceleration) + (angle * (from < to ? this.#items.length - (to - from) : from - to));
        } else {
            return ((this.PI2 * acceleration) + (angle * (from < to ? to - from : this.#items.length - (from - to)))) * -1;
        }
    };

    #getRotationFromAngle = (fromAngle, toIndex, acceleration) => {
        const to = Math.max(Math.min(toIndex, this.#items.length - 1), 0);
        const angle = this.PI2 / this.#items.length;
        let realAngle;

        if (this.#direction === 'cw') {
            realAngle = this.PI2 - Math.abs(fromAngle);
            return (this.PI2 * acceleration) + realAngle + (this.#items.length - to) * angle + Math.abs(fromAngle);
        } else {
            realAngle = Math.abs(fromAngle) - this.PI2;
            return realAngle - to * angle - Math.abs(fromAngle) - (this.PI2 * acceleration);
        }
    };

    #unselectItems = () => {
        this.#items.forEach((el) => el.classList.remove('selected', 'preselected'));
    };

    rotate = (fromIndex, toIndex, noAnimate, reset) => {
        if (this.#items.length) {
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
                    this.#wheel.style.transitionDuration = noAnimate ? '0s' : this.rotationTime;
                    this.#wheel.style.transitionTimingFunction = 'cubic-bezier(0.25, 1, 0.5, 1)';
                    this.#wheel.style.transform = `rotate(${this.#rotation + this.#toRad(this.azimuth)}rad)`;
                });
            });
        }
    }

    spin = () => {
        if (this.inSpinning) {
            return;
        }
        this.#unselectItems();
        const actualAngle = this.#getActualAngle();
        this.#wheel.style.transitionDuration = '0s';
        this.#wheel.style.transform = 'none';
        this.#wheel.style.transitionTimingFunction = 'linear';
        this.#wheel.style.setProperty('--spin-angle', `${actualAngle}rad`);
        this.#wheel.style.animation = `calc(${this.rotationTime} / ${this.rotationAcceleration} * 0.1) linear infinite ${this.#direction === 'acw' ? 'reverse' : ''} spin`;
    }

    realign = this.#getDebounceCallback((redrawOnly) => {
        if (!redrawOnly) {
            this.#items = this.querySelectorAll('sectored-wheel-item');
        }

        const angle = this.PI2 / this.#items.length;

        if (this.#canvas) {
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
                this.#ctx.arc(x, y, radius - this.padding - (this.stroke ? this.stroke / 2 : 0), offset + angle * i, offset + angle * (i + 1));
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
            this.#wheel.style.setProperty('--count', this.#items.length);
            this.#wheel.style.setProperty('--sector-height', `calc(${Math.PI} * ${this.size} / ${this.#items.length})`);
            this.#wheel.style.setProperty('--sector-width', `calc(${this.size} / 2)`);
            this.#wheel.style.setProperty('--sector-angle', `${angle}rad`);

            this.#items.forEach((el, i) => {
                el.style.transform = `rotate(${angle * i}rad)`;
            });

            this.rotate(this.index, this.index, true, true);
        }

        if (this.#init) {
            this.#items.forEach(el => el.classList.remove('preselected'));
            this.#items[this.index]?.classList.add('preselected');
            this.#init = false;
            this.style.opacity = 1;
        }
    }, 100)

    setIndexAsync = async (callback) => {
        this.spin();
        try {
            this.index = await callback();
        } catch (error) {
            this.index = -1;
            console?.error(error);
        }
    }

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
            'rotation-time'
        ];
    }

    attributeChangedCallback(attributeName, oldValue, newValue) {
        if (attributeName === 'index' || oldValue !== newValue) {
            const key = attributeName.replace(/-+[a-z]/g, v => v[v.length - 1].toUpperCase());
            this[key] = newValue;
        }
    }

    #index = -1;
    set index(v) {
        if (v >= -1) {
            const newIndex = Math.max(parseInt(v || 0, 10), -1);
            this.rotate(this.#index, newIndex);
            this.#index = newIndex;
        }
    }

    get index() {
        return this.#index;
    }

    #size = this.MIN_SIZE;
    set size(v) {
        this.#size = v || this.MIN_SIZE;
        this.style.width = this.#size;
        this.style.height = this.#size;
        this.realign();
    }

    get size() {
        return this.#size;
    }

    #colors = [];
    set colors(v) {
        if (Array.isArray(v)) {
            this.#colors = v;
        } else {
            this.#colors = String(v).split(/\s*[;|]+\s*/).filter(Boolean);
        }
        this.realign(true);
    }

    get colors() {
        return this.#colors;
    }

    #stroke = 0;
    set stroke(v) {
        this.#stroke = Math.max(parseInt(v || 0, 10), 0);
        this.realign(true);
    }

    get stroke() {
        return this.#stroke;
    }

    #strokeColor = 'transparent';
    set strokeColor(v) {
        this.#strokeColor = v || 'transparent';
        this.realign(true);
    }

    get strokeColor() {
        return this.#strokeColor;
    }

    #padding = 0;
    set padding(v) {
        this.#padding = Math.max(parseInt(v || 0, 10), 0);
        this.realign(true);
    }

    get padding() {
        return this.#padding;
    }

    #azimuth;
    set azimuth(v) {
        this.#azimuth = v;
    }

    get azimuth() {
        return this.#azimuth;
    }

    #direction = 'acw';
    set direction(v) {
        this.#direction = ['acw', 'cw'].includes(v) ? v : 'acw';
    }

    get direction() {
        return this.#direction;
    }

    #rotationAcceleration = 1;
    set rotationAcceleration(v) {
        this.#rotationAcceleration = Math.max(parseInt(v || 1, 10), 1);
    }

    get rotationAcceleration() {
        return this.#rotationAcceleration;
    }

    #rotationTime = '5s';
    set rotationTime(v) {
        this.#rotationTime = v || '5s';
    }

    get rotationTime() {
        return this.#rotationTime;
    }

    get inRotation() {
        return !!parseFloat(this.#wheel.style.transitionDuration);
    }

    get inSpinning() {
        return !!this.#wheel.style.animation;
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
                min-width: ${this.MIN_SIZE};
                min-height: ${this.MIN_SIZE};
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

        this.shadow.appendChild(template.content);
        this.#wheel = this.shadow.querySelector(':host > div');
        this.#canvas = this.#wheel.querySelector('canvas');
        this.#ctx = this.#canvas.getContext('2d');

        this.#observer = new MutationObserver(() => this.realign());
        this.#observer.observe(this, {childList: true});

        this.#wheel.addEventListener('transitionend', () => {
            this.#wheel.style.transitionDuration = '0s';
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

    onDisconnect() {
        this.#observer.disconnect();
        super.onDisconnect();
    }
}

if (!window.customElements.get('sectored-wheel')) {
    window.SectoredWheelElement = SectoredWheelElement;
    window.customElements.define('sectored-wheel', SectoredWheelElement);
}
