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
class EventEmitter {}
export default EventEmitter;
