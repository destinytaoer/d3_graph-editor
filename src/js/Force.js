class Force extends BaseGraph {
  constructor(el, options) {
    let defaultOptions = {
      r: 10,                      // radius of vertex
      distance: 150,              // length of edge
      shape: 'circle',
      width: window.innerWidth,
      height: window.innerHeight,
      chargeStrength: -2500,
      alphaDecay: 0.07,
      vertexColor: '#e3e3e3',
      edgeColor: '#e3e3e3',
      vertexFontSize: 12,
      edgeFontSize: 12,
      scalable: true,
      scaleExtent: [0.5, 2],
      scaleBar: true,
      draggable: true
    }
    options = Object.assign({}, defaultOptions, options);
    super(el, options);
    this.options = options;
  }

  preprocessData() {
    // 当前绘图数据，用于过滤时不影响原始数据
    this.data = JSON.parse(JSON.stringify(this.rawData));
    // 顶点和边的数据
    this.vertexes = this.data.vertexes;
    this.edges = this.data.edges;

    this.vertexes.forEach((v) => {
      v.type = v.type || v._id.split('/')[0];
      v.state = v.state || 'normal';
      this.vertexesMap.push(v._id);
    })
    this.edges.forEach((e) => {
      let from = this.vertexesMap.indexOf(e._from);
      let to = this.vertexesMap.indexOf(e._to);
      e.source = e._from;
      e.target = e._to;
      e.type = e.type;
      e.state = e.state || 'normal';
      this.adjList[from] = this.adjList[from] || {};
      this.adjList[from][to] = this.adjList[from][to] || [];
      this.adjList[from][to].push(e._id);
    })

    this.setEdgeIndex();

    return this;
  }

  setEdgeIndex() {
    let edgeNumMap = {};
    let vertexNumMap = {};
    let edgeDirection = {};
    this.edges.forEach((e) => {
      if (!edgeNumMap[e._from + e._to]) {
        edgeNumMap[e._from + e._to] = edgeNumMap[e._to + e._from] = 1;
        edgeDirection[e._from + e._to] = edgeDirection[e._to + e._from] = e._from;
      } else {
        edgeNumMap[e._from + e._to]++;
        edgeNumMap[e._to + e._from]++;
      }

      vertexNumMap[e._from] = vertexNumMap[e._from] ? vertexNumMap[e._from] + 1 : 1;
      vertexNumMap[e._to] = vertexNumMap[e._to] ? vertexNumMap[e._to] + 1 : 1;
      e.edgeIndex = edgeNumMap[e._from + e._to];   // 节点 A、B 之间可能有多条边，这条边所在的 index
    })
    this.edges.forEach((e) => {
      e.siblingNum = edgeNumMap[e._from + e._to]; // 节点 A、B 之间边的条数
      e.labelDirection = edgeDirection[e._from + e._to] === e._from ? 1 : 0; // 用于控制 label 从左到右还是从右到左渲染
    })
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

  draw() {
    this.layout()
      .addVertexes()
      .addEdges()
    
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
          dr = d.edgeIndex === middleIdx ? 0 : dr / (Math.log((Math.abs(d.edgeIndex - middleIdx) * 2) + 1) +
            (1 / (10 * Math.pow(d.edgeIndex, 2))))  // 弧度绘制
        }
        let sweepFlag = d.edgeIndex > middleIdx ? 1 : 0
        if (d.labelDirection) {
          sweepFlag = 1 - sweepFlag
        }
        let path = 'M' + d.source.x + ',' + d.source.y +
          'A' + dr + ',' + dr + ' 0 0 ' + sweepFlag + ',' + d.target.x + ',' + d.target.y
        
        // 自己指向自己
        if (d.source.name === d.target.name) {
          selfMap[d.source.name] = selfMap[d.source.name] ? selfMap[d.source.name] + 1 : 1;
          let h = selfMap[d.source.name] * 100;
          let w = selfMap[d.source.name] * 10;
          // 使用三次贝塞尔曲线绘制
          path = 'M' + d.source.x + ' ' + d.source.y + 
              ' C ' + (d.source.x - w) + ' ' + (d.source.y - h) + ', ' +
              (d.source.x + h) + ' ' + (d.source.y + w) + ', ' + 
                      d.source.x + ' ' + d.source.y;
        }

        // 增加反向路径，用于旋转 label
        this.chartGroup.select('#' + d._id.replace('/', '_') + '_reverse')
          .attr('d', 'M' + d.target.x + ',' + d.target.y +
            'A' + dr + ',' + dr + ' 0 0 ' + (1 - sweepFlag) + ',' + d.source.x + ',' + d.source.y)

        return path
      })

    // 边 label 的动态调整
    this.chartGroup.selectAll('.edge-label textPath')
      .attr('xlink:href', (d) => {
        // 通过旋转 label, 使文字始终处于 edge 上方
        if (d.source.x > d.target.x) {
          return '#' + d._id.replace('/', '_') + '_reverse';
        } else {
          return '#' + d._id.replace('/', '_');
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
    let dragHandler = d3.drag()
      .on('start', this.onDragStart.bind(this))
      .on('drag', this.onDrag.bind(this))
      .on('end', this.onDragEnd.bind(this))
    this.nodeEnter.selectAll('.vertex').call(dragHandler)

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
