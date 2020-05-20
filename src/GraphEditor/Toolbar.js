/**
 * Toolbar: 创建顶部工具栏
 *
 * @parameter
 *   container [ HTMLElement | String ]容器
 *   type [String] 图谱类型
 *   options [ Object ] 配置
 *
 * @constructor
 *   container: 容器
 *   el: 菜单栏, HTMLElement
 *   type: 图谱类型
 *   options: 菜单配置
 *
 * @methods
 *   init(): 初始化菜单栏
 *   create(): 创建菜单栏
 *   bindClickEvents(cb): 绑定点击事件, 传入点击回调
 *
 *
 * create by destiny on 2019-03-27
 * update by destiny on 2020-03-29
 */
import { checkEl } from '../utils';
class Toolbar {
  constructor(container, type, options) {
    // 判断是否是 HTML 元素或者 ID 字符串
    this.container = checkEl(container);

    let defalutOptions = {
      cache: [
        {
          name: 'undo',
          content: '撤销',
        },
        {
          name: 'redo',
          content: '重做',
        },
      ],
      // select: [
      //   {
      //     name: 'multi',
      //     content: '框选'
      //   },
      //   {
      //     name: 'select',
      //     content: '单选'
      //   }
      // ],
      // layout: [
      //   {
      //     name: 'tree',
      //     content: '树状图'
      //   },
      //   {
      //     name: 'force',
      //     content: '力导向图'
      //   }
      // ],
      zoom: [
        {
          name: 'zoom_in',
          content: '放大',
        },
        {
          name: 'zoom_out',
          content: '缩小',
        },
        {
          name: 'actual_size',
          content: '原始大小',
        },
      ],
      info: [
        {
          name: 'info',
          content: '信息统计面板',
        },
        {
          name: 'filter',
          content: '数据过滤面板',
        },
      ],
    };
    this.type = type;
    this.options = Object.assign({}, defalutOptions, options);
  }
  init() {
    this.create();
  }

  bindClickEvents(cb) {
    this.el.addEventListener('click', (e) => {
      let el = e.target;
      if (!el.classList.contains('not-allow') && el.classList.contains('operation')) {
        let operation = el.dataset.operation;
        cb && cb(el, operation);
      }
    });
  }

  create() {
    var toolbar = document.createElement('div');
    toolbar.classList.add('graph-toolbar');
    this.el = toolbar;

    // 标题 ICON
    let oTitle = document.createElement('div');
    oTitle.classList.add('title');
    let icon = document.createElement('i');
    icon.classList.add('iconfont', 'icon-' + this.type);
    oTitle.appendChild(icon);
    toolbar.appendChild(oTitle);

    // 可点击操作
    Object.keys(this.options).forEach((key) => {
      let oLi = document.createElement('div');
      oLi.classList.add('operations');
      this.options[key].forEach((item) => {
        let operation = item.name;
        let name = item.content;
        let icon = document.createElement('i');
        icon.classList.add('operation', 'iconfont', 'icon-' + operation);
        icon.setAttribute('title', name);
        icon.dataset.operation = operation;
        oLi.appendChild(icon);
      });
      toolbar.appendChild(oLi);
    });
    // 关闭按钮
    let oClose = document.createElement('div');
    oClose.classList.add('close');
    oClose.setAttribute('title', '关闭');
    let i = document.createElement('i');
    i.classList.add('operation');
    i.setAttribute('title', name);
    i.dataset.operation = 'close';
    i.innerHTML = '&times;';
    oClose.appendChild(i);
    toolbar.appendChild(oClose);

    this.container.insertBefore(toolbar, this.container.firstChild);

    return this;
  }
}

export default Toolbar;
