
/** 
 * 函数防抖
 * 某个时间段内无论出发多少次，都只执行最后一次
 * immediate=true表示立即执行
 * https://github.com/Maxpsc/Ujs/blob/master/src/U.js#L852
 */
export function debounce(cb, wait = 500, immediate = false) {
	let timer
	return function() {
		timer && clearTimeout(timer)
		const ctx = this
		const args = arguments

		if (!timer && immediate) {
			cb.apply(ctx, args)
		}
		timer = setTimeout(function() {
			cb.apply(ctx, args)
		}, wait)
	}
}

window.addEventListener('resize', debounce(() => console.log('debounce', 111), 500, true))

/**
 * 函数节流
 * 在固定时间间隔触发，忽略多次触发
 * leading: true 首次触发
 * trailing: true 结束时触发
 */
export function throttle(fn, wait, leading = true, trailing = true) {
	let timer
	return function() {
		const ctx = this
		const args = arguments
		// 定时器对比
		if (!timer) {
			leading && fn.apply(ctx, args)
			timer = setTimeout(function() {
				timer = null
				trailing && fn.apply(ctx, args)
			}, wait)
		}
	}
}

window.addEventListener('resize', throttle(() => console.log('throttle'), 500, false, true))