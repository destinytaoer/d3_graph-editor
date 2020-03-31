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
 *   eventProxy: 事件池
 *   toolbar: 菜单栏
 *   info: 信息面板
 *
 * @methods
 *
 *
 * create by destiny on 2019-03-26
 * update by destiny on 2020-03-28
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
    this.toolbarOptions = options.toolbar || {};
    this.searchOptions = options.search || {};
    this.menuOptions = options.menu || {};
    this.graphOptions = options.graph || {};
    this.modalOptions = options.modal || {};
    this.infoOptions = options.info || {};
    this.editOptions = options.edit || {};
    this.type = this.graphOptions.type || 'force';
  }
  init() {
    this.toolbar = new Toolbar(this.el, this.type, this.toolbarOptions);
    this.toolbar.init();
    this.graph =
      this.type === 'force'
        ? new Force(this.el, this.data, this.graphOptions)
        : new Tree(this.el, this.data, this.graphOptions);
    this.graph.render();
    this.info = new Info(this.el, this.infoOptions);
    this.info.init(this.graph.getCount());
    this.search = new Search(this.el, this.searchOptions);
    this.search.init();
    this.modal = new Modal(this.el, this.modalOptions);
    this.modal.init();
    this.menu = new Menu(this.el, this.menuOptions);
    this.menu.init();
  }
}

export default GraphEditor;
