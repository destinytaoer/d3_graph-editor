/**
 * Toolbar: 创建顶部工具栏
 *
 * @parameter
 *   container [ HTMLElement | String ]容器
 *   options [ Object ] 配置
 *
 * @methods
 *   
 *   
 *
 * create by destiny on 2019-03-27
 * update by destiny on 2019-03-27
 */
class Toolbar {
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
      cache: [
        {
          name: 'undo',
          content: '撤销'
        },
        {
          name: 'redo',
          content: '重做'
        }
      ],
      select: [
        {
          name: 'multi',
          content: '框选'
        },
        {
          name: 'select',
          content: '单选'
        }
      ],
      layout: [
        {
          name: 'tree',
          content: '树状图'
        },
        {
          name: 'force',
          content: '力导向图'
        }
      ],
      zoom: [
        {
          name: 'zoom_in',
          content: '放大'
        },
        {
          name: 'zoom_out',
          content: '缩小'
        },
        {
          name: 'fit',
          content: '适应屏幕'
        },
        {
          name: 'actual_size',
          content: '原始大小'
        }
      ],
      info: [
        {
          name: 'info',
          content: '信息统计面板'
        },
        {
          name: 'filter',
          content: '数据过滤面板'
        }
      ]
    }

    this.options = Object.assign({}, defalutOptions, options);
  }
  init() {
    this.create();
  }

  bindClickEvents(cb) {
    this.el.addEventListener('click', (e) => {
      let el = e.target;
      if (el.classList.contains('operation')) {
        cb && cb(el);
      }
    })
  }

  create () {
    var toolbar = document.createElement('div')
    toolbar.classList.add('graph-toolbar');
    this.el = toolbar;
    this.$el = d3.select(toolbar);

    Object.keys(this.options).forEach((key) => { 
      let oLi = document.createElement('div');
      oLi.classList.add('operations');
      this.options[key].forEach((item) => {
        let operation = item.name;
        let name = item.content;
        let activeMap = ['force', 'select'];
        let icon = document.createElement('i');
        icon.classList.add('operation', 'iconfont', 'icon-' + operation);
        if (activeMap.includes(operation)) {
          icon.classList.add('active');
        }
        icon.setAttribute('title', name);
        icon.dataset.operation = operation;
        oLi.appendChild(icon);
      })
      toolbar.appendChild(oLi);
    })

    this.container.insertBefore(toolbar, this.container.firstChild);

    return this;
  }
}