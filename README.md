# Vue3 Timepicker [BETA]

---

The Vue 3.x version of [Vue2 Timepicker](https://phoenixwong.github.io/vue2-timepicker/)

---

A dropdown time picker (hour|minute|second) for **Vue 3.x**, with flexible time format support.

## Migration

Upgrading from the Vue 2.x version  [vue2-timepicker](https://phoenixwong.github.io/vue2-timepicker/)? Please check [MIGRATION.md](https://github.com/phoenixwong/vue3-timepicker/blob/master/MIGRATION.md) for basic guidelines.

## Dependencies

[Vue.js](http://vuejs.org/)&nbsp;&nbsp;&nbsp;![npm peer dependency version](https://img.shields.io/npm/dependency-version/vue3-timepicker/peer/vue?style=flat-square)

## Installation

```bash
yarn add vue3-timepicker
```

```bash
npm install vue3-timepicker --save
```

## Get Started

### **Step 1:** Import VueTimepicker

#### **Option A:** Import component JS and CSS

```javascript
// Main JS (in CommonJS format)
import VueTimepicker from 'vue3-timepicker'

// CSS
import 'vue3-timepicker/dist/VueTimepicker.css'
```

#### **Option B:** Choose any bundle version base on your needs

**Javascript**

```javascript
// CommonJS
import VueTimepicker from 'vue3-timepicker/dist/VueTimepicker.cjs.js'
// ESM
import VueTimepicker from 'vue3-timepicker/dist/VueTimepicker.esm.js'
// UMD (Minified)
import VueTimepicker from 'vue3-timepicker/dist/VueTimepicker.global.js'
```

**CSS**

```css
@import 'vue3-timepicker/dist/VueTimepicker.css';

/* Or, with node_module alias path like: */
@import '~vue3-timepicker/dist/VueTimepicker.css';

/*
  NOTE: the path alias to `node_modules` differs between bundlers.
  Please change the `~` to any alias that works with your environment.
 */
```

**Single File Component**

```javascript
// The *.vue file with CSS included
import VueTimepicker from 'vue3-timepicker/src/VueTimepicker.vue'
// NOTE: In some cases, it requires additional workarounds in the bundler's config
```

## More Documentation (WIP)

- Basic Usage
- Data Binding
- Advance Usage
- ...

## Live Demo (WIP)

The live Demo is still working in progress.

## License

[MIT](https://github.com/phoenixwong/vue3-timepicker/blob/master/LICENSE.md)
