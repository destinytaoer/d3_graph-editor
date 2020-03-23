import * as d3 from 'd3';
import BaseGraph from './BaseGraph';
/**
 * Force: 力导向图类
 *
 * @extends
 *   BaseGraph
 *
 * @parameter
 *   el [ HTMLElement | String ] 容器元素或者 ID
 *   data [Object] 数据
 *   options [ Object ] 配置选项
 *      // 父类
 *      width [Number]: Graph svg 宽度, 默认容器的宽度
 *      height [Number]: Graph svg 高度, 默认容器的高度
 *      scalable [Boolean]: 是否可缩放, 默认 true
 *      scaleExtent [Array]: 缩放范围, 默认 [0.5, 2]
 *      dragable [Boolean]: 是否可拖拽
 *      // 自身
 *      r [Number] 顶点半径, 默认 20
 *      shape [String] 顶点形状, 默认 'circle'
 *      vertexColor [String] 顶点颜色, 默认 '#e3e3e3'
 *      vertexFontSize [Number] 顶点字体大小, 默认 10
 *      distance [Number] 边的长度, 默认 150
 *      chargeStrength [Number] 力的强度,默认 -500
 *      edgeColor [String] 边的颜色, 默认 '#e3e3e3'
 *      edgeFontSize [Number] 边的字体大小, 默认 10
 *      alphaDecay [Number] 衰减系数, 默认 0.07
 *
 * @constructor
 *   eel: 容器, HTMLElement
 *   $el: 容器, d3 Selection
 *   svg: SVG 画布, d3 Selection
 *   chartGroup: 绘图容器, g 元素, d3 Selection
 *   data: 数据
 *   options: 配置对象
 *   nodeEnter: 所有的节点, d3 Selection 元素数组
 *   linkEnter: 所有边, d3 Selection 元素数组
 *
 * @methods
 *   render: 渲染画布
 *   preprocessChart: 初始化画布
 *   processData: 数据处理, 可在子类中进行复写
 *   draw: 绘制图形, 必须在子类中复写
 *   bindEvents: 绑定事件, 可在子类中复写
 *   zooming: 可复写函数, 在缩放过程中被调用
 *   addVertexes(): 绘制节点
 *   addEdges(): 绘制边
 *   filterVertex(filter, isRaw): 过滤顶点，需要另外调用 render 方法进行重绘
 *   filterEdge(filter, isRaw): 过滤边，需要另外调用 render 方法进行重绘
 *
 * create by destiny on 2019-03-25
 * update by destiny on 2020-03-22
 */
class Force extends BaseGraph {
  constructor(el, data, options) {
    let defaultOptions = {
      // 顶点参数
      r: 20,
      shape: 'circle',
      vertexColor: '#e3e3e3',
      vertexFontSize: 10,

      // 边的参数
      distance: 150,
      chargeStrength: -500,
      edgeColor: '#e3e3e3',
      edgeFontSize: 10,

      // 衰减系数
      alphaDecay: 0.07
    };
    options = Object.assign({}, defaultOptions, options);
    super(el, data, options);
  }
}
export default Force;
