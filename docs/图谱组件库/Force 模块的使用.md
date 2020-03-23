# Force 模块的使用

## 基本用法

### 配置参数

在初始化 Force 实例的时候，传入一个 options 配置对象

必须：

- data：图谱数据 {vertexes: {...}, edges: {...}}
- el：图谱容器元素

可选：

- r：统一半径，默认 20，需要注意的是，修改为多种形状后，这个半径用于计算 Symbol 中图案的 size（面积），默认为 `PI * r * r`
- distance：统一边长度，默认 250
- shape：顶点的形状，默认 circle，参考[Symbols](https://d3js.org.cn/api/d3-shape/#symbols)
- width、height：图谱宽高，默认窗口宽高
- chargeStrength：电荷强度，默认 -2500
- alphaDecay：alpha 衰减系数，默认 0.07
- vertexColor：统一顶点颜色，默认 '#e3e3e3'
- edgeColor：统一边颜色，默认 '#e3e3e3'
- iconPath：所有 icon 的公共路径，无默认值
- vertexFontSize：所有顶点文字的大小，默认 12
- edgeFontSize：所有边文字的大小，默认 12
- scalable：是否可缩放，默认 true
- scaleExtent：缩放范围，默认 [0.5, 2]，scalable 为 false 时，不起作用
- scaleBar：缩放滚动轴配置，默认 false，不显示。滚动轴的样式可自行处理
  - bottom、top、left、right：字符串
  - type：v 或者 h，垂直或者水平
  - step：数值，点击增加或减少时的缩放步长
- draggable：是否可拖拽，默认 true

### 基础数据

vertexes 包含：

- _id: string，必须是以这种形式：'type/id'，例如 'Person/aa'
- name?: string，顶点展示的名称
- radius?: number，顶点展示的半径
- color?: string，顶点展示的颜色
- state?: string 顶点的状态
- ... 其他业务逻辑数据

edges 包含：

- _id: string，必须是以这种形式：'type/id'，例如 'invest/aa'
- _from: string，边来源顶点 _id
- _to: string，边目标顶点 _id
- source?: string，预处理数据时，才把 _from 加入到 source，实际上后面是必须有的，所以需要重写 preprocessData 时特别注意不能丢失
- target?: string，预处理数据时，才把 _to 加入到 target
- label?: string 边上展示的文字
- color?: string 边展示的颜色
- state?: string 边的状态
- ... 其他业务逻辑数据

预处理数据之后增加：

vartexes:

- _type?: string，顶点类型

edges

- edgeIndex?: number，这条边在 siblingNum 中的索引
- siblingNum?: number，相连两个点相同的边的数量
- labelDirection?: number，边文字的方向
- _type?: string，边类型

### 默认样式

默认情况下，状态为 normal，主题为 light。通过重写获取样式的函数，可以实现不同状态和主题下的不同颜色，然后只需要改变状态和主题，调用重置样式的方法，就可以改变样式。主题是整个图谱的，状态是每一条边和顶点独立拥有的。

可查看点击高亮的例子。

## 继承拓展

可以将 Force 作为一个基类，通过继承基类得到基本功能，通过重写或者添加一些方法来实现更多的功能。

### 可重写方法

顶点：

- getRadius：传入顶点数据 d，返回半径数值，默认 `d.r | this.options.r`
- getVertexColor：传入顶点数据 d，返回顶点颜色字符串，默认 `d.color || this.options.vertexColor`
- getVertexNameColor：传入顶点数据，返回顶点文字颜色字符串，默认 '#000'
- getVertexStrokeColor：传入顶点数据，返回顶点描边颜色字符串，默认为 'none'
- getVertexStrokeWidth：传入顶点数据，返回顶点描边宽度数值，默认为 1
- getIcon：传入顶点数据 d，返回 icon 图标路径，默认 `this.options.iconPath ? ${this.options.iconPath}/${d._type.toLowerCase()}.svg : ''` ，可返回空字符串取消 icon
- getTextStack：传入顶点数据 d，返回 textStack 文字排列数据，[{name:...,dx:..., dy: ... }]，提供了两种排列方式
  - textInVertex：传入顶点数据 d，返回 textStack
  - textUnderVertex：传入顶点数据 d 和 行数，返回 textStack。默认
  - 使用时，重写 getTextStack 中，调用这两个方法即可
- highlightVertex：传入顶点 ids 数组，返回 this，默认只把高亮顶点 state -> highlight，非高亮 state -> normal，可对状态进行修改，还可以设置高亮类

边：

- getEdgeColor：传入边数据 d，返回边颜色字符串，默认 `d.color || this.options.edgeColor`
- getEdgeLableColor：传入边数据 d，返回边文字颜色字符串，默认 '#000'
- getEdgeWidth：传入边数据 d，返回边宽度数值，默认返回 1
- getArrowConfig：传入边数据 d，返回箭头配置对象
  - path: 箭头路径，默认 'M0,0 L10,5 L0,10 z'
  - arrowWidth: 箭头宽度，默认 10
  - arrowHeight: 箭头高度，默认 10
  - refx: 箭头偏移顶点的距离，默认 0，为紧挨着顶点
  - color: 箭头颜色，默认为边的颜色
- getArrowUrl：传入边数据 d，返回箭头URL
- getHighlightIds：获取需要高亮的顶点和边的 id，返回 {vertexIds,edgeIds}
  - 里面可修改获取高亮顶点和边 id 的方法
  - radiationVertex：放射性，传入顶点数据 d，获取以当前顶点为起点的所有边以及边连接的顶点
  - relationVertex：关联性，传入顶点数据 d，获取包含当前顶点的所有边和边连接的所有顶点，默认
- highlightEdge：传入边 ids 数组，返回 this，默认只把高亮顶点 state -> highlight，非高亮 state -> normal，可对状态进行修改，还可以设置高亮类

整体：

- shortestPath：最短路径，传入源顶点数据 source 和 目标顶点数据 target，获取到两个顶点之间最短路径上的所有边和顶点。如果其中有两点之间存在多条边，只会获取第一条边，可以修改为所有边。如果有多条最短路径，只会获取到一条，按照顶点的遍历顺序决定。
- getBgColor：获取 svg 的背景颜色，可重写通过不同主题来控制背景颜色

### 事件

- onEndRender 力图停止后触发
- onDragStart
- onDrag
- onDragEnd
- onZoom
- onVertexClick 点击顶点触发
- onEdgeClick 点击边触发
- onVertexHover 移入顶点触发
- onVertexHoverout 移出顶点触发
- onEdgeHover 移入边触发
- onEdgeHoverout 移出边触发

### 样式的修改

Force 模块样式的修改，都是由状态来驱动样式的变化，通常需要几步：

- 重写特定的样式获取方法，不同的状态返回不同的值
- 修改顶点或者边的状态
- 重置样式（调用 this.resetStyle()）

```javascript
getVertexColor(d) {
  switch (d.state) {
    case 'highlight':
      return d.color
    case 'normal':
      return this.options.vertexColor
  }
}
```

## 过滤

实例配置中（options）保留了原始数据，将绘图数据挂载到了实例上（vertexes 以及 edges）。可以通过原始数据过滤出需要的绘图数据来实现关系和实体的过滤，但是，每一次的过滤都需要重新调用 init 方法进行重新绘制，比较耗性能。

提供了：

- filterVertex：传入要过滤的顶点 id 数组
- filterEdge：传入要过滤的边点 id 数组

亦可采用 `display:none` 来隐藏顶点和边，例如：

```javascript
this.nodeEnter.style('display', (d) => {
  if (d._id === id) return 'none'
})
```

但是这种方法存在一定问题，力的仿真中仍然存在这些边和顶点。

## 实例

### 使用 icon

（1）通过传入 iconPath，来开启 icon 功能

（2）通过继承 Force 基类，重写 getIcon 方法来实现自定制

由顶点的 _type 属性来决定使用特定的 svg 文件

```javascript
getIcon(d) {
  return this.options.iconPath ? `${this.options.iconPath}/${d._type.toLowerCase()}.svg ` : ''
}
```

通过 state 状态来决定特定状态的 icon

```javascript
getIcon(d) {
  return this.options.iconPath ? `${this.options.iconPath}/${d._type.toLowerCase()}_${d.state}.svg ` : ''
}
```

### 不相同的顶点半径

（1）顶点数据中，增加 radius 属性

（2）通过继承 Force 基类，重写 getRadius 方法来实现自定制，

通过顶点 _type 设置

```javascript
getRadius (d) {
  if (d._id.includes('Person')) {
    return this.options.r * 2
  }
  return this.options.r
}
```

通过顶点状态设置

```javascript
getRadius (d) {
  switch (d.state) {
    case 'highlight':
      return this.options.r * 2
    default:
      return this.options.r
  }
}
```

### 不同形状的顶点

（1）直接通过配置 shape 属性来统一修改顶点形状

```javascript
var force = new ForceHighLightChange({
  el: ...,
  data: ...,
  shape: 'star'
})
```

（2）重写 getShape 方法来分别修改顶点形状

```javascript
getShape(d) {
  switch(d._type) {
    case 'Company':
      return 'cross'
    case 'Person':
      return 'star'
  }
}
```

### 点击高亮

默认自带点击顶点实现高亮：

（1）规定好高亮的样式

```javascript
getVertexColor(d) {
  switch (d.state) {
    case 'highlight':
      return d.color
    case 'normal':
      return this.options.vertexColor
  }
}
getEdgeColor(d) {
  switch (d.state) {
    case 'highlight':
      return this.getVertexColor(d.target)
    default:
      return this.options.edgeColor
  }
}
```

（2）可重写 getHighlightIds：获取到这些顶点和边的 _id 数组，默认为 radiationVertex 放射性

```javascript
getHighlightIds(d)
  //...
}
```

### 顶点名称后面增加类型

（1）定义好类型名称和颜色等

```javascript
constructor(options) {
  super(options)
  this.typeNameMap = {
    'Person': '人',
    'Company': '公司'
  }
  this.typeColorMap = {
    'Person': 'red',
    'Company': 'blue'
  }
}
```

（2）重写 setVertexNamePos 方法，保留原有的代码，增加 add type 代码

```javascript
setVertexNamePos(d, i, g) {
  if (!d.name) return

  let thisText = d3.select(g[i])
  thisText.selectAll('*').remove()

  let textStack = this.getTextStack(d) || []
  textStack.forEach((v) => {
    thisText.append('tspan').text(v.name)
      .attr('x', v.dx)
      .attr('y', v.dy)
      .style('font-size', this.options.vertexFontSize)
  })
  // add type
  thisText.append('tspan')
    .text(d => `[${this.typeNameMap[d._type]}]`)
    .attr('fill', d => this.typeColorMap[d._type])
    .style('font-size', this.options.vertexFontSize)
}
```

### 两个顶点之间的路径

点击一个顶点，高亮该顶点，点击第二个顶点时，高亮原高亮顶点到当前顶点的一条路径

（1）记录前一个顶点

```javascript
constructor(options) {
  super(options)
  this.lastVertex = null
}
```

（2）重写样式，同点击高亮的例子。

（3）重写 onVertexClick 点击事件回调

```javascript
onVertexClick(d) {
  let vertexIds = []
  let edgeIds = []
  if (!this.lastVertex) {
    vertexIds.push(d._id)
  } else if (this.lastVertex._id === d._id){
    return
  } else {
    let data = this.shortestPath(this.lastVertex, d)
    console.log(data);

    vertexIds = data.vertexIds
    edgeIds = data.edgeIds
  }
  this.lastVertex = d
  this.highlightVertex(vertexIds)
    .highlightEdge(edgeIds)
  this.resetStyle()
}
```

### 筛选顶点

点击顶点，过滤掉当前顶点以及当前顶点相关的边

重写 onVertexClick 事件回调即可

```javascript
onVertexClick(d) {
  let vertexIds = []
  let edgeIds = []

  vertexIds.push(d._id)

  this.options.data.edges.forEach((item) => {
    if (item._from === d._id || item._to === d._id) {
      edgeIds.push(item._id)
    }
  })
  this.filterVertex(vertexIds)
    .filterEdge(edgeIds)
    .init()
}
```

一般情况下还需要去掉那些已经没有边相连的顶点。

### 右键点击事件

右键点击显示自定义菜单

（1）增加一个 bindRightClick 方法

```javascript
bindRightClick() {
  this.nodeEnter.on('contextmenu', () => {
    d3.event.preventDefault();
  })

  this.nodeEnter.on('mouseup', () => {
    if (d3.event.button === 2) {
      console.log('right click');
    }
  })
}
```

（2）调用实例上的这个方法

```javascript
force.bindRightClick()
```

### 改变主题

（1）定义好相关主题样式

（2）调用 changeTheme 方法，传入主题名称即可

```javascript
force.changeTheme('dark')
```

### 缩放滚动轴

直接修改配置即可

```javascript
scaleBar: {
  type:'v',
  top: '10%',
  left: '10%',
  bottom: '',
  right: '',
  step: 0.5
}
```
