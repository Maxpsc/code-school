import { useState } from 'react'

/**
 * 动态规划 Dynamic Programming
 * 1.确定最优子问题，即dp[i]表示什么
 * 2.确定状态转移方程，即dp[i]=f(i)
 * 3.确定边界条件，初始化dp: 数据结构或滚动数组的指针
 * 4.遍历填充dp，直到第n个
 */

// 斐波那契数列
function fib(n: number): number {
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

/**
 * 最小花费爬楼梯
 * https://leetcode.cn/problems/min-cost-climbing-stairs/
 * cost[i]表示第i层向上爬1or2层的花费
 * dp[i] = Math.min(dp[i-1] + cost[i-1], dp[i-2] + cost[i-2])
 */
function minCostClimbingStairs(cost: number[]): number {
  if (cost.length <= 2) {
    return Math.min(...cost)
  }
  let pre = 0,
    cur = 0
  for (let i = 2; i <= cost.length; i++) {
    const next = Math.min(cur + cost[i - 1], pre + cost[i - 2])
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
function findUniqPaths(arr: number[][]): number {
  const c = arr.length,
    r = arr[0].length
  const temp: number[][] = []
  for (let i = 0; i < c; i++) {
    temp[i] = Array(r).fill(0)
  }
  if (arr[0][0] || arr[c - 1][r - 1]) {
    return 0
  }
  for (let i = 0; i < c; i++) {
    for (let j = 0; j < r; j++) {
      if (i === 0 && j === 0) {
        temp[i][j] = 1
      } else if (i === 0) {
        if (arr[i][j] === 0 && temp[i][j - 1] !== 0) {
          temp[i][j] = 1
        } else {
          temp[i][j] = 0
        }
      } else if (j === 0) {
        if (arr[i][j] === 0 && temp[i - 1][j] !== 0) {
          temp[i][j] = 1
        } else {
          temp[i][j] = 0
        }
      } else if (arr[i][j] !== 1) {
        temp[i][j] = temp[i - 1][j] + temp[i][j - 1]
      }
    }
  }
  return temp[c - 1][r - 1]
}

export default function DpPage() {
  const [fibResult, setFibResult] = useState<number | null>(null)
  const [minCostResult, setMinCostResult] = useState<number | null>(null)
  const [pathsResult, setPathsResult] = useState<number | null>(null)

  const runFib = () => {
    const result = fib(10)
    setFibResult(result)
    console.log('斐波那契 fib(10) =', result)
  }

  const runMinCost = () => {
    const cost = [10, 15, 20, 6, 4, 8, 12]
    const result = minCostClimbingStairs(cost)
    setMinCostResult(result)
    console.log('最小花费爬楼梯 minCostClimbingStairs([10,15,20,6,4,8,12]) =', result)
  }

  const runPaths = () => {
    const arr = [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ]
    const result = findUniqPaths(arr)
    setPathsResult(result)
    console.log('不同路径 findUniqPaths =', result)
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>动态规划 Dynamic Programming</h1>

      <div style={{ marginBottom: '30px' }}>
        <h2>核心步骤</h2>
        <ol style={{ lineHeight: '2' }}>
          <li>确定最优子问题，即 dp[i] 表示什么</li>
          <li>确定状态转移方程，即 dp[i] = f(i)</li>
          <li>确定边界条件，初始化 dp</li>
          <li>遍历填充 dp，直到第 n 个</li>
        </ol>
      </div>

      <div style={{ display: 'grid', gap: '20px' }}>
        {/* 斐波那契 */}
        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
          <h3>1. 斐波那契数列</h3>
          <p>dp[i] = dp[i-1] + dp[i-2]</p>
          <button onClick={runFib} style={buttonStyle}>
            运行 fib(10)
          </button>
          {fibResult !== null && (
            <span style={{ marginLeft: '15px', fontWeight: 'bold' }}>结果: {fibResult}</span>
          )}
        </div>

        {/* 最小花费爬楼梯 */}
        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
          <h3>2. 最小花费爬楼梯</h3>
          <p>dp[i] = Math.min(dp[i-1] + cost[i-1], dp[i-2] + cost[i-2])</p>
          <p>cost = [10, 15, 20, 6, 4, 8, 12]</p>
          <button onClick={runMinCost} style={buttonStyle}>
            运行 minCostClimbingStairs
          </button>
          {minCostResult !== null && (
            <span style={{ marginLeft: '15px', fontWeight: 'bold' }}>结果: {minCostResult}</span>
          )}
        </div>

        {/* 不同路径 */}
        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
          <h3>3. 不同路径 (带障碍物)</h3>
          <p>dp[m,n] = dp[m-1,n] + dp[m,n-1]</p>
          <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
{`[
  [0, 0, 0],
  [0, 1, 0],
  [0, 0, 0]
]`}
          </pre>
          <button onClick={runPaths} style={buttonStyle}>
            运行 findUniqPaths
          </button>
          {pathsResult !== null && (
            <span style={{ marginLeft: '15px', fontWeight: 'bold' }}>结果: {pathsResult}</span>
          )}
        </div>

        {/* 背包问题 */}
        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
          <h3>4. 0-1 背包问题</h3>
          <p>在 M 件物品里取出若干件放在大小为 W 的背包里</p>
          <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
{`物品体积 wList = [3, 4, 7, 8, 9]
物品价值 pList = [4, 5, 10, 11, 13]
背包容量 = 16`}
          </pre>
          <p style={{ color: '#888' }}>请查看控制台或访问 knapsack 页面</p>
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3>相关链接</h3>
        <ul>
          <li>
            <a href="https://github.com/Maxpsc/Ujs/blob/master/src/U.js" target="_blank" rel="noopener">
              更多 DP 问题参考 U.js
            </a>
          </li>
        </ul>
      </div>
    </div>
  )
}

const buttonStyle: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: '#4a90e2',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
}
