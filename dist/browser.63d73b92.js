// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"../node_modules/aes/lib/aes.js":[function(require,module,exports) {


module.exports = AES;

//@param {Array} key The key as an array of 4, 6 or 8 words.
function AES (key) {
  if (!this._tables[0][0][0]) this._precompute();
  
  var tmp, encKey, decKey;
  var sbox = this._tables[0][4];
  var decTable = this._tables[1];
  var keyLen = key.length; 
  var rcon = 1;
  
  if (keyLen !== 4 && keyLen !== 6 && keyLen !== 8) {
    throw new Error("invalid aes key size");
  }
  
  this._key = [encKey = key.slice(0), decKey = []];
  
  // schedule encryption keys
  for (var i = keyLen; i < 4 * keyLen + 28; i++) {
    tmp = encKey[i-1];
    
    // apply sbox
    if (i % keyLen === 0 || (keyLen === 8 && i % keyLen === 4)) {
      tmp = sbox[tmp >>> 24] << 24 ^ sbox[tmp >> 16 & 255]<< 16 ^ sbox[tmp >> 8 & 255] << 8 ^ sbox[tmp & 255];
      
      // shift rows and add rcon
      if (i % keyLen === 0) {
        tmp = tmp << 8 ^ tmp >>> 24 ^ rcon<<24;
        rcon = rcon << 1 ^ (rcon >> 7) * 283;
      }
    }
    
    encKey[i] = encKey[i-keyLen] ^ tmp;
  }
  
  // schedule decryption keys
  for (var j = 0; i; j++, i--) {
    tmp = encKey[j&3 ? i : i - 4];
    if (i<=4 || j<4) {
      decKey[j] = tmp;
    } else {
      decKey[j] = decTable[0][sbox[tmp>>>24      ]] ^
                  decTable[1][sbox[tmp>>16  & 255]] ^
                  decTable[2][sbox[tmp>>8   & 255]] ^
                  decTable[3][sbox[tmp      & 255]];
    }
  }
};

AES.prototype = {
  
  /**
   * Encrypt an array of 4 big-endian words.
   * @param {Array} data The plaintext.
   * @return {Array} The ciphertext.
   */
  encrypt:function (data) { return this._crypt(data, 0); },
  
  /**
   * Decrypt an array of 4 big-endian words.
   * @param {Array} data The ciphertext.
   * @return {Array} The plaintext.
   */
  decrypt:function (data) { return this._crypt(data, 1); },
  
  /**
   * The expanded S-box and inverse S-box tables.  These will be computed
   * on the client so that we don't have to send them down the wire.
   *
   * There are two tables, _tables[0] is for encryption and
   * _tables[1] is for decryption.
   *
   * The first 4 sub-tables are the expanded S-box with MixColumns.  The
   * last (_tables[01][4]) is the S-box itself.
   *
   * @private
   */
  _tables: [
    [ new Uint32Array(256), new Uint32Array(256), new Uint32Array(256), new Uint32Array(256), new Uint32Array(256) ],
    [ new Uint32Array(256), new Uint32Array(256), new Uint32Array(256), new Uint32Array(256), new Uint32Array(256) ]
  ],

  //Expand the S-box tables.
  _precompute: function () {
    var encTable = this._tables[0], decTable = this._tables[1],
       sbox = encTable[4], sboxInv = decTable[4],
       i, x, xInv, d=new Uint8Array(256), th=new Uint8Array(256), x2, x4, x8, s, tEnc, tDec;

    // Compute double and third tables
    for (i = 0; i < 256; i++) {
      th[( d[i] = i<<1 ^ (i>>7)*283 )^i]=i;
    }
   
    for (x = xInv = 0; !sbox[x]; x ^= x2 || 1, xInv = th[xInv] || 1) {
      // Compute sbox
      s = xInv ^ xInv << 1 ^ xInv << 2 ^ xInv << 3 ^ xInv << 4;
      s = s >> 8 ^ s & 255 ^ 99;
      sbox[x] = s;
      sboxInv[s] = x;
       
      // Compute MixColumns
      x8 = d[x4 = d[x2 = d[x]]];
      tDec = x8*0x1010101 ^ x4*0x10001 ^ x2*0x101 ^ x*0x1010100;
      tEnc = d[s]*0x101 ^ s*0x1010100;
       
      for (i = 0; i < 4; i++) {
        encTable[i][x] = tEnc = tEnc<<24 ^ tEnc>>>8;
        decTable[i][s] = tDec = tDec<<24 ^ tDec>>>8;
      }
    }
  },
  
  /**
   * Encryption and decryption core.
   * @param {Array} input Four words to be encrypted or decrypted.
   * @param dir The direction, 0 for encrypt and 1 for decrypt.
   * @return {Array} The four encrypted or decrypted words.
   * @private
   */
  _crypt:function (input, dir) {
    if (input.length !== 4) {
      throw new Error("invalid aes block size");
    }
    
    var key = this._key[dir],
        // state variables a,b,c,d are loaded with pre-whitened data
        a = input[0]           ^ key[0],
        b = input[dir ? 3 : 1] ^ key[1],
        c = input[2]           ^ key[2],
        d = input[dir ? 1 : 3] ^ key[3],
        a2, b2, c2,
        
        nInnerRounds = key.length/4 - 2,
        i,
        kIndex = 4,
        out = new Uint32Array(4),// <--- this is slower in Node.js, about the same in Chrome */ 
        table = this._tables[dir],
        
        // load up the tables
        t0    = table[0],
        t1    = table[1],
        t2    = table[2],
        t3    = table[3],
        sbox  = table[4];
 
    // Inner rounds.  Cribbed from OpenSSL.
    for (i = 0; i < nInnerRounds; i++) {
      a2 = t0[a>>>24] ^ t1[b>>16 & 255] ^ t2[c>>8 & 255] ^ t3[d & 255] ^ key[kIndex];
      b2 = t0[b>>>24] ^ t1[c>>16 & 255] ^ t2[d>>8 & 255] ^ t3[a & 255] ^ key[kIndex + 1];
      c2 = t0[c>>>24] ^ t1[d>>16 & 255] ^ t2[a>>8 & 255] ^ t3[b & 255] ^ key[kIndex + 2];
      d  = t0[d>>>24] ^ t1[a>>16 & 255] ^ t2[b>>8 & 255] ^ t3[c & 255] ^ key[kIndex + 3];
      kIndex += 4;
      a=a2; b=b2; c=c2;
    }
        
    // Last round.
    for (i = 0; i < 4; i++) {
      out[dir ? 3&-i : i] =
        sbox[a>>>24      ]<<24 ^ 
        sbox[b>>16  & 255]<<16 ^
        sbox[c>>8   & 255]<<8  ^
        sbox[d      & 255]     ^
        key[kIndex++];
      a2=a; a=b; b=c; c=d; d=a2;
    }
    
    return out;
  }
};

},{}],"../node_modules/parcel-bundler/src/builtins/_empty.js":[function(require,module,exports) {

},{}],"../node_modules/bsv/node_modules/bn.js/lib/bn.js":[function(require,module,exports) {
var Buffer = require("buffer").Buffer;
(function (module, exports) {
  'use strict';

  // Utils
  function assert (val, msg) {
    if (!val) throw new Error(msg || 'Assertion failed');
  }

  // Could use `inherits` module, but don't want to move from single file
  // architecture yet.
  function inherits (ctor, superCtor) {
    ctor.super_ = superCtor;
    var TempCtor = function () {};
    TempCtor.prototype = superCtor.prototype;
    ctor.prototype = new TempCtor();
    ctor.prototype.constructor = ctor;
  }

  // BN

  function BN (number, base, endian) {
    if (BN.isBN(number)) {
      return number;
    }

    this.negative = 0;
    this.words = null;
    this.length = 0;

    // Reduction context
    this.red = null;

    if (number !== null) {
      if (base === 'le' || base === 'be') {
        endian = base;
        base = 10;
      }

      this._init(number || 0, base || 10, endian || 'be');
    }
  }
  if (typeof module === 'object') {
    module.exports = BN;
  } else {
    exports.BN = BN;
  }

  BN.BN = BN;
  BN.wordSize = 26;

  var Buffer;
  try {
    Buffer = require('buffer').Buffer;
  } catch (e) {
  }

  BN.isBN = function isBN (num) {
    if (num instanceof BN) {
      return true;
    }

    return num !== null && typeof num === 'object' &&
      num.constructor.wordSize === BN.wordSize && Array.isArray(num.words);
  };

  BN.max = function max (left, right) {
    if (left.cmp(right) > 0) return left;
    return right;
  };

  BN.min = function min (left, right) {
    if (left.cmp(right) < 0) return left;
    return right;
  };

  BN.prototype._init = function init (number, base, endian) {
    if (typeof number === 'number') {
      return this._initNumber(number, base, endian);
    }

    if (typeof number === 'object') {
      return this._initArray(number, base, endian);
    }

    if (base === 'hex') {
      base = 16;
    }
    assert(base === (base | 0) && base >= 2 && base <= 36);

    number = number.toString().replace(/\s+/g, '');
    var start = 0;
    if (number[0] === '-') {
      start++;
    }

    if (base === 16) {
      this._parseHex(number, start);
    } else {
      this._parseBase(number, base, start);
    }

    if (number[0] === '-') {
      this.negative = 1;
    }

    this._strip();

    if (endian !== 'le') return;

    this._initArray(this.toArray(), base, endian);
  };

  BN.prototype._initNumber = function _initNumber (number, base, endian) {
    if (number < 0) {
      this.negative = 1;
      number = -number;
    }
    if (number < 0x4000000) {
      this.words = [number & 0x3ffffff];
      this.length = 1;
    } else if (number < 0x10000000000000) {
      this.words = [
        number & 0x3ffffff,
        (number / 0x4000000) & 0x3ffffff
      ];
      this.length = 2;
    } else {
      assert(number < 0x20000000000000); // 2 ^ 53 (unsafe)
      this.words = [
        number & 0x3ffffff,
        (number / 0x4000000) & 0x3ffffff,
        1
      ];
      this.length = 3;
    }

    if (endian !== 'le') return;

    // Reverse the bytes
    this._initArray(this.toArray(), base, endian);
  };

  BN.prototype._initArray = function _initArray (number, base, endian) {
    // Perhaps a Uint8Array
    assert(typeof number.length === 'number');
    if (number.length <= 0) {
      this.words = [0];
      this.length = 1;
      return this;
    }

    this.length = Math.ceil(number.length / 3);
    this.words = new Array(this.length);
    for (var i = 0; i < this.length; i++) {
      this.words[i] = 0;
    }

    var j, w;
    var off = 0;
    if (endian === 'be') {
      for (i = number.length - 1, j = 0; i >= 0; i -= 3) {
        w = number[i] | (number[i - 1] << 8) | (number[i - 2] << 16);
        this.words[j] |= (w << off) & 0x3ffffff;
        this.words[j + 1] = (w >>> (26 - off)) & 0x3ffffff;
        off += 24;
        if (off >= 26) {
          off -= 26;
          j++;
        }
      }
    } else if (endian === 'le') {
      for (i = 0, j = 0; i < number.length; i += 3) {
        w = number[i] | (number[i + 1] << 8) | (number[i + 2] << 16);
        this.words[j] |= (w << off) & 0x3ffffff;
        this.words[j + 1] = (w >>> (26 - off)) & 0x3ffffff;
        off += 24;
        if (off >= 26) {
          off -= 26;
          j++;
        }
      }
    }
    return this._strip();
  };

  function parseHex (str, start, end) {
    var r = 0;
    var len = Math.min(str.length, end);
    var z = 0;
    for (var i = start; i < len; i++) {
      var c = str.charCodeAt(i) - 48;

      r <<= 4;

      var b;

      // 'a' - 'f'
      if (c >= 49 && c <= 54) {
        b = c - 49 + 0xa;

      // 'A' - 'F'
      } else if (c >= 17 && c <= 22) {
        b = c - 17 + 0xa;

      // '0' - '9'
      } else {
        b = c;
      }

      r |= b;
      z |= b;
    }

    assert(!(z & 0xf0), 'Invalid character in ' + str);
    return r;
  }

  BN.prototype._parseHex = function _parseHex (number, start) {
    // Create possibly bigger array to ensure that it fits the number
    this.length = Math.ceil((number.length - start) / 6);
    this.words = new Array(this.length);
    for (var i = 0; i < this.length; i++) {
      this.words[i] = 0;
    }

    var j, w;
    // Scan 24-bit chunks and add them to the number
    var off = 0;
    for (i = number.length - 6, j = 0; i >= start; i -= 6) {
      w = parseHex(number, i, i + 6);
      this.words[j] |= (w << off) & 0x3ffffff;
      // NOTE: `0x3fffff` is intentional here, 26bits max shift + 24bit hex limb
      this.words[j + 1] |= w >>> (26 - off) & 0x3fffff;
      off += 24;
      if (off >= 26) {
        off -= 26;
        j++;
      }
    }
    if (i + 6 !== start) {
      w = parseHex(number, start, i + 6);
      this.words[j] |= (w << off) & 0x3ffffff;
      this.words[j + 1] |= w >>> (26 - off) & 0x3fffff;
    }
    this._strip();
  };

  function parseBase (str, start, end, mul) {
    var r = 0;
    var b = 0;
    var len = Math.min(str.length, end);
    for (var i = start; i < len; i++) {
      var c = str.charCodeAt(i) - 48;

      r *= mul;

      // 'a'
      if (c >= 49) {
        b = c - 49 + 0xa;

      // 'A'
      } else if (c >= 17) {
        b = c - 17 + 0xa;

      // '0' - '9'
      } else {
        b = c;
      }
      assert(c >= 0 && b < mul, 'Invalid character');
      r += b;
    }
    return r;
  }

  BN.prototype._parseBase = function _parseBase (number, base, start) {
    // Initialize as zero
    this.words = [0];
    this.length = 1;

    // Find length of limb in base
    for (var limbLen = 0, limbPow = 1; limbPow <= 0x3ffffff; limbPow *= base) {
      limbLen++;
    }
    limbLen--;
    limbPow = (limbPow / base) | 0;

    var total = number.length - start;
    var mod = total % limbLen;
    var end = Math.min(total, total - mod) + start;

    var word = 0;
    for (var i = start; i < end; i += limbLen) {
      word = parseBase(number, i, i + limbLen, base);

      this.imuln(limbPow);
      if (this.words[0] + word < 0x4000000) {
        this.words[0] += word;
      } else {
        this._iaddn(word);
      }
    }

    if (mod !== 0) {
      var pow = 1;
      word = parseBase(number, i, number.length, base);

      for (i = 0; i < mod; i++) {
        pow *= base;
      }

      this.imuln(pow);
      if (this.words[0] + word < 0x4000000) {
        this.words[0] += word;
      } else {
        this._iaddn(word);
      }
    }
  };

  BN.prototype.copy = function copy (dest) {
    dest.words = new Array(this.length);
    for (var i = 0; i < this.length; i++) {
      dest.words[i] = this.words[i];
    }
    dest.length = this.length;
    dest.negative = this.negative;
    dest.red = this.red;
  };

  function move (dest, src) {
    dest.words = src.words;
    dest.length = src.length;
    dest.negative = src.negative;
    dest.red = src.red;
  }

  BN.prototype._move = function _move (dest) {
    move(dest, this);
  };

  BN.prototype.clone = function clone () {
    var r = new BN(null);
    this.copy(r);
    return r;
  };

  BN.prototype._expand = function _expand (size) {
    while (this.length < size) {
      this.words[this.length++] = 0;
    }
    return this;
  };

  // Remove leading `0` from `this`
  BN.prototype._strip = function strip () {
    while (this.length > 1 && this.words[this.length - 1] === 0) {
      this.length--;
    }
    return this._normSign();
  };

  BN.prototype._normSign = function _normSign () {
    // -0 = 0
    if (this.length === 1 && this.words[0] === 0) {
      this.negative = 0;
    }
    return this;
  };

  // Check Symbol.for because not everywhere where Symbol defined
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol#Browser_compatibility
  if (typeof Symbol !== 'undefined' && typeof Symbol.for === 'function') {
    BN.prototype[Symbol.for('nodejs.util.inspect.custom')] = inspect;
  } else {
    BN.prototype.inspect = inspect;
  }

  function inspect () {
    return (this.red ? '<BN-R: ' : '<BN: ') + this.toString(16) + '>';
  }

  /*

  var zeros = [];
  var groupSizes = [];
  var groupBases = [];

  var s = '';
  var i = -1;
  while (++i < BN.wordSize) {
    zeros[i] = s;
    s += '0';
  }
  groupSizes[0] = 0;
  groupSizes[1] = 0;
  groupBases[0] = 0;
  groupBases[1] = 0;
  var base = 2 - 1;
  while (++base < 36 + 1) {
    var groupSize = 0;
    var groupBase = 1;
    while (groupBase < (1 << BN.wordSize) / base) {
      groupBase *= base;
      groupSize += 1;
    }
    groupSizes[base] = groupSize;
    groupBases[base] = groupBase;
  }

  */

  var zeros = [
    '',
    '0',
    '00',
    '000',
    '0000',
    '00000',
    '000000',
    '0000000',
    '00000000',
    '000000000',
    '0000000000',
    '00000000000',
    '000000000000',
    '0000000000000',
    '00000000000000',
    '000000000000000',
    '0000000000000000',
    '00000000000000000',
    '000000000000000000',
    '0000000000000000000',
    '00000000000000000000',
    '000000000000000000000',
    '0000000000000000000000',
    '00000000000000000000000',
    '000000000000000000000000',
    '0000000000000000000000000'
  ];

  var groupSizes = [
    0, 0,
    25, 16, 12, 11, 10, 9, 8,
    8, 7, 7, 7, 7, 6, 6,
    6, 6, 6, 6, 6, 5, 5,
    5, 5, 5, 5, 5, 5, 5,
    5, 5, 5, 5, 5, 5, 5
  ];

  var groupBases = [
    0, 0,
    33554432, 43046721, 16777216, 48828125, 60466176, 40353607, 16777216,
    43046721, 10000000, 19487171, 35831808, 62748517, 7529536, 11390625,
    16777216, 24137569, 34012224, 47045881, 64000000, 4084101, 5153632,
    6436343, 7962624, 9765625, 11881376, 14348907, 17210368, 20511149,
    24300000, 28629151, 33554432, 39135393, 45435424, 52521875, 60466176
  ];

  BN.prototype.toString = function toString (base, padding) {
    base = base || 10;
    padding = padding | 0 || 1;

    var out;
    if (base === 16 || base === 'hex') {
      out = '';
      var off = 0;
      var carry = 0;
      for (var i = 0; i < this.length; i++) {
        var w = this.words[i];
        var word = (((w << off) | carry) & 0xffffff).toString(16);
        carry = (w >>> (24 - off)) & 0xffffff;
        if (carry !== 0 || i !== this.length - 1) {
          out = zeros[6 - word.length] + word + out;
        } else {
          out = word + out;
        }
        off += 2;
        if (off >= 26) {
          off -= 26;
          i--;
        }
      }
      if (carry !== 0) {
        out = carry.toString(16) + out;
      }
      while (out.length % padding !== 0) {
        out = '0' + out;
      }
      if (this.negative !== 0) {
        out = '-' + out;
      }
      return out;
    }

    if (base === (base | 0) && base >= 2 && base <= 36) {
      // var groupSize = Math.floor(BN.wordSize * Math.LN2 / Math.log(base));
      var groupSize = groupSizes[base];
      // var groupBase = Math.pow(base, groupSize);
      var groupBase = groupBases[base];
      out = '';
      var c = this.clone();
      c.negative = 0;
      while (!c.isZero()) {
        var r = c.modrn(groupBase).toString(base);
        c = c.idivn(groupBase);

        if (!c.isZero()) {
          out = zeros[groupSize - r.length] + r + out;
        } else {
          out = r + out;
        }
      }
      if (this.isZero()) {
        out = '0' + out;
      }
      while (out.length % padding !== 0) {
        out = '0' + out;
      }
      if (this.negative !== 0) {
        out = '-' + out;
      }
      return out;
    }

    assert(false, 'Base should be between 2 and 36');
  };

  BN.prototype.toNumber = function toNumber () {
    var ret = this.words[0];
    if (this.length === 2) {
      ret += this.words[1] * 0x4000000;
    } else if (this.length === 3 && this.words[2] === 0x01) {
      // NOTE: at this stage it is known that the top bit is set
      ret += 0x10000000000000 + (this.words[1] * 0x4000000);
    } else if (this.length > 2) {
      assert(false, 'Number can only safely store up to 53 bits');
    }
    return (this.negative !== 0) ? -ret : ret;
  };

  BN.prototype.toJSON = function toJSON () {
    return this.toString(16, 2);
  };

  if (Buffer) {
    BN.prototype.toBuffer = function toBuffer (endian, length) {
      return this.toArrayLike(Buffer, endian, length);
    };
  }

  BN.prototype.toArray = function toArray (endian, length) {
    return this.toArrayLike(Array, endian, length);
  };

  var allocate = function allocate (ArrayType, size) {
    if (ArrayType.allocUnsafe) {
      return ArrayType.allocUnsafe(size);
    }
    return new ArrayType(size);
  };

  BN.prototype.toArrayLike = function toArrayLike (ArrayType, endian, length) {
    this._strip();

    var byteLength = this.byteLength();
    var reqLength = length || Math.max(1, byteLength);
    assert(byteLength <= reqLength, 'byte array longer than desired length');
    assert(reqLength > 0, 'Requested array length <= 0');

    var res = allocate(ArrayType, reqLength);
    var postfix = endian === 'le' ? 'LE' : 'BE';
    this['_toArrayLike' + postfix](res, byteLength);
    return res;
  };

  BN.prototype._toArrayLikeLE = function _toArrayLikeLE (res, byteLength) {
    var position = 0;
    var carry = 0;

    for (var i = 0, shift = 0; i < this.length; i++) {
      var word = (this.words[i] << shift) | carry;

      res[position++] = word & 0xff;
      if (position < res.length) {
        res[position++] = (word >> 8) & 0xff;
      }
      if (position < res.length) {
        res[position++] = (word >> 16) & 0xff;
      }

      if (shift === 6) {
        if (position < res.length) {
          res[position++] = (word >> 24) & 0xff;
        }
        carry = 0;
        shift = 0;
      } else {
        carry = word >>> 24;
        shift += 2;
      }
    }

    if (position < res.length) {
      res[position++] = carry;

      while (position < res.length) {
        res[position++] = 0;
      }
    }
  };

  BN.prototype._toArrayLikeBE = function _toArrayLikeBE (res, byteLength) {
    var position = res.length - 1;
    var carry = 0;

    for (var i = 0, shift = 0; i < this.length; i++) {
      var word = (this.words[i] << shift) | carry;

      res[position--] = word & 0xff;
      if (position >= 0) {
        res[position--] = (word >> 8) & 0xff;
      }
      if (position >= 0) {
        res[position--] = (word >> 16) & 0xff;
      }

      if (shift === 6) {
        if (position >= 0) {
          res[position--] = (word >> 24) & 0xff;
        }
        carry = 0;
        shift = 0;
      } else {
        carry = word >>> 24;
        shift += 2;
      }
    }

    if (position >= 0) {
      res[position--] = carry;

      while (position >= 0) {
        res[position--] = 0;
      }
    }
  };

  if (Math.clz32) {
    BN.prototype._countBits = function _countBits (w) {
      return 32 - Math.clz32(w);
    };
  } else {
    BN.prototype._countBits = function _countBits (w) {
      var t = w;
      var r = 0;
      if (t >= 0x1000) {
        r += 13;
        t >>>= 13;
      }
      if (t >= 0x40) {
        r += 7;
        t >>>= 7;
      }
      if (t >= 0x8) {
        r += 4;
        t >>>= 4;
      }
      if (t >= 0x02) {
        r += 2;
        t >>>= 2;
      }
      return r + t;
    };
  }

  BN.prototype._zeroBits = function _zeroBits (w) {
    // Short-cut
    if (w === 0) return 26;

    var t = w;
    var r = 0;
    if ((t & 0x1fff) === 0) {
      r += 13;
      t >>>= 13;
    }
    if ((t & 0x7f) === 0) {
      r += 7;
      t >>>= 7;
    }
    if ((t & 0xf) === 0) {
      r += 4;
      t >>>= 4;
    }
    if ((t & 0x3) === 0) {
      r += 2;
      t >>>= 2;
    }
    if ((t & 0x1) === 0) {
      r++;
    }
    return r;
  };

  // Return number of used bits in a BN
  BN.prototype.bitLength = function bitLength () {
    var w = this.words[this.length - 1];
    var hi = this._countBits(w);
    return (this.length - 1) * 26 + hi;
  };

  function toBitArray (num) {
    var w = new Array(num.bitLength());

    for (var bit = 0; bit < w.length; bit++) {
      var off = (bit / 26) | 0;
      var wbit = bit % 26;

      w[bit] = (num.words[off] >>> wbit) & 0x01;
    }

    return w;
  }

  // Number of trailing zero bits
  BN.prototype.zeroBits = function zeroBits () {
    if (this.isZero()) return 0;

    var r = 0;
    for (var i = 0; i < this.length; i++) {
      var b = this._zeroBits(this.words[i]);
      r += b;
      if (b !== 26) break;
    }
    return r;
  };

  BN.prototype.byteLength = function byteLength () {
    return Math.ceil(this.bitLength() / 8);
  };

  BN.prototype.toTwos = function toTwos (width) {
    if (this.negative !== 0) {
      return this.abs().inotn(width).iaddn(1);
    }
    return this.clone();
  };

  BN.prototype.fromTwos = function fromTwos (width) {
    if (this.testn(width - 1)) {
      return this.notn(width).iaddn(1).ineg();
    }
    return this.clone();
  };

  BN.prototype.isNeg = function isNeg () {
    return this.negative !== 0;
  };

  // Return negative clone of `this`
  BN.prototype.neg = function neg () {
    return this.clone().ineg();
  };

  BN.prototype.ineg = function ineg () {
    if (!this.isZero()) {
      this.negative ^= 1;
    }

    return this;
  };

  // Or `num` with `this` in-place
  BN.prototype.iuor = function iuor (num) {
    while (this.length < num.length) {
      this.words[this.length++] = 0;
    }

    for (var i = 0; i < num.length; i++) {
      this.words[i] = this.words[i] | num.words[i];
    }

    return this._strip();
  };

  BN.prototype.ior = function ior (num) {
    assert((this.negative | num.negative) === 0);
    return this.iuor(num);
  };

  // Or `num` with `this`
  BN.prototype.or = function or (num) {
    if (this.length > num.length) return this.clone().ior(num);
    return num.clone().ior(this);
  };

  BN.prototype.uor = function uor (num) {
    if (this.length > num.length) return this.clone().iuor(num);
    return num.clone().iuor(this);
  };

  // And `num` with `this` in-place
  BN.prototype.iuand = function iuand (num) {
    // b = min-length(num, this)
    var b;
    if (this.length > num.length) {
      b = num;
    } else {
      b = this;
    }

    for (var i = 0; i < b.length; i++) {
      this.words[i] = this.words[i] & num.words[i];
    }

    this.length = b.length;

    return this._strip();
  };

  BN.prototype.iand = function iand (num) {
    assert((this.negative | num.negative) === 0);
    return this.iuand(num);
  };

  // And `num` with `this`
  BN.prototype.and = function and (num) {
    if (this.length > num.length) return this.clone().iand(num);
    return num.clone().iand(this);
  };

  BN.prototype.uand = function uand (num) {
    if (this.length > num.length) return this.clone().iuand(num);
    return num.clone().iuand(this);
  };

  // Xor `num` with `this` in-place
  BN.prototype.iuxor = function iuxor (num) {
    // a.length > b.length
    var a;
    var b;
    if (this.length > num.length) {
      a = this;
      b = num;
    } else {
      a = num;
      b = this;
    }

    for (var i = 0; i < b.length; i++) {
      this.words[i] = a.words[i] ^ b.words[i];
    }

    if (this !== a) {
      for (; i < a.length; i++) {
        this.words[i] = a.words[i];
      }
    }

    this.length = a.length;

    return this._strip();
  };

  BN.prototype.ixor = function ixor (num) {
    assert((this.negative | num.negative) === 0);
    return this.iuxor(num);
  };

  // Xor `num` with `this`
  BN.prototype.xor = function xor (num) {
    if (this.length > num.length) return this.clone().ixor(num);
    return num.clone().ixor(this);
  };

  BN.prototype.uxor = function uxor (num) {
    if (this.length > num.length) return this.clone().iuxor(num);
    return num.clone().iuxor(this);
  };

  // Not ``this`` with ``width`` bitwidth
  BN.prototype.inotn = function inotn (width) {
    assert(typeof width === 'number' && width >= 0);

    var bytesNeeded = Math.ceil(width / 26) | 0;
    var bitsLeft = width % 26;

    // Extend the buffer with leading zeroes
    this._expand(bytesNeeded);

    if (bitsLeft > 0) {
      bytesNeeded--;
    }

    // Handle complete words
    for (var i = 0; i < bytesNeeded; i++) {
      this.words[i] = ~this.words[i] & 0x3ffffff;
    }

    // Handle the residue
    if (bitsLeft > 0) {
      this.words[i] = ~this.words[i] & (0x3ffffff >> (26 - bitsLeft));
    }

    // And remove leading zeroes
    return this._strip();
  };

  BN.prototype.notn = function notn (width) {
    return this.clone().inotn(width);
  };

  // Set `bit` of `this`
  BN.prototype.setn = function setn (bit, val) {
    assert(typeof bit === 'number' && bit >= 0);

    var off = (bit / 26) | 0;
    var wbit = bit % 26;

    this._expand(off + 1);

    if (val) {
      this.words[off] = this.words[off] | (1 << wbit);
    } else {
      this.words[off] = this.words[off] & ~(1 << wbit);
    }

    return this._strip();
  };

  // Add `num` to `this` in-place
  BN.prototype.iadd = function iadd (num) {
    var r;

    // negative + positive
    if (this.negative !== 0 && num.negative === 0) {
      this.negative = 0;
      r = this.isub(num);
      this.negative ^= 1;
      return this._normSign();

    // positive + negative
    } else if (this.negative === 0 && num.negative !== 0) {
      num.negative = 0;
      r = this.isub(num);
      num.negative = 1;
      return r._normSign();
    }

    // a.length > b.length
    var a, b;
    if (this.length > num.length) {
      a = this;
      b = num;
    } else {
      a = num;
      b = this;
    }

    var carry = 0;
    for (var i = 0; i < b.length; i++) {
      r = (a.words[i] | 0) + (b.words[i] | 0) + carry;
      this.words[i] = r & 0x3ffffff;
      carry = r >>> 26;
    }
    for (; carry !== 0 && i < a.length; i++) {
      r = (a.words[i] | 0) + carry;
      this.words[i] = r & 0x3ffffff;
      carry = r >>> 26;
    }

    this.length = a.length;
    if (carry !== 0) {
      this.words[this.length] = carry;
      this.length++;
    // Copy the rest of the words
    } else if (a !== this) {
      for (; i < a.length; i++) {
        this.words[i] = a.words[i];
      }
    }

    return this;
  };

  // Add `num` to `this`
  BN.prototype.add = function add (num) {
    var res;
    if (num.negative !== 0 && this.negative === 0) {
      num.negative = 0;
      res = this.sub(num);
      num.negative ^= 1;
      return res;
    } else if (num.negative === 0 && this.negative !== 0) {
      this.negative = 0;
      res = num.sub(this);
      this.negative = 1;
      return res;
    }

    if (this.length > num.length) return this.clone().iadd(num);

    return num.clone().iadd(this);
  };

  // Subtract `num` from `this` in-place
  BN.prototype.isub = function isub (num) {
    // this - (-num) = this + num
    if (num.negative !== 0) {
      num.negative = 0;
      var r = this.iadd(num);
      num.negative = 1;
      return r._normSign();

    // -this - num = -(this + num)
    } else if (this.negative !== 0) {
      this.negative = 0;
      this.iadd(num);
      this.negative = 1;
      return this._normSign();
    }

    // At this point both numbers are positive
    var cmp = this.cmp(num);

    // Optimization - zeroify
    if (cmp === 0) {
      this.negative = 0;
      this.length = 1;
      this.words[0] = 0;
      return this;
    }

    // a > b
    var a, b;
    if (cmp > 0) {
      a = this;
      b = num;
    } else {
      a = num;
      b = this;
    }

    var carry = 0;
    for (var i = 0; i < b.length; i++) {
      r = (a.words[i] | 0) - (b.words[i] | 0) + carry;
      carry = r >> 26;
      this.words[i] = r & 0x3ffffff;
    }
    for (; carry !== 0 && i < a.length; i++) {
      r = (a.words[i] | 0) + carry;
      carry = r >> 26;
      this.words[i] = r & 0x3ffffff;
    }

    // Copy rest of the words
    if (carry === 0 && i < a.length && a !== this) {
      for (; i < a.length; i++) {
        this.words[i] = a.words[i];
      }
    }

    this.length = Math.max(this.length, i);

    if (a !== this) {
      this.negative = 1;
    }

    return this._strip();
  };

  // Subtract `num` from `this`
  BN.prototype.sub = function sub (num) {
    return this.clone().isub(num);
  };

  function smallMulTo (self, num, out) {
    out.negative = num.negative ^ self.negative;
    var len = (self.length + num.length) | 0;
    out.length = len;
    len = (len - 1) | 0;

    // Peel one iteration (compiler can't do it, because of code complexity)
    var a = self.words[0] | 0;
    var b = num.words[0] | 0;
    var r = a * b;

    var lo = r & 0x3ffffff;
    var carry = (r / 0x4000000) | 0;
    out.words[0] = lo;

    for (var k = 1; k < len; k++) {
      // Sum all words with the same `i + j = k` and accumulate `ncarry`,
      // note that ncarry could be >= 0x3ffffff
      var ncarry = carry >>> 26;
      var rword = carry & 0x3ffffff;
      var maxJ = Math.min(k, num.length - 1);
      for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
        var i = (k - j) | 0;
        a = self.words[i] | 0;
        b = num.words[j] | 0;
        r = a * b + rword;
        ncarry += (r / 0x4000000) | 0;
        rword = r & 0x3ffffff;
      }
      out.words[k] = rword | 0;
      carry = ncarry | 0;
    }
    if (carry !== 0) {
      out.words[k] = carry | 0;
    } else {
      out.length--;
    }

    return out._strip();
  }

  // TODO(indutny): it may be reasonable to omit it for users who don't need
  // to work with 256-bit numbers, otherwise it gives 20% improvement for 256-bit
  // multiplication (like elliptic secp256k1).
  var comb10MulTo = function comb10MulTo (self, num, out) {
    var a = self.words;
    var b = num.words;
    var o = out.words;
    var c = 0;
    var lo;
    var mid;
    var hi;
    var a0 = a[0] | 0;
    var al0 = a0 & 0x1fff;
    var ah0 = a0 >>> 13;
    var a1 = a[1] | 0;
    var al1 = a1 & 0x1fff;
    var ah1 = a1 >>> 13;
    var a2 = a[2] | 0;
    var al2 = a2 & 0x1fff;
    var ah2 = a2 >>> 13;
    var a3 = a[3] | 0;
    var al3 = a3 & 0x1fff;
    var ah3 = a3 >>> 13;
    var a4 = a[4] | 0;
    var al4 = a4 & 0x1fff;
    var ah4 = a4 >>> 13;
    var a5 = a[5] | 0;
    var al5 = a5 & 0x1fff;
    var ah5 = a5 >>> 13;
    var a6 = a[6] | 0;
    var al6 = a6 & 0x1fff;
    var ah6 = a6 >>> 13;
    var a7 = a[7] | 0;
    var al7 = a7 & 0x1fff;
    var ah7 = a7 >>> 13;
    var a8 = a[8] | 0;
    var al8 = a8 & 0x1fff;
    var ah8 = a8 >>> 13;
    var a9 = a[9] | 0;
    var al9 = a9 & 0x1fff;
    var ah9 = a9 >>> 13;
    var b0 = b[0] | 0;
    var bl0 = b0 & 0x1fff;
    var bh0 = b0 >>> 13;
    var b1 = b[1] | 0;
    var bl1 = b1 & 0x1fff;
    var bh1 = b1 >>> 13;
    var b2 = b[2] | 0;
    var bl2 = b2 & 0x1fff;
    var bh2 = b2 >>> 13;
    var b3 = b[3] | 0;
    var bl3 = b3 & 0x1fff;
    var bh3 = b3 >>> 13;
    var b4 = b[4] | 0;
    var bl4 = b4 & 0x1fff;
    var bh4 = b4 >>> 13;
    var b5 = b[5] | 0;
    var bl5 = b5 & 0x1fff;
    var bh5 = b5 >>> 13;
    var b6 = b[6] | 0;
    var bl6 = b6 & 0x1fff;
    var bh6 = b6 >>> 13;
    var b7 = b[7] | 0;
    var bl7 = b7 & 0x1fff;
    var bh7 = b7 >>> 13;
    var b8 = b[8] | 0;
    var bl8 = b8 & 0x1fff;
    var bh8 = b8 >>> 13;
    var b9 = b[9] | 0;
    var bl9 = b9 & 0x1fff;
    var bh9 = b9 >>> 13;

    out.negative = self.negative ^ num.negative;
    out.length = 19;
    /* k = 0 */
    lo = Math.imul(al0, bl0);
    mid = Math.imul(al0, bh0);
    mid = (mid + Math.imul(ah0, bl0)) | 0;
    hi = Math.imul(ah0, bh0);
    var w0 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w0 >>> 26)) | 0;
    w0 &= 0x3ffffff;
    /* k = 1 */
    lo = Math.imul(al1, bl0);
    mid = Math.imul(al1, bh0);
    mid = (mid + Math.imul(ah1, bl0)) | 0;
    hi = Math.imul(ah1, bh0);
    lo = (lo + Math.imul(al0, bl1)) | 0;
    mid = (mid + Math.imul(al0, bh1)) | 0;
    mid = (mid + Math.imul(ah0, bl1)) | 0;
    hi = (hi + Math.imul(ah0, bh1)) | 0;
    var w1 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w1 >>> 26)) | 0;
    w1 &= 0x3ffffff;
    /* k = 2 */
    lo = Math.imul(al2, bl0);
    mid = Math.imul(al2, bh0);
    mid = (mid + Math.imul(ah2, bl0)) | 0;
    hi = Math.imul(ah2, bh0);
    lo = (lo + Math.imul(al1, bl1)) | 0;
    mid = (mid + Math.imul(al1, bh1)) | 0;
    mid = (mid + Math.imul(ah1, bl1)) | 0;
    hi = (hi + Math.imul(ah1, bh1)) | 0;
    lo = (lo + Math.imul(al0, bl2)) | 0;
    mid = (mid + Math.imul(al0, bh2)) | 0;
    mid = (mid + Math.imul(ah0, bl2)) | 0;
    hi = (hi + Math.imul(ah0, bh2)) | 0;
    var w2 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w2 >>> 26)) | 0;
    w2 &= 0x3ffffff;
    /* k = 3 */
    lo = Math.imul(al3, bl0);
    mid = Math.imul(al3, bh0);
    mid = (mid + Math.imul(ah3, bl0)) | 0;
    hi = Math.imul(ah3, bh0);
    lo = (lo + Math.imul(al2, bl1)) | 0;
    mid = (mid + Math.imul(al2, bh1)) | 0;
    mid = (mid + Math.imul(ah2, bl1)) | 0;
    hi = (hi + Math.imul(ah2, bh1)) | 0;
    lo = (lo + Math.imul(al1, bl2)) | 0;
    mid = (mid + Math.imul(al1, bh2)) | 0;
    mid = (mid + Math.imul(ah1, bl2)) | 0;
    hi = (hi + Math.imul(ah1, bh2)) | 0;
    lo = (lo + Math.imul(al0, bl3)) | 0;
    mid = (mid + Math.imul(al0, bh3)) | 0;
    mid = (mid + Math.imul(ah0, bl3)) | 0;
    hi = (hi + Math.imul(ah0, bh3)) | 0;
    var w3 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w3 >>> 26)) | 0;
    w3 &= 0x3ffffff;
    /* k = 4 */
    lo = Math.imul(al4, bl0);
    mid = Math.imul(al4, bh0);
    mid = (mid + Math.imul(ah4, bl0)) | 0;
    hi = Math.imul(ah4, bh0);
    lo = (lo + Math.imul(al3, bl1)) | 0;
    mid = (mid + Math.imul(al3, bh1)) | 0;
    mid = (mid + Math.imul(ah3, bl1)) | 0;
    hi = (hi + Math.imul(ah3, bh1)) | 0;
    lo = (lo + Math.imul(al2, bl2)) | 0;
    mid = (mid + Math.imul(al2, bh2)) | 0;
    mid = (mid + Math.imul(ah2, bl2)) | 0;
    hi = (hi + Math.imul(ah2, bh2)) | 0;
    lo = (lo + Math.imul(al1, bl3)) | 0;
    mid = (mid + Math.imul(al1, bh3)) | 0;
    mid = (mid + Math.imul(ah1, bl3)) | 0;
    hi = (hi + Math.imul(ah1, bh3)) | 0;
    lo = (lo + Math.imul(al0, bl4)) | 0;
    mid = (mid + Math.imul(al0, bh4)) | 0;
    mid = (mid + Math.imul(ah0, bl4)) | 0;
    hi = (hi + Math.imul(ah0, bh4)) | 0;
    var w4 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w4 >>> 26)) | 0;
    w4 &= 0x3ffffff;
    /* k = 5 */
    lo = Math.imul(al5, bl0);
    mid = Math.imul(al5, bh0);
    mid = (mid + Math.imul(ah5, bl0)) | 0;
    hi = Math.imul(ah5, bh0);
    lo = (lo + Math.imul(al4, bl1)) | 0;
    mid = (mid + Math.imul(al4, bh1)) | 0;
    mid = (mid + Math.imul(ah4, bl1)) | 0;
    hi = (hi + Math.imul(ah4, bh1)) | 0;
    lo = (lo + Math.imul(al3, bl2)) | 0;
    mid = (mid + Math.imul(al3, bh2)) | 0;
    mid = (mid + Math.imul(ah3, bl2)) | 0;
    hi = (hi + Math.imul(ah3, bh2)) | 0;
    lo = (lo + Math.imul(al2, bl3)) | 0;
    mid = (mid + Math.imul(al2, bh3)) | 0;
    mid = (mid + Math.imul(ah2, bl3)) | 0;
    hi = (hi + Math.imul(ah2, bh3)) | 0;
    lo = (lo + Math.imul(al1, bl4)) | 0;
    mid = (mid + Math.imul(al1, bh4)) | 0;
    mid = (mid + Math.imul(ah1, bl4)) | 0;
    hi = (hi + Math.imul(ah1, bh4)) | 0;
    lo = (lo + Math.imul(al0, bl5)) | 0;
    mid = (mid + Math.imul(al0, bh5)) | 0;
    mid = (mid + Math.imul(ah0, bl5)) | 0;
    hi = (hi + Math.imul(ah0, bh5)) | 0;
    var w5 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w5 >>> 26)) | 0;
    w5 &= 0x3ffffff;
    /* k = 6 */
    lo = Math.imul(al6, bl0);
    mid = Math.imul(al6, bh0);
    mid = (mid + Math.imul(ah6, bl0)) | 0;
    hi = Math.imul(ah6, bh0);
    lo = (lo + Math.imul(al5, bl1)) | 0;
    mid = (mid + Math.imul(al5, bh1)) | 0;
    mid = (mid + Math.imul(ah5, bl1)) | 0;
    hi = (hi + Math.imul(ah5, bh1)) | 0;
    lo = (lo + Math.imul(al4, bl2)) | 0;
    mid = (mid + Math.imul(al4, bh2)) | 0;
    mid = (mid + Math.imul(ah4, bl2)) | 0;
    hi = (hi + Math.imul(ah4, bh2)) | 0;
    lo = (lo + Math.imul(al3, bl3)) | 0;
    mid = (mid + Math.imul(al3, bh3)) | 0;
    mid = (mid + Math.imul(ah3, bl3)) | 0;
    hi = (hi + Math.imul(ah3, bh3)) | 0;
    lo = (lo + Math.imul(al2, bl4)) | 0;
    mid = (mid + Math.imul(al2, bh4)) | 0;
    mid = (mid + Math.imul(ah2, bl4)) | 0;
    hi = (hi + Math.imul(ah2, bh4)) | 0;
    lo = (lo + Math.imul(al1, bl5)) | 0;
    mid = (mid + Math.imul(al1, bh5)) | 0;
    mid = (mid + Math.imul(ah1, bl5)) | 0;
    hi = (hi + Math.imul(ah1, bh5)) | 0;
    lo = (lo + Math.imul(al0, bl6)) | 0;
    mid = (mid + Math.imul(al0, bh6)) | 0;
    mid = (mid + Math.imul(ah0, bl6)) | 0;
    hi = (hi + Math.imul(ah0, bh6)) | 0;
    var w6 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w6 >>> 26)) | 0;
    w6 &= 0x3ffffff;
    /* k = 7 */
    lo = Math.imul(al7, bl0);
    mid = Math.imul(al7, bh0);
    mid = (mid + Math.imul(ah7, bl0)) | 0;
    hi = Math.imul(ah7, bh0);
    lo = (lo + Math.imul(al6, bl1)) | 0;
    mid = (mid + Math.imul(al6, bh1)) | 0;
    mid = (mid + Math.imul(ah6, bl1)) | 0;
    hi = (hi + Math.imul(ah6, bh1)) | 0;
    lo = (lo + Math.imul(al5, bl2)) | 0;
    mid = (mid + Math.imul(al5, bh2)) | 0;
    mid = (mid + Math.imul(ah5, bl2)) | 0;
    hi = (hi + Math.imul(ah5, bh2)) | 0;
    lo = (lo + Math.imul(al4, bl3)) | 0;
    mid = (mid + Math.imul(al4, bh3)) | 0;
    mid = (mid + Math.imul(ah4, bl3)) | 0;
    hi = (hi + Math.imul(ah4, bh3)) | 0;
    lo = (lo + Math.imul(al3, bl4)) | 0;
    mid = (mid + Math.imul(al3, bh4)) | 0;
    mid = (mid + Math.imul(ah3, bl4)) | 0;
    hi = (hi + Math.imul(ah3, bh4)) | 0;
    lo = (lo + Math.imul(al2, bl5)) | 0;
    mid = (mid + Math.imul(al2, bh5)) | 0;
    mid = (mid + Math.imul(ah2, bl5)) | 0;
    hi = (hi + Math.imul(ah2, bh5)) | 0;
    lo = (lo + Math.imul(al1, bl6)) | 0;
    mid = (mid + Math.imul(al1, bh6)) | 0;
    mid = (mid + Math.imul(ah1, bl6)) | 0;
    hi = (hi + Math.imul(ah1, bh6)) | 0;
    lo = (lo + Math.imul(al0, bl7)) | 0;
    mid = (mid + Math.imul(al0, bh7)) | 0;
    mid = (mid + Math.imul(ah0, bl7)) | 0;
    hi = (hi + Math.imul(ah0, bh7)) | 0;
    var w7 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w7 >>> 26)) | 0;
    w7 &= 0x3ffffff;
    /* k = 8 */
    lo = Math.imul(al8, bl0);
    mid = Math.imul(al8, bh0);
    mid = (mid + Math.imul(ah8, bl0)) | 0;
    hi = Math.imul(ah8, bh0);
    lo = (lo + Math.imul(al7, bl1)) | 0;
    mid = (mid + Math.imul(al7, bh1)) | 0;
    mid = (mid + Math.imul(ah7, bl1)) | 0;
    hi = (hi + Math.imul(ah7, bh1)) | 0;
    lo = (lo + Math.imul(al6, bl2)) | 0;
    mid = (mid + Math.imul(al6, bh2)) | 0;
    mid = (mid + Math.imul(ah6, bl2)) | 0;
    hi = (hi + Math.imul(ah6, bh2)) | 0;
    lo = (lo + Math.imul(al5, bl3)) | 0;
    mid = (mid + Math.imul(al5, bh3)) | 0;
    mid = (mid + Math.imul(ah5, bl3)) | 0;
    hi = (hi + Math.imul(ah5, bh3)) | 0;
    lo = (lo + Math.imul(al4, bl4)) | 0;
    mid = (mid + Math.imul(al4, bh4)) | 0;
    mid = (mid + Math.imul(ah4, bl4)) | 0;
    hi = (hi + Math.imul(ah4, bh4)) | 0;
    lo = (lo + Math.imul(al3, bl5)) | 0;
    mid = (mid + Math.imul(al3, bh5)) | 0;
    mid = (mid + Math.imul(ah3, bl5)) | 0;
    hi = (hi + Math.imul(ah3, bh5)) | 0;
    lo = (lo + Math.imul(al2, bl6)) | 0;
    mid = (mid + Math.imul(al2, bh6)) | 0;
    mid = (mid + Math.imul(ah2, bl6)) | 0;
    hi = (hi + Math.imul(ah2, bh6)) | 0;
    lo = (lo + Math.imul(al1, bl7)) | 0;
    mid = (mid + Math.imul(al1, bh7)) | 0;
    mid = (mid + Math.imul(ah1, bl7)) | 0;
    hi = (hi + Math.imul(ah1, bh7)) | 0;
    lo = (lo + Math.imul(al0, bl8)) | 0;
    mid = (mid + Math.imul(al0, bh8)) | 0;
    mid = (mid + Math.imul(ah0, bl8)) | 0;
    hi = (hi + Math.imul(ah0, bh8)) | 0;
    var w8 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w8 >>> 26)) | 0;
    w8 &= 0x3ffffff;
    /* k = 9 */
    lo = Math.imul(al9, bl0);
    mid = Math.imul(al9, bh0);
    mid = (mid + Math.imul(ah9, bl0)) | 0;
    hi = Math.imul(ah9, bh0);
    lo = (lo + Math.imul(al8, bl1)) | 0;
    mid = (mid + Math.imul(al8, bh1)) | 0;
    mid = (mid + Math.imul(ah8, bl1)) | 0;
    hi = (hi + Math.imul(ah8, bh1)) | 0;
    lo = (lo + Math.imul(al7, bl2)) | 0;
    mid = (mid + Math.imul(al7, bh2)) | 0;
    mid = (mid + Math.imul(ah7, bl2)) | 0;
    hi = (hi + Math.imul(ah7, bh2)) | 0;
    lo = (lo + Math.imul(al6, bl3)) | 0;
    mid = (mid + Math.imul(al6, bh3)) | 0;
    mid = (mid + Math.imul(ah6, bl3)) | 0;
    hi = (hi + Math.imul(ah6, bh3)) | 0;
    lo = (lo + Math.imul(al5, bl4)) | 0;
    mid = (mid + Math.imul(al5, bh4)) | 0;
    mid = (mid + Math.imul(ah5, bl4)) | 0;
    hi = (hi + Math.imul(ah5, bh4)) | 0;
    lo = (lo + Math.imul(al4, bl5)) | 0;
    mid = (mid + Math.imul(al4, bh5)) | 0;
    mid = (mid + Math.imul(ah4, bl5)) | 0;
    hi = (hi + Math.imul(ah4, bh5)) | 0;
    lo = (lo + Math.imul(al3, bl6)) | 0;
    mid = (mid + Math.imul(al3, bh6)) | 0;
    mid = (mid + Math.imul(ah3, bl6)) | 0;
    hi = (hi + Math.imul(ah3, bh6)) | 0;
    lo = (lo + Math.imul(al2, bl7)) | 0;
    mid = (mid + Math.imul(al2, bh7)) | 0;
    mid = (mid + Math.imul(ah2, bl7)) | 0;
    hi = (hi + Math.imul(ah2, bh7)) | 0;
    lo = (lo + Math.imul(al1, bl8)) | 0;
    mid = (mid + Math.imul(al1, bh8)) | 0;
    mid = (mid + Math.imul(ah1, bl8)) | 0;
    hi = (hi + Math.imul(ah1, bh8)) | 0;
    lo = (lo + Math.imul(al0, bl9)) | 0;
    mid = (mid + Math.imul(al0, bh9)) | 0;
    mid = (mid + Math.imul(ah0, bl9)) | 0;
    hi = (hi + Math.imul(ah0, bh9)) | 0;
    var w9 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w9 >>> 26)) | 0;
    w9 &= 0x3ffffff;
    /* k = 10 */
    lo = Math.imul(al9, bl1);
    mid = Math.imul(al9, bh1);
    mid = (mid + Math.imul(ah9, bl1)) | 0;
    hi = Math.imul(ah9, bh1);
    lo = (lo + Math.imul(al8, bl2)) | 0;
    mid = (mid + Math.imul(al8, bh2)) | 0;
    mid = (mid + Math.imul(ah8, bl2)) | 0;
    hi = (hi + Math.imul(ah8, bh2)) | 0;
    lo = (lo + Math.imul(al7, bl3)) | 0;
    mid = (mid + Math.imul(al7, bh3)) | 0;
    mid = (mid + Math.imul(ah7, bl3)) | 0;
    hi = (hi + Math.imul(ah7, bh3)) | 0;
    lo = (lo + Math.imul(al6, bl4)) | 0;
    mid = (mid + Math.imul(al6, bh4)) | 0;
    mid = (mid + Math.imul(ah6, bl4)) | 0;
    hi = (hi + Math.imul(ah6, bh4)) | 0;
    lo = (lo + Math.imul(al5, bl5)) | 0;
    mid = (mid + Math.imul(al5, bh5)) | 0;
    mid = (mid + Math.imul(ah5, bl5)) | 0;
    hi = (hi + Math.imul(ah5, bh5)) | 0;
    lo = (lo + Math.imul(al4, bl6)) | 0;
    mid = (mid + Math.imul(al4, bh6)) | 0;
    mid = (mid + Math.imul(ah4, bl6)) | 0;
    hi = (hi + Math.imul(ah4, bh6)) | 0;
    lo = (lo + Math.imul(al3, bl7)) | 0;
    mid = (mid + Math.imul(al3, bh7)) | 0;
    mid = (mid + Math.imul(ah3, bl7)) | 0;
    hi = (hi + Math.imul(ah3, bh7)) | 0;
    lo = (lo + Math.imul(al2, bl8)) | 0;
    mid = (mid + Math.imul(al2, bh8)) | 0;
    mid = (mid + Math.imul(ah2, bl8)) | 0;
    hi = (hi + Math.imul(ah2, bh8)) | 0;
    lo = (lo + Math.imul(al1, bl9)) | 0;
    mid = (mid + Math.imul(al1, bh9)) | 0;
    mid = (mid + Math.imul(ah1, bl9)) | 0;
    hi = (hi + Math.imul(ah1, bh9)) | 0;
    var w10 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w10 >>> 26)) | 0;
    w10 &= 0x3ffffff;
    /* k = 11 */
    lo = Math.imul(al9, bl2);
    mid = Math.imul(al9, bh2);
    mid = (mid + Math.imul(ah9, bl2)) | 0;
    hi = Math.imul(ah9, bh2);
    lo = (lo + Math.imul(al8, bl3)) | 0;
    mid = (mid + Math.imul(al8, bh3)) | 0;
    mid = (mid + Math.imul(ah8, bl3)) | 0;
    hi = (hi + Math.imul(ah8, bh3)) | 0;
    lo = (lo + Math.imul(al7, bl4)) | 0;
    mid = (mid + Math.imul(al7, bh4)) | 0;
    mid = (mid + Math.imul(ah7, bl4)) | 0;
    hi = (hi + Math.imul(ah7, bh4)) | 0;
    lo = (lo + Math.imul(al6, bl5)) | 0;
    mid = (mid + Math.imul(al6, bh5)) | 0;
    mid = (mid + Math.imul(ah6, bl5)) | 0;
    hi = (hi + Math.imul(ah6, bh5)) | 0;
    lo = (lo + Math.imul(al5, bl6)) | 0;
    mid = (mid + Math.imul(al5, bh6)) | 0;
    mid = (mid + Math.imul(ah5, bl6)) | 0;
    hi = (hi + Math.imul(ah5, bh6)) | 0;
    lo = (lo + Math.imul(al4, bl7)) | 0;
    mid = (mid + Math.imul(al4, bh7)) | 0;
    mid = (mid + Math.imul(ah4, bl7)) | 0;
    hi = (hi + Math.imul(ah4, bh7)) | 0;
    lo = (lo + Math.imul(al3, bl8)) | 0;
    mid = (mid + Math.imul(al3, bh8)) | 0;
    mid = (mid + Math.imul(ah3, bl8)) | 0;
    hi = (hi + Math.imul(ah3, bh8)) | 0;
    lo = (lo + Math.imul(al2, bl9)) | 0;
    mid = (mid + Math.imul(al2, bh9)) | 0;
    mid = (mid + Math.imul(ah2, bl9)) | 0;
    hi = (hi + Math.imul(ah2, bh9)) | 0;
    var w11 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w11 >>> 26)) | 0;
    w11 &= 0x3ffffff;
    /* k = 12 */
    lo = Math.imul(al9, bl3);
    mid = Math.imul(al9, bh3);
    mid = (mid + Math.imul(ah9, bl3)) | 0;
    hi = Math.imul(ah9, bh3);
    lo = (lo + Math.imul(al8, bl4)) | 0;
    mid = (mid + Math.imul(al8, bh4)) | 0;
    mid = (mid + Math.imul(ah8, bl4)) | 0;
    hi = (hi + Math.imul(ah8, bh4)) | 0;
    lo = (lo + Math.imul(al7, bl5)) | 0;
    mid = (mid + Math.imul(al7, bh5)) | 0;
    mid = (mid + Math.imul(ah7, bl5)) | 0;
    hi = (hi + Math.imul(ah7, bh5)) | 0;
    lo = (lo + Math.imul(al6, bl6)) | 0;
    mid = (mid + Math.imul(al6, bh6)) | 0;
    mid = (mid + Math.imul(ah6, bl6)) | 0;
    hi = (hi + Math.imul(ah6, bh6)) | 0;
    lo = (lo + Math.imul(al5, bl7)) | 0;
    mid = (mid + Math.imul(al5, bh7)) | 0;
    mid = (mid + Math.imul(ah5, bl7)) | 0;
    hi = (hi + Math.imul(ah5, bh7)) | 0;
    lo = (lo + Math.imul(al4, bl8)) | 0;
    mid = (mid + Math.imul(al4, bh8)) | 0;
    mid = (mid + Math.imul(ah4, bl8)) | 0;
    hi = (hi + Math.imul(ah4, bh8)) | 0;
    lo = (lo + Math.imul(al3, bl9)) | 0;
    mid = (mid + Math.imul(al3, bh9)) | 0;
    mid = (mid + Math.imul(ah3, bl9)) | 0;
    hi = (hi + Math.imul(ah3, bh9)) | 0;
    var w12 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w12 >>> 26)) | 0;
    w12 &= 0x3ffffff;
    /* k = 13 */
    lo = Math.imul(al9, bl4);
    mid = Math.imul(al9, bh4);
    mid = (mid + Math.imul(ah9, bl4)) | 0;
    hi = Math.imul(ah9, bh4);
    lo = (lo + Math.imul(al8, bl5)) | 0;
    mid = (mid + Math.imul(al8, bh5)) | 0;
    mid = (mid + Math.imul(ah8, bl5)) | 0;
    hi = (hi + Math.imul(ah8, bh5)) | 0;
    lo = (lo + Math.imul(al7, bl6)) | 0;
    mid = (mid + Math.imul(al7, bh6)) | 0;
    mid = (mid + Math.imul(ah7, bl6)) | 0;
    hi = (hi + Math.imul(ah7, bh6)) | 0;
    lo = (lo + Math.imul(al6, bl7)) | 0;
    mid = (mid + Math.imul(al6, bh7)) | 0;
    mid = (mid + Math.imul(ah6, bl7)) | 0;
    hi = (hi + Math.imul(ah6, bh7)) | 0;
    lo = (lo + Math.imul(al5, bl8)) | 0;
    mid = (mid + Math.imul(al5, bh8)) | 0;
    mid = (mid + Math.imul(ah5, bl8)) | 0;
    hi = (hi + Math.imul(ah5, bh8)) | 0;
    lo = (lo + Math.imul(al4, bl9)) | 0;
    mid = (mid + Math.imul(al4, bh9)) | 0;
    mid = (mid + Math.imul(ah4, bl9)) | 0;
    hi = (hi + Math.imul(ah4, bh9)) | 0;
    var w13 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w13 >>> 26)) | 0;
    w13 &= 0x3ffffff;
    /* k = 14 */
    lo = Math.imul(al9, bl5);
    mid = Math.imul(al9, bh5);
    mid = (mid + Math.imul(ah9, bl5)) | 0;
    hi = Math.imul(ah9, bh5);
    lo = (lo + Math.imul(al8, bl6)) | 0;
    mid = (mid + Math.imul(al8, bh6)) | 0;
    mid = (mid + Math.imul(ah8, bl6)) | 0;
    hi = (hi + Math.imul(ah8, bh6)) | 0;
    lo = (lo + Math.imul(al7, bl7)) | 0;
    mid = (mid + Math.imul(al7, bh7)) | 0;
    mid = (mid + Math.imul(ah7, bl7)) | 0;
    hi = (hi + Math.imul(ah7, bh7)) | 0;
    lo = (lo + Math.imul(al6, bl8)) | 0;
    mid = (mid + Math.imul(al6, bh8)) | 0;
    mid = (mid + Math.imul(ah6, bl8)) | 0;
    hi = (hi + Math.imul(ah6, bh8)) | 0;
    lo = (lo + Math.imul(al5, bl9)) | 0;
    mid = (mid + Math.imul(al5, bh9)) | 0;
    mid = (mid + Math.imul(ah5, bl9)) | 0;
    hi = (hi + Math.imul(ah5, bh9)) | 0;
    var w14 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w14 >>> 26)) | 0;
    w14 &= 0x3ffffff;
    /* k = 15 */
    lo = Math.imul(al9, bl6);
    mid = Math.imul(al9, bh6);
    mid = (mid + Math.imul(ah9, bl6)) | 0;
    hi = Math.imul(ah9, bh6);
    lo = (lo + Math.imul(al8, bl7)) | 0;
    mid = (mid + Math.imul(al8, bh7)) | 0;
    mid = (mid + Math.imul(ah8, bl7)) | 0;
    hi = (hi + Math.imul(ah8, bh7)) | 0;
    lo = (lo + Math.imul(al7, bl8)) | 0;
    mid = (mid + Math.imul(al7, bh8)) | 0;
    mid = (mid + Math.imul(ah7, bl8)) | 0;
    hi = (hi + Math.imul(ah7, bh8)) | 0;
    lo = (lo + Math.imul(al6, bl9)) | 0;
    mid = (mid + Math.imul(al6, bh9)) | 0;
    mid = (mid + Math.imul(ah6, bl9)) | 0;
    hi = (hi + Math.imul(ah6, bh9)) | 0;
    var w15 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w15 >>> 26)) | 0;
    w15 &= 0x3ffffff;
    /* k = 16 */
    lo = Math.imul(al9, bl7);
    mid = Math.imul(al9, bh7);
    mid = (mid + Math.imul(ah9, bl7)) | 0;
    hi = Math.imul(ah9, bh7);
    lo = (lo + Math.imul(al8, bl8)) | 0;
    mid = (mid + Math.imul(al8, bh8)) | 0;
    mid = (mid + Math.imul(ah8, bl8)) | 0;
    hi = (hi + Math.imul(ah8, bh8)) | 0;
    lo = (lo + Math.imul(al7, bl9)) | 0;
    mid = (mid + Math.imul(al7, bh9)) | 0;
    mid = (mid + Math.imul(ah7, bl9)) | 0;
    hi = (hi + Math.imul(ah7, bh9)) | 0;
    var w16 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w16 >>> 26)) | 0;
    w16 &= 0x3ffffff;
    /* k = 17 */
    lo = Math.imul(al9, bl8);
    mid = Math.imul(al9, bh8);
    mid = (mid + Math.imul(ah9, bl8)) | 0;
    hi = Math.imul(ah9, bh8);
    lo = (lo + Math.imul(al8, bl9)) | 0;
    mid = (mid + Math.imul(al8, bh9)) | 0;
    mid = (mid + Math.imul(ah8, bl9)) | 0;
    hi = (hi + Math.imul(ah8, bh9)) | 0;
    var w17 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w17 >>> 26)) | 0;
    w17 &= 0x3ffffff;
    /* k = 18 */
    lo = Math.imul(al9, bl9);
    mid = Math.imul(al9, bh9);
    mid = (mid + Math.imul(ah9, bl9)) | 0;
    hi = Math.imul(ah9, bh9);
    var w18 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w18 >>> 26)) | 0;
    w18 &= 0x3ffffff;
    o[0] = w0;
    o[1] = w1;
    o[2] = w2;
    o[3] = w3;
    o[4] = w4;
    o[5] = w5;
    o[6] = w6;
    o[7] = w7;
    o[8] = w8;
    o[9] = w9;
    o[10] = w10;
    o[11] = w11;
    o[12] = w12;
    o[13] = w13;
    o[14] = w14;
    o[15] = w15;
    o[16] = w16;
    o[17] = w17;
    o[18] = w18;
    if (c !== 0) {
      o[19] = c;
      out.length++;
    }
    return out;
  };

  // Polyfill comb
  if (!Math.imul) {
    comb10MulTo = smallMulTo;
  }

  function bigMulTo (self, num, out) {
    out.negative = num.negative ^ self.negative;
    out.length = self.length + num.length;

    var carry = 0;
    var hncarry = 0;
    for (var k = 0; k < out.length - 1; k++) {
      // Sum all words with the same `i + j = k` and accumulate `ncarry`,
      // note that ncarry could be >= 0x3ffffff
      var ncarry = hncarry;
      hncarry = 0;
      var rword = carry & 0x3ffffff;
      var maxJ = Math.min(k, num.length - 1);
      for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
        var i = k - j;
        var a = self.words[i] | 0;
        var b = num.words[j] | 0;
        var r = a * b;

        var lo = r & 0x3ffffff;
        ncarry = (ncarry + ((r / 0x4000000) | 0)) | 0;
        lo = (lo + rword) | 0;
        rword = lo & 0x3ffffff;
        ncarry = (ncarry + (lo >>> 26)) | 0;

        hncarry += ncarry >>> 26;
        ncarry &= 0x3ffffff;
      }
      out.words[k] = rword;
      carry = ncarry;
      ncarry = hncarry;
    }
    if (carry !== 0) {
      out.words[k] = carry;
    } else {
      out.length--;
    }

    return out._strip();
  }

  function jumboMulTo (self, num, out) {
    // Temporary disable, see https://github.com/indutny/bn.js/issues/211
    // var fftm = new FFTM();
    // return fftm.mulp(self, num, out);
    return bigMulTo(self, num, out);
  }

  BN.prototype.mulTo = function mulTo (num, out) {
    var res;
    var len = this.length + num.length;
    if (this.length === 10 && num.length === 10) {
      res = comb10MulTo(this, num, out);
    } else if (len < 63) {
      res = smallMulTo(this, num, out);
    } else if (len < 1024) {
      res = bigMulTo(this, num, out);
    } else {
      res = jumboMulTo(this, num, out);
    }

    return res;
  };

  // Cooley-Tukey algorithm for FFT
  // slightly revisited to rely on looping instead of recursion

  function FFTM (x, y) {
    this.x = x;
    this.y = y;
  }

  FFTM.prototype.makeRBT = function makeRBT (N) {
    var t = new Array(N);
    var l = BN.prototype._countBits(N) - 1;
    for (var i = 0; i < N; i++) {
      t[i] = this.revBin(i, l, N);
    }

    return t;
  };

  // Returns binary-reversed representation of `x`
  FFTM.prototype.revBin = function revBin (x, l, N) {
    if (x === 0 || x === N - 1) return x;

    var rb = 0;
    for (var i = 0; i < l; i++) {
      rb |= (x & 1) << (l - i - 1);
      x >>= 1;
    }

    return rb;
  };

  // Performs "tweedling" phase, therefore 'emulating'
  // behaviour of the recursive algorithm
  FFTM.prototype.permute = function permute (rbt, rws, iws, rtws, itws, N) {
    for (var i = 0; i < N; i++) {
      rtws[i] = rws[rbt[i]];
      itws[i] = iws[rbt[i]];
    }
  };

  FFTM.prototype.transform = function transform (rws, iws, rtws, itws, N, rbt) {
    this.permute(rbt, rws, iws, rtws, itws, N);

    for (var s = 1; s < N; s <<= 1) {
      var l = s << 1;

      var rtwdf = Math.cos(2 * Math.PI / l);
      var itwdf = Math.sin(2 * Math.PI / l);

      for (var p = 0; p < N; p += l) {
        var rtwdf_ = rtwdf;
        var itwdf_ = itwdf;

        for (var j = 0; j < s; j++) {
          var re = rtws[p + j];
          var ie = itws[p + j];

          var ro = rtws[p + j + s];
          var io = itws[p + j + s];

          var rx = rtwdf_ * ro - itwdf_ * io;

          io = rtwdf_ * io + itwdf_ * ro;
          ro = rx;

          rtws[p + j] = re + ro;
          itws[p + j] = ie + io;

          rtws[p + j + s] = re - ro;
          itws[p + j + s] = ie - io;

          /* jshint maxdepth : false */
          if (j !== l) {
            rx = rtwdf * rtwdf_ - itwdf * itwdf_;

            itwdf_ = rtwdf * itwdf_ + itwdf * rtwdf_;
            rtwdf_ = rx;
          }
        }
      }
    }
  };

  FFTM.prototype.guessLen13b = function guessLen13b (n, m) {
    var N = Math.max(m, n) | 1;
    var odd = N & 1;
    var i = 0;
    for (N = N / 2 | 0; N; N = N >>> 1) {
      i++;
    }

    return 1 << i + 1 + odd;
  };

  FFTM.prototype.conjugate = function conjugate (rws, iws, N) {
    if (N <= 1) return;

    for (var i = 0; i < N / 2; i++) {
      var t = rws[i];

      rws[i] = rws[N - i - 1];
      rws[N - i - 1] = t;

      t = iws[i];

      iws[i] = -iws[N - i - 1];
      iws[N - i - 1] = -t;
    }
  };

  FFTM.prototype.normalize13b = function normalize13b (ws, N) {
    var carry = 0;
    for (var i = 0; i < N / 2; i++) {
      var w = Math.round(ws[2 * i + 1] / N) * 0x2000 +
        Math.round(ws[2 * i] / N) +
        carry;

      ws[i] = w & 0x3ffffff;

      if (w < 0x4000000) {
        carry = 0;
      } else {
        carry = w / 0x4000000 | 0;
      }
    }

    return ws;
  };

  FFTM.prototype.convert13b = function convert13b (ws, len, rws, N) {
    var carry = 0;
    for (var i = 0; i < len; i++) {
      carry = carry + (ws[i] | 0);

      rws[2 * i] = carry & 0x1fff; carry = carry >>> 13;
      rws[2 * i + 1] = carry & 0x1fff; carry = carry >>> 13;
    }

    // Pad with zeroes
    for (i = 2 * len; i < N; ++i) {
      rws[i] = 0;
    }

    assert(carry === 0);
    assert((carry & ~0x1fff) === 0);
  };

  FFTM.prototype.stub = function stub (N) {
    var ph = new Array(N);
    for (var i = 0; i < N; i++) {
      ph[i] = 0;
    }

    return ph;
  };

  FFTM.prototype.mulp = function mulp (x, y, out) {
    var N = 2 * this.guessLen13b(x.length, y.length);

    var rbt = this.makeRBT(N);

    var _ = this.stub(N);

    var rws = new Array(N);
    var rwst = new Array(N);
    var iwst = new Array(N);

    var nrws = new Array(N);
    var nrwst = new Array(N);
    var niwst = new Array(N);

    var rmws = out.words;
    rmws.length = N;

    this.convert13b(x.words, x.length, rws, N);
    this.convert13b(y.words, y.length, nrws, N);

    this.transform(rws, _, rwst, iwst, N, rbt);
    this.transform(nrws, _, nrwst, niwst, N, rbt);

    for (var i = 0; i < N; i++) {
      var rx = rwst[i] * nrwst[i] - iwst[i] * niwst[i];
      iwst[i] = rwst[i] * niwst[i] + iwst[i] * nrwst[i];
      rwst[i] = rx;
    }

    this.conjugate(rwst, iwst, N);
    this.transform(rwst, iwst, rmws, _, N, rbt);
    this.conjugate(rmws, _, N);
    this.normalize13b(rmws, N);

    out.negative = x.negative ^ y.negative;
    out.length = x.length + y.length;
    return out._strip();
  };

  // Multiply `this` by `num`
  BN.prototype.mul = function mul (num) {
    var out = new BN(null);
    out.words = new Array(this.length + num.length);
    return this.mulTo(num, out);
  };

  // Multiply employing FFT
  BN.prototype.mulf = function mulf (num) {
    var out = new BN(null);
    out.words = new Array(this.length + num.length);
    return jumboMulTo(this, num, out);
  };

  // In-place Multiplication
  BN.prototype.imul = function imul (num) {
    return this.clone().mulTo(num, this);
  };

  BN.prototype.imuln = function imuln (num) {
    var isNegNum = num < 0;
    if (isNegNum) num = -num;

    assert(typeof num === 'number');
    assert(num < 0x4000000);

    // Carry
    var carry = 0;
    for (var i = 0; i < this.length; i++) {
      var w = (this.words[i] | 0) * num;
      var lo = (w & 0x3ffffff) + (carry & 0x3ffffff);
      carry >>= 26;
      carry += (w / 0x4000000) | 0;
      // NOTE: lo is 27bit maximum
      carry += lo >>> 26;
      this.words[i] = lo & 0x3ffffff;
    }

    if (carry !== 0) {
      this.words[i] = carry;
      this.length++;
    }

    return isNegNum ? this.ineg() : this;
  };

  BN.prototype.muln = function muln (num) {
    return this.clone().imuln(num);
  };

  // `this` * `this`
  BN.prototype.sqr = function sqr () {
    return this.mul(this);
  };

  // `this` * `this` in-place
  BN.prototype.isqr = function isqr () {
    return this.imul(this.clone());
  };

  // Math.pow(`this`, `num`)
  BN.prototype.pow = function pow (num) {
    var w = toBitArray(num);
    if (w.length === 0) return new BN(1);

    // Skip leading zeroes
    var res = this;
    for (var i = 0; i < w.length; i++, res = res.sqr()) {
      if (w[i] !== 0) break;
    }

    if (++i < w.length) {
      for (var q = res.sqr(); i < w.length; i++, q = q.sqr()) {
        if (w[i] === 0) continue;

        res = res.mul(q);
      }
    }

    return res;
  };

  // Shift-left in-place
  BN.prototype.iushln = function iushln (bits) {
    assert(typeof bits === 'number' && bits >= 0);
    var r = bits % 26;
    var s = (bits - r) / 26;
    var carryMask = (0x3ffffff >>> (26 - r)) << (26 - r);
    var i;

    if (r !== 0) {
      var carry = 0;

      for (i = 0; i < this.length; i++) {
        var newCarry = this.words[i] & carryMask;
        var c = ((this.words[i] | 0) - newCarry) << r;
        this.words[i] = c | carry;
        carry = newCarry >>> (26 - r);
      }

      if (carry) {
        this.words[i] = carry;
        this.length++;
      }
    }

    if (s !== 0) {
      for (i = this.length - 1; i >= 0; i--) {
        this.words[i + s] = this.words[i];
      }

      for (i = 0; i < s; i++) {
        this.words[i] = 0;
      }

      this.length += s;
    }

    return this._strip();
  };

  BN.prototype.ishln = function ishln (bits) {
    // TODO(indutny): implement me
    assert(this.negative === 0);
    return this.iushln(bits);
  };

  // Shift-right in-place
  // NOTE: `hint` is a lowest bit before trailing zeroes
  // NOTE: if `extended` is present - it will be filled with destroyed bits
  BN.prototype.iushrn = function iushrn (bits, hint, extended) {
    assert(typeof bits === 'number' && bits >= 0);
    var h;
    if (hint) {
      h = (hint - (hint % 26)) / 26;
    } else {
      h = 0;
    }

    var r = bits % 26;
    var s = Math.min((bits - r) / 26, this.length);
    var mask = 0x3ffffff ^ ((0x3ffffff >>> r) << r);
    var maskedWords = extended;

    h -= s;
    h = Math.max(0, h);

    // Extended mode, copy masked part
    if (maskedWords) {
      for (var i = 0; i < s; i++) {
        maskedWords.words[i] = this.words[i];
      }
      maskedWords.length = s;
    }

    if (s === 0) {
      // No-op, we should not move anything at all
    } else if (this.length > s) {
      this.length -= s;
      for (i = 0; i < this.length; i++) {
        this.words[i] = this.words[i + s];
      }
    } else {
      this.words[0] = 0;
      this.length = 1;
    }

    var carry = 0;
    for (i = this.length - 1; i >= 0 && (carry !== 0 || i >= h); i--) {
      var word = this.words[i] | 0;
      this.words[i] = (carry << (26 - r)) | (word >>> r);
      carry = word & mask;
    }

    // Push carried bits as a mask
    if (maskedWords && carry !== 0) {
      maskedWords.words[maskedWords.length++] = carry;
    }

    if (this.length === 0) {
      this.words[0] = 0;
      this.length = 1;
    }

    return this._strip();
  };

  BN.prototype.ishrn = function ishrn (bits, hint, extended) {
    // TODO(indutny): implement me
    assert(this.negative === 0);
    return this.iushrn(bits, hint, extended);
  };

  // Shift-left
  BN.prototype.shln = function shln (bits) {
    return this.clone().ishln(bits);
  };

  BN.prototype.ushln = function ushln (bits) {
    return this.clone().iushln(bits);
  };

  // Shift-right
  BN.prototype.shrn = function shrn (bits) {
    return this.clone().ishrn(bits);
  };

  BN.prototype.ushrn = function ushrn (bits) {
    return this.clone().iushrn(bits);
  };

  // Test if n bit is set
  BN.prototype.testn = function testn (bit) {
    assert(typeof bit === 'number' && bit >= 0);
    var r = bit % 26;
    var s = (bit - r) / 26;
    var q = 1 << r;

    // Fast case: bit is much higher than all existing words
    if (this.length <= s) return false;

    // Check bit and return
    var w = this.words[s];

    return !!(w & q);
  };

  // Return only lowers bits of number (in-place)
  BN.prototype.imaskn = function imaskn (bits) {
    assert(typeof bits === 'number' && bits >= 0);
    var r = bits % 26;
    var s = (bits - r) / 26;

    assert(this.negative === 0, 'imaskn works only with positive numbers');

    if (this.length <= s) {
      return this;
    }

    if (r !== 0) {
      s++;
    }
    this.length = Math.min(s, this.length);

    if (r !== 0) {
      var mask = 0x3ffffff ^ ((0x3ffffff >>> r) << r);
      this.words[this.length - 1] &= mask;
    }

    return this._strip();
  };

  // Return only lowers bits of number
  BN.prototype.maskn = function maskn (bits) {
    return this.clone().imaskn(bits);
  };

  // Add plain number `num` to `this`
  BN.prototype.iaddn = function iaddn (num) {
    assert(typeof num === 'number');
    assert(num < 0x4000000);
    if (num < 0) return this.isubn(-num);

    // Possible sign change
    if (this.negative !== 0) {
      if (this.length === 1 && (this.words[0] | 0) <= num) {
        this.words[0] = num - (this.words[0] | 0);
        this.negative = 0;
        return this;
      }

      this.negative = 0;
      this.isubn(num);
      this.negative = 1;
      return this;
    }

    // Add without checks
    return this._iaddn(num);
  };

  BN.prototype._iaddn = function _iaddn (num) {
    this.words[0] += num;

    // Carry
    for (var i = 0; i < this.length && this.words[i] >= 0x4000000; i++) {
      this.words[i] -= 0x4000000;
      if (i === this.length - 1) {
        this.words[i + 1] = 1;
      } else {
        this.words[i + 1]++;
      }
    }
    this.length = Math.max(this.length, i + 1);

    return this;
  };

  // Subtract plain number `num` from `this`
  BN.prototype.isubn = function isubn (num) {
    assert(typeof num === 'number');
    assert(num < 0x4000000);
    if (num < 0) return this.iaddn(-num);

    if (this.negative !== 0) {
      this.negative = 0;
      this.iaddn(num);
      this.negative = 1;
      return this;
    }

    this.words[0] -= num;

    if (this.length === 1 && this.words[0] < 0) {
      this.words[0] = -this.words[0];
      this.negative = 1;
    } else {
      // Carry
      for (var i = 0; i < this.length && this.words[i] < 0; i++) {
        this.words[i] += 0x4000000;
        this.words[i + 1] -= 1;
      }
    }

    return this._strip();
  };

  BN.prototype.addn = function addn (num) {
    return this.clone().iaddn(num);
  };

  BN.prototype.subn = function subn (num) {
    return this.clone().isubn(num);
  };

  BN.prototype.iabs = function iabs () {
    this.negative = 0;

    return this;
  };

  BN.prototype.abs = function abs () {
    return this.clone().iabs();
  };

  BN.prototype._ishlnsubmul = function _ishlnsubmul (num, mul, shift) {
    var len = num.length + shift;
    var i;

    this._expand(len);

    var w;
    var carry = 0;
    for (i = 0; i < num.length; i++) {
      w = (this.words[i + shift] | 0) + carry;
      var right = (num.words[i] | 0) * mul;
      w -= right & 0x3ffffff;
      carry = (w >> 26) - ((right / 0x4000000) | 0);
      this.words[i + shift] = w & 0x3ffffff;
    }
    for (; i < this.length - shift; i++) {
      w = (this.words[i + shift] | 0) + carry;
      carry = w >> 26;
      this.words[i + shift] = w & 0x3ffffff;
    }

    if (carry === 0) return this._strip();

    // Subtraction overflow
    assert(carry === -1);
    carry = 0;
    for (i = 0; i < this.length; i++) {
      w = -(this.words[i] | 0) + carry;
      carry = w >> 26;
      this.words[i] = w & 0x3ffffff;
    }
    this.negative = 1;

    return this._strip();
  };

  BN.prototype._wordDiv = function _wordDiv (num, mode) {
    var shift = this.length - num.length;

    var a = this.clone();
    var b = num;

    // Normalize
    var bhi = b.words[b.length - 1] | 0;
    var bhiBits = this._countBits(bhi);
    shift = 26 - bhiBits;
    if (shift !== 0) {
      b = b.ushln(shift);
      a.iushln(shift);
      bhi = b.words[b.length - 1] | 0;
    }

    // Initialize quotient
    var m = a.length - b.length;
    var q;

    if (mode !== 'mod') {
      q = new BN(null);
      q.length = m + 1;
      q.words = new Array(q.length);
      for (var i = 0; i < q.length; i++) {
        q.words[i] = 0;
      }
    }

    var diff = a.clone()._ishlnsubmul(b, 1, m);
    if (diff.negative === 0) {
      a = diff;
      if (q) {
        q.words[m] = 1;
      }
    }

    for (var j = m - 1; j >= 0; j--) {
      var qj = (a.words[b.length + j] | 0) * 0x4000000 +
        (a.words[b.length + j - 1] | 0);

      // NOTE: (qj / bhi) is (0x3ffffff * 0x4000000 + 0x3ffffff) / 0x2000000 max
      // (0x7ffffff)
      qj = Math.min((qj / bhi) | 0, 0x3ffffff);

      a._ishlnsubmul(b, qj, j);
      while (a.negative !== 0) {
        qj--;
        a.negative = 0;
        a._ishlnsubmul(b, 1, j);
        if (!a.isZero()) {
          a.negative ^= 1;
        }
      }
      if (q) {
        q.words[j] = qj;
      }
    }
    if (q) {
      q._strip();
    }
    a._strip();

    // Denormalize
    if (mode !== 'div' && shift !== 0) {
      a.iushrn(shift);
    }

    return {
      div: q || null,
      mod: a
    };
  };

  // NOTE: 1) `mode` can be set to `mod` to request mod only,
  //       to `div` to request div only, or be absent to
  //       request both div & mod
  //       2) `positive` is true if unsigned mod is requested
  BN.prototype.divmod = function divmod (num, mode, positive) {
    assert(!num.isZero());

    if (this.isZero()) {
      return {
        div: new BN(0),
        mod: new BN(0)
      };
    }

    var div, mod, res;
    if (this.negative !== 0 && num.negative === 0) {
      res = this.neg().divmod(num, mode);

      if (mode !== 'mod') {
        div = res.div.neg();
      }

      if (mode !== 'div') {
        mod = res.mod.neg();
        if (positive && mod.negative !== 0) {
          mod.iadd(num);
        }
      }

      return {
        div: div,
        mod: mod
      };
    }

    if (this.negative === 0 && num.negative !== 0) {
      res = this.divmod(num.neg(), mode);

      if (mode !== 'mod') {
        div = res.div.neg();
      }

      return {
        div: div,
        mod: res.mod
      };
    }

    if ((this.negative & num.negative) !== 0) {
      res = this.neg().divmod(num.neg(), mode);

      if (mode !== 'div') {
        mod = res.mod.neg();
        if (positive && mod.negative !== 0) {
          mod.isub(num);
        }
      }

      return {
        div: res.div,
        mod: mod
      };
    }

    // Both numbers are positive at this point

    // Strip both numbers to approximate shift value
    if (num.length > this.length || this.cmp(num) < 0) {
      return {
        div: new BN(0),
        mod: this
      };
    }

    // Very short reduction
    if (num.length === 1) {
      if (mode === 'div') {
        return {
          div: this.divn(num.words[0]),
          mod: null
        };
      }

      if (mode === 'mod') {
        return {
          div: null,
          mod: new BN(this.modrn(num.words[0]))
        };
      }

      return {
        div: this.divn(num.words[0]),
        mod: new BN(this.modrn(num.words[0]))
      };
    }

    return this._wordDiv(num, mode);
  };

  // Find `this` / `num`
  BN.prototype.div = function div (num) {
    return this.divmod(num, 'div', false).div;
  };

  // Find `this` % `num`
  BN.prototype.mod = function mod (num) {
    return this.divmod(num, 'mod', false).mod;
  };

  BN.prototype.umod = function umod (num) {
    return this.divmod(num, 'mod', true).mod;
  };

  // Find Round(`this` / `num`)
  BN.prototype.divRound = function divRound (num) {
    var dm = this.divmod(num);

    // Fast case - exact division
    if (dm.mod.isZero()) return dm.div;

    var mod = dm.div.negative !== 0 ? dm.mod.isub(num) : dm.mod;

    var half = num.ushrn(1);
    var r2 = num.andln(1);
    var cmp = mod.cmp(half);

    // Round down
    if (cmp < 0 || (r2 === 1 && cmp === 0)) return dm.div;

    // Round up
    return dm.div.negative !== 0 ? dm.div.isubn(1) : dm.div.iaddn(1);
  };

  BN.prototype.modrn = function modrn (num) {
    var isNegNum = num < 0;
    if (isNegNum) num = -num;

    assert(num <= 0x3ffffff);
    var p = (1 << 26) % num;

    var acc = 0;
    for (var i = this.length - 1; i >= 0; i--) {
      acc = (p * acc + (this.words[i] | 0)) % num;
    }

    return isNegNum ? -acc : acc;
  };

  // WARNING: DEPRECATED
  BN.prototype.modn = function modn (num) {
    return this.modrn(num);
  };

  // In-place division by number
  BN.prototype.idivn = function idivn (num) {
    var isNegNum = num < 0;
    if (isNegNum) num = -num;

    assert(num <= 0x3ffffff);

    var carry = 0;
    for (var i = this.length - 1; i >= 0; i--) {
      var w = (this.words[i] | 0) + carry * 0x4000000;
      this.words[i] = (w / num) | 0;
      carry = w % num;
    }

    this._strip();
    return isNegNum ? this.ineg() : this;
  };

  BN.prototype.divn = function divn (num) {
    return this.clone().idivn(num);
  };

  BN.prototype.egcd = function egcd (p) {
    assert(p.negative === 0);
    assert(!p.isZero());

    var x = this;
    var y = p.clone();

    if (x.negative !== 0) {
      x = x.umod(p);
    } else {
      x = x.clone();
    }

    // A * x + B * y = x
    var A = new BN(1);
    var B = new BN(0);

    // C * x + D * y = y
    var C = new BN(0);
    var D = new BN(1);

    var g = 0;

    while (x.isEven() && y.isEven()) {
      x.iushrn(1);
      y.iushrn(1);
      ++g;
    }

    var yp = y.clone();
    var xp = x.clone();

    while (!x.isZero()) {
      for (var i = 0, im = 1; (x.words[0] & im) === 0 && i < 26; ++i, im <<= 1);
      if (i > 0) {
        x.iushrn(i);
        while (i-- > 0) {
          if (A.isOdd() || B.isOdd()) {
            A.iadd(yp);
            B.isub(xp);
          }

          A.iushrn(1);
          B.iushrn(1);
        }
      }

      for (var j = 0, jm = 1; (y.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1);
      if (j > 0) {
        y.iushrn(j);
        while (j-- > 0) {
          if (C.isOdd() || D.isOdd()) {
            C.iadd(yp);
            D.isub(xp);
          }

          C.iushrn(1);
          D.iushrn(1);
        }
      }

      if (x.cmp(y) >= 0) {
        x.isub(y);
        A.isub(C);
        B.isub(D);
      } else {
        y.isub(x);
        C.isub(A);
        D.isub(B);
      }
    }

    return {
      a: C,
      b: D,
      gcd: y.iushln(g)
    };
  };

  // This is reduced incarnation of the binary EEA
  // above, designated to invert members of the
  // _prime_ fields F(p) at a maximal speed
  BN.prototype._invmp = function _invmp (p) {
    assert(p.negative === 0);
    assert(!p.isZero());

    var a = this;
    var b = p.clone();

    if (a.negative !== 0) {
      a = a.umod(p);
    } else {
      a = a.clone();
    }

    var x1 = new BN(1);
    var x2 = new BN(0);

    var delta = b.clone();

    while (a.cmpn(1) > 0 && b.cmpn(1) > 0) {
      for (var i = 0, im = 1; (a.words[0] & im) === 0 && i < 26; ++i, im <<= 1);
      if (i > 0) {
        a.iushrn(i);
        while (i-- > 0) {
          if (x1.isOdd()) {
            x1.iadd(delta);
          }

          x1.iushrn(1);
        }
      }

      for (var j = 0, jm = 1; (b.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1);
      if (j > 0) {
        b.iushrn(j);
        while (j-- > 0) {
          if (x2.isOdd()) {
            x2.iadd(delta);
          }

          x2.iushrn(1);
        }
      }

      if (a.cmp(b) >= 0) {
        a.isub(b);
        x1.isub(x2);
      } else {
        b.isub(a);
        x2.isub(x1);
      }
    }

    var res;
    if (a.cmpn(1) === 0) {
      res = x1;
    } else {
      res = x2;
    }

    if (res.cmpn(0) < 0) {
      res.iadd(p);
    }

    return res;
  };

  BN.prototype.gcd = function gcd (num) {
    if (this.isZero()) return num.abs();
    if (num.isZero()) return this.abs();

    var a = this.clone();
    var b = num.clone();
    a.negative = 0;
    b.negative = 0;

    // Remove common factor of two
    for (var shift = 0; a.isEven() && b.isEven(); shift++) {
      a.iushrn(1);
      b.iushrn(1);
    }

    do {
      while (a.isEven()) {
        a.iushrn(1);
      }
      while (b.isEven()) {
        b.iushrn(1);
      }

      var r = a.cmp(b);
      if (r < 0) {
        // Swap `a` and `b` to make `a` always bigger than `b`
        var t = a;
        a = b;
        b = t;
      } else if (r === 0 || b.cmpn(1) === 0) {
        break;
      }

      a.isub(b);
    } while (true);

    return b.iushln(shift);
  };

  // Invert number in the field F(num)
  BN.prototype.invm = function invm (num) {
    return this.egcd(num).a.umod(num);
  };

  BN.prototype.isEven = function isEven () {
    return (this.words[0] & 1) === 0;
  };

  BN.prototype.isOdd = function isOdd () {
    return (this.words[0] & 1) === 1;
  };

  // And first word and num
  BN.prototype.andln = function andln (num) {
    return this.words[0] & num;
  };

  // Increment at the bit position in-line
  BN.prototype.bincn = function bincn (bit) {
    assert(typeof bit === 'number');
    var r = bit % 26;
    var s = (bit - r) / 26;
    var q = 1 << r;

    // Fast case: bit is much higher than all existing words
    if (this.length <= s) {
      this._expand(s + 1);
      this.words[s] |= q;
      return this;
    }

    // Add bit and propagate, if needed
    var carry = q;
    for (var i = s; carry !== 0 && i < this.length; i++) {
      var w = this.words[i] | 0;
      w += carry;
      carry = w >>> 26;
      w &= 0x3ffffff;
      this.words[i] = w;
    }
    if (carry !== 0) {
      this.words[i] = carry;
      this.length++;
    }
    return this;
  };

  BN.prototype.isZero = function isZero () {
    return this.length === 1 && this.words[0] === 0;
  };

  BN.prototype.cmpn = function cmpn (num) {
    var negative = num < 0;

    if (this.negative !== 0 && !negative) return -1;
    if (this.negative === 0 && negative) return 1;

    this._strip();

    var res;
    if (this.length > 1) {
      res = 1;
    } else {
      if (negative) {
        num = -num;
      }

      assert(num <= 0x3ffffff, 'Number is too big');

      var w = this.words[0] | 0;
      res = w === num ? 0 : w < num ? -1 : 1;
    }
    if (this.negative !== 0) return -res | 0;
    return res;
  };

  // Compare two numbers and return:
  // 1 - if `this` > `num`
  // 0 - if `this` == `num`
  // -1 - if `this` < `num`
  BN.prototype.cmp = function cmp (num) {
    if (this.negative !== 0 && num.negative === 0) return -1;
    if (this.negative === 0 && num.negative !== 0) return 1;

    var res = this.ucmp(num);
    if (this.negative !== 0) return -res | 0;
    return res;
  };

  // Unsigned comparison
  BN.prototype.ucmp = function ucmp (num) {
    // At this point both numbers have the same sign
    if (this.length > num.length) return 1;
    if (this.length < num.length) return -1;

    var res = 0;
    for (var i = this.length - 1; i >= 0; i--) {
      var a = this.words[i] | 0;
      var b = num.words[i] | 0;

      if (a === b) continue;
      if (a < b) {
        res = -1;
      } else if (a > b) {
        res = 1;
      }
      break;
    }
    return res;
  };

  BN.prototype.gtn = function gtn (num) {
    return this.cmpn(num) === 1;
  };

  BN.prototype.gt = function gt (num) {
    return this.cmp(num) === 1;
  };

  BN.prototype.gten = function gten (num) {
    return this.cmpn(num) >= 0;
  };

  BN.prototype.gte = function gte (num) {
    return this.cmp(num) >= 0;
  };

  BN.prototype.ltn = function ltn (num) {
    return this.cmpn(num) === -1;
  };

  BN.prototype.lt = function lt (num) {
    return this.cmp(num) === -1;
  };

  BN.prototype.lten = function lten (num) {
    return this.cmpn(num) <= 0;
  };

  BN.prototype.lte = function lte (num) {
    return this.cmp(num) <= 0;
  };

  BN.prototype.eqn = function eqn (num) {
    return this.cmpn(num) === 0;
  };

  BN.prototype.eq = function eq (num) {
    return this.cmp(num) === 0;
  };

  //
  // A reduce context, could be using montgomery or something better, depending
  // on the `m` itself.
  //
  BN.red = function red (num) {
    return new Red(num);
  };

  BN.prototype.toRed = function toRed (ctx) {
    assert(!this.red, 'Already a number in reduction context');
    assert(this.negative === 0, 'red works only with positives');
    return ctx.convertTo(this)._forceRed(ctx);
  };

  BN.prototype.fromRed = function fromRed () {
    assert(this.red, 'fromRed works only with numbers in reduction context');
    return this.red.convertFrom(this);
  };

  BN.prototype._forceRed = function _forceRed (ctx) {
    this.red = ctx;
    return this;
  };

  BN.prototype.forceRed = function forceRed (ctx) {
    assert(!this.red, 'Already a number in reduction context');
    return this._forceRed(ctx);
  };

  BN.prototype.redAdd = function redAdd (num) {
    assert(this.red, 'redAdd works only with red numbers');
    return this.red.add(this, num);
  };

  BN.prototype.redIAdd = function redIAdd (num) {
    assert(this.red, 'redIAdd works only with red numbers');
    return this.red.iadd(this, num);
  };

  BN.prototype.redSub = function redSub (num) {
    assert(this.red, 'redSub works only with red numbers');
    return this.red.sub(this, num);
  };

  BN.prototype.redISub = function redISub (num) {
    assert(this.red, 'redISub works only with red numbers');
    return this.red.isub(this, num);
  };

  BN.prototype.redShl = function redShl (num) {
    assert(this.red, 'redShl works only with red numbers');
    return this.red.shl(this, num);
  };

  BN.prototype.redMul = function redMul (num) {
    assert(this.red, 'redMul works only with red numbers');
    this.red._verify2(this, num);
    return this.red.mul(this, num);
  };

  BN.prototype.redIMul = function redIMul (num) {
    assert(this.red, 'redMul works only with red numbers');
    this.red._verify2(this, num);
    return this.red.imul(this, num);
  };

  BN.prototype.redSqr = function redSqr () {
    assert(this.red, 'redSqr works only with red numbers');
    this.red._verify1(this);
    return this.red.sqr(this);
  };

  BN.prototype.redISqr = function redISqr () {
    assert(this.red, 'redISqr works only with red numbers');
    this.red._verify1(this);
    return this.red.isqr(this);
  };

  // Square root over p
  BN.prototype.redSqrt = function redSqrt () {
    assert(this.red, 'redSqrt works only with red numbers');
    this.red._verify1(this);
    return this.red.sqrt(this);
  };

  BN.prototype.redInvm = function redInvm () {
    assert(this.red, 'redInvm works only with red numbers');
    this.red._verify1(this);
    return this.red.invm(this);
  };

  // Return negative clone of `this` % `red modulo`
  BN.prototype.redNeg = function redNeg () {
    assert(this.red, 'redNeg works only with red numbers');
    this.red._verify1(this);
    return this.red.neg(this);
  };

  BN.prototype.redPow = function redPow (num) {
    assert(this.red && !num.red, 'redPow(normalNum)');
    this.red._verify1(this);
    return this.red.pow(this, num);
  };

  // Prime numbers with efficient reduction
  var primes = {
    k256: null,
    p224: null,
    p192: null,
    p25519: null
  };

  // Pseudo-Mersenne prime
  function MPrime (name, p) {
    // P = 2 ^ N - K
    this.name = name;
    this.p = new BN(p, 16);
    this.n = this.p.bitLength();
    this.k = new BN(1).iushln(this.n).isub(this.p);

    this.tmp = this._tmp();
  }

  MPrime.prototype._tmp = function _tmp () {
    var tmp = new BN(null);
    tmp.words = new Array(Math.ceil(this.n / 13));
    return tmp;
  };

  MPrime.prototype.ireduce = function ireduce (num) {
    // Assumes that `num` is less than `P^2`
    // num = HI * (2 ^ N - K) + HI * K + LO = HI * K + LO (mod P)
    var r = num;
    var rlen;

    do {
      this.split(r, this.tmp);
      r = this.imulK(r);
      r = r.iadd(this.tmp);
      rlen = r.bitLength();
    } while (rlen > this.n);

    var cmp = rlen < this.n ? -1 : r.ucmp(this.p);
    if (cmp === 0) {
      r.words[0] = 0;
      r.length = 1;
    } else if (cmp > 0) {
      r.isub(this.p);
    } else {
      if (r.strip !== undefined) {
        // r is a BN v4 instance
        r.strip();
      } else {
        // r is a BN v5 instance
        r._strip();
      }
    }

    return r;
  };

  MPrime.prototype.split = function split (input, out) {
    input.iushrn(this.n, 0, out);
  };

  MPrime.prototype.imulK = function imulK (num) {
    return num.imul(this.k);
  };

  function K256 () {
    MPrime.call(
      this,
      'k256',
      'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe fffffc2f');
  }
  inherits(K256, MPrime);

  K256.prototype.split = function split (input, output) {
    // 256 = 9 * 26 + 22
    var mask = 0x3fffff;

    var outLen = Math.min(input.length, 9);
    for (var i = 0; i < outLen; i++) {
      output.words[i] = input.words[i];
    }
    output.length = outLen;

    if (input.length <= 9) {
      input.words[0] = 0;
      input.length = 1;
      return;
    }

    // Shift by 9 limbs
    var prev = input.words[9];
    output.words[output.length++] = prev & mask;

    for (i = 10; i < input.length; i++) {
      var next = input.words[i] | 0;
      input.words[i - 10] = ((next & mask) << 4) | (prev >>> 22);
      prev = next;
    }
    prev >>>= 22;
    input.words[i - 10] = prev;
    if (prev === 0 && input.length > 10) {
      input.length -= 10;
    } else {
      input.length -= 9;
    }
  };

  K256.prototype.imulK = function imulK (num) {
    // K = 0x1000003d1 = [ 0x40, 0x3d1 ]
    num.words[num.length] = 0;
    num.words[num.length + 1] = 0;
    num.length += 2;

    // bounded at: 0x40 * 0x3ffffff + 0x3d0 = 0x100000390
    var lo = 0;
    for (var i = 0; i < num.length; i++) {
      var w = num.words[i] | 0;
      lo += w * 0x3d1;
      num.words[i] = lo & 0x3ffffff;
      lo = w * 0x40 + ((lo / 0x4000000) | 0);
    }

    // Fast length reduction
    if (num.words[num.length - 1] === 0) {
      num.length--;
      if (num.words[num.length - 1] === 0) {
        num.length--;
      }
    }
    return num;
  };

  function P224 () {
    MPrime.call(
      this,
      'p224',
      'ffffffff ffffffff ffffffff ffffffff 00000000 00000000 00000001');
  }
  inherits(P224, MPrime);

  function P192 () {
    MPrime.call(
      this,
      'p192',
      'ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff');
  }
  inherits(P192, MPrime);

  function P25519 () {
    // 2 ^ 255 - 19
    MPrime.call(
      this,
      '25519',
      '7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed');
  }
  inherits(P25519, MPrime);

  P25519.prototype.imulK = function imulK (num) {
    // K = 0x13
    var carry = 0;
    for (var i = 0; i < num.length; i++) {
      var hi = (num.words[i] | 0) * 0x13 + carry;
      var lo = hi & 0x3ffffff;
      hi >>>= 26;

      num.words[i] = lo;
      carry = hi;
    }
    if (carry !== 0) {
      num.words[num.length++] = carry;
    }
    return num;
  };

  // Exported mostly for testing purposes, use plain name instead
  BN._prime = function prime (name) {
    // Cached version of prime
    if (primes[name]) return primes[name];

    var prime;
    if (name === 'k256') {
      prime = new K256();
    } else if (name === 'p224') {
      prime = new P224();
    } else if (name === 'p192') {
      prime = new P192();
    } else if (name === 'p25519') {
      prime = new P25519();
    } else {
      throw new Error('Unknown prime ' + name);
    }
    primes[name] = prime;

    return prime;
  };

  //
  // Base reduction engine
  //
  function Red (m) {
    if (typeof m === 'string') {
      var prime = BN._prime(m);
      this.m = prime.p;
      this.prime = prime;
    } else {
      assert(m.gtn(1), 'modulus must be greater than 1');
      this.m = m;
      this.prime = null;
    }
  }

  Red.prototype._verify1 = function _verify1 (a) {
    assert(a.negative === 0, 'red works only with positives');
    assert(a.red, 'red works only with red numbers');
  };

  Red.prototype._verify2 = function _verify2 (a, b) {
    assert((a.negative | b.negative) === 0, 'red works only with positives');
    assert(a.red && a.red === b.red,
      'red works only with red numbers');
  };

  Red.prototype.imod = function imod (a) {
    if (this.prime) return this.prime.ireduce(a)._forceRed(this);

    move(a, a.umod(this.m)._forceRed(this));
    return a;
  };

  Red.prototype.neg = function neg (a) {
    if (a.isZero()) {
      return a.clone();
    }

    return this.m.sub(a)._forceRed(this);
  };

  Red.prototype.add = function add (a, b) {
    this._verify2(a, b);

    var res = a.add(b);
    if (res.cmp(this.m) >= 0) {
      res.isub(this.m);
    }
    return res._forceRed(this);
  };

  Red.prototype.iadd = function iadd (a, b) {
    this._verify2(a, b);

    var res = a.iadd(b);
    if (res.cmp(this.m) >= 0) {
      res.isub(this.m);
    }
    return res;
  };

  Red.prototype.sub = function sub (a, b) {
    this._verify2(a, b);

    var res = a.sub(b);
    if (res.cmpn(0) < 0) {
      res.iadd(this.m);
    }
    return res._forceRed(this);
  };

  Red.prototype.isub = function isub (a, b) {
    this._verify2(a, b);

    var res = a.isub(b);
    if (res.cmpn(0) < 0) {
      res.iadd(this.m);
    }
    return res;
  };

  Red.prototype.shl = function shl (a, num) {
    this._verify1(a);
    return this.imod(a.ushln(num));
  };

  Red.prototype.imul = function imul (a, b) {
    this._verify2(a, b);
    return this.imod(a.imul(b));
  };

  Red.prototype.mul = function mul (a, b) {
    this._verify2(a, b);
    return this.imod(a.mul(b));
  };

  Red.prototype.isqr = function isqr (a) {
    return this.imul(a, a.clone());
  };

  Red.prototype.sqr = function sqr (a) {
    return this.mul(a, a);
  };

  Red.prototype.sqrt = function sqrt (a) {
    if (a.isZero()) return a.clone();

    var mod3 = this.m.andln(3);
    assert(mod3 % 2 === 1);

    // Fast case
    if (mod3 === 3) {
      var pow = this.m.add(new BN(1)).iushrn(2);
      return this.pow(a, pow);
    }

    // Tonelli-Shanks algorithm (Totally unoptimized and slow)
    //
    // Find Q and S, that Q * 2 ^ S = (P - 1)
    var q = this.m.subn(1);
    var s = 0;
    while (!q.isZero() && q.andln(1) === 0) {
      s++;
      q.iushrn(1);
    }
    assert(!q.isZero());

    var one = new BN(1).toRed(this);
    var nOne = one.redNeg();

    // Find quadratic non-residue
    // NOTE: Max is such because of generalized Riemann hypothesis.
    var lpow = this.m.subn(1).iushrn(1);
    var z = this.m.bitLength();
    z = new BN(2 * z * z).toRed(this);

    while (this.pow(z, lpow).cmp(nOne) !== 0) {
      z.redIAdd(nOne);
    }

    var c = this.pow(z, q);
    var r = this.pow(a, q.addn(1).iushrn(1));
    var t = this.pow(a, q);
    var m = s;
    while (t.cmp(one) !== 0) {
      var tmp = t;
      for (var i = 0; tmp.cmp(one) !== 0; i++) {
        tmp = tmp.redSqr();
      }
      assert(i < m);
      var b = this.pow(c, new BN(1).iushln(m - i - 1));

      r = r.redMul(b);
      c = b.redSqr();
      t = t.redMul(c);
      m = i;
    }

    return r;
  };

  Red.prototype.invm = function invm (a) {
    var inv = a._invmp(this.m);
    if (inv.negative !== 0) {
      inv.negative = 0;
      return this.imod(inv).redNeg();
    } else {
      return this.imod(inv);
    }
  };

  Red.prototype.pow = function pow (a, num) {
    if (num.isZero()) return new BN(1).toRed(this);
    if (num.cmpn(1) === 0) return a.clone();

    var windowSize = 4;
    var wnd = new Array(1 << windowSize);
    wnd[0] = new BN(1).toRed(this);
    wnd[1] = a;
    for (var i = 2; i < wnd.length; i++) {
      wnd[i] = this.mul(wnd[i - 1], a);
    }

    var res = wnd[0];
    var current = 0;
    var currentLen = 0;
    var start = num.bitLength() % 26;
    if (start === 0) {
      start = 26;
    }

    for (i = num.length - 1; i >= 0; i--) {
      var word = num.words[i];
      for (var j = start - 1; j >= 0; j--) {
        var bit = (word >> j) & 1;
        if (res !== wnd[0]) {
          res = this.sqr(res);
        }

        if (bit === 0 && current === 0) {
          currentLen = 0;
          continue;
        }

        current <<= 1;
        current |= bit;
        currentLen++;
        if (currentLen !== windowSize && (i !== 0 || j !== 0)) continue;

        res = this.mul(res, wnd[current]);
        currentLen = 0;
        current = 0;
      }
      start = 26;
    }

    return res;
  };

  Red.prototype.convertTo = function convertTo (num) {
    var r = num.umod(this.m);

    return r === num ? r.clone() : r;
  };

  Red.prototype.convertFrom = function convertFrom (num) {
    var res = num.clone();
    res.red = null;
    return res;
  };

  //
  // Montgomery method engine
  //

  BN.mont = function mont (num) {
    return new Mont(num);
  };

  function Mont (m) {
    Red.call(this, m);

    this.shift = this.m.bitLength();
    if (this.shift % 26 !== 0) {
      this.shift += 26 - (this.shift % 26);
    }

    this.r = new BN(1).iushln(this.shift);
    this.r2 = this.imod(this.r.sqr());
    this.rinv = this.r._invmp(this.m);

    this.minv = this.rinv.mul(this.r).isubn(1).div(this.m);
    this.minv = this.minv.umod(this.r);
    this.minv = this.r.sub(this.minv);
  }
  inherits(Mont, Red);

  Mont.prototype.convertTo = function convertTo (num) {
    return this.imod(num.ushln(this.shift));
  };

  Mont.prototype.convertFrom = function convertFrom (num) {
    var r = this.imod(num.mul(this.rinv));
    r.red = null;
    return r;
  };

  Mont.prototype.imul = function imul (a, b) {
    if (a.isZero() || b.isZero()) {
      a.words[0] = 0;
      a.length = 1;
      return a;
    }

    var t = a.imul(b);
    var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
    var u = t.isub(c).iushrn(this.shift);
    var res = u;

    if (u.cmp(this.m) >= 0) {
      res = u.isub(this.m);
    } else if (u.cmpn(0) < 0) {
      res = u.iadd(this.m);
    }

    return res._forceRed(this);
  };

  Mont.prototype.mul = function mul (a, b) {
    if (a.isZero() || b.isZero()) return new BN(0)._forceRed(this);

    var t = a.mul(b);
    var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
    var u = t.isub(c).iushrn(this.shift);
    var res = u;
    if (u.cmp(this.m) >= 0) {
      res = u.isub(this.m);
    } else if (u.cmpn(0) < 0) {
      res = u.iadd(this.m);
    }

    return res._forceRed(this);
  };

  Mont.prototype.invm = function invm (a) {
    // (AR)^-1 * R^2 = (A^-1 * R^-1) * R^2 = A^-1 * R
    var res = this.imod(a._invmp(this.m).mul(this.r2));
    return res._forceRed(this);
  };
})(typeof module === 'undefined' || module, this);

},{"buffer":"../node_modules/parcel-bundler/src/builtins/_empty.js"}],"../node_modules/base64-js/index.js":[function(require,module,exports) {
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],"../node_modules/ieee754/index.js":[function(require,module,exports) {
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],"../node_modules/isarray/index.js":[function(require,module,exports) {
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],"../node_modules/buffer/index.js":[function(require,module,exports) {

var global = arguments[3];
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

/*
 * Export kMaxLength after typed array support is determined.
 */
exports.kMaxLength = kMaxLength()

function typedArraySupport () {
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length)
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer(length)
    }
    that.length = length
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
    return new Buffer(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype
  return arr
}

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    Object.defineProperty(Buffer, Symbol.species, {
      value: null,
      configurable: true
    })
  }
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
}

function allocUnsafe (that, size) {
  assertSize(size)
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; ++i) {
      that[i] = 0
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  that = createBuffer(that, length)

  var actual = that.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    that = that.slice(0, actual)
  }

  return that
}

function fromArrayLike (that, array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  that = createBuffer(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (byteOffset === undefined && length === undefined) {
    array = new Uint8Array(array)
  } else if (length === undefined) {
    array = new Uint8Array(array, byteOffset)
  } else {
    array = new Uint8Array(array, byteOffset, length)
  }

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array)
  }
  return that
}

function fromObject (that, obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    that = createBuffer(that, len)

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len)
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength()` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (isNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (Buffer.TYPED_ARRAY_SUPPORT &&
        typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end)
    newBuf.__proto__ = Buffer.prototype
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; ++i) {
      newBuf[i] = this[i + start]
    }
  }

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : utf8ToBytes(new Buffer(val, encoding).toString())
    var len = bytes.length
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}

},{"base64-js":"../node_modules/base64-js/index.js","ieee754":"../node_modules/ieee754/index.js","isarray":"../node_modules/isarray/index.js","buffer":"../node_modules/buffer/index.js"}],"../node_modules/safe-buffer/index.js":[function(require,module,exports) {

/*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
/* eslint-disable node/no-deprecated-api */
var buffer = require('buffer')
var Buffer = buffer.Buffer

// alternative to using Object.keys for old browsers
function copyProps (src, dst) {
  for (var key in src) {
    dst[key] = src[key]
  }
}
if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
  module.exports = buffer
} else {
  // Copy properties from require('buffer')
  copyProps(buffer, exports)
  exports.Buffer = SafeBuffer
}

function SafeBuffer (arg, encodingOrOffset, length) {
  return Buffer(arg, encodingOrOffset, length)
}

SafeBuffer.prototype = Object.create(Buffer.prototype)

// Copy static methods from Buffer
copyProps(Buffer, SafeBuffer)

SafeBuffer.from = function (arg, encodingOrOffset, length) {
  if (typeof arg === 'number') {
    throw new TypeError('Argument must not be a number')
  }
  return Buffer(arg, encodingOrOffset, length)
}

SafeBuffer.alloc = function (size, fill, encoding) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  var buf = Buffer(size)
  if (fill !== undefined) {
    if (typeof encoding === 'string') {
      buf.fill(fill, encoding)
    } else {
      buf.fill(fill)
    }
  } else {
    buf.fill(0)
  }
  return buf
}

SafeBuffer.allocUnsafe = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return Buffer(size)
}

SafeBuffer.allocUnsafeSlow = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return buffer.SlowBuffer(size)
}

},{"buffer":"../node_modules/buffer/index.js"}],"../node_modules/base-x/src/index.js":[function(require,module,exports) {
'use strict'
// base-x encoding / decoding
// Copyright (c) 2018 base-x contributors
// Copyright (c) 2014-2018 The Bitcoin Core developers (base58.cpp)
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
// @ts-ignore
var _Buffer = require('safe-buffer').Buffer
function base (ALPHABET) {
  if (ALPHABET.length >= 255) { throw new TypeError('Alphabet too long') }
  var BASE_MAP = new Uint8Array(256)
  for (var j = 0; j < BASE_MAP.length; j++) {
    BASE_MAP[j] = 255
  }
  for (var i = 0; i < ALPHABET.length; i++) {
    var x = ALPHABET.charAt(i)
    var xc = x.charCodeAt(0)
    if (BASE_MAP[xc] !== 255) { throw new TypeError(x + ' is ambiguous') }
    BASE_MAP[xc] = i
  }
  var BASE = ALPHABET.length
  var LEADER = ALPHABET.charAt(0)
  var FACTOR = Math.log(BASE) / Math.log(256) // log(BASE) / log(256), rounded up
  var iFACTOR = Math.log(256) / Math.log(BASE) // log(256) / log(BASE), rounded up
  function encode (source) {
    if (Array.isArray(source) || source instanceof Uint8Array) { source = _Buffer.from(source) }
    if (!_Buffer.isBuffer(source)) { throw new TypeError('Expected Buffer') }
    if (source.length === 0) { return '' }
        // Skip & count leading zeroes.
    var zeroes = 0
    var length = 0
    var pbegin = 0
    var pend = source.length
    while (pbegin !== pend && source[pbegin] === 0) {
      pbegin++
      zeroes++
    }
        // Allocate enough space in big-endian base58 representation.
    var size = ((pend - pbegin) * iFACTOR + 1) >>> 0
    var b58 = new Uint8Array(size)
        // Process the bytes.
    while (pbegin !== pend) {
      var carry = source[pbegin]
            // Apply "b58 = b58 * 256 + ch".
      var i = 0
      for (var it1 = size - 1; (carry !== 0 || i < length) && (it1 !== -1); it1--, i++) {
        carry += (256 * b58[it1]) >>> 0
        b58[it1] = (carry % BASE) >>> 0
        carry = (carry / BASE) >>> 0
      }
      if (carry !== 0) { throw new Error('Non-zero carry') }
      length = i
      pbegin++
    }
        // Skip leading zeroes in base58 result.
    var it2 = size - length
    while (it2 !== size && b58[it2] === 0) {
      it2++
    }
        // Translate the result into a string.
    var str = LEADER.repeat(zeroes)
    for (; it2 < size; ++it2) { str += ALPHABET.charAt(b58[it2]) }
    return str
  }
  function decodeUnsafe (source) {
    if (typeof source !== 'string') { throw new TypeError('Expected String') }
    if (source.length === 0) { return _Buffer.alloc(0) }
    var psz = 0
        // Skip leading spaces.
    if (source[psz] === ' ') { return }
        // Skip and count leading '1's.
    var zeroes = 0
    var length = 0
    while (source[psz] === LEADER) {
      zeroes++
      psz++
    }
        // Allocate enough space in big-endian base256 representation.
    var size = (((source.length - psz) * FACTOR) + 1) >>> 0 // log(58) / log(256), rounded up.
    var b256 = new Uint8Array(size)
        // Process the characters.
    while (source[psz]) {
            // Decode character
      var carry = BASE_MAP[source.charCodeAt(psz)]
            // Invalid character
      if (carry === 255) { return }
      var i = 0
      for (var it3 = size - 1; (carry !== 0 || i < length) && (it3 !== -1); it3--, i++) {
        carry += (BASE * b256[it3]) >>> 0
        b256[it3] = (carry % 256) >>> 0
        carry = (carry / 256) >>> 0
      }
      if (carry !== 0) { throw new Error('Non-zero carry') }
      length = i
      psz++
    }
        // Skip trailing spaces.
    if (source[psz] === ' ') { return }
        // Skip leading zeroes in b256.
    var it4 = size - length
    while (it4 !== size && b256[it4] === 0) {
      it4++
    }
    var vch = _Buffer.allocUnsafe(zeroes + (size - it4))
    vch.fill(0x00, 0, zeroes)
    var j = zeroes
    while (it4 !== size) {
      vch[j++] = b256[it4++]
    }
    return vch
  }
  function decode (string) {
    var buffer = decodeUnsafe(string)
    if (buffer) { return buffer }
    throw new Error('Non-base' + BASE + ' character')
  }
  return {
    encode: encode,
    decodeUnsafe: decodeUnsafe,
    decode: decode
  }
}
module.exports = base

},{"safe-buffer":"../node_modules/safe-buffer/index.js"}],"../node_modules/bs58/index.js":[function(require,module,exports) {
var basex = require('base-x')
var ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

module.exports = basex(ALPHABET)

},{"base-x":"../node_modules/base-x/src/index.js"}],"../node_modules/bitcoin-elliptic/package.json":[function(require,module,exports) {
module.exports = {
  "name": "bitcoin-elliptic",
  "version": "7.0.1",
  "description": "EC cryptography",
  "main": "lib/elliptic.js",
  "files": [
    "lib"
  ],
  "scripts": {
    "jscs": "jscs benchmarks/*.js lib/*.js lib/**/*.js lib/**/**/*.js test/index.js",
    "jshint": "jscs benchmarks/*.js lib/*.js lib/**/*.js lib/**/**/*.js test/index.js",
    "lint": "npm run jscs && npm run jshint",
    "unit": "istanbul test _mocha --reporter=spec test/index.js",
    "test": "npm run lint && npm run unit",
    "version": "grunt dist && git add dist/"
  },
  "repository": {
    "type": "git",
    "url": "git@github.com:moneybutton/elliptic"
  },
  "keywords": [
    "EC",
    "Elliptic",
    "curve",
    "Cryptography"
  ],
  "author": "Fedor Indutny <fedor@indutny.com>",
  "contributors": [
    {
      "name": "Ryan X. Charles",
      "email": "ryanxcharles@gmail.com"
    }
  ],
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/indutny/elliptic/issues"
  },
  "homepage": "https://github.com/moneybutton/elliptic",
  "devDependencies": {
    "brfs": "^2.0.2",
    "coveralls": "^3.0.8",
    "grunt": "^1.0.4",
    "grunt-browserify": "^5.0.0",
    "grunt-cli": "^1.2.0",
    "grunt-contrib-connect": "^2.1.0",
    "grunt-contrib-copy": "^1.0.0",
    "grunt-contrib-uglify": "^4.0.1",
    "grunt-mocha-istanbul": "^5.0.2",
    "grunt-saucelabs": "^9.0.1",
    "istanbul": "^0.4.2",
    "jscs": "^3.0.7",
    "jshint": "^2.11.1",
    "mocha": "^7.1.2"
  },
  "dependencies": {
    "bn.js": "^5.1.1",
    "brorand": "^1.0.1",
    "hash.js": "^1.0.0",
    "hmac-drbg": "^1.0.0",
    "inherits": "^2.0.1",
    "minimalistic-assert": "^1.0.0",
    "minimalistic-crypto-utils": "^1.0.0"
  }
}
;
},{}],"../node_modules/bitcoin-elliptic/node_modules/bn.js/lib/bn.js":[function(require,module,exports) {
var Buffer = require("buffer").Buffer;
(function (module, exports) {
  'use strict';

  // Utils
  function assert (val, msg) {
    if (!val) throw new Error(msg || 'Assertion failed');
  }

  // Could use `inherits` module, but don't want to move from single file
  // architecture yet.
  function inherits (ctor, superCtor) {
    ctor.super_ = superCtor;
    var TempCtor = function () {};
    TempCtor.prototype = superCtor.prototype;
    ctor.prototype = new TempCtor();
    ctor.prototype.constructor = ctor;
  }

  // BN

  function BN (number, base, endian) {
    if (BN.isBN(number)) {
      return number;
    }

    this.negative = 0;
    this.words = null;
    this.length = 0;

    // Reduction context
    this.red = null;

    if (number !== null) {
      if (base === 'le' || base === 'be') {
        endian = base;
        base = 10;
      }

      this._init(number || 0, base || 10, endian || 'be');
    }
  }
  if (typeof module === 'object') {
    module.exports = BN;
  } else {
    exports.BN = BN;
  }

  BN.BN = BN;
  BN.wordSize = 26;

  var Buffer;
  try {
    Buffer = require('buffer').Buffer;
  } catch (e) {
  }

  BN.isBN = function isBN (num) {
    if (num instanceof BN) {
      return true;
    }

    return num !== null && typeof num === 'object' &&
      num.constructor.wordSize === BN.wordSize && Array.isArray(num.words);
  };

  BN.max = function max (left, right) {
    if (left.cmp(right) > 0) return left;
    return right;
  };

  BN.min = function min (left, right) {
    if (left.cmp(right) < 0) return left;
    return right;
  };

  BN.prototype._init = function init (number, base, endian) {
    if (typeof number === 'number') {
      return this._initNumber(number, base, endian);
    }

    if (typeof number === 'object') {
      return this._initArray(number, base, endian);
    }

    if (base === 'hex') {
      base = 16;
    }
    assert(base === (base | 0) && base >= 2 && base <= 36);

    number = number.toString().replace(/\s+/g, '');
    var start = 0;
    if (number[0] === '-') {
      start++;
    }

    if (base === 16) {
      this._parseHex(number, start);
    } else {
      this._parseBase(number, base, start);
    }

    if (number[0] === '-') {
      this.negative = 1;
    }

    this._strip();

    if (endian !== 'le') return;

    this._initArray(this.toArray(), base, endian);
  };

  BN.prototype._initNumber = function _initNumber (number, base, endian) {
    if (number < 0) {
      this.negative = 1;
      number = -number;
    }
    if (number < 0x4000000) {
      this.words = [number & 0x3ffffff];
      this.length = 1;
    } else if (number < 0x10000000000000) {
      this.words = [
        number & 0x3ffffff,
        (number / 0x4000000) & 0x3ffffff
      ];
      this.length = 2;
    } else {
      assert(number < 0x20000000000000); // 2 ^ 53 (unsafe)
      this.words = [
        number & 0x3ffffff,
        (number / 0x4000000) & 0x3ffffff,
        1
      ];
      this.length = 3;
    }

    if (endian !== 'le') return;

    // Reverse the bytes
    this._initArray(this.toArray(), base, endian);
  };

  BN.prototype._initArray = function _initArray (number, base, endian) {
    // Perhaps a Uint8Array
    assert(typeof number.length === 'number');
    if (number.length <= 0) {
      this.words = [0];
      this.length = 1;
      return this;
    }

    this.length = Math.ceil(number.length / 3);
    this.words = new Array(this.length);
    for (var i = 0; i < this.length; i++) {
      this.words[i] = 0;
    }

    var j, w;
    var off = 0;
    if (endian === 'be') {
      for (i = number.length - 1, j = 0; i >= 0; i -= 3) {
        w = number[i] | (number[i - 1] << 8) | (number[i - 2] << 16);
        this.words[j] |= (w << off) & 0x3ffffff;
        this.words[j + 1] = (w >>> (26 - off)) & 0x3ffffff;
        off += 24;
        if (off >= 26) {
          off -= 26;
          j++;
        }
      }
    } else if (endian === 'le') {
      for (i = 0, j = 0; i < number.length; i += 3) {
        w = number[i] | (number[i + 1] << 8) | (number[i + 2] << 16);
        this.words[j] |= (w << off) & 0x3ffffff;
        this.words[j + 1] = (w >>> (26 - off)) & 0x3ffffff;
        off += 24;
        if (off >= 26) {
          off -= 26;
          j++;
        }
      }
    }
    return this._strip();
  };

  function parseHex (str, start, end) {
    var r = 0;
    var len = Math.min(str.length, end);
    var z = 0;
    for (var i = start; i < len; i++) {
      var c = str.charCodeAt(i) - 48;

      r <<= 4;

      var b;

      // 'a' - 'f'
      if (c >= 49 && c <= 54) {
        b = c - 49 + 0xa;

      // 'A' - 'F'
      } else if (c >= 17 && c <= 22) {
        b = c - 17 + 0xa;

      // '0' - '9'
      } else {
        b = c;
      }

      r |= b;
      z |= b;
    }

    assert(!(z & 0xf0), 'Invalid character in ' + str);
    return r;
  }

  BN.prototype._parseHex = function _parseHex (number, start) {
    // Create possibly bigger array to ensure that it fits the number
    this.length = Math.ceil((number.length - start) / 6);
    this.words = new Array(this.length);
    for (var i = 0; i < this.length; i++) {
      this.words[i] = 0;
    }

    var j, w;
    // Scan 24-bit chunks and add them to the number
    var off = 0;
    for (i = number.length - 6, j = 0; i >= start; i -= 6) {
      w = parseHex(number, i, i + 6);
      this.words[j] |= (w << off) & 0x3ffffff;
      // NOTE: `0x3fffff` is intentional here, 26bits max shift + 24bit hex limb
      this.words[j + 1] |= w >>> (26 - off) & 0x3fffff;
      off += 24;
      if (off >= 26) {
        off -= 26;
        j++;
      }
    }
    if (i + 6 !== start) {
      w = parseHex(number, start, i + 6);
      this.words[j] |= (w << off) & 0x3ffffff;
      this.words[j + 1] |= w >>> (26 - off) & 0x3fffff;
    }
    this._strip();
  };

  function parseBase (str, start, end, mul) {
    var r = 0;
    var b = 0;
    var len = Math.min(str.length, end);
    for (var i = start; i < len; i++) {
      var c = str.charCodeAt(i) - 48;

      r *= mul;

      // 'a'
      if (c >= 49) {
        b = c - 49 + 0xa;

      // 'A'
      } else if (c >= 17) {
        b = c - 17 + 0xa;

      // '0' - '9'
      } else {
        b = c;
      }
      assert(c >= 0 && b < mul, 'Invalid character');
      r += b;
    }
    return r;
  }

  BN.prototype._parseBase = function _parseBase (number, base, start) {
    // Initialize as zero
    this.words = [0];
    this.length = 1;

    // Find length of limb in base
    for (var limbLen = 0, limbPow = 1; limbPow <= 0x3ffffff; limbPow *= base) {
      limbLen++;
    }
    limbLen--;
    limbPow = (limbPow / base) | 0;

    var total = number.length - start;
    var mod = total % limbLen;
    var end = Math.min(total, total - mod) + start;

    var word = 0;
    for (var i = start; i < end; i += limbLen) {
      word = parseBase(number, i, i + limbLen, base);

      this.imuln(limbPow);
      if (this.words[0] + word < 0x4000000) {
        this.words[0] += word;
      } else {
        this._iaddn(word);
      }
    }

    if (mod !== 0) {
      var pow = 1;
      word = parseBase(number, i, number.length, base);

      for (i = 0; i < mod; i++) {
        pow *= base;
      }

      this.imuln(pow);
      if (this.words[0] + word < 0x4000000) {
        this.words[0] += word;
      } else {
        this._iaddn(word);
      }
    }
  };

  BN.prototype.copy = function copy (dest) {
    dest.words = new Array(this.length);
    for (var i = 0; i < this.length; i++) {
      dest.words[i] = this.words[i];
    }
    dest.length = this.length;
    dest.negative = this.negative;
    dest.red = this.red;
  };

  function move (dest, src) {
    dest.words = src.words;
    dest.length = src.length;
    dest.negative = src.negative;
    dest.red = src.red;
  }

  BN.prototype._move = function _move (dest) {
    move(dest, this);
  };

  BN.prototype.clone = function clone () {
    var r = new BN(null);
    this.copy(r);
    return r;
  };

  BN.prototype._expand = function _expand (size) {
    while (this.length < size) {
      this.words[this.length++] = 0;
    }
    return this;
  };

  // Remove leading `0` from `this`
  BN.prototype._strip = function strip () {
    while (this.length > 1 && this.words[this.length - 1] === 0) {
      this.length--;
    }
    return this._normSign();
  };

  BN.prototype._normSign = function _normSign () {
    // -0 = 0
    if (this.length === 1 && this.words[0] === 0) {
      this.negative = 0;
    }
    return this;
  };

  // Check Symbol.for because not everywhere where Symbol defined
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol#Browser_compatibility
  if (typeof Symbol !== 'undefined' && typeof Symbol.for === 'function') {
    BN.prototype[Symbol.for('nodejs.util.inspect.custom')] = inspect;
  } else {
    BN.prototype.inspect = inspect;
  }

  function inspect () {
    return (this.red ? '<BN-R: ' : '<BN: ') + this.toString(16) + '>';
  }

  /*

  var zeros = [];
  var groupSizes = [];
  var groupBases = [];

  var s = '';
  var i = -1;
  while (++i < BN.wordSize) {
    zeros[i] = s;
    s += '0';
  }
  groupSizes[0] = 0;
  groupSizes[1] = 0;
  groupBases[0] = 0;
  groupBases[1] = 0;
  var base = 2 - 1;
  while (++base < 36 + 1) {
    var groupSize = 0;
    var groupBase = 1;
    while (groupBase < (1 << BN.wordSize) / base) {
      groupBase *= base;
      groupSize += 1;
    }
    groupSizes[base] = groupSize;
    groupBases[base] = groupBase;
  }

  */

  var zeros = [
    '',
    '0',
    '00',
    '000',
    '0000',
    '00000',
    '000000',
    '0000000',
    '00000000',
    '000000000',
    '0000000000',
    '00000000000',
    '000000000000',
    '0000000000000',
    '00000000000000',
    '000000000000000',
    '0000000000000000',
    '00000000000000000',
    '000000000000000000',
    '0000000000000000000',
    '00000000000000000000',
    '000000000000000000000',
    '0000000000000000000000',
    '00000000000000000000000',
    '000000000000000000000000',
    '0000000000000000000000000'
  ];

  var groupSizes = [
    0, 0,
    25, 16, 12, 11, 10, 9, 8,
    8, 7, 7, 7, 7, 6, 6,
    6, 6, 6, 6, 6, 5, 5,
    5, 5, 5, 5, 5, 5, 5,
    5, 5, 5, 5, 5, 5, 5
  ];

  var groupBases = [
    0, 0,
    33554432, 43046721, 16777216, 48828125, 60466176, 40353607, 16777216,
    43046721, 10000000, 19487171, 35831808, 62748517, 7529536, 11390625,
    16777216, 24137569, 34012224, 47045881, 64000000, 4084101, 5153632,
    6436343, 7962624, 9765625, 11881376, 14348907, 17210368, 20511149,
    24300000, 28629151, 33554432, 39135393, 45435424, 52521875, 60466176
  ];

  BN.prototype.toString = function toString (base, padding) {
    base = base || 10;
    padding = padding | 0 || 1;

    var out;
    if (base === 16 || base === 'hex') {
      out = '';
      var off = 0;
      var carry = 0;
      for (var i = 0; i < this.length; i++) {
        var w = this.words[i];
        var word = (((w << off) | carry) & 0xffffff).toString(16);
        carry = (w >>> (24 - off)) & 0xffffff;
        if (carry !== 0 || i !== this.length - 1) {
          out = zeros[6 - word.length] + word + out;
        } else {
          out = word + out;
        }
        off += 2;
        if (off >= 26) {
          off -= 26;
          i--;
        }
      }
      if (carry !== 0) {
        out = carry.toString(16) + out;
      }
      while (out.length % padding !== 0) {
        out = '0' + out;
      }
      if (this.negative !== 0) {
        out = '-' + out;
      }
      return out;
    }

    if (base === (base | 0) && base >= 2 && base <= 36) {
      // var groupSize = Math.floor(BN.wordSize * Math.LN2 / Math.log(base));
      var groupSize = groupSizes[base];
      // var groupBase = Math.pow(base, groupSize);
      var groupBase = groupBases[base];
      out = '';
      var c = this.clone();
      c.negative = 0;
      while (!c.isZero()) {
        var r = c.modrn(groupBase).toString(base);
        c = c.idivn(groupBase);

        if (!c.isZero()) {
          out = zeros[groupSize - r.length] + r + out;
        } else {
          out = r + out;
        }
      }
      if (this.isZero()) {
        out = '0' + out;
      }
      while (out.length % padding !== 0) {
        out = '0' + out;
      }
      if (this.negative !== 0) {
        out = '-' + out;
      }
      return out;
    }

    assert(false, 'Base should be between 2 and 36');
  };

  BN.prototype.toNumber = function toNumber () {
    var ret = this.words[0];
    if (this.length === 2) {
      ret += this.words[1] * 0x4000000;
    } else if (this.length === 3 && this.words[2] === 0x01) {
      // NOTE: at this stage it is known that the top bit is set
      ret += 0x10000000000000 + (this.words[1] * 0x4000000);
    } else if (this.length > 2) {
      assert(false, 'Number can only safely store up to 53 bits');
    }
    return (this.negative !== 0) ? -ret : ret;
  };

  BN.prototype.toJSON = function toJSON () {
    return this.toString(16, 2);
  };

  if (Buffer) {
    BN.prototype.toBuffer = function toBuffer (endian, length) {
      return this.toArrayLike(Buffer, endian, length);
    };
  }

  BN.prototype.toArray = function toArray (endian, length) {
    return this.toArrayLike(Array, endian, length);
  };

  var allocate = function allocate (ArrayType, size) {
    if (ArrayType.allocUnsafe) {
      return ArrayType.allocUnsafe(size);
    }
    return new ArrayType(size);
  };

  BN.prototype.toArrayLike = function toArrayLike (ArrayType, endian, length) {
    this._strip();

    var byteLength = this.byteLength();
    var reqLength = length || Math.max(1, byteLength);
    assert(byteLength <= reqLength, 'byte array longer than desired length');
    assert(reqLength > 0, 'Requested array length <= 0');

    var res = allocate(ArrayType, reqLength);
    var postfix = endian === 'le' ? 'LE' : 'BE';
    this['_toArrayLike' + postfix](res, byteLength);
    return res;
  };

  BN.prototype._toArrayLikeLE = function _toArrayLikeLE (res, byteLength) {
    var position = 0;
    var carry = 0;

    for (var i = 0, shift = 0; i < this.length; i++) {
      var word = (this.words[i] << shift) | carry;

      res[position++] = word & 0xff;
      if (position < res.length) {
        res[position++] = (word >> 8) & 0xff;
      }
      if (position < res.length) {
        res[position++] = (word >> 16) & 0xff;
      }

      if (shift === 6) {
        if (position < res.length) {
          res[position++] = (word >> 24) & 0xff;
        }
        carry = 0;
        shift = 0;
      } else {
        carry = word >>> 24;
        shift += 2;
      }
    }

    if (position < res.length) {
      res[position++] = carry;

      while (position < res.length) {
        res[position++] = 0;
      }
    }
  };

  BN.prototype._toArrayLikeBE = function _toArrayLikeBE (res, byteLength) {
    var position = res.length - 1;
    var carry = 0;

    for (var i = 0, shift = 0; i < this.length; i++) {
      var word = (this.words[i] << shift) | carry;

      res[position--] = word & 0xff;
      if (position >= 0) {
        res[position--] = (word >> 8) & 0xff;
      }
      if (position >= 0) {
        res[position--] = (word >> 16) & 0xff;
      }

      if (shift === 6) {
        if (position >= 0) {
          res[position--] = (word >> 24) & 0xff;
        }
        carry = 0;
        shift = 0;
      } else {
        carry = word >>> 24;
        shift += 2;
      }
    }

    if (position >= 0) {
      res[position--] = carry;

      while (position >= 0) {
        res[position--] = 0;
      }
    }
  };

  if (Math.clz32) {
    BN.prototype._countBits = function _countBits (w) {
      return 32 - Math.clz32(w);
    };
  } else {
    BN.prototype._countBits = function _countBits (w) {
      var t = w;
      var r = 0;
      if (t >= 0x1000) {
        r += 13;
        t >>>= 13;
      }
      if (t >= 0x40) {
        r += 7;
        t >>>= 7;
      }
      if (t >= 0x8) {
        r += 4;
        t >>>= 4;
      }
      if (t >= 0x02) {
        r += 2;
        t >>>= 2;
      }
      return r + t;
    };
  }

  BN.prototype._zeroBits = function _zeroBits (w) {
    // Short-cut
    if (w === 0) return 26;

    var t = w;
    var r = 0;
    if ((t & 0x1fff) === 0) {
      r += 13;
      t >>>= 13;
    }
    if ((t & 0x7f) === 0) {
      r += 7;
      t >>>= 7;
    }
    if ((t & 0xf) === 0) {
      r += 4;
      t >>>= 4;
    }
    if ((t & 0x3) === 0) {
      r += 2;
      t >>>= 2;
    }
    if ((t & 0x1) === 0) {
      r++;
    }
    return r;
  };

  // Return number of used bits in a BN
  BN.prototype.bitLength = function bitLength () {
    var w = this.words[this.length - 1];
    var hi = this._countBits(w);
    return (this.length - 1) * 26 + hi;
  };

  function toBitArray (num) {
    var w = new Array(num.bitLength());

    for (var bit = 0; bit < w.length; bit++) {
      var off = (bit / 26) | 0;
      var wbit = bit % 26;

      w[bit] = (num.words[off] >>> wbit) & 0x01;
    }

    return w;
  }

  // Number of trailing zero bits
  BN.prototype.zeroBits = function zeroBits () {
    if (this.isZero()) return 0;

    var r = 0;
    for (var i = 0; i < this.length; i++) {
      var b = this._zeroBits(this.words[i]);
      r += b;
      if (b !== 26) break;
    }
    return r;
  };

  BN.prototype.byteLength = function byteLength () {
    return Math.ceil(this.bitLength() / 8);
  };

  BN.prototype.toTwos = function toTwos (width) {
    if (this.negative !== 0) {
      return this.abs().inotn(width).iaddn(1);
    }
    return this.clone();
  };

  BN.prototype.fromTwos = function fromTwos (width) {
    if (this.testn(width - 1)) {
      return this.notn(width).iaddn(1).ineg();
    }
    return this.clone();
  };

  BN.prototype.isNeg = function isNeg () {
    return this.negative !== 0;
  };

  // Return negative clone of `this`
  BN.prototype.neg = function neg () {
    return this.clone().ineg();
  };

  BN.prototype.ineg = function ineg () {
    if (!this.isZero()) {
      this.negative ^= 1;
    }

    return this;
  };

  // Or `num` with `this` in-place
  BN.prototype.iuor = function iuor (num) {
    while (this.length < num.length) {
      this.words[this.length++] = 0;
    }

    for (var i = 0; i < num.length; i++) {
      this.words[i] = this.words[i] | num.words[i];
    }

    return this._strip();
  };

  BN.prototype.ior = function ior (num) {
    assert((this.negative | num.negative) === 0);
    return this.iuor(num);
  };

  // Or `num` with `this`
  BN.prototype.or = function or (num) {
    if (this.length > num.length) return this.clone().ior(num);
    return num.clone().ior(this);
  };

  BN.prototype.uor = function uor (num) {
    if (this.length > num.length) return this.clone().iuor(num);
    return num.clone().iuor(this);
  };

  // And `num` with `this` in-place
  BN.prototype.iuand = function iuand (num) {
    // b = min-length(num, this)
    var b;
    if (this.length > num.length) {
      b = num;
    } else {
      b = this;
    }

    for (var i = 0; i < b.length; i++) {
      this.words[i] = this.words[i] & num.words[i];
    }

    this.length = b.length;

    return this._strip();
  };

  BN.prototype.iand = function iand (num) {
    assert((this.negative | num.negative) === 0);
    return this.iuand(num);
  };

  // And `num` with `this`
  BN.prototype.and = function and (num) {
    if (this.length > num.length) return this.clone().iand(num);
    return num.clone().iand(this);
  };

  BN.prototype.uand = function uand (num) {
    if (this.length > num.length) return this.clone().iuand(num);
    return num.clone().iuand(this);
  };

  // Xor `num` with `this` in-place
  BN.prototype.iuxor = function iuxor (num) {
    // a.length > b.length
    var a;
    var b;
    if (this.length > num.length) {
      a = this;
      b = num;
    } else {
      a = num;
      b = this;
    }

    for (var i = 0; i < b.length; i++) {
      this.words[i] = a.words[i] ^ b.words[i];
    }

    if (this !== a) {
      for (; i < a.length; i++) {
        this.words[i] = a.words[i];
      }
    }

    this.length = a.length;

    return this._strip();
  };

  BN.prototype.ixor = function ixor (num) {
    assert((this.negative | num.negative) === 0);
    return this.iuxor(num);
  };

  // Xor `num` with `this`
  BN.prototype.xor = function xor (num) {
    if (this.length > num.length) return this.clone().ixor(num);
    return num.clone().ixor(this);
  };

  BN.prototype.uxor = function uxor (num) {
    if (this.length > num.length) return this.clone().iuxor(num);
    return num.clone().iuxor(this);
  };

  // Not ``this`` with ``width`` bitwidth
  BN.prototype.inotn = function inotn (width) {
    assert(typeof width === 'number' && width >= 0);

    var bytesNeeded = Math.ceil(width / 26) | 0;
    var bitsLeft = width % 26;

    // Extend the buffer with leading zeroes
    this._expand(bytesNeeded);

    if (bitsLeft > 0) {
      bytesNeeded--;
    }

    // Handle complete words
    for (var i = 0; i < bytesNeeded; i++) {
      this.words[i] = ~this.words[i] & 0x3ffffff;
    }

    // Handle the residue
    if (bitsLeft > 0) {
      this.words[i] = ~this.words[i] & (0x3ffffff >> (26 - bitsLeft));
    }

    // And remove leading zeroes
    return this._strip();
  };

  BN.prototype.notn = function notn (width) {
    return this.clone().inotn(width);
  };

  // Set `bit` of `this`
  BN.prototype.setn = function setn (bit, val) {
    assert(typeof bit === 'number' && bit >= 0);

    var off = (bit / 26) | 0;
    var wbit = bit % 26;

    this._expand(off + 1);

    if (val) {
      this.words[off] = this.words[off] | (1 << wbit);
    } else {
      this.words[off] = this.words[off] & ~(1 << wbit);
    }

    return this._strip();
  };

  // Add `num` to `this` in-place
  BN.prototype.iadd = function iadd (num) {
    var r;

    // negative + positive
    if (this.negative !== 0 && num.negative === 0) {
      this.negative = 0;
      r = this.isub(num);
      this.negative ^= 1;
      return this._normSign();

    // positive + negative
    } else if (this.negative === 0 && num.negative !== 0) {
      num.negative = 0;
      r = this.isub(num);
      num.negative = 1;
      return r._normSign();
    }

    // a.length > b.length
    var a, b;
    if (this.length > num.length) {
      a = this;
      b = num;
    } else {
      a = num;
      b = this;
    }

    var carry = 0;
    for (var i = 0; i < b.length; i++) {
      r = (a.words[i] | 0) + (b.words[i] | 0) + carry;
      this.words[i] = r & 0x3ffffff;
      carry = r >>> 26;
    }
    for (; carry !== 0 && i < a.length; i++) {
      r = (a.words[i] | 0) + carry;
      this.words[i] = r & 0x3ffffff;
      carry = r >>> 26;
    }

    this.length = a.length;
    if (carry !== 0) {
      this.words[this.length] = carry;
      this.length++;
    // Copy the rest of the words
    } else if (a !== this) {
      for (; i < a.length; i++) {
        this.words[i] = a.words[i];
      }
    }

    return this;
  };

  // Add `num` to `this`
  BN.prototype.add = function add (num) {
    var res;
    if (num.negative !== 0 && this.negative === 0) {
      num.negative = 0;
      res = this.sub(num);
      num.negative ^= 1;
      return res;
    } else if (num.negative === 0 && this.negative !== 0) {
      this.negative = 0;
      res = num.sub(this);
      this.negative = 1;
      return res;
    }

    if (this.length > num.length) return this.clone().iadd(num);

    return num.clone().iadd(this);
  };

  // Subtract `num` from `this` in-place
  BN.prototype.isub = function isub (num) {
    // this - (-num) = this + num
    if (num.negative !== 0) {
      num.negative = 0;
      var r = this.iadd(num);
      num.negative = 1;
      return r._normSign();

    // -this - num = -(this + num)
    } else if (this.negative !== 0) {
      this.negative = 0;
      this.iadd(num);
      this.negative = 1;
      return this._normSign();
    }

    // At this point both numbers are positive
    var cmp = this.cmp(num);

    // Optimization - zeroify
    if (cmp === 0) {
      this.negative = 0;
      this.length = 1;
      this.words[0] = 0;
      return this;
    }

    // a > b
    var a, b;
    if (cmp > 0) {
      a = this;
      b = num;
    } else {
      a = num;
      b = this;
    }

    var carry = 0;
    for (var i = 0; i < b.length; i++) {
      r = (a.words[i] | 0) - (b.words[i] | 0) + carry;
      carry = r >> 26;
      this.words[i] = r & 0x3ffffff;
    }
    for (; carry !== 0 && i < a.length; i++) {
      r = (a.words[i] | 0) + carry;
      carry = r >> 26;
      this.words[i] = r & 0x3ffffff;
    }

    // Copy rest of the words
    if (carry === 0 && i < a.length && a !== this) {
      for (; i < a.length; i++) {
        this.words[i] = a.words[i];
      }
    }

    this.length = Math.max(this.length, i);

    if (a !== this) {
      this.negative = 1;
    }

    return this._strip();
  };

  // Subtract `num` from `this`
  BN.prototype.sub = function sub (num) {
    return this.clone().isub(num);
  };

  function smallMulTo (self, num, out) {
    out.negative = num.negative ^ self.negative;
    var len = (self.length + num.length) | 0;
    out.length = len;
    len = (len - 1) | 0;

    // Peel one iteration (compiler can't do it, because of code complexity)
    var a = self.words[0] | 0;
    var b = num.words[0] | 0;
    var r = a * b;

    var lo = r & 0x3ffffff;
    var carry = (r / 0x4000000) | 0;
    out.words[0] = lo;

    for (var k = 1; k < len; k++) {
      // Sum all words with the same `i + j = k` and accumulate `ncarry`,
      // note that ncarry could be >= 0x3ffffff
      var ncarry = carry >>> 26;
      var rword = carry & 0x3ffffff;
      var maxJ = Math.min(k, num.length - 1);
      for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
        var i = (k - j) | 0;
        a = self.words[i] | 0;
        b = num.words[j] | 0;
        r = a * b + rword;
        ncarry += (r / 0x4000000) | 0;
        rword = r & 0x3ffffff;
      }
      out.words[k] = rword | 0;
      carry = ncarry | 0;
    }
    if (carry !== 0) {
      out.words[k] = carry | 0;
    } else {
      out.length--;
    }

    return out._strip();
  }

  // TODO(indutny): it may be reasonable to omit it for users who don't need
  // to work with 256-bit numbers, otherwise it gives 20% improvement for 256-bit
  // multiplication (like elliptic secp256k1).
  var comb10MulTo = function comb10MulTo (self, num, out) {
    var a = self.words;
    var b = num.words;
    var o = out.words;
    var c = 0;
    var lo;
    var mid;
    var hi;
    var a0 = a[0] | 0;
    var al0 = a0 & 0x1fff;
    var ah0 = a0 >>> 13;
    var a1 = a[1] | 0;
    var al1 = a1 & 0x1fff;
    var ah1 = a1 >>> 13;
    var a2 = a[2] | 0;
    var al2 = a2 & 0x1fff;
    var ah2 = a2 >>> 13;
    var a3 = a[3] | 0;
    var al3 = a3 & 0x1fff;
    var ah3 = a3 >>> 13;
    var a4 = a[4] | 0;
    var al4 = a4 & 0x1fff;
    var ah4 = a4 >>> 13;
    var a5 = a[5] | 0;
    var al5 = a5 & 0x1fff;
    var ah5 = a5 >>> 13;
    var a6 = a[6] | 0;
    var al6 = a6 & 0x1fff;
    var ah6 = a6 >>> 13;
    var a7 = a[7] | 0;
    var al7 = a7 & 0x1fff;
    var ah7 = a7 >>> 13;
    var a8 = a[8] | 0;
    var al8 = a8 & 0x1fff;
    var ah8 = a8 >>> 13;
    var a9 = a[9] | 0;
    var al9 = a9 & 0x1fff;
    var ah9 = a9 >>> 13;
    var b0 = b[0] | 0;
    var bl0 = b0 & 0x1fff;
    var bh0 = b0 >>> 13;
    var b1 = b[1] | 0;
    var bl1 = b1 & 0x1fff;
    var bh1 = b1 >>> 13;
    var b2 = b[2] | 0;
    var bl2 = b2 & 0x1fff;
    var bh2 = b2 >>> 13;
    var b3 = b[3] | 0;
    var bl3 = b3 & 0x1fff;
    var bh3 = b3 >>> 13;
    var b4 = b[4] | 0;
    var bl4 = b4 & 0x1fff;
    var bh4 = b4 >>> 13;
    var b5 = b[5] | 0;
    var bl5 = b5 & 0x1fff;
    var bh5 = b5 >>> 13;
    var b6 = b[6] | 0;
    var bl6 = b6 & 0x1fff;
    var bh6 = b6 >>> 13;
    var b7 = b[7] | 0;
    var bl7 = b7 & 0x1fff;
    var bh7 = b7 >>> 13;
    var b8 = b[8] | 0;
    var bl8 = b8 & 0x1fff;
    var bh8 = b8 >>> 13;
    var b9 = b[9] | 0;
    var bl9 = b9 & 0x1fff;
    var bh9 = b9 >>> 13;

    out.negative = self.negative ^ num.negative;
    out.length = 19;
    /* k = 0 */
    lo = Math.imul(al0, bl0);
    mid = Math.imul(al0, bh0);
    mid = (mid + Math.imul(ah0, bl0)) | 0;
    hi = Math.imul(ah0, bh0);
    var w0 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w0 >>> 26)) | 0;
    w0 &= 0x3ffffff;
    /* k = 1 */
    lo = Math.imul(al1, bl0);
    mid = Math.imul(al1, bh0);
    mid = (mid + Math.imul(ah1, bl0)) | 0;
    hi = Math.imul(ah1, bh0);
    lo = (lo + Math.imul(al0, bl1)) | 0;
    mid = (mid + Math.imul(al0, bh1)) | 0;
    mid = (mid + Math.imul(ah0, bl1)) | 0;
    hi = (hi + Math.imul(ah0, bh1)) | 0;
    var w1 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w1 >>> 26)) | 0;
    w1 &= 0x3ffffff;
    /* k = 2 */
    lo = Math.imul(al2, bl0);
    mid = Math.imul(al2, bh0);
    mid = (mid + Math.imul(ah2, bl0)) | 0;
    hi = Math.imul(ah2, bh0);
    lo = (lo + Math.imul(al1, bl1)) | 0;
    mid = (mid + Math.imul(al1, bh1)) | 0;
    mid = (mid + Math.imul(ah1, bl1)) | 0;
    hi = (hi + Math.imul(ah1, bh1)) | 0;
    lo = (lo + Math.imul(al0, bl2)) | 0;
    mid = (mid + Math.imul(al0, bh2)) | 0;
    mid = (mid + Math.imul(ah0, bl2)) | 0;
    hi = (hi + Math.imul(ah0, bh2)) | 0;
    var w2 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w2 >>> 26)) | 0;
    w2 &= 0x3ffffff;
    /* k = 3 */
    lo = Math.imul(al3, bl0);
    mid = Math.imul(al3, bh0);
    mid = (mid + Math.imul(ah3, bl0)) | 0;
    hi = Math.imul(ah3, bh0);
    lo = (lo + Math.imul(al2, bl1)) | 0;
    mid = (mid + Math.imul(al2, bh1)) | 0;
    mid = (mid + Math.imul(ah2, bl1)) | 0;
    hi = (hi + Math.imul(ah2, bh1)) | 0;
    lo = (lo + Math.imul(al1, bl2)) | 0;
    mid = (mid + Math.imul(al1, bh2)) | 0;
    mid = (mid + Math.imul(ah1, bl2)) | 0;
    hi = (hi + Math.imul(ah1, bh2)) | 0;
    lo = (lo + Math.imul(al0, bl3)) | 0;
    mid = (mid + Math.imul(al0, bh3)) | 0;
    mid = (mid + Math.imul(ah0, bl3)) | 0;
    hi = (hi + Math.imul(ah0, bh3)) | 0;
    var w3 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w3 >>> 26)) | 0;
    w3 &= 0x3ffffff;
    /* k = 4 */
    lo = Math.imul(al4, bl0);
    mid = Math.imul(al4, bh0);
    mid = (mid + Math.imul(ah4, bl0)) | 0;
    hi = Math.imul(ah4, bh0);
    lo = (lo + Math.imul(al3, bl1)) | 0;
    mid = (mid + Math.imul(al3, bh1)) | 0;
    mid = (mid + Math.imul(ah3, bl1)) | 0;
    hi = (hi + Math.imul(ah3, bh1)) | 0;
    lo = (lo + Math.imul(al2, bl2)) | 0;
    mid = (mid + Math.imul(al2, bh2)) | 0;
    mid = (mid + Math.imul(ah2, bl2)) | 0;
    hi = (hi + Math.imul(ah2, bh2)) | 0;
    lo = (lo + Math.imul(al1, bl3)) | 0;
    mid = (mid + Math.imul(al1, bh3)) | 0;
    mid = (mid + Math.imul(ah1, bl3)) | 0;
    hi = (hi + Math.imul(ah1, bh3)) | 0;
    lo = (lo + Math.imul(al0, bl4)) | 0;
    mid = (mid + Math.imul(al0, bh4)) | 0;
    mid = (mid + Math.imul(ah0, bl4)) | 0;
    hi = (hi + Math.imul(ah0, bh4)) | 0;
    var w4 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w4 >>> 26)) | 0;
    w4 &= 0x3ffffff;
    /* k = 5 */
    lo = Math.imul(al5, bl0);
    mid = Math.imul(al5, bh0);
    mid = (mid + Math.imul(ah5, bl0)) | 0;
    hi = Math.imul(ah5, bh0);
    lo = (lo + Math.imul(al4, bl1)) | 0;
    mid = (mid + Math.imul(al4, bh1)) | 0;
    mid = (mid + Math.imul(ah4, bl1)) | 0;
    hi = (hi + Math.imul(ah4, bh1)) | 0;
    lo = (lo + Math.imul(al3, bl2)) | 0;
    mid = (mid + Math.imul(al3, bh2)) | 0;
    mid = (mid + Math.imul(ah3, bl2)) | 0;
    hi = (hi + Math.imul(ah3, bh2)) | 0;
    lo = (lo + Math.imul(al2, bl3)) | 0;
    mid = (mid + Math.imul(al2, bh3)) | 0;
    mid = (mid + Math.imul(ah2, bl3)) | 0;
    hi = (hi + Math.imul(ah2, bh3)) | 0;
    lo = (lo + Math.imul(al1, bl4)) | 0;
    mid = (mid + Math.imul(al1, bh4)) | 0;
    mid = (mid + Math.imul(ah1, bl4)) | 0;
    hi = (hi + Math.imul(ah1, bh4)) | 0;
    lo = (lo + Math.imul(al0, bl5)) | 0;
    mid = (mid + Math.imul(al0, bh5)) | 0;
    mid = (mid + Math.imul(ah0, bl5)) | 0;
    hi = (hi + Math.imul(ah0, bh5)) | 0;
    var w5 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w5 >>> 26)) | 0;
    w5 &= 0x3ffffff;
    /* k = 6 */
    lo = Math.imul(al6, bl0);
    mid = Math.imul(al6, bh0);
    mid = (mid + Math.imul(ah6, bl0)) | 0;
    hi = Math.imul(ah6, bh0);
    lo = (lo + Math.imul(al5, bl1)) | 0;
    mid = (mid + Math.imul(al5, bh1)) | 0;
    mid = (mid + Math.imul(ah5, bl1)) | 0;
    hi = (hi + Math.imul(ah5, bh1)) | 0;
    lo = (lo + Math.imul(al4, bl2)) | 0;
    mid = (mid + Math.imul(al4, bh2)) | 0;
    mid = (mid + Math.imul(ah4, bl2)) | 0;
    hi = (hi + Math.imul(ah4, bh2)) | 0;
    lo = (lo + Math.imul(al3, bl3)) | 0;
    mid = (mid + Math.imul(al3, bh3)) | 0;
    mid = (mid + Math.imul(ah3, bl3)) | 0;
    hi = (hi + Math.imul(ah3, bh3)) | 0;
    lo = (lo + Math.imul(al2, bl4)) | 0;
    mid = (mid + Math.imul(al2, bh4)) | 0;
    mid = (mid + Math.imul(ah2, bl4)) | 0;
    hi = (hi + Math.imul(ah2, bh4)) | 0;
    lo = (lo + Math.imul(al1, bl5)) | 0;
    mid = (mid + Math.imul(al1, bh5)) | 0;
    mid = (mid + Math.imul(ah1, bl5)) | 0;
    hi = (hi + Math.imul(ah1, bh5)) | 0;
    lo = (lo + Math.imul(al0, bl6)) | 0;
    mid = (mid + Math.imul(al0, bh6)) | 0;
    mid = (mid + Math.imul(ah0, bl6)) | 0;
    hi = (hi + Math.imul(ah0, bh6)) | 0;
    var w6 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w6 >>> 26)) | 0;
    w6 &= 0x3ffffff;
    /* k = 7 */
    lo = Math.imul(al7, bl0);
    mid = Math.imul(al7, bh0);
    mid = (mid + Math.imul(ah7, bl0)) | 0;
    hi = Math.imul(ah7, bh0);
    lo = (lo + Math.imul(al6, bl1)) | 0;
    mid = (mid + Math.imul(al6, bh1)) | 0;
    mid = (mid + Math.imul(ah6, bl1)) | 0;
    hi = (hi + Math.imul(ah6, bh1)) | 0;
    lo = (lo + Math.imul(al5, bl2)) | 0;
    mid = (mid + Math.imul(al5, bh2)) | 0;
    mid = (mid + Math.imul(ah5, bl2)) | 0;
    hi = (hi + Math.imul(ah5, bh2)) | 0;
    lo = (lo + Math.imul(al4, bl3)) | 0;
    mid = (mid + Math.imul(al4, bh3)) | 0;
    mid = (mid + Math.imul(ah4, bl3)) | 0;
    hi = (hi + Math.imul(ah4, bh3)) | 0;
    lo = (lo + Math.imul(al3, bl4)) | 0;
    mid = (mid + Math.imul(al3, bh4)) | 0;
    mid = (mid + Math.imul(ah3, bl4)) | 0;
    hi = (hi + Math.imul(ah3, bh4)) | 0;
    lo = (lo + Math.imul(al2, bl5)) | 0;
    mid = (mid + Math.imul(al2, bh5)) | 0;
    mid = (mid + Math.imul(ah2, bl5)) | 0;
    hi = (hi + Math.imul(ah2, bh5)) | 0;
    lo = (lo + Math.imul(al1, bl6)) | 0;
    mid = (mid + Math.imul(al1, bh6)) | 0;
    mid = (mid + Math.imul(ah1, bl6)) | 0;
    hi = (hi + Math.imul(ah1, bh6)) | 0;
    lo = (lo + Math.imul(al0, bl7)) | 0;
    mid = (mid + Math.imul(al0, bh7)) | 0;
    mid = (mid + Math.imul(ah0, bl7)) | 0;
    hi = (hi + Math.imul(ah0, bh7)) | 0;
    var w7 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w7 >>> 26)) | 0;
    w7 &= 0x3ffffff;
    /* k = 8 */
    lo = Math.imul(al8, bl0);
    mid = Math.imul(al8, bh0);
    mid = (mid + Math.imul(ah8, bl0)) | 0;
    hi = Math.imul(ah8, bh0);
    lo = (lo + Math.imul(al7, bl1)) | 0;
    mid = (mid + Math.imul(al7, bh1)) | 0;
    mid = (mid + Math.imul(ah7, bl1)) | 0;
    hi = (hi + Math.imul(ah7, bh1)) | 0;
    lo = (lo + Math.imul(al6, bl2)) | 0;
    mid = (mid + Math.imul(al6, bh2)) | 0;
    mid = (mid + Math.imul(ah6, bl2)) | 0;
    hi = (hi + Math.imul(ah6, bh2)) | 0;
    lo = (lo + Math.imul(al5, bl3)) | 0;
    mid = (mid + Math.imul(al5, bh3)) | 0;
    mid = (mid + Math.imul(ah5, bl3)) | 0;
    hi = (hi + Math.imul(ah5, bh3)) | 0;
    lo = (lo + Math.imul(al4, bl4)) | 0;
    mid = (mid + Math.imul(al4, bh4)) | 0;
    mid = (mid + Math.imul(ah4, bl4)) | 0;
    hi = (hi + Math.imul(ah4, bh4)) | 0;
    lo = (lo + Math.imul(al3, bl5)) | 0;
    mid = (mid + Math.imul(al3, bh5)) | 0;
    mid = (mid + Math.imul(ah3, bl5)) | 0;
    hi = (hi + Math.imul(ah3, bh5)) | 0;
    lo = (lo + Math.imul(al2, bl6)) | 0;
    mid = (mid + Math.imul(al2, bh6)) | 0;
    mid = (mid + Math.imul(ah2, bl6)) | 0;
    hi = (hi + Math.imul(ah2, bh6)) | 0;
    lo = (lo + Math.imul(al1, bl7)) | 0;
    mid = (mid + Math.imul(al1, bh7)) | 0;
    mid = (mid + Math.imul(ah1, bl7)) | 0;
    hi = (hi + Math.imul(ah1, bh7)) | 0;
    lo = (lo + Math.imul(al0, bl8)) | 0;
    mid = (mid + Math.imul(al0, bh8)) | 0;
    mid = (mid + Math.imul(ah0, bl8)) | 0;
    hi = (hi + Math.imul(ah0, bh8)) | 0;
    var w8 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w8 >>> 26)) | 0;
    w8 &= 0x3ffffff;
    /* k = 9 */
    lo = Math.imul(al9, bl0);
    mid = Math.imul(al9, bh0);
    mid = (mid + Math.imul(ah9, bl0)) | 0;
    hi = Math.imul(ah9, bh0);
    lo = (lo + Math.imul(al8, bl1)) | 0;
    mid = (mid + Math.imul(al8, bh1)) | 0;
    mid = (mid + Math.imul(ah8, bl1)) | 0;
    hi = (hi + Math.imul(ah8, bh1)) | 0;
    lo = (lo + Math.imul(al7, bl2)) | 0;
    mid = (mid + Math.imul(al7, bh2)) | 0;
    mid = (mid + Math.imul(ah7, bl2)) | 0;
    hi = (hi + Math.imul(ah7, bh2)) | 0;
    lo = (lo + Math.imul(al6, bl3)) | 0;
    mid = (mid + Math.imul(al6, bh3)) | 0;
    mid = (mid + Math.imul(ah6, bl3)) | 0;
    hi = (hi + Math.imul(ah6, bh3)) | 0;
    lo = (lo + Math.imul(al5, bl4)) | 0;
    mid = (mid + Math.imul(al5, bh4)) | 0;
    mid = (mid + Math.imul(ah5, bl4)) | 0;
    hi = (hi + Math.imul(ah5, bh4)) | 0;
    lo = (lo + Math.imul(al4, bl5)) | 0;
    mid = (mid + Math.imul(al4, bh5)) | 0;
    mid = (mid + Math.imul(ah4, bl5)) | 0;
    hi = (hi + Math.imul(ah4, bh5)) | 0;
    lo = (lo + Math.imul(al3, bl6)) | 0;
    mid = (mid + Math.imul(al3, bh6)) | 0;
    mid = (mid + Math.imul(ah3, bl6)) | 0;
    hi = (hi + Math.imul(ah3, bh6)) | 0;
    lo = (lo + Math.imul(al2, bl7)) | 0;
    mid = (mid + Math.imul(al2, bh7)) | 0;
    mid = (mid + Math.imul(ah2, bl7)) | 0;
    hi = (hi + Math.imul(ah2, bh7)) | 0;
    lo = (lo + Math.imul(al1, bl8)) | 0;
    mid = (mid + Math.imul(al1, bh8)) | 0;
    mid = (mid + Math.imul(ah1, bl8)) | 0;
    hi = (hi + Math.imul(ah1, bh8)) | 0;
    lo = (lo + Math.imul(al0, bl9)) | 0;
    mid = (mid + Math.imul(al0, bh9)) | 0;
    mid = (mid + Math.imul(ah0, bl9)) | 0;
    hi = (hi + Math.imul(ah0, bh9)) | 0;
    var w9 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w9 >>> 26)) | 0;
    w9 &= 0x3ffffff;
    /* k = 10 */
    lo = Math.imul(al9, bl1);
    mid = Math.imul(al9, bh1);
    mid = (mid + Math.imul(ah9, bl1)) | 0;
    hi = Math.imul(ah9, bh1);
    lo = (lo + Math.imul(al8, bl2)) | 0;
    mid = (mid + Math.imul(al8, bh2)) | 0;
    mid = (mid + Math.imul(ah8, bl2)) | 0;
    hi = (hi + Math.imul(ah8, bh2)) | 0;
    lo = (lo + Math.imul(al7, bl3)) | 0;
    mid = (mid + Math.imul(al7, bh3)) | 0;
    mid = (mid + Math.imul(ah7, bl3)) | 0;
    hi = (hi + Math.imul(ah7, bh3)) | 0;
    lo = (lo + Math.imul(al6, bl4)) | 0;
    mid = (mid + Math.imul(al6, bh4)) | 0;
    mid = (mid + Math.imul(ah6, bl4)) | 0;
    hi = (hi + Math.imul(ah6, bh4)) | 0;
    lo = (lo + Math.imul(al5, bl5)) | 0;
    mid = (mid + Math.imul(al5, bh5)) | 0;
    mid = (mid + Math.imul(ah5, bl5)) | 0;
    hi = (hi + Math.imul(ah5, bh5)) | 0;
    lo = (lo + Math.imul(al4, bl6)) | 0;
    mid = (mid + Math.imul(al4, bh6)) | 0;
    mid = (mid + Math.imul(ah4, bl6)) | 0;
    hi = (hi + Math.imul(ah4, bh6)) | 0;
    lo = (lo + Math.imul(al3, bl7)) | 0;
    mid = (mid + Math.imul(al3, bh7)) | 0;
    mid = (mid + Math.imul(ah3, bl7)) | 0;
    hi = (hi + Math.imul(ah3, bh7)) | 0;
    lo = (lo + Math.imul(al2, bl8)) | 0;
    mid = (mid + Math.imul(al2, bh8)) | 0;
    mid = (mid + Math.imul(ah2, bl8)) | 0;
    hi = (hi + Math.imul(ah2, bh8)) | 0;
    lo = (lo + Math.imul(al1, bl9)) | 0;
    mid = (mid + Math.imul(al1, bh9)) | 0;
    mid = (mid + Math.imul(ah1, bl9)) | 0;
    hi = (hi + Math.imul(ah1, bh9)) | 0;
    var w10 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w10 >>> 26)) | 0;
    w10 &= 0x3ffffff;
    /* k = 11 */
    lo = Math.imul(al9, bl2);
    mid = Math.imul(al9, bh2);
    mid = (mid + Math.imul(ah9, bl2)) | 0;
    hi = Math.imul(ah9, bh2);
    lo = (lo + Math.imul(al8, bl3)) | 0;
    mid = (mid + Math.imul(al8, bh3)) | 0;
    mid = (mid + Math.imul(ah8, bl3)) | 0;
    hi = (hi + Math.imul(ah8, bh3)) | 0;
    lo = (lo + Math.imul(al7, bl4)) | 0;
    mid = (mid + Math.imul(al7, bh4)) | 0;
    mid = (mid + Math.imul(ah7, bl4)) | 0;
    hi = (hi + Math.imul(ah7, bh4)) | 0;
    lo = (lo + Math.imul(al6, bl5)) | 0;
    mid = (mid + Math.imul(al6, bh5)) | 0;
    mid = (mid + Math.imul(ah6, bl5)) | 0;
    hi = (hi + Math.imul(ah6, bh5)) | 0;
    lo = (lo + Math.imul(al5, bl6)) | 0;
    mid = (mid + Math.imul(al5, bh6)) | 0;
    mid = (mid + Math.imul(ah5, bl6)) | 0;
    hi = (hi + Math.imul(ah5, bh6)) | 0;
    lo = (lo + Math.imul(al4, bl7)) | 0;
    mid = (mid + Math.imul(al4, bh7)) | 0;
    mid = (mid + Math.imul(ah4, bl7)) | 0;
    hi = (hi + Math.imul(ah4, bh7)) | 0;
    lo = (lo + Math.imul(al3, bl8)) | 0;
    mid = (mid + Math.imul(al3, bh8)) | 0;
    mid = (mid + Math.imul(ah3, bl8)) | 0;
    hi = (hi + Math.imul(ah3, bh8)) | 0;
    lo = (lo + Math.imul(al2, bl9)) | 0;
    mid = (mid + Math.imul(al2, bh9)) | 0;
    mid = (mid + Math.imul(ah2, bl9)) | 0;
    hi = (hi + Math.imul(ah2, bh9)) | 0;
    var w11 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w11 >>> 26)) | 0;
    w11 &= 0x3ffffff;
    /* k = 12 */
    lo = Math.imul(al9, bl3);
    mid = Math.imul(al9, bh3);
    mid = (mid + Math.imul(ah9, bl3)) | 0;
    hi = Math.imul(ah9, bh3);
    lo = (lo + Math.imul(al8, bl4)) | 0;
    mid = (mid + Math.imul(al8, bh4)) | 0;
    mid = (mid + Math.imul(ah8, bl4)) | 0;
    hi = (hi + Math.imul(ah8, bh4)) | 0;
    lo = (lo + Math.imul(al7, bl5)) | 0;
    mid = (mid + Math.imul(al7, bh5)) | 0;
    mid = (mid + Math.imul(ah7, bl5)) | 0;
    hi = (hi + Math.imul(ah7, bh5)) | 0;
    lo = (lo + Math.imul(al6, bl6)) | 0;
    mid = (mid + Math.imul(al6, bh6)) | 0;
    mid = (mid + Math.imul(ah6, bl6)) | 0;
    hi = (hi + Math.imul(ah6, bh6)) | 0;
    lo = (lo + Math.imul(al5, bl7)) | 0;
    mid = (mid + Math.imul(al5, bh7)) | 0;
    mid = (mid + Math.imul(ah5, bl7)) | 0;
    hi = (hi + Math.imul(ah5, bh7)) | 0;
    lo = (lo + Math.imul(al4, bl8)) | 0;
    mid = (mid + Math.imul(al4, bh8)) | 0;
    mid = (mid + Math.imul(ah4, bl8)) | 0;
    hi = (hi + Math.imul(ah4, bh8)) | 0;
    lo = (lo + Math.imul(al3, bl9)) | 0;
    mid = (mid + Math.imul(al3, bh9)) | 0;
    mid = (mid + Math.imul(ah3, bl9)) | 0;
    hi = (hi + Math.imul(ah3, bh9)) | 0;
    var w12 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w12 >>> 26)) | 0;
    w12 &= 0x3ffffff;
    /* k = 13 */
    lo = Math.imul(al9, bl4);
    mid = Math.imul(al9, bh4);
    mid = (mid + Math.imul(ah9, bl4)) | 0;
    hi = Math.imul(ah9, bh4);
    lo = (lo + Math.imul(al8, bl5)) | 0;
    mid = (mid + Math.imul(al8, bh5)) | 0;
    mid = (mid + Math.imul(ah8, bl5)) | 0;
    hi = (hi + Math.imul(ah8, bh5)) | 0;
    lo = (lo + Math.imul(al7, bl6)) | 0;
    mid = (mid + Math.imul(al7, bh6)) | 0;
    mid = (mid + Math.imul(ah7, bl6)) | 0;
    hi = (hi + Math.imul(ah7, bh6)) | 0;
    lo = (lo + Math.imul(al6, bl7)) | 0;
    mid = (mid + Math.imul(al6, bh7)) | 0;
    mid = (mid + Math.imul(ah6, bl7)) | 0;
    hi = (hi + Math.imul(ah6, bh7)) | 0;
    lo = (lo + Math.imul(al5, bl8)) | 0;
    mid = (mid + Math.imul(al5, bh8)) | 0;
    mid = (mid + Math.imul(ah5, bl8)) | 0;
    hi = (hi + Math.imul(ah5, bh8)) | 0;
    lo = (lo + Math.imul(al4, bl9)) | 0;
    mid = (mid + Math.imul(al4, bh9)) | 0;
    mid = (mid + Math.imul(ah4, bl9)) | 0;
    hi = (hi + Math.imul(ah4, bh9)) | 0;
    var w13 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w13 >>> 26)) | 0;
    w13 &= 0x3ffffff;
    /* k = 14 */
    lo = Math.imul(al9, bl5);
    mid = Math.imul(al9, bh5);
    mid = (mid + Math.imul(ah9, bl5)) | 0;
    hi = Math.imul(ah9, bh5);
    lo = (lo + Math.imul(al8, bl6)) | 0;
    mid = (mid + Math.imul(al8, bh6)) | 0;
    mid = (mid + Math.imul(ah8, bl6)) | 0;
    hi = (hi + Math.imul(ah8, bh6)) | 0;
    lo = (lo + Math.imul(al7, bl7)) | 0;
    mid = (mid + Math.imul(al7, bh7)) | 0;
    mid = (mid + Math.imul(ah7, bl7)) | 0;
    hi = (hi + Math.imul(ah7, bh7)) | 0;
    lo = (lo + Math.imul(al6, bl8)) | 0;
    mid = (mid + Math.imul(al6, bh8)) | 0;
    mid = (mid + Math.imul(ah6, bl8)) | 0;
    hi = (hi + Math.imul(ah6, bh8)) | 0;
    lo = (lo + Math.imul(al5, bl9)) | 0;
    mid = (mid + Math.imul(al5, bh9)) | 0;
    mid = (mid + Math.imul(ah5, bl9)) | 0;
    hi = (hi + Math.imul(ah5, bh9)) | 0;
    var w14 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w14 >>> 26)) | 0;
    w14 &= 0x3ffffff;
    /* k = 15 */
    lo = Math.imul(al9, bl6);
    mid = Math.imul(al9, bh6);
    mid = (mid + Math.imul(ah9, bl6)) | 0;
    hi = Math.imul(ah9, bh6);
    lo = (lo + Math.imul(al8, bl7)) | 0;
    mid = (mid + Math.imul(al8, bh7)) | 0;
    mid = (mid + Math.imul(ah8, bl7)) | 0;
    hi = (hi + Math.imul(ah8, bh7)) | 0;
    lo = (lo + Math.imul(al7, bl8)) | 0;
    mid = (mid + Math.imul(al7, bh8)) | 0;
    mid = (mid + Math.imul(ah7, bl8)) | 0;
    hi = (hi + Math.imul(ah7, bh8)) | 0;
    lo = (lo + Math.imul(al6, bl9)) | 0;
    mid = (mid + Math.imul(al6, bh9)) | 0;
    mid = (mid + Math.imul(ah6, bl9)) | 0;
    hi = (hi + Math.imul(ah6, bh9)) | 0;
    var w15 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w15 >>> 26)) | 0;
    w15 &= 0x3ffffff;
    /* k = 16 */
    lo = Math.imul(al9, bl7);
    mid = Math.imul(al9, bh7);
    mid = (mid + Math.imul(ah9, bl7)) | 0;
    hi = Math.imul(ah9, bh7);
    lo = (lo + Math.imul(al8, bl8)) | 0;
    mid = (mid + Math.imul(al8, bh8)) | 0;
    mid = (mid + Math.imul(ah8, bl8)) | 0;
    hi = (hi + Math.imul(ah8, bh8)) | 0;
    lo = (lo + Math.imul(al7, bl9)) | 0;
    mid = (mid + Math.imul(al7, bh9)) | 0;
    mid = (mid + Math.imul(ah7, bl9)) | 0;
    hi = (hi + Math.imul(ah7, bh9)) | 0;
    var w16 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w16 >>> 26)) | 0;
    w16 &= 0x3ffffff;
    /* k = 17 */
    lo = Math.imul(al9, bl8);
    mid = Math.imul(al9, bh8);
    mid = (mid + Math.imul(ah9, bl8)) | 0;
    hi = Math.imul(ah9, bh8);
    lo = (lo + Math.imul(al8, bl9)) | 0;
    mid = (mid + Math.imul(al8, bh9)) | 0;
    mid = (mid + Math.imul(ah8, bl9)) | 0;
    hi = (hi + Math.imul(ah8, bh9)) | 0;
    var w17 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w17 >>> 26)) | 0;
    w17 &= 0x3ffffff;
    /* k = 18 */
    lo = Math.imul(al9, bl9);
    mid = Math.imul(al9, bh9);
    mid = (mid + Math.imul(ah9, bl9)) | 0;
    hi = Math.imul(ah9, bh9);
    var w18 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w18 >>> 26)) | 0;
    w18 &= 0x3ffffff;
    o[0] = w0;
    o[1] = w1;
    o[2] = w2;
    o[3] = w3;
    o[4] = w4;
    o[5] = w5;
    o[6] = w6;
    o[7] = w7;
    o[8] = w8;
    o[9] = w9;
    o[10] = w10;
    o[11] = w11;
    o[12] = w12;
    o[13] = w13;
    o[14] = w14;
    o[15] = w15;
    o[16] = w16;
    o[17] = w17;
    o[18] = w18;
    if (c !== 0) {
      o[19] = c;
      out.length++;
    }
    return out;
  };

  // Polyfill comb
  if (!Math.imul) {
    comb10MulTo = smallMulTo;
  }

  function bigMulTo (self, num, out) {
    out.negative = num.negative ^ self.negative;
    out.length = self.length + num.length;

    var carry = 0;
    var hncarry = 0;
    for (var k = 0; k < out.length - 1; k++) {
      // Sum all words with the same `i + j = k` and accumulate `ncarry`,
      // note that ncarry could be >= 0x3ffffff
      var ncarry = hncarry;
      hncarry = 0;
      var rword = carry & 0x3ffffff;
      var maxJ = Math.min(k, num.length - 1);
      for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
        var i = k - j;
        var a = self.words[i] | 0;
        var b = num.words[j] | 0;
        var r = a * b;

        var lo = r & 0x3ffffff;
        ncarry = (ncarry + ((r / 0x4000000) | 0)) | 0;
        lo = (lo + rword) | 0;
        rword = lo & 0x3ffffff;
        ncarry = (ncarry + (lo >>> 26)) | 0;

        hncarry += ncarry >>> 26;
        ncarry &= 0x3ffffff;
      }
      out.words[k] = rword;
      carry = ncarry;
      ncarry = hncarry;
    }
    if (carry !== 0) {
      out.words[k] = carry;
    } else {
      out.length--;
    }

    return out._strip();
  }

  function jumboMulTo (self, num, out) {
    // Temporary disable, see https://github.com/indutny/bn.js/issues/211
    // var fftm = new FFTM();
    // return fftm.mulp(self, num, out);
    return bigMulTo(self, num, out);
  }

  BN.prototype.mulTo = function mulTo (num, out) {
    var res;
    var len = this.length + num.length;
    if (this.length === 10 && num.length === 10) {
      res = comb10MulTo(this, num, out);
    } else if (len < 63) {
      res = smallMulTo(this, num, out);
    } else if (len < 1024) {
      res = bigMulTo(this, num, out);
    } else {
      res = jumboMulTo(this, num, out);
    }

    return res;
  };

  // Cooley-Tukey algorithm for FFT
  // slightly revisited to rely on looping instead of recursion

  function FFTM (x, y) {
    this.x = x;
    this.y = y;
  }

  FFTM.prototype.makeRBT = function makeRBT (N) {
    var t = new Array(N);
    var l = BN.prototype._countBits(N) - 1;
    for (var i = 0; i < N; i++) {
      t[i] = this.revBin(i, l, N);
    }

    return t;
  };

  // Returns binary-reversed representation of `x`
  FFTM.prototype.revBin = function revBin (x, l, N) {
    if (x === 0 || x === N - 1) return x;

    var rb = 0;
    for (var i = 0; i < l; i++) {
      rb |= (x & 1) << (l - i - 1);
      x >>= 1;
    }

    return rb;
  };

  // Performs "tweedling" phase, therefore 'emulating'
  // behaviour of the recursive algorithm
  FFTM.prototype.permute = function permute (rbt, rws, iws, rtws, itws, N) {
    for (var i = 0; i < N; i++) {
      rtws[i] = rws[rbt[i]];
      itws[i] = iws[rbt[i]];
    }
  };

  FFTM.prototype.transform = function transform (rws, iws, rtws, itws, N, rbt) {
    this.permute(rbt, rws, iws, rtws, itws, N);

    for (var s = 1; s < N; s <<= 1) {
      var l = s << 1;

      var rtwdf = Math.cos(2 * Math.PI / l);
      var itwdf = Math.sin(2 * Math.PI / l);

      for (var p = 0; p < N; p += l) {
        var rtwdf_ = rtwdf;
        var itwdf_ = itwdf;

        for (var j = 0; j < s; j++) {
          var re = rtws[p + j];
          var ie = itws[p + j];

          var ro = rtws[p + j + s];
          var io = itws[p + j + s];

          var rx = rtwdf_ * ro - itwdf_ * io;

          io = rtwdf_ * io + itwdf_ * ro;
          ro = rx;

          rtws[p + j] = re + ro;
          itws[p + j] = ie + io;

          rtws[p + j + s] = re - ro;
          itws[p + j + s] = ie - io;

          /* jshint maxdepth : false */
          if (j !== l) {
            rx = rtwdf * rtwdf_ - itwdf * itwdf_;

            itwdf_ = rtwdf * itwdf_ + itwdf * rtwdf_;
            rtwdf_ = rx;
          }
        }
      }
    }
  };

  FFTM.prototype.guessLen13b = function guessLen13b (n, m) {
    var N = Math.max(m, n) | 1;
    var odd = N & 1;
    var i = 0;
    for (N = N / 2 | 0; N; N = N >>> 1) {
      i++;
    }

    return 1 << i + 1 + odd;
  };

  FFTM.prototype.conjugate = function conjugate (rws, iws, N) {
    if (N <= 1) return;

    for (var i = 0; i < N / 2; i++) {
      var t = rws[i];

      rws[i] = rws[N - i - 1];
      rws[N - i - 1] = t;

      t = iws[i];

      iws[i] = -iws[N - i - 1];
      iws[N - i - 1] = -t;
    }
  };

  FFTM.prototype.normalize13b = function normalize13b (ws, N) {
    var carry = 0;
    for (var i = 0; i < N / 2; i++) {
      var w = Math.round(ws[2 * i + 1] / N) * 0x2000 +
        Math.round(ws[2 * i] / N) +
        carry;

      ws[i] = w & 0x3ffffff;

      if (w < 0x4000000) {
        carry = 0;
      } else {
        carry = w / 0x4000000 | 0;
      }
    }

    return ws;
  };

  FFTM.prototype.convert13b = function convert13b (ws, len, rws, N) {
    var carry = 0;
    for (var i = 0; i < len; i++) {
      carry = carry + (ws[i] | 0);

      rws[2 * i] = carry & 0x1fff; carry = carry >>> 13;
      rws[2 * i + 1] = carry & 0x1fff; carry = carry >>> 13;
    }

    // Pad with zeroes
    for (i = 2 * len; i < N; ++i) {
      rws[i] = 0;
    }

    assert(carry === 0);
    assert((carry & ~0x1fff) === 0);
  };

  FFTM.prototype.stub = function stub (N) {
    var ph = new Array(N);
    for (var i = 0; i < N; i++) {
      ph[i] = 0;
    }

    return ph;
  };

  FFTM.prototype.mulp = function mulp (x, y, out) {
    var N = 2 * this.guessLen13b(x.length, y.length);

    var rbt = this.makeRBT(N);

    var _ = this.stub(N);

    var rws = new Array(N);
    var rwst = new Array(N);
    var iwst = new Array(N);

    var nrws = new Array(N);
    var nrwst = new Array(N);
    var niwst = new Array(N);

    var rmws = out.words;
    rmws.length = N;

    this.convert13b(x.words, x.length, rws, N);
    this.convert13b(y.words, y.length, nrws, N);

    this.transform(rws, _, rwst, iwst, N, rbt);
    this.transform(nrws, _, nrwst, niwst, N, rbt);

    for (var i = 0; i < N; i++) {
      var rx = rwst[i] * nrwst[i] - iwst[i] * niwst[i];
      iwst[i] = rwst[i] * niwst[i] + iwst[i] * nrwst[i];
      rwst[i] = rx;
    }

    this.conjugate(rwst, iwst, N);
    this.transform(rwst, iwst, rmws, _, N, rbt);
    this.conjugate(rmws, _, N);
    this.normalize13b(rmws, N);

    out.negative = x.negative ^ y.negative;
    out.length = x.length + y.length;
    return out._strip();
  };

  // Multiply `this` by `num`
  BN.prototype.mul = function mul (num) {
    var out = new BN(null);
    out.words = new Array(this.length + num.length);
    return this.mulTo(num, out);
  };

  // Multiply employing FFT
  BN.prototype.mulf = function mulf (num) {
    var out = new BN(null);
    out.words = new Array(this.length + num.length);
    return jumboMulTo(this, num, out);
  };

  // In-place Multiplication
  BN.prototype.imul = function imul (num) {
    return this.clone().mulTo(num, this);
  };

  BN.prototype.imuln = function imuln (num) {
    var isNegNum = num < 0;
    if (isNegNum) num = -num;

    assert(typeof num === 'number');
    assert(num < 0x4000000);

    // Carry
    var carry = 0;
    for (var i = 0; i < this.length; i++) {
      var w = (this.words[i] | 0) * num;
      var lo = (w & 0x3ffffff) + (carry & 0x3ffffff);
      carry >>= 26;
      carry += (w / 0x4000000) | 0;
      // NOTE: lo is 27bit maximum
      carry += lo >>> 26;
      this.words[i] = lo & 0x3ffffff;
    }

    if (carry !== 0) {
      this.words[i] = carry;
      this.length++;
    }

    return isNegNum ? this.ineg() : this;
  };

  BN.prototype.muln = function muln (num) {
    return this.clone().imuln(num);
  };

  // `this` * `this`
  BN.prototype.sqr = function sqr () {
    return this.mul(this);
  };

  // `this` * `this` in-place
  BN.prototype.isqr = function isqr () {
    return this.imul(this.clone());
  };

  // Math.pow(`this`, `num`)
  BN.prototype.pow = function pow (num) {
    var w = toBitArray(num);
    if (w.length === 0) return new BN(1);

    // Skip leading zeroes
    var res = this;
    for (var i = 0; i < w.length; i++, res = res.sqr()) {
      if (w[i] !== 0) break;
    }

    if (++i < w.length) {
      for (var q = res.sqr(); i < w.length; i++, q = q.sqr()) {
        if (w[i] === 0) continue;

        res = res.mul(q);
      }
    }

    return res;
  };

  // Shift-left in-place
  BN.prototype.iushln = function iushln (bits) {
    assert(typeof bits === 'number' && bits >= 0);
    var r = bits % 26;
    var s = (bits - r) / 26;
    var carryMask = (0x3ffffff >>> (26 - r)) << (26 - r);
    var i;

    if (r !== 0) {
      var carry = 0;

      for (i = 0; i < this.length; i++) {
        var newCarry = this.words[i] & carryMask;
        var c = ((this.words[i] | 0) - newCarry) << r;
        this.words[i] = c | carry;
        carry = newCarry >>> (26 - r);
      }

      if (carry) {
        this.words[i] = carry;
        this.length++;
      }
    }

    if (s !== 0) {
      for (i = this.length - 1; i >= 0; i--) {
        this.words[i + s] = this.words[i];
      }

      for (i = 0; i < s; i++) {
        this.words[i] = 0;
      }

      this.length += s;
    }

    return this._strip();
  };

  BN.prototype.ishln = function ishln (bits) {
    // TODO(indutny): implement me
    assert(this.negative === 0);
    return this.iushln(bits);
  };

  // Shift-right in-place
  // NOTE: `hint` is a lowest bit before trailing zeroes
  // NOTE: if `extended` is present - it will be filled with destroyed bits
  BN.prototype.iushrn = function iushrn (bits, hint, extended) {
    assert(typeof bits === 'number' && bits >= 0);
    var h;
    if (hint) {
      h = (hint - (hint % 26)) / 26;
    } else {
      h = 0;
    }

    var r = bits % 26;
    var s = Math.min((bits - r) / 26, this.length);
    var mask = 0x3ffffff ^ ((0x3ffffff >>> r) << r);
    var maskedWords = extended;

    h -= s;
    h = Math.max(0, h);

    // Extended mode, copy masked part
    if (maskedWords) {
      for (var i = 0; i < s; i++) {
        maskedWords.words[i] = this.words[i];
      }
      maskedWords.length = s;
    }

    if (s === 0) {
      // No-op, we should not move anything at all
    } else if (this.length > s) {
      this.length -= s;
      for (i = 0; i < this.length; i++) {
        this.words[i] = this.words[i + s];
      }
    } else {
      this.words[0] = 0;
      this.length = 1;
    }

    var carry = 0;
    for (i = this.length - 1; i >= 0 && (carry !== 0 || i >= h); i--) {
      var word = this.words[i] | 0;
      this.words[i] = (carry << (26 - r)) | (word >>> r);
      carry = word & mask;
    }

    // Push carried bits as a mask
    if (maskedWords && carry !== 0) {
      maskedWords.words[maskedWords.length++] = carry;
    }

    if (this.length === 0) {
      this.words[0] = 0;
      this.length = 1;
    }

    return this._strip();
  };

  BN.prototype.ishrn = function ishrn (bits, hint, extended) {
    // TODO(indutny): implement me
    assert(this.negative === 0);
    return this.iushrn(bits, hint, extended);
  };

  // Shift-left
  BN.prototype.shln = function shln (bits) {
    return this.clone().ishln(bits);
  };

  BN.prototype.ushln = function ushln (bits) {
    return this.clone().iushln(bits);
  };

  // Shift-right
  BN.prototype.shrn = function shrn (bits) {
    return this.clone().ishrn(bits);
  };

  BN.prototype.ushrn = function ushrn (bits) {
    return this.clone().iushrn(bits);
  };

  // Test if n bit is set
  BN.prototype.testn = function testn (bit) {
    assert(typeof bit === 'number' && bit >= 0);
    var r = bit % 26;
    var s = (bit - r) / 26;
    var q = 1 << r;

    // Fast case: bit is much higher than all existing words
    if (this.length <= s) return false;

    // Check bit and return
    var w = this.words[s];

    return !!(w & q);
  };

  // Return only lowers bits of number (in-place)
  BN.prototype.imaskn = function imaskn (bits) {
    assert(typeof bits === 'number' && bits >= 0);
    var r = bits % 26;
    var s = (bits - r) / 26;

    assert(this.negative === 0, 'imaskn works only with positive numbers');

    if (this.length <= s) {
      return this;
    }

    if (r !== 0) {
      s++;
    }
    this.length = Math.min(s, this.length);

    if (r !== 0) {
      var mask = 0x3ffffff ^ ((0x3ffffff >>> r) << r);
      this.words[this.length - 1] &= mask;
    }

    return this._strip();
  };

  // Return only lowers bits of number
  BN.prototype.maskn = function maskn (bits) {
    return this.clone().imaskn(bits);
  };

  // Add plain number `num` to `this`
  BN.prototype.iaddn = function iaddn (num) {
    assert(typeof num === 'number');
    assert(num < 0x4000000);
    if (num < 0) return this.isubn(-num);

    // Possible sign change
    if (this.negative !== 0) {
      if (this.length === 1 && (this.words[0] | 0) <= num) {
        this.words[0] = num - (this.words[0] | 0);
        this.negative = 0;
        return this;
      }

      this.negative = 0;
      this.isubn(num);
      this.negative = 1;
      return this;
    }

    // Add without checks
    return this._iaddn(num);
  };

  BN.prototype._iaddn = function _iaddn (num) {
    this.words[0] += num;

    // Carry
    for (var i = 0; i < this.length && this.words[i] >= 0x4000000; i++) {
      this.words[i] -= 0x4000000;
      if (i === this.length - 1) {
        this.words[i + 1] = 1;
      } else {
        this.words[i + 1]++;
      }
    }
    this.length = Math.max(this.length, i + 1);

    return this;
  };

  // Subtract plain number `num` from `this`
  BN.prototype.isubn = function isubn (num) {
    assert(typeof num === 'number');
    assert(num < 0x4000000);
    if (num < 0) return this.iaddn(-num);

    if (this.negative !== 0) {
      this.negative = 0;
      this.iaddn(num);
      this.negative = 1;
      return this;
    }

    this.words[0] -= num;

    if (this.length === 1 && this.words[0] < 0) {
      this.words[0] = -this.words[0];
      this.negative = 1;
    } else {
      // Carry
      for (var i = 0; i < this.length && this.words[i] < 0; i++) {
        this.words[i] += 0x4000000;
        this.words[i + 1] -= 1;
      }
    }

    return this._strip();
  };

  BN.prototype.addn = function addn (num) {
    return this.clone().iaddn(num);
  };

  BN.prototype.subn = function subn (num) {
    return this.clone().isubn(num);
  };

  BN.prototype.iabs = function iabs () {
    this.negative = 0;

    return this;
  };

  BN.prototype.abs = function abs () {
    return this.clone().iabs();
  };

  BN.prototype._ishlnsubmul = function _ishlnsubmul (num, mul, shift) {
    var len = num.length + shift;
    var i;

    this._expand(len);

    var w;
    var carry = 0;
    for (i = 0; i < num.length; i++) {
      w = (this.words[i + shift] | 0) + carry;
      var right = (num.words[i] | 0) * mul;
      w -= right & 0x3ffffff;
      carry = (w >> 26) - ((right / 0x4000000) | 0);
      this.words[i + shift] = w & 0x3ffffff;
    }
    for (; i < this.length - shift; i++) {
      w = (this.words[i + shift] | 0) + carry;
      carry = w >> 26;
      this.words[i + shift] = w & 0x3ffffff;
    }

    if (carry === 0) return this._strip();

    // Subtraction overflow
    assert(carry === -1);
    carry = 0;
    for (i = 0; i < this.length; i++) {
      w = -(this.words[i] | 0) + carry;
      carry = w >> 26;
      this.words[i] = w & 0x3ffffff;
    }
    this.negative = 1;

    return this._strip();
  };

  BN.prototype._wordDiv = function _wordDiv (num, mode) {
    var shift = this.length - num.length;

    var a = this.clone();
    var b = num;

    // Normalize
    var bhi = b.words[b.length - 1] | 0;
    var bhiBits = this._countBits(bhi);
    shift = 26 - bhiBits;
    if (shift !== 0) {
      b = b.ushln(shift);
      a.iushln(shift);
      bhi = b.words[b.length - 1] | 0;
    }

    // Initialize quotient
    var m = a.length - b.length;
    var q;

    if (mode !== 'mod') {
      q = new BN(null);
      q.length = m + 1;
      q.words = new Array(q.length);
      for (var i = 0; i < q.length; i++) {
        q.words[i] = 0;
      }
    }

    var diff = a.clone()._ishlnsubmul(b, 1, m);
    if (diff.negative === 0) {
      a = diff;
      if (q) {
        q.words[m] = 1;
      }
    }

    for (var j = m - 1; j >= 0; j--) {
      var qj = (a.words[b.length + j] | 0) * 0x4000000 +
        (a.words[b.length + j - 1] | 0);

      // NOTE: (qj / bhi) is (0x3ffffff * 0x4000000 + 0x3ffffff) / 0x2000000 max
      // (0x7ffffff)
      qj = Math.min((qj / bhi) | 0, 0x3ffffff);

      a._ishlnsubmul(b, qj, j);
      while (a.negative !== 0) {
        qj--;
        a.negative = 0;
        a._ishlnsubmul(b, 1, j);
        if (!a.isZero()) {
          a.negative ^= 1;
        }
      }
      if (q) {
        q.words[j] = qj;
      }
    }
    if (q) {
      q._strip();
    }
    a._strip();

    // Denormalize
    if (mode !== 'div' && shift !== 0) {
      a.iushrn(shift);
    }

    return {
      div: q || null,
      mod: a
    };
  };

  // NOTE: 1) `mode` can be set to `mod` to request mod only,
  //       to `div` to request div only, or be absent to
  //       request both div & mod
  //       2) `positive` is true if unsigned mod is requested
  BN.prototype.divmod = function divmod (num, mode, positive) {
    assert(!num.isZero());

    if (this.isZero()) {
      return {
        div: new BN(0),
        mod: new BN(0)
      };
    }

    var div, mod, res;
    if (this.negative !== 0 && num.negative === 0) {
      res = this.neg().divmod(num, mode);

      if (mode !== 'mod') {
        div = res.div.neg();
      }

      if (mode !== 'div') {
        mod = res.mod.neg();
        if (positive && mod.negative !== 0) {
          mod.iadd(num);
        }
      }

      return {
        div: div,
        mod: mod
      };
    }

    if (this.negative === 0 && num.negative !== 0) {
      res = this.divmod(num.neg(), mode);

      if (mode !== 'mod') {
        div = res.div.neg();
      }

      return {
        div: div,
        mod: res.mod
      };
    }

    if ((this.negative & num.negative) !== 0) {
      res = this.neg().divmod(num.neg(), mode);

      if (mode !== 'div') {
        mod = res.mod.neg();
        if (positive && mod.negative !== 0) {
          mod.isub(num);
        }
      }

      return {
        div: res.div,
        mod: mod
      };
    }

    // Both numbers are positive at this point

    // Strip both numbers to approximate shift value
    if (num.length > this.length || this.cmp(num) < 0) {
      return {
        div: new BN(0),
        mod: this
      };
    }

    // Very short reduction
    if (num.length === 1) {
      if (mode === 'div') {
        return {
          div: this.divn(num.words[0]),
          mod: null
        };
      }

      if (mode === 'mod') {
        return {
          div: null,
          mod: new BN(this.modrn(num.words[0]))
        };
      }

      return {
        div: this.divn(num.words[0]),
        mod: new BN(this.modrn(num.words[0]))
      };
    }

    return this._wordDiv(num, mode);
  };

  // Find `this` / `num`
  BN.prototype.div = function div (num) {
    return this.divmod(num, 'div', false).div;
  };

  // Find `this` % `num`
  BN.prototype.mod = function mod (num) {
    return this.divmod(num, 'mod', false).mod;
  };

  BN.prototype.umod = function umod (num) {
    return this.divmod(num, 'mod', true).mod;
  };

  // Find Round(`this` / `num`)
  BN.prototype.divRound = function divRound (num) {
    var dm = this.divmod(num);

    // Fast case - exact division
    if (dm.mod.isZero()) return dm.div;

    var mod = dm.div.negative !== 0 ? dm.mod.isub(num) : dm.mod;

    var half = num.ushrn(1);
    var r2 = num.andln(1);
    var cmp = mod.cmp(half);

    // Round down
    if (cmp < 0 || (r2 === 1 && cmp === 0)) return dm.div;

    // Round up
    return dm.div.negative !== 0 ? dm.div.isubn(1) : dm.div.iaddn(1);
  };

  BN.prototype.modrn = function modrn (num) {
    var isNegNum = num < 0;
    if (isNegNum) num = -num;

    assert(num <= 0x3ffffff);
    var p = (1 << 26) % num;

    var acc = 0;
    for (var i = this.length - 1; i >= 0; i--) {
      acc = (p * acc + (this.words[i] | 0)) % num;
    }

    return isNegNum ? -acc : acc;
  };

  // WARNING: DEPRECATED
  BN.prototype.modn = function modn (num) {
    return this.modrn(num);
  };

  // In-place division by number
  BN.prototype.idivn = function idivn (num) {
    var isNegNum = num < 0;
    if (isNegNum) num = -num;

    assert(num <= 0x3ffffff);

    var carry = 0;
    for (var i = this.length - 1; i >= 0; i--) {
      var w = (this.words[i] | 0) + carry * 0x4000000;
      this.words[i] = (w / num) | 0;
      carry = w % num;
    }

    this._strip();
    return isNegNum ? this.ineg() : this;
  };

  BN.prototype.divn = function divn (num) {
    return this.clone().idivn(num);
  };

  BN.prototype.egcd = function egcd (p) {
    assert(p.negative === 0);
    assert(!p.isZero());

    var x = this;
    var y = p.clone();

    if (x.negative !== 0) {
      x = x.umod(p);
    } else {
      x = x.clone();
    }

    // A * x + B * y = x
    var A = new BN(1);
    var B = new BN(0);

    // C * x + D * y = y
    var C = new BN(0);
    var D = new BN(1);

    var g = 0;

    while (x.isEven() && y.isEven()) {
      x.iushrn(1);
      y.iushrn(1);
      ++g;
    }

    var yp = y.clone();
    var xp = x.clone();

    while (!x.isZero()) {
      for (var i = 0, im = 1; (x.words[0] & im) === 0 && i < 26; ++i, im <<= 1);
      if (i > 0) {
        x.iushrn(i);
        while (i-- > 0) {
          if (A.isOdd() || B.isOdd()) {
            A.iadd(yp);
            B.isub(xp);
          }

          A.iushrn(1);
          B.iushrn(1);
        }
      }

      for (var j = 0, jm = 1; (y.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1);
      if (j > 0) {
        y.iushrn(j);
        while (j-- > 0) {
          if (C.isOdd() || D.isOdd()) {
            C.iadd(yp);
            D.isub(xp);
          }

          C.iushrn(1);
          D.iushrn(1);
        }
      }

      if (x.cmp(y) >= 0) {
        x.isub(y);
        A.isub(C);
        B.isub(D);
      } else {
        y.isub(x);
        C.isub(A);
        D.isub(B);
      }
    }

    return {
      a: C,
      b: D,
      gcd: y.iushln(g)
    };
  };

  // This is reduced incarnation of the binary EEA
  // above, designated to invert members of the
  // _prime_ fields F(p) at a maximal speed
  BN.prototype._invmp = function _invmp (p) {
    assert(p.negative === 0);
    assert(!p.isZero());

    var a = this;
    var b = p.clone();

    if (a.negative !== 0) {
      a = a.umod(p);
    } else {
      a = a.clone();
    }

    var x1 = new BN(1);
    var x2 = new BN(0);

    var delta = b.clone();

    while (a.cmpn(1) > 0 && b.cmpn(1) > 0) {
      for (var i = 0, im = 1; (a.words[0] & im) === 0 && i < 26; ++i, im <<= 1);
      if (i > 0) {
        a.iushrn(i);
        while (i-- > 0) {
          if (x1.isOdd()) {
            x1.iadd(delta);
          }

          x1.iushrn(1);
        }
      }

      for (var j = 0, jm = 1; (b.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1);
      if (j > 0) {
        b.iushrn(j);
        while (j-- > 0) {
          if (x2.isOdd()) {
            x2.iadd(delta);
          }

          x2.iushrn(1);
        }
      }

      if (a.cmp(b) >= 0) {
        a.isub(b);
        x1.isub(x2);
      } else {
        b.isub(a);
        x2.isub(x1);
      }
    }

    var res;
    if (a.cmpn(1) === 0) {
      res = x1;
    } else {
      res = x2;
    }

    if (res.cmpn(0) < 0) {
      res.iadd(p);
    }

    return res;
  };

  BN.prototype.gcd = function gcd (num) {
    if (this.isZero()) return num.abs();
    if (num.isZero()) return this.abs();

    var a = this.clone();
    var b = num.clone();
    a.negative = 0;
    b.negative = 0;

    // Remove common factor of two
    for (var shift = 0; a.isEven() && b.isEven(); shift++) {
      a.iushrn(1);
      b.iushrn(1);
    }

    do {
      while (a.isEven()) {
        a.iushrn(1);
      }
      while (b.isEven()) {
        b.iushrn(1);
      }

      var r = a.cmp(b);
      if (r < 0) {
        // Swap `a` and `b` to make `a` always bigger than `b`
        var t = a;
        a = b;
        b = t;
      } else if (r === 0 || b.cmpn(1) === 0) {
        break;
      }

      a.isub(b);
    } while (true);

    return b.iushln(shift);
  };

  // Invert number in the field F(num)
  BN.prototype.invm = function invm (num) {
    return this.egcd(num).a.umod(num);
  };

  BN.prototype.isEven = function isEven () {
    return (this.words[0] & 1) === 0;
  };

  BN.prototype.isOdd = function isOdd () {
    return (this.words[0] & 1) === 1;
  };

  // And first word and num
  BN.prototype.andln = function andln (num) {
    return this.words[0] & num;
  };

  // Increment at the bit position in-line
  BN.prototype.bincn = function bincn (bit) {
    assert(typeof bit === 'number');
    var r = bit % 26;
    var s = (bit - r) / 26;
    var q = 1 << r;

    // Fast case: bit is much higher than all existing words
    if (this.length <= s) {
      this._expand(s + 1);
      this.words[s] |= q;
      return this;
    }

    // Add bit and propagate, if needed
    var carry = q;
    for (var i = s; carry !== 0 && i < this.length; i++) {
      var w = this.words[i] | 0;
      w += carry;
      carry = w >>> 26;
      w &= 0x3ffffff;
      this.words[i] = w;
    }
    if (carry !== 0) {
      this.words[i] = carry;
      this.length++;
    }
    return this;
  };

  BN.prototype.isZero = function isZero () {
    return this.length === 1 && this.words[0] === 0;
  };

  BN.prototype.cmpn = function cmpn (num) {
    var negative = num < 0;

    if (this.negative !== 0 && !negative) return -1;
    if (this.negative === 0 && negative) return 1;

    this._strip();

    var res;
    if (this.length > 1) {
      res = 1;
    } else {
      if (negative) {
        num = -num;
      }

      assert(num <= 0x3ffffff, 'Number is too big');

      var w = this.words[0] | 0;
      res = w === num ? 0 : w < num ? -1 : 1;
    }
    if (this.negative !== 0) return -res | 0;
    return res;
  };

  // Compare two numbers and return:
  // 1 - if `this` > `num`
  // 0 - if `this` == `num`
  // -1 - if `this` < `num`
  BN.prototype.cmp = function cmp (num) {
    if (this.negative !== 0 && num.negative === 0) return -1;
    if (this.negative === 0 && num.negative !== 0) return 1;

    var res = this.ucmp(num);
    if (this.negative !== 0) return -res | 0;
    return res;
  };

  // Unsigned comparison
  BN.prototype.ucmp = function ucmp (num) {
    // At this point both numbers have the same sign
    if (this.length > num.length) return 1;
    if (this.length < num.length) return -1;

    var res = 0;
    for (var i = this.length - 1; i >= 0; i--) {
      var a = this.words[i] | 0;
      var b = num.words[i] | 0;

      if (a === b) continue;
      if (a < b) {
        res = -1;
      } else if (a > b) {
        res = 1;
      }
      break;
    }
    return res;
  };

  BN.prototype.gtn = function gtn (num) {
    return this.cmpn(num) === 1;
  };

  BN.prototype.gt = function gt (num) {
    return this.cmp(num) === 1;
  };

  BN.prototype.gten = function gten (num) {
    return this.cmpn(num) >= 0;
  };

  BN.prototype.gte = function gte (num) {
    return this.cmp(num) >= 0;
  };

  BN.prototype.ltn = function ltn (num) {
    return this.cmpn(num) === -1;
  };

  BN.prototype.lt = function lt (num) {
    return this.cmp(num) === -1;
  };

  BN.prototype.lten = function lten (num) {
    return this.cmpn(num) <= 0;
  };

  BN.prototype.lte = function lte (num) {
    return this.cmp(num) <= 0;
  };

  BN.prototype.eqn = function eqn (num) {
    return this.cmpn(num) === 0;
  };

  BN.prototype.eq = function eq (num) {
    return this.cmp(num) === 0;
  };

  //
  // A reduce context, could be using montgomery or something better, depending
  // on the `m` itself.
  //
  BN.red = function red (num) {
    return new Red(num);
  };

  BN.prototype.toRed = function toRed (ctx) {
    assert(!this.red, 'Already a number in reduction context');
    assert(this.negative === 0, 'red works only with positives');
    return ctx.convertTo(this)._forceRed(ctx);
  };

  BN.prototype.fromRed = function fromRed () {
    assert(this.red, 'fromRed works only with numbers in reduction context');
    return this.red.convertFrom(this);
  };

  BN.prototype._forceRed = function _forceRed (ctx) {
    this.red = ctx;
    return this;
  };

  BN.prototype.forceRed = function forceRed (ctx) {
    assert(!this.red, 'Already a number in reduction context');
    return this._forceRed(ctx);
  };

  BN.prototype.redAdd = function redAdd (num) {
    assert(this.red, 'redAdd works only with red numbers');
    return this.red.add(this, num);
  };

  BN.prototype.redIAdd = function redIAdd (num) {
    assert(this.red, 'redIAdd works only with red numbers');
    return this.red.iadd(this, num);
  };

  BN.prototype.redSub = function redSub (num) {
    assert(this.red, 'redSub works only with red numbers');
    return this.red.sub(this, num);
  };

  BN.prototype.redISub = function redISub (num) {
    assert(this.red, 'redISub works only with red numbers');
    return this.red.isub(this, num);
  };

  BN.prototype.redShl = function redShl (num) {
    assert(this.red, 'redShl works only with red numbers');
    return this.red.shl(this, num);
  };

  BN.prototype.redMul = function redMul (num) {
    assert(this.red, 'redMul works only with red numbers');
    this.red._verify2(this, num);
    return this.red.mul(this, num);
  };

  BN.prototype.redIMul = function redIMul (num) {
    assert(this.red, 'redMul works only with red numbers');
    this.red._verify2(this, num);
    return this.red.imul(this, num);
  };

  BN.prototype.redSqr = function redSqr () {
    assert(this.red, 'redSqr works only with red numbers');
    this.red._verify1(this);
    return this.red.sqr(this);
  };

  BN.prototype.redISqr = function redISqr () {
    assert(this.red, 'redISqr works only with red numbers');
    this.red._verify1(this);
    return this.red.isqr(this);
  };

  // Square root over p
  BN.prototype.redSqrt = function redSqrt () {
    assert(this.red, 'redSqrt works only with red numbers');
    this.red._verify1(this);
    return this.red.sqrt(this);
  };

  BN.prototype.redInvm = function redInvm () {
    assert(this.red, 'redInvm works only with red numbers');
    this.red._verify1(this);
    return this.red.invm(this);
  };

  // Return negative clone of `this` % `red modulo`
  BN.prototype.redNeg = function redNeg () {
    assert(this.red, 'redNeg works only with red numbers');
    this.red._verify1(this);
    return this.red.neg(this);
  };

  BN.prototype.redPow = function redPow (num) {
    assert(this.red && !num.red, 'redPow(normalNum)');
    this.red._verify1(this);
    return this.red.pow(this, num);
  };

  // Prime numbers with efficient reduction
  var primes = {
    k256: null,
    p224: null,
    p192: null,
    p25519: null
  };

  // Pseudo-Mersenne prime
  function MPrime (name, p) {
    // P = 2 ^ N - K
    this.name = name;
    this.p = new BN(p, 16);
    this.n = this.p.bitLength();
    this.k = new BN(1).iushln(this.n).isub(this.p);

    this.tmp = this._tmp();
  }

  MPrime.prototype._tmp = function _tmp () {
    var tmp = new BN(null);
    tmp.words = new Array(Math.ceil(this.n / 13));
    return tmp;
  };

  MPrime.prototype.ireduce = function ireduce (num) {
    // Assumes that `num` is less than `P^2`
    // num = HI * (2 ^ N - K) + HI * K + LO = HI * K + LO (mod P)
    var r = num;
    var rlen;

    do {
      this.split(r, this.tmp);
      r = this.imulK(r);
      r = r.iadd(this.tmp);
      rlen = r.bitLength();
    } while (rlen > this.n);

    var cmp = rlen < this.n ? -1 : r.ucmp(this.p);
    if (cmp === 0) {
      r.words[0] = 0;
      r.length = 1;
    } else if (cmp > 0) {
      r.isub(this.p);
    } else {
      if (r.strip !== undefined) {
        // r is a BN v4 instance
        r.strip();
      } else {
        // r is a BN v5 instance
        r._strip();
      }
    }

    return r;
  };

  MPrime.prototype.split = function split (input, out) {
    input.iushrn(this.n, 0, out);
  };

  MPrime.prototype.imulK = function imulK (num) {
    return num.imul(this.k);
  };

  function K256 () {
    MPrime.call(
      this,
      'k256',
      'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe fffffc2f');
  }
  inherits(K256, MPrime);

  K256.prototype.split = function split (input, output) {
    // 256 = 9 * 26 + 22
    var mask = 0x3fffff;

    var outLen = Math.min(input.length, 9);
    for (var i = 0; i < outLen; i++) {
      output.words[i] = input.words[i];
    }
    output.length = outLen;

    if (input.length <= 9) {
      input.words[0] = 0;
      input.length = 1;
      return;
    }

    // Shift by 9 limbs
    var prev = input.words[9];
    output.words[output.length++] = prev & mask;

    for (i = 10; i < input.length; i++) {
      var next = input.words[i] | 0;
      input.words[i - 10] = ((next & mask) << 4) | (prev >>> 22);
      prev = next;
    }
    prev >>>= 22;
    input.words[i - 10] = prev;
    if (prev === 0 && input.length > 10) {
      input.length -= 10;
    } else {
      input.length -= 9;
    }
  };

  K256.prototype.imulK = function imulK (num) {
    // K = 0x1000003d1 = [ 0x40, 0x3d1 ]
    num.words[num.length] = 0;
    num.words[num.length + 1] = 0;
    num.length += 2;

    // bounded at: 0x40 * 0x3ffffff + 0x3d0 = 0x100000390
    var lo = 0;
    for (var i = 0; i < num.length; i++) {
      var w = num.words[i] | 0;
      lo += w * 0x3d1;
      num.words[i] = lo & 0x3ffffff;
      lo = w * 0x40 + ((lo / 0x4000000) | 0);
    }

    // Fast length reduction
    if (num.words[num.length - 1] === 0) {
      num.length--;
      if (num.words[num.length - 1] === 0) {
        num.length--;
      }
    }
    return num;
  };

  function P224 () {
    MPrime.call(
      this,
      'p224',
      'ffffffff ffffffff ffffffff ffffffff 00000000 00000000 00000001');
  }
  inherits(P224, MPrime);

  function P192 () {
    MPrime.call(
      this,
      'p192',
      'ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff');
  }
  inherits(P192, MPrime);

  function P25519 () {
    // 2 ^ 255 - 19
    MPrime.call(
      this,
      '25519',
      '7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed');
  }
  inherits(P25519, MPrime);

  P25519.prototype.imulK = function imulK (num) {
    // K = 0x13
    var carry = 0;
    for (var i = 0; i < num.length; i++) {
      var hi = (num.words[i] | 0) * 0x13 + carry;
      var lo = hi & 0x3ffffff;
      hi >>>= 26;

      num.words[i] = lo;
      carry = hi;
    }
    if (carry !== 0) {
      num.words[num.length++] = carry;
    }
    return num;
  };

  // Exported mostly for testing purposes, use plain name instead
  BN._prime = function prime (name) {
    // Cached version of prime
    if (primes[name]) return primes[name];

    var prime;
    if (name === 'k256') {
      prime = new K256();
    } else if (name === 'p224') {
      prime = new P224();
    } else if (name === 'p192') {
      prime = new P192();
    } else if (name === 'p25519') {
      prime = new P25519();
    } else {
      throw new Error('Unknown prime ' + name);
    }
    primes[name] = prime;

    return prime;
  };

  //
  // Base reduction engine
  //
  function Red (m) {
    if (typeof m === 'string') {
      var prime = BN._prime(m);
      this.m = prime.p;
      this.prime = prime;
    } else {
      assert(m.gtn(1), 'modulus must be greater than 1');
      this.m = m;
      this.prime = null;
    }
  }

  Red.prototype._verify1 = function _verify1 (a) {
    assert(a.negative === 0, 'red works only with positives');
    assert(a.red, 'red works only with red numbers');
  };

  Red.prototype._verify2 = function _verify2 (a, b) {
    assert((a.negative | b.negative) === 0, 'red works only with positives');
    assert(a.red && a.red === b.red,
      'red works only with red numbers');
  };

  Red.prototype.imod = function imod (a) {
    if (this.prime) return this.prime.ireduce(a)._forceRed(this);

    move(a, a.umod(this.m)._forceRed(this));
    return a;
  };

  Red.prototype.neg = function neg (a) {
    if (a.isZero()) {
      return a.clone();
    }

    return this.m.sub(a)._forceRed(this);
  };

  Red.prototype.add = function add (a, b) {
    this._verify2(a, b);

    var res = a.add(b);
    if (res.cmp(this.m) >= 0) {
      res.isub(this.m);
    }
    return res._forceRed(this);
  };

  Red.prototype.iadd = function iadd (a, b) {
    this._verify2(a, b);

    var res = a.iadd(b);
    if (res.cmp(this.m) >= 0) {
      res.isub(this.m);
    }
    return res;
  };

  Red.prototype.sub = function sub (a, b) {
    this._verify2(a, b);

    var res = a.sub(b);
    if (res.cmpn(0) < 0) {
      res.iadd(this.m);
    }
    return res._forceRed(this);
  };

  Red.prototype.isub = function isub (a, b) {
    this._verify2(a, b);

    var res = a.isub(b);
    if (res.cmpn(0) < 0) {
      res.iadd(this.m);
    }
    return res;
  };

  Red.prototype.shl = function shl (a, num) {
    this._verify1(a);
    return this.imod(a.ushln(num));
  };

  Red.prototype.imul = function imul (a, b) {
    this._verify2(a, b);
    return this.imod(a.imul(b));
  };

  Red.prototype.mul = function mul (a, b) {
    this._verify2(a, b);
    return this.imod(a.mul(b));
  };

  Red.prototype.isqr = function isqr (a) {
    return this.imul(a, a.clone());
  };

  Red.prototype.sqr = function sqr (a) {
    return this.mul(a, a);
  };

  Red.prototype.sqrt = function sqrt (a) {
    if (a.isZero()) return a.clone();

    var mod3 = this.m.andln(3);
    assert(mod3 % 2 === 1);

    // Fast case
    if (mod3 === 3) {
      var pow = this.m.add(new BN(1)).iushrn(2);
      return this.pow(a, pow);
    }

    // Tonelli-Shanks algorithm (Totally unoptimized and slow)
    //
    // Find Q and S, that Q * 2 ^ S = (P - 1)
    var q = this.m.subn(1);
    var s = 0;
    while (!q.isZero() && q.andln(1) === 0) {
      s++;
      q.iushrn(1);
    }
    assert(!q.isZero());

    var one = new BN(1).toRed(this);
    var nOne = one.redNeg();

    // Find quadratic non-residue
    // NOTE: Max is such because of generalized Riemann hypothesis.
    var lpow = this.m.subn(1).iushrn(1);
    var z = this.m.bitLength();
    z = new BN(2 * z * z).toRed(this);

    while (this.pow(z, lpow).cmp(nOne) !== 0) {
      z.redIAdd(nOne);
    }

    var c = this.pow(z, q);
    var r = this.pow(a, q.addn(1).iushrn(1));
    var t = this.pow(a, q);
    var m = s;
    while (t.cmp(one) !== 0) {
      var tmp = t;
      for (var i = 0; tmp.cmp(one) !== 0; i++) {
        tmp = tmp.redSqr();
      }
      assert(i < m);
      var b = this.pow(c, new BN(1).iushln(m - i - 1));

      r = r.redMul(b);
      c = b.redSqr();
      t = t.redMul(c);
      m = i;
    }

    return r;
  };

  Red.prototype.invm = function invm (a) {
    var inv = a._invmp(this.m);
    if (inv.negative !== 0) {
      inv.negative = 0;
      return this.imod(inv).redNeg();
    } else {
      return this.imod(inv);
    }
  };

  Red.prototype.pow = function pow (a, num) {
    if (num.isZero()) return new BN(1).toRed(this);
    if (num.cmpn(1) === 0) return a.clone();

    var windowSize = 4;
    var wnd = new Array(1 << windowSize);
    wnd[0] = new BN(1).toRed(this);
    wnd[1] = a;
    for (var i = 2; i < wnd.length; i++) {
      wnd[i] = this.mul(wnd[i - 1], a);
    }

    var res = wnd[0];
    var current = 0;
    var currentLen = 0;
    var start = num.bitLength() % 26;
    if (start === 0) {
      start = 26;
    }

    for (i = num.length - 1; i >= 0; i--) {
      var word = num.words[i];
      for (var j = start - 1; j >= 0; j--) {
        var bit = (word >> j) & 1;
        if (res !== wnd[0]) {
          res = this.sqr(res);
        }

        if (bit === 0 && current === 0) {
          currentLen = 0;
          continue;
        }

        current <<= 1;
        current |= bit;
        currentLen++;
        if (currentLen !== windowSize && (i !== 0 || j !== 0)) continue;

        res = this.mul(res, wnd[current]);
        currentLen = 0;
        current = 0;
      }
      start = 26;
    }

    return res;
  };

  Red.prototype.convertTo = function convertTo (num) {
    var r = num.umod(this.m);

    return r === num ? r.clone() : r;
  };

  Red.prototype.convertFrom = function convertFrom (num) {
    var res = num.clone();
    res.red = null;
    return res;
  };

  //
  // Montgomery method engine
  //

  BN.mont = function mont (num) {
    return new Mont(num);
  };

  function Mont (m) {
    Red.call(this, m);

    this.shift = this.m.bitLength();
    if (this.shift % 26 !== 0) {
      this.shift += 26 - (this.shift % 26);
    }

    this.r = new BN(1).iushln(this.shift);
    this.r2 = this.imod(this.r.sqr());
    this.rinv = this.r._invmp(this.m);

    this.minv = this.rinv.mul(this.r).isubn(1).div(this.m);
    this.minv = this.minv.umod(this.r);
    this.minv = this.r.sub(this.minv);
  }
  inherits(Mont, Red);

  Mont.prototype.convertTo = function convertTo (num) {
    return this.imod(num.ushln(this.shift));
  };

  Mont.prototype.convertFrom = function convertFrom (num) {
    var r = this.imod(num.mul(this.rinv));
    r.red = null;
    return r;
  };

  Mont.prototype.imul = function imul (a, b) {
    if (a.isZero() || b.isZero()) {
      a.words[0] = 0;
      a.length = 1;
      return a;
    }

    var t = a.imul(b);
    var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
    var u = t.isub(c).iushrn(this.shift);
    var res = u;

    if (u.cmp(this.m) >= 0) {
      res = u.isub(this.m);
    } else if (u.cmpn(0) < 0) {
      res = u.iadd(this.m);
    }

    return res._forceRed(this);
  };

  Mont.prototype.mul = function mul (a, b) {
    if (a.isZero() || b.isZero()) return new BN(0)._forceRed(this);

    var t = a.mul(b);
    var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
    var u = t.isub(c).iushrn(this.shift);
    var res = u;
    if (u.cmp(this.m) >= 0) {
      res = u.isub(this.m);
    } else if (u.cmpn(0) < 0) {
      res = u.iadd(this.m);
    }

    return res._forceRed(this);
  };

  Mont.prototype.invm = function invm (a) {
    // (AR)^-1 * R^2 = (A^-1 * R^-1) * R^2 = A^-1 * R
    var res = this.imod(a._invmp(this.m).mul(this.r2));
    return res._forceRed(this);
  };
})(typeof module === 'undefined' || module, this);

},{"buffer":"../node_modules/parcel-bundler/src/builtins/_empty.js"}],"../node_modules/minimalistic-assert/index.js":[function(require,module,exports) {
module.exports = assert;

function assert(val, msg) {
  if (!val)
    throw new Error(msg || 'Assertion failed');
}

assert.equal = function assertEqual(l, r, msg) {
  if (l != r)
    throw new Error(msg || ('Assertion failed: ' + l + ' != ' + r));
};

},{}],"../node_modules/minimalistic-crypto-utils/lib/utils.js":[function(require,module,exports) {
'use strict';

var utils = exports;

function toArray(msg, enc) {
  if (Array.isArray(msg))
    return msg.slice();
  if (!msg)
    return [];
  var res = [];
  if (typeof msg !== 'string') {
    for (var i = 0; i < msg.length; i++)
      res[i] = msg[i] | 0;
    return res;
  }
  if (enc === 'hex') {
    msg = msg.replace(/[^a-z0-9]+/ig, '');
    if (msg.length % 2 !== 0)
      msg = '0' + msg;
    for (var i = 0; i < msg.length; i += 2)
      res.push(parseInt(msg[i] + msg[i + 1], 16));
  } else {
    for (var i = 0; i < msg.length; i++) {
      var c = msg.charCodeAt(i);
      var hi = c >> 8;
      var lo = c & 0xff;
      if (hi)
        res.push(hi, lo);
      else
        res.push(lo);
    }
  }
  return res;
}
utils.toArray = toArray;

function zero2(word) {
  if (word.length === 1)
    return '0' + word;
  else
    return word;
}
utils.zero2 = zero2;

function toHex(msg) {
  var res = '';
  for (var i = 0; i < msg.length; i++)
    res += zero2(msg[i].toString(16));
  return res;
}
utils.toHex = toHex;

utils.encode = function encode(arr, enc) {
  if (enc === 'hex')
    return toHex(arr);
  else
    return arr;
};

},{}],"../node_modules/bitcoin-elliptic/lib/elliptic/utils.js":[function(require,module,exports) {
'use strict';

var utils = exports;
var BN = require('bn.js');
var minAssert = require('minimalistic-assert');
var minUtils = require('minimalistic-crypto-utils');

utils.assert = minAssert;
utils.toArray = minUtils.toArray;
utils.zero2 = minUtils.zero2;
utils.toHex = minUtils.toHex;
utils.encode = minUtils.encode;

// Represent num in a w-NAF form
function getNAF(num, w, bits) {
  var naf = new Array(Math.max(num.bitLength(), bits) + 1);
  naf.fill(0);

  var ws = 1 << (w + 1);
  var k = num.clone();

  for (var i = 0; i < naf.length; i++) {
    var z;
    var mod = k.andln(ws - 1);
    if (k.isOdd()) {
      if (mod > (ws >> 1) - 1)
        z = (ws >> 1) - mod;
      else
        z = mod;
      k.isubn(z);
    } else {
      z = 0;
    }

    naf[i] = z;
    k.iushrn(1);
  }

  return naf;
}
utils.getNAF = getNAF;

// Represent k1, k2 in a Joint Sparse Form
function getJSF(k1, k2) {
  var jsf = [
    [],
    []
  ];

  k1 = k1.clone();
  k2 = k2.clone();
  var d1 = 0;
  var d2 = 0;
  while (k1.cmpn(-d1) > 0 || k2.cmpn(-d2) > 0) {

    // First phase
    var m14 = (k1.andln(3) + d1) & 3;
    var m24 = (k2.andln(3) + d2) & 3;
    if (m14 === 3)
      m14 = -1;
    if (m24 === 3)
      m24 = -1;
    var u1;
    if ((m14 & 1) === 0) {
      u1 = 0;
    } else {
      var m8 = (k1.andln(7) + d1) & 7;
      if ((m8 === 3 || m8 === 5) && m24 === 2)
        u1 = -m14;
      else
        u1 = m14;
    }
    jsf[0].push(u1);

    var u2;
    if ((m24 & 1) === 0) {
      u2 = 0;
    } else {
      var m8 = (k2.andln(7) + d2) & 7;
      if ((m8 === 3 || m8 === 5) && m14 === 2)
        u2 = -m24;
      else
        u2 = m24;
    }
    jsf[1].push(u2);

    // Second phase
    if (2 * d1 === u1 + 1)
      d1 = 1 - d1;
    if (2 * d2 === u2 + 1)
      d2 = 1 - d2;
    k1.iushrn(1);
    k2.iushrn(1);
  }

  return jsf;
}
utils.getJSF = getJSF;

function cachedProperty(obj, name, computer) {
  var key = '_' + name;
  obj.prototype[name] = function cachedProperty() {
    return this[key] !== undefined ? this[key] :
           this[key] = computer.call(this);
  };
}
utils.cachedProperty = cachedProperty;

function parseBytes(bytes) {
  return typeof bytes === 'string' ? utils.toArray(bytes, 'hex') :
                                     bytes;
}
utils.parseBytes = parseBytes;

function intFromLE(bytes) {
  return new BN(bytes, 'hex', 'le');
}
utils.intFromLE = intFromLE;


},{"bn.js":"../node_modules/bitcoin-elliptic/node_modules/bn.js/lib/bn.js","minimalistic-assert":"../node_modules/minimalistic-assert/index.js","minimalistic-crypto-utils":"../node_modules/minimalistic-crypto-utils/lib/utils.js"}],"../node_modules/brorand/index.js":[function(require,module,exports) {
var r;

module.exports = function rand(len) {
  if (!r)
    r = new Rand(null);

  return r.generate(len);
};

function Rand(rand) {
  this.rand = rand;
}
module.exports.Rand = Rand;

Rand.prototype.generate = function generate(len) {
  return this._rand(len);
};

// Emulate crypto API using randy
Rand.prototype._rand = function _rand(n) {
  if (this.rand.getBytes)
    return this.rand.getBytes(n);

  var res = new Uint8Array(n);
  for (var i = 0; i < res.length; i++)
    res[i] = this.rand.getByte();
  return res;
};

if (typeof self === 'object') {
  if (self.crypto && self.crypto.getRandomValues) {
    // Modern browsers
    Rand.prototype._rand = function _rand(n) {
      var arr = new Uint8Array(n);
      self.crypto.getRandomValues(arr);
      return arr;
    };
  } else if (self.msCrypto && self.msCrypto.getRandomValues) {
    // IE
    Rand.prototype._rand = function _rand(n) {
      var arr = new Uint8Array(n);
      self.msCrypto.getRandomValues(arr);
      return arr;
    };

  // Safari's WebWorkers do not have `crypto`
  } else if (typeof window === 'object') {
    // Old junk
    Rand.prototype._rand = function() {
      throw new Error('Not implemented yet');
    };
  }
} else {
  // Node.js or Web worker with no crypto support
  try {
    var crypto = require('crypto');
    if (typeof crypto.randomBytes !== 'function')
      throw new Error('Not supported');

    Rand.prototype._rand = function _rand(n) {
      return crypto.randomBytes(n);
    };
  } catch (e) {
  }
}

},{"crypto":"../node_modules/parcel-bundler/src/builtins/_empty.js"}],"../node_modules/bitcoin-elliptic/lib/elliptic/curve/base.js":[function(require,module,exports) {
'use strict';

var BN = require('bn.js');
var utils = require('../utils');
var getNAF = utils.getNAF;
var getJSF = utils.getJSF;
var assert = utils.assert;

function BaseCurve(type, conf) {
  this.type = type;
  this.p = new BN(conf.p, 16);

  // Use Montgomery, when there is no fast reduction for the prime
  this.red = conf.prime ? BN.red(conf.prime) : BN.mont(this.p);

  // Useful for many curves
  this.zero = new BN(0).toRed(this.red);
  this.one = new BN(1).toRed(this.red);
  this.two = new BN(2).toRed(this.red);

  // Curve configuration, optional
  this.n = conf.n && new BN(conf.n, 16);
  this.g = conf.g && this.pointFromJSON(conf.g, conf.gRed);

  // Temporary arrays
  this._wnafT1 = new Array(4);
  this._wnafT2 = new Array(4);
  this._wnafT3 = new Array(4);
  this._wnafT4 = new Array(4);

  this._bitLength = this.n ? this.n.bitLength() : 0;

  // Generalized Greg Maxwell's trick
  var adjustCount = this.n && this.p.div(this.n);
  if (!adjustCount || adjustCount.cmpn(100) > 0) {
    this.redN = null;
  } else {
    this._maxwellTrick = true;
    this.redN = this.n.toRed(this.red);
  }
}
module.exports = BaseCurve;

BaseCurve.prototype.point = function point() {
  throw new Error('Not implemented');
};

BaseCurve.prototype.validate = function validate() {
  throw new Error('Not implemented');
};

BaseCurve.prototype._fixedNafMul = function _fixedNafMul(p, k) {
  assert(p.precomputed);
  var doubles = p._getDoubles();

  var naf = getNAF(k, 1, this._bitLength);
  var I = (1 << (doubles.step + 1)) - (doubles.step % 2 === 0 ? 2 : 1);
  I /= 3;

  // Translate into more windowed form
  var repr = [];
  for (var j = 0; j < naf.length; j += doubles.step) {
    var nafW = 0;
    for (var k = j + doubles.step - 1; k >= j; k--)
      nafW = (nafW << 1) + naf[k];
    repr.push(nafW);
  }

  var a = this.jpoint(null, null, null);
  var b = this.jpoint(null, null, null);
  for (var i = I; i > 0; i--) {
    for (var j = 0; j < repr.length; j++) {
      var nafW = repr[j];
      if (nafW === i)
        b = b.mixedAdd(doubles.points[j]);
      else if (nafW === -i)
        b = b.mixedAdd(doubles.points[j].neg());
    }
    a = a.add(b);
  }
  return a.toP();
};

BaseCurve.prototype._wnafMul = function _wnafMul(p, k) {
  var w = 4;

  // Precompute window
  var nafPoints = p._getNAFPoints(w);
  w = nafPoints.wnd;
  var wnd = nafPoints.points;

  // Get NAF form
  var naf = getNAF(k, w, this._bitLength);

  // Add `this`*(N+1) for every w-NAF index
  var acc = this.jpoint(null, null, null);
  for (var i = naf.length - 1; i >= 0; i--) {
    // Count zeroes
    for (var k = 0; i >= 0 && naf[i] === 0; i--)
      k++;
    if (i >= 0)
      k++;
    acc = acc.dblp(k);

    if (i < 0)
      break;
    var z = naf[i];
    assert(z !== 0);
    if (p.type === 'affine') {
      // J +- P
      if (z > 0)
        acc = acc.mixedAdd(wnd[(z - 1) >> 1]);
      else
        acc = acc.mixedAdd(wnd[(-z - 1) >> 1].neg());
    } else {
      // J +- J
      if (z > 0)
        acc = acc.add(wnd[(z - 1) >> 1]);
      else
        acc = acc.add(wnd[(-z - 1) >> 1].neg());
    }
  }
  return p.type === 'affine' ? acc.toP() : acc;
};

BaseCurve.prototype._wnafMulAdd = function _wnafMulAdd(defW,
                                                       points,
                                                       coeffs,
                                                       len,
                                                       jacobianResult) {
  var wndWidth = this._wnafT1;
  var wnd = this._wnafT2;
  var naf = this._wnafT3;

  // Fill all arrays
  var max = 0;
  for (var i = 0; i < len; i++) {
    var p = points[i];
    var nafPoints = p._getNAFPoints(defW);
    wndWidth[i] = nafPoints.wnd;
    wnd[i] = nafPoints.points;
  }

  // Comb small window NAFs
  for (var i = len - 1; i >= 1; i -= 2) {
    var a = i - 1;
    var b = i;
    if (wndWidth[a] !== 1 || wndWidth[b] !== 1) {
      naf[a] = getNAF(coeffs[a], wndWidth[a], this._bitLength);
      naf[b] = getNAF(coeffs[b], wndWidth[b], this._bitLength);
      max = Math.max(naf[a].length, max);
      max = Math.max(naf[b].length, max);
      continue;
    }

    var comb = [
      points[a], /* 1 */
      null, /* 3 */
      null, /* 5 */
      points[b] /* 7 */
    ];

    // Try to avoid Projective points, if possible
    if (points[a].y.cmp(points[b].y) === 0) {
      comb[1] = points[a].add(points[b]);
      comb[2] = points[a].toJ().mixedAdd(points[b].neg());
    } else if (points[a].y.cmp(points[b].y.redNeg()) === 0) {
      comb[1] = points[a].toJ().mixedAdd(points[b]);
      comb[2] = points[a].add(points[b].neg());
    } else {
      comb[1] = points[a].toJ().mixedAdd(points[b]);
      comb[2] = points[a].toJ().mixedAdd(points[b].neg());
    }

    var index = [
      -3, /* -1 -1 */
      -1, /* -1 0 */
      -5, /* -1 1 */
      -7, /* 0 -1 */
      0, /* 0 0 */
      7, /* 0 1 */
      5, /* 1 -1 */
      1, /* 1 0 */
      3  /* 1 1 */
    ];

    var jsf = getJSF(coeffs[a], coeffs[b]);
    max = Math.max(jsf[0].length, max);
    naf[a] = new Array(max);
    naf[b] = new Array(max);
    for (var j = 0; j < max; j++) {
      var ja = jsf[0][j] | 0;
      var jb = jsf[1][j] | 0;

      naf[a][j] = index[(ja + 1) * 3 + (jb + 1)];
      naf[b][j] = 0;
      wnd[a] = comb;
    }
  }

  var acc = this.jpoint(null, null, null);
  var tmp = this._wnafT4;
  for (var i = max; i >= 0; i--) {
    var k = 0;

    while (i >= 0) {
      var zero = true;
      for (var j = 0; j < len; j++) {
        tmp[j] = naf[j][i] | 0;
        if (tmp[j] !== 0)
          zero = false;
      }
      if (!zero)
        break;
      k++;
      i--;
    }
    if (i >= 0)
      k++;
    acc = acc.dblp(k);
    if (i < 0)
      break;

    for (var j = 0; j < len; j++) {
      var z = tmp[j];
      var p;
      if (z === 0)
        continue;
      else if (z > 0)
        p = wnd[j][(z - 1) >> 1];
      else if (z < 0)
        p = wnd[j][(-z - 1) >> 1].neg();

      if (p.type === 'affine')
        acc = acc.mixedAdd(p);
      else
        acc = acc.add(p);
    }
  }
  // Zeroify references
  for (var i = 0; i < len; i++)
    wnd[i] = null;

  if (jacobianResult)
    return acc;
  else
    return acc.toP();
};

function BasePoint(curve, type) {
  this.curve = curve;
  this.type = type;
  this.precomputed = null;
}
BaseCurve.BasePoint = BasePoint;

BasePoint.prototype.eq = function eq(/*other*/) {
  throw new Error('Not implemented');
};

BasePoint.prototype.validate = function validate() {
  return this.curve.validate(this);
};

BaseCurve.prototype.decodePoint = function decodePoint(bytes, enc) {
  bytes = utils.toArray(bytes, enc);

  var len = this.p.byteLength();

  // uncompressed, hybrid-odd, hybrid-even
  if ((bytes[0] === 0x04 || bytes[0] === 0x06 || bytes[0] === 0x07) &&
      bytes.length - 1 === 2 * len) {
    if (bytes[0] === 0x06)
      assert(bytes[bytes.length - 1] % 2 === 0);
    else if (bytes[0] === 0x07)
      assert(bytes[bytes.length - 1] % 2 === 1);

    var res =  this.point(bytes.slice(1, 1 + len),
                          bytes.slice(1 + len, 1 + 2 * len));

    return res;
  } else if ((bytes[0] === 0x02 || bytes[0] === 0x03) &&
              bytes.length - 1 === len) {
    return this.pointFromX(bytes.slice(1, 1 + len), bytes[0] === 0x03);
  }
  throw new Error('Unknown point format');
};

BasePoint.prototype.encodeCompressed = function encodeCompressed(enc) {
  return this.encode(enc, true);
};

BasePoint.prototype._encode = function _encode(compact) {
  var len = this.curve.p.byteLength();
  var x = this.getX().toArray('be', len);

  if (compact)
    return [ this.getY().isEven() ? 0x02 : 0x03 ].concat(x);

  return [ 0x04 ].concat(x, this.getY().toArray('be', len)) ;
};

BasePoint.prototype.encode = function encode(enc, compact) {
  return utils.encode(this._encode(compact), enc);
};

BasePoint.prototype.precompute = function precompute(power) {
  if (this.precomputed)
    return this;

  var precomputed = {
    doubles: null,
    naf: null,
    beta: null
  };
  precomputed.naf = this._getNAFPoints(8);
  precomputed.doubles = this._getDoubles(4, power);
  precomputed.beta = this._getBeta();
  this.precomputed = precomputed;

  return this;
};

BasePoint.prototype._hasDoubles = function _hasDoubles(k) {
  if (!this.precomputed)
    return false;

  var doubles = this.precomputed.doubles;
  if (!doubles)
    return false;

  return doubles.points.length >= Math.ceil((k.bitLength() + 1) / doubles.step);
};

BasePoint.prototype._getDoubles = function _getDoubles(step, power) {
  if (this.precomputed && this.precomputed.doubles)
    return this.precomputed.doubles;

  var doubles = [ this ];
  var acc = this;
  for (var i = 0; i < power; i += step) {
    for (var j = 0; j < step; j++)
      acc = acc.dbl();
    doubles.push(acc);
  }
  return {
    step: step,
    points: doubles
  };
};

BasePoint.prototype._getNAFPoints = function _getNAFPoints(wnd) {
  if (this.precomputed && this.precomputed.naf)
    return this.precomputed.naf;

  var res = [ this ];
  var max = (1 << wnd) - 1;
  var dbl = max === 1 ? null : this.dbl();
  for (var i = 1; i < max; i++)
    res[i] = res[i - 1].add(dbl);
  return {
    wnd: wnd,
    points: res
  };
};

BasePoint.prototype._getBeta = function _getBeta() {
  return null;
};

BasePoint.prototype.dblp = function dblp(k) {
  var r = this;
  for (var i = 0; i < k; i++)
    r = r.dbl();
  return r;
};

},{"bn.js":"../node_modules/bitcoin-elliptic/node_modules/bn.js/lib/bn.js","../utils":"../node_modules/bitcoin-elliptic/lib/elliptic/utils.js"}],"../node_modules/inherits/inherits_browser.js":[function(require,module,exports) {
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      })
    }
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      var TempCtor = function () {}
      TempCtor.prototype = superCtor.prototype
      ctor.prototype = new TempCtor()
      ctor.prototype.constructor = ctor
    }
  }
}

},{}],"../node_modules/bitcoin-elliptic/lib/elliptic/curve/short.js":[function(require,module,exports) {
'use strict';

var utils = require('../utils');
var BN = require('bn.js');
var inherits = require('inherits');
var Base = require('./base');

var assert = utils.assert;

function ShortCurve(conf) {
  Base.call(this, 'short', conf);

  this.a = new BN(conf.a, 16).toRed(this.red);
  this.b = new BN(conf.b, 16).toRed(this.red);
  this.tinv = this.two.redInvm();

  this.zeroA = this.a.fromRed().cmpn(0) === 0;
  this.threeA = this.a.fromRed().sub(this.p).cmpn(-3) === 0;

  // If the curve is endomorphic, precalculate beta and lambda
  this.endo = this._getEndomorphism(conf);
  this._endoWnafT1 = new Array(4);
  this._endoWnafT2 = new Array(4);
}
inherits(ShortCurve, Base);
module.exports = ShortCurve;

ShortCurve.prototype._getEndomorphism = function _getEndomorphism(conf) {
  // No efficient endomorphism
  if (!this.zeroA || !this.g || !this.n || this.p.modn(3) !== 1)
    return;

  // Compute beta and lambda, that lambda * P = (beta * Px; Py)
  var beta;
  var lambda;
  if (conf.beta) {
    beta = new BN(conf.beta, 16).toRed(this.red);
  } else {
    var betas = this._getEndoRoots(this.p);
    // Choose the smallest beta
    beta = betas[0].cmp(betas[1]) < 0 ? betas[0] : betas[1];
    beta = beta.toRed(this.red);
  }
  if (conf.lambda) {
    lambda = new BN(conf.lambda, 16);
  } else {
    // Choose the lambda that is matching selected beta
    var lambdas = this._getEndoRoots(this.n);
    if (this.g.mul(lambdas[0]).x.cmp(this.g.x.redMul(beta)) === 0) {
      lambda = lambdas[0];
    } else {
      lambda = lambdas[1];
      assert(this.g.mul(lambda).x.cmp(this.g.x.redMul(beta)) === 0);
    }
  }

  // Get basis vectors, used for balanced length-two representation
  var basis;
  if (conf.basis) {
    basis = conf.basis.map(function(vec) {
      return {
        a: new BN(vec.a, 16),
        b: new BN(vec.b, 16)
      };
    });
  } else {
    basis = this._getEndoBasis(lambda);
  }

  return {
    beta: beta,
    lambda: lambda,
    basis: basis
  };
};

ShortCurve.prototype._getEndoRoots = function _getEndoRoots(num) {
  // Find roots of for x^2 + x + 1 in F
  // Root = (-1 +- Sqrt(-3)) / 2
  //
  var red = num === this.p ? this.red : BN.mont(num);
  var tinv = new BN(2).toRed(red).redInvm();
  var ntinv = tinv.redNeg();

  var s = new BN(3).toRed(red).redNeg().redSqrt().redMul(tinv);

  var l1 = ntinv.redAdd(s).fromRed();
  var l2 = ntinv.redSub(s).fromRed();
  return [ l1, l2 ];
};

ShortCurve.prototype._getEndoBasis = function _getEndoBasis(lambda) {
  // aprxSqrt >= sqrt(this.n)
  var aprxSqrt = this.n.ushrn(Math.floor(this.n.bitLength() / 2));

  // 3.74
  // Run EGCD, until r(L + 1) < aprxSqrt
  var u = lambda;
  var v = this.n.clone();
  var x1 = new BN(1);
  var y1 = new BN(0);
  var x2 = new BN(0);
  var y2 = new BN(1);

  // NOTE: all vectors are roots of: a + b * lambda = 0 (mod n)
  var a0;
  var b0;
  // First vector
  var a1;
  var b1;
  // Second vector
  var a2;
  var b2;

  var prevR;
  var i = 0;
  var r;
  var x;
  while (u.cmpn(0) !== 0) {
    var q = v.div(u);
    r = v.sub(q.mul(u));
    x = x2.sub(q.mul(x1));
    var y = y2.sub(q.mul(y1));

    if (!a1 && r.cmp(aprxSqrt) < 0) {
      a0 = prevR.neg();
      b0 = x1;
      a1 = r.neg();
      b1 = x;
    } else if (a1 && ++i === 2) {
      break;
    }
    prevR = r;

    v = u;
    u = r;
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
  }
  a2 = r.neg();
  b2 = x;

  var len1 = a1.sqr().add(b1.sqr());
  var len2 = a2.sqr().add(b2.sqr());
  if (len2.cmp(len1) >= 0) {
    a2 = a0;
    b2 = b0;
  }

  // Normalize signs
  if (a1.negative) {
    a1 = a1.neg();
    b1 = b1.neg();
  }
  if (a2.negative) {
    a2 = a2.neg();
    b2 = b2.neg();
  }

  return [
    { a: a1, b: b1 },
    { a: a2, b: b2 }
  ];
};

ShortCurve.prototype._endoSplit = function _endoSplit(k) {
  var basis = this.endo.basis;
  var v1 = basis[0];
  var v2 = basis[1];

  var c1 = v2.b.mul(k).divRound(this.n);
  var c2 = v1.b.neg().mul(k).divRound(this.n);

  var p1 = c1.mul(v1.a);
  var p2 = c2.mul(v2.a);
  var q1 = c1.mul(v1.b);
  var q2 = c2.mul(v2.b);

  // Calculate answer
  var k1 = k.sub(p1).sub(p2);
  var k2 = q1.add(q2).neg();
  return { k1: k1, k2: k2 };
};

ShortCurve.prototype.pointFromX = function pointFromX(x, odd) {
  x = new BN(x, 16);
  if (!x.red)
    x = x.toRed(this.red);

  var y2 = x.redSqr().redMul(x).redIAdd(x.redMul(this.a)).redIAdd(this.b);
  var y = y2.redSqrt();
  if (y.redSqr().redSub(y2).cmp(this.zero) !== 0)
    throw new Error('invalid point');

  // XXX Is there any way to tell if the number is odd without converting it
  // to non-red form?
  var isOdd = y.fromRed().isOdd();
  if (odd && !isOdd || !odd && isOdd)
    y = y.redNeg();

  return this.point(x, y);
};

ShortCurve.prototype.validate = function validate(point) {
  if (point.inf)
    return true;

  var x = point.x;
  var y = point.y;

  var ax = this.a.redMul(x);
  var rhs = x.redSqr().redMul(x).redIAdd(ax).redIAdd(this.b);
  return y.redSqr().redISub(rhs).cmpn(0) === 0;
};

ShortCurve.prototype._endoWnafMulAdd =
    function _endoWnafMulAdd(points, coeffs, jacobianResult) {
  var npoints = this._endoWnafT1;
  var ncoeffs = this._endoWnafT2;
  for (var i = 0; i < points.length; i++) {
    var split = this._endoSplit(coeffs[i]);
    var p = points[i];
    var beta = p._getBeta();

    if (split.k1.negative) {
      split.k1.ineg();
      p = p.neg(true);
    }
    if (split.k2.negative) {
      split.k2.ineg();
      beta = beta.neg(true);
    }

    npoints[i * 2] = p;
    npoints[i * 2 + 1] = beta;
    ncoeffs[i * 2] = split.k1;
    ncoeffs[i * 2 + 1] = split.k2;
  }
  var res = this._wnafMulAdd(1, npoints, ncoeffs, i * 2, jacobianResult);

  // Clean-up references to points and coefficients
  for (var j = 0; j < i * 2; j++) {
    npoints[j] = null;
    ncoeffs[j] = null;
  }
  return res;
};

function Point(curve, x, y, isRed) {
  Base.BasePoint.call(this, curve, 'affine');
  if (x === null && y === null) {
    this.x = null;
    this.y = null;
    this.inf = true;
  } else {
    this.x = new BN(x, 16);
    this.y = new BN(y, 16);
    // Force redgomery representation when loading from JSON
    if (isRed) {
      this.x.forceRed(this.curve.red);
      this.y.forceRed(this.curve.red);
    }
    if (!this.x.red)
      this.x = this.x.toRed(this.curve.red);
    if (!this.y.red)
      this.y = this.y.toRed(this.curve.red);
    this.inf = false;
  }
}
inherits(Point, Base.BasePoint);

ShortCurve.prototype.point = function point(x, y, isRed) {
  return new Point(this, x, y, isRed);
};

ShortCurve.prototype.pointFromJSON = function pointFromJSON(obj, red) {
  return Point.fromJSON(this, obj, red);
};

Point.prototype._getBeta = function _getBeta() {
  if (!this.curve.endo)
    return;

  var pre = this.precomputed;
  if (pre && pre.beta)
    return pre.beta;

  var beta = this.curve.point(this.x.redMul(this.curve.endo.beta), this.y);
  if (pre) {
    var curve = this.curve;
    var endoMul = function(p) {
      return curve.point(p.x.redMul(curve.endo.beta), p.y);
    };
    pre.beta = beta;
    beta.precomputed = {
      beta: null,
      naf: pre.naf && {
        wnd: pre.naf.wnd,
        points: pre.naf.points.map(endoMul)
      },
      doubles: pre.doubles && {
        step: pre.doubles.step,
        points: pre.doubles.points.map(endoMul)
      }
    };
  }
  return beta;
};

Point.prototype.toJSON = function toJSON() {
  if (!this.precomputed)
    return [ this.x, this.y ];

  return [ this.x, this.y, this.precomputed && {
    doubles: this.precomputed.doubles && {
      step: this.precomputed.doubles.step,
      points: this.precomputed.doubles.points.slice(1)
    },
    naf: this.precomputed.naf && {
      wnd: this.precomputed.naf.wnd,
      points: this.precomputed.naf.points.slice(1)
    }
  } ];
};

Point.fromJSON = function fromJSON(curve, obj, red) {
  if (typeof obj === 'string')
    obj = JSON.parse(obj);
  var res = curve.point(obj[0], obj[1], red);
  if (!obj[2])
    return res;

  function obj2point(obj) {
    return curve.point(obj[0], obj[1], red);
  }

  var pre = obj[2];
  res.precomputed = {
    beta: null,
    doubles: pre.doubles && {
      step: pre.doubles.step,
      points: [ res ].concat(pre.doubles.points.map(obj2point))
    },
    naf: pre.naf && {
      wnd: pre.naf.wnd,
      points: [ res ].concat(pre.naf.points.map(obj2point))
    }
  };
  return res;
};

Point.prototype.inspect = function inspect() {
  if (this.isInfinity())
    return '<EC Point Infinity>';
  return '<EC Point x: ' + this.x.fromRed().toString(16, 2) +
      ' y: ' + this.y.fromRed().toString(16, 2) + '>';
};

Point.prototype.isInfinity = function isInfinity() {
  return this.inf;
};

Point.prototype.add = function add(p) {
  // O + P = P
  if (this.inf)
    return p;

  // P + O = P
  if (p.inf)
    return this;

  // P + P = 2P
  if (this.eq(p))
    return this.dbl();

  // P + (-P) = O
  if (this.neg().eq(p))
    return this.curve.point(null, null);

  // P + Q = O
  if (this.x.cmp(p.x) === 0)
    return this.curve.point(null, null);

  var c = this.y.redSub(p.y);
  if (c.cmpn(0) !== 0)
    c = c.redMul(this.x.redSub(p.x).redInvm());
  var nx = c.redSqr().redISub(this.x).redISub(p.x);
  var ny = c.redMul(this.x.redSub(nx)).redISub(this.y);
  return this.curve.point(nx, ny);
};

Point.prototype.dbl = function dbl() {
  if (this.inf)
    return this;

  // 2P = O
  var ys1 = this.y.redAdd(this.y);
  if (ys1.cmpn(0) === 0)
    return this.curve.point(null, null);

  var a = this.curve.a;

  var x2 = this.x.redSqr();
  var dyinv = ys1.redInvm();
  var c = x2.redAdd(x2).redIAdd(x2).redIAdd(a).redMul(dyinv);

  var nx = c.redSqr().redISub(this.x.redAdd(this.x));
  var ny = c.redMul(this.x.redSub(nx)).redISub(this.y);
  return this.curve.point(nx, ny);
};

Point.prototype.getX = function getX() {
  return this.x.fromRed();
};

Point.prototype.getY = function getY() {
  return this.y.fromRed();
};

Point.prototype.mul = function mul(k) {
  k = new BN(k, 16);
  if (this.isInfinity())
    return this;
  else if (this._hasDoubles(k))
    return this.curve._fixedNafMul(this, k);
  else if (this.curve.endo)
    return this.curve._endoWnafMulAdd([ this ], [ k ]);
  else
    return this.curve._wnafMul(this, k);
};

Point.prototype.mulAdd = function mulAdd(k1, p2, k2) {
  var points = [ this, p2 ];
  var coeffs = [ k1, k2 ];
  if (this.curve.endo)
    return this.curve._endoWnafMulAdd(points, coeffs);
  else
    return this.curve._wnafMulAdd(1, points, coeffs, 2);
};

Point.prototype.jmulAdd = function jmulAdd(k1, p2, k2) {
  var points = [ this, p2 ];
  var coeffs = [ k1, k2 ];
  if (this.curve.endo)
    return this.curve._endoWnafMulAdd(points, coeffs, true);
  else
    return this.curve._wnafMulAdd(1, points, coeffs, 2, true);
};

Point.prototype.eq = function eq(p) {
  return this === p ||
         this.inf === p.inf &&
             (this.inf || this.x.cmp(p.x) === 0 && this.y.cmp(p.y) === 0);
};

Point.prototype.neg = function neg(_precompute) {
  if (this.inf)
    return this;

  var res = this.curve.point(this.x, this.y.redNeg());
  if (_precompute && this.precomputed) {
    var pre = this.precomputed;
    var negate = function(p) {
      return p.neg();
    };
    res.precomputed = {
      naf: pre.naf && {
        wnd: pre.naf.wnd,
        points: pre.naf.points.map(negate)
      },
      doubles: pre.doubles && {
        step: pre.doubles.step,
        points: pre.doubles.points.map(negate)
      }
    };
  }
  return res;
};

Point.prototype.toJ = function toJ() {
  if (this.inf)
    return this.curve.jpoint(null, null, null);

  var res = this.curve.jpoint(this.x, this.y, this.curve.one);
  return res;
};

function JPoint(curve, x, y, z) {
  Base.BasePoint.call(this, curve, 'jacobian');
  if (x === null && y === null && z === null) {
    this.x = this.curve.one;
    this.y = this.curve.one;
    this.z = new BN(0);
  } else {
    this.x = new BN(x, 16);
    this.y = new BN(y, 16);
    this.z = new BN(z, 16);
  }
  if (!this.x.red)
    this.x = this.x.toRed(this.curve.red);
  if (!this.y.red)
    this.y = this.y.toRed(this.curve.red);
  if (!this.z.red)
    this.z = this.z.toRed(this.curve.red);

  this.zOne = this.z === this.curve.one;
}
inherits(JPoint, Base.BasePoint);

ShortCurve.prototype.jpoint = function jpoint(x, y, z) {
  return new JPoint(this, x, y, z);
};

JPoint.prototype.toP = function toP() {
  if (this.isInfinity())
    return this.curve.point(null, null);

  var zinv = this.z.redInvm();
  var zinv2 = zinv.redSqr();
  var ax = this.x.redMul(zinv2);
  var ay = this.y.redMul(zinv2).redMul(zinv);

  return this.curve.point(ax, ay);
};

JPoint.prototype.neg = function neg() {
  return this.curve.jpoint(this.x, this.y.redNeg(), this.z);
};

JPoint.prototype.add = function add(p) {
  // O + P = P
  if (this.isInfinity())
    return p;

  // P + O = P
  if (p.isInfinity())
    return this;

  // 12M + 4S + 7A
  var pz2 = p.z.redSqr();
  var z2 = this.z.redSqr();
  var u1 = this.x.redMul(pz2);
  var u2 = p.x.redMul(z2);
  var s1 = this.y.redMul(pz2.redMul(p.z));
  var s2 = p.y.redMul(z2.redMul(this.z));

  var h = u1.redSub(u2);
  var r = s1.redSub(s2);
  if (h.cmpn(0) === 0) {
    if (r.cmpn(0) !== 0)
      return this.curve.jpoint(null, null, null);
    else
      return this.dbl();
  }

  var h2 = h.redSqr();
  var h3 = h2.redMul(h);
  var v = u1.redMul(h2);

  var nx = r.redSqr().redIAdd(h3).redISub(v).redISub(v);
  var ny = r.redMul(v.redISub(nx)).redISub(s1.redMul(h3));
  var nz = this.z.redMul(p.z).redMul(h);

  return this.curve.jpoint(nx, ny, nz);
};

JPoint.prototype.mixedAdd = function mixedAdd(p) {
  // O + P = P
  if (this.isInfinity())
    return p.toJ();

  // P + O = P
  if (p.isInfinity())
    return this;

  // 8M + 3S + 7A
  var z2 = this.z.redSqr();
  var u1 = this.x;
  var u2 = p.x.redMul(z2);
  var s1 = this.y;
  var s2 = p.y.redMul(z2).redMul(this.z);

  var h = u1.redSub(u2);
  var r = s1.redSub(s2);
  if (h.cmpn(0) === 0) {
    if (r.cmpn(0) !== 0)
      return this.curve.jpoint(null, null, null);
    else
      return this.dbl();
  }

  var h2 = h.redSqr();
  var h3 = h2.redMul(h);
  var v = u1.redMul(h2);

  var nx = r.redSqr().redIAdd(h3).redISub(v).redISub(v);
  var ny = r.redMul(v.redISub(nx)).redISub(s1.redMul(h3));
  var nz = this.z.redMul(h);

  return this.curve.jpoint(nx, ny, nz);
};

JPoint.prototype.dblp = function dblp(pow) {
  if (pow === 0)
    return this;
  if (this.isInfinity())
    return this;
  if (!pow)
    return this.dbl();

  if (this.curve.zeroA || this.curve.threeA) {
    var r = this;
    for (var i = 0; i < pow; i++)
      r = r.dbl();
    return r;
  }

  // 1M + 2S + 1A + N * (4S + 5M + 8A)
  // N = 1 => 6M + 6S + 9A
  var a = this.curve.a;
  var tinv = this.curve.tinv;

  var jx = this.x;
  var jy = this.y;
  var jz = this.z;
  var jz4 = jz.redSqr().redSqr();

  // Reuse results
  var jyd = jy.redAdd(jy);
  for (var i = 0; i < pow; i++) {
    var jx2 = jx.redSqr();
    var jyd2 = jyd.redSqr();
    var jyd4 = jyd2.redSqr();
    var c = jx2.redAdd(jx2).redIAdd(jx2).redIAdd(a.redMul(jz4));

    var t1 = jx.redMul(jyd2);
    var nx = c.redSqr().redISub(t1.redAdd(t1));
    var t2 = t1.redISub(nx);
    var dny = c.redMul(t2);
    dny = dny.redIAdd(dny).redISub(jyd4);
    var nz = jyd.redMul(jz);
    if (i + 1 < pow)
      jz4 = jz4.redMul(jyd4);

    jx = nx;
    jz = nz;
    jyd = dny;
  }

  return this.curve.jpoint(jx, jyd.redMul(tinv), jz);
};

JPoint.prototype.dbl = function dbl() {
  if (this.isInfinity())
    return this;

  if (this.curve.zeroA)
    return this._zeroDbl();
  else if (this.curve.threeA)
    return this._threeDbl();
  else
    return this._dbl();
};

JPoint.prototype._zeroDbl = function _zeroDbl() {
  var nx;
  var ny;
  var nz;
  // Z = 1
  if (this.zOne) {
    // hyperelliptic.org/EFD/g1p/auto-shortw-jacobian-0.html
    //     #doubling-mdbl-2007-bl
    // 1M + 5S + 14A

    // XX = X1^2
    var xx = this.x.redSqr();
    // YY = Y1^2
    var yy = this.y.redSqr();
    // YYYY = YY^2
    var yyyy = yy.redSqr();
    // S = 2 * ((X1 + YY)^2 - XX - YYYY)
    var s = this.x.redAdd(yy).redSqr().redISub(xx).redISub(yyyy);
    s = s.redIAdd(s);
    // M = 3 * XX + a; a = 0
    var m = xx.redAdd(xx).redIAdd(xx);
    // T = M ^ 2 - 2*S
    var t = m.redSqr().redISub(s).redISub(s);

    // 8 * YYYY
    var yyyy8 = yyyy.redIAdd(yyyy);
    yyyy8 = yyyy8.redIAdd(yyyy8);
    yyyy8 = yyyy8.redIAdd(yyyy8);

    // X3 = T
    nx = t;
    // Y3 = M * (S - T) - 8 * YYYY
    ny = m.redMul(s.redISub(t)).redISub(yyyy8);
    // Z3 = 2*Y1
    nz = this.y.redAdd(this.y);
  } else {
    // hyperelliptic.org/EFD/g1p/auto-shortw-jacobian-0.html
    //     #doubling-dbl-2009-l
    // 2M + 5S + 13A

    // A = X1^2
    var a = this.x.redSqr();
    // B = Y1^2
    var b = this.y.redSqr();
    // C = B^2
    var c = b.redSqr();
    // D = 2 * ((X1 + B)^2 - A - C)
    var d = this.x.redAdd(b).redSqr().redISub(a).redISub(c);
    d = d.redIAdd(d);
    // E = 3 * A
    var e = a.redAdd(a).redIAdd(a);
    // F = E^2
    var f = e.redSqr();

    // 8 * C
    var c8 = c.redIAdd(c);
    c8 = c8.redIAdd(c8);
    c8 = c8.redIAdd(c8);

    // X3 = F - 2 * D
    nx = f.redISub(d).redISub(d);
    // Y3 = E * (D - X3) - 8 * C
    ny = e.redMul(d.redISub(nx)).redISub(c8);
    // Z3 = 2 * Y1 * Z1
    nz = this.y.redMul(this.z);
    nz = nz.redIAdd(nz);
  }

  return this.curve.jpoint(nx, ny, nz);
};

JPoint.prototype._threeDbl = function _threeDbl() {
  var nx;
  var ny;
  var nz;
  // Z = 1
  if (this.zOne) {
    // hyperelliptic.org/EFD/g1p/auto-shortw-jacobian-3.html
    //     #doubling-mdbl-2007-bl
    // 1M + 5S + 15A

    // XX = X1^2
    var xx = this.x.redSqr();
    // YY = Y1^2
    var yy = this.y.redSqr();
    // YYYY = YY^2
    var yyyy = yy.redSqr();
    // S = 2 * ((X1 + YY)^2 - XX - YYYY)
    var s = this.x.redAdd(yy).redSqr().redISub(xx).redISub(yyyy);
    s = s.redIAdd(s);
    // M = 3 * XX + a
    var m = xx.redAdd(xx).redIAdd(xx).redIAdd(this.curve.a);
    // T = M^2 - 2 * S
    var t = m.redSqr().redISub(s).redISub(s);
    // X3 = T
    nx = t;
    // Y3 = M * (S - T) - 8 * YYYY
    var yyyy8 = yyyy.redIAdd(yyyy);
    yyyy8 = yyyy8.redIAdd(yyyy8);
    yyyy8 = yyyy8.redIAdd(yyyy8);
    ny = m.redMul(s.redISub(t)).redISub(yyyy8);
    // Z3 = 2 * Y1
    nz = this.y.redAdd(this.y);
  } else {
    // hyperelliptic.org/EFD/g1p/auto-shortw-jacobian-3.html#doubling-dbl-2001-b
    // 3M + 5S

    // delta = Z1^2
    var delta = this.z.redSqr();
    // gamma = Y1^2
    var gamma = this.y.redSqr();
    // beta = X1 * gamma
    var beta = this.x.redMul(gamma);
    // alpha = 3 * (X1 - delta) * (X1 + delta)
    var alpha = this.x.redSub(delta).redMul(this.x.redAdd(delta));
    alpha = alpha.redAdd(alpha).redIAdd(alpha);
    // X3 = alpha^2 - 8 * beta
    var beta4 = beta.redIAdd(beta);
    beta4 = beta4.redIAdd(beta4);
    var beta8 = beta4.redAdd(beta4);
    nx = alpha.redSqr().redISub(beta8);
    // Z3 = (Y1 + Z1)^2 - gamma - delta
    nz = this.y.redAdd(this.z).redSqr().redISub(gamma).redISub(delta);
    // Y3 = alpha * (4 * beta - X3) - 8 * gamma^2
    var ggamma8 = gamma.redSqr();
    ggamma8 = ggamma8.redIAdd(ggamma8);
    ggamma8 = ggamma8.redIAdd(ggamma8);
    ggamma8 = ggamma8.redIAdd(ggamma8);
    ny = alpha.redMul(beta4.redISub(nx)).redISub(ggamma8);
  }

  return this.curve.jpoint(nx, ny, nz);
};

JPoint.prototype._dbl = function _dbl() {
  var a = this.curve.a;

  // 4M + 6S + 10A
  var jx = this.x;
  var jy = this.y;
  var jz = this.z;
  var jz4 = jz.redSqr().redSqr();

  var jx2 = jx.redSqr();
  var jy2 = jy.redSqr();

  var c = jx2.redAdd(jx2).redIAdd(jx2).redIAdd(a.redMul(jz4));

  var jxd4 = jx.redAdd(jx);
  jxd4 = jxd4.redIAdd(jxd4);
  var t1 = jxd4.redMul(jy2);
  var nx = c.redSqr().redISub(t1.redAdd(t1));
  var t2 = t1.redISub(nx);

  var jyd8 = jy2.redSqr();
  jyd8 = jyd8.redIAdd(jyd8);
  jyd8 = jyd8.redIAdd(jyd8);
  jyd8 = jyd8.redIAdd(jyd8);
  var ny = c.redMul(t2).redISub(jyd8);
  var nz = jy.redAdd(jy).redMul(jz);

  return this.curve.jpoint(nx, ny, nz);
};

JPoint.prototype.trpl = function trpl() {
  if (!this.curve.zeroA)
    return this.dbl().add(this);

  // hyperelliptic.org/EFD/g1p/auto-shortw-jacobian-0.html#tripling-tpl-2007-bl
  // 5M + 10S + ...

  // XX = X1^2
  var xx = this.x.redSqr();
  // YY = Y1^2
  var yy = this.y.redSqr();
  // ZZ = Z1^2
  var zz = this.z.redSqr();
  // YYYY = YY^2
  var yyyy = yy.redSqr();
  // M = 3 * XX + a * ZZ2; a = 0
  var m = xx.redAdd(xx).redIAdd(xx);
  // MM = M^2
  var mm = m.redSqr();
  // E = 6 * ((X1 + YY)^2 - XX - YYYY) - MM
  var e = this.x.redAdd(yy).redSqr().redISub(xx).redISub(yyyy);
  e = e.redIAdd(e);
  e = e.redAdd(e).redIAdd(e);
  e = e.redISub(mm);
  // EE = E^2
  var ee = e.redSqr();
  // T = 16*YYYY
  var t = yyyy.redIAdd(yyyy);
  t = t.redIAdd(t);
  t = t.redIAdd(t);
  t = t.redIAdd(t);
  // U = (M + E)^2 - MM - EE - T
  var u = m.redIAdd(e).redSqr().redISub(mm).redISub(ee).redISub(t);
  // X3 = 4 * (X1 * EE - 4 * YY * U)
  var yyu4 = yy.redMul(u);
  yyu4 = yyu4.redIAdd(yyu4);
  yyu4 = yyu4.redIAdd(yyu4);
  var nx = this.x.redMul(ee).redISub(yyu4);
  nx = nx.redIAdd(nx);
  nx = nx.redIAdd(nx);
  // Y3 = 8 * Y1 * (U * (T - U) - E * EE)
  var ny = this.y.redMul(u.redMul(t.redISub(u)).redISub(e.redMul(ee)));
  ny = ny.redIAdd(ny);
  ny = ny.redIAdd(ny);
  ny = ny.redIAdd(ny);
  // Z3 = (Z1 + E)^2 - ZZ - EE
  var nz = this.z.redAdd(e).redSqr().redISub(zz).redISub(ee);

  return this.curve.jpoint(nx, ny, nz);
};

JPoint.prototype.mul = function mul(k, kbase) {
  k = new BN(k, kbase);

  return this.curve._wnafMul(this, k);
};

JPoint.prototype.eq = function eq(p) {
  if (p.type === 'affine')
    return this.eq(p.toJ());

  if (this === p)
    return true;

  // x1 * z2^2 == x2 * z1^2
  var z2 = this.z.redSqr();
  var pz2 = p.z.redSqr();
  if (this.x.redMul(pz2).redISub(p.x.redMul(z2)).cmpn(0) !== 0)
    return false;

  // y1 * z2^3 == y2 * z1^3
  var z3 = z2.redMul(this.z);
  var pz3 = pz2.redMul(p.z);
  return this.y.redMul(pz3).redISub(p.y.redMul(z3)).cmpn(0) === 0;
};

JPoint.prototype.eqXToP = function eqXToP(x) {
  var zs = this.z.redSqr();
  var rx = x.toRed(this.curve.red).redMul(zs);
  if (this.x.cmp(rx) === 0)
    return true;

  var xc = x.clone();
  var t = this.curve.redN.redMul(zs);
  for (;;) {
    xc.iadd(this.curve.n);
    if (xc.cmp(this.curve.p) >= 0)
      return false;

    rx.redIAdd(t);
    if (this.x.cmp(rx) === 0)
      return true;
  }
};

JPoint.prototype.inspect = function inspect() {
  if (this.isInfinity())
    return '<EC JPoint Infinity>';
  return '<EC JPoint x: ' + this.x.toString(16, 2) +
      ' y: ' + this.y.toString(16, 2) +
      ' z: ' + this.z.toString(16, 2) + '>';
};

JPoint.prototype.isInfinity = function isInfinity() {
  // XXX This code assumes that zero is always zero in red
  return this.z.cmpn(0) === 0;
};

},{"../utils":"../node_modules/bitcoin-elliptic/lib/elliptic/utils.js","bn.js":"../node_modules/bitcoin-elliptic/node_modules/bn.js/lib/bn.js","inherits":"../node_modules/inherits/inherits_browser.js","./base":"../node_modules/bitcoin-elliptic/lib/elliptic/curve/base.js"}],"../node_modules/bitcoin-elliptic/lib/elliptic/curve/index.js":[function(require,module,exports) {
'use strict';

var curve = exports;

curve.base = require('./base');
curve.short = require('./short');

},{"./base":"../node_modules/bitcoin-elliptic/lib/elliptic/curve/base.js","./short":"../node_modules/bitcoin-elliptic/lib/elliptic/curve/short.js"}],"../node_modules/hash.js/lib/hash/utils.js":[function(require,module,exports) {
'use strict';

var assert = require('minimalistic-assert');
var inherits = require('inherits');

exports.inherits = inherits;

function isSurrogatePair(msg, i) {
  if ((msg.charCodeAt(i) & 0xFC00) !== 0xD800) {
    return false;
  }
  if (i < 0 || i + 1 >= msg.length) {
    return false;
  }
  return (msg.charCodeAt(i + 1) & 0xFC00) === 0xDC00;
}

function toArray(msg, enc) {
  if (Array.isArray(msg))
    return msg.slice();
  if (!msg)
    return [];
  var res = [];
  if (typeof msg === 'string') {
    if (!enc) {
      // Inspired by stringToUtf8ByteArray() in closure-library by Google
      // https://github.com/google/closure-library/blob/8598d87242af59aac233270742c8984e2b2bdbe0/closure/goog/crypt/crypt.js#L117-L143
      // Apache License 2.0
      // https://github.com/google/closure-library/blob/master/LICENSE
      var p = 0;
      for (var i = 0; i < msg.length; i++) {
        var c = msg.charCodeAt(i);
        if (c < 128) {
          res[p++] = c;
        } else if (c < 2048) {
          res[p++] = (c >> 6) | 192;
          res[p++] = (c & 63) | 128;
        } else if (isSurrogatePair(msg, i)) {
          c = 0x10000 + ((c & 0x03FF) << 10) + (msg.charCodeAt(++i) & 0x03FF);
          res[p++] = (c >> 18) | 240;
          res[p++] = ((c >> 12) & 63) | 128;
          res[p++] = ((c >> 6) & 63) | 128;
          res[p++] = (c & 63) | 128;
        } else {
          res[p++] = (c >> 12) | 224;
          res[p++] = ((c >> 6) & 63) | 128;
          res[p++] = (c & 63) | 128;
        }
      }
    } else if (enc === 'hex') {
      msg = msg.replace(/[^a-z0-9]+/ig, '');
      if (msg.length % 2 !== 0)
        msg = '0' + msg;
      for (i = 0; i < msg.length; i += 2)
        res.push(parseInt(msg[i] + msg[i + 1], 16));
    }
  } else {
    for (i = 0; i < msg.length; i++)
      res[i] = msg[i] | 0;
  }
  return res;
}
exports.toArray = toArray;

function toHex(msg) {
  var res = '';
  for (var i = 0; i < msg.length; i++)
    res += zero2(msg[i].toString(16));
  return res;
}
exports.toHex = toHex;

function htonl(w) {
  var res = (w >>> 24) |
            ((w >>> 8) & 0xff00) |
            ((w << 8) & 0xff0000) |
            ((w & 0xff) << 24);
  return res >>> 0;
}
exports.htonl = htonl;

function toHex32(msg, endian) {
  var res = '';
  for (var i = 0; i < msg.length; i++) {
    var w = msg[i];
    if (endian === 'little')
      w = htonl(w);
    res += zero8(w.toString(16));
  }
  return res;
}
exports.toHex32 = toHex32;

function zero2(word) {
  if (word.length === 1)
    return '0' + word;
  else
    return word;
}
exports.zero2 = zero2;

function zero8(word) {
  if (word.length === 7)
    return '0' + word;
  else if (word.length === 6)
    return '00' + word;
  else if (word.length === 5)
    return '000' + word;
  else if (word.length === 4)
    return '0000' + word;
  else if (word.length === 3)
    return '00000' + word;
  else if (word.length === 2)
    return '000000' + word;
  else if (word.length === 1)
    return '0000000' + word;
  else
    return word;
}
exports.zero8 = zero8;

function join32(msg, start, end, endian) {
  var len = end - start;
  assert(len % 4 === 0);
  var res = new Array(len / 4);
  for (var i = 0, k = start; i < res.length; i++, k += 4) {
    var w;
    if (endian === 'big')
      w = (msg[k] << 24) | (msg[k + 1] << 16) | (msg[k + 2] << 8) | msg[k + 3];
    else
      w = (msg[k + 3] << 24) | (msg[k + 2] << 16) | (msg[k + 1] << 8) | msg[k];
    res[i] = w >>> 0;
  }
  return res;
}
exports.join32 = join32;

function split32(msg, endian) {
  var res = new Array(msg.length * 4);
  for (var i = 0, k = 0; i < msg.length; i++, k += 4) {
    var m = msg[i];
    if (endian === 'big') {
      res[k] = m >>> 24;
      res[k + 1] = (m >>> 16) & 0xff;
      res[k + 2] = (m >>> 8) & 0xff;
      res[k + 3] = m & 0xff;
    } else {
      res[k + 3] = m >>> 24;
      res[k + 2] = (m >>> 16) & 0xff;
      res[k + 1] = (m >>> 8) & 0xff;
      res[k] = m & 0xff;
    }
  }
  return res;
}
exports.split32 = split32;

function rotr32(w, b) {
  return (w >>> b) | (w << (32 - b));
}
exports.rotr32 = rotr32;

function rotl32(w, b) {
  return (w << b) | (w >>> (32 - b));
}
exports.rotl32 = rotl32;

function sum32(a, b) {
  return (a + b) >>> 0;
}
exports.sum32 = sum32;

function sum32_3(a, b, c) {
  return (a + b + c) >>> 0;
}
exports.sum32_3 = sum32_3;

function sum32_4(a, b, c, d) {
  return (a + b + c + d) >>> 0;
}
exports.sum32_4 = sum32_4;

function sum32_5(a, b, c, d, e) {
  return (a + b + c + d + e) >>> 0;
}
exports.sum32_5 = sum32_5;

function sum64(buf, pos, ah, al) {
  var bh = buf[pos];
  var bl = buf[pos + 1];

  var lo = (al + bl) >>> 0;
  var hi = (lo < al ? 1 : 0) + ah + bh;
  buf[pos] = hi >>> 0;
  buf[pos + 1] = lo;
}
exports.sum64 = sum64;

function sum64_hi(ah, al, bh, bl) {
  var lo = (al + bl) >>> 0;
  var hi = (lo < al ? 1 : 0) + ah + bh;
  return hi >>> 0;
}
exports.sum64_hi = sum64_hi;

function sum64_lo(ah, al, bh, bl) {
  var lo = al + bl;
  return lo >>> 0;
}
exports.sum64_lo = sum64_lo;

function sum64_4_hi(ah, al, bh, bl, ch, cl, dh, dl) {
  var carry = 0;
  var lo = al;
  lo = (lo + bl) >>> 0;
  carry += lo < al ? 1 : 0;
  lo = (lo + cl) >>> 0;
  carry += lo < cl ? 1 : 0;
  lo = (lo + dl) >>> 0;
  carry += lo < dl ? 1 : 0;

  var hi = ah + bh + ch + dh + carry;
  return hi >>> 0;
}
exports.sum64_4_hi = sum64_4_hi;

function sum64_4_lo(ah, al, bh, bl, ch, cl, dh, dl) {
  var lo = al + bl + cl + dl;
  return lo >>> 0;
}
exports.sum64_4_lo = sum64_4_lo;

function sum64_5_hi(ah, al, bh, bl, ch, cl, dh, dl, eh, el) {
  var carry = 0;
  var lo = al;
  lo = (lo + bl) >>> 0;
  carry += lo < al ? 1 : 0;
  lo = (lo + cl) >>> 0;
  carry += lo < cl ? 1 : 0;
  lo = (lo + dl) >>> 0;
  carry += lo < dl ? 1 : 0;
  lo = (lo + el) >>> 0;
  carry += lo < el ? 1 : 0;

  var hi = ah + bh + ch + dh + eh + carry;
  return hi >>> 0;
}
exports.sum64_5_hi = sum64_5_hi;

function sum64_5_lo(ah, al, bh, bl, ch, cl, dh, dl, eh, el) {
  var lo = al + bl + cl + dl + el;

  return lo >>> 0;
}
exports.sum64_5_lo = sum64_5_lo;

function rotr64_hi(ah, al, num) {
  var r = (al << (32 - num)) | (ah >>> num);
  return r >>> 0;
}
exports.rotr64_hi = rotr64_hi;

function rotr64_lo(ah, al, num) {
  var r = (ah << (32 - num)) | (al >>> num);
  return r >>> 0;
}
exports.rotr64_lo = rotr64_lo;

function shr64_hi(ah, al, num) {
  return ah >>> num;
}
exports.shr64_hi = shr64_hi;

function shr64_lo(ah, al, num) {
  var r = (ah << (32 - num)) | (al >>> num);
  return r >>> 0;
}
exports.shr64_lo = shr64_lo;

},{"minimalistic-assert":"../node_modules/minimalistic-assert/index.js","inherits":"../node_modules/inherits/inherits_browser.js"}],"../node_modules/hash.js/lib/hash/common.js":[function(require,module,exports) {
'use strict';

var utils = require('./utils');
var assert = require('minimalistic-assert');

function BlockHash() {
  this.pending = null;
  this.pendingTotal = 0;
  this.blockSize = this.constructor.blockSize;
  this.outSize = this.constructor.outSize;
  this.hmacStrength = this.constructor.hmacStrength;
  this.padLength = this.constructor.padLength / 8;
  this.endian = 'big';

  this._delta8 = this.blockSize / 8;
  this._delta32 = this.blockSize / 32;
}
exports.BlockHash = BlockHash;

BlockHash.prototype.update = function update(msg, enc) {
  // Convert message to array, pad it, and join into 32bit blocks
  msg = utils.toArray(msg, enc);
  if (!this.pending)
    this.pending = msg;
  else
    this.pending = this.pending.concat(msg);
  this.pendingTotal += msg.length;

  // Enough data, try updating
  if (this.pending.length >= this._delta8) {
    msg = this.pending;

    // Process pending data in blocks
    var r = msg.length % this._delta8;
    this.pending = msg.slice(msg.length - r, msg.length);
    if (this.pending.length === 0)
      this.pending = null;

    msg = utils.join32(msg, 0, msg.length - r, this.endian);
    for (var i = 0; i < msg.length; i += this._delta32)
      this._update(msg, i, i + this._delta32);
  }

  return this;
};

BlockHash.prototype.digest = function digest(enc) {
  this.update(this._pad());
  assert(this.pending === null);

  return this._digest(enc);
};

BlockHash.prototype._pad = function pad() {
  var len = this.pendingTotal;
  var bytes = this._delta8;
  var k = bytes - ((len + this.padLength) % bytes);
  var res = new Array(k + this.padLength);
  res[0] = 0x80;
  for (var i = 1; i < k; i++)
    res[i] = 0;

  // Append length
  len <<= 3;
  if (this.endian === 'big') {
    for (var t = 8; t < this.padLength; t++)
      res[i++] = 0;

    res[i++] = 0;
    res[i++] = 0;
    res[i++] = 0;
    res[i++] = 0;
    res[i++] = (len >>> 24) & 0xff;
    res[i++] = (len >>> 16) & 0xff;
    res[i++] = (len >>> 8) & 0xff;
    res[i++] = len & 0xff;
  } else {
    res[i++] = len & 0xff;
    res[i++] = (len >>> 8) & 0xff;
    res[i++] = (len >>> 16) & 0xff;
    res[i++] = (len >>> 24) & 0xff;
    res[i++] = 0;
    res[i++] = 0;
    res[i++] = 0;
    res[i++] = 0;

    for (t = 8; t < this.padLength; t++)
      res[i++] = 0;
  }

  return res;
};

},{"./utils":"../node_modules/hash.js/lib/hash/utils.js","minimalistic-assert":"../node_modules/minimalistic-assert/index.js"}],"../node_modules/hash.js/lib/hash/sha/common.js":[function(require,module,exports) {
'use strict';

var utils = require('../utils');
var rotr32 = utils.rotr32;

function ft_1(s, x, y, z) {
  if (s === 0)
    return ch32(x, y, z);
  if (s === 1 || s === 3)
    return p32(x, y, z);
  if (s === 2)
    return maj32(x, y, z);
}
exports.ft_1 = ft_1;

function ch32(x, y, z) {
  return (x & y) ^ ((~x) & z);
}
exports.ch32 = ch32;

function maj32(x, y, z) {
  return (x & y) ^ (x & z) ^ (y & z);
}
exports.maj32 = maj32;

function p32(x, y, z) {
  return x ^ y ^ z;
}
exports.p32 = p32;

function s0_256(x) {
  return rotr32(x, 2) ^ rotr32(x, 13) ^ rotr32(x, 22);
}
exports.s0_256 = s0_256;

function s1_256(x) {
  return rotr32(x, 6) ^ rotr32(x, 11) ^ rotr32(x, 25);
}
exports.s1_256 = s1_256;

function g0_256(x) {
  return rotr32(x, 7) ^ rotr32(x, 18) ^ (x >>> 3);
}
exports.g0_256 = g0_256;

function g1_256(x) {
  return rotr32(x, 17) ^ rotr32(x, 19) ^ (x >>> 10);
}
exports.g1_256 = g1_256;

},{"../utils":"../node_modules/hash.js/lib/hash/utils.js"}],"../node_modules/hash.js/lib/hash/sha/1.js":[function(require,module,exports) {
'use strict';

var utils = require('../utils');
var common = require('../common');
var shaCommon = require('./common');

var rotl32 = utils.rotl32;
var sum32 = utils.sum32;
var sum32_5 = utils.sum32_5;
var ft_1 = shaCommon.ft_1;
var BlockHash = common.BlockHash;

var sha1_K = [
  0x5A827999, 0x6ED9EBA1,
  0x8F1BBCDC, 0xCA62C1D6
];

function SHA1() {
  if (!(this instanceof SHA1))
    return new SHA1();

  BlockHash.call(this);
  this.h = [
    0x67452301, 0xefcdab89, 0x98badcfe,
    0x10325476, 0xc3d2e1f0 ];
  this.W = new Array(80);
}

utils.inherits(SHA1, BlockHash);
module.exports = SHA1;

SHA1.blockSize = 512;
SHA1.outSize = 160;
SHA1.hmacStrength = 80;
SHA1.padLength = 64;

SHA1.prototype._update = function _update(msg, start) {
  var W = this.W;

  for (var i = 0; i < 16; i++)
    W[i] = msg[start + i];

  for(; i < W.length; i++)
    W[i] = rotl32(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);

  var a = this.h[0];
  var b = this.h[1];
  var c = this.h[2];
  var d = this.h[3];
  var e = this.h[4];

  for (i = 0; i < W.length; i++) {
    var s = ~~(i / 20);
    var t = sum32_5(rotl32(a, 5), ft_1(s, b, c, d), e, W[i], sha1_K[s]);
    e = d;
    d = c;
    c = rotl32(b, 30);
    b = a;
    a = t;
  }

  this.h[0] = sum32(this.h[0], a);
  this.h[1] = sum32(this.h[1], b);
  this.h[2] = sum32(this.h[2], c);
  this.h[3] = sum32(this.h[3], d);
  this.h[4] = sum32(this.h[4], e);
};

SHA1.prototype._digest = function digest(enc) {
  if (enc === 'hex')
    return utils.toHex32(this.h, 'big');
  else
    return utils.split32(this.h, 'big');
};

},{"../utils":"../node_modules/hash.js/lib/hash/utils.js","../common":"../node_modules/hash.js/lib/hash/common.js","./common":"../node_modules/hash.js/lib/hash/sha/common.js"}],"../node_modules/hash.js/lib/hash/sha/256.js":[function(require,module,exports) {
'use strict';

var utils = require('../utils');
var common = require('../common');
var shaCommon = require('./common');
var assert = require('minimalistic-assert');

var sum32 = utils.sum32;
var sum32_4 = utils.sum32_4;
var sum32_5 = utils.sum32_5;
var ch32 = shaCommon.ch32;
var maj32 = shaCommon.maj32;
var s0_256 = shaCommon.s0_256;
var s1_256 = shaCommon.s1_256;
var g0_256 = shaCommon.g0_256;
var g1_256 = shaCommon.g1_256;

var BlockHash = common.BlockHash;

var sha256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
  0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
  0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
  0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
  0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
  0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
];

function SHA256() {
  if (!(this instanceof SHA256))
    return new SHA256();

  BlockHash.call(this);
  this.h = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];
  this.k = sha256_K;
  this.W = new Array(64);
}
utils.inherits(SHA256, BlockHash);
module.exports = SHA256;

SHA256.blockSize = 512;
SHA256.outSize = 256;
SHA256.hmacStrength = 192;
SHA256.padLength = 64;

SHA256.prototype._update = function _update(msg, start) {
  var W = this.W;

  for (var i = 0; i < 16; i++)
    W[i] = msg[start + i];
  for (; i < W.length; i++)
    W[i] = sum32_4(g1_256(W[i - 2]), W[i - 7], g0_256(W[i - 15]), W[i - 16]);

  var a = this.h[0];
  var b = this.h[1];
  var c = this.h[2];
  var d = this.h[3];
  var e = this.h[4];
  var f = this.h[5];
  var g = this.h[6];
  var h = this.h[7];

  assert(this.k.length === W.length);
  for (i = 0; i < W.length; i++) {
    var T1 = sum32_5(h, s1_256(e), ch32(e, f, g), this.k[i], W[i]);
    var T2 = sum32(s0_256(a), maj32(a, b, c));
    h = g;
    g = f;
    f = e;
    e = sum32(d, T1);
    d = c;
    c = b;
    b = a;
    a = sum32(T1, T2);
  }

  this.h[0] = sum32(this.h[0], a);
  this.h[1] = sum32(this.h[1], b);
  this.h[2] = sum32(this.h[2], c);
  this.h[3] = sum32(this.h[3], d);
  this.h[4] = sum32(this.h[4], e);
  this.h[5] = sum32(this.h[5], f);
  this.h[6] = sum32(this.h[6], g);
  this.h[7] = sum32(this.h[7], h);
};

SHA256.prototype._digest = function digest(enc) {
  if (enc === 'hex')
    return utils.toHex32(this.h, 'big');
  else
    return utils.split32(this.h, 'big');
};

},{"../utils":"../node_modules/hash.js/lib/hash/utils.js","../common":"../node_modules/hash.js/lib/hash/common.js","./common":"../node_modules/hash.js/lib/hash/sha/common.js","minimalistic-assert":"../node_modules/minimalistic-assert/index.js"}],"../node_modules/hash.js/lib/hash/sha/224.js":[function(require,module,exports) {
'use strict';

var utils = require('../utils');
var SHA256 = require('./256');

function SHA224() {
  if (!(this instanceof SHA224))
    return new SHA224();

  SHA256.call(this);
  this.h = [
    0xc1059ed8, 0x367cd507, 0x3070dd17, 0xf70e5939,
    0xffc00b31, 0x68581511, 0x64f98fa7, 0xbefa4fa4 ];
}
utils.inherits(SHA224, SHA256);
module.exports = SHA224;

SHA224.blockSize = 512;
SHA224.outSize = 224;
SHA224.hmacStrength = 192;
SHA224.padLength = 64;

SHA224.prototype._digest = function digest(enc) {
  // Just truncate output
  if (enc === 'hex')
    return utils.toHex32(this.h.slice(0, 7), 'big');
  else
    return utils.split32(this.h.slice(0, 7), 'big');
};


},{"../utils":"../node_modules/hash.js/lib/hash/utils.js","./256":"../node_modules/hash.js/lib/hash/sha/256.js"}],"../node_modules/hash.js/lib/hash/sha/512.js":[function(require,module,exports) {
'use strict';

var utils = require('../utils');
var common = require('../common');
var assert = require('minimalistic-assert');

var rotr64_hi = utils.rotr64_hi;
var rotr64_lo = utils.rotr64_lo;
var shr64_hi = utils.shr64_hi;
var shr64_lo = utils.shr64_lo;
var sum64 = utils.sum64;
var sum64_hi = utils.sum64_hi;
var sum64_lo = utils.sum64_lo;
var sum64_4_hi = utils.sum64_4_hi;
var sum64_4_lo = utils.sum64_4_lo;
var sum64_5_hi = utils.sum64_5_hi;
var sum64_5_lo = utils.sum64_5_lo;

var BlockHash = common.BlockHash;

var sha512_K = [
  0x428a2f98, 0xd728ae22, 0x71374491, 0x23ef65cd,
  0xb5c0fbcf, 0xec4d3b2f, 0xe9b5dba5, 0x8189dbbc,
  0x3956c25b, 0xf348b538, 0x59f111f1, 0xb605d019,
  0x923f82a4, 0xaf194f9b, 0xab1c5ed5, 0xda6d8118,
  0xd807aa98, 0xa3030242, 0x12835b01, 0x45706fbe,
  0x243185be, 0x4ee4b28c, 0x550c7dc3, 0xd5ffb4e2,
  0x72be5d74, 0xf27b896f, 0x80deb1fe, 0x3b1696b1,
  0x9bdc06a7, 0x25c71235, 0xc19bf174, 0xcf692694,
  0xe49b69c1, 0x9ef14ad2, 0xefbe4786, 0x384f25e3,
  0x0fc19dc6, 0x8b8cd5b5, 0x240ca1cc, 0x77ac9c65,
  0x2de92c6f, 0x592b0275, 0x4a7484aa, 0x6ea6e483,
  0x5cb0a9dc, 0xbd41fbd4, 0x76f988da, 0x831153b5,
  0x983e5152, 0xee66dfab, 0xa831c66d, 0x2db43210,
  0xb00327c8, 0x98fb213f, 0xbf597fc7, 0xbeef0ee4,
  0xc6e00bf3, 0x3da88fc2, 0xd5a79147, 0x930aa725,
  0x06ca6351, 0xe003826f, 0x14292967, 0x0a0e6e70,
  0x27b70a85, 0x46d22ffc, 0x2e1b2138, 0x5c26c926,
  0x4d2c6dfc, 0x5ac42aed, 0x53380d13, 0x9d95b3df,
  0x650a7354, 0x8baf63de, 0x766a0abb, 0x3c77b2a8,
  0x81c2c92e, 0x47edaee6, 0x92722c85, 0x1482353b,
  0xa2bfe8a1, 0x4cf10364, 0xa81a664b, 0xbc423001,
  0xc24b8b70, 0xd0f89791, 0xc76c51a3, 0x0654be30,
  0xd192e819, 0xd6ef5218, 0xd6990624, 0x5565a910,
  0xf40e3585, 0x5771202a, 0x106aa070, 0x32bbd1b8,
  0x19a4c116, 0xb8d2d0c8, 0x1e376c08, 0x5141ab53,
  0x2748774c, 0xdf8eeb99, 0x34b0bcb5, 0xe19b48a8,
  0x391c0cb3, 0xc5c95a63, 0x4ed8aa4a, 0xe3418acb,
  0x5b9cca4f, 0x7763e373, 0x682e6ff3, 0xd6b2b8a3,
  0x748f82ee, 0x5defb2fc, 0x78a5636f, 0x43172f60,
  0x84c87814, 0xa1f0ab72, 0x8cc70208, 0x1a6439ec,
  0x90befffa, 0x23631e28, 0xa4506ceb, 0xde82bde9,
  0xbef9a3f7, 0xb2c67915, 0xc67178f2, 0xe372532b,
  0xca273ece, 0xea26619c, 0xd186b8c7, 0x21c0c207,
  0xeada7dd6, 0xcde0eb1e, 0xf57d4f7f, 0xee6ed178,
  0x06f067aa, 0x72176fba, 0x0a637dc5, 0xa2c898a6,
  0x113f9804, 0xbef90dae, 0x1b710b35, 0x131c471b,
  0x28db77f5, 0x23047d84, 0x32caab7b, 0x40c72493,
  0x3c9ebe0a, 0x15c9bebc, 0x431d67c4, 0x9c100d4c,
  0x4cc5d4be, 0xcb3e42b6, 0x597f299c, 0xfc657e2a,
  0x5fcb6fab, 0x3ad6faec, 0x6c44198c, 0x4a475817
];

function SHA512() {
  if (!(this instanceof SHA512))
    return new SHA512();

  BlockHash.call(this);
  this.h = [
    0x6a09e667, 0xf3bcc908,
    0xbb67ae85, 0x84caa73b,
    0x3c6ef372, 0xfe94f82b,
    0xa54ff53a, 0x5f1d36f1,
    0x510e527f, 0xade682d1,
    0x9b05688c, 0x2b3e6c1f,
    0x1f83d9ab, 0xfb41bd6b,
    0x5be0cd19, 0x137e2179 ];
  this.k = sha512_K;
  this.W = new Array(160);
}
utils.inherits(SHA512, BlockHash);
module.exports = SHA512;

SHA512.blockSize = 1024;
SHA512.outSize = 512;
SHA512.hmacStrength = 192;
SHA512.padLength = 128;

SHA512.prototype._prepareBlock = function _prepareBlock(msg, start) {
  var W = this.W;

  // 32 x 32bit words
  for (var i = 0; i < 32; i++)
    W[i] = msg[start + i];
  for (; i < W.length; i += 2) {
    var c0_hi = g1_512_hi(W[i - 4], W[i - 3]);  // i - 2
    var c0_lo = g1_512_lo(W[i - 4], W[i - 3]);
    var c1_hi = W[i - 14];  // i - 7
    var c1_lo = W[i - 13];
    var c2_hi = g0_512_hi(W[i - 30], W[i - 29]);  // i - 15
    var c2_lo = g0_512_lo(W[i - 30], W[i - 29]);
    var c3_hi = W[i - 32];  // i - 16
    var c3_lo = W[i - 31];

    W[i] = sum64_4_hi(
      c0_hi, c0_lo,
      c1_hi, c1_lo,
      c2_hi, c2_lo,
      c3_hi, c3_lo);
    W[i + 1] = sum64_4_lo(
      c0_hi, c0_lo,
      c1_hi, c1_lo,
      c2_hi, c2_lo,
      c3_hi, c3_lo);
  }
};

SHA512.prototype._update = function _update(msg, start) {
  this._prepareBlock(msg, start);

  var W = this.W;

  var ah = this.h[0];
  var al = this.h[1];
  var bh = this.h[2];
  var bl = this.h[3];
  var ch = this.h[4];
  var cl = this.h[5];
  var dh = this.h[6];
  var dl = this.h[7];
  var eh = this.h[8];
  var el = this.h[9];
  var fh = this.h[10];
  var fl = this.h[11];
  var gh = this.h[12];
  var gl = this.h[13];
  var hh = this.h[14];
  var hl = this.h[15];

  assert(this.k.length === W.length);
  for (var i = 0; i < W.length; i += 2) {
    var c0_hi = hh;
    var c0_lo = hl;
    var c1_hi = s1_512_hi(eh, el);
    var c1_lo = s1_512_lo(eh, el);
    var c2_hi = ch64_hi(eh, el, fh, fl, gh, gl);
    var c2_lo = ch64_lo(eh, el, fh, fl, gh, gl);
    var c3_hi = this.k[i];
    var c3_lo = this.k[i + 1];
    var c4_hi = W[i];
    var c4_lo = W[i + 1];

    var T1_hi = sum64_5_hi(
      c0_hi, c0_lo,
      c1_hi, c1_lo,
      c2_hi, c2_lo,
      c3_hi, c3_lo,
      c4_hi, c4_lo);
    var T1_lo = sum64_5_lo(
      c0_hi, c0_lo,
      c1_hi, c1_lo,
      c2_hi, c2_lo,
      c3_hi, c3_lo,
      c4_hi, c4_lo);

    c0_hi = s0_512_hi(ah, al);
    c0_lo = s0_512_lo(ah, al);
    c1_hi = maj64_hi(ah, al, bh, bl, ch, cl);
    c1_lo = maj64_lo(ah, al, bh, bl, ch, cl);

    var T2_hi = sum64_hi(c0_hi, c0_lo, c1_hi, c1_lo);
    var T2_lo = sum64_lo(c0_hi, c0_lo, c1_hi, c1_lo);

    hh = gh;
    hl = gl;

    gh = fh;
    gl = fl;

    fh = eh;
    fl = el;

    eh = sum64_hi(dh, dl, T1_hi, T1_lo);
    el = sum64_lo(dl, dl, T1_hi, T1_lo);

    dh = ch;
    dl = cl;

    ch = bh;
    cl = bl;

    bh = ah;
    bl = al;

    ah = sum64_hi(T1_hi, T1_lo, T2_hi, T2_lo);
    al = sum64_lo(T1_hi, T1_lo, T2_hi, T2_lo);
  }

  sum64(this.h, 0, ah, al);
  sum64(this.h, 2, bh, bl);
  sum64(this.h, 4, ch, cl);
  sum64(this.h, 6, dh, dl);
  sum64(this.h, 8, eh, el);
  sum64(this.h, 10, fh, fl);
  sum64(this.h, 12, gh, gl);
  sum64(this.h, 14, hh, hl);
};

SHA512.prototype._digest = function digest(enc) {
  if (enc === 'hex')
    return utils.toHex32(this.h, 'big');
  else
    return utils.split32(this.h, 'big');
};

function ch64_hi(xh, xl, yh, yl, zh) {
  var r = (xh & yh) ^ ((~xh) & zh);
  if (r < 0)
    r += 0x100000000;
  return r;
}

function ch64_lo(xh, xl, yh, yl, zh, zl) {
  var r = (xl & yl) ^ ((~xl) & zl);
  if (r < 0)
    r += 0x100000000;
  return r;
}

function maj64_hi(xh, xl, yh, yl, zh) {
  var r = (xh & yh) ^ (xh & zh) ^ (yh & zh);
  if (r < 0)
    r += 0x100000000;
  return r;
}

function maj64_lo(xh, xl, yh, yl, zh, zl) {
  var r = (xl & yl) ^ (xl & zl) ^ (yl & zl);
  if (r < 0)
    r += 0x100000000;
  return r;
}

function s0_512_hi(xh, xl) {
  var c0_hi = rotr64_hi(xh, xl, 28);
  var c1_hi = rotr64_hi(xl, xh, 2);  // 34
  var c2_hi = rotr64_hi(xl, xh, 7);  // 39

  var r = c0_hi ^ c1_hi ^ c2_hi;
  if (r < 0)
    r += 0x100000000;
  return r;
}

function s0_512_lo(xh, xl) {
  var c0_lo = rotr64_lo(xh, xl, 28);
  var c1_lo = rotr64_lo(xl, xh, 2);  // 34
  var c2_lo = rotr64_lo(xl, xh, 7);  // 39

  var r = c0_lo ^ c1_lo ^ c2_lo;
  if (r < 0)
    r += 0x100000000;
  return r;
}

function s1_512_hi(xh, xl) {
  var c0_hi = rotr64_hi(xh, xl, 14);
  var c1_hi = rotr64_hi(xh, xl, 18);
  var c2_hi = rotr64_hi(xl, xh, 9);  // 41

  var r = c0_hi ^ c1_hi ^ c2_hi;
  if (r < 0)
    r += 0x100000000;
  return r;
}

function s1_512_lo(xh, xl) {
  var c0_lo = rotr64_lo(xh, xl, 14);
  var c1_lo = rotr64_lo(xh, xl, 18);
  var c2_lo = rotr64_lo(xl, xh, 9);  // 41

  var r = c0_lo ^ c1_lo ^ c2_lo;
  if (r < 0)
    r += 0x100000000;
  return r;
}

function g0_512_hi(xh, xl) {
  var c0_hi = rotr64_hi(xh, xl, 1);
  var c1_hi = rotr64_hi(xh, xl, 8);
  var c2_hi = shr64_hi(xh, xl, 7);

  var r = c0_hi ^ c1_hi ^ c2_hi;
  if (r < 0)
    r += 0x100000000;
  return r;
}

function g0_512_lo(xh, xl) {
  var c0_lo = rotr64_lo(xh, xl, 1);
  var c1_lo = rotr64_lo(xh, xl, 8);
  var c2_lo = shr64_lo(xh, xl, 7);

  var r = c0_lo ^ c1_lo ^ c2_lo;
  if (r < 0)
    r += 0x100000000;
  return r;
}

function g1_512_hi(xh, xl) {
  var c0_hi = rotr64_hi(xh, xl, 19);
  var c1_hi = rotr64_hi(xl, xh, 29);  // 61
  var c2_hi = shr64_hi(xh, xl, 6);

  var r = c0_hi ^ c1_hi ^ c2_hi;
  if (r < 0)
    r += 0x100000000;
  return r;
}

function g1_512_lo(xh, xl) {
  var c0_lo = rotr64_lo(xh, xl, 19);
  var c1_lo = rotr64_lo(xl, xh, 29);  // 61
  var c2_lo = shr64_lo(xh, xl, 6);

  var r = c0_lo ^ c1_lo ^ c2_lo;
  if (r < 0)
    r += 0x100000000;
  return r;
}

},{"../utils":"../node_modules/hash.js/lib/hash/utils.js","../common":"../node_modules/hash.js/lib/hash/common.js","minimalistic-assert":"../node_modules/minimalistic-assert/index.js"}],"../node_modules/hash.js/lib/hash/sha/384.js":[function(require,module,exports) {
'use strict';

var utils = require('../utils');

var SHA512 = require('./512');

function SHA384() {
  if (!(this instanceof SHA384))
    return new SHA384();

  SHA512.call(this);
  this.h = [
    0xcbbb9d5d, 0xc1059ed8,
    0x629a292a, 0x367cd507,
    0x9159015a, 0x3070dd17,
    0x152fecd8, 0xf70e5939,
    0x67332667, 0xffc00b31,
    0x8eb44a87, 0x68581511,
    0xdb0c2e0d, 0x64f98fa7,
    0x47b5481d, 0xbefa4fa4 ];
}
utils.inherits(SHA384, SHA512);
module.exports = SHA384;

SHA384.blockSize = 1024;
SHA384.outSize = 384;
SHA384.hmacStrength = 192;
SHA384.padLength = 128;

SHA384.prototype._digest = function digest(enc) {
  if (enc === 'hex')
    return utils.toHex32(this.h.slice(0, 12), 'big');
  else
    return utils.split32(this.h.slice(0, 12), 'big');
};

},{"../utils":"../node_modules/hash.js/lib/hash/utils.js","./512":"../node_modules/hash.js/lib/hash/sha/512.js"}],"../node_modules/hash.js/lib/hash/sha.js":[function(require,module,exports) {
'use strict';

exports.sha1 = require('./sha/1');
exports.sha224 = require('./sha/224');
exports.sha256 = require('./sha/256');
exports.sha384 = require('./sha/384');
exports.sha512 = require('./sha/512');

},{"./sha/1":"../node_modules/hash.js/lib/hash/sha/1.js","./sha/224":"../node_modules/hash.js/lib/hash/sha/224.js","./sha/256":"../node_modules/hash.js/lib/hash/sha/256.js","./sha/384":"../node_modules/hash.js/lib/hash/sha/384.js","./sha/512":"../node_modules/hash.js/lib/hash/sha/512.js"}],"../node_modules/hash.js/lib/hash/ripemd.js":[function(require,module,exports) {
'use strict';

var utils = require('./utils');
var common = require('./common');

var rotl32 = utils.rotl32;
var sum32 = utils.sum32;
var sum32_3 = utils.sum32_3;
var sum32_4 = utils.sum32_4;
var BlockHash = common.BlockHash;

function RIPEMD160() {
  if (!(this instanceof RIPEMD160))
    return new RIPEMD160();

  BlockHash.call(this);

  this.h = [ 0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0 ];
  this.endian = 'little';
}
utils.inherits(RIPEMD160, BlockHash);
exports.ripemd160 = RIPEMD160;

RIPEMD160.blockSize = 512;
RIPEMD160.outSize = 160;
RIPEMD160.hmacStrength = 192;
RIPEMD160.padLength = 64;

RIPEMD160.prototype._update = function update(msg, start) {
  var A = this.h[0];
  var B = this.h[1];
  var C = this.h[2];
  var D = this.h[3];
  var E = this.h[4];
  var Ah = A;
  var Bh = B;
  var Ch = C;
  var Dh = D;
  var Eh = E;
  for (var j = 0; j < 80; j++) {
    var T = sum32(
      rotl32(
        sum32_4(A, f(j, B, C, D), msg[r[j] + start], K(j)),
        s[j]),
      E);
    A = E;
    E = D;
    D = rotl32(C, 10);
    C = B;
    B = T;
    T = sum32(
      rotl32(
        sum32_4(Ah, f(79 - j, Bh, Ch, Dh), msg[rh[j] + start], Kh(j)),
        sh[j]),
      Eh);
    Ah = Eh;
    Eh = Dh;
    Dh = rotl32(Ch, 10);
    Ch = Bh;
    Bh = T;
  }
  T = sum32_3(this.h[1], C, Dh);
  this.h[1] = sum32_3(this.h[2], D, Eh);
  this.h[2] = sum32_3(this.h[3], E, Ah);
  this.h[3] = sum32_3(this.h[4], A, Bh);
  this.h[4] = sum32_3(this.h[0], B, Ch);
  this.h[0] = T;
};

RIPEMD160.prototype._digest = function digest(enc) {
  if (enc === 'hex')
    return utils.toHex32(this.h, 'little');
  else
    return utils.split32(this.h, 'little');
};

function f(j, x, y, z) {
  if (j <= 15)
    return x ^ y ^ z;
  else if (j <= 31)
    return (x & y) | ((~x) & z);
  else if (j <= 47)
    return (x | (~y)) ^ z;
  else if (j <= 63)
    return (x & z) | (y & (~z));
  else
    return x ^ (y | (~z));
}

function K(j) {
  if (j <= 15)
    return 0x00000000;
  else if (j <= 31)
    return 0x5a827999;
  else if (j <= 47)
    return 0x6ed9eba1;
  else if (j <= 63)
    return 0x8f1bbcdc;
  else
    return 0xa953fd4e;
}

function Kh(j) {
  if (j <= 15)
    return 0x50a28be6;
  else if (j <= 31)
    return 0x5c4dd124;
  else if (j <= 47)
    return 0x6d703ef3;
  else if (j <= 63)
    return 0x7a6d76e9;
  else
    return 0x00000000;
}

var r = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8,
  3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12,
  1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2,
  4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13
];

var rh = [
  5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12,
  6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2,
  15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13,
  8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14,
  12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11
];

var s = [
  11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8,
  7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12,
  11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5,
  11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12,
  9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6
];

var sh = [
  8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6,
  9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11,
  9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5,
  15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8,
  8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11
];

},{"./utils":"../node_modules/hash.js/lib/hash/utils.js","./common":"../node_modules/hash.js/lib/hash/common.js"}],"../node_modules/hash.js/lib/hash/hmac.js":[function(require,module,exports) {
'use strict';

var utils = require('./utils');
var assert = require('minimalistic-assert');

function Hmac(hash, key, enc) {
  if (!(this instanceof Hmac))
    return new Hmac(hash, key, enc);
  this.Hash = hash;
  this.blockSize = hash.blockSize / 8;
  this.outSize = hash.outSize / 8;
  this.inner = null;
  this.outer = null;

  this._init(utils.toArray(key, enc));
}
module.exports = Hmac;

Hmac.prototype._init = function init(key) {
  // Shorten key, if needed
  if (key.length > this.blockSize)
    key = new this.Hash().update(key).digest();
  assert(key.length <= this.blockSize);

  // Add padding to key
  for (var i = key.length; i < this.blockSize; i++)
    key.push(0);

  for (i = 0; i < key.length; i++)
    key[i] ^= 0x36;
  this.inner = new this.Hash().update(key);

  // 0x36 ^ 0x5c = 0x6a
  for (i = 0; i < key.length; i++)
    key[i] ^= 0x6a;
  this.outer = new this.Hash().update(key);
};

Hmac.prototype.update = function update(msg, enc) {
  this.inner.update(msg, enc);
  return this;
};

Hmac.prototype.digest = function digest(enc) {
  this.outer.update(this.inner.digest());
  return this.outer.digest(enc);
};

},{"./utils":"../node_modules/hash.js/lib/hash/utils.js","minimalistic-assert":"../node_modules/minimalistic-assert/index.js"}],"../node_modules/hash.js/lib/hash.js":[function(require,module,exports) {
var hash = exports;

hash.utils = require('./hash/utils');
hash.common = require('./hash/common');
hash.sha = require('./hash/sha');
hash.ripemd = require('./hash/ripemd');
hash.hmac = require('./hash/hmac');

// Proxy hash functions to the main object
hash.sha1 = hash.sha.sha1;
hash.sha256 = hash.sha.sha256;
hash.sha224 = hash.sha.sha224;
hash.sha384 = hash.sha.sha384;
hash.sha512 = hash.sha.sha512;
hash.ripemd160 = hash.ripemd.ripemd160;

},{"./hash/utils":"../node_modules/hash.js/lib/hash/utils.js","./hash/common":"../node_modules/hash.js/lib/hash/common.js","./hash/sha":"../node_modules/hash.js/lib/hash/sha.js","./hash/ripemd":"../node_modules/hash.js/lib/hash/ripemd.js","./hash/hmac":"../node_modules/hash.js/lib/hash/hmac.js"}],"../node_modules/bitcoin-elliptic/lib/elliptic/precomputed/secp256k1.js":[function(require,module,exports) {
module.exports = {
  doubles: {
    step: 4,
    points: [
      [
        'e60fce93b59e9ec53011aabc21c23e97b2a31369b87a5ae9c44ee89e2a6dec0a',
        'f7e3507399e595929db99f34f57937101296891e44d23f0be1f32cce69616821'
      ],
      [
        '8282263212c609d9ea2a6e3e172de238d8c39cabd5ac1ca10646e23fd5f51508',
        '11f8a8098557dfe45e8256e830b60ace62d613ac2f7b17bed31b6eaff6e26caf'
      ],
      [
        '175e159f728b865a72f99cc6c6fc846de0b93833fd2222ed73fce5b551e5b739',
        'd3506e0d9e3c79eba4ef97a51ff71f5eacb5955add24345c6efa6ffee9fed695'
      ],
      [
        '363d90d447b00c9c99ceac05b6262ee053441c7e55552ffe526bad8f83ff4640',
        '4e273adfc732221953b445397f3363145b9a89008199ecb62003c7f3bee9de9'
      ],
      [
        '8b4b5f165df3c2be8c6244b5b745638843e4a781a15bcd1b69f79a55dffdf80c',
        '4aad0a6f68d308b4b3fbd7813ab0da04f9e336546162ee56b3eff0c65fd4fd36'
      ],
      [
        '723cbaa6e5db996d6bf771c00bd548c7b700dbffa6c0e77bcb6115925232fcda',
        '96e867b5595cc498a921137488824d6e2660a0653779494801dc069d9eb39f5f'
      ],
      [
        'eebfa4d493bebf98ba5feec812c2d3b50947961237a919839a533eca0e7dd7fa',
        '5d9a8ca3970ef0f269ee7edaf178089d9ae4cdc3a711f712ddfd4fdae1de8999'
      ],
      [
        '100f44da696e71672791d0a09b7bde459f1215a29b3c03bfefd7835b39a48db0',
        'cdd9e13192a00b772ec8f3300c090666b7ff4a18ff5195ac0fbd5cd62bc65a09'
      ],
      [
        'e1031be262c7ed1b1dc9227a4a04c017a77f8d4464f3b3852c8acde6e534fd2d',
        '9d7061928940405e6bb6a4176597535af292dd419e1ced79a44f18f29456a00d'
      ],
      [
        'feea6cae46d55b530ac2839f143bd7ec5cf8b266a41d6af52d5e688d9094696d',
        'e57c6b6c97dce1bab06e4e12bf3ecd5c981c8957cc41442d3155debf18090088'
      ],
      [
        'da67a91d91049cdcb367be4be6ffca3cfeed657d808583de33fa978bc1ec6cb1',
        '9bacaa35481642bc41f463f7ec9780e5dec7adc508f740a17e9ea8e27a68be1d'
      ],
      [
        '53904faa0b334cdda6e000935ef22151ec08d0f7bb11069f57545ccc1a37b7c0',
        '5bc087d0bc80106d88c9eccac20d3c1c13999981e14434699dcb096b022771c8'
      ],
      [
        '8e7bcd0bd35983a7719cca7764ca906779b53a043a9b8bcaeff959f43ad86047',
        '10b7770b2a3da4b3940310420ca9514579e88e2e47fd68b3ea10047e8460372a'
      ],
      [
        '385eed34c1cdff21e6d0818689b81bde71a7f4f18397e6690a841e1599c43862',
        '283bebc3e8ea23f56701de19e9ebf4576b304eec2086dc8cc0458fe5542e5453'
      ],
      [
        '6f9d9b803ecf191637c73a4413dfa180fddf84a5947fbc9c606ed86c3fac3a7',
        '7c80c68e603059ba69b8e2a30e45c4d47ea4dd2f5c281002d86890603a842160'
      ],
      [
        '3322d401243c4e2582a2147c104d6ecbf774d163db0f5e5313b7e0e742d0e6bd',
        '56e70797e9664ef5bfb019bc4ddaf9b72805f63ea2873af624f3a2e96c28b2a0'
      ],
      [
        '85672c7d2de0b7da2bd1770d89665868741b3f9af7643397721d74d28134ab83',
        '7c481b9b5b43b2eb6374049bfa62c2e5e77f17fcc5298f44c8e3094f790313a6'
      ],
      [
        '948bf809b1988a46b06c9f1919413b10f9226c60f668832ffd959af60c82a0a',
        '53a562856dcb6646dc6b74c5d1c3418c6d4dff08c97cd2bed4cb7f88d8c8e589'
      ],
      [
        '6260ce7f461801c34f067ce0f02873a8f1b0e44dfc69752accecd819f38fd8e8',
        'bc2da82b6fa5b571a7f09049776a1ef7ecd292238051c198c1a84e95b2b4ae17'
      ],
      [
        'e5037de0afc1d8d43d8348414bbf4103043ec8f575bfdc432953cc8d2037fa2d',
        '4571534baa94d3b5f9f98d09fb990bddbd5f5b03ec481f10e0e5dc841d755bda'
      ],
      [
        'e06372b0f4a207adf5ea905e8f1771b4e7e8dbd1c6a6c5b725866a0ae4fce725',
        '7a908974bce18cfe12a27bb2ad5a488cd7484a7787104870b27034f94eee31dd'
      ],
      [
        '213c7a715cd5d45358d0bbf9dc0ce02204b10bdde2a3f58540ad6908d0559754',
        '4b6dad0b5ae462507013ad06245ba190bb4850f5f36a7eeddff2c27534b458f2'
      ],
      [
        '4e7c272a7af4b34e8dbb9352a5419a87e2838c70adc62cddf0cc3a3b08fbd53c',
        '17749c766c9d0b18e16fd09f6def681b530b9614bff7dd33e0b3941817dcaae6'
      ],
      [
        'fea74e3dbe778b1b10f238ad61686aa5c76e3db2be43057632427e2840fb27b6',
        '6e0568db9b0b13297cf674deccb6af93126b596b973f7b77701d3db7f23cb96f'
      ],
      [
        '76e64113f677cf0e10a2570d599968d31544e179b760432952c02a4417bdde39',
        'c90ddf8dee4e95cf577066d70681f0d35e2a33d2b56d2032b4b1752d1901ac01'
      ],
      [
        'c738c56b03b2abe1e8281baa743f8f9a8f7cc643df26cbee3ab150242bcbb891',
        '893fb578951ad2537f718f2eacbfbbbb82314eef7880cfe917e735d9699a84c3'
      ],
      [
        'd895626548b65b81e264c7637c972877d1d72e5f3a925014372e9f6588f6c14b',
        'febfaa38f2bc7eae728ec60818c340eb03428d632bb067e179363ed75d7d991f'
      ],
      [
        'b8da94032a957518eb0f6433571e8761ceffc73693e84edd49150a564f676e03',
        '2804dfa44805a1e4d7c99cc9762808b092cc584d95ff3b511488e4e74efdf6e7'
      ],
      [
        'e80fea14441fb33a7d8adab9475d7fab2019effb5156a792f1a11778e3c0df5d',
        'eed1de7f638e00771e89768ca3ca94472d155e80af322ea9fcb4291b6ac9ec78'
      ],
      [
        'a301697bdfcd704313ba48e51d567543f2a182031efd6915ddc07bbcc4e16070',
        '7370f91cfb67e4f5081809fa25d40f9b1735dbf7c0a11a130c0d1a041e177ea1'
      ],
      [
        '90ad85b389d6b936463f9d0512678de208cc330b11307fffab7ac63e3fb04ed4',
        'e507a3620a38261affdcbd9427222b839aefabe1582894d991d4d48cb6ef150'
      ],
      [
        '8f68b9d2f63b5f339239c1ad981f162ee88c5678723ea3351b7b444c9ec4c0da',
        '662a9f2dba063986de1d90c2b6be215dbbea2cfe95510bfdf23cbf79501fff82'
      ],
      [
        'e4f3fb0176af85d65ff99ff9198c36091f48e86503681e3e6686fd5053231e11',
        '1e63633ad0ef4f1c1661a6d0ea02b7286cc7e74ec951d1c9822c38576feb73bc'
      ],
      [
        '8c00fa9b18ebf331eb961537a45a4266c7034f2f0d4e1d0716fb6eae20eae29e',
        'efa47267fea521a1a9dc343a3736c974c2fadafa81e36c54e7d2a4c66702414b'
      ],
      [
        'e7a26ce69dd4829f3e10cec0a9e98ed3143d084f308b92c0997fddfc60cb3e41',
        '2a758e300fa7984b471b006a1aafbb18d0a6b2c0420e83e20e8a9421cf2cfd51'
      ],
      [
        'b6459e0ee3662ec8d23540c223bcbdc571cbcb967d79424f3cf29eb3de6b80ef',
        '67c876d06f3e06de1dadf16e5661db3c4b3ae6d48e35b2ff30bf0b61a71ba45'
      ],
      [
        'd68a80c8280bb840793234aa118f06231d6f1fc67e73c5a5deda0f5b496943e8',
        'db8ba9fff4b586d00c4b1f9177b0e28b5b0e7b8f7845295a294c84266b133120'
      ],
      [
        '324aed7df65c804252dc0270907a30b09612aeb973449cea4095980fc28d3d5d',
        '648a365774b61f2ff130c0c35aec1f4f19213b0c7e332843967224af96ab7c84'
      ],
      [
        '4df9c14919cde61f6d51dfdbe5fee5dceec4143ba8d1ca888e8bd373fd054c96',
        '35ec51092d8728050974c23a1d85d4b5d506cdc288490192ebac06cad10d5d'
      ],
      [
        '9c3919a84a474870faed8a9c1cc66021523489054d7f0308cbfc99c8ac1f98cd',
        'ddb84f0f4a4ddd57584f044bf260e641905326f76c64c8e6be7e5e03d4fc599d'
      ],
      [
        '6057170b1dd12fdf8de05f281d8e06bb91e1493a8b91d4cc5a21382120a959e5',
        '9a1af0b26a6a4807add9a2daf71df262465152bc3ee24c65e899be932385a2a8'
      ],
      [
        'a576df8e23a08411421439a4518da31880cef0fba7d4df12b1a6973eecb94266',
        '40a6bf20e76640b2c92b97afe58cd82c432e10a7f514d9f3ee8be11ae1b28ec8'
      ],
      [
        '7778a78c28dec3e30a05fe9629de8c38bb30d1f5cf9a3a208f763889be58ad71',
        '34626d9ab5a5b22ff7098e12f2ff580087b38411ff24ac563b513fc1fd9f43ac'
      ],
      [
        '928955ee637a84463729fd30e7afd2ed5f96274e5ad7e5cb09eda9c06d903ac',
        'c25621003d3f42a827b78a13093a95eeac3d26efa8a8d83fc5180e935bcd091f'
      ],
      [
        '85d0fef3ec6db109399064f3a0e3b2855645b4a907ad354527aae75163d82751',
        '1f03648413a38c0be29d496e582cf5663e8751e96877331582c237a24eb1f962'
      ],
      [
        'ff2b0dce97eece97c1c9b6041798b85dfdfb6d8882da20308f5404824526087e',
        '493d13fef524ba188af4c4dc54d07936c7b7ed6fb90e2ceb2c951e01f0c29907'
      ],
      [
        '827fbbe4b1e880ea9ed2b2e6301b212b57f1ee148cd6dd28780e5e2cf856e241',
        'c60f9c923c727b0b71bef2c67d1d12687ff7a63186903166d605b68baec293ec'
      ],
      [
        'eaa649f21f51bdbae7be4ae34ce6e5217a58fdce7f47f9aa7f3b58fa2120e2b3',
        'be3279ed5bbbb03ac69a80f89879aa5a01a6b965f13f7e59d47a5305ba5ad93d'
      ],
      [
        'e4a42d43c5cf169d9391df6decf42ee541b6d8f0c9a137401e23632dda34d24f',
        '4d9f92e716d1c73526fc99ccfb8ad34ce886eedfa8d8e4f13a7f7131deba9414'
      ],
      [
        '1ec80fef360cbdd954160fadab352b6b92b53576a88fea4947173b9d4300bf19',
        'aeefe93756b5340d2f3a4958a7abbf5e0146e77f6295a07b671cdc1cc107cefd'
      ],
      [
        '146a778c04670c2f91b00af4680dfa8bce3490717d58ba889ddb5928366642be',
        'b318e0ec3354028add669827f9d4b2870aaa971d2f7e5ed1d0b297483d83efd0'
      ],
      [
        'fa50c0f61d22e5f07e3acebb1aa07b128d0012209a28b9776d76a8793180eef9',
        '6b84c6922397eba9b72cd2872281a68a5e683293a57a213b38cd8d7d3f4f2811'
      ],
      [
        'da1d61d0ca721a11b1a5bf6b7d88e8421a288ab5d5bba5220e53d32b5f067ec2',
        '8157f55a7c99306c79c0766161c91e2966a73899d279b48a655fba0f1ad836f1'
      ],
      [
        'a8e282ff0c9706907215ff98e8fd416615311de0446f1e062a73b0610d064e13',
        '7f97355b8db81c09abfb7f3c5b2515888b679a3e50dd6bd6cef7c73111f4cc0c'
      ],
      [
        '174a53b9c9a285872d39e56e6913cab15d59b1fa512508c022f382de8319497c',
        'ccc9dc37abfc9c1657b4155f2c47f9e6646b3a1d8cb9854383da13ac079afa73'
      ],
      [
        '959396981943785c3d3e57edf5018cdbe039e730e4918b3d884fdff09475b7ba',
        '2e7e552888c331dd8ba0386a4b9cd6849c653f64c8709385e9b8abf87524f2fd'
      ],
      [
        'd2a63a50ae401e56d645a1153b109a8fcca0a43d561fba2dbb51340c9d82b151',
        'e82d86fb6443fcb7565aee58b2948220a70f750af484ca52d4142174dcf89405'
      ],
      [
        '64587e2335471eb890ee7896d7cfdc866bacbdbd3839317b3436f9b45617e073',
        'd99fcdd5bf6902e2ae96dd6447c299a185b90a39133aeab358299e5e9faf6589'
      ],
      [
        '8481bde0e4e4d885b3a546d3e549de042f0aa6cea250e7fd358d6c86dd45e458',
        '38ee7b8cba5404dd84a25bf39cecb2ca900a79c42b262e556d64b1b59779057e'
      ],
      [
        '13464a57a78102aa62b6979ae817f4637ffcfed3c4b1ce30bcd6303f6caf666b',
        '69be159004614580ef7e433453ccb0ca48f300a81d0942e13f495a907f6ecc27'
      ],
      [
        'bc4a9df5b713fe2e9aef430bcc1dc97a0cd9ccede2f28588cada3a0d2d83f366',
        'd3a81ca6e785c06383937adf4b798caa6e8a9fbfa547b16d758d666581f33c1'
      ],
      [
        '8c28a97bf8298bc0d23d8c749452a32e694b65e30a9472a3954ab30fe5324caa',
        '40a30463a3305193378fedf31f7cc0eb7ae784f0451cb9459e71dc73cbef9482'
      ],
      [
        '8ea9666139527a8c1dd94ce4f071fd23c8b350c5a4bb33748c4ba111faccae0',
        '620efabbc8ee2782e24e7c0cfb95c5d735b783be9cf0f8e955af34a30e62b945'
      ],
      [
        'dd3625faef5ba06074669716bbd3788d89bdde815959968092f76cc4eb9a9787',
        '7a188fa3520e30d461da2501045731ca941461982883395937f68d00c644a573'
      ],
      [
        'f710d79d9eb962297e4f6232b40e8f7feb2bc63814614d692c12de752408221e',
        'ea98e67232d3b3295d3b535532115ccac8612c721851617526ae47a9c77bfc82'
      ]
    ]
  },
  naf: {
    wnd: 7,
    points: [
      [
        'f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f9',
        '388f7b0f632de8140fe337e62a37f3566500a99934c2231b6cb9fd7584b8e672'
      ],
      [
        '2f8bde4d1a07209355b4a7250a5c5128e88b84bddc619ab7cba8d569b240efe4',
        'd8ac222636e5e3d6d4dba9dda6c9c426f788271bab0d6840dca87d3aa6ac62d6'
      ],
      [
        '5cbdf0646e5db4eaa398f365f2ea7a0e3d419b7e0330e39ce92bddedcac4f9bc',
        '6aebca40ba255960a3178d6d861a54dba813d0b813fde7b5a5082628087264da'
      ],
      [
        'acd484e2f0c7f65309ad178a9f559abde09796974c57e714c35f110dfc27ccbe',
        'cc338921b0a7d9fd64380971763b61e9add888a4375f8e0f05cc262ac64f9c37'
      ],
      [
        '774ae7f858a9411e5ef4246b70c65aac5649980be5c17891bbec17895da008cb',
        'd984a032eb6b5e190243dd56d7b7b365372db1e2dff9d6a8301d74c9c953c61b'
      ],
      [
        'f28773c2d975288bc7d1d205c3748651b075fbc6610e58cddeeddf8f19405aa8',
        'ab0902e8d880a89758212eb65cdaf473a1a06da521fa91f29b5cb52db03ed81'
      ],
      [
        'd7924d4f7d43ea965a465ae3095ff41131e5946f3c85f79e44adbcf8e27e080e',
        '581e2872a86c72a683842ec228cc6defea40af2bd896d3a5c504dc9ff6a26b58'
      ],
      [
        'defdea4cdb677750a420fee807eacf21eb9898ae79b9768766e4faa04a2d4a34',
        '4211ab0694635168e997b0ead2a93daeced1f4a04a95c0f6cfb199f69e56eb77'
      ],
      [
        '2b4ea0a797a443d293ef5cff444f4979f06acfebd7e86d277475656138385b6c',
        '85e89bc037945d93b343083b5a1c86131a01f60c50269763b570c854e5c09b7a'
      ],
      [
        '352bbf4a4cdd12564f93fa332ce333301d9ad40271f8107181340aef25be59d5',
        '321eb4075348f534d59c18259dda3e1f4a1b3b2e71b1039c67bd3d8bcf81998c'
      ],
      [
        '2fa2104d6b38d11b0230010559879124e42ab8dfeff5ff29dc9cdadd4ecacc3f',
        '2de1068295dd865b64569335bd5dd80181d70ecfc882648423ba76b532b7d67'
      ],
      [
        '9248279b09b4d68dab21a9b066edda83263c3d84e09572e269ca0cd7f5453714',
        '73016f7bf234aade5d1aa71bdea2b1ff3fc0de2a887912ffe54a32ce97cb3402'
      ],
      [
        'daed4f2be3a8bf278e70132fb0beb7522f570e144bf615c07e996d443dee8729',
        'a69dce4a7d6c98e8d4a1aca87ef8d7003f83c230f3afa726ab40e52290be1c55'
      ],
      [
        'c44d12c7065d812e8acf28d7cbb19f9011ecd9e9fdf281b0e6a3b5e87d22e7db',
        '2119a460ce326cdc76c45926c982fdac0e106e861edf61c5a039063f0e0e6482'
      ],
      [
        '6a245bf6dc698504c89a20cfded60853152b695336c28063b61c65cbd269e6b4',
        'e022cf42c2bd4a708b3f5126f16a24ad8b33ba48d0423b6efd5e6348100d8a82'
      ],
      [
        '1697ffa6fd9de627c077e3d2fe541084ce13300b0bec1146f95ae57f0d0bd6a5',
        'b9c398f186806f5d27561506e4557433a2cf15009e498ae7adee9d63d01b2396'
      ],
      [
        '605bdb019981718b986d0f07e834cb0d9deb8360ffb7f61df982345ef27a7479',
        '2972d2de4f8d20681a78d93ec96fe23c26bfae84fb14db43b01e1e9056b8c49'
      ],
      [
        '62d14dab4150bf497402fdc45a215e10dcb01c354959b10cfe31c7e9d87ff33d',
        '80fc06bd8cc5b01098088a1950eed0db01aa132967ab472235f5642483b25eaf'
      ],
      [
        '80c60ad0040f27dade5b4b06c408e56b2c50e9f56b9b8b425e555c2f86308b6f',
        '1c38303f1cc5c30f26e66bad7fe72f70a65eed4cbe7024eb1aa01f56430bd57a'
      ],
      [
        '7a9375ad6167ad54aa74c6348cc54d344cc5dc9487d847049d5eabb0fa03c8fb',
        'd0e3fa9eca8726909559e0d79269046bdc59ea10c70ce2b02d499ec224dc7f7'
      ],
      [
        'd528ecd9b696b54c907a9ed045447a79bb408ec39b68df504bb51f459bc3ffc9',
        'eecf41253136e5f99966f21881fd656ebc4345405c520dbc063465b521409933'
      ],
      [
        '49370a4b5f43412ea25f514e8ecdad05266115e4a7ecb1387231808f8b45963',
        '758f3f41afd6ed428b3081b0512fd62a54c3f3afbb5b6764b653052a12949c9a'
      ],
      [
        '77f230936ee88cbbd73df930d64702ef881d811e0e1498e2f1c13eb1fc345d74',
        '958ef42a7886b6400a08266e9ba1b37896c95330d97077cbbe8eb3c7671c60d6'
      ],
      [
        'f2dac991cc4ce4b9ea44887e5c7c0bce58c80074ab9d4dbaeb28531b7739f530',
        'e0dedc9b3b2f8dad4da1f32dec2531df9eb5fbeb0598e4fd1a117dba703a3c37'
      ],
      [
        '463b3d9f662621fb1b4be8fbbe2520125a216cdfc9dae3debcba4850c690d45b',
        '5ed430d78c296c3543114306dd8622d7c622e27c970a1de31cb377b01af7307e'
      ],
      [
        'f16f804244e46e2a09232d4aff3b59976b98fac14328a2d1a32496b49998f247',
        'cedabd9b82203f7e13d206fcdf4e33d92a6c53c26e5cce26d6579962c4e31df6'
      ],
      [
        'caf754272dc84563b0352b7a14311af55d245315ace27c65369e15f7151d41d1',
        'cb474660ef35f5f2a41b643fa5e460575f4fa9b7962232a5c32f908318a04476'
      ],
      [
        '2600ca4b282cb986f85d0f1709979d8b44a09c07cb86d7c124497bc86f082120',
        '4119b88753c15bd6a693b03fcddbb45d5ac6be74ab5f0ef44b0be9475a7e4b40'
      ],
      [
        '7635ca72d7e8432c338ec53cd12220bc01c48685e24f7dc8c602a7746998e435',
        '91b649609489d613d1d5e590f78e6d74ecfc061d57048bad9e76f302c5b9c61'
      ],
      [
        '754e3239f325570cdbbf4a87deee8a66b7f2b33479d468fbc1a50743bf56cc18',
        '673fb86e5bda30fb3cd0ed304ea49a023ee33d0197a695d0c5d98093c536683'
      ],
      [
        'e3e6bd1071a1e96aff57859c82d570f0330800661d1c952f9fe2694691d9b9e8',
        '59c9e0bba394e76f40c0aa58379a3cb6a5a2283993e90c4167002af4920e37f5'
      ],
      [
        '186b483d056a033826ae73d88f732985c4ccb1f32ba35f4b4cc47fdcf04aa6eb',
        '3b952d32c67cf77e2e17446e204180ab21fb8090895138b4a4a797f86e80888b'
      ],
      [
        'df9d70a6b9876ce544c98561f4be4f725442e6d2b737d9c91a8321724ce0963f',
        '55eb2dafd84d6ccd5f862b785dc39d4ab157222720ef9da217b8c45cf2ba2417'
      ],
      [
        '5edd5cc23c51e87a497ca815d5dce0f8ab52554f849ed8995de64c5f34ce7143',
        'efae9c8dbc14130661e8cec030c89ad0c13c66c0d17a2905cdc706ab7399a868'
      ],
      [
        '290798c2b6476830da12fe02287e9e777aa3fba1c355b17a722d362f84614fba',
        'e38da76dcd440621988d00bcf79af25d5b29c094db2a23146d003afd41943e7a'
      ],
      [
        'af3c423a95d9f5b3054754efa150ac39cd29552fe360257362dfdecef4053b45',
        'f98a3fd831eb2b749a93b0e6f35cfb40c8cd5aa667a15581bc2feded498fd9c6'
      ],
      [
        '766dbb24d134e745cccaa28c99bf274906bb66b26dcf98df8d2fed50d884249a',
        '744b1152eacbe5e38dcc887980da38b897584a65fa06cedd2c924f97cbac5996'
      ],
      [
        '59dbf46f8c94759ba21277c33784f41645f7b44f6c596a58ce92e666191abe3e',
        'c534ad44175fbc300f4ea6ce648309a042ce739a7919798cd85e216c4a307f6e'
      ],
      [
        'f13ada95103c4537305e691e74e9a4a8dd647e711a95e73cb62dc6018cfd87b8',
        'e13817b44ee14de663bf4bc808341f326949e21a6a75c2570778419bdaf5733d'
      ],
      [
        '7754b4fa0e8aced06d4167a2c59cca4cda1869c06ebadfb6488550015a88522c',
        '30e93e864e669d82224b967c3020b8fa8d1e4e350b6cbcc537a48b57841163a2'
      ],
      [
        '948dcadf5990e048aa3874d46abef9d701858f95de8041d2a6828c99e2262519',
        'e491a42537f6e597d5d28a3224b1bc25df9154efbd2ef1d2cbba2cae5347d57e'
      ],
      [
        '7962414450c76c1689c7b48f8202ec37fb224cf5ac0bfa1570328a8a3d7c77ab',
        '100b610ec4ffb4760d5c1fc133ef6f6b12507a051f04ac5760afa5b29db83437'
      ],
      [
        '3514087834964b54b15b160644d915485a16977225b8847bb0dd085137ec47ca',
        'ef0afbb2056205448e1652c48e8127fc6039e77c15c2378b7e7d15a0de293311'
      ],
      [
        'd3cc30ad6b483e4bc79ce2c9dd8bc54993e947eb8df787b442943d3f7b527eaf',
        '8b378a22d827278d89c5e9be8f9508ae3c2ad46290358630afb34db04eede0a4'
      ],
      [
        '1624d84780732860ce1c78fcbfefe08b2b29823db913f6493975ba0ff4847610',
        '68651cf9b6da903e0914448c6cd9d4ca896878f5282be4c8cc06e2a404078575'
      ],
      [
        '733ce80da955a8a26902c95633e62a985192474b5af207da6df7b4fd5fc61cd4',
        'f5435a2bd2badf7d485a4d8b8db9fcce3e1ef8e0201e4578c54673bc1dc5ea1d'
      ],
      [
        '15d9441254945064cf1a1c33bbd3b49f8966c5092171e699ef258dfab81c045c',
        'd56eb30b69463e7234f5137b73b84177434800bacebfc685fc37bbe9efe4070d'
      ],
      [
        'a1d0fcf2ec9de675b612136e5ce70d271c21417c9d2b8aaaac138599d0717940',
        'edd77f50bcb5a3cab2e90737309667f2641462a54070f3d519212d39c197a629'
      ],
      [
        'e22fbe15c0af8ccc5780c0735f84dbe9a790badee8245c06c7ca37331cb36980',
        'a855babad5cd60c88b430a69f53a1a7a38289154964799be43d06d77d31da06'
      ],
      [
        '311091dd9860e8e20ee13473c1155f5f69635e394704eaa74009452246cfa9b3',
        '66db656f87d1f04fffd1f04788c06830871ec5a64feee685bd80f0b1286d8374'
      ],
      [
        '34c1fd04d301be89b31c0442d3e6ac24883928b45a9340781867d4232ec2dbdf',
        '9414685e97b1b5954bd46f730174136d57f1ceeb487443dc5321857ba73abee'
      ],
      [
        'f219ea5d6b54701c1c14de5b557eb42a8d13f3abbcd08affcc2a5e6b049b8d63',
        '4cb95957e83d40b0f73af4544cccf6b1f4b08d3c07b27fb8d8c2962a400766d1'
      ],
      [
        'd7b8740f74a8fbaab1f683db8f45de26543a5490bca627087236912469a0b448',
        'fa77968128d9c92ee1010f337ad4717eff15db5ed3c049b3411e0315eaa4593b'
      ],
      [
        '32d31c222f8f6f0ef86f7c98d3a3335ead5bcd32abdd94289fe4d3091aa824bf',
        '5f3032f5892156e39ccd3d7915b9e1da2e6dac9e6f26e961118d14b8462e1661'
      ],
      [
        '7461f371914ab32671045a155d9831ea8793d77cd59592c4340f86cbc18347b5',
        '8ec0ba238b96bec0cbdddcae0aa442542eee1ff50c986ea6b39847b3cc092ff6'
      ],
      [
        'ee079adb1df1860074356a25aa38206a6d716b2c3e67453d287698bad7b2b2d6',
        '8dc2412aafe3be5c4c5f37e0ecc5f9f6a446989af04c4e25ebaac479ec1c8c1e'
      ],
      [
        '16ec93e447ec83f0467b18302ee620f7e65de331874c9dc72bfd8616ba9da6b5',
        '5e4631150e62fb40d0e8c2a7ca5804a39d58186a50e497139626778e25b0674d'
      ],
      [
        'eaa5f980c245f6f038978290afa70b6bd8855897f98b6aa485b96065d537bd99',
        'f65f5d3e292c2e0819a528391c994624d784869d7e6ea67fb18041024edc07dc'
      ],
      [
        '78c9407544ac132692ee1910a02439958ae04877151342ea96c4b6b35a49f51',
        'f3e0319169eb9b85d5404795539a5e68fa1fbd583c064d2462b675f194a3ddb4'
      ],
      [
        '494f4be219a1a77016dcd838431aea0001cdc8ae7a6fc688726578d9702857a5',
        '42242a969283a5f339ba7f075e36ba2af925ce30d767ed6e55f4b031880d562c'
      ],
      [
        'a598a8030da6d86c6bc7f2f5144ea549d28211ea58faa70ebf4c1e665c1fe9b5',
        '204b5d6f84822c307e4b4a7140737aec23fc63b65b35f86a10026dbd2d864e6b'
      ],
      [
        'c41916365abb2b5d09192f5f2dbeafec208f020f12570a184dbadc3e58595997',
        '4f14351d0087efa49d245b328984989d5caf9450f34bfc0ed16e96b58fa9913'
      ],
      [
        '841d6063a586fa475a724604da03bc5b92a2e0d2e0a36acfe4c73a5514742881',
        '73867f59c0659e81904f9a1c7543698e62562d6744c169ce7a36de01a8d6154'
      ],
      [
        '5e95bb399a6971d376026947f89bde2f282b33810928be4ded112ac4d70e20d5',
        '39f23f366809085beebfc71181313775a99c9aed7d8ba38b161384c746012865'
      ],
      [
        '36e4641a53948fd476c39f8a99fd974e5ec07564b5315d8bf99471bca0ef2f66',
        'd2424b1b1abe4eb8164227b085c9aa9456ea13493fd563e06fd51cf5694c78fc'
      ],
      [
        '336581ea7bfbbb290c191a2f507a41cf5643842170e914faeab27c2c579f726',
        'ead12168595fe1be99252129b6e56b3391f7ab1410cd1e0ef3dcdcabd2fda224'
      ],
      [
        '8ab89816dadfd6b6a1f2634fcf00ec8403781025ed6890c4849742706bd43ede',
        '6fdcef09f2f6d0a044e654aef624136f503d459c3e89845858a47a9129cdd24e'
      ],
      [
        '1e33f1a746c9c5778133344d9299fcaa20b0938e8acff2544bb40284b8c5fb94',
        '60660257dd11b3aa9c8ed618d24edff2306d320f1d03010e33a7d2057f3b3b6'
      ],
      [
        '85b7c1dcb3cec1b7ee7f30ded79dd20a0ed1f4cc18cbcfcfa410361fd8f08f31',
        '3d98a9cdd026dd43f39048f25a8847f4fcafad1895d7a633c6fed3c35e999511'
      ],
      [
        '29df9fbd8d9e46509275f4b125d6d45d7fbe9a3b878a7af872a2800661ac5f51',
        'b4c4fe99c775a606e2d8862179139ffda61dc861c019e55cd2876eb2a27d84b'
      ],
      [
        'a0b1cae06b0a847a3fea6e671aaf8adfdfe58ca2f768105c8082b2e449fce252',
        'ae434102edde0958ec4b19d917a6a28e6b72da1834aff0e650f049503a296cf2'
      ],
      [
        '4e8ceafb9b3e9a136dc7ff67e840295b499dfb3b2133e4ba113f2e4c0e121e5',
        'cf2174118c8b6d7a4b48f6d534ce5c79422c086a63460502b827ce62a326683c'
      ],
      [
        'd24a44e047e19b6f5afb81c7ca2f69080a5076689a010919f42725c2b789a33b',
        '6fb8d5591b466f8fc63db50f1c0f1c69013f996887b8244d2cdec417afea8fa3'
      ],
      [
        'ea01606a7a6c9cdd249fdfcfacb99584001edd28abbab77b5104e98e8e3b35d4',
        '322af4908c7312b0cfbfe369f7a7b3cdb7d4494bc2823700cfd652188a3ea98d'
      ],
      [
        'af8addbf2b661c8a6c6328655eb96651252007d8c5ea31be4ad196de8ce2131f',
        '6749e67c029b85f52a034eafd096836b2520818680e26ac8f3dfbcdb71749700'
      ],
      [
        'e3ae1974566ca06cc516d47e0fb165a674a3dabcfca15e722f0e3450f45889',
        '2aeabe7e4531510116217f07bf4d07300de97e4874f81f533420a72eeb0bd6a4'
      ],
      [
        '591ee355313d99721cf6993ffed1e3e301993ff3ed258802075ea8ced397e246',
        'b0ea558a113c30bea60fc4775460c7901ff0b053d25ca2bdeee98f1a4be5d196'
      ],
      [
        '11396d55fda54c49f19aa97318d8da61fa8584e47b084945077cf03255b52984',
        '998c74a8cd45ac01289d5833a7beb4744ff536b01b257be4c5767bea93ea57a4'
      ],
      [
        '3c5d2a1ba39c5a1790000738c9e0c40b8dcdfd5468754b6405540157e017aa7a',
        'b2284279995a34e2f9d4de7396fc18b80f9b8b9fdd270f6661f79ca4c81bd257'
      ],
      [
        'cc8704b8a60a0defa3a99a7299f2e9c3fbc395afb04ac078425ef8a1793cc030',
        'bdd46039feed17881d1e0862db347f8cf395b74fc4bcdc4e940b74e3ac1f1b13'
      ],
      [
        'c533e4f7ea8555aacd9777ac5cad29b97dd4defccc53ee7ea204119b2889b197',
        '6f0a256bc5efdf429a2fb6242f1a43a2d9b925bb4a4b3a26bb8e0f45eb596096'
      ],
      [
        'c14f8f2ccb27d6f109f6d08d03cc96a69ba8c34eec07bbcf566d48e33da6593',
        'c359d6923bb398f7fd4473e16fe1c28475b740dd098075e6c0e8649113dc3a38'
      ],
      [
        'a6cbc3046bc6a450bac24789fa17115a4c9739ed75f8f21ce441f72e0b90e6ef',
        '21ae7f4680e889bb130619e2c0f95a360ceb573c70603139862afd617fa9b9f'
      ],
      [
        '347d6d9a02c48927ebfb86c1359b1caf130a3c0267d11ce6344b39f99d43cc38',
        '60ea7f61a353524d1c987f6ecec92f086d565ab687870cb12689ff1e31c74448'
      ],
      [
        'da6545d2181db8d983f7dcb375ef5866d47c67b1bf31c8cf855ef7437b72656a',
        '49b96715ab6878a79e78f07ce5680c5d6673051b4935bd897fea824b77dc208a'
      ],
      [
        'c40747cc9d012cb1a13b8148309c6de7ec25d6945d657146b9d5994b8feb1111',
        '5ca560753be2a12fc6de6caf2cb489565db936156b9514e1bb5e83037e0fa2d4'
      ],
      [
        '4e42c8ec82c99798ccf3a610be870e78338c7f713348bd34c8203ef4037f3502',
        '7571d74ee5e0fb92a7a8b33a07783341a5492144cc54bcc40a94473693606437'
      ],
      [
        '3775ab7089bc6af823aba2e1af70b236d251cadb0c86743287522a1b3b0dedea',
        'be52d107bcfa09d8bcb9736a828cfa7fac8db17bf7a76a2c42ad961409018cf7'
      ],
      [
        'cee31cbf7e34ec379d94fb814d3d775ad954595d1314ba8846959e3e82f74e26',
        '8fd64a14c06b589c26b947ae2bcf6bfa0149ef0be14ed4d80f448a01c43b1c6d'
      ],
      [
        'b4f9eaea09b6917619f6ea6a4eb5464efddb58fd45b1ebefcdc1a01d08b47986',
        '39e5c9925b5a54b07433a4f18c61726f8bb131c012ca542eb24a8ac07200682a'
      ],
      [
        'd4263dfc3d2df923a0179a48966d30ce84e2515afc3dccc1b77907792ebcc60e',
        '62dfaf07a0f78feb30e30d6295853ce189e127760ad6cf7fae164e122a208d54'
      ],
      [
        '48457524820fa65a4f8d35eb6930857c0032acc0a4a2de422233eeda897612c4',
        '25a748ab367979d98733c38a1fa1c2e7dc6cc07db2d60a9ae7a76aaa49bd0f77'
      ],
      [
        'dfeeef1881101f2cb11644f3a2afdfc2045e19919152923f367a1767c11cceda',
        'ecfb7056cf1de042f9420bab396793c0c390bde74b4bbdff16a83ae09a9a7517'
      ],
      [
        '6d7ef6b17543f8373c573f44e1f389835d89bcbc6062ced36c82df83b8fae859',
        'cd450ec335438986dfefa10c57fea9bcc521a0959b2d80bbf74b190dca712d10'
      ],
      [
        'e75605d59102a5a2684500d3b991f2e3f3c88b93225547035af25af66e04541f',
        'f5c54754a8f71ee540b9b48728473e314f729ac5308b06938360990e2bfad125'
      ],
      [
        'eb98660f4c4dfaa06a2be453d5020bc99a0c2e60abe388457dd43fefb1ed620c',
        '6cb9a8876d9cb8520609af3add26cd20a0a7cd8a9411131ce85f44100099223e'
      ],
      [
        '13e87b027d8514d35939f2e6892b19922154596941888336dc3563e3b8dba942',
        'fef5a3c68059a6dec5d624114bf1e91aac2b9da568d6abeb2570d55646b8adf1'
      ],
      [
        'ee163026e9fd6fe017c38f06a5be6fc125424b371ce2708e7bf4491691e5764a',
        '1acb250f255dd61c43d94ccc670d0f58f49ae3fa15b96623e5430da0ad6c62b2'
      ],
      [
        'b268f5ef9ad51e4d78de3a750c2dc89b1e626d43505867999932e5db33af3d80',
        '5f310d4b3c99b9ebb19f77d41c1dee018cf0d34fd4191614003e945a1216e423'
      ],
      [
        'ff07f3118a9df035e9fad85eb6c7bfe42b02f01ca99ceea3bf7ffdba93c4750d',
        '438136d603e858a3a5c440c38eccbaddc1d2942114e2eddd4740d098ced1f0d8'
      ],
      [
        '8d8b9855c7c052a34146fd20ffb658bea4b9f69e0d825ebec16e8c3ce2b526a1',
        'cdb559eedc2d79f926baf44fb84ea4d44bcf50fee51d7ceb30e2e7f463036758'
      ],
      [
        '52db0b5384dfbf05bfa9d472d7ae26dfe4b851ceca91b1eba54263180da32b63',
        'c3b997d050ee5d423ebaf66a6db9f57b3180c902875679de924b69d84a7b375'
      ],
      [
        'e62f9490d3d51da6395efd24e80919cc7d0f29c3f3fa48c6fff543becbd43352',
        '6d89ad7ba4876b0b22c2ca280c682862f342c8591f1daf5170e07bfd9ccafa7d'
      ],
      [
        '7f30ea2476b399b4957509c88f77d0191afa2ff5cb7b14fd6d8e7d65aaab1193',
        'ca5ef7d4b231c94c3b15389a5f6311e9daff7bb67b103e9880ef4bff637acaec'
      ],
      [
        '5098ff1e1d9f14fb46a210fada6c903fef0fb7b4a1dd1d9ac60a0361800b7a00',
        '9731141d81fc8f8084d37c6e7542006b3ee1b40d60dfe5362a5b132fd17ddc0'
      ],
      [
        '32b78c7de9ee512a72895be6b9cbefa6e2f3c4ccce445c96b9f2c81e2778ad58',
        'ee1849f513df71e32efc3896ee28260c73bb80547ae2275ba497237794c8753c'
      ],
      [
        'e2cb74fddc8e9fbcd076eef2a7c72b0ce37d50f08269dfc074b581550547a4f7',
        'd3aa2ed71c9dd2247a62df062736eb0baddea9e36122d2be8641abcb005cc4a4'
      ],
      [
        '8438447566d4d7bedadc299496ab357426009a35f235cb141be0d99cd10ae3a8',
        'c4e1020916980a4da5d01ac5e6ad330734ef0d7906631c4f2390426b2edd791f'
      ],
      [
        '4162d488b89402039b584c6fc6c308870587d9c46f660b878ab65c82c711d67e',
        '67163e903236289f776f22c25fb8a3afc1732f2b84b4e95dbda47ae5a0852649'
      ],
      [
        '3fad3fa84caf0f34f0f89bfd2dcf54fc175d767aec3e50684f3ba4a4bf5f683d',
        'cd1bc7cb6cc407bb2f0ca647c718a730cf71872e7d0d2a53fa20efcdfe61826'
      ],
      [
        '674f2600a3007a00568c1a7ce05d0816c1fb84bf1370798f1c69532faeb1a86b',
        '299d21f9413f33b3edf43b257004580b70db57da0b182259e09eecc69e0d38a5'
      ],
      [
        'd32f4da54ade74abb81b815ad1fb3b263d82d6c692714bcff87d29bd5ee9f08f',
        'f9429e738b8e53b968e99016c059707782e14f4535359d582fc416910b3eea87'
      ],
      [
        '30e4e670435385556e593657135845d36fbb6931f72b08cb1ed954f1e3ce3ff6',
        '462f9bce619898638499350113bbc9b10a878d35da70740dc695a559eb88db7b'
      ],
      [
        'be2062003c51cc3004682904330e4dee7f3dcd10b01e580bf1971b04d4cad297',
        '62188bc49d61e5428573d48a74e1c655b1c61090905682a0d5558ed72dccb9bc'
      ],
      [
        '93144423ace3451ed29e0fb9ac2af211cb6e84a601df5993c419859fff5df04a',
        '7c10dfb164c3425f5c71a3f9d7992038f1065224f72bb9d1d902a6d13037b47c'
      ],
      [
        'b015f8044f5fcbdcf21ca26d6c34fb8197829205c7b7d2a7cb66418c157b112c',
        'ab8c1e086d04e813744a655b2df8d5f83b3cdc6faa3088c1d3aea1454e3a1d5f'
      ],
      [
        'd5e9e1da649d97d89e4868117a465a3a4f8a18de57a140d36b3f2af341a21b52',
        '4cb04437f391ed73111a13cc1d4dd0db1693465c2240480d8955e8592f27447a'
      ],
      [
        'd3ae41047dd7ca065dbf8ed77b992439983005cd72e16d6f996a5316d36966bb',
        'bd1aeb21ad22ebb22a10f0303417c6d964f8cdd7df0aca614b10dc14d125ac46'
      ],
      [
        '463e2763d885f958fc66cdd22800f0a487197d0a82e377b49f80af87c897b065',
        'bfefacdb0e5d0fd7df3a311a94de062b26b80c61fbc97508b79992671ef7ca7f'
      ],
      [
        '7985fdfd127c0567c6f53ec1bb63ec3158e597c40bfe747c83cddfc910641917',
        '603c12daf3d9862ef2b25fe1de289aed24ed291e0ec6708703a5bd567f32ed03'
      ],
      [
        '74a1ad6b5f76e39db2dd249410eac7f99e74c59cb83d2d0ed5ff1543da7703e9',
        'cc6157ef18c9c63cd6193d83631bbea0093e0968942e8c33d5737fd790e0db08'
      ],
      [
        '30682a50703375f602d416664ba19b7fc9bab42c72747463a71d0896b22f6da3',
        '553e04f6b018b4fa6c8f39e7f311d3176290d0e0f19ca73f17714d9977a22ff8'
      ],
      [
        '9e2158f0d7c0d5f26c3791efefa79597654e7a2b2464f52b1ee6c1347769ef57',
        '712fcdd1b9053f09003a3481fa7762e9ffd7c8ef35a38509e2fbf2629008373'
      ],
      [
        '176e26989a43c9cfeba4029c202538c28172e566e3c4fce7322857f3be327d66',
        'ed8cc9d04b29eb877d270b4878dc43c19aefd31f4eee09ee7b47834c1fa4b1c3'
      ],
      [
        '75d46efea3771e6e68abb89a13ad747ecf1892393dfc4f1b7004788c50374da8',
        '9852390a99507679fd0b86fd2b39a868d7efc22151346e1a3ca4726586a6bed8'
      ],
      [
        '809a20c67d64900ffb698c4c825f6d5f2310fb0451c869345b7319f645605721',
        '9e994980d9917e22b76b061927fa04143d096ccc54963e6a5ebfa5f3f8e286c1'
      ],
      [
        '1b38903a43f7f114ed4500b4eac7083fdefece1cf29c63528d563446f972c180',
        '4036edc931a60ae889353f77fd53de4a2708b26b6f5da72ad3394119daf408f9'
      ]
    ]
  }
};

},{}],"../node_modules/bitcoin-elliptic/lib/elliptic/curves.js":[function(require,module,exports) {
'use strict';

var curves = exports;

var hash = require('hash.js');
var curve = require('./curve');
var utils = require('./utils');

var assert = utils.assert;

function PresetCurve(options) {
  if (options.type !== 'short')
    throw new Error('invalid curve type')
  this.curve = new curve.short(options);
  this.g = this.curve.g;
  this.n = this.curve.n;
  this.hash = options.hash;

  assert(this.g.validate(), 'Invalid curve');
  assert(this.g.mul(this.n).isInfinity(), 'Invalid curve, G*N != O');
}
curves.PresetCurve = PresetCurve;

function defineCurve(name, options) {
  Object.defineProperty(curves, name, {
    configurable: true,
    enumerable: true,
    get: function() {
      var curve = new PresetCurve(options);
      Object.defineProperty(curves, name, {
        configurable: true,
        enumerable: true,
        value: curve
      });
      return curve;
    }
  });
}

var pre;
try {
  pre = require('./precomputed/secp256k1');
} catch (e) {
  pre = undefined;
}

defineCurve('secp256k1', {
  type: 'short',
  prime: 'k256',
  p: 'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe fffffc2f',
  a: '0',
  b: '7',
  n: 'ffffffff ffffffff ffffffff fffffffe baaedce6 af48a03b bfd25e8c d0364141',
  h: '1',
  hash: hash.sha256,

  // Precomputed endomorphism
  beta: '7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee',
  lambda: '5363ad4cc05c30e0a5261c028812645a122e22ea20816678df02967c1b23bd72',
  basis: [
    {
      a: '3086d221a7d46bcde86c90e49284eb15',
      b: '-e4437ed6010e88286f547fa90abfe4c3'
    },
    {
      a: '114ca50f7a8e2f3f657c1108d9d44cfd8',
      b: '3086d221a7d46bcde86c90e49284eb15'
    }
  ],

  gRed: false,
  g: [
    '79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
    '483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8',
    pre
  ]
});

},{"hash.js":"../node_modules/hash.js/lib/hash.js","./curve":"../node_modules/bitcoin-elliptic/lib/elliptic/curve/index.js","./utils":"../node_modules/bitcoin-elliptic/lib/elliptic/utils.js","./precomputed/secp256k1":"../node_modules/bitcoin-elliptic/lib/elliptic/precomputed/secp256k1.js"}],"../node_modules/hmac-drbg/lib/hmac-drbg.js":[function(require,module,exports) {
'use strict';

var hash = require('hash.js');
var utils = require('minimalistic-crypto-utils');
var assert = require('minimalistic-assert');

function HmacDRBG(options) {
  if (!(this instanceof HmacDRBG))
    return new HmacDRBG(options);
  this.hash = options.hash;
  this.predResist = !!options.predResist;

  this.outLen = this.hash.outSize;
  this.minEntropy = options.minEntropy || this.hash.hmacStrength;

  this._reseed = null;
  this.reseedInterval = null;
  this.K = null;
  this.V = null;

  var entropy = utils.toArray(options.entropy, options.entropyEnc || 'hex');
  var nonce = utils.toArray(options.nonce, options.nonceEnc || 'hex');
  var pers = utils.toArray(options.pers, options.persEnc || 'hex');
  assert(entropy.length >= (this.minEntropy / 8),
         'Not enough entropy. Minimum is: ' + this.minEntropy + ' bits');
  this._init(entropy, nonce, pers);
}
module.exports = HmacDRBG;

HmacDRBG.prototype._init = function init(entropy, nonce, pers) {
  var seed = entropy.concat(nonce).concat(pers);

  this.K = new Array(this.outLen / 8);
  this.V = new Array(this.outLen / 8);
  for (var i = 0; i < this.V.length; i++) {
    this.K[i] = 0x00;
    this.V[i] = 0x01;
  }

  this._update(seed);
  this._reseed = 1;
  this.reseedInterval = 0x1000000000000;  // 2^48
};

HmacDRBG.prototype._hmac = function hmac() {
  return new hash.hmac(this.hash, this.K);
};

HmacDRBG.prototype._update = function update(seed) {
  var kmac = this._hmac()
                 .update(this.V)
                 .update([ 0x00 ]);
  if (seed)
    kmac = kmac.update(seed);
  this.K = kmac.digest();
  this.V = this._hmac().update(this.V).digest();
  if (!seed)
    return;

  this.K = this._hmac()
               .update(this.V)
               .update([ 0x01 ])
               .update(seed)
               .digest();
  this.V = this._hmac().update(this.V).digest();
};

HmacDRBG.prototype.reseed = function reseed(entropy, entropyEnc, add, addEnc) {
  // Optional entropy enc
  if (typeof entropyEnc !== 'string') {
    addEnc = add;
    add = entropyEnc;
    entropyEnc = null;
  }

  entropy = utils.toArray(entropy, entropyEnc);
  add = utils.toArray(add, addEnc);

  assert(entropy.length >= (this.minEntropy / 8),
         'Not enough entropy. Minimum is: ' + this.minEntropy + ' bits');

  this._update(entropy.concat(add || []));
  this._reseed = 1;
};

HmacDRBG.prototype.generate = function generate(len, enc, add, addEnc) {
  if (this._reseed > this.reseedInterval)
    throw new Error('Reseed is required');

  // Optional encoding
  if (typeof enc !== 'string') {
    addEnc = add;
    add = enc;
    enc = null;
  }

  // Optional additional data
  if (add) {
    add = utils.toArray(add, addEnc || 'hex');
    this._update(add);
  }

  var temp = [];
  while (temp.length < len) {
    this.V = this._hmac().update(this.V).digest();
    temp = temp.concat(this.V);
  }

  var res = temp.slice(0, len);
  this._update(add);
  this._reseed++;
  return utils.encode(res, enc);
};

},{"hash.js":"../node_modules/hash.js/lib/hash.js","minimalistic-crypto-utils":"../node_modules/minimalistic-crypto-utils/lib/utils.js","minimalistic-assert":"../node_modules/minimalistic-assert/index.js"}],"../node_modules/bitcoin-elliptic/lib/elliptic/ec/key.js":[function(require,module,exports) {
'use strict';

var BN = require('bn.js');
var utils = require('../utils');
var assert = utils.assert;

function KeyPair(ec, options) {
  this.ec = ec;
  this.priv = null;
  this.pub = null;

  // KeyPair(ec, { priv: ..., pub: ... })
  if (options.priv)
    this._importPrivate(options.priv, options.privEnc);
  if (options.pub)
    this._importPublic(options.pub, options.pubEnc);
}
module.exports = KeyPair;

KeyPair.fromPublic = function fromPublic(ec, pub, enc) {
  if (pub instanceof KeyPair)
    return pub;

  return new KeyPair(ec, {
    pub: pub,
    pubEnc: enc
  });
};

KeyPair.fromPrivate = function fromPrivate(ec, priv, enc) {
  if (priv instanceof KeyPair)
    return priv;

  return new KeyPair(ec, {
    priv: priv,
    privEnc: enc
  });
};

KeyPair.prototype.validate = function validate() {
  var pub = this.getPublic();

  if (pub.isInfinity())
    return { result: false, reason: 'Invalid public key' };
  if (!pub.validate())
    return { result: false, reason: 'Public key is not a point' };
  if (!pub.mul(this.ec.curve.n).isInfinity())
    return { result: false, reason: 'Public key * N != O' };

  return { result: true, reason: null };
};

KeyPair.prototype.getPublic = function getPublic(compact, enc) {
  // compact is optional argument
  if (typeof compact === 'string') {
    enc = compact;
    compact = null;
  }

  if (!this.pub)
    this.pub = this.ec.g.mul(this.priv);

  if (!enc)
    return this.pub;

  return this.pub.encode(enc, compact);
};

KeyPair.prototype.getPrivate = function getPrivate(enc) {
  if (enc === 'hex')
    return this.priv.toString(16, 2);
  else
    return this.priv;
};

KeyPair.prototype._importPrivate = function _importPrivate(key, enc) {
  this.priv = new BN(key, enc || 16);

  // Ensure that the priv won't be bigger than n, otherwise we may fail
  // in fixed multiplication method
  this.priv = this.priv.umod(this.ec.curve.n);
};

KeyPair.prototype._importPublic = function _importPublic(key, enc) {
  if (key.x || key.y) {
    // Montgomery points only have an `x` coordinate.
    // Weierstrass/Edwards points on the other hand have both `x` and
    // `y` coordinates.
    if (this.ec.curve.type === 'mont') {
      assert(key.x, 'Need x coordinate');
    } else if (this.ec.curve.type === 'short' ||
               this.ec.curve.type === 'edwards') {
      assert(key.x && key.y, 'Need both x and y coordinate');
    }
    this.pub = this.ec.curve.point(key.x, key.y);
    return;
  }
  this.pub = this.ec.curve.decodePoint(key, enc);
};

// ECDH
KeyPair.prototype.derive = function derive(pub) {
  return pub.mul(this.priv).getX();
};

// ECDSA
KeyPair.prototype.sign = function sign(msg, enc, options) {
  return this.ec.sign(msg, this, enc, options);
};

KeyPair.prototype.verify = function verify(msg, signature) {
  return this.ec.verify(msg, signature, this);
};

KeyPair.prototype.inspect = function inspect() {
  return '<Key priv: ' + (this.priv && this.priv.toString(16, 2)) +
         ' pub: ' + (this.pub && this.pub.inspect()) + ' >';
};

},{"bn.js":"../node_modules/bitcoin-elliptic/node_modules/bn.js/lib/bn.js","../utils":"../node_modules/bitcoin-elliptic/lib/elliptic/utils.js"}],"../node_modules/bitcoin-elliptic/lib/elliptic/ec/signature.js":[function(require,module,exports) {
'use strict';

var BN = require('bn.js');

var utils = require('../utils');
var assert = utils.assert;

function Signature(options, enc) {
  if (options instanceof Signature)
    return options;

  if (this._importDER(options, enc))
    return;

  assert(options.r && options.s, 'Signature without r or s');
  this.r = new BN(options.r, 16);
  this.s = new BN(options.s, 16);
  if (options.recoveryParam === undefined)
    this.recoveryParam = null;
  else
    this.recoveryParam = options.recoveryParam;
}
module.exports = Signature;

function Position() {
  this.place = 0;
}

function getLength(buf, p) {
  var initial = buf[p.place++];
  if (!(initial & 0x80)) {
    return initial;
  }
  var octetLen = initial & 0xf;
  var val = 0;
  for (var i = 0, off = p.place; i < octetLen; i++, off++) {
    val <<= 8;
    val |= buf[off];
  }
  p.place = off;
  return val;
}

function rmPadding(buf) {
  var i = 0;
  var len = buf.length - 1;
  while (!buf[i] && !(buf[i + 1] & 0x80) && i < len) {
    i++;
  }
  if (i === 0) {
    return buf;
  }
  return buf.slice(i);
}

Signature.prototype._importDER = function _importDER(data, enc) {
  data = utils.toArray(data, enc);
  var p = new Position();
  if (data[p.place++] !== 0x30) {
    return false;
  }
  var len = getLength(data, p);
  if ((len + p.place) !== data.length) {
    return false;
  }
  if (data[p.place++] !== 0x02) {
    return false;
  }
  var rlen = getLength(data, p);
  var r = data.slice(p.place, rlen + p.place);
  p.place += rlen;
  if (data[p.place++] !== 0x02) {
    return false;
  }
  var slen = getLength(data, p);
  if (data.length !== slen + p.place) {
    return false;
  }
  var s = data.slice(p.place, slen + p.place);
  if (r[0] === 0 && (r[1] & 0x80)) {
    r = r.slice(1);
  }
  if (s[0] === 0 && (s[1] & 0x80)) {
    s = s.slice(1);
  }

  this.r = new BN(r);
  this.s = new BN(s);
  this.recoveryParam = null;

  return true;
};

function constructLength(arr, len) {
  if (len < 0x80) {
    arr.push(len);
    return;
  }
  var octets = 1 + (Math.log(len) / Math.LN2 >>> 3);
  arr.push(octets | 0x80);
  while (--octets) {
    arr.push((len >>> (octets << 3)) & 0xff);
  }
  arr.push(len);
}

Signature.prototype.toDER = function toDER(enc) {
  var r = this.r.toArray();
  var s = this.s.toArray();

  // Pad values
  if (r[0] & 0x80)
    r = [ 0 ].concat(r);
  // Pad values
  if (s[0] & 0x80)
    s = [ 0 ].concat(s);

  r = rmPadding(r);
  s = rmPadding(s);

  while (!s[0] && !(s[1] & 0x80)) {
    s = s.slice(1);
  }
  var arr = [ 0x02 ];
  constructLength(arr, r.length);
  arr = arr.concat(r);
  arr.push(0x02);
  constructLength(arr, s.length);
  var backHalf = arr.concat(s);
  var res = [ 0x30 ];
  constructLength(res, backHalf.length);
  res = res.concat(backHalf);
  return utils.encode(res, enc);
};

},{"bn.js":"../node_modules/bitcoin-elliptic/node_modules/bn.js/lib/bn.js","../utils":"../node_modules/bitcoin-elliptic/lib/elliptic/utils.js"}],"../node_modules/bitcoin-elliptic/lib/elliptic/ec/index.js":[function(require,module,exports) {
'use strict';

var BN = require('bn.js');
var HmacDRBG = require('hmac-drbg');
var utils = require('../utils');
var curves = require('../curves');
var rand = require('brorand');
var assert = utils.assert;

var KeyPair = require('./key');
var Signature = require('./signature');

function EC(options) {
  if (!(this instanceof EC))
    return new EC(options);

  // Shortcut `elliptic.ec(curve-name)`
  if (typeof options === 'string') {
    assert(curves.hasOwnProperty(options), 'Unknown curve ' + options);

    options = curves[options];
  }

  // Shortcut for `elliptic.ec(elliptic.curves.curveName)`
  if (options instanceof curves.PresetCurve)
    options = { curve: options };

  this.curve = options.curve.curve;
  this.n = this.curve.n;
  this.nh = this.n.ushrn(1);
  this.g = this.curve.g;

  // Point on curve
  this.g = options.curve.g;
  this.g.precompute(options.curve.n.bitLength() + 1);

  // Hash for function for DRBG
  this.hash = options.hash || options.curve.hash;
}
module.exports = EC;

EC.prototype.keyPair = function keyPair(options) {
  return new KeyPair(this, options);
};

EC.prototype.keyFromPrivate = function keyFromPrivate(priv, enc) {
  return KeyPair.fromPrivate(this, priv, enc);
};

EC.prototype.keyFromPublic = function keyFromPublic(pub, enc) {
  return KeyPair.fromPublic(this, pub, enc);
};

EC.prototype.genKeyPair = function genKeyPair(options) {
  if (!options)
    options = {};

  // Instantiate Hmac_DRBG
  var drbg = new HmacDRBG({
    hash: this.hash,
    pers: options.pers,
    persEnc: options.persEnc || 'utf8',
    entropy: options.entropy || rand(this.hash.hmacStrength),
    entropyEnc: options.entropy && options.entropyEnc || 'utf8',
    nonce: this.n.toArray()
  });

  var bytes = this.n.byteLength();
  var ns2 = this.n.sub(new BN(2));
  do {
    var priv = new BN(drbg.generate(bytes));
    if (priv.cmp(ns2) > 0)
      continue;

    priv.iaddn(1);
    return this.keyFromPrivate(priv);
  } while (true);
};

EC.prototype._truncateToN = function truncateToN(msg, truncOnly) {
  var delta = msg.byteLength() * 8 - this.n.bitLength();
  if (delta > 0)
    msg = msg.ushrn(delta);
  if (!truncOnly && msg.cmp(this.n) >= 0)
    return msg.sub(this.n);
  else
    return msg;
};

EC.prototype.sign = function sign(msg, key, enc, options) {
  if (typeof enc === 'object') {
    options = enc;
    enc = null;
  }
  if (!options)
    options = {};

  key = this.keyFromPrivate(key, enc);
  msg = this._truncateToN(new BN(msg, 16));

  // Zero-extend key to provide enough entropy
  var bytes = this.n.byteLength();
  var bkey = key.getPrivate().toArray('be', bytes);

  // Zero-extend nonce to have the same byte size as N
  var nonce = msg.toArray('be', bytes);

  // Instantiate Hmac_DRBG
  var drbg = new HmacDRBG({
    hash: this.hash,
    entropy: bkey,
    nonce: nonce,
    pers: options.pers,
    persEnc: options.persEnc || 'utf8'
  });

  // Number of bytes to generate
  var ns1 = this.n.sub(new BN(1));

  for (var iter = 0; true; iter++) {
    var k = options.k ?
        options.k(iter) :
        new BN(drbg.generate(this.n.byteLength()));
    k = this._truncateToN(k, true);
    if (k.cmpn(1) <= 0 || k.cmp(ns1) >= 0)
      continue;

    var kp = this.g.mul(k);
    if (kp.isInfinity())
      continue;

    var kpX = kp.getX();
    var r = kpX.umod(this.n);
    if (r.cmpn(0) === 0)
      continue;

    var s = k.invm(this.n).mul(r.mul(key.getPrivate()).iadd(msg));
    s = s.umod(this.n);
    if (s.cmpn(0) === 0)
      continue;

    var recoveryParam = (kp.getY().isOdd() ? 1 : 0) |
                        (kpX.cmp(r) !== 0 ? 2 : 0);

    // Use complement of `s`, if it is > `n / 2`
    if (options.canonical && s.cmp(this.nh) > 0) {
      s = this.n.sub(s);
      recoveryParam ^= 1;
    }

    return new Signature({ r: r, s: s, recoveryParam: recoveryParam });
  }
};

EC.prototype.verify = function verify(msg, signature, key, enc) {
  msg = this._truncateToN(new BN(msg, 16));
  key = this.keyFromPublic(key, enc);
  signature = new Signature(signature, 'hex');

  // Perform primitive values validation
  var r = signature.r;
  var s = signature.s;
  if (r.cmpn(1) < 0 || r.cmp(this.n) >= 0)
    return false;
  if (s.cmpn(1) < 0 || s.cmp(this.n) >= 0)
    return false;

  // Validate signature
  var sinv = s.invm(this.n);
  var u1 = sinv.mul(msg).umod(this.n);
  var u2 = sinv.mul(r).umod(this.n);

  if (!this.curve._maxwellTrick) {
    var p = this.g.mulAdd(u1, key.getPublic(), u2);
    if (p.isInfinity())
      return false;

    return p.getX().umod(this.n).cmp(r) === 0;
  }

  // NOTE: Greg Maxwell's trick, inspired by:
  // https://git.io/vad3K

  var p = this.g.jmulAdd(u1, key.getPublic(), u2);
  if (p.isInfinity())
    return false;

  // Compare `p.x` of Jacobian point with `r`,
  // this will do `p.x == r * p.z^2` instead of multiplying `p.x` by the
  // inverse of `p.z^2`
  return p.eqXToP(r);
};

EC.prototype.recoverPubKey = function(msg, signature, j, enc) {
  assert((3 & j) === j, 'The recovery param is more than two bits');
  signature = new Signature(signature, enc);

  var n = this.n;
  var e = new BN(msg);
  var r = signature.r;
  var s = signature.s;

  // A set LSB signifies that the y-coordinate is odd
  var isYOdd = j & 1;
  var isSecondKey = j >> 1;
  if (r.cmp(this.curve.p.umod(this.curve.n)) >= 0 && isSecondKey)
    throw new Error('Unable to find sencond key candinate');

  // 1.1. Let x = r + jn.
  if (isSecondKey)
    r = this.curve.pointFromX(r.add(this.curve.n), isYOdd);
  else
    r = this.curve.pointFromX(r, isYOdd);

  var rInv = signature.r.invm(n);
  var s1 = n.sub(e).mul(rInv).umod(n);
  var s2 = s.mul(rInv).umod(n);

  // 1.6.1 Compute Q = r^-1 (sR -  eG)
  //               Q = r^-1 (sR + -eG)
  return this.g.mulAdd(s1, r, s2);
};

EC.prototype.getKeyRecoveryParam = function(e, signature, Q, enc) {
  signature = new Signature(signature, enc);
  if (signature.recoveryParam !== null)
    return signature.recoveryParam;

  for (var i = 0; i < 4; i++) {
    var Qprime;
    try {
      Qprime = this.recoverPubKey(e, signature, i);
    } catch (e) {
      continue;
    }

    if (Qprime.eq(Q))
      return i;
  }
  throw new Error('Unable to find valid recovery factor');
};

},{"bn.js":"../node_modules/bitcoin-elliptic/node_modules/bn.js/lib/bn.js","hmac-drbg":"../node_modules/hmac-drbg/lib/hmac-drbg.js","../utils":"../node_modules/bitcoin-elliptic/lib/elliptic/utils.js","../curves":"../node_modules/bitcoin-elliptic/lib/elliptic/curves.js","brorand":"../node_modules/brorand/index.js","./key":"../node_modules/bitcoin-elliptic/lib/elliptic/ec/key.js","./signature":"../node_modules/bitcoin-elliptic/lib/elliptic/ec/signature.js"}],"../node_modules/bitcoin-elliptic/lib/elliptic.js":[function(require,module,exports) {
'use strict';

var elliptic = exports;

elliptic.version = require('../package.json').version;
elliptic.utils = require('./elliptic/utils');
elliptic.rand = require('brorand');
elliptic.curve = require('./elliptic/curve');
elliptic.curves = require('./elliptic/curves');

// Protocols
elliptic.ec = require('./elliptic/ec');

},{"../package.json":"../node_modules/bitcoin-elliptic/package.json","./elliptic/utils":"../node_modules/bitcoin-elliptic/lib/elliptic/utils.js","brorand":"../node_modules/brorand/index.js","./elliptic/curve":"../node_modules/bitcoin-elliptic/lib/elliptic/curve/index.js","./elliptic/curves":"../node_modules/bitcoin-elliptic/lib/elliptic/curves.js","./elliptic/ec":"../node_modules/bitcoin-elliptic/lib/elliptic/ec/index.js"}],"../node_modules/events/events.js":[function(require,module,exports) {
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
'use strict';

var R = typeof Reflect === 'object' ? Reflect : null;
var ReflectApply = R && typeof R.apply === 'function' ? R.apply : function ReflectApply(target, receiver, args) {
  return Function.prototype.apply.call(target, receiver, args);
};
var ReflectOwnKeys;

if (R && typeof R.ownKeys === 'function') {
  ReflectOwnKeys = R.ownKeys;
} else if (Object.getOwnPropertySymbols) {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target).concat(Object.getOwnPropertySymbols(target));
  };
} else {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target);
  };
}

function ProcessEmitWarning(warning) {
  if (console && console.warn) console.warn(warning);
}

var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
  return value !== value;
};

function EventEmitter() {
  EventEmitter.init.call(this);
}

module.exports = EventEmitter;
module.exports.once = once; // Backwards-compat with node 0.10.x

EventEmitter.EventEmitter = EventEmitter;
EventEmitter.prototype._events = undefined;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = undefined; // By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.

var defaultMaxListeners = 10;

function checkListener(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }
}

Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
  enumerable: true,
  get: function () {
    return defaultMaxListeners;
  },
  set: function (arg) {
    if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
    }

    defaultMaxListeners = arg;
  }
});

EventEmitter.init = function () {
  if (this._events === undefined || this._events === Object.getPrototypeOf(this)._events) {
    this._events = Object.create(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
}; // Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.


EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
  }

  this._maxListeners = n;
  return this;
};

function _getMaxListeners(that) {
  if (that._maxListeners === undefined) return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return _getMaxListeners(this);
};

EventEmitter.prototype.emit = function emit(type) {
  var args = [];

  for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);

  var doError = type === 'error';
  var events = this._events;
  if (events !== undefined) doError = doError && events.error === undefined;else if (!doError) return false; // If there is no 'error' event listener then throw.

  if (doError) {
    var er;
    if (args.length > 0) er = args[0];

    if (er instanceof Error) {
      // Note: The comments on the `throw` lines are intentional, they show
      // up in Node's output if this results in an unhandled exception.
      throw er; // Unhandled 'error' event
    } // At least give some kind of context to the user


    var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
    err.context = er;
    throw err; // Unhandled 'error' event
  }

  var handler = events[type];
  if (handler === undefined) return false;

  if (typeof handler === 'function') {
    ReflectApply(handler, this, args);
  } else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);

    for (var i = 0; i < len; ++i) ReflectApply(listeners[i], this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;
  checkListener(listener);
  events = target._events;

  if (events === undefined) {
    events = target._events = Object.create(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener !== undefined) {
      target.emit('newListener', type, listener.listener ? listener.listener : listener); // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object

      events = target._events;
    }

    existing = events[type];
  }

  if (existing === undefined) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] = prepend ? [listener, existing] : [existing, listener]; // If we've already got an array, just append.
    } else if (prepend) {
      existing.unshift(listener);
    } else {
      existing.push(listener);
    } // Check for listener leak


    m = _getMaxListeners(target);

    if (m > 0 && existing.length > m && !existing.warned) {
      existing.warned = true; // No error code for this since it is a Warning
      // eslint-disable-next-line no-restricted-syntax

      var w = new Error('Possible EventEmitter memory leak detected. ' + existing.length + ' ' + String(type) + ' listeners ' + 'added. Use emitter.setMaxListeners() to ' + 'increase limit');
      w.name = 'MaxListenersExceededWarning';
      w.emitter = target;
      w.type = type;
      w.count = existing.length;
      ProcessEmitWarning(w);
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener = function prependListener(type, listener) {
  return _addListener(this, type, listener, true);
};

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    if (arguments.length === 0) return this.listener.call(this.target);
    return this.listener.apply(this.target, arguments);
  }
}

function _onceWrap(target, type, listener) {
  var state = {
    fired: false,
    wrapFn: undefined,
    target: target,
    type: type,
    listener: listener
  };
  var wrapped = onceWrapper.bind(state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  checkListener(listener);
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener = function prependOnceListener(type, listener) {
  checkListener(listener);
  this.prependListener(type, _onceWrap(this, type, listener));
  return this;
}; // Emits a 'removeListener' event if and only if the listener was removed.


EventEmitter.prototype.removeListener = function removeListener(type, listener) {
  var list, events, position, i, originalListener;
  checkListener(listener);
  events = this._events;
  if (events === undefined) return this;
  list = events[type];
  if (list === undefined) return this;

  if (list === listener || list.listener === listener) {
    if (--this._eventsCount === 0) this._events = Object.create(null);else {
      delete events[type];
      if (events.removeListener) this.emit('removeListener', type, list.listener || listener);
    }
  } else if (typeof list !== 'function') {
    position = -1;

    for (i = list.length - 1; i >= 0; i--) {
      if (list[i] === listener || list[i].listener === listener) {
        originalListener = list[i].listener;
        position = i;
        break;
      }
    }

    if (position < 0) return this;
    if (position === 0) list.shift();else {
      spliceOne(list, position);
    }
    if (list.length === 1) events[type] = list[0];
    if (events.removeListener !== undefined) this.emit('removeListener', type, originalListener || listener);
  }

  return this;
};

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners = function removeAllListeners(type) {
  var listeners, events, i;
  events = this._events;
  if (events === undefined) return this; // not listening for removeListener, no need to emit

  if (events.removeListener === undefined) {
    if (arguments.length === 0) {
      this._events = Object.create(null);
      this._eventsCount = 0;
    } else if (events[type] !== undefined) {
      if (--this._eventsCount === 0) this._events = Object.create(null);else delete events[type];
    }

    return this;
  } // emit removeListener for all listeners on all events


  if (arguments.length === 0) {
    var keys = Object.keys(events);
    var key;

    for (i = 0; i < keys.length; ++i) {
      key = keys[i];
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }

    this.removeAllListeners('removeListener');
    this._events = Object.create(null);
    this._eventsCount = 0;
    return this;
  }

  listeners = events[type];

  if (typeof listeners === 'function') {
    this.removeListener(type, listeners);
  } else if (listeners !== undefined) {
    // LIFO order
    for (i = listeners.length - 1; i >= 0; i--) {
      this.removeListener(type, listeners[i]);
    }
  }

  return this;
};

function _listeners(target, type, unwrap) {
  var events = target._events;
  if (events === undefined) return [];
  var evlistener = events[type];
  if (evlistener === undefined) return [];
  if (typeof evlistener === 'function') return unwrap ? [evlistener.listener || evlistener] : [evlistener];
  return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function (emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;

function listenerCount(type) {
  var events = this._events;

  if (events !== undefined) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener !== undefined) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
};

function arrayClone(arr, n) {
  var copy = new Array(n);

  for (var i = 0; i < n; ++i) copy[i] = arr[i];

  return copy;
}

function spliceOne(list, index) {
  for (; index + 1 < list.length; index++) list[index] = list[index + 1];

  list.pop();
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);

  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }

  return ret;
}

function once(emitter, name) {
  return new Promise(function (resolve, reject) {
    function eventListener() {
      if (errorListener !== undefined) {
        emitter.removeListener('error', errorListener);
      }

      resolve([].slice.call(arguments));
    }

    ;
    var errorListener; // Adding an error listener is not optional because
    // if an error is thrown on an event emitter we cannot
    // guarantee that the actual event we are waiting will
    // be fired. The result could be a silent way to create
    // memory or file descriptor leaks, which is something
    // we should avoid.

    if (name !== 'error') {
      errorListener = function errorListener(err) {
        emitter.removeListener(name, eventListener);
        reject(err);
      };

      emitter.once('error', errorListener);
    }

    emitter.once(name, eventListener);
  });
}
},{}],"../node_modules/process/browser.js":[function(require,module,exports) {

// shim for using process in browser
var process = module.exports = {}; // cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
  throw new Error('setTimeout has not been defined');
}

function defaultClearTimeout() {
  throw new Error('clearTimeout has not been defined');
}

(function () {
  try {
    if (typeof setTimeout === 'function') {
      cachedSetTimeout = setTimeout;
    } else {
      cachedSetTimeout = defaultSetTimout;
    }
  } catch (e) {
    cachedSetTimeout = defaultSetTimout;
  }

  try {
    if (typeof clearTimeout === 'function') {
      cachedClearTimeout = clearTimeout;
    } else {
      cachedClearTimeout = defaultClearTimeout;
    }
  } catch (e) {
    cachedClearTimeout = defaultClearTimeout;
  }
})();

function runTimeout(fun) {
  if (cachedSetTimeout === setTimeout) {
    //normal enviroments in sane situations
    return setTimeout(fun, 0);
  } // if setTimeout wasn't available but was latter defined


  if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
    cachedSetTimeout = setTimeout;
    return setTimeout(fun, 0);
  }

  try {
    // when when somebody has screwed with setTimeout but no I.E. maddness
    return cachedSetTimeout(fun, 0);
  } catch (e) {
    try {
      // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
      return cachedSetTimeout.call(null, fun, 0);
    } catch (e) {
      // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
      return cachedSetTimeout.call(this, fun, 0);
    }
  }
}

function runClearTimeout(marker) {
  if (cachedClearTimeout === clearTimeout) {
    //normal enviroments in sane situations
    return clearTimeout(marker);
  } // if clearTimeout wasn't available but was latter defined


  if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
    cachedClearTimeout = clearTimeout;
    return clearTimeout(marker);
  }

  try {
    // when when somebody has screwed with setTimeout but no I.E. maddness
    return cachedClearTimeout(marker);
  } catch (e) {
    try {
      // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
      return cachedClearTimeout.call(null, marker);
    } catch (e) {
      // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
      // Some versions of I.E. have different rules for clearTimeout vs setTimeout
      return cachedClearTimeout.call(this, marker);
    }
  }
}

var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
  if (!draining || !currentQueue) {
    return;
  }

  draining = false;

  if (currentQueue.length) {
    queue = currentQueue.concat(queue);
  } else {
    queueIndex = -1;
  }

  if (queue.length) {
    drainQueue();
  }
}

function drainQueue() {
  if (draining) {
    return;
  }

  var timeout = runTimeout(cleanUpNextTick);
  draining = true;
  var len = queue.length;

  while (len) {
    currentQueue = queue;
    queue = [];

    while (++queueIndex < len) {
      if (currentQueue) {
        currentQueue[queueIndex].run();
      }
    }

    queueIndex = -1;
    len = queue.length;
  }

  currentQueue = null;
  draining = false;
  runClearTimeout(timeout);
}

process.nextTick = function (fun) {
  var args = new Array(arguments.length - 1);

  if (arguments.length > 1) {
    for (var i = 1; i < arguments.length; i++) {
      args[i - 1] = arguments[i];
    }
  }

  queue.push(new Item(fun, args));

  if (queue.length === 1 && !draining) {
    runTimeout(drainQueue);
  }
}; // v8 likes predictible objects


function Item(fun, array) {
  this.fun = fun;
  this.array = array;
}

Item.prototype.run = function () {
  this.fun.apply(null, this.array);
};

process.title = 'browser';
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues

process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) {
  return [];
};

process.binding = function (name) {
  throw new Error('process.binding is not supported');
};

process.cwd = function () {
  return '/';
};

process.chdir = function (dir) {
  throw new Error('process.chdir is not supported');
};

process.umask = function () {
  return 0;
};
},{}],"../node_modules/process-nextick-args/index.js":[function(require,module,exports) {
var process = require("process");
'use strict';

if (typeof process === 'undefined' ||
    !process.version ||
    process.version.indexOf('v0.') === 0 ||
    process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
  module.exports = { nextTick: nextTick };
} else {
  module.exports = process
}

function nextTick(fn, arg1, arg2, arg3) {
  if (typeof fn !== 'function') {
    throw new TypeError('"callback" argument must be a function');
  }
  var len = arguments.length;
  var args, i;
  switch (len) {
  case 0:
  case 1:
    return process.nextTick(fn);
  case 2:
    return process.nextTick(function afterTickOne() {
      fn.call(null, arg1);
    });
  case 3:
    return process.nextTick(function afterTickTwo() {
      fn.call(null, arg1, arg2);
    });
  case 4:
    return process.nextTick(function afterTickThree() {
      fn.call(null, arg1, arg2, arg3);
    });
  default:
    args = new Array(len - 1);
    i = 0;
    while (i < args.length) {
      args[i++] = arguments[i];
    }
    return process.nextTick(function afterTick() {
      fn.apply(null, args);
    });
  }
}


},{"process":"../node_modules/process/browser.js"}],"../node_modules/readable-stream/lib/internal/streams/stream-browser.js":[function(require,module,exports) {
module.exports = require('events').EventEmitter;

},{"events":"../node_modules/events/events.js"}],"../node_modules/readable-stream/node_modules/safe-buffer/index.js":[function(require,module,exports) {

/* eslint-disable node/no-deprecated-api */
var buffer = require('buffer')
var Buffer = buffer.Buffer

// alternative to using Object.keys for old browsers
function copyProps (src, dst) {
  for (var key in src) {
    dst[key] = src[key]
  }
}
if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
  module.exports = buffer
} else {
  // Copy properties from require('buffer')
  copyProps(buffer, exports)
  exports.Buffer = SafeBuffer
}

function SafeBuffer (arg, encodingOrOffset, length) {
  return Buffer(arg, encodingOrOffset, length)
}

// Copy static methods from Buffer
copyProps(Buffer, SafeBuffer)

SafeBuffer.from = function (arg, encodingOrOffset, length) {
  if (typeof arg === 'number') {
    throw new TypeError('Argument must not be a number')
  }
  return Buffer(arg, encodingOrOffset, length)
}

SafeBuffer.alloc = function (size, fill, encoding) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  var buf = Buffer(size)
  if (fill !== undefined) {
    if (typeof encoding === 'string') {
      buf.fill(fill, encoding)
    } else {
      buf.fill(fill)
    }
  } else {
    buf.fill(0)
  }
  return buf
}

SafeBuffer.allocUnsafe = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return Buffer(size)
}

SafeBuffer.allocUnsafeSlow = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return buffer.SlowBuffer(size)
}

},{"buffer":"../node_modules/buffer/index.js"}],"../node_modules/core-util-is/lib/util.js":[function(require,module,exports) {
var Buffer = require("buffer").Buffer;
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.

function isArray(arg) {
  if (Array.isArray) {
    return Array.isArray(arg);
  }
  return objectToString(arg) === '[object Array]';
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = Buffer.isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

},{"buffer":"../node_modules/buffer/index.js"}],"../node_modules/readable-stream/lib/internal/streams/BufferList.js":[function(require,module,exports) {

'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Buffer = require('safe-buffer').Buffer;
var util = require('util');

function copyBuffer(src, target, offset) {
  src.copy(target, offset);
}

module.exports = function () {
  function BufferList() {
    _classCallCheck(this, BufferList);

    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  BufferList.prototype.push = function push(v) {
    var entry = { data: v, next: null };
    if (this.length > 0) this.tail.next = entry;else this.head = entry;
    this.tail = entry;
    ++this.length;
  };

  BufferList.prototype.unshift = function unshift(v) {
    var entry = { data: v, next: this.head };
    if (this.length === 0) this.tail = entry;
    this.head = entry;
    ++this.length;
  };

  BufferList.prototype.shift = function shift() {
    if (this.length === 0) return;
    var ret = this.head.data;
    if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
    --this.length;
    return ret;
  };

  BufferList.prototype.clear = function clear() {
    this.head = this.tail = null;
    this.length = 0;
  };

  BufferList.prototype.join = function join(s) {
    if (this.length === 0) return '';
    var p = this.head;
    var ret = '' + p.data;
    while (p = p.next) {
      ret += s + p.data;
    }return ret;
  };

  BufferList.prototype.concat = function concat(n) {
    if (this.length === 0) return Buffer.alloc(0);
    if (this.length === 1) return this.head.data;
    var ret = Buffer.allocUnsafe(n >>> 0);
    var p = this.head;
    var i = 0;
    while (p) {
      copyBuffer(p.data, ret, i);
      i += p.data.length;
      p = p.next;
    }
    return ret;
  };

  return BufferList;
}();

if (util && util.inspect && util.inspect.custom) {
  module.exports.prototype[util.inspect.custom] = function () {
    var obj = util.inspect({ length: this.length });
    return this.constructor.name + ' ' + obj;
  };
}
},{"safe-buffer":"../node_modules/readable-stream/node_modules/safe-buffer/index.js","util":"../node_modules/parcel-bundler/src/builtins/_empty.js"}],"../node_modules/readable-stream/lib/internal/streams/destroy.js":[function(require,module,exports) {
'use strict';

/*<replacement>*/

var pna = require('process-nextick-args');
/*</replacement>*/

// undocumented cb() API, needed for core, not for public API
function destroy(err, cb) {
  var _this = this;

  var readableDestroyed = this._readableState && this._readableState.destroyed;
  var writableDestroyed = this._writableState && this._writableState.destroyed;

  if (readableDestroyed || writableDestroyed) {
    if (cb) {
      cb(err);
    } else if (err && (!this._writableState || !this._writableState.errorEmitted)) {
      pna.nextTick(emitErrorNT, this, err);
    }
    return this;
  }

  // we set destroyed to true before firing error callbacks in order
  // to make it re-entrance safe in case destroy() is called within callbacks

  if (this._readableState) {
    this._readableState.destroyed = true;
  }

  // if this is a duplex stream mark the writable part as destroyed as well
  if (this._writableState) {
    this._writableState.destroyed = true;
  }

  this._destroy(err || null, function (err) {
    if (!cb && err) {
      pna.nextTick(emitErrorNT, _this, err);
      if (_this._writableState) {
        _this._writableState.errorEmitted = true;
      }
    } else if (cb) {
      cb(err);
    }
  });

  return this;
}

function undestroy() {
  if (this._readableState) {
    this._readableState.destroyed = false;
    this._readableState.reading = false;
    this._readableState.ended = false;
    this._readableState.endEmitted = false;
  }

  if (this._writableState) {
    this._writableState.destroyed = false;
    this._writableState.ended = false;
    this._writableState.ending = false;
    this._writableState.finished = false;
    this._writableState.errorEmitted = false;
  }
}

function emitErrorNT(self, err) {
  self.emit('error', err);
}

module.exports = {
  destroy: destroy,
  undestroy: undestroy
};
},{"process-nextick-args":"../node_modules/process-nextick-args/index.js"}],"../node_modules/util-deprecate/browser.js":[function(require,module,exports) {
var global = arguments[3];

/**
 * Module exports.
 */

module.exports = deprecate;

/**
 * Mark that a method should not be used.
 * Returns a modified function which warns once by default.
 *
 * If `localStorage.noDeprecation = true` is set, then it is a no-op.
 *
 * If `localStorage.throwDeprecation = true` is set, then deprecated functions
 * will throw an Error when invoked.
 *
 * If `localStorage.traceDeprecation = true` is set, then deprecated functions
 * will invoke `console.trace()` instead of `console.error()`.
 *
 * @param {Function} fn - the function to deprecate
 * @param {String} msg - the string to print to the console when `fn` is invoked
 * @returns {Function} a new "deprecated" version of `fn`
 * @api public
 */

function deprecate (fn, msg) {
  if (config('noDeprecation')) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (config('throwDeprecation')) {
        throw new Error(msg);
      } else if (config('traceDeprecation')) {
        console.trace(msg);
      } else {
        console.warn(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
}

/**
 * Checks `localStorage` for boolean values for the given `name`.
 *
 * @param {String} name
 * @returns {Boolean}
 * @api private
 */

function config (name) {
  // accessing global.localStorage can trigger a DOMException in sandboxed iframes
  try {
    if (!global.localStorage) return false;
  } catch (_) {
    return false;
  }
  var val = global.localStorage[name];
  if (null == val) return false;
  return String(val).toLowerCase() === 'true';
}

},{}],"../node_modules/readable-stream/lib/_stream_writable.js":[function(require,module,exports) {
var process = require("process");

var global = arguments[3];
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
// A bit simpler than readable streams.
// Implement an async ._write(chunk, encoding, cb), and it'll handle all
// the drain event emission and buffering.
'use strict';
/*<replacement>*/

var pna = require('process-nextick-args');
/*</replacement>*/


module.exports = Writable;
/* <replacement> */

function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
  this.next = null;
} // It seems a linked list but it is not
// there will be only 2 of these for each stream


function CorkedRequest(state) {
  var _this = this;

  this.next = null;
  this.entry = null;

  this.finish = function () {
    onCorkedFinish(_this, state);
  };
}
/* </replacement> */

/*<replacement>*/


var asyncWrite = !true && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : pna.nextTick;
/*</replacement>*/

/*<replacement>*/

var Duplex;
/*</replacement>*/

Writable.WritableState = WritableState;
/*<replacement>*/

var util = Object.create(require('core-util-is'));
util.inherits = require('inherits');
/*</replacement>*/

/*<replacement>*/

var internalUtil = {
  deprecate: require('util-deprecate')
};
/*</replacement>*/

/*<replacement>*/

var Stream = require('./internal/streams/stream');
/*</replacement>*/

/*<replacement>*/


var Buffer = require('safe-buffer').Buffer;

var OurUint8Array = global.Uint8Array || function () {};

function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}

function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}
/*</replacement>*/


var destroyImpl = require('./internal/streams/destroy');

util.inherits(Writable, Stream);

function nop() {}

function WritableState(options, stream) {
  Duplex = Duplex || require('./_stream_duplex');
  options = options || {}; // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.

  var isDuplex = stream instanceof Duplex; // object stream flag to indicate whether or not this stream
  // contains buffers or objects.

  this.objectMode = !!options.objectMode;
  if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode; // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()

  var hwm = options.highWaterMark;
  var writableHwm = options.writableHighWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;
  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (writableHwm || writableHwm === 0)) this.highWaterMark = writableHwm;else this.highWaterMark = defaultHwm; // cast to ints.

  this.highWaterMark = Math.floor(this.highWaterMark); // if _final has been called

  this.finalCalled = false; // drain event flag.

  this.needDrain = false; // at the start of calling end()

  this.ending = false; // when end() has been called, and returned

  this.ended = false; // when 'finish' is emitted

  this.finished = false; // has it been destroyed

  this.destroyed = false; // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.

  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode; // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.

  this.defaultEncoding = options.defaultEncoding || 'utf8'; // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.

  this.length = 0; // a flag to see when we're in the middle of a write.

  this.writing = false; // when true all writes will be buffered until .uncork() call

  this.corked = 0; // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.

  this.sync = true; // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.

  this.bufferProcessing = false; // the callback that's passed to _write(chunk,cb)

  this.onwrite = function (er) {
    onwrite(stream, er);
  }; // the callback that the user supplies to write(chunk,encoding,cb)


  this.writecb = null; // the amount that is being written when _write is called.

  this.writelen = 0;
  this.bufferedRequest = null;
  this.lastBufferedRequest = null; // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted

  this.pendingcb = 0; // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams

  this.prefinished = false; // True if the error was already emitted and should not be thrown again

  this.errorEmitted = false; // count buffered requests

  this.bufferedRequestCount = 0; // allocate the first CorkedRequest, there is always
  // one allocated and free to use, and we maintain at most two

  this.corkedRequestsFree = new CorkedRequest(this);
}

WritableState.prototype.getBuffer = function getBuffer() {
  var current = this.bufferedRequest;
  var out = [];

  while (current) {
    out.push(current);
    current = current.next;
  }

  return out;
};

(function () {
  try {
    Object.defineProperty(WritableState.prototype, 'buffer', {
      get: internalUtil.deprecate(function () {
        return this.getBuffer();
      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.', 'DEP0003')
    });
  } catch (_) {}
})(); // Test _writableState for inheritance to account for Duplex streams,
// whose prototype chain only points to Readable.


var realHasInstance;

if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
  realHasInstance = Function.prototype[Symbol.hasInstance];
  Object.defineProperty(Writable, Symbol.hasInstance, {
    value: function (object) {
      if (realHasInstance.call(this, object)) return true;
      if (this !== Writable) return false;
      return object && object._writableState instanceof WritableState;
    }
  });
} else {
  realHasInstance = function (object) {
    return object instanceof this;
  };
}

function Writable(options) {
  Duplex = Duplex || require('./_stream_duplex'); // Writable ctor is applied to Duplexes, too.
  // `realHasInstance` is necessary because using plain `instanceof`
  // would return false, as no `_writableState` property is attached.
  // Trying to use the custom `instanceof` for Writable here will also break the
  // Node.js LazyTransform implementation, which has a non-trivial getter for
  // `_writableState` that would lead to infinite recursion.

  if (!realHasInstance.call(Writable, this) && !(this instanceof Duplex)) {
    return new Writable(options);
  }

  this._writableState = new WritableState(options, this); // legacy.

  this.writable = true;

  if (options) {
    if (typeof options.write === 'function') this._write = options.write;
    if (typeof options.writev === 'function') this._writev = options.writev;
    if (typeof options.destroy === 'function') this._destroy = options.destroy;
    if (typeof options.final === 'function') this._final = options.final;
  }

  Stream.call(this);
} // Otherwise people can pipe Writable streams, which is just wrong.


Writable.prototype.pipe = function () {
  this.emit('error', new Error('Cannot pipe, not readable'));
};

function writeAfterEnd(stream, cb) {
  var er = new Error('write after end'); // TODO: defer error events consistently everywhere, not just the cb

  stream.emit('error', er);
  pna.nextTick(cb, er);
} // Checks that a user-supplied chunk is valid, especially for the particular
// mode the stream is in. Currently this means that `null` is never accepted
// and undefined/non-string values are only allowed in object mode.


function validChunk(stream, state, chunk, cb) {
  var valid = true;
  var er = false;

  if (chunk === null) {
    er = new TypeError('May not write null values to stream');
  } else if (typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }

  if (er) {
    stream.emit('error', er);
    pna.nextTick(cb, er);
    valid = false;
  }

  return valid;
}

Writable.prototype.write = function (chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;

  var isBuf = !state.objectMode && _isUint8Array(chunk);

  if (isBuf && !Buffer.isBuffer(chunk)) {
    chunk = _uint8ArrayToBuffer(chunk);
  }

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (isBuf) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;
  if (typeof cb !== 'function') cb = nop;
  if (state.ended) writeAfterEnd(this, cb);else if (isBuf || validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
  }
  return ret;
};

Writable.prototype.cork = function () {
  var state = this._writableState;
  state.corked++;
};

Writable.prototype.uncork = function () {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;
    if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
  }
};

Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
  this._writableState.defaultEncoding = encoding;
  return this;
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
    chunk = Buffer.from(chunk, encoding);
  }

  return chunk;
}

Object.defineProperty(Writable.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._writableState.highWaterMark;
  }
}); // if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.

function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
  if (!isBuf) {
    var newChunk = decodeChunk(state, chunk, encoding);

    if (chunk !== newChunk) {
      isBuf = true;
      encoding = 'buffer';
      chunk = newChunk;
    }
  }

  var len = state.objectMode ? 1 : chunk.length;
  state.length += len;
  var ret = state.length < state.highWaterMark; // we must ensure that previous needDrain will not be reset to false.

  if (!ret) state.needDrain = true;

  if (state.writing || state.corked) {
    var last = state.lastBufferedRequest;
    state.lastBufferedRequest = {
      chunk: chunk,
      encoding: encoding,
      isBuf: isBuf,
      callback: cb,
      next: null
    };

    if (last) {
      last.next = state.lastBufferedRequest;
    } else {
      state.bufferedRequest = state.lastBufferedRequest;
    }

    state.bufferedRequestCount += 1;
  } else {
    doWrite(stream, state, false, len, chunk, encoding, cb);
  }

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  --state.pendingcb;

  if (sync) {
    // defer the callback if we are being called synchronously
    // to avoid piling up things on the stack
    pna.nextTick(cb, er); // this can emit finish, and it will always happen
    // after error

    pna.nextTick(finishMaybe, stream, state);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
  } else {
    // the caller expect this to happen before if
    // it is async
    cb(er);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er); // this can emit finish, but finish must
    // always follow error

    finishMaybe(stream, state);
  }
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;
  onwriteStateUpdate(state);
  if (er) onwriteError(stream, state, sync, er, cb);else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(state);

    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
      clearBuffer(stream, state);
    }

    if (sync) {
      /*<replacement>*/
      asyncWrite(afterWrite, stream, state, finished, cb);
      /*</replacement>*/
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished) onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
} // Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.


function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
} // if there's something in the buffer waiting, then process it


function clearBuffer(stream, state) {
  state.bufferProcessing = true;
  var entry = state.bufferedRequest;

  if (stream._writev && entry && entry.next) {
    // Fast case, write everything using _writev()
    var l = state.bufferedRequestCount;
    var buffer = new Array(l);
    var holder = state.corkedRequestsFree;
    holder.entry = entry;
    var count = 0;
    var allBuffers = true;

    while (entry) {
      buffer[count] = entry;
      if (!entry.isBuf) allBuffers = false;
      entry = entry.next;
      count += 1;
    }

    buffer.allBuffers = allBuffers;
    doWrite(stream, state, true, state.length, buffer, '', holder.finish); // doWrite is almost always async, defer these to save a bit of time
    // as the hot path ends with doWrite

    state.pendingcb++;
    state.lastBufferedRequest = null;

    if (holder.next) {
      state.corkedRequestsFree = holder.next;
      holder.next = null;
    } else {
      state.corkedRequestsFree = new CorkedRequest(state);
    }

    state.bufferedRequestCount = 0;
  } else {
    // Slow case, write chunks one-by-one
    while (entry) {
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;
      doWrite(stream, state, false, len, chunk, encoding, cb);
      entry = entry.next;
      state.bufferedRequestCount--; // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.

      if (state.writing) {
        break;
      }
    }

    if (entry === null) state.lastBufferedRequest = null;
  }

  state.bufferedRequest = entry;
  state.bufferProcessing = false;
}

Writable.prototype._write = function (chunk, encoding, cb) {
  cb(new Error('_write() is not implemented'));
};

Writable.prototype._writev = null;

Writable.prototype.end = function (chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding); // .end() fully uncorks

  if (state.corked) {
    state.corked = 1;
    this.uncork();
  } // ignore unnecessary end() calls.


  if (!state.ending && !state.finished) endWritable(this, state, cb);
};

function needFinish(state) {
  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
}

function callFinal(stream, state) {
  stream._final(function (err) {
    state.pendingcb--;

    if (err) {
      stream.emit('error', err);
    }

    state.prefinished = true;
    stream.emit('prefinish');
    finishMaybe(stream, state);
  });
}

function prefinish(stream, state) {
  if (!state.prefinished && !state.finalCalled) {
    if (typeof stream._final === 'function') {
      state.pendingcb++;
      state.finalCalled = true;
      pna.nextTick(callFinal, stream, state);
    } else {
      state.prefinished = true;
      stream.emit('prefinish');
    }
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(state);

  if (need) {
    prefinish(stream, state);

    if (state.pendingcb === 0) {
      state.finished = true;
      stream.emit('finish');
    }
  }

  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);

  if (cb) {
    if (state.finished) pna.nextTick(cb);else stream.once('finish', cb);
  }

  state.ended = true;
  stream.writable = false;
}

function onCorkedFinish(corkReq, state, err) {
  var entry = corkReq.entry;
  corkReq.entry = null;

  while (entry) {
    var cb = entry.callback;
    state.pendingcb--;
    cb(err);
    entry = entry.next;
  }

  if (state.corkedRequestsFree) {
    state.corkedRequestsFree.next = corkReq;
  } else {
    state.corkedRequestsFree = corkReq;
  }
}

Object.defineProperty(Writable.prototype, 'destroyed', {
  get: function () {
    if (this._writableState === undefined) {
      return false;
    }

    return this._writableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._writableState) {
      return;
    } // backward compatibility, the user is explicitly
    // managing destroyed


    this._writableState.destroyed = value;
  }
});
Writable.prototype.destroy = destroyImpl.destroy;
Writable.prototype._undestroy = destroyImpl.undestroy;

Writable.prototype._destroy = function (err, cb) {
  this.end();
  cb(err);
};
},{"process-nextick-args":"../node_modules/process-nextick-args/index.js","core-util-is":"../node_modules/core-util-is/lib/util.js","inherits":"../node_modules/inherits/inherits_browser.js","util-deprecate":"../node_modules/util-deprecate/browser.js","./internal/streams/stream":"../node_modules/readable-stream/lib/internal/streams/stream-browser.js","safe-buffer":"../node_modules/readable-stream/node_modules/safe-buffer/index.js","./internal/streams/destroy":"../node_modules/readable-stream/lib/internal/streams/destroy.js","./_stream_duplex":"../node_modules/readable-stream/lib/_stream_duplex.js","process":"../node_modules/process/browser.js"}],"../node_modules/readable-stream/lib/_stream_duplex.js":[function(require,module,exports) {
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.

'use strict';

/*<replacement>*/

var pna = require('process-nextick-args');
/*</replacement>*/

/*<replacement>*/
var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    keys.push(key);
  }return keys;
};
/*</replacement>*/

module.exports = Duplex;

/*<replacement>*/
var util = Object.create(require('core-util-is'));
util.inherits = require('inherits');
/*</replacement>*/

var Readable = require('./_stream_readable');
var Writable = require('./_stream_writable');

util.inherits(Duplex, Readable);

{
  // avoid scope creep, the keys array can then be collected
  var keys = objectKeys(Writable.prototype);
  for (var v = 0; v < keys.length; v++) {
    var method = keys[v];
    if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
  }
}

function Duplex(options) {
  if (!(this instanceof Duplex)) return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

  if (options && options.readable === false) this.readable = false;

  if (options && options.writable === false) this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

  this.once('end', onend);
}

Object.defineProperty(Duplex.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._writableState.highWaterMark;
  }
});

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended) return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  pna.nextTick(onEndNT, this);
}

function onEndNT(self) {
  self.end();
}

Object.defineProperty(Duplex.prototype, 'destroyed', {
  get: function () {
    if (this._readableState === undefined || this._writableState === undefined) {
      return false;
    }
    return this._readableState.destroyed && this._writableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (this._readableState === undefined || this._writableState === undefined) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
    this._writableState.destroyed = value;
  }
});

Duplex.prototype._destroy = function (err, cb) {
  this.push(null);
  this.end();

  pna.nextTick(cb, err);
};
},{"process-nextick-args":"../node_modules/process-nextick-args/index.js","core-util-is":"../node_modules/core-util-is/lib/util.js","inherits":"../node_modules/inherits/inherits_browser.js","./_stream_readable":"../node_modules/readable-stream/lib/_stream_readable.js","./_stream_writable":"../node_modules/readable-stream/lib/_stream_writable.js"}],"../node_modules/readable-stream/node_modules/string_decoder/lib/string_decoder.js":[function(require,module,exports) {

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

/*<replacement>*/

var Buffer = require('safe-buffer').Buffer;
/*</replacement>*/

var isEncoding = Buffer.isEncoding || function (encoding) {
  encoding = '' + encoding;
  switch (encoding && encoding.toLowerCase()) {
    case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':case 'raw':
      return true;
    default:
      return false;
  }
};

function _normalizeEncoding(enc) {
  if (!enc) return 'utf8';
  var retried;
  while (true) {
    switch (enc) {
      case 'utf8':
      case 'utf-8':
        return 'utf8';
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return 'utf16le';
      case 'latin1':
      case 'binary':
        return 'latin1';
      case 'base64':
      case 'ascii':
      case 'hex':
        return enc;
      default:
        if (retried) return; // undefined
        enc = ('' + enc).toLowerCase();
        retried = true;
    }
  }
};

// Do not cache `Buffer.isEncoding` when checking encoding names as some
// modules monkey-patch it to support additional encodings
function normalizeEncoding(enc) {
  var nenc = _normalizeEncoding(enc);
  if (typeof nenc !== 'string' && (Buffer.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);
  return nenc || enc;
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters.
exports.StringDecoder = StringDecoder;
function StringDecoder(encoding) {
  this.encoding = normalizeEncoding(encoding);
  var nb;
  switch (this.encoding) {
    case 'utf16le':
      this.text = utf16Text;
      this.end = utf16End;
      nb = 4;
      break;
    case 'utf8':
      this.fillLast = utf8FillLast;
      nb = 4;
      break;
    case 'base64':
      this.text = base64Text;
      this.end = base64End;
      nb = 3;
      break;
    default:
      this.write = simpleWrite;
      this.end = simpleEnd;
      return;
  }
  this.lastNeed = 0;
  this.lastTotal = 0;
  this.lastChar = Buffer.allocUnsafe(nb);
}

StringDecoder.prototype.write = function (buf) {
  if (buf.length === 0) return '';
  var r;
  var i;
  if (this.lastNeed) {
    r = this.fillLast(buf);
    if (r === undefined) return '';
    i = this.lastNeed;
    this.lastNeed = 0;
  } else {
    i = 0;
  }
  if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
  return r || '';
};

StringDecoder.prototype.end = utf8End;

// Returns only complete characters in a Buffer
StringDecoder.prototype.text = utf8Text;

// Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
StringDecoder.prototype.fillLast = function (buf) {
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
  this.lastNeed -= buf.length;
};

// Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
// continuation byte. If an invalid byte is detected, -2 is returned.
function utf8CheckByte(byte) {
  if (byte <= 0x7F) return 0;else if (byte >> 5 === 0x06) return 2;else if (byte >> 4 === 0x0E) return 3;else if (byte >> 3 === 0x1E) return 4;
  return byte >> 6 === 0x02 ? -1 : -2;
}

// Checks at most 3 bytes at the end of a Buffer in order to detect an
// incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
// needed to complete the UTF-8 character (if applicable) are returned.
function utf8CheckIncomplete(self, buf, i) {
  var j = buf.length - 1;
  if (j < i) return 0;
  var nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 1;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 2;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) {
      if (nb === 2) nb = 0;else self.lastNeed = nb - 3;
    }
    return nb;
  }
  return 0;
}

// Validates as many continuation bytes for a multi-byte UTF-8 character as
// needed or are available. If we see a non-continuation byte where we expect
// one, we "replace" the validated continuation bytes we've seen so far with
// a single UTF-8 replacement character ('\ufffd'), to match v8's UTF-8 decoding
// behavior. The continuation byte check is included three times in the case
// where all of the continuation bytes for a character exist in the same buffer.
// It is also done this way as a slight performance increase instead of using a
// loop.
function utf8CheckExtraBytes(self, buf, p) {
  if ((buf[0] & 0xC0) !== 0x80) {
    self.lastNeed = 0;
    return '\ufffd';
  }
  if (self.lastNeed > 1 && buf.length > 1) {
    if ((buf[1] & 0xC0) !== 0x80) {
      self.lastNeed = 1;
      return '\ufffd';
    }
    if (self.lastNeed > 2 && buf.length > 2) {
      if ((buf[2] & 0xC0) !== 0x80) {
        self.lastNeed = 2;
        return '\ufffd';
      }
    }
  }
}

// Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
function utf8FillLast(buf) {
  var p = this.lastTotal - this.lastNeed;
  var r = utf8CheckExtraBytes(this, buf, p);
  if (r !== undefined) return r;
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, p, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, p, 0, buf.length);
  this.lastNeed -= buf.length;
}

// Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
// partial character, the character's bytes are buffered until the required
// number of bytes are available.
function utf8Text(buf, i) {
  var total = utf8CheckIncomplete(this, buf, i);
  if (!this.lastNeed) return buf.toString('utf8', i);
  this.lastTotal = total;
  var end = buf.length - (total - this.lastNeed);
  buf.copy(this.lastChar, 0, end);
  return buf.toString('utf8', i, end);
}

// For UTF-8, a replacement character is added when ending on a partial
// character.
function utf8End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + '\ufffd';
  return r;
}

// UTF-16LE typically needs two bytes per character, but even if we have an even
// number of bytes available, we need to check if we end on a leading/high
// surrogate. In that case, we need to wait for the next two bytes in order to
// decode the last character properly.
function utf16Text(buf, i) {
  if ((buf.length - i) % 2 === 0) {
    var r = buf.toString('utf16le', i);
    if (r) {
      var c = r.charCodeAt(r.length - 1);
      if (c >= 0xD800 && c <= 0xDBFF) {
        this.lastNeed = 2;
        this.lastTotal = 4;
        this.lastChar[0] = buf[buf.length - 2];
        this.lastChar[1] = buf[buf.length - 1];
        return r.slice(0, -1);
      }
    }
    return r;
  }
  this.lastNeed = 1;
  this.lastTotal = 2;
  this.lastChar[0] = buf[buf.length - 1];
  return buf.toString('utf16le', i, buf.length - 1);
}

// For UTF-16LE we do not explicitly append special replacement characters if we
// end on a partial character, we simply let v8 handle that.
function utf16End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) {
    var end = this.lastTotal - this.lastNeed;
    return r + this.lastChar.toString('utf16le', 0, end);
  }
  return r;
}

function base64Text(buf, i) {
  var n = (buf.length - i) % 3;
  if (n === 0) return buf.toString('base64', i);
  this.lastNeed = 3 - n;
  this.lastTotal = 3;
  if (n === 1) {
    this.lastChar[0] = buf[buf.length - 1];
  } else {
    this.lastChar[0] = buf[buf.length - 2];
    this.lastChar[1] = buf[buf.length - 1];
  }
  return buf.toString('base64', i, buf.length - n);
}

function base64End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
  return r;
}

// Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
function simpleWrite(buf) {
  return buf.toString(this.encoding);
}

function simpleEnd(buf) {
  return buf && buf.length ? this.write(buf) : '';
}
},{"safe-buffer":"../node_modules/readable-stream/node_modules/safe-buffer/index.js"}],"../node_modules/readable-stream/lib/_stream_readable.js":[function(require,module,exports) {

var global = arguments[3];
var process = require("process");
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

/*<replacement>*/

var pna = require('process-nextick-args');
/*</replacement>*/

module.exports = Readable;

/*<replacement>*/
var isArray = require('isarray');
/*</replacement>*/

/*<replacement>*/
var Duplex;
/*</replacement>*/

Readable.ReadableState = ReadableState;

/*<replacement>*/
var EE = require('events').EventEmitter;

var EElistenerCount = function (emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

/*<replacement>*/
var Stream = require('./internal/streams/stream');
/*</replacement>*/

/*<replacement>*/

var Buffer = require('safe-buffer').Buffer;
var OurUint8Array = global.Uint8Array || function () {};
function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}
function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}

/*</replacement>*/

/*<replacement>*/
var util = Object.create(require('core-util-is'));
util.inherits = require('inherits');
/*</replacement>*/

/*<replacement>*/
var debugUtil = require('util');
var debug = void 0;
if (debugUtil && debugUtil.debuglog) {
  debug = debugUtil.debuglog('stream');
} else {
  debug = function () {};
}
/*</replacement>*/

var BufferList = require('./internal/streams/BufferList');
var destroyImpl = require('./internal/streams/destroy');
var StringDecoder;

util.inherits(Readable, Stream);

var kProxyEvents = ['error', 'close', 'destroy', 'pause', 'resume'];

function prependListener(emitter, event, fn) {
  // Sadly this is not cacheable as some libraries bundle their own
  // event emitter implementation with them.
  if (typeof emitter.prependListener === 'function') return emitter.prependListener(event, fn);

  // This is a hack to make sure that our error handler is attached before any
  // userland ones.  NEVER DO THIS. This is here only because this code needs
  // to continue to work with older versions of Node.js that do not include
  // the prependListener() method. The goal is to eventually remove this hack.
  if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (isArray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
}

function ReadableState(options, stream) {
  Duplex = Duplex || require('./_stream_duplex');

  options = options || {};

  // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.
  var isDuplex = stream instanceof Duplex;

  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  var readableHwm = options.readableHighWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (readableHwm || readableHwm === 0)) this.highWaterMark = readableHwm;else this.highWaterMark = defaultHwm;

  // cast to ints.
  this.highWaterMark = Math.floor(this.highWaterMark);

  // A linked list is used to store data chunks instead of an array because the
  // linked list can remove elements from the beginning faster than
  // array.shift()
  this.buffer = new BufferList();
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // a flag to be able to tell if the event 'readable'/'data' is emitted
  // immediately, or on a later tick.  We set this to true at first, because
  // any actions that shouldn't happen until "later" should generally also
  // not happen before the first read call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;
  this.resumeScheduled = false;

  // has it been destroyed
  this.destroyed = false;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  Duplex = Duplex || require('./_stream_duplex');

  if (!(this instanceof Readable)) return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  if (options) {
    if (typeof options.read === 'function') this._read = options.read;

    if (typeof options.destroy === 'function') this._destroy = options.destroy;
  }

  Stream.call(this);
}

Object.defineProperty(Readable.prototype, 'destroyed', {
  get: function () {
    if (this._readableState === undefined) {
      return false;
    }
    return this._readableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._readableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
  }
});

Readable.prototype.destroy = destroyImpl.destroy;
Readable.prototype._undestroy = destroyImpl.undestroy;
Readable.prototype._destroy = function (err, cb) {
  this.push(null);
  cb(err);
};

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function (chunk, encoding) {
  var state = this._readableState;
  var skipChunkCheck;

  if (!state.objectMode) {
    if (typeof chunk === 'string') {
      encoding = encoding || state.defaultEncoding;
      if (encoding !== state.encoding) {
        chunk = Buffer.from(chunk, encoding);
        encoding = '';
      }
      skipChunkCheck = true;
    }
  } else {
    skipChunkCheck = true;
  }

  return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function (chunk) {
  return readableAddChunk(this, chunk, null, true, false);
};

function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
  var state = stream._readableState;
  if (chunk === null) {
    state.reading = false;
    onEofChunk(stream, state);
  } else {
    var er;
    if (!skipChunkCheck) er = chunkInvalid(state, chunk);
    if (er) {
      stream.emit('error', er);
    } else if (state.objectMode || chunk && chunk.length > 0) {
      if (typeof chunk !== 'string' && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer.prototype) {
        chunk = _uint8ArrayToBuffer(chunk);
      }

      if (addToFront) {
        if (state.endEmitted) stream.emit('error', new Error('stream.unshift() after end event'));else addChunk(stream, state, chunk, true);
      } else if (state.ended) {
        stream.emit('error', new Error('stream.push() after EOF'));
      } else {
        state.reading = false;
        if (state.decoder && !encoding) {
          chunk = state.decoder.write(chunk);
          if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);else maybeReadMore(stream, state);
        } else {
          addChunk(stream, state, chunk, false);
        }
      }
    } else if (!addToFront) {
      state.reading = false;
    }
  }

  return needMoreData(state);
}

function addChunk(stream, state, chunk, addToFront) {
  if (state.flowing && state.length === 0 && !state.sync) {
    stream.emit('data', chunk);
    stream.read(0);
  } else {
    // update the buffer info.
    state.length += state.objectMode ? 1 : chunk.length;
    if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);

    if (state.needReadable) emitReadable(stream);
  }
  maybeReadMore(stream, state);
}

function chunkInvalid(state, chunk) {
  var er;
  if (!_isUint8Array(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}

// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
}

Readable.prototype.isPaused = function () {
  return this._readableState.flowing === false;
};

// backwards compatibility.
Readable.prototype.setEncoding = function (enc) {
  if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
  return this;
};

// Don't raise the hwm > 8MB
var MAX_HWM = 0x800000;
function computeNewHighWaterMark(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2 to prevent increasing hwm excessively in
    // tiny amounts
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    n++;
  }
  return n;
}

// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function howMuchToRead(n, state) {
  if (n <= 0 || state.length === 0 && state.ended) return 0;
  if (state.objectMode) return 1;
  if (n !== n) {
    // Only flow one buffer at a time
    if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
  }
  // If we're asking for more than the current hwm, then raise the hwm.
  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
  if (n <= state.length) return n;
  // Don't have enough
  if (!state.ended) {
    state.needReadable = true;
    return 0;
  }
  return state.length;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function (n) {
  debug('read', n);
  n = parseInt(n, 10);
  var state = this._readableState;
  var nOrig = n;

  if (n !== 0) state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0) endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;
  debug('need readable', doRead);

  // if we currently have less than the highWaterMark, then also read some
  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  }

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  } else if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0) state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
    // If _read pushed data synchronously, then `reading` will be false,
    // and we need to re-evaluate how much data we can return to the user.
    if (!state.reading) n = howMuchToRead(nOrig, state);
  }

  var ret;
  if (n > 0) ret = fromList(n, state);else ret = null;

  if (ret === null) {
    state.needReadable = true;
    n = 0;
  } else {
    state.length -= n;
  }

  if (state.length === 0) {
    // If we have nothing in the buffer, then we want to know
    // as soon as we *do* get something into the buffer.
    if (!state.ended) state.needReadable = true;

    // If we tried to read() past the EOF, then emit end on the next tick.
    if (nOrig !== n && state.ended) endReadable(this);
  }

  if (ret !== null) this.emit('data', ret);

  return ret;
};

function onEofChunk(stream, state) {
  if (state.ended) return;
  if (state.decoder) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // emit 'readable' now to make sure it gets picked up.
  emitReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    if (state.sync) pna.nextTick(emitReadable_, stream);else emitReadable_(stream);
  }
}

function emitReadable_(stream) {
  debug('emit readable');
  stream.emit('readable');
  flow(stream);
}

// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    pna.nextTick(maybeReadMore_, stream, state);
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;else len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function (n) {
  this.emit('error', new Error('_read() is not implemented'));
};

Readable.prototype.pipe = function (dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;

  var endFn = doEnd ? onend : unpipe;
  if (state.endEmitted) pna.nextTick(endFn);else src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable, unpipeInfo) {
    debug('onunpipe');
    if (readable === src) {
      if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
        unpipeInfo.hasUnpiped = true;
        cleanup();
      }
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  var cleanedUp = false;
  function cleanup() {
    debug('cleanup');
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', unpipe);
    src.removeListener('data', ondata);

    cleanedUp = true;

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
  }

  // If the user pushes more data while we're writing to dest then we'll end up
  // in ondata again. However, we only want to increase awaitDrain once because
  // dest will only emit one 'drain' event for the multiple writes.
  // => Introduce a guard on increasing awaitDrain.
  var increasedAwaitDrain = false;
  src.on('data', ondata);
  function ondata(chunk) {
    debug('ondata');
    increasedAwaitDrain = false;
    var ret = dest.write(chunk);
    if (false === ret && !increasedAwaitDrain) {
      // If the user unpiped during `dest.write()`, it is possible
      // to get stuck in a permanently paused state if that write
      // also returned false.
      // => Check whether `dest` is still a piping destination.
      if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
        debug('false write response, pause', src._readableState.awaitDrain);
        src._readableState.awaitDrain++;
        increasedAwaitDrain = true;
      }
      src.pause();
    }
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
  }

  // Make sure our error handler is attached before userland ones.
  prependListener(dest, 'error', onerror);

  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function () {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain) state.awaitDrain--;
    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}

Readable.prototype.unpipe = function (dest) {
  var state = this._readableState;
  var unpipeInfo = { hasUnpiped: false };

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0) return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes) return this;

    if (!dest) dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest) dest.emit('unpipe', this, unpipeInfo);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var i = 0; i < len; i++) {
      dests[i].emit('unpipe', this, unpipeInfo);
    }return this;
  }

  // try to find the right one.
  var index = indexOf(state.pipes, dest);
  if (index === -1) return this;

  state.pipes.splice(index, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1) state.pipes = state.pipes[0];

  dest.emit('unpipe', this, unpipeInfo);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function (ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);

  if (ev === 'data') {
    // Start flowing on next tick if stream isn't explicitly paused
    if (this._readableState.flowing !== false) this.resume();
  } else if (ev === 'readable') {
    var state = this._readableState;
    if (!state.endEmitted && !state.readableListening) {
      state.readableListening = state.needReadable = true;
      state.emittedReadable = false;
      if (!state.reading) {
        pna.nextTick(nReadingNextTick, this);
      } else if (state.length) {
        emitReadable(this);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

function nReadingNextTick(self) {
  debug('readable nexttick read 0');
  self.read(0);
}

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function () {
  var state = this._readableState;
  if (!state.flowing) {
    debug('resume');
    state.flowing = true;
    resume(this, state);
  }
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    pna.nextTick(resume_, stream, state);
  }
}

function resume_(stream, state) {
  if (!state.reading) {
    debug('resume read 0');
    stream.read(0);
  }

  state.resumeScheduled = false;
  state.awaitDrain = 0;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading) stream.read(0);
}

Readable.prototype.pause = function () {
  debug('call pause flowing=%j', this._readableState.flowing);
  if (false !== this._readableState.flowing) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);
  while (state.flowing && stream.read() !== null) {}
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function (stream) {
  var _this = this;

  var state = this._readableState;
  var paused = false;

  stream.on('end', function () {
    debug('wrapped end');
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length) _this.push(chunk);
    }

    _this.push(null);
  });

  stream.on('data', function (chunk) {
    debug('wrapped data');
    if (state.decoder) chunk = state.decoder.write(chunk);

    // don't skip over falsy values in objectMode
    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

    var ret = _this.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (this[i] === undefined && typeof stream[i] === 'function') {
      this[i] = function (method) {
        return function () {
          return stream[method].apply(stream, arguments);
        };
      }(i);
    }
  }

  // proxy certain important events.
  for (var n = 0; n < kProxyEvents.length; n++) {
    stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
  }

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  this._read = function (n) {
    debug('wrapped _read', n);
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return this;
};

Object.defineProperty(Readable.prototype, 'readableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._readableState.highWaterMark;
  }
});

// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromList(n, state) {
  // nothing buffered
  if (state.length === 0) return null;

  var ret;
  if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
    // read it all, truncate the list
    if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.head.data;else ret = state.buffer.concat(state.length);
    state.buffer.clear();
  } else {
    // read part of list
    ret = fromListPartial(n, state.buffer, state.decoder);
  }

  return ret;
}

// Extracts only enough buffered data to satisfy the amount requested.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromListPartial(n, list, hasStrings) {
  var ret;
  if (n < list.head.data.length) {
    // slice is the same for buffers and strings
    ret = list.head.data.slice(0, n);
    list.head.data = list.head.data.slice(n);
  } else if (n === list.head.data.length) {
    // first chunk is a perfect match
    ret = list.shift();
  } else {
    // result spans more than one buffer
    ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
  }
  return ret;
}

// Copies a specified amount of characters from the list of buffered data
// chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBufferString(n, list) {
  var p = list.head;
  var c = 1;
  var ret = p.data;
  n -= ret.length;
  while (p = p.next) {
    var str = p.data;
    var nb = n > str.length ? str.length : n;
    if (nb === str.length) ret += str;else ret += str.slice(0, n);
    n -= nb;
    if (n === 0) {
      if (nb === str.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = str.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

// Copies a specified amount of bytes from the list of buffered data chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBuffer(n, list) {
  var ret = Buffer.allocUnsafe(n);
  var p = list.head;
  var c = 1;
  p.data.copy(ret);
  n -= p.data.length;
  while (p = p.next) {
    var buf = p.data;
    var nb = n > buf.length ? buf.length : n;
    buf.copy(ret, ret.length - n, 0, nb);
    n -= nb;
    if (n === 0) {
      if (nb === buf.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = buf.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');

  if (!state.endEmitted) {
    state.ended = true;
    pna.nextTick(endReadableNT, state, stream);
  }
}

function endReadableNT(state, stream) {
  // Check that we didn't get one last unshift.
  if (!state.endEmitted && state.length === 0) {
    state.endEmitted = true;
    stream.readable = false;
    stream.emit('end');
  }
}

function indexOf(xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}
},{"process-nextick-args":"../node_modules/process-nextick-args/index.js","isarray":"../node_modules/isarray/index.js","events":"../node_modules/events/events.js","./internal/streams/stream":"../node_modules/readable-stream/lib/internal/streams/stream-browser.js","safe-buffer":"../node_modules/readable-stream/node_modules/safe-buffer/index.js","core-util-is":"../node_modules/core-util-is/lib/util.js","inherits":"../node_modules/inherits/inherits_browser.js","util":"../node_modules/parcel-bundler/src/builtins/_empty.js","./internal/streams/BufferList":"../node_modules/readable-stream/lib/internal/streams/BufferList.js","./internal/streams/destroy":"../node_modules/readable-stream/lib/internal/streams/destroy.js","./_stream_duplex":"../node_modules/readable-stream/lib/_stream_duplex.js","string_decoder/":"../node_modules/readable-stream/node_modules/string_decoder/lib/string_decoder.js","process":"../node_modules/process/browser.js"}],"../node_modules/readable-stream/lib/_stream_transform.js":[function(require,module,exports) {
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.

'use strict';

module.exports = Transform;

var Duplex = require('./_stream_duplex');

/*<replacement>*/
var util = Object.create(require('core-util-is'));
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(Transform, Duplex);

function afterTransform(er, data) {
  var ts = this._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb) {
    return this.emit('error', new Error('write callback called multiple times'));
  }

  ts.writechunk = null;
  ts.writecb = null;

  if (data != null) // single equals check for both `null` and `undefined`
    this.push(data);

  cb(er);

  var rs = this._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    this._read(rs.highWaterMark);
  }
}

function Transform(options) {
  if (!(this instanceof Transform)) return new Transform(options);

  Duplex.call(this, options);

  this._transformState = {
    afterTransform: afterTransform.bind(this),
    needTransform: false,
    transforming: false,
    writecb: null,
    writechunk: null,
    writeencoding: null
  };

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  if (options) {
    if (typeof options.transform === 'function') this._transform = options.transform;

    if (typeof options.flush === 'function') this._flush = options.flush;
  }

  // When the writable side finishes, then flush out anything remaining.
  this.on('prefinish', prefinish);
}

function prefinish() {
  var _this = this;

  if (typeof this._flush === 'function') {
    this._flush(function (er, data) {
      done(_this, er, data);
    });
  } else {
    done(this, null, null);
  }
}

Transform.prototype.push = function (chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function (chunk, encoding, cb) {
  throw new Error('_transform() is not implemented');
};

Transform.prototype._write = function (chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function (n) {
  var ts = this._transformState;

  if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};

Transform.prototype._destroy = function (err, cb) {
  var _this2 = this;

  Duplex.prototype._destroy.call(this, err, function (err2) {
    cb(err2);
    _this2.emit('close');
  });
};

function done(stream, er, data) {
  if (er) return stream.emit('error', er);

  if (data != null) // single equals check for both `null` and `undefined`
    stream.push(data);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  if (stream._writableState.length) throw new Error('Calling transform done when ws.length != 0');

  if (stream._transformState.transforming) throw new Error('Calling transform done when still transforming');

  return stream.push(null);
}
},{"./_stream_duplex":"../node_modules/readable-stream/lib/_stream_duplex.js","core-util-is":"../node_modules/core-util-is/lib/util.js","inherits":"../node_modules/inherits/inherits_browser.js"}],"../node_modules/readable-stream/lib/_stream_passthrough.js":[function(require,module,exports) {
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.

'use strict';

module.exports = PassThrough;

var Transform = require('./_stream_transform');

/*<replacement>*/
var util = Object.create(require('core-util-is'));
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough)) return new PassThrough(options);

  Transform.call(this, options);
}

PassThrough.prototype._transform = function (chunk, encoding, cb) {
  cb(null, chunk);
};
},{"./_stream_transform":"../node_modules/readable-stream/lib/_stream_transform.js","core-util-is":"../node_modules/core-util-is/lib/util.js","inherits":"../node_modules/inherits/inherits_browser.js"}],"../node_modules/readable-stream/readable-browser.js":[function(require,module,exports) {
exports = module.exports = require('./lib/_stream_readable.js');
exports.Stream = exports;
exports.Readable = exports;
exports.Writable = require('./lib/_stream_writable.js');
exports.Duplex = require('./lib/_stream_duplex.js');
exports.Transform = require('./lib/_stream_transform.js');
exports.PassThrough = require('./lib/_stream_passthrough.js');

},{"./lib/_stream_readable.js":"../node_modules/readable-stream/lib/_stream_readable.js","./lib/_stream_writable.js":"../node_modules/readable-stream/lib/_stream_writable.js","./lib/_stream_duplex.js":"../node_modules/readable-stream/lib/_stream_duplex.js","./lib/_stream_transform.js":"../node_modules/readable-stream/lib/_stream_transform.js","./lib/_stream_passthrough.js":"../node_modules/readable-stream/lib/_stream_passthrough.js"}],"../node_modules/readable-stream/writable-browser.js":[function(require,module,exports) {
module.exports = require('./lib/_stream_writable.js');

},{"./lib/_stream_writable.js":"../node_modules/readable-stream/lib/_stream_writable.js"}],"../node_modules/readable-stream/duplex-browser.js":[function(require,module,exports) {
module.exports = require('./lib/_stream_duplex.js');

},{"./lib/_stream_duplex.js":"../node_modules/readable-stream/lib/_stream_duplex.js"}],"../node_modules/readable-stream/transform.js":[function(require,module,exports) {
module.exports = require('./readable').Transform

},{"./readable":"../node_modules/readable-stream/readable-browser.js"}],"../node_modules/readable-stream/passthrough.js":[function(require,module,exports) {
module.exports = require('./readable').PassThrough

},{"./readable":"../node_modules/readable-stream/readable-browser.js"}],"../node_modules/stream-browserify/index.js":[function(require,module,exports) {
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = Stream;

var EE = require('events').EventEmitter;
var inherits = require('inherits');

inherits(Stream, EE);
Stream.Readable = require('readable-stream/readable.js');
Stream.Writable = require('readable-stream/writable.js');
Stream.Duplex = require('readable-stream/duplex.js');
Stream.Transform = require('readable-stream/transform.js');
Stream.PassThrough = require('readable-stream/passthrough.js');

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;



// old-style streams.  Note that the pipe method (the only relevant
// part of this class) is overridden in the Readable class.

function Stream() {
  EE.call(this);
}

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once.
  if (!dest._isStdio && (!options || options.end !== false)) {
    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    if (typeof dest.destroy === 'function') dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (EE.listenerCount(this, 'error') === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};

},{"events":"../node_modules/events/events.js","inherits":"../node_modules/inherits/inherits_browser.js","readable-stream/readable.js":"../node_modules/readable-stream/readable-browser.js","readable-stream/writable.js":"../node_modules/readable-stream/writable-browser.js","readable-stream/duplex.js":"../node_modules/readable-stream/duplex-browser.js","readable-stream/transform.js":"../node_modules/readable-stream/transform.js","readable-stream/passthrough.js":"../node_modules/readable-stream/passthrough.js"}],"../node_modules/string_decoder/lib/string_decoder.js":[function(require,module,exports) {

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

/*<replacement>*/

var Buffer = require('safe-buffer').Buffer;
/*</replacement>*/

var isEncoding = Buffer.isEncoding || function (encoding) {
  encoding = '' + encoding;
  switch (encoding && encoding.toLowerCase()) {
    case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':case 'raw':
      return true;
    default:
      return false;
  }
};

function _normalizeEncoding(enc) {
  if (!enc) return 'utf8';
  var retried;
  while (true) {
    switch (enc) {
      case 'utf8':
      case 'utf-8':
        return 'utf8';
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return 'utf16le';
      case 'latin1':
      case 'binary':
        return 'latin1';
      case 'base64':
      case 'ascii':
      case 'hex':
        return enc;
      default:
        if (retried) return; // undefined
        enc = ('' + enc).toLowerCase();
        retried = true;
    }
  }
};

// Do not cache `Buffer.isEncoding` when checking encoding names as some
// modules monkey-patch it to support additional encodings
function normalizeEncoding(enc) {
  var nenc = _normalizeEncoding(enc);
  if (typeof nenc !== 'string' && (Buffer.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);
  return nenc || enc;
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters.
exports.StringDecoder = StringDecoder;
function StringDecoder(encoding) {
  this.encoding = normalizeEncoding(encoding);
  var nb;
  switch (this.encoding) {
    case 'utf16le':
      this.text = utf16Text;
      this.end = utf16End;
      nb = 4;
      break;
    case 'utf8':
      this.fillLast = utf8FillLast;
      nb = 4;
      break;
    case 'base64':
      this.text = base64Text;
      this.end = base64End;
      nb = 3;
      break;
    default:
      this.write = simpleWrite;
      this.end = simpleEnd;
      return;
  }
  this.lastNeed = 0;
  this.lastTotal = 0;
  this.lastChar = Buffer.allocUnsafe(nb);
}

StringDecoder.prototype.write = function (buf) {
  if (buf.length === 0) return '';
  var r;
  var i;
  if (this.lastNeed) {
    r = this.fillLast(buf);
    if (r === undefined) return '';
    i = this.lastNeed;
    this.lastNeed = 0;
  } else {
    i = 0;
  }
  if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
  return r || '';
};

StringDecoder.prototype.end = utf8End;

// Returns only complete characters in a Buffer
StringDecoder.prototype.text = utf8Text;

// Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
StringDecoder.prototype.fillLast = function (buf) {
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
  this.lastNeed -= buf.length;
};

// Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
// continuation byte. If an invalid byte is detected, -2 is returned.
function utf8CheckByte(byte) {
  if (byte <= 0x7F) return 0;else if (byte >> 5 === 0x06) return 2;else if (byte >> 4 === 0x0E) return 3;else if (byte >> 3 === 0x1E) return 4;
  return byte >> 6 === 0x02 ? -1 : -2;
}

// Checks at most 3 bytes at the end of a Buffer in order to detect an
// incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
// needed to complete the UTF-8 character (if applicable) are returned.
function utf8CheckIncomplete(self, buf, i) {
  var j = buf.length - 1;
  if (j < i) return 0;
  var nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 1;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 2;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) {
      if (nb === 2) nb = 0;else self.lastNeed = nb - 3;
    }
    return nb;
  }
  return 0;
}

// Validates as many continuation bytes for a multi-byte UTF-8 character as
// needed or are available. If we see a non-continuation byte where we expect
// one, we "replace" the validated continuation bytes we've seen so far with
// a single UTF-8 replacement character ('\ufffd'), to match v8's UTF-8 decoding
// behavior. The continuation byte check is included three times in the case
// where all of the continuation bytes for a character exist in the same buffer.
// It is also done this way as a slight performance increase instead of using a
// loop.
function utf8CheckExtraBytes(self, buf, p) {
  if ((buf[0] & 0xC0) !== 0x80) {
    self.lastNeed = 0;
    return '\ufffd';
  }
  if (self.lastNeed > 1 && buf.length > 1) {
    if ((buf[1] & 0xC0) !== 0x80) {
      self.lastNeed = 1;
      return '\ufffd';
    }
    if (self.lastNeed > 2 && buf.length > 2) {
      if ((buf[2] & 0xC0) !== 0x80) {
        self.lastNeed = 2;
        return '\ufffd';
      }
    }
  }
}

// Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
function utf8FillLast(buf) {
  var p = this.lastTotal - this.lastNeed;
  var r = utf8CheckExtraBytes(this, buf, p);
  if (r !== undefined) return r;
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, p, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, p, 0, buf.length);
  this.lastNeed -= buf.length;
}

// Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
// partial character, the character's bytes are buffered until the required
// number of bytes are available.
function utf8Text(buf, i) {
  var total = utf8CheckIncomplete(this, buf, i);
  if (!this.lastNeed) return buf.toString('utf8', i);
  this.lastTotal = total;
  var end = buf.length - (total - this.lastNeed);
  buf.copy(this.lastChar, 0, end);
  return buf.toString('utf8', i, end);
}

// For UTF-8, a replacement character is added when ending on a partial
// character.
function utf8End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + '\ufffd';
  return r;
}

// UTF-16LE typically needs two bytes per character, but even if we have an even
// number of bytes available, we need to check if we end on a leading/high
// surrogate. In that case, we need to wait for the next two bytes in order to
// decode the last character properly.
function utf16Text(buf, i) {
  if ((buf.length - i) % 2 === 0) {
    var r = buf.toString('utf16le', i);
    if (r) {
      var c = r.charCodeAt(r.length - 1);
      if (c >= 0xD800 && c <= 0xDBFF) {
        this.lastNeed = 2;
        this.lastTotal = 4;
        this.lastChar[0] = buf[buf.length - 2];
        this.lastChar[1] = buf[buf.length - 1];
        return r.slice(0, -1);
      }
    }
    return r;
  }
  this.lastNeed = 1;
  this.lastTotal = 2;
  this.lastChar[0] = buf[buf.length - 1];
  return buf.toString('utf16le', i, buf.length - 1);
}

// For UTF-16LE we do not explicitly append special replacement characters if we
// end on a partial character, we simply let v8 handle that.
function utf16End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) {
    var end = this.lastTotal - this.lastNeed;
    return r + this.lastChar.toString('utf16le', 0, end);
  }
  return r;
}

function base64Text(buf, i) {
  var n = (buf.length - i) % 3;
  if (n === 0) return buf.toString('base64', i);
  this.lastNeed = 3 - n;
  this.lastTotal = 3;
  if (n === 1) {
    this.lastChar[0] = buf[buf.length - 1];
  } else {
    this.lastChar[0] = buf[buf.length - 2];
    this.lastChar[1] = buf[buf.length - 1];
  }
  return buf.toString('base64', i, buf.length - n);
}

function base64End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
  return r;
}

// Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
function simpleWrite(buf) {
  return buf.toString(this.encoding);
}

function simpleEnd(buf) {
  return buf && buf.length ? this.write(buf) : '';
}
},{"safe-buffer":"../node_modules/safe-buffer/index.js"}],"../node_modules/cipher-base/index.js":[function(require,module,exports) {

var Buffer = require('safe-buffer').Buffer
var Transform = require('stream').Transform
var StringDecoder = require('string_decoder').StringDecoder
var inherits = require('inherits')

function CipherBase (hashMode) {
  Transform.call(this)
  this.hashMode = typeof hashMode === 'string'
  if (this.hashMode) {
    this[hashMode] = this._finalOrDigest
  } else {
    this.final = this._finalOrDigest
  }
  if (this._final) {
    this.__final = this._final
    this._final = null
  }
  this._decoder = null
  this._encoding = null
}
inherits(CipherBase, Transform)

CipherBase.prototype.update = function (data, inputEnc, outputEnc) {
  if (typeof data === 'string') {
    data = Buffer.from(data, inputEnc)
  }

  var outData = this._update(data)
  if (this.hashMode) return this

  if (outputEnc) {
    outData = this._toString(outData, outputEnc)
  }

  return outData
}

CipherBase.prototype.setAutoPadding = function () {}
CipherBase.prototype.getAuthTag = function () {
  throw new Error('trying to get auth tag in unsupported state')
}

CipherBase.prototype.setAuthTag = function () {
  throw new Error('trying to set auth tag in unsupported state')
}

CipherBase.prototype.setAAD = function () {
  throw new Error('trying to set aad in unsupported state')
}

CipherBase.prototype._transform = function (data, _, next) {
  var err
  try {
    if (this.hashMode) {
      this._update(data)
    } else {
      this.push(this._update(data))
    }
  } catch (e) {
    err = e
  } finally {
    next(err)
  }
}
CipherBase.prototype._flush = function (done) {
  var err
  try {
    this.push(this.__final())
  } catch (e) {
    err = e
  }

  done(err)
}
CipherBase.prototype._finalOrDigest = function (outputEnc) {
  var outData = this.__final() || Buffer.alloc(0)
  if (outputEnc) {
    outData = this._toString(outData, outputEnc, true)
  }
  return outData
}

CipherBase.prototype._toString = function (value, enc, fin) {
  if (!this._decoder) {
    this._decoder = new StringDecoder(enc)
    this._encoding = enc
  }

  if (this._encoding !== enc) throw new Error('can\'t switch encodings')

  var out = this._decoder.write(value)
  if (fin) {
    out += this._decoder.end()
  }

  return out
}

module.exports = CipherBase

},{"safe-buffer":"../node_modules/safe-buffer/index.js","stream":"../node_modules/stream-browserify/index.js","string_decoder":"../node_modules/string_decoder/lib/string_decoder.js","inherits":"../node_modules/inherits/inherits_browser.js"}],"../node_modules/create-hmac/legacy.js":[function(require,module,exports) {

'use strict'
var inherits = require('inherits')
var Buffer = require('safe-buffer').Buffer

var Base = require('cipher-base')

var ZEROS = Buffer.alloc(128)
var blocksize = 64

function Hmac (alg, key) {
  Base.call(this, 'digest')
  if (typeof key === 'string') {
    key = Buffer.from(key)
  }

  this._alg = alg
  this._key = key

  if (key.length > blocksize) {
    key = alg(key)
  } else if (key.length < blocksize) {
    key = Buffer.concat([key, ZEROS], blocksize)
  }

  var ipad = this._ipad = Buffer.allocUnsafe(blocksize)
  var opad = this._opad = Buffer.allocUnsafe(blocksize)

  for (var i = 0; i < blocksize; i++) {
    ipad[i] = key[i] ^ 0x36
    opad[i] = key[i] ^ 0x5C
  }

  this._hash = [ipad]
}

inherits(Hmac, Base)

Hmac.prototype._update = function (data) {
  this._hash.push(data)
}

Hmac.prototype._final = function () {
  var h = this._alg(Buffer.concat(this._hash))
  return this._alg(Buffer.concat([this._opad, h]))
}
module.exports = Hmac

},{"inherits":"../node_modules/inherits/inherits_browser.js","safe-buffer":"../node_modules/safe-buffer/index.js","cipher-base":"../node_modules/cipher-base/index.js"}],"../node_modules/hash-base/node_modules/readable-stream/lib/internal/streams/stream-browser.js":[function(require,module,exports) {
module.exports = require('events').EventEmitter;
},{"events":"../node_modules/events/events.js"}],"../node_modules/hash-base/node_modules/readable-stream/lib/internal/streams/buffer_list.js":[function(require,module,exports) {

'use strict';

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    });
    keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }

  return target;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

var _require = require('buffer'),
    Buffer = _require.Buffer;

var _require2 = require('util'),
    inspect = _require2.inspect;

var custom = inspect && inspect.custom || 'inspect';

function copyBuffer(src, target, offset) {
  Buffer.prototype.copy.call(src, target, offset);
}

module.exports = /*#__PURE__*/function () {
  function BufferList() {
    _classCallCheck(this, BufferList);

    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  _createClass(BufferList, [{
    key: "push",
    value: function push(v) {
      var entry = {
        data: v,
        next: null
      };
      if (this.length > 0) this.tail.next = entry;else this.head = entry;
      this.tail = entry;
      ++this.length;
    }
  }, {
    key: "unshift",
    value: function unshift(v) {
      var entry = {
        data: v,
        next: this.head
      };
      if (this.length === 0) this.tail = entry;
      this.head = entry;
      ++this.length;
    }
  }, {
    key: "shift",
    value: function shift() {
      if (this.length === 0) return;
      var ret = this.head.data;
      if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
      --this.length;
      return ret;
    }
  }, {
    key: "clear",
    value: function clear() {
      this.head = this.tail = null;
      this.length = 0;
    }
  }, {
    key: "join",
    value: function join(s) {
      if (this.length === 0) return '';
      var p = this.head;
      var ret = '' + p.data;

      while (p = p.next) {
        ret += s + p.data;
      }

      return ret;
    }
  }, {
    key: "concat",
    value: function concat(n) {
      if (this.length === 0) return Buffer.alloc(0);
      var ret = Buffer.allocUnsafe(n >>> 0);
      var p = this.head;
      var i = 0;

      while (p) {
        copyBuffer(p.data, ret, i);
        i += p.data.length;
        p = p.next;
      }

      return ret;
    } // Consumes a specified amount of bytes or characters from the buffered data.

  }, {
    key: "consume",
    value: function consume(n, hasStrings) {
      var ret;

      if (n < this.head.data.length) {
        // `slice` is the same for buffers and strings.
        ret = this.head.data.slice(0, n);
        this.head.data = this.head.data.slice(n);
      } else if (n === this.head.data.length) {
        // First chunk is a perfect match.
        ret = this.shift();
      } else {
        // Result spans more than one buffer.
        ret = hasStrings ? this._getString(n) : this._getBuffer(n);
      }

      return ret;
    }
  }, {
    key: "first",
    value: function first() {
      return this.head.data;
    } // Consumes a specified amount of characters from the buffered data.

  }, {
    key: "_getString",
    value: function _getString(n) {
      var p = this.head;
      var c = 1;
      var ret = p.data;
      n -= ret.length;

      while (p = p.next) {
        var str = p.data;
        var nb = n > str.length ? str.length : n;
        if (nb === str.length) ret += str;else ret += str.slice(0, n);
        n -= nb;

        if (n === 0) {
          if (nb === str.length) {
            ++c;
            if (p.next) this.head = p.next;else this.head = this.tail = null;
          } else {
            this.head = p;
            p.data = str.slice(nb);
          }

          break;
        }

        ++c;
      }

      this.length -= c;
      return ret;
    } // Consumes a specified amount of bytes from the buffered data.

  }, {
    key: "_getBuffer",
    value: function _getBuffer(n) {
      var ret = Buffer.allocUnsafe(n);
      var p = this.head;
      var c = 1;
      p.data.copy(ret);
      n -= p.data.length;

      while (p = p.next) {
        var buf = p.data;
        var nb = n > buf.length ? buf.length : n;
        buf.copy(ret, ret.length - n, 0, nb);
        n -= nb;

        if (n === 0) {
          if (nb === buf.length) {
            ++c;
            if (p.next) this.head = p.next;else this.head = this.tail = null;
          } else {
            this.head = p;
            p.data = buf.slice(nb);
          }

          break;
        }

        ++c;
      }

      this.length -= c;
      return ret;
    } // Make sure the linked list only shows the minimal necessary information.

  }, {
    key: custom,
    value: function value(_, options) {
      return inspect(this, _objectSpread({}, options, {
        // Only inspect one level.
        depth: 0,
        // It should not recurse.
        customInspect: false
      }));
    }
  }]);

  return BufferList;
}();
},{"buffer":"../node_modules/buffer/index.js","util":"../node_modules/parcel-bundler/src/builtins/_empty.js"}],"../node_modules/hash-base/node_modules/readable-stream/lib/internal/streams/destroy.js":[function(require,module,exports) {
var process = require("process");
'use strict'; // undocumented cb() API, needed for core, not for public API

function destroy(err, cb) {
  var _this = this;

  var readableDestroyed = this._readableState && this._readableState.destroyed;
  var writableDestroyed = this._writableState && this._writableState.destroyed;

  if (readableDestroyed || writableDestroyed) {
    if (cb) {
      cb(err);
    } else if (err) {
      if (!this._writableState) {
        process.nextTick(emitErrorNT, this, err);
      } else if (!this._writableState.errorEmitted) {
        this._writableState.errorEmitted = true;
        process.nextTick(emitErrorNT, this, err);
      }
    }

    return this;
  } // we set destroyed to true before firing error callbacks in order
  // to make it re-entrance safe in case destroy() is called within callbacks


  if (this._readableState) {
    this._readableState.destroyed = true;
  } // if this is a duplex stream mark the writable part as destroyed as well


  if (this._writableState) {
    this._writableState.destroyed = true;
  }

  this._destroy(err || null, function (err) {
    if (!cb && err) {
      if (!_this._writableState) {
        process.nextTick(emitErrorAndCloseNT, _this, err);
      } else if (!_this._writableState.errorEmitted) {
        _this._writableState.errorEmitted = true;
        process.nextTick(emitErrorAndCloseNT, _this, err);
      } else {
        process.nextTick(emitCloseNT, _this);
      }
    } else if (cb) {
      process.nextTick(emitCloseNT, _this);
      cb(err);
    } else {
      process.nextTick(emitCloseNT, _this);
    }
  });

  return this;
}

function emitErrorAndCloseNT(self, err) {
  emitErrorNT(self, err);
  emitCloseNT(self);
}

function emitCloseNT(self) {
  if (self._writableState && !self._writableState.emitClose) return;
  if (self._readableState && !self._readableState.emitClose) return;
  self.emit('close');
}

function undestroy() {
  if (this._readableState) {
    this._readableState.destroyed = false;
    this._readableState.reading = false;
    this._readableState.ended = false;
    this._readableState.endEmitted = false;
  }

  if (this._writableState) {
    this._writableState.destroyed = false;
    this._writableState.ended = false;
    this._writableState.ending = false;
    this._writableState.finalCalled = false;
    this._writableState.prefinished = false;
    this._writableState.finished = false;
    this._writableState.errorEmitted = false;
  }
}

function emitErrorNT(self, err) {
  self.emit('error', err);
}

function errorOrDestroy(stream, err) {
  // We have tests that rely on errors being emitted
  // in the same tick, so changing this is semver major.
  // For now when you opt-in to autoDestroy we allow
  // the error to be emitted nextTick. In a future
  // semver major update we should change the default to this.
  var rState = stream._readableState;
  var wState = stream._writableState;
  if (rState && rState.autoDestroy || wState && wState.autoDestroy) stream.destroy(err);else stream.emit('error', err);
}

module.exports = {
  destroy: destroy,
  undestroy: undestroy,
  errorOrDestroy: errorOrDestroy
};
},{"process":"../node_modules/process/browser.js"}],"../node_modules/hash-base/node_modules/readable-stream/errors-browser.js":[function(require,module,exports) {
'use strict';

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function (obj) { return typeof obj; }; } else { _typeof = function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;
  subClass.__proto__ = superClass;
}

var codes = {};

function createErrorType(code, message, Base) {
  if (!Base) {
    Base = Error;
  }

  function getMessage(arg1, arg2, arg3) {
    if (typeof message === 'string') {
      return message;
    } else {
      return message(arg1, arg2, arg3);
    }
  }

  var NodeError = /*#__PURE__*/function (_Base) {
    _inheritsLoose(NodeError, _Base);

    function NodeError(arg1, arg2, arg3) {
      return _Base.call(this, getMessage(arg1, arg2, arg3)) || this;
    }

    return NodeError;
  }(Base);

  NodeError.prototype.name = Base.name;
  NodeError.prototype.code = code;
  codes[code] = NodeError;
} // https://github.com/nodejs/node/blob/v10.8.0/lib/internal/errors.js


function oneOf(expected, thing) {
  if (Array.isArray(expected)) {
    var len = expected.length;
    expected = expected.map(function (i) {
      return String(i);
    });

    if (len > 2) {
      return "one of ".concat(thing, " ").concat(expected.slice(0, len - 1).join(', '), ", or ") + expected[len - 1];
    } else if (len === 2) {
      return "one of ".concat(thing, " ").concat(expected[0], " or ").concat(expected[1]);
    } else {
      return "of ".concat(thing, " ").concat(expected[0]);
    }
  } else {
    return "of ".concat(thing, " ").concat(String(expected));
  }
} // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith


function startsWith(str, search, pos) {
  return str.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
} // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith


function endsWith(str, search, this_len) {
  if (this_len === undefined || this_len > str.length) {
    this_len = str.length;
  }

  return str.substring(this_len - search.length, this_len) === search;
} // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/includes


function includes(str, search, start) {
  if (typeof start !== 'number') {
    start = 0;
  }

  if (start + search.length > str.length) {
    return false;
  } else {
    return str.indexOf(search, start) !== -1;
  }
}

createErrorType('ERR_INVALID_OPT_VALUE', function (name, value) {
  return 'The value "' + value + '" is invalid for option "' + name + '"';
}, TypeError);
createErrorType('ERR_INVALID_ARG_TYPE', function (name, expected, actual) {
  // determiner: 'must be' or 'must not be'
  var determiner;

  if (typeof expected === 'string' && startsWith(expected, 'not ')) {
    determiner = 'must not be';
    expected = expected.replace(/^not /, '');
  } else {
    determiner = 'must be';
  }

  var msg;

  if (endsWith(name, ' argument')) {
    // For cases like 'first argument'
    msg = "The ".concat(name, " ").concat(determiner, " ").concat(oneOf(expected, 'type'));
  } else {
    var type = includes(name, '.') ? 'property' : 'argument';
    msg = "The \"".concat(name, "\" ").concat(type, " ").concat(determiner, " ").concat(oneOf(expected, 'type'));
  }

  msg += ". Received type ".concat(_typeof(actual));
  return msg;
}, TypeError);
createErrorType('ERR_STREAM_PUSH_AFTER_EOF', 'stream.push() after EOF');
createErrorType('ERR_METHOD_NOT_IMPLEMENTED', function (name) {
  return 'The ' + name + ' method is not implemented';
});
createErrorType('ERR_STREAM_PREMATURE_CLOSE', 'Premature close');
createErrorType('ERR_STREAM_DESTROYED', function (name) {
  return 'Cannot call ' + name + ' after a stream was destroyed';
});
createErrorType('ERR_MULTIPLE_CALLBACK', 'Callback called multiple times');
createErrorType('ERR_STREAM_CANNOT_PIPE', 'Cannot pipe, not readable');
createErrorType('ERR_STREAM_WRITE_AFTER_END', 'write after end');
createErrorType('ERR_STREAM_NULL_VALUES', 'May not write null values to stream', TypeError);
createErrorType('ERR_UNKNOWN_ENCODING', function (arg) {
  return 'Unknown encoding: ' + arg;
}, TypeError);
createErrorType('ERR_STREAM_UNSHIFT_AFTER_END_EVENT', 'stream.unshift() after end event');
module.exports.codes = codes;
},{}],"../node_modules/hash-base/node_modules/readable-stream/lib/internal/streams/state.js":[function(require,module,exports) {
'use strict';

var ERR_INVALID_OPT_VALUE = require('../../../errors').codes.ERR_INVALID_OPT_VALUE;

function highWaterMarkFrom(options, isDuplex, duplexKey) {
  return options.highWaterMark != null ? options.highWaterMark : isDuplex ? options[duplexKey] : null;
}

function getHighWaterMark(state, options, duplexKey, isDuplex) {
  var hwm = highWaterMarkFrom(options, isDuplex, duplexKey);

  if (hwm != null) {
    if (!(isFinite(hwm) && Math.floor(hwm) === hwm) || hwm < 0) {
      var name = isDuplex ? duplexKey : 'highWaterMark';
      throw new ERR_INVALID_OPT_VALUE(name, hwm);
    }

    return Math.floor(hwm);
  } // Default value


  return state.objectMode ? 16 : 16 * 1024;
}

module.exports = {
  getHighWaterMark: getHighWaterMark
};
},{"../../../errors":"../node_modules/hash-base/node_modules/readable-stream/errors-browser.js"}],"../node_modules/hash-base/node_modules/readable-stream/lib/_stream_writable.js":[function(require,module,exports) {

var global = arguments[3];
var process = require("process");
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
// A bit simpler than readable streams.
// Implement an async ._write(chunk, encoding, cb), and it'll handle all
// the drain event emission and buffering.
'use strict';

module.exports = Writable;
/* <replacement> */

function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
  this.next = null;
} // It seems a linked list but it is not
// there will be only 2 of these for each stream


function CorkedRequest(state) {
  var _this = this;

  this.next = null;
  this.entry = null;

  this.finish = function () {
    onCorkedFinish(_this, state);
  };
}
/* </replacement> */

/*<replacement>*/


var Duplex;
/*</replacement>*/

Writable.WritableState = WritableState;
/*<replacement>*/

var internalUtil = {
  deprecate: require('util-deprecate')
};
/*</replacement>*/

/*<replacement>*/

var Stream = require('./internal/streams/stream');
/*</replacement>*/


var Buffer = require('buffer').Buffer;

var OurUint8Array = global.Uint8Array || function () {};

function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}

function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}

var destroyImpl = require('./internal/streams/destroy');

var _require = require('./internal/streams/state'),
    getHighWaterMark = _require.getHighWaterMark;

var _require$codes = require('../errors').codes,
    ERR_INVALID_ARG_TYPE = _require$codes.ERR_INVALID_ARG_TYPE,
    ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED,
    ERR_MULTIPLE_CALLBACK = _require$codes.ERR_MULTIPLE_CALLBACK,
    ERR_STREAM_CANNOT_PIPE = _require$codes.ERR_STREAM_CANNOT_PIPE,
    ERR_STREAM_DESTROYED = _require$codes.ERR_STREAM_DESTROYED,
    ERR_STREAM_NULL_VALUES = _require$codes.ERR_STREAM_NULL_VALUES,
    ERR_STREAM_WRITE_AFTER_END = _require$codes.ERR_STREAM_WRITE_AFTER_END,
    ERR_UNKNOWN_ENCODING = _require$codes.ERR_UNKNOWN_ENCODING;

var errorOrDestroy = destroyImpl.errorOrDestroy;

require('inherits')(Writable, Stream);

function nop() {}

function WritableState(options, stream, isDuplex) {
  Duplex = Duplex || require('./_stream_duplex');
  options = options || {}; // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream,
  // e.g. options.readableObjectMode vs. options.writableObjectMode, etc.

  if (typeof isDuplex !== 'boolean') isDuplex = stream instanceof Duplex; // object stream flag to indicate whether or not this stream
  // contains buffers or objects.

  this.objectMode = !!options.objectMode;
  if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode; // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()

  this.highWaterMark = getHighWaterMark(this, options, 'writableHighWaterMark', isDuplex); // if _final has been called

  this.finalCalled = false; // drain event flag.

  this.needDrain = false; // at the start of calling end()

  this.ending = false; // when end() has been called, and returned

  this.ended = false; // when 'finish' is emitted

  this.finished = false; // has it been destroyed

  this.destroyed = false; // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.

  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode; // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.

  this.defaultEncoding = options.defaultEncoding || 'utf8'; // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.

  this.length = 0; // a flag to see when we're in the middle of a write.

  this.writing = false; // when true all writes will be buffered until .uncork() call

  this.corked = 0; // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.

  this.sync = true; // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.

  this.bufferProcessing = false; // the callback that's passed to _write(chunk,cb)

  this.onwrite = function (er) {
    onwrite(stream, er);
  }; // the callback that the user supplies to write(chunk,encoding,cb)


  this.writecb = null; // the amount that is being written when _write is called.

  this.writelen = 0;
  this.bufferedRequest = null;
  this.lastBufferedRequest = null; // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted

  this.pendingcb = 0; // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams

  this.prefinished = false; // True if the error was already emitted and should not be thrown again

  this.errorEmitted = false; // Should close be emitted on destroy. Defaults to true.

  this.emitClose = options.emitClose !== false; // Should .destroy() be called after 'finish' (and potentially 'end')

  this.autoDestroy = !!options.autoDestroy; // count buffered requests

  this.bufferedRequestCount = 0; // allocate the first CorkedRequest, there is always
  // one allocated and free to use, and we maintain at most two

  this.corkedRequestsFree = new CorkedRequest(this);
}

WritableState.prototype.getBuffer = function getBuffer() {
  var current = this.bufferedRequest;
  var out = [];

  while (current) {
    out.push(current);
    current = current.next;
  }

  return out;
};

(function () {
  try {
    Object.defineProperty(WritableState.prototype, 'buffer', {
      get: internalUtil.deprecate(function writableStateBufferGetter() {
        return this.getBuffer();
      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.', 'DEP0003')
    });
  } catch (_) {}
})(); // Test _writableState for inheritance to account for Duplex streams,
// whose prototype chain only points to Readable.


var realHasInstance;

if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
  realHasInstance = Function.prototype[Symbol.hasInstance];
  Object.defineProperty(Writable, Symbol.hasInstance, {
    value: function value(object) {
      if (realHasInstance.call(this, object)) return true;
      if (this !== Writable) return false;
      return object && object._writableState instanceof WritableState;
    }
  });
} else {
  realHasInstance = function realHasInstance(object) {
    return object instanceof this;
  };
}

function Writable(options) {
  Duplex = Duplex || require('./_stream_duplex'); // Writable ctor is applied to Duplexes, too.
  // `realHasInstance` is necessary because using plain `instanceof`
  // would return false, as no `_writableState` property is attached.
  // Trying to use the custom `instanceof` for Writable here will also break the
  // Node.js LazyTransform implementation, which has a non-trivial getter for
  // `_writableState` that would lead to infinite recursion.
  // Checking for a Stream.Duplex instance is faster here instead of inside
  // the WritableState constructor, at least with V8 6.5

  var isDuplex = this instanceof Duplex;
  if (!isDuplex && !realHasInstance.call(Writable, this)) return new Writable(options);
  this._writableState = new WritableState(options, this, isDuplex); // legacy.

  this.writable = true;

  if (options) {
    if (typeof options.write === 'function') this._write = options.write;
    if (typeof options.writev === 'function') this._writev = options.writev;
    if (typeof options.destroy === 'function') this._destroy = options.destroy;
    if (typeof options.final === 'function') this._final = options.final;
  }

  Stream.call(this);
} // Otherwise people can pipe Writable streams, which is just wrong.


Writable.prototype.pipe = function () {
  errorOrDestroy(this, new ERR_STREAM_CANNOT_PIPE());
};

function writeAfterEnd(stream, cb) {
  var er = new ERR_STREAM_WRITE_AFTER_END(); // TODO: defer error events consistently everywhere, not just the cb

  errorOrDestroy(stream, er);
  process.nextTick(cb, er);
} // Checks that a user-supplied chunk is valid, especially for the particular
// mode the stream is in. Currently this means that `null` is never accepted
// and undefined/non-string values are only allowed in object mode.


function validChunk(stream, state, chunk, cb) {
  var er;

  if (chunk === null) {
    er = new ERR_STREAM_NULL_VALUES();
  } else if (typeof chunk !== 'string' && !state.objectMode) {
    er = new ERR_INVALID_ARG_TYPE('chunk', ['string', 'Buffer'], chunk);
  }

  if (er) {
    errorOrDestroy(stream, er);
    process.nextTick(cb, er);
    return false;
  }

  return true;
}

Writable.prototype.write = function (chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;

  var isBuf = !state.objectMode && _isUint8Array(chunk);

  if (isBuf && !Buffer.isBuffer(chunk)) {
    chunk = _uint8ArrayToBuffer(chunk);
  }

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (isBuf) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;
  if (typeof cb !== 'function') cb = nop;
  if (state.ending) writeAfterEnd(this, cb);else if (isBuf || validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
  }
  return ret;
};

Writable.prototype.cork = function () {
  this._writableState.corked++;
};

Writable.prototype.uncork = function () {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;
    if (!state.writing && !state.corked && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
  }
};

Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new ERR_UNKNOWN_ENCODING(encoding);
  this._writableState.defaultEncoding = encoding;
  return this;
};

Object.defineProperty(Writable.prototype, 'writableBuffer', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState && this._writableState.getBuffer();
  }
});

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
    chunk = Buffer.from(chunk, encoding);
  }

  return chunk;
}

Object.defineProperty(Writable.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState.highWaterMark;
  }
}); // if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.

function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
  if (!isBuf) {
    var newChunk = decodeChunk(state, chunk, encoding);

    if (chunk !== newChunk) {
      isBuf = true;
      encoding = 'buffer';
      chunk = newChunk;
    }
  }

  var len = state.objectMode ? 1 : chunk.length;
  state.length += len;
  var ret = state.length < state.highWaterMark; // we must ensure that previous needDrain will not be reset to false.

  if (!ret) state.needDrain = true;

  if (state.writing || state.corked) {
    var last = state.lastBufferedRequest;
    state.lastBufferedRequest = {
      chunk: chunk,
      encoding: encoding,
      isBuf: isBuf,
      callback: cb,
      next: null
    };

    if (last) {
      last.next = state.lastBufferedRequest;
    } else {
      state.bufferedRequest = state.lastBufferedRequest;
    }

    state.bufferedRequestCount += 1;
  } else {
    doWrite(stream, state, false, len, chunk, encoding, cb);
  }

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (state.destroyed) state.onwrite(new ERR_STREAM_DESTROYED('write'));else if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  --state.pendingcb;

  if (sync) {
    // defer the callback if we are being called synchronously
    // to avoid piling up things on the stack
    process.nextTick(cb, er); // this can emit finish, and it will always happen
    // after error

    process.nextTick(finishMaybe, stream, state);
    stream._writableState.errorEmitted = true;
    errorOrDestroy(stream, er);
  } else {
    // the caller expect this to happen before if
    // it is async
    cb(er);
    stream._writableState.errorEmitted = true;
    errorOrDestroy(stream, er); // this can emit finish, but finish must
    // always follow error

    finishMaybe(stream, state);
  }
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;
  if (typeof cb !== 'function') throw new ERR_MULTIPLE_CALLBACK();
  onwriteStateUpdate(state);
  if (er) onwriteError(stream, state, sync, er, cb);else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(state) || stream.destroyed;

    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
      clearBuffer(stream, state);
    }

    if (sync) {
      process.nextTick(afterWrite, stream, state, finished, cb);
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished) onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
} // Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.


function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
} // if there's something in the buffer waiting, then process it


function clearBuffer(stream, state) {
  state.bufferProcessing = true;
  var entry = state.bufferedRequest;

  if (stream._writev && entry && entry.next) {
    // Fast case, write everything using _writev()
    var l = state.bufferedRequestCount;
    var buffer = new Array(l);
    var holder = state.corkedRequestsFree;
    holder.entry = entry;
    var count = 0;
    var allBuffers = true;

    while (entry) {
      buffer[count] = entry;
      if (!entry.isBuf) allBuffers = false;
      entry = entry.next;
      count += 1;
    }

    buffer.allBuffers = allBuffers;
    doWrite(stream, state, true, state.length, buffer, '', holder.finish); // doWrite is almost always async, defer these to save a bit of time
    // as the hot path ends with doWrite

    state.pendingcb++;
    state.lastBufferedRequest = null;

    if (holder.next) {
      state.corkedRequestsFree = holder.next;
      holder.next = null;
    } else {
      state.corkedRequestsFree = new CorkedRequest(state);
    }

    state.bufferedRequestCount = 0;
  } else {
    // Slow case, write chunks one-by-one
    while (entry) {
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;
      doWrite(stream, state, false, len, chunk, encoding, cb);
      entry = entry.next;
      state.bufferedRequestCount--; // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.

      if (state.writing) {
        break;
      }
    }

    if (entry === null) state.lastBufferedRequest = null;
  }

  state.bufferedRequest = entry;
  state.bufferProcessing = false;
}

Writable.prototype._write = function (chunk, encoding, cb) {
  cb(new ERR_METHOD_NOT_IMPLEMENTED('_write()'));
};

Writable.prototype._writev = null;

Writable.prototype.end = function (chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding); // .end() fully uncorks

  if (state.corked) {
    state.corked = 1;
    this.uncork();
  } // ignore unnecessary end() calls.


  if (!state.ending) endWritable(this, state, cb);
  return this;
};

Object.defineProperty(Writable.prototype, 'writableLength', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState.length;
  }
});

function needFinish(state) {
  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
}

function callFinal(stream, state) {
  stream._final(function (err) {
    state.pendingcb--;

    if (err) {
      errorOrDestroy(stream, err);
    }

    state.prefinished = true;
    stream.emit('prefinish');
    finishMaybe(stream, state);
  });
}

function prefinish(stream, state) {
  if (!state.prefinished && !state.finalCalled) {
    if (typeof stream._final === 'function' && !state.destroyed) {
      state.pendingcb++;
      state.finalCalled = true;
      process.nextTick(callFinal, stream, state);
    } else {
      state.prefinished = true;
      stream.emit('prefinish');
    }
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(state);

  if (need) {
    prefinish(stream, state);

    if (state.pendingcb === 0) {
      state.finished = true;
      stream.emit('finish');

      if (state.autoDestroy) {
        // In case of duplex streams we need a way to detect
        // if the readable side is ready for autoDestroy as well
        var rState = stream._readableState;

        if (!rState || rState.autoDestroy && rState.endEmitted) {
          stream.destroy();
        }
      }
    }
  }

  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);

  if (cb) {
    if (state.finished) process.nextTick(cb);else stream.once('finish', cb);
  }

  state.ended = true;
  stream.writable = false;
}

function onCorkedFinish(corkReq, state, err) {
  var entry = corkReq.entry;
  corkReq.entry = null;

  while (entry) {
    var cb = entry.callback;
    state.pendingcb--;
    cb(err);
    entry = entry.next;
  } // reuse the free corkReq.


  state.corkedRequestsFree.next = corkReq;
}

Object.defineProperty(Writable.prototype, 'destroyed', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    if (this._writableState === undefined) {
      return false;
    }

    return this._writableState.destroyed;
  },
  set: function set(value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._writableState) {
      return;
    } // backward compatibility, the user is explicitly
    // managing destroyed


    this._writableState.destroyed = value;
  }
});
Writable.prototype.destroy = destroyImpl.destroy;
Writable.prototype._undestroy = destroyImpl.undestroy;

Writable.prototype._destroy = function (err, cb) {
  cb(err);
};
},{"util-deprecate":"../node_modules/util-deprecate/browser.js","./internal/streams/stream":"../node_modules/hash-base/node_modules/readable-stream/lib/internal/streams/stream-browser.js","buffer":"../node_modules/buffer/index.js","./internal/streams/destroy":"../node_modules/hash-base/node_modules/readable-stream/lib/internal/streams/destroy.js","./internal/streams/state":"../node_modules/hash-base/node_modules/readable-stream/lib/internal/streams/state.js","../errors":"../node_modules/hash-base/node_modules/readable-stream/errors-browser.js","inherits":"../node_modules/inherits/inherits_browser.js","./_stream_duplex":"../node_modules/hash-base/node_modules/readable-stream/lib/_stream_duplex.js","process":"../node_modules/process/browser.js"}],"../node_modules/hash-base/node_modules/readable-stream/lib/_stream_duplex.js":[function(require,module,exports) {
var process = require("process");
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.
'use strict';
/*<replacement>*/

var objectKeys = Object.keys || function (obj) {
  var keys = [];

  for (var key in obj) {
    keys.push(key);
  }

  return keys;
};
/*</replacement>*/


module.exports = Duplex;

var Readable = require('./_stream_readable');

var Writable = require('./_stream_writable');

require('inherits')(Duplex, Readable);

{
  // Allow the keys array to be GC'ed.
  var keys = objectKeys(Writable.prototype);

  for (var v = 0; v < keys.length; v++) {
    var method = keys[v];
    if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
  }
}

function Duplex(options) {
  if (!(this instanceof Duplex)) return new Duplex(options);
  Readable.call(this, options);
  Writable.call(this, options);
  this.allowHalfOpen = true;

  if (options) {
    if (options.readable === false) this.readable = false;
    if (options.writable === false) this.writable = false;

    if (options.allowHalfOpen === false) {
      this.allowHalfOpen = false;
      this.once('end', onend);
    }
  }
}

Object.defineProperty(Duplex.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState.highWaterMark;
  }
});
Object.defineProperty(Duplex.prototype, 'writableBuffer', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState && this._writableState.getBuffer();
  }
});
Object.defineProperty(Duplex.prototype, 'writableLength', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState.length;
  }
}); // the no-half-open enforcer

function onend() {
  // If the writable side ended, then we're ok.
  if (this._writableState.ended) return; // no more data can be written.
  // But allow more writes to happen in this tick.

  process.nextTick(onEndNT, this);
}

function onEndNT(self) {
  self.end();
}

Object.defineProperty(Duplex.prototype, 'destroyed', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    if (this._readableState === undefined || this._writableState === undefined) {
      return false;
    }

    return this._readableState.destroyed && this._writableState.destroyed;
  },
  set: function set(value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (this._readableState === undefined || this._writableState === undefined) {
      return;
    } // backward compatibility, the user is explicitly
    // managing destroyed


    this._readableState.destroyed = value;
    this._writableState.destroyed = value;
  }
});
},{"./_stream_readable":"../node_modules/hash-base/node_modules/readable-stream/lib/_stream_readable.js","./_stream_writable":"../node_modules/hash-base/node_modules/readable-stream/lib/_stream_writable.js","inherits":"../node_modules/inherits/inherits_browser.js","process":"../node_modules/process/browser.js"}],"../node_modules/hash-base/node_modules/readable-stream/lib/internal/streams/end-of-stream.js":[function(require,module,exports) {
// Ported from https://github.com/mafintosh/end-of-stream with
// permission from the author, Mathias Buus (@mafintosh).
'use strict';

var ERR_STREAM_PREMATURE_CLOSE = require('../../../errors').codes.ERR_STREAM_PREMATURE_CLOSE;

function once(callback) {
  var called = false;
  return function () {
    if (called) return;
    called = true;

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    callback.apply(this, args);
  };
}

function noop() {}

function isRequest(stream) {
  return stream.setHeader && typeof stream.abort === 'function';
}

function eos(stream, opts, callback) {
  if (typeof opts === 'function') return eos(stream, null, opts);
  if (!opts) opts = {};
  callback = once(callback || noop);
  var readable = opts.readable || opts.readable !== false && stream.readable;
  var writable = opts.writable || opts.writable !== false && stream.writable;

  var onlegacyfinish = function onlegacyfinish() {
    if (!stream.writable) onfinish();
  };

  var writableEnded = stream._writableState && stream._writableState.finished;

  var onfinish = function onfinish() {
    writable = false;
    writableEnded = true;
    if (!readable) callback.call(stream);
  };

  var readableEnded = stream._readableState && stream._readableState.endEmitted;

  var onend = function onend() {
    readable = false;
    readableEnded = true;
    if (!writable) callback.call(stream);
  };

  var onerror = function onerror(err) {
    callback.call(stream, err);
  };

  var onclose = function onclose() {
    var err;

    if (readable && !readableEnded) {
      if (!stream._readableState || !stream._readableState.ended) err = new ERR_STREAM_PREMATURE_CLOSE();
      return callback.call(stream, err);
    }

    if (writable && !writableEnded) {
      if (!stream._writableState || !stream._writableState.ended) err = new ERR_STREAM_PREMATURE_CLOSE();
      return callback.call(stream, err);
    }
  };

  var onrequest = function onrequest() {
    stream.req.on('finish', onfinish);
  };

  if (isRequest(stream)) {
    stream.on('complete', onfinish);
    stream.on('abort', onclose);
    if (stream.req) onrequest();else stream.on('request', onrequest);
  } else if (writable && !stream._writableState) {
    // legacy streams
    stream.on('end', onlegacyfinish);
    stream.on('close', onlegacyfinish);
  }

  stream.on('end', onend);
  stream.on('finish', onfinish);
  if (opts.error !== false) stream.on('error', onerror);
  stream.on('close', onclose);
  return function () {
    stream.removeListener('complete', onfinish);
    stream.removeListener('abort', onclose);
    stream.removeListener('request', onrequest);
    if (stream.req) stream.req.removeListener('finish', onfinish);
    stream.removeListener('end', onlegacyfinish);
    stream.removeListener('close', onlegacyfinish);
    stream.removeListener('finish', onfinish);
    stream.removeListener('end', onend);
    stream.removeListener('error', onerror);
    stream.removeListener('close', onclose);
  };
}

module.exports = eos;
},{"../../../errors":"../node_modules/hash-base/node_modules/readable-stream/errors-browser.js"}],"../node_modules/hash-base/node_modules/readable-stream/lib/internal/streams/async_iterator.js":[function(require,module,exports) {
var process = require("process");
'use strict';

var _Object$setPrototypeO;

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

var finished = require('./end-of-stream');

var kLastResolve = Symbol('lastResolve');
var kLastReject = Symbol('lastReject');
var kError = Symbol('error');
var kEnded = Symbol('ended');
var kLastPromise = Symbol('lastPromise');
var kHandlePromise = Symbol('handlePromise');
var kStream = Symbol('stream');

function createIterResult(value, done) {
  return {
    value: value,
    done: done
  };
}

function readAndResolve(iter) {
  var resolve = iter[kLastResolve];

  if (resolve !== null) {
    var data = iter[kStream].read(); // we defer if data is null
    // we can be expecting either 'end' or
    // 'error'

    if (data !== null) {
      iter[kLastPromise] = null;
      iter[kLastResolve] = null;
      iter[kLastReject] = null;
      resolve(createIterResult(data, false));
    }
  }
}

function onReadable(iter) {
  // we wait for the next tick, because it might
  // emit an error with process.nextTick
  process.nextTick(readAndResolve, iter);
}

function wrapForNext(lastPromise, iter) {
  return function (resolve, reject) {
    lastPromise.then(function () {
      if (iter[kEnded]) {
        resolve(createIterResult(undefined, true));
        return;
      }

      iter[kHandlePromise](resolve, reject);
    }, reject);
  };
}

var AsyncIteratorPrototype = Object.getPrototypeOf(function () {});
var ReadableStreamAsyncIteratorPrototype = Object.setPrototypeOf((_Object$setPrototypeO = {
  get stream() {
    return this[kStream];
  },

  next: function next() {
    var _this = this; // if we have detected an error in the meanwhile
    // reject straight away


    var error = this[kError];

    if (error !== null) {
      return Promise.reject(error);
    }

    if (this[kEnded]) {
      return Promise.resolve(createIterResult(undefined, true));
    }

    if (this[kStream].destroyed) {
      // We need to defer via nextTick because if .destroy(err) is
      // called, the error will be emitted via nextTick, and
      // we cannot guarantee that there is no error lingering around
      // waiting to be emitted.
      return new Promise(function (resolve, reject) {
        process.nextTick(function () {
          if (_this[kError]) {
            reject(_this[kError]);
          } else {
            resolve(createIterResult(undefined, true));
          }
        });
      });
    } // if we have multiple next() calls
    // we will wait for the previous Promise to finish
    // this logic is optimized to support for await loops,
    // where next() is only called once at a time


    var lastPromise = this[kLastPromise];
    var promise;

    if (lastPromise) {
      promise = new Promise(wrapForNext(lastPromise, this));
    } else {
      // fast path needed to support multiple this.push()
      // without triggering the next() queue
      var data = this[kStream].read();

      if (data !== null) {
        return Promise.resolve(createIterResult(data, false));
      }

      promise = new Promise(this[kHandlePromise]);
    }

    this[kLastPromise] = promise;
    return promise;
  }
}, _defineProperty(_Object$setPrototypeO, Symbol.asyncIterator, function () {
  return this;
}), _defineProperty(_Object$setPrototypeO, "return", function _return() {
  var _this2 = this; // destroy(err, cb) is a private API
  // we can guarantee we have that here, because we control the
  // Readable class this is attached to


  return new Promise(function (resolve, reject) {
    _this2[kStream].destroy(null, function (err) {
      if (err) {
        reject(err);
        return;
      }

      resolve(createIterResult(undefined, true));
    });
  });
}), _Object$setPrototypeO), AsyncIteratorPrototype);

var createReadableStreamAsyncIterator = function createReadableStreamAsyncIterator(stream) {
  var _Object$create;

  var iterator = Object.create(ReadableStreamAsyncIteratorPrototype, (_Object$create = {}, _defineProperty(_Object$create, kStream, {
    value: stream,
    writable: true
  }), _defineProperty(_Object$create, kLastResolve, {
    value: null,
    writable: true
  }), _defineProperty(_Object$create, kLastReject, {
    value: null,
    writable: true
  }), _defineProperty(_Object$create, kError, {
    value: null,
    writable: true
  }), _defineProperty(_Object$create, kEnded, {
    value: stream._readableState.endEmitted,
    writable: true
  }), _defineProperty(_Object$create, kHandlePromise, {
    value: function value(resolve, reject) {
      var data = iterator[kStream].read();

      if (data) {
        iterator[kLastPromise] = null;
        iterator[kLastResolve] = null;
        iterator[kLastReject] = null;
        resolve(createIterResult(data, false));
      } else {
        iterator[kLastResolve] = resolve;
        iterator[kLastReject] = reject;
      }
    },
    writable: true
  }), _Object$create));
  iterator[kLastPromise] = null;
  finished(stream, function (err) {
    if (err && err.code !== 'ERR_STREAM_PREMATURE_CLOSE') {
      var reject = iterator[kLastReject]; // reject if we are waiting for data in the Promise
      // returned by next() and store the error

      if (reject !== null) {
        iterator[kLastPromise] = null;
        iterator[kLastResolve] = null;
        iterator[kLastReject] = null;
        reject(err);
      }

      iterator[kError] = err;
      return;
    }

    var resolve = iterator[kLastResolve];

    if (resolve !== null) {
      iterator[kLastPromise] = null;
      iterator[kLastResolve] = null;
      iterator[kLastReject] = null;
      resolve(createIterResult(undefined, true));
    }

    iterator[kEnded] = true;
  });
  stream.on('readable', onReadable.bind(null, iterator));
  return iterator;
};

module.exports = createReadableStreamAsyncIterator;
},{"./end-of-stream":"../node_modules/hash-base/node_modules/readable-stream/lib/internal/streams/end-of-stream.js","process":"../node_modules/process/browser.js"}],"../node_modules/hash-base/node_modules/readable-stream/lib/internal/streams/from-browser.js":[function(require,module,exports) {
module.exports = function () {
  throw new Error('Readable.from is not available in the browser');
};
},{}],"../node_modules/hash-base/node_modules/readable-stream/lib/_stream_readable.js":[function(require,module,exports) {

var global = arguments[3];
var process = require("process");
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
'use strict';

module.exports = Readable;
/*<replacement>*/

var Duplex;
/*</replacement>*/

Readable.ReadableState = ReadableState;
/*<replacement>*/

var EE = require('events').EventEmitter;

var EElistenerCount = function EElistenerCount(emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

/*<replacement>*/


var Stream = require('./internal/streams/stream');
/*</replacement>*/


var Buffer = require('buffer').Buffer;

var OurUint8Array = global.Uint8Array || function () {};

function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}

function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}
/*<replacement>*/


var debugUtil = require('util');

var debug;

if (debugUtil && debugUtil.debuglog) {
  debug = debugUtil.debuglog('stream');
} else {
  debug = function debug() {};
}
/*</replacement>*/


var BufferList = require('./internal/streams/buffer_list');

var destroyImpl = require('./internal/streams/destroy');

var _require = require('./internal/streams/state'),
    getHighWaterMark = _require.getHighWaterMark;

var _require$codes = require('../errors').codes,
    ERR_INVALID_ARG_TYPE = _require$codes.ERR_INVALID_ARG_TYPE,
    ERR_STREAM_PUSH_AFTER_EOF = _require$codes.ERR_STREAM_PUSH_AFTER_EOF,
    ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED,
    ERR_STREAM_UNSHIFT_AFTER_END_EVENT = _require$codes.ERR_STREAM_UNSHIFT_AFTER_END_EVENT; // Lazy loaded to improve the startup performance.


var StringDecoder;
var createReadableStreamAsyncIterator;
var from;

require('inherits')(Readable, Stream);

var errorOrDestroy = destroyImpl.errorOrDestroy;
var kProxyEvents = ['error', 'close', 'destroy', 'pause', 'resume'];

function prependListener(emitter, event, fn) {
  // Sadly this is not cacheable as some libraries bundle their own
  // event emitter implementation with them.
  if (typeof emitter.prependListener === 'function') return emitter.prependListener(event, fn); // This is a hack to make sure that our error handler is attached before any
  // userland ones.  NEVER DO THIS. This is here only because this code needs
  // to continue to work with older versions of Node.js that do not include
  // the prependListener() method. The goal is to eventually remove this hack.

  if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (Array.isArray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
}

function ReadableState(options, stream, isDuplex) {
  Duplex = Duplex || require('./_stream_duplex');
  options = options || {}; // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.

  if (typeof isDuplex !== 'boolean') isDuplex = stream instanceof Duplex; // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away

  this.objectMode = !!options.objectMode;
  if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode; // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"

  this.highWaterMark = getHighWaterMark(this, options, 'readableHighWaterMark', isDuplex); // A linked list is used to store data chunks instead of an array because the
  // linked list can remove elements from the beginning faster than
  // array.shift()

  this.buffer = new BufferList();
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false; // a flag to be able to tell if the event 'readable'/'data' is emitted
  // immediately, or on a later tick.  We set this to true at first, because
  // any actions that shouldn't happen until "later" should generally also
  // not happen before the first read call.

  this.sync = true; // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.

  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;
  this.resumeScheduled = false;
  this.paused = true; // Should close be emitted on destroy. Defaults to true.

  this.emitClose = options.emitClose !== false; // Should .destroy() be called after 'end' (and potentially 'finish')

  this.autoDestroy = !!options.autoDestroy; // has it been destroyed

  this.destroyed = false; // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.

  this.defaultEncoding = options.defaultEncoding || 'utf8'; // the number of writers that are awaiting a drain event in .pipe()s

  this.awaitDrain = 0; // if true, a maybeReadMore has been scheduled

  this.readingMore = false;
  this.decoder = null;
  this.encoding = null;

  if (options.encoding) {
    if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  Duplex = Duplex || require('./_stream_duplex');
  if (!(this instanceof Readable)) return new Readable(options); // Checking for a Stream.Duplex instance is faster here instead of inside
  // the ReadableState constructor, at least with V8 6.5

  var isDuplex = this instanceof Duplex;
  this._readableState = new ReadableState(options, this, isDuplex); // legacy

  this.readable = true;

  if (options) {
    if (typeof options.read === 'function') this._read = options.read;
    if (typeof options.destroy === 'function') this._destroy = options.destroy;
  }

  Stream.call(this);
}

Object.defineProperty(Readable.prototype, 'destroyed', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    if (this._readableState === undefined) {
      return false;
    }

    return this._readableState.destroyed;
  },
  set: function set(value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._readableState) {
      return;
    } // backward compatibility, the user is explicitly
    // managing destroyed


    this._readableState.destroyed = value;
  }
});
Readable.prototype.destroy = destroyImpl.destroy;
Readable.prototype._undestroy = destroyImpl.undestroy;

Readable.prototype._destroy = function (err, cb) {
  cb(err);
}; // Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.


Readable.prototype.push = function (chunk, encoding) {
  var state = this._readableState;
  var skipChunkCheck;

  if (!state.objectMode) {
    if (typeof chunk === 'string') {
      encoding = encoding || state.defaultEncoding;

      if (encoding !== state.encoding) {
        chunk = Buffer.from(chunk, encoding);
        encoding = '';
      }

      skipChunkCheck = true;
    }
  } else {
    skipChunkCheck = true;
  }

  return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
}; // Unshift should *always* be something directly out of read()


Readable.prototype.unshift = function (chunk) {
  return readableAddChunk(this, chunk, null, true, false);
};

function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
  debug('readableAddChunk', chunk);
  var state = stream._readableState;

  if (chunk === null) {
    state.reading = false;
    onEofChunk(stream, state);
  } else {
    var er;
    if (!skipChunkCheck) er = chunkInvalid(state, chunk);

    if (er) {
      errorOrDestroy(stream, er);
    } else if (state.objectMode || chunk && chunk.length > 0) {
      if (typeof chunk !== 'string' && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer.prototype) {
        chunk = _uint8ArrayToBuffer(chunk);
      }

      if (addToFront) {
        if (state.endEmitted) errorOrDestroy(stream, new ERR_STREAM_UNSHIFT_AFTER_END_EVENT());else addChunk(stream, state, chunk, true);
      } else if (state.ended) {
        errorOrDestroy(stream, new ERR_STREAM_PUSH_AFTER_EOF());
      } else if (state.destroyed) {
        return false;
      } else {
        state.reading = false;

        if (state.decoder && !encoding) {
          chunk = state.decoder.write(chunk);
          if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);else maybeReadMore(stream, state);
        } else {
          addChunk(stream, state, chunk, false);
        }
      }
    } else if (!addToFront) {
      state.reading = false;
      maybeReadMore(stream, state);
    }
  } // We can push more data if we are below the highWaterMark.
  // Also, if we have no data yet, we can stand some more bytes.
  // This is to work around cases where hwm=0, such as the repl.


  return !state.ended && (state.length < state.highWaterMark || state.length === 0);
}

function addChunk(stream, state, chunk, addToFront) {
  if (state.flowing && state.length === 0 && !state.sync) {
    state.awaitDrain = 0;
    stream.emit('data', chunk);
  } else {
    // update the buffer info.
    state.length += state.objectMode ? 1 : chunk.length;
    if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);
    if (state.needReadable) emitReadable(stream);
  }

  maybeReadMore(stream, state);
}

function chunkInvalid(state, chunk) {
  var er;

  if (!_isUint8Array(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new ERR_INVALID_ARG_TYPE('chunk', ['string', 'Buffer', 'Uint8Array'], chunk);
  }

  return er;
}

Readable.prototype.isPaused = function () {
  return this._readableState.flowing === false;
}; // backwards compatibility.


Readable.prototype.setEncoding = function (enc) {
  if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
  var decoder = new StringDecoder(enc);
  this._readableState.decoder = decoder; // If setEncoding(null), decoder.encoding equals utf8

  this._readableState.encoding = this._readableState.decoder.encoding; // Iterate over current buffer to convert already stored Buffers:

  var p = this._readableState.buffer.head;
  var content = '';

  while (p !== null) {
    content += decoder.write(p.data);
    p = p.next;
  }

  this._readableState.buffer.clear();

  if (content !== '') this._readableState.buffer.push(content);
  this._readableState.length = content.length;
  return this;
}; // Don't raise the hwm > 1GB


var MAX_HWM = 0x40000000;

function computeNewHighWaterMark(n) {
  if (n >= MAX_HWM) {
    // TODO(ronag): Throw ERR_VALUE_OUT_OF_RANGE.
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2 to prevent increasing hwm excessively in
    // tiny amounts
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    n++;
  }

  return n;
} // This function is designed to be inlinable, so please take care when making
// changes to the function body.


function howMuchToRead(n, state) {
  if (n <= 0 || state.length === 0 && state.ended) return 0;
  if (state.objectMode) return 1;

  if (n !== n) {
    // Only flow one buffer at a time
    if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
  } // If we're asking for more than the current hwm, then raise the hwm.


  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
  if (n <= state.length) return n; // Don't have enough

  if (!state.ended) {
    state.needReadable = true;
    return 0;
  }

  return state.length;
} // you can override either this method, or the async _read(n) below.


Readable.prototype.read = function (n) {
  debug('read', n);
  n = parseInt(n, 10);
  var state = this._readableState;
  var nOrig = n;
  if (n !== 0) state.emittedReadable = false; // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.

  if (n === 0 && state.needReadable && ((state.highWaterMark !== 0 ? state.length >= state.highWaterMark : state.length > 0) || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state); // if we've ended, and we're now clear, then finish it up.

  if (n === 0 && state.ended) {
    if (state.length === 0) endReadable(this);
    return null;
  } // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.
  // if we need a readable event, then we need to do some reading.


  var doRead = state.needReadable;
  debug('need readable', doRead); // if we currently have less than the highWaterMark, then also read some

  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  } // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.


  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  } else if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true; // if the length is currently zero, then we *need* a readable event.

    if (state.length === 0) state.needReadable = true; // call internal read method

    this._read(state.highWaterMark);

    state.sync = false; // If _read pushed data synchronously, then `reading` will be false,
    // and we need to re-evaluate how much data we can return to the user.

    if (!state.reading) n = howMuchToRead(nOrig, state);
  }

  var ret;
  if (n > 0) ret = fromList(n, state);else ret = null;

  if (ret === null) {
    state.needReadable = state.length <= state.highWaterMark;
    n = 0;
  } else {
    state.length -= n;
    state.awaitDrain = 0;
  }

  if (state.length === 0) {
    // If we have nothing in the buffer, then we want to know
    // as soon as we *do* get something into the buffer.
    if (!state.ended) state.needReadable = true; // If we tried to read() past the EOF, then emit end on the next tick.

    if (nOrig !== n && state.ended) endReadable(this);
  }

  if (ret !== null) this.emit('data', ret);
  return ret;
};

function onEofChunk(stream, state) {
  debug('onEofChunk');
  if (state.ended) return;

  if (state.decoder) {
    var chunk = state.decoder.end();

    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }

  state.ended = true;

  if (state.sync) {
    // if we are sync, wait until next tick to emit the data.
    // Otherwise we risk emitting data in the flow()
    // the readable code triggers during a read() call
    emitReadable(stream);
  } else {
    // emit 'readable' now to make sure it gets picked up.
    state.needReadable = false;

    if (!state.emittedReadable) {
      state.emittedReadable = true;
      emitReadable_(stream);
    }
  }
} // Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.


function emitReadable(stream) {
  var state = stream._readableState;
  debug('emitReadable', state.needReadable, state.emittedReadable);
  state.needReadable = false;

  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    process.nextTick(emitReadable_, stream);
  }
}

function emitReadable_(stream) {
  var state = stream._readableState;
  debug('emitReadable_', state.destroyed, state.length, state.ended);

  if (!state.destroyed && (state.length || state.ended)) {
    stream.emit('readable');
    state.emittedReadable = false;
  } // The stream needs another readable event if
  // 1. It is not flowing, as the flow mechanism will take
  //    care of it.
  // 2. It is not ended.
  // 3. It is below the highWaterMark, so we can schedule
  //    another readable later.


  state.needReadable = !state.flowing && !state.ended && state.length <= state.highWaterMark;
  flow(stream);
} // at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.


function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    process.nextTick(maybeReadMore_, stream, state);
  }
}

function maybeReadMore_(stream, state) {
  // Attempt to read more data if we should.
  //
  // The conditions for reading more data are (one of):
  // - Not enough data buffered (state.length < state.highWaterMark). The loop
  //   is responsible for filling the buffer with enough data if such data
  //   is available. If highWaterMark is 0 and we are not in the flowing mode
  //   we should _not_ attempt to buffer any extra data. We'll get more data
  //   when the stream consumer calls read() instead.
  // - No data in the buffer, and the stream is in flowing mode. In this mode
  //   the loop below is responsible for ensuring read() is called. Failing to
  //   call read here would abort the flow and there's no other mechanism for
  //   continuing the flow if the stream consumer has just subscribed to the
  //   'data' event.
  //
  // In addition to the above conditions to keep reading data, the following
  // conditions prevent the data from being read:
  // - The stream has ended (state.ended).
  // - There is already a pending 'read' operation (state.reading). This is a
  //   case where the the stream has called the implementation defined _read()
  //   method, but they are processing the call asynchronously and have _not_
  //   called push() with new data. In this case we skip performing more
  //   read()s. The execution ends in this method again after the _read() ends
  //   up calling push() with more data.
  while (!state.reading && !state.ended && (state.length < state.highWaterMark || state.flowing && state.length === 0)) {
    var len = state.length;
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length) // didn't get any data, stop spinning.
      break;
  }

  state.readingMore = false;
} // abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.


Readable.prototype._read = function (n) {
  errorOrDestroy(this, new ERR_METHOD_NOT_IMPLEMENTED('_read()'));
};

Readable.prototype.pipe = function (dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;

    case 1:
      state.pipes = [state.pipes, dest];
      break;

    default:
      state.pipes.push(dest);
      break;
  }

  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);
  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;
  var endFn = doEnd ? onend : unpipe;
  if (state.endEmitted) process.nextTick(endFn);else src.once('end', endFn);
  dest.on('unpipe', onunpipe);

  function onunpipe(readable, unpipeInfo) {
    debug('onunpipe');

    if (readable === src) {
      if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
        unpipeInfo.hasUnpiped = true;
        cleanup();
      }
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  } // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.


  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);
  var cleanedUp = false;

  function cleanup() {
    debug('cleanup'); // cleanup event handlers once the pipe is broken

    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', unpipe);
    src.removeListener('data', ondata);
    cleanedUp = true; // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.

    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
  }

  src.on('data', ondata);

  function ondata(chunk) {
    debug('ondata');
    var ret = dest.write(chunk);
    debug('dest.write', ret);

    if (ret === false) {
      // If the user unpiped during `dest.write()`, it is possible
      // to get stuck in a permanently paused state if that write
      // also returned false.
      // => Check whether `dest` is still a piping destination.
      if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
        debug('false write response, pause', state.awaitDrain);
        state.awaitDrain++;
      }

      src.pause();
    }
  } // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.


  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EElistenerCount(dest, 'error') === 0) errorOrDestroy(dest, er);
  } // Make sure our error handler is attached before userland ones.


  prependListener(dest, 'error', onerror); // Both close and finish should trigger unpipe, but only once.

  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }

  dest.once('close', onclose);

  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }

  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  } // tell the dest that it's being piped to


  dest.emit('pipe', src); // start the flow if it hasn't been started already.

  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function pipeOnDrainFunctionResult() {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain) state.awaitDrain--;

    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}

Readable.prototype.unpipe = function (dest) {
  var state = this._readableState;
  var unpipeInfo = {
    hasUnpiped: false
  }; // if we're not piping anywhere, then do nothing.

  if (state.pipesCount === 0) return this; // just one destination.  most common case.

  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes) return this;
    if (!dest) dest = state.pipes; // got a match.

    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest) dest.emit('unpipe', this, unpipeInfo);
    return this;
  } // slow case. multiple pipe destinations.


  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var i = 0; i < len; i++) {
      dests[i].emit('unpipe', this, {
        hasUnpiped: false
      });
    }

    return this;
  } // try to find the right one.


  var index = indexOf(state.pipes, dest);
  if (index === -1) return this;
  state.pipes.splice(index, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1) state.pipes = state.pipes[0];
  dest.emit('unpipe', this, unpipeInfo);
  return this;
}; // set up data events if they are asked for
// Ensure readable listeners eventually get something


Readable.prototype.on = function (ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);
  var state = this._readableState;

  if (ev === 'data') {
    // update readableListening so that resume() may be a no-op
    // a few lines down. This is needed to support once('readable').
    state.readableListening = this.listenerCount('readable') > 0; // Try start flowing on next tick if stream isn't explicitly paused

    if (state.flowing !== false) this.resume();
  } else if (ev === 'readable') {
    if (!state.endEmitted && !state.readableListening) {
      state.readableListening = state.needReadable = true;
      state.flowing = false;
      state.emittedReadable = false;
      debug('on readable', state.length, state.reading);

      if (state.length) {
        emitReadable(this);
      } else if (!state.reading) {
        process.nextTick(nReadingNextTick, this);
      }
    }
  }

  return res;
};

Readable.prototype.addListener = Readable.prototype.on;

Readable.prototype.removeListener = function (ev, fn) {
  var res = Stream.prototype.removeListener.call(this, ev, fn);

  if (ev === 'readable') {
    // We need to check if there is someone still listening to
    // readable and reset the state. However this needs to happen
    // after readable has been emitted but before I/O (nextTick) to
    // support once('readable', fn) cycles. This means that calling
    // resume within the same tick will have no
    // effect.
    process.nextTick(updateReadableListening, this);
  }

  return res;
};

Readable.prototype.removeAllListeners = function (ev) {
  var res = Stream.prototype.removeAllListeners.apply(this, arguments);

  if (ev === 'readable' || ev === undefined) {
    // We need to check if there is someone still listening to
    // readable and reset the state. However this needs to happen
    // after readable has been emitted but before I/O (nextTick) to
    // support once('readable', fn) cycles. This means that calling
    // resume within the same tick will have no
    // effect.
    process.nextTick(updateReadableListening, this);
  }

  return res;
};

function updateReadableListening(self) {
  var state = self._readableState;
  state.readableListening = self.listenerCount('readable') > 0;

  if (state.resumeScheduled && !state.paused) {
    // flowing needs to be set to true now, otherwise
    // the upcoming resume will not flow.
    state.flowing = true; // crude way to check if we should resume
  } else if (self.listenerCount('data') > 0) {
    self.resume();
  }
}

function nReadingNextTick(self) {
  debug('readable nexttick read 0');
  self.read(0);
} // pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.


Readable.prototype.resume = function () {
  var state = this._readableState;

  if (!state.flowing) {
    debug('resume'); // we flow only if there is no one listening
    // for readable, but we still have to call
    // resume()

    state.flowing = !state.readableListening;
    resume(this, state);
  }

  state.paused = false;
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    process.nextTick(resume_, stream, state);
  }
}

function resume_(stream, state) {
  debug('resume', state.reading);

  if (!state.reading) {
    stream.read(0);
  }

  state.resumeScheduled = false;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading) stream.read(0);
}

Readable.prototype.pause = function () {
  debug('call pause flowing=%j', this._readableState.flowing);

  if (this._readableState.flowing !== false) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }

  this._readableState.paused = true;
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);

  while (state.flowing && stream.read() !== null) {
    ;
  }
} // wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.


Readable.prototype.wrap = function (stream) {
  var _this = this;

  var state = this._readableState;
  var paused = false;
  stream.on('end', function () {
    debug('wrapped end');

    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length) _this.push(chunk);
    }

    _this.push(null);
  });
  stream.on('data', function (chunk) {
    debug('wrapped data');
    if (state.decoder) chunk = state.decoder.write(chunk); // don't skip over falsy values in objectMode

    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

    var ret = _this.push(chunk);

    if (!ret) {
      paused = true;
      stream.pause();
    }
  }); // proxy all the other methods.
  // important when wrapping filters and duplexes.

  for (var i in stream) {
    if (this[i] === undefined && typeof stream[i] === 'function') {
      this[i] = function methodWrap(method) {
        return function methodWrapReturnFunction() {
          return stream[method].apply(stream, arguments);
        };
      }(i);
    }
  } // proxy certain important events.


  for (var n = 0; n < kProxyEvents.length; n++) {
    stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
  } // when we try to consume some more bytes, simply unpause the
  // underlying stream.


  this._read = function (n) {
    debug('wrapped _read', n);

    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return this;
};

if (typeof Symbol === 'function') {
  Readable.prototype[Symbol.asyncIterator] = function () {
    if (createReadableStreamAsyncIterator === undefined) {
      createReadableStreamAsyncIterator = require('./internal/streams/async_iterator');
    }

    return createReadableStreamAsyncIterator(this);
  };
}

Object.defineProperty(Readable.prototype, 'readableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._readableState.highWaterMark;
  }
});
Object.defineProperty(Readable.prototype, 'readableBuffer', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._readableState && this._readableState.buffer;
  }
});
Object.defineProperty(Readable.prototype, 'readableFlowing', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._readableState.flowing;
  },
  set: function set(state) {
    if (this._readableState) {
      this._readableState.flowing = state;
    }
  }
}); // exposed for testing purposes only.

Readable._fromList = fromList;
Object.defineProperty(Readable.prototype, 'readableLength', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._readableState.length;
  }
}); // Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.

function fromList(n, state) {
  // nothing buffered
  if (state.length === 0) return null;
  var ret;
  if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
    // read it all, truncate the list
    if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.first();else ret = state.buffer.concat(state.length);
    state.buffer.clear();
  } else {
    // read part of list
    ret = state.buffer.consume(n, state.decoder);
  }
  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;
  debug('endReadable', state.endEmitted);

  if (!state.endEmitted) {
    state.ended = true;
    process.nextTick(endReadableNT, state, stream);
  }
}

function endReadableNT(state, stream) {
  debug('endReadableNT', state.endEmitted, state.length); // Check that we didn't get one last unshift.

  if (!state.endEmitted && state.length === 0) {
    state.endEmitted = true;
    stream.readable = false;
    stream.emit('end');

    if (state.autoDestroy) {
      // In case of duplex streams we need a way to detect
      // if the writable side is ready for autoDestroy as well
      var wState = stream._writableState;

      if (!wState || wState.autoDestroy && wState.finished) {
        stream.destroy();
      }
    }
  }
}

if (typeof Symbol === 'function') {
  Readable.from = function (iterable, opts) {
    if (from === undefined) {
      from = require('./internal/streams/from');
    }

    return from(Readable, iterable, opts);
  };
}

function indexOf(xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }

  return -1;
}
},{"events":"../node_modules/events/events.js","./internal/streams/stream":"../node_modules/hash-base/node_modules/readable-stream/lib/internal/streams/stream-browser.js","buffer":"../node_modules/buffer/index.js","util":"../node_modules/parcel-bundler/src/builtins/_empty.js","./internal/streams/buffer_list":"../node_modules/hash-base/node_modules/readable-stream/lib/internal/streams/buffer_list.js","./internal/streams/destroy":"../node_modules/hash-base/node_modules/readable-stream/lib/internal/streams/destroy.js","./internal/streams/state":"../node_modules/hash-base/node_modules/readable-stream/lib/internal/streams/state.js","../errors":"../node_modules/hash-base/node_modules/readable-stream/errors-browser.js","inherits":"../node_modules/inherits/inherits_browser.js","./_stream_duplex":"../node_modules/hash-base/node_modules/readable-stream/lib/_stream_duplex.js","string_decoder/":"../node_modules/string_decoder/lib/string_decoder.js","./internal/streams/async_iterator":"../node_modules/hash-base/node_modules/readable-stream/lib/internal/streams/async_iterator.js","./internal/streams/from":"../node_modules/hash-base/node_modules/readable-stream/lib/internal/streams/from-browser.js","process":"../node_modules/process/browser.js"}],"../node_modules/hash-base/node_modules/readable-stream/lib/_stream_transform.js":[function(require,module,exports) {
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.
'use strict';

module.exports = Transform;

var _require$codes = require('../errors').codes,
    ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED,
    ERR_MULTIPLE_CALLBACK = _require$codes.ERR_MULTIPLE_CALLBACK,
    ERR_TRANSFORM_ALREADY_TRANSFORMING = _require$codes.ERR_TRANSFORM_ALREADY_TRANSFORMING,
    ERR_TRANSFORM_WITH_LENGTH_0 = _require$codes.ERR_TRANSFORM_WITH_LENGTH_0;

var Duplex = require('./_stream_duplex');

require('inherits')(Transform, Duplex);

function afterTransform(er, data) {
  var ts = this._transformState;
  ts.transforming = false;
  var cb = ts.writecb;

  if (cb === null) {
    return this.emit('error', new ERR_MULTIPLE_CALLBACK());
  }

  ts.writechunk = null;
  ts.writecb = null;
  if (data != null) // single equals check for both `null` and `undefined`
    this.push(data);
  cb(er);
  var rs = this._readableState;
  rs.reading = false;

  if (rs.needReadable || rs.length < rs.highWaterMark) {
    this._read(rs.highWaterMark);
  }
}

function Transform(options) {
  if (!(this instanceof Transform)) return new Transform(options);
  Duplex.call(this, options);
  this._transformState = {
    afterTransform: afterTransform.bind(this),
    needTransform: false,
    transforming: false,
    writecb: null,
    writechunk: null,
    writeencoding: null
  }; // start out asking for a readable event once data is transformed.

  this._readableState.needReadable = true; // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.

  this._readableState.sync = false;

  if (options) {
    if (typeof options.transform === 'function') this._transform = options.transform;
    if (typeof options.flush === 'function') this._flush = options.flush;
  } // When the writable side finishes, then flush out anything remaining.


  this.on('prefinish', prefinish);
}

function prefinish() {
  var _this = this;

  if (typeof this._flush === 'function' && !this._readableState.destroyed) {
    this._flush(function (er, data) {
      done(_this, er, data);
    });
  } else {
    done(this, null, null);
  }
}

Transform.prototype.push = function (chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
}; // This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.


Transform.prototype._transform = function (chunk, encoding, cb) {
  cb(new ERR_METHOD_NOT_IMPLEMENTED('_transform()'));
};

Transform.prototype._write = function (chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;

  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
  }
}; // Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.


Transform.prototype._read = function (n) {
  var ts = this._transformState;

  if (ts.writechunk !== null && !ts.transforming) {
    ts.transforming = true;

    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};

Transform.prototype._destroy = function (err, cb) {
  Duplex.prototype._destroy.call(this, err, function (err2) {
    cb(err2);
  });
};

function done(stream, er, data) {
  if (er) return stream.emit('error', er);
  if (data != null) // single equals check for both `null` and `undefined`
    stream.push(data); // TODO(BridgeAR): Write a test for these two error cases
  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided

  if (stream._writableState.length) throw new ERR_TRANSFORM_WITH_LENGTH_0();
  if (stream._transformState.transforming) throw new ERR_TRANSFORM_ALREADY_TRANSFORMING();
  return stream.push(null);
}
},{"../errors":"../node_modules/hash-base/node_modules/readable-stream/errors-browser.js","./_stream_duplex":"../node_modules/hash-base/node_modules/readable-stream/lib/_stream_duplex.js","inherits":"../node_modules/inherits/inherits_browser.js"}],"../node_modules/hash-base/node_modules/readable-stream/lib/_stream_passthrough.js":[function(require,module,exports) {
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.
'use strict';

module.exports = PassThrough;

var Transform = require('./_stream_transform');

require('inherits')(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough)) return new PassThrough(options);
  Transform.call(this, options);
}

PassThrough.prototype._transform = function (chunk, encoding, cb) {
  cb(null, chunk);
};
},{"./_stream_transform":"../node_modules/hash-base/node_modules/readable-stream/lib/_stream_transform.js","inherits":"../node_modules/inherits/inherits_browser.js"}],"../node_modules/hash-base/node_modules/readable-stream/lib/internal/streams/pipeline.js":[function(require,module,exports) {
// Ported from https://github.com/mafintosh/pump with
// permission from the author, Mathias Buus (@mafintosh).
'use strict';

var eos;

function once(callback) {
  var called = false;
  return function () {
    if (called) return;
    called = true;
    callback.apply(void 0, arguments);
  };
}

var _require$codes = require('../../../errors').codes,
    ERR_MISSING_ARGS = _require$codes.ERR_MISSING_ARGS,
    ERR_STREAM_DESTROYED = _require$codes.ERR_STREAM_DESTROYED;

function noop(err) {
  // Rethrow the error if it exists to avoid swallowing it
  if (err) throw err;
}

function isRequest(stream) {
  return stream.setHeader && typeof stream.abort === 'function';
}

function destroyer(stream, reading, writing, callback) {
  callback = once(callback);
  var closed = false;
  stream.on('close', function () {
    closed = true;
  });
  if (eos === undefined) eos = require('./end-of-stream');
  eos(stream, {
    readable: reading,
    writable: writing
  }, function (err) {
    if (err) return callback(err);
    closed = true;
    callback();
  });
  var destroyed = false;
  return function (err) {
    if (closed) return;
    if (destroyed) return;
    destroyed = true; // request.destroy just do .end - .abort is what we want

    if (isRequest(stream)) return stream.abort();
    if (typeof stream.destroy === 'function') return stream.destroy();
    callback(err || new ERR_STREAM_DESTROYED('pipe'));
  };
}

function call(fn) {
  fn();
}

function pipe(from, to) {
  return from.pipe(to);
}

function popCallback(streams) {
  if (!streams.length) return noop;
  if (typeof streams[streams.length - 1] !== 'function') return noop;
  return streams.pop();
}

function pipeline() {
  for (var _len = arguments.length, streams = new Array(_len), _key = 0; _key < _len; _key++) {
    streams[_key] = arguments[_key];
  }

  var callback = popCallback(streams);
  if (Array.isArray(streams[0])) streams = streams[0];

  if (streams.length < 2) {
    throw new ERR_MISSING_ARGS('streams');
  }

  var error;
  var destroys = streams.map(function (stream, i) {
    var reading = i < streams.length - 1;
    var writing = i > 0;
    return destroyer(stream, reading, writing, function (err) {
      if (!error) error = err;
      if (err) destroys.forEach(call);
      if (reading) return;
      destroys.forEach(call);
      callback(error);
    });
  });
  return streams.reduce(pipe);
}

module.exports = pipeline;
},{"../../../errors":"../node_modules/hash-base/node_modules/readable-stream/errors-browser.js","./end-of-stream":"../node_modules/hash-base/node_modules/readable-stream/lib/internal/streams/end-of-stream.js"}],"../node_modules/hash-base/node_modules/readable-stream/readable-browser.js":[function(require,module,exports) {
exports = module.exports = require('./lib/_stream_readable.js');
exports.Stream = exports;
exports.Readable = exports;
exports.Writable = require('./lib/_stream_writable.js');
exports.Duplex = require('./lib/_stream_duplex.js');
exports.Transform = require('./lib/_stream_transform.js');
exports.PassThrough = require('./lib/_stream_passthrough.js');
exports.finished = require('./lib/internal/streams/end-of-stream.js');
exports.pipeline = require('./lib/internal/streams/pipeline.js');
},{"./lib/_stream_readable.js":"../node_modules/hash-base/node_modules/readable-stream/lib/_stream_readable.js","./lib/_stream_writable.js":"../node_modules/hash-base/node_modules/readable-stream/lib/_stream_writable.js","./lib/_stream_duplex.js":"../node_modules/hash-base/node_modules/readable-stream/lib/_stream_duplex.js","./lib/_stream_transform.js":"../node_modules/hash-base/node_modules/readable-stream/lib/_stream_transform.js","./lib/_stream_passthrough.js":"../node_modules/hash-base/node_modules/readable-stream/lib/_stream_passthrough.js","./lib/internal/streams/end-of-stream.js":"../node_modules/hash-base/node_modules/readable-stream/lib/internal/streams/end-of-stream.js","./lib/internal/streams/pipeline.js":"../node_modules/hash-base/node_modules/readable-stream/lib/internal/streams/pipeline.js"}],"../node_modules/hash-base/index.js":[function(require,module,exports) {

'use strict';

var Buffer = require('safe-buffer').Buffer;

var Transform = require('readable-stream').Transform;

var inherits = require('inherits');

function throwIfNotStringOrBuffer(val, prefix) {
  if (!Buffer.isBuffer(val) && typeof val !== 'string') {
    throw new TypeError(prefix + ' must be a string or a buffer');
  }
}

function HashBase(blockSize) {
  Transform.call(this);
  this._block = Buffer.allocUnsafe(blockSize);
  this._blockSize = blockSize;
  this._blockOffset = 0;
  this._length = [0, 0, 0, 0];
  this._finalized = false;
}

inherits(HashBase, Transform);

HashBase.prototype._transform = function (chunk, encoding, callback) {
  var error = null;

  try {
    this.update(chunk, encoding);
  } catch (err) {
    error = err;
  }

  callback(error);
};

HashBase.prototype._flush = function (callback) {
  var error = null;

  try {
    this.push(this.digest());
  } catch (err) {
    error = err;
  }

  callback(error);
};

HashBase.prototype.update = function (data, encoding) {
  throwIfNotStringOrBuffer(data, 'Data');
  if (this._finalized) throw new Error('Digest already called');
  if (!Buffer.isBuffer(data)) data = Buffer.from(data, encoding); // consume data

  var block = this._block;
  var offset = 0;

  while (this._blockOffset + data.length - offset >= this._blockSize) {
    for (var i = this._blockOffset; i < this._blockSize;) block[i++] = data[offset++];

    this._update();

    this._blockOffset = 0;
  }

  while (offset < data.length) block[this._blockOffset++] = data[offset++]; // update length


  for (var j = 0, carry = data.length * 8; carry > 0; ++j) {
    this._length[j] += carry;
    carry = this._length[j] / 0x0100000000 | 0;
    if (carry > 0) this._length[j] -= 0x0100000000 * carry;
  }

  return this;
};

HashBase.prototype._update = function () {
  throw new Error('_update is not implemented');
};

HashBase.prototype.digest = function (encoding) {
  if (this._finalized) throw new Error('Digest already called');
  this._finalized = true;

  var digest = this._digest();

  if (encoding !== undefined) digest = digest.toString(encoding); // reset state

  this._block.fill(0);

  this._blockOffset = 0;

  for (var i = 0; i < 4; ++i) this._length[i] = 0;

  return digest;
};

HashBase.prototype._digest = function () {
  throw new Error('_digest is not implemented');
};

module.exports = HashBase;
},{"safe-buffer":"../node_modules/safe-buffer/index.js","readable-stream":"../node_modules/hash-base/node_modules/readable-stream/readable-browser.js","inherits":"../node_modules/inherits/inherits_browser.js"}],"../node_modules/md5.js/index.js":[function(require,module,exports) {

'use strict'
var inherits = require('inherits')
var HashBase = require('hash-base')
var Buffer = require('safe-buffer').Buffer

var ARRAY16 = new Array(16)

function MD5 () {
  HashBase.call(this, 64)

  // state
  this._a = 0x67452301
  this._b = 0xefcdab89
  this._c = 0x98badcfe
  this._d = 0x10325476
}

inherits(MD5, HashBase)

MD5.prototype._update = function () {
  var M = ARRAY16
  for (var i = 0; i < 16; ++i) M[i] = this._block.readInt32LE(i * 4)

  var a = this._a
  var b = this._b
  var c = this._c
  var d = this._d

  a = fnF(a, b, c, d, M[0], 0xd76aa478, 7)
  d = fnF(d, a, b, c, M[1], 0xe8c7b756, 12)
  c = fnF(c, d, a, b, M[2], 0x242070db, 17)
  b = fnF(b, c, d, a, M[3], 0xc1bdceee, 22)
  a = fnF(a, b, c, d, M[4], 0xf57c0faf, 7)
  d = fnF(d, a, b, c, M[5], 0x4787c62a, 12)
  c = fnF(c, d, a, b, M[6], 0xa8304613, 17)
  b = fnF(b, c, d, a, M[7], 0xfd469501, 22)
  a = fnF(a, b, c, d, M[8], 0x698098d8, 7)
  d = fnF(d, a, b, c, M[9], 0x8b44f7af, 12)
  c = fnF(c, d, a, b, M[10], 0xffff5bb1, 17)
  b = fnF(b, c, d, a, M[11], 0x895cd7be, 22)
  a = fnF(a, b, c, d, M[12], 0x6b901122, 7)
  d = fnF(d, a, b, c, M[13], 0xfd987193, 12)
  c = fnF(c, d, a, b, M[14], 0xa679438e, 17)
  b = fnF(b, c, d, a, M[15], 0x49b40821, 22)

  a = fnG(a, b, c, d, M[1], 0xf61e2562, 5)
  d = fnG(d, a, b, c, M[6], 0xc040b340, 9)
  c = fnG(c, d, a, b, M[11], 0x265e5a51, 14)
  b = fnG(b, c, d, a, M[0], 0xe9b6c7aa, 20)
  a = fnG(a, b, c, d, M[5], 0xd62f105d, 5)
  d = fnG(d, a, b, c, M[10], 0x02441453, 9)
  c = fnG(c, d, a, b, M[15], 0xd8a1e681, 14)
  b = fnG(b, c, d, a, M[4], 0xe7d3fbc8, 20)
  a = fnG(a, b, c, d, M[9], 0x21e1cde6, 5)
  d = fnG(d, a, b, c, M[14], 0xc33707d6, 9)
  c = fnG(c, d, a, b, M[3], 0xf4d50d87, 14)
  b = fnG(b, c, d, a, M[8], 0x455a14ed, 20)
  a = fnG(a, b, c, d, M[13], 0xa9e3e905, 5)
  d = fnG(d, a, b, c, M[2], 0xfcefa3f8, 9)
  c = fnG(c, d, a, b, M[7], 0x676f02d9, 14)
  b = fnG(b, c, d, a, M[12], 0x8d2a4c8a, 20)

  a = fnH(a, b, c, d, M[5], 0xfffa3942, 4)
  d = fnH(d, a, b, c, M[8], 0x8771f681, 11)
  c = fnH(c, d, a, b, M[11], 0x6d9d6122, 16)
  b = fnH(b, c, d, a, M[14], 0xfde5380c, 23)
  a = fnH(a, b, c, d, M[1], 0xa4beea44, 4)
  d = fnH(d, a, b, c, M[4], 0x4bdecfa9, 11)
  c = fnH(c, d, a, b, M[7], 0xf6bb4b60, 16)
  b = fnH(b, c, d, a, M[10], 0xbebfbc70, 23)
  a = fnH(a, b, c, d, M[13], 0x289b7ec6, 4)
  d = fnH(d, a, b, c, M[0], 0xeaa127fa, 11)
  c = fnH(c, d, a, b, M[3], 0xd4ef3085, 16)
  b = fnH(b, c, d, a, M[6], 0x04881d05, 23)
  a = fnH(a, b, c, d, M[9], 0xd9d4d039, 4)
  d = fnH(d, a, b, c, M[12], 0xe6db99e5, 11)
  c = fnH(c, d, a, b, M[15], 0x1fa27cf8, 16)
  b = fnH(b, c, d, a, M[2], 0xc4ac5665, 23)

  a = fnI(a, b, c, d, M[0], 0xf4292244, 6)
  d = fnI(d, a, b, c, M[7], 0x432aff97, 10)
  c = fnI(c, d, a, b, M[14], 0xab9423a7, 15)
  b = fnI(b, c, d, a, M[5], 0xfc93a039, 21)
  a = fnI(a, b, c, d, M[12], 0x655b59c3, 6)
  d = fnI(d, a, b, c, M[3], 0x8f0ccc92, 10)
  c = fnI(c, d, a, b, M[10], 0xffeff47d, 15)
  b = fnI(b, c, d, a, M[1], 0x85845dd1, 21)
  a = fnI(a, b, c, d, M[8], 0x6fa87e4f, 6)
  d = fnI(d, a, b, c, M[15], 0xfe2ce6e0, 10)
  c = fnI(c, d, a, b, M[6], 0xa3014314, 15)
  b = fnI(b, c, d, a, M[13], 0x4e0811a1, 21)
  a = fnI(a, b, c, d, M[4], 0xf7537e82, 6)
  d = fnI(d, a, b, c, M[11], 0xbd3af235, 10)
  c = fnI(c, d, a, b, M[2], 0x2ad7d2bb, 15)
  b = fnI(b, c, d, a, M[9], 0xeb86d391, 21)

  this._a = (this._a + a) | 0
  this._b = (this._b + b) | 0
  this._c = (this._c + c) | 0
  this._d = (this._d + d) | 0
}

MD5.prototype._digest = function () {
  // create padding and handle blocks
  this._block[this._blockOffset++] = 0x80
  if (this._blockOffset > 56) {
    this._block.fill(0, this._blockOffset, 64)
    this._update()
    this._blockOffset = 0
  }

  this._block.fill(0, this._blockOffset, 56)
  this._block.writeUInt32LE(this._length[0], 56)
  this._block.writeUInt32LE(this._length[1], 60)
  this._update()

  // produce result
  var buffer = Buffer.allocUnsafe(16)
  buffer.writeInt32LE(this._a, 0)
  buffer.writeInt32LE(this._b, 4)
  buffer.writeInt32LE(this._c, 8)
  buffer.writeInt32LE(this._d, 12)
  return buffer
}

function rotl (x, n) {
  return (x << n) | (x >>> (32 - n))
}

function fnF (a, b, c, d, m, k, s) {
  return (rotl((a + ((b & c) | ((~b) & d)) + m + k) | 0, s) + b) | 0
}

function fnG (a, b, c, d, m, k, s) {
  return (rotl((a + ((b & d) | (c & (~d))) + m + k) | 0, s) + b) | 0
}

function fnH (a, b, c, d, m, k, s) {
  return (rotl((a + (b ^ c ^ d) + m + k) | 0, s) + b) | 0
}

function fnI (a, b, c, d, m, k, s) {
  return (rotl((a + ((c ^ (b | (~d)))) + m + k) | 0, s) + b) | 0
}

module.exports = MD5

},{"inherits":"../node_modules/inherits/inherits_browser.js","hash-base":"../node_modules/hash-base/index.js","safe-buffer":"../node_modules/safe-buffer/index.js"}],"../node_modules/create-hash/md5.js":[function(require,module,exports) {
var MD5 = require('md5.js')

module.exports = function (buffer) {
  return new MD5().update(buffer).digest()
}

},{"md5.js":"../node_modules/md5.js/index.js"}],"../node_modules/ripemd160/index.js":[function(require,module,exports) {

'use strict'
var Buffer = require('buffer').Buffer
var inherits = require('inherits')
var HashBase = require('hash-base')

var ARRAY16 = new Array(16)

var zl = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8,
  3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12,
  1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2,
  4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13
]

var zr = [
  5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12,
  6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2,
  15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13,
  8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14,
  12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11
]

var sl = [
  11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8,
  7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12,
  11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5,
  11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12,
  9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6
]

var sr = [
  8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6,
  9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11,
  9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5,
  15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8,
  8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11
]

var hl = [0x00000000, 0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xa953fd4e]
var hr = [0x50a28be6, 0x5c4dd124, 0x6d703ef3, 0x7a6d76e9, 0x00000000]

function RIPEMD160 () {
  HashBase.call(this, 64)

  // state
  this._a = 0x67452301
  this._b = 0xefcdab89
  this._c = 0x98badcfe
  this._d = 0x10325476
  this._e = 0xc3d2e1f0
}

inherits(RIPEMD160, HashBase)

RIPEMD160.prototype._update = function () {
  var words = ARRAY16
  for (var j = 0; j < 16; ++j) words[j] = this._block.readInt32LE(j * 4)

  var al = this._a | 0
  var bl = this._b | 0
  var cl = this._c | 0
  var dl = this._d | 0
  var el = this._e | 0

  var ar = this._a | 0
  var br = this._b | 0
  var cr = this._c | 0
  var dr = this._d | 0
  var er = this._e | 0

  // computation
  for (var i = 0; i < 80; i += 1) {
    var tl
    var tr
    if (i < 16) {
      tl = fn1(al, bl, cl, dl, el, words[zl[i]], hl[0], sl[i])
      tr = fn5(ar, br, cr, dr, er, words[zr[i]], hr[0], sr[i])
    } else if (i < 32) {
      tl = fn2(al, bl, cl, dl, el, words[zl[i]], hl[1], sl[i])
      tr = fn4(ar, br, cr, dr, er, words[zr[i]], hr[1], sr[i])
    } else if (i < 48) {
      tl = fn3(al, bl, cl, dl, el, words[zl[i]], hl[2], sl[i])
      tr = fn3(ar, br, cr, dr, er, words[zr[i]], hr[2], sr[i])
    } else if (i < 64) {
      tl = fn4(al, bl, cl, dl, el, words[zl[i]], hl[3], sl[i])
      tr = fn2(ar, br, cr, dr, er, words[zr[i]], hr[3], sr[i])
    } else { // if (i<80) {
      tl = fn5(al, bl, cl, dl, el, words[zl[i]], hl[4], sl[i])
      tr = fn1(ar, br, cr, dr, er, words[zr[i]], hr[4], sr[i])
    }

    al = el
    el = dl
    dl = rotl(cl, 10)
    cl = bl
    bl = tl

    ar = er
    er = dr
    dr = rotl(cr, 10)
    cr = br
    br = tr
  }

  // update state
  var t = (this._b + cl + dr) | 0
  this._b = (this._c + dl + er) | 0
  this._c = (this._d + el + ar) | 0
  this._d = (this._e + al + br) | 0
  this._e = (this._a + bl + cr) | 0
  this._a = t
}

RIPEMD160.prototype._digest = function () {
  // create padding and handle blocks
  this._block[this._blockOffset++] = 0x80
  if (this._blockOffset > 56) {
    this._block.fill(0, this._blockOffset, 64)
    this._update()
    this._blockOffset = 0
  }

  this._block.fill(0, this._blockOffset, 56)
  this._block.writeUInt32LE(this._length[0], 56)
  this._block.writeUInt32LE(this._length[1], 60)
  this._update()

  // produce result
  var buffer = Buffer.alloc ? Buffer.alloc(20) : new Buffer(20)
  buffer.writeInt32LE(this._a, 0)
  buffer.writeInt32LE(this._b, 4)
  buffer.writeInt32LE(this._c, 8)
  buffer.writeInt32LE(this._d, 12)
  buffer.writeInt32LE(this._e, 16)
  return buffer
}

function rotl (x, n) {
  return (x << n) | (x >>> (32 - n))
}

function fn1 (a, b, c, d, e, m, k, s) {
  return (rotl((a + (b ^ c ^ d) + m + k) | 0, s) + e) | 0
}

function fn2 (a, b, c, d, e, m, k, s) {
  return (rotl((a + ((b & c) | ((~b) & d)) + m + k) | 0, s) + e) | 0
}

function fn3 (a, b, c, d, e, m, k, s) {
  return (rotl((a + ((b | (~c)) ^ d) + m + k) | 0, s) + e) | 0
}

function fn4 (a, b, c, d, e, m, k, s) {
  return (rotl((a + ((b & d) | (c & (~d))) + m + k) | 0, s) + e) | 0
}

function fn5 (a, b, c, d, e, m, k, s) {
  return (rotl((a + (b ^ (c | (~d))) + m + k) | 0, s) + e) | 0
}

module.exports = RIPEMD160

},{"buffer":"../node_modules/buffer/index.js","inherits":"../node_modules/inherits/inherits_browser.js","hash-base":"../node_modules/hash-base/index.js"}],"../node_modules/sha.js/hash.js":[function(require,module,exports) {

var Buffer = require('safe-buffer').Buffer

// prototype class for hash functions
function Hash (blockSize, finalSize) {
  this._block = Buffer.alloc(blockSize)
  this._finalSize = finalSize
  this._blockSize = blockSize
  this._len = 0
}

Hash.prototype.update = function (data, enc) {
  if (typeof data === 'string') {
    enc = enc || 'utf8'
    data = Buffer.from(data, enc)
  }

  var block = this._block
  var blockSize = this._blockSize
  var length = data.length
  var accum = this._len

  for (var offset = 0; offset < length;) {
    var assigned = accum % blockSize
    var remainder = Math.min(length - offset, blockSize - assigned)

    for (var i = 0; i < remainder; i++) {
      block[assigned + i] = data[offset + i]
    }

    accum += remainder
    offset += remainder

    if ((accum % blockSize) === 0) {
      this._update(block)
    }
  }

  this._len += length
  return this
}

Hash.prototype.digest = function (enc) {
  var rem = this._len % this._blockSize

  this._block[rem] = 0x80

  // zero (rem + 1) trailing bits, where (rem + 1) is the smallest
  // non-negative solution to the equation (length + 1 + (rem + 1)) === finalSize mod blockSize
  this._block.fill(0, rem + 1)

  if (rem >= this._finalSize) {
    this._update(this._block)
    this._block.fill(0)
  }

  var bits = this._len * 8

  // uint32
  if (bits <= 0xffffffff) {
    this._block.writeUInt32BE(bits, this._blockSize - 4)

  // uint64
  } else {
    var lowBits = (bits & 0xffffffff) >>> 0
    var highBits = (bits - lowBits) / 0x100000000

    this._block.writeUInt32BE(highBits, this._blockSize - 8)
    this._block.writeUInt32BE(lowBits, this._blockSize - 4)
  }

  this._update(this._block)
  var hash = this._hash()

  return enc ? hash.toString(enc) : hash
}

Hash.prototype._update = function () {
  throw new Error('_update must be implemented by subclass')
}

module.exports = Hash

},{"safe-buffer":"../node_modules/safe-buffer/index.js"}],"../node_modules/sha.js/sha.js":[function(require,module,exports) {

/*
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-0, as defined
 * in FIPS PUB 180-1
 * This source code is derived from sha1.js of the same repository.
 * The difference between SHA-0 and SHA-1 is just a bitwise rotate left
 * operation was added.
 */

var inherits = require('inherits')
var Hash = require('./hash')
var Buffer = require('safe-buffer').Buffer

var K = [
  0x5a827999, 0x6ed9eba1, 0x8f1bbcdc | 0, 0xca62c1d6 | 0
]

var W = new Array(80)

function Sha () {
  this.init()
  this._w = W

  Hash.call(this, 64, 56)
}

inherits(Sha, Hash)

Sha.prototype.init = function () {
  this._a = 0x67452301
  this._b = 0xefcdab89
  this._c = 0x98badcfe
  this._d = 0x10325476
  this._e = 0xc3d2e1f0

  return this
}

function rotl5 (num) {
  return (num << 5) | (num >>> 27)
}

function rotl30 (num) {
  return (num << 30) | (num >>> 2)
}

function ft (s, b, c, d) {
  if (s === 0) return (b & c) | ((~b) & d)
  if (s === 2) return (b & c) | (b & d) | (c & d)
  return b ^ c ^ d
}

Sha.prototype._update = function (M) {
  var W = this._w

  var a = this._a | 0
  var b = this._b | 0
  var c = this._c | 0
  var d = this._d | 0
  var e = this._e | 0

  for (var i = 0; i < 16; ++i) W[i] = M.readInt32BE(i * 4)
  for (; i < 80; ++i) W[i] = W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16]

  for (var j = 0; j < 80; ++j) {
    var s = ~~(j / 20)
    var t = (rotl5(a) + ft(s, b, c, d) + e + W[j] + K[s]) | 0

    e = d
    d = c
    c = rotl30(b)
    b = a
    a = t
  }

  this._a = (a + this._a) | 0
  this._b = (b + this._b) | 0
  this._c = (c + this._c) | 0
  this._d = (d + this._d) | 0
  this._e = (e + this._e) | 0
}

Sha.prototype._hash = function () {
  var H = Buffer.allocUnsafe(20)

  H.writeInt32BE(this._a | 0, 0)
  H.writeInt32BE(this._b | 0, 4)
  H.writeInt32BE(this._c | 0, 8)
  H.writeInt32BE(this._d | 0, 12)
  H.writeInt32BE(this._e | 0, 16)

  return H
}

module.exports = Sha

},{"inherits":"../node_modules/inherits/inherits_browser.js","./hash":"../node_modules/sha.js/hash.js","safe-buffer":"../node_modules/safe-buffer/index.js"}],"../node_modules/sha.js/sha1.js":[function(require,module,exports) {

/*
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
 * in FIPS PUB 180-1
 * Version 2.1a Copyright Paul Johnston 2000 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for details.
 */

var inherits = require('inherits')
var Hash = require('./hash')
var Buffer = require('safe-buffer').Buffer

var K = [
  0x5a827999, 0x6ed9eba1, 0x8f1bbcdc | 0, 0xca62c1d6 | 0
]

var W = new Array(80)

function Sha1 () {
  this.init()
  this._w = W

  Hash.call(this, 64, 56)
}

inherits(Sha1, Hash)

Sha1.prototype.init = function () {
  this._a = 0x67452301
  this._b = 0xefcdab89
  this._c = 0x98badcfe
  this._d = 0x10325476
  this._e = 0xc3d2e1f0

  return this
}

function rotl1 (num) {
  return (num << 1) | (num >>> 31)
}

function rotl5 (num) {
  return (num << 5) | (num >>> 27)
}

function rotl30 (num) {
  return (num << 30) | (num >>> 2)
}

function ft (s, b, c, d) {
  if (s === 0) return (b & c) | ((~b) & d)
  if (s === 2) return (b & c) | (b & d) | (c & d)
  return b ^ c ^ d
}

Sha1.prototype._update = function (M) {
  var W = this._w

  var a = this._a | 0
  var b = this._b | 0
  var c = this._c | 0
  var d = this._d | 0
  var e = this._e | 0

  for (var i = 0; i < 16; ++i) W[i] = M.readInt32BE(i * 4)
  for (; i < 80; ++i) W[i] = rotl1(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16])

  for (var j = 0; j < 80; ++j) {
    var s = ~~(j / 20)
    var t = (rotl5(a) + ft(s, b, c, d) + e + W[j] + K[s]) | 0

    e = d
    d = c
    c = rotl30(b)
    b = a
    a = t
  }

  this._a = (a + this._a) | 0
  this._b = (b + this._b) | 0
  this._c = (c + this._c) | 0
  this._d = (d + this._d) | 0
  this._e = (e + this._e) | 0
}

Sha1.prototype._hash = function () {
  var H = Buffer.allocUnsafe(20)

  H.writeInt32BE(this._a | 0, 0)
  H.writeInt32BE(this._b | 0, 4)
  H.writeInt32BE(this._c | 0, 8)
  H.writeInt32BE(this._d | 0, 12)
  H.writeInt32BE(this._e | 0, 16)

  return H
}

module.exports = Sha1

},{"inherits":"../node_modules/inherits/inherits_browser.js","./hash":"../node_modules/sha.js/hash.js","safe-buffer":"../node_modules/safe-buffer/index.js"}],"../node_modules/sha.js/sha256.js":[function(require,module,exports) {

/**
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-256, as defined
 * in FIPS 180-2
 * Version 2.2-beta Copyright Angel Marin, Paul Johnston 2000 - 2009.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 *
 */

var inherits = require('inherits')
var Hash = require('./hash')
var Buffer = require('safe-buffer').Buffer

var K = [
  0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5,
  0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
  0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3,
  0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
  0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC,
  0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
  0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7,
  0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
  0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13,
  0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
  0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3,
  0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
  0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5,
  0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
  0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208,
  0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2
]

var W = new Array(64)

function Sha256 () {
  this.init()

  this._w = W // new Array(64)

  Hash.call(this, 64, 56)
}

inherits(Sha256, Hash)

Sha256.prototype.init = function () {
  this._a = 0x6a09e667
  this._b = 0xbb67ae85
  this._c = 0x3c6ef372
  this._d = 0xa54ff53a
  this._e = 0x510e527f
  this._f = 0x9b05688c
  this._g = 0x1f83d9ab
  this._h = 0x5be0cd19

  return this
}

function ch (x, y, z) {
  return z ^ (x & (y ^ z))
}

function maj (x, y, z) {
  return (x & y) | (z & (x | y))
}

function sigma0 (x) {
  return (x >>> 2 | x << 30) ^ (x >>> 13 | x << 19) ^ (x >>> 22 | x << 10)
}

function sigma1 (x) {
  return (x >>> 6 | x << 26) ^ (x >>> 11 | x << 21) ^ (x >>> 25 | x << 7)
}

function gamma0 (x) {
  return (x >>> 7 | x << 25) ^ (x >>> 18 | x << 14) ^ (x >>> 3)
}

function gamma1 (x) {
  return (x >>> 17 | x << 15) ^ (x >>> 19 | x << 13) ^ (x >>> 10)
}

Sha256.prototype._update = function (M) {
  var W = this._w

  var a = this._a | 0
  var b = this._b | 0
  var c = this._c | 0
  var d = this._d | 0
  var e = this._e | 0
  var f = this._f | 0
  var g = this._g | 0
  var h = this._h | 0

  for (var i = 0; i < 16; ++i) W[i] = M.readInt32BE(i * 4)
  for (; i < 64; ++i) W[i] = (gamma1(W[i - 2]) + W[i - 7] + gamma0(W[i - 15]) + W[i - 16]) | 0

  for (var j = 0; j < 64; ++j) {
    var T1 = (h + sigma1(e) + ch(e, f, g) + K[j] + W[j]) | 0
    var T2 = (sigma0(a) + maj(a, b, c)) | 0

    h = g
    g = f
    f = e
    e = (d + T1) | 0
    d = c
    c = b
    b = a
    a = (T1 + T2) | 0
  }

  this._a = (a + this._a) | 0
  this._b = (b + this._b) | 0
  this._c = (c + this._c) | 0
  this._d = (d + this._d) | 0
  this._e = (e + this._e) | 0
  this._f = (f + this._f) | 0
  this._g = (g + this._g) | 0
  this._h = (h + this._h) | 0
}

Sha256.prototype._hash = function () {
  var H = Buffer.allocUnsafe(32)

  H.writeInt32BE(this._a, 0)
  H.writeInt32BE(this._b, 4)
  H.writeInt32BE(this._c, 8)
  H.writeInt32BE(this._d, 12)
  H.writeInt32BE(this._e, 16)
  H.writeInt32BE(this._f, 20)
  H.writeInt32BE(this._g, 24)
  H.writeInt32BE(this._h, 28)

  return H
}

module.exports = Sha256

},{"inherits":"../node_modules/inherits/inherits_browser.js","./hash":"../node_modules/sha.js/hash.js","safe-buffer":"../node_modules/safe-buffer/index.js"}],"../node_modules/sha.js/sha224.js":[function(require,module,exports) {

/**
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-256, as defined
 * in FIPS 180-2
 * Version 2.2-beta Copyright Angel Marin, Paul Johnston 2000 - 2009.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 *
 */

var inherits = require('inherits')
var Sha256 = require('./sha256')
var Hash = require('./hash')
var Buffer = require('safe-buffer').Buffer

var W = new Array(64)

function Sha224 () {
  this.init()

  this._w = W // new Array(64)

  Hash.call(this, 64, 56)
}

inherits(Sha224, Sha256)

Sha224.prototype.init = function () {
  this._a = 0xc1059ed8
  this._b = 0x367cd507
  this._c = 0x3070dd17
  this._d = 0xf70e5939
  this._e = 0xffc00b31
  this._f = 0x68581511
  this._g = 0x64f98fa7
  this._h = 0xbefa4fa4

  return this
}

Sha224.prototype._hash = function () {
  var H = Buffer.allocUnsafe(28)

  H.writeInt32BE(this._a, 0)
  H.writeInt32BE(this._b, 4)
  H.writeInt32BE(this._c, 8)
  H.writeInt32BE(this._d, 12)
  H.writeInt32BE(this._e, 16)
  H.writeInt32BE(this._f, 20)
  H.writeInt32BE(this._g, 24)

  return H
}

module.exports = Sha224

},{"inherits":"../node_modules/inherits/inherits_browser.js","./sha256":"../node_modules/sha.js/sha256.js","./hash":"../node_modules/sha.js/hash.js","safe-buffer":"../node_modules/safe-buffer/index.js"}],"../node_modules/sha.js/sha512.js":[function(require,module,exports) {

var inherits = require('inherits')
var Hash = require('./hash')
var Buffer = require('safe-buffer').Buffer

var K = [
  0x428a2f98, 0xd728ae22, 0x71374491, 0x23ef65cd,
  0xb5c0fbcf, 0xec4d3b2f, 0xe9b5dba5, 0x8189dbbc,
  0x3956c25b, 0xf348b538, 0x59f111f1, 0xb605d019,
  0x923f82a4, 0xaf194f9b, 0xab1c5ed5, 0xda6d8118,
  0xd807aa98, 0xa3030242, 0x12835b01, 0x45706fbe,
  0x243185be, 0x4ee4b28c, 0x550c7dc3, 0xd5ffb4e2,
  0x72be5d74, 0xf27b896f, 0x80deb1fe, 0x3b1696b1,
  0x9bdc06a7, 0x25c71235, 0xc19bf174, 0xcf692694,
  0xe49b69c1, 0x9ef14ad2, 0xefbe4786, 0x384f25e3,
  0x0fc19dc6, 0x8b8cd5b5, 0x240ca1cc, 0x77ac9c65,
  0x2de92c6f, 0x592b0275, 0x4a7484aa, 0x6ea6e483,
  0x5cb0a9dc, 0xbd41fbd4, 0x76f988da, 0x831153b5,
  0x983e5152, 0xee66dfab, 0xa831c66d, 0x2db43210,
  0xb00327c8, 0x98fb213f, 0xbf597fc7, 0xbeef0ee4,
  0xc6e00bf3, 0x3da88fc2, 0xd5a79147, 0x930aa725,
  0x06ca6351, 0xe003826f, 0x14292967, 0x0a0e6e70,
  0x27b70a85, 0x46d22ffc, 0x2e1b2138, 0x5c26c926,
  0x4d2c6dfc, 0x5ac42aed, 0x53380d13, 0x9d95b3df,
  0x650a7354, 0x8baf63de, 0x766a0abb, 0x3c77b2a8,
  0x81c2c92e, 0x47edaee6, 0x92722c85, 0x1482353b,
  0xa2bfe8a1, 0x4cf10364, 0xa81a664b, 0xbc423001,
  0xc24b8b70, 0xd0f89791, 0xc76c51a3, 0x0654be30,
  0xd192e819, 0xd6ef5218, 0xd6990624, 0x5565a910,
  0xf40e3585, 0x5771202a, 0x106aa070, 0x32bbd1b8,
  0x19a4c116, 0xb8d2d0c8, 0x1e376c08, 0x5141ab53,
  0x2748774c, 0xdf8eeb99, 0x34b0bcb5, 0xe19b48a8,
  0x391c0cb3, 0xc5c95a63, 0x4ed8aa4a, 0xe3418acb,
  0x5b9cca4f, 0x7763e373, 0x682e6ff3, 0xd6b2b8a3,
  0x748f82ee, 0x5defb2fc, 0x78a5636f, 0x43172f60,
  0x84c87814, 0xa1f0ab72, 0x8cc70208, 0x1a6439ec,
  0x90befffa, 0x23631e28, 0xa4506ceb, 0xde82bde9,
  0xbef9a3f7, 0xb2c67915, 0xc67178f2, 0xe372532b,
  0xca273ece, 0xea26619c, 0xd186b8c7, 0x21c0c207,
  0xeada7dd6, 0xcde0eb1e, 0xf57d4f7f, 0xee6ed178,
  0x06f067aa, 0x72176fba, 0x0a637dc5, 0xa2c898a6,
  0x113f9804, 0xbef90dae, 0x1b710b35, 0x131c471b,
  0x28db77f5, 0x23047d84, 0x32caab7b, 0x40c72493,
  0x3c9ebe0a, 0x15c9bebc, 0x431d67c4, 0x9c100d4c,
  0x4cc5d4be, 0xcb3e42b6, 0x597f299c, 0xfc657e2a,
  0x5fcb6fab, 0x3ad6faec, 0x6c44198c, 0x4a475817
]

var W = new Array(160)

function Sha512 () {
  this.init()
  this._w = W

  Hash.call(this, 128, 112)
}

inherits(Sha512, Hash)

Sha512.prototype.init = function () {
  this._ah = 0x6a09e667
  this._bh = 0xbb67ae85
  this._ch = 0x3c6ef372
  this._dh = 0xa54ff53a
  this._eh = 0x510e527f
  this._fh = 0x9b05688c
  this._gh = 0x1f83d9ab
  this._hh = 0x5be0cd19

  this._al = 0xf3bcc908
  this._bl = 0x84caa73b
  this._cl = 0xfe94f82b
  this._dl = 0x5f1d36f1
  this._el = 0xade682d1
  this._fl = 0x2b3e6c1f
  this._gl = 0xfb41bd6b
  this._hl = 0x137e2179

  return this
}

function Ch (x, y, z) {
  return z ^ (x & (y ^ z))
}

function maj (x, y, z) {
  return (x & y) | (z & (x | y))
}

function sigma0 (x, xl) {
  return (x >>> 28 | xl << 4) ^ (xl >>> 2 | x << 30) ^ (xl >>> 7 | x << 25)
}

function sigma1 (x, xl) {
  return (x >>> 14 | xl << 18) ^ (x >>> 18 | xl << 14) ^ (xl >>> 9 | x << 23)
}

function Gamma0 (x, xl) {
  return (x >>> 1 | xl << 31) ^ (x >>> 8 | xl << 24) ^ (x >>> 7)
}

function Gamma0l (x, xl) {
  return (x >>> 1 | xl << 31) ^ (x >>> 8 | xl << 24) ^ (x >>> 7 | xl << 25)
}

function Gamma1 (x, xl) {
  return (x >>> 19 | xl << 13) ^ (xl >>> 29 | x << 3) ^ (x >>> 6)
}

function Gamma1l (x, xl) {
  return (x >>> 19 | xl << 13) ^ (xl >>> 29 | x << 3) ^ (x >>> 6 | xl << 26)
}

function getCarry (a, b) {
  return (a >>> 0) < (b >>> 0) ? 1 : 0
}

Sha512.prototype._update = function (M) {
  var W = this._w

  var ah = this._ah | 0
  var bh = this._bh | 0
  var ch = this._ch | 0
  var dh = this._dh | 0
  var eh = this._eh | 0
  var fh = this._fh | 0
  var gh = this._gh | 0
  var hh = this._hh | 0

  var al = this._al | 0
  var bl = this._bl | 0
  var cl = this._cl | 0
  var dl = this._dl | 0
  var el = this._el | 0
  var fl = this._fl | 0
  var gl = this._gl | 0
  var hl = this._hl | 0

  for (var i = 0; i < 32; i += 2) {
    W[i] = M.readInt32BE(i * 4)
    W[i + 1] = M.readInt32BE(i * 4 + 4)
  }
  for (; i < 160; i += 2) {
    var xh = W[i - 15 * 2]
    var xl = W[i - 15 * 2 + 1]
    var gamma0 = Gamma0(xh, xl)
    var gamma0l = Gamma0l(xl, xh)

    xh = W[i - 2 * 2]
    xl = W[i - 2 * 2 + 1]
    var gamma1 = Gamma1(xh, xl)
    var gamma1l = Gamma1l(xl, xh)

    // W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16]
    var Wi7h = W[i - 7 * 2]
    var Wi7l = W[i - 7 * 2 + 1]

    var Wi16h = W[i - 16 * 2]
    var Wi16l = W[i - 16 * 2 + 1]

    var Wil = (gamma0l + Wi7l) | 0
    var Wih = (gamma0 + Wi7h + getCarry(Wil, gamma0l)) | 0
    Wil = (Wil + gamma1l) | 0
    Wih = (Wih + gamma1 + getCarry(Wil, gamma1l)) | 0
    Wil = (Wil + Wi16l) | 0
    Wih = (Wih + Wi16h + getCarry(Wil, Wi16l)) | 0

    W[i] = Wih
    W[i + 1] = Wil
  }

  for (var j = 0; j < 160; j += 2) {
    Wih = W[j]
    Wil = W[j + 1]

    var majh = maj(ah, bh, ch)
    var majl = maj(al, bl, cl)

    var sigma0h = sigma0(ah, al)
    var sigma0l = sigma0(al, ah)
    var sigma1h = sigma1(eh, el)
    var sigma1l = sigma1(el, eh)

    // t1 = h + sigma1 + ch + K[j] + W[j]
    var Kih = K[j]
    var Kil = K[j + 1]

    var chh = Ch(eh, fh, gh)
    var chl = Ch(el, fl, gl)

    var t1l = (hl + sigma1l) | 0
    var t1h = (hh + sigma1h + getCarry(t1l, hl)) | 0
    t1l = (t1l + chl) | 0
    t1h = (t1h + chh + getCarry(t1l, chl)) | 0
    t1l = (t1l + Kil) | 0
    t1h = (t1h + Kih + getCarry(t1l, Kil)) | 0
    t1l = (t1l + Wil) | 0
    t1h = (t1h + Wih + getCarry(t1l, Wil)) | 0

    // t2 = sigma0 + maj
    var t2l = (sigma0l + majl) | 0
    var t2h = (sigma0h + majh + getCarry(t2l, sigma0l)) | 0

    hh = gh
    hl = gl
    gh = fh
    gl = fl
    fh = eh
    fl = el
    el = (dl + t1l) | 0
    eh = (dh + t1h + getCarry(el, dl)) | 0
    dh = ch
    dl = cl
    ch = bh
    cl = bl
    bh = ah
    bl = al
    al = (t1l + t2l) | 0
    ah = (t1h + t2h + getCarry(al, t1l)) | 0
  }

  this._al = (this._al + al) | 0
  this._bl = (this._bl + bl) | 0
  this._cl = (this._cl + cl) | 0
  this._dl = (this._dl + dl) | 0
  this._el = (this._el + el) | 0
  this._fl = (this._fl + fl) | 0
  this._gl = (this._gl + gl) | 0
  this._hl = (this._hl + hl) | 0

  this._ah = (this._ah + ah + getCarry(this._al, al)) | 0
  this._bh = (this._bh + bh + getCarry(this._bl, bl)) | 0
  this._ch = (this._ch + ch + getCarry(this._cl, cl)) | 0
  this._dh = (this._dh + dh + getCarry(this._dl, dl)) | 0
  this._eh = (this._eh + eh + getCarry(this._el, el)) | 0
  this._fh = (this._fh + fh + getCarry(this._fl, fl)) | 0
  this._gh = (this._gh + gh + getCarry(this._gl, gl)) | 0
  this._hh = (this._hh + hh + getCarry(this._hl, hl)) | 0
}

Sha512.prototype._hash = function () {
  var H = Buffer.allocUnsafe(64)

  function writeInt64BE (h, l, offset) {
    H.writeInt32BE(h, offset)
    H.writeInt32BE(l, offset + 4)
  }

  writeInt64BE(this._ah, this._al, 0)
  writeInt64BE(this._bh, this._bl, 8)
  writeInt64BE(this._ch, this._cl, 16)
  writeInt64BE(this._dh, this._dl, 24)
  writeInt64BE(this._eh, this._el, 32)
  writeInt64BE(this._fh, this._fl, 40)
  writeInt64BE(this._gh, this._gl, 48)
  writeInt64BE(this._hh, this._hl, 56)

  return H
}

module.exports = Sha512

},{"inherits":"../node_modules/inherits/inherits_browser.js","./hash":"../node_modules/sha.js/hash.js","safe-buffer":"../node_modules/safe-buffer/index.js"}],"../node_modules/sha.js/sha384.js":[function(require,module,exports) {

var inherits = require('inherits')
var SHA512 = require('./sha512')
var Hash = require('./hash')
var Buffer = require('safe-buffer').Buffer

var W = new Array(160)

function Sha384 () {
  this.init()
  this._w = W

  Hash.call(this, 128, 112)
}

inherits(Sha384, SHA512)

Sha384.prototype.init = function () {
  this._ah = 0xcbbb9d5d
  this._bh = 0x629a292a
  this._ch = 0x9159015a
  this._dh = 0x152fecd8
  this._eh = 0x67332667
  this._fh = 0x8eb44a87
  this._gh = 0xdb0c2e0d
  this._hh = 0x47b5481d

  this._al = 0xc1059ed8
  this._bl = 0x367cd507
  this._cl = 0x3070dd17
  this._dl = 0xf70e5939
  this._el = 0xffc00b31
  this._fl = 0x68581511
  this._gl = 0x64f98fa7
  this._hl = 0xbefa4fa4

  return this
}

Sha384.prototype._hash = function () {
  var H = Buffer.allocUnsafe(48)

  function writeInt64BE (h, l, offset) {
    H.writeInt32BE(h, offset)
    H.writeInt32BE(l, offset + 4)
  }

  writeInt64BE(this._ah, this._al, 0)
  writeInt64BE(this._bh, this._bl, 8)
  writeInt64BE(this._ch, this._cl, 16)
  writeInt64BE(this._dh, this._dl, 24)
  writeInt64BE(this._eh, this._el, 32)
  writeInt64BE(this._fh, this._fl, 40)

  return H
}

module.exports = Sha384

},{"inherits":"../node_modules/inherits/inherits_browser.js","./sha512":"../node_modules/sha.js/sha512.js","./hash":"../node_modules/sha.js/hash.js","safe-buffer":"../node_modules/safe-buffer/index.js"}],"../node_modules/sha.js/index.js":[function(require,module,exports) {
var exports = module.exports = function SHA (algorithm) {
  algorithm = algorithm.toLowerCase()

  var Algorithm = exports[algorithm]
  if (!Algorithm) throw new Error(algorithm + ' is not supported (we accept pull requests)')

  return new Algorithm()
}

exports.sha = require('./sha')
exports.sha1 = require('./sha1')
exports.sha224 = require('./sha224')
exports.sha256 = require('./sha256')
exports.sha384 = require('./sha384')
exports.sha512 = require('./sha512')

},{"./sha":"../node_modules/sha.js/sha.js","./sha1":"../node_modules/sha.js/sha1.js","./sha224":"../node_modules/sha.js/sha224.js","./sha256":"../node_modules/sha.js/sha256.js","./sha384":"../node_modules/sha.js/sha384.js","./sha512":"../node_modules/sha.js/sha512.js"}],"../node_modules/create-hmac/browser.js":[function(require,module,exports) {

'use strict'
var inherits = require('inherits')
var Legacy = require('./legacy')
var Base = require('cipher-base')
var Buffer = require('safe-buffer').Buffer
var md5 = require('create-hash/md5')
var RIPEMD160 = require('ripemd160')

var sha = require('sha.js')

var ZEROS = Buffer.alloc(128)

function Hmac (alg, key) {
  Base.call(this, 'digest')
  if (typeof key === 'string') {
    key = Buffer.from(key)
  }

  var blocksize = (alg === 'sha512' || alg === 'sha384') ? 128 : 64

  this._alg = alg
  this._key = key
  if (key.length > blocksize) {
    var hash = alg === 'rmd160' ? new RIPEMD160() : sha(alg)
    key = hash.update(key).digest()
  } else if (key.length < blocksize) {
    key = Buffer.concat([key, ZEROS], blocksize)
  }

  var ipad = this._ipad = Buffer.allocUnsafe(blocksize)
  var opad = this._opad = Buffer.allocUnsafe(blocksize)

  for (var i = 0; i < blocksize; i++) {
    ipad[i] = key[i] ^ 0x36
    opad[i] = key[i] ^ 0x5C
  }
  this._hash = alg === 'rmd160' ? new RIPEMD160() : sha(alg)
  this._hash.update(ipad)
}

inherits(Hmac, Base)

Hmac.prototype._update = function (data) {
  this._hash.update(data)
}

Hmac.prototype._final = function () {
  var h = this._hash.digest()
  var hash = this._alg === 'rmd160' ? new RIPEMD160() : sha(this._alg)
  return hash.update(this._opad).update(h).digest()
}

module.exports = function createHmac (alg, key) {
  alg = alg.toLowerCase()
  if (alg === 'rmd160' || alg === 'ripemd160') {
    return new Hmac('rmd160', key)
  }
  if (alg === 'md5') {
    return new Legacy(md5, key)
  }
  return new Hmac(alg, key)
}

},{"inherits":"../node_modules/inherits/inherits_browser.js","./legacy":"../node_modules/create-hmac/legacy.js","cipher-base":"../node_modules/cipher-base/index.js","safe-buffer":"../node_modules/safe-buffer/index.js","create-hash/md5":"../node_modules/create-hash/md5.js","ripemd160":"../node_modules/ripemd160/index.js","sha.js":"../node_modules/sha.js/index.js"}],"../node_modules/pbkdf2-compat/browser.js":[function(require,module,exports) {
var Buffer = require("buffer").Buffer;
var createHmac = require('create-hmac')

exports.pbkdf2 = pbkdf2
function pbkdf2 (password, salt, iterations, keylen, digest, callback) {
  if (typeof digest === 'function') {
    callback = digest
    digest = undefined
  }

  if (typeof callback !== 'function') {
    throw new Error('No callback provided to pbkdf2')
  }

  var result = pbkdf2Sync(password, salt, iterations, keylen, digest)
  setTimeout(function () {
    callback(undefined, result)
  })
}

exports.pbkdf2Sync = pbkdf2Sync
function pbkdf2Sync (password, salt, iterations, keylen, digest) {
  if (typeof iterations !== 'number')
    throw new TypeError('Iterations not a number')

  if (iterations < 0)
    throw new TypeError('Bad iterations')

  if (typeof keylen !== 'number')
    throw new TypeError('Key length not a number')

  if (keylen < 0)
    throw new TypeError('Bad key length')

  digest = digest || 'sha1'

  if (!Buffer.isBuffer(password)) password = new Buffer(password)
  if (!Buffer.isBuffer(salt)) salt = new Buffer(salt)

  var hLen
  var l = 1
  var DK = new Buffer(keylen)
  var block1 = new Buffer(salt.length + 4)
  salt.copy(block1, 0, 0, salt.length)

  var r
  var T

  for (var i = 1; i <= l; i++) {
    block1.writeUInt32BE(i, salt.length)
    var U = createHmac(digest, password).update(block1).digest()

    if (!hLen) {
      hLen = U.length
      T = new Buffer(hLen)
      l = Math.ceil(keylen / hLen)
      r = keylen - (l - 1) * hLen

      if (keylen > (Math.pow(2, 32) - 1) * hLen)
        throw new TypeError('keylen exceeds maximum length')
    }

    U.copy(T, 0, 0, hLen)

    for (var j = 1; j < iterations; j++) {
      U = createHmac(digest, password).update(U).digest()

      for (var k = 0; k < hLen; k++) {
        T[k] ^= U[k]
      }
    }

    var destPos = (i - 1) * hLen
    var len = (i === l ? r : hLen)
    T.copy(DK, destPos, 0, len)
  }

  return DK
}

},{"create-hmac":"../node_modules/create-hmac/browser.js","buffer":"../node_modules/buffer/index.js"}],"../node_modules/is-hex/is-hex.js":[function(require,module,exports) {
'use strict'

var hexRegEx = /([0-9]|[a-f])/gim

module.exports = function (input) {
  return typeof input === 'string' &&
    (input.match(hexRegEx) || []).length === input.length
}

},{}],"../node_modules/randombytes/browser.js":[function(require,module,exports) {

var global = arguments[3];
var process = require("process");
'use strict'

// limit of Crypto.getRandomValues()
// https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
var MAX_BYTES = 65536

// Node supports requesting up to this number of bytes
// https://github.com/nodejs/node/blob/master/lib/internal/crypto/random.js#L48
var MAX_UINT32 = 4294967295

function oldBrowser () {
  throw new Error('Secure random number generation is not supported by this browser.\nUse Chrome, Firefox or Internet Explorer 11')
}

var Buffer = require('safe-buffer').Buffer
var crypto = global.crypto || global.msCrypto

if (crypto && crypto.getRandomValues) {
  module.exports = randomBytes
} else {
  module.exports = oldBrowser
}

function randomBytes (size, cb) {
  // phantomjs needs to throw
  if (size > MAX_UINT32) throw new RangeError('requested too many random bytes')

  var bytes = Buffer.allocUnsafe(size)

  if (size > 0) {  // getRandomValues fails on IE if size == 0
    if (size > MAX_BYTES) { // this is the max bytes crypto.getRandomValues
      // can do at once see https://developer.mozilla.org/en-US/docs/Web/API/window.crypto.getRandomValues
      for (var generated = 0; generated < size; generated += MAX_BYTES) {
        // buffer.slice automatically checks if the end is past the end of
        // the buffer so we don't have to here
        crypto.getRandomValues(bytes.slice(generated, generated + MAX_BYTES))
      }
    } else {
      crypto.getRandomValues(bytes)
    }
  }

  if (typeof cb === 'function') {
    return process.nextTick(function () {
      cb(null, bytes)
    })
  }

  return bytes
}

},{"safe-buffer":"../node_modules/safe-buffer/index.js","process":"../node_modules/process/browser.js"}],"../node_modules/bsv/dist/bsv.modern.js":[function(require,module,exports) {
var Buffer = require("buffer").Buffer;
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Bn = Bn;
exports.version = exports.jp = exports.en = exports.deps = exports.cmp = exports.WorkersResult = exports.Workers = exports.VarInt = exports.TxVerifier = exports.TxOutMap = exports.TxOut = exports.TxIn = exports.TxBuilder = exports.Tx = exports.Struct = exports.Sig = exports.Script = exports.Random = exports.PubKey = exports.PrivKey = exports.Point = exports.OpCode = exports.KeyPair = exports.Interp = exports.Hash = exports.Ecies = exports.Ecdsa = exports.Constants = exports.Cbc = exports.Bw = exports.Bsm = exports.Br = exports.BlockHeader = exports.Block = exports.Bip39 = exports.Bip32 = exports.Base58Check = exports.Base58 = exports.Aescbc = exports.Aes = exports.Address = exports.Ach = void 0;

var _aes = _interopRequireDefault(require("aes"));

var _bn7 = _interopRequireDefault(require("bn.js"));

var _bs = _interopRequireDefault(require("bs58"));

var _bitcoinElliptic = _interopRequireDefault(require("bitcoin-elliptic"));

var _hash2 = _interopRequireDefault(require("hash.js"));

var _pbkdf2Compat = _interopRequireDefault(require("pbkdf2-compat"));

var _isHex = _interopRequireDefault(require("is-hex"));

var _randombytes = _interopRequireDefault(require("randombytes"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _construct(Parent, args, Class) { if (_isNativeReflectConstruct()) { _construct = Reflect.construct; } else { _construct = function _construct(Parent, args, Class) { var a = [null]; a.push.apply(a, args); var Constructor = Function.bind.apply(Parent, a); var instance = new Constructor(); if (Class) _setPrototypeOf(instance, Class.prototype); return instance; }; } return _construct.apply(null, arguments); }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var version = "2.0.0-beta.39";
exports.version = version;

function Bn(n, base) {
  for (var _len = arguments.length, rest = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    rest[_key - 2] = arguments[_key];
  }

  if (!(this instanceof Bn)) {
    return _construct(Bn, [n, base].concat(rest));
  }

  _bn7.default.call.apply(_bn7.default, [this, n, base].concat(rest));
}

Object.keys(_bn7.default).forEach(function (key) {
  Bn[key] = _bn7.default[key];
});
Bn.prototype = Object.create(_bn7.default.prototype);
Bn.prototype.constructor = Bn;

function reverseBuf(buf) {
  var buf2 = Buffer.alloc(buf.length);

  for (var i = 0; i < buf.length; i++) {
    buf2[i] = buf[buf.length - 1 - i];
  }

  return buf2;
}

Bn.prototype.fromHex = function (hex, opts) {
  return this.fromBuffer(Buffer.from(hex, 'hex'), opts);
};

Bn.prototype.toHex = function (opts) {
  return this.toBuffer(opts).toString('hex');
};

Bn.prototype.toJSON = function () {
  return this.toString();
};

Bn.prototype.fromJSON = function (str) {
  var bn = Bn(str);
  bn.copy(this);
  return this;
};

Bn.prototype.fromNumber = function (n) {
  var bn = Bn(n);
  bn.copy(this);
  return this;
};

Bn.prototype.toNumber = function () {
  return parseInt(this.toString(10), 10);
};

Bn.prototype.fromString = function (str, base) {
  var bn = Bn(str, base);
  bn.copy(this);
  return this;
};

Bn.fromBuffer = function (buf) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
    endian: 'big'
  };

  if (opts.endian === 'little') {
    buf = reverseBuf(buf);
  }

  var hex = buf.toString('hex');
  var bn = new Bn(hex, 16);
  return bn;
};

Bn.prototype.fromBuffer = function (buf, opts) {
  var bn = Bn.fromBuffer(buf, opts);
  bn.copy(this);
  return this;
};

Bn.prototype.toBuffer = function () {
  var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
    size: undefined,
    endian: 'big'
  };
  var buf;

  if (opts.size) {
    var hex = this.toString(16, 2);
    var natlen = hex.length / 2;
    buf = Buffer.from(hex, 'hex');
    if (natlen === opts.size) ;else if (natlen > opts.size) {
      buf = buf.slice(natlen - buf.length, buf.length);
    } else if (natlen < opts.size) {
      var rbuf = Buffer.alloc(opts.size);

      for (var i = 0; i < buf.length; i++) {
        rbuf[rbuf.length - 1 - i] = buf[buf.length - 1 - i];
      }

      for (var _i = 0; _i < opts.size - natlen; _i++) {
        rbuf[_i] = 0;
      }

      buf = rbuf;
    }
  } else {
    var _hex = this.toString(16, 2);

    buf = Buffer.from(_hex, 'hex');
  }

  if (opts.endian === 'little') {
    buf = reverseBuf(buf);
  }

  var longzero = Buffer.from([0]);

  if (Buffer.compare(buf, longzero) === 0) {
    return Buffer.from([]);
  }

  return buf;
};

Bn.prototype.toFastBuffer = Bn.prototype.toBuffer;
Bn.fromFastBuffer = Bn.fromBuffer;
Bn.prototype.fromFastBuffer = Bn.prototype.fromBuffer;

Bn.prototype.fromSm = function (buf) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
    endian: 'big'
  };

  if (buf.length === 0) {
    this.fromBuffer(Buffer.from([0]));
  }

  var endian = opts.endian;

  if (endian === 'little') {
    buf = reverseBuf(buf);
  }

  if (buf[0] & 0x80) {
    buf[0] = buf[0] & 0x7f;
    this.fromBuffer(buf);
    this.neg().copy(this);
  } else {
    this.fromBuffer(buf);
  }

  return this;
};

Bn.prototype.toSm = function () {
  var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
    endian: 'big'
  };
  var endian = opts.endian;
  var buf;

  if (this.cmp(0) === -1) {
    buf = this.neg().toBuffer();

    if (buf[0] & 0x80) {
      buf = Buffer.concat([Buffer.from([0x80]), buf]);
    } else {
      buf[0] = buf[0] | 0x80;
    }
  } else {
    buf = this.toBuffer();

    if (buf[0] & 0x80) {
      buf = Buffer.concat([Buffer.from([0x00]), buf]);
    }
  }

  if (buf.length === 1 & buf[0] === 0) {
    buf = Buffer.from([]);
  }

  if (endian === 'little') {
    buf = reverseBuf(buf);
  }

  return buf;
};

Bn.prototype.fromBits = function (bits) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
    strict: false
  };
  var buf = Buffer.alloc(4);
  buf.writeUInt32BE(bits, 0);
  bits = buf.readInt32BE(0);

  if (opts.strict && bits & 0x00800000) {
    throw new Error('negative bit set');
  }

  var nsize = bits >> 24;
  var nword = bits & 0x007fffff;
  buf = Buffer.alloc(4);
  buf.writeInt32BE(nword);

  if (nsize <= 3) {
    buf = buf.slice(1, nsize + 1);
  } else {
    var fill = Buffer.alloc(nsize - 3);
    fill.fill(0);
    buf = Buffer.concat([buf, fill]);
  }

  this.fromBuffer(buf);

  if (bits & 0x00800000) {
    Bn(0).sub(this).copy(this);
  }

  return this;
};

Bn.prototype.toBits = function () {
  var buf;

  if (this.lt(0)) {
    buf = this.neg().toBuffer();
  } else {
    buf = this.toBuffer();
  }

  var nsize = buf.length;
  var nword;

  if (nsize > 3) {
    nword = Buffer.concat([Buffer.from([0]), buf.slice(0, 3)]).readUInt32BE(0);
  } else if (nsize <= 3) {
    var blank = Buffer.alloc(3 - nsize + 1);
    blank.fill(0);
    nword = Buffer.concat([blank, buf.slice(0, nsize)]).readUInt32BE(0);
  }

  if (nword & 0x00800000) {
    nword >>= 8;
    nsize++;
  }

  if (this.lt(0)) {
    nword |= 0x00800000;
  }

  var bits = nsize << 24 | nword;
  buf = Buffer.alloc(4);
  buf.writeInt32BE(bits, 0);
  return buf.readUInt32BE(0);
};

Bn.prototype.fromScriptNumBuffer = function (buf, fRequireMinimal, nMaxNumSize) {
  if (nMaxNumSize === undefined) {
    nMaxNumSize = 4;
  }

  if (buf.length > nMaxNumSize) {
    throw new Error('script number overflow');
  }

  if (fRequireMinimal && buf.length > 0) {
    if ((buf[buf.length - 1] & 0x7f) === 0) {
      if (buf.length <= 1 || (buf[buf.length - 2] & 0x80) === 0) {
        throw new Error('non-minimally encoded script number');
      }
    }
  }

  return this.fromSm(buf, {
    endian: 'little'
  });
};

Bn.prototype.toScriptNumBuffer = function (buf) {
  return this.toSm({
    endian: 'little'
  });
};

Bn.prototype.neg = function () {
  var _neg = _bn7.default.prototype.neg.call(this);

  var neg = Object.create(Bn.prototype);

  _neg.copy(neg);

  return neg;
};

Bn.prototype.add = function (bn) {
  var _bn = _bn7.default.prototype.add.call(this, bn);

  bn = Object.create(Bn.prototype);

  _bn.copy(bn);

  return bn;
};

Bn.prototype.sub = function (bn) {
  var _bn = _bn7.default.prototype.sub.call(this, bn);

  bn = Object.create(Bn.prototype);

  _bn.copy(bn);

  return bn;
};

Bn.prototype.mul = function (bn) {
  var _bn = _bn7.default.prototype.mul.call(this, bn);

  bn = Object.create(Bn.prototype);

  _bn.copy(bn);

  return bn;
};

Bn.prototype.mod = function (bn) {
  var _bn = _bn7.default.prototype.mod.call(this, bn);

  bn = Object.create(Bn.prototype);

  _bn.copy(bn);

  return bn;
};

Bn.prototype.umod = function (bn) {
  var _bn = _bn7.default.prototype.umod.call(this, bn);

  bn = Object.create(Bn.prototype);

  _bn.copy(bn);

  return bn;
};

Bn.prototype.invm = function (bn) {
  var _bn = _bn7.default.prototype.invm.call(this, bn);

  bn = Object.create(Bn.prototype);

  _bn.copy(bn);

  return bn;
};

Bn.prototype.div = function (bn) {
  var _bn = _bn7.default.prototype.div.call(this, bn);

  bn = Object.create(Bn.prototype);

  _bn.copy(bn);

  return bn;
};

Bn.prototype.cmp = function (bn) {
  return _bn7.default.prototype.cmp.call(this, bn);
};

function decorate(name) {
  Bn.prototype['_' + name] = Bn.prototype[name];

  var f = function f(b) {
    if (typeof b === 'string') {
      b = new Bn(b);
    } else if (typeof b === 'number') {
      b = new Bn(b.toString());
    }

    return this['_' + name](b);
  };

  Bn.prototype[name] = f;
}

Bn.prototype.eq = function (b) {
  return this.cmp(b) === 0;
};

Bn.prototype.neq = function (b) {
  return this.cmp(b) !== 0;
};

Bn.prototype.gt = function (b) {
  return this.cmp(b) > 0;
};

Bn.prototype.geq = function (b) {
  return this.cmp(b) >= 0;
};

Bn.prototype.lt = function (b) {
  return this.cmp(b) < 0;
};

Bn.prototype.leq = function (b) {
  return this.cmp(b) <= 0;
};

decorate('add');
decorate('sub');
decorate('mul');
decorate('mod');
decorate('invm');
decorate('div');
decorate('cmp');
decorate('gt');
decorate('geq');
decorate('lt');
decorate('leq');

var Br = /*#__PURE__*/function () {
  function Br(buf) {
    _classCallCheck(this, Br);

    this.fromObject({
      buf: buf
    });
  }

  _createClass(Br, [{
    key: "fromObject",
    value: function fromObject(obj) {
      this.buf = obj.buf || this.buf || undefined;
      this.pos = obj.pos || this.pos || 0;
      return this;
    }
  }, {
    key: "eof",
    value: function eof() {
      return this.pos >= this.buf.length;
    }
  }, {
    key: "read",
    value: function read() {
      var len = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.buf.length;
      var buf = this.buf.slice(this.pos, this.pos + len);
      this.pos = this.pos + len;
      return buf;
    }
  }, {
    key: "readReverse",
    value: function readReverse() {
      var len = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.buf.length;
      var buf = this.buf.slice(this.pos, this.pos + len);
      this.pos = this.pos + len;
      var buf2 = Buffer.alloc(buf.length);

      for (var i = 0; i < buf2.length; i++) {
        buf2[i] = buf[buf.length - 1 - i];
      }

      return buf2;
    }
  }, {
    key: "readUInt8",
    value: function readUInt8() {
      var val = this.buf.readUInt8(this.pos);
      this.pos = this.pos + 1;
      return val;
    }
  }, {
    key: "readInt8",
    value: function readInt8() {
      var val = this.buf.readInt8(this.pos);
      this.pos = this.pos + 1;
      return val;
    }
  }, {
    key: "readUInt16BE",
    value: function readUInt16BE() {
      var val = this.buf.readUInt16BE(this.pos);
      this.pos = this.pos + 2;
      return val;
    }
  }, {
    key: "readInt16BE",
    value: function readInt16BE() {
      var val = this.buf.readInt16BE(this.pos);
      this.pos = this.pos + 2;
      return val;
    }
  }, {
    key: "readUInt16LE",
    value: function readUInt16LE() {
      var val = this.buf.readUInt16LE(this.pos);
      this.pos = this.pos + 2;
      return val;
    }
  }, {
    key: "readInt16LE",
    value: function readInt16LE() {
      var val = this.buf.readInt16LE(this.pos);
      this.pos = this.pos + 2;
      return val;
    }
  }, {
    key: "readUInt32BE",
    value: function readUInt32BE() {
      var val = this.buf.readUInt32BE(this.pos);
      this.pos = this.pos + 4;
      return val;
    }
  }, {
    key: "readInt32BE",
    value: function readInt32BE() {
      var val = this.buf.readInt32BE(this.pos);
      this.pos = this.pos + 4;
      return val;
    }
  }, {
    key: "readUInt32LE",
    value: function readUInt32LE() {
      var val = this.buf.readUInt32LE(this.pos);
      this.pos = this.pos + 4;
      return val;
    }
  }, {
    key: "readInt32LE",
    value: function readInt32LE() {
      var val = this.buf.readInt32LE(this.pos);
      this.pos = this.pos + 4;
      return val;
    }
  }, {
    key: "readUInt64BEBn",
    value: function readUInt64BEBn() {
      var buf = this.buf.slice(this.pos, this.pos + 8);
      var bn = new Bn().fromBuffer(buf);
      this.pos = this.pos + 8;
      return bn;
    }
  }, {
    key: "readUInt64LEBn",
    value: function readUInt64LEBn() {
      var buf = this.readReverse(8);
      var bn = new Bn().fromBuffer(buf);
      return bn;
    }
  }, {
    key: "readVarIntNum",
    value: function readVarIntNum() {
      var first = this.readUInt8();
      var bn, n;

      switch (first) {
        case 0xfd:
          return this.readUInt16LE();

        case 0xfe:
          return this.readUInt32LE();

        case 0xff:
          bn = this.readUInt64LEBn();
          n = bn.toNumber();

          if (n <= Math.pow(2, 53)) {
            return n;
          } else {
            throw new Error('number too large to retain precision - use readVarIntBn');
          }

        default:
          return first;
      }
    }
  }, {
    key: "readVarIntBuf",
    value: function readVarIntBuf() {
      var first = this.buf.readUInt8(this.pos);

      switch (first) {
        case 0xfd:
          return this.read(1 + 2);

        case 0xfe:
          return this.read(1 + 4);

        case 0xff:
          return this.read(1 + 8);

        default:
          return this.read(1);
      }
    }
  }, {
    key: "readVarIntBn",
    value: function readVarIntBn() {
      var first = this.readUInt8();

      switch (first) {
        case 0xfd:
          return new Bn(this.readUInt16LE());

        case 0xfe:
          return new Bn(this.readUInt32LE());

        case 0xff:
          return this.readUInt64LEBn();

        default:
          return new Bn(first);
      }
    }
  }]);

  return Br;
}();

exports.Br = Br;

var Bw = /*#__PURE__*/function () {
  function Bw(bufs) {
    _classCallCheck(this, Bw);

    this.fromObject({
      bufs: bufs
    });
  }

  _createClass(Bw, [{
    key: "fromObject",
    value: function fromObject(obj) {
      this.bufs = obj.bufs || this.bufs || [];
      return this;
    }
  }, {
    key: "getLength",
    value: function getLength() {
      var len = 0;

      for (var i in this.bufs) {
        var buf = this.bufs[i];
        len = len + buf.length;
      }

      return len;
    }
  }, {
    key: "toBuffer",
    value: function toBuffer() {
      return Buffer.concat(this.bufs);
    }
  }, {
    key: "write",
    value: function write(buf) {
      this.bufs.push(buf);
      return this;
    }
  }, {
    key: "writeReverse",
    value: function writeReverse(buf) {
      var buf2 = Buffer.alloc(buf.length);

      for (var i = 0; i < buf2.length; i++) {
        buf2[i] = buf[buf.length - 1 - i];
      }

      this.bufs.push(buf2);
      return this;
    }
  }, {
    key: "writeUInt8",
    value: function writeUInt8(n) {
      var buf = Buffer.alloc(1);
      buf.writeUInt8(n, 0);
      this.write(buf);
      return this;
    }
  }, {
    key: "writeInt8",
    value: function writeInt8(n) {
      var buf = Buffer.alloc(1);
      buf.writeInt8(n, 0);
      this.write(buf);
      return this;
    }
  }, {
    key: "writeUInt16BE",
    value: function writeUInt16BE(n) {
      var buf = Buffer.alloc(2);
      buf.writeUInt16BE(n, 0);
      this.write(buf);
      return this;
    }
  }, {
    key: "writeInt16BE",
    value: function writeInt16BE(n) {
      var buf = Buffer.alloc(2);
      buf.writeInt16BE(n, 0);
      this.write(buf);
      return this;
    }
  }, {
    key: "writeUInt16LE",
    value: function writeUInt16LE(n) {
      var buf = Buffer.alloc(2);
      buf.writeUInt16LE(n, 0);
      this.write(buf);
      return this;
    }
  }, {
    key: "writeInt16LE",
    value: function writeInt16LE(n) {
      var buf = Buffer.alloc(2);
      buf.writeInt16LE(n, 0);
      this.write(buf);
      return this;
    }
  }, {
    key: "writeUInt32BE",
    value: function writeUInt32BE(n) {
      var buf = Buffer.alloc(4);
      buf.writeUInt32BE(n, 0);
      this.write(buf);
      return this;
    }
  }, {
    key: "writeInt32BE",
    value: function writeInt32BE(n) {
      var buf = Buffer.alloc(4);
      buf.writeInt32BE(n, 0);
      this.write(buf);
      return this;
    }
  }, {
    key: "writeUInt32LE",
    value: function writeUInt32LE(n) {
      var buf = Buffer.alloc(4);
      buf.writeUInt32LE(n, 0);
      this.write(buf);
      return this;
    }
  }, {
    key: "writeInt32LE",
    value: function writeInt32LE(n) {
      var buf = Buffer.alloc(4);
      buf.writeInt32LE(n, 0);
      this.write(buf);
      return this;
    }
  }, {
    key: "writeUInt64BEBn",
    value: function writeUInt64BEBn(bn) {
      var buf = bn.toBuffer({
        size: 8
      });
      this.write(buf);
      return this;
    }
  }, {
    key: "writeUInt64LEBn",
    value: function writeUInt64LEBn(bn) {
      var buf = bn.toBuffer({
        size: 8
      });
      this.writeReverse(buf);
      return this;
    }
  }, {
    key: "writeVarIntNum",
    value: function writeVarIntNum(n) {
      var buf = Bw.varIntBufNum(n);
      this.write(buf);
      return this;
    }
  }, {
    key: "writeVarIntBn",
    value: function writeVarIntBn(bn) {
      var buf = Bw.varIntBufBn(bn);
      this.write(buf);
      return this;
    }
  }], [{
    key: "varIntBufNum",
    value: function varIntBufNum(n) {
      var buf;

      if (n < 253) {
        buf = Buffer.alloc(1);
        buf.writeUInt8(n, 0);
      } else if (n < 0x10000) {
        buf = Buffer.alloc(1 + 2);
        buf.writeUInt8(253, 0);
        buf.writeUInt16LE(n, 1);
      } else if (n < 0x100000000) {
        buf = Buffer.alloc(1 + 4);
        buf.writeUInt8(254, 0);
        buf.writeUInt32LE(n, 1);
      } else {
        buf = Buffer.alloc(1 + 8);
        buf.writeUInt8(255, 0);
        buf.writeInt32LE(n & -1, 1);
        buf.writeUInt32LE(Math.floor(n / 0x100000000), 5);
      }

      return buf;
    }
  }, {
    key: "varIntBufBn",
    value: function varIntBufBn(bn) {
      var buf;
      var n = bn.toNumber();

      if (n < 253) {
        buf = Buffer.alloc(1);
        buf.writeUInt8(n, 0);
      } else if (n < 0x10000) {
        buf = Buffer.alloc(1 + 2);
        buf.writeUInt8(253, 0);
        buf.writeUInt16LE(n, 1);
      } else if (n < 0x100000000) {
        buf = Buffer.alloc(1 + 4);
        buf.writeUInt8(254, 0);
        buf.writeUInt32LE(n, 1);
      } else {
        var bw = new Bw();
        bw.writeUInt8(255);
        bw.writeUInt64LEBn(bn);
        buf = bw.toBuffer();
      }

      return buf;
    }
  }]);

  return Bw;
}();

exports.Bw = Bw;

var Struct = /*#__PURE__*/function () {
  function Struct(obj) {
    _classCallCheck(this, Struct);

    this.fromObject(obj);
  }

  _createClass(Struct, [{
    key: "fromObject",
    value: function fromObject(obj) {
      if (!obj) {
        return this;
      }

      for (var _i2 = 0, _Object$keys = Object.keys(obj); _i2 < _Object$keys.length; _i2++) {
        var key = _Object$keys[_i2];

        if (obj[key] !== undefined) {
          this[key] = obj[key];
        }
      }

      return this;
    }
  }, {
    key: "fromBr",
    value: function fromBr(br) {
      if (!(br instanceof Br)) {
        throw new Error('br must be a buffer reader');
      }

      throw new Error('not implemented');
    }
  }, {
    key: "asyncFromBr",
    value: function asyncFromBr(br) {
      if (!(br instanceof Br)) {
        throw new Error('br must be a buffer reader');
      }

      throw new Error('not implemented');
    }
  }, {
    key: "toBw",
    value: function toBw(bw) {
      throw new Error('not implemented');
    }
  }, {
    key: "asyncToBw",
    value: function asyncToBw(bw) {
      throw new Error('not implemented');
    }
  }, {
    key: "genFromBuffers",
    value: /*#__PURE__*/regeneratorRuntime.mark(function genFromBuffers() {
      return regeneratorRuntime.wrap(function genFromBuffers$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              throw new Error('not implemented');

            case 1:
            case "end":
              return _context.stop();
          }
        }
      }, genFromBuffers);
    })
  }, {
    key: "expect",
    value: /*#__PURE__*/regeneratorRuntime.mark(function expect(len, startbuf) {
      var buf, bw, gotlen, remainderlen, overlen, remainderbuf;
      return regeneratorRuntime.wrap(function expect$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              buf = startbuf;
              bw = new Bw();
              gotlen = 0;

              if (startbuf) {
                bw.write(startbuf);
                gotlen += startbuf.length;
              }

            case 4:
              if (!(gotlen < len)) {
                _context2.next = 15;
                break;
              }

              remainderlen = len - gotlen;
              _context2.next = 8;
              return remainderlen;

            case 8:
              buf = _context2.sent;

              if (buf) {
                _context2.next = 11;
                break;
              }

              return _context2.abrupt("continue", 4);

            case 11:
              bw.write(buf);
              gotlen += buf.length;
              _context2.next = 4;
              break;

            case 15:
              buf = bw.toBuffer();
              overlen = gotlen - len;
              remainderbuf = buf.slice(buf.length - overlen, buf.length);
              buf = buf.slice(0, buf.length - overlen);
              return _context2.abrupt("return", {
                buf: buf,
                remainderbuf: remainderbuf
              });

            case 20:
            case "end":
              return _context2.stop();
          }
        }
      }, expect);
    })
  }, {
    key: "fromBuffer",
    value: function fromBuffer(buf) {
      if (!Buffer.isBuffer(buf)) {
        throw new Error('buf must be a buffer');
      }

      var br = new Br(buf);

      for (var _len2 = arguments.length, rest = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        rest[_key2 - 1] = arguments[_key2];
      }

      return this.fromBr.apply(this, [br].concat(rest));
    }
  }, {
    key: "asyncFromBuffer",
    value: function asyncFromBuffer(buf) {
      if (!Buffer.isBuffer(buf)) {
        throw new Error('buf must be a buffer');
      }

      var br = new Br(buf);

      for (var _len3 = arguments.length, rest = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
        rest[_key3 - 1] = arguments[_key3];
      }

      return this.asyncFromBr.apply(this, [br].concat(rest));
    }
  }, {
    key: "fromFastBuffer",
    value: function fromFastBuffer(buf) {
      if (buf.length === 0) {
        return this;
      } else {
        for (var _len4 = arguments.length, rest = new Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
          rest[_key4 - 1] = arguments[_key4];
        }

        return this.fromBuffer.apply(this, [buf].concat(rest));
      }
    }
  }, {
    key: "toBuffer",
    value: function toBuffer() {
      return this.toBw.apply(this, arguments).toBuffer();
    }
  }, {
    key: "asyncToBuffer",
    value: function asyncToBuffer() {
      return this.asyncToBw.apply(this, arguments).then(function (bw) {
        return bw.toBuffer();
      });
    }
  }, {
    key: "toFastBuffer",
    value: function toFastBuffer() {
      if (Object.keys(this).length === 0) {
        return Buffer.alloc(0);
      } else {
        return this.toBuffer.apply(this, arguments);
      }
    }
  }, {
    key: "fromHex",
    value: function fromHex(hex) {
      if (!(0, _isHex.default)(hex)) {
        throw new Error('invalid hex string');
      }

      var buf = Buffer.from(hex, 'hex');

      for (var _len5 = arguments.length, rest = new Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1; _key5 < _len5; _key5++) {
        rest[_key5 - 1] = arguments[_key5];
      }

      return this.fromBuffer.apply(this, [buf].concat(rest));
    }
  }, {
    key: "asyncFromHex",
    value: function asyncFromHex(hex) {
      if (!(0, _isHex.default)(hex)) {
        throw new Error('invalid hex string');
      }

      var buf = Buffer.from(hex, 'hex');

      for (var _len6 = arguments.length, rest = new Array(_len6 > 1 ? _len6 - 1 : 0), _key6 = 1; _key6 < _len6; _key6++) {
        rest[_key6 - 1] = arguments[_key6];
      }

      return this.asyncFromBuffer.apply(this, [buf].concat(rest));
    }
  }, {
    key: "fromFastHex",
    value: function fromFastHex(hex) {
      if (!(0, _isHex.default)(hex)) {
        throw new Error('invalid hex string');
      }

      var buf = Buffer.from(hex, 'hex');

      for (var _len7 = arguments.length, rest = new Array(_len7 > 1 ? _len7 - 1 : 0), _key7 = 1; _key7 < _len7; _key7++) {
        rest[_key7 - 1] = arguments[_key7];
      }

      return this.fromFastBuffer.apply(this, [buf].concat(rest));
    }
  }, {
    key: "toHex",
    value: function toHex() {
      return this.toBuffer.apply(this, arguments).toString('hex');
    }
  }, {
    key: "asyncToHex",
    value: function asyncToHex() {
      return this.asyncToBuffer.apply(this, arguments).then(function (buf) {
        return buf.toString('hex');
      });
    }
  }, {
    key: "toFastHex",
    value: function toFastHex() {
      return this.toFastBuffer.apply(this, arguments).toString('hex');
    }
  }, {
    key: "fromString",
    value: function fromString(str) {
      if (typeof str !== 'string') {
        throw new Error('str must be a string');
      }

      for (var _len8 = arguments.length, rest = new Array(_len8 > 1 ? _len8 - 1 : 0), _key8 = 1; _key8 < _len8; _key8++) {
        rest[_key8 - 1] = arguments[_key8];
      }

      return this.fromHex.apply(this, [str].concat(rest));
    }
  }, {
    key: "asyncFromString",
    value: function asyncFromString(str) {
      if (typeof str !== 'string') {
        throw new Error('str must be a string');
      }

      for (var _len9 = arguments.length, rest = new Array(_len9 > 1 ? _len9 - 1 : 0), _key9 = 1; _key9 < _len9; _key9++) {
        rest[_key9 - 1] = arguments[_key9];
      }

      return this.asyncFromHex.apply(this, [str].concat(rest));
    }
  }, {
    key: "toString",
    value: function toString() {
      return this.toHex.apply(this, arguments);
    }
  }, {
    key: "asyncToString",
    value: function asyncToString() {
      return this.asyncToHex.apply(this, arguments);
    }
  }, {
    key: "fromJSON",
    value: function fromJSON(json) {
      throw new Error('not implemented');
    }
  }, {
    key: "asyncFromJSON",
    value: function asyncFromJSON(json) {
      throw new Error('not implemented');
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      var json = {};

      for (var val in this) {
        if (Array.isArray(this[val])) {
          var arr = [];

          for (var i in this[val]) {
            if (typeof this[val][i].toJSON === 'function') {
              arr.push(this[val][i].toJSON());
            } else {
              arr.push(JSON.stringify(this[val][i]));
            }
          }

          json[val] = arr;
        } else if (this[val] === null) {
          json[val] = this[val];
        } else if (_typeof(this[val]) === 'object' && typeof this[val].toJSON === 'function') {
          json[val] = this[val].toJSON();
        } else if (typeof this[val] === 'boolean' || typeof this[val] === 'number' || typeof this[val] === 'string') {
          json[val] = this[val];
        } else if (Buffer.isBuffer(this[val])) {
          json[val] = this[val].toString('hex');
        } else if (this[val] instanceof Map) {
          json[val] = JSON.stringify(this[val]);
        } else if (_typeof(this[val]) === 'object') {
          throw new Error('not implemented');
        }
      }

      return json;
    }
  }, {
    key: "asyncToJSON",
    value: function asyncToJSON() {
      throw new Error('not implemented');
    }
  }, {
    key: "clone",
    value: function clone() {
      return this.cloneByJSON();
    }
  }, {
    key: "cloneByBuffer",
    value: function cloneByBuffer() {
      return new this.constructor().fromBuffer(this.toBuffer());
    }
  }, {
    key: "cloneByFastBuffer",
    value: function cloneByFastBuffer() {
      return new this.constructor().fromFastBuffer(this.toFastBuffer());
    }
  }, {
    key: "cloneByHex",
    value: function cloneByHex() {
      return new this.constructor().fromHex(this.toHex());
    }
  }, {
    key: "cloneByString",
    value: function cloneByString() {
      return new this.constructor().fromString(this.toString());
    }
  }, {
    key: "cloneByJSON",
    value: function cloneByJSON() {
      return new this.constructor().fromJSON(this.toJSON());
    }
  }], [{
    key: "fromObject",
    value: function fromObject(obj) {
      return new this().fromObject(obj);
    }
  }, {
    key: "fromBr",
    value: function fromBr(br) {
      return new this().fromBr(br);
    }
  }, {
    key: "asyncFromBr",
    value: function asyncFromBr(br) {
      return new this().asyncFromBr(br);
    }
  }, {
    key: "fromBuffer",
    value: function fromBuffer() {
      var _this;

      return (_this = new this()).fromBuffer.apply(_this, arguments);
    }
  }, {
    key: "asyncFromBuffer",
    value: function asyncFromBuffer(buf) {
      var _this2;

      for (var _len10 = arguments.length, rest = new Array(_len10 > 1 ? _len10 - 1 : 0), _key10 = 1; _key10 < _len10; _key10++) {
        rest[_key10 - 1] = arguments[_key10];
      }

      return (_this2 = new this()).asyncFromBuffer.apply(_this2, [buf].concat(rest));
    }
  }, {
    key: "fromFastBuffer",
    value: function fromFastBuffer() {
      var _this3;

      return (_this3 = new this()).fromFastBuffer.apply(_this3, arguments);
    }
  }, {
    key: "fromHex",
    value: function fromHex(hex) {
      var _this4;

      for (var _len11 = arguments.length, rest = new Array(_len11 > 1 ? _len11 - 1 : 0), _key11 = 1; _key11 < _len11; _key11++) {
        rest[_key11 - 1] = arguments[_key11];
      }

      return (_this4 = new this()).fromHex.apply(_this4, [hex].concat(rest));
    }
  }, {
    key: "asyncFromHex",
    value: function asyncFromHex(hex) {
      var _this5;

      for (var _len12 = arguments.length, rest = new Array(_len12 > 1 ? _len12 - 1 : 0), _key12 = 1; _key12 < _len12; _key12++) {
        rest[_key12 - 1] = arguments[_key12];
      }

      return (_this5 = new this()).asyncFromHex.apply(_this5, [hex].concat(rest));
    }
  }, {
    key: "fromFastHex",
    value: function fromFastHex(hex) {
      var _this6;

      for (var _len13 = arguments.length, rest = new Array(_len13 > 1 ? _len13 - 1 : 0), _key13 = 1; _key13 < _len13; _key13++) {
        rest[_key13 - 1] = arguments[_key13];
      }

      return (_this6 = new this()).fromFastHex.apply(_this6, [hex].concat(rest));
    }
  }, {
    key: "fromString",
    value: function fromString(str) {
      var _this7;

      for (var _len14 = arguments.length, rest = new Array(_len14 > 1 ? _len14 - 1 : 0), _key14 = 1; _key14 < _len14; _key14++) {
        rest[_key14 - 1] = arguments[_key14];
      }

      return (_this7 = new this()).fromString.apply(_this7, [str].concat(rest));
    }
  }, {
    key: "asyncFromString",
    value: function asyncFromString(str) {
      var _this8;

      for (var _len15 = arguments.length, rest = new Array(_len15 > 1 ? _len15 - 1 : 0), _key15 = 1; _key15 < _len15; _key15++) {
        rest[_key15 - 1] = arguments[_key15];
      }

      return (_this8 = new this()).asyncFromString.apply(_this8, [str].concat(rest));
    }
  }, {
    key: "fromJSON",
    value: function fromJSON(json) {
      var _this9;

      for (var _len16 = arguments.length, rest = new Array(_len16 > 1 ? _len16 - 1 : 0), _key16 = 1; _key16 < _len16; _key16++) {
        rest[_key16 - 1] = arguments[_key16];
      }

      return (_this9 = new this()).fromJSON.apply(_this9, [json].concat(rest));
    }
  }, {
    key: "asyncFromJSON",
    value: function asyncFromJSON(json) {
      var _this10;

      for (var _len17 = arguments.length, rest = new Array(_len17 > 1 ? _len17 - 1 : 0), _key17 = 1; _key17 < _len17; _key17++) {
        rest[_key17 - 1] = arguments[_key17];
      }

      return (_this10 = new this()).asyncFromJSON.apply(_this10, [json].concat(rest));
    }
  }]);

  return Struct;
}();

exports.Struct = Struct;

var Base58 = /*#__PURE__*/function (_Struct) {
  _inherits(Base58, _Struct);

  var _super = _createSuper(Base58);

  function Base58(buf) {
    _classCallCheck(this, Base58);

    return _super.call(this, {
      buf: buf
    });
  }

  _createClass(Base58, [{
    key: "fromHex",
    value: function fromHex(hex) {
      return this.fromBuffer(Buffer.from(hex, 'hex'));
    }
  }, {
    key: "toHex",
    value: function toHex() {
      return this.toBuffer().toString('hex');
    }
  }, {
    key: "fromBuffer",
    value: function fromBuffer(buf) {
      this.buf = buf;
      return this;
    }
  }, {
    key: "fromString",
    value: function fromString(str) {
      var buf = Base58.decode(str);
      this.buf = buf;
      return this;
    }
  }, {
    key: "toBuffer",
    value: function toBuffer() {
      return this.buf;
    }
  }, {
    key: "toString",
    value: function toString() {
      return Base58.encode(this.buf);
    }
  }], [{
    key: "encode",
    value: function encode(buf) {
      if (!Buffer.isBuffer(buf)) {
        throw new Error('Input should be a buffer');
      }

      return _bs.default.encode(buf);
    }
  }, {
    key: "decode",
    value: function decode(str) {
      if (typeof str !== 'string') {
        throw new Error('Input should be a string');
      }

      return Buffer.from(_bs.default.decode(str));
    }
  }]);

  return Base58;
}(Struct);

exports.Base58 = Base58;

var cmp = function cmp(buf1, buf2) {
  if (!Buffer.isBuffer(buf1) || !Buffer.isBuffer(buf2)) {
    throw new Error('buf1 and buf2 must be buffers');
  }

  if (buf1.length !== buf2.length) {
    return false;
  }

  var d = 0;

  for (var i = 0; i < buf1.length; i++) {
    var x = buf1[i];
    var y = buf2[i];
    d |= x ^ y;
  }

  return d === 0;
};

exports.cmp = cmp;

var WorkersResult = /*#__PURE__*/function (_Struct2) {
  _inherits(WorkersResult, _Struct2);

  var _super2 = _createSuper(WorkersResult);

  function WorkersResult(resbuf, isError, id) {
    _classCallCheck(this, WorkersResult);

    return _super2.call(this, {
      resbuf: resbuf,
      isError: isError,
      id: id
    });
  }

  _createClass(WorkersResult, [{
    key: "fromResult",
    value: function fromResult(result, id) {
      if (result.toFastBuffer) {
        this.resbuf = result.toFastBuffer();
      } else if (Buffer.isBuffer(result)) {
        this.resbuf = result;
      } else {
        this.resbuf = Buffer.from(JSON.stringify(result));
      }

      this.isError = false;
      this.id = id;
      return this;
    }
  }, {
    key: "fromError",
    value: function fromError(error, id) {
      this.resbuf = Buffer.from(JSON.stringify(error.message));
      this.isError = true;
      this.id = id;
      return this;
    }
  }, {
    key: "toBw",
    value: function toBw(bw) {
      if (!bw) {
        bw = new Bw();
      }

      bw.writeVarIntNum(this.resbuf.length);
      bw.write(this.resbuf);
      bw.writeUInt8(Number(this.isError));
      bw.writeVarIntNum(this.id);
      return bw;
    }
  }, {
    key: "fromBr",
    value: function fromBr(br) {
      var resbuflen = br.readVarIntNum();
      this.resbuf = br.read(resbuflen);
      this.isError = Boolean(br.readUInt8());
      this.id = br.readVarIntNum();
      return this;
    }
  }], [{
    key: "fromResult",
    value: function fromResult(result, id) {
      return new this().fromResult(result, id);
    }
  }]);

  return WorkersResult;
}(Struct);

exports.WorkersResult = WorkersResult;
var globalWorkers;

var Workers = /*#__PURE__*/function () {
  function Workers() {
    var nativeWorkers = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    var lastid = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var incompconsteRes = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
    var promisemap = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : new Map();

    _classCallCheck(this, Workers);

    this.nativeWorkers = nativeWorkers;
    this.lastid = lastid;
    this.incompconsteRes = incompconsteRes;
    this.promisemap = promisemap;
  }

  _createClass(Workers, [{
    key: "asyncObjectMethod",
    value: function asyncObjectMethod(obj, methodname, args) {
      var id = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : this.lastid + 1;

      if (!args) {
        throw new Error('must specify args');
      }

      var result = obj[methodname].apply(obj, _toConsumableArray(args));
      var workersResult = new WorkersResult().fromResult(result, id);
      return workersResult;
    }
  }, {
    key: "asyncClassMethod",
    value: function asyncClassMethod(classObj, methodname, args) {
      var id = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : this.lastid + 1;

      if (!args) {
        throw new Error('must specify args');
      }

      var result = classObj[methodname].apply(classObj, _toConsumableArray(args));
      var workersResult = new WorkersResult().fromResult(result, id);
      return workersResult;
    }
  }], [{
    key: "asyncObjectMethod",
    value: function asyncObjectMethod(obj, methodname, args, id) {
      if (!globalWorkers) {
        globalWorkers = new Workers();
      }

      return globalWorkers.asyncObjectMethod(obj, methodname, args, id);
    }
  }, {
    key: "asyncClassMethod",
    value: function asyncClassMethod(classObj, methodname, args, id) {
      if (!globalWorkers) {
        globalWorkers = new Workers();
      }

      return globalWorkers.asyncClassMethod(classObj, methodname, args, id);
    }
  }, {
    key: "endGlobalWorkers",
    value: function endGlobalWorkers() {
      if (globalWorkers && !true) {
        globalWorkers = undefined;
      }
    }
  }]);

  return Workers;
}();

exports.Workers = Workers;

var Hash = function Hash() {
  _classCallCheck(this, Hash);
};

exports.Hash = Hash;

Hash.sha1 = function (buf) {
  if (!Buffer.isBuffer(buf)) {
    throw new Error('sha1 hash must be of a buffer');
  }

  var Sha1 = _hash2.default.sha1;
  var hash = new Sha1().update(buf).digest();
  return Buffer.from(hash);
};

Hash.sha1.blockSize = 512;

Hash.asyncSha1 = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(buf) {
    var args, workersResult;
    return regeneratorRuntime.wrap(function _callee$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            args = [buf];
            _context3.next = 3;
            return Workers.asyncClassMethod(Hash, 'sha1', args);

          case 3:
            workersResult = _context3.sent;
            return _context3.abrupt("return", workersResult.resbuf);

          case 5:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee);
  }));

  return function (_x2) {
    return _ref.apply(this, arguments);
  };
}();

Hash.sha256 = function (buf) {
  if (!Buffer.isBuffer(buf)) {
    throw new Error('sha256 hash must be of a buffer');
  }

  var Sha256 = _hash2.default.sha256;
  var hash = new Sha256().update(buf).digest();
  return Buffer.from(hash);
};

Hash.sha256.blockSize = 512;

Hash.asyncSha256 = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(buf) {
    var args, workersResult;
    return regeneratorRuntime.wrap(function _callee2$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            args = [buf];
            _context4.next = 3;
            return Workers.asyncClassMethod(Hash, 'sha256', args);

          case 3:
            workersResult = _context4.sent;
            return _context4.abrupt("return", workersResult.resbuf);

          case 5:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee2);
  }));

  return function (_x3) {
    return _ref2.apply(this, arguments);
  };
}();

Hash.sha256Sha256 = function (buf) {
  try {
    return Hash.sha256(Hash.sha256(buf));
  } catch (e) {
    throw new Error('sha256Sha256 hash must be of a buffer: ' + e);
  }
};

Hash.asyncSha256Sha256 = /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(buf) {
    var args, workersResult;
    return regeneratorRuntime.wrap(function _callee3$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            args = [buf];
            _context5.next = 3;
            return Workers.asyncClassMethod(Hash, 'sha256Sha256', args);

          case 3:
            workersResult = _context5.sent;
            return _context5.abrupt("return", workersResult.resbuf);

          case 5:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee3);
  }));

  return function (_x4) {
    return _ref3.apply(this, arguments);
  };
}();

Hash.ripemd160 = function (buf) {
  if (!Buffer.isBuffer(buf)) {
    throw new Error('ripemd160 hash must be of a buffer');
  }

  var Ripemd160 = _hash2.default.ripemd160;
  var hash = new Ripemd160().update(buf).digest();
  return Buffer.from(hash);
};

Hash.asyncRipemd160 = /*#__PURE__*/function () {
  var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(buf) {
    var args, workersResult;
    return regeneratorRuntime.wrap(function _callee4$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            args = [buf];
            _context6.next = 3;
            return Workers.asyncClassMethod(Hash, 'ripemd160', args);

          case 3:
            workersResult = _context6.sent;
            return _context6.abrupt("return", workersResult.resbuf);

          case 5:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee4);
  }));

  return function (_x5) {
    return _ref4.apply(this, arguments);
  };
}();

Hash.sha256Ripemd160 = function (buf) {
  try {
    return Hash.ripemd160(Hash.sha256(buf));
  } catch (e) {
    throw new Error('sha256Ripemd160 hash must be of a buffer: ' + e);
  }
};

Hash.asyncSha256Ripemd160 = /*#__PURE__*/function () {
  var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(buf) {
    var args, workersResult;
    return regeneratorRuntime.wrap(function _callee5$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            args = [buf];
            _context7.next = 3;
            return Workers.asyncClassMethod(Hash, 'sha256Ripemd160', args);

          case 3:
            workersResult = _context7.sent;
            return _context7.abrupt("return", workersResult.resbuf);

          case 5:
          case "end":
            return _context7.stop();
        }
      }
    }, _callee5);
  }));

  return function (_x6) {
    return _ref5.apply(this, arguments);
  };
}();

Hash.sha512 = function (buf) {
  if (!Buffer.isBuffer(buf)) {
    throw new Error('sha512 hash must be of a buffer');
  }

  var Sha512 = _hash2.default.sha512;
  var hash = new Sha512().update(buf).digest();
  return Buffer.from(hash);
};

Hash.asyncSha512 = /*#__PURE__*/function () {
  var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(buf) {
    var args, workersResult;
    return regeneratorRuntime.wrap(function _callee6$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            args = [buf];
            _context8.next = 3;
            return Workers.asyncClassMethod(Hash, 'sha512', args);

          case 3:
            workersResult = _context8.sent;
            return _context8.abrupt("return", workersResult.resbuf);

          case 5:
          case "end":
            return _context8.stop();
        }
      }
    }, _callee6);
  }));

  return function (_x7) {
    return _ref6.apply(this, arguments);
  };
}();

Hash.sha512.blockSize = 1024;

Hash.hmac = function (hashFStr, data, key) {
  if (hashFStr !== 'sha1' && hashFStr !== 'sha256' && hashFStr !== 'sha512') {
    throw new Error('invalid choice of hash function');
  }

  var hashf = Hash[hashFStr];

  if (!Buffer.isBuffer(data) || !Buffer.isBuffer(key)) {
    throw new Error('data and key must be buffers');
  }

  var blockSize = hashf.blockSize / 8;

  if (key.length > blockSize) {
    key = hashf(key);
  }

  if (key.length < blockSize) {
    var fill = Buffer.alloc(blockSize);
    fill.fill(0, key.length);
    key.copy(fill);
    key = fill;
  }

  var oKeyPad = Buffer.alloc(blockSize);
  var iKeyPad = Buffer.alloc(blockSize);

  for (var i = 0; i < blockSize; i++) {
    oKeyPad[i] = 0x5c ^ key[i];
    iKeyPad[i] = 0x36 ^ key[i];
  }

  return hashf(Buffer.concat([oKeyPad, hashf(Buffer.concat([iKeyPad, data]))]));
};

Hash.sha1Hmac = function (data, key) {
  return Hash.hmac('sha1', data, key);
};

Hash.asyncSha1Hmac = /*#__PURE__*/function () {
  var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(data, key) {
    var args, workersResult;
    return regeneratorRuntime.wrap(function _callee7$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            args = [data, key];
            _context9.next = 3;
            return Workers.asyncClassMethod(Hash, 'sha1Hmac', args);

          case 3:
            workersResult = _context9.sent;
            return _context9.abrupt("return", workersResult.resbuf);

          case 5:
          case "end":
            return _context9.stop();
        }
      }
    }, _callee7);
  }));

  return function (_x8, _x9) {
    return _ref7.apply(this, arguments);
  };
}();

Hash.sha1Hmac.bitsize = 160;

Hash.sha256Hmac = function (data, key) {
  return Hash.hmac('sha256', data, key);
};

Hash.asyncSha256Hmac = /*#__PURE__*/function () {
  var _ref8 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8(data, key) {
    var args, workersResult;
    return regeneratorRuntime.wrap(function _callee8$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            args = [data, key];
            _context10.next = 3;
            return Workers.asyncClassMethod(Hash, 'sha256Hmac', args);

          case 3:
            workersResult = _context10.sent;
            return _context10.abrupt("return", workersResult.resbuf);

          case 5:
          case "end":
            return _context10.stop();
        }
      }
    }, _callee8);
  }));

  return function (_x10, _x11) {
    return _ref8.apply(this, arguments);
  };
}();

Hash.sha256Hmac.bitsize = 256;

Hash.sha512Hmac = function (data, key) {
  return Hash.hmac('sha512', data, key);
};

Hash.asyncSha512Hmac = /*#__PURE__*/function () {
  var _ref9 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9(data, key) {
    var args, workersResult;
    return regeneratorRuntime.wrap(function _callee9$(_context11) {
      while (1) {
        switch (_context11.prev = _context11.next) {
          case 0:
            args = [data, key];
            _context11.next = 3;
            return Workers.asyncClassMethod(Hash, 'sha512Hmac', args);

          case 3:
            workersResult = _context11.sent;
            return _context11.abrupt("return", workersResult.resbuf);

          case 5:
          case "end":
            return _context11.stop();
        }
      }
    }, _callee9);
  }));

  return function (_x12, _x13) {
    return _ref9.apply(this, arguments);
  };
}();

Hash.sha512Hmac.bitsize = 512;

var Base58Check = /*#__PURE__*/function (_Struct3) {
  _inherits(Base58Check, _Struct3);

  var _super3 = _createSuper(Base58Check);

  function Base58Check(buf) {
    _classCallCheck(this, Base58Check);

    return _super3.call(this, {
      buf: buf
    });
  }

  _createClass(Base58Check, [{
    key: "fromHex",
    value: function fromHex(hex) {
      return this.fromBuffer(Buffer.from(hex, 'hex'));
    }
  }, {
    key: "toHex",
    value: function toHex() {
      return this.toBuffer().toString('hex');
    }
  }, {
    key: "fromBuffer",
    value: function fromBuffer(buf) {
      this.buf = buf;
      return this;
    }
  }, {
    key: "fromString",
    value: function fromString(str) {
      var buf = Base58Check.decode(str);
      this.buf = buf;
      return this;
    }
  }, {
    key: "toBuffer",
    value: function toBuffer() {
      return this.buf;
    }
  }, {
    key: "toString",
    value: function toString() {
      return Base58Check.encode(this.buf);
    }
  }], [{
    key: "decode",
    value: function decode(s) {
      if (typeof s !== 'string') {
        throw new Error('Input must be a string');
      }

      var buf = Base58.decode(s);

      if (buf.length < 4) {
        throw new Error('Input string too short');
      }

      var data = buf.slice(0, -4);
      var csum = buf.slice(-4);
      var hash = Hash.sha256Sha256(data);
      var hash4 = hash.slice(0, 4);

      if (!cmp(csum, hash4)) {
        throw new Error('Checksum mismatch');
      }

      return data;
    }
  }, {
    key: "encode",
    value: function encode(buf) {
      if (!Buffer.isBuffer(buf)) {
        throw new Error('Input must be a buffer');
      }

      var checkedBuf = Buffer.alloc(buf.length + 4);
      var hash = Hash.sha256Sha256(buf);
      buf.copy(checkedBuf);
      hash.copy(checkedBuf, buf.length);
      return Base58.encode(checkedBuf);
    }
  }]);

  return Base58Check;
}(Struct);

exports.Base58Check = Base58Check;

var Config = /*#__PURE__*/function () {
  function Config(values) {
    _classCallCheck(this, Config);

    this.keyDefined = function (key) {
      return key in values;
    };

    this.getValue = function (key) {
      return values[key];
    };
  }

  _createClass(Config, [{
    key: "get",
    value: function get(key) {
      if (this.keyDefined(key)) {
        return this.getValue(key);
      } else {
        throw new Error("Unknown configuration: ".concat(key));
      }
    }
  }]);

  return Config;
}();

var ConfigBuilder = /*#__PURE__*/function () {
  function ConfigBuilder() {
    _classCallCheck(this, ConfigBuilder);

    this.variables = {};
  }

  _createClass(ConfigBuilder, [{
    key: "build",
    value: function build() {
      return new Config(this.variables);
    }
  }, {
    key: "addValue",
    value: function addValue(key, value) {
      if (value === undefined) {
        throw new Error("Failed to add \"".concat(key, "\" property. The value cannot be undefined"));
      }

      if (key in this.variables) {
        throw new Error("\"".concat(key, "\" already has a value defined."));
      }

      this.variables[key] = value;
      return this;
    }
  }, {
    key: "addValueWithDefault",
    value: function addValueWithDefault(key, value, defaultValue) {
      if (defaultValue === undefined) {
        throw new Error("Failed to add \"".concat(key, "\" property. Default value cannot be undefined"));
      }

      return this.addValue(key, value === undefined ? defaultValue : value);
    }
  }]);

  return ConfigBuilder;
}();

var config = new ConfigBuilder().addValue('NETWORK', undefined || 'mainnet').build();
var Constants = {};
exports.Constants = Constants;
Constants.Mainnet = {
  maxsize: 0x02000000,
  Address: {
    pubKeyHash: 0x00
  },
  Bip32: {
    pubKey: 0x0488b21e,
    privKey: 0x0488ade4
  },
  Block: {
    maxNBits: 0x1d00ffff,
    magicNum: 0xf9beb4d9
  },
  Msg: {
    magicNum: 0xf9beb4d9,
    versionBytesNum: 70012
  },
  PrivKey: {
    versionByteNum: 0x80
  },
  TxBuilder: {
    dust: 546,
    feePerKbNum: 0.00000500e8
  },
  Workers: {
    timeout: 60000
  }
};
Constants.Testnet = Object.assign({}, Constants.Mainnet, {
  Address: {
    pubKeyHash: 0x6f
  },
  Bip32: {
    pubKey: 0x043587cf,
    privKey: 0x04358394
  },
  Block: {
    maxNBits: 0x1d00ffff,
    magicNum: 0x0b110907
  },
  Msg: {
    magicNum: 0x0b110907,
    versionBytesNum: 70012
  },
  PrivKey: {
    versionByteNum: 0xef
  }
});
Constants.Regtest = Object.assign({}, Constants.Mainnet, {
  Address: {
    pubKeyHash: 0x6f
  },
  Bip32: {
    pubKey: 0x043587cf,
    privKey: 0x04358394
  },
  Block: {
    maxNBits: 0x1d00ffff,
    magicNum: 0xdab5bffa
  },
  Msg: {
    magicNum: 0x0b110907,
    versionBytesNum: 70012
  },
  PrivKey: {
    versionByteNum: 0xef
  }
});

if (config.get('NETWORK') === 'testnet') {
  Constants.Default = Object.assign({}, Constants.Testnet);
} else if (config.get('NETWORK') === 'mainnet') {
  Constants.Default = Object.assign({}, Constants.Mainnet);
} else if (config.get('NETWORK') === 'regtest') {
  Constants.Default = Object.assign({}, Constants.Regtest);
} else {
  throw new Error("must set network in environment variable - mainnet, testnet or regtest?, received ".concat(config.get('NETWORK')));
}

var map = {
  OP_FALSE: 0x00,
  OP_0: 0x00,
  OP_PUSHDATA1: 0x4c,
  OP_PUSHDATA2: 0x4d,
  OP_PUSHDATA4: 0x4e,
  OP_1NEGATE: 0x4f,
  OP_RESERVED: 0x50,
  OP_TRUE: 0x51,
  OP_1: 0x51,
  OP_2: 0x52,
  OP_3: 0x53,
  OP_4: 0x54,
  OP_5: 0x55,
  OP_6: 0x56,
  OP_7: 0x57,
  OP_8: 0x58,
  OP_9: 0x59,
  OP_10: 0x5a,
  OP_11: 0x5b,
  OP_12: 0x5c,
  OP_13: 0x5d,
  OP_14: 0x5e,
  OP_15: 0x5f,
  OP_16: 0x60,
  OP_NOP: 0x61,
  OP_VER: 0x62,
  OP_IF: 0x63,
  OP_NOTIF: 0x64,
  OP_VERIF: 0x65,
  OP_VERNOTIF: 0x66,
  OP_ELSE: 0x67,
  OP_ENDIF: 0x68,
  OP_VERIFY: 0x69,
  OP_RETURN: 0x6a,
  OP_TOALTSTACK: 0x6b,
  OP_FROMALTSTACK: 0x6c,
  OP_2DROP: 0x6d,
  OP_2DUP: 0x6e,
  OP_3DUP: 0x6f,
  OP_2OVER: 0x70,
  OP_2ROT: 0x71,
  OP_2SWAP: 0x72,
  OP_IFDUP: 0x73,
  OP_DEPTH: 0x74,
  OP_DROP: 0x75,
  OP_DUP: 0x76,
  OP_NIP: 0x77,
  OP_OVER: 0x78,
  OP_PICK: 0x79,
  OP_ROLL: 0x7a,
  OP_ROT: 0x7b,
  OP_SWAP: 0x7c,
  OP_TUCK: 0x7d,
  OP_CAT: 0x7e,
  OP_SUBSTR: 0x7f,
  OP_LEFT: 0x80,
  OP_RIGHT: 0x81,
  OP_SIZE: 0x82,
  OP_INVERT: 0x83,
  OP_AND: 0x84,
  OP_OR: 0x85,
  OP_XOR: 0x86,
  OP_EQUAL: 0x87,
  OP_EQUALVERIFY: 0x88,
  OP_RESERVED1: 0x89,
  OP_RESERVED2: 0x8a,
  OP_1ADD: 0x8b,
  OP_1SUB: 0x8c,
  OP_2MUL: 0x8d,
  OP_2DIV: 0x8e,
  OP_NEGATE: 0x8f,
  OP_ABS: 0x90,
  OP_NOT: 0x91,
  OP_0NOTEQUAL: 0x92,
  OP_ADD: 0x93,
  OP_SUB: 0x94,
  OP_MUL: 0x95,
  OP_DIV: 0x96,
  OP_MOD: 0x97,
  OP_LSHIFT: 0x98,
  OP_RSHIFT: 0x99,
  OP_BOOLAND: 0x9a,
  OP_BOOLOR: 0x9b,
  OP_NUMEQUAL: 0x9c,
  OP_NUMEQUALVERIFY: 0x9d,
  OP_NUMNOTEQUAL: 0x9e,
  OP_LESSTHAN: 0x9f,
  OP_GREATERTHAN: 0xa0,
  OP_LESSTHANOREQUAL: 0xa1,
  OP_GREATERTHANOREQUAL: 0xa2,
  OP_MIN: 0xa3,
  OP_MAX: 0xa4,
  OP_WITHIN: 0xa5,
  OP_RIPEMD160: 0xa6,
  OP_SHA1: 0xa7,
  OP_SHA256: 0xa8,
  OP_HASH160: 0xa9,
  OP_HASH256: 0xaa,
  OP_CODESEPARATOR: 0xab,
  OP_CHECKSIG: 0xac,
  OP_CHECKSIGVERIFY: 0xad,
  OP_CHECKMULTISIG: 0xae,
  OP_CHECKMULTISIGVERIFY: 0xaf,
  OP_NOP1: 0xb0,
  OP_NOP2: 0xb1,
  OP_CHECKLOCKTIMEVERIFY: 0xb1,
  OP_NOP3: 0xb2,
  OP_CHECKSEQUENCEVERIFY: 0xb2,
  OP_NOP4: 0xb3,
  OP_NOP5: 0xb4,
  OP_NOP6: 0xb5,
  OP_NOP7: 0xb6,
  OP_NOP8: 0xb7,
  OP_NOP9: 0xb8,
  OP_NOP10: 0xb9,
  OP_SMALLDATA: 0xf9,
  OP_SMALLINTEGER: 0xfa,
  OP_PUBKEYS: 0xfb,
  OP_PUBKEYHASH: 0xfd,
  OP_PUBKEY: 0xfe,
  OP_INVALIDOPCODE: 0xff
};

var OpCode = /*#__PURE__*/function (_Struct4) {
  _inherits(OpCode, _Struct4);

  var _super4 = _createSuper(OpCode);

  function OpCode(num) {
    _classCallCheck(this, OpCode);

    return _super4.call(this, {
      num: num
    });
  }

  _createClass(OpCode, [{
    key: "fromNumber",
    value: function fromNumber(num) {
      this.num = num;
      return this;
    }
  }, {
    key: "toNumber",
    value: function toNumber() {
      return this.num;
    }
  }, {
    key: "fromString",
    value: function fromString(str) {
      var num = map[str];

      if (num === undefined) {
        throw new Error('Invalid opCodeStr');
      }

      this.num = num;
      return this;
    }
  }, {
    key: "toString",
    value: function toString() {
      var str = OpCode.str[this.num];

      if (str === undefined) {
        if (this.num > 0 && this.num < OpCode.OP_PUSHDATA1) {
          return this.num.toString();
        }

        throw new Error('OpCode does not have a string representation');
      }

      return str;
    }
  }], [{
    key: "fromNumber",
    value: function fromNumber(num) {
      return new this().fromNumber(num);
    }
  }, {
    key: "fromString",
    value: function fromString(str) {
      return new this().fromString(str);
    }
  }]);

  return OpCode;
}(Struct);

exports.OpCode = OpCode;
OpCode.str = {};

for (var opCodeStr in map) {
  OpCode[opCodeStr] = map[opCodeStr];

  if (Object.prototype.hasOwnProperty.call(map, opCodeStr)) {
    OpCode.str[map[opCodeStr]] = opCodeStr;
  }
}

var ec = _bitcoinElliptic.default.curves.secp256k1;

var _point = ec.curve.point();

var _Point = _point.constructor;

var Point = /*#__PURE__*/function (_Point2) {
  _inherits(Point, _Point2);

  var _super5 = _createSuper(Point);

  function Point(x, y, isRed) {
    _classCallCheck(this, Point);

    return _super5.call(this, ec.curve, x, y, isRed);
  }

  _createClass(Point, [{
    key: "copyFrom",
    value: function copyFrom(point) {
      if (!(point instanceof _Point)) {
        throw new Error('point should be an external point');
      }

      Object.keys(point).forEach(function (key) {
        this[key] = point[key];
      }.bind(this));
      return this;
    }
  }, {
    key: "add",
    value: function add(p) {
      p = _Point.prototype.add.call(this, p);
      var point = Object.create(Point.prototype);
      return point.copyFrom(p);
    }
  }, {
    key: "mul",
    value: function mul(bn) {
      if (!bn.lt(Point.getN())) {
        throw new Error('point mul out of range');
      }

      var p = _Point.prototype.mul.call(this, bn);

      var point = Object.create(Point.prototype);
      return point.copyFrom(p);
    }
  }, {
    key: "mulAdd",
    value: function mulAdd(bn1, point, bn2) {
      var p = _Point.prototype.mulAdd.call(this, bn1, point, bn2);

      point = Object.create(Point.prototype);
      return point.copyFrom(p);
    }
  }, {
    key: "getX",
    value: function getX() {
      var _x = _Point.prototype.getX.call(this);

      var x = Object.create(Bn.prototype);

      _x.copy(x);

      return x;
    }
  }, {
    key: "getY",
    value: function getY() {
      var _y = _Point.prototype.getY.call(this);

      var y = Object.create(Bn.prototype);

      _y.copy(y);

      return y;
    }
  }, {
    key: "fromX",
    value: function fromX(isOdd, x) {
      var point = Point.fromX(isOdd, x);
      return this.copyFrom(point);
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      return {
        x: this.getX().toString(),
        y: this.getY().toString()
      };
    }
  }, {
    key: "fromJSON",
    value: function fromJSON(json) {
      var x = new Bn().fromString(json.x);
      var y = new Bn().fromString(json.y);
      var point = new Point(x, y);
      return this.copyFrom(point);
    }
  }, {
    key: "toString",
    value: function toString() {
      return JSON.stringify(this.toJSON());
    }
  }, {
    key: "fromString",
    value: function fromString(str) {
      var json = JSON.parse(str);
      var p = new Point().fromJSON(json);
      return this.copyFrom(p);
    }
  }, {
    key: "validate",
    value: function validate() {
      var p2 = Point.fromX(this.getY().isOdd(), this.getX());

      if (!(p2.getY().cmp(this.getY()) === 0)) {
        throw new Error('Invalid y value of public key');
      }

      if (!(this.getX().gt(-1) && this.getX().lt(Point.getN())) || !(this.getY().gt(-1) && this.getY().lt(Point.getN()))) {
        throw new Error('Point does not lie on the curve');
      }

      return this;
    }
  }], [{
    key: "fromX",
    value: function fromX(isOdd, x) {
      var _point = ec.curve.pointFromX(x, isOdd);

      var point = Object.create(Point.prototype);
      return point.copyFrom(_point);
    }
  }, {
    key: "getG",
    value: function getG() {
      var _g = ec.curve.g;
      var g = Object.create(Point.prototype);
      return g.copyFrom(_g);
    }
  }, {
    key: "getN",
    value: function getN() {
      return new Bn(ec.curve.n.toArray());
    }
  }]);

  return Point;
}(_Point);

exports.Point = Point;

var PubKey = /*#__PURE__*/function (_Struct5) {
  _inherits(PubKey, _Struct5);

  var _super6 = _createSuper(PubKey);

  function PubKey(point, compressed) {
    _classCallCheck(this, PubKey);

    return _super6.call(this, {
      point: point,
      compressed: compressed
    });
  }

  _createClass(PubKey, [{
    key: "fromJSON",
    value: function fromJSON(json) {
      this.fromFastHex(json);
      return this;
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      return this.toFastHex();
    }
  }, {
    key: "fromPrivKey",
    value: function fromPrivKey(privKey) {
      this.fromObject({
        point: Point.getG().mul(privKey.bn),
        compressed: privKey.compressed
      });
      return this;
    }
  }, {
    key: "asyncFromPrivKey",
    value: function () {
      var _asyncFromPrivKey = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10(privKey) {
        var workersResult;
        return regeneratorRuntime.wrap(function _callee10$(_context12) {
          while (1) {
            switch (_context12.prev = _context12.next) {
              case 0:
                _context12.next = 2;
                return Workers.asyncObjectMethod(this, 'fromPrivKey', [privKey]);

              case 2:
                workersResult = _context12.sent;
                return _context12.abrupt("return", this.fromFastBuffer(workersResult.resbuf));

              case 4:
              case "end":
                return _context12.stop();
            }
          }
        }, _callee10, this);
      }));

      function asyncFromPrivKey(_x14) {
        return _asyncFromPrivKey.apply(this, arguments);
      }

      return asyncFromPrivKey;
    }()
  }, {
    key: "fromBuffer",
    value: function fromBuffer(buf, strict) {
      return this.fromDer(buf, strict);
    }
  }, {
    key: "asyncFromBuffer",
    value: function () {
      var _asyncFromBuffer = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee11(buf, strict) {
        var args, workersResult;
        return regeneratorRuntime.wrap(function _callee11$(_context13) {
          while (1) {
            switch (_context13.prev = _context13.next) {
              case 0:
                args = [buf, strict];
                _context13.next = 3;
                return Workers.asyncObjectMethod(this, 'fromBuffer', args);

              case 3:
                workersResult = _context13.sent;
                return _context13.abrupt("return", this.fromFastBuffer(workersResult.resbuf));

              case 5:
              case "end":
                return _context13.stop();
            }
          }
        }, _callee11, this);
      }));

      function asyncFromBuffer(_x15, _x16) {
        return _asyncFromBuffer.apply(this, arguments);
      }

      return asyncFromBuffer;
    }()
  }, {
    key: "fromFastBuffer",
    value: function fromFastBuffer(buf) {
      if (buf.length === 0) {
        return this;
      }

      var compressed = Boolean(buf[0]);
      buf = buf.slice(1);
      this.fromDer(buf);
      this.compressed = compressed;
      return this;
    }
  }, {
    key: "fromDer",
    value: function fromDer(buf, strict) {
      if (strict === undefined) {
        strict = true;
      } else {
        strict = false;
      }

      if (buf[0] === 0x04 || !strict && (buf[0] === 0x06 || buf[0] === 0x07)) {
        var xbuf = buf.slice(1, 33);
        var ybuf = buf.slice(33, 65);

        if (xbuf.length !== 32 || ybuf.length !== 32 || buf.length !== 65) {
          throw new Error('LEngth of x and y must be 32 bytes');
        }

        var x = new Bn(xbuf);
        var y = new Bn(ybuf);
        this.point = new Point(x, y);
        this.compressed = false;
      } else if (buf[0] === 0x03) {
        var _xbuf = buf.slice(1);

        var _x17 = new Bn(_xbuf);

        this.fromX(true, _x17);
        this.compressed = true;
      } else if (buf[0] === 0x02) {
        var _xbuf2 = buf.slice(1);

        var _x18 = new Bn(_xbuf2);

        this.fromX(false, _x18);
        this.compressed = true;
      } else {
        throw new Error('Invalid DER format pubKey');
      }

      return this;
    }
  }, {
    key: "fromString",
    value: function fromString(str) {
      this.fromDer(Buffer.from(str, 'hex'));
      return this;
    }
  }, {
    key: "fromX",
    value: function fromX(odd, x) {
      if (typeof odd !== 'boolean') {
        throw new Error('Must specify whether y is odd or not (true or false)');
      }

      this.point = Point.fromX(odd, x);
      return this;
    }
  }, {
    key: "toBuffer",
    value: function toBuffer() {
      var compressed = this.compressed === undefined ? true : this.compressed;
      return this.toDer(compressed);
    }
  }, {
    key: "toFastBuffer",
    value: function toFastBuffer() {
      if (!this.point) {
        return Buffer.alloc(0);
      }

      var bw = new Bw();
      var compressed = this.compressed === undefined ? true : Boolean(this.compressed);
      bw.writeUInt8(Number(compressed));
      bw.write(this.toDer(false));
      return bw.toBuffer();
    }
  }, {
    key: "toDer",
    value: function toDer(compressed) {
      compressed = compressed === undefined ? this.compressed : compressed;

      if (typeof compressed !== 'boolean') {
        throw new Error('Must specify whether the public key is compressed or not (true or false)');
      }

      var x = this.point.getX();
      var y = this.point.getY();
      var xbuf = x.toBuffer({
        size: 32
      });
      var ybuf = y.toBuffer({
        size: 32
      });
      var prefix;

      if (!compressed) {
        prefix = Buffer.from([0x04]);
        return Buffer.concat([prefix, xbuf, ybuf]);
      } else {
        var odd = ybuf[ybuf.length - 1] % 2;

        if (odd) {
          prefix = Buffer.from([0x03]);
        } else {
          prefix = Buffer.from([0x02]);
        }

        return Buffer.concat([prefix, xbuf]);
      }
    }
  }, {
    key: "toString",
    value: function toString() {
      var compressed = this.compressed === undefined ? true : this.compressed;
      return this.toDer(compressed).toString('hex');
    }
  }, {
    key: "validate",
    value: function validate() {
      if (this.point.isInfinity()) {
        throw new Error('point: Point cannot be equal to Infinity');
      }

      if (this.point.eq(new Point(new Bn(0), new Bn(0)))) {
        throw new Error('point: Point cannot be equal to 0, 0');
      }

      this.point.validate();
      return this;
    }
  }], [{
    key: "fromPrivKey",
    value: function fromPrivKey(privKey) {
      return new this().fromPrivKey(privKey);
    }
  }, {
    key: "asyncFromPrivKey",
    value: function asyncFromPrivKey(privKey) {
      return new this().asyncFromPrivKey(privKey);
    }
  }, {
    key: "fromDer",
    value: function fromDer(buf, strict) {
      return new this().fromDer(buf, strict);
    }
  }, {
    key: "fromX",
    value: function fromX(odd, x) {
      return new this().fromX(odd, x);
    }
  }, {
    key: "isCompressedOrUncompressed",
    value: function isCompressedOrUncompressed(buf) {
      if (buf.length < 33) {
        return false;
      }

      if (buf[0] === 0x04) {
        if (buf.length !== 65) {
          return false;
        }
      } else if (buf[0] === 0x02 || buf[0] === 0x03) {
        if (buf.length !== 33) {
          return false;
        }
      } else {
        return false;
      }

      return true;
    }
  }]);

  return PubKey;
}(Struct);

exports.PubKey = PubKey;

var Random = function Random() {
  _classCallCheck(this, Random);
};

exports.Random = Random;

Random.getRandomBuffer = function (size) {
  return (0, _randombytes.default)(size);
};

var PrivKey = /*#__PURE__*/function (_Struct6) {
  _inherits(PrivKey, _Struct6);

  var _super7 = _createSuper(PrivKey);

  function PrivKey(bn, compressed) {
    var _this11;

    var constants = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

    _classCallCheck(this, PrivKey);

    _this11 = _super7.call(this, {
      bn: bn,
      compressed: compressed
    });
    constants = constants || Constants.Default.PrivKey;
    _this11.Constants = constants;
    return _this11;
  }

  _createClass(PrivKey, [{
    key: "fromJSON",
    value: function fromJSON(json) {
      this.fromHex(json);
      return this;
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      return this.toHex();
    }
  }, {
    key: "fromRandom",
    value: function fromRandom() {
      var privBuf, bn, condition;

      do {
        privBuf = Random.getRandomBuffer(32);
        bn = new Bn().fromBuffer(privBuf);
        condition = bn.lt(Point.getN());
      } while (!condition);

      this.fromObject({
        bn: bn,
        compressed: true
      });
      return this;
    }
  }, {
    key: "toBuffer",
    value: function toBuffer() {
      var compressed = this.compressed;

      if (compressed === undefined) {
        compressed = true;
      }

      var privBuf = this.bn.toBuffer({
        size: 32
      });
      var buf;

      if (compressed) {
        buf = Buffer.concat([Buffer.from([this.Constants.versionByteNum]), privBuf, Buffer.from([0x01])]);
      } else {
        buf = Buffer.concat([Buffer.from([this.Constants.versionByteNum]), privBuf]);
      }

      return buf;
    }
  }, {
    key: "fromBuffer",
    value: function fromBuffer(buf) {
      if (buf.length === 1 + 32 + 1 && buf[1 + 32 + 1 - 1] === 1) {
        this.compressed = true;
      } else if (buf.length === 1 + 32) {
        this.compressed = false;
      } else {
        throw new Error('Length of privKey buffer must be 33 (uncompressed pubKey) or 34 (compressed pubKey)');
      }

      if (buf[0] !== this.Constants.versionByteNum) {
        throw new Error('Invalid versionByteNum byte');
      }

      return this.fromBn(new Bn().fromBuffer(buf.slice(1, 1 + 32)));
    }
  }, {
    key: "toBn",
    value: function toBn() {
      return this.bn;
    }
  }, {
    key: "fromBn",
    value: function fromBn(bn) {
      this.bn = bn;
      return this;
    }
  }, {
    key: "validate",
    value: function validate() {
      if (!this.bn.lt(Point.getN())) {
        throw new Error('Number must be less than N');
      }

      if (typeof this.compressed !== 'boolean') {
        throw new Error('Must specify whether the corresponding public key is compressed or not (true or false)');
      }

      return this;
    }
  }, {
    key: "toWif",
    value: function toWif() {
      return Base58Check.encode(this.toBuffer());
    }
  }, {
    key: "fromWif",
    value: function fromWif(str) {
      return this.fromBuffer(Base58Check.decode(str));
    }
  }, {
    key: "toString",
    value: function toString() {
      return this.toWif();
    }
  }, {
    key: "fromString",
    value: function fromString(str) {
      return this.fromWif(str);
    }
  }], [{
    key: "fromRandom",
    value: function fromRandom() {
      return new this().fromRandom();
    }
  }, {
    key: "fromBn",
    value: function fromBn(bn) {
      return new this().fromBn(bn);
    }
  }, {
    key: "fromWif",
    value: function fromWif(str) {
      return new this().fromWif(str);
    }
  }]);

  return PrivKey;
}(Struct);

exports.PrivKey = PrivKey;

PrivKey.Mainnet = /*#__PURE__*/function (_PrivKey) {
  _inherits(_class, _PrivKey);

  var _super8 = _createSuper(_class);

  function _class(bn, compressed) {
    _classCallCheck(this, _class);

    return _super8.call(this, bn, compressed, Constants.Mainnet.PrivKey);
  }

  return _class;
}(PrivKey);

PrivKey.Testnet = /*#__PURE__*/function (_PrivKey2) {
  _inherits(_class2, _PrivKey2);

  var _super9 = _createSuper(_class2);

  function _class2(bn, compressed) {
    _classCallCheck(this, _class2);

    return _super9.call(this, bn, compressed, Constants.Testnet.PrivKey);
  }

  return _class2;
}(PrivKey);

var Sig = /*#__PURE__*/function (_Struct7) {
  _inherits(Sig, _Struct7);

  var _super10 = _createSuper(Sig);

  function Sig(r, s, nHashType, recovery, compressed) {
    _classCallCheck(this, Sig);

    return _super10.call(this, {
      r: r,
      s: s,
      nHashType: nHashType,
      recovery: recovery,
      compressed: compressed
    });
  }

  _createClass(Sig, [{
    key: "fromBuffer",
    value: function fromBuffer(buf) {
      try {
        return this.fromDer(buf, true);
      } catch (e) {}

      try {
        return this.fromCompact(buf);
      } catch (e) {}

      return this.fromTxFormat(buf);
    }
  }, {
    key: "toBuffer",
    value: function toBuffer() {
      if (this.nHashType !== undefined) {
        return this.toTxFormat();
      } else if (this.recovery !== undefined) {
        return this.toCompact();
      }

      return this.toDer();
    }
  }, {
    key: "fromCompact",
    value: function fromCompact(buf) {
      var compressed = true;
      var recovery = buf.slice(0, 1)[0] - 27 - 4;

      if (recovery < 0) {
        compressed = false;
        recovery = recovery + 4;
      }

      if (!(recovery === 0 || recovery === 1 || recovery === 2 || recovery === 3)) {
        throw new Error('i must be 0, 1, 2, or 3');
      }

      this.compressed = compressed;
      this.recovery = recovery;
      var rsbuf = buf.slice(1);
      this.fromRS(rsbuf);
      return this;
    }
  }, {
    key: "fromRS",
    value: function fromRS(rsbuf) {
      var b2 = rsbuf.slice(0, 32);
      var b3 = rsbuf.slice(32, 64);

      if (b2.length !== 32) {
        throw new Error('r must be 32 bytes');
      }

      if (b3.length !== 32 || rsbuf.length > 64) {
        throw new Error('s must be 32 bytes');
      }

      this.r = new Bn().fromBuffer(b2);
      this.s = new Bn().fromBuffer(b3);
      return this;
    }
  }, {
    key: "fromDer",
    value: function fromDer(buf, strict) {
      var obj = Sig.parseDer(buf, strict);
      this.r = obj.r;
      this.s = obj.s;
      return this;
    }
  }, {
    key: "fromTxFormat",
    value: function fromTxFormat(buf) {
      if (buf.length === 0) {
        this.r = new Bn(1);
        this.s = new Bn(1);
        this.nHashType = 1;
        return this;
      }

      var nHashType = buf.readUInt8(buf.length - 1);
      var derbuf = buf.slice(0, buf.length - 1);
      this.fromDer(derbuf, false);
      this.nHashType = nHashType;
      return this;
    }
  }, {
    key: "fromString",
    value: function fromString(str) {
      return this.fromHex(str);
    }
  }, {
    key: "hasLowS",
    value: function hasLowS() {
      if (this.s.lt(1) || this.s.gt(Bn.fromBuffer(Buffer.from('7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0', 'hex')))) {
        return false;
      }

      return true;
    }
  }, {
    key: "hasDefinedHashType",
    value: function hasDefinedHashType() {
      if (this.nHashType < Sig.SIGHASH_ALL || this.nHashType > Sig.SIGHASH_SINGLE) {
        return false;
      }

      return true;
    }
  }, {
    key: "toCompact",
    value: function toCompact(recovery, compressed) {
      recovery = typeof recovery === 'number' ? recovery : this.recovery;
      compressed = typeof compressed === 'boolean' ? compressed : this.compressed;

      if (!(recovery === 0 || recovery === 1 || recovery === 2 || recovery === 3)) {
        throw new Error('recovery must be equal to 0, 1, 2, or 3');
      }

      var val = recovery + 27 + 4;

      if (compressed === false) {
        val = val - 4;
      }

      var b1 = Buffer.from([val]);
      var b2 = this.r.toBuffer({
        size: 32
      });
      var b3 = this.s.toBuffer({
        size: 32
      });
      return Buffer.concat([b1, b2, b3]);
    }
  }, {
    key: "toRS",
    value: function toRS() {
      return Buffer.concat([this.r.toBuffer({
        size: 32
      }), this.s.toBuffer({
        size: 32
      })]);
    }
  }, {
    key: "toDer",
    value: function toDer() {
      var rnbuf = this.r.toBuffer();
      var snbuf = this.s.toBuffer();
      var rneg = rnbuf[0] & 0x80;
      var sneg = snbuf[0] & 0x80;
      var rbuf = rneg ? Buffer.concat([Buffer.from([0x00]), rnbuf]) : rnbuf;
      var sbuf = sneg ? Buffer.concat([Buffer.from([0x00]), snbuf]) : snbuf;
      var length = 2 + rbuf.length + 2 + sbuf.length;
      var rlength = rbuf.length;
      var slength = sbuf.length;
      var rheader = 0x02;
      var sheader = 0x02;
      var header = 0x30;
      var der = Buffer.concat([Buffer.from([header, length, rheader, rlength]), rbuf, Buffer.from([sheader, slength]), sbuf]);
      return der;
    }
  }, {
    key: "toTxFormat",
    value: function toTxFormat() {
      var derbuf = this.toDer();
      var buf = Buffer.alloc(1);
      buf.writeUInt8(this.nHashType, 0);
      return Buffer.concat([derbuf, buf]);
    }
  }, {
    key: "toString",
    value: function toString() {
      return this.toHex();
    }
  }], [{
    key: "fromCompact",
    value: function fromCompact(buf) {
      return new this().fromCompact(buf);
    }
  }, {
    key: "fromRS",
    value: function fromRS(rsbuf) {
      return new this().fromRS(rsbuf);
    }
  }, {
    key: "fromDer",
    value: function fromDer(buf, strict) {
      return new this().fromDer(buf, strict);
    }
  }, {
    key: "fromTxFormat",
    value: function fromTxFormat(buf) {
      return new this().fromTxFormat(buf);
    }
  }, {
    key: "parseDer",
    value: function parseDer(buf, strict) {
      if (strict === undefined) {
        strict = true;
      }

      if (!Buffer.isBuffer(buf)) {
        throw new Error('DER formatted signature should be a buffer');
      }

      var header = buf[0];

      if (header !== 0x30) {
        throw new Error('Header byte should be 0x30');
      }

      var length = buf[1];
      var buflength = buf.slice(2).length;

      if (strict && length !== buflength) {
        throw new Error('LEngth byte should length of what follows');
      } else {
        length = length < buflength ? length : buflength;
      }

      var rheader = buf[2 + 0];

      if (rheader !== 0x02) {
        throw new Error('Integer byte for r should be 0x02');
      }

      var rlength = buf[2 + 1];
      var rbuf = buf.slice(2 + 2, 2 + 2 + rlength);
      var r = new Bn().fromBuffer(rbuf);
      var rneg = buf[2 + 1 + 1] === 0x00;

      if (rlength !== rbuf.length) {
        throw new Error('LEngth of r incorrect');
      }

      var sheader = buf[2 + 2 + rlength + 0];

      if (sheader !== 0x02) {
        throw new Error('Integer byte for s should be 0x02');
      }

      var slength = buf[2 + 2 + rlength + 1];
      var sbuf = buf.slice(2 + 2 + rlength + 2, 2 + 2 + rlength + 2 + slength);
      var s = new Bn().fromBuffer(sbuf);
      var sneg = buf[2 + 2 + rlength + 2 + 2] === 0x00;

      if (slength !== sbuf.length) {
        throw new Error('LEngth of s incorrect');
      }

      var sumlength = 2 + 2 + rlength + 2 + slength;

      if (length !== sumlength - 2) {
        throw new Error('LEngth of signature incorrect');
      }

      var obj = {
        header: header,
        length: length,
        rheader: rheader,
        rlength: rlength,
        rneg: rneg,
        rbuf: rbuf,
        r: r,
        sheader: sheader,
        slength: slength,
        sneg: sneg,
        sbuf: sbuf,
        s: s
      };
      return obj;
    }
  }, {
    key: "IsTxDer",
    value: function IsTxDer(buf) {
      if (buf.length < 9) {
        return false;
      }

      if (buf.length > 73) {
        return false;
      }

      if (buf[0] !== 0x30) {
        return false;
      }

      if (buf[1] !== buf.length - 3) {
        return false;
      }

      var nLEnR = buf[3];

      if (5 + nLEnR >= buf.length) {
        return false;
      }

      var nLEnS = buf[5 + nLEnR];

      if (nLEnR + nLEnS + 7 !== buf.length) {
        return false;
      }

      var R = buf.slice(4);

      if (buf[4 - 2] !== 0x02) {
        return false;
      }

      if (nLEnR === 0) {
        return false;
      }

      if (R[0] & 0x80) {
        return false;
      }

      if (nLEnR > 1 && R[0] === 0x00 && !(R[1] & 0x80)) {
        return false;
      }

      var S = buf.slice(6 + nLEnR);

      if (buf[6 + nLEnR - 2] !== 0x02) {
        return false;
      }

      if (nLEnS === 0) {
        return false;
      }

      if (S[0] & 0x80) {
        return false;
      }

      if (nLEnS > 1 && S[0] === 0x00 && !(S[1] & 0x80)) {
        return false;
      }

      return true;
    }
  }]);

  return Sig;
}(Struct);

exports.Sig = Sig;
Sig.SIGHASH_ALL = 0x00000001;
Sig.SIGHASH_NONE = 0x00000002;
Sig.SIGHASH_SINGLE = 0x00000003;
Sig.SIGHASH_FORKID = 0x00000040;
Sig.SIGHASH_ANYONECANPAY = 0x00000080;

var Script = /*#__PURE__*/function (_Struct8) {
  _inherits(Script, _Struct8);

  var _super11 = _createSuper(Script);

  function Script() {
    var chunks = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

    _classCallCheck(this, Script);

    return _super11.call(this, {
      chunks: chunks
    });
  }

  _createClass(Script, [{
    key: "fromJSON",
    value: function fromJSON(json) {
      return this.fromString(json);
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      return this.toString();
    }
  }, {
    key: "fromBuffer",
    value: function fromBuffer(buf) {
      this.chunks = [];
      var br = new Br(buf);

      while (!br.eof()) {
        var opCodeNum = br.readUInt8();
        var len = 0;

        var _buf = Buffer.from([]);

        if (opCodeNum > 0 && opCodeNum < OpCode.OP_PUSHDATA1) {
          len = opCodeNum;
          this.chunks.push({
            buf: br.read(len),
            len: len,
            opCodeNum: opCodeNum
          });
        } else if (opCodeNum === OpCode.OP_PUSHDATA1) {
          try {
            len = br.readUInt8();
            _buf = br.read(len);
          } catch (err) {
            br.read();
          }

          this.chunks.push({
            buf: _buf,
            len: len,
            opCodeNum: opCodeNum
          });
        } else if (opCodeNum === OpCode.OP_PUSHDATA2) {
          try {
            len = br.readUInt16LE();
            _buf = br.read(len);
          } catch (err) {
            br.read();
          }

          this.chunks.push({
            buf: _buf,
            len: len,
            opCodeNum: opCodeNum
          });
        } else if (opCodeNum === OpCode.OP_PUSHDATA4) {
          try {
            len = br.readUInt32LE();
            _buf = br.read(len);
          } catch (err) {
            br.read();
          }

          this.chunks.push({
            buf: _buf,
            len: len,
            opCodeNum: opCodeNum
          });
        } else {
          this.chunks.push({
            opCodeNum: opCodeNum
          });
        }
      }

      return this;
    }
  }, {
    key: "toBuffer",
    value: function toBuffer() {
      var bw = new Bw();

      for (var i = 0; i < this.chunks.length; i++) {
        var chunk = this.chunks[i];
        var opCodeNum = chunk.opCodeNum;
        bw.writeUInt8(opCodeNum);

        if (chunk.buf) {
          if (opCodeNum < OpCode.OP_PUSHDATA1) {
            bw.write(chunk.buf);
          } else if (opCodeNum === OpCode.OP_PUSHDATA1) {
            bw.writeUInt8(chunk.len);
            bw.write(chunk.buf);
          } else if (opCodeNum === OpCode.OP_PUSHDATA2) {
            bw.writeUInt16LE(chunk.len);
            bw.write(chunk.buf);
          } else if (opCodeNum === OpCode.OP_PUSHDATA4) {
            bw.writeUInt32LE(chunk.len);
            bw.write(chunk.buf);
          }
        }
      }

      return bw.toBuffer();
    }
  }, {
    key: "fromString",
    value: function fromString(str) {
      this.chunks = [];

      if (str === '' || str === undefined) {
        return this;
      }

      var tokens = str.split(' ');
      var i = 0;

      while (i < tokens.length) {
        var token = tokens[i];
        var opCodeNum = void 0;

        try {
          var opCode = new OpCode().fromString(token);
          opCodeNum = opCode.toNumber();
        } catch (err) {}

        if (opCodeNum === undefined) {
          opCodeNum = parseInt(token, 10);

          if (opCodeNum > 0 && opCodeNum < OpCode.OP_PUSHDATA1) {
            this.chunks.push({
              buf: Buffer.from(tokens[i + 1].slice(2), 'hex'),
              len: opCodeNum,
              opCodeNum: opCodeNum
            });
            i = i + 2;
          } else if (opCodeNum === 0) {
            this.chunks.push({
              opCodeNum: 0
            });
            i = i + 1;
          } else {
            throw new Error('Invalid script');
          }
        } else if (opCodeNum === OpCode.OP_PUSHDATA1 || opCodeNum === OpCode.OP_PUSHDATA2 || opCodeNum === OpCode.OP_PUSHDATA4) {
          if (tokens[i + 2].slice(0, 2) !== '0x') {
            throw new Error('Pushdata data must start with 0x');
          }

          this.chunks.push({
            buf: Buffer.from(tokens[i + 2].slice(2), 'hex'),
            len: parseInt(tokens[i + 1], 10),
            opCodeNum: opCodeNum
          });
          i = i + 3;
        } else {
          this.chunks.push({
            opCodeNum: opCodeNum
          });
          i = i + 1;
        }
      }

      return this;
    }
  }, {
    key: "toString",
    value: function toString() {
      var str = '';

      for (var i = 0; i < this.chunks.length; i++) {
        var chunk = this.chunks[i];
        var opCodeNum = chunk.opCodeNum;

        if (!chunk.buf) {
          if (OpCode.str[opCodeNum] !== undefined) {
            str = str + ' ' + new OpCode(opCodeNum).toString();
          } else {
            str = str + ' ' + '0x' + opCodeNum.toString(16);
          }
        } else {
          if (opCodeNum === OpCode.OP_PUSHDATA1 || opCodeNum === OpCode.OP_PUSHDATA2 || opCodeNum === OpCode.OP_PUSHDATA4) {
            str = str + ' ' + new OpCode(opCodeNum).toString();
          }

          str = str + ' ' + chunk.len;
          str = str + ' ' + '0x' + chunk.buf.toString('hex');
        }
      }

      return str.substr(1);
    }
  }, {
    key: "fromBitcoindString",
    value: function fromBitcoindString(str) {
      var bw = new Bw();
      var tokens = str.split(' ');
      var i;

      for (i = 0; i < tokens.length; i++) {
        var token = tokens[i];

        if (token === '') {
          continue;
        }

        if (token[0] === '0' && token[1] === 'x') {
          var hex = token.slice(2);
          bw.write(Buffer.from(hex, 'hex'));
        } else if (token[0] === "'") {
          var tstr = token.slice(1, token.length - 1);
          var cbuf = Buffer.from(tstr);
          var tbuf = new Script().writeBuffer(cbuf).toBuffer();
          bw.write(tbuf);
        } else if (OpCode['OP_' + token] !== undefined) {
          var opstr = 'OP_' + token;
          var opCodeNum = OpCode[opstr];
          bw.writeUInt8(opCodeNum);
        } else if (typeof OpCode[token] === 'number') {
          var _opstr = token;
          var _opCodeNum = OpCode[_opstr];
          bw.writeUInt8(_opCodeNum);
        } else if (!isNaN(parseInt(token, 10))) {
          var bn = new Bn(token);
          var script = new Script().writeBn(bn);

          var _tbuf = script.toBuffer();

          bw.write(_tbuf);
        } else {
          throw new Error('Could not determine type of script value');
        }
      }

      var buf = bw.toBuffer();
      return this.fromBuffer(buf);
    }
  }, {
    key: "toBitcoindString",
    value: function toBitcoindString() {
      var str = '';

      for (var i = 0; i < this.chunks.length; i++) {
        var chunk = this.chunks[i];

        if (chunk.buf) {
          var buf = new Script([chunk]).toBuffer();
          var hex = buf.toString('hex');
          str = str + ' ' + '0x' + hex;
        } else if (OpCode.str[chunk.opCodeNum] !== undefined) {
          var ostr = new OpCode(chunk.opCodeNum).toString();
          str = str + ' ' + ostr.slice(3);
        } else {
          str = str + ' ' + '0x' + chunk.opCodeNum.toString(16);
        }
      }

      return str.substr(1);
    }
  }, {
    key: "fromAsmString",
    value: function fromAsmString(str) {
      this.chunks = [];
      var tokens = str.split(' ');
      var i = 0;

      while (i < tokens.length) {
        var token = tokens[i];
        var opCode = void 0,
            opCodeNum = void 0;

        try {
          opCode = OpCode.fromString(token);
          opCodeNum = opCode.toNumber();
        } catch (err) {
          opCode = undefined;
          opCodeNum = undefined;
        }

        if (token === '0') {
          opCodeNum = 0;
          this.chunks.push({
            opCodeNum: opCodeNum
          });
          i = i + 1;
        } else if (token === '-1') {
          opCodeNum = OpCode.OP_1NEGATE;
          this.chunks.push({
            opCodeNum: opCodeNum
          });
          i = i + 1;
        } else if (opCode === undefined) {
          var hex = tokens[i];
          var buf = Buffer.from(hex, 'hex');

          if (buf.toString('hex') !== hex) {
            throw new Error('invalid hex string in script');
          }

          var len = buf.length;

          if (len >= 0 && len < OpCode.OP_PUSHDATA1) {
            opCodeNum = len;
          } else if (len < Math.pow(2, 8)) {
            opCodeNum = OpCode.OP_PUSHDATA1;
          } else if (len < Math.pow(2, 16)) {
            opCodeNum = OpCode.OP_PUSHDATA2;
          } else if (len < Math.pow(2, 32)) {
            opCodeNum = OpCode.OP_PUSHDATA4;
          }

          this.chunks.push({
            buf: buf,
            len: buf.length,
            opCodeNum: opCodeNum
          });
          i = i + 1;
        } else {
          this.chunks.push({
            opCodeNum: opCodeNum
          });
          i = i + 1;
        }
      }

      return this;
    }
  }, {
    key: "toAsmString",
    value: function toAsmString() {
      var str = '';

      for (var i = 0; i < this.chunks.length; i++) {
        var chunk = this.chunks[i];
        str += this._chunkToString(chunk);
      }

      return str.substr(1);
    }
  }, {
    key: "_chunkToString",
    value: function _chunkToString(chunk, type) {
      var opCodeNum = chunk.opCodeNum;
      var str = '';

      if (!chunk.buf) {
        if (typeof OpCode.str[opCodeNum] !== 'undefined') {
          if (opCodeNum === 0) {
            str = str + ' 0';
          } else if (opCodeNum === 79) {
            str = str + ' -1';
          } else {
            str = str + ' ' + new OpCode(opCodeNum).toString();
          }
        } else {
          var numstr = opCodeNum.toString(16);

          if (numstr.length % 2 !== 0) {
            numstr = '0' + numstr;
          }

          str = str + ' ' + numstr;
        }
      } else {
        if (chunk.len > 0) {
          str = str + ' ' + chunk.buf.toString('hex');
        }
      }

      return str;
    }
  }, {
    key: "fromOpReturnData",
    value: function fromOpReturnData(dataBuf) {
      this.writeOpCode(OpCode.OP_RETURN);
      this.writeBuffer(dataBuf);
      return this;
    }
  }, {
    key: "fromSafeData",
    value: function fromSafeData(dataBuf) {
      this.writeOpCode(OpCode.OP_FALSE);
      this.writeOpCode(OpCode.OP_RETURN);
      this.writeBuffer(dataBuf);
      return this;
    }
  }, {
    key: "fromSafeDataArray",
    value: function fromSafeDataArray(dataBufs) {
      this.writeOpCode(OpCode.OP_FALSE);
      this.writeOpCode(OpCode.OP_RETURN);

      for (var i in dataBufs) {
        var dataBuf = dataBufs[i];
        this.writeBuffer(dataBuf);
      }

      return this;
    }
  }, {
    key: "getData",
    value: function getData() {
      if (this.isSafeDataOut()) {
        var chunks = this.chunks.slice(2);
        var buffers = chunks.map(function (chunk) {
          return chunk.buf;
        });
        return buffers;
      }

      if (this.isOpReturn()) {
        var _chunks = this.chunks.slice(1);

        var _buffers = _chunks.map(function (chunk) {
          return chunk.buf;
        });

        return _buffers;
      }

      throw new Error('Unrecognized script type to get data from');
    }
  }, {
    key: "fromPubKeyHash",
    value: function fromPubKeyHash(hashBuf) {
      if (hashBuf.length !== 20) {
        throw new Error('hashBuf must be a 20 byte buffer');
      }

      this.writeOpCode(OpCode.OP_DUP);
      this.writeOpCode(OpCode.OP_HASH160);
      this.writeBuffer(hashBuf);
      this.writeOpCode(OpCode.OP_EQUALVERIFY);
      this.writeOpCode(OpCode.OP_CHECKSIG);
      return this;
    }
  }, {
    key: "fromPubKeys",
    value: function fromPubKeys(m, pubKeys) {
      var sort = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

      if (typeof m !== 'number') {
        throw new Error('m must be a number');
      }

      if (sort === true) {
        pubKeys = Script.sortPubKeys(pubKeys);
      }

      this.writeOpCode(m + OpCode.OP_1 - 1);

      for (var i in pubKeys) {
        this.writeBuffer(pubKeys[i].toBuffer());
      }

      this.writeOpCode(pubKeys.length + OpCode.OP_1 - 1);
      this.writeOpCode(OpCode.OP_CHECKMULTISIG);
      return this;
    }
  }, {
    key: "removeCodeseparators",
    value: function removeCodeseparators() {
      var chunks = [];

      for (var i = 0; i < this.chunks.length; i++) {
        if (this.chunks[i].opCodeNum !== OpCode.OP_CODESEPARATOR) {
          chunks.push(this.chunks[i]);
        }
      }

      this.chunks = chunks;
      return this;
    }
  }, {
    key: "isPushOnly",
    value: function isPushOnly() {
      for (var i = 0; i < this.chunks.length; i++) {
        var chunk = this.chunks[i];
        var opCodeNum = chunk.opCodeNum;

        if (opCodeNum > OpCode.OP_16) {
          return false;
        }
      }

      return true;
    }
  }, {
    key: "isOpReturn",
    value: function isOpReturn() {
      if (this.chunks[0].opCodeNum === OpCode.OP_RETURN && this.chunks.filter(function (chunk) {
        return Buffer.isBuffer(chunk.buf);
      }).length === this.chunks.slice(1).length) {
        return true;
      } else {
        return false;
      }
    }
  }, {
    key: "isSafeDataOut",
    value: function isSafeDataOut() {
      if (this.chunks.length < 2) {
        return false;
      }

      if (this.chunks[0].opCodeNum !== OpCode.OP_FALSE) {
        return false;
      }

      var chunks = this.chunks.slice(1);
      var script2 = new Script(chunks);
      return script2.isOpReturn();
    }
  }, {
    key: "isPubKeyHashOut",
    value: function isPubKeyHashOut() {
      if (this.chunks[0] && this.chunks[0].opCodeNum === OpCode.OP_DUP && this.chunks[1] && this.chunks[1].opCodeNum === OpCode.OP_HASH160 && this.chunks[2].buf && this.chunks[3] && this.chunks[3].opCodeNum === OpCode.OP_EQUALVERIFY && this.chunks[4] && this.chunks[4].opCodeNum === OpCode.OP_CHECKSIG) {
        return true;
      } else {
        return false;
      }
    }
  }, {
    key: "isPubKeyHashIn",
    value: function isPubKeyHashIn() {
      if (this.chunks.length === 2 && (this.chunks[0].buf || this.chunks[0].opCodeNum === OpCode.OP_0) && (this.chunks[1].buf || this.chunks[0].opCodeNum === OpCode.OP_0)) {
        return true;
      } else {
        return false;
      }
    }
  }, {
    key: "isScriptHashOut",
    value: function isScriptHashOut() {
      var buf = this.toBuffer();
      return buf.length === 23 && buf[0] === OpCode.OP_HASH160 && buf[1] === 0x14 && buf[22] === OpCode.OP_EQUAL;
    }
  }, {
    key: "isScriptHashIn",
    value: function isScriptHashIn() {
      if (!this.isPushOnly()) {
        return false;
      }

      try {
        new Script().fromBuffer(this.chunks[this.chunks.length - 1].buf);
      } catch (err) {
        return false;
      }

      return true;
    }
  }, {
    key: "isMultiSigOut",
    value: function isMultiSigOut() {
      var m = this.chunks[0].opCodeNum - OpCode.OP_1 + 1;

      if (!(m >= 1 && m <= 16)) {
        return false;
      }

      var pubKeychunks = this.chunks.slice(1, this.chunks.length - 2);

      if (!pubKeychunks.every(function (chunk) {
        try {
          var buf = chunk.buf;
          var pubKey = new PubKey().fromDer(buf);
          pubKey.validate();
          return true;
        } catch (err) {
          return false;
        }
      })) {
        return false;
      }

      var n = this.chunks[this.chunks.length - 2].opCodeNum - OpCode.OP_1 + 1;

      if (!(n >= m && n <= 16)) {
        return false;
      }

      if (this.chunks[1 + n + 1].opCodeNum !== OpCode.OP_CHECKMULTISIG) {
        return false;
      }

      return true;
    }
  }, {
    key: "isMultiSigIn",
    value: function isMultiSigIn() {
      if (this.chunks[0].opCodeNum !== OpCode.OP_0) {
        return false;
      }

      var remaining = this.chunks.slice(1);

      if (remaining.length < 1) {
        return false;
      }

      return remaining.every(function (chunk) {
        return Buffer.isBuffer(chunk.buf) && Sig.IsTxDer(chunk.buf);
      });
    }
  }, {
    key: "findAndDelete",
    value: function findAndDelete(script) {
      var buf = script.toBuffer();

      for (var i = 0; i < this.chunks.length; i++) {
        var script2 = new Script([this.chunks[i]]);
        var buf2 = script2.toBuffer();

        if (cmp(buf, buf2)) {
          this.chunks.splice(i, 1);
        }
      }

      return this;
    }
  }, {
    key: "writeScript",
    value: function writeScript(script) {
      this.chunks = this.chunks.concat(script.chunks);
      return this;
    }
  }, {
    key: "writeString",
    value: function writeString(str) {
      var script = new Script().fromString(str);
      this.chunks = this.chunks.concat(script.chunks);
      return this;
    }
  }, {
    key: "writeOpCode",
    value: function writeOpCode(opCodeNum) {
      this.chunks.push({
        opCodeNum: opCodeNum
      });
      return this;
    }
  }, {
    key: "setChunkOpCode",
    value: function setChunkOpCode(i, opCodeNum) {
      this.chunks[i] = {
        opCodeNum: opCodeNum
      };
      return this;
    }
  }, {
    key: "writeBn",
    value: function writeBn(bn) {
      if (bn.cmp(0) === OpCode.OP_0) {
        this.chunks.push({
          opCodeNum: OpCode.OP_0
        });
      } else if (bn.cmp(-1) === 0) {
        this.chunks.push({
          opCodeNum: OpCode.OP_1NEGATE
        });
      } else if (bn.cmp(1) >= 0 && bn.cmp(16) <= 0) {
        this.chunks.push({
          opCodeNum: bn.toNumber() + OpCode.OP_1 - 1
        });
      } else {
        var buf = bn.toSm({
          endian: 'little'
        });
        this.writeBuffer(buf);
      }

      return this;
    }
  }, {
    key: "writeNumber",
    value: function writeNumber(number) {
      this.writeBn(new Bn().fromNumber(number));
      return this;
    }
  }, {
    key: "setChunkBn",
    value: function setChunkBn(i, bn) {
      this.chunks[i] = new Script().writeBn(bn).chunks[0];
      return this;
    }
  }, {
    key: "writeBuffer",
    value: function writeBuffer(buf) {
      var opCodeNum;
      var len = buf.length;

      if (buf.length > 0 && buf.length < OpCode.OP_PUSHDATA1) {
        opCodeNum = buf.length;
      } else if (buf.length === 0) {
        opCodeNum = OpCode.OP_0;
      } else if (buf.length < Math.pow(2, 8)) {
        opCodeNum = OpCode.OP_PUSHDATA1;
      } else if (buf.length < Math.pow(2, 16)) {
        opCodeNum = OpCode.OP_PUSHDATA2;
      } else if (buf.length < Math.pow(2, 32)) {
        opCodeNum = OpCode.OP_PUSHDATA4;
      } else {
        throw new Error("You can't push that much data");
      }

      this.chunks.push({
        buf: buf,
        len: len,
        opCodeNum: opCodeNum
      });
      return this;
    }
  }, {
    key: "setChunkBuffer",
    value: function setChunkBuffer(i, buf) {
      this.chunks[i] = new Script().writeBuffer(buf).chunks[0];
      return this;
    }
  }, {
    key: "checkMinimalPush",
    value: function checkMinimalPush(i) {
      var chunk = this.chunks[i];
      var buf = chunk.buf;
      var opCodeNum = chunk.opCodeNum;

      if (!buf) {
        return true;
      }

      if (buf.length === 0) {
        return opCodeNum === OpCode.OP_0;
      } else if (buf.length === 1 && buf[0] >= 1 && buf[0] <= 16) {
        return opCodeNum === OpCode.OP_1 + (buf[0] - 1);
      } else if (buf.length === 1 && buf[0] === 0x81) {
        return opCodeNum === OpCode.OP_1NEGATE;
      } else if (buf.length <= 75) {
        return opCodeNum === buf.length;
      } else if (buf.length <= 255) {
        return opCodeNum === OpCode.OP_PUSHDATA1;
      } else if (buf.length <= 65535) {
        return opCodeNum === OpCode.OP_PUSHDATA2;
      }

      return true;
    }
  }], [{
    key: "fromBitcoindString",
    value: function fromBitcoindString(str) {
      return new this().fromBitcoindString(str);
    }
  }, {
    key: "fromAsmString",
    value: function fromAsmString(str) {
      return new this().fromAsmString(str);
    }
  }, {
    key: "fromOpReturnData",
    value: function fromOpReturnData(dataBuf) {
      return new this().fromOpReturnData(dataBuf);
    }
  }, {
    key: "fromSafeData",
    value: function fromSafeData(dataBuf) {
      return new this().fromSafeData(dataBuf);
    }
  }, {
    key: "fromSafeDataArray",
    value: function fromSafeDataArray(dataBufs) {
      return new this().fromSafeDataArray(dataBufs);
    }
  }, {
    key: "fromPubKeyHash",
    value: function fromPubKeyHash(hashBuf) {
      return new this().fromPubKeyHash(hashBuf);
    }
  }, {
    key: "sortPubKeys",
    value: function sortPubKeys(pubKeys) {
      return pubKeys.slice().sort(function (pubKey1, pubKey2) {
        var buf1 = pubKey1.toBuffer();
        var buf2 = pubKey2.toBuffer();
        var len = Math.max(buf1.length, buf2.length);

        for (var i = 0; i <= len; i++) {
          if (buf1[i] === undefined) {
            return -1;
          }

          if (buf2[i] === undefined) {
            return 1;
          }

          if (buf1[i] < buf2[i]) {
            return -1;
          }

          if (buf1[i] > buf2[i]) {
            return 1;
          } else {
            continue;
          }
        }
      });
    }
  }, {
    key: "fromPubKeys",
    value: function fromPubKeys(m, pubKeys, sort) {
      return new this().fromPubKeys(m, pubKeys, sort);
    }
  }, {
    key: "writeScript",
    value: function writeScript(script) {
      return new this().writeScript(script);
    }
  }, {
    key: "writeString",
    value: function writeString(str) {
      return new this().writeString(str);
    }
  }, {
    key: "writeOpCode",
    value: function writeOpCode(opCodeNum) {
      return new this().writeOpCode(opCodeNum);
    }
  }, {
    key: "writeBn",
    value: function writeBn(bn) {
      return new this().writeBn(bn);
    }
  }, {
    key: "writeNumber",
    value: function writeNumber(number) {
      return new this().writeNumber(number);
    }
  }, {
    key: "writeBuffer",
    value: function writeBuffer(buf) {
      return new this().writeBuffer(buf);
    }
  }]);

  return Script;
}(Struct);

exports.Script = Script;

var Address = /*#__PURE__*/function (_Struct9) {
  _inherits(Address, _Struct9);

  var _super12 = _createSuper(Address);

  function Address(versionByteNum, hashBuf) {
    var _this12;

    var constants = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

    _classCallCheck(this, Address);

    _this12 = _super12.call(this, {
      versionByteNum: versionByteNum,
      hashBuf: hashBuf
    });
    constants = constants || Constants.Default.Address;
    _this12.Constants = constants;
    return _this12;
  }

  _createClass(Address, [{
    key: "fromBuffer",
    value: function fromBuffer(buf) {
      if (buf.length !== 1 + 20) {
        throw new Error('address buffers must be exactly 21 bytes');
      }

      if (buf[0] !== this.Constants.pubKeyHash) {
        throw new Error('address: invalid versionByteNum byte');
      }

      this.versionByteNum = buf[0];
      this.hashBuf = buf.slice(1);
      return this;
    }
  }, {
    key: "fromPubKeyHashBuf",
    value: function fromPubKeyHashBuf(hashBuf) {
      this.hashBuf = hashBuf;
      this.versionByteNum = this.Constants.pubKeyHash;
      return this;
    }
  }, {
    key: "fromPubKey",
    value: function fromPubKey(pubKey) {
      var hashBuf = Hash.sha256Ripemd160(pubKey.toBuffer());
      return this.fromPubKeyHashBuf(hashBuf);
    }
  }, {
    key: "asyncFromPubKey",
    value: function () {
      var _asyncFromPubKey = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee12(pubKey) {
        var args, workersResult;
        return regeneratorRuntime.wrap(function _callee12$(_context14) {
          while (1) {
            switch (_context14.prev = _context14.next) {
              case 0:
                args = [pubKey];
                _context14.next = 3;
                return Workers.asyncObjectMethod(this, 'fromPubKey', args);

              case 3:
                workersResult = _context14.sent;
                return _context14.abrupt("return", this.fromFastBuffer(workersResult.resbuf));

              case 5:
              case "end":
                return _context14.stop();
            }
          }
        }, _callee12, this);
      }));

      function asyncFromPubKey(_x19) {
        return _asyncFromPubKey.apply(this, arguments);
      }

      return asyncFromPubKey;
    }()
  }, {
    key: "fromPrivKey",
    value: function fromPrivKey(privKey) {
      var pubKey = new PubKey().fromPrivKey(privKey);
      var hashBuf = Hash.sha256Ripemd160(pubKey.toBuffer());
      return this.fromPubKeyHashBuf(hashBuf);
    }
  }, {
    key: "asyncFromPrivKey",
    value: function () {
      var _asyncFromPrivKey2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee13(privKey) {
        var args, workersResult;
        return regeneratorRuntime.wrap(function _callee13$(_context15) {
          while (1) {
            switch (_context15.prev = _context15.next) {
              case 0:
                args = [privKey];
                _context15.next = 3;
                return Workers.asyncObjectMethod(this, 'fromPrivKey', args);

              case 3:
                workersResult = _context15.sent;
                return _context15.abrupt("return", this.fromFastBuffer(workersResult.resbuf));

              case 5:
              case "end":
                return _context15.stop();
            }
          }
        }, _callee13, this);
      }));

      function asyncFromPrivKey(_x20) {
        return _asyncFromPrivKey2.apply(this, arguments);
      }

      return asyncFromPrivKey;
    }()
  }, {
    key: "fromRandom",
    value: function fromRandom() {
      var randomPrivKey = new PrivKey().fromRandom();
      return this.fromPrivKey(randomPrivKey);
    }
  }, {
    key: "asyncFromRandom",
    value: function () {
      var _asyncFromRandom = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee14() {
        var args, workersResult;
        return regeneratorRuntime.wrap(function _callee14$(_context16) {
          while (1) {
            switch (_context16.prev = _context16.next) {
              case 0:
                args = [];
                _context16.next = 3;
                return Workers.asyncObjectMethod(this, 'fromRandom', args);

              case 3:
                workersResult = _context16.sent;
                return _context16.abrupt("return", this.fromFastBuffer(workersResult.resbuf));

              case 5:
              case "end":
                return _context16.stop();
            }
          }
        }, _callee14, this);
      }));

      function asyncFromRandom() {
        return _asyncFromRandom.apply(this, arguments);
      }

      return asyncFromRandom;
    }()
  }, {
    key: "fromString",
    value: function fromString(str) {
      var buf = Base58Check.decode(str);
      return this.fromBuffer(buf);
    }
  }, {
    key: "asyncFromString",
    value: function () {
      var _asyncFromString = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee15(str) {
        var args, workersResult;
        return regeneratorRuntime.wrap(function _callee15$(_context17) {
          while (1) {
            switch (_context17.prev = _context17.next) {
              case 0:
                args = [str];
                _context17.next = 3;
                return Workers.asyncObjectMethod(this, 'fromString', args);

              case 3:
                workersResult = _context17.sent;
                return _context17.abrupt("return", this.fromFastBuffer(workersResult.resbuf));

              case 5:
              case "end":
                return _context17.stop();
            }
          }
        }, _callee15, this);
      }));

      function asyncFromString(_x21) {
        return _asyncFromString.apply(this, arguments);
      }

      return asyncFromString;
    }()
  }, {
    key: "isValid",
    value: function isValid() {
      try {
        this.validate();
        return true;
      } catch (e) {
        return false;
      }
    }
  }, {
    key: "toTxOutScript",
    value: function toTxOutScript() {
      var script = new Script();
      script.writeOpCode(OpCode.OP_DUP);
      script.writeOpCode(OpCode.OP_HASH160);
      script.writeBuffer(this.hashBuf);
      script.writeOpCode(OpCode.OP_EQUALVERIFY);
      script.writeOpCode(OpCode.OP_CHECKSIG);
      return script;
    }
  }, {
    key: "fromTxInScript",
    value: function fromTxInScript(script) {
      var pubKeyHashBuf = Hash.sha256Ripemd160(script.chunks[1].buf);
      return this.fromPubKeyHashBuf(pubKeyHashBuf);
    }
  }, {
    key: "fromTxOutScript",
    value: function fromTxOutScript(script) {
      return this.fromPubKeyHashBuf(script.chunks[2].buf);
    }
  }, {
    key: "toBuffer",
    value: function toBuffer() {
      var versionByteBuf = Buffer.from([this.versionByteNum]);
      var buf = Buffer.concat([versionByteBuf, this.hashBuf]);
      return buf;
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      var json = {};

      if (this.hashBuf) {
        json.hashBuf = this.hashBuf.toString('hex');
      }

      if (typeof this.versionByteNum !== 'undefined') {
        json.versionByteNum = this.versionByteNum;
      }

      return json;
    }
  }, {
    key: "fromJSON",
    value: function fromJSON(json) {
      if (json.hashBuf) {
        this.hashBuf = Buffer.from(json.hashBuf, 'hex');
      }

      if (typeof json.versionByteNum !== 'undefined') {
        this.versionByteNum = json.versionByteNum;
      }

      return this;
    }
  }, {
    key: "toString",
    value: function toString() {
      return Base58Check.encode(this.toBuffer());
    }
  }, {
    key: "asyncToString",
    value: function () {
      var _asyncToString = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee16() {
        var args, workersResult;
        return regeneratorRuntime.wrap(function _callee16$(_context18) {
          while (1) {
            switch (_context18.prev = _context18.next) {
              case 0:
                args = [];
                _context18.next = 3;
                return Workers.asyncObjectMethod(this, 'toString', args);

              case 3:
                workersResult = _context18.sent;
                return _context18.abrupt("return", JSON.parse(workersResult.resbuf.toString()));

              case 5:
              case "end":
                return _context18.stop();
            }
          }
        }, _callee16, this);
      }));

      function asyncToString() {
        return _asyncToString.apply(this, arguments);
      }

      return asyncToString;
    }()
  }, {
    key: "validate",
    value: function validate() {
      if (!Buffer.isBuffer(this.hashBuf) || this.hashBuf.length !== 20) {
        throw new Error('hashBuf must be a buffer of 20 bytes');
      }

      if (this.versionByteNum !== this.Constants.pubKeyHash) {
        throw new Error('invalid versionByteNum');
      }

      return this;
    }
  }], [{
    key: "fromPubKeyHashBuf",
    value: function fromPubKeyHashBuf(hashBuf) {
      return new this().fromPubKeyHashBuf(hashBuf);
    }
  }, {
    key: "fromPubKey",
    value: function fromPubKey(pubKey) {
      return new this().fromPubKey(pubKey);
    }
  }, {
    key: "asyncFromPubKey",
    value: function asyncFromPubKey(pubKey) {
      return new this().asyncFromPubKey(pubKey);
    }
  }, {
    key: "fromPrivKey",
    value: function fromPrivKey(privKey) {
      return new this().fromPrivKey(privKey);
    }
  }, {
    key: "asyncFromPrivKey",
    value: function asyncFromPrivKey(privKey) {
      return new this().fromPrivKey(privKey);
    }
  }, {
    key: "fromRandom",
    value: function fromRandom() {
      return new this().fromRandom();
    }
  }, {
    key: "asyncFromRandom",
    value: function asyncFromRandom() {
      return new this().fromRandom();
    }
  }, {
    key: "asyncFromString",
    value: function asyncFromString(str) {
      return new this().asyncFromString(str);
    }
  }, {
    key: "isValid",
    value: function isValid(addrstr) {
      var address;

      try {
        address = new Address().fromString(addrstr);
      } catch (e) {
        return false;
      }

      return address.isValid();
    }
  }, {
    key: "fromTxInScript",
    value: function fromTxInScript(script) {
      return new this().fromTxInScript(script);
    }
  }, {
    key: "fromTxOutScript",
    value: function fromTxOutScript(script) {
      return new this().fromTxOutScript(script);
    }
  }]);

  return Address;
}(Struct);

exports.Address = Address;

Address.Mainnet = /*#__PURE__*/function (_Address) {
  _inherits(_class3, _Address);

  var _super13 = _createSuper(_class3);

  function _class3(versionByteNum, hashBuf) {
    _classCallCheck(this, _class3);

    return _super13.call(this, versionByteNum, hashBuf, Constants.Mainnet.Address);
  }

  return _class3;
}(Address);

Address.Testnet = /*#__PURE__*/function (_Address2) {
  _inherits(_class4, _Address2);

  var _super14 = _createSuper(_class4);

  function _class4(versionByteNum, hashBuf) {
    _classCallCheck(this, _class4);

    return _super14.call(this, versionByteNum, hashBuf, Constants.Testnet.Address);
  }

  return _class4;
}(Address);

var Bip32 = /*#__PURE__*/function (_Struct10) {
  _inherits(Bip32, _Struct10);

  var _super15 = _createSuper(Bip32);

  function Bip32(versionBytesNum, depth, parentFingerPrint, childIndex, chainCode, privKey, pubKey) {
    var _this13;

    var constants = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : null;
    var PrivKey$1 = arguments.length > 8 && arguments[8] !== undefined ? arguments[8] : PrivKey;

    _classCallCheck(this, Bip32);

    _this13 = _super15.call(this, {
      versionBytesNum: versionBytesNum,
      depth: depth,
      parentFingerPrint: parentFingerPrint,
      childIndex: childIndex,
      chainCode: chainCode,
      privKey: privKey,
      pubKey: pubKey
    });
    constants = constants || Constants.Default.Bip32;
    _this13.Constants = constants;
    _this13.PrivKey = PrivKey$1;
    return _this13;
  }

  _createClass(Bip32, [{
    key: "fromRandom",
    value: function fromRandom() {
      this.versionBytesNum = this.Constants.privKey;
      this.depth = 0x00;
      this.parentFingerPrint = Buffer.from([0, 0, 0, 0]);
      this.childIndex = 0;
      this.chainCode = Random.getRandomBuffer(32);
      this.privKey = new this.PrivKey().fromRandom();
      this.pubKey = new PubKey().fromPrivKey(this.privKey);
      return this;
    }
  }, {
    key: "fromString",
    value: function fromString(str) {
      return this.fromBuffer(Base58Check.decode(str));
    }
  }, {
    key: "asyncFromString",
    value: function () {
      var _asyncFromString2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee17(str) {
        var args, workersResult;
        return regeneratorRuntime.wrap(function _callee17$(_context19) {
          while (1) {
            switch (_context19.prev = _context19.next) {
              case 0:
                args = [str];
                _context19.next = 3;
                return Workers.asyncObjectMethod(this, 'fromString', args);

              case 3:
                workersResult = _context19.sent;
                return _context19.abrupt("return", this.fromFastBuffer(workersResult.resbuf));

              case 5:
              case "end":
                return _context19.stop();
            }
          }
        }, _callee17, this);
      }));

      function asyncFromString(_x22) {
        return _asyncFromString2.apply(this, arguments);
      }

      return asyncFromString;
    }()
  }, {
    key: "fromSeed",
    value: function fromSeed(bytes) {
      if (!Buffer.isBuffer(bytes)) {
        throw new Error('bytes must be a buffer');
      }

      if (bytes.length < 128 / 8) {
        throw new Error('Need more than 128 bits of entropy');
      }

      if (bytes.length > 512 / 8) {
        throw new Error('More than 512 bits of entropy is nonstandard');
      }

      var hash = Hash.sha512Hmac(bytes, Buffer.from('Bitcoin seed'));
      this.depth = 0x00;
      this.parentFingerPrint = Buffer.from([0, 0, 0, 0]);
      this.childIndex = 0;
      this.chainCode = hash.slice(32, 64);
      this.versionBytesNum = this.Constants.privKey;
      this.privKey = new this.PrivKey().fromBn(Bn().fromBuffer(hash.slice(0, 32)));
      this.pubKey = new PubKey().fromPrivKey(this.privKey);
      return this;
    }
  }, {
    key: "asyncFromSeed",
    value: function () {
      var _asyncFromSeed = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee18(bytes) {
        var workersResult;
        return regeneratorRuntime.wrap(function _callee18$(_context20) {
          while (1) {
            switch (_context20.prev = _context20.next) {
              case 0:
                _context20.next = 2;
                return Workers.asyncObjectMethod(this, 'fromSeed', [bytes]);

              case 2:
                workersResult = _context20.sent;
                return _context20.abrupt("return", this.fromFastBuffer(workersResult.resbuf));

              case 4:
              case "end":
                return _context20.stop();
            }
          }
        }, _callee18, this);
      }));

      function asyncFromSeed(_x23) {
        return _asyncFromSeed.apply(this, arguments);
      }

      return asyncFromSeed;
    }()
  }, {
    key: "fromBuffer",
    value: function fromBuffer(buf) {
      if (buf.length !== 78) {
        throw new Error('incorrect bip32 data length');
      }

      this.versionBytesNum = buf.slice(0, 4).readUInt32BE(0);
      this.depth = buf.slice(4, 5).readUInt8(0);
      this.parentFingerPrint = buf.slice(5, 9);
      this.childIndex = buf.slice(9, 13).readUInt32BE(0);
      this.chainCode = buf.slice(13, 45);
      var keyBytes = buf.slice(45, 78);
      var isPrivate = this.versionBytesNum === this.Constants.privKey;
      var isPublic = this.versionBytesNum === this.Constants.pubKey;

      if (isPrivate && keyBytes[0] === 0) {
        this.privKey = new this.PrivKey().fromBn(Bn().fromBuffer(keyBytes.slice(1, 33)));
        this.pubKey = new PubKey().fromPrivKey(this.privKey);
      } else if (isPublic && (keyBytes[0] === 0x02 || keyBytes[0] === 0x03)) {
        this.pubKey = new PubKey().fromDer(keyBytes);
      } else {
        throw new Error('Invalid key');
      }

      return this;
    }
  }, {
    key: "fromFastBuffer",
    value: function fromFastBuffer(buf) {
      if (buf.length === 0) {
        return this;
      }

      if (buf.length !== 78 && buf.length !== 78 + 33) {
        throw new Error('incorrect bip32 fastBuffer data length: ' + buf.length);
      }

      this.versionBytesNum = buf.slice(0, 4).readUInt32BE(0);
      this.depth = buf.slice(4, 5).readUInt8(0);
      this.parentFingerPrint = buf.slice(5, 9);
      this.childIndex = buf.slice(9, 13).readUInt32BE(0);
      this.chainCode = buf.slice(13, 45);
      var keyBytes = buf.slice(45, buf.length);
      var isPrivate = this.versionBytesNum === this.Constants.privKey;
      var isPublic = this.versionBytesNum === this.Constants.pubKey;

      if (isPrivate && keyBytes[0] === 0 && buf.length === 78) {
        this.privKey = new this.PrivKey().fromBn(Bn().fromBuffer(keyBytes.slice(1, 33)));
        this.pubKey = new PubKey().fromPrivKey(this.privKey);
      } else if (isPublic && buf.length === 78 + 33) {
        this.pubKey = new PubKey().fromFastBuffer(keyBytes);
        this.pubKey.compressed = true;
      } else {
        throw new Error('Invalid key');
      }

      return this;
    }
  }, {
    key: "derive",
    value: function derive(path) {
      var e = path.split('/');

      if (path === 'm') {
        return this;
      }

      var bip32 = this;

      for (var i in e) {
        var c = e[i];

        if (i === '0') {
          if (c !== 'm') throw new Error('invalid path');
          continue;
        }

        if (parseInt(c.replace("'", ''), 10).toString() !== c.replace("'", '')) {
          throw new Error('invalid path');
        }

        var usePrivate = c.length > 1 && c[c.length - 1] === "'";
        var childIndex = parseInt(usePrivate ? c.slice(0, c.length - 1) : c, 10) & 0x7fffffff;

        if (usePrivate) {
          childIndex += 0x80000000;
        }

        bip32 = bip32.deriveChild(childIndex);
      }

      return bip32;
    }
  }, {
    key: "asyncDerive",
    value: function () {
      var _asyncDerive = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee19(path) {
        var workersResult;
        return regeneratorRuntime.wrap(function _callee19$(_context21) {
          while (1) {
            switch (_context21.prev = _context21.next) {
              case 0:
                _context21.next = 2;
                return Workers.asyncObjectMethod(this, 'derive', [path]);

              case 2:
                workersResult = _context21.sent;
                return _context21.abrupt("return", new this.constructor().fromFastBuffer(workersResult.resbuf));

              case 4:
              case "end":
                return _context21.stop();
            }
          }
        }, _callee19, this);
      }));

      function asyncDerive(_x24) {
        return _asyncDerive.apply(this, arguments);
      }

      return asyncDerive;
    }()
  }, {
    key: "deriveChild",
    value: function deriveChild(i) {
      if (typeof i !== 'number') {
        throw new Error('i must be a number');
      }

      var ib = [];
      ib.push(i >> 24 & 0xff);
      ib.push(i >> 16 & 0xff);
      ib.push(i >> 8 & 0xff);
      ib.push(i & 0xff);
      ib = Buffer.from(ib);
      var usePrivate = (i & 0x80000000) !== 0;
      var isPrivate = this.versionBytesNum === this.Constants.privKey;

      if (usePrivate && (!this.privKey || !isPrivate)) {
        throw new Error('Cannot do private key derivation without private key');
      }

      var ret = null;

      if (this.privKey) {
        var data = null;

        if (usePrivate) {
          data = Buffer.concat([Buffer.from([0]), this.privKey.bn.toBuffer({
            size: 32
          }), ib]);
        } else {
          data = Buffer.concat([this.pubKey.toBuffer({
            size: 32
          }), ib]);
        }

        var hash = Hash.sha512Hmac(data, this.chainCode);
        var il = Bn().fromBuffer(hash.slice(0, 32), {
          size: 32
        });
        var ir = hash.slice(32, 64);
        var k = il.add(this.privKey.bn).mod(Point.getN());
        ret = new this.constructor();
        ret.chainCode = ir;
        ret.privKey = new this.PrivKey().fromBn(k);
        ret.pubKey = new PubKey().fromPrivKey(ret.privKey);
      } else {
        var _data = Buffer.concat([this.pubKey.toBuffer(), ib]);

        var _hash = Hash.sha512Hmac(_data, this.chainCode);

        var _il = Bn().fromBuffer(_hash.slice(0, 32));

        var _ir = _hash.slice(32, 64);

        var ilG = Point.getG().mul(_il);
        var Kpar = this.pubKey.point;
        var Ki = ilG.add(Kpar);
        var newpub = new PubKey();
        newpub.point = Ki;
        ret = new this.constructor();
        ret.chainCode = _ir;
        ret.pubKey = newpub;
      }

      ret.childIndex = i;
      var pubKeyhash = Hash.sha256Ripemd160(this.pubKey.toBuffer());
      ret.parentFingerPrint = pubKeyhash.slice(0, 4);
      ret.versionBytesNum = this.versionBytesNum;
      ret.depth = this.depth + 1;
      return ret;
    }
  }, {
    key: "toPublic",
    value: function toPublic() {
      var bip32 = new this.constructor().fromObject(this);
      bip32.versionBytesNum = this.Constants.pubKey;
      bip32.privKey = undefined;
      return bip32;
    }
  }, {
    key: "toBuffer",
    value: function toBuffer() {
      var isPrivate = this.versionBytesNum === this.Constants.privKey;
      var isPublic = this.versionBytesNum === this.Constants.pubKey;

      if (isPrivate) {
        return new Bw().writeUInt32BE(this.versionBytesNum).writeUInt8(this.depth).write(this.parentFingerPrint).writeUInt32BE(this.childIndex).write(this.chainCode).writeUInt8(0).write(this.privKey.bn.toBuffer({
          size: 32
        })).toBuffer();
      } else if (isPublic) {
        if (this.pubKey.compressed === false) {
          throw new Error('cannot convert bip32 to buffer if pubKey is not compressed');
        }

        return new Bw().writeUInt32BE(this.versionBytesNum).writeUInt8(this.depth).write(this.parentFingerPrint).writeUInt32BE(this.childIndex).write(this.chainCode).write(this.pubKey.toBuffer()).toBuffer();
      } else {
        throw new Error('bip32: invalid versionBytesNum byte');
      }
    }
  }, {
    key: "toFastBuffer",
    value: function toFastBuffer() {
      if (!this.versionBytesNum) {
        return Buffer.alloc(0);
      }

      var isPrivate = this.versionBytesNum === this.Constants.privKey;
      var isPublic = this.versionBytesNum === this.Constants.pubKey;

      if (isPrivate) {
        return new Bw().writeUInt32BE(this.versionBytesNum).writeUInt8(this.depth).write(this.parentFingerPrint).writeUInt32BE(this.childIndex).write(this.chainCode).writeUInt8(0).write(this.privKey.bn.toBuffer({
          size: 32
        })).toBuffer();
      } else if (isPublic) {
        return new Bw().writeUInt32BE(this.versionBytesNum).writeUInt8(this.depth).write(this.parentFingerPrint).writeUInt32BE(this.childIndex).write(this.chainCode).write(this.pubKey.toFastBuffer()).toBuffer();
      } else {
        throw new Error('bip32: invalid versionBytesNum byte');
      }
    }
  }, {
    key: "toString",
    value: function toString() {
      return Base58Check.encode(this.toBuffer());
    }
  }, {
    key: "asyncToString",
    value: function () {
      var _asyncToString2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee20() {
        var workersResult;
        return regeneratorRuntime.wrap(function _callee20$(_context22) {
          while (1) {
            switch (_context22.prev = _context22.next) {
              case 0:
                _context22.next = 2;
                return Workers.asyncObjectMethod(this, 'toString', []);

              case 2:
                workersResult = _context22.sent;
                return _context22.abrupt("return", JSON.parse(workersResult.resbuf.toString()));

              case 4:
              case "end":
                return _context22.stop();
            }
          }
        }, _callee20, this);
      }));

      function asyncToString() {
        return _asyncToString2.apply(this, arguments);
      }

      return asyncToString;
    }()
  }, {
    key: "toJSON",
    value: function toJSON() {
      return this.toFastHex();
    }
  }, {
    key: "fromJSON",
    value: function fromJSON(json) {
      return this.fromFastHex(json);
    }
  }, {
    key: "isPrivate",
    value: function isPrivate() {
      return this.versionBytesNum === this.Constants.privKey;
    }
  }], [{
    key: "fromRandom",
    value: function fromRandom() {
      return new this().fromRandom();
    }
  }, {
    key: "fromSeed",
    value: function fromSeed(bytes) {
      return new this().fromSeed(bytes);
    }
  }, {
    key: "asyncFromSeed",
    value: function asyncFromSeed(bytes) {
      return new this().asyncFromSeed(bytes);
    }
  }]);

  return Bip32;
}(Struct);

exports.Bip32 = Bip32;

Bip32.Mainnet = /*#__PURE__*/function (_Bip) {
  _inherits(_class5, _Bip);

  var _super16 = _createSuper(_class5);

  function _class5(versionBytesNum, depth, parentFingerPrint, childIndex, chainCode, privKey, pubKey) {
    _classCallCheck(this, _class5);

    return _super16.call(this, versionBytesNum, depth, parentFingerPrint, childIndex, chainCode, privKey, pubKey, Constants.Mainnet.Bip32, PrivKey.Mainnet);
  }

  return _class5;
}(Bip32);

Bip32.Testnet = /*#__PURE__*/function (_Bip2) {
  _inherits(_class6, _Bip2);

  var _super17 = _createSuper(_class6);

  function _class6(versionBytesNum, depth, parentFingerPrint, childIndex, chainCode, privKey, pubKey) {
    _classCallCheck(this, _class6);

    return _super17.call(this, versionBytesNum, depth, parentFingerPrint, childIndex, chainCode, privKey, pubKey, Constants.Testnet.Bip32, PrivKey.Testnet);
  }

  return _class6;
}(Bip32);

var wordList = ['abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual', 'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance', 'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent', 'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album', 'alcohol', 'alert', 'alien', 'all', 'alley', 'allow', 'almost', 'alone', 'alpha', 'already', 'also', 'alter', 'always', 'amateur', 'amazing', 'among', 'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger', 'angle', 'angry', 'animal', 'ankle', 'announce', 'annual', 'another', 'answer', 'antenna', 'antique', 'anxiety', 'any', 'apart', 'apology', 'appear', 'apple', 'approve', 'april', 'arch', 'arctic', 'area', 'arena', 'argue', 'arm', 'armed', 'armor', 'army', 'around', 'arrange', 'arrest', 'arrive', 'arrow', 'art', 'artefact', 'artist', 'artwork', 'ask', 'aspect', 'assault', 'asset', 'assist', 'assume', 'asthma', 'athlete', 'atom', 'attack', 'attend', 'attitude', 'attract', 'auction', 'audit', 'august', 'aunt', 'author', 'auto', 'autumn', 'average', 'avocado', 'avoid', 'awake', 'aware', 'away', 'awesome', 'awful', 'awkward', 'axis', 'baby', 'bachelor', 'bacon', 'badge', 'bag', 'balance', 'balcony', 'ball', 'bamboo', 'banana', 'banner', 'bar', 'barely', 'bargain', 'barrel', 'base', 'basic', 'basket', 'battle', 'beach', 'bean', 'beauty', 'because', 'become', 'beef', 'before', 'begin', 'behave', 'behind', 'believe', 'below', 'belt', 'bench', 'benefit', 'best', 'betray', 'better', 'between', 'beyond', 'bicycle', 'bid', 'bike', 'bind', 'biology', 'bird', 'birth', 'bitter', 'black', 'blade', 'blame', 'blanket', 'blast', 'bleak', 'bless', 'blind', 'blood', 'blossom', 'blouse', 'blue', 'blur', 'blush', 'board', 'boat', 'body', 'boil', 'bomb', 'bone', 'bonus', 'book', 'boost', 'border', 'boring', 'borrow', 'boss', 'bottom', 'bounce', 'box', 'boy', 'bracket', 'brain', 'brand', 'brass', 'brave', 'bread', 'breeze', 'brick', 'bridge', 'brief', 'bright', 'bring', 'brisk', 'broccoli', 'broken', 'bronze', 'broom', 'brother', 'brown', 'brush', 'bubble', 'buddy', 'budget', 'buffalo', 'build', 'bulb', 'bulk', 'bullet', 'bundle', 'bunker', 'burden', 'burger', 'burst', 'bus', 'business', 'busy', 'butter', 'buyer', 'buzz', 'cabbage', 'cabin', 'cable', 'cactus', 'cage', 'cake', 'call', 'calm', 'camera', 'camp', 'can', 'canal', 'cancel', 'candy', 'cannon', 'canoe', 'canvas', 'canyon', 'capable', 'capital', 'captain', 'car', 'carbon', 'card', 'cargo', 'carpet', 'carry', 'cart', 'case', 'cash', 'casino', 'castle', 'casual', 'cat', 'catalog', 'catch', 'category', 'cattle', 'caught', 'cause', 'caution', 'cave', 'ceiling', 'celery', 'cement', 'census', 'century', 'cereal', 'certain', 'chair', 'chalk', 'champion', 'change', 'chaos', 'chapter', 'charge', 'chase', 'chat', 'cheap', 'check', 'cheese', 'chef', 'cherry', 'chest', 'chicken', 'chief', 'child', 'chimney', 'choice', 'choose', 'chronic', 'chuckle', 'chunk', 'churn', 'cigar', 'cinnamon', 'circle', 'citizen', 'city', 'civil', 'claim', 'clap', 'clarify', 'claw', 'clay', 'clean', 'clerk', 'clever', 'click', 'client', 'cliff', 'climb', 'clinic', 'clip', 'clock', 'clog', 'close', 'cloth', 'cloud', 'clown', 'club', 'clump', 'cluster', 'clutch', 'coach', 'coast', 'coconut', 'code', 'coffee', 'coil', 'coin', 'collect', 'color', 'column', 'combine', 'come', 'comfort', 'comic', 'common', 'company', 'concert', 'conduct', 'confirm', 'congress', 'connect', 'consider', 'control', 'convince', 'cook', 'cool', 'copper', 'copy', 'coral', 'core', 'corn', 'correct', 'cost', 'cotton', 'couch', 'country', 'couple', 'course', 'cousin', 'cover', 'coyote', 'crack', 'cradle', 'craft', 'cram', 'crane', 'crash', 'crater', 'crawl', 'crazy', 'cream', 'credit', 'creek', 'crew', 'cricket', 'crime', 'crisp', 'critic', 'crop', 'cross', 'crouch', 'crowd', 'crucial', 'cruel', 'cruise', 'crumble', 'crunch', 'crush', 'cry', 'crystal', 'cube', 'culture', 'cup', 'cupboard', 'curious', 'current', 'curtain', 'curve', 'cushion', 'custom', 'cute', 'cycle', 'dad', 'damage', 'damp', 'dance', 'danger', 'daring', 'dash', 'daughter', 'dawn', 'day', 'deal', 'debate', 'debris', 'decade', 'december', 'decide', 'decline', 'decorate', 'decrease', 'deer', 'defense', 'define', 'defy', 'degree', 'delay', 'deliver', 'demand', 'demise', 'denial', 'dentist', 'deny', 'depart', 'depend', 'deposit', 'depth', 'deputy', 'derive', 'describe', 'desert', 'design', 'desk', 'despair', 'destroy', 'detail', 'detect', 'develop', 'device', 'devote', 'diagram', 'dial', 'diamond', 'diary', 'dice', 'diesel', 'diet', 'differ', 'digital', 'dignity', 'dilemma', 'dinner', 'dinosaur', 'direct', 'dirt', 'disagree', 'discover', 'disease', 'dish', 'dismiss', 'disorder', 'display', 'distance', 'divert', 'divide', 'divorce', 'dizzy', 'doctor', 'document', 'dog', 'doll', 'dolphin', 'domain', 'donate', 'donkey', 'donor', 'door', 'dose', 'double', 'dove', 'draft', 'dragon', 'drama', 'drastic', 'draw', 'dream', 'dress', 'drift', 'drill', 'drink', 'drip', 'drive', 'drop', 'drum', 'dry', 'duck', 'dumb', 'dune', 'during', 'dust', 'dutch', 'duty', 'dwarf', 'dynamic', 'eager', 'eagle', 'early', 'earn', 'earth', 'easily', 'east', 'easy', 'echo', 'ecology', 'economy', 'edge', 'edit', 'educate', 'effort', 'egg', 'eight', 'either', 'elbow', 'elder', 'electric', 'elegant', 'element', 'elephant', 'elevator', 'elite', 'else', 'embark', 'embody', 'embrace', 'emerge', 'emotion', 'employ', 'empower', 'empty', 'enable', 'enact', 'end', 'endless', 'endorse', 'enemy', 'energy', 'enforce', 'engage', 'engine', 'enhance', 'enjoy', 'enlist', 'enough', 'enrich', 'enroll', 'ensure', 'enter', 'entire', 'entry', 'envelope', 'episode', 'equal', 'equip', 'era', 'erase', 'erode', 'erosion', 'error', 'erupt', 'escape', 'essay', 'essence', 'estate', 'eternal', 'ethics', 'evidence', 'evil', 'evoke', 'evolve', 'exact', 'example', 'excess', 'exchange', 'excite', 'exclude', 'excuse', 'execute', 'exercise', 'exhaust', 'exhibit', 'exile', 'exist', 'exit', 'exotic', 'expand', 'expect', 'expire', 'explain', 'expose', 'express', 'extend', 'extra', 'eye', 'eyebrow', 'fabric', 'face', 'faculty', 'fade', 'faint', 'faith', 'fall', 'false', 'fame', 'family', 'famous', 'fan', 'fancy', 'fantasy', 'farm', 'fashion', 'fat', 'fatal', 'father', 'fatigue', 'fault', 'favorite', 'feature', 'february', 'federal', 'fee', 'feed', 'feel', 'female', 'fence', 'festival', 'fetch', 'fever', 'few', 'fiber', 'fiction', 'field', 'figure', 'file', 'film', 'filter', 'final', 'find', 'fine', 'finger', 'finish', 'fire', 'firm', 'first', 'fiscal', 'fish', 'fit', 'fitness', 'fix', 'flag', 'flame', 'flash', 'flat', 'flavor', 'flee', 'flight', 'flip', 'float', 'flock', 'floor', 'flower', 'fluid', 'flush', 'fly', 'foam', 'focus', 'fog', 'foil', 'fold', 'follow', 'food', 'foot', 'force', 'forest', 'forget', 'fork', 'fortune', 'forum', 'forward', 'fossil', 'foster', 'found', 'fox', 'fragile', 'frame', 'frequent', 'fresh', 'friend', 'fringe', 'frog', 'front', 'frost', 'frown', 'frozen', 'fruit', 'fuel', 'fun', 'funny', 'furnace', 'fury', 'future', 'gadget', 'gain', 'galaxy', 'gallery', 'game', 'gap', 'garage', 'garbage', 'garden', 'garlic', 'garment', 'gas', 'gasp', 'gate', 'gather', 'gauge', 'gaze', 'general', 'genius', 'genre', 'gentle', 'genuine', 'gesture', 'ghost', 'giant', 'gift', 'giggle', 'ginger', 'giraffe', 'girl', 'give', 'glad', 'glance', 'glare', 'glass', 'glide', 'glimpse', 'globe', 'gloom', 'glory', 'glove', 'glow', 'glue', 'goat', 'goddess', 'gold', 'good', 'goose', 'gorilla', 'gospel', 'gossip', 'govern', 'gown', 'grab', 'grace', 'grain', 'grant', 'grape', 'grass', 'gravity', 'great', 'green', 'grid', 'grief', 'grit', 'grocery', 'group', 'grow', 'grunt', 'guard', 'guess', 'guide', 'guilt', 'guitar', 'gun', 'gym', 'habit', 'hair', 'half', 'hammer', 'hamster', 'hand', 'happy', 'harbor', 'hard', 'harsh', 'harvest', 'hat', 'have', 'hawk', 'hazard', 'head', 'health', 'heart', 'heavy', 'hedgehog', 'height', 'hello', 'helmet', 'help', 'hen', 'hero', 'hidden', 'high', 'hill', 'hint', 'hip', 'hire', 'history', 'hobby', 'hockey', 'hold', 'hole', 'holiday', 'hollow', 'home', 'honey', 'hood', 'hope', 'horn', 'horror', 'horse', 'hospital', 'host', 'hotel', 'hour', 'hover', 'hub', 'huge', 'human', 'humble', 'humor', 'hundred', 'hungry', 'hunt', 'hurdle', 'hurry', 'hurt', 'husband', 'hybrid', 'ice', 'icon', 'idea', 'identify', 'idle', 'ignore', 'ill', 'illegal', 'illness', 'image', 'imitate', 'immense', 'immune', 'impact', 'impose', 'improve', 'impulse', 'inch', 'include', 'income', 'increase', 'index', 'indicate', 'indoor', 'industry', 'infant', 'inflict', 'inform', 'inhale', 'inherit', 'initial', 'inject', 'injury', 'inmate', 'inner', 'innocent', 'input', 'inquiry', 'insane', 'insect', 'inside', 'inspire', 'install', 'intact', 'interest', 'into', 'invest', 'invite', 'involve', 'iron', 'island', 'isolate', 'issue', 'item', 'ivory', 'jacket', 'jaguar', 'jar', 'jazz', 'jealous', 'jeans', 'jelly', 'jewel', 'job', 'join', 'joke', 'journey', 'joy', 'judge', 'juice', 'jump', 'jungle', 'junior', 'junk', 'just', 'kangaroo', 'keen', 'keep', 'ketchup', 'key', 'kick', 'kid', 'kidney', 'kind', 'kingdom', 'kiss', 'kit', 'kitchen', 'kite', 'kitten', 'kiwi', 'knee', 'knife', 'knock', 'know', 'lab', 'label', 'labor', 'ladder', 'lady', 'lake', 'lamp', 'language', 'laptop', 'large', 'later', 'latin', 'laugh', 'laundry', 'lava', 'law', 'lawn', 'lawsuit', 'layer', 'lazy', 'leader', 'leaf', 'learn', 'leave', 'lecture', 'left', 'leg', 'legal', 'legend', 'leisure', 'lemon', 'lend', 'length', 'lens', 'leopard', 'lesson', 'letter', 'level', 'liar', 'liberty', 'library', 'license', 'life', 'lift', 'light', 'like', 'limb', 'limit', 'link', 'lion', 'liquid', 'list', 'little', 'live', 'lizard', 'load', 'loan', 'lobster', 'local', 'lock', 'logic', 'lonely', 'long', 'loop', 'lottery', 'loud', 'lounge', 'love', 'loyal', 'lucky', 'luggage', 'lumber', 'lunar', 'lunch', 'luxury', 'lyrics', 'machine', 'mad', 'magic', 'magnet', 'maid', 'mail', 'main', 'major', 'make', 'mammal', 'man', 'manage', 'mandate', 'mango', 'mansion', 'manual', 'maple', 'marble', 'march', 'margin', 'marine', 'market', 'marriage', 'mask', 'mass', 'master', 'match', 'material', 'math', 'matrix', 'matter', 'maximum', 'maze', 'meadow', 'mean', 'measure', 'meat', 'mechanic', 'medal', 'media', 'melody', 'melt', 'member', 'memory', 'mention', 'menu', 'mercy', 'merge', 'merit', 'merry', 'mesh', 'message', 'metal', 'method', 'middle', 'midnight', 'milk', 'million', 'mimic', 'mind', 'minimum', 'minor', 'minute', 'miracle', 'mirror', 'misery', 'miss', 'mistake', 'mix', 'mixed', 'mixture', 'mobile', 'model', 'modify', 'mom', 'moment', 'monitor', 'monkey', 'monster', 'month', 'moon', 'moral', 'more', 'morning', 'mosquito', 'mother', 'motion', 'motor', 'mountain', 'mouse', 'move', 'movie', 'much', 'muffin', 'mule', 'multiply', 'muscle', 'museum', 'mushroom', 'music', 'must', 'mutual', 'myself', 'mystery', 'myth', 'naive', 'name', 'napkin', 'narrow', 'nasty', 'nation', 'nature', 'near', 'neck', 'need', 'negative', 'neglect', 'neither', 'nephew', 'nerve', 'nest', 'net', 'network', 'neutral', 'never', 'news', 'next', 'nice', 'night', 'noble', 'noise', 'nominee', 'noodle', 'normal', 'north', 'nose', 'notable', 'note', 'nothing', 'notice', 'novel', 'now', 'nuclear', 'number', 'nurse', 'nut', 'oak', 'obey', 'object', 'oblige', 'obscure', 'observe', 'obtain', 'obvious', 'occur', 'ocean', 'october', 'odor', 'off', 'offer', 'office', 'often', 'oil', 'okay', 'old', 'olive', 'olympic', 'omit', 'once', 'one', 'onion', 'online', 'only', 'open', 'opera', 'opinion', 'oppose', 'option', 'orange', 'orbit', 'orchard', 'order', 'ordinary', 'organ', 'orient', 'original', 'orphan', 'ostrich', 'other', 'outdoor', 'outer', 'output', 'outside', 'oval', 'oven', 'over', 'own', 'owner', 'oxygen', 'oyster', 'ozone', 'pact', 'paddle', 'page', 'pair', 'palace', 'palm', 'panda', 'panel', 'panic', 'panther', 'paper', 'parade', 'parent', 'park', 'parrot', 'party', 'pass', 'patch', 'path', 'patient', 'patrol', 'pattern', 'pause', 'pave', 'payment', 'peace', 'peanut', 'pear', 'peasant', 'pelican', 'pen', 'penalty', 'pencil', 'people', 'pepper', 'perfect', 'permit', 'person', 'pet', 'phone', 'photo', 'phrase', 'physical', 'piano', 'picnic', 'picture', 'piece', 'pig', 'pigeon', 'pill', 'pilot', 'pink', 'pioneer', 'pipe', 'pistol', 'pitch', 'pizza', 'place', 'planet', 'plastic', 'plate', 'play', 'please', 'pledge', 'pluck', 'plug', 'plunge', 'poem', 'poet', 'point', 'polar', 'pole', 'police', 'pond', 'pony', 'pool', 'popular', 'portion', 'position', 'possible', 'post', 'potato', 'pottery', 'poverty', 'powder', 'power', 'practice', 'praise', 'predict', 'prefer', 'prepare', 'present', 'pretty', 'prevent', 'price', 'pride', 'primary', 'print', 'priority', 'prison', 'private', 'prize', 'problem', 'process', 'produce', 'profit', 'program', 'project', 'promote', 'proof', 'property', 'prosper', 'protect', 'proud', 'provide', 'public', 'pudding', 'pull', 'pulp', 'pulse', 'pumpkin', 'punch', 'pupil', 'puppy', 'purchase', 'purity', 'purpose', 'purse', 'push', 'put', 'puzzle', 'pyramid', 'quality', 'quantum', 'quarter', 'question', 'quick', 'quit', 'quiz', 'quote', 'rabbit', 'raccoon', 'race', 'rack', 'radar', 'radio', 'rail', 'rain', 'raise', 'rally', 'ramp', 'ranch', 'random', 'range', 'rapid', 'rare', 'rate', 'rather', 'raven', 'raw', 'razor', 'ready', 'real', 'reason', 'rebel', 'rebuild', 'recall', 'receive', 'recipe', 'record', 'recycle', 'reduce', 'reflect', 'reform', 'refuse', 'region', 'regret', 'regular', 'reject', 'relax', 'release', 'relief', 'rely', 'remain', 'remember', 'remind', 'remove', 'render', 'renew', 'rent', 'reopen', 'repair', 'repeat', 'replace', 'report', 'require', 'rescue', 'resemble', 'resist', 'resource', 'response', 'result', 'retire', 'retreat', 'return', 'reunion', 'reveal', 'review', 'reward', 'rhythm', 'rib', 'ribbon', 'rice', 'rich', 'ride', 'ridge', 'rifle', 'right', 'rigid', 'ring', 'riot', 'ripple', 'risk', 'ritual', 'rival', 'river', 'road', 'roast', 'robot', 'robust', 'rocket', 'romance', 'roof', 'rookie', 'room', 'rose', 'rotate', 'rough', 'round', 'route', 'royal', 'rubber', 'rude', 'rug', 'rule', 'run', 'runway', 'rural', 'sad', 'saddle', 'sadness', 'safe', 'sail', 'salad', 'salmon', 'salon', 'salt', 'salute', 'same', 'sample', 'sand', 'satisfy', 'satoshi', 'sauce', 'sausage', 'save', 'say', 'scale', 'scan', 'scare', 'scatter', 'scene', 'scheme', 'school', 'science', 'scissors', 'scorpion', 'scout', 'scrap', 'screen', 'script', 'scrub', 'sea', 'search', 'season', 'seat', 'second', 'secret', 'section', 'security', 'seed', 'seek', 'segment', 'select', 'sell', 'seminar', 'senior', 'sense', 'sentence', 'series', 'service', 'session', 'settle', 'setup', 'seven', 'shadow', 'shaft', 'shallow', 'share', 'shed', 'shell', 'sheriff', 'shield', 'shift', 'shine', 'ship', 'shiver', 'shock', 'shoe', 'shoot', 'shop', 'short', 'shoulder', 'shove', 'shrimp', 'shrug', 'shuffle', 'shy', 'sibling', 'sick', 'side', 'siege', 'sight', 'sign', 'silent', 'silk', 'silly', 'silver', 'similar', 'simple', 'since', 'sing', 'siren', 'sister', 'situate', 'six', 'size', 'skate', 'sketch', 'ski', 'skill', 'skin', 'skirt', 'skull', 'slab', 'slam', 'sleep', 'slender', 'slice', 'slide', 'slight', 'slim', 'slogan', 'slot', 'slow', 'slush', 'small', 'smart', 'smile', 'smoke', 'smooth', 'snack', 'snake', 'snap', 'sniff', 'snow', 'soap', 'soccer', 'social', 'sock', 'soda', 'soft', 'solar', 'soldier', 'solid', 'solution', 'solve', 'someone', 'song', 'soon', 'sorry', 'sort', 'soul', 'sound', 'soup', 'source', 'south', 'space', 'spare', 'spatial', 'spawn', 'speak', 'special', 'speed', 'spell', 'spend', 'sphere', 'spice', 'spider', 'spike', 'spin', 'spirit', 'split', 'spoil', 'sponsor', 'spoon', 'sport', 'spot', 'spray', 'spread', 'spring', 'spy', 'square', 'squeeze', 'squirrel', 'stable', 'stadium', 'staff', 'stage', 'stairs', 'stamp', 'stand', 'start', 'state', 'stay', 'steak', 'steel', 'stem', 'step', 'stereo', 'stick', 'still', 'sting', 'stock', 'stomach', 'stone', 'stool', 'story', 'stove', 'strategy', 'street', 'strike', 'strong', 'struggle', 'student', 'stuff', 'stumble', 'style', 'subject', 'submit', 'subway', 'success', 'such', 'sudden', 'suffer', 'sugar', 'suggest', 'suit', 'summer', 'sun', 'sunny', 'sunset', 'super', 'supply', 'supreme', 'sure', 'surface', 'surge', 'surprise', 'surround', 'survey', 'suspect', 'sustain', 'swallow', 'swamp', 'swap', 'swarm', 'swear', 'sweet', 'swift', 'swim', 'swing', 'switch', 'sword', 'symbol', 'symptom', 'syrup', 'system', 'table', 'tackle', 'tag', 'tail', 'talent', 'talk', 'tank', 'tape', 'target', 'task', 'taste', 'tattoo', 'taxi', 'teach', 'team', 'tell', 'ten', 'tenant', 'tennis', 'tent', 'term', 'test', 'text', 'thank', 'that', 'theme', 'then', 'theory', 'there', 'they', 'thing', 'this', 'thought', 'three', 'thrive', 'throw', 'thumb', 'thunder', 'ticket', 'tide', 'tiger', 'tilt', 'timber', 'time', 'tiny', 'tip', 'tired', 'tissue', 'title', 'toast', 'tobacco', 'today', 'toddler', 'toe', 'together', 'toilet', 'token', 'tomato', 'tomorrow', 'tone', 'tongue', 'tonight', 'tool', 'tooth', 'top', 'topic', 'topple', 'torch', 'tornado', 'tortoise', 'toss', 'total', 'tourist', 'toward', 'tower', 'town', 'toy', 'track', 'trade', 'traffic', 'tragic', 'train', 'transfer', 'trap', 'trash', 'travel', 'tray', 'treat', 'tree', 'trend', 'trial', 'tribe', 'trick', 'trigger', 'trim', 'trip', 'trophy', 'trouble', 'truck', 'true', 'truly', 'trumpet', 'trust', 'truth', 'try', 'tube', 'tuition', 'tumble', 'tuna', 'tunnel', 'turkey', 'turn', 'turtle', 'twelve', 'twenty', 'twice', 'twin', 'twist', 'two', 'type', 'typical', 'ugly', 'umbrella', 'unable', 'unaware', 'uncle', 'uncover', 'under', 'undo', 'unfair', 'unfold', 'unhappy', 'uniform', 'unique', 'unit', 'universe', 'unknown', 'unlock', 'until', 'unusual', 'unveil', 'update', 'upgrade', 'uphold', 'upon', 'upper', 'upset', 'urban', 'urge', 'usage', 'use', 'used', 'useful', 'useless', 'usual', 'utility', 'vacant', 'vacuum', 'vague', 'valid', 'valley', 'valve', 'van', 'vanish', 'vapor', 'various', 'vast', 'vault', 'vehicle', 'velvet', 'vendor', 'venture', 'venue', 'verb', 'verify', 'version', 'very', 'vessel', 'veteran', 'viable', 'vibrant', 'vicious', 'victory', 'video', 'view', 'village', 'vintage', 'violin', 'virtual', 'virus', 'visa', 'visit', 'visual', 'vital', 'vivid', 'vocal', 'voice', 'void', 'volcano', 'volume', 'vote', 'voyage', 'wage', 'wagon', 'wait', 'walk', 'wall', 'walnut', 'want', 'warfare', 'warm', 'warrior', 'wash', 'wasp', 'waste', 'water', 'wave', 'way', 'wealth', 'weapon', 'wear', 'weasel', 'weather', 'web', 'wedding', 'weekend', 'weird', 'welcome', 'west', 'wet', 'whale', 'what', 'wheat', 'wheel', 'when', 'where', 'whip', 'whisper', 'wide', 'width', 'wife', 'wild', 'will', 'win', 'window', 'wine', 'wing', 'wink', 'winner', 'winter', 'wire', 'wisdom', 'wise', 'wish', 'witness', 'wolf', 'woman', 'wonder', 'wood', 'wool', 'word', 'work', 'world', 'worry', 'worth', 'wrap', 'wreck', 'wrestle', 'wrist', 'write', 'wrong', 'yard', 'year', 'yellow', 'you', 'young', 'youth', 'zebra', 'zero', 'zone', 'zoo'];
exports.en = wordList;
wordList.space = ' ';

var Bip39 = /*#__PURE__*/function (_Struct11) {
  _inherits(Bip39, _Struct11);

  var _super18 = _createSuper(Bip39);

  function Bip39(mnemonic, seed) {
    var _this14;

    var wordlist = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : wordList;

    _classCallCheck(this, Bip39);

    _this14 = _super18.call(this, {
      mnemonic: mnemonic,
      seed: seed
    });
    _this14.Wordlist = wordlist;
    return _this14;
  }

  _createClass(Bip39, [{
    key: "toBw",
    value: function toBw(bw) {
      if (!bw) {
        bw = new Bw();
      }

      if (this.mnemonic) {
        var buf = Buffer.from(this.mnemonic);
        bw.writeVarIntNum(buf.length);
        bw.write(buf);
      } else {
        bw.writeVarIntNum(0);
      }

      if (this.seed) {
        bw.writeVarIntNum(this.seed.length);
        bw.write(this.seed);
      } else {
        bw.writeVarIntNum(0);
      }

      return bw;
    }
  }, {
    key: "fromBr",
    value: function fromBr(br) {
      var mnemoniclen = br.readVarIntNum();

      if (mnemoniclen > 0) {
        this.mnemonic = br.read(mnemoniclen).toString();
      }

      var seedlen = br.readVarIntNum();

      if (seedlen > 0) {
        this.seed = br.read(seedlen);
      }

      return this;
    }
  }, {
    key: "fromRandom",
    value: function fromRandom(bits) {
      if (!bits) {
        bits = 128;
      }

      if (bits % 32 !== 0) {
        throw new Error('bits must be multiple of 32');
      }

      if (bits < 128) {
        throw new Error('bits must be at least 128');
      }

      var buf = Random.getRandomBuffer(bits / 8);
      this.entropy2Mnemonic(buf);
      this.mnemonic2Seed();
      return this;
    }
  }, {
    key: "asyncFromRandom",
    value: function () {
      var _asyncFromRandom2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee21(bits) {
        var buf, workersResult, bip39;
        return regeneratorRuntime.wrap(function _callee21$(_context23) {
          while (1) {
            switch (_context23.prev = _context23.next) {
              case 0:
                if (!bits) {
                  bits = 128;
                }

                buf = Random.getRandomBuffer(bits / 8);
                _context23.next = 4;
                return Workers.asyncObjectMethod(this, 'entropy2Mnemonic', [buf]);

              case 4:
                workersResult = _context23.sent;
                bip39 = new Bip39().fromFastBuffer(workersResult.resbuf);
                _context23.next = 8;
                return Workers.asyncObjectMethod(bip39, 'mnemonic2Seed', []);

              case 8:
                workersResult = _context23.sent;
                return _context23.abrupt("return", this.fromFastBuffer(workersResult.resbuf));

              case 10:
              case "end":
                return _context23.stop();
            }
          }
        }, _callee21, this);
      }));

      function asyncFromRandom(_x25) {
        return _asyncFromRandom2.apply(this, arguments);
      }

      return asyncFromRandom;
    }()
  }, {
    key: "fromEntropy",
    value: function fromEntropy(buf) {
      this.entropy2Mnemonic(buf);
      return this;
    }
  }, {
    key: "asyncFromEntropy",
    value: function () {
      var _asyncFromEntropy = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee22(buf) {
        var workersResult;
        return regeneratorRuntime.wrap(function _callee22$(_context24) {
          while (1) {
            switch (_context24.prev = _context24.next) {
              case 0:
                _context24.next = 2;
                return Workers.asyncObjectMethod(this, 'fromEntropy', [buf]);

              case 2:
                workersResult = _context24.sent;
                return _context24.abrupt("return", this.fromFastBuffer(workersResult.resbuf));

              case 4:
              case "end":
                return _context24.stop();
            }
          }
        }, _callee22, this);
      }));

      function asyncFromEntropy(_x26) {
        return _asyncFromEntropy.apply(this, arguments);
      }

      return asyncFromEntropy;
    }()
  }, {
    key: "fromString",
    value: function fromString(mnemonic) {
      this.mnemonic = mnemonic;
      return this;
    }
  }, {
    key: "toString",
    value: function toString() {
      return this.mnemonic;
    }
  }, {
    key: "toSeed",
    value: function toSeed(passphrase) {
      this.mnemonic2Seed(passphrase);
      return this.seed;
    }
  }, {
    key: "asyncToSeed",
    value: function () {
      var _asyncToSeed = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee23(passphrase) {
        var args, workersResult;
        return regeneratorRuntime.wrap(function _callee23$(_context25) {
          while (1) {
            switch (_context25.prev = _context25.next) {
              case 0:
                if (passphrase === undefined) {
                  passphrase = '';
                }

                args = [passphrase];
                _context25.next = 4;
                return Workers.asyncObjectMethod(this, 'toSeed', args);

              case 4:
                workersResult = _context25.sent;
                return _context25.abrupt("return", workersResult.resbuf);

              case 6:
              case "end":
                return _context25.stop();
            }
          }
        }, _callee23, this);
      }));

      function asyncToSeed(_x27) {
        return _asyncToSeed.apply(this, arguments);
      }

      return asyncToSeed;
    }()
  }, {
    key: "entropy2Mnemonic",
    value: function entropy2Mnemonic(buf) {
      if (!Buffer.isBuffer(buf) || buf.length < 128 / 8) {
        throw new Error('Entropy is less than 128 bits. It must be 128 bits or more.');
      }

      var hash = Hash.sha256(buf);
      var bin = '';
      var bits = buf.length * 8;

      for (var i = 0; i < buf.length; i++) {
        bin = bin + ('00000000' + buf[i].toString(2)).slice(-8);
      }

      var hashbits = hash[0].toString(2);
      hashbits = ('00000000' + hashbits).slice(-8).slice(0, bits / 32);
      bin = bin + hashbits;

      if (bin.length % 11 !== 0) {
        throw new Error('internal error - entropy not an even multiple of 11 bits - ' + bin.length);
      }

      var mnemonic = '';

      for (var _i3 = 0; _i3 < bin.length / 11; _i3++) {
        if (mnemonic !== '') {
          mnemonic = mnemonic + this.Wordlist.space;
        }

        var wi = parseInt(bin.slice(_i3 * 11, (_i3 + 1) * 11), 2);
        mnemonic = mnemonic + this.Wordlist[wi];
      }

      this.mnemonic = mnemonic;
      return this;
    }
  }, {
    key: "check",
    value: function check() {
      var mnemonic = this.mnemonic;
      var words = mnemonic.split(this.Wordlist.space);
      var bin = '';

      for (var i = 0; i < words.length; i++) {
        var ind = this.Wordlist.indexOf(words[i]);

        if (ind < 0) {
          return false;
        }

        bin = bin + ('00000000000' + ind.toString(2)).slice(-11);
      }

      if (bin.length % 11 !== 0) {
        throw new Error('internal error - entropy not an even multiple of 11 bits - ' + bin.length);
      }

      var cs = bin.length / 33;
      var hashBits = bin.slice(-cs);
      var nonhashBits = bin.slice(0, bin.length - cs);
      var buf = Buffer.alloc(nonhashBits.length / 8);

      for (var _i4 = 0; _i4 < nonhashBits.length / 8; _i4++) {
        buf.writeUInt8(parseInt(bin.slice(_i4 * 8, (_i4 + 1) * 8), 2), _i4);
      }

      var hash = Hash.sha256(buf);
      var expectedHashBits = hash[0].toString(2);
      expectedHashBits = ('00000000' + expectedHashBits).slice(-8).slice(0, cs);
      return expectedHashBits === hashBits;
    }
  }, {
    key: "mnemonic2Seed",
    value: function mnemonic2Seed() {
      var passphrase = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
      var mnemonic = this.mnemonic;

      if (!this.check()) {
        throw new Error('Mnemonic does not pass the check - was the mnemonic typed incorrectly? Are there extra spaces?');
      }

      if (typeof passphrase !== 'string') {
        throw new Error('passphrase must be a string or undefined');
      }

      mnemonic = mnemonic.normalize('NFKD');
      passphrase = passphrase.normalize('NFKD');
      var mbuf = Buffer.from(mnemonic);
      var pbuf = Buffer.concat([Buffer.from('mnemonic'), Buffer.from(passphrase)]);
      this.seed = _pbkdf2Compat.default.pbkdf2Sync(mbuf, pbuf, 2048, 64, 'sha512');
      return this;
    }
  }, {
    key: "isValid",
    value: function isValid() {
      var passphrase = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
      var isValid;

      try {
        isValid = !!this.mnemonic2Seed(passphrase);
      } catch (err) {
        isValid = false;
      }

      return isValid;
    }
  }], [{
    key: "fromRandom",
    value: function fromRandom(bits) {
      return new this().fromRandom(bits);
    }
  }, {
    key: "asyncFromRandom",
    value: function asyncFromRandom(bits) {
      return new this().asyncFromRandom(bits);
    }
  }, {
    key: "fromEntropy",
    value: function fromEntropy(buf) {
      return new this().fromEntropy(buf);
    }
  }, {
    key: "asyncFromEntropy",
    value: function asyncFromEntropy(buf) {
      return new this().asyncFromEntropy(buf);
    }
  }, {
    key: "isValid",
    value: function isValid(mnemonic) {
      var passphrase = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
      return new Bip39(mnemonic).isValid(passphrase);
    }
  }]);

  return Bip39;
}(Struct);

exports.Bip39 = Bip39;
var wordList$1 = ['あいこくしん', 'あいさつ', 'あいだ', 'あおぞら', 'あかちゃん', 'あきる', 'あけがた', 'あける', 'あこがれる', 'あさい', 'あさひ', 'あしあと', 'あじわう', 'あずかる', 'あずき', 'あそぶ', 'あたえる', 'あたためる', 'あたりまえ', 'あたる', 'あつい', 'あつかう', 'あっしゅく', 'あつまり', 'あつめる', 'あてな', 'あてはまる', 'あひる', 'あぶら', 'あぶる', 'あふれる', 'あまい', 'あまど', 'あまやかす', 'あまり', 'あみもの', 'あめりか', 'あやまる', 'あゆむ', 'あらいぐま', 'あらし', 'あらすじ', 'あらためる', 'あらゆる', 'あらわす', 'ありがとう', 'あわせる', 'あわてる', 'あんい', 'あんがい', 'あんこ', 'あんぜん', 'あんてい', 'あんない', 'あんまり', 'いいだす', 'いおん', 'いがい', 'いがく', 'いきおい', 'いきなり', 'いきもの', 'いきる', 'いくじ', 'いくぶん', 'いけばな', 'いけん', 'いこう', 'いこく', 'いこつ', 'いさましい', 'いさん', 'いしき', 'いじゅう', 'いじょう', 'いじわる', 'いずみ', 'いずれ', 'いせい', 'いせえび', 'いせかい', 'いせき', 'いぜん', 'いそうろう', 'いそがしい', 'いだい', 'いだく', 'いたずら', 'いたみ', 'いたりあ', 'いちおう', 'いちじ', 'いちど', 'いちば', 'いちぶ', 'いちりゅう', 'いつか', 'いっしゅん', 'いっせい', 'いっそう', 'いったん', 'いっち', 'いってい', 'いっぽう', 'いてざ', 'いてん', 'いどう', 'いとこ', 'いない', 'いなか', 'いねむり', 'いのち', 'いのる', 'いはつ', 'いばる', 'いはん', 'いびき', 'いひん', 'いふく', 'いへん', 'いほう', 'いみん', 'いもうと', 'いもたれ', 'いもり', 'いやがる', 'いやす', 'いよかん', 'いよく', 'いらい', 'いらすと', 'いりぐち', 'いりょう', 'いれい', 'いれもの', 'いれる', 'いろえんぴつ', 'いわい', 'いわう', 'いわかん', 'いわば', 'いわゆる', 'いんげんまめ', 'いんさつ', 'いんしょう', 'いんよう', 'うえき', 'うえる', 'うおざ', 'うがい', 'うかぶ', 'うかべる', 'うきわ', 'うくらいな', 'うくれれ', 'うけたまわる', 'うけつけ', 'うけとる', 'うけもつ', 'うける', 'うごかす', 'うごく', 'うこん', 'うさぎ', 'うしなう', 'うしろがみ', 'うすい', 'うすぎ', 'うすぐらい', 'うすめる', 'うせつ', 'うちあわせ', 'うちがわ', 'うちき', 'うちゅう', 'うっかり', 'うつくしい', 'うったえる', 'うつる', 'うどん', 'うなぎ', 'うなじ', 'うなずく', 'うなる', 'うねる', 'うのう', 'うぶげ', 'うぶごえ', 'うまれる', 'うめる', 'うもう', 'うやまう', 'うよく', 'うらがえす', 'うらぐち', 'うらない', 'うりあげ', 'うりきれ', 'うるさい', 'うれしい', 'うれゆき', 'うれる', 'うろこ', 'うわき', 'うわさ', 'うんこう', 'うんちん', 'うんてん', 'うんどう', 'えいえん', 'えいが', 'えいきょう', 'えいご', 'えいせい', 'えいぶん', 'えいよう', 'えいわ', 'えおり', 'えがお', 'えがく', 'えきたい', 'えくせる', 'えしゃく', 'えすて', 'えつらん', 'えのぐ', 'えほうまき', 'えほん', 'えまき', 'えもじ', 'えもの', 'えらい', 'えらぶ', 'えりあ', 'えんえん', 'えんかい', 'えんぎ', 'えんげき', 'えんしゅう', 'えんぜつ', 'えんそく', 'えんちょう', 'えんとつ', 'おいかける', 'おいこす', 'おいしい', 'おいつく', 'おうえん', 'おうさま', 'おうじ', 'おうせつ', 'おうたい', 'おうふく', 'おうべい', 'おうよう', 'おえる', 'おおい', 'おおう', 'おおどおり', 'おおや', 'おおよそ', 'おかえり', 'おかず', 'おがむ', 'おかわり', 'おぎなう', 'おきる', 'おくさま', 'おくじょう', 'おくりがな', 'おくる', 'おくれる', 'おこす', 'おこなう', 'おこる', 'おさえる', 'おさない', 'おさめる', 'おしいれ', 'おしえる', 'おじぎ', 'おじさん', 'おしゃれ', 'おそらく', 'おそわる', 'おたがい', 'おたく', 'おだやか', 'おちつく', 'おっと', 'おつり', 'おでかけ', 'おとしもの', 'おとなしい', 'おどり', 'おどろかす', 'おばさん', 'おまいり', 'おめでとう', 'おもいで', 'おもう', 'おもたい', 'おもちゃ', 'おやつ', 'おやゆび', 'およぼす', 'おらんだ', 'おろす', 'おんがく', 'おんけい', 'おんしゃ', 'おんせん', 'おんだん', 'おんちゅう', 'おんどけい', 'かあつ', 'かいが', 'がいき', 'がいけん', 'がいこう', 'かいさつ', 'かいしゃ', 'かいすいよく', 'かいぜん', 'かいぞうど', 'かいつう', 'かいてん', 'かいとう', 'かいふく', 'がいへき', 'かいほう', 'かいよう', 'がいらい', 'かいわ', 'かえる', 'かおり', 'かかえる', 'かがく', 'かがし', 'かがみ', 'かくご', 'かくとく', 'かざる', 'がぞう', 'かたい', 'かたち', 'がちょう', 'がっきゅう', 'がっこう', 'がっさん', 'がっしょう', 'かなざわし', 'かのう', 'がはく', 'かぶか', 'かほう', 'かほご', 'かまう', 'かまぼこ', 'かめれおん', 'かゆい', 'かようび', 'からい', 'かるい', 'かろう', 'かわく', 'かわら', 'がんか', 'かんけい', 'かんこう', 'かんしゃ', 'かんそう', 'かんたん', 'かんち', 'がんばる', 'きあい', 'きあつ', 'きいろ', 'ぎいん', 'きうい', 'きうん', 'きえる', 'きおう', 'きおく', 'きおち', 'きおん', 'きかい', 'きかく', 'きかんしゃ', 'ききて', 'きくばり', 'きくらげ', 'きけんせい', 'きこう', 'きこえる', 'きこく', 'きさい', 'きさく', 'きさま', 'きさらぎ', 'ぎじかがく', 'ぎしき', 'ぎじたいけん', 'ぎじにってい', 'ぎじゅつしゃ', 'きすう', 'きせい', 'きせき', 'きせつ', 'きそう', 'きぞく', 'きぞん', 'きたえる', 'きちょう', 'きつえん', 'ぎっちり', 'きつつき', 'きつね', 'きてい', 'きどう', 'きどく', 'きない', 'きなが', 'きなこ', 'きぬごし', 'きねん', 'きのう', 'きのした', 'きはく', 'きびしい', 'きひん', 'きふく', 'きぶん', 'きぼう', 'きほん', 'きまる', 'きみつ', 'きむずかしい', 'きめる', 'きもだめし', 'きもち', 'きもの', 'きゃく', 'きやく', 'ぎゅうにく', 'きよう', 'きょうりゅう', 'きらい', 'きらく', 'きりん', 'きれい', 'きれつ', 'きろく', 'ぎろん', 'きわめる', 'ぎんいろ', 'きんかくじ', 'きんじょ', 'きんようび', 'ぐあい', 'くいず', 'くうかん', 'くうき', 'くうぐん', 'くうこう', 'ぐうせい', 'くうそう', 'ぐうたら', 'くうふく', 'くうぼ', 'くかん', 'くきょう', 'くげん', 'ぐこう', 'くさい', 'くさき', 'くさばな', 'くさる', 'くしゃみ', 'くしょう', 'くすのき', 'くすりゆび', 'くせげ', 'くせん', 'ぐたいてき', 'くださる', 'くたびれる', 'くちこみ', 'くちさき', 'くつした', 'ぐっすり', 'くつろぐ', 'くとうてん', 'くどく', 'くなん', 'くねくね', 'くのう', 'くふう', 'くみあわせ', 'くみたてる', 'くめる', 'くやくしょ', 'くらす', 'くらべる', 'くるま', 'くれる', 'くろう', 'くわしい', 'ぐんかん', 'ぐんしょく', 'ぐんたい', 'ぐんて', 'けあな', 'けいかく', 'けいけん', 'けいこ', 'けいさつ', 'げいじゅつ', 'けいたい', 'げいのうじん', 'けいれき', 'けいろ', 'けおとす', 'けおりもの', 'げきか', 'げきげん', 'げきだん', 'げきちん', 'げきとつ', 'げきは', 'げきやく', 'げこう', 'げこくじょう', 'げざい', 'けさき', 'げざん', 'けしき', 'けしごむ', 'けしょう', 'げすと', 'けたば', 'けちゃっぷ', 'けちらす', 'けつあつ', 'けつい', 'けつえき', 'けっこん', 'けつじょ', 'けっせき', 'けってい', 'けつまつ', 'げつようび', 'げつれい', 'けつろん', 'げどく', 'けとばす', 'けとる', 'けなげ', 'けなす', 'けなみ', 'けぬき', 'げねつ', 'けねん', 'けはい', 'げひん', 'けぶかい', 'げぼく', 'けまり', 'けみかる', 'けむし', 'けむり', 'けもの', 'けらい', 'けろけろ', 'けわしい', 'けんい', 'けんえつ', 'けんお', 'けんか', 'げんき', 'けんげん', 'けんこう', 'けんさく', 'けんしゅう', 'けんすう', 'げんそう', 'けんちく', 'けんてい', 'けんとう', 'けんない', 'けんにん', 'げんぶつ', 'けんま', 'けんみん', 'けんめい', 'けんらん', 'けんり', 'こあくま', 'こいぬ', 'こいびと', 'ごうい', 'こうえん', 'こうおん', 'こうかん', 'ごうきゅう', 'ごうけい', 'こうこう', 'こうさい', 'こうじ', 'こうすい', 'ごうせい', 'こうそく', 'こうたい', 'こうちゃ', 'こうつう', 'こうてい', 'こうどう', 'こうない', 'こうはい', 'ごうほう', 'ごうまん', 'こうもく', 'こうりつ', 'こえる', 'こおり', 'ごかい', 'ごがつ', 'ごかん', 'こくご', 'こくさい', 'こくとう', 'こくない', 'こくはく', 'こぐま', 'こけい', 'こける', 'ここのか', 'こころ', 'こさめ', 'こしつ', 'こすう', 'こせい', 'こせき', 'こぜん', 'こそだて', 'こたい', 'こたえる', 'こたつ', 'こちょう', 'こっか', 'こつこつ', 'こつばん', 'こつぶ', 'こてい', 'こてん', 'ことがら', 'ことし', 'ことば', 'ことり', 'こなごな', 'こねこね', 'このまま', 'このみ', 'このよ', 'ごはん', 'こひつじ', 'こふう', 'こふん', 'こぼれる', 'ごまあぶら', 'こまかい', 'ごますり', 'こまつな', 'こまる', 'こむぎこ', 'こもじ', 'こもち', 'こもの', 'こもん', 'こやく', 'こやま', 'こゆう', 'こゆび', 'こよい', 'こよう', 'こりる', 'これくしょん', 'ころっけ', 'こわもて', 'こわれる', 'こんいん', 'こんかい', 'こんき', 'こんしゅう', 'こんすい', 'こんだて', 'こんとん', 'こんなん', 'こんびに', 'こんぽん', 'こんまけ', 'こんや', 'こんれい', 'こんわく', 'ざいえき', 'さいかい', 'さいきん', 'ざいげん', 'ざいこ', 'さいしょ', 'さいせい', 'ざいたく', 'ざいちゅう', 'さいてき', 'ざいりょう', 'さうな', 'さかいし', 'さがす', 'さかな', 'さかみち', 'さがる', 'さぎょう', 'さくし', 'さくひん', 'さくら', 'さこく', 'さこつ', 'さずかる', 'ざせき', 'さたん', 'さつえい', 'ざつおん', 'ざっか', 'ざつがく', 'さっきょく', 'ざっし', 'さつじん', 'ざっそう', 'さつたば', 'さつまいも', 'さてい', 'さといも', 'さとう', 'さとおや', 'さとし', 'さとる', 'さのう', 'さばく', 'さびしい', 'さべつ', 'さほう', 'さほど', 'さます', 'さみしい', 'さみだれ', 'さむけ', 'さめる', 'さやえんどう', 'さゆう', 'さよう', 'さよく', 'さらだ', 'ざるそば', 'さわやか', 'さわる', 'さんいん', 'さんか', 'さんきゃく', 'さんこう', 'さんさい', 'ざんしょ', 'さんすう', 'さんせい', 'さんそ', 'さんち', 'さんま', 'さんみ', 'さんらん', 'しあい', 'しあげ', 'しあさって', 'しあわせ', 'しいく', 'しいん', 'しうち', 'しえい', 'しおけ', 'しかい', 'しかく', 'じかん', 'しごと', 'しすう', 'じだい', 'したうけ', 'したぎ', 'したて', 'したみ', 'しちょう', 'しちりん', 'しっかり', 'しつじ', 'しつもん', 'してい', 'してき', 'してつ', 'じてん', 'じどう', 'しなぎれ', 'しなもの', 'しなん', 'しねま', 'しねん', 'しのぐ', 'しのぶ', 'しはい', 'しばかり', 'しはつ', 'しはらい', 'しはん', 'しひょう', 'しふく', 'じぶん', 'しへい', 'しほう', 'しほん', 'しまう', 'しまる', 'しみん', 'しむける', 'じむしょ', 'しめい', 'しめる', 'しもん', 'しゃいん', 'しゃうん', 'しゃおん', 'じゃがいも', 'しやくしょ', 'しゃくほう', 'しゃけん', 'しゃこ', 'しゃざい', 'しゃしん', 'しゃせん', 'しゃそう', 'しゃたい', 'しゃちょう', 'しゃっきん', 'じゃま', 'しゃりん', 'しゃれい', 'じゆう', 'じゅうしょ', 'しゅくはく', 'じゅしん', 'しゅっせき', 'しゅみ', 'しゅらば', 'じゅんばん', 'しょうかい', 'しょくたく', 'しょっけん', 'しょどう', 'しょもつ', 'しらせる', 'しらべる', 'しんか', 'しんこう', 'じんじゃ', 'しんせいじ', 'しんちく', 'しんりん', 'すあげ', 'すあし', 'すあな', 'ずあん', 'すいえい', 'すいか', 'すいとう', 'ずいぶん', 'すいようび', 'すうがく', 'すうじつ', 'すうせん', 'すおどり', 'すきま', 'すくう', 'すくない', 'すける', 'すごい', 'すこし', 'ずさん', 'すずしい', 'すすむ', 'すすめる', 'すっかり', 'ずっしり', 'ずっと', 'すてき', 'すてる', 'すねる', 'すのこ', 'すはだ', 'すばらしい', 'ずひょう', 'ずぶぬれ', 'すぶり', 'すふれ', 'すべて', 'すべる', 'ずほう', 'すぼん', 'すまい', 'すめし', 'すもう', 'すやき', 'すらすら', 'するめ', 'すれちがう', 'すろっと', 'すわる', 'すんぜん', 'すんぽう', 'せあぶら', 'せいかつ', 'せいげん', 'せいじ', 'せいよう', 'せおう', 'せかいかん', 'せきにん', 'せきむ', 'せきゆ', 'せきらんうん', 'せけん', 'せこう', 'せすじ', 'せたい', 'せたけ', 'せっかく', 'せっきゃく', 'ぜっく', 'せっけん', 'せっこつ', 'せっさたくま', 'せつぞく', 'せつだん', 'せつでん', 'せっぱん', 'せつび', 'せつぶん', 'せつめい', 'せつりつ', 'せなか', 'せのび', 'せはば', 'せびろ', 'せぼね', 'せまい', 'せまる', 'せめる', 'せもたれ', 'せりふ', 'ぜんあく', 'せんい', 'せんえい', 'せんか', 'せんきょ', 'せんく', 'せんげん', 'ぜんご', 'せんさい', 'せんしゅ', 'せんすい', 'せんせい', 'せんぞ', 'せんたく', 'せんちょう', 'せんてい', 'せんとう', 'せんぬき', 'せんねん', 'せんぱい', 'ぜんぶ', 'ぜんぽう', 'せんむ', 'せんめんじょ', 'せんもん', 'せんやく', 'せんゆう', 'せんよう', 'ぜんら', 'ぜんりゃく', 'せんれい', 'せんろ', 'そあく', 'そいとげる', 'そいね', 'そうがんきょう', 'そうき', 'そうご', 'そうしん', 'そうだん', 'そうなん', 'そうび', 'そうめん', 'そうり', 'そえもの', 'そえん', 'そがい', 'そげき', 'そこう', 'そこそこ', 'そざい', 'そしな', 'そせい', 'そせん', 'そそぐ', 'そだてる', 'そつう', 'そつえん', 'そっかん', 'そつぎょう', 'そっけつ', 'そっこう', 'そっせん', 'そっと', 'そとがわ', 'そとづら', 'そなえる', 'そなた', 'そふぼ', 'そぼく', 'そぼろ', 'そまつ', 'そまる', 'そむく', 'そむりえ', 'そめる', 'そもそも', 'そよかぜ', 'そらまめ', 'そろう', 'そんかい', 'そんけい', 'そんざい', 'そんしつ', 'そんぞく', 'そんちょう', 'ぞんび', 'ぞんぶん', 'そんみん', 'たあい', 'たいいん', 'たいうん', 'たいえき', 'たいおう', 'だいがく', 'たいき', 'たいぐう', 'たいけん', 'たいこ', 'たいざい', 'だいじょうぶ', 'だいすき', 'たいせつ', 'たいそう', 'だいたい', 'たいちょう', 'たいてい', 'だいどころ', 'たいない', 'たいねつ', 'たいのう', 'たいはん', 'だいひょう', 'たいふう', 'たいへん', 'たいほ', 'たいまつばな', 'たいみんぐ', 'たいむ', 'たいめん', 'たいやき', 'たいよう', 'たいら', 'たいりょく', 'たいる', 'たいわん', 'たうえ', 'たえる', 'たおす', 'たおる', 'たおれる', 'たかい', 'たかね', 'たきび', 'たくさん', 'たこく', 'たこやき', 'たさい', 'たしざん', 'だじゃれ', 'たすける', 'たずさわる', 'たそがれ', 'たたかう', 'たたく', 'ただしい', 'たたみ', 'たちばな', 'だっかい', 'だっきゃく', 'だっこ', 'だっしゅつ', 'だったい', 'たてる', 'たとえる', 'たなばた', 'たにん', 'たぬき', 'たのしみ', 'たはつ', 'たぶん', 'たべる', 'たぼう', 'たまご', 'たまる', 'だむる', 'ためいき', 'ためす', 'ためる', 'たもつ', 'たやすい', 'たよる', 'たらす', 'たりきほんがん', 'たりょう', 'たりる', 'たると', 'たれる', 'たれんと', 'たろっと', 'たわむれる', 'だんあつ', 'たんい', 'たんおん', 'たんか', 'たんき', 'たんけん', 'たんご', 'たんさん', 'たんじょうび', 'だんせい', 'たんそく', 'たんたい', 'だんち', 'たんてい', 'たんとう', 'だんな', 'たんにん', 'だんねつ', 'たんのう', 'たんぴん', 'だんぼう', 'たんまつ', 'たんめい', 'だんれつ', 'だんろ', 'だんわ', 'ちあい', 'ちあん', 'ちいき', 'ちいさい', 'ちえん', 'ちかい', 'ちから', 'ちきゅう', 'ちきん', 'ちけいず', 'ちけん', 'ちこく', 'ちさい', 'ちしき', 'ちしりょう', 'ちせい', 'ちそう', 'ちたい', 'ちたん', 'ちちおや', 'ちつじょ', 'ちてき', 'ちてん', 'ちぬき', 'ちぬり', 'ちのう', 'ちひょう', 'ちへいせん', 'ちほう', 'ちまた', 'ちみつ', 'ちみどろ', 'ちめいど', 'ちゃんこなべ', 'ちゅうい', 'ちゆりょく', 'ちょうし', 'ちょさくけん', 'ちらし', 'ちらみ', 'ちりがみ', 'ちりょう', 'ちるど', 'ちわわ', 'ちんたい', 'ちんもく', 'ついか', 'ついたち', 'つうか', 'つうじょう', 'つうはん', 'つうわ', 'つかう', 'つかれる', 'つくね', 'つくる', 'つけね', 'つける', 'つごう', 'つたえる', 'つづく', 'つつじ', 'つつむ', 'つとめる', 'つながる', 'つなみ', 'つねづね', 'つのる', 'つぶす', 'つまらない', 'つまる', 'つみき', 'つめたい', 'つもり', 'つもる', 'つよい', 'つるぼ', 'つるみく', 'つわもの', 'つわり', 'てあし', 'てあて', 'てあみ', 'ていおん', 'ていか', 'ていき', 'ていけい', 'ていこく', 'ていさつ', 'ていし', 'ていせい', 'ていたい', 'ていど', 'ていねい', 'ていひょう', 'ていへん', 'ていぼう', 'てうち', 'ておくれ', 'てきとう', 'てくび', 'でこぼこ', 'てさぎょう', 'てさげ', 'てすり', 'てそう', 'てちがい', 'てちょう', 'てつがく', 'てつづき', 'でっぱ', 'てつぼう', 'てつや', 'でぬかえ', 'てぬき', 'てぬぐい', 'てのひら', 'てはい', 'てぶくろ', 'てふだ', 'てほどき', 'てほん', 'てまえ', 'てまきずし', 'てみじか', 'てみやげ', 'てらす', 'てれび', 'てわけ', 'てわたし', 'でんあつ', 'てんいん', 'てんかい', 'てんき', 'てんぐ', 'てんけん', 'てんごく', 'てんさい', 'てんし', 'てんすう', 'でんち', 'てんてき', 'てんとう', 'てんない', 'てんぷら', 'てんぼうだい', 'てんめつ', 'てんらんかい', 'でんりょく', 'でんわ', 'どあい', 'といれ', 'どうかん', 'とうきゅう', 'どうぐ', 'とうし', 'とうむぎ', 'とおい', 'とおか', 'とおく', 'とおす', 'とおる', 'とかい', 'とかす', 'ときおり', 'ときどき', 'とくい', 'とくしゅう', 'とくてん', 'とくに', 'とくべつ', 'とけい', 'とける', 'とこや', 'とさか', 'としょかん', 'とそう', 'とたん', 'とちゅう', 'とっきゅう', 'とっくん', 'とつぜん', 'とつにゅう', 'とどける', 'ととのえる', 'とない', 'となえる', 'となり', 'とのさま', 'とばす', 'どぶがわ', 'とほう', 'とまる', 'とめる', 'ともだち', 'ともる', 'どようび', 'とらえる', 'とんかつ', 'どんぶり', 'ないかく', 'ないこう', 'ないしょ', 'ないす', 'ないせん', 'ないそう', 'なおす', 'ながい', 'なくす', 'なげる', 'なこうど', 'なさけ', 'なたでここ', 'なっとう', 'なつやすみ', 'ななおし', 'なにごと', 'なにもの', 'なにわ', 'なのか', 'なふだ', 'なまいき', 'なまえ', 'なまみ', 'なみだ', 'なめらか', 'なめる', 'なやむ', 'ならう', 'ならび', 'ならぶ', 'なれる', 'なわとび', 'なわばり', 'にあう', 'にいがた', 'にうけ', 'におい', 'にかい', 'にがて', 'にきび', 'にくしみ', 'にくまん', 'にげる', 'にさんかたんそ', 'にしき', 'にせもの', 'にちじょう', 'にちようび', 'にっか', 'にっき', 'にっけい', 'にっこう', 'にっさん', 'にっしょく', 'にっすう', 'にっせき', 'にってい', 'になう', 'にほん', 'にまめ', 'にもつ', 'にやり', 'にゅういん', 'にりんしゃ', 'にわとり', 'にんい', 'にんか', 'にんき', 'にんげん', 'にんしき', 'にんずう', 'にんそう', 'にんたい', 'にんち', 'にんてい', 'にんにく', 'にんぷ', 'にんまり', 'にんむ', 'にんめい', 'にんよう', 'ぬいくぎ', 'ぬかす', 'ぬぐいとる', 'ぬぐう', 'ぬくもり', 'ぬすむ', 'ぬまえび', 'ぬめり', 'ぬらす', 'ぬんちゃく', 'ねあげ', 'ねいき', 'ねいる', 'ねいろ', 'ねぐせ', 'ねくたい', 'ねくら', 'ねこぜ', 'ねこむ', 'ねさげ', 'ねすごす', 'ねそべる', 'ねだん', 'ねつい', 'ねっしん', 'ねつぞう', 'ねったいぎょ', 'ねぶそく', 'ねふだ', 'ねぼう', 'ねほりはほり', 'ねまき', 'ねまわし', 'ねみみ', 'ねむい', 'ねむたい', 'ねもと', 'ねらう', 'ねわざ', 'ねんいり', 'ねんおし', 'ねんかん', 'ねんきん', 'ねんぐ', 'ねんざ', 'ねんし', 'ねんちゃく', 'ねんど', 'ねんぴ', 'ねんぶつ', 'ねんまつ', 'ねんりょう', 'ねんれい', 'のいず', 'のおづま', 'のがす', 'のきなみ', 'のこぎり', 'のこす', 'のこる', 'のせる', 'のぞく', 'のぞむ', 'のたまう', 'のちほど', 'のっく', 'のばす', 'のはら', 'のべる', 'のぼる', 'のみもの', 'のやま', 'のらいぬ', 'のらねこ', 'のりもの', 'のりゆき', 'のれん', 'のんき', 'ばあい', 'はあく', 'ばあさん', 'ばいか', 'ばいく', 'はいけん', 'はいご', 'はいしん', 'はいすい', 'はいせん', 'はいそう', 'はいち', 'ばいばい', 'はいれつ', 'はえる', 'はおる', 'はかい', 'ばかり', 'はかる', 'はくしゅ', 'はけん', 'はこぶ', 'はさみ', 'はさん', 'はしご', 'ばしょ', 'はしる', 'はせる', 'ぱそこん', 'はそん', 'はたん', 'はちみつ', 'はつおん', 'はっかく', 'はづき', 'はっきり', 'はっくつ', 'はっけん', 'はっこう', 'はっさん', 'はっしん', 'はったつ', 'はっちゅう', 'はってん', 'はっぴょう', 'はっぽう', 'はなす', 'はなび', 'はにかむ', 'はぶらし', 'はみがき', 'はむかう', 'はめつ', 'はやい', 'はやし', 'はらう', 'はろうぃん', 'はわい', 'はんい', 'はんえい', 'はんおん', 'はんかく', 'はんきょう', 'ばんぐみ', 'はんこ', 'はんしゃ', 'はんすう', 'はんだん', 'ぱんち', 'ぱんつ', 'はんてい', 'はんとし', 'はんのう', 'はんぱ', 'はんぶん', 'はんぺん', 'はんぼうき', 'はんめい', 'はんらん', 'はんろん', 'ひいき', 'ひうん', 'ひえる', 'ひかく', 'ひかり', 'ひかる', 'ひかん', 'ひくい', 'ひけつ', 'ひこうき', 'ひこく', 'ひさい', 'ひさしぶり', 'ひさん', 'びじゅつかん', 'ひしょ', 'ひそか', 'ひそむ', 'ひたむき', 'ひだり', 'ひたる', 'ひつぎ', 'ひっこし', 'ひっし', 'ひつじゅひん', 'ひっす', 'ひつぜん', 'ぴったり', 'ぴっちり', 'ひつよう', 'ひてい', 'ひとごみ', 'ひなまつり', 'ひなん', 'ひねる', 'ひはん', 'ひびく', 'ひひょう', 'ひほう', 'ひまわり', 'ひまん', 'ひみつ', 'ひめい', 'ひめじし', 'ひやけ', 'ひやす', 'ひよう', 'びょうき', 'ひらがな', 'ひらく', 'ひりつ', 'ひりょう', 'ひるま', 'ひるやすみ', 'ひれい', 'ひろい', 'ひろう', 'ひろき', 'ひろゆき', 'ひんかく', 'ひんけつ', 'ひんこん', 'ひんしゅ', 'ひんそう', 'ぴんち', 'ひんぱん', 'びんぼう', 'ふあん', 'ふいうち', 'ふうけい', 'ふうせん', 'ぷうたろう', 'ふうとう', 'ふうふ', 'ふえる', 'ふおん', 'ふかい', 'ふきん', 'ふくざつ', 'ふくぶくろ', 'ふこう', 'ふさい', 'ふしぎ', 'ふじみ', 'ふすま', 'ふせい', 'ふせぐ', 'ふそく', 'ぶたにく', 'ふたん', 'ふちょう', 'ふつう', 'ふつか', 'ふっかつ', 'ふっき', 'ふっこく', 'ぶどう', 'ふとる', 'ふとん', 'ふのう', 'ふはい', 'ふひょう', 'ふへん', 'ふまん', 'ふみん', 'ふめつ', 'ふめん', 'ふよう', 'ふりこ', 'ふりる', 'ふるい', 'ふんいき', 'ぶんがく', 'ぶんぐ', 'ふんしつ', 'ぶんせき', 'ふんそう', 'ぶんぽう', 'へいあん', 'へいおん', 'へいがい', 'へいき', 'へいげん', 'へいこう', 'へいさ', 'へいしゃ', 'へいせつ', 'へいそ', 'へいたく', 'へいてん', 'へいねつ', 'へいわ', 'へきが', 'へこむ', 'べにいろ', 'べにしょうが', 'へらす', 'へんかん', 'べんきょう', 'べんごし', 'へんさい', 'へんたい', 'べんり', 'ほあん', 'ほいく', 'ぼうぎょ', 'ほうこく', 'ほうそう', 'ほうほう', 'ほうもん', 'ほうりつ', 'ほえる', 'ほおん', 'ほかん', 'ほきょう', 'ぼきん', 'ほくろ', 'ほけつ', 'ほけん', 'ほこう', 'ほこる', 'ほしい', 'ほしつ', 'ほしゅ', 'ほしょう', 'ほせい', 'ほそい', 'ほそく', 'ほたて', 'ほたる', 'ぽちぶくろ', 'ほっきょく', 'ほっさ', 'ほったん', 'ほとんど', 'ほめる', 'ほんい', 'ほんき', 'ほんけ', 'ほんしつ', 'ほんやく', 'まいにち', 'まかい', 'まかせる', 'まがる', 'まける', 'まこと', 'まさつ', 'まじめ', 'ますく', 'まぜる', 'まつり', 'まとめ', 'まなぶ', 'まぬけ', 'まねく', 'まほう', 'まもる', 'まゆげ', 'まよう', 'まろやか', 'まわす', 'まわり', 'まわる', 'まんが', 'まんきつ', 'まんぞく', 'まんなか', 'みいら', 'みうち', 'みえる', 'みがく', 'みかた', 'みかん', 'みけん', 'みこん', 'みじかい', 'みすい', 'みすえる', 'みせる', 'みっか', 'みつかる', 'みつける', 'みてい', 'みとめる', 'みなと', 'みなみかさい', 'みねらる', 'みのう', 'みのがす', 'みほん', 'みもと', 'みやげ', 'みらい', 'みりょく', 'みわく', 'みんか', 'みんぞく', 'むいか', 'むえき', 'むえん', 'むかい', 'むかう', 'むかえ', 'むかし', 'むぎちゃ', 'むける', 'むげん', 'むさぼる', 'むしあつい', 'むしば', 'むじゅん', 'むしろ', 'むすう', 'むすこ', 'むすぶ', 'むすめ', 'むせる', 'むせん', 'むちゅう', 'むなしい', 'むのう', 'むやみ', 'むよう', 'むらさき', 'むりょう', 'むろん', 'めいあん', 'めいうん', 'めいえん', 'めいかく', 'めいきょく', 'めいさい', 'めいし', 'めいそう', 'めいぶつ', 'めいれい', 'めいわく', 'めぐまれる', 'めざす', 'めした', 'めずらしい', 'めだつ', 'めまい', 'めやす', 'めんきょ', 'めんせき', 'めんどう', 'もうしあげる', 'もうどうけん', 'もえる', 'もくし', 'もくてき', 'もくようび', 'もちろん', 'もどる', 'もらう', 'もんく', 'もんだい', 'やおや', 'やける', 'やさい', 'やさしい', 'やすい', 'やすたろう', 'やすみ', 'やせる', 'やそう', 'やたい', 'やちん', 'やっと', 'やっぱり', 'やぶる', 'やめる', 'ややこしい', 'やよい', 'やわらかい', 'ゆうき', 'ゆうびんきょく', 'ゆうべ', 'ゆうめい', 'ゆけつ', 'ゆしゅつ', 'ゆせん', 'ゆそう', 'ゆたか', 'ゆちゃく', 'ゆでる', 'ゆにゅう', 'ゆびわ', 'ゆらい', 'ゆれる', 'ようい', 'ようか', 'ようきゅう', 'ようじ', 'ようす', 'ようちえん', 'よかぜ', 'よかん', 'よきん', 'よくせい', 'よくぼう', 'よけい', 'よごれる', 'よさん', 'よしゅう', 'よそう', 'よそく', 'よっか', 'よてい', 'よどがわく', 'よねつ', 'よやく', 'よゆう', 'よろこぶ', 'よろしい', 'らいう', 'らくがき', 'らくご', 'らくさつ', 'らくだ', 'らしんばん', 'らせん', 'らぞく', 'らたい', 'らっか', 'られつ', 'りえき', 'りかい', 'りきさく', 'りきせつ', 'りくぐん', 'りくつ', 'りけん', 'りこう', 'りせい', 'りそう', 'りそく', 'りてん', 'りねん', 'りゆう', 'りゅうがく', 'りよう', 'りょうり', 'りょかん', 'りょくちゃ', 'りょこう', 'りりく', 'りれき', 'りろん', 'りんご', 'るいけい', 'るいさい', 'るいじ', 'るいせき', 'るすばん', 'るりがわら', 'れいかん', 'れいぎ', 'れいせい', 'れいぞうこ', 'れいとう', 'れいぼう', 'れきし', 'れきだい', 'れんあい', 'れんけい', 'れんこん', 'れんさい', 'れんしゅう', 'れんぞく', 'れんらく', 'ろうか', 'ろうご', 'ろうじん', 'ろうそく', 'ろくが', 'ろこつ', 'ろじうら', 'ろしゅつ', 'ろせん', 'ろてん', 'ろめん', 'ろれつ', 'ろんぎ', 'ろんぱ', 'ろんぶん', 'ろんり', 'わかす', 'わかめ', 'わかやま', 'わかれる', 'わしつ', 'わじまし', 'わすれもの', 'わらう', 'われる'];
exports.jp = wordList$1;
wordList$1.space = '　';

var KeyPair = /*#__PURE__*/function (_Struct12) {
  _inherits(KeyPair, _Struct12);

  var _super19 = _createSuper(KeyPair);

  function KeyPair(privKey, pubKey) {
    var _this15;

    var PrivKey$1 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : PrivKey;

    _classCallCheck(this, KeyPair);

    _this15 = _super19.call(this, {
      privKey: privKey,
      pubKey: pubKey
    });
    _this15.PrivKey = PrivKey$1;
    return _this15;
  }

  _createClass(KeyPair, [{
    key: "fromJSON",
    value: function fromJSON(json) {
      if (json.privKey) {
        this.privKey = this.PrivKey.fromJSON(json.privKey);
      }

      if (json.pubKey) {
        this.pubKey = PubKey.fromJSON(json.pubKey);
      }

      return this;
    }
  }, {
    key: "fromBr",
    value: function fromBr(br) {
      var buflen1 = br.readUInt8();

      if (buflen1 > 0) {
        this.privKey = new this.PrivKey().fromFastBuffer(br.read(buflen1));
      }

      var buflen2 = br.readUInt8();

      if (buflen2 > 0) {
        this.pubKey = new PubKey().fromFastBuffer(br.read(buflen2));
      }

      return this;
    }
  }, {
    key: "toBw",
    value: function toBw(bw) {
      if (!bw) {
        bw = new Bw();
      }

      if (this.privKey) {
        var privKeybuf = this.privKey.toFastBuffer();
        bw.writeUInt8(privKeybuf.length);
        bw.write(privKeybuf);
      } else {
        bw.writeUInt8(0);
      }

      if (this.pubKey) {
        var pubKeybuf = this.pubKey.toFastBuffer();
        bw.writeUInt8(pubKeybuf.length);
        bw.write(pubKeybuf);
      } else {
        bw.writeUInt8(0);
      }

      return bw;
    }
  }, {
    key: "fromString",
    value: function fromString(str) {
      return this.fromJSON(JSON.parse(str));
    }
  }, {
    key: "toString",
    value: function toString() {
      return JSON.stringify(this.toJSON());
    }
  }, {
    key: "toPublic",
    value: function toPublic() {
      var keyPair = new KeyPair().fromObject(this);
      keyPair.privKey = undefined;
      return keyPair;
    }
  }, {
    key: "fromPrivKey",
    value: function fromPrivKey(privKey) {
      this.privKey = privKey;
      this.pubKey = new PubKey().fromPrivKey(privKey);
      return this;
    }
  }, {
    key: "asyncFromPrivKey",
    value: function () {
      var _asyncFromPrivKey3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee24(privKey) {
        return regeneratorRuntime.wrap(function _callee24$(_context26) {
          while (1) {
            switch (_context26.prev = _context26.next) {
              case 0:
                this.privKey = privKey;
                _context26.next = 3;
                return new PubKey().asyncFromPrivKey(privKey);

              case 3:
                this.pubKey = _context26.sent;
                return _context26.abrupt("return", this);

              case 5:
              case "end":
                return _context26.stop();
            }
          }
        }, _callee24, this);
      }));

      function asyncFromPrivKey(_x28) {
        return _asyncFromPrivKey3.apply(this, arguments);
      }

      return asyncFromPrivKey;
    }()
  }, {
    key: "fromRandom",
    value: function fromRandom() {
      this.privKey = new this.PrivKey().fromRandom();
      this.pubKey = new PubKey().fromPrivKey(this.privKey);
      return this;
    }
  }, {
    key: "asyncFromRandom",
    value: function () {
      var _asyncFromRandom3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee25() {
        return regeneratorRuntime.wrap(function _callee25$(_context27) {
          while (1) {
            switch (_context27.prev = _context27.next) {
              case 0:
                this.privKey = new this.PrivKey().fromRandom();
                return _context27.abrupt("return", this.asyncFromPrivKey(this.privKey));

              case 2:
              case "end":
                return _context27.stop();
            }
          }
        }, _callee25, this);
      }));

      function asyncFromRandom() {
        return _asyncFromRandom3.apply(this, arguments);
      }

      return asyncFromRandom;
    }()
  }], [{
    key: "fromPrivKey",
    value: function fromPrivKey(privKey) {
      return new this().fromPrivKey(privKey);
    }
  }, {
    key: "asyncFromPrivKey",
    value: function asyncFromPrivKey(privKey) {
      return new this().asyncFromPrivKey(privKey);
    }
  }, {
    key: "fromRandom",
    value: function fromRandom() {
      return new this().fromRandom();
    }
  }, {
    key: "asyncFromRandom",
    value: function asyncFromRandom() {
      return new this().asyncFromRandom();
    }
  }]);

  return KeyPair;
}(Struct);

exports.KeyPair = KeyPair;

KeyPair.Mainnet = /*#__PURE__*/function (_KeyPair) {
  _inherits(_class7, _KeyPair);

  var _super20 = _createSuper(_class7);

  function _class7(privKey, pubKey) {
    _classCallCheck(this, _class7);

    return _super20.call(this, privKey, pubKey, PrivKey.Mainnet);
  }

  return _class7;
}(KeyPair);

KeyPair.Testnet = /*#__PURE__*/function (_KeyPair2) {
  _inherits(_class8, _KeyPair2);

  var _super21 = _createSuper(_class8);

  function _class8(privKey, pubKey) {
    _classCallCheck(this, _class8);

    return _super21.call(this, privKey, pubKey, PrivKey.Testnet);
  }

  return _class8;
}(KeyPair);

var Ecdsa = /*#__PURE__*/function (_Struct13) {
  _inherits(Ecdsa, _Struct13);

  var _super22 = _createSuper(Ecdsa);

  function Ecdsa(sig, keyPair, hashBuf, k, endian, verified) {
    _classCallCheck(this, Ecdsa);

    return _super22.call(this, {
      sig: sig,
      keyPair: keyPair,
      hashBuf: hashBuf,
      k: k,
      endian: endian,
      verified: verified
    });
  }

  _createClass(Ecdsa, [{
    key: "toJSON",
    value: function toJSON() {
      return {
        sig: this.sig ? this.sig.toString() : undefined,
        keyPair: this.keyPair ? this.keyPair.toBuffer().toString('hex') : undefined,
        hashBuf: this.hashBuf ? this.hashBuf.toString('hex') : undefined,
        k: this.k ? this.k.toString() : undefined,
        endian: this.endian,
        verified: this.verified
      };
    }
  }, {
    key: "fromJSON",
    value: function fromJSON(json) {
      this.sig = json.sig ? new Sig().fromString(json.sig) : undefined;
      this.keyPair = json.keyPair ? new KeyPair().fromBuffer(Buffer.from(json.keyPair, 'hex')) : undefined;
      this.hashBuf = json.hashBuf ? Buffer.from(json.hashBuf, 'hex') : undefined;
      this.k = json.k ? new Bn().fromString(json.k) : undefined;
      this.endian = json.endian;
      this.verified = json.verified;
      return this;
    }
  }, {
    key: "toBuffer",
    value: function toBuffer() {
      var str = JSON.stringify(this.toJSON());
      return Buffer.from(str);
    }
  }, {
    key: "fromBuffer",
    value: function fromBuffer(buf) {
      var json = JSON.parse(buf.toString());
      return this.fromJSON(json);
    }
  }, {
    key: "calcrecovery",
    value: function calcrecovery() {
      for (var recovery = 0; recovery < 4; recovery++) {
        var Qprime = void 0;
        this.sig.recovery = recovery;

        try {
          Qprime = this.sig2PubKey();
        } catch (e) {
          continue;
        }

        if (Qprime.point.eq(this.keyPair.pubKey.point)) {
          var compressed = this.keyPair.pubKey.compressed;
          this.sig.compressed = this.keyPair.pubKey.compressed === undefined ? true : compressed;
          return this;
        }
      }

      this.sig.recovery = undefined;
      throw new Error('Unable to find valid recovery factor');
    }
  }, {
    key: "asyncCalcrecovery",
    value: function () {
      var _asyncCalcrecovery = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee26() {
        var workersResult;
        return regeneratorRuntime.wrap(function _callee26$(_context28) {
          while (1) {
            switch (_context28.prev = _context28.next) {
              case 0:
                _context28.next = 2;
                return Workers.asyncObjectMethod(this, 'calcrecovery', []);

              case 2:
                workersResult = _context28.sent;
                return _context28.abrupt("return", this.fromFastBuffer(workersResult.resbuf));

              case 4:
              case "end":
                return _context28.stop();
            }
          }
        }, _callee26, this);
      }));

      function asyncCalcrecovery() {
        return _asyncCalcrecovery.apply(this, arguments);
      }

      return asyncCalcrecovery;
    }()
  }, {
    key: "fromString",
    value: function fromString(str) {
      var obj = JSON.parse(str);

      if (obj.hashBuf) {
        this.hashBuf = Buffer.from(obj.hashBuf, 'hex');
      }

      if (obj.keyPair) {
        this.keyPair = new KeyPair().fromString(obj.keyPair);
      }

      if (obj.sig) {
        this.sig = new Sig().fromString(obj.sig);
      }

      if (obj.k) {
        this.k = new Bn(obj.k, 10);
      }

      return this;
    }
  }, {
    key: "randomK",
    value: function randomK() {
      var N = Point.getN();
      var k;

      do {
        k = new Bn().fromBuffer(Random.getRandomBuffer(32));
      } while (!(k.lt(N) && k.gt(0)));

      this.k = k;
      return this;
    }
  }, {
    key: "deterministicK",
    value: function deterministicK(badrs) {
      var v = Buffer.alloc(32);
      v.fill(0x01);
      var k = Buffer.alloc(32);
      k.fill(0x00);
      var x = this.keyPair.privKey.bn.toBuffer({
        size: 32
      });
      k = Hash.sha256Hmac(Buffer.concat([v, Buffer.from([0x00]), x, this.hashBuf]), k);
      v = Hash.sha256Hmac(v, k);
      k = Hash.sha256Hmac(Buffer.concat([v, Buffer.from([0x01]), x, this.hashBuf]), k);
      v = Hash.sha256Hmac(v, k);
      v = Hash.sha256Hmac(v, k);
      var T = new Bn().fromBuffer(v);
      var N = Point.getN();

      if (badrs === undefined) {
        badrs = 0;
      }

      for (var i = 0; i < badrs || !(T.lt(N) && T.gt(0)); i++) {
        k = Hash.sha256Hmac(Buffer.concat([v, Buffer.from([0x00])]), k);
        v = Hash.sha256Hmac(v, k);
        v = Hash.sha256Hmac(v, k);
        T = new Bn().fromBuffer(v);
      }

      this.k = T;
      return this;
    }
  }, {
    key: "sig2PubKey",
    value: function sig2PubKey() {
      var recovery = this.sig.recovery;

      if (!(recovery === 0 || recovery === 1 || recovery === 2 || recovery === 3)) {
        throw new Error('i must be equal to 0, 1, 2, or 3');
      }

      var e = new Bn().fromBuffer(this.hashBuf);
      var r = this.sig.r;
      var s = this.sig.s;
      var isYOdd = recovery & 1;
      var isSecondKey = recovery >> 1;
      var n = Point.getN();
      var G = Point.getG();
      var x = isSecondKey ? r.add(n) : r;
      var R = Point.fromX(isYOdd, x);
      var errm = '';

      try {
        R.mul(n);
      } catch (err) {
        errm = err.message;
      }

      if (errm !== 'point mul out of range') {
        throw new Error('nR is not a valid curve point');
      }

      var eNeg = e.neg().umod(n);
      var rInv = r.invm(n);
      var Q = R.mul(s).add(G.mul(eNeg)).mul(rInv);
      var pubKey = new PubKey(Q);
      pubKey.compressed = this.sig.compressed;
      pubKey.validate();
      return pubKey;
    }
  }, {
    key: "asyncSig2PubKey",
    value: function () {
      var _asyncSig2PubKey = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee27() {
        var workersResult;
        return regeneratorRuntime.wrap(function _callee27$(_context29) {
          while (1) {
            switch (_context29.prev = _context29.next) {
              case 0:
                _context29.next = 2;
                return Workers.asyncObjectMethod(this, 'sig2PubKey', []);

              case 2:
                workersResult = _context29.sent;
                return _context29.abrupt("return", PubKey.fromFastBuffer(workersResult.resbuf));

              case 4:
              case "end":
                return _context29.stop();
            }
          }
        }, _callee27, this);
      }));

      function asyncSig2PubKey() {
        return _asyncSig2PubKey.apply(this, arguments);
      }

      return asyncSig2PubKey;
    }()
  }, {
    key: "verifyStr",
    value: function verifyStr() {
      var enforceLowS = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

      if (!Buffer.isBuffer(this.hashBuf) || this.hashBuf.length !== 32) {
        return 'hashBuf must be a 32 byte buffer';
      }

      try {
        this.keyPair.pubKey.validate();
      } catch (e) {
        return 'Invalid pubKey: ' + e;
      }

      var r = this.sig.r;
      var s = this.sig.s;

      if (!(r.gt(0) && r.lt(Point.getN())) || !(s.gt(0) && s.lt(Point.getN()))) {
        return 'r and s not in range';
      }

      if (enforceLowS) {
        if (!this.sig.hasLowS()) {
          return 's is too high and does not satisfy low s contraint - see bip 62';
        }
      }

      var e = new Bn().fromBuffer(this.hashBuf, this.endian ? {
        endian: this.endian
      } : undefined);
      var n = Point.getN();
      var sinv = s.invm(n);
      var u1 = sinv.mul(e).mod(n);
      var u2 = sinv.mul(r).mod(n);
      var p = Point.getG().mulAdd(u1, this.keyPair.pubKey.point, u2);

      if (p.isInfinity()) {
        return 'p is infinity';
      }

      if (!(p.getX().mod(n).cmp(r) === 0)) {
        return 'Invalid signature';
      } else {
        return false;
      }
    }
  }, {
    key: "sign",
    value: function sign() {
      var hashBuf = this.endian === 'little' ? new Br(this.hashBuf).readReverse() : this.hashBuf;
      var privKey = this.keyPair.privKey;
      var d = privKey.bn;

      if (!hashBuf || !privKey || !d) {
        throw new Error('invalid parameters');
      }

      if (!Buffer.isBuffer(hashBuf) || hashBuf.length !== 32) {
        throw new Error('hashBuf must be a 32 byte buffer');
      }

      var N = Point.getN();
      var G = Point.getG();
      var e = new Bn().fromBuffer(hashBuf);
      var badrs = 0;
      var k, Q, r, s;

      do {
        if (!this.k || badrs > 0) {
          this.deterministicK(badrs);
        }

        badrs++;
        k = this.k;
        Q = G.mul(k);
        r = Q.getX().mod(N);
        s = k.invm(N).mul(e.add(d.mul(r))).mod(N);
      } while (r.cmp(0) <= 0 || s.cmp(0) <= 0);

      if (s.gt(new Bn().fromBuffer(Buffer.from('7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0', 'hex')))) {
        s = Point.getN().sub(s);
      }

      this.sig = Sig.fromObject({
        r: r,
        s: s,
        compressed: this.keyPair.pubKey.compressed
      });
      return this;
    }
  }, {
    key: "asyncSign",
    value: function () {
      var _asyncSign = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee28() {
        var workersResult;
        return regeneratorRuntime.wrap(function _callee28$(_context30) {
          while (1) {
            switch (_context30.prev = _context30.next) {
              case 0:
                _context30.next = 2;
                return Workers.asyncObjectMethod(this, 'sign', []);

              case 2:
                workersResult = _context30.sent;
                return _context30.abrupt("return", this.fromFastBuffer(workersResult.resbuf));

              case 4:
              case "end":
                return _context30.stop();
            }
          }
        }, _callee28, this);
      }));

      function asyncSign() {
        return _asyncSign.apply(this, arguments);
      }

      return asyncSign;
    }()
  }, {
    key: "signRandomK",
    value: function signRandomK() {
      this.randomK();
      return this.sign();
    }
  }, {
    key: "toString",
    value: function toString() {
      var obj = {};

      if (this.hashBuf) {
        obj.hashBuf = this.hashBuf.toString('hex');
      }

      if (this.keyPair) {
        obj.keyPair = this.keyPair.toString();
      }

      if (this.sig) {
        obj.sig = this.sig.toString();
      }

      if (this.k) {
        obj.k = this.k.toString();
      }

      return JSON.stringify(obj);
    }
  }, {
    key: "verify",
    value: function verify() {
      var enforceLowS = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

      if (!this.verifyStr(enforceLowS)) {
        this.verified = true;
      } else {
        this.verified = false;
      }

      return this;
    }
  }, {
    key: "asyncVerify",
    value: function () {
      var _asyncVerify = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee29() {
        var enforceLowS,
            workersResult,
            _args31 = arguments;
        return regeneratorRuntime.wrap(function _callee29$(_context31) {
          while (1) {
            switch (_context31.prev = _context31.next) {
              case 0:
                enforceLowS = _args31.length > 0 && _args31[0] !== undefined ? _args31[0] : true;
                _context31.next = 3;
                return Workers.asyncObjectMethod(this, 'verify', [enforceLowS]);

              case 3:
                workersResult = _context31.sent;
                return _context31.abrupt("return", this.fromFastBuffer(workersResult.resbuf));

              case 5:
              case "end":
                return _context31.stop();
            }
          }
        }, _callee29, this);
      }));

      function asyncVerify() {
        return _asyncVerify.apply(this, arguments);
      }

      return asyncVerify;
    }()
  }], [{
    key: "calcrecovery",
    value: function calcrecovery(sig, pubKey, hashBuf) {
      var ecdsa = new Ecdsa().fromObject({
        sig: sig,
        keyPair: new KeyPair().fromObject({
          pubKey: pubKey
        }),
        hashBuf: hashBuf
      });
      return ecdsa.calcrecovery().sig;
    }
  }, {
    key: "asyncCalcrecovery",
    value: function () {
      var _asyncCalcrecovery2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee30(sig, pubKey, hashBuf) {
        var workersResult;
        return regeneratorRuntime.wrap(function _callee30$(_context32) {
          while (1) {
            switch (_context32.prev = _context32.next) {
              case 0:
                _context32.next = 2;
                return Workers.asyncClassMethod(Ecdsa, 'calcrecovery', [sig, pubKey, hashBuf]);

              case 2:
                workersResult = _context32.sent;
                return _context32.abrupt("return", new Sig().fromFastBuffer(workersResult.resbuf));

              case 4:
              case "end":
                return _context32.stop();
            }
          }
        }, _callee30);
      }));

      function asyncCalcrecovery(_x29, _x30, _x31) {
        return _asyncCalcrecovery2.apply(this, arguments);
      }

      return asyncCalcrecovery;
    }()
  }, {
    key: "sig2PubKey",
    value: function sig2PubKey(sig, hashBuf) {
      var ecdsa = new Ecdsa().fromObject({
        sig: sig,
        hashBuf: hashBuf
      });
      return ecdsa.sig2PubKey();
    }
  }, {
    key: "asyncSig2PubKey",
    value: function () {
      var _asyncSig2PubKey2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee31(sig, hashBuf) {
        var ecdsa, pubKey;
        return regeneratorRuntime.wrap(function _callee31$(_context33) {
          while (1) {
            switch (_context33.prev = _context33.next) {
              case 0:
                ecdsa = new Ecdsa().fromObject({
                  sig: sig,
                  hashBuf: hashBuf
                });
                _context33.next = 3;
                return ecdsa.asyncSig2PubKey();

              case 3:
                pubKey = _context33.sent;
                return _context33.abrupt("return", pubKey);

              case 5:
              case "end":
                return _context33.stop();
            }
          }
        }, _callee31);
      }));

      function asyncSig2PubKey(_x32, _x33) {
        return _asyncSig2PubKey2.apply(this, arguments);
      }

      return asyncSig2PubKey;
    }()
  }, {
    key: "sign",
    value: function sign(hashBuf, keyPair, endian) {
      return new Ecdsa().fromObject({
        hashBuf: hashBuf,
        endian: endian,
        keyPair: keyPair
      }).sign().sig;
    }
  }, {
    key: "asyncSign",
    value: function () {
      var _asyncSign2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee32(hashBuf, keyPair, endian) {
        var ecdsa;
        return regeneratorRuntime.wrap(function _callee32$(_context34) {
          while (1) {
            switch (_context34.prev = _context34.next) {
              case 0:
                ecdsa = new Ecdsa().fromObject({
                  hashBuf: hashBuf,
                  endian: endian,
                  keyPair: keyPair
                });
                _context34.next = 3;
                return ecdsa.asyncSign();

              case 3:
                return _context34.abrupt("return", ecdsa.sig);

              case 4:
              case "end":
                return _context34.stop();
            }
          }
        }, _callee32);
      }));

      function asyncSign(_x34, _x35, _x36) {
        return _asyncSign2.apply(this, arguments);
      }

      return asyncSign;
    }()
  }, {
    key: "verify",
    value: function verify(hashBuf, sig, pubKey, endian) {
      var enforceLowS = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;
      return new Ecdsa().fromObject({
        hashBuf: hashBuf,
        endian: endian,
        sig: sig,
        keyPair: new KeyPair().fromObject({
          pubKey: pubKey
        })
      }).verify(enforceLowS).verified;
    }
  }, {
    key: "asyncVerify",
    value: function () {
      var _asyncVerify2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee33(hashBuf, sig, pubKey, endian) {
        var enforceLowS,
            ecdsa,
            _args35 = arguments;
        return regeneratorRuntime.wrap(function _callee33$(_context35) {
          while (1) {
            switch (_context35.prev = _context35.next) {
              case 0:
                enforceLowS = _args35.length > 4 && _args35[4] !== undefined ? _args35[4] : true;
                ecdsa = new Ecdsa().fromObject({
                  hashBuf: hashBuf,
                  endian: endian,
                  sig: sig,
                  keyPair: new KeyPair().fromObject({
                    pubKey: pubKey
                  })
                });
                _context35.next = 4;
                return ecdsa.asyncVerify(enforceLowS);

              case 4:
                return _context35.abrupt("return", ecdsa.verified);

              case 5:
              case "end":
                return _context35.stop();
            }
          }
        }, _callee33);
      }));

      function asyncVerify(_x37, _x38, _x39, _x40) {
        return _asyncVerify2.apply(this, arguments);
      }

      return asyncVerify;
    }()
  }]);

  return Ecdsa;
}(Struct);

exports.Ecdsa = Ecdsa;

var Bsm = /*#__PURE__*/function (_Struct14) {
  _inherits(Bsm, _Struct14);

  var _super23 = _createSuper(Bsm);

  function Bsm(messageBuf, keyPair, sig, address, verified) {
    _classCallCheck(this, Bsm);

    return _super23.call(this, {
      messageBuf: messageBuf,
      keyPair: keyPair,
      sig: sig,
      address: address,
      verified: verified
    });
  }

  _createClass(Bsm, [{
    key: "sign",
    value: function sign() {
      var hashBuf = Bsm.magicHash(this.messageBuf);
      var ecdsa = new Ecdsa().fromObject({
        hashBuf: hashBuf,
        keyPair: this.keyPair
      });
      ecdsa.sign();
      ecdsa.calcrecovery();
      this.sig = ecdsa.sig;
      return this;
    }
  }, {
    key: "verify",
    value: function verify() {
      var hashBuf = Bsm.magicHash(this.messageBuf);
      var ecdsa = new Ecdsa();
      ecdsa.hashBuf = hashBuf;
      ecdsa.sig = this.sig;
      ecdsa.keyPair = new KeyPair();
      ecdsa.keyPair.pubKey = ecdsa.sig2PubKey();

      if (!ecdsa.verify()) {
        this.verified = false;
        return this;
      }

      var address = new Address().fromPubKey(ecdsa.keyPair.pubKey, undefined, this.sig.compressed);

      if (cmp(address.hashBuf, this.address.hashBuf)) {
        this.verified = true;
      } else {
        this.verified = false;
      }

      return this;
    }
  }], [{
    key: "magicHash",
    value: function magicHash(messageBuf) {
      if (!Buffer.isBuffer(messageBuf)) {
        throw new Error('messageBuf must be a buffer');
      }

      var bw = new Bw();
      bw.writeVarIntNum(Bsm.magicBytes.length);
      bw.write(Bsm.magicBytes);
      bw.writeVarIntNum(messageBuf.length);
      bw.write(messageBuf);
      var buf = bw.toBuffer();
      var hashBuf = Hash.sha256Sha256(buf);
      return hashBuf;
    }
  }, {
    key: "asyncMagicHash",
    value: function () {
      var _asyncMagicHash = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee34(messageBuf) {
        var args, workersResult;
        return regeneratorRuntime.wrap(function _callee34$(_context36) {
          while (1) {
            switch (_context36.prev = _context36.next) {
              case 0:
                args = [messageBuf];
                _context36.next = 3;
                return Workers.asyncClassMethod(Bsm, 'magicHash', args);

              case 3:
                workersResult = _context36.sent;
                return _context36.abrupt("return", workersResult.resbuf);

              case 5:
              case "end":
                return _context36.stop();
            }
          }
        }, _callee34);
      }));

      function asyncMagicHash(_x41) {
        return _asyncMagicHash.apply(this, arguments);
      }

      return asyncMagicHash;
    }()
  }, {
    key: "sign",
    value: function sign(messageBuf, keyPair) {
      var m = new Bsm(messageBuf, keyPair);
      m.sign();
      var sigbuf = m.sig.toCompact();
      var sigstr = sigbuf.toString('base64');
      return sigstr;
    }
  }, {
    key: "asyncSign",
    value: function () {
      var _asyncSign3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee35(messageBuf, keyPair) {
        var args, workersResult, sigstr;
        return regeneratorRuntime.wrap(function _callee35$(_context37) {
          while (1) {
            switch (_context37.prev = _context37.next) {
              case 0:
                args = [messageBuf, keyPair];
                _context37.next = 3;
                return Workers.asyncClassMethod(Bsm, 'sign', args);

              case 3:
                workersResult = _context37.sent;
                sigstr = JSON.parse(workersResult.resbuf.toString());
                return _context37.abrupt("return", sigstr);

              case 6:
              case "end":
                return _context37.stop();
            }
          }
        }, _callee35);
      }));

      function asyncSign(_x42, _x43) {
        return _asyncSign3.apply(this, arguments);
      }

      return asyncSign;
    }()
  }, {
    key: "verify",
    value: function verify(messageBuf, sigstr, address) {
      var sigbuf = Buffer.from(sigstr, 'base64');
      var message = new Bsm();
      message.messageBuf = messageBuf;
      message.sig = new Sig().fromCompact(sigbuf);
      message.address = address;
      return message.verify().verified;
    }
  }, {
    key: "asyncVerify",
    value: function () {
      var _asyncVerify3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee36(messageBuf, sigstr, address) {
        var args, workersResult, res;
        return regeneratorRuntime.wrap(function _callee36$(_context38) {
          while (1) {
            switch (_context38.prev = _context38.next) {
              case 0:
                args = [messageBuf, sigstr, address];
                _context38.next = 3;
                return Workers.asyncClassMethod(Bsm, 'verify', args);

              case 3:
                workersResult = _context38.sent;
                res = JSON.parse(workersResult.resbuf.toString());
                return _context38.abrupt("return", res);

              case 6:
              case "end":
                return _context38.stop();
            }
          }
        }, _callee36);
      }));

      function asyncVerify(_x44, _x45, _x46) {
        return _asyncVerify3.apply(this, arguments);
      }

      return asyncVerify;
    }()
  }]);

  return Bsm;
}(Struct);

exports.Bsm = Bsm;
Bsm.magicBytes = Buffer.from('Bitcoin Signed Message:\n');

var BlockHeader = /*#__PURE__*/function (_Struct15) {
  _inherits(BlockHeader, _Struct15);

  var _super24 = _createSuper(BlockHeader);

  function BlockHeader(versionBytesNum, prevBlockHashBuf, merkleRootBuf, time, bits, nonce) {
    _classCallCheck(this, BlockHeader);

    return _super24.call(this, {
      versionBytesNum: versionBytesNum,
      prevBlockHashBuf: prevBlockHashBuf,
      merkleRootBuf: merkleRootBuf,
      time: time,
      bits: bits,
      nonce: nonce
    });
  }

  _createClass(BlockHeader, [{
    key: "fromJSON",
    value: function fromJSON(json) {
      this.fromObject({
        versionBytesNum: json.versionBytesNum,
        prevBlockHashBuf: Buffer.from(json.prevBlockHashBuf, 'hex'),
        merkleRootBuf: Buffer.from(json.merkleRootBuf, 'hex'),
        time: json.time,
        bits: json.bits,
        nonce: json.nonce
      });
      return this;
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      return {
        versionBytesNum: this.versionBytesNum,
        prevBlockHashBuf: this.prevBlockHashBuf.toString('hex'),
        merkleRootBuf: this.merkleRootBuf.toString('hex'),
        time: this.time,
        bits: this.bits,
        nonce: this.nonce
      };
    }
  }, {
    key: "fromBr",
    value: function fromBr(br) {
      this.versionBytesNum = br.readUInt32LE();
      this.prevBlockHashBuf = br.read(32);
      this.merkleRootBuf = br.read(32);
      this.time = br.readUInt32LE();
      this.bits = br.readUInt32LE();
      this.nonce = br.readUInt32LE();
      return this;
    }
  }, {
    key: "toBw",
    value: function toBw(bw) {
      if (!bw) {
        bw = new Bw();
      }

      bw.writeUInt32LE(this.versionBytesNum);
      bw.write(this.prevBlockHashBuf);
      bw.write(this.merkleRootBuf);
      bw.writeUInt32LE(this.time);
      bw.writeUInt32LE(this.bits);
      bw.writeUInt32LE(this.nonce);
      return bw;
    }
  }]);

  return BlockHeader;
}(Struct);

exports.BlockHeader = BlockHeader;

var Merkle = /*#__PURE__*/function (_Struct16) {
  _inherits(Merkle, _Struct16);

  var _super25 = _createSuper(Merkle);

  function Merkle(hashBuf, buf, merkle1, merkle2) {
    _classCallCheck(this, Merkle);

    return _super25.call(this, {
      hashBuf: hashBuf,
      buf: buf,
      merkle1: merkle1,
      merkle2: merkle2
    });
  }

  _createClass(Merkle, [{
    key: "hash",
    value: function hash() {
      if (this.hashBuf) {
        return this.hashBuf;
      }

      if (this.buf) {
        return Hash.sha256Sha256(this.buf);
      }

      var hashBuf1 = this.merkle1.hash();
      var hashBuf2 = this.merkle2.hash();
      this.buf = Buffer.concat([hashBuf1, hashBuf2]);
      return Hash.sha256Sha256(this.buf);
    }
  }, {
    key: "fromBuffers",
    value: function fromBuffers(bufs) {
      if (bufs.length < 1) {
        throw new Error('buffers must have a length');
      }

      bufs = bufs.slice();
      var log = Math.log2(bufs.length);

      if (!Number.isInteger(log)) {
        var lastval = bufs[bufs.length - 1];
        var len = Math.pow(2, Math.ceil(log));

        for (var i = bufs.length; i < len; i++) {
          bufs.push(lastval);
        }
      }

      var bufs1 = bufs.slice(0, bufs.length / 2);
      var bufs2 = bufs.slice(bufs.length / 2);
      this.fromBufferArrays(bufs1, bufs2);
      return this;
    }
  }, {
    key: "fromBufferArrays",
    value: function fromBufferArrays(bufs1, bufs2) {
      if (bufs1.length === 1) {
        this.merkle1 = new Merkle(undefined, bufs1[0]);
        this.merkle2 = new Merkle(undefined, bufs2[0]);
        return this;
      }

      var bufs11 = bufs1.slice(0, bufs1.length / 2);
      var bufs12 = bufs1.slice(bufs1.length / 2);
      this.merkle1 = new Merkle().fromBufferArrays(bufs11, bufs12);
      var bufs21 = bufs2.slice(0, bufs2.length / 2);
      var bufs22 = bufs2.slice(bufs2.length / 2);
      this.merkle2 = new Merkle().fromBufferArrays(bufs21, bufs22);
      return this;
    }
  }, {
    key: "leavesNum",
    value: function leavesNum() {
      if (this.merkle1) {
        return this.merkle1.leavesNum() + this.merkle2.leavesNum();
      }

      if (this.buf) {
        return 1;
      }

      throw new Error('invalid number of leaves');
    }
  }], [{
    key: "fromBuffers",
    value: function fromBuffers(bufs) {
      return new this().fromBuffers(bufs);
    }
  }, {
    key: "fromBufferArrays",
    value: function fromBufferArrays(bufs1, bufs2) {
      return new this().fromBufferArrays(bufs1, bufs2);
    }
  }]);

  return Merkle;
}(Struct);

var HashCache = /*#__PURE__*/function (_Struct17) {
  _inherits(HashCache, _Struct17);

  var _super26 = _createSuper(HashCache);

  function HashCache(prevoutsHashBuf, sequenceHashBuf, outputsHashBuf) {
    var _this16;

    _classCallCheck(this, HashCache);

    _this16 = _super26.call(this);

    _this16.fromObject({
      prevoutsHashBuf: prevoutsHashBuf,
      sequenceHashBuf: sequenceHashBuf,
      outputsHashBuf: outputsHashBuf
    });

    return _this16;
  }

  _createClass(HashCache, [{
    key: "fromBuffer",
    value: function fromBuffer(buf) {
      return this.fromJSON(JSON.parse(buf.toString()));
    }
  }, {
    key: "toBuffer",
    value: function toBuffer() {
      return Buffer.from(JSON.stringify(this.toJSON()));
    }
  }, {
    key: "fromJSON",
    value: function fromJSON(json) {
      this.prevoutsHashBuf = json.prevoutsHashBuf ? Buffer.from(json.prevoutsHashBuf, 'hex') : undefined;
      this.sequenceHashBuf = json.sequenceHashBuf ? Buffer.from(json.sequenceHashBuf, 'hex') : undefined;
      this.outputsHashBuf = json.outputsHashBuf ? Buffer.from(json.outputsHashBuf, 'hex') : undefined;
      return this;
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      return {
        prevoutsHashBuf: this.prevoutsHashBuf ? this.prevoutsHashBuf.toString('hex') : undefined,
        sequenceHashBuf: this.sequenceHashBuf ? this.sequenceHashBuf.toString('hex') : undefined,
        outputsHashBuf: this.outputsHashBuf ? this.outputsHashBuf.toString('hex') : undefined
      };
    }
  }]);

  return HashCache;
}(Struct);

var VarInt = /*#__PURE__*/function (_Struct18) {
  _inherits(VarInt, _Struct18);

  var _super27 = _createSuper(VarInt);

  function VarInt(buf) {
    _classCallCheck(this, VarInt);

    return _super27.call(this, {
      buf: buf
    });
  }

  _createClass(VarInt, [{
    key: "fromJSON",
    value: function fromJSON(json) {
      this.fromObject({
        buf: Buffer.from(json, 'hex')
      });
      return this;
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      return this.buf.toString('hex');
    }
  }, {
    key: "fromBuffer",
    value: function fromBuffer(buf) {
      this.buf = buf;
      return this;
    }
  }, {
    key: "fromBr",
    value: function fromBr(br) {
      this.buf = br.readVarIntBuf();
      return this;
    }
  }, {
    key: "fromBn",
    value: function fromBn(bn) {
      this.buf = new Bw().writeVarIntBn(bn).toBuffer();
      return this;
    }
  }, {
    key: "fromNumber",
    value: function fromNumber(num) {
      this.buf = new Bw().writeVarIntNum(num).toBuffer();
      return this;
    }
  }, {
    key: "toBuffer",
    value: function toBuffer() {
      return this.buf;
    }
  }, {
    key: "toBn",
    value: function toBn() {
      return new Br(this.buf).readVarIntBn();
    }
  }, {
    key: "toNumber",
    value: function toNumber() {
      return new Br(this.buf).readVarIntNum();
    }
  }], [{
    key: "fromBn",
    value: function fromBn(bn) {
      return new this().fromBn(bn);
    }
  }, {
    key: "fromNumber",
    value: function fromNumber(num) {
      return new this().fromNumber(num);
    }
  }]);

  return VarInt;
}(Struct);

exports.VarInt = VarInt;

var TxIn = /*#__PURE__*/function (_Struct19) {
  _inherits(TxIn, _Struct19);

  var _super28 = _createSuper(TxIn);

  function TxIn(txHashBuf, txOutNum, scriptVi, script) {
    var nSequence = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0xffffffff;

    _classCallCheck(this, TxIn);

    return _super28.call(this, {
      txHashBuf: txHashBuf,
      txOutNum: txOutNum,
      scriptVi: scriptVi,
      script: script,
      nSequence: nSequence
    });
  }

  _createClass(TxIn, [{
    key: "setScript",
    value: function setScript(script) {
      this.scriptVi = VarInt.fromNumber(script.toBuffer().length);
      this.script = script;
      return this;
    }
  }, {
    key: "fromProperties",
    value: function fromProperties(txHashBuf, txOutNum, script, nSequence) {
      this.fromObject({
        txHashBuf: txHashBuf,
        txOutNum: txOutNum,
        nSequence: nSequence
      });
      this.setScript(script);
      return this;
    }
  }, {
    key: "fromJSON",
    value: function fromJSON(json) {
      this.fromObject({
        txHashBuf: typeof json.txHashBuf !== 'undefined' ? Buffer.from(json.txHashBuf, 'hex') : undefined,
        txOutNum: json.txOutNum,
        scriptVi: typeof json.scriptVi !== 'undefined' ? VarInt.fromJSON(json.scriptVi) : undefined,
        script: typeof json.script !== 'undefined' ? Script.fromJSON(json.script) : undefined,
        nSequence: json.nSequence
      });
      return this;
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      return {
        txHashBuf: typeof this.txHashBuf !== 'undefined' ? this.txHashBuf.toString('hex') : undefined,
        txOutNum: this.txOutNum,
        scriptVi: typeof this.scriptVi !== 'undefined' ? this.scriptVi.toJSON() : undefined,
        script: typeof this.script !== 'undefined' ? this.script.toJSON() : undefined,
        nSequence: this.nSequence
      };
    }
  }, {
    key: "fromBr",
    value: function fromBr(br) {
      this.txHashBuf = br.read(32);
      this.txOutNum = br.readUInt32LE();
      this.scriptVi = VarInt.fromBuffer(br.readVarIntBuf());
      this.script = Script.fromBuffer(br.read(this.scriptVi.toNumber()));
      this.nSequence = br.readUInt32LE();
      return this;
    }
  }, {
    key: "toBw",
    value: function toBw(bw) {
      if (!bw) {
        bw = new Bw();
      }

      bw.write(this.txHashBuf);
      bw.writeUInt32LE(this.txOutNum);
      bw.write(this.scriptVi.buf);
      bw.write(this.script.toBuffer());
      bw.writeUInt32LE(this.nSequence);
      return bw;
    }
  }, {
    key: "fromPubKeyHashTxOut",
    value: function fromPubKeyHashTxOut(txHashBuf, txOutNum, txOut, pubKey) {
      var script = new Script();

      if (txOut.script.isPubKeyHashOut()) {
        script.writeOpCode(OpCode.OP_0);

        if (pubKey) {
          script.writeBuffer(pubKey.toBuffer());
        } else {
          script.writeOpCode(OpCode.OP_0);
        }
      } else {
        throw new Error('txOut must be of type pubKeyHash');
      }

      this.txHashBuf = txHashBuf;
      this.txOutNum = txOutNum;
      this.setScript(script);
      return this;
    }
  }, {
    key: "hasNullInput",
    value: function hasNullInput() {
      var hex = this.txHashBuf.toString('hex');

      if (hex === '0000000000000000000000000000000000000000000000000000000000000000' && this.txOutNum === 0xffffffff) {
        return true;
      }

      return false;
    }
  }, {
    key: "setNullInput",
    value: function setNullInput() {
      this.txHashBuf = Buffer.alloc(32);
      this.txHashBuf.fill(0);
      this.txOutNum = 0xffffffff;
    }
  }], [{
    key: "fromProperties",
    value: function fromProperties(txHashBuf, txOutNum, script, nSequence) {
      return new this().fromProperties(txHashBuf, txOutNum, script, nSequence);
    }
  }]);

  return TxIn;
}(Struct);

exports.TxIn = TxIn;
TxIn.LOCKTIME_VERIFY_SEQUENCE = 1 << 0;
TxIn.SEQUENCE_FINAL = 0xffffffff;
TxIn.SEQUENCE_LOCKTIME_DISABLE_FLAG = 1 << 31;
TxIn.SEQUENCE_LOCKTIME_TYPE_FLAG = 1 << 22;
TxIn.SEQUENCE_LOCKTIME_MASK = 0x0000ffff;
TxIn.SEQUENCE_LOCKTIME_GRANULARITY = 9;

var TxOut = /*#__PURE__*/function (_Struct20) {
  _inherits(TxOut, _Struct20);

  var _super29 = _createSuper(TxOut);

  function TxOut(valueBn, scriptVi, script) {
    _classCallCheck(this, TxOut);

    return _super29.call(this, {
      valueBn: valueBn,
      scriptVi: scriptVi,
      script: script
    });
  }

  _createClass(TxOut, [{
    key: "setScript",
    value: function setScript(script) {
      this.scriptVi = VarInt.fromNumber(script.toBuffer().length);
      this.script = script;
      return this;
    }
  }, {
    key: "fromProperties",
    value: function fromProperties(valueBn, script) {
      this.fromObject({
        valueBn: valueBn
      });
      this.setScript(script);
      return this;
    }
  }, {
    key: "fromJSON",
    value: function fromJSON(json) {
      this.fromObject({
        valueBn: new Bn().fromJSON(json.valueBn),
        scriptVi: new VarInt().fromJSON(json.scriptVi),
        script: new Script().fromJSON(json.script)
      });
      return this;
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      return {
        valueBn: this.valueBn.toJSON(),
        scriptVi: this.scriptVi.toJSON(),
        script: this.script.toJSON()
      };
    }
  }, {
    key: "fromBr",
    value: function fromBr(br) {
      this.valueBn = br.readUInt64LEBn();
      this.scriptVi = VarInt.fromNumber(br.readVarIntNum());
      this.script = new Script().fromBuffer(br.read(this.scriptVi.toNumber()));
      return this;
    }
  }, {
    key: "toBw",
    value: function toBw(bw) {
      if (!bw) {
        bw = new Bw();
      }

      bw.writeUInt64LEBn(this.valueBn);
      bw.write(this.scriptVi.buf);
      bw.write(this.script.toBuffer());
      return bw;
    }
  }], [{
    key: "fromProperties",
    value: function fromProperties(valueBn, script) {
      return new this().fromProperties(valueBn, script);
    }
  }]);

  return TxOut;
}(Struct);

exports.TxOut = TxOut;

var Tx = /*#__PURE__*/function (_Struct21) {
  _inherits(Tx, _Struct21);

  var _super30 = _createSuper(Tx);

  function Tx() {
    var versionBytesNum = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
    var txInsVi = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : VarInt.fromNumber(0);
    var txIns = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
    var txOutsVi = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : VarInt.fromNumber(0);
    var txOuts = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : [];
    var nLockTime = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 0;

    _classCallCheck(this, Tx);

    return _super30.call(this, {
      versionBytesNum: versionBytesNum,
      txInsVi: txInsVi,
      txIns: txIns,
      txOutsVi: txOutsVi,
      txOuts: txOuts,
      nLockTime: nLockTime
    });
  }

  _createClass(Tx, [{
    key: "fromJSON",
    value: function fromJSON(json) {
      var txIns = [];
      json.txIns.forEach(function (txIn) {
        txIns.push(new TxIn().fromJSON(txIn));
      });
      var txOuts = [];
      json.txOuts.forEach(function (txOut) {
        txOuts.push(new TxOut().fromJSON(txOut));
      });
      this.fromObject({
        versionBytesNum: json.versionBytesNum,
        txInsVi: new VarInt().fromJSON(json.txInsVi),
        txIns: txIns,
        txOutsVi: new VarInt().fromJSON(json.txOutsVi),
        txOuts: txOuts,
        nLockTime: json.nLockTime
      });
      return this;
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      var txIns = [];
      this.txIns.forEach(function (txIn) {
        txIns.push(txIn.toJSON());
      });
      var txOuts = [];
      this.txOuts.forEach(function (txOut) {
        txOuts.push(txOut.toJSON());
      });
      return {
        versionBytesNum: this.versionBytesNum,
        txInsVi: this.txInsVi.toJSON(),
        txIns: txIns,
        txOutsVi: this.txOutsVi.toJSON(),
        txOuts: txOuts,
        nLockTime: this.nLockTime
      };
    }
  }, {
    key: "fromBr",
    value: function fromBr(br) {
      this.versionBytesNum = br.readUInt32LE();
      this.txInsVi = new VarInt(br.readVarIntBuf());
      var txInsNum = this.txInsVi.toNumber();
      this.txIns = [];

      for (var i = 0; i < txInsNum; i++) {
        this.txIns.push(new TxIn().fromBr(br));
      }

      this.txOutsVi = new VarInt(br.readVarIntBuf());
      var txOutsNum = this.txOutsVi.toNumber();
      this.txOuts = [];

      for (var _i5 = 0; _i5 < txOutsNum; _i5++) {
        this.txOuts.push(new TxOut().fromBr(br));
      }

      this.nLockTime = br.readUInt32LE();
      return this;
    }
  }, {
    key: "toBw",
    value: function toBw(bw) {
      if (!bw) {
        bw = new Bw();
      }

      bw.writeUInt32LE(this.versionBytesNum);
      bw.write(this.txInsVi.buf);

      for (var i = 0; i < this.txIns.length; i++) {
        this.txIns[i].toBw(bw);
      }

      bw.write(this.txOutsVi.buf);

      for (var _i6 = 0; _i6 < this.txOuts.length; _i6++) {
        this.txOuts[_i6].toBw(bw);
      }

      bw.writeUInt32LE(this.nLockTime);
      return bw;
    }
  }, {
    key: "hashPrevouts",
    value: function hashPrevouts() {
      var bw = new Bw();

      for (var i in this.txIns) {
        var txIn = this.txIns[i];
        bw.write(txIn.txHashBuf);
        bw.writeUInt32LE(txIn.txOutNum);
      }

      return Hash.sha256Sha256(bw.toBuffer());
    }
  }, {
    key: "hashSequence",
    value: function hashSequence() {
      var bw = new Bw();

      for (var i in this.txIns) {
        var txIn = this.txIns[i];
        bw.writeUInt32LE(txIn.nSequence);
      }

      return Hash.sha256Sha256(bw.toBuffer());
    }
  }, {
    key: "hashOutputs",
    value: function hashOutputs() {
      var bw = new Bw();

      for (var i in this.txOuts) {
        var txOut = this.txOuts[i];
        bw.write(txOut.toBuffer());
      }

      return Hash.sha256Sha256(bw.toBuffer());
    }
  }, {
    key: "sighash",
    value: function sighash(nHashType, nIn, subScript, valueBn) {
      var flags = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
      var hashCache = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : new HashCache();

      if (nHashType & Sig.SIGHASH_FORKID && flags & Tx.SCRIPT_ENABLE_SIGHASH_FORKID) {
        var hashPrevouts = Buffer.alloc(32, 0);
        var hashSequence = Buffer.alloc(32, 0);
        var hashOutputs = Buffer.alloc(32, 0);

        if (!(nHashType & Sig.SIGHASH_ANYONECANPAY)) {
          hashPrevouts = hashCache.prevoutsHashBuf ? hashCache.prevoutsHashBuf : hashCache.prevoutsHashBuf = this.hashPrevouts();
        }

        if (!(nHashType & Sig.SIGHASH_ANYONECANPAY) && (nHashType & 0x1f) !== Sig.SIGHASH_SINGLE && (nHashType & 0x1f) !== Sig.SIGHASH_NONE) {
          hashSequence = hashCache.sequenceHashBuf ? hashCache.sequenceHashBuf : hashCache.sequenceHashBuf = this.hashSequence();
        }

        if ((nHashType & 0x1f) !== Sig.SIGHASH_SINGLE && (nHashType & 0x1f) !== Sig.SIGHASH_NONE) {
          hashOutputs = hashCache.outputsHashBuf ? hashCache.outputsHashBuf : hashCache.outputsHashBuf = this.hashOutputs();
        } else if ((nHashType & 0x1f) === Sig.SIGHASH_SINGLE && nIn < this.txOuts.length) {
          hashOutputs = Hash.sha256Sha256(this.txOuts[nIn].toBuffer());
        }

        var bw = new Bw();
        bw.writeUInt32LE(this.versionBytesNum);
        bw.write(hashPrevouts);
        bw.write(hashSequence);
        bw.write(this.txIns[nIn].txHashBuf);
        bw.writeUInt32LE(this.txIns[nIn].txOutNum);
        bw.writeVarIntNum(subScript.toBuffer().length);
        bw.write(subScript.toBuffer());
        bw.writeUInt64LEBn(valueBn);
        bw.writeUInt32LE(this.txIns[nIn].nSequence);
        bw.write(hashOutputs);
        bw.writeUInt32LE(this.nLockTime);
        bw.writeUInt32LE(nHashType >>> 0);
        return new Br(Hash.sha256Sha256(bw.toBuffer())).readReverse();
      }

      var txcopy = this.cloneByBuffer();
      subScript = new Script().fromBuffer(subScript.toBuffer());
      subScript.removeCodeseparators();

      for (var i = 0; i < txcopy.txIns.length; i++) {
        txcopy.txIns[i] = TxIn.fromBuffer(txcopy.txIns[i].toBuffer()).setScript(new Script());
      }

      txcopy.txIns[nIn] = TxIn.fromBuffer(txcopy.txIns[nIn].toBuffer()).setScript(subScript);

      if ((nHashType & 31) === Sig.SIGHASH_NONE) {
        txcopy.txOuts.length = 0;
        txcopy.txOutsVi = VarInt.fromNumber(0);

        for (var _i7 = 0; _i7 < txcopy.txIns.length; _i7++) {
          if (_i7 !== nIn) {
            txcopy.txIns[_i7].nSequence = 0;
          }
        }
      } else if ((nHashType & 31) === Sig.SIGHASH_SINGLE) {
        if (nIn > txcopy.txOuts.length - 1) {
          return Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex');
        }

        txcopy.txOuts.length = nIn + 1;
        txcopy.txOutsVi = VarInt.fromNumber(nIn + 1);

        for (var _i8 = 0; _i8 < txcopy.txOuts.length; _i8++) {
          if (_i8 < nIn) {
            txcopy.txOuts[_i8] = TxOut.fromProperties(new Bn().fromBuffer(Buffer.from('ffffffffffffffff', 'hex')), new Script());
          }
        }

        for (var _i9 = 0; _i9 < txcopy.txIns.length; _i9++) {
          if (_i9 !== nIn) {
            txcopy.txIns[_i9].nSequence = 0;
          }
        }
      }

      if (nHashType & Sig.SIGHASH_ANYONECANPAY) {
        txcopy.txIns[0] = txcopy.txIns[nIn];
        txcopy.txIns.length = 1;
        txcopy.txInsVi = VarInt.fromNumber(1);
      }

      var buf = new Bw().write(txcopy.toBuffer()).writeInt32LE(nHashType).toBuffer();
      return new Br(Hash.sha256Sha256(buf)).readReverse();
    }
  }, {
    key: "asyncSighash",
    value: function () {
      var _asyncSighash = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee37(nHashType, nIn, subScript, valueBn) {
        var flags,
            hashCache,
            workersResult,
            _args39 = arguments;
        return regeneratorRuntime.wrap(function _callee37$(_context39) {
          while (1) {
            switch (_context39.prev = _context39.next) {
              case 0:
                flags = _args39.length > 4 && _args39[4] !== undefined ? _args39[4] : 0;
                hashCache = _args39.length > 5 && _args39[5] !== undefined ? _args39[5] : {};
                _context39.next = 4;
                return Workers.asyncObjectMethod(this, 'sighash', [nHashType, nIn, subScript, valueBn, flags, hashCache]);

              case 4:
                workersResult = _context39.sent;
                return _context39.abrupt("return", workersResult.resbuf);

              case 6:
              case "end":
                return _context39.stop();
            }
          }
        }, _callee37, this);
      }));

      function asyncSighash(_x47, _x48, _x49, _x50) {
        return _asyncSighash.apply(this, arguments);
      }

      return asyncSighash;
    }()
  }, {
    key: "sign",
    value: function sign(keyPair) {
      var nHashType = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID;
      var nIn = arguments.length > 2 ? arguments[2] : undefined;
      var subScript = arguments.length > 3 ? arguments[3] : undefined;
      var valueBn = arguments.length > 4 ? arguments[4] : undefined;
      var flags = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : Tx.SCRIPT_ENABLE_SIGHASH_FORKID;
      var hashCache = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : {};
      var hashBuf = this.sighash(nHashType, nIn, subScript, valueBn, flags, hashCache);
      var sig = Ecdsa.sign(hashBuf, keyPair, 'little').fromObject({
        nHashType: nHashType
      });
      return sig;
    }
  }, {
    key: "asyncSign",
    value: function () {
      var _asyncSign4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee38(keyPair) {
        var nHashType,
            nIn,
            subScript,
            valueBn,
            flags,
            hashCache,
            workersResult,
            _args40 = arguments;
        return regeneratorRuntime.wrap(function _callee38$(_context40) {
          while (1) {
            switch (_context40.prev = _context40.next) {
              case 0:
                nHashType = _args40.length > 1 && _args40[1] !== undefined ? _args40[1] : Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID;
                nIn = _args40.length > 2 ? _args40[2] : undefined;
                subScript = _args40.length > 3 ? _args40[3] : undefined;
                valueBn = _args40.length > 4 ? _args40[4] : undefined;
                flags = _args40.length > 5 && _args40[5] !== undefined ? _args40[5] : Tx.SCRIPT_ENABLE_SIGHASH_FORKID;
                hashCache = _args40.length > 6 && _args40[6] !== undefined ? _args40[6] : {};
                _context40.next = 8;
                return Workers.asyncObjectMethod(this, 'sign', [keyPair, nHashType, nIn, subScript, valueBn, flags, hashCache]);

              case 8:
                workersResult = _context40.sent;
                return _context40.abrupt("return", new Sig().fromFastBuffer(workersResult.resbuf));

              case 10:
              case "end":
                return _context40.stop();
            }
          }
        }, _callee38, this);
      }));

      function asyncSign(_x51) {
        return _asyncSign4.apply(this, arguments);
      }

      return asyncSign;
    }()
  }, {
    key: "verify",
    value: function verify(sig, pubKey, nIn, subScript) {
      var enforceLowS = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
      var valueBn = arguments.length > 5 ? arguments[5] : undefined;
      var flags = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : Tx.SCRIPT_ENABLE_SIGHASH_FORKID;
      var hashCache = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : {};
      var hashBuf = this.sighash(sig.nHashType, nIn, subScript, valueBn, flags, hashCache);
      return Ecdsa.verify(hashBuf, sig, pubKey, 'little', enforceLowS);
    }
  }, {
    key: "asyncVerify",
    value: function () {
      var _asyncVerify4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee39(sig, pubKey, nIn, subScript) {
        var enforceLowS,
            valueBn,
            flags,
            hashCache,
            workersResult,
            _args41 = arguments;
        return regeneratorRuntime.wrap(function _callee39$(_context41) {
          while (1) {
            switch (_context41.prev = _context41.next) {
              case 0:
                enforceLowS = _args41.length > 4 && _args41[4] !== undefined ? _args41[4] : false;
                valueBn = _args41.length > 5 ? _args41[5] : undefined;
                flags = _args41.length > 6 && _args41[6] !== undefined ? _args41[6] : Tx.SCRIPT_ENABLE_SIGHASH_FORKID;
                hashCache = _args41.length > 7 && _args41[7] !== undefined ? _args41[7] : {};
                _context41.next = 6;
                return Workers.asyncObjectMethod(this, 'verify', [sig, pubKey, nIn, subScript, enforceLowS, valueBn, flags, hashCache]);

              case 6:
                workersResult = _context41.sent;
                return _context41.abrupt("return", JSON.parse(workersResult.resbuf.toString()));

              case 8:
              case "end":
                return _context41.stop();
            }
          }
        }, _callee39, this);
      }));

      function asyncVerify(_x52, _x53, _x54, _x55) {
        return _asyncVerify4.apply(this, arguments);
      }

      return asyncVerify;
    }()
  }, {
    key: "hash",
    value: function hash() {
      return Hash.sha256Sha256(this.toBuffer());
    }
  }, {
    key: "asyncHash",
    value: function () {
      var _asyncHash = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee40() {
        var workersResult;
        return regeneratorRuntime.wrap(function _callee40$(_context42) {
          while (1) {
            switch (_context42.prev = _context42.next) {
              case 0:
                _context42.next = 2;
                return Workers.asyncObjectMethod(this, 'hash', []);

              case 2:
                workersResult = _context42.sent;
                return _context42.abrupt("return", workersResult.resbuf);

              case 4:
              case "end":
                return _context42.stop();
            }
          }
        }, _callee40, this);
      }));

      function asyncHash() {
        return _asyncHash.apply(this, arguments);
      }

      return asyncHash;
    }()
  }, {
    key: "id",
    value: function id() {
      return new Br(this.hash()).readReverse().toString('hex');
    }
  }, {
    key: "asyncId",
    value: function () {
      var _asyncId = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee41() {
        var workersResult;
        return regeneratorRuntime.wrap(function _callee41$(_context43) {
          while (1) {
            switch (_context43.prev = _context43.next) {
              case 0:
                _context43.next = 2;
                return Workers.asyncObjectMethod(this, 'id', []);

              case 2:
                workersResult = _context43.sent;
                return _context43.abrupt("return", JSON.parse(workersResult.resbuf.toString()));

              case 4:
              case "end":
                return _context43.stop();
            }
          }
        }, _callee41, this);
      }));

      function asyncId() {
        return _asyncId.apply(this, arguments);
      }

      return asyncId;
    }()
  }, {
    key: "addTxIn",
    value: function addTxIn(txHashBuf, txOutNum, script, nSequence) {
      var txIn;

      if (txHashBuf instanceof TxIn) {
        txIn = txHashBuf;
      } else {
        txIn = new TxIn().fromObject({
          txHashBuf: txHashBuf,
          txOutNum: txOutNum,
          nSequence: nSequence
        }).setScript(script);
      }

      this.txIns.push(txIn);
      this.txInsVi = VarInt.fromNumber(this.txInsVi.toNumber() + 1);
      return this;
    }
  }, {
    key: "addTxOut",
    value: function addTxOut(valueBn, script) {
      var txOut;

      if (valueBn instanceof TxOut) {
        txOut = valueBn;
      } else {
        txOut = new TxOut().fromObject({
          valueBn: valueBn
        }).setScript(script);
      }

      this.txOuts.push(txOut);
      this.txOutsVi = VarInt.fromNumber(this.txOutsVi.toNumber() + 1);
      return this;
    }
  }, {
    key: "isCoinbase",
    value: function isCoinbase() {
      return this.txIns.length === 1 && this.txIns[0].hasNullInput();
    }
  }, {
    key: "sort",
    value: function sort() {
      this.txIns.sort(function (first, second) {
        return new Br(first.txHashBuf).readReverse().compare(new Br(second.txHashBuf).readReverse()) || first.txOutNum - second.txOutNum;
      });
      this.txOuts.sort(function (first, second) {
        return first.valueBn.sub(second.valueBn).toNumber() || first.script.toBuffer().compare(second.script.toBuffer());
      });
      return this;
    }
  }]);

  return Tx;
}(Struct);

exports.Tx = Tx;
Tx.MAX_MONEY = 21000000 * 1e8;
Tx.SCRIPT_ENABLE_SIGHASH_FORKID = 1 << 16;

var Block = /*#__PURE__*/function (_Struct22) {
  _inherits(Block, _Struct22);

  var _super31 = _createSuper(Block);

  function Block(blockHeader, txsVi, txs) {
    _classCallCheck(this, Block);

    return _super31.call(this, {
      blockHeader: blockHeader,
      txsVi: txsVi,
      txs: txs
    });
  }

  _createClass(Block, [{
    key: "fromJSON",
    value: function fromJSON(json) {
      var txs = [];
      json.txs.forEach(function (tx) {
        txs.push(new Tx().fromJSON(tx));
      });
      this.fromObject({
        blockHeader: new BlockHeader().fromJSON(json.blockHeader),
        txsVi: new VarInt().fromJSON(json.txsVi),
        txs: txs
      });
      return this;
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      var txs = [];
      this.txs.forEach(function (tx) {
        txs.push(tx.toJSON());
      });
      return {
        blockHeader: this.blockHeader.toJSON(),
        txsVi: this.txsVi.toJSON(),
        txs: txs
      };
    }
  }, {
    key: "fromBr",
    value: function fromBr(br) {
      this.blockHeader = new BlockHeader().fromBr(br);
      this.txsVi = new VarInt(br.readVarIntBuf());
      var txsNum = this.txsVi.toNumber();
      this.txs = [];

      for (var i = 0; i < txsNum; i++) {
        this.txs.push(new Tx().fromBr(br));
      }

      return this;
    }
  }, {
    key: "toBw",
    value: function toBw(bw) {
      if (!bw) {
        bw = new Bw();
      }

      bw.write(this.blockHeader.toBuffer());
      bw.write(this.txsVi.buf);
      var txsNum = this.txsVi.toNumber();

      for (var i = 0; i < txsNum; i++) {
        this.txs[i].toBw(bw);
      }

      return bw;
    }
  }, {
    key: "hash",
    value: function hash() {
      return Hash.sha256Sha256(this.blockHeader.toBuffer());
    }
  }, {
    key: "asyncHash",
    value: function () {
      var _asyncHash2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee42() {
        var workersResult;
        return regeneratorRuntime.wrap(function _callee42$(_context44) {
          while (1) {
            switch (_context44.prev = _context44.next) {
              case 0:
                _context44.next = 2;
                return Workers.asyncObjectMethod(this, 'hash', []);

              case 2:
                workersResult = _context44.sent;
                return _context44.abrupt("return", workersResult.resbuf);

              case 4:
              case "end":
                return _context44.stop();
            }
          }
        }, _callee42, this);
      }));

      function asyncHash() {
        return _asyncHash2.apply(this, arguments);
      }

      return asyncHash;
    }()
  }, {
    key: "id",
    value: function id() {
      return new Br(this.hash()).readReverse().toString('hex');
    }
  }, {
    key: "asyncId",
    value: function () {
      var _asyncId2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee43() {
        var workersResult;
        return regeneratorRuntime.wrap(function _callee43$(_context45) {
          while (1) {
            switch (_context45.prev = _context45.next) {
              case 0:
                _context45.next = 2;
                return Workers.asyncObjectMethod(this, 'id', []);

              case 2:
                workersResult = _context45.sent;
                return _context45.abrupt("return", JSON.parse(workersResult.resbuf.toString()));

              case 4:
              case "end":
                return _context45.stop();
            }
          }
        }, _callee43, this);
      }));

      function asyncId() {
        return _asyncId2.apply(this, arguments);
      }

      return asyncId;
    }()
  }, {
    key: "verifyMerkleRoot",
    value: function verifyMerkleRoot() {
      var txsbufs = this.txs.map(function (tx) {
        return tx.toBuffer();
      });
      var merkleRootBuf = Merkle.fromBuffers(txsbufs).hash();
      return Buffer.compare(merkleRootBuf, this.blockHeader.merkleRootBuf);
    }
  }], [{
    key: "iterateTxs",
    value: function iterateTxs(blockBuf) {
      var br = new Br(blockBuf);
      var blockHeader = new BlockHeader().fromBr(br);
      var txsVi = new VarInt(br.readVarIntBuf());
      var txsNum = txsVi.toNumber();
      return _defineProperty({
        blockHeader: blockHeader,
        txsVi: txsVi,
        txsNum: txsNum
      }, Symbol.iterator, /*#__PURE__*/regeneratorRuntime.mark(function _callee44() {
        var i;
        return regeneratorRuntime.wrap(function _callee44$(_context46) {
          while (1) {
            switch (_context46.prev = _context46.next) {
              case 0:
                i = 0;

              case 1:
                if (!(i < txsNum)) {
                  _context46.next = 7;
                  break;
                }

                _context46.next = 4;
                return new Tx().fromBr(br);

              case 4:
                i++;
                _context46.next = 1;
                break;

              case 7:
              case "end":
                return _context46.stop();
            }
          }
        }, _callee44);
      }));
    }
  }]);

  return Block;
}(Struct);

exports.Block = Block;
Block.MAX_BLOCK_SIZE = 1000000;

var Interp = /*#__PURE__*/function (_Struct23) {
  _inherits(Interp, _Struct23);

  var _super32 = _createSuper(Interp);

  function Interp(script, tx, nIn) {
    var stack = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];
    var altStack = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : [];
    var pc = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 0;
    var pBeginCodeHash = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 0;
    var nOpCount = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : 0;
    var ifStack = arguments.length > 8 && arguments[8] !== undefined ? arguments[8] : [];
    var errStr = arguments.length > 9 && arguments[9] !== undefined ? arguments[9] : '';
    var flags = arguments.length > 10 && arguments[10] !== undefined ? arguments[10] : Interp.defaultFlags;
    var valueBn = arguments.length > 11 && arguments[11] !== undefined ? arguments[11] : new Bn(0);

    _classCallCheck(this, Interp);

    return _super32.call(this, {
      script: script,
      tx: tx,
      nIn: nIn,
      stack: stack,
      altStack: altStack,
      pc: pc,
      pBeginCodeHash: pBeginCodeHash,
      nOpCount: nOpCount,
      ifStack: ifStack,
      errStr: errStr,
      flags: flags,
      valueBn: valueBn
    });
  }

  _createClass(Interp, [{
    key: "initialize",
    value: function initialize() {
      this.stack = [];
      this.altStack = [];
      this.pc = 0;
      this.pBeginCodeHash = 0;
      this.nOpCount = 0;
      this.ifStack = [];
      this.errStr = '';
      this.flags = Interp.defaultFlags;
      return this;
    }
  }, {
    key: "fromJSON",
    value: function fromJSON(json) {
      this.fromJSONNoTx(json);
      this.tx = json.tx ? new Tx().fromJSON(json.tx) : undefined;
      return this;
    }
  }, {
    key: "fromJSONNoTx",
    value: function fromJSONNoTx(json) {
      this.fromObject({
        script: json.script !== undefined ? new Script().fromJSON(json.script) : undefined,
        nIn: json.nIn
      });
      this.stack = [];
      json.stack.forEach(function (hex) {
        this.stack.push(Buffer.from(hex, 'hex'));
      }.bind(this));
      this.altStack = [];
      json.altStack.forEach(function (hex) {
        this.altStack.push(Buffer.from(hex, 'hex'));
      }.bind(this));
      this.fromObject({
        pc: json.pc,
        pBeginCodeHash: json.pBeginCodeHash,
        nOpCount: json.nOpCount,
        ifStack: json.ifStack,
        errStr: json.errStr,
        flags: json.flags
      });
      return this;
    }
  }, {
    key: "fromBr",
    value: function fromBr(br) {
      var jsonNoTxBufLEn = br.readVarIntNum();
      var jsonNoTxBuf = br.read(jsonNoTxBufLEn);
      this.fromJSONNoTx(JSON.parse(jsonNoTxBuf.toString()));
      var txbuflen = br.readVarIntNum();

      if (txbuflen > 0) {
        var txbuf = br.read(txbuflen);
        this.tx = new Tx().fromFastBuffer(txbuf);
      }

      return this;
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      var json = this.toJSONNoTx();
      json.tx = this.tx ? this.tx.toJSON() : undefined;
      return json;
    }
  }, {
    key: "toJSONNoTx",
    value: function toJSONNoTx() {
      var stack = [];
      this.stack.forEach(function (buf) {
        stack.push(buf.toString('hex'));
      });
      var altStack = [];
      this.altStack.forEach(function (buf) {
        altStack.push(buf.toString('hex'));
      });
      return {
        script: this.script ? this.script.toJSON() : undefined,
        nIn: this.nIn,
        stack: stack,
        altStack: altStack,
        pc: this.pc,
        pBeginCodeHash: this.pBeginCodeHash,
        nOpCount: this.nOpCount,
        ifStack: this.ifStack,
        errStr: this.errStr,
        flags: this.flags
      };
    }
  }, {
    key: "toBw",
    value: function toBw(bw) {
      if (!bw) {
        bw = new Bw();
      }

      var jsonNoTxBuf = Buffer.from(JSON.stringify(this.toJSONNoTx()));
      bw.writeVarIntNum(jsonNoTxBuf.length);
      bw.write(jsonNoTxBuf);

      if (this.tx) {
        var txbuf = this.tx.toFastBuffer();
        bw.writeVarIntNum(txbuf.length);
        bw.write(txbuf);
      } else {
        bw.writeVarIntNum(0);
      }

      return bw;
    }
  }, {
    key: "checkSigEncoding",
    value: function checkSigEncoding(buf) {
      if (buf.length === 0) {
        return true;
      }

      if ((this.flags & (Interp.SCRIPT_VERIFY_DERSIG | Interp.SCRIPT_VERIFY_LOW_S | Interp.SCRIPT_VERIFY_STRICTENC)) !== 0 && !Sig.IsTxDer(buf)) {
        this.errStr = 'SCRIPT_ERR_SIG_DER';
        return false;
      } else if ((this.flags & Interp.SCRIPT_VERIFY_LOW_S) !== 0) {
        var sig = new Sig().fromTxFormat(buf);

        if (!sig.hasLowS()) {
          this.errStr = 'SCRIPT_ERR_SIG_DER';
          return false;
        }
      } else if ((this.flags & Interp.SCRIPT_VERIFY_STRICTENC) !== 0) {
        var _sig = new Sig().fromTxFormat(buf);

        if (!_sig.hasDefinedHashType()) {
          this.errStr = 'SCRIPT_ERR_SIG_HASHTYPE';
          return false;
        }
      }

      return true;
    }
  }, {
    key: "checkPubKeyEncoding",
    value: function checkPubKeyEncoding(buf) {
      if ((this.flags & Interp.SCRIPT_VERIFY_STRICTENC) !== 0 && !PubKey.isCompressedOrUncompressed(buf)) {
        this.errStr = 'SCRIPT_ERR_PUBKEYTYPE';
        return false;
      }

      return true;
    }
  }, {
    key: "checkLockTime",
    value: function checkLockTime(nLockTime) {
      if (!(this.tx.nLockTime < Interp.LOCKTIME_THRESHOLD && nLockTime < Interp.LOCKTIME_THRESHOLD || this.tx.nLockTime >= Interp.LOCKTIME_THRESHOLD && nLockTime >= Interp.LOCKTIME_THRESHOLD)) {
        return false;
      }

      if (nLockTime > this.tx.nLockTime) {
        return false;
      }

      if (TxIn.SEQUENCE_FINAL === this.tx.txIns[this.nIn].nSequence) {
        return false;
      }

      return true;
    }
  }, {
    key: "checkSequence",
    value: function checkSequence(nSequence) {
      var txToSequence = this.tx.txIns[this.nIn].nSequence;

      if (this.tx.versionBytesNum < 2) {
        return false;
      }

      if (txToSequence & TxIn.SEQUENCE_LOCKTIME_DISABLE_FLAG) {
        return false;
      }

      var nLockTimeMask = TxIn.SEQUENCE_LOCKTIME_TYPE_FLAG | TxIn.SEQUENCE_LOCKTIME_MASK;
      var txToSequenceMasked = txToSequence & nLockTimeMask;
      var nSequenceMasked = nSequence & nLockTimeMask;

      if (!(txToSequenceMasked < TxIn.SEQUENCE_LOCKTIME_TYPE_FLAG && nSequenceMasked < TxIn.SEQUENCE_LOCKTIME_TYPE_FLAG || txToSequenceMasked >= TxIn.SEQUENCE_LOCKTIME_TYPE_FLAG && nSequenceMasked >= TxIn.SEQUENCE_LOCKTIME_TYPE_FLAG)) {
        return false;
      }

      if (nSequenceMasked > txToSequenceMasked) {
        return false;
      }

      return true;
    }
  }, {
    key: "eval",
    value: /*#__PURE__*/regeneratorRuntime.mark(function _eval() {
      var fSuccess;
      return regeneratorRuntime.wrap(function _eval$(_context47) {
        while (1) {
          switch (_context47.prev = _context47.next) {
            case 0:
              if (!(this.script.toBuffer().length > 10000)) {
                _context47.next = 4;
                break;
              }

              this.errStr = 'SCRIPT_ERR_SCRIPT_SIZE';
              _context47.next = 4;
              return false;

            case 4:
              _context47.prev = 4;

            case 5:
              if (!(this.pc < this.script.chunks.length)) {
                _context47.next = 16;
                break;
              }

              fSuccess = this.step();

              if (fSuccess) {
                _context47.next = 12;
                break;
              }

              _context47.next = 10;
              return false;

            case 10:
              _context47.next = 14;
              break;

            case 12:
              _context47.next = 14;
              return fSuccess;

            case 14:
              _context47.next = 5;
              break;

            case 16:
              if (!(this.stack.length + this.altStack.length > 1000)) {
                _context47.next = 20;
                break;
              }

              this.errStr = 'SCRIPT_ERR_STACK_SIZE';
              _context47.next = 20;
              return false;

            case 20:
              _context47.next = 27;
              break;

            case 22:
              _context47.prev = 22;
              _context47.t0 = _context47["catch"](4);
              this.errStr = 'SCRIPT_ERR_UNKNOWN_ERROR: ' + _context47.t0;
              _context47.next = 27;
              return false;

            case 27:
              if (!(this.ifStack.length > 0)) {
                _context47.next = 31;
                break;
              }

              this.errStr = 'SCRIPT_ERR_UNBALANCED_CONDITIONAL';
              _context47.next = 31;
              return false;

            case 31:
              _context47.next = 33;
              return true;

            case 33:
            case "end":
              return _context47.stop();
          }
        }
      }, _eval, this, [[4, 22]]);
    })
  }, {
    key: "step",
    value: function step() {
      var fRequireMinimal = (this.flags & Interp.SCRIPT_VERIFY_MINIMALDATA) !== 0;
      var fExec = !(this.ifStack.indexOf(false) + 1);
      var chunk = this.script.chunks[this.pc];
      this.pc++;
      var opCodeNum = chunk.opCodeNum;

      if (opCodeNum === undefined) {
        this.errStr = 'SCRIPT_ERR_BAD_OPCODE';
        return false;
      }

      if (chunk.buf && chunk.buf.length > Interp.MAX_SCRIPT_ELEMENT_SIZE) {
        this.errStr = 'SCRIPT_ERR_PUSH_SIZE';
        return false;
      }

      if (opCodeNum > OpCode.OP_16 && ++this.nOpCount > 201) {
        this.errStr = 'SCRIPT_ERR_OP_COUNT';
        return false;
      }

      if (opCodeNum === OpCode.OP_CAT || opCodeNum === OpCode.OP_SUBSTR || opCodeNum === OpCode.OP_LEFT || opCodeNum === OpCode.OP_RIGHT || opCodeNum === OpCode.OP_INVERT || opCodeNum === OpCode.OP_AND || opCodeNum === OpCode.OP_OR || opCodeNum === OpCode.OP_XOR || opCodeNum === OpCode.OP_2MUL || opCodeNum === OpCode.OP_2DIV || opCodeNum === OpCode.OP_MUL || opCodeNum === OpCode.OP_DIV || opCodeNum === OpCode.OP_MOD || opCodeNum === OpCode.OP_LSHIFT || opCodeNum === OpCode.OP_RSHIFT) {
        this.errStr = 'SCRIPT_ERR_DISABLED_OPCODE';
        return false;
      }

      if (fExec && opCodeNum >= 0 && opCodeNum <= OpCode.OP_PUSHDATA4) {
        if (fRequireMinimal && !this.script.checkMinimalPush(this.pc - 1)) {
          this.errStr = 'SCRIPT_ERR_MINIMALDATA';
          return false;
        }

        if (!chunk.buf) {
          this.stack.push(Interp.false);
        } else if (chunk.len !== chunk.buf.length) {
          throw new Error('LEngth of push value not equal to length of data');
        } else {
          this.stack.push(chunk.buf);
        }
      } else if (fExec || OpCode.OP_IF <= opCodeNum && opCodeNum <= OpCode.OP_ENDIF) {
        switch (opCodeNum) {
          case OpCode.OP_1NEGATE:
          case OpCode.OP_1:
          case OpCode.OP_2:
          case OpCode.OP_3:
          case OpCode.OP_4:
          case OpCode.OP_5:
          case OpCode.OP_6:
          case OpCode.OP_7:
          case OpCode.OP_8:
          case OpCode.OP_9:
          case OpCode.OP_10:
          case OpCode.OP_11:
          case OpCode.OP_12:
          case OpCode.OP_13:
          case OpCode.OP_14:
          case OpCode.OP_15:
          case OpCode.OP_16:
            {
              var n = opCodeNum - (OpCode.OP_1 - 1);
              var buf = new Bn(n).toScriptNumBuffer();
              this.stack.push(buf);
            }
            break;

          case OpCode.OP_NOP:
            break;

          case OpCode.OP_CHECKLOCKTIMEVERIFY:
            {
              if (!(this.flags & Interp.SCRIPT_VERIFY_CHECKLOCKTIMEVERIFY)) {
                if (this.flags & Interp.SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_NOPS) {
                  this.errStr = 'SCRIPT_ERR_DISCOURAGE_UPGRADABLE_NOPS';
                  return false;
                }

                break;
              }

              if (this.stack.length < 1) {
                this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                return false;
              }

              var nLockTimebuf = this.stack[this.stack.length - 1];
              var nLockTimebn = new Bn().fromScriptNumBuffer(nLockTimebuf, fRequireMinimal, 5);
              var nLockTime = nLockTimebn.toNumber();

              if (nLockTime < 0) {
                this.errStr = 'SCRIPT_ERR_NEGATIVE_LOCKTIME';
                return false;
              }

              if (!this.checkLockTime(nLockTime)) {
                this.errStr = 'SCRIPT_ERR_UNSATISFIED_LOCKTIME';
                return false;
              }
            }
            break;

          case OpCode.OP_CHECKSEQUENCEVERIFY:
            {
              if (!(this.flags & Interp.SCRIPT_VERIFY_CHECKSEQUENCEVERIFY)) {
                if (this.flags & Interp.SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_NOPS) {
                  this.errStr = 'SCRIPT_ERR_DISCOURAGE_UPGRADABLE_NOPS';
                  return false;
                }

                break;
              }

              if (this.stack.length < 1) {
                this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                return false;
              }

              var nSequencebuf = this.stack[this.stack.length - 1];
              var nSequencebn = new Bn().fromScriptNumBuffer(nSequencebuf, fRequireMinimal, 5);
              var nSequence = nSequencebn.toNumber();

              if (nSequence < 0) {
                this.errStr = 'SCRIPT_ERR_NEGATIVE_LOCKTIME';
                return false;
              }

              if ((nSequence & TxIn.SEQUENCE_LOCKTIME_DISABLE_FLAG) !== 0) {
                break;
              }

              if (!this.checkSequence(nSequence)) {
                this.errStr = 'SCRIPT_ERR_UNSATISFIED_LOCKTIME';
                return false;
              }
            }
            break;

          case OpCode.OP_NOP1:
          case OpCode.OP_NOP3:
          case OpCode.OP_NOP4:
          case OpCode.OP_NOP5:
          case OpCode.OP_NOP6:
          case OpCode.OP_NOP7:
          case OpCode.OP_NOP8:
          case OpCode.OP_NOP9:
          case OpCode.OP_NOP10:
            if (this.flags & Interp.SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_NOPS) {
              this.errStr = 'SCRIPT_ERR_DISCOURAGE_UPGRADABLE_NOPS';
              return false;
            }

            break;

          case OpCode.OP_IF:
          case OpCode.OP_NOTIF:
            {
              var fValue = false;

              if (fExec) {
                if (this.stack.length < 1) {
                  this.errStr = 'SCRIPT_ERR_UNBALANCED_CONDITIONAL';
                  return false;
                }

                var _buf2 = this.stack.pop();

                fValue = Interp.castToBool(_buf2);

                if (opCodeNum === OpCode.OP_NOTIF) {
                  fValue = !fValue;
                }
              }

              this.ifStack.push(fValue);
            }
            break;

          case OpCode.OP_ELSE:
            if (this.ifStack.length === 0) {
              this.errStr = 'SCRIPT_ERR_UNBALANCED_CONDITIONAL';
              return false;
            }

            this.ifStack[this.ifStack.length - 1] = !this.ifStack[this.ifStack.length - 1];
            break;

          case OpCode.OP_ENDIF:
            if (this.ifStack.length === 0) {
              this.errStr = 'SCRIPT_ERR_UNBALANCED_CONDITIONAL';
              return false;
            }

            this.ifStack.pop();
            break;

          case OpCode.OP_VERIFY:
            {
              if (this.stack.length < 1) {
                this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                return false;
              }

              var _buf3 = this.stack[this.stack.length - 1];

              var _fValue = Interp.castToBool(_buf3);

              if (_fValue) {
                this.stack.pop();
              } else {
                this.errStr = 'SCRIPT_ERR_VERIFY';
                return false;
              }
            }
            break;

          case OpCode.OP_RETURN:
            {
              this.errStr = 'SCRIPT_ERR_OP_RETURN';
              return false;
            }

          case OpCode.OP_TOALTSTACK:
            if (this.stack.length < 1) {
              this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
              return false;
            }

            this.altStack.push(this.stack.pop());
            break;

          case OpCode.OP_FROMALTSTACK:
            if (this.altStack.length < 1) {
              this.errStr = 'SCRIPT_ERR_INVALID_ALTSTACK_OPERATION';
              return false;
            }

            this.stack.push(this.altStack.pop());
            break;

          case OpCode.OP_2DROP:
            if (this.stack.length < 2) {
              this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
              return false;
            }

            this.stack.pop();
            this.stack.pop();
            break;

          case OpCode.OP_2DUP:
            {
              if (this.stack.length < 2) {
                this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                return false;
              }

              var buf1 = this.stack[this.stack.length - 2];
              var buf2 = this.stack[this.stack.length - 1];
              this.stack.push(buf1);
              this.stack.push(buf2);
            }
            break;

          case OpCode.OP_3DUP:
            {
              if (this.stack.length < 3) {
                this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                return false;
              }

              var _buf4 = this.stack[this.stack.length - 3];
              var _buf5 = this.stack[this.stack.length - 2];
              var buf3 = this.stack[this.stack.length - 1];
              this.stack.push(_buf4);
              this.stack.push(_buf5);
              this.stack.push(buf3);
            }
            break;

          case OpCode.OP_2OVER:
            {
              if (this.stack.length < 4) {
                this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                return false;
              }

              var _buf6 = this.stack[this.stack.length - 4];
              var _buf7 = this.stack[this.stack.length - 3];
              this.stack.push(_buf6);
              this.stack.push(_buf7);
            }
            break;

          case OpCode.OP_2ROT:
            {
              if (this.stack.length < 6) {
                this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                return false;
              }

              var spliced = this.stack.splice(this.stack.length - 6, 2);
              this.stack.push(spliced[0]);
              this.stack.push(spliced[1]);
            }
            break;

          case OpCode.OP_2SWAP:
            {
              if (this.stack.length < 4) {
                this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                return false;
              }

              var _spliced = this.stack.splice(this.stack.length - 4, 2);

              this.stack.push(_spliced[0]);
              this.stack.push(_spliced[1]);
            }
            break;

          case OpCode.OP_IFDUP:
            {
              if (this.stack.length < 1) {
                this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                return false;
              }

              var _buf8 = this.stack[this.stack.length - 1];

              var _fValue2 = Interp.castToBool(_buf8);

              if (_fValue2) {
                this.stack.push(_buf8);
              }
            }
            break;

          case OpCode.OP_DEPTH:
            {
              var _buf9 = new Bn(this.stack.length).toScriptNumBuffer();

              this.stack.push(_buf9);
            }
            break;

          case OpCode.OP_DROP:
            if (this.stack.length < 1) {
              this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
              return false;
            }

            this.stack.pop();
            break;

          case OpCode.OP_DUP:
            if (this.stack.length < 1) {
              this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
              return false;
            }

            this.stack.push(this.stack[this.stack.length - 1]);
            break;

          case OpCode.OP_NIP:
            if (this.stack.length < 2) {
              this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
              return false;
            }

            this.stack.splice(this.stack.length - 2, 1);
            break;

          case OpCode.OP_OVER:
            if (this.stack.length < 2) {
              this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
              return false;
            }

            this.stack.push(this.stack[this.stack.length - 2]);
            break;

          case OpCode.OP_PICK:
          case OpCode.OP_ROLL:
            {
              if (this.stack.length < 2) {
                this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                return false;
              }

              var _buf10 = this.stack[this.stack.length - 1];
              var bn = new Bn().fromScriptNumBuffer(_buf10, fRequireMinimal);

              var _n = bn.toNumber();

              this.stack.pop();

              if (_n < 0 || _n >= this.stack.length) {
                this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                return false;
              }

              _buf10 = this.stack[this.stack.length - _n - 1];

              if (opCodeNum === OpCode.OP_ROLL) {
                this.stack.splice(this.stack.length - _n - 1, 1);
              }

              this.stack.push(_buf10);
            }
            break;

          case OpCode.OP_ROT:
            {
              if (this.stack.length < 3) {
                this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                return false;
              }

              var x1 = this.stack[this.stack.length - 3];
              var x2 = this.stack[this.stack.length - 2];
              var x3 = this.stack[this.stack.length - 1];
              this.stack[this.stack.length - 3] = x2;
              this.stack[this.stack.length - 2] = x3;
              this.stack[this.stack.length - 1] = x1;
            }
            break;

          case OpCode.OP_SWAP:
            {
              if (this.stack.length < 2) {
                this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                return false;
              }

              var _x56 = this.stack[this.stack.length - 2];
              var _x57 = this.stack[this.stack.length - 1];
              this.stack[this.stack.length - 2] = _x57;
              this.stack[this.stack.length - 1] = _x56;
            }
            break;

          case OpCode.OP_TUCK:
            if (this.stack.length < 2) {
              this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
              return false;
            }

            this.stack.splice(this.stack.length - 2, 0, this.stack[this.stack.length - 1]);
            break;

          case OpCode.OP_SIZE:
            {
              if (this.stack.length < 1) {
                this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                return false;
              }

              var _bn2 = new Bn(this.stack[this.stack.length - 1].length);

              this.stack.push(_bn2.toScriptNumBuffer());
            }
            break;

          case OpCode.OP_EQUAL:
          case OpCode.OP_EQUALVERIFY:
            {
              if (this.stack.length < 2) {
                this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                return false;
              }

              var _buf11 = this.stack[this.stack.length - 2];
              var _buf12 = this.stack[this.stack.length - 1];
              var fEqual = cmp(_buf11, _buf12);
              this.stack.pop();
              this.stack.pop();
              this.stack.push(fEqual ? Interp.true : Interp.false);

              if (opCodeNum === OpCode.OP_EQUALVERIFY) {
                if (fEqual) {
                  this.stack.pop();
                } else {
                  this.errStr = 'SCRIPT_ERR_EQUALVERIFY';
                  return false;
                }
              }
            }
            break;

          case OpCode.OP_1ADD:
          case OpCode.OP_1SUB:
          case OpCode.OP_NEGATE:
          case OpCode.OP_ABS:
          case OpCode.OP_NOT:
          case OpCode.OP_0NOTEQUAL:
            {
              if (this.stack.length < 1) {
                this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                return false;
              }

              var _buf13 = this.stack[this.stack.length - 1];

              var _bn3 = new Bn().fromScriptNumBuffer(_buf13, fRequireMinimal);

              switch (opCodeNum) {
                case OpCode.OP_1ADD:
                  _bn3 = _bn3.add(1);
                  break;

                case OpCode.OP_1SUB:
                  _bn3 = _bn3.sub(1);
                  break;

                case OpCode.OP_NEGATE:
                  _bn3 = _bn3.neg();
                  break;

                case OpCode.OP_ABS:
                  if (_bn3.lt(0)) _bn3 = _bn3.neg();
                  break;

                case OpCode.OP_NOT:
                  _bn3 = new Bn(_bn3.eq(0) + 0);
                  break;

                case OpCode.OP_0NOTEQUAL:
                  _bn3 = new Bn(_bn3.neq(0) + 0);
                  break;
              }

              this.stack.pop();
              this.stack.push(_bn3.toScriptNumBuffer());
            }
            break;

          case OpCode.OP_ADD:
          case OpCode.OP_SUB:
          case OpCode.OP_BOOLAND:
          case OpCode.OP_BOOLOR:
          case OpCode.OP_NUMEQUAL:
          case OpCode.OP_NUMEQUALVERIFY:
          case OpCode.OP_NUMNOTEQUAL:
          case OpCode.OP_LESSTHAN:
          case OpCode.OP_GREATERTHAN:
          case OpCode.OP_LESSTHANOREQUAL:
          case OpCode.OP_GREATERTHANOREQUAL:
          case OpCode.OP_MIN:
          case OpCode.OP_MAX:
            {
              if (this.stack.length < 2) {
                this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                return false;
              }

              var bn1 = new Bn().fromScriptNumBuffer(this.stack[this.stack.length - 2], fRequireMinimal);
              var bn2 = new Bn().fromScriptNumBuffer(this.stack[this.stack.length - 1], fRequireMinimal);

              var _bn4 = new Bn(0);

              switch (opCodeNum) {
                case OpCode.OP_ADD:
                  _bn4 = bn1.add(bn2);
                  break;

                case OpCode.OP_SUB:
                  _bn4 = bn1.sub(bn2);
                  break;

                case OpCode.OP_BOOLAND:
                  _bn4 = new Bn((bn1.neq(0) && bn2.neq(0)) + 0);
                  break;

                case OpCode.OP_BOOLOR:
                  _bn4 = new Bn((bn1.neq(0) || bn2.neq(0)) + 0);
                  break;

                case OpCode.OP_NUMEQUAL:
                  _bn4 = new Bn(bn1.eq(bn2) + 0);
                  break;

                case OpCode.OP_NUMEQUALVERIFY:
                  _bn4 = new Bn(bn1.eq(bn2) + 0);
                  break;

                case OpCode.OP_NUMNOTEQUAL:
                  _bn4 = new Bn(bn1.neq(bn2) + 0);
                  break;

                case OpCode.OP_LESSTHAN:
                  _bn4 = new Bn(bn1.lt(bn2) + 0);
                  break;

                case OpCode.OP_GREATERTHAN:
                  _bn4 = new Bn(bn1.gt(bn2) + 0);
                  break;

                case OpCode.OP_LESSTHANOREQUAL:
                  _bn4 = new Bn(bn1.leq(bn2) + 0);
                  break;

                case OpCode.OP_GREATERTHANOREQUAL:
                  _bn4 = new Bn(bn1.geq(bn2) + 0);
                  break;

                case OpCode.OP_MIN:
                  _bn4 = bn1.lt(bn2) ? bn1 : bn2;
                  break;

                case OpCode.OP_MAX:
                  _bn4 = bn1.gt(bn2) ? bn1 : bn2;
                  break;
              }

              this.stack.pop();
              this.stack.pop();
              this.stack.push(_bn4.toScriptNumBuffer());

              if (opCodeNum === OpCode.OP_NUMEQUALVERIFY) {
                if (Interp.castToBool(this.stack[this.stack.length - 1])) {
                  this.stack.pop();
                } else {
                  this.errStr = 'SCRIPT_ERR_NUMEQUALVERIFY';
                  return false;
                }
              }
            }
            break;

          case OpCode.OP_WITHIN:
            {
              if (this.stack.length < 3) {
                this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                return false;
              }

              var _bn5 = new Bn().fromScriptNumBuffer(this.stack[this.stack.length - 3], fRequireMinimal);

              var _bn6 = new Bn().fromScriptNumBuffer(this.stack[this.stack.length - 2], fRequireMinimal);

              var bn3 = new Bn().fromScriptNumBuffer(this.stack[this.stack.length - 1], fRequireMinimal);

              var _fValue3 = _bn6.leq(_bn5) && _bn5.lt(bn3);

              this.stack.pop();
              this.stack.pop();
              this.stack.pop();
              this.stack.push(_fValue3 ? Interp.true : Interp.false);
            }
            break;

          case OpCode.OP_RIPEMD160:
          case OpCode.OP_SHA1:
          case OpCode.OP_SHA256:
          case OpCode.OP_HASH160:
          case OpCode.OP_HASH256:
            {
              if (this.stack.length < 1) {
                this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                return false;
              }

              var _buf14 = this.stack[this.stack.length - 1];
              var bufHash;

              if (opCodeNum === OpCode.OP_RIPEMD160) {
                bufHash = Hash.ripemd160(_buf14);
              } else if (opCodeNum === OpCode.OP_SHA1) {
                bufHash = Hash.sha1(_buf14);
              } else if (opCodeNum === OpCode.OP_SHA256) {
                bufHash = Hash.sha256(_buf14);
              } else if (opCodeNum === OpCode.OP_HASH160) {
                bufHash = Hash.sha256Ripemd160(_buf14);
              } else if (opCodeNum === OpCode.OP_HASH256) {
                bufHash = Hash.sha256Sha256(_buf14);
              }

              this.stack.pop();
              this.stack.push(bufHash);
            }
            break;

          case OpCode.OP_CODESEPARATOR:
            this.pBeginCodeHash = this.pc;
            break;

          case OpCode.OP_CHECKSIG:
          case OpCode.OP_CHECKSIGVERIFY:
            {
              if (this.stack.length < 2) {
                this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                return false;
              }

              var bufSig = this.stack[this.stack.length - 2];
              var bufPubKey = this.stack[this.stack.length - 1];
              var subScript = new Script().fromObject({
                chunks: this.script.chunks.slice(this.pBeginCodeHash)
              });
              var nHashType = bufSig.length > 0 ? bufSig.readUInt8(bufSig.length - 1) : 0;

              if (nHashType & Sig.SIGHASH_FORKID) {
                if (!(this.flags & Interp.SCRIPT_ENABLE_SIGHASH_FORKID)) {
                  this.errStr = 'SCRIPT_ERR_ILLEGAL_FORKID';
                  return false;
                }
              } else {
                subScript.findAndDelete(new Script().writeBuffer(bufSig));
              }

              if (!this.checkSigEncoding(bufSig) || !this.checkPubKeyEncoding(bufPubKey)) {
                return false;
              }

              var fSuccess;

              try {
                var sig = new Sig().fromTxFormat(bufSig);
                var pubKey = new PubKey().fromBuffer(bufPubKey, false);
                fSuccess = this.tx.verify(sig, pubKey, this.nIn, subScript, Boolean(this.flags & Interp.SCRIPT_VERIFY_LOW_S), this.valueBn, this.flags);
              } catch (e) {
                fSuccess = false;
              }

              this.stack.pop();
              this.stack.pop();
              this.stack.push(fSuccess ? Interp.true : Interp.false);

              if (opCodeNum === OpCode.OP_CHECKSIGVERIFY) {
                if (fSuccess) {
                  this.stack.pop();
                } else {
                  this.errStr = 'SCRIPT_ERR_CHECKSIGVERIFY';
                  return false;
                }
              }
            }
            break;

          case OpCode.OP_CHECKMULTISIG:
          case OpCode.OP_CHECKMULTISIGVERIFY:
            {
              var i = 1;

              if (this.stack.length < i) {
                this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                return false;
              }

              var nKeysCount = new Bn().fromScriptNumBuffer(this.stack[this.stack.length - i], fRequireMinimal).toNumber();

              if (nKeysCount < 0 || nKeysCount > 20) {
                this.errStr = 'SCRIPT_ERR_PUBKEY_COUNT';
                return false;
              }

              this.nOpCount += nKeysCount;

              if (this.nOpCount > 201) {
                this.errStr = 'SCRIPT_ERR_OP_COUNT';
                return false;
              }

              var ikey = ++i;
              i += nKeysCount;

              if (this.stack.length < i) {
                this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                return false;
              }

              var nSigsCount = new Bn().fromScriptNumBuffer(this.stack[this.stack.length - i], fRequireMinimal).toNumber();

              if (nSigsCount < 0 || nSigsCount > nKeysCount) {
                this.errStr = 'SCRIPT_ERR_SIG_COUNT';
                return false;
              }

              var isig = ++i;
              i += nSigsCount;

              if (this.stack.length < i) {
                this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                return false;
              }

              var _subScript = new Script().fromObject({
                chunks: this.script.chunks.slice(this.pBeginCodeHash)
              });

              for (var k = 0; k < nSigsCount; k++) {
                var _bufSig = this.stack[this.stack.length - isig - k];

                var _nHashType = _bufSig.length > 0 ? _bufSig.readUInt8(_bufSig.length - 1) : 0;

                if (_nHashType & Sig.SIGHASH_FORKID) {
                  if (!(this.flags & Interp.SCRIPT_ENABLE_SIGHASH_FORKID)) {
                    this.errStr = 'SCRIPT_ERR_ILLEGAL_FORKID';
                    return false;
                  }
                } else {
                  _subScript.findAndDelete(new Script().writeBuffer(_bufSig));
                }
              }

              var _fSuccess = true;

              while (_fSuccess && nSigsCount > 0) {
                var _bufSig2 = this.stack[this.stack.length - isig];
                var _bufPubKey = this.stack[this.stack.length - ikey];

                if (!this.checkSigEncoding(_bufSig2) || !this.checkPubKeyEncoding(_bufPubKey)) {
                  return false;
                }

                var fOk = void 0;

                try {
                  var _sig2 = new Sig().fromTxFormat(_bufSig2);

                  var _pubKey = new PubKey().fromBuffer(_bufPubKey, false);

                  fOk = this.tx.verify(_sig2, _pubKey, this.nIn, _subScript, Boolean(this.flags & Interp.SCRIPT_VERIFY_LOW_S), this.valueBn, this.flags);
                } catch (e) {
                  fOk = false;
                }

                if (fOk) {
                  isig++;
                  nSigsCount--;
                }

                ikey++;
                nKeysCount--;

                if (nSigsCount > nKeysCount) {
                  _fSuccess = false;
                }
              }

              while (i-- > 1) {
                this.stack.pop();
              }

              if (this.stack.length < 1) {
                this.errStr = 'SCRIPT_ERR_INVALID_STACK_OPERATION';
                return false;
              }

              if (this.flags & Interp.SCRIPT_VERIFY_NULLDUMMY && this.stack[this.stack.length - 1].length) {
                this.errStr = 'SCRIPT_ERR_SIG_NULLDUMMY';
                return false;
              }

              this.stack.pop();
              this.stack.push(_fSuccess ? Interp.true : Interp.false);

              if (opCodeNum === OpCode.OP_CHECKMULTISIGVERIFY) {
                if (_fSuccess) {
                  this.stack.pop();
                } else {
                  this.errStr = 'SCRIPT_ERR_CHECKMULTISIGVERIFY';
                  return false;
                }
              }
            }
            break;

          default:
            this.errStr = 'SCRIPT_ERR_BAD_OPCODE';
            return false;
        }
      }

      return true;
    }
  }, {
    key: "verify",
    value: function verify(scriptSig, scriptPubKey, tx, nIn, flags, valueBn) {
      var results = this.results(scriptSig, scriptPubKey, tx, nIn, flags, valueBn);

      var _iterator = _createForOfIteratorHelper(results),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var success = _step.value;

          if (!success) {
            return false;
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }

      return true;
    }
  }, {
    key: "results",
    value: /*#__PURE__*/regeneratorRuntime.mark(function results(scriptSig, scriptPubKey, tx, nIn, flags, valueBn) {
      var stackCopy, stack, buf, tmp, pubKeySerialized, scriptPubKey2;
      return regeneratorRuntime.wrap(function results$(_context48) {
        while (1) {
          switch (_context48.prev = _context48.next) {
            case 0:
              this.fromObject({
                script: scriptSig,
                tx: tx,
                nIn: nIn,
                flags: flags,
                valueBn: valueBn
              });

              if (!((flags & Interp.SCRIPT_VERIFY_SIGPUSHONLY) !== 0 && !scriptSig.isPushOnly())) {
                _context48.next = 5;
                break;
              }

              this.errStr = this.errStr || 'SCRIPT_ERR_SIG_PUSHONLY';
              _context48.next = 5;
              return false;

            case 5:
              return _context48.delegateYield(this.eval(), "t0", 6);

            case 6:
              if (flags & Interp.SCRIPT_VERIFY_P2SH) {
                stackCopy = this.stack.slice();
              }

              stack = this.stack;
              this.initialize();
              this.fromObject({
                script: scriptPubKey,
                stack: stack,
                tx: tx,
                nIn: nIn,
                flags: flags,
                valueBn: valueBn
              });
              return _context48.delegateYield(this.eval(), "t1", 11);

            case 11:
              if (!(this.stack.length === 0)) {
                _context48.next = 15;
                break;
              }

              this.errStr = this.errStr || 'SCRIPT_ERR_EVAL_FALSE';
              _context48.next = 15;
              return false;

            case 15:
              buf = this.stack[this.stack.length - 1];

              if (Interp.castToBool(buf)) {
                _context48.next = 20;
                break;
              }

              this.errStr = this.errStr || 'SCRIPT_ERR_EVAL_FALSE';
              _context48.next = 20;
              return false;

            case 20:
              if (!(flags & Interp.SCRIPT_VERIFY_P2SH && scriptPubKey.isScriptHashOut())) {
                _context48.next = 48;
                break;
              }

              if (scriptSig.isPushOnly()) {
                _context48.next = 25;
                break;
              }

              this.errStr = this.errStr || 'SCRIPT_ERR_SIG_PUSHONLY';
              _context48.next = 25;
              return false;

            case 25:
              tmp = stack;
              stack = stackCopy;
              stackCopy = tmp;

              if (!(stack.length === 0)) {
                _context48.next = 30;
                break;
              }

              throw new Error('internal error - stack copy empty');

            case 30:
              pubKeySerialized = stack[stack.length - 1];
              scriptPubKey2 = new Script().fromBuffer(pubKeySerialized);
              stack.pop();
              this.initialize();
              this.fromObject({
                script: scriptPubKey2,
                stack: stack,
                tx: tx,
                nIn: nIn,
                flags: flags,
                valueBn: valueBn
              });
              return _context48.delegateYield(this.eval(), "t2", 36);

            case 36:
              if (!(stack.length === 0)) {
                _context48.next = 40;
                break;
              }

              this.errStr = this.errStr || 'SCRIPT_ERR_EVAL_FALSE';
              _context48.next = 40;
              return false;

            case 40:
              if (Interp.castToBool(stack[stack.length - 1])) {
                _context48.next = 46;
                break;
              }

              this.errStr = this.errStr || 'SCRIPT_ERR_EVAL_FALSE';
              _context48.next = 44;
              return false;

            case 44:
              _context48.next = 48;
              break;

            case 46:
              _context48.next = 48;
              return true;

            case 48:
              if (!((flags & Interp.SCRIPT_VERIFY_CLEANSTACK) !== 0)) {
                _context48.next = 55;
                break;
              }

              if (flags & Interp.SCRIPT_VERIFY_P2SH) {
                _context48.next = 51;
                break;
              }

              throw new Error('cannot use CLEANSTACK without P2SH');

            case 51:
              if (!(stack.length !== 1)) {
                _context48.next = 55;
                break;
              }

              this.errStr = this.errStr || 'SCRIPT_ERR_CLEANSTACK';
              _context48.next = 55;
              return false;

            case 55:
              _context48.next = 57;
              return true;

            case 57:
            case "end":
              return _context48.stop();
          }
        }
      }, results, this);
    })
  }, {
    key: "getDebugObject",
    value: function getDebugObject() {
      var pc = this.pc - 1;
      return {
        errStr: this.errStr,
        scriptStr: this.script ? this.script.toString() : 'no script found',
        pc: pc,
        stack: this.stack.map(function (buf) {
          return buf.toString('hex');
        }),
        altStack: this.altStack.map(function (buf) {
          return buf.toString('hex');
        }),
        opCodeStr: this.script ? OpCode.fromNumber(this.script.chunks[pc].opCodeNum).toString() : 'no script found'
      };
    }
  }, {
    key: "getDebugString",
    value: function getDebugString() {
      return JSON.stringify(this.getDebugObject(), null, 2);
    }
  }], [{
    key: "getFlags",
    value: function getFlags(flagstr) {
      var flags = 0;

      if (flagstr.indexOf('NONE') !== -1) {
        flags = flags | Interp.SCRIPT_VERIFY_NONE;
      }

      if (flagstr.indexOf('P2SH') !== -1) {
        flags = flags | Interp.SCRIPT_VERIFY_P2SH;
      }

      if (flagstr.indexOf('STRICTENC') !== -1) {
        flags = flags | Interp.SCRIPT_VERIFY_STRICTENC;
      }

      if (flagstr.indexOf('DERSIG') !== -1) {
        flags = flags | Interp.SCRIPT_VERIFY_DERSIG;
      }

      if (flagstr.indexOf('LOW_S') !== -1) {
        flags = flags | Interp.SCRIPT_VERIFY_LOW_S;
      }

      if (flagstr.indexOf('NULLDUMMY') !== -1) {
        flags = flags | Interp.SCRIPT_VERIFY_NULLDUMMY;
      }

      if (flagstr.indexOf('SIGPUSHONLY') !== -1) {
        flags = flags | Interp.SCRIPT_VERIFY_SIGPUSHONLY;
      }

      if (flagstr.indexOf('MINIMALDATA') !== -1) {
        flags = flags | Interp.SCRIPT_VERIFY_MINIMALDATA;
      }

      if (flagstr.indexOf('DISCOURAGE_UPGRADABLE_NOPS') !== -1) {
        flags = flags | Interp.SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_NOPS;
      }

      if (flagstr.indexOf('CLEANSTACK') !== -1) {
        flags = flags | Interp.SCRIPT_VERIFY_CLEANSTACK;
      }

      if (flagstr.indexOf('CHECKLOCKTIMEVERIFY') !== -1) {
        flags = flags | Interp.SCRIPT_VERIFY_CHECKLOCKTIMEVERIFY;
      }

      if (flagstr.indexOf('CHECKSEQUENCEVERIFY') !== -1) {
        flags = flags | Interp.SCRIPT_VERIFY_CHECKSEQUENCEVERIFY;
      }

      if (flagstr.indexOf('SIGHASH_FORKID') !== -1) {
        flags = flags | Interp.SCRIPT_ENABLE_SIGHASH_FORKID;
      }

      return flags;
    }
  }, {
    key: "castToBool",
    value: function castToBool(buf) {
      for (var i = 0; i < buf.length; i++) {
        if (buf[i] !== 0) {
          if (i === buf.length - 1 && buf[i] === 0x80) {
            return false;
          }

          return true;
        }
      }

      return false;
    }
  }]);

  return Interp;
}(Struct);

exports.Interp = Interp;
Interp.true = Buffer.from([1]);
Interp.false = Buffer.from([]);
Interp.MAX_SCRIPT_ELEMENT_SIZE = 520;
Interp.LOCKTIME_THRESHOLD = 500000000;
Interp.SCRIPT_VERIFY_NONE = 0;
Interp.SCRIPT_VERIFY_P2SH = 1 << 0;
Interp.SCRIPT_VERIFY_STRICTENC = 1 << 1;
Interp.SCRIPT_VERIFY_DERSIG = 1 << 2;
Interp.SCRIPT_VERIFY_LOW_S = 1 << 3;
Interp.SCRIPT_VERIFY_NULLDUMMY = 1 << 4;
Interp.SCRIPT_VERIFY_SIGPUSHONLY = 1 << 5;
Interp.SCRIPT_VERIFY_MINIMALDATA = 1 << 6;
Interp.SCRIPT_VERIFY_DISCOURAGE_UPGRADABLE_NOPS = 1 << 7;
Interp.SCRIPT_VERIFY_CLEANSTACK = 1 << 8;
Interp.SCRIPT_VERIFY_CHECKLOCKTIMEVERIFY = 1 << 9;
Interp.SCRIPT_VERIFY_CHECKSEQUENCEVERIFY = 1 << 10;
Interp.SCRIPT_ENABLE_SIGHASH_FORKID = 1 << 16;
Interp.defaultFlags = Interp.SCRIPT_VERIFY_P2SH | Interp.SCRIPT_VERIFY_CHECKLOCKTIMEVERIFY;

var SigOperations = /*#__PURE__*/function (_Struct24) {
  _inherits(SigOperations, _Struct24);

  var _super33 = _createSuper(SigOperations);

  function SigOperations() {
    var map = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new Map();

    _classCallCheck(this, SigOperations);

    return _super33.call(this, {
      map: map
    });
  }

  _createClass(SigOperations, [{
    key: "toJSON",
    value: function toJSON() {
      var json = {};
      this.map.forEach(function (arr, label) {
        json[label] = arr.map(function (obj) {
          return {
            nScriptChunk: obj.nScriptChunk,
            type: obj.type,
            addressStr: obj.addressStr,
            nHashType: obj.nHashType,
            log: obj.log
          };
        });
      });
      return json;
    }
  }, {
    key: "fromJSON",
    value: function fromJSON(json) {
      var _this17 = this;

      Object.keys(json).forEach(function (label) {
        _this17.map.set(label, json[label].map(function (obj) {
          return {
            nScriptChunk: obj.nScriptChunk,
            type: obj.type,
            addressStr: obj.addressStr,
            nHashType: obj.nHashType,
            log: obj.log
          };
        }));
      });
      return this;
    }
  }, {
    key: "setOne",
    value: function setOne(txHashBuf, txOutNum, nScriptChunk) {
      var type = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'sig';
      var addressStr = arguments.length > 4 ? arguments[4] : undefined;
      var nHashType = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID;
      var label = txHashBuf.toString('hex') + ':' + txOutNum;
      var obj = {
        nScriptChunk: nScriptChunk,
        type: type,
        addressStr: addressStr,
        nHashType: nHashType
      };
      this.map.set(label, [obj]);
      return this;
    }
  }, {
    key: "setMany",
    value: function setMany(txHashBuf, txOutNum, arr) {
      var label = txHashBuf.toString('hex') + ':' + txOutNum;
      arr = arr.map(function (obj) {
        return {
          type: obj.type || 'sig',
          nHashType: obj.nHashType || Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID,
          ...obj
        };
      });
      this.map.set(label, arr);
      return this;
    }
  }, {
    key: "addOne",
    value: function addOne(txHashBuf, txOutNum, nScriptChunk) {
      var type = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'sig';
      var addressStr = arguments.length > 4 ? arguments[4] : undefined;
      var nHashType = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID;
      var arr = this.get(txHashBuf, txOutNum) || [];
      arr.push({
        nScriptChunk: nScriptChunk,
        type: type,
        addressStr: addressStr,
        nHashType: nHashType
      });
      this.setMany(txHashBuf, txOutNum, arr);
      return this;
    }
  }, {
    key: "get",
    value: function get(txHashBuf, txOutNum) {
      var label = txHashBuf.toString('hex') + ':' + txOutNum;
      return this.map.get(label);
    }
  }]);

  return SigOperations;
}(Struct);

var TxOutMap = /*#__PURE__*/function (_Struct25) {
  _inherits(TxOutMap, _Struct25);

  var _super34 = _createSuper(TxOutMap);

  function TxOutMap() {
    var map = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new Map();

    _classCallCheck(this, TxOutMap);

    return _super34.call(this, {
      map: map
    });
  }

  _createClass(TxOutMap, [{
    key: "toJSON",
    value: function toJSON() {
      var json = {};
      this.map.forEach(function (txOut, label) {
        json[label] = txOut.toHex();
      });
      return json;
    }
  }, {
    key: "fromJSON",
    value: function fromJSON(json) {
      var _this18 = this;

      Object.keys(json).forEach(function (label) {
        _this18.map.set(label, TxOut.fromHex(json[label]));
      });
      return this;
    }
  }, {
    key: "set",
    value: function set(txHashBuf, txOutNum, txOut) {
      var label = txHashBuf.toString('hex') + ':' + txOutNum;
      this.map.set(label, txOut);
      return this;
    }
  }, {
    key: "get",
    value: function get(txHashBuf, txOutNum) {
      var label = txHashBuf.toString('hex') + ':' + txOutNum;
      return this.map.get(label);
    }
  }, {
    key: "setTx",
    value: function setTx(tx) {
      var _this19 = this;

      var txhashhex = tx.hash().toString('hex');
      tx.txOuts.forEach(function (txOut, index) {
        var label = txhashhex + ':' + index;

        _this19.map.set(label, txOut);
      });
      return this;
    }
  }]);

  return TxOutMap;
}(Struct);

exports.TxOutMap = TxOutMap;
var Constants$1 = Constants.Default.TxBuilder;

var TxBuilder = /*#__PURE__*/function (_Struct26) {
  _inherits(TxBuilder, _Struct26);

  var _super35 = _createSuper(TxBuilder);

  function TxBuilder() {
    var tx = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new Tx();
    var txIns = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    var txOuts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
    var uTxOutMap = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : new TxOutMap();
    var sigOperations = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : new SigOperations();
    var changeScript = arguments.length > 5 ? arguments[5] : undefined;
    var changeAmountBn = arguments.length > 6 ? arguments[6] : undefined;
    var feeAmountBn = arguments.length > 7 ? arguments[7] : undefined;
    var feePerKbNum = arguments.length > 8 && arguments[8] !== undefined ? arguments[8] : Constants$1.feePerKbNum;
    var nLockTime = arguments.length > 9 && arguments[9] !== undefined ? arguments[9] : 0;
    var versionBytesNum = arguments.length > 10 && arguments[10] !== undefined ? arguments[10] : 1;
    var sigsPerInput = arguments.length > 11 && arguments[11] !== undefined ? arguments[11] : 1;
    var dust = arguments.length > 12 && arguments[12] !== undefined ? arguments[12] : Constants$1.dust;
    var dustChangeToFees = arguments.length > 13 && arguments[13] !== undefined ? arguments[13] : false;
    var hashCache = arguments.length > 14 && arguments[14] !== undefined ? arguments[14] : new HashCache();

    _classCallCheck(this, TxBuilder);

    return _super35.call(this, {
      tx: tx,
      txIns: txIns,
      txOuts: txOuts,
      uTxOutMap: uTxOutMap,
      sigOperations: sigOperations,
      changeScript: changeScript,
      changeAmountBn: changeAmountBn,
      feeAmountBn: feeAmountBn,
      feePerKbNum: feePerKbNum,
      nLockTime: nLockTime,
      versionBytesNum: versionBytesNum,
      sigsPerInput: sigsPerInput,
      dust: dust,
      dustChangeToFees: dustChangeToFees,
      hashCache: hashCache
    });
  }

  _createClass(TxBuilder, [{
    key: "toJSON",
    value: function toJSON() {
      var json = {};
      json.tx = this.tx.toHex();
      json.txIns = this.txIns.map(function (txIn) {
        return txIn.toHex();
      });
      json.txOuts = this.txOuts.map(function (txOut) {
        return txOut.toHex();
      });
      json.uTxOutMap = this.uTxOutMap.toJSON();
      json.sigOperations = this.sigOperations.toJSON();
      json.changeScript = this.changeScript ? this.changeScript.toHex() : undefined;
      json.changeAmountBn = this.changeAmountBn ? this.changeAmountBn.toNumber() : undefined;
      json.feeAmountBn = this.feeAmountBn ? this.feeAmountBn.toNumber() : undefined;
      json.feePerKbNum = this.feePerKbNum;
      json.sigsPerInput = this.sigsPerInput;
      json.dust = this.dust;
      json.dustChangeToFees = this.dustChangeToFees;
      json.hashCache = this.hashCache.toJSON();
      return json;
    }
  }, {
    key: "fromJSON",
    value: function fromJSON(json) {
      this.tx = new Tx().fromHex(json.tx);
      this.txIns = json.txIns.map(function (txIn) {
        return TxIn.fromHex(txIn);
      });
      this.txOuts = json.txOuts.map(function (txOut) {
        return TxOut.fromHex(txOut);
      });
      this.uTxOutMap = new TxOutMap().fromJSON(json.uTxOutMap);
      this.sigOperations = new SigOperations().fromJSON(json.sigOperations);
      this.changeScript = json.changeScript ? new Script().fromHex(json.changeScript) : undefined;
      this.changeAmountBn = json.changeAmountBn ? new Bn(json.changeAmountBn) : undefined;
      this.feeAmountBn = json.feeAmountBn ? new Bn(json.feeAmountBn) : undefined;
      this.feePerKbNum = json.feePerKbNum || this.feePerKbNum;
      this.sigsPerInput = json.sigsPerInput || this.sigsPerInput;
      this.dust = json.dust || this.dust;
      this.dustChangeToFees = json.dustChangeToFees || this.dustChangeToFees;
      this.hashCache = HashCache.fromJSON(json.hashCache);
      return this;
    }
  }, {
    key: "setFeePerKbNum",
    value: function setFeePerKbNum(feePerKbNum) {
      if (typeof feePerKbNum !== 'number' || feePerKbNum <= 0) {
        throw new Error('cannot set a fee of zero or less');
      }

      this.feePerKbNum = feePerKbNum;
      return this;
    }
  }, {
    key: "setChangeAddress",
    value: function setChangeAddress(changeAddress) {
      this.changeScript = changeAddress.toTxOutScript();
      return this;
    }
  }, {
    key: "setChangeScript",
    value: function setChangeScript(changeScript) {
      this.changeScript = changeScript;
      return this;
    }
  }, {
    key: "setNLocktime",
    value: function setNLocktime(nLockTime) {
      this.nLockTime = nLockTime;
      return this;
    }
  }, {
    key: "setVersion",
    value: function setVersion(versionBytesNum) {
      this.versionBytesNum = versionBytesNum;
      return this;
    }
  }, {
    key: "setDust",
    value: function setDust() {
      var dust = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : Constants$1.dust;
      this.dust = dust;
      return this;
    }
  }, {
    key: "sendDustChangeToFees",
    value: function sendDustChangeToFees() {
      var dustChangeToFees = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      this.dustChangeToFees = dustChangeToFees;
      return this;
    }
  }, {
    key: "importPartiallySignedTx",
    value: function importPartiallySignedTx(tx) {
      var uTxOutMap = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.uTxOutMap;
      var sigOperations = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.sigOperations;
      this.tx = tx;
      this.uTxOutMap = uTxOutMap;
      this.sigOperations = sigOperations;
      return this;
    }
  }, {
    key: "inputFromScript",
    value: function inputFromScript(txHashBuf, txOutNum, txOut, script, nSequence) {
      if (!Buffer.isBuffer(txHashBuf) || !(typeof txOutNum === 'number') || !(txOut instanceof TxOut) || !(script instanceof Script)) {
        throw new Error('invalid one of: txHashBuf, txOutNum, txOut, script');
      }

      this.txIns.push(TxIn.fromProperties(txHashBuf, txOutNum, script, nSequence));
      this.uTxOutMap.set(txHashBuf, txOutNum, txOut);
      return this;
    }
  }, {
    key: "addSigOperation",
    value: function addSigOperation(txHashBuf, txOutNum, nScriptChunk, type, addressStr, nHashType) {
      this.sigOperations.addOne(txHashBuf, txOutNum, nScriptChunk, type, addressStr, nHashType);
      return this;
    }
  }, {
    key: "inputFromPubKeyHash",
    value: function inputFromPubKeyHash(txHashBuf, txOutNum, txOut, pubKey, nSequence, nHashType) {
      if (!Buffer.isBuffer(txHashBuf) || typeof txOutNum !== 'number' || !(txOut instanceof TxOut)) {
        throw new Error('invalid one of: txHashBuf, txOutNum, txOut');
      }

      this.txIns.push(new TxIn().fromObject({
        nSequence: nSequence
      }).fromPubKeyHashTxOut(txHashBuf, txOutNum, txOut, pubKey));
      this.uTxOutMap.set(txHashBuf, txOutNum, txOut);
      var addressStr = Address.fromTxOutScript(txOut.script).toString();
      this.addSigOperation(txHashBuf, txOutNum, 0, 'sig', addressStr, nHashType);
      this.addSigOperation(txHashBuf, txOutNum, 1, 'pubKey', addressStr);
      return this;
    }
  }, {
    key: "outputToAddress",
    value: function outputToAddress(valueBn, addr) {
      if (!(addr instanceof Address) || !(valueBn instanceof Bn)) {
        throw new Error('addr must be an Address, and valueBn must be a Bn');
      }

      var script = new Script().fromPubKeyHash(addr.hashBuf);
      this.outputToScript(valueBn, script);
      return this;
    }
  }, {
    key: "outputToScript",
    value: function outputToScript(valueBn, script) {
      if (!(script instanceof Script) || !(valueBn instanceof Bn)) {
        throw new Error('script must be a Script, and valueBn must be a Bn');
      }

      var txOut = TxOut.fromProperties(valueBn, script);
      this.txOuts.push(txOut);
      return this;
    }
  }, {
    key: "buildOutputs",
    value: function buildOutputs() {
      var _this20 = this;

      var outAmountBn = new Bn(0);
      this.txOuts.forEach(function (txOut) {
        if (txOut.valueBn.lt(_this20.dust) && !txOut.script.isOpReturn() && !txOut.script.isSafeDataOut()) {
          throw new Error('cannot create output lesser than dust');
        }

        outAmountBn = outAmountBn.add(txOut.valueBn);

        _this20.tx.addTxOut(txOut);
      });
      return outAmountBn;
    }
  }, {
    key: "buildInputs",
    value: function buildInputs(outAmountBn) {
      var extraInputsNum = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var inAmountBn = new Bn(0);

      var _iterator2 = _createForOfIteratorHelper(this.txIns),
          _step2;

      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var txIn = _step2.value;
          var txOut = this.uTxOutMap.get(txIn.txHashBuf, txIn.txOutNum);
          inAmountBn = inAmountBn.add(txOut.valueBn);
          this.tx.addTxIn(txIn);

          if (inAmountBn.geq(outAmountBn)) {
            if (extraInputsNum <= 0) {
              break;
            }

            extraInputsNum--;
          }
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }

      if (inAmountBn.lt(outAmountBn)) {
        throw new Error('not enough funds for outputs: inAmountBn ' + inAmountBn.toNumber() + ' outAmountBn ' + outAmountBn.toNumber());
      }

      return inAmountBn;
    }
  }, {
    key: "estimateSize",
    value: function estimateSize() {
      var _this21 = this;

      var sigSize = 1 + 1 + 1 + 1 + 32 + 1 + 1 + 32 + 1 + 1;
      var pubKeySize = 1 + 1 + 33;
      var size = this.tx.toBuffer().length;
      this.tx.txIns.forEach(function (txIn) {
        var txHashBuf = txIn.txHashBuf,
            txOutNum = txIn.txOutNum;

        var sigOperations = _this21.sigOperations.get(txHashBuf, txOutNum);

        sigOperations.forEach(function (obj) {
          var nScriptChunk = obj.nScriptChunk,
              type = obj.type;
          var script = new Script([txIn.script.chunks[nScriptChunk]]);
          var scriptSize = script.toBuffer().length;
          size -= scriptSize;

          if (type === 'sig') {
            size += sigSize;
          } else if (obj.type === 'pubKey') {
            size += pubKeySize;
          } else {
            throw new Error('unsupported sig operations type');
          }
        });
      });
      size = size + 1;
      return Math.round(size);
    }
  }, {
    key: "estimateFee",
    value: function estimateFee() {
      var extraFeeAmount = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new Bn(0);
      var fee = Math.ceil(this.estimateSize() / 1000 * this.feePerKbNum);
      return new Bn(fee).add(extraFeeAmount);
    }
  }, {
    key: "build",
    value: function build() {
      var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
        useAllInputs: false
      };
      var minFeeAmountBn;

      if (this.txIns.length <= 0) {
        throw Error('tx-builder number of inputs must be greater than 0');
      }

      if (!this.changeScript) {
        throw new Error('must specify change script to use build method');
      }

      for (var extraInputsNum = opts.useAllInputs ? this.txIns.length - 1 : 0; extraInputsNum < this.txIns.length; extraInputsNum++) {
        this.tx = new Tx();
        var outAmountBn = this.buildOutputs();
        var changeTxOut = TxOut.fromProperties(new Bn(0), this.changeScript);
        this.tx.addTxOut(changeTxOut);
        var inAmountBn = void 0;

        try {
          inAmountBn = this.buildInputs(outAmountBn, extraInputsNum);
        } catch (err) {
          if (err.message.includes('not enough funds for outputs')) {
            throw new Error('unable to gather enough inputs for outputs and fee');
          } else {
            throw err;
          }
        }

        this.changeAmountBn = inAmountBn.sub(outAmountBn);
        changeTxOut.valueBn = this.changeAmountBn;
        minFeeAmountBn = this.estimateFee();

        if (this.changeAmountBn.geq(minFeeAmountBn) && this.changeAmountBn.sub(minFeeAmountBn).gt(this.dust)) {
          break;
        }
      }

      if (this.changeAmountBn.geq(minFeeAmountBn)) {
        this.feeAmountBn = minFeeAmountBn;
        this.changeAmountBn = this.changeAmountBn.sub(this.feeAmountBn);
        this.tx.txOuts[this.tx.txOuts.length - 1].valueBn = this.changeAmountBn;

        if (this.changeAmountBn.lt(this.dust)) {
          if (this.dustChangeToFees) {
            this.tx.txOuts.pop();
            this.tx.txOutsVi = VarInt.fromNumber(this.tx.txOutsVi.toNumber() - 1);
            this.feeAmountBn = this.feeAmountBn.add(this.changeAmountBn);
            this.changeAmountBn = new Bn(0);
          } else {
            throw new Error('unable to create change amount greater than dust');
          }
        }

        this.tx.nLockTime = this.nLockTime;
        this.tx.versionBytesNum = this.versionBytesNum;

        if (this.tx.txOuts.length === 0) {
          throw new Error('outputs length is zero - unable to create any outputs greater than dust');
        }

        return this;
      } else {
        throw new Error('unable to gather enough inputs for outputs and fee');
      }
    }
  }, {
    key: "sort",
    value: function sort() {
      this.tx.sort();
      return this;
    }
  }, {
    key: "fillSig",
    value: function fillSig(nIn, nScriptChunk, sig) {
      var txIn = this.tx.txIns[nIn];
      txIn.script.chunks[nScriptChunk] = new Script().writeBuffer(sig.toTxFormat()).chunks[0];
      txIn.scriptVi = VarInt.fromNumber(txIn.script.toBuffer().length);
      return this;
    }
  }, {
    key: "getSig",
    value: function getSig(keyPair) {
      var nHashType = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID;
      var nIn = arguments.length > 2 ? arguments[2] : undefined;
      var subScript = arguments.length > 3 ? arguments[3] : undefined;
      var flags = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : Tx.SCRIPT_ENABLE_SIGHASH_FORKID;
      var valueBn;

      if (nHashType & Sig.SIGHASH_FORKID && flags & Tx.SCRIPT_ENABLE_SIGHASH_FORKID) {
        var txHashBuf = this.tx.txIns[nIn].txHashBuf;
        var txOutNum = this.tx.txIns[nIn].txOutNum;
        var txOut = this.uTxOutMap.get(txHashBuf, txOutNum);

        if (!txOut) {
          throw new Error('for SIGHASH_FORKID must provide UTXOs');
        }

        valueBn = txOut.valueBn;
      }

      return this.tx.sign(keyPair, nHashType, nIn, subScript, valueBn, flags, this.hashCache);
    }
  }, {
    key: "asyncGetSig",
    value: function asyncGetSig(keyPair) {
      var nHashType = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID;
      var nIn = arguments.length > 2 ? arguments[2] : undefined;
      var subScript = arguments.length > 3 ? arguments[3] : undefined;
      var flags = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : Tx.SCRIPT_ENABLE_SIGHASH_FORKID;
      var valueBn;

      if (nHashType & Sig.SIGHASH_FORKID && flags & Tx.SCRIPT_ENABLE_SIGHASH_FORKID) {
        var txHashBuf = this.tx.txIns[nIn].txHashBuf;
        var txOutNum = this.tx.txIns[nIn].txOutNum;
        var txOut = this.uTxOutMap.get(txHashBuf, txOutNum);

        if (!txOut) {
          throw new Error('for SIGHASH_FORKID must provide UTXOs');
        }

        valueBn = txOut.valueBn;
      }

      return this.tx.asyncSign(keyPair, nHashType, nIn, subScript, valueBn, flags, this.hashCache);
    }
  }, {
    key: "signTxIn",
    value: function signTxIn(nIn, keyPair, txOut, nScriptChunk) {
      var nHashType = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID;
      var flags = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : Tx.SCRIPT_ENABLE_SIGHASH_FORKID;
      var txIn = this.tx.txIns[nIn];
      var script = txIn.script;

      if (nScriptChunk === undefined && script.isPubKeyHashIn()) {
        nScriptChunk = 0;
      }

      if (nScriptChunk === undefined) {
        throw new Error('cannot sign unknown script type for input ' + nIn);
      }

      var txHashBuf = txIn.txHashBuf;
      var txOutNum = txIn.txOutNum;

      if (!txOut) {
        txOut = this.uTxOutMap.get(txHashBuf, txOutNum);
      }

      var outScript = txOut.script;
      var subScript = outScript;
      var sig = this.getSig(keyPair, nHashType, nIn, subScript, flags, this.hashCache);
      this.fillSig(nIn, nScriptChunk, sig);
      return this;
    }
  }, {
    key: "asyncSignTxIn",
    value: function () {
      var _asyncSignTxIn = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee45(nIn, keyPair, txOut, nScriptChunk) {
        var nHashType,
            flags,
            txIn,
            script,
            txHashBuf,
            txOutNum,
            outScript,
            subScript,
            sig,
            _args49 = arguments;
        return regeneratorRuntime.wrap(function _callee45$(_context49) {
          while (1) {
            switch (_context49.prev = _context49.next) {
              case 0:
                nHashType = _args49.length > 4 && _args49[4] !== undefined ? _args49[4] : Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID;
                flags = _args49.length > 5 && _args49[5] !== undefined ? _args49[5] : Tx.SCRIPT_ENABLE_SIGHASH_FORKID;
                txIn = this.tx.txIns[nIn];
                script = txIn.script;

                if (nScriptChunk === undefined && script.isPubKeyHashIn()) {
                  nScriptChunk = 0;
                }

                if (!(nScriptChunk === undefined)) {
                  _context49.next = 7;
                  break;
                }

                throw new Error('cannot sign unknown script type for input ' + nIn);

              case 7:
                txHashBuf = txIn.txHashBuf;
                txOutNum = txIn.txOutNum;

                if (!txOut) {
                  txOut = this.uTxOutMap.get(txHashBuf, txOutNum);
                }

                outScript = txOut.script;
                subScript = outScript;
                _context49.next = 14;
                return this.asyncGetSig(keyPair, nHashType, nIn, subScript, flags, this.hashCache);

              case 14:
                sig = _context49.sent;
                this.fillSig(nIn, nScriptChunk, sig);
                return _context49.abrupt("return", this);

              case 17:
              case "end":
                return _context49.stop();
            }
          }
        }, _callee45, this);
      }));

      function asyncSignTxIn(_x58, _x59, _x60, _x61) {
        return _asyncSignTxIn.apply(this, arguments);
      }

      return asyncSignTxIn;
    }()
  }, {
    key: "signWithKeyPairs",
    value: function signWithKeyPairs(keyPairs) {
      var addressStrMap = {};

      var _iterator3 = _createForOfIteratorHelper(keyPairs),
          _step3;

      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
          var _keyPair = _step3.value;

          var _addressStr = Address.fromPubKey(_keyPair.pubKey).toString();

          addressStrMap[_addressStr] = _keyPair;
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }

      for (var nIn in this.tx.txIns) {
        var txIn = this.tx.txIns[nIn];
        var arr = this.sigOperations.get(txIn.txHashBuf, txIn.txOutNum);

        var _iterator4 = _createForOfIteratorHelper(arr),
            _step4;

        try {
          for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
            var obj = _step4.value;
            var nScriptChunk = obj.nScriptChunk,
                type = obj.type,
                addressStr = obj.addressStr,
                nHashType = obj.nHashType;
            var keyPair = addressStrMap[addressStr];

            if (!keyPair) {
              obj.log = "cannot find keyPair for addressStr ".concat(addressStr);
              continue;
            }

            var txOut = this.uTxOutMap.get(txIn.txHashBuf, txIn.txOutNum);

            if (type === 'sig') {
              this.signTxIn(nIn, keyPair, txOut, nScriptChunk, nHashType);
              obj.log = 'successfully inserted signature';
            } else if (type === 'pubKey') {
              txIn.script.chunks[nScriptChunk] = new Script().writeBuffer(keyPair.pubKey.toBuffer()).chunks[0];
              txIn.setScript(txIn.script);
              obj.log = 'successfully inserted public key';
            } else {
              obj.log = "cannot perform operation of type ".concat(type);
              continue;
            }
          }
        } catch (err) {
          _iterator4.e(err);
        } finally {
          _iterator4.f();
        }
      }

      return this;
    }
  }], [{
    key: "allSigsPresent",
    value: function allSigsPresent(m, script) {
      var present = 0;

      for (var i = 1; i < script.chunks.length - 1; i++) {
        if (script.chunks[i].buf) {
          present++;
        }
      }

      return present === m;
    }
  }, {
    key: "removeBlankSigs",
    value: function removeBlankSigs(script) {
      script = new Script(script.chunks.slice());

      for (var i = 1; i < script.chunks.length - 1; i++) {
        if (!script.chunks[i].buf) {
          script.chunks.splice(i, 1);
        }
      }

      return script;
    }
  }]);

  return TxBuilder;
}(Struct);

exports.TxBuilder = TxBuilder;

var TxVerifier = /*#__PURE__*/function (_Struct27) {
  _inherits(TxVerifier, _Struct27);

  var _super36 = _createSuper(TxVerifier);

  function TxVerifier(tx, txOutMap, errStr, interp) {
    _classCallCheck(this, TxVerifier);

    return _super36.call(this, {
      tx: tx,
      txOutMap: txOutMap,
      errStr: errStr,
      interp: interp
    });
  }

  _createClass(TxVerifier, [{
    key: "verify",
    value: function verify() {
      var flags = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : Interp.SCRIPT_ENABLE_SIGHASH_FORKID;
      return !this.checkStr() && !this.verifyStr(flags);
    }
  }, {
    key: "asyncVerify",
    value: function () {
      var _asyncVerify5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee46(flags) {
        var verifyStr;
        return regeneratorRuntime.wrap(function _callee46$(_context50) {
          while (1) {
            switch (_context50.prev = _context50.next) {
              case 0:
                _context50.next = 2;
                return this.asyncVerifyStr(flags);

              case 2:
                verifyStr = _context50.sent;
                return _context50.abrupt("return", !this.checkStr() && !verifyStr);

              case 4:
              case "end":
                return _context50.stop();
            }
          }
        }, _callee46, this);
      }));

      function asyncVerify(_x62) {
        return _asyncVerify5.apply(this, arguments);
      }

      return asyncVerify;
    }()
  }, {
    key: "checkStr",
    value: function checkStr() {
      if (this.tx.txIns.length === 0 || this.tx.txInsVi.toNumber() === 0) {
        this.errStr = 'transaction txIns empty';
        return this.errStr;
      }

      if (this.tx.txOuts.length === 0 || this.tx.txOutsVi.toNumber() === 0) {
        this.errStr = 'transaction txOuts empty';
        return this.errStr;
      }

      if (this.tx.toBuffer().length > Block.MAX_BLOCK_SIZE) {
        this.errStr = 'transaction over the maximum block size';
        return this.errStr;
      }

      var valueoutbn = new Bn(0);

      for (var i = 0; i < this.tx.txOuts.length; i++) {
        var txOut = this.tx.txOuts[i];

        if (txOut.valueBn.lt(0)) {
          this.errStr = 'transaction txOut ' + i + ' negative';
          return this.errStr;
        }

        if (txOut.valueBn.gt(Tx.MAX_MONEY)) {
          this.errStr = 'transaction txOut ' + i + ' greater than MAX_MONEY';
          return this.errStr;
        }

        valueoutbn = valueoutbn.add(txOut.valueBn);

        if (valueoutbn.gt(Tx.MAX_MONEY)) {
          this.errStr = 'transaction txOut ' + i + ' total output greater than MAX_MONEY';
          return this.errStr;
        }
      }

      var txInmap = {};

      for (var _i10 = 0; _i10 < this.tx.txIns.length; _i10++) {
        var txIn = this.tx.txIns[_i10];
        var inputid = txIn.txHashBuf.toString('hex') + ':' + txIn.txOutNum;

        if (txInmap[inputid] !== undefined) {
          this.errStr = 'transaction input ' + _i10 + ' duplicate input';
          return this.errStr;
        }

        txInmap[inputid] = true;
      }

      if (this.tx.isCoinbase()) {
        var buf = this.tx.txIns[0].script.toBuffer();

        if (buf.length < 2 || buf.length > 100) {
          this.errStr = 'coinbase trasaction script size invalid';
          return this.errStr;
        }
      } else {
        for (var _i11 = 0; _i11 < this.tx.txIns.length; _i11++) {
          if (this.tx.txIns[_i11].hasNullInput()) {
            this.errStr = 'transaction input ' + _i11 + ' has null input';
            return this.errStr;
          }
        }
      }

      return false;
    }
  }, {
    key: "verifyStr",
    value: function verifyStr(flags) {
      for (var i = 0; i < this.tx.txIns.length; i++) {
        if (!this.verifyNIn(i, flags)) {
          this.errStr = 'input ' + i + ' failed script verify';
          return this.errStr;
        }
      }

      return false;
    }
  }, {
    key: "asyncVerifyStr",
    value: function () {
      var _asyncVerifyStr = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee47(flags) {
        var i, verifyNIn;
        return regeneratorRuntime.wrap(function _callee47$(_context51) {
          while (1) {
            switch (_context51.prev = _context51.next) {
              case 0:
                i = 0;

              case 1:
                if (!(i < this.tx.txIns.length)) {
                  _context51.next = 11;
                  break;
                }

                _context51.next = 4;
                return this.asyncVerifyNIn(i, flags);

              case 4:
                verifyNIn = _context51.sent;

                if (verifyNIn) {
                  _context51.next = 8;
                  break;
                }

                this.errStr = 'input ' + i + ' failed script verify';
                return _context51.abrupt("return", this.errStr);

              case 8:
                i++;
                _context51.next = 1;
                break;

              case 11:
                return _context51.abrupt("return", false);

              case 12:
              case "end":
                return _context51.stop();
            }
          }
        }, _callee47, this);
      }));

      function asyncVerifyStr(_x63) {
        return _asyncVerifyStr.apply(this, arguments);
      }

      return asyncVerifyStr;
    }()
  }, {
    key: "verifyNIn",
    value: function verifyNIn(nIn, flags) {
      var txIn = this.tx.txIns[nIn];
      var scriptSig = txIn.script;
      var txOut = this.txOutMap.get(txIn.txHashBuf, txIn.txOutNum);

      if (!txOut) {
        console.log('output ' + txIn.txOutNum + ' not found');
        return false;
      }

      var scriptPubKey = txOut.script;
      var valueBn = txOut.valueBn;
      this.interp = new Interp();
      var verified = this.interp.verify(scriptSig, scriptPubKey, this.tx, nIn, flags, valueBn);
      return verified;
    }
  }, {
    key: "asyncVerifyNIn",
    value: function () {
      var _asyncVerifyNIn = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee48(nIn, flags) {
        var txIn, scriptSig, txOut, scriptPubKey, valueBn, workersResult, verified;
        return regeneratorRuntime.wrap(function _callee48$(_context52) {
          while (1) {
            switch (_context52.prev = _context52.next) {
              case 0:
                txIn = this.tx.txIns[nIn];
                scriptSig = txIn.script;
                txOut = this.txOutMap.get(txIn.txHashBuf, txIn.txOutNum);

                if (txOut) {
                  _context52.next = 6;
                  break;
                }

                console.log('output ' + txIn.txOutNum + ' not found');
                return _context52.abrupt("return", false);

              case 6:
                scriptPubKey = txOut.script;
                valueBn = txOut.valueBn;
                this.interp = new Interp();
                _context52.next = 11;
                return Workers.asyncObjectMethod(this.interp, 'verify', [scriptSig, scriptPubKey, this.tx, nIn, flags, valueBn]);

              case 11:
                workersResult = _context52.sent;
                verified = JSON.parse(workersResult.resbuf.toString());
                return _context52.abrupt("return", verified);

              case 14:
              case "end":
                return _context52.stop();
            }
          }
        }, _callee48, this);
      }));

      function asyncVerifyNIn(_x64, _x65) {
        return _asyncVerifyNIn.apply(this, arguments);
      }

      return asyncVerifyNIn;
    }()
  }, {
    key: "getDebugObject",
    value: function getDebugObject() {
      return {
        errStr: this.errStr,
        interpFailure: this.interp ? this.interp.getDebugObject() : undefined
      };
    }
  }, {
    key: "getDebugString",
    value: function getDebugString() {
      return JSON.stringify(this.getDebugObject(), null, 2);
    }
  }], [{
    key: "verify",
    value: function verify(tx, txOutMap, flags) {
      return new TxVerifier(tx, txOutMap).verify(flags);
    }
  }, {
    key: "asyncVerify",
    value: function asyncVerify(tx, txOutMap, flags) {
      return new TxVerifier(tx, txOutMap).asyncVerify(flags);
    }
  }]);

  return TxVerifier;
}(Struct);

exports.TxVerifier = TxVerifier;

var Aes = function Aes() {
  _classCallCheck(this, Aes);
};

exports.Aes = Aes;

Aes.encrypt = function (messageBuf, keyBuf) {
  var key = Aes.buf2Words(keyBuf);
  var message = Aes.buf2Words(messageBuf);
  var a = new _aes.default(key);
  var enc = a.encrypt(message);
  var encBuf = Aes.words2Buf(enc);
  return encBuf;
};

Aes.decrypt = function (encBuf, keyBuf) {
  var enc = Aes.buf2Words(encBuf);
  var key = Aes.buf2Words(keyBuf);
  var a = new _aes.default(key);
  var message = a.decrypt(enc);
  var messageBuf = Aes.words2Buf(message);
  return messageBuf;
};

Aes.buf2Words = function (buf) {
  if (buf.length % 4) {
    throw new Error('buf length must be a multiple of 4');
  }

  var words = [];

  for (var i = 0; i < buf.length / 4; i++) {
    words.push(buf.readUInt32BE(i * 4));
  }

  return words;
};

Aes.words2Buf = function (words) {
  var buf = Buffer.alloc(words.length * 4);

  for (var i = 0; i < words.length; i++) {
    buf.writeUInt32BE(words[i], i * 4);
  }

  return buf;
};

var Cbc = function Cbc() {
  _classCallCheck(this, Cbc);
};

exports.Cbc = Cbc;

Cbc.buf2BlocksBuf = function (buf, blockSize) {
  var bytesize = blockSize / 8;
  var blockBufs = [];

  for (var i = 0; i <= buf.length / bytesize; i++) {
    var blockBuf = buf.slice(i * bytesize, i * bytesize + bytesize);

    if (blockBuf.length < blockSize) {
      blockBuf = Cbc.pkcs7Pad(blockBuf, blockSize);
    }

    blockBufs.push(blockBuf);
  }

  return blockBufs;
};

Cbc.blockBufs2Buf = function (blockBufs) {
  var last = blockBufs[blockBufs.length - 1];
  last = Cbc.pkcs7Unpad(last);
  blockBufs[blockBufs.length - 1] = last;
  var buf = Buffer.concat(blockBufs);
  return buf;
};

Cbc.encrypt = function (messageBuf, ivBuf, blockCipher, cipherKeyBuf) {
  var blockSize = ivBuf.length * 8;
  var blockBufs = Cbc.buf2BlocksBuf(messageBuf, blockSize);
  var encBufs = Cbc.encryptBlocks(blockBufs, ivBuf, blockCipher, cipherKeyBuf);
  var encBuf = Buffer.concat(encBufs);
  return encBuf;
};

Cbc.decrypt = function (encBuf, ivBuf, blockCipher, cipherKeyBuf) {
  var bytesize = ivBuf.length;
  var encBufs = [];

  for (var i = 0; i < encBuf.length / bytesize; i++) {
    encBufs.push(encBuf.slice(i * bytesize, i * bytesize + bytesize));
  }

  var blockBufs = Cbc.decryptBlocks(encBufs, ivBuf, blockCipher, cipherKeyBuf);
  var buf = Cbc.blockBufs2Buf(blockBufs);
  return buf;
};

Cbc.encryptBlock = function (blockBuf, ivBuf, blockCipher, cipherKeyBuf) {
  var xorbuf = Cbc.xorBufs(blockBuf, ivBuf);
  var encBuf = blockCipher.encrypt(xorbuf, cipherKeyBuf);
  return encBuf;
};

Cbc.decryptBlock = function (encBuf, ivBuf, blockCipher, cipherKeyBuf) {
  var xorbuf = blockCipher.decrypt(encBuf, cipherKeyBuf);
  var blockBuf = Cbc.xorBufs(xorbuf, ivBuf);
  return blockBuf;
};

Cbc.encryptBlocks = function (blockBufs, ivBuf, blockCipher, cipherKeyBuf) {
  var encBufs = [];

  for (var i = 0; i < blockBufs.length; i++) {
    var blockBuf = blockBufs[i];
    var encBuf = Cbc.encryptBlock(blockBuf, ivBuf, blockCipher, cipherKeyBuf);
    encBufs.push(encBuf);
    ivBuf = encBuf;
  }

  return encBufs;
};

Cbc.decryptBlocks = function (encBufs, ivBuf, blockCipher, cipherKeyBuf) {
  var blockBufs = [];

  for (var i = 0; i < encBufs.length; i++) {
    var encBuf = encBufs[i];
    var blockBuf = Cbc.decryptBlock(encBuf, ivBuf, blockCipher, cipherKeyBuf);
    blockBufs.push(blockBuf);
    ivBuf = encBuf;
  }

  return blockBufs;
};

Cbc.pkcs7Pad = function (buf, blockSize) {
  var bytesize = blockSize / 8;
  var padbytesize = bytesize - buf.length;
  var pad = Buffer.alloc(padbytesize);
  pad.fill(padbytesize);
  var paddedbuf = Buffer.concat([buf, pad]);
  return paddedbuf;
};

Cbc.pkcs7Unpad = function (paddedbuf) {
  var padlength = paddedbuf[paddedbuf.length - 1];
  var padbuf = paddedbuf.slice(paddedbuf.length - padlength, paddedbuf.length);
  var padbuf2 = Buffer.alloc(padlength);
  padbuf2.fill(padlength);

  if (!cmp(padbuf, padbuf2)) {
    throw new Error('invalid padding');
  }

  return paddedbuf.slice(0, paddedbuf.length - padlength);
};

Cbc.xorBufs = function (buf1, buf2) {
  if (buf1.length !== buf2.length) {
    throw new Error('bufs must have the same length');
  }

  var buf = Buffer.alloc(buf1.length);

  for (var i = 0; i < buf1.length; i++) {
    buf[i] = buf1[i] ^ buf2[i];
  }

  return buf;
};

var Aescbc = function Aescbc() {
  _classCallCheck(this, Aescbc);
};

exports.Aescbc = Aescbc;

Aescbc.encrypt = function (messageBuf, cipherKeyBuf, ivBuf) {
  var concatIvBuf = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
  ivBuf = ivBuf || Random.getRandomBuffer(128 / 8);
  var ctBuf = Cbc.encrypt(messageBuf, ivBuf, Aes, cipherKeyBuf);

  if (concatIvBuf) {
    return Buffer.concat([ivBuf, ctBuf]);
  } else {
    return ctBuf;
  }
};

Aescbc.decrypt = function (encBuf, cipherKeyBuf) {
  var ivBuf = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

  if (!ivBuf) {
    var _ivBuf = encBuf.slice(0, 128 / 8);

    var ctBuf = encBuf.slice(128 / 8);
    return Cbc.decrypt(ctBuf, _ivBuf, Aes, cipherKeyBuf);
  } else {
    var _ctBuf = encBuf;
    return Cbc.decrypt(_ctBuf, ivBuf, Aes, cipherKeyBuf);
  }
};

var Ach = function Ach() {
  _classCallCheck(this, Ach);
};

exports.Ach = Ach;

Ach.encrypt = function (messageBuf, cipherKeyBuf, ivBuf) {
  var encBuf = Aescbc.encrypt(messageBuf, cipherKeyBuf, ivBuf);
  var hmacbuf = Hash.sha256Hmac(encBuf, cipherKeyBuf);
  return Buffer.concat([hmacbuf, encBuf]);
};

Ach.asyncEncrypt = /*#__PURE__*/function () {
  var _ref11 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee49(messageBuf, cipherKeyBuf, ivBuf) {
    var args, workersResult;
    return regeneratorRuntime.wrap(function _callee49$(_context53) {
      while (1) {
        switch (_context53.prev = _context53.next) {
          case 0:
            if (!ivBuf) {
              ivBuf = Random.getRandomBuffer(128 / 8);
            }

            args = [messageBuf, cipherKeyBuf, ivBuf];
            _context53.next = 4;
            return Workers.asyncClassMethod(Ach, 'encrypt', args);

          case 4:
            workersResult = _context53.sent;
            return _context53.abrupt("return", workersResult.resbuf);

          case 6:
          case "end":
            return _context53.stop();
        }
      }
    }, _callee49);
  }));

  return function (_x66, _x67, _x68) {
    return _ref11.apply(this, arguments);
  };
}();

Ach.decrypt = function (encBuf, cipherKeyBuf) {
  if (encBuf.length < (256 + 128 + 128) / 8) {
    throw new Error('The encrypted data must be at least 256+128+128 bits, which is the length of the Hmac plus the iv plus the smallest encrypted data size');
  }

  var hmacbuf = encBuf.slice(0, 256 / 8);
  encBuf = encBuf.slice(256 / 8, encBuf.length);
  var hmacbuf2 = Hash.sha256Hmac(encBuf, cipherKeyBuf);

  if (!cmp(hmacbuf, hmacbuf2)) {
    throw new Error('Message authentication failed - Hmacs are not equivalent');
  }

  return Aescbc.decrypt(encBuf, cipherKeyBuf);
};

Ach.asyncDecrypt = /*#__PURE__*/function () {
  var _ref12 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee50(encBuf, cipherKeyBuf) {
    var args, workersResult;
    return regeneratorRuntime.wrap(function _callee50$(_context54) {
      while (1) {
        switch (_context54.prev = _context54.next) {
          case 0:
            args = [encBuf, cipherKeyBuf];
            _context54.next = 3;
            return Workers.asyncClassMethod(Ach, 'decrypt', args);

          case 3:
            workersResult = _context54.sent;
            return _context54.abrupt("return", workersResult.resbuf);

          case 5:
          case "end":
            return _context54.stop();
        }
      }
    }, _callee50);
  }));

  return function (_x69, _x70) {
    return _ref12.apply(this, arguments);
  };
}();

var Ecies = function Ecies() {
  _classCallCheck(this, Ecies);
};

exports.Ecies = Ecies;

Ecies.ivkEkM = function (privKey, pubKey) {
  var r = privKey.bn;
  var KB = pubKey.point;
  var P = KB.mul(r);
  var S = new PubKey(P);
  var Sbuf = S.toBuffer();
  var hash = Hash.sha512(Sbuf);
  return {
    iv: hash.slice(0, 16),
    kE: hash.slice(16, 32),
    kM: hash.slice(32, 64)
  };
};

Ecies.electrumEncrypt = function (messageBuf, toPubKey, fromKeyPair) {
  if (!Buffer.isBuffer(messageBuf)) {
    throw new Error('messageBuf must be a buffer');
  }

  var _Ecies$ivkEkM = Ecies.ivkEkM(fromKeyPair.privKey, toPubKey),
      iv = _Ecies$ivkEkM.iv,
      kE = _Ecies$ivkEkM.kE,
      kM = _Ecies$ivkEkM.kM;

  var Rbuf = fromKeyPair.pubKey.toDer(true);
  var ciphertext = Aescbc.encrypt(messageBuf, kE, iv, false);
  var BIE1 = Buffer.from('BIE1');
  var encBuf = Buffer.concat([BIE1, Rbuf, ciphertext]);
  var hmac = Hash.sha256Hmac(encBuf, kM);
  return Buffer.concat([encBuf, hmac]);
};

Ecies.electrumDecrypt = function (encBuf, toPrivKey) {
  if (!Buffer.isBuffer(encBuf)) {
    throw new Error('encBuf must be a buffer');
  }

  var tagLength = 32;
  var magic = encBuf.slice(0, 4);

  if (!magic.equals(Buffer.from('BIE1'))) {
    throw new Error('Invalid Magic');
  }

  var pub = encBuf.slice(4, 37);
  var fromPubKey = PubKey.fromDer(pub);

  var _Ecies$ivkEkM2 = Ecies.ivkEkM(toPrivKey, fromPubKey),
      iv = _Ecies$ivkEkM2.iv,
      kE = _Ecies$ivkEkM2.kE,
      kM = _Ecies$ivkEkM2.kM;

  var ciphertext = encBuf.slice(37, encBuf.length - tagLength);
  var hmac = encBuf.slice(encBuf.length - tagLength, encBuf.length);
  var hmac2 = Hash.sha256Hmac(encBuf.slice(0, encBuf.length - tagLength), kM);

  if (!hmac.equals(hmac2)) {
    throw new Error('Invalid checksum');
  }

  return Aescbc.decrypt(ciphertext, kE, iv);
};

Ecies.bitcoreEncrypt = function (messageBuf, toPubKey, fromKeyPair, ivBuf) {
  if (!fromKeyPair) {
    fromKeyPair = KeyPair.fromRandom();
  }

  var r = fromKeyPair.privKey.bn;
  var RPubKey = fromKeyPair.pubKey;
  var RBuf = RPubKey.toDer(true);
  var KB = toPubKey.point;
  var P = KB.mul(r);
  var S = P.getX();
  var Sbuf = S.toBuffer({
    size: 32
  });
  var kEkM = Hash.sha512(Sbuf);
  var kE = kEkM.slice(0, 32);
  var kM = kEkM.slice(32, 64);
  var c = Aescbc.encrypt(messageBuf, kE, ivBuf);
  var d = Hash.sha256Hmac(c, kM);
  var encBuf = Buffer.concat([RBuf, c, d]);
  return encBuf;
};

Ecies.asyncBitcoreEncrypt = /*#__PURE__*/function () {
  var _ref13 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee51(messageBuf, toPubKey, fromKeyPair, ivBuf) {
    var args, workersResult;
    return regeneratorRuntime.wrap(function _callee51$(_context55) {
      while (1) {
        switch (_context55.prev = _context55.next) {
          case 0:
            if (fromKeyPair) {
              _context55.next = 4;
              break;
            }

            _context55.next = 3;
            return KeyPair.asyncFromRandom();

          case 3:
            fromKeyPair = _context55.sent;

          case 4:
            if (!ivBuf) {
              ivBuf = Random.getRandomBuffer(128 / 8);
            }

            args = [messageBuf, toPubKey, fromKeyPair, ivBuf];
            _context55.next = 8;
            return Workers.asyncClassMethod(Ecies, 'bitcoreEncrypt', args);

          case 8:
            workersResult = _context55.sent;
            return _context55.abrupt("return", workersResult.resbuf);

          case 10:
          case "end":
            return _context55.stop();
        }
      }
    }, _callee51);
  }));

  return function (_x71, _x72, _x73, _x74) {
    return _ref13.apply(this, arguments);
  };
}();

Ecies.bitcoreDecrypt = function (encBuf, toPrivKey) {
  var kB = toPrivKey.bn;
  var fromPubKey = PubKey.fromDer(encBuf.slice(0, 33));
  var R = fromPubKey.point;
  var P = R.mul(kB);

  if (P.eq(new Point())) {
    throw new Error('P equals 0');
  }

  var S = P.getX();
  var Sbuf = S.toBuffer({
    size: 32
  });
  var kEkM = Hash.sha512(Sbuf);
  var kE = kEkM.slice(0, 32);
  var kM = kEkM.slice(32, 64);
  var c = encBuf.slice(33, encBuf.length - 32);
  var d = encBuf.slice(encBuf.length - 32, encBuf.length);
  var d2 = Hash.sha256Hmac(c, kM);

  if (!cmp(d, d2)) {
    throw new Error('Invalid checksum');
  }

  var messageBuf = Aescbc.decrypt(c, kE);
  return messageBuf;
};

Ecies.asyncBitcoreDecrypt = /*#__PURE__*/function () {
  var _ref14 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee52(encBuf, toPrivKey) {
    var args, workersResult;
    return regeneratorRuntime.wrap(function _callee52$(_context56) {
      while (1) {
        switch (_context56.prev = _context56.next) {
          case 0:
            args = [encBuf, toPrivKey];
            _context56.next = 3;
            return Workers.asyncClassMethod(Ecies, 'bitcoreDecrypt', args);

          case 3:
            workersResult = _context56.sent;
            return _context56.abrupt("return", workersResult.resbuf);

          case 5:
          case "end":
            return _context56.stop();
        }
      }
    }, _callee52);
  }));

  return function (_x75, _x76) {
    return _ref14.apply(this, arguments);
  };
}();

var deps = {
  aes: _aes.default,
  bnjs: _bn7.default,
  bs58: _bs.default,
  elliptic: _bitcoinElliptic.default,
  hashjs: _hash2.default,
  pbkdf2compat: _pbkdf2Compat.default
};
exports.deps = deps;
},{"aes":"../node_modules/aes/lib/aes.js","bn.js":"../node_modules/bsv/node_modules/bn.js/lib/bn.js","bs58":"../node_modules/bs58/index.js","bitcoin-elliptic":"../node_modules/bitcoin-elliptic/lib/elliptic.js","hash.js":"../node_modules/hash.js/lib/hash.js","pbkdf2-compat":"../node_modules/pbkdf2-compat/browser.js","is-hex":"../node_modules/is-hex/is-hex.js","randombytes":"../node_modules/randombytes/browser.js","buffer":"../node_modules/buffer/index.js"}],"../src/KeyPair.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.KeyPair = void 0;

var bsv_1 = require("bsv"); // a public and private pair of keys


var KeyPair =
/** @class */
function () {
  function KeyPair(privKey, pubKey) {
    this.privKey = privKey;
    this.pubKey = pubKey;
  }

  KeyPair.prototype.toAddress = function () {
    return bsv_1.Address.fromPubKey(this.pubKey, 'livenet');
  }; //pay to pub key hash of address


  KeyPair.prototype.toOutputScript = function () {
    return this.toAddress().toTxOutScript();
  };

  KeyPair.prototype.fromRandom = function () {
    var privKey = bsv_1.PrivKey.fromRandom();
    return this.fromPrivKey(privKey);
  };

  KeyPair.prototype.fromPrivKey = function (privKey) {
    this.privKey = privKey;
    this.pubKey = bsv_1.PubKey.fromPrivKey(privKey);
    return this;
  };

  KeyPair.prototype.fromWif = function (wif) {
    var privKey = bsv_1.PrivKey.fromWif(wif);
    return this.fromPrivKey(privKey);
  };

  KeyPair.prototype.toWif = function () {
    return this.privKey.toWif();
  };

  KeyPair.prototype.toXpub = function () {
    return this.pubKey.toString();
  };

  return KeyPair;
}();

exports.KeyPair = KeyPair;
},{"bsv":"../node_modules/bsv/dist/bsv.modern.js"}],"browser.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var KeyPair_1 = require("../src/KeyPair");

console.log('in browser.ts');
console.log(new KeyPair_1.KeyPair().fromRandom());
console.log(KeyPair_1.KeyPair);
},{"../src/KeyPair":"../src/KeyPair.ts"}],"../node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "34705" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else if (location.reload) {
        // `location` global exists in a web worker context but lacks `.reload()` function.
        location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}]},{},["../node_modules/parcel-bundler/src/builtins/hmr-runtime.js","browser.ts"], null)
//# sourceMappingURL=/browser.63d73b92.js.map