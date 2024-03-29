import * as d3 from 'd3';
import BaseGraph from './BaseGraph';
import { deepCopy, getUUId, diffAssign, ajaxGet } from '../utils';
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
 *   el: 容器, HTMLElement
 *   $el: 容器, d3 Selection
 *   svg: SVG 画布, d3 Selection
 *   chartGroup: 绘图容器, g 元素, d3 Selection
 *   options: 配置对象
 *   data: 绘图数据
 *   rawData: 原始数据
 *   vertexes: 绘图节点数据, 保持与 data 中的数据一致
 *   edges: 绘图节点数据, 保持与 data 中的数据一致
 *   nodeEnter: 当前的 enter 节点, d3 Selection 元素数组
 *   linkEnter: 当前的 enter 边, d3 Selection 元素数组
 *   zoom: 缩放对象, 用于控制图谱缩放行为
 *
 * @methods
 *   render: 渲染画布
 *   update: 更新画布
 *   @style 需要时, 可以在实例渲染前进行复写, 接收当前节点或者边的数据 d
 *    getShape(d): 节点形状, 提供了 d3.symbol 中的形状, 需要返回形状字符串
 *    getRadius(d): 节点半径, 需要返回数字
 *    getVertexColor(d): 节点颜色, 需要返回颜色字符串
 *    getVertexStrokeColor(d): 节点边框颜色, 默认为 none, 需要返回颜色字符串
 *    getVertexStrokeWidth(d): 节点边框大小, 需要返回数字
 *    getVertexNameColor(d): 节点名称颜色, 需要返回颜色字符串
 *    getTextStack(d): 节点文本的排版, 需要返回一个数组,包含被分行的文本字符串
 *    getIcon(d): 节点 icon, 需要返回一个 URL 字符串, 表示 SVG icon 的路径
 *    getArrowColor(d): 箭头颜色, 需要返回颜色字符串
 *    getEdgeColor(d): 边颜色, 需要返回颜色字符串
 *    getEdgeLableColor(d): 边上文字颜色, 需要返回颜色字符串
 *    getEdgeWidth(d): 边的宽度, 需要返回数字
 *    getBgColor(): 背景颜色, 需要返回颜色字符串
 *   @data
 *    getVertexById(id): 通过 id 获取某个节点数据
 *    getEdgeById(id): 通过 id 获取某个边数据
 *    changeRawData(type, rawData, updateData): 改变 rawData 或者 data
 *    addVertex(x, y, data, cb):
 *    addEdge(from, to, data, cb)
 *    updateVertex(data, cb)
 *    updateEdge(data, cb)
 *    removeVertex(id, cb)
 *    removeEdge(id, cb)
 *    filterVertex(filter, isInit): 过滤顶点，需要调用 update 才能更新, filter 表示过滤函数, isInit 表示是否在初始数据下进行过滤
 *    filterEdge(filter, isInit): 过滤边，需要调用  update 才能更新, filter 表示过滤函数, isInit 表示是否在初始数据下进行过滤
 *    resetData(): 使用 rawData 重置 data 绘图数据
 *   @event
 *    bindEvents(): 绑定事件, 需要在实例 render 前调用, 每次更新也会执行
 *    bindScale(): 绑定缩放
 *    bindDrag(): 绑定拖拽
 *    zooming(): 缩放过程中触发
 *    需要自行在 bindEvents 中添加:
 *    bindRightClick(cb): 绑定右键点击事件
 *    bindLineWith(cb): 绑定连线事件
 *    addDblClick(cb): 双击事件
 *   @else 其他辅助类函数
 *    getTransform(): 获取当前 SVG 的偏移和缩放
 *    transformTo(transform): 将当前图谱转换到某个位置和缩放大小
 *    zoomTo(scale): 缩放至某大小
 *    getCount(): 获取当前数据的统计信息, 根据 type 分类
 *    changeTheme(theme): 改变当前主题
 *    highlightVertex(ids): 高亮某些节点
 *    highlightEdge(ids): 高亮某些边
 *    shortestPath(source, target): 获取两个节点之间最短路径上的所有节点和边的 ids
 *    radiationVertex(d): 获取当前顶点呈放射状的顶点和边
 *    relationVertex(d): 获取当前顶点所有直接关联的边和顶点
 *
 * create by destiny on 2019-03-25
 * update by destiny on 2020-04-10
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
      alphaDecay: 0.07,
    };
    options = Object.assign({}, defaultOptions, options);
    super(el, data, options);

    // 顶点和边的数据
    this.vertexes = this.data.vertexes;
    this.edges = this.data.edges;

    // 默认的单个节点和边数据
    this.defaultVertex = {
      _id: '',
      type: '',
      name: '',
    };
    this.defaultEdge = {
      _id: '',
      type: '',
      label: '',
      _from: '',
      _to: '',
    };

    // 顶点形状
    this.symbol = d3.symbol();
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
    // 用于最短路径查找
    this.adjList = [];
    this.vertexesMap = [];
    this.edgeTo = [];
    this.marker = [];

    // 记录当前所有节点的 ID
    this.idMap = this.vertexes.map((v) => v._id).concat(this.edges.map((e) => e._id));

    // 初始化数据以及图的最短路径算法
    this.vertexes.forEach((v) => {
      v.state = 'normal';
      this.vertexesMap.push(v._id);
    });
    this.edges.forEach((e) => {
      let from = this.vertexesMap.indexOf(e._from);
      let to = this.vertexesMap.indexOf(e._to);
      e.source = e._from;
      e.target = e._to;
      e.state = 'normal';
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
      .id((e) => e._id);

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
      .on('end', this.renderEnd.bind(this));

    return this;
  }
  setEdgeIndex() {
    let linkMap = {};
    let nodeMap = {};
    let directionMap = {};
    this.edges.forEach((l) => {
      let { _from: from, _to: to } = l;
      if (!linkMap[from + to]) {
        linkMap[from + to] = linkMap[to + from] = 1;
      } else {
        if (from !== to) {
          linkMap[from + to]++;
          linkMap[to + from]++;
        } else {
          linkMap[to + from]++;
        }
      }
      l.directionFlag = false;
      if (from !== to && directionMap[to + from] === true) {
        l.directionFlag = true;
      } else {
        directionMap[from + to] = true;
      }

      nodeMap[from] = nodeMap[from] ? nodeMap[from] + 1 : 1;
      nodeMap[to] = nodeMap[to] ? nodeMap[to] + 1 : 1;
      l.linkIndex = linkMap[from + to]; // 节点 A、B 之间可能有多条边，这条边所在的 index
    });
    this.edges.forEach((l) => {
      const { _from: from, _to: to } = l;
      l.linkTotal = linkMap[from + to]; // 相同节点间的边总数
      l.halfTotal = l.linkTotal / 2;
      l.isTotalEven = l.linkTotal % 2 === 0; // 总数是否是偶数
      l.isMidLink = !l.isTotalEven && Math.ceil(l.halfTotal) === l.linkIndex; // 是否中间的边
      l.isLowerHalf = l.linkIndex <= l.halfTotal;
      l.linkDirection = l.isLowerHalf ? 0 : 1;
    });
  }

  /* 绘制图谱 */
  preprocessChart() {
    this.chartGroup.append('g').classed('edges', true);
    this.chartGroup.append('g').classed('vertexes', true);
    this.chartGroup.append('defs').classed('reverse-paths', true);
    this.chartGroup
      .append('defs')
      .classed('arrows', true)
      .append('marker')
      .datum({
        _id: '',
        type: '',
        state: 'normal',
      })
      .classed('arrow-default', true)
      .attr('id', 'arrow_default')
      .attr('refX', 10)
      .attr('refY', 5)
      .attr('markerUnits', 'userSpaceOnUse')
      .attr('markerWidth', 10)
      .attr('markerHeight', 10)
      .attr('orient', 'auto')
      .append('path')
      .classed('arrow-path', true)
      .attr('d', 'M0,0 L10,5 L0,10 z');

    return this;
  }
  draw() {
    this.drawVertexes();
    this.drawEdges();
    this.drawReversePath();
    this.drawArrow();
    this.setBgColor();
    return this;
  }
  onTick() {
    // 移动点的位置
    this.tickVertexes();

    // 移动边的位置
    this.tickEdges();

    // 边 label 的动态调整
    this.tickEdgeLabels();
  }
  tickVertexes() {
    this.chartGroup
      .selectAll('g.vertex-group')
      .attr('transform', (d) => `translate(${d.x}, ${d.y})`);
  }
  tickEdges() {
    this.chartGroup.selectAll('.edge-path').attr('d', (d) => {
      // 自己指向自己
      if (d.source._id === d.target._id) {
        return this.calcSelfPath(d);
      }

      const { sx, sy, tx, ty, dr, sf } = this.calcPath(d);
      const path = `M${sx},${sy} A ${dr},${dr} 0 0 ${sf}, ${tx} ${ty}`;
      const reversePath = `M${tx},${ty} A ${dr},${dr} 0 0 ${1 - sf}, ${sx} ${sy}`;
      // 调整反向路径
      this.chartGroup.select('#path_reverse_' + d._id).attr('d', reversePath);

      return path;
    });
  }
  calcSelfPath(d) {
    let index = d.linkIndex;
    let { x, y } = d.source;
    let dx = 1 + 0.7 * (index - 1);
    let h = dx * 100;
    let w = dx * 1;
    // 使用三次贝塞尔曲线绘制
    return `M${x} ${y} C ${x - w} ${y - h}, ${x + h} ${y + w}, ${x} ${y}`;
  }
  // calcPath(d) {
  //   let { x: sx, y: sy } = d.source;
  //   let { x: tx, y: ty } = d.target;
  //   let dx = sx - tx;
  //   let dy = sy - ty;

  //   let dr = Math.sqrt(dx * dx + dy * dy);
  //   let midIdx = (d.linkTotal + 1) / 2;

  //   dr = d.isMidLink
  //     ? 0
  //     : dr /
  //       (Math.log(Math.abs(d.linkIndex - midIdx) * 2.5) +
  //         1 / (10 * Math.pow(d.linkIndex - midIdx, 2))); // 弧度绘制

  //   return {
  //     sx,
  //     sy,
  //     tx,
  //     ty,
  //     dr,
  //     sf: d.linkDirection
  //   };
  // }
  calcPath(d) {
    let { x: sx, y: sy } = d.source;
    let { x: tx, y: ty } = d.target;
    const dx = sx - tx;
    const dy = sy - ty;
    const dr = Math.sqrt(dx * dx + dy * dy);

    if (d.directionFlag) {
      [sx, sy, tx, ty] = [tx, ty, sx, sy];
    }
    const xFlag = sx > tx;
    const yFlag = sy > ty;
    const xSign = xFlag ? 1 : -1; // 加减符号标记
    const ySign = yFlag ? 1 : -1;

    const perDeg = Math.PI / 6;
    const curDeg = Math.asin(Math.abs(dy / dr));

    const sr = this.getRadius(this.getVertexById(d._from));
    const tr = this.getRadius(this.getVertexById(d._to));

    let dsx, dsy, dtx, dty; // x y 方向的偏移

    const midIdx = (d.linkTotal + 1) / 2;

    let index = d.isMidLink
      ? 0
      : (xFlag && yFlag) || (!xFlag && !yFlag) // 当 target 位于 左上角 和 右下角时, 改变渲染位置
      ? d.linkIndex - midIdx
      : midIdx - d.linkIndex;

    const deg = curDeg + index * perDeg; // 当前角度
    const minusDeg = curDeg - index * perDeg; // 当前角度

    const cos1 = Math.cos(deg);
    const sin1 = Math.sin(deg);
    const cos2 = Math.cos(minusDeg);
    const sin2 = Math.sin(minusDeg);

    dsx = cos1;
    dsy = sin1;
    dtx = cos2;
    dty = sin2;

    // 计算实际相连的两个圆上的点
    sx = sx - sr * dsx * xSign;
    sy = sy - sr * dsy * ySign;
    tx = tx + tr * dtx * xSign;
    ty = ty + tr * dty * ySign;

    if (d.directionFlag) {
      [sx, sy, tx, ty] = [tx, ty, sx, sy];
    }

    const sf = d.directionFlag ? d.linkDirection : 1 - d.linkDirection;
    return {
      sx,
      sy,
      tx,
      ty,
      dr: d.isMidLink ? 0 : dr,
      sf,
    };
  }
  tickEdgeLabels() {
    // 通过旋转 label, 使文字始终处于 edge 上方
    this.chartGroup.selectAll('.edge-label textPath').attr('xlink:href', (d) => {
      if (d.source.x > d.target.x) {
        return '#path_reverse_' + d._id;
      } else {
        return '#path_' + d._id;
      }
    });
    // 微调边上文字的文职
    this.chartGroup.selectAll('.edge-label').attr('transform', (d) => {
      let { x: sx, y: sy } = d.source;
      let { x: tx, y: ty } = d.target;
      let r = Math.sqrt(Math.pow(sx - tx, 2) + Math.pow(sy - ty, 2));

      if (Math.abs(sy - ty) < r / 2) {
        return 'translate(0, -5)';
      } else if ((sx > tx && sy > ty) || (sx < tx && sy < ty)) {
        return 'translate(5, 0)';
      } else if ((sx > tx && sy < ty) || (sx < tx && sy > ty)) {
        return 'translate(-5, 0)';
      }
    });
  }
  // 节点绘制
  drawVertexes() {
    const update = this.chartGroup
      .select('.vertexes')
      .selectAll('.vertex-group')
      .data(this.vertexes);
    this.nodeEnter = update.enter();
    const exit = update.exit();

    // 对 enter 的处理: 插入必要的节点
    const vertexGroup = this.nodeEnter.append('g').classed('vertex-group', true);
    this.drawVertex(vertexGroup);

    // 更新节点属性和样式
    this.setVertexAttr();
    this.setVertexStyle();
    this.options.draggable ? this.bindDrag() : null;

    // 对 exit 的处理: 去掉没有数据关联的节点
    exit.remove();
  }
  drawVertex(vertexGroup) {
    const vertex = vertexGroup
      .append('g') // 增加节点
      .classed('vertex', true);
    vertex
      .append('path') // 圆圈
      .classed('circle', true);
    vertex
      .append('image') // 节点 icon
      .classed('icon', true);
    vertex
      .append('text') // 节点名称
      .attr('class', 'vertex-name')
      .style('text-anchor', 'middle')
      .style('dominant-baseline', 'baseline')
      .style('user-select', 'none');
  }
  setVertexAttr() {
    this.chartGroup.selectAll('.vertex-group').each((d, i, g) => {
      const vertexGroup = d3.select(g[i]);
      vertexGroup.attr('data-id', (d) => d._id).attr('type', (d) => d.type);

      this.setVertexCircleAttr(vertexGroup.select('.circle'));
      this.setIconAttr(vertexGroup.select('.icon'));
      this.setVertexNameAttr(vertexGroup.select('.vertex-name'));
    });
  }
  setVertexCircleAttr(node) {
    node.attr('d', (d) => {
      let type = this.getShape(d);
      type = 'symbol' + type[0].toUpperCase() + type.slice(1);
      let size = this.getRadius(d) * this.getRadius(d) * Math.PI;
      let _d3 = d3; // 直接使用 d3[type] 报错
      return this.symbol.size(size).type(_d3[type])();
    });
  }
  setIconAttr(node) {
    let data = node.datum();
    let r = this.getRadius(data);
    let imgMap = {};
    node
      .attr('width', r * 2)
      .attr('height', r * 2)
      .attr('x', -r)
      .attr('y', -r)
      .each((d) => {
        let imgHref = this.getIcon(d);
        if (!imgHref) return;
        if (imgMap[imgHref]) {
          node.attr('href', dataUrl);
        } else {
          // fetch(imgHref)
          //   .then((res) => res.text())
          //   .then((res) => {
          //     let dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(res);
          //     node.attr('href', dataUrl);
          //     imgMap[imgHref] = dataUrl;
          //   });
          ajaxGet(imgHref, function (res) {
            let dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(res);
            node.attr('href', dataUrl);
            imgMap[imgHref] = dataUrl;
          });
        }
      });
  }
  setVertexNameAttr(node) {
    if (this.getTransform().k < 0.8) {
      node.style('opacity', '0');
    } else {
      node.style('opacity', '1');
    }

    const data = node.datum();
    if (!data.name) return;

    node.selectAll('tspan').remove();
    let textStack = this.getTextStack(data) || [];
    textStack.forEach((v) => {
      node
        .append('tspan')
        .text(v.name)
        .attr('x', v.dx)
        .attr('y', v.dy)
        .style('font-size', this.options.vertexFontSize);
    });
    this.drawType(node);
  }
  setVertexStyle() {
    this.chartGroup
      .selectAll('.circle')
      .attr('fill', (d) => this.getVertexColor(d))
      .attr('stroke', (d) => this.getVertexStrokeColor(d))
      .attr('stroke-width', (d) => this.getVertexStrokeWidth(d));

    this.chartGroup.selectAll('.icon').attr('xlink:href', (d) => this.getIcon(d));

    this.chartGroup.selectAll('text.vertex-name').style('fill', (d) => this.getVertexNameColor(d));

    return this;
  }
  drawType(text) {
    // add type
    // this.typeNameMap = {
    //   person: '人',
    //   company: '公司'
    // };
    // this.typeColorMap = {
    //   person: 'red',
    //   company: 'blue'
    // };
    // text
    //   .append('tspan')
    //   .text(d => `[${this.typeNameMap[d.type]}]`)
    //   .attr('fill', d => this.typeColorMap[d.type])
    //   .style('font-size', this.options.vertexFontSize);
  }
  // 边
  drawEdges() {
    const update = this.chartGroup.select('.edges').selectAll('.edge').data(this.edges);
    this.linkEnter = update.enter();
    const exit = update.exit();

    // 对 enter 的处理: 插入必要的节点
    const edgeGroup = this.linkEnter.append('g').classed('edge', true);
    this.drawEdge(edgeGroup);

    // 更新节点属性和样式
    this.setEdgeAttr();
    this.setEdgeStyle();

    // 对 exit 的处理: 去掉没有数据关联的节点
    exit.remove();
  }
  drawEdge(edgeGroup) {
    edgeGroup.append('path').classed('edge-path', true);
    edgeGroup
      .append('text')
      .classed('edge-label', true)
      .append('textPath')
      .attr('startOffset', '50%')
      .attr('text-anchor', 'middle')
      .style('user-select', 'none');
  }
  setEdgeAttr() {
    this.chartGroup.selectAll('.edge').each((d, i, g) => {
      const edge = d3.select(g[i]);
      edge.attr('data-id', (d) => d._id).attr('type', (d) => d.type);

      this.setPathAttr(edge.select('.edge-path'));
      this.setEdgeLabelAttr(edge.select('.edge-label textPath'));
    });
  }
  setPathAttr(node) {
    node
      .attr('fill', 'none')
      .attr('id', (d) => 'path_' + d._id)
      .attr('marker-end', (d) => `url(#arrow_${d._id})`);
  }
  setEdgeLabelAttr(node) {
    node
      .attr('xlink:href', (d) => {
        return '#path_' + d._id;
      })
      .text((d) => {
        return d.label || '';
      })
      .style('font-size', this.options.edgeFontSize);

    if (this.getTransform().k < 0.8) {
      node.style('opacity', '0');
    } else {
      node.style('opacity', '1');
    }
  }
  setEdgeStyle() {
    // 边
    this.chartGroup
      .selectAll('.edge-path')
      .attr('stroke', (d) => this.getEdgeColor(d))
      .attr('stroke-width', (d) => this.getEdgeWidth(d));

    // 箭头
    this.setArrowStyle();

    // 边文字
    this.chartGroup
      .selectAll('.edge-label textPath')
      .style('fill', (d) => this.getEdgeLableColor(d));

    return this;
  }
  drawReversePath() {
    // 增加反向路径, 用于旋转 label
    const update = this.chartGroup
      .select('.reverse-paths')
      .selectAll('.reverse-path')
      .data(this.edges);
    const enter = update.enter();
    const exit = update.exit();

    enter
      .filter((d) => d.source._id !== d.target._id)
      .append('path')
      .classed('reverse-path', true);

    this.setReversePathAttr();

    exit.remove();
  }
  setReversePathAttr() {
    this.chartGroup.selectAll('.reverse-path').each((d, i, g) => {
      const node = d3.select(g[i]);
      node
        .attr('fill', 'none')
        .attr('stroke', (d) => this.getEdgeColor(d))
        .attr('id', function (d) {
          return 'path_reverse_' + d._id;
        });
    });
  }
  drawArrow() {
    // 箭头
    const update = this.chartGroup.select('.arrows').selectAll('.arrow-marker').data(this.edges);
    const enter = update.enter();
    const exit = update.exit();

    enter
      .append('marker')
      .classed('arrow-marker', true)
      .attr('id', (d) => 'arrow_' + d._id)
      .attr('refX', 10)
      .attr('refY', 5)
      .attr('markerUnits', 'userSpaceOnUse')
      .attr('markerWidth', 10)
      .attr('markerHeight', 10)
      .attr('orient', 'auto')
      .append('path')
      .classed('arrow-path', true)
      .attr('d', 'M0,0 L10,5 L0,10 z');

    this.setArrowStyle();

    exit.remove();
  }
  setArrowStyle() {
    this.chartGroup.selectAll('.arrow-path').attr('fill', (d) => this.getArrowColor(d));

    return this;
  }

  /* 事件 */
  bindEvents() {}
  zooming() {
    // 缩放过程中, 小于 0.8 则将文本隐藏
    if (d3.event.transform.k < 0.8) {
      this.chartGroup.selectAll('.vertex-name').style('opacity', '0');
      this.chartGroup.selectAll('.edge-label').style('opacity', '0');
    } else {
      this.chartGroup.selectAll('.vertex-name').style('opacity', '1');
      this.chartGroup.selectAll('.edge-label').style('opacity', '1');
    }
  }
  renderEnd() {
    // 复写, 每次 tick 结束之后出发
  }
  // 拖拽事件
  bindDrag() {
    this.drag = d3
      .drag()
      .on('start', this.onDragStart.bind(this))
      .on('drag', this.onDrag.bind(this))
      .on('end', this.onDragEnd.bind(this));

    this.nodeEnter.selectAll('.vertex-group').call(this.drag);
  }
  onDragStart(d) {
    if (!d3.event.active) this.simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }
  onDrag(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }
  onDragEnd(d) {
    if (!d3.event.active) this.simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
  // 绑定点击事件
  addClick(onVertexClick, onEdgeClick) {
    this.nodeEnter.selectAll('.vertex').on('click', (...args) => {
      d3.event.stopPropagation();
      onVertexClick(...args);
    });
    this.linkEnter.selectAll('.edge').on('click', (...args) => {
      d3.event.stopPropagation();
      onEdgeClick(...args);
    });
  }
  // 绑定 hover 事件
  // addHover(onVertexHover, onVertexHoverout, onEdgeHover, onEdgeHoverout) {
  //   this.nodeEnter.selectAll('.vertex').on('mouseenter', onVertexHover);
  //   this.nodeEnter.selectAll('.vertex').on('mouseleave', onVertexHoverout);

  //   this.linkEnter.on('mouseenter', onEdgeHover);
  //   this.linkEnter.on('mouseleave', onEdgeHoverout);
  // }
  // 绑定右键点击事件
  bindRightClick(cb) {
    this.nodeEnter.selectAll('.vertex').on('contextmenu', (...args) => {
      d3.event.preventDefault();
      d3.event.stopPropagation();
      if (d3.event.button === 2) {
        cb && cb(...args);
      }
    });
    this.linkEnter.selectAll('.edge').on('contextmenu', (...args) => {
      d3.event.preventDefault();
      d3.event.stopPropagation();
      if (d3.event.button === 2) {
        cb && cb(...args);
      }
    });
    this.svg.on('contextmenu', (...args) => {
      d3.event.preventDefault();
      if (d3.event.button === 2) {
        cb && cb(...args);
      }
    });
  }
  // TODO: 绑定双击事件
  addDblClick(cb) {}
  // 绑定连线事件
  bindLineWith(start, end) {
    this.nodeEnter
      .selectAll('.vertex')
      .on('mouseup.line', (d) => {
        d3.event.stopPropagation();
        if (this.newLink) {
          this.appendNewLink(d, end);
        }
      })
      .on('mouseenter.line', (d, i, g) => {
        let el = g[i];
        d3.select(el)
          .append('rect')
          .datum(d)
          .attr('width', 6)
          .attr('height', 6)
          .attr('x', -3)
          .attr('y', -3)
          .attr('fill', 'transparent')
          .style('cursor', 'crosshair')
          .on('mousedown.line', (d) => {
            d3.event.stopPropagation();
            start && start();
            this.addNewLink(d);
          })
          .on('mouseup.line', (d) => {
            d3.event.stopPropagation();
            if (this.newLink) {
              let id = this.newLink.datum()._from;
              if (id === d._id) {
                this.removeNewLink();
              } else {
                this.appendNewLink(d, end);
              }
            }
          });
      })
      .on('mouseleave.line', (d, i, g) => {
        let el = g[i];
        d3.select(el).select('rect').remove();
      });

    this.linkEnter.selectAll('.edge').on('mouseup.line', () => {
      if (this.newLink) {
        this.removeNewLink();
      }
    });

    this.$el
      .on('mousemove.line', () => {
        if (this.newLink) {
          this.newLink.call(this.updateNewLink.bind(this), this.svg.node());
        }
      })
      .on('mouseup.line', () => {
        if (this.newLink) {
          this.removeNewLink();
        }
      });
  }
  // 鼠标移动时，不断更新新建的线
  updateNewLink(selection, container) {
    selection.attr('d', (d) => {
      let coord = d3.mouse(container);
      // 抵消缩放移位的影响
      let transform = d3.zoomTransform(container);
      let transformedCoord = transform.invert(coord);

      let x1 = d.source.x,
        y1 = d.source.y,
        x2 = transformedCoord[0],
        y2 = transformedCoord[1];

      // 在拖拽新增的线条时，预留足够的移动空间，防止鼠标移动到线条上面，导致触发移出顶点的事件
      let angle = Math.atan2(y2 - y1, x2 - x1);
      x2 = x2 - Math.cos(angle) * 10;
      y2 = y2 - Math.sin(angle) * 10;

      return 'M' + x1 + ',' + y1 + 'A0,0 0 0,0 ' + x2 + ',' + y2;
    });
  }
  removeNewLink() {
    this.newLink.remove();
    this.newLink = null;
  }
  appendNewLink(d, cb) {
    let to = d._id;
    let from = this.newLink.datum()._from;
    this.addEdge({ _from: from, _to: to }, cb);
    this.removeNewLink();
  }
  addNewLink(d) {
    // 增加新的连线
    this.newLink = this.chartGroup
      .append('path')
      .datum({
        _from: d._id,
        source: d,
        state: 'normal',
      })
      .attr('stroke', (d) => this.getEdgeColor(d))
      .attr('stroke-width', (d) => this.getEdgeWidth(d))
      .attr('marker-end', 'url("#arrow_default")');
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
    // return this.options.vertexColor;
    switch (d.type) {
      case 'company':
        switch (this.theme + '-' + d.state) {
          case 'light-highlight':
          case 'dark-highlight':
            return '#4FA2F1';
          case 'light-grey':
            return '#E9E9E9';
          case 'dark-grey':
            return '#323A4D';
          case 'light-normal':
          case 'dark-normal':
          default:
            return this.options.vertexColor;
        }
      case 'person':
        switch (this.theme + '-' + d.state) {
          case 'light-highlight':
          case 'dark-highlight':
            return '#64C680';
          case 'light-grey':
            return '#E9E9E9';
          case 'dark-grey':
            return '#323A4D';
          case 'dark-normal':
          case 'light-normal':
          default:
            return this.options.vertexColor;
        }
      default:
        return this.options.vertexColor;
    }
  }
  getVertexStrokeColor(d) {
    return 'none';
  }
  getVertexStrokeWidth(d) {
    return 1;
  }
  getVertexNameColor(d) {
    // return '#42444C';
    switch (this.theme + '-' + d.state) {
      case 'light-normal':
      case 'light-highlight':
        return '#42444C';
      case 'light-grey':
        return '#B3B3B3';
      case 'dark-normal':
      case 'dark-highlight':
        return '#fff';
      case 'dark-grey':
        return '#646E87';
      default:
        return '#000';
    }
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
        dy: j++ * lineHeight + y,
      });
      name = name.slice(lineNum);
    }
    textStack.push({
      name: name.slice(0),
      dx: 0,
      dy: j++ * lineHeight + y,
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
        dy: dY,
      });
      dY += lineHeight;
      name = name.slice(lineNum);
    }
    textStack.push({
      name: name,
      dx: 0,
      dy: dY,
    });

    return textStack;
  }
  getIcon(d) {
    return this.options.iconPath && d.type
      ? `${this.options.iconPath}/${d.type.toLowerCase()}_${d.state}.svg `
      : '';
  }
  // 边样式
  getArrowColor(d) {
    return this.getEdgeColor(d);
  }
  // getArrowUrl(d) {
  //   if (d.source._id === d.target._id) {
  //     return `url("#arrow_default")`;
  //   }
  //   return `url("#arrow_${d._id}")`;
  // }
  getEdgeColor(d) {
    // return '#D9D9D9';
    switch (this.theme + '-' + d.state) {
      case 'light-normal':
      case 'light-grey':
        return '#D9D9D9';
      case 'light-highlight':
      case 'dark-highlight':
        return this.getVertexColor(d.target);
      case 'dark-grey':
      case 'dark-normal':
        return '#3C4257';
      default:
        return '#000';
    }
  }
  getEdgeLableColor(d) {
    // return '#5B5B5B';
    switch (this.theme + '-' + d.state) {
      case 'light-normal':
        return '#5B5B5B';
      case 'light-grey':
        return '#B3B3B3';
      case 'light-highlight':
      case 'dark-highlight':
        return this.getVertexColor(d.target);
      case 'dark-normal':
      case 'dark-grey':
        return '#808593';
      default:
        return '#000';
    }
  }
  getEdgeWidth(d) {
    switch (d.state) {
      case 'normal':
      case 'grey':
        return 1;
      case 'highlight':
        return 3;
      default:
        return 1;
    }
    // return 1;
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

  /* 关于数据的获取和变更 */
  // 获取节点或边的数据
  getVertexById(id) {
    let vertexArr = this.vertexes.filter((v) => {
      return v._id === id;
    });
    return vertexArr[0] ? deepCopy(vertexArr[0]) : null;
  }
  getEdgeById(id) {
    let edgeArr = this.edges.filter((e) => {
      return e._id === id;
    });
    return edgeArr[0] ? deepCopy(edgeArr[0]) : null;
  }
  // 改变原始数据
  useCache(rawData, chartData) {
    this.rawData = deepCopy(rawData);
    this.data = deepCopy(chartData);
    this.vertexes = this.data.vertexes;
    this.edges = this.data.edges;

    // 完全重新渲染整个 SVG
    this.chartGroup.selectAll('*').remove();
    this.preprocessChart();
    this.update();
  }
  changeRawData(type, rawData, updateData) {
    let [newType, dataType] = type.split('-');
    this.changeData(newType, rawData[dataType], updateData);

    return this;
  }
  changeData(type, rawData, updateData) {
    switch (type) {
      case 'add':
        rawData.push(deepCopy(updateData));
        break;
      case 'update':
        rawData.forEach((item) => {
          this.updateItem(item, updateData);
        });
        break;
      case 'remove':
        for (let i = 0; i < rawData.length; i++) {
          let item = rawData[i];
          if (item._id === updateData) {
            rawData.splice(i, 1);
            i--;
          }
        }
    }
  }
  updateItem(item, data) {
    if (item._id === data._id) {
      Object.keys(data).forEach((key) => {
        if (item[key] === undefined) return; // 如果本身不存在这个属性, 那么就不进行添加
        item[key] = data[key];
      });
    }
  }
  // 增加节点和边数据
  // reAddVertex(data) {
  //   let { vertex, edges } = data;
  //   let rawVertex = diffAssign(this.defaultVertex, vertex);
  //   this.changeRawData('add-vertexes', this.rawData, rawVertex);
  //   this.changeRawData('add-vertexes', this.data, vertex);

  //   if (edges) {
  //     edges.forEach((edge) => {
  //       let rawEdge = diffAssign(this.defaultEdge, edge);
  //       this.changeRawData('add-edges', this.rawData, rawEdge);
  //       this.changeRawData('add-edges', this.data, edge);
  //     });
  //   }
  //   this.update();
  // }
  addVertex(x, y, data, cb) {
    let defaultData = deepCopy(this.defaultVertex);
    if (!data._id) {
      let id = this.newId();
      defaultData._id = id;
    }
    let rawVertex = diffAssign(defaultData, data);
    let vertex = Object.assign({}, defaultData, data);

    this.changeRawData('add-vertexes', this.rawData, rawVertex);
    // 抵消偏移和缩放的影响
    let { x: curX, y: curY, k: curK } = this.getTransform();
    x = (x - curX) / curK;
    y = (y - curY) / curK;

    vertex.x = x;
    vertex.y = y;

    this.changeRawData('add-vertexes', this.data, vertex);

    this.update();

    let cache = {
      rawData: deepCopy(this.rawData),
      chartData: deepCopy(this.data),
    };
    cb && cb(cache);
  }
  addEdge(data, cb) {
    let defaultData = deepCopy(this.defaultEdge);
    if (!data._id) {
      let id = this.newId();
      defaultData._id = id;
    }

    let rawEdge = diffAssign(defaultData, data);
    let edge = Object.assign({}, defaultData, data);
    this.changeRawData('add-edges', this.rawData, rawEdge);
    this.changeRawData('add-edges', this.data, edge);
    this.update();

    let cache = {
      rawData: deepCopy(this.rawData),
      chartData: deepCopy(this.data),
    };
    cb && cb(cache);
  }
  // 创建新的无重复 ID
  newId() {
    let newId = getUUId();
    while (this.idMap.includes(newId)) {
      newId = getUUId();
    }
    this.idMap.push(newId);
    return newId;
  }
  // 改变节点和边的数据
  updateVertex(data, cb) {
    this.changeRawData('update-vertexes', this.rawData, data);
    this.changeRawData('update-vertexes', this.data, data);
    this.setVertexAttr();

    let cache = {
      rawData: deepCopy(this.rawData),
      chartData: deepCopy(this.data),
    };
    cb && cb(cache);
  }
  updateEdge(data, cb) {
    this.changeRawData('update-edges', this.rawData, data);
    this.changeRawData('update-edges', this.data, data);
    this.setEdgeAttr();

    let cache = {
      rawData: deepCopy(this.rawData),
      chartData: deepCopy(this.data),
    };
    cb && cb(cache);
  }
  // 删除节点和边数据
  removeVertex(id, cb) {
    let vertex = this.getVertexById(id);
    if (!vertex) return;

    this.changeRawData('remove-vertexes', this.rawData, id);
    this.changeRawData('remove-vertexes', this.data, id);

    // 相关的边也需要删除
    let edges = this.rawData.edges.filter((e) => {
      return e._from === id || e._to === id;
    });
    edges.forEach((e) => {
      this.changeRawData('remove-edges', this.rawData, e._id);
      this.changeRawData('remove-edges', this.data, e._id);
    });
    this.update();

    let cache = {
      rawData: deepCopy(this.rawData),
      chartData: deepCopy(this.data),
    };
    cb && cb(cache);
  }
  removeEdge(id, cb) {
    let edge = this.getEdgeById(id);
    if (!edge) return;
    this.changeRawData('remove-edges', this.rawData, id);
    this.changeRawData('remove-edges', this.data, id);
    this.update();

    let cache = {
      rawData: deepCopy(this.rawData),
      chartData: deepCopy(this.data),
    };
    cb && cb(cache);
  }
  // 过滤与重置
  filterVertex(filter, isInit) {
    if (typeof filter !== 'function') throw new Error('filters need a function as first parameter');

    let vertexIds = [];
    let filterIds = [];

    let vertexes = isInit ? deepCopy(this.rawData.vertexes) : deepCopy(this.data.vertexes);
    let edges = isInit ? deepCopy(this.rawData.edges) : deepCopy(this.data.edges);

    // 筛选掉 filter 返回为 false 的顶点
    vertexes.forEach((d, i, g) => {
      // 如果 filter 执行返回为 true，则保留
      if (filter(d, i, g)) {
        filterIds.push(d._id);
      }
    });

    // 保留 filter 返回 true 相连的所有边
    this.data.edges = this.edges = edges.filter((d) => {
      if (filterIds.includes(d._from) || filterIds.includes(d._to)) {
        vertexIds.push(d._to);
        vertexIds.push(d._from);
        return true;
      }
      return false;
    });

    // 去重
    vertexIds = Array.from(new Set(vertexIds));
    // 筛选掉没有边连接的顶点
    this.data.vertexes = this.vertexes = vertexes.filter((d) => {
      if (vertexIds.includes(d._id)) {
        return true;
      }
      return false;
    });

    return this;
  }
  filterEdge(filter, isInit) {
    if (typeof filter !== 'function') throw new Error('filters need a function as first parameter');

    let vertexIds = [];

    let vertexes = isInit ? deepCopy(this.rawData.vertexes) : deepCopy(this.data.vertexes);
    let edges = isInit ? deepCopy(this.rawData.edges) : deepCopy(this.data.edges);

    // 筛选掉 filter 返回为 false 的边
    this.data.edges = this.edges = edges.filter((d, i, g) => {
      if (filter(d, i, g)) {
        vertexIds.push(d._from);
        vertexIds.push(d._to);
        return true;
      }
      return false;
    });

    // 去重
    vertexIds = Array.from(new Set(vertexIds));

    // 筛选掉没有边连接的顶点
    this.data.vertexes = this.vertexes = vertexes.filter((d) => {
      if (vertexIds.includes(d._id)) {
        return true;
      }
      return false;
    });

    return this;
  }
  resetData() {
    this.data = deepCopy(this.rawData);
    this.vertexes = this.data.vertexes;
    this.edges = this.data.edges;

    this.update();
    return this;
  }

  /* 辅助函数 */
  // 获取当前 svg 的 transform
  getTransform() {
    return d3.zoomTransform(this.svg.node());
  }
  // 变形至传递的 transform
  transformTo(transform) {
    this.svg.transition().duration(300).call(this.zoom.transform, transform);
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
  // 获取统计信息
  getCount() {
    let result = {};
    result.vertex = this.getVertexCount();
    result.edge = this.getEdgeCount();
    return result;
  }
  getVertexCount() {
    let result = {};
    this.vertexes.forEach((item) => {
      if (!result[item.type]) {
        result[item.type] = 1;
      } else {
        result[item.type]++;
      }
    });
    return result;
  }
  getEdgeCount() {
    let result = {};
    this.edges.forEach((item) => {
      if (!result[item.type]) {
        result[item.type] = 1;
      } else {
        result[item.type]++;
      }
    });
    return result;
  }
  resetStyle() {
    this.setVertexStyle().setEdgeStyle().setBgColor();
  }
  setBgColor() {
    this.svg.style('background', this.getBgColor());
    return this;
  }
  // 高亮顶点和边
  highlightVertex(ids) {
    this.chartGroup.selectAll('.vertex-group').each((d, i, g) => {
      if (ids && ids.includes(d._id)) {
        d.state = 'highlight';
      } else {
        d.state = 'grey';
      }
    });

    this.setVertexStyle();

    return this;
  }
  highlightEdge(ids) {
    this.chartGroup.selectAll('.edge').each((d, i, g) => {
      if (ids && ids.includes(d._id)) {
        d.state = 'highlight';
      } else {
        d.state = 'grey';
      }
    });
    this.setEdgeStyle();

    return this;
  }
  // 获取最短路径上的所有顶点和边
  shortestPath(source, target) {
    const { adjList, vertexesMap } = this;
    let from = vertexesMap.indexOf(source._id);
    let to = vertexesMap.indexOf(target._id);
    let vertexIds = [];
    let edgeIds = [];
    this.bfs(from);
    let path = this.pathTo(from, to);

    if (path.length <= 1) {
      return {
        vertexIds: [target._id],
        edgeIds: [],
      };
    }
    path.forEach((v, i) => {
      vertexIds.push(vertexesMap[v]);
      if (i > 0) {
        edgeIds.push(adjList[v][path[i - 1]][0]); // 如果两点之间存在多条边，返回的是第一条边
      }
    });
    return {
      vertexIds,
      edgeIds,
    };
  }
  // 广度遍历
  bfs(vertexNum) {
    for (let i in this.vertexesMap) {
      this.marker[i] = false;
    }
    let a = (v) => {
      this.marker[v] = true;

      let queue = [];
      queue.push(v);
      while (queue.length > 0) {
        let item = queue.shift();

        if (!this.adjList[item]) {
          continue;
        }

        Object.keys(this.adjList[item]).forEach((k) => {
          let i = +k;
          if (!this.marker[i]) {
            this.edgeTo[i] = item;
            queue.push(i);
            this.marker[i] = true;
          }
        });
      }
    };
    a(vertexNum);
  }
  // 最短路径
  pathTo(from, to) {
    let path = [];

    while (to !== from && this.edgeTo[to] !== undefined) {
      path.push(to);
      to = this.edgeTo[to];
    }
    path.push(from);
    return path;
  }
  // 获取当前顶点呈放射状的顶点和边
  // 以当前顶点为起点的边和边连接的所有顶点，包含当前顶点
  radiationVertex(d) {
    let vertexIds = [];
    let edgeIds = [];
    vertexIds.push(d._id);
    this.edges.forEach((e) => {
      if (e._from === d._id) {
        vertexIds.push(e._to);
        edgeIds.push(e._id);
      }
    });
    return {
      vertexIds,
      edgeIds,
    };
  }
  // 获取所有与当前顶点有关联的边和顶点
  // 包含当前顶点的所有边和边连接的所有顶点
  relationVertex(d) {
    let vertexIds = [];
    let edgeIds = [];
    vertexIds.push(d._id);
    this.edges.forEach((e) => {
      if (e._from === d._id || e._to === d._id) {
        vertexIds.push(e._to);
        vertexIds.push(e._from);
        edgeIds.push(e._id);
      }
    });
    vertexIds = Array.from(new Set(vertexIds));
    return {
      vertexIds,
      edgeIds,
    };
  }
}
export default Force;
