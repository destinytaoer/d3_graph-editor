/**
 * BaseGraph: 关系型图谱的基类
 *
 * @parameter
 *   el [ HTMLElement | String ] 容器元素或者 ID
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
 * 依赖于 d3 EventEmitter Cache 模块
 *
 * create by destiny on 2019-03-25
 * update by destiny on 2019-03-26
 */
class BaseGraph {
  constructor(el, options) {
    // 判断是否是 HTML 元素或者 ID 字符串
    if (!(el instanceof HTMLElement) && typeof el !== 'string') {
      throw new Error('BaseGraph need HTMLElement or ID as first parameter');
    }

    if (typeof el === 'string') {
      this.$el = document.getElementById(el);
      if (!this.$el) {
        throw new Error('this page has not such id');
      }
      this.el = d3.select(this.$el);
    } else {
      this.el = d3.select(el);
    }

    this.options = options;

    // data 必须包含 vertexes 以及 edges 字段
    var data = options.data;
    if (!data.vertexes || !data.edges) throw new Error('data must have vertexes and edges properties');

    // 原始数据，使用 JSON 的两个方法转换，完全克隆对象，并且不再是同一个引用地址，消除副作用
    this.rawData = JSON.parse(JSON.stringify(data));

    this.adjList = [];
    this.vertexesMap = [];
    this.edgeTo = [];
    this.marker = [];
    this.symbol = d3.symbol();
  }

  render () {
    this.preprocessChart()
      .preprocessData()
      .draw()
      .bindEvents();
  }

