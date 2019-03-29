/**
 * Info: 信息统计面板模块
 *
 * @parameter
 *   container [ HTMLElement | String ] 容器元素
 *   options [ Object ] 相关配置
 *
 * @methods
 *   bindClickEvents(cb): 在点击搜索时触发的事件，在 GraphEditor 中调用时传入 cb，回传筛选条件数据
 *   toggle(): 控制面板的显示或隐藏
 *
 * create by destiny on 2019-03-29
 * update by destiny on 2019-03-29
 */

class Info {
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
      vertex: [
        {
          name: 'person',
          content: '人员'
        },
        {
          name: 'company',
          content: '企业'
        }
      ],
      edge: [
        {
          name: 'invest',
          content: '投资'
        },
        {
          name: 'self',
          content: '内部调整'
        },
        {
          name: 'member',
          content: '成员'
        }
      ]
    }
    this.options = Object.assign({}, defalutOptions, options);
  }

  init(data) {
    this.create()
      .bindData(data)
  }
  create () {
    let info = document.createElement('div');
    info.classList.add('graph-info');
    this.el = info;
    this.$el = d3.select(info);

    let html = '<h3 class="info-title"><i class="iconfont icon-info"></i> 信息统计面板</h3><div class="info-content"><div>';

    info.innerHTML = html;

    this.container.appendChild(info);

    return this;
  }
  bindData(data) {
    let options = this.options.vertex.concat(this.options.edge);
    data = Object.assign({}, data.vertex, data.edge);
    let infoContent = this.$el.select('.info-content');
    let html = '';
    infoContent.html('');
    options.forEach(item => {
      let key = item.name;
      let content = item.content;
      html += `
        <div class="info-item">
          <div class="info-item-type">${content}</div>
          <div class="info-item-num">${data[key]}</div>
        </div>`;
    })
    this.$el.select('.info-content').html(html);
  }
  toggle() {
    this.el.classList.toggle('active');
  }
}
