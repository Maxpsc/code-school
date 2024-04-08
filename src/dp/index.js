/**
 * 动态规划 Dynamic Programming
 * 1.确定最优子问题，即dp[i]表示什么
 * 2.确定状态转移方程，即dp[i]=f(i)
 * 3.确定边界条件，初始化dp: 数据结构或滚动数组的指针
 * 4.遍历填充dp，直到第n个
 */

/**
 * 斐波那契数列
 * dp[i] = dp[i-1] + dp[i-2]
 */
function fib(n) {
  if (n < 2) return n
  let p = 0,
    q = 0,
    cur = 1
  for (let i = 2; i <= n; i++) {
    p = q
    q = cur
    cur = p + q
  }
  return cur
}
// console.log(fib(10))

/**
 * 最小花费爬楼梯
 * https://leetcode.cn/problems/min-cost-climbing-stairs/
 * cost[i]表示第i层向上爬1or2层的花费
 * dp[i] = Math.min(dp[i-1] + cost[i-1], dp[i-2] + cost[i-2])
 */
function minCostClimbingStairs(cost) {
	if (cost.length <= 2) {
		return Math.min(...cost)
	}
	let pre = 0, cur = 0
	for (let i = 2;i<=cost.length;i++) {
		const next = Math.min(cur + cost[i-1], pre + cost[i-2])
		pre = cur
		cur = next
	}
	return cur
}

/**
 * 不同路径走格子
 * arr为二维数组[[0,0,0],[0,1,0],[0,0,0]]，1表示障碍物不可通行
 * https://leetcode.cn/problems/unique-paths-ii/description/
 * dp[m,n] = dp[m-1,n] + dp[m,n-1]
 */
function findUniqPaths(arr) {
  // 总行、列数
  const c = arr.length,
    r = arr[0].length
  // 填充
  const temp = []
  for (let i = 0; i < c; i++) {
    temp[i] = Array(r).fill(0)
  }
  // 起点、终点有障碍物
  if (arr[0][0] || arr[c - 1][r - 1]) {
    return 0
  }
  for (let i = 0; i < c; i++) {
    for (let j = 0; j < r; j++) {
      // 起点
      if (i === 0 && j === 0) {
        temp[i][j] = 1
      } else if (i === 0) {
        // 第一行
        if (arr[i][j] === 0 && temp[i][j - 1] !== 0) {
          temp[i][j] = 1
        } else {
          temp[i][j] = 0
        }
      } else if (j === 0) {
        // 第一列
        if (arr[i][j] === 0 && temp[i - 1][j] !== 0) {
          temp[i][j] = 1
        } else {
          temp[i][j] = 0
        }
      } else if (arr[i][j] !== 1) {
        // 剩余非边界,无障碍情况
        temp[i][j] = temp[i - 1][j] + temp[i][j - 1]
      }
    }
  }
  return temp[c - 1][r - 1]
}

findUniqPaths([
  [0, 0, 0],
  [0, 1, 0],
  [0, 0, 0],
])

/**
 * 背包问题
 * 在M件物品里取出若干件放在大小为W的背包里，每件物品的体积为W1，W2，W3····Wn，与这些物品对应的价值分别对应为P1，P2，P3·····Pn，如何求出这个背包能装的最大价值
 * dp[i][j]表示放了i个物体，容量为j的背包能放的最大价值
 * 状态转移方程：dp[i][j]= Math.max(dp[i-1][j], dp[i-1][j-weight[i]]+value[i])
 * 其中dp[i-1][j]表示不放第i个物体，背包的最大价值
 * j-weight[i]表示背包容量j不放第i个物体的容量
 * 而 dp[i-1][j-weight[i]] 表示不放第i个物体，背包容量i-weight[i]的最大价值
 * 
 * wList=[3,4,7,8,9] 物体体积
 * pList=[4,5,10,11,13] 物体价值
 * 背包容量大小16
 */

function bag(W, wList, pList) {

}
