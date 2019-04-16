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
 * update by destiny on 2019-04-01
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
    this.editOptions = options.edit || {};
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

    // modal
    this.modal = new Modal(this.el, this.editOptions);
    this.modal.init();

    // graph
    this.render('Force')
      .bindEvents();
    
    // cache
    this.cache = new Cache();
    this.eventProxy.emit('store');
    this.refreshCacheToolbar();
    
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
      .bindModalEvent();
    this.eventProxy.emit('render');
  }
  bindMenuEvent() {    
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
      this.eventProxy.emit(type, data);
    })
    return this;
  }
  bindModalEvent() {
    this.modal.bindClickEvents((type, data) => {
      this.eventProxy.emit(type, data);
    })
  }
  bindEventListeners() {
    // 图谱的渲染
    this.eventProxy.on('render', () => {
      // 绑定右键
      this.graph.bindRightClick((d) => {
        let type = d ? (d._to ? 'edge' : 'vertex') : 'default';
        this.eventProxy.emit('menu.' + type, d);
      })
      this.graph.bindLineWith(() => {
        this.graphRender();
        this.eventProxy.emit('store');
        this.refreshCacheToolbar();
      })
      // 右键菜单的隐藏
      this.graph.drag.on('start', (...arg) => {
        this.eventProxy.emit('menu.hide');
        this.graph.onDragStart.apply(this.graph, arg);
      })
      this.graph.zoom.on('zoom', () => {
        this.eventProxy.emit('menu.hide');
        this.refreshZoomToolbar();
        this.graph.onZoom.call(this.graph);
      })
    })
    // 菜单的显示
    this.eventProxy.on('menu.vertex', (d) => {
      this.menu.renderInnerHTML('vertex', d);
      this.eventProxy.emit('edit.hide');
      this.menu.show();
    })
    this.eventProxy.on('menu.edge', (d) => {
      this.menu.renderInnerHTML('edge', d);
      this.eventProxy.emit('edit.hide');
      this.menu.show();
    })
    this.eventProxy.on('menu.default', () => {
      this.menu.renderInnerHTML('default');
      this.eventProxy.emit('edit.hide');
      this.menu.show();
    })
    this.eventProxy.on('menu.hide', () => {
      this.menu.hide();
    })

    // 编辑弹窗的显示
    this.eventProxy.on('edit.vertex', (el) => {
      console.log('edit vertex');
      let data = el.parentNode.data;
      this.modal.showVertexModal(data);
      this.eventProxy.emit('menu.hide');
    })
    this.eventProxy.on('edit.edge', (el) => {
      console.log('edit edge');
      let data = el.parentNode.data;
      this.modal.showEdgeModal(data);
      this.eventProxy.emit('menu.hide');
    })
    this.eventProxy.on('edit.hide', () => {
      this.modal.hideModal('edge')
        .hideModal('vertex');
    })

    // 功能
    // 缓存和撤销重做
    this.eventProxy.on('undo', (el) => {
      console.log('undo');
      if (this.cache.point === 1) return;
      let data = this.cache.prev();
      if (data) {
        this.graph.changeRawData(data)
          .preprocessData();
        this.graphRender();
        this.refreshCacheToolbar();
      }
    })
    this.eventProxy.on('redo', (el) => {
      console.log('redo');
      if (this.cache.point === this.cache.length) return;
      let data = this.cache.next();
      if (data) {
        this.graph.changeRawData(data)
          .preprocessData();
        this.graphRender();
        this.refreshCacheToolbar();
      }
    })
    this.eventProxy.on('store', () => {
      this.cache.store(this.graph.rawData);
    })
    // 选择和框选
    this.eventProxy.on('multi', (el) => {
      console.log('multi');
      
      let siblings = el.parentNode.childNodes;
      Array.from(siblings).forEach(item => {
        item === el ? item.classList.add('active') : item.classList.remove('active');
      });
      this.graph.svg.on('dblclick.zoom', null);
    })
    this.eventProxy.on('select', (el) => {
      console.log('select');
      let siblings = el.parentNode.childNodes;
      Array.from(siblings).forEach(item => {
        item === el ? item.classList.add('active') : item.classList.remove('active');
      })
    })
    // 图谱切换
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
    // 缩放
    this.eventProxy.on('zoom_in', (el) => {
      console.log('zoom_in');
      if (el.classList.contains('not-allow')) {
        return;
      } 
      const step = 0.3;
      this.graph.zoomTo(step + this.graph.getTransform().k);
      this.refreshZoomToolbar();
    })
    this.eventProxy.on('zoom_out', (el) => {
      console.log('zoom_out');
      if (el.classList.contains('not-allow')) {
        return;
      } 
      const step = -0.3;
      this.graph.zoomTo(step + this.graph.getTransform().k);
      this.refreshZoomToolbar();
    })
    this.eventProxy.on('fit', () => {
      console.log('fit');
      let chart = this.el.querySelector('.chart').getBoundingClientRect();
      let container = this.el.getBoundingClientRect();
      let toolbarH = this.toolbar.el.getBoundingClientRect().height;

      // 当前图的中心坐标
      let chartX = chart.left + chart.width / 2;
      let chartY = chart.top + chart.height / 2;
      // 图展示区域的中心坐标
      let centerX = container.width / 2;
      let centerY = container.height / 2 + toolbarH / 2;

      let {k:curK,x:curX, y:curY} = this.graph.getTransform();

      // 容器高度要减去 toolbar 的高度，防止 toolbar 盖住图谱
      let nextK = Math.min(container.width / chart.width, (container.height - toolbarH) / chart.height) * curK;

      // 计算移位：(centerX - nextX) * nextK = (chartX - curX) * curK
      let nextX = centerX - (chartX - curX) / curK * nextK;
      let nextY = centerY - (chartY - curY) / curK * nextK;

      this.graph.transformTo(d3.zoomIdentity.translate(nextX, nextY).scale(nextK));
      this.refreshZoomToolbar();
    })
    this.eventProxy.on('actual_size', () => {
      console.log('actual_size');
      // 通过计算使得最终缩放值为 1
      this.graph.zoomTo(1);
      this.refreshZoomToolbar();
    })
    // 信息和数据过滤
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
    this.eventProxy.on('search', (data) => {
      let search = data.search;
      let relation = data.relation;
      this.graph.filterVertex(d => {
        if (!search.name) return true;
        return d.name === search.name;
      }, true);
      this.graph.filterEdge(d => {
        return relation.includes(d.type);
      });
      this.graphRender();
      this.eventProxy.emit('resetInfo');
    })
    this.eventProxy.on('reset', () => {
      this.graph.resetData();
      this.graphRender();
      this.eventProxy.emit('resetInfo');      
    })
    this.eventProxy.on('resetInfo', () => {
      this.info.bindData(this.graph.getCount());
    })

    // 新增节点
    this.eventProxy.on('create.vertex', (el) => {
      let x = parseInt(el.parentNode.style.left);
      let y = parseInt(el.parentNode.style.top);
      this.graph.addVertex(x, y);
      this.eventProxy.emit('menu.hide');
      this.eventProxy.emit('store');
      this.refreshCacheToolbar();
      this.graphRender();
    })
    // 编辑保存节点和边
    this.eventProxy.on('save.vertex', (data) => {
      console.log('save vertex');
      this.eventProxy.emit('edit.hide');
      this.graph.changeVertexData(data);
      this.eventProxy.emit('store');
      this.refreshCacheToolbar();
      this.graphRender();
    })
    this.eventProxy.on('save.edge', (data) => {
      console.log('save edge');
      this.eventProxy.emit('edit.hide');
      this.graph.changeEdgeData(data);
      this.eventProxy.emit('store');
      this.refreshCacheToolbar();
      this.graphRender();
    })
    this.eventProxy.on('remove.vertex', (el) => {
      console.log('remove vertex');
      let data = el.parentNode.data;
      this.graph.removeVertex(data._id);
      this.eventProxy.emit('menu.hide');
      this.eventProxy.emit('store');
      this.refreshCacheToolbar();
      this.graphRender();
    })
    this.eventProxy.on('remove.edge', (el) => {
      console.log('remove edge');
      let data = el.parentNode.data;
      this.graph.removeEdge(data._id);
      this.eventProxy.emit('menu.hide');
      this.eventProxy.emit('store');
      this.refreshCacheToolbar();
      this.graphRender();
    })
    this.eventProxy.on('copy', (el) => {
      console.log('copy vertex');
    })
    this.eventProxy.on('paste', (el) => {
      console.log('paste');
    })

    // 导出
    this.eventProxy.on('export_json', (el) => {
      console.log('export_json');
      let blob = new Blob([JSON.stringify(this.graph.rawData)], { type: "" });
      let alink = document.createElement("a");
      alink.id = "download";
      alink.href = URL.createObjectURL(blob);
      alink.setAttribute('download', 'data.json');
      alink.click();
      alink = null;
      this.eventProxy.emit('menu.hide');
    })
    this.eventProxy.on('export_png', (el) => {
      console.log('export_png');
    })

    return this;
  }

  /* 辅助方法 */
  refreshZoomToolbar() {
    let scale = this.graph.getTransform().k;
    let scaleExtent = this.graph.zoom.scaleExtent();

    if (scale <= scaleExtent[0]) {
      // 达到最小
      let zoom_out = document.querySelector('[data-operation="zoom_out"]');
      zoom_out.classList.add('not-allow');
    }
    else if (scale >= scaleExtent[1]) {
      // 达到最大
      let zoom_in = document.querySelector('[data-operation="zoom_in"]');
      zoom_in.classList.add('not-allow');
    } else {
      // 其他情况
      let zoom_out = document.querySelector('[data-operation="zoom_out"]');
      let zoom_in = document.querySelector('[data-operation="zoom_in"]');
      zoom_out.classList.remove('not-allow');
      zoom_in.classList.remove('not-allow');
    }
  }
  refreshCacheToolbar() {
    let undo = document.querySelector('[data-operation="undo"]');
    let redo = document.querySelector('[data-operation="redo"]');
    let len = this.cache.length;
    let point = this.cache.point;
    if (len === 1) {
      undo.classList.add('not-allow');
      redo.classList.add('not-allow');
    } else if (point === 1) {
      undo.classList.add('not-allow');
      redo.classList.remove('not-allow');
    } else if (point === len) {
      undo.classList.remove('not-allow');
      redo.classList.add('not-allow');
    } else {
      undo.classList.remove('not-allow');
      redo.classList.remove('not-allow');
    }
  }
  graphRender() {
    this.graph.reRender();
    this.eventProxy.emit('render');
  }
}