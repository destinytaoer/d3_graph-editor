/**
 * Cache: 缓存类
 *
 * @constructor
 *   caches: 缓存空间 [...]
 *   point: 当前位置指针表示第 n 个缓存，这里的 point 是索引 +1
 *
 * @function
 *   store(cache): 保存一个缓存
 *   next(): 获取下一个缓存
 *   prev(): 获取上一个缓存
 *   delete(index): 删除某个缓存，index 为索引 +1
 *   clear(): 清空缓存
 *
 * by destiny on 2019-03-21
 */
function Cache() {
  this.caches = []
  this.point = 0
}

Cache.prototype = {
  constructor: Cache,

  store: function (cache) {
    // 指针位置不在最后，那么需要删除当前指针后面的其他缓存再进行添加
    if (this.point < this.caches.length) {
      this.caches.splice(this.point)
    }
    
    this.caches.push(cache)
    this.point++

    // 性能优化，最大缓存操作不超过20次
    if (this.caches.length > 20) {
      this.caches.shift()
    }

    return this
  },

  // 一般不会存在删除某个缓存的问题
  delete: function (index) { // 从 1 开始
    delete this.caches.splice(index - 1, 1)
  },

  next: function () {
    if (this.point > this.caches.length) return
    this.point++
    return this.caches[this.point - 1]
  },

  prev: function () {
    if (this.point < 1) return
    this.point--
    return this.caches[this.point - 1]
  },

  clear: function () {
    this.caches = []
    this.point = 0
    return this
  }
};