~function polyfill() {
  // Array.prototype.includes
  if (!Array.prototype.includes || typeof Array.prototype.includes !== 'function') {
      Object.defineProperty(Array.prototype, 'includes', {
          value: function (searchElement, fromIndex) {
              if (this === null) {
                  throw new TypeError('"this" is null or not defined');
              }

              var o = Object(this);

              var len = o.length >>> 0;

              if (len === 0) {
                  return false;
              }

              var n = fromIndex | 0;

              var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

              function sameValueZero(x, y) {
                  return x === y || (typeof  x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
              }

              while (k < len) {
                  if (sameValueZero(o[k], searchElement)) {
                      return true;
                  }

                  k++;
              }

              return false;
          }
      })
  }

  // Object.assign
  if (!Object.assign || typeof Object.assign !== 'function') {
      Object.defineProperty(Object, 'assign', {
          value: function assign(target, varArgs) {
              'use strict';
              if (target === null) {
                  throw new TypeError('Cannot convert undefined or null to object');
              }

              var to = Object(target);

              for (var i = 1; i < arguments.length; i++) {
                  var nextSource = arguments[i];

                  if (nextSource !== null) {
                      for (var nextKey in nextSource) {
                          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                              to[nextKey] = nextSource[nextKey];
                          }
                      }
                  }
              }
              return to;
          },
          writable: true,
          configurable: true
      })
  }
}();