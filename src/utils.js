/**
 * deepCopy: 使用 JSON 方法深拷贝
 * 注意: 使用 JSON 方法存在局限性
 *
 * @parameter
 *    obj [Object | Arrray] 需要被拷贝的对象
 *
 * @return
 *   [Object]: 拷贝后的新对象
 *
 * by destiny on 2020-03-24
 */
export function deepCopy(obj) {
  if (!isPlainObject(obj) && !Array.isArray(obj))
    throw new Error('deepCopy need plain object or array as parameter');
  return JSON.parse(JSON.stringify(obj));
}
/**
 * isPlainObject: 判断是否是普通对象
 *
 * @parameter
 *   obj [Object] 需要判断的对象
 *
 * @return
 *   [Boolean]: 是否普通对象
 *
 * by destiny on 2020-03-24
 */
export function isPlainObject(obj) {
  var proto, Ctor;
  if (!obj || Object.prototype.toString.call(obj) !== '[object Object]') {
    return false;
  }
  proto = Object.getPrototypeOf(obj);
  if (!proto) {
    return true;
  }
  Ctor = Object.prototype.hasOwnProperty.call(proto, 'constructor') && proto.constructor;
  return (
    typeof Ctor === 'function' &&
    Object.prototype.hasOwnProperty.toString.call(Ctor) ===
      Object.prototype.hasOwnProperty.toString.call(Object)
  );
}
export function checkEl(el) {
  if (!(el instanceof HTMLElement) && typeof el !== 'string') {
    throw new Error('BaseGraph need HTMLElement or ID as first parameter');
  }

  if (typeof el === 'string') {
    el = document.getElementById(el);
    if (!el) {
      throw new Error('this page has not such id');
    }
  }
  return el;
}
