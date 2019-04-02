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
    // 判断是否是 HTML 元素或者 ID 字符串
    if (!(container instanceof HTMLElement) && typeof container !== 'string') {
      throw new Error('BaseGraph need HTMLElement or ID as first parameter');
    }

    if (typeof container === 'string') {
      this.container = document.getElementById(container);
      if (!this.container) {
        throw new Error('this page has not such id');
      }
    } else {
      this.container = container;
    }

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
          name: "edit",
          content: "编辑"
        },
        {
          name: "check",
          content: "查看"
        },
        {
          name: "copy",
          content: "复制",
        },
        {
          name: "remove",
          content: "删除"
        }
      ],
      edge: [
        {
          name: "edit",
          content: "编辑"
        },
        {
          name: "check",
          content: "查看"
        },
        {
          name: "remove",
          content: "删除"
        }
      ]
    }

    this.options = Object.assign({}, defalutOptions, options);
  }

  init() {
    this.create()
      // .bindEvents();
  }

  create() {
    let menu = document.createElement('div');
    menu.classList.add('graph-menu');
    this.$el = d3.select(menu);
    this.el = menu;

    this.$el
      .style('position', 'absolute')
      .style('display', 'none');
  
    this.container.appendChild(this.el);
    return this;
  }

  show() {
    var top = d3.event.offsetY;
    var left = d3.event.offsetX;

    var graphClientRect = this.container.getBoundingClientRect();

    this.$el
      .style('display', 'block')
      .style('top', ((top + this.el.offsetHeight) > graphClientRect.height ? (top - this.el.offsetHeight) : top) + 'px')
      .style('left', ((left + this.el.offsetWidth) > graphClientRect.width ? (left - this.el.offsetWidth) : left) + 'px')
  }

  hide() {
    this.$el
      .style('display', 'none');
  }

  getData() {
    return this.el.data;
  }

  renderInnerHTML (type, d) {
    this.type = type;

    d = d ? d : {};

    let menuConfig = this.options[type] ? this.options[type] :
      this.options.default;

    this.el.data = d;
    this.el.innerHTML = '';

    menuConfig.forEach((item) => {
      let oDiv = document.createElement('div')
      oDiv.classList.add('command');
      oDiv.innerHTML = item.content;
      oDiv.dataset.operation = `${item.name}${type === 'default' ? '' : '.' + type}`;
      this.el.appendChild(oDiv);
    });

    return this;
  }

  bindClickEvents(cb) {
    this.container.addEventListener('click', (e) => {
      let el = e.target;
      if (el.classList.contains('command')) {
        cb && cb(el);
      } else {
        this.hide();
      }
    })
  }
}