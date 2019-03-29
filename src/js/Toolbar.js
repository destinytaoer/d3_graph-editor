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
          cnname: '撤销',
          cb: null
        },
        {
          name: 'redo',
          cnname: '重做',
          action: null
        }
      ],
      select: [
        {
          name: 'multi',
          cnname: '框选',
          action: null
        },
        {
          name: 'select',
          cnname: '单选',
          action: null
        }
      ],
      layout: [
        {
          name: 'tree',
          cnname: '树状图',
          action: null
        },
        {
          name: 'force',
          cnname: '力导向图',
          action: null
        }
      ],
      zoom: [
        {
          name: 'zoom_in',
          cnname: '放大',
          action: null
        },
        {
          name: 'zoom_out',
          cnname: '缩小',
          action: null
        },
        {
          name: 'fit',
          cnname: '适应屏幕',
          action: null
        },
        {
          name: 'actual_size',
          cnname: '原始大小',
          action: null
        }
      ],
      info: [
        {
          name: 'info',
          cnname: '信息统计面板',
          action: null
        }
      ]
    }

    this.options = Object.assign({}, defalutOptions, options);
  }
  init() {
    this.create();
    // this._bindEvent();
  }

  eventListener (e, type) {
    var id = this._id;
    switch (type) {
        case 'undo': {
            eventProxy[id].emit('undo');
            break;
        }

        case 'redo': {
            eventProxy[id].emit('redo');
            break;
        }

        case 'copy': {
            console.log('copy');
            break;
        }

        case 'paste': {
            console.log('paste');
            break;
        }

        case 'delete': {
            console.log('delete');
            break;
        }

        case 'multi':
        case 'drag': {
            this._changeStatesAndToolbar('operation', type);
            break;
        }

        case 'down':
        case 'up':
        case 'right':
        case 'left':
        case 'force':
        case 'circle':
        case 'sankey': {
            this._changeStatesAndToolbar('layout', type);
            eventProxy[id].emit('layout', type);
            break;
        }

        case 'zoom-in':
        case 'zoom-out': {
            eventProxy[id].emit('zoom.io', type);
            break;
        }

        case 'fit': {
            eventProxy[id].emit('zoom.f');
            break;
        }

        case 'actual-size': {
            eventProxy[id].emit('zoom.as');
            break;
        }

        case 'statistic': {
            if (this.states[type]) {
                this._changeStatesAndToolbar('statistic', type, false);
                eventProxy[id].emit('statistic.hide', type);
            } else {
                this._changeStatesAndToolbar('statistic', type);
                eventProxy[id].emit('statistic.show', type);
            }
            break;
        }

        case 'shrink': {
            if (this.states[type]) {
                this._changeStatesAndToolbar('shrink', type, false);
                eventProxy[id].emit('shrink.false', type);
            } else {
                this._changeStatesAndToolbar('shrink', type);
                eventProxy[id].emit('shrink.true', type);
            }
            break;
        }

        case 'full': {
            console.log('full');
            break;
        }

        default: {
            console.log('this event is not exist');
        }
    }
  }

  bindClickEvents(cb) {
    this.el.addEventListener('click', (e) => {
      cb && cb(e);
    })
  }
  // // 根据用户操作修改 toolbar 的 state 和 class
  // _changeStatesAndToolbar (type, state, boolean) {
  //   var $el = this.$el;
  //   var states = this.states;
  //   var statesKey = Object.keys(states);
  //   var noRenderItems = this._getNoRenderItemsByConfig();
  //   this._getTypeOfStates(type).forEach(function (value) {
  //       states[value] = false;
  //   });
  //   states[state] = typeof boolean === 'boolean' ? boolean : true;
  //   statesKey.forEach(function (value) {
  //       if (!~noRenderItems.indexOf(value)) {
  //           var $temp = DOM.getDOMByClass($el, value);
  //           if (states[value]) {
  //               DOM.addClass($temp, 'checked');
  //           } else if (!states[value]) {
  //               DOM.removeClass($temp, 'checked');
  //           }
  //       }
  //   });
  // }

  create () {
    var toolbar = document.createElement('div')
    toolbar.classList.add('graph-toolbar');
    this.el = toolbar;
    this.$el = d3.select(toolbar);

    Object.keys(this.options).forEach((key) => { 
      let oLi = document.createElement('div');
      oLi.classList.add('operations');
      this.options[key].forEach((item) => {
        let type = item.name;
        let name = item.cnname;
        let activeMap = ['force', 'select'];
        let icon = document.createElement('i');
        icon.classList.add('operation', 'iconfont', 'icon-' + type);
        if (activeMap.includes(type)) {
          icon.classList.add('active');
        }
        icon.setAttribute('title', name);
        icon.dataset.type = type;
        oLi.appendChild(icon);
      })
      toolbar.appendChild(oLi);
    })

    this.container.insertBefore(toolbar, this.container.firstChild);

    return this;
  }

  _bindEvent () {
    var self = this;
    var $el = this.$el;
    DOM.addEventListener($el, 'click', function (e) {
        self.eventListener.call(self, e, e.target.className.split(' ')[0]);
    })
  }
}