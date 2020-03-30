/**
 * Info: 信息统计面板模块
 *
 * @parameter
 *   container [ HTMLElement | String ] 容器元素
 *   options [ Object ] 相关配置
 *
 * @constructor
 *   container: 容器元素
 *   el: 面板元素
 *
 *
 * @methods
 *   bindClickEvents(cb): 在点击搜索时触发的事件，在 GraphEditor 中调用时传入 cb，回传筛选条件数据
 *   toggle(): 控制面板的显示或隐藏
 *
 * create by destiny on 2019-03-29
 * update by destiny on 2019-03-29
 */

import { checkEl } from '../utils';

class Info {
  constructor(container, options) {
    this.container = checkEl(container);

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
    };
    this.options = Object.assign({}, defalutOptions, options);
  }

  init(data) {
    this.create().bindData(data);
  }
  create() {
    let info = document.createElement('div');
    info.classList.add('graph-info');
    this.el = info;

    let html =
      '<h3 class="info-title"><i class="iconfont icon-info"></i> 信息统计面板</h3><div class="info-content"><div>';

    info.innerHTML = html;

    this.container.appendChild(info);

    return this;
  }
  bindData(data) {
    // data 包含 vertex edge, 都是数组, 数组包含的是对象: {content, name}
    let { vertex, edge } = this.options;
    let options = [...vertex, ...edge];
    data = Object.assign({}, data.vertex, data.edge);
    let infoContent = this.el.querySelector('.info-content');
    let html = '';
    infoContent.innerHTML = '';
    options.forEach(item => {
      let { name: key, content } = item;
      html += `
        <div class="info-item">
          <div class="info-item-type">${content}</div>
          <div class="info-item-num">${data[key] || 0}</div>
        </div>`;
    });
    infoContent.innerHTML = html;
  }
  toggle() {
    this.el.classList.toggle('active');
  }
}

export default Info;
