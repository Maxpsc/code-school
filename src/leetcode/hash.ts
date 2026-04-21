/** 两数之和，用map 空间换时间 */
function twoSum(nums: number[], target: number) {
	const res = {} as Record<string, number>
	for (let i = 0;i< nums.length;i++) {
		const curNum = nums[i]
		const targetNum = target - curNum
		if (res[targetNum] !== undefined) {
			return [i, res[targetNum]]
		} else {
			res[targetNum] = i
		}
	}
}

/**
 * 最长连续序列
 * 给定一个未排序的整数数组 nums ，找出数字连续的最长序列（不要求序列元素在原数组中连续）的长度。
请你设计并实现时间复杂度为 O(n) 的算法解决此问题。
https://leetcode.cn/problems/longest-consecutive-sequence/description/?envType=study-plan-v2&envId=top-100-liked
 */
function longestConsecutive(nums: number[]): number {
	// 用set.has判断是否存在数字
	const set = new Set(nums)

	let res = 0
	for (const i of nums) {
		/** 仅判断作为左起点的case */
		if (!set.has(i - 1)) {
			// 当前数字
			let curNum = i
			// i作为起点的最大长度
			let count = 1
			while(set.has(curNum + 1)) {
				count += 1
				curNum += 1
			}
			res = Math.max(res, count)
		}
	}
	return res
};

/**
 * 给定一个字符串数组，将字母异位词组合在一起
 * 输入: strs = ["eat", "tea", "tan", "ate", "nat", "bat"]
输出: [["bat"],["nat","tan"],["ate","eat","tea"]]
 * https://leetcode.cn/problems/group-anagrams/description/?envType=study-plan-v2&envId=top-100-liked
 */
function groupAnagrams(strs: string[]): string[][] {
    const res = new Map()

		for (const str of strs) {
			// 排序后作为key
			const key = str.split('').sort().join()
			if (res.get(key)) {
				res.get(key).push(str)
			} else {
				res.set(key, [str])
			}
		}
		return Array.from(res.values())
};


