/**
 * BaseGraph: 关系型图谱的基类
 *
 * @parameter
 *   el [ HTMLElement | String ] 容器元素或者 ID
 * 
 * @constructor
 *   el: 容器, HTML 元素
 *   $el: 容器, d3 Selection 元素
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
 *   drawVertexes(): 绘制节点 
 *   drawEdges(): 绘制边
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
      this.el = document.getElementById(el);
      if (!this.el) {
        throw new Error('this page has not such id');
      }
    } else {
      this.el = el;
    }
    this.$el = d3.select(this.el);

    let containerInfo = this.el.getBoundingClientRect();

    options.width = containerInfo.width;
    options.height = containerInfo.height;
    console.log(options.width, options.height);

    this.options = options;

    // data 必须包含 vertexes 以及 edges 字段
    let data = options.data;
    if (!data.vertexes || !data.edges) throw new Error('data must have vertexes and edges properties');

    // 原始数据，使用 JSON 的两个方法转换，完全克隆对象，并且不再是同一个引用地址，消除副作用
    this.rawData = JSON.parse(JSON.stringify(data));

    this.idMap = [];

    this.adjList = [];
    this.vertexesMap = [];
    this.edgeTo = [];
    this.marker = [];
    this.symbol = d3.symbol();
    this.theme = 'light'
  }

  init() {
    this.preprocessChart()
      .preprocessData('init')
      .draw()
      .bindEvents();
  }

  reRender () {
    this.draw()
      .bindEvents();
  }

  /* 关于绘图 */
  preprocessChart () {
    this.$el.selectAll('svg').remove();
    this.svg = this.$el.append('svg');

    this.svg.attr('width', this.options.width)
      .attr('height', this.options.height);

    this.chartGroup = this.svg.append('g')
      .classed('chart', true);
    
    this.chartGroup.append('g')
      .classed('edges', true);
    
    this.chartGroup.append('g')
      .classed('vertexes', true);
    
    this.chartGroup.append('defs');

    return this;
  }
  draw() {
    this.drawVertexes()
      .drawEdges();
    
    return this;
  }
  // 顶点
  drawVertexes() {
    this.chartGroup.select('.vertexes').selectAll('*').remove();

    // 增加节点 group
    this.nodeEnter = this.chartGroup.select('.vertexes').selectAll('g')
      .data(this.vertexes)
      .enter()
      .append('g')
      .attr('data-id', (d) => d._id)
      // .classed('vertex', true)
      .attr('type', (d) => d.type);

    this.drawVertex()    // 增加节点 circle
      .drawVertexName()  // 增加节点名称
      .drawIcon()        // 增加节点 icon

    return this;
  }
  drawVertex() {
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
  drawVertexName() {
    this.nodeEnter.append('text')
      .attr('class', 'vertex-name')
      .style('text-anchor', 'middle')
      .style('dominant-baseline', 'baseline')
      .style('user-select', 'none')
      .each(this.setVertexNamePos.bind(this))
    if (this.getTransform().k < 0.8) {
      this.nodeEnter.selectAll('.vertex-name').style('opacity', '0');
    } else {
      this.nodeEnter.selectAll('.vertex-name').style('opacity', '1');
    }
    return this
  }
  setVertexNamePos(d, i, g) {
    if (!d.name) return;

    let thisText = d3.select(g[i]);
    thisText.selectAll('*').remove();

    let textStack = this.getTextStack(d) || [];
    textStack.forEach((v) => {
      thisText.append('tspan').text(v.name)
        .attr('x', v.dx)
        .attr('y', v.dy)
        .style('font-size', this.options.vertexFontSize)
    });
    this.drawType(thisText);
  }
  drawType(text) {
    // add type
    this.typeNameMap = {
      'person': '人',
      'company': '公司'
    }
    this.typeColorMap = {
      'person': 'red',
      'company': 'blue'
    }
    
    text.append('tspan')
      .text(d => `[${this.typeNameMap[d.type]}]`)
      .attr('fill', d => this.typeColorMap[d.type])
      .style('font-size', this.options.vertexFontSize);
  }
  drawIcon() {
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
  drawEdges() {
    this.chartGroup.select('.edges').selectAll('*').remove();
    this.linkEnter = this.chartGroup.select('.edges').selectAll('g')
      .data(this.edges)
      .enter()
      .append('g')
      .classed('edge', true)
      .attr('data-id', (d) => d._id)
      .attr('type', (d) => d.type)

    this.drawPath()    // 增加边路径
      .drawEdgeLabel() // 增加边 label
      .drawArrow()

    return this;
  }
  drawPath() {
    this.linkEnter.append('path')
      .classed('edge-path', true)
      .attr('fill', 'none')
      .attr('stroke', (d) => this.getEdgeColor(d))
      .attr('id', (d) => d._id)

    this.chartGroup.select('defs').selectAll('*').remove();
    
    // 增加反向路径, 用于旋转 label
    this.chartGroup.select('defs').selectAll('.reverse-path')
      .data(this.edges)
      .enter()
      .append('path')
      .attr('id', function (d) {
        return d._id + '_reverse'
      })

    return this;
  }
  drawEdgeLabel() {
    this.linkEnter.append('text')
      .classed('edge-label', true)
      .append('textPath')
      .attr('xlink:href', (d) => {
        return '#' + d._id
      })
      .attr('startOffset', '50%')
      .attr('text-anchor', 'middle')
      .style('user-select', 'none')
      .text((d) => {
        return d.label || ''
      })
      .style('font-size', this.options.edgeFontSize)
    
    if (this.getTransform().k < 0.8) {
      this.linkEnter.selectAll('.edge-label').style('opacity', '0');
    } else {
      this.linkEnter.selectAll('.edge-label').style('opacity', '1');
    }
    return this;
  }
  drawArrow() {
    this.chartGroup.select('defs')
      .selectAll('.arrow-marker')
      .data(this.edges)
      .enter()
      .append('marker')
      .attr('id', (d) => 'arrow_' + d._id)
      .classed('arrow-marker', true)
      .append('path')
    
    this.chartGroup.select('defs')
      .append('marker')
      .datum({
        _id: '',
        type: '',
        state: 'normal',
        _flag: true
      })
      .attr('id', 'arrow_default')
      .classed('arrow-marker', true)
      .append('path')
    
    this.setArrowStyle();

    this.linkEnter.selectAll('.edge-path').attr('marker-end', (d) => this.getArrowUrl(d));

    return this;
  }
  // 缩放控件
  drawScaleBar() {
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
    
    let chartScale = this.$el.style('position', 'relative')
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
  getIcon(d) {
    return this.options.iconPath && d.type ? `${this.options.iconPath}/${d.type.toLowerCase()}_${d.state}.svg ` : '';
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

        if (d._flag) {
          thisArrow.attr('refX', arrowWidth + refx)
        } else {
          thisArrow.attr('refX', this.getRadius(d.target) + arrowWidth + refx)
        }
        thisArrow
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
    this.theme = theme;
    this.resetStyle();
    return this;
  }
  // 高亮顶点和边
  highlightVertex(ids) {
    this.nodeEnter.selectAll('.vertex .circle')
      .each((d, i, g) => {
        if (ids.includes(d._id)) {
          d.state = 'highlight'
        } else {
          d.state = 'grey'
        }
      })
    
    return this;
  }
  highlightEdge(ids) {
    this.linkEnter.selectAll('.edge-path')
      .each((d, i, g) => {
        if (ids.includes(d._id)) {
          d.state = 'highlight'
        } else {
          d.state = 'grey'
        }
      })
    
    return this;
  }
  
/* 关于数据的处理 */
  layout() {
    // 提供复写
  }
  preprocessData(type) {
    if (type === 'init') {
      let data = JSON.parse(JSON.stringify(this.rawData));

      // 当前绘图数据，用于过滤时不影响原始数据
      this.data = data;
      // 顶点和边的数据
      this.vertexes = JSON.parse(JSON.stringify(data.vertexes));
      this.edges = JSON.parse(JSON.stringify(data.edges));
    }

    this.vertexes.forEach((v) => {
      v.type = v.type;
      v.state = v.state || 'normal';
      this.vertexesMap.push(v._id);
    })
    this.edges.forEach((e) => {
      let from = this.vertexesMap.indexOf(e._from);
      let to = this.vertexesMap.indexOf(e._to);
      e.source = e._from;
      e.target = e._to;
      e.state = e.state || 'normal';
      this.adjList[from] = this.adjList[from] || {};
      this.adjList[from][to] = this.adjList[from][to] || [];
      this.adjList[from][to].push(e._id);
    })
    this.setEdgeIndex();
    this.layout();

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
  // 改变原始数据
  changeRawData(data) {
    if (!data.vertexes || !data.edges) throw new error('data must have vertexes and edges properties');

    this.rawData = JSON.parse(JSON.stringify(data));

    return this;
  }
  // 过滤与重置
  filterVertex(filter, isRaw) {
    if (typeof filter !== 'function') throw new Error('filters need a function as first parameter');

    let vertexIds = [];
    let filterIds = [];

    let vertexes = isRaw ? this.data.vertexes : this.vertexes;
    let edges = isRaw ? this.data.edges : this.edges;

    // 筛选掉 filter 返回为 false 的顶点
    vertexes.forEach((d, i, g) => {
      // 如果 filter 执行返回为 true，则保留
      if (filter(d, i, g)) {
        console.log(true);
        filterIds.push(d._id);
      }
    });

    // 保留 filter 返回 true 相连的所有边
    this.edges = edges.filter((d) => {
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
    this.vertexes = vertexes.filter((d) => {
      if (vertexIds.includes(d._id)) {
        return true;
      }
      return false;
    })

    this.preprocessData();

    return this;
  }
  filterEdge(filter, isRaw) {
    if (typeof filter !== 'function') throw new Error('filters need a function as first parameter');

    let vertexIds = [];

    let vertexes = isRaw ? this.data.vertexes : this.vertexes;
    let edges = isRaw ? this.data.edges : this.edges;

    // 筛选掉 filter 返回为 false 的边
    this.edges = edges.filter((d, i, g) => {
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
    this.vertexes = vertexes.filter((d) => {
      if (vertexIds.includes(d._id)) {
        return true;
      }
      return false;
    })

    this.preprocessData();

    return this;
  }
  resetData() {
    this.vertexes = this.data.vertexes;
    this.edges = this.data.edges;

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
    })
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
    })
    return result;
  }
  // 获取节点或边的数据
  getVertexById(id) {
    let vertexArr = this.vertexes.filter(v => {
      return v._id === id;
    })
    return vertexArr[0];
  }
  getEdgeById(id) {
    let edgeArr = this.edges.filter(e => {
      return e._id === id;
    })
    return edgeArr[0];
  }
  // 改变节点和边的数据
  changeVertexData(data, cb) {
    let defaultData = {
      type: '',
      name: '',
      level: ''
    };
    data = Object.assign({}, defaultData, data);
    this.data.vertexes.forEach(item => {
      if (item._id === data._id) {
        Object.keys(data).forEach(key => {
          item[key] = data[key];
        })
      }
    });
    this.vertexes.forEach(item => {
      if (item._id === data._id) {
        Object.keys(data).forEach(key => {
          item[key] = data[key];
        })
      }
    });
    this.changeRawData(this.data);
    cb && cb();
  }
  changeEdgeData(data, cb) {
    let defaultData = {
      type: '',
      label: ''
    };
    data = Object.assign({}, defaultData, data);
    this.data.edges.forEach(item => {
      if (item._id === data._id) {
        Object.keys(data).forEach(key => {
          item[key] = data[key];
        })
      }
    })
    this.edges.forEach(item => {
      if (item._id === data._id) {
        Object.keys(data).forEach(key => {
          item[key] = data[key];
        })
      }
    })
    this.changeRawData(this.data);
    cb && cb();
  }
  // 增加节点和边数据
  addVertex(x, y, cb) {
    let vertex = {
      _id: this.newId(),
      type: '',
      name: '',
      level: ''
    }
    this.rawData.vertexes.push(vertex)
    // 抵消偏移和缩放的影响
    let { x: curX, y: curY, k: curK } = this.getTransform();
    x = (x - curX) / curK;
    y = (y - curY) / curK;

    vertex.x = x;
    vertex.y = y;
    this.data.vertexes.push(vertex);
    this.vertexes.push(vertex);
    this.preprocessData();

    cb && cb();

    return this;
  }
  addEdge(from, to, cb) {
    let edge = {
      _id: this.newId(),
      type: '',
      label: '',
      _from: from,
      _to: to
    }
    this.rawData.edges.push(edge);

    this.data.edges.push(edge);
    this.edges.push(edge);
    this.preprocessData();

    cb && cb();

    return this;
  }
  // 删除节点和边数据
  removeVertex(id, cb) {
    // 将 data 中的数据和单独的节点和边数据分开，防止过滤的时候产生错误
    this.rawData.vertexes = this.rawData.vertexes.filter(v => {
      return v._id !== id;
    });
    this.data.vertexes = this.data.vertexes.filter(v => {
      return v._id !== id;
    });
    this.vertexes = this.vertexes.filter(v => {
      return v._id !== id;
    });
    this.rawData.edges = this.rawData.edges.filter(e => {
      return e._from !== id && e._to !== id;
    });
    this.data.edges = this.data.edges.filter(e => {
      return e._from !== id && e._to !== id;
    });
    this.edges = this.edges.filter(e => {
      return e._from !== id && e._to !== id;
    });
    this.preprocessData();
    cb && cb();

    return this;
  }
  removeEdge(id, cb) {
    // 将 data 中的数据和单独的节点和边数据分开，防止过滤的时候产生错误
    this.rawData.edges = this.rawData.edges.filter(e => {
      return e._id !== id;
    });
    this.data.edges = this.data.edges.filter(e => {
      return e._id !== id;
    });
    this.edges = this.edges.filter(e => {
      return e._id !== id;
    });
    this.preprocessData();
    cb && cb();

    return this;
  }

  /* 关于事件的绑定 */
  bindEvents () {
    const { scalable, scaleExtent, draggable } = this.options;

    scalable ? this.addZoom(scaleExtent) : null;
    draggable ? this.addDrag() : null;
    this.addClick();
    this.addHover();
    // this.bindRightClick();
    // this.bindLineWith();
    return this;
  }
  bindRightClick(cb) {
    this.$el.on('contextmenu', () => {
      d3.event.preventDefault();
    });

    this.nodeEnter.selectAll('.vertex').on('mouseup.menu', (...args) => {
      d3.event.stopPropagation();
      console.log(args);
      if (d3.event.button === 2) {
        cb && cb(...args);
      }
    });
    this.linkEnter.on('mouseup.menu', (...args) => {
      d3.event.stopPropagation();
      console.log(args);
      if (d3.event.button === 2) {
        cb && cb(...args);
      }
    });
    this.svg.on('mouseup.menu', (...args) => {
      console.log(args);
      if (d3.event.button === 2) {
        cb && cb(...args);
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
      this.nodeEnter.selectAll('.vertex-name').style('opacity', '0');
      this.linkEnter.selectAll('.edge-label').style('opacity', '0');
    } else {
      this.nodeEnter.selectAll('.vertex-name').style('opacity', '1');
      this.linkEnter.selectAll('.edge-label').style('opacity', '1');
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
      let e = document.createEvent("Event");
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
    this.drag = d3.drag()
      .on('start', this.onDragStart.bind(this))
      .on('drag', this.onDrag.bind(this))
      .on('end', this.onDragEnd.bind(this))
    this.nodeEnter.selectAll('.vertex').call(this.drag)

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
    this.nodeEnter.selectAll('.vertex').on('click', this.onVertexClick.bind(this));
    this.linkEnter.on('click', this.onEdgeClick.bind(this));
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

  // hover
  addHover() {
    this.nodeEnter.selectAll('.vertex').on('mouseenter', this.onVertexHover.bind(this))
    this.nodeEnter.selectAll('.vertex').on('mouseleave', this.onVertexHoverout.bind(this))

    this.linkEnter.on('mouseenter', this.onEdgeHover.bind(this))
    this.linkEnter.on('mouseleave', this.onEdgeHoverout.bind(this))
  }
  onVertexHover(d) {
    console.log('vertex hover');
    
  }
  onVertexHoverout(d) {
    console.log('vertex hoverout');
  }
  onEdgeHover(d) {
    console.log('edge hover');
  }
  onEdgeHoverout(d) {
    console.log('edge hoverout');
  }
  bindLineWith(cb) {
    this.nodeEnter.selectAll('.vertex')
      .on('mouseup.line', (d) => {
        d3.event.stopPropagation();
        if (this.newLink) {
          this.appendNewLink(d, cb);
        }
      })
      .on('mouseenter.line', (d, i, g) => {
        let el = g[i];
        d3.select(el).append('rect')
          .datum(d)
          .attr('width', 6)
          .attr('height', 6)
          .attr('x', -3)
          .attr('y', -3)
          .attr('fill', 'transparent')
          .style('cursor', 'crosshair')
          .on('mousedown.line', (d) => {
            d3.event.stopPropagation();
            this.addNewLink(d);
          })
          .on('mouseup.line', (d) => {
            d3.event.stopPropagation();
            if (this.newLink) {
              let id = this.newLink.datum()._from;
              if (id === d._id) {
                this.removeNewLink();
              } else {
                this.appendNewLink(d, cb);
              }
            }
          })
      })
      .on('mouseleave.line', (d, i, g) => {
        let el = g[i];
        d3.select(el).select('rect').remove();
      })
    
    this.linkEnter.on('mouseup.line', () => {
      if (this.newLink) {
        this.removeNewLink();
      }
    });
    
    this.$el.on('mousemove.line', () => {
      if (this.newLink) {
        this.newLink
            .call(this.updateNewLink.bind(this), this.svg.node());
      }
    })
    .on('mouseup.line', () => {
      if (this.newLink) {
        this.removeNewLink();
      }
    })
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
    if ((scale - curK) > 0 && curK === scaleExtent[1] || (scale - curK) < 0 && curK === scaleExtent[0]) return;

    let nextK = scale;
    
    // 如果当前缩放处于最大或最小，那么直接返回
    // 对下一个缩放进行范围限制
    nextK = nextK < scaleExtent[0] ? scaleExtent[0] : (nextK > scaleExtent[1] ? scaleExtent[1] : nextK);

    // 中心位置
    let containerRect = this.el.getBoundingClientRect();
    let centerX = containerRect.width / 2;
    let centerY = containerRect.height / 2;
    let curX = transform.x;
    let curY = transform.y;

    // 计算缩放后的位移：(centerX - nextX) / nextK = (centerX - curX) / curK
    // 使得缩放始终以当前位移为中心进行
    let nextX = centerX - (centerX - curX) / curK * nextK;
    let nextY = centerY - (centerY - curY) / curK * nextK;

    // 仍然要挂载到 svg 上
    this.transformTo(d3.zoomIdentity.translate(nextX, nextY).scale(nextK));
    
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
        edgeIds: []
      };
    }
    path.forEach((v, i) => {
      vertexIds.push(vertexesMap[v]);
      if (i > 0) {
        edgeIds.push(adjList[v][path[i - 1]][0]); // 如果两点之间存在多条边，返回的是第一条边
      }
    })
    return {
      vertexIds,
      edgeIds
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

        Object.keys(this.adjList[item]).forEach(k => {
          let i = +k;
          if (!this.marker[i]) {
            this.edgeTo[i] = item;
            queue.push(i);
            this.marker[i] = true;
          }
        })
      }
    }
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
  getHighlightIds(d) {
    return this.radiationVertex(d);
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
    })
    return {
      vertexIds,
      edgeIds
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
    })
    vertexIds = Array.from(new Set(vertexIds));
    return {
      vertexIds,
      edgeIds
    };
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
      let  angle = Math.atan2(y2 - y1, x2 - x1);
      x2 = x2 - Math.cos(angle) * 10;
      y2 = y2 - Math.sin(angle) * 10;
      
      return 'M' + x1 + ',' + y1 + 'A0,0 0 0,0 ' + x2 + ',' + y2;
    })
  }
  removeNewLink() {
    this.newLink.remove();
    this.newLink = null;
  }
  appendNewLink(d, cb) {
    let to = d._id;
    let from = this.newLink.datum()._from;
    this.addEdge(from, to);
    this.removeNewLink();
    cb && cb();
  }
  addNewLink(d) {
    // 增加新的连线
    this.newLink = this.chartGroup
      .append('path')
      .datum({
        _from: d._id,
        source: d
      })
      .attr('stroke', this.getEdgeColor(d))
      .attr('stroke-width', this.getEdgeWidth(d))
      .attr('marker-end', 'url("#arrow_default")');
  }
  // 获取 id
  newId() {
    let box = 'qwertyuiopasdfghjklzxcvbnm';
    let id = 'xxxxxxxxxxxxxxxx'.replace(/x/g, function (c) {
      let r = Math.floor(Math.random() * 26);
      return box[r];
    });

    while (this.idMap.includes(id)) {
      id = 'xxxxxxxxxxxxxxxx'.replace(/x/g, function (c) {
        let r = Math.floor(Math.random() * 26);
        return box[r];
      });
    }
    this.idMap.push(id);
    return id;
  }
}