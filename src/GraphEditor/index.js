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
 * update by destiny on 2020- 04-01
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
import { checkEl } from '../utils';

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
  init() {
    this.cache.init(this.data);
    this.graph.render();
    this.toolbar.init();
    this.info.init(this.graph.getCount());
    this.search.init();
    this.modal.init();
    this.menu.init();
    this.createModal();
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

    let body = this.createForm('vertex_form', 'vertex', this.getVertexFormConfig());

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

    let body = this.createForm('edge_form', 'edge', this.getEdgeFormConfig());

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

  /* 辅助函数 */
  // 根据配置动态创建表单
  // TODO: 需要增加 checkbox/radio 等其他表单控件的创建方法
  createForm(id, type, config) {
    // id 为 form 的 id
    // type 为每个 formItem 上 id 的前缀, 防止 id 重复
    // config 为 formItem 的配置
    let form = `<form class="form" id="${id}">`;

    config.forEach(c => {
      let formItem = this[`create${this.toUpperFirst(c.type)}`](c, type);
      form += formItem;
    });
    form += '</form>';
    return form;
  }
  createSelect({ name, content, options }, type) {
    let select = `
      <div class="form-item">
        <label for="${type}_${name}" class="label">${content}</label>
        <select id="${type}_${name}" class="input" name="${name}">
      `;
    options.forEach(option => {
      select += `<option value="${option.value}">${option.content}</option>`;
    });
    select += '</select></div>';

    return select;
  }
  createNumber({ name, content, extent }, type) {
    return `
      <div class="form-item">
        <label for="${type}_${name}" class="label">${content}</label>
        <input type="number" id="${type}_${name}" min="${extent[0]}" max="${extent[1]}" class="input" name="${name}">
      </div>
    `;
  }
  createText({ name, content }, type) {
    return `
      <div class="form-item">
        <label for="${type}_${name}" class="label">${content}</label>
        <input type="text" id="${type}_${name}" class="input" name="${name}">
      </div>`;
  }
  // 获取表单数据
  getFormData(id) {
    let form = document.getElementById(id);
    let formArr = Array.prototype.slice.call(form);
    let data = {};

    formArr.forEach(item => {
      let { name, value, type } = item;
      switch (type) {
        case 'checkbox':
          if (item.checked) {
            if (data[name]) {
              data[name].push(value);
            } else {
              data[name] = [value];
            }
          }
          break;
        case 'radio':
          if (item.checked) {
            if (value === 'false') {
              value = false;
            }
            if (value === 'true') {
              value = true;
            }
            data[name] = value;
          }
          break;
        case 'text':
        default:
          data[name] = value;
      }
    });

    return data;
  }
  // 转换为首字母大写
  toUpperFirst(str) {
    return str
      .split('')
      .map((item, index) => {
        if (index === 0) {
          return item.toUpperCase();
        }
        return item.toLowerCase();
      })
      .join('');
  }
}

export default GraphEditor;