  /* 关于绘图 */
  preprocessChart () {
    this.el.selectAll('*').remove();
    this.svg = this.el.append('svg');

    this.svg.attr('width', this.options.width)
      .attr('height', this.options.height);

    this.chartGroup = this.svg.append('g')
      .classed('force', true);
    
    this.chartGroup.append('g')
      .classed('edges', true);
    
    this.chartGroup.append('g')
      .classed('vertexes', true);
    
    this.chartGroup.append('defs');

    return this;
  }
  draw() {
    this.addVertexes()
      .addEdges();
    
    return this;
  }
  // 顶点
  addVertexes() {
    this.chartGroup.select('.vertexes').selectAll('*').remove();

    // 增加节点 group
    this.nodeEnter = this.chartGroup.select('.vertexes').selectAll('g')
      .data(this.vertexes)
      .enter()
      .append('g')
      .attr('data-id', (d) => d._id)
      // .classed('vertex', true)
      .attr('type', (d) => d.type);

    this.addVertex()    // 增加节点 circle
      .addVertexName()  // 增加节点名称
      .addIcon()        // 增加节点 icon

    return this;
  }
  addVertex() {
    this.nodeEnter.append('g')
      .classed('vertex', 'true')
      .append('path')
      .attr('d', (d) => {
        let type = this.getShape(d);
        type = 'symbol' + type[0].toUpperCase() + type.slice(1);
        let size = this.getRadius(d) * this.getRadius(d) * Math.PI;
        let _d3 = d3; // 直接使用 d3[type] 报错
        return this.symbol.size(size).type(_d3[type])();
      })
      .classed('circle', true)
      .attr('fill', (d) => this.getVertexColor(d))
      .attr('stroke', (d) => this.getVertexStrokeColor(d))
      .attr('stroke-width', (d) => this.getVertexStrokeWidth(d))

    return this;
  }
  addVertexName() {
    this.nodeEnter.append('text')
      .attr('class', 'vertex-name')
      .style('text-anchor', 'middle')
      .style('dominant-baseline', 'baseline')
      .each(this.setVertexNamePos.bind(this))

    return this
  }
  setVertexNamePos(d, i, g) {
    if (!d.name) return;

    var thisText = d3.select(g[i]);
    thisText.selectAll('*').remove();

    var textStack = this.getTextStack(d) || [];
    textStack.forEach((v) => {
      thisText.append('tspan').text(v.name)
        .attr('x', v.dx)
        .attr('y', v.dy)
        .style('font-size', this.options.vertexFontSize)
    });
    // add type
    // this.typeNameMap = {
    //   'Person': '人',
    //   'Company': '公司'
    // }
    // this.typeColorMap = {
    //   'Person': 'red',
    //   'Company': 'blue'
    // }
    // thisText.append('tspan')
    //   .text(d => `[${this.typeNameMap[d._type]}]`)
    //   .attr('fill', d => this.typeColorMap[d._type])
    //   .style('font-size', this.options.vertexFontSize);
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
        dy: (j++ * lineHeight) + y
      });
      name = name.slice(lineNum);
    }
    textStack.push({
      name: name.slice(0),
      dx: 0,
      dy: (j++ * lineHeight) + y
    });

    return textStack;
  }
  textInVertex(d) {
    let radius = this.getRadius(d);
    let name = d.name;
    let fontSize = this.options.vertexFontSize;
    let lineHeight = fontSize + 2;

    let lineNum = Math.floor(Math.sqrt(2) * radius / fontSize); // 每一行的字数
    let maxLine = Math.floor(Math.sqrt(2) * radius / lineHeight); // 最大多少行
    let rowNum = Math.ceil(name.length / lineNum); // 有多少行
    rowNum = rowNum > maxLine ? maxLine : rowNum;

    if (lineNum < 2) throw new Error('你的顶点太小了，不适合放置那么大的文字');

    let dY = -lineHeight * (rowNum - 2) / 2;
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
  addIcon() {
    this.nodeEnter.selectAll('.vertex').append('image').each((d, i, g) => {
      let r = this.getRadius(d);
      d3.select(g[i]).attr('xlink:href', this.getIcon(d))
        .classed('icon', true)
        .attr('width', r * 2)
        .attr('height', r * 2)
        .attr('x', - r)
        .attr('y', - r)
    })
  }
  // 边
  addEdges() {
    this.chartGroup.select('.edges').selectAll('*').remove();
    this.linkEnter = this.chartGroup.select('.edges').selectAll('g')
      .data(this.edges)
      .enter()
      .append('g')
      .classed('edge', true)
      .attr('data-id', (d) => d._id)
      .attr('type', (d) => d.type)

    this.addPath()    // 增加边路径
      .addEdgeLabel() // 增加边 label
      .addArrow()

    return this;
  }
  addPath() {
    this.linkEnter.append('path')
      .classed('edge-path', true)
      .attr('fill', 'none')
      .attr('stroke', (d) => this.getEdgeColor(d))
      .attr('id', (d) => d._id.replace('/', '_'))

    // 增加反向路径, 用于旋转 label
    this.chartGroup.select('defs').selectAll('.reverse-path')
      .data(this.edges)
      .enter()
      .append('path')
      .attr('id', function (d) {
        return d._id.replace('/', '_') + '_reverse'
      })

    return this;
  }
  addEdgeLabel() {
    this.linkEnter.append('text')
      .classed('edge-label', true)
      .append('textPath')
      .attr('xlink:href', (d) => {
        return '#' + d._id
      })
      .attr('startOffset', '50%')
      .attr('text-anchor', 'middle')
      .text((d) => {
        return d.label || ''
      })
      .style('font-size', this.options.edgeFontSize)
    
    return this;
  }
  addArrow() {
    this.chartGroup.select('defs')
      .selectAll('.arrow-marker')
      .data(this.edges)
      .enter()
      .append('marker')
      .attr('id', (d) => 'arrow_' + d._id.replace('/', '_'))
      .classed('arrow-marker', true)
      .append('path')

    this.setArrowStyle();

    this.linkEnter.selectAll('.edge-path').attr('marker-end', (d) => this.getArrowUrl(d));

    return this;
  }
  // 缩放控件
  addScaleBar() {
    const { scaleExtent } = this.options;
    let scaleBar = Object.assign({}, {
      right: '5%',
      top: '',
      bottom: '5%',
      left: '',
      type: 'v',
      step: 0.5
    }, this.options.scaleBar);
    const { bottom, top, left, right, type } = scaleBar;
    let str = `<span id="reduce">-</span>
              <input type="range" id="scale" name="scaleRange"
                      min="${scaleExtent[0]}" max="${scaleExtent[1]}" value="1" step="any">
              <span id="enlarge">+</span>`;
    
    let chartScale = this.el.style('position', 'relative')
      .append('div')
      .html(str)
      .style('position', 'absolute')
      .style('bottom', bottom)
      .style('right', right)
      .style('top', top)
      .style('left', left)

    chartScale.selectAll('span')
      .style('vertical-align', 'middle')
      .style('display', 'inline-block')
      .style('width', '16px')
      .style('height', '16px')
      .style('color', '#fff')
      .style('background-color', '#C3CACF')
      .style('text-align', 'center')
      .style('line-height', '12px')
      .style('cursor', 'pointer')
      .style('user-select', 'none')

    chartScale.select('#scale')
      .style('vertical-align', 'middle')
      .style('height', '16px')

    if (type === 'v') {
      chartScale.selectAll('span')
        .style('transform', 'rotate(90deg)')

      chartScale
        .style('transform', 'rotate(-90deg)')
    }
    this.bindRangeEvent();
  }

  /* 关于样式的获取 */
  // 顶点样式
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
  getIcon(d) {
    return this.options.iconPath ? `${this.options.iconPath}/${d.type.toLowerCase()}.svg ` : '';
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
    return `url("#arrow_${d._id.replace('/', '_')}")`;
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
        return '#fff'
      case 'dark':
        return '#252A39'
      default:
        return '#fff'
    }
  }

  /* 关于样式的改变 */
  resetStyle() {
    this.setVertexStyle()
      .setEdgeStyle()
      .setBgColor()
  }
  setVertexStyle() {
    this.nodeEnter.selectAll('.circle')
      // .attr('d', (d) => {
      //   let type = this.getShape(d)
      //   type = 'symbol' + type[0].toUpperCase() + type.slice(1)
      //   let size = this.getRadius(d) * this.getRadius(d) * Math.PI

      //   let _d3 = d3 // 直接使用 d3[type] 报错
      //   return this.symbol.size(size).type(_d3[type])()
      // })
      .attr('fill', (d) => this.getVertexColor(d))
      .attr('stroke', (d) => this.getVertexStrokeColor(d))
      .attr('stroke-width', (d) => this.getVertexStrokeWidth(d))
    
    this.nodeEnter.selectAll('image')
      .attr('xlink:href', (d) => this.getIcon(d))

    this.nodeEnter.selectAll('text.vertex-name')
      .attr('y', (d) => this.getRadius(d) + 5)
      .style('fill', (d) => this.getVertexNameColor(d))
      // .each(this.setVertexNamePos.bind(this))
    
    return this;
  }
  setEdgeStyle() {
    // 边
    this.linkEnter.selectAll('.edge-path')
      .attr('stroke', (d) => this.getEdgeColor(d))
      .attr('stroke-width', (d) => this.getEdgeWidth(d));

    // 箭头
    this.setArrowStyle();

    // 边文字
    this.linkEnter.selectAll('.edge-label')
      .style('fill', (d) => this.getEdgeLableColor(d));
    
    return this;
  }
  setArrowStyle() {
    this.chartGroup.selectAll('.arrow-marker')
      .each((d, i, g) => {
        let thisArrow = d3.select(g[i]);
        const { path = 'M0,0 L10,5 L0,10 z', arrowWidth = 10, arrowHeight = 10, refx = 0, color = '#e3e3e3' } = this.getArrowConfig(d);

        thisArrow.attr('refX', this.getRadius(d.target) + arrowWidth + refx)
          .attr('refY', arrowHeight / 2)
          .attr('markerUnits', 'userSpaceOnUse')
          .attr('markerWidth', arrowWidth)
          .attr('markerHeight', arrowHeight)
          .attr('orient', 'auto')
          .select('path')
          .attr('d', path)
          .attr("fill", color)
      })
  }
  setBgColor() {
    this.svg.style('background', this.getBgColor());
    return this;
  }
  // 改变主题
  changeTheme(theme) {
    this.theme = theme
    this.resetStyle()
    return this
  }
  
  
  /* 关于数据的处理 */
  preprocessData () {
    let data = JSON.parse(JSON.stringify(this.rawData));

    // 当前绘图数据，用于过滤时不影响原始数据
    this.data = data;
    // 顶点和边的数据
    this.vertexes = data.vertexes;
    this.edges = data.edges;
    return this;
  }
  changeRawData (data) {
    if (!data.vertexes || !data.edges) throw new error('data must have vertexes and edges properties');

    this.rawData = JSON.parse(JSON.stringify(data));
    this.preprocessData();

    return this;
  }
  filterVertex (filter, isRaw) {
    if (typeof filter !== 'function') throw new Error('filters need a function as first parameter');

    let vertexIds = [];

    let vertexes = isRaw ? this.data.vertexes : this.vertexes;
    let edges = isRaw ? this.data.edges : this.edges;

    // 筛选掉 filter 返回为 false 的顶点
    this.vertexes = vertexes.filter((...args) => {
      console.log(...args);
      // 如果 filter 执行返回为 true，则保留
      if (filter(...args)) {
        vertexIds.push(d._id);
        return true;
      }
      return false;
    });

    // 筛选掉被筛选节点的所有关系边
    this.edges = edges.filter((d) => {
      if (vertexIds.includes(d._from) || vertexIds.includes(d._to)) {
        return true;
      }
      return false;
    });

    return this;
  }
  filterEdge (filter, isRaw) {
    if (typeof filter !== 'function') throw new Error('filters need a function as first parameter');

    let vertexIds = [];

    let vertexes = isRaw ? this.data.vertexes : this.vertexes;
    let edges = isRaw ? this.data.edges : this.edges;

    // 筛选掉 filter 返回为 false 的 边
    this.edges = edges.filter((...args) => {
      if (filter(...args)) {
        vertexIds.push(d._from);
        vertexIds.push(d._to);
        return true;
      }
      return false;
    });

    // 去重
    vertexIds = Array.from(new Set(vertexIds));

    // 筛选掉没有边连接的顶点
    this.vertexes = vertexes.filter((d) => {
      if (vertexIds.includes(d._id)) {
        return true;
      }
      return false;
    })

    return this;
  }

  /* 关于事件的绑定 */
  bindEvents () {
    const { scalable, scaleExtent, draggable } = this.options;

    scalable ? this.addZoom(scaleExtent) : null;
    draggable ? this.addDrag() : null;
    this.addClick();
    // this.addHover();

    return this;
  }
  bindRightClick() {
    this.nodeEnter.selectAll('.vertex').on('contextmenu', () => {
      d3.event.preventDefault();
    });

    this.nodeEnter.selectAll('.vertex').on('mouseup', (...args) => {
      console.log(args);
      if (d3.event.button === 2) {
        // eventProxy.emit('menu.vertex');
      }
    });
  }
  // 缩放
  addZoom(scale) {
    this.zoom = d3.zoom()
      .scaleExtent(scale)
      .on('zoom', this.onZoom.bind(this));
    
    this.svg.call(this.zoom);

    this.svg.on('dblclick.zoom', null);
    this.options.scaleBar ? this.addScaleBar() : null;
    return this;
  }
  onZoom() {
    this.chartGroup
      .attr('transform', d3.event.transform);
    
    if (d3.event.transform.k < 0.8) {
      this.nodeEnter.selectAll('.vertex-name').style('display', 'none');
      this.linkEnter.selectAll('.edge-label').style('display', 'none');
    } else {
      this.nodeEnter.selectAll('.vertex-name').style('display', 'block');
      this.linkEnter.selectAll('.edge-label').style('display', 'block');
    }

    let range = document.getElementById('scale');
    if (range) {
      range.value = d3.event.transform.k;
    }
  }
  bindRangeEvent() {
    let range = document.getElementById('scale');
    let enlarge = document.getElementById('enlarge');
    let reduce = document.getElementById('reduce');
    let value = 1;
    let { step = 0.5 } = this.options.scaleBar;

    range.addEventListener('change', (e) => {
      if(value===e.target.value) return; //防止重复触发
      value = e.target.value; //记录当前值

      this.svg.call(this.zoom.scaleTo, value);
    })
    // 鼠标操作相关事件处理
    range.addEventListener("mousedown", () => {
      document.addEventListener("mouseup", mouseup);
      range.addEventListener("mousemove", mousemove);
    });
    function mouseup(){
      document.removeEventListener("mouseup",mouseup);
      range.removeEventListener("mousemove",mousemove);
    }
    function mousemove(){
      //主动触发Change事件
      var e = document.createEvent("Event");
      e.initEvent("change", false, true);
      range.dispatchEvent(e);
    }
    reduce.addEventListener('click', (ev) => {
      range.value -= step;
      let e = document.createEvent("Event");
      e.initEvent("change", false, true);
      range.dispatchEvent(e);
    })
    enlarge.addEventListener('click', (ev) => {
      range.value = +range.value + step;
      let e = document.createEvent("Event");
      e.initEvent("change", false, true);
      range.dispatchEvent(e);
    })
  }
  // 拖拽
  addDrag() {
    let dragHandler = d3.drag()
      .on('start', this.onDragStart.bind(this))
      .on('drag', this.onDrag.bind(this))
      .on('end', this.onDragEnd.bind(this))
    this.nodeEnter.selectAll('.vertex').call(dragHandler)

    return this
  }
  onDragStart(d) {
    // if (!d3.event.active) this.simulation.alphaTarget(0.3).restart()
    d.fx = d.x
    d.fy = d.y
  }
  onDrag(d) {
    d.fx = d3.event.x
    d.fy = d3.event.y
  }
  onDragEnd(d) {
    // if (!d3.event.active) this.simulation.alphaTarget(0)
    d.fx = null
    d.fy = null
  }
  // click
  addClick() {
    this.nodeEnter.selectAll('.vertex').on('click', this.onVertexClick.bind(this))
    this.linkEnter.selectAll('edge-path').on('click', this.onEdgeClick.bind(this))
  }
  onVertexClick(d) {
    console.log('vertex clicked')
    // let { vertexIds, edgeIds } = this.getHighlightIds(d)
    // this.highlightVertex(vertexIds)
    //   .highlightEdge(edgeIds)
    // this.resetStyle()
    // eventProxy.emit('click.vertex', d);
  }
  onEdgeClick(d) {
    console.log('edge clicked')
    // eventProxy.emit('click.vertex', d);
  }
}