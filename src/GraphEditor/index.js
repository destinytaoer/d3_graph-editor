/**
 * GraphEditor: 图编辑器类
 *
 * @parameter
 *   el [ HTMLElement | String ] 容器元素或者 ID
 *   data: 数据
 *   options [ Object ] 配置选项
 *
 * @constructor
 *   el: 容器, HTML 元素
 *   graph: 当前图实例
 *   type: 当前图谱类型
 *   data: 数据
 *   eventProxy: 事件池
 *   toolbar: 菜单栏
 *   info: 信息面板
 *   search: 过滤面板
 *   menu: 右键菜单
 *   vertexModal: 节点表单弹窗
 *   edgeModal: 边表单弹窗
 *   outModal: 离开时的提示弹窗
 *
 * @methods
 *   getVertexFormConfig(): 可复写方法, 设置节点的信息表单项
 *   getEdgeFormConfig(): 可复写方法, 设置边的信息表单项
 *
 * create by destiny on 2019-03-26
 * update by destiny on 2020-04-10
 */
import Force from '../Graph/Force';
import Tree from '../Graph/Tree';
import Cache from './Cache.js';
import EventEmitter from './EventEmitter';
import Toolbar from './Toolbar';
import Info from './Info';
import Search from './Search';
import Menu from './Menu';
import Modal from './Modal';
import { checkEl, createFormHTML, setFormData, getFormData, deepCopy } from '../utils';

class GraphEditor {
  constructor(el, data, options = {}) {
    this.el = checkEl(el);
    this.data = data;

    // 配置
    this.toolbarOptions = options.toolbar || {};
    this.searchOptions = options.search || {};
    this.menuOptions = options.menu || {};
    this.graphOptions = options.graph || {};
    this.modalOptions = options.modal || {};
    this.infoOptions = options.info || {};
    this.editOptions = options.edit || {};
    this.type = this.graphOptions.type || 'force';

    // 各模块实例
    this.eventProxy = new EventEmitter();
    this.cache = new Cache();
    this.graph =
      this.type === 'force'
        ? new Force(this.el, this.data, this.graphOptions)
        : new Tree(this.el, this.data, this.graphOptions);
    this.toolbar = new Toolbar(this.el, this.type, this.toolbarOptions);
    this.info = new Info(this.el, this.infoOptions);
    this.search = new Search(this.el, this.searchOptions);
    this.menu = new Menu(this.el, this.menuOptions);

    // 标识当前 menu 选中的 ID
    this.curId = null;
  }
  /* 初始化 */
  init() {
    let _this = this;
    this.graph.renderEnd = function () {
      if (_this.cache.length === 0) {
        _this.cache.init({
          rawData: deepCopy(this.rawData),
          chartData: deepCopy(this.data),
        });
      }
    };
    this.graph.bindEvents = function () {
      this.bindRightClick(_this.rightClickHandler.bind(_this));
      this.bindLineWith(
        () => {
          _this.eventProxy.emit('menu.hide');
        },
        (cache) => {
          _this.eventProxy.emit('store', cache);
        }
      );
    };
    this.graph.render();

    this.toolbar.init();
    this.info.init(this.graph.getCount());
    this.search.init();
    this.menu.init();
    this.createModal();

    this.initCacheBar();
    this.subscribeListeners();
    this.bindEvents();
  }
  // 创建弹窗
  createModal() {
    this.createVertexModal();
    this.createEdgeModal();
    this.createOutModal();
  }
  getVertexFormConfig() {
    return [
      {
        name: 'name',
        content: '名称',
        type: 'text',
      },
      {
        name: 'type',
        content: '类型',
        type: 'select',
        options: [
          {
            value: 'person',
            content: '人',
          },
          {
            value: 'company',
            content: '企业',
          },
        ],
      },
      {
        name: 'level',
        content: '层级',
        type: 'number',
        extent: [1, 5],
      },
    ];
  }
  createVertexModal() {
    let title = '修改节点信息';

    let body = createFormHTML('vertex_form', 'vertex', this.getVertexFormConfig());

    let footer = `
      <div class="btns">
        <button type="button" id="vertexCancle" class="btn btn-default">取消</button>
        <button type="button" id="vertexSave" class="btn btn-info">保存</button>
      </div>
    `;
    this.vertexModal = new Modal(this.el, { title, body, footer });
  }
  getEdgeFormConfig() {
    return [
      {
        name: 'label',
        content: '内容',
        type: 'text',
      },
      {
        name: 'type',
        content: '类型',
        type: 'select',
        options: [
          {
            value: 'invest',
            content: '投资',
          },
          {
            value: 'self',
            content: '内部调整',
          },
          {
            value: 'member',
            content: '成员',
          },
        ],
      },
    ];
  }
  createEdgeModal() {
    let title = '修改边信息';

    let body = createFormHTML('edge_form', 'edge', this.getEdgeFormConfig());

    let footer = `
      <div class="btns">
        <button type="button" id="edgeCancle" class="btn btn-default">取消</button>
        <button type="button" id="edgeSave" class="btn btn-info">保存</button>
      </div>
    `;
    this.edgeModal = new Modal(this.el, { title, body, footer });
  }
  createOutModal() {
    let title = null;

    let body = '<p>您的修改还没有保存, 是否保存并离开?</p>';

    let footer = `
      <div class="btns">
        <button type="button" id="outCancle" class="btn btn-default">取消</button>
        <button type="button" id="outNotSave" class="btn btn-danger">不保存</button>
        <button type="button" id="outSave" class="btn btn-info">保存</button>
      </div>
    `;
    this.outModal = new Modal(this.el, { title, body, footer });
  }

