/**
 * 移动0
 * 给定一个数组 nums，编写一个函数将所有 0 移动到数组的末尾，同时保持非零元素的相对顺序。
 * 请注意 ，必须在不复制数组的情况下原地对数组进行操作。
 * https://leetcode.cn/problems/move-zeroes/description/?envType=study-plan-v2&envId=top-100-liked
 */
function moveZeroV1(nums: number[]): void {
  // 不复制数组版本
	let emptyIdx = 0
	for (let i =0;i<nums.length;i++) {
		// 当前不是0，移动到emptyIdx位置
		if (nums[i] !== 0) {
			[nums[i], nums[emptyIdx]] = [nums[emptyIdx], nums[i]]
			emptyIdx += 1
		}
	}
};

/** 使用栈版本 */
function moveZeroV2(nums: number[]) {
	let stackSize = 0
	for (const i of nums) {
		if (i !== 0) {
			nums[stackSize] = i
			stackSize += 1
		}
	}
	nums.fill(0, stackSize)
}

/** 
 * 无重复字符的最长子串
 * 给定一个字符串 s ，请你找出其中不含有重复字符的 最长 子串 的长度。
 * 'abcba' -> 3
 * https://leetcode.cn/problems/longest-substring-without-repeating-characters/description/?envType=study-plan-v2&envId=top-100-liked
 */
function longestSubstr(str: string) {
	const arr = [] as string[]
	let max = 0
	for (let i =0;i<str.length;i++) {
		const cur = str[i]
		const idx = arr.indexOf(cur)
		if (idx !== -1) {
			arr.splice(0, idx + 1)
		}
		arr.push(cur)
		max = Math.max(max, arr.length)
	}
	return max
}



/**
 * 盛水最多的容器
 * 给定一个长度为 n 的整数数组 height 。有 n 条垂线，第 i 条线的两个端点是 (i, 0) 和 (i, height[i]) 。
找出其中的两条线，使得它们与 x 轴共同构成的容器可以容纳最多的水。
返回容器可以储存的最大水量。
 * https://leetcode.cn/problems/container-with-most-water/description/?envType=study-plan-v2&envId=top-100-liked
 */
function maxArea(height: number[]): number {
	// 初始窗口为最大宽度，逐步缩小
	let max = 0, left = 0, right = height.length - 1
	 while (left < right) {
		const area = Math.min(height[left], height[right]) * (right - left)
		max = Math.max(area, max)

		// 关键，低的一边是瓶颈，需要移动
		if (height[left] < height[right]) {
			left += 1
		} else {
			right -= 1
		}
	 }

	return max
};

/**
 * 三数之和
 * 给你一个整数数组 nums ，判断是否存在三元组 [nums[i], nums[j], nums[k]] 满足 i != j、i != k 且 j != k ，同时还满足 nums[i] + nums[j] + nums[k] == 0 。请你返回所有和为 0 且不重复的三元组。
 * https://leetcode.cn/problems/3sum/description/?envType=study-plan-v2&envId=top-100-liked
 * 
 * 确保：
 * 三个数下标不同，数值不同
 * 三个值加起来是0
 */

function threeSum(nums: number[]): number[][] {
	const res = [] as number[][]
	// 不需要返回下标，先从小到大排序
	nums.sort()

	// 有正数和负数才继续计算
	if (nums[0] < 0 && nums[nums.length - 1] > 0) {
		for (let i = 0;i<nums.length;i++) {
			// cur是定值
			const cur = nums[i]
			// 定值大于等于0则退出
			if (cur >= 0) break

			// 跳过重复定值
			if (i >0 && nums[i] === nums[i-1]) continue

			let left = i + 1
			let right = nums.length - 1
			while (left < right) {
				const sum = cur + nums[left] + nums[right]
				if (sum === 0) {
					res.push([cur, nums[left], nums[right]])

					// 跳过重复left right
					while (left < right && nums[left] === nums[left + 1]) left++
          while (left < right && nums[right] === nums[right - 1]) right--
				} else if (sum < 0) {
					left += 1
				} else {
					right -= 1
				}
			}
		}
	}
	return res
};