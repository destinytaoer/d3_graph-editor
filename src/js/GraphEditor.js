/**
 * GraphEditor: 图编辑器类
 * 
 * @parameter
 *   el [ HTMLElement | String ] 容器元素或者 ID
 *   options [ Object ] 配置选项
 *
 * @constructor
 *   el: 容器, d3 Selection 元素
 *   graph: 当前图实例
 *   eventProxy: 事件池
 *
 * @methods
 *   
 *
 * create by destiny on 2019-03-26
 * update by destiny on 2019-03-26
 */

class GraphEditor {
  constructor (el, options) {
    // 判断是否是 HTML 元素或者 ID 字符串
    if (!(el instanceof HTMLElement) && typeof el !== 'string') {
      throw new Error('BaseGraph need HTMLElement or ID as first parameter');
    }

    if (typeof el === 'string') {
      this.$el = document.getElementById(el);
      if (!this.$el) {
        throw new Error('this page has not such id');
      }
      this.el = d3.select(this.$el);
    } else {
      this.el = d3.select(el);
    }

    this.options = options;
  }
  init() {
    // toolbar
    // menu
    // Search
  }
  render(type) {
    // this.graph = new [type](this.el, this.options.data);
  }
  bindEvents() {

  }

}