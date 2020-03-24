import * as d3 from 'd3';
import BaseGraph from './BaseGraph';
import { deepCopy } from '../utils';
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
 *      iconPath [String] 顶点 ICON 路径, 默认 ./assets/
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
 *   options: 配置对象
 *   data: 绘图数据
 *   rawData: 原始数据
 *   vertexes: 绘图节点数据
 *   edges: 绘图节点数据
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
      iconPath: './assets',

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

    // 原始数据，完全克隆对象，并且不再是同一个引用地址，消除副作用
    this.rawData = deepCopy(data);

    // 顶点和边的数据
    this.vertexes = deepCopy(data.vertexes);
    this.edges = deepCopy(data.edges);

    // 记录当前所有节点的 ID
    this.idMap = [];

    // 用于最短路径查找
    this.adjList = [];
    this.vertexesMap = [];
    this.edgeTo = [];
    this.marker = [];

    // 顶点形状
    this.symbol = d3.symbol();
    // 主题
    this.theme = 'light';
  }
  /* 数据处理 */
  checkData(data) {
    let { vertexes, edges } = data;
    if (!vertexes || !edges || !Array.isArray(vertexes) || !Array.isArray(edges))
      throw new Error('data must have vertexes and edges properties and they should be array');
    vertexes.forEach((vertex, index) => {
      if (vertex._id == undefined) {
        throw new Error(`vertex data must have a '_id' property, but index ${index} have not`);
      }
    });
    edges.forEach((edge, index) => {
      if (edge._id == undefined) {
        throw new Error(`edge data must have a '_id' property, but index ${index} have not`);
      }
    });
  }
  preprocessData() {
    // 初始化数据以及图的最短路径算法
    this.vertexes.forEach(v => {
      v.state = v.state || 'normal';
      this.vertexesMap.push(v._id);
    });
    this.edges.forEach(e => {
      let from = this.vertexesMap.indexOf(e._from);
      let to = this.vertexesMap.indexOf(e._to);
      e.source = e._from;
      e.target = e._to;
      e.state = e.state || 'normal';
      this.adjList[from] = this.adjList[from] || {};
      this.adjList[from][to] = this.adjList[from][to] || [];
      this.adjList[from][to].push(e._id);
    });

    // 设置边的索引以及边的方向
    this.setEdgeIndex();

    // 模拟力的布局
    this.layout();

    return this;
  }
  layout() {
    // 作用: 通过力的仿真器, 来向节点和边数据中增加位置信息
    const { distance, alphaDecay, chargeStrength, width, height } = this.options;

    // 构建边的力
    const linkForce = d3
      .forceLink(this.edges)
      .distance(distance)
      .id(e => e._id);

    // 力仿真器
    this.simulation = d3
      .forceSimulation()
      .alphaDecay(alphaDecay)
      .nodes(this.vertexes)
      // 牵引力
      .force('links', linkForce)
      // 相互作用力
      .force('charge_force', d3.forceManyBody().strength(chargeStrength))
      // 中心力
      .force('center_force', d3.forceCenter(width / 2, height / 2))
      .on('tick', this.onTick.bind(this))
      // 仿真停止时触发
      .on('end', this.onEndRender.bind(this));

    return this;
  }
  setEdgeIndex() {
    let edgeNumMap = {};
    let vertexNumMap = {};
    let edgeDirection = {};
    this.edges.forEach(e => {
      if (!edgeNumMap[e._from + e._to]) {
        edgeNumMap[e._from + e._to] = edgeNumMap[e._to + e._from] = 1;
        edgeDirection[e._from + e._to] = edgeDirection[e._to + e._from] = e._from;
      } else {
        edgeNumMap[e._from + e._to]++;
        edgeNumMap[e._to + e._from]++;
      }

      vertexNumMap[e._from] = vertexNumMap[e._from] ? vertexNumMap[e._from] + 1 : 1;
      vertexNumMap[e._to] = vertexNumMap[e._to] ? vertexNumMap[e._to] + 1 : 1;
      e.edgeIndex = edgeNumMap[e._from + e._to]; // 节点 A、B 之间可能有多条边，这条边所在的 index
    });
    this.edges.forEach(e => {
      e.siblingNum = edgeNumMap[e._from + e._to]; // 节点 A、B 之间边的条数
      e.labelDirection = edgeDirection[e._from + e._to] === e._from ? 1 : 0; // 用于控制 label 从左到右还是从右到左渲染
    });
  }

  /* 绘制图谱 */
  preprocessChart() {
    this.chartGroup.append('g').classed('vertexes', true);
    this.chartGroup.append('g').classed('edges', true);
    this.chartGroup.append('defs');
    return this;
  }
  draw() {
    this.drawEdges().drawVertexes();

    return this;
  }
  onTick() {
    // 移动点的位置
    this.chartGroup.selectAll('g.vertex').attr('transform', d => `translate(${d.x}, ${d.y})`);

    this.chartGroup.selectAll('.vertex-name').attr('transform', d => `translate(${d.x}, ${d.y})`);

    // 移动边的位置
    // TODO: 优化弧形边
    var selfMap = {};
    this.chartGroup.selectAll('.edge-path').attr('d', d => {
      var dx = d.target.x - d.source.x;
      var dy = d.target.y - d.source.y;

      var dr = d.siblingNum > 1 ? Math.sqrt(dx * dx + dy * dy) : 0;
      var middleIdx = (d.siblingNum + 1) / 2;

      if (d.siblingNum > 1) {
        dr =
          d.edgeIndex === middleIdx
            ? 0
            : dr /
              (Math.log(Math.abs(d.edgeIndex - middleIdx) * 0.7 + 1) +
                1 / (10 * Math.pow(d.edgeIndex, 2))); // 弧度绘制
      }
      let sweepFlag = d.edgeIndex > middleIdx ? 1 : 0;
      if (d.labelDirection) {
        sweepFlag = 1 - sweepFlag;
      }
      let path =
        'M' +
        d.source.x +
        ',' +
        d.source.y +
        'A' +
        dr +
        ',' +
        dr +
        ' 0 0 ' +
        sweepFlag +
        ',' +
        d.target.x +
        ',' +
        d.target.y;

      // 自己指向自己
      if (d.source._id === d.target._id) {
        selfMap[d.source.name] = selfMap[d.source.name] ? selfMap[d.source.name] + 1 : 1;
        let h = selfMap[d.source.name] * 100;
        let w = selfMap[d.source.name] * 10;
        // 使用三次贝塞尔曲线绘制
        path =
          'M' +
          d.source.x +
          ' ' +
          (d.source.y - this.getRadius(d)) +
          ' C ' +
          (d.source.x - w) +
          ' ' +
          (d.source.y - h) +
          ', ' +
          (d.source.x + h) +
          ' ' +
          (d.source.y + w) +
          ', ' +
          (d.source.x + this.getRadius(d)) +
          ' ' +
          d.source.y;
      }

      // 增加反向路径，用于旋转 label
      this.chartGroup
        .select('#' + d._id + '_reverse')
        .attr(
          'd',
          'M' +
            d.target.x +
            ',' +
            d.target.y +
            'A' +
            dr +
            ',' +
            dr +
            ' 0 0 ' +
            (1 - sweepFlag) +
            ',' +
            d.source.x +
            ',' +
            d.source.y
        );

      return path;
    });

    // 边 label 的动态调整
    this.chartGroup.selectAll('.edge-label textPath').attr('xlink:href', d => {
      // 通过旋转 label, 使文字始终处于 edge 上方
      if (d.source.x > d.target.x) {
        return '#' + d._id + '_reverse';
      } else {
        return '#' + d._id;
      }
    });
    this.chartGroup.selectAll('.edge-label').attr('transform', d => {
      let r = Math.sqrt(
        Math.pow(d.source.x - d.target.x, 2) + Math.pow(d.source.y - d.target.y, 2)
      );

      if (Math.abs(d.source.y - d.target.y) < r / 2) {
        return 'translate(0, -5)';
      } else if (
        (d.source.x > d.target.x && d.source.y > d.target.y) ||
        (d.source.x < d.target.x && d.source.y < d.target.y)
      ) {
        return 'translate(5, 0)';
      } else if (
        (d.source.x > d.target.x && d.source.y < d.target.y) ||
        (d.source.x < d.target.x && d.source.y > d.target.y)
      ) {
        return 'translate(-5, 0)';
      }
    });
  }
  // 节点绘制
  drawVertexes() {
    // 清除节点
    this.chartGroup.selectAll('.vertexes g').remove();

    // 增加节点 group
    this.nodeEnter = this.chartGroup
      .selectAll('.vertexes g')
      .data(this.vertexes)
      .enter()
      .append('g')
      .attr('data-id', d => d._id)
      .attr('type', d => d.type);

    this.drawVertex() // 增加节点 circle
      .drawVertexName() // 增加节点名称
      .drawIcon(); // 增加节点 icon

    return this;
  }
  drawVertex() {
    this.nodeEnter
      .append('g')
      .classed('vertex', 'true')
      .append('path')
      .attr('d', d => {
        let type = this.getShape(d);
        type = 'symbol' + type[0].toUpperCase() + type.slice(1);
        let size = this.getRadius(d) * this.getRadius(d) * Math.PI;
        let _d3 = d3; // 直接使用 d3[type] 报错
        return this.symbol.size(size).type(_d3[type])();
      })
      .classed('circle', true)
      .attr('fill', d => this.getVertexColor(d))
      .attr('stroke', d => this.getVertexStrokeColor(d))
      .attr('stroke-width', d => this.getVertexStrokeWidth(d));

    return this;
  }
  drawVertexName() {
    this.nodeEnter
      .append('text')
      .attr('class', 'vertex-name')
      .style('text-anchor', 'middle')
      .style('dominant-baseline', 'baseline')
      .style('user-select', 'none')
      .each(this.setVertexNamePos.bind(this));
    if (this.getTransform().k < 0.8) {
      this.nodeEnter.selectAll('.vertex-name').style('opacity', '0');
    } else {
      this.nodeEnter.selectAll('.vertex-name').style('opacity', '1');
    }
    return this;
  }
  setVertexNamePos(d, i, g) {
    if (!d.name) return;

    let thisText = d3.select(g[i]);
    thisText.selectAll('tspan').remove();

    let textStack = this.getTextStack(d) || [];
    textStack.forEach(v => {
      thisText
        .append('tspan')
        .text(v.name)
        .attr('x', v.dx)
        .attr('y', v.dy)
        .style('font-size', this.options.vertexFontSize);
    });
    // this.drawType(thisText);
  }
  // drawType(text) {
  //   // add type
  //   this.typeNameMap = {
  //     person: '人',
  //     company: '公司'
  //   };
  //   this.typeColorMap = {
  //     person: 'red',
  //     company: 'blue'
  //   };

  //   text
  //     .append('tspan')
  //     .text(d => `[${this.typeNameMap[d.type]}]`)
  //     .attr('fill', d => this.typeColorMap[d.type])
  //     .style('font-size', this.options.vertexFontSize);
  // }
  drawIcon() {
    this.nodeEnter
      .selectAll('.vertex')
      .append('image')
      .each((d, i, g) => {
        let r = this.getRadius(d);
        d3.select(g[i])
          .attr('xlink:href', this.getIcon(d))
          .classed('icon', true)
          .attr('width', r * 2)
          .attr('height', r * 2)
          .attr('x', -r)
          .attr('y', -r);
      });
  }
  // 边
  drawEdges() {
    this.chartGroup.selectAll('.edges g').remove();

    this.linkEnter = this.chartGroup
      .selectAll('.edges g')
      .data(this.edges)
      .enter()
      .append('g')
      .classed('edge', true)
      .attr('data-id', d => d._id)
      .attr('type', d => d.type);

    this.drawPath() // 增加边路径
      .drawEdgeLabel() // 增加边 label
      .drawArrow();

    return this;
  }
  drawPath() {
    this.linkEnter
      .append('path')
      .classed('edge-path', true)
      .attr('fill', 'none')
      .attr('stroke', d => this.getEdgeColor(d))
      .attr('id', d => d._id);

    this.chartGroup.select('defs path').remove();

    // 增加反向路径, 用于旋转 label
    this.chartGroup
      .selectAll('defs .reverse-path')
      .data(this.edges)
      .enter()
      .append('path')
      .attr('fill', 'none')
      .attr('stroke', d => this.getEdgeColor(d))
      .classed('reverse-path', true)
      .attr('id', function(d) {
        return d._id + '_reverse';
      });

    return this;
  }
  drawEdgeLabel() {
    this.linkEnter
      .append('text')
      .classed('edge-label', true)
      .append('textPath')
      .attr('xlink:href', d => {
        return '#' + d._id;
      })
      .attr('startOffset', '50%')
      .attr('text-anchor', 'middle')
      .style('user-select', 'none')
      .text(d => {
        return d.label || '';
      })
      .style('font-size', this.options.edgeFontSize);

    if (this.getTransform().k < 0.8) {
      this.linkEnter.selectAll('.edge-label').style('opacity', '0');
    } else {
      this.linkEnter.selectAll('.edge-label').style('opacity', '1');
    }
    return this;
  }
  drawArrow() {
    this.chartGroup
      .selectAll('defs .arrow-marker')
      .data(this.edges)
      .enter()
      .append('marker')
      .attr('id', d => 'arrow_' + d._id)
      .classed('arrow-marker', true)
      .append('path');

    this.chartGroup
      .select('defs')
      .append('marker')
      .datum({
        _id: '',
        type: '',
        state: 'normal',
        _flag: true
      })
      .attr('id', 'arrow_default')
      .classed('arrow-marker', true)
      .append('path');

    this.setArrowStyle();

    this.linkEnter.selectAll('.edge-path').attr('marker-end', d => this.getArrowUrl(d));

    return this;
  }

  /* 事件 */
  onEndRender() {
    // 仿真器停止时触发, 即已经完成渲染
    console.log('render end');
  }
  zooming() {
    // 缩放过程中, 小于 0.8 则将文本隐藏
    if (d3.event.transform.k < 0.8) {
      this.nodeEnter.selectAll('.vertex-name').style('opacity', '0');
      this.linkEnter.selectAll('.edge-label').style('opacity', '0');
    } else {
      this.nodeEnter.selectAll('.vertex-name').style('opacity', '1');
      this.linkEnter.selectAll('.edge-label').style('opacity', '1');
    }
  }

  /* 样式获取 */
  getShape(d) {
    // 返回形状字符串
    // return d.shape || this.options.shape;
    return 'circle';
  }
  getRadius(d) {
    // return d.radius || this.options.r;
    return this.options.r;
  }
  getVertexColor(d) {
    return this.options.vertexColor;
    // switch (d._type) {
    //   case 'Company':
    //     switch (this.theme + '-' + d.state) {
    //       case 'light-normal':
    //       case 'light-highlight':
    //       case 'dark-normal':
    //       case 'dark-highlight':
    //         return '#4FA2F1'
    //       case 'light-grey':
    //         return '#E9E9E9'
    //       case 'dark-grey':
    //         return '#323A4D'
    //       default:
    //         return this.options.vertexColor
    //     }
    //   case 'Person':
    //     switch (this.theme + '-' + d.state) {
    //       case 'light-normal':
    //       case 'light-highlight':
    //       case 'dark-highlight':
    //       case 'dark-normal':
    //         return '#64C680'
    //       case 'light-grey':
    //         return '#E9E9E9'
    //       case 'dark-grey':
    //         return '#323A4D'
    //       default:
    //         return this.options.vertexColor
    //     }
    //   default:
    //     return this.options.vertexColor
    // }
  }
  getVertexStrokeColor(d) {
    return 'none';
  }
  getVertexStrokeWidth(d) {
    return 1;
  }
  getVertexNameColor(d) {
    return '#42444C';
    // switch (this.theme+'-'+d.state) {
    //   case 'light-normal':
    //   case 'light-highlight':
    //     return '#42444C'
    //   case 'light-grey':
    //     return '#B3B3B3'
    //   case 'dark-normal':
    //   case 'dark-highlight':
    //     return '#fff'
    //   case 'dark-grey':
    //     return '#646E87'
    //   default:
    //     return '#000'
    // }
  }
  getTextStack(d) {
    return this.textUnderVertex(d, 8);
  }
  textUnderVertex(d, lineNum) {
    let textStack = [];
    let name = d.name;
    let y = this.getRadius(d) + this.options.vertexFontSize + 5;
    let lineHeight = this.options.vertexFontSize + 2;
    let j = 0;

    while (name.slice(0, lineNum).length === lineNum) {
      textStack.push({
        name: name.slice(0, lineNum),
        dx: 0,
        dy: j++ * lineHeight + y
      });
      name = name.slice(lineNum);
    }
    textStack.push({
      name: name.slice(0),
      dx: 0,
      dy: j++ * lineHeight + y
    });

    return textStack;
  }
  textInVertex(d) {
    let radius = this.getRadius(d);
    let name = d.name;
    let fontSize = this.options.vertexFontSize;
    let lineHeight = fontSize + 2;

    let lineNum = Math.floor((Math.sqrt(2) * radius) / fontSize); // 每一行的字数
    let maxLine = Math.floor((Math.sqrt(2) * radius) / lineHeight); // 最大多少行
    let rowNum = Math.ceil(name.length / lineNum); // 有多少行
    rowNum = rowNum > maxLine ? maxLine : rowNum;

    if (lineNum < 2) throw new Error('你的顶点太小了，不适合放置那么大的文字');

    let dY = (-lineHeight * (rowNum - 2)) / 2;
    let textStack = [];

    while (name.slice(0, lineNum).length === lineNum) {
      // 到最后一行之前，如果还有还多于一行字数，那么就使用省略号取代 3 个位
      if (textStack.length === maxLine - 1 && name.slice(lineNum).length > 0) {
        name = name.slice(0, lineNum - 1) + '...';
        break;
      }
      textStack.push({
        name: name.slice(0, lineNum),
        dx: 0,
        dy: dY
      });
      dY += lineHeight;
      name = name.slice(lineNum);
    }
    textStack.push({
      name: name,
      dx: 0,
      dy: dY
    });

    return textStack;
  }
  getIcon(d) {
    return this.options.iconPath && d.type
      ? `${this.options.iconPath}/${d.type.toLowerCase()}_${d.state}.svg `
      : '';
  }
  // 边样式
  getArrowConfig(d) {
    return {
      path: 'M0,0 L10,5 L0,10 z',
      arrowWidth: 10,
      arrowHeight: 10,
      refx: 0,
      color: this.getEdgeColor(d)
    };
    // switch (d.state) {
    //   case 'normal':
    //   case 'grey':
    //     return {
    //       path: 'M0,0 L10,5 L0,10 z',
    //       arrowWidth: 10,
    //       arrowHeight: 10,
    //       refx: 0,
    //       color: this.getEdgeColor(d)
    //     }
    //   case 'highlight':
    //     return {
    //       path: 'M0,0 L14,7 L0,14 z',
    //       arrowWidth: 14,
    //       arrowHeight: 14,
    //       refx: -3,
    //       color: this.getEdgeColor(d)
    //     }
    //   default:
    //     return {
    //       path: 'M0,0 L10,5 L0,10 z',
    //       arrowWidth: 10,
    //       arrowHeight: 10,
    //       refx: 0,
    //       color: this.getEdgeColor(d)
    //     }
    // }
  }
  getArrowUrl(d) {
    if (d.source._id === d.target._id) {
      return `url("#arrow_default")`;
    }
    return `url("#arrow_${d._id}")`;
  }
  getEdgeColor(d) {
    return '#D9D9D9';
    // switch (this.theme + '-' + d.state) {
    //   case 'light-normal':
    //   case 'light-grey':
    //     return '#D9D9D9'
    //   case 'light-highlight':
    //   case 'dark-highlight':
    //     return this.getVertexColor(d.target)
    //   case 'dark-grey':
    //   case 'dark-normal':
    //     return '#3C4257'
    //   default:
    //     return '#000'
    // }
  }
  getEdgeLableColor(d) {
    return '#5B5B5B';
    // switch (this.theme + '-' + d.state) {
    //   case 'light-normal':
    //     return '#5B5B5B'
    //   case 'light-grey':
    //     return '#B3B3B3'
    //   case 'light-highlight':
    //   case 'dark-highlight':
    //     return this.getVertexColor(d.target)
    //   case 'dark-normal':
    //   case 'dark-grey':
    //     return '#808593'
    //   default:
    //     return '#000'
    // }
  }
  getEdgeWidth(d) {
    // switch (d.state) {
    //   case 'normal':
    //   case 'grey':
    //     return 1
    //   case 'highlight':
    //     return 4
    //   default:
    //     return 1
    // }
    return 1;
  }

  // 背景颜色
  getBgColor() {
    switch (this.theme) {
      case 'light':
        return '#fff';
      case 'dark':
        return '#252A39';
      default:
        return '#fff';
    }
  }

  /* 关于样式的改变 */
  resetStyle() {
    this.setVertexStyle()
      .setEdgeStyle()
      .setBgColor();
  }
  setVertexStyle() {
    this.nodeEnter
      .selectAll('.circle')
      // .attr('d', (d) => {
      //   let type = this.getShape(d)
      //   type = 'symbol' + type[0].toUpperCase() + type.slice(1)
      //   let size = this.getRadius(d) * this.getRadius(d) * Math.PI

      //   let _d3 = d3 // 直接使用 d3[type] 报错
      //   return this.symbol.size(size).type(_d3[type])()
      // })
      .attr('fill', d => this.getVertexColor(d))
      .attr('stroke', d => this.getVertexStrokeColor(d))
      .attr('stroke-width', d => this.getVertexStrokeWidth(d));

    this.nodeEnter.selectAll('image').attr('xlink:href', d => this.getIcon(d));

    this.nodeEnter
      .selectAll('text.vertex-name')
      .attr('y', d => this.getRadius(d) + 5)
      .style('fill', d => this.getVertexNameColor(d));
    // .each(this.setVertexNamePos.bind(this))

    return this;
  }
  setEdgeStyle() {
    // 边
    this.linkEnter
      .selectAll('.edge-path')
      .attr('stroke', d => this.getEdgeColor(d))
      .attr('stroke-width', d => this.getEdgeWidth(d));

    // 箭头
    this.setArrowStyle();

    // 边文字
    this.linkEnter.selectAll('.edge-label').style('fill', d => this.getEdgeLableColor(d));

    return this;
  }
  setArrowStyle() {
    this.chartGroup.selectAll('.arrow-marker').each((d, i, g) => {
      let thisArrow = d3.select(g[i]);
      const {
        path = 'M0,0 L10,5 L0,10 z',
        arrowWidth = 10,
        arrowHeight = 10,
        refx = 0,
        color = '#e3e3e3'
      } = this.getArrowConfig(d);

      if (d._flag) {
        thisArrow.attr('refX', arrowWidth + refx);
      } else {
        thisArrow.attr('refX', this.getRadius(d.target) + arrowWidth + refx);
      }
      thisArrow
        .attr('refY', arrowHeight / 2)
        .attr('markerUnits', 'userSpaceOnUse')
        .attr('markerWidth', arrowWidth)
        .attr('markerHeight', arrowHeight)
        .attr('orient', 'auto')
        .select('path')
        .attr('d', path)
        .attr('fill', color);
    });
  }
  setBgColor() {
    this.svg.style('background', this.getBgColor());
    return this;
  }
  // 改变主题
  changeTheme(theme) {
    this.theme = theme;
    this.resetStyle();
    return this;
  }
  // 高亮顶点和边
  highlightVertex(ids) {
    this.nodeEnter.selectAll('.vertex .circle').each((d, i, g) => {
      if (ids.includes(d._id)) {
        d.state = 'highlight';
      } else {
        d.state = 'grey';
      }
    });

    return this;
  }
  highlightEdge(ids) {
    this.linkEnter.selectAll('.edge-path').each((d, i, g) => {
      if (ids.includes(d._id)) {
        d.state = 'highlight';
      } else {
        d.state = 'grey';
      }
    });

    return this;
  }

  /* 辅助函数 */
  // 获取当前 svg 的 transform
  getTransform() {
    return d3.zoomTransform(this.svg.node());
  }
  // 变形至传递的 transform
  transformTo(transform) {
    this.svg
      .transition()
      .duration(300)
      .call(this.zoom.transform, transform);
  }
  // 缩放至某个值
  zoomTo(scale) {
    // 由于 zoom 事件是绑定在 svg 上的，所以要从 svg 上获取
    let transform = this.getTransform();
    let curK = transform.k;
    let scaleExtent = this.zoom.scaleExtent();

    // 达到最大时再增加，或者达到最小时再缩小，则直接返回
    if (
      (scale - curK > 0 && curK === scaleExtent[1]) ||
      (scale - curK < 0 && curK === scaleExtent[0])
    )
      return;

    let nextK = scale;

    // 如果当前缩放处于最大或最小，那么直接返回
    // 对下一个缩放进行范围限制
    nextK =
      nextK < scaleExtent[0] ? scaleExtent[0] : nextK > scaleExtent[1] ? scaleExtent[1] : nextK;

    // 中心位置
    let containerRect = this.el.getBoundingClientRect();
    let centerX = containerRect.width / 2;
    let centerY = containerRect.height / 2;
    let curX = transform.x;
    let curY = transform.y;

    // 计算缩放后的位移：(centerX - nextX) / nextK = (centerX - curX) / curK
    // 使得缩放始终以当前位移为中心进行
    let nextX = centerX - ((centerX - curX) / curK) * nextK;
    let nextY = centerY - ((centerY - curY) / curK) * nextK;

    // 仍然要挂载到 svg 上
    this.transformTo(d3.zoomIdentity.translate(nextX, nextY).scale(nextK));

    return this;
  }
}
export default Force;
