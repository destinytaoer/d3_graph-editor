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
    this.searchOptions = options.search || {};
    this.menuOptions = options.menu || {};
    this.graphOptions = options.graph || {};
    this.infoOptions = options.info || {};
    this.eventProxy = new EventEmitter();
  }
  init() {
    // search
    this.search = new Search(this.el, this.searchOptions);
    this.search.init();
    // menu
    this.menu = new Menu(this.el, this.menuOptions);
    this.menu.init();
    // toolbar
    this.toolbar = new Toolbar(this.el, this.toolbarOptions);
    this.toolbar.init();

    // graph
    this.render('Force')
      .bindEvents();
    
    // info
    this.info = new Info(this.el, this.infoOptions);
    this.info.init(this.graph.getCount());
  }
  render(type) {
    let typeMap = {
      'Force': Force,
      // 'Tree': Tree
    }
    this.graph = new typeMap[type](this.el, this.options.graph);
    this.graph.init();
    return this;
  }
  bindEvents() {
    this.bindEventListeners()
      .bindMenuEvent()
      .bindToolbarEvent()
      .bindSearchEvent()
  }
  bindMenuEvent() {
    // 显示 menu
    this.graph.bindRightClick((d) => {
      let type = d ? (d._to ? 'edge' : 'vertex') : 'default';
      this.eventProxy.emit('menu.' + type);
    })
    // 绑定菜单点击
    this.menu.bindClickEvents((el) => {
      this.eventProxy.emit(el.dataset.operation, el);
    })
    return this;
  }
  bindToolbarEvent() {
    // 工具栏点击
    this.toolbar.bindClickEvents((el) => {
      this.eventProxy.emit(el.dataset.operation, el);
    })
    
    return this;
  }
  bindSearchEvent() {
    // 搜索
    this.search.bindClickEvents((type, data) => {
      if (type === 'search') {
        let search = data.search;
        let relation = data.relation;
        this.graph.filterVertex(d => {
          return d.name === search.name;
        }, true);
        this.graph.filterEdge(d => {
          return relation.includes(d.type);
        });
        this.graph.reRender();
      } else {
        this.graph.resetData();
      }
    })
    return this;
  }
  bindEventListeners() {
    // 菜单的显示
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

    // 功能
    this.eventProxy.on('undo', (el) => {
      console.log('undo');
    })
    this.eventProxy.on('redo', (el) => {
      console.log('redo');
    })
    this.eventProxy.on('multi', (el) => {
      console.log('multi');
      
      let siblings = el.parentNode.childNodes;
      Array.from(siblings).forEach(item => {
        item === el ? item.classList.add('active') : item.classList.remove('active');
      })
    })
    this.eventProxy.on('select', (el) => {
      console.log('select');
      let siblings = el.parentNode.childNodes;
      Array.from(siblings).forEach(item => {
        item === el ? item.classList.add('active') : item.classList.remove('active');
      })
    })
    this.eventProxy.on('tree', (el) => {
      console.log('tree');
      let siblings = el.parentNode.childNodes;
      Array.from(siblings).forEach(item => {
        item === el ? item.classList.add('active') : item.classList.remove('active');
      })
    })
    this.eventProxy.on('force', (el) => {
      console.log('force');
      let siblings = el.parentNode.childNodes;
      Array.from(siblings).forEach(item => {
        item === el ? item.classList.add('active') : item.classList.remove('active');
      })
    })
    this.eventProxy.on('zoom_in', (el) => {
      console.log('zoom_in');
    })
    this.eventProxy.on('zoom_out', (el) => {
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
      el.classList.toggle('active');
      this.info.toggle();
    })
    this.eventProxy.on('filter', (el) => {
      console.log('filter');
      el.classList.toggle('active');
      this.search.toggle();
    })
    this.eventProxy.on('copy', (el) => {
      console.log('copy');
    })
    this.eventProxy.on('paste', (el) => {
      console.log('paste');
    })
    this.eventProxy.on('export_json', (el) => {
      console.log('export_json');
    })
    this.eventProxy.on('export_png', (el) => {
      console.log('export_png');
    })

    return this;
  }
}