  /* 功能订阅 */
  subscribeListeners() {
    this.addToolbarListeners();
    this.addSearchListeners();
    this.addInfoListeners();
    if (this.type === 'force') {
      this.addForceListeners();
    }
    this.addMenuListeners();
    this.addModalListeners();
  }
  // Toolbar 的功能实现
  addToolbarListeners() {
    // 缓存和撤销重做
    this.eventProxy.on('undo', (el) => {
      let cache = this.cache.prev();
      if (cache) {
        this.loadCache(cache);
        this.refreshCacheToolbar();
      }
    });
    this.eventProxy.on('redo', (el) => {
      let cache = this.cache.next();
      if (cache) {
        this.loadCache(cache);
        this.refreshCacheToolbar();
      }
    });
    this.eventProxy.on('store', (cache) => {
      this.cache.store(cache);
      this.refreshCacheToolbar();
    });

    // 缩放
    this.eventProxy.on('zoom_in', (el) => {
      const step = 0.3;
      let curk = step + this.graph.getTransform().k;
      this.graph.zoomTo(curk);
    });
    this.eventProxy.on('zoom_out', (el) => {
      const step = -0.3;
      let curk = step + this.graph.getTransform().k;
      this.graph.zoomTo(curk);
    });
    this.eventProxy.on('actual_size', () => {
      // 通过计算使得最终缩放值为 1
      this.graph.zoomTo(1);
    });
    // 信息和数据过滤
    this.eventProxy.on('info', (el) => {
      el.classList.toggle('active');
      this.info.toggle();
    });
    this.eventProxy.on('filter', (el) => {
      el.classList.toggle('active');
      this.search.toggle();
    });

    // 关闭
    this.eventProxy.on('close', (el) => {
      console.log('close');
      this.outModal.show();
    });
  }
  // Search 的功能实现
  addSearchListeners() {
    this.eventProxy.on('search', (data) => {
      let { vertex, edge } = data;
      if (vertex) {
        this.graph.filterVertex((d) => {
          return this.filterData(vertex, d);
        }, true);
      }
      if (edge) {
        this.graph.filterEdge((d) => {
          return this.filterData(edge, d);
        });
      }
      this.graph.update();
      this.eventProxy.emit('reset.info');
    });
    this.eventProxy.on('reset', () => {
      this.graph.resetData();
      this.eventProxy.emit('reset.info');
    });
  }
  // Info 的功能实现
  addInfoListeners() {
    this.eventProxy.on('reset.info', () => {
      this.info.bindData(this.graph.getCount());
    });
  }
  // Force 的功能实现
  addForceListeners() {
    // 右键菜单的隐藏
    this.graph.drag.on('start.else', (...arg) => {
      this.eventProxy.emit('menu.hide');
    });
    this.graph.zoom.on('start', () => {
      this.eventProxy.emit('menu.hide');
    });
    this.graph.zoom.on('end', () => {
      let scale = d3.event.transform.k;
      this.refreshZoomToolbar(scale);
    });
  }
  // Menu 的功能实现
  addMenuListeners() {
    // 菜单的显示隐藏
    this.eventProxy.on('menu.vertex', (position) => {
      this.menu.show('vertex', position);
    });
    this.eventProxy.on('menu.edge', (position) => {
      this.menu.show('edge', position);
    });
    this.eventProxy.on('menu.default', (position) => {
      this.menu.show('default', position);
    });
    this.eventProxy.on('menu.hide', () => {
      this.menu.hide();
    });

    // 菜单点击功能
    // 新增 / 编辑 / 删除功能
    this.eventProxy.on('create.vertex', (data, e) => {
      this.eventProxy.emit('menu.hide');
      let x = e.pageX;
      let y = e.pageY;
      this.graph.addVertex(x, y, {}, (cache) => {
        this.eventProxy.emit('store', cache);
      });
    });
    this.eventProxy.on('edit.vertex', (data) => {
      this.eventProxy.emit('menu.hide');
      setFormData('vertex_form', data);
      this.vertexModal.show();
    });
    this.eventProxy.on('edit.edge', (data) => {
      this.eventProxy.emit('menu.hide');
      setFormData('edge_form', data);
      this.edgeModal.show();
    });
    this.eventProxy.on('remove.vertex', (data) => {
      this.eventProxy.emit('menu.hide');
      this.graph.removeVertex(data._id, (cache) => {
        this.eventProxy.emit('store', cache);
      });
    });
    this.eventProxy.on('remove.edge', (data) => {
      this.eventProxy.emit('menu.hide');
      this.graph.removeEdge(data._id, (cache) => {
        this.eventProxy.emit('store', cache);
      });
    });
    this.eventProxy.on('check.vertex', (data) => {
      // TODO: 查看
    });
    this.eventProxy.on('check.edge', (data) => {
      // TODO: 查看
    });

    // 导出
    this.eventProxy.on('export.json', (el) => {
      let blob = new Blob([JSON.stringify(this.graph.rawData)], {
        type: 'application/json;chart=utf-8',
      });
      let alink = document.createElement('a');
      alink.id = 'download';
      alink.href = URL.createObjectURL(blob);
      alink.setAttribute('download', 'data.json');
      alink.click();
      alink = null;
      this.eventProxy.emit('menu.hide');
    });
    this.eventProxy.on('export.png', (el) => {
      this.saveAsPng(this.graph.svg.node());
      this.eventProxy.emit('menu.hide');
    });
    // 导入
    this.eventProxy.on('import', (el) => {
      this.importJson((result) => {
        let data = JSON.parse(result);
        data = Object.assign({ vertexes: [], edges: [] }, data);
        this.cache.clear();
        this.initCacheBar();
        this.graph.useCache(data, data);
        this.eventProxy.emit('menu.hide');
      });
    });
  }
  addModalListeners() {
    this.eventProxy.on('save.vertex', (data) => {
      this.graph.updateVertex(data, (cache) => {
        this.eventProxy.emit('store', cache);
      });
      this.vertexModal.hide();
    });
    this.eventProxy.on('save.edge', (data) => {
      this.graph.updateEdge(data, (cache) => {
        this.eventProxy.emit('store', cache);
      });
      this.edgeModal.hide();
    });
  }

