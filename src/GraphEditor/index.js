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

class GraphEditor {
  constructor() {}
}

export default GraphEditor;
