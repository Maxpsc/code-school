/**
 * 背包问题集合 - TypeScript 实现
 * 
 * 包含三种经典背包问题：
 * 1. 0-1 背包：每个物品只能选一次
 * 2. 完全背包：每个物品可以选无限次
 * 3. 多重背包：每个物品有数量限制
 */

interface Item {
  weight: number;
  value: number;
}

interface MultipleItem extends Item {
  count: number;
}

// ==================== 0-1 背包问题 ====================

/**
 * 0-1 背包 - 二维 DP
 * 
 * 状态定义：dp[i][w] = 前 i 个物品，容量为 w 时的最大价值
 * 状态转移：dp[i][w] = max(dp[i-1][w], dp[i-1][w-weight[i]] + value[i])
 * 
 * 时间复杂度：O(N * W)
 * 空间复杂度：O(N * W)
 */
export function knapsack01_2D(items: Item[], capacity: number): number {
  const n = items.length;
  
  // 创建 DP 表格
  const dp: number[][] = Array.from({ length: n + 1 }, 
    () => new Array(capacity + 1).fill(0)
  );

  // 填充 DP 表格
  for (let i = 1; i <= n; i++) {
    const { weight, value } = items[i - 1];
    
    for (let w = 0; w <= capacity; w++) {
      // 不选第 i 个物品
      dp[i][w] = dp[i - 1][w];
      
      // 如果能选第 i 个物品，取最大值
      if (w >= weight) {
        dp[i][w] = Math.max(dp[i][w], dp[i - 1][w - weight] + value);
      }
    }
  }

  return dp[n][capacity];
}

/**
 * 0-1 背包 - 一维 DP（空间优化）
 * 
 * 关键：从后往前遍历，避免重复使用同一物品
 * 
 * 时间复杂度：O(N * W)
 * 空间复杂度：O(W)
 */
export function knapsack01_1D(items: Item[], capacity: number): number {
  const dp: number[] = new Array(capacity + 1).fill(0);

  for (const { weight, value } of items) {
    // ⚠️ 关键：从后往前更新
    for (let w = capacity; w >= weight; w--) {
      dp[w] = Math.max(dp[w], dp[w - weight] + value);
    }
  }

  return dp[capacity];
}

// ==================== 完全背包问题 ====================

/**
 * 完全背包 - 二维 DP
 * 
 * 状态转移：dp[i][w] = max(dp[i-1][w], dp[i][w-weight[i]] + value[i])
 * 注意：选择物品时用 dp[i]，不是 dp[i-1]
 * 
 * 时间复杂度：O(N * W)
 * 空间复杂度：O(N * W)
 */
export function knapsackComplete_2D(items: Item[], capacity: number): number {
  const n = items.length;
  const dp: number[][] = Array.from({ length: n + 1 }, 
    () => new Array(capacity + 1).fill(0)
  );

  for (let i = 1; i <= n; i++) {
    const { weight, value } = items[i - 1];
    
    for (let w = 0; w <= capacity; w++) {
      dp[i][w] = dp[i - 1][w];
      
      if (w >= weight) {
        // ⚠️ 注意：这里是 dp[i][w - weight]
        dp[i][w] = Math.max(dp[i][w], dp[i][w - weight] + value);
      }
    }
  }

  return dp[n][capacity];
}

/**
 * 完全背包 - 一维 DP（空间优化）
 * 
 * 关键：从前往后遍历，允许重复使用同一物品
 * 
 * 时间复杂度：O(N * W)
 * 空间复杂度：O(W)
 */
export function knapsackComplete_1D(items: Item[], capacity: number): number {
  const dp: number[] = new Array(capacity + 1).fill(0);

  for (const { weight, value } of items) {
    // ⚠️ 关键：从前往后更新
    for (let w = weight; w <= capacity; w++) {
      dp[w] = Math.max(dp[w], dp[w - weight] + value);
    }
  }

  return dp[capacity];
}

