/**
 * Modal: 编辑弹窗
 *
 * @parameter
 *   container [ HTMLElement | String ] 容器元素或者 ID
 *
 * @constructor
 *   container: 容器元素，HTML Element
 *   el: 当前 Modal 元素
 *
 * @methods
 *   init(): 初始化 Modal
 *   show(options): 显示 Modal, 传入 title, body, footer 的配置
 *   hide(): 隐藏 Modal
 *
 * create by destiny on 2019-04-02
 * update by destiny on 2020-03-31
 */
import { checkEl } from '../utils';
class Modal {
  constructor(container, options = {}) {
    this.container = checkEl(container);
    this.options = options;
    this.init();
  }
  init() {
    this.el = document.createElement('div');
    this.el.classList.add('graph-modal', 'fade', 'modal-hide');
    this.el.style.display = 'none';
    this.dialog = document.createElement('div');
    this.dialog.classList.add('modal-dialog');

    this.createContent(this.options);

    this.el.appendChild(this.dialog);
    this.container.appendChild(this.el);
    this.bindClickEvents();
  }
  createContent({ title, body, footer }) {
    let fr = document.createDocumentFragment();
    if (title) {
      let h3 = document.createElement('h3');
      h3.classList.add('modal-title');
      h3.textContent = title;
      fr.append(h3);
    }
    if (body) {
      let oBody = document.createElement('div');
      oBody.classList.add('modal-body');
      oBody.innerHTML = body;
      fr.append(oBody);
    }
    if (footer) {
      let oFooter = document.createElement('div');
      oFooter.classList.add('modal-footer');
      oFooter.innerHTML = footer;
      fr.append(oFooter);
    }
    this.dialog.appendChild(fr);
  }

  bindClickEvents() {
    // 点击其他地方隐藏弹窗
    this.dialog.addEventListener('click', e => {
      e.stopPropagation();
    });
    this.el.addEventListener('click', e => {
      this.hide();
    });
  }
  show() {
    this.el.style.display = 'block';
    setTimeout(() => {
      this.el.classList.remove('modal-hide');
    }, 0);
  }
  hide() {
    this.el.classList.add('modal-hide');
    setTimeout(() => {
      this.el.style.display = 'none';
    }, 300);
  }
}

export default Modal;
