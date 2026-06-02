// 真实面试的问题

// 字节-番茄小说
/** 
 * 无重复字符的最长子串
 * 给定一个字符串 s ，请你找出其中不含有重复字符的 最长 子串 的长度。
 * 'abcba' -> 3
 * https://leetcode.cn/problems/longest-substring-without-repeating-characters/description/?envType=study-plan-v2&envId=top-100-liked
 */
function longestSubstr(str) {
	const arr = []
	let max = 0
	for (let i =0;i<str.length;i++) {
		const cur = str[i]
		const idx = arr.indexOf(cur)
		// 检查arr是否包含当前字符
		console.log('before', arr)
		if (idx !== -1) {
			// 把这个
			arr.splice(0, idx + 1)
			console.log('after', arr)
		}
		
		arr.push(cur)
		max = Math.max(max, arr.length)
	}
	return max
}
