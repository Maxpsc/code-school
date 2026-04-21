// 
/**
 * 最近最少使用
 * https://leetcode.cn/problems/lru-cache/
 * 
 */

class LRUCache {
	private cache: Map<number, number>

	constructor(private capacity: number) {
		this.cache = new Map()
	}

	get(key: number): number {
		if (!this.cache.has(key)) return -1
		const value = this.cache.get(key)!
		this.cache.delete(key)
		this.cache.set(key, value)
		return value
	}

	put(key: number, value: number): void {
		if (this.cache.has(key)) {
			this.cache.delete(key)
		}
		this.cache.set(key, value)
		if (this.cache.size > this.capacity) {
			// keys()返回的迭代器Key对象-MapKeyIterator，next()表示第一个key
			const firstKey = this.cache.keys().next().value!
			this.cache.delete(firstKey)
		}
	}
}

/**
* Your LRUCache object will be instantiated and called as such:
* var obj = new LRUCache(capacity)
* var param_1 = obj.get(key)
* obj.put(key,value)
*/

console.log('=== LRU Cache ===')
const lru = new LRUCache(2)
lru.put(1, 1)
lru.put(2, 2)
console.log(lru.get(1)) // 1
lru.put(3, 3)
console.log(lru.get(2)) // -1 (expired)
