/** 
 * 合并区间
 * 以数组 intervals 表示若干个区间的集合，其中单个区间为 intervals[i] = [starti, endi] 。请你合并所有重叠的区间，并返回 一个不重叠的区间数组，该数组需恰好覆盖输入中的所有区间 。
 * https://leetcode.cn/problems/merge-intervals/description/?envType=study-plan-v2&envId=top-100-liked
 */
function merge(intervals: number[][]) {
	// 先正序排列
	const sorted = intervals.sort((a, b) => a[0] - b[0])

	const res = [] as number[][]
	for (let i = 0;i < sorted.length;i++) {
		const cur = sorted[i]
		const lastOne = res[res.length - 1]
		if (cur[0] <= lastOne?.[1]) {
			lastOne[1] = Math.max(cur[1], lastOne?.[1])
		} else {
			res.push(cur)
		}
	}
	return res
}