var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _SectoredWheelElement_observer, _SectoredWheelElement_wheel, _SectoredWheelElement_canvas, _SectoredWheelElement_ctx, _SectoredWheelElement_rotation, _SectoredWheelElement_init, _SectoredWheelElement_items, _SectoredWheelElement_toRad, _SectoredWheelElement_getActualAngle, _SectoredWheelElement_getRotationFromIndex, _SectoredWheelElement_getRotationFromAngle, _SectoredWheelElement_unselectItems, _SectoredWheelElement_index, _SectoredWheelElement_size, _SectoredWheelElement_colors, _SectoredWheelElement_stroke, _SectoredWheelElement_strokeColor, _SectoredWheelElement_padding, _SectoredWheelElement_azimuth, _SectoredWheelElement_direction, _SectoredWheelElement_rotationAcceleration, _SectoredWheelElement_rotationTime;
const debounceCallback = (callback, time = 0) => {
    let debounceTimer;
    return () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(callback, time);
    };
};
const timedPromise = async (promiseOrValue, time = 0) => {
    const timeout = new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, time);
    });
    const promise = promiseOrValue && promiseOrValue.then
        ? promiseOrValue
        : Promise.resolve(typeof promiseOrValue === 'function' ? promiseOrValue() : promiseOrValue);
    return Promise.all([promise, timeout]).then((values) => {
        return values[0];
    });
};
const MIN_WHEEL_SIZE = '100px';
const PI2 = Math.PI * 2;
class CustomElement extends HTMLElement {
    onConnect() { }
    onDisconnect() { }
    constructor() {
        super();
        this.shadow = null;
    }
    emit(eventName, eventData) {
        const detail = { element: this, data: eventData };
        const callback = this[`on${eventName}`];
        const event = new CustomEvent(eventName, {
            detail,
            bubbles: true,
            cancelable: true,
        });
        if (typeof callback === 'function') {
            callback.call(this, event);
        }
        else {
            const source = this.getAttribute(`on${eventName}`);
            if (source) {
                new Function('e', `var event = e; return ${source}`).call(this, event);
            }
            else {
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
        }
        else {
            this.style.clipPath = 'none';
        }
    }
}
if (!window.customElements.get('sectored-wheel-item')) {
    window.SectoredWheelItemElement = SectoredWheelItemElement;
    window.customElements.define('sectored-wheel-item', SectoredWheelItemElement);
}
export class SectoredWheelElement extends CustomElement {
    constructor() {
        super(...arguments);
        _SectoredWheelElement_observer.set(this, null);
        _SectoredWheelElement_wheel.set(this, null);
        _SectoredWheelElement_canvas.set(this, null);
        _SectoredWheelElement_ctx.set(this, null);
        _SectoredWheelElement_rotation.set(this, 0);
        _SectoredWheelElement_init.set(this, true);
        _SectoredWheelElement_items.set(this, []);
        _SectoredWheelElement_toRad.set(this, (angle = '0') => {
            const value = parseFloat(angle);
            if (angle.indexOf('deg') > 0) {
                return (value * Math.PI) / 180;
            }
            else if (angle.indexOf('grad') > 0) {
                return (value / 400) * PI2;
            }
            else if (angle.indexOf('turn') > 0) {
                return value * PI2;
            }
            return value;
        });
        _SectoredWheelElement_getActualAngle.set(this, () => {
            if (__classPrivateFieldGet(this, _SectoredWheelElement_wheel, "f")) {
                const actualStyles = getComputedStyle(__classPrivateFieldGet(this, _SectoredWheelElement_wheel, "f"));
                const actualTransformMatrix = actualStyles
                    .getPropertyValue('transform')
                    .replace(/[^\d.\-e,]+/g, '')
                    .split(',');
                return Math.atan2(parseFloat(actualTransformMatrix[1]), parseFloat(actualTransformMatrix[0]));
            }
            return 0;
        });
        _SectoredWheelElement_getRotationFromIndex.set(this, (fromIndex, toIndex, acceleration = 1) => {
            const from = Math.max(fromIndex, 0);
            const to = Math.max(Math.min(toIndex, __classPrivateFieldGet(this, _SectoredWheelElement_items, "f").length - 1), 0);
            const angle = PI2 / __classPrivateFieldGet(this, _SectoredWheelElement_items, "f").length;
            if (__classPrivateFieldGet(this, _SectoredWheelElement_direction, "f") === 'cw') {
                return PI2 * acceleration + angle * (from < to ? __classPrivateFieldGet(this, _SectoredWheelElement_items, "f").length - (to - from) : from - to);
            }
            else {
                return (PI2 * acceleration + angle * (from < to ? to - from : __classPrivateFieldGet(this, _SectoredWheelElement_items, "f").length - (from - to))) * -1;
            }
        });
        _SectoredWheelElement_getRotationFromAngle.set(this, (fromAngle, toIndex, acceleration = 1) => {
            const to = Math.max(Math.min(toIndex, __classPrivateFieldGet(this, _SectoredWheelElement_items, "f").length - 1), 0);
            const angle = PI2 / __classPrivateFieldGet(this, _SectoredWheelElement_items, "f").length;
            let realAngle;
            if (__classPrivateFieldGet(this, _SectoredWheelElement_direction, "f") === 'cw') {
                realAngle = PI2 - Math.abs(fromAngle);
                return PI2 * acceleration + realAngle + (__classPrivateFieldGet(this, _SectoredWheelElement_items, "f").length - to) * angle + Math.abs(fromAngle);
            }
            else {
                realAngle = Math.abs(fromAngle) - PI2;
                return realAngle - to * angle - Math.abs(fromAngle) - PI2 * acceleration;
            }
        });
        _SectoredWheelElement_unselectItems.set(this, () => {
            __classPrivateFieldGet(this, _SectoredWheelElement_items, "f").forEach((el) => el.classList.remove('selected', 'preselected'));
        });
        this.rotate = (fromIndex, toIndex, noAnimate = false, reset = false) => {
            if (__classPrivateFieldGet(this, _SectoredWheelElement_wheel, "f") && __classPrivateFieldGet(this, _SectoredWheelElement_items, "f").length) {
                __classPrivateFieldGet(this, _SectoredWheelElement_unselectItems, "f").call(this);
                if (reset) {
                    __classPrivateFieldSet(this, _SectoredWheelElement_rotation, 0, "f");
                }
                if (this.inSpinning) {
                    const actualAngle = __classPrivateFieldGet(this, _SectoredWheelElement_getActualAngle, "f").call(this);
                    __classPrivateFieldGet(this, _SectoredWheelElement_wheel, "f").style.animation = '';
                    __classPrivateFieldGet(this, _SectoredWheelElement_wheel, "f").style.transform = `rotate(${actualAngle}rad)`;
                    __classPrivateFieldSet(this, _SectoredWheelElement_rotation, __classPrivateFieldGet(this, _SectoredWheelElement_getRotationFromAngle, "f").call(this, actualAngle, toIndex, this.rotationAcceleration), "f");
                }
                else {
                    __classPrivateFieldSet(this, _SectoredWheelElement_rotation, __classPrivateFieldGet(this, _SectoredWheelElement_rotation, "f") + __classPrivateFieldGet(this, _SectoredWheelElement_getRotationFromIndex, "f").call(this, reset ? 0 : fromIndex, toIndex, this.rotationAcceleration), "f");
                }
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        if (__classPrivateFieldGet(this, _SectoredWheelElement_wheel, "f")) {
                            __classPrivateFieldGet(this, _SectoredWheelElement_wheel, "f").style.transitionDuration = noAnimate ? '0s' : this.rotationTime;
                            __classPrivateFieldGet(this, _SectoredWheelElement_wheel, "f").style.transitionTimingFunction = 'cubic-bezier(0.25, 1, 0.5, 1)';
                            __classPrivateFieldGet(this, _SectoredWheelElement_wheel, "f").style.transform = `rotate(${__classPrivateFieldGet(this, _SectoredWheelElement_rotation, "f") + __classPrivateFieldGet(this, _SectoredWheelElement_toRad, "f").call(this, this.azimuth)}rad)`;
                        }
                    });
                });
            }
        };
        this.spin = () => {
            if (!__classPrivateFieldGet(this, _SectoredWheelElement_wheel, "f") || this.inSpinning) {
                return;
            }
            __classPrivateFieldGet(this, _SectoredWheelElement_unselectItems, "f").call(this);
            const actualAngle = __classPrivateFieldGet(this, _SectoredWheelElement_getActualAngle, "f").call(this);
            __classPrivateFieldGet(this, _SectoredWheelElement_wheel, "f").style.transitionDuration = '0s';
            __classPrivateFieldGet(this, _SectoredWheelElement_wheel, "f").style.transform = 'none';
            __classPrivateFieldGet(this, _SectoredWheelElement_wheel, "f").style.transitionTimingFunction = 'linear';
            __classPrivateFieldGet(this, _SectoredWheelElement_wheel, "f").style.setProperty('--spin-angle', `${actualAngle}rad`);
            __classPrivateFieldGet(this, _SectoredWheelElement_wheel, "f").style.animation = `calc(${this.rotationTime} / ${this.rotationAcceleration} * 0.1) linear infinite ${__classPrivateFieldGet(this, _SectoredWheelElement_direction, "f") === 'acw' ? 'reverse' : ''} spin`;
        };
        this.realign = debounceCallback((redrawOnly) => {
            var _a;
            if (!redrawOnly) {
                __classPrivateFieldSet(this, _SectoredWheelElement_items, Array.from(this.querySelectorAll('sectored-wheel-item')), "f");
            }
            const angle = PI2 / __classPrivateFieldGet(this, _SectoredWheelElement_items, "f").length;
            if (__classPrivateFieldGet(this, _SectoredWheelElement_canvas, "f") && __classPrivateFieldGet(this, _SectoredWheelElement_ctx, "f")) {
                const width = __classPrivateFieldGet(this, _SectoredWheelElement_canvas, "f").clientWidth;
                const height = __classPrivateFieldGet(this, _SectoredWheelElement_canvas, "f").clientHeight;
                const x = width / 2;
                const y = height / 2;
                const offset = -angle / 2;
                const radius = Math.max(width, height) / 2;
                __classPrivateFieldGet(this, _SectoredWheelElement_canvas, "f").width = width;
                __classPrivateFieldGet(this, _SectoredWheelElement_canvas, "f").height = height;
                for (let i = 0; i < __classPrivateFieldGet(this, _SectoredWheelElement_items, "f").length; i++) {
                    __classPrivateFieldGet(this, _SectoredWheelElement_ctx, "f").beginPath();
                    __classPrivateFieldGet(this, _SectoredWheelElement_ctx, "f").moveTo(x, y);
                    __classPrivateFieldGet(this, _SectoredWheelElement_ctx, "f").arc(x, y, radius - this.padding - (this.stroke ? this.stroke / 2 : 0), offset + angle * i, offset + angle * (i + 1));
                    __classPrivateFieldGet(this, _SectoredWheelElement_ctx, "f").lineTo(x, y);
                    __classPrivateFieldGet(this, _SectoredWheelElement_ctx, "f").fillStyle = __classPrivateFieldGet(this, _SectoredWheelElement_items, "f")[i].getAttribute('color') || __classPrivateFieldGet(this, _SectoredWheelElement_colors, "f")[i % __classPrivateFieldGet(this, _SectoredWheelElement_colors, "f").length];
                    __classPrivateFieldGet(this, _SectoredWheelElement_ctx, "f").fill();
                    if (this.stroke) {
                        __classPrivateFieldGet(this, _SectoredWheelElement_ctx, "f").lineWidth = this.stroke;
                        __classPrivateFieldGet(this, _SectoredWheelElement_ctx, "f").strokeStyle = this.strokeColor;
                        __classPrivateFieldGet(this, _SectoredWheelElement_ctx, "f").stroke();
                    }
                }
            }
            if (!__classPrivateFieldGet(this, _SectoredWheelElement_items, "f")[this.index]) {
                this.index = -1;
                __classPrivateFieldGet(this, _SectoredWheelElement_unselectItems, "f").call(this);
            }
            if (!redrawOnly && __classPrivateFieldGet(this, _SectoredWheelElement_wheel, "f")) {
                __classPrivateFieldGet(this, _SectoredWheelElement_wheel, "f").style.setProperty('--count', String(__classPrivateFieldGet(this, _SectoredWheelElement_items, "f").length));
                __classPrivateFieldGet(this, _SectoredWheelElement_wheel, "f").style.setProperty('--sector-height', `calc(${Math.PI} * ${this.size} / ${__classPrivateFieldGet(this, _SectoredWheelElement_items, "f").length})`);
                __classPrivateFieldGet(this, _SectoredWheelElement_wheel, "f").style.setProperty('--sector-width', `calc(${this.size} / 2)`);
                __classPrivateFieldGet(this, _SectoredWheelElement_wheel, "f").style.setProperty('--sector-angle', `${angle}rad`);
                __classPrivateFieldGet(this, _SectoredWheelElement_items, "f").forEach((el, i) => {
                    el.style.transform = `rotate(${angle * i}rad)`;
                });
                this.rotate(this.index, this.index, true, true);
            }
            if (__classPrivateFieldGet(this, _SectoredWheelElement_init, "f")) {
                __classPrivateFieldGet(this, _SectoredWheelElement_items, "f").forEach((el) => el.classList.remove('preselected'));
                (_a = __classPrivateFieldGet(this, _SectoredWheelElement_items, "f")[this.index]) === null || _a === void 0 ? void 0 : _a.classList.add('preselected');
                __classPrivateFieldSet(this, _SectoredWheelElement_init, false, "f");
                this.style.opacity = '1';
            }
        }, 100);
        this.setIndexAsync = async (promiseOrIndex, minSpinTime = 0) => {
            this.spin();
            try {
                this.index = await timedPromise(promiseOrIndex, minSpinTime);
            }
            catch (error) {
                this.index = -1;
                console === null || console === void 0 ? void 0 : console.error(error);
            }
        };
        _SectoredWheelElement_index.set(this, -1);
        _SectoredWheelElement_size.set(this, MIN_WHEEL_SIZE);
        _SectoredWheelElement_colors.set(this, []);
        _SectoredWheelElement_stroke.set(this, 0);
        _SectoredWheelElement_strokeColor.set(this, 'transparent');
        _SectoredWheelElement_padding.set(this, 0);
        _SectoredWheelElement_azimuth.set(this, '0deg');
        _SectoredWheelElement_direction.set(this, 'acw');
        _SectoredWheelElement_rotationAcceleration.set(this, 1);
        _SectoredWheelElement_rotationTime.set(this, '5s');
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
            'rotation-time',
        ];
    }
    attributeChangedCallback(attributeName, oldValue, newValue) {
        if (attributeName === 'index' || oldValue !== newValue) {
            const key = attributeName.replace(/-+[a-z]/g, (v) => v[v.length - 1].toUpperCase());
            this[key] = newValue;
        }
    }
    set index(v) {
        if (typeof v === 'string') {
            v = parseInt(v || '0', 10);
        }
        if (v >= -1) {
            const newIndex = Math.max(v, -1);
            this.rotate(__classPrivateFieldGet(this, _SectoredWheelElement_index, "f"), newIndex);
            __classPrivateFieldSet(this, _SectoredWheelElement_index, newIndex, "f");
        }
    }
    get index() {
        return __classPrivateFieldGet(this, _SectoredWheelElement_index, "f");
    }
    set size(v) {
        __classPrivateFieldSet(this, _SectoredWheelElement_size, v || MIN_WHEEL_SIZE, "f");
        this.style.width = __classPrivateFieldGet(this, _SectoredWheelElement_size, "f");
        this.style.height = __classPrivateFieldGet(this, _SectoredWheelElement_size, "f");
        this.realign();
    }
    get size() {
        return __classPrivateFieldGet(this, _SectoredWheelElement_size, "f");
    }
    set colors(v) {
        if (Array.isArray(v)) {
            __classPrivateFieldSet(this, _SectoredWheelElement_colors, v, "f");
        }
        else {
            __classPrivateFieldSet(this, _SectoredWheelElement_colors, String(v)
                .split(/\s*[;|]+\s*/)
                .filter(Boolean), "f");
        }
        this.realign(true);
    }
    get colors() {
        return __classPrivateFieldGet(this, _SectoredWheelElement_colors, "f");
    }
    set stroke(v) {
        if (typeof v === 'string') {
            v = parseInt(v || '0', 10);
        }
        __classPrivateFieldSet(this, _SectoredWheelElement_stroke, Math.max(v, 0), "f");
        this.realign(true);
    }
    get stroke() {
        return __classPrivateFieldGet(this, _SectoredWheelElement_stroke, "f");
    }
    set strokeColor(v) {
        __classPrivateFieldSet(this, _SectoredWheelElement_strokeColor, v || 'transparent', "f");
        this.realign(true);
    }
    get strokeColor() {
        return __classPrivateFieldGet(this, _SectoredWheelElement_strokeColor, "f");
    }
    set padding(v) {
        if (typeof v === 'string') {
            v = parseInt(v || '0', 10);
        }
        __classPrivateFieldSet(this, _SectoredWheelElement_padding, Math.max(v, 0), "f");
        this.realign(true);
    }
    get padding() {
        return __classPrivateFieldGet(this, _SectoredWheelElement_padding, "f");
    }
    set azimuth(v) {
        __classPrivateFieldSet(this, _SectoredWheelElement_azimuth, v, "f");
    }
    get azimuth() {
        return __classPrivateFieldGet(this, _SectoredWheelElement_azimuth, "f");
    }
    set direction(v) {
        __classPrivateFieldSet(this, _SectoredWheelElement_direction, ['acw', 'cw'].includes(v) ? v : 'acw', "f");
    }
    get direction() {
        return __classPrivateFieldGet(this, _SectoredWheelElement_direction, "f");
    }
    set rotationAcceleration(v) {
        if (typeof v === 'string') {
            v = parseInt(v || '1', 10);
        }
        __classPrivateFieldSet(this, _SectoredWheelElement_rotationAcceleration, Math.max(v, 1), "f");
    }
    get rotationAcceleration() {
        return __classPrivateFieldGet(this, _SectoredWheelElement_rotationAcceleration, "f");
    }
    set rotationTime(v) {
        __classPrivateFieldSet(this, _SectoredWheelElement_rotationTime, v || '5s', "f");
    }
    get rotationTime() {
        return __classPrivateFieldGet(this, _SectoredWheelElement_rotationTime, "f");
    }
    get inRotation() {
        if (__classPrivateFieldGet(this, _SectoredWheelElement_wheel, "f")) {
            return !!parseFloat(__classPrivateFieldGet(this, _SectoredWheelElement_wheel, "f").style.transitionDuration);
        }
        return false;
    }
    get inSpinning() {
        if (__classPrivateFieldGet(this, _SectoredWheelElement_wheel, "f")) {
            return !!__classPrivateFieldGet(this, _SectoredWheelElement_wheel, "f").style.animation;
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
            __classPrivateFieldSet(this, _SectoredWheelElement_wheel, this.shadow.querySelector(':host > div'), "f");
            if (__classPrivateFieldGet(this, _SectoredWheelElement_wheel, "f")) {
                __classPrivateFieldSet(this, _SectoredWheelElement_canvas, __classPrivateFieldGet(this, _SectoredWheelElement_wheel, "f").querySelector('canvas'), "f");
                if (__classPrivateFieldGet(this, _SectoredWheelElement_canvas, "f")) {
                    __classPrivateFieldSet(this, _SectoredWheelElement_ctx, __classPrivateFieldGet(this, _SectoredWheelElement_canvas, "f").getContext('2d'), "f");
                    __classPrivateFieldSet(this, _SectoredWheelElement_observer, new MutationObserver(() => this.realign()), "f");
                    __classPrivateFieldGet(this, _SectoredWheelElement_observer, "f").observe(this, { childList: true });
                    __classPrivateFieldGet(this, _SectoredWheelElement_wheel, "f").addEventListener('transitionend', () => {
                        var _a;
                        __classPrivateFieldGet(this, _SectoredWheelElement_wheel, "f") && (__classPrivateFieldGet(this, _SectoredWheelElement_wheel, "f").style.transitionDuration = '0s');
                        if (this.inSpinning) {
                            return;
                        }
                        if (!__classPrivateFieldGet(this, _SectoredWheelElement_init, "f") && !this.inSpinning) {
                            this.emit('change', this.index);
                            (_a = __classPrivateFieldGet(this, _SectoredWheelElement_items, "f")[this.index]) === null || _a === void 0 ? void 0 : _a.classList.add('selected');
                        }
                    });
                    this.realign();
                }
            }
        }
    }
    onDisconnect() {
        if (__classPrivateFieldGet(this, _SectoredWheelElement_observer, "f")) {
            __classPrivateFieldGet(this, _SectoredWheelElement_observer, "f").disconnect();
        }
        super.onDisconnect();
    }
}
_SectoredWheelElement_observer = new WeakMap(), _SectoredWheelElement_wheel = new WeakMap(), _SectoredWheelElement_canvas = new WeakMap(), _SectoredWheelElement_ctx = new WeakMap(), _SectoredWheelElement_rotation = new WeakMap(), _SectoredWheelElement_init = new WeakMap(), _SectoredWheelElement_items = new WeakMap(), _SectoredWheelElement_toRad = new WeakMap(), _SectoredWheelElement_getActualAngle = new WeakMap(), _SectoredWheelElement_getRotationFromIndex = new WeakMap(), _SectoredWheelElement_getRotationFromAngle = new WeakMap(), _SectoredWheelElement_unselectItems = new WeakMap(), _SectoredWheelElement_index = new WeakMap(), _SectoredWheelElement_size = new WeakMap(), _SectoredWheelElement_colors = new WeakMap(), _SectoredWheelElement_stroke = new WeakMap(), _SectoredWheelElement_strokeColor = new WeakMap(), _SectoredWheelElement_padding = new WeakMap(), _SectoredWheelElement_azimuth = new WeakMap(), _SectoredWheelElement_direction = new WeakMap(), _SectoredWheelElement_rotationAcceleration = new WeakMap(), _SectoredWheelElement_rotationTime = new WeakMap();
if (!window.customElements.get('sectored-wheel')) {
    window.SectoredWheelElement = SectoredWheelElement;
    window.customElements.define('sectored-wheel', SectoredWheelElement);
}
