/**
 * GraphEditor: 图编辑器类
 * 
 * @parameter
 *   el [ HTMLElement | String ] 容器元素或者 ID
 *   options [ Object ] 配置选项
 *
 * @constructor
 *   el: 容器, HTML 元素
 *   $el: 容器, d3 Selection 元素
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
      this.el = document.getElementById(el);
      if (!this.el) {
        throw new Error('this page has not such id');
      }
    } else {
      this.el = el;
    }
    this.$el = d3.select(this.el);
    this.options = options;
    this.toolbarOptions = options.toolbar || {};
    this.menuOptions = options.menu || {};
    this.graphOptions = options.graph || {};
    this.eventProxy = new EventEmitter();
  }
  init() {
    // Search

    // menu
    this.menu = new Menu(this.el, this.menuOptions);
    this.menu.init();
    // toolbar
    this.toolbar = new Toolbar(this.el, this.toolbarOptions);
    this.toolbar.init();

    // graph
    this.render('Force')
      .bindEvents();
  }
  render(type) {
    let typeMap = {
      'Force': Force,
      // 'Tree': Tree
    }
    this.graph = new typeMap[type](this.el, this.options.graph);
    this.graph.render();
    return this;
  }
  bindEvents() {
    this.bindMenuEvent()
      .bindToolbarEvent()
  }
  bindMenuEvent() {
    // 隐藏 menu
    this.$el.on('click', () => {
      this.menu.hide();
    })
    // 显示 menu
    this.graph.bindRightClick((d) => {
      let type = d ? (d._to ? 'edge' : 'vertex') : 'default';
      this.eventProxy.emit('menu.' + type);
    })
    this.eventProxy.on('menu.vertex', () => {
      this.menu.renderInnerHTML('vertex');
      this.menu.show();
    })
    this.eventProxy.on('menu.edge', () => {
      this.menu.renderInnerHTML('edge');
      this.menu.show();
    })
    this.eventProxy.on('menu.default', () => {
      this.menu.renderInnerHTML('default');
      this.menu.show();
    })
    return this;
  }
  bindToolbarEvent() {
    this.toolbar.bindClickEvents((e) => {
      let el = e.target;
      if (el.classList.contains('operation')) {
        this.eventProxy.emit(el.dataset.type, el);
      }
    })
    this.eventProxy.on('undo', (el) => {
      console.log('undo');
    })
    this.eventProxy.on('redo', (el) => {
      console.log('redo');
    })
    this.eventProxy.on('multi', (el) => {
      console.log('multi');
    })
    this.eventProxy.on('select', (el) => {
      console.log('select');
    })
    this.eventProxy.on('tree', (el) => {
      console.log('tree');
    })
    this.eventProxy.on('force', (el) => {
      console.log('force');
    })
    this.eventProxy.on('zoom_in', (el) => {
      console.log('zoom_in');
    })
    this.eventProxy.on('zoom_in', (el) => {
      console.log('zoom_out');
    })
    this.eventProxy.on('fit', (el) => {
      console.log('fit');
    })
    this.eventProxy.on('actual_size', (el) => {
      console.log('actual_size');
    })
    this.eventProxy.on('info', (el) => {
      console.log('info');
    })
    
    return this;
  }
}