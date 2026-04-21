/**
 * 岛屿数量
 * 给你一个由 '1'（陆地）和 '0'（水）组成的的二维网格，请你计算网格中岛屿的数量。
岛屿总是被水包围，并且每座岛屿只能由水平方向和/或竖直方向上相邻的陆地连接形成。
此外，你可以假设该网格的四条边均被水包围。
https://leetcode.cn/problems/number-of-islands/description/?envType=study-plan-v2&envId=top-100-liked
 */
function numIslands(grid: string[][]): number {  
	// 遍历每个坐标，如果是陆地则岛屿数量+1
	// 注意，同时通过DFS将这座岛相连所有坐标都标为0；继续遍历
	let count = 0
	for (let i=0;i<grid.length;i++) {
		for (let j=0;j<grid[0].length;j++) {
			if (grid[i][j] === '1') {
				count += 1
				turnZero(i, j, grid)
			}
		}
	}
	
	// 将独立岛所有坐标变为0
	function turnZero(i: number, j: number, grid: string[][]) {
		// 网格边界，或当前已经是0
		if (i < 0 || i>= grid.length || j<0|| j >= grid[0].length || grid[i][j] === '0') return
		grid[i][j] = '0'
		turnZero(i - 1, j, grid)
		turnZero(i + 1, j, grid)
		turnZero(i, j - 1, grid)
		turnZero(i, j + 1, grid)
	}
	return count
}


/** 
 * 全排列
 * 给定一个不含重复数字的数组 nums ，返回其 所有可能的全排列 。你可以 按任意顺序 返回答案。
https://leetcode.cn/problems/permutations/description/?envType=study-plan-v2&envId=top-100-liked
 */
function permute(nums: number[]): number[][] {
    const res = [] as number[][]
		// const used = {}

		function dfs(path: number[]) {
			// 找到一个排列
			if (path.length === nums.length) {
				res.push(path.slice())
				return
			}
			for (const num of nums) {
				if (path.includes(num)) continue
				path.push(num)
				dfs(path)
				path.pop()
			}
		}

		dfs([])
		return res
};

