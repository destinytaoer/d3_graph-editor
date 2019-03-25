export default {
  isFunction(fn) {
    return typeof fn === "function";
  },
  isPlainObject: function (obj) {
    var proto, Ctor;
    if (!obj || Object.prototype.toString.call(obj) !== '[object Object]') {
      return false;
    }
    proto = Object.getPrototypeOf(obj);
    if (!proto) {
      return true;
    }
    Ctor = Object.prototype.hasOwnProperty.call(proto, 'constructor') && proto.constructor;
    return typeof Ctor === 'function' && Object.prototype.hasOwnProperty.toString.call(Ctor) === Object.prototype.hasOwnProperty.toString.call(Object);
  },
  extend: function () {
    var deep = false;
    var name, options, src, copy, clone, copyIsArray;
    var length = arguments.length;

    var i = 1;

    var target = arguments[0] || {};

    if (typeof target === 'boolean') {
      deep = target;
      target = arguments[i] || {};
      i++;
    }

    if (typeof target !== 'object' && !this.isFunction(target)) {
      target = {};
    }

    for (; i < length; i++) {
      options = arguments[i];

      if (options !== null) {
        for (name in options) {
          src = target[name];
          copy = options[name];

          if (target === copy) {
            continue;
          }

          if (deep && copy && (this.isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {
            if (copyIsArray) {
              copyIsArray = false;
              clone = src && Array.isArray(src) ? src : [];
            } else {
              clone = src && this.isPlainObject(src) ? src : {};
            }

            target[name] = this.extend(deep, clone, copy);
          } else if (copy !== undefined) {
            target[name] = copy;
          }
        }
      }
    }
    return target;
  },
  concat: function (source, target) {
    var result = {},
      key;

    for (key in source) {
      result[key] = source[key];
    }

    for (key in target) {
      result[key] = target[key];
    }
    return result;
  },
  trace: function (x) {
    //返回两点所创建的线的倾斜角
    return 180 * x / Math.PI;
  },
  linkTRotate: function (selection) {
    //调用 trace 函数生成两点之间文本的倾斜角
    selection.attr('transform', function (d) {
      var sourceX = d.source.x;
      var sourceY = d.source.y;
      var targetX = d.target.x;
      var targetY = d.target.y;

      return 'rotate(' + UTILS.trace(Math.atan2(targetY - sourceY, targetX - sourceX)) + ',' + (d.source.x + d.target.x) / 2 + ',' + (d.source.y + d.target.y) / 2 + ')';
    })
  },
  uuid: function () {
    return 'xxxxxxxxxxxxxxxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    })
  }
}