  /* 事件派发 */
  bindEvents() {
    this.bindToolbarEvent();
    this.bindSearchEvent();
    this.bindMenuEvent();
    this.bindModalEvent();
  }
  bindToolbarEvent() {
    this.toolbar.bindClickEvents((el, operation) => {
      this.eventProxy.emit(operation, el);
    });
  }
  bindSearchEvent() {
    this.search.bindClickEvents((type, data) => {
      this.eventProxy.emit(type, data);
    });
  }
  bindMenuEvent() {
    this.menu.bindClickEvents((e, operation) => {
      let isVertex = operation.includes('vertex');
      let data = this.curId
        ? isVertex
          ? this.graph.getVertexById(this.curId)
          : this.graph.getEdgeById(this.curId)
        : null;
      this.eventProxy.emit(operation, data, e);
    });
  }
  rightClickHandler(d) {
    let type = d ? (d._to ? 'edge' : 'vertex') : 'default';
    this.curId = type === 'default' ? null : d._id;
    let { offsetX, offsetY } = d3.event;
    this.eventProxy.emit('menu.' + type, {
      top: offsetY,
      left: offsetX,
    });
  }
  bindModalEvent() {
    let vertexCancle = document.getElementById('vertexCancle');
    let vertexSave = document.getElementById('vertexSave');
    let edgeCancle = document.getElementById('edgeCancle');
    let edgeSave = document.getElementById('edgeSave');
    let outCancle = document.getElementById('outCancle');
    let outNotSave = document.getElementById('outNotSave');
    let outSave = document.getElementById('outSave');

    vertexCancle.addEventListener('click', () => {
      this.vertexModal.hide();
    });
    vertexSave.addEventListener('click', () => {
      let data = getFormData('vertex_form');
      data._id = this.curId;
      this.eventProxy.emit('save.vertex', data);
      this.vertexModal.hide();
    });
    edgeCancle.addEventListener('click', () => {
      this.edgeModal.hide();
    });
    edgeSave.addEventListener('click', () => {
      let data = getFormData('edge_form');
      data._id = this.curId;
      this.eventProxy.emit('save.edge', data);
      this.edgeModal.hide();
    });
    outCancle.addEventListener('click', () => {
      this.outModal.hide();
    });
    outNotSave.addEventListener('click', () => {
      this.outModal.hide();
      // TODO: 关闭整个窗口
    });
    outSave.addEventListener('click', () => {
      this.outModal.hide();
      // TODO: 关闭整个窗口并保存
    });
  }

