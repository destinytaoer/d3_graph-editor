# 基于 D3 的图编辑器

这是 2020 年的本科毕业设计, 从 2019 年开始进行, 4 月份已完成大部分功能.

在 2020 年 3 月进行**重构**, 并且对功能进行完善, 用于毕业设计.

完成这个项目首先要感谢两个公司:

- 海致星图: 在这里, 我接触了数据可视化, 对其有了基本的概念, 对知识图谱有了一定的了解. 并且在团队的帮助下, 熟悉 d3 库以及 force 等模块的实现, 并完成了公司内部 d3 组件库 force 模块实现. 本项目主要使用的就是这个模块的基本功能和逻辑
- 高新兴: 在这里, 我看到了一个比较有趣的图编辑器控件, 并对其进行了优化. 在征得公司的同意下, 用于毕业设计. 基于前期的 Force 等模块之上, 实现出了一个有趣的可编辑的 demo.

## 项目技术选型

首先, 本项目是基于 d3 实现的图谱, 主要是:

- 有着强大的功能, 不仅封装了原生 API, 还提供了一些强大的算法和构造器
- 可以说是最流行的可视化基础库之一, 有着强大的社区支持, 提供了很多的 demo 实现以及问题的解决方案
- 高度的可定制化, 相对于完全封装的库, 如 Echart, 有着很大的灵活性

由于项目主要实现的是一个图谱组件库, demo 也是一个简单的控件, 我选择使用 rollup 进行打包.

- 轻量, 不像 Webpack 那样重
- 简单, 只需要简单配置就能直接使用

## 功能简介

主要分为两个图谱组件：

- Force: 展示企业之间/企业与人之间的关系
- Tree: 展示企业内部的组织结构

图编辑器的功能:

- 图谱的展示
- 可缩放
- 可新增、编辑、删除
- 可撤销、重做
- 可导入、导出

未来规划：

- 其他图谱的组件构建

## 图谱库完成进度

- [x] Force 模块
- [ ] Tree 模块

## 文档

- [编写可配置的组件](./docs/编写可配置的组件.md)
- [如何应对不同项目的需求](./docs/如何应对不同项目的需求.md)
- [论文](./docs/论文.md)
- [Force 模块的使用](./docs/Force模块的使用.md)
- [BaseGraph 基类的设计](./docs/BaseGraph基类的设计.md)

## 开发

### 如何在 demos 中引用最新组件库？

使用 [yarn link](https://yarnpkg.com/lang/en/docs/cli/link/)

1. 在根目录中执行 `yarn link`
2. 在 demos 目录下执行 `yarn link graph-editor`，此时 demos 目录下的 node_modules 中就会出现 graph-editor 的符号链接

> 注意要在 demos 目录下先进行 `yarn init`, 否则会出现在根目录下的 node_modules 中

然后，就可以从 `node_modules` 引入最新的组件代码了。

```html
<script src="./node_modules/graph-editor/dist/index.iife.js"></script>
<!-- 两种情况的引入 -->
<script src="../node_modules/graph-editor/dist/index.iife.js"></script>
```

### 启动项目

启动项目进行开发, 需要进行两步:

- 启动 rollup 进行检测, 有文件修改就会自动打包
- 在 demos 目录下启动开发服务

```bash
yarn watch
yarn dev
```

### 发布

```bash
yarn build
```

会在 dist 中输出三种格式文件

- index.js
  - commonJS 格式，用于 node
- index.iife.js
  - 立即执行函数格式，用于浏览器原生环境，需要手动引入 d3.js
- index.es.js
  - ES module 格式，用于支持模块导入的现代前端框架，如 React / Vue
