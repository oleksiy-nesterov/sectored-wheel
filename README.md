# sectored-wheel
Randomized Sectored Wheel
> No dependencies, vanilla JS, Web Component.

Demo / Code Example https://oleksiy-nesterov.github.io/sectored-wheel

<p align="center" width="100%">
    <img width="70%" src="https://raw.githubusercontent.com/oleksiy-nesterov/sectored-wheel/main/wheel.png" />
</p>

### Installation

```html
<script src="https://oleksiy-nesterov.github.io/sectored-wheel/dist/sectored-wheel.min.js"></script>
```
or

```
npm install sectored-wheel
```
or
```
npm install git+https://github.com/oleksiy-nesterov/sectored-wheel.git#v1.0.2
```

### Usage

```html
    <sectored-wheel
        colors="red;green;blue"
        rim-color="#ccc"
        onclick="this.index = Math.round(Math.random() * 2)"
        onchange="console.warn(this.index)"
        size="600px"
    >
        <sectored-wheel-item>1</sectored-wheel-item>
        <sectored-wheel-item>2</sectored-wheel-item>
        <sectored-wheel-item>3</sectored-wheel-item>
    </sectored-wheel>
```

```javascript

    const wheel = document.querySelector('sectored-wheel');

    wheel.onchange = () => {
        console.log(this.index);
    };
    
    wheel.index = 3;
```

### Props and Attributes

| Wheel's Props & Attributes                  | Description                                                                                         | Example               | Default     |
|---------------------------------------------|-----------------------------------------------------------------------------------------------------|-----------------------|-------------|
| index                                       | Selected sector                                                                                     | 1                     | 0           |
| size                                        | Wheel size                                                                                          | 200vh                 | 100px       |
| colors                                      | Sector color                                                                                        | red;green;blue        | transparent |
| stroke                                      | Stroke size in px                                                                                   | 10                    | 0           |
| strokeColor, stroke-color                   | Stroke color                                                                                        | red, rgba(0,0,0,0.5)  | transparent |
| padding                                     | inset padding in pixels                                                                             | 10                    | 0           |
| direction                                   | Rotate direction                                                                                    | cw, acw               | cw          |
| azimuth                                     | Wheel azimuth                                                                                       | -90deg, 0.25turn, etc | 0           |
| rotationAcceleration, rotation-acceleration | how many full rotations should be done each time                                                    | 2                     | 1           |
| rotationTime, rotation-time                 | Rotation time                                                                                       | 10s, 200ms, etc       | 5s          |
| inRotation                                  | Read Only, allow to determine the wheel rotation                                                    | true, false           | false       |
| inSpinning                                  | Read Only, allow to determine the wheel spinning                                                    | true, false           | false       |
| spin                                        | Method to make wheel infinity spinning                                                              | true, false           | false       |
| setIndexAsync                               | Method to set Index async. The first parameter is an async function which should return a new Index | true, false           | false       |

| Sector's Attributes                         | Description                                      |
|---------------------------------------------|--------------------------------------------------|
| clipping                                    | Clip content                                     |
| color                                       | Sector color                                     |

### CSS vars, which can used for custom styles

| Var                    | Description             |
|------------------------|-------------------------|
| --count                | Amount of sectors       |
| --sector-height        | Sector height           |
| --sector-width         | Sector width            |
| --sector-angle         | Stroke angle            |

### CSS classes, which can used for custom styles

| Class                            | Description                  |
|----------------------------------|------------------------------|
| sectored-wheel-item.selected     | Selected sector              |
| sectored-wheel-item.preselected  | Default (preselected) sector |

#

### Integration 

#### Angular Component Wrapper

```html
<sectored-wheel
    #wheel
    (change)="changed($event)"
    colors="#7bbbd6;#294b7b;#cae4e3"
    rim-color="#f6c946"
    size="600px"
    style="margin:20px;"
>
    <sectored-wheel-item
        *ngFor="let item of sectors; let index = index"
        (click)="click()"
    >
        {{index}}
    </sectored-wheel-item>
</sectored-wheel>
```

```javascript
import {CUSTOM_ELEMENTS_SCHEMA, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
    selector: 'app-my-component',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './my-component.component.html',
    styleUrl: './my-component.component.scss',
    schemas: [CUSTOM_ELEMENTS_SCHEMA], // Add CUSTOM_ELEMENTS_SCHEMA to the component
})
export class MyComponentComponent implements OnInit {
    @Input() count: number = 0;
    @ViewChild('wheel') wheel?: ElementRef<HTMLElement & { index: number }>;

    sectors: number[] = [];
    
    changed = (event: Event) => {
        console.log((event as CustomEvent).detail.data);
    };
    
    click = () => {
        if (this.wheel?.nativeElement) {
            this.wheel.nativeElement.index = Math.round(Math.random() * this.count);
        }
    };
    
    ngOnInit() {
        this.sectors = new Array(this.count).fill(0);
    }
}
```

Also, CUSTOM_ELEMENTS_SCHEMA can be added to the module
```javascript
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@NgModule({
    ...
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SomeModule {
    //...
}
```

Add sectored-wheel.min.js file to the script list of angular.json
```
"scripts": [
    "node_modules/sectored-wheel/dist/sectored-wheel.min.js"
]
```

#

#### React Component Wrapper
```javascript
import {useCallback, useEffect, useMemo, useRef} from 'react';
import 'sectored-wheel/dist/sectored-wheel.min.js';

export const MyComponent = ({count}: {
  count: number
}) => {
  const wheel = useRef<HTMLElement & {
    index: number
  }>(null);

  useEffect(() => {
    if (wheel.current) {
      const el = wheel.current;
      const onChange = (event: Event) => {
        const index = (event as CustomEvent).detail?.data;
        console.log(index);
      };
      el.addEventListener('change', onChange);
      return () => {
        el.removeEventListener('change', onChange);
      }
    }
  }, []);

  const sectors = useMemo(() => {
    return new Array(count).fill(0).map((_, i) => {
      return <sectored-wheel-item key={i}>{i}</sectored-wheel-item>;
    });
  }, [count]);

  const click = useCallback(() => {
    if (wheel.current) {
      wheel.current.index = Math.round(Math.random() * count);
    }
  }, [count]);

  return (
    <sectored-wheel
      ref={wheel}
      colors="#7bbbd6;#294b7b;#cae4e3"
      rim-color="#f6c946"
      size="600px"
      onClick={click}
      style={{margin: '20px'}}
    >
      {sectors}
    </sectored-wheel>
  );
}
```

 Add IntrinsicElements into *.env.d.ts
```
declare namespace JSX {
  interface IntrinsicElements {
    'sectored-wheel': any;
    'sectored-wheel-item': any;
  }
}
```

#

### Links

CodePen Playground https://codepen.io/webmotoric/pen/JjwQeQR?editors=1001
