/**
 * 滑雪问题 - TypeScript 实现
 * 
 * 问题描述：
 * 给定一个 R 行 C 列的矩阵，表示一个矩形区域的高度。
 * 你可以从任意位置出发，每次可以向上下左右四个方向移动，
 * 但只能移动到比当前位置高度更低的位置。
 * 求最长的滑雪路径长度。
 */

/**
 * 方法 1：记忆化搜索（自顶向下）
 * 
 * 思路：
 * 1. 定义状态：dp[i][j] 表示从位置 (i,j) 出发能滑行的最长距离
 * 2. 状态转移：dp[i][j] = max(dp[nx][ny]) + 1
 * 3. 使用 memo 数组避免重复计算
 * 
 * 时间复杂度：O(R * C)
 * 空间复杂度：O(R * C)
 */
export function skiingMemoization(heights: number[][]): number {
  if (!heights || heights.length === 0 || heights[0].length === 0) {
    return 0;
  }

  const rows = heights.length;
  const cols = heights[0].length;
  
  // memo[i][j] = -1 表示未计算
  const memo: number[][] = Array.from({ length: rows }, () => 
    new Array(cols).fill(-1)
  );

  // 四个方向：上、下、左、右
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  /**
   * DFS + 记忆化搜索
   */
  function dfs(row: number, col: number): number {
    // 如果已经计算过，直接返回
    if (memo[row][col] !== -1) {
      return memo[row][col];
    }

    // 初始化为 1（至少包含当前位置）
    let maxLen = 1;

    // 尝试四个方向
    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;

      // 检查边界和高度条件
      if (
        newRow >= 0 && newRow < rows &&
        newCol >= 0 && newCol < cols &&
        heights[newRow][newCol] < heights[row][col]
      ) {
        maxLen = Math.max(maxLen, dfs(newRow, newCol) + 1);
      }
    }

    memo[row][col] = maxLen;
    return maxLen;
  }

  // 遍历所有位置，找到最长路径
  let maxLength = 0;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      maxLength = Math.max(maxLength, dfs(i, j));
    }
  }

  return maxLength;
}

/**
 * 方法 2：动态规划（自底向上）
 * 
 * 思路：
 * 1. 按照高度从低到高的顺序处理所有位置
 * 2. 对于每个位置，检查它能到达的更低位置，更新 DP 值
 * 
 * 时间复杂度：O(R * C * log(R * C))
 * 空间复杂度：O(R * C)
 */
export function skiingDP(heights: number[][]): number {
  if (!heights || heights.length === 0 || heights[0].length === 0) {
    return 0;
  }

  const rows = heights.length;
  const cols = heights[0].length;

  // dp[i][j] 初始化为 1
  const dp: number[][] = Array.from({ length: rows }, () => 
    new Array(cols).fill(1)
  );

  // 创建位置列表并按高度排序（从低到高）
  const positions: Array<[number, number, number]> = [];
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      positions.push([i, j, heights[i][j]]);
    }
  }
  positions.sort((a, b) => a[2] - b[2]);

  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  // 从低到高处理每个位置
  for (const [row, col] of positions) {
    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;

      if (
        newRow >= 0 && newRow < rows &&
        newCol >= 0 && newCol < cols &&
        heights[newRow][newCol] < heights[row][col]
      ) {
        dp[row][col] = Math.max(dp[row][col], dp[newRow][newCol] + 1);
      }
    }
  }

  // 找到最大值
  let maxLength = 0;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      maxLength = Math.max(maxLength, dp[i][j]);
    }
  }

  return maxLength;
}

/**
 * 示例使用
 */
if (require.main === module) {
  // 示例 1：经典 5x5 矩阵
  const heights1 = [
    [1, 2, 3, 4, 5],
    [16, 17, 18, 19, 6],
    [15, 24, 25, 20, 7],
    [14, 23, 22, 21, 8],
    [13, 12, 11, 10, 9],
  ];

  console.log('=== 滑雪问题示例 ===\n');
  console.log('地图：');
  heights1.forEach(row => console.log(row.join('\t')));
  
  console.log('\n方法 1：记忆化搜索');
  console.log('最长路径:', skiingMemoization(heights1));
  
  console.log('\n方法 2：动态规划');
  console.log('最长路径:', skiingDP(heights1));

  // 示例 2：简单 3x3 矩阵
  const heights2 = [
    [9, 8, 7],
    [6, 5, 4],
    [3, 2, 1],
  ];

  console.log('\n\n=== 示例 2 ===\n');
  console.log('地图：');
  heights2.forEach(row => console.log(row.join('\t')));
  
  console.log('\n最长路径:', skiingMemoization(heights2));
}