  /* 辅助方法 */
  refreshZoomToolbar(scale) {
    let scaleExtent = this.graph.zoom.scaleExtent();
    let zoom_out = document.querySelector('[data-operation="zoom_out"]');
    let zoom_in = document.querySelector('[data-operation="zoom_in"]');

    if (scale <= scaleExtent[0]) {
      // 达到最小
      zoom_out.classList.add('not-allow');
      zoom_in.classList.remove('not-allow');
    } else if (scale >= scaleExtent[1]) {
      // 达到最大
      zoom_in.classList.add('not-allow');
      zoom_out.classList.remove('not-allow');
    } else {
      // 其他情况
      zoom_out.classList.remove('not-allow');
      zoom_in.classList.remove('not-allow');
    }
  }
  initCacheBar() {
    let undo = document.querySelector('[data-operation="undo"]');
    let redo = document.querySelector('[data-operation="redo"]');
    undo.classList.add('not-allow');
    redo.classList.add('not-allow');
  }
  refreshCacheToolbar() {
    let undo = document.querySelector('[data-operation="undo"]');
    let redo = document.querySelector('[data-operation="redo"]');
    let len = this.cache.length;
    let point = this.cache.point;
    if (len === 1) {
      console.log('1');
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
  filterData(data, d) {
    for (let key in data) {
      let value = data[key];
      if (value) {
        if (Array.isArray(value)) {
          return value.includes(d[key]);
        } else {
          return d[key] === value;
        }
      }
    }
    return true;
  }
  loadCache(cache) {
    let { rawData, chartData } = cache;
    this.graph.useCache(rawData, chartData);
  }
  processCache(operation, cache) {
    let { type, target, data } = cache;
    switch (`${operation}-${type}`) {
      case 'redo-add':
      case 'undo-remove':
        this.addData(target, data);
        break;
      case 'undo-update':
        this.updateData(target, data.old);
        break;
      case 'redo-update':
        this.updateData(target, data.new);
        break;
      case 'redo-remove':
      case 'undo-add':
        this.removeData(target, data);
    }
  }
  updateData(target, data) {
    if (target === 'vertex') {
      this.graph.updateVertex(data);
    } else {
      this.graph.updateEdge(data);
    }
  }
  addData(target, data) {
    if (target === 'vertex') {
      if (data.vertex) {
        // {vertex, edges} 需要增加 一个顶点和多条边
        this.graph.reAddVertex(data);
      } else {
        this.graph.reAddVertex({ vertex: data });
      }
    } else {
      this.graph.addEdge(data);
    }
  }
  removeData(target, data) {
    if (target === 'vertex') {
      if (data.vertex) {
        this.graph.removeVertex(data.vertex._id);
      } else {
        this.graph.removeVertex(data._id);
      }
    } else {
      this.graph.removeEdge(data._id);
    }
  }
  saveAsPng(svg) {
    let serializer = new XMLSerializer();
    let source = '<?xml version="1.0" standalone="no"?>\r\n' + serializer.serializeToString(svg);
    let image = new Image();
    image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source);
    let canvas = document.createElement('canvas');
    canvas.width = svg.getAttribute('width');
    canvas.height = svg.getAttribute('height');
    let context = canvas.getContext('2d');
    context.fillStyle = '#fff'; //#fff设置保存后的PNG 是白色的
    context.fillRect(0, 0, canvas.width, canvas.height);
    image.onload = () => {
      context.drawImage(image, 0, 0);
      document.body.appendChild(canvas);
      let alink = document.createElement('a');
      alink.download = 'name.png';
      alink.href = canvas.toDataURL('image/png');
      alink.click();
      alink = null;
    };
  }
  importJson(cb) {
    let input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', '.json');
    input.click();
    input.addEventListener('change', () => {
      let reader = new FileReader();
      reader.readAsText(input.files[0], 'UTF-8');
      reader.onload = (e) => {
        input = null;
        reader = null;
        let result = e.target.result || '{}';
        cb && cb(result);
      };
    });
  }
}

export default GraphEditor;
