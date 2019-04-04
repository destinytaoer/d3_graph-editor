/**
 * Modal: 编辑弹窗
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
 *   show(): 显示 Modal
 *   hide(): 隐藏 Modal
 * 
 * create by destiny on 2019-04-02
 * update by destiny on 2019-04-02
 */

class Modal {
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
          name: "name",
          content: "名称",
          type: 'text'
        },
        {
          name: "type",
          content: '类型',
          type: "select",
          options: [
            {
              value: 'person',
              content: '人'
            },
            {
              value: 'company',
              content: '企业'
            }
          ]
        },
        {
          name: "level",
          content: "层级",
          type: 'number',
          extent: [1, 5]
        }
      ],
      edge: [
        {
          name: "label",
          content: "内容",
          type: 'text'
        },
        {
          name: "type",
          content: "类型",
          type: 'select',
          options: [
            {
              value: 'invest',
              content: '投资'
            },
            {
              value: 'self',
              content: '内部调整'
            },
            {
              value: 'member',
              content: '成员'
            }
          ]
        }
      ]
    }

    this.options = Object.assign({}, defalutOptions, options);
  }
  init() {
    this.create();
  }

  create() {
    // 创建两个编辑框
    let editVertex = document.createElement('div');
    let editEdge = document.createElement('div');
    editVertex.classList.add('graph-modal', 'graph-edit-vertex');
    editEdge.classList.add('graph-modal', 'graph-edit-edge');

    this.$vertexEl = d3.select(editVertex);
    this.vertexEl = editVertex;
    this.$edgeEl = d3.select(editEdge);
    this.edgeEl = editEdge;

    this.$vertexEl
      .style('display', 'none')
    
    this.$edgeEl
      .style('display', 'none')

    this.renderInnerHTML();
    
    this.container.appendChild(this.vertexEl);
    this.container.appendChild(this.edgeEl);

    return this;
  }

  createForm(type) {
    let configs = this.options[type];
    let title = type === 'vertex' ? '节点' : '边'
    let html = '';
    html += `<h3 class="modal-title">修改${title}信息</h3>`;
    let form = `<form id="${type}_form">`;
    configs.forEach(c => {
      switch (c.type) {
        case 'select':
          form += `
            <div class="form-item">
              <label for="${type}_${c.name}" class="label">${c.content}</label>
              <select id="${type}_${c.name}" class="input" name="${c.name}">
            `
          c.options.forEach(item => {
            form += `<option value="${item.value}">${item.content}</option>`
          })
          form += '</select></div>'
          break;
        case 'number':
          form += `
            <div class="form-item">
            <label for="${type}_${c.name}" class="label">${c.content}</label>
            <input type="number" id="${type}_${c.name}" min="${c.extent[0]}" max="${c.extent[1]}" class="input" name="${c.name}">
          </div>`
          break;
        case 'text':
        default:
          form += `
            <div class="form-item">
              <label for="${type}_${c.name}" class="label">${c.content}</label>
              <input type="text" id="${type}_${c.name}" class="input" name="${c.name}">
            </div>`
          break;
      }
    })
    form += `
      <div class="btns">
        <button type="button" id="${type}Cancle" class="btn btn-default">取消</button>
        <button type="button" id="${type}Save" class="btn btn-info">保存</button>
      </div>`;
    form += '</form>';

    html += form;
    return html;
  }

  renderInnerHTML() {
    // 构建节点编辑表单
    let vertexForm = this.createForm('vertex');
    let edgeForm = this.createForm('edge');

    this.$vertexEl.html(vertexForm);  
    this.$edgeEl.html(edgeForm);

    return this;
  }

  bindClickEvents(cb) {
    d3.select('#vertexCancle').on('click', () => {
      this.hideModal('vertex');
    });
    d3.select('#edgeCancle').on('click', () => {
      this.hideModal('edge');
    });
    d3.select('#vertexSave').on('click', () => {
      let data = this.getFormData('vertex');
      let rowData = Object.assign({}, this.$vertexEl.data, data);
      cb && cb('save.vertex', rowData);
    });
    d3.select('#edgeSave').on('click', () => {
      let data = this.getFormData('edge');
      let rowData = Object.assign({}, this.$edgeEl.data, data);
      cb && cb('save.edge', rowData);
    });
    // 点击其他地方隐藏弹窗
    this.$vertexEl.on('click', () => {
      d3.event.stopPropagation();
    });
    this.$edgeEl.on('click', () => {
      d3.event.stopPropagation();
    });
    this.container.addEventListener('click', () => {
      this.hideModal('vertex')
        .hideModal('edge');
    });
  }
  showVertexModal(data) {
    this.hideModal('edge');
    this.setFormData(data, 'vertex');
    this.$vertexEl
      .style('display', 'block');
  }
  showEdgeModal(data) {
    this.hideModal('vertex');
    this.setFormData(data, 'edge');
    this.$edgeEl
      .style('display', 'block');
  }
  hideModal(type) {
    this[`$${type}El`]
      .style('display', 'none');
    this.setFormData({}, type);

    return this;
  }

  setFormData(data, type) {
    let form = document.querySelector(`#${type}_form`);
    let configs = this.options[type];
    configs.forEach(c => {
      let key = c.name;
      form[`${type}_${key}`].value = data[key] || null;
    });
    this[`$${type}El`].data = data;
  }
  getFormData(type) {
    let form = document.querySelector(`#${type}_form`);
    let data = {};

    let configs = this.options[type];
    configs.forEach(c => {
      let key = c.name;
      data[key] = form[`${type}_${key}`].value;
    })

    return data;
  }
}