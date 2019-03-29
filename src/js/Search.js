/**
 * Search: 关系以及顶点过滤模块
 *
 * @parameter
 *   container [ HTMLElement | String ] 容器元素
 *   options [ Object ] 相关配置
 *
 * @methods
 *   bindClickEvents(cb): 在点击搜索时触发的事件，在 GraphEditor 中调用时传入 cb，回传筛选条件数据
 *
 * create by destiny on 2019-03-28
 * update by destiny on 2019-03-29
 */

class Search {
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
      search: [
        {
          name: 'name',
          content: '名称'
        },
        {
          name: 'idCard',
          content: '身份证号'
        },
      ],
      relation: [
        {
          name: "invest",
          content: "投资"
        },
        {
          name: "member",
          content: "成员"
        },
        {
          name: "self",
          content: "自身变动"
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
      if (el.id === 'btnSearch') {
        let data = this.getFormData();
        cb && cb('search', data);
      }
      if (el.id === 'btnReset') {
        this.reset();
        cb && cb('reset');
      }
    })
  }
  create () {
    var search = document.createElement('div')
    search.classList.add('graph-search');
    this.el = search;
    this.$el = d3.select(search);

    let html = '<form id="search_form">';

    // 节点筛选输入框
    html += '<h3 class="search-title"><i class="iconfont icon-filter"></i> 节点筛选</h3>';
    html += '<div class="search-section">';
    this.options.search.forEach(item => {
      html += `
      <div class="search-input-box">
        <input class="search-input" type="text" id="${item.name}" placeholder="${item.content}" name="${item.name}">
      </div>`
    })
    html += '</div>';
    // 关系多选按钮
    html += '<h3 class="search-title"><i class="iconfont icon-filter"></i> 关系过滤</h3>';
    html += '<div class="search-section">';
    this.options.relation.forEach(item => {
      html += `
      <div class="search-input-box">
        <input class="input" checked type="checkbox" id="${item.name}" value="${item.name}" name="relation">
        <label class="label" for="${item.name}">${item.content}</label>
      </div>`
    })
    html += '</div>'
    // 搜索和重置按钮
    html += '<div class="btns"><button type="button" id="btnReset" class="btn btn-default">重置</button><button type="button" id="btnSearch" class="btn btn-info">查找</button></div>'

    html += '</form>'

    search.innerHTML = html;

    this.container.appendChild(search);

    return this;
  }
  reset() {
    let form = document.querySelector('#search_form');
    form.reset();
  }
  getFormData() {
    let form = document.querySelector('#search_form');
    let data = {
      search: {},
      relation: []
    };

    this.options.search.forEach(item => {
      let key = item.name;
      data.search[key] = form[key].value;
    })

    this.options.relation.forEach(item => {
      if (form[item.name].checked) {
        data.relation.push(form[item.name].value);
      }
    })

    return data;
  }
  toggle() {
    this.el.classList.toggle('active');
  }
}