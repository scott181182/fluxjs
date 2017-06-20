[![Build Status](https://travis-ci.org/scott181182/fluxjs.svg?branch=master)](https://travis-ci.org/scott181182/fluxjs.svg?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/scott181182/fluxjs/badge.svg?branch=master)](https://coveralls.io/github/scott181182/fluxjs?branch=master)
[![MIT license](http://img.shields.io/badge/license-MIT-brightgreen.svg)](http://opensource.org/licenses/MIT)

# Using this module in other modules

Here is a quick example of how this module can be used in other modules. The [TypeScript Module Resolution Logic](https://www.typescriptlang.org/docs/handbook/module-resolution.html) makes it quite easy. The file `src/index.ts` is a [barrel](https://basarat.gitbooks.io/typescript/content/docs/tips/barrel.html) that re-exports selected exports from other files. The _package.json_ file contains `main` attribute that points to the generated `lib/index.js` file and `typings` attribute that points to the generated `lib/index.d.ts` file.

> If you are planning to have code in multiple files (which is quite natural for a NodeJS module) that users can import, make sure you update `src/index.ts` file appropriately.


- To use the `FluxBulb` class in a TypeScript file -

```ts
import { FluxBulb } from "fluxjs";

const bulb = new FluxBulb("127.0.0.1");
bulb.turnOn();
```

- To use the `Greeter` class in a JavaScript file -

```js
const FluxBulb = require('fluxjs').FluxBulb;

const bulb = new FluxBulb("127.0.0.1");
bulb.turnOn();
```
