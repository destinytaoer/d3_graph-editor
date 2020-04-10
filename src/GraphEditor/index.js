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
import { checkEl, createFormHTML, getFormData } from '../utils';

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
    this.modal = new Modal(this.el, this.modalOptions);
    this.menu = new Menu(this.el, this.menuOptions);
  }
  /* 初始化 */
  init() {
    this.cache.init(this.data);
    this.graph.render();
    this.toolbar.init();
    this.info.init(this.graph.getCount());
    this.search.init();
    this.modal.init();
    this.menu.init();
    this.createModal();

    this.refreshCacheToolbar();
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
        type: 'text'
      },
      {
        name: 'type',
        content: '类型',
        type: 'select',
        options: [
          {
            value: 'person',
            content: '人'
          },
          {
            value: 'company',
            content: '企业'
          }
        ]
      },
      {
        name: 'level',
        content: '层级',
        type: 'number',
        extent: [1, 5]
      }
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
        type: 'text'
      },
      {
        name: 'type',
        content: '类型',
        type: 'select',
        options: [
          {
            value: 'invest',
            content: '投资'
          },
          {
            value: 'self',
            content: '内部调整'
          },
          {
            value: 'member',
            content: '成员'
          }
        ]
      }
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
  }
  // Toolbar 的功能实现
  addToolbarListeners() {
    // 缓存和撤销重做
    this.eventProxy.on('undo', el => {
      let data = this.cache.prev();
      if (data) {
        // TODO: 撤销数据操作
        this.refreshCacheToolbar();
      }
    });
    this.eventProxy.on('redo', el => {
      let data = this.cache.next();
      if (data) {
        // TODO: 重做数据操作
        this.refreshCacheToolbar();
      }
    });
    this.eventProxy.on('store', cache => {
      this.cache.store(cache);
      this.refreshCacheToolbar();
    });

    // 缩放
    this.eventProxy.on('zoom_in', el => {
      const step = 0.3;
      let curk = step + this.graph.getTransform().k;
      this.graph.zoomTo(curk);
      this.refreshZoomToolbar(curk);
    });
    this.eventProxy.on('zoom_out', el => {
      const step = -0.3;
      let curk = step + this.graph.getTransform().k;
      this.graph.zoomTo(curk);
      this.refreshZoomToolbar(curk);
    });
    this.eventProxy.on('actual_size', () => {
      // 通过计算使得最终缩放值为 1
      this.graph.zoomTo(1);
      this.refreshZoomToolbar(1);
    });
    // 信息和数据过滤
    this.eventProxy.on('info', el => {
      el.classList.toggle('active');
      this.info.toggle();
    });
    this.eventProxy.on('filter', el => {
      el.classList.toggle('active');
      this.search.toggle();
    });
  }
  // Search 的功能实现
  addSearchListeners() {
    this.eventProxy.on('search', data => {
      let { vertex, edge } = data;
      if (vertex) {
        this.graph.filterVertex(d => {
          return this.filterData(vertex, d);
        }, true);
      }
      if (edge) {
        this.graph.filterEdge(d => {
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
  addInfoListeners() {
    this.eventProxy.on('reset.info', () => {
      this.info.bindData(this.graph.getCount());
    });
  }

  /* 事件派发 */
  bindEvents() {
    this.bindToolbarEvent();
    this.bindSearchEvent();
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

  /* 辅助方法 */
  refreshZoomToolbar(scale) {
    let scaleExtent = this.graph.zoom.scaleExtent();

    if (scale <= scaleExtent[0]) {
      // 达到最小
      let zoom_out = document.querySelector('[data-operation="zoom_out"]');
      zoom_out.classList.add('not-allow');
    } else if (scale >= scaleExtent[1]) {
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
    if (len === 0) {
      undo.classList.add('not-allow');
      redo.classList.add('not-allow');
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
}

export default GraphEditor;
