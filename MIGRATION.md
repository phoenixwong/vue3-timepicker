# Migrating from the vue2-timepicker for Vue 2.x

## Change From `:value` To `:modelValue`

**NOTE:** You can skip this part if you only use the standard `v-model`.

```html
<!-- Vue 2.x -->
<vue-timepicker :value="yourVar" @input="yourHandler">

<!-- Vue 3.x -->
<vue-timepicker :modelValue="yourVar" @update:modelValue="yourHandler">
```

## Class Names Changed

- Root `<span>` element class names changed. The legacy `time-picker` class is removed.
- The `<input>` class name changed to `vue__time-picker-input`. Previouly was `display-time`

```html
<!-- Vue 2.x -->
<span class="vue__time-picker time-picker">
  <input class="display-time" />
  ...
</span>

<!-- Vue 3.x -->
<span class="vue__time-picker">
  <input class="vue__time-picker-input" />
  ...
</span>
```
