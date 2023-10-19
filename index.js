const itemsGenerator = function* (list) {
    let i = 0;
    while (true) {
        if (i >= list.length) {
            i = 0;
        }
        yield list[i];
        i++;
    }
};

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
                //const result = func.call(this, event);
                if (typeof result === 'function') {
                    // result.call(this, event);
                }
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
                counter-increment: section;
                display: flex;
                flex-direction: row;
                justify-content: flex-end;
                align-items: center;
                padding-right: calc(var(--radius) * 0.15);
                box-sizing: border-box;
                position: absolute;
                color: #000;
                left: 50%;
                width: var(--radius);
                height: var(--sector-height);
                font-size: calc(var(--sector-height) * 0.2);
                font-weight: bold;
                font-family: sans-serif;
                text-transform: uppercase;
                transform-origin: 0 50%;
                z-index: 1;
            }
            :host::before {
                --width: calc(var(--radius) / 15);
                --border: calc(var(--width) / 4);
                content: "";
                width: var(--width);
                aspect-ratio: 1/1;
                position: absolute;
                right: 0;
                transform-origin: calc((var(--radius) - var(--width) * 1.5) * -1) 0;
                transform: rotate(calc(var(--sector-angle) / 2));
                border-radius: 50%;
                box-shadow:
                    inset rgba(0,0,0,0.1) 0 0 0 var(--border),
                    inset var(--rim-color) 0 0 0 var(--width),
                    rgba(0,0,0,0.1) calc(var(--border) * -1) 0 0 0;
            }
        </style><slot class="sector"></slot>`;

        this.shadow.appendChild(template.content);
        this.#slot = this.shadow.querySelector('slot.sector');
    }
}

if (!window.customElements.get('sectored-wheel-item')) {
    window.SectorElement = SectoredWheelItemElement;
    window.customElements.define('sectored-wheel-item', SectoredWheelItemElement);
}

class SectoredWheelElement extends CustomElement {
    #observer;
    #slot;
    #rotation = 0;
    #index = 0;
    #sectorsCount = 0;
    #init = true;

    #colors = [];
    #colorsGenerator = itemsGenerator([]);
    #rimColor;
    #size;

    realign = () => {
        const gradient = [];
        const items = this.querySelectorAll('sectored-wheel-item');
        this.#sectorsCount = items.length;
        this.style.setProperty('--sectors-count', this.#sectorsCount);

        for (let i = 0; i < this.#sectorsCount; i++) {
            gradient.push(`var(${this.#colorsGenerator.next().value}) calc(var(--sector-angle) * ${i}) calc(var(--sector-angle) * ${i + 1})`);
        }
        this.#slot.style.background = `conic-gradient(from calc(90deg - var(--sector-angle) / 2), ${gradient.join(', ')})`;

        items.forEach((el,  i) => {
            el.style.transform = `rotate(calc(var(--sector-angle) * ${i}))`;
        })
    }

    static get observedAttributes() {
        return ['colors', 'rim-color', 'size', 'index'];
    }

    attributeChangedCallback(attributeName, oldValue, newValue) {
        if (oldValue !== newValue) {
            switch (attributeName) {
                case 'colors':
                    this.colors = newValue;
                break;
                case 'rim-color':
                    this.rimColor = newValue;
                break;
                case 'size':
                    this.size = newValue;
                break;
            }
        }
        if (attributeName === 'index') {
            this.index = newValue;
        }
    }

    rotate(fromIndex, toIndex) {
        if (this.#sectorsCount) {
            const angle = 360 / this.#sectorsCount;
            this.#rotation -= 360 + (angle *
                (fromIndex < toIndex ?
                Math.abs(toIndex - fromIndex) :
                Math.abs((this.#sectorsCount - fromIndex) + toIndex))
            );
            this.#slot.style.transform = `rotate(${this.#rotation-90}deg)`;
        }
    }

    set index(v) {
        const newIndex= parseInt(v || 0, 10);
        if (this.#sectorsCount) {
            this.#init = false;
            this.rotate(this.#index, newIndex);
        }
        this.#index = newIndex;
    }

    get index() {
        return this.#index;
    }

    set size(v) {
        this.#size = v || '100px';
        this.style.setProperty('--radius', `calc(${v} / 2)`);
    }

    get size() {
        return this.#size;
    }

    set rimColor(v) {
        this.#rimColor = v || 'silver';
        this.style.setProperty('--rim-color', v);
    }

    get rimColor() {
        return this.#rimColor;
    }

    set colors(v) {
        if (this.#colors.length) {
            this.#colors.forEach((v, i) => {
                this.style.removeProperty(`--color${i}`);
            });
        }
        if (Array.isArray(v)) {
            this.#colors = v;
        } else {
            this.#colors = String(v).split(/\s*[;|]+\s*/).filter(Boolean);
        }
        const list = this.#colors.map((v, i) => {
            const name = `--color${i}`;
            this.style.setProperty(name, v);
            return name;
        });
        this.#colorsGenerator = itemsGenerator(list);
    }

    get colors() {
        return this.#colors;
    }

    onConnect() {
        super.onConnect();

        const template = document.createElement('template');
        template.innerHTML = `<style>
            :host {
                position: relative;
                display: inline-flex;
                justify-content: center;
                align-items: center;
                flex-grow: 0;
                flex-shrink: 0;
                user-select: none;
                min-width: 100px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.2);
                width: calc(var(--radius) * 2);
                --radius: 50px;
                --sector-height: calc((6.28 * var(--radius)) / var(--sectors-count));
                --sector-angle: calc(360deg / var(--sectors-count));
                box-shadow:
                    rgba(0,0,0,0.1) 0 0 0 calc(var(--radius) / 25);;
            }
            :host::after {
                --width: calc(var(--radius) / 6);
                --border: calc(var(--width) / 10);
                content: "";
                position: absolute;
                aspect-ratio: 1/1;
                border-radius: 50%;
                background-color: white;
                width: var(--width);
                box-shadow:
                    inset rgba(0,0,0,0.1) 0 0 0 var(--border), 
                    inset var(--rim-color) 0 0 0 calc(var(--border) * 2.5),
                    rgba(0,0,0,0.1) 0 0 0 calc(var(--border) * 2);
            }
            :host::before {
                --width: calc(var(--radius) / 6);
                --border: calc(var(--width) / 10);
                content: "";
                position: absolute;
                top: 0;
                aspect-ratio: 1/1;
                border-radius: 50% 50% 50% 20%;
                transform: translateY(-60%) rotate(-45deg);
                background-color: white;
                width: var(--width);
                z-index: 1;
                box-shadow:
                    inset rgba(0,0,0,0.1) 0 0 0 var(--border), 
                    inset var(--rim-color) 0 0 0 calc(var(--border) * 3),
                    rgba(0,0,0,0.1) 0 0 0 calc(var(--border) * 2);
            }
            :host > slot.wheel {
                position: relative;
                display: flex;
                justify-content: center;
                align-items: center;
                width: 100%;
                aspect-ratio: 1/1;
                border-radius: 50%;
                overflow: hidden;
                transform: rotate(-90deg);
                transition: transform 5s cubic-bezier(0.25, 1, 0.5, 1);
                box-shadow:
                    inset rgba(0,0,0,0.3) 0 0 0 calc(var(--radius) * 0.01),
                    inset var(--rim-color) 0 0 0 calc(var(--radius) * 0.05),
                    inset rgba(0,0,0,0.1) 0 0 0 calc(var(--radius) * 0.07);
            }
        </style><slot class="wheel"></slot>`;

        this.shadow.appendChild(template.content);
        this.#slot = this.shadow.querySelector('slot.wheel');
        this.#observer = new MutationObserver(this.realign);
        this.#observer.observe(this, { childList: true });


        this.#slot.addEventListener('transitionend', () => {
            if (!this.#init) {
                this.emit('change', this.#index);
            }
            this.#init = false;
        });

        this.realign();

        requestAnimationFrame(() => {
            this.rotate(0, this.index);
        });
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
