/**
 * EventEmitter: 订阅发布模式类
 *
 * @constructor
 *    ponds: 订阅池 {type: [ ... ]}
 *
 * @function
 *    on(type, listener): 订阅
 *    once(type, listener): 只订阅一次
 *    off(type, listener): 取消订阅
 *    emit(type, ...args): 发布
 *    listeners(type): 获取所有订阅者
 *
 * create by destiny on 2018-09-04
 * update by destiny on 2019-03-25
 */
class EventEmitter {
  constructor() {
    this.ponds = {};
  }
  //=> 订阅
  on(type, listener) {
    // listener 必须是函数
    if (typeof listener !== 'function')
      throw new error("the second param of 'on' must be a function");
    this.ponds[type] = this.ponds[type] || [];

    // 判断事件池中是否已存在相同的 listener，存在则不添加
    let n = this.ponds[type].indexOf(listener);
    if (n === -1) {
      this.ponds[type].push(listener);
    }

    return this;
  }

  //=> 订阅一次
  once(type, listener) {
    if (typeof listener !== 'function')
      throw new error("the second param of 'once' must be a function");

    let fn = (...args) => {
      this.off(type, listener);
      listener.apply(this, args);
    };

    fn.source = listener; // 将源函数挂载到 fn 上

    return this.on(type, fn);
  }

  //=> 执行容器中所有的方法
  // 参数为 type, ...args
  emit(...args) {
    let type = args.shift();

    let listeners = this.ponds[type];
    if (!listeners) return;

    // 锁死队列，防止事件池中的函数不断向事件池添加订阅，出现死循环
    listeners = listeners.slice();

    // 进行逐个发布
    listeners.forEach(function(item) {
      item(...args);
    });

    return this;
  }

  //=> 取消订阅
  off(type, listener) {
    let listeners = this.ponds[type];
    if (!listeners) return this;
    for (let i = 0; i < listeners.length; i++) {
      // 判断是否是源函数，这里考虑了 once 的特殊情况
      if (listeners[i] === listener || listeners[i].source === listener) {
        listeners.splice(i, 1);
        break;
      }
    }
    if (listeners.length === 0) {
      delete this.ponds[type]; // 防止空的时候还进行遍历判断
    }
    return this;
  }

  //=> 获取所有的订阅者
  listeners(type) {
    // 返回克隆数组
    return (this.ponds[type] || []).slice();
  }
}
export default EventEmitter;