// ==================== 多重背包问题 ====================

/**
 * 多重背包 - 朴素解法
 * 
 * 状态转移：dp[i][w] = max(dp[i-1][w - k*weight[i]] + k*value[i])
 * 其中 k = 0, 1, 2, ..., min(count[i], w/weight[i])
 * 
 * 时间复杂度：O(N * W * K)
 * 空间复杂度：O(N * W)
 */
export function knapsackMultiple(
  items: MultipleItem[],
  capacity: number
): number {
  const n = items.length;
  const dp: number[][] = Array.from({ length: n + 1 }, 
    () => new Array(capacity + 1).fill(0)
  );

  for (let i = 1; i <= n; i++) {
    const { weight, value, count } = items[i - 1];
    
    for (let w = 0; w <= capacity; w++) {
      const maxK = Math.min(count, Math.floor(w / weight));
      
      for (let k = 0; k <= maxK; k++) {
        dp[i][w] = Math.max(
          dp[i][w],
          dp[i - 1][w - k * weight] + k * value
        );
      }
    }
  }

  return dp[n][capacity];
}

/**
 * 多重背包 - 二进制优化
 * 
 * 思路：将每种物品拆分成多个 0-1 背包物品
 * 例如：count = 10，拆分成 1, 2, 4, 3
 * 
 * 时间复杂度：O(N * W * log K)
 * 空间复杂度：O(W)
 */
export function knapsackMultipleOptimized(
  items: MultipleItem[],
  capacity: number
): number {
  const expandedItems: Item[] = [];

  for (const { weight, value, count } of items) {
    let remaining = count;
    let k = 1;

    // 二进制拆分
    while (k <= remaining) {
      expandedItems.push({
        weight: weight * k,
        value: value * k,
      });
      remaining -= k;
      k *= 2;
    }

    // 处理剩余部分
    if (remaining > 0) {
      expandedItems.push({
        weight: weight * remaining,
        value: value * remaining,
      });
    }
  }

  // 使用 0-1 背包求解
  return knapsack01_1D(expandedItems, capacity);
}

/**
 * 示例使用
 */
if (require.main === module) {
  console.log('=== 0-1 背包问题 ===\n');
  
  const items01: Item[] = [
    { weight: 2, value: 3 },
    { weight: 3, value: 4 },
    { weight: 4, value: 5 },
    { weight: 5, value: 8 },
  ];
  const capacity01 = 10;

  console.log('物品:', items01);
  console.log('容量:', capacity01);
  console.log('最大价值 (二维):', knapsack01_2D(items01, capacity01));
  console.log('最大价值 (一维):', knapsack01_1D(items01, capacity01));

  console.log('\n=== 完全背包问题 ===\n');
  
  const itemsComplete: Item[] = [
    { weight: 2, value: 3 },
    { weight: 3, value: 4 },
    { weight: 4, value: 5 },
  ];
  const capacityComplete = 10;

  console.log('物品:', itemsComplete);
  console.log('容量:', capacityComplete);
  console.log('最大价值 (二维):', knapsackComplete_2D(itemsComplete, capacityComplete));
  console.log('最大价值 (一维):', knapsackComplete_1D(itemsComplete, capacityComplete));

  console.log('\n=== 多重背包问题 ===\n');
  
  const itemsMultiple: MultipleItem[] = [
    { weight: 2, value: 3, count: 2 },
    { weight: 3, value: 4, count: 3 },
    { weight: 4, value: 5, count: 1 },
  ];
  const capacityMultiple = 10;

  console.log('物品:', itemsMultiple);
  console.log('容量:', capacityMultiple);
  console.log('最大价值 (朴素):', knapsackMultiple(itemsMultiple, capacityMultiple));
  console.log('最大价值 (优化):', knapsackMultipleOptimized(itemsMultiple, capacityMultiple));
}
