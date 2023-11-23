# sectored-wheel
Randomized Sectored Wheel
> No dependencies, vanilla JS, Web Component.

Demo https://oleksiy-nesterov.github.io/sectored-wheel

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
npm install git+https://github.com/oleksiy-nesterov/sectored-wheel.git#v1.0.1
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

### Props

| Prop     | Description      | Example                | Default     |
|----------|------------------|------------------------|-------------|
| index    | Selected sector  | 1                      | 0           |
| size     | Wheel size       | 200vh                  | 100px       |
| rimColor | Rim color        | red, #gold, rgb(0,0,0) | transparent |
| colors   | Sector color     | red;green;blue         | transparent |


### Integration

#### Angular
> Add CUSTOM_ELEMENTS_SCHEMA to the component
```javascript
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
    selector: 'app-my-component',
    standalone: true,
    templateUrl: './app-my.component.html',
    styleUrl: './app-my.component.scss',
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppMyComponent {
    //...
}
```

> Or add CUSTOM_ELEMENTS_SCHEMA to the module
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

> angular.json, add .js file to the script list
```
"scripts": [
    "node_modules/sectored-wheel/sectored-wheel.min.js"
]
```

### Links

CodePen Playground https://codepen.io/webmotoric/pen/JjwQeQR?editors=1001



