// ES6 TS版本


/**
 * 函数防抖
 * 某个时间段内无论出发多少次，都只执行最后一次
 * immediate=true表示立即执行
 */
function debounce (cb: Function, wait: number, immediate = false) {
	let timer: any
	return (...args: any[]) => {
		if (timer) clearTimeout(timer)
		if (immediate && !timer) cb(...args)

		timer = setTimeout(() => {
			cb(...args)
			timer = null
		}, wait)
	}
}

/**
 * 函数节流
 * 在固定时间间隔触发，忽略多次触发
 */
function throttle(cb: Function, wait: number) {
	let timer: any
	return (...args: any[]) => {
		if (!timer) {
			cb(...args)
			timer = setTimeout(() => {
				timer = null
			}, wait)
		}
	}
}