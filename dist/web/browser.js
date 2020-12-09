"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("core-js/stable");
require("regenerator-runtime/runtime");
var KeyPair_1 = require("../src/KeyPair");
console.log('in browser.ts');
console.log(new KeyPair_1.KeyPair().fromRandom());
console.log(KeyPair_1.KeyPair);
//# sourceMappingURL=browser.js.map