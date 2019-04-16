/**
 * Force: 力导向图类
 *
 * @extends
 *   BaseGraph
 * 
 * @parameter
 *   el [ HTMLElement | String ] 容器元素或者 ID
 *   options [ Object ] 配置选项
 *
 * @constructor
 *   el: 容器, d3 Selection 元素
 *   svg: SVG 画布, d3 Selection 元素
 *   chartGroup: 绘图容器, d3 Selection 元素
 *   nodeEnter: 所有的节点, d3 Selection 元素数组
 *   linkEnter: 所有边, d3 Selection 元素数组
 *
 * @methods
 *   render(): 渲染画布
 *   preprocessChart(): 初始化画布布局
 *   processData(): 数据处理, 需要在具体类中进行复写
 *   draw(): 绘图
 *   addVertexes(): 绘制节点 
 *   addEdges(): 绘制边
 *   filterVertex(filter, isRaw): 过滤顶点，需要另外调用 render 方法进行重绘
 *   filterEdge(filter, isRaw): 过滤边，需要另外调用 render 方法进行重绘
 *
 * create by destiny on 2019-03-25
 * update by destiny on 2019-04-01
 */
class Force extends BaseGraph {
  constructor(el, options) {
    let defaultOptions = {
      r: 20,                      // radius of vertex
      distance: 150,              // length of edge
      shape: 'circle',
      width: window.innerWidth,
      height: window.innerHeight,
      chargeStrength: -500,
      alphaDecay: 0.07,
      vertexColor: '#e3e3e3',
      edgeColor: '#e3e3e3',
      vertexFontSize: 10,
      edgeFontSize: 10,
      scalable: true,
      scaleExtent: [0.5, 2],
      scaleBar: false,
      draggable: true
    }
    options = Object.assign({}, defaultOptions, options);
    super(el, options);
    this.options = options;
  }
  
  layout() {
    const { options } = this;

    const linkForce = d3.forceLink(this.edges)
      .distance(options.distance)
      .id((e) => e._id)

    this.simulation = d3.forceSimulation()
      .alphaDecay(options.alphaDecay)
      .nodes(this.vertexes)
      .force('links', linkForce)
      .force('charge_force', d3.forceManyBody().strength(options.chargeStrength))
      .force('center_force', d3.forceCenter(options.width / 2, options.height / 2))
      .on('tick', this.onTick.bind(this))
      .on('end', this.onEndRender.bind(this))

    return this;
  }

  onTick() {
    // console.log('tick')
    // 移动点的位置
    this.chartGroup.selectAll('g.vertex')
      .attr('transform', (d) => `translate(${d.x}, ${d.y})`);

    this.chartGroup.selectAll('.vertex-name')
      .attr('transform', (d) => `translate(${d.x}, ${d.y})`);
    
    // 移动边的位置
    var selfMap = {};
    this.chartGroup.selectAll('.edge-path')
      .attr('d', (d) => {
        var dx = d.target.x - d.source.x;
        var dy = d.target.y - d.source.y;

        var dr = d.siblingNum > 1 ? Math.sqrt((dx * dx) + (dy * dy)) : 0;
        var middleIdx = (d.siblingNum + 1) / 2;

        if (d.siblingNum > 1) {
          dr = d.edgeIndex === middleIdx ? 0 : dr / (Math.log((Math.abs(d.edgeIndex - middleIdx) * 0.7) + 1) +
            (1 / (10 * Math.pow(d.edgeIndex, 2))))  // 弧度绘制
        }
        let sweepFlag = d.edgeIndex > middleIdx ? 1 : 0
        if (d.labelDirection) {
          sweepFlag = 1 - sweepFlag
        }
        let path = 'M' + d.source.x + ',' + d.source.y +
          'A' + dr + ',' + dr + ' 0 0 ' + sweepFlag + ',' + d.target.x + ',' + d.target.y
        
        // 自己指向自己
        if (d.source._id === d.target._id) {
          selfMap[d.source.name] = selfMap[d.source.name] ? selfMap[d.source.name] + 1 : 1;
          let h = selfMap[d.source.name] * 100;
          let w = selfMap[d.source.name] * 10;
          // 使用三次贝塞尔曲线绘制
          path = 'M' + d.source.x + ' ' + (d.source.y - this.getRadius(d)) + 
              ' C ' + (d.source.x - w) + ' ' + (d.source.y - h) + ', ' +
              (d.source.x + h) + ' ' + (d.source.y + w) + ', ' + 
                      (d.source.x + this.getRadius(d)) + ' ' + d.source.y;
        }

        // 增加反向路径，用于旋转 label
        this.chartGroup.select('#' + d._id + '_reverse')
          .attr('d', 'M' + d.target.x + ',' + d.target.y +
            'A' + dr + ',' + dr + ' 0 0 ' + (1 - sweepFlag) + ',' + d.source.x + ',' + d.source.y)

        return path
      })

    // 边 label 的动态调整
    this.chartGroup.selectAll('.edge-label textPath')
      .attr('xlink:href', (d) => {
        // 通过旋转 label, 使文字始终处于 edge 上方
        if (d.source.x > d.target.x) {
          return '#' + d._id + '_reverse';
        } else {
          return '#' + d._id;
        }
      })
    this.chartGroup.selectAll('.edge-label')
      .attr('transform', (d) => {
        let r = Math.sqrt(Math.pow(d.source.x - d.target.x, 2) + Math.pow(d.source.y - d.target.y, 2));

        if (Math.abs(d.source.y - d.target.y) < r / 2) {
          return 'translate(0, -5)';
        }
        else if ((d.source.x > d.target.x && d.source.y > d.target.y) ||
          (d.source.x < d.target.x && d.source.y < d.target.y)) {
          return 'translate(5, 0)';
        }
        else if ((d.source.x > d.target.x && d.source.y < d.target.y) ||
          (d.source.x < d.target.x && d.source.y > d.target.y)) {
          return 'translate(-5, 0)';
        }
      })
  }

  onEndRender() {
    console.log('render end');
  }

  addDrag() {
    this.drag = d3.drag()
      .on('start', this.onDragStart.bind(this))
      .on('drag', this.onDrag.bind(this))
      .on('end', this.onDragEnd.bind(this))
    this.nodeEnter.selectAll('.vertex').call(this.drag)

    return this
  }
  onDragStart(d) {
    if (!d3.event.active) this.simulation.alphaTarget(0.3).restart()
    d.fx = d.x
    d.fy = d.y
  }
  onDrag(d) {
    d.fx = d3.event.x
    d.fy = d3.event.y
  }
  onDragEnd(d) {
    if (!d3.event.active) this.simulation.alphaTarget(0)
    d.fx = null
    d.fy = null
  }
}
