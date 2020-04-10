/**
 * Search: 顶点和边过滤面板
 *
 * @parameter
 *   container [ HTMLElement | String ] 容器元素
 *   options [ Object ] 相关配置
 *
 * @constructor
 *   container: 容器元素
 *   el: 过滤面板元素
 *   options: 表单配置
 *
 * @methods
 *   init(): 初始化过滤面板
 *   toggle(): 显示/隐藏过滤面板
 *   bindClickEvents(cb): 在点击搜索时触发的事件，在 GraphEditor 中调用时传入 cb，回传筛选条件数据
 *
 * create by destiny on 2019-03-28
 * update by destiny on 2020-04-10
 */

import { checkEl, createFormHTML, getFormData } from '../utils';

class Search {
  constructor(container, options) {
    this.container = checkEl(container);

    let defalutOptions = {
      vertex: [
        {
          name: 'name',
          type: 'text',
          content: '名称'
        },
        {
          name: 'idCard',
          type: 'text',
          content: '身份证号'
        }
      ],
      edge: [
        {
          name: 'type',
          content: '类型',
          type: 'checkbox',
          options: [
            {
              value: 'invest',
              content: '投资',
              checked: true
            },
            {
              value: 'member',
              content: '成员',
              checked: true
            },
            {
              value: 'self',
              content: '自身变动',
              checked: true
            }
          ]
        }
      ]
    };

    this.options = Object.assign({}, defalutOptions, options);
  }

  init() {
    this.create();
  }
  bindClickEvents(cb) {
    this.el.addEventListener('click', e => {
      let el = e.target;
      if (el.id === 'btnSearch') {
        let data = {
          vertex: getFormData('search_vertex_form'),
          edge: getFormData('search_edge_form')
        };

        cb && cb('search', data);
      }
      if (el.id === 'btnReset') {
        this.reset();
        cb && cb('reset');
      }
    });
  }
  create() {
    var search = document.createElement('div');
    search.classList.add('graph-search');
    this.el = search;
    let html = '';

    // 节点筛选表单
    html += '<div class="search-section">';
    html += '<h3 class="search-title"><i class="iconfont icon-filter"></i> 节点筛选</h3>';
    html += createFormHTML('search_vertex_form', 'search_vertex', this.options.vertex);
    html += '</div>';

    // 边筛选表单
    html += '<div class="search-section">';
    html += '<h3 class="search-title"><i class="iconfont icon-filter"></i> 边筛选</h3>';
    html += createFormHTML('search_edge_form', 'search_edge', this.options.edge);
    html += '</div>';
    // 搜索和重置按钮
    html += '<div class="footer">';
    html += `<div class="btns">
        <button type="button" id="btnReset" class="btn btn-default">重置</button>
        <button type="button" id="btnSearch" class="btn btn-info">过滤</button>
      </div>`;
    html += '</div>';

    search.innerHTML = html;

    this.container.appendChild(search);

    return this;
  }
  reset() {
    let vertexForm = document.getElementById('search_vertex_form');
    let edgeForm = document.getElementById('search_edge_form');
    vertexForm.reset();
    edgeForm.reset();
  }
  toggle() {
    this.el.classList.toggle('active');
  }
}

export default Search;
