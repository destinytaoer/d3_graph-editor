/**
 * BaseGraph: 关系型图谱的基类
 *
 * @parameter
 *   el [ HTMLElement | String ] 容器元素或者 ID, 必须
 *   data [Object]: 数据, 必须
 *   options [Object] 配置对象
 *      width [Number]: Graph svg 宽度, 默认容器的宽度
 *      height [Number]: Graph svg 高度, 默认容器的高度
 *      scalable [Boolean]: 是否可缩放, 默认 true
 *      scaleExtent [Array]: 缩放范围, 默认 [0.5, 2]
 *      dragable [Boolean]: 是否可拖拽
 *
 *
 * @constructor
 *   el: 容器, HTMLElement
 *   $el: 容器, d3 Selection
 *   svg: SVG 画布, d3 Selection
 *   chartGroup: 绘图容器, g 元素, d3 Selection
 *   data: 数据
 *   options: 配置对象
 *   zoom: 缩放对象, 用于控制图谱缩放行为
 *
 * @methods
 *   render: 渲染画布
 *   update: 更新画布
 *   init: 初始化, 初始化画布以及调用下面两个方法
 *   checkData: 校验数据, 在子类中复写
 *   preprocessChart: 初始化画布, 在子类中复写
 *   processData: 数据处理, 在子类中进行复写
 *   draw: 绘制图形, 必须在子类中复写
 *   bindEvents: 绑定事件, 在子类中复写
 *   zooming: 可复写函数, 在缩放过程中被调用
 *
 *
 * create by destiny on 2019-03-25
 * update by destiny on 2020-03-28
 */
import * as d3 from 'd3';
import { checkEl } from '../utils';

class BaseGraph {
  constructor(el, data, options) {
    // 校验 el
    this.el = checkEl(el);

    // 校验 data
    if (!data || typeof data !== 'object') {
      throw new Error('BaseGraph must some data to render');
    }
    this.checkData(data);

    this.data = data;

    let elInfo = this.el.getBoundingClientRect();

    const defaultOptions = {
      width: elInfo.width,
      height: elInfo.height,
      scalable: true,
      scaleExtent: [0.5, 2],
      draggable: true
    };

    this.$el = d3.select(this.el);
    this.options = Object.assign({}, defaultOptions, options || {});
  }
  render() {
    this.init()
      .draw()
      .bindScale()
      .bindEvents();
    this.el.appendChild(this.svg.node());
  }
  update() {
    this.preprocessData()
      .draw()
      .bindEvents();
  }
  init() {
    this.$el.selectAll('svg').remove();
    this.svg = d3
      .create('svg')
      .attr('width', this.options.width)
      .attr('height', this.options.height);

    this.chartGroup = this.svg.append('g').classed('chart', true);

    this.preprocessChart().preprocessData();

    return this;
  }
  draw() {
    return this;
  }
  checkData(data) {
    // 提供复写
  }
  preprocessData() {
    return this;
  }
  preprocessChart() {
    return this;
  }

  /* 绑定事件 */
  bindEvents() {}

  // 缩放事件
  bindScale() {
    const { scalable, scaleExtent } = this.options;

    scalable ? this.addZoom(scaleExtent) : null;
    return this;
  }
  addZoom(scale) {
    this.zoom = d3
      .zoom()
      .scaleExtent(scale)
      .filter(() => {
        // 区分缩放和拖拽
        // 注意在 filter 中 d3.event 是原生的事件
        const isWheelEvent = d3.event instanceof WheelEvent;
        return isWheelEvent || this.options.draggable;
      })
      .on('zoom', () => {
        this.chartGroup.attr('transform', d3.event.transform);
        // 在这里 d3.event 是 zoom 事件
        const isWheelEvent = d3.event.sourceEvent instanceof WheelEvent;
        if (isWheelEvent) this.zooming();
      });

    this.svg.call(this.zoom).on('dblclick.zoom', null);

    return this;
  }
  zooming() {
    // 可复写方法, 表示在缩放过程中需要做的事情
  }
}

export default BaseGraph;
