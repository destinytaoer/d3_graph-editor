import { checkEl } from '../utils';

/**
 * Menu: 右键菜单类
 *
 * @parameter
 *   el [ HTMLElement | String ] 容器元素或者 ID
 *   options [ Object ] 配置选项
 *
 * @constructor
 *   el: 容器元素，HTML Element
 *   options [ Object ] 配置选项
 *     {vertex: [], edge: [], default: []}
 *
 * @methods
 *   show(): 显示 menu
 *   hide(): 隐藏 menu
 *
 * create by destiny on 2019-03-26
 * update by destiny on 2019-04-01
 */
class Menu {
  constructor(container, options) {
    this.container = checkEl(container);

    let defalutOptions = {
      default: [
        {
          name: 'create.vertex',
          content: '新增节点'
        },
        {
          name: 'undo',
          content: '撤销'
        },
        {
          name: 'redo',
          content: '重做'
        },
        {
          name: 'paste',
          content: '粘贴'
        },
        {
          name: 'import',
          content: '导入 json 数据'
        },
        {
          name: 'export_json',
          content: '导出 - 存为 json 数据'
        },
        {
          name: 'export_png',
          content: '导出 - 存为 png 图片'
        }
      ],
      vertex: [
        {
          name: 'edit',
          content: '编辑'
        },
        {
          name: 'check',
          content: '查看'
        },
        {
          name: 'copy',
          content: '复制'
        },
        {
          name: 'remove',
          content: '删除'
        }
      ],
      edge: [
        {
          name: 'edit',
          content: '编辑'
        },
        {
          name: 'check',
          content: '查看'
        },
        {
          name: 'remove',
          content: '删除'
        }
      ]
    };

    this.options = Object.assign({}, defalutOptions, options);
  }

  init() {
    this.create().bindEvents();
  }

  create() {
    let menu = document.createElement('div');
    menu.classList.add('graph-menu', 'hide');
    this.el = menu;

    this.container.appendChild(this.el);
    return this;
  }

  show(type, { top, left }) {
    let graphClientRect = this.container.getBoundingClientRect();

    this.renderInnerHTML(type);

    this.el.style.top =
      (top + this.el.offsetHeight > graphClientRect.height ? top - this.el.offsetHeight : top) +
      'px';
    this.el.style.left =
      (left + this.el.offsetWidth > graphClientRect.width ? left - this.el.offsetWidth : left) +
      'px';
    this.el.classList.remove('hide');
  }

  hide() {
    this.el.classList.add('hide');
  }

  renderInnerHTML(type) {
    this.type = type;
    this.el.innerHTML = '';

    let menuConfig = this.options[type] ? this.options[type] : this.options.default;

    let fr = document.createDocumentFragment();
    menuConfig.forEach(item => {
      let oDiv = document.createElement('div');
      oDiv.classList.add('command');
      oDiv.innerHTML = item.content;
      oDiv.dataset.operation = `${item.name}${type === 'default' ? '' : '.' + type}`;
      fr.append(oDiv);
    });

    this.el.appendChild(fr);
  }

  bindEvents(cb) {
    this.el.addEventListener('click', e => {
      e.stopPropagation();
      let el = e.target;
      if (el.classList.contains('command')) {
        let operation = el.dataset.operation;
        cb && cb(el, operation);
      }
    });
    this.container.addEventListener('click', e => {
      this.hide();
    });
  }
}

export default Menu;
