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
 *
 * @methods
 *   render: 渲染画布
 *   preprocessChart: 初始化画布
 *   processData: 数据处理, 可在子类中进行复写
 *   draw: 绘制图形, 必须在子类中复写
 *   bindEvents: 绑定事件, 可在子类中复写
 *   zooming: 可复写函数, 在缩放过程中被调用
 *
 *
 * create by destiny on 2019-03-25
 * update by destiny on 2020-03-19
 */
import * as d3 from 'd3';

class BaseGraph {
  constructor(el, data, options) {
    // 校验 el
    if (!(el instanceof HTMLElement) && typeof el !== 'string') {
      throw new Error('BaseGraph need HTMLElement or ID as first parameter');
    }

    if (typeof el === 'string') {
      this.el = document.getElementById(el);
      if (!this.el) {
        throw new Error('this page has not such id');
      }
    } else {
      this.el = el;
    }
    // 校验 data
    if (!data || typeof data !== 'object') {
      throw new Error('BaseGraph must some data to render');
    }
    this.data = data;

    let elInfo = this.el.getBoundingClientRect();

    const defaultOptions = {
      width: elInfo.width,
      height: elInfo.height,
      scalable: true,
      scaleExtent: [0.5, 2],
      scaleBar: false,
      draggable: true
    };

    this.$el = d3.select(this.el);
    this.options = Object.assign({}, defaultOptions, options || {});
  }
  render() {
    this.preprocessChart()
      .preprocessData()
      .draw()
      .bindEvents();
  }
  draw() {
    return this;
  }
  preprocessData() {
    return this;
  }
  preprocessChart() {
    this.$el.selectAll('svg').remove();
    this.svg = this.$el
      .append('svg')
      .attr('width', this.options.width)
      .attr('height', this.options.height);

    this.chartGroup = this.svg.append('g').classed('chart', true);

    return this;
  }

  /* 绑定事件 */
  bindEvents() {}

  // 缩放事件
  bindScale() {
    const { scalable, scaleExtent } = this.options;

    scalable ? this.addZoom(scaleExtent) : null;
  }
  addZoom(scale) {
    const 
    this.zoom = d3
      .zoom()
      .scaleExtent(scale)
      .filter(() => {
        // 区分缩放和拖拽
        const isWheelEvent = d3.event instanceof WheelEvent;
        return isWheelEvent || (!isWheelEvent && this.options.draggable);
      })
      .on('zoom', () => {
        this.chartGroup.attr('transform', d3.event.transform);
        const isWheelEvent = d3.event instanceof WheelEvent;
        if (isWheelEvent) this.zooming();
      })
      .on('dblclick.zoom', null);

    this.svg.call(this.zoom);

    return this;
  }
  zooming() {
    // 可复写方法, 表示在缩放过程中需要做的事情
    // TODO:将下面代码放置到 Force 类中
    if (d3.event.transform.k < 0.8) {
      this.nodeEnter.selectAll('.vertex-name').style('opacity', '0');
      this.linkEnter.selectAll('.edge-label').style('opacity', '0');
    } else {
      this.nodeEnter.selectAll('.vertex-name').style('opacity', '1');
      this.linkEnter.selectAll('.edge-label').style('opacity', '1');
    }
  }
}

export default BaseGraph;
