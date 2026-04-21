/** 手写intanceOf */
function myInstanceOf(left: any, right: any) {
	let proto = Object.getPrototypeOf(left)
	while(proto) {
		if (proto === right.prototype) return true
		proto = Object.getPrototypeOf(proto)
	}
	return false
}

/** 数组去重 */
function uniq(arr: Array<any>) {
	return Array.from(new Set(arr))
}

/**
 * 深拷贝 - 由浅入深
 */

// ========== 阶段3：递归深拷贝（处理基本嵌套）==========

/** 递归深拷贝：处理嵌套对象和数组 */
function deepCopyV1(obj: any): any {
	if (obj === null || typeof obj !== 'object') return obj
	if (Array.isArray(obj)) {
		return obj.map(i => deepCopyV1(i))
	}

	return Object.keys(obj).reduce((acc, key) => {
		return {
			...acc,
			[key]: deepCopyV1(obj[key])
		}
	}, {})
}

function myDeepCopy(obj: any, weakMap = new WeakMap()) {
	// 处理基本类型和null
	if (obj === null || typeof obj !== 'object') return obj
	if (weakMap.has(obj)) return weakMap.get(obj)
	
	// 数组
	if (Array.isArray(obj)) {
		const copy = [] as any[]
		weakMap.set(obj, copy)
		obj.forEach(i => copy.push(myDeepCopy(i, weakMap)))
		return copy
	}

	// Date
	if (obj instanceof Date) {
		return new Date(obj.getTime())
	}

	// 正则
	if (obj instanceof RegExp) {
		return new RegExp(obj.source, obj.flags)
	}

	// 对象
	const copy = {} as Record<string, any>
	weakMap.set(obj, copy)
	for (const key of Object.keys(obj)) {
		copy[key] = myDeepCopy(obj[key], weakMap)
	}
	return copy
}


/** 数组flat */
function arrayFlat(arr: Array<any>) {
	return arr.reduce((res, cur) => {
		return res.concat(Array.isArray(cur) ? arrayFlat(cur) : cur)
	}, [])
}