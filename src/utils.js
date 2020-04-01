/**
 * deepCopy: 使用 JSON 方法深拷贝
 * 注意: 使用 JSON 方法存在局限性
 *
 * @parameter
 *    obj [Object | Arrray] 需要被拷贝的对象
 *
 * @return
 *   [Object]: 拷贝后的新对象
 *
 * by destiny on 2020-03-24
 */
export function deepCopy(obj) {
  if (!isPlainObject(obj) && !Array.isArray(obj))
    throw new Error('deepCopy need plain object or array as parameter');
  return JSON.parse(JSON.stringify(obj));
}
/**
 * isPlainObject: 判断是否是普通对象
 *
 * @parameter
 *   obj [Object] 需要判断的对象
 *
 * @return
 *   [Boolean]: 是否普通对象
 *
 * by destiny on 2020-03-24
 */
export function isPlainObject(obj) {
  var proto, Ctor;
  if (!obj || Object.prototype.toString.call(obj) !== '[object Object]') {
    return false;
  }
  proto = Object.getPrototypeOf(obj);
  if (!proto) {
    return true;
  }
  Ctor = Object.prototype.hasOwnProperty.call(proto, 'constructor') && proto.constructor;
  return (
    typeof Ctor === 'function' &&
    Object.prototype.hasOwnProperty.toString.call(Ctor) ===
      Object.prototype.hasOwnProperty.toString.call(Object)
  );
}
export function checkEl(el) {
  if (!(el instanceof HTMLElement) && typeof el !== 'string') {
    throw new Error('BaseGraph need HTMLElement or ID as first parameter');
  }

  if (typeof el === 'string') {
    el = document.getElementById(el);
    if (!el) {
      throw new Error('this page has not such id');
    }
  }
  return el;
}

// TODO: 需要增加 checkbox/radio 等其他表单控件的创建方法
function createSelect({ name, content, options }, type) {
  let select = `
      <div class="form-item">
        <label for="${type}_${name}" class="label">${content}</label>
        <select id="${type}_${name}" class="input" name="${name}">
      `;
  options.forEach(option => {
    select += `<option value="${option.value}">${option.content}</option>`;
  });
  select += '</select></div>';

  return select;
}
function createNumber({ name, content, extent }, type) {
  return `
      <div class="form-item">
        <label for="${type}_${name}" class="label">${content}</label>
        <input type="number" id="${type}_${name}" min="${extent[0]}" max="${extent[1]}" class="input" name="${name}">
      </div>
    `;
}
function createText({ name, content }, type) {
  return `
      <div class="form-item">
        <label for="${type}_${name}" class="label">${content}</label>
        <input type="text" id="${type}_${name}" class="input" name="${name}">
      </div>`;
}
function createRadio({ name, content, options }, type) {
  let radio = `<div class="form-item">
        <label class="label">${content}</label>
        <div class="radio-wrapper">`;
  options.forEach(option => {
    let { value, content, checked } = option;
    radio += `
      <div class="radio-item">
        <input class="radio" ${
          checked ? 'checked' : ''
        } type="radio" id="${type}_${value}" value="${value}" name=${name}>
        <label class="label" for="${type}_${value}">${content}</label>
      </div>
    `;
  });
  radio += '</div>';
  return radio;
}
function createCheckbox({ name, content, options }, type) {
  let checkbox = `<div class="form-item">
        <label class="label">${content}</label>
        <div class="checkbox-wrapper">`;
  options.forEach(option => {
    let { value, content, checked } = option;
    checkbox += `
      <div class="checkbox-item">
        <input class="checkbox" ${
          checked ? 'checked' : ''
        } type="checkbox" id="${type}_${value}" value="${value}" name=${name}>
        <label class="label" for="${type}_${value}">${content}</label>
      </div>
    `;
  });
  checkbox += '</div>';
  return checkbox;
}

let formItemMap = {
  select: createSelect,
  number: createNumber,
  text: createText,
  radio: createRadio,
  checkbox: createCheckbox
};

/**
 * createFormHTML: 根据配置创建 form HTML string
 *
 * @parameter
 *   id [String] form 的 id
 *   type [String] 为每个 formItem 上 id 的前缀, 防止 id 重复
 *   config [Array<Object>] 为 formItem 的配置
 *
 * @return
 *   [String]: form 的 HTML string
 *
 * by destiny on 2020-03-24
 */
export function createFormHTML(id, type, config) {
  let form = `<form class="form" id="${id}">`;

  config.forEach(c => {
    let formItem = formItemMap[c.type](c, type);
    form += formItem;
  });
  form += '</form>';
  return form;
}
/**
 * getFormData:  获取表单数据
 *
 * @parameter
 *   id [String] form 的 id
 *
 * @return
 *   [Object]:  表单的数据
 *
 * by destiny on 2020-03-24
 */
export function getFormData(id) {
  let form = document.getElementById(id);
  if (!form) {
    return null;
  }
  let formArr = Array.prototype.slice.call(form);
  let data = {};

  formArr.forEach(item => {
    let { name, value, type } = item;
    switch (type) {
      case 'checkbox':
        if (!data[name]) {
          data[name] = [];
        }
        if (item.checked) data[name].push(value);
        break;
      case 'radio':
        if (item.checked) {
          if (value === 'false') {
            value = false;
          }
          if (value === 'true') {
            value = true;
          }
          data[name] = value;
        }
        break;
      case 'text':
      default:
        data[name] = value;
    }
  });

  return data;
}
