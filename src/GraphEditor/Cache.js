/**
 * Cache: 缓存类
 *
 * @constructor
 *   caches: 缓存空间 [ ... ]
 *   point: 当前位置指针表示第 n 个缓存，这里的 point 是索引 +1
 *   length: 长度, 只读属性
 *   _source: 原始数据
 *
 * @function
 *   store(cache): 保存一个缓存
 *   next(): 获取下一个缓存
 *   prev(): 获取上一个缓存
 *   delete(index): 删除某个缓存，index 为索引 +1
 *   clear(): 清空缓存
 *
 * create by destiny on 2019-03-21
 * update by destiny on 2020-03-29
 */
class Cache {
  constructor() {
    this.caches = [];
    this._source = null;
    this.point = 0;

    Object.defineProperty(this, 'length', {
      get() {
        return this.caches.length;
      },
      set() {}
    });
  }

  init(data) {
    // 初始化 cache，清空 cache 并重置 source
    this._source = data;
    this.clear();

    return this;
  }

  getSource() {
    return this._source;
  }

  store(cache) {
    // 指针位置不在最后，那么需要删除当前指针后面的其他缓存再进行添加
    if (this.point < this.caches.length) {
      this.caches.splice(this.point);
    }

    this.caches.push(cache);
    this.point++;

    // 性能优化，最大缓存操作不超过20次
    if (this.caches.length > 20) {
      this.caches.shift();
    }

    return this;
  }

  // 一般不会存在删除某个缓存的问题
  delete(index) {
    return this.caches.splice(index, 1);
  }

  next() {
    if (this.point >= this.caches.length) return;
    this.point++;
    return this.caches[this.point - 1];
  }

  prev() {
    if (this.point <= 0) return;
    this.point--;
    return this.caches[this.point - 1];
  }

  clear() {
    this.caches = [];
    this.point = 0;
    return this;
  }
}

export default Cache;
