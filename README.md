# sectored-wheel
Random Sectored Wheel
> No dependencies, vanilla JS


<p align="center" width="100%">
    <img width="50%" src="https://raw.githubusercontent.com/oleksiy-nesterov/sectored-wheel/main/wheel.png" />
</p>

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


