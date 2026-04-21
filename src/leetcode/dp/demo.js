function foo(arr) {
  let n = arr.length, m = arr[0].length;
  let temp = [];

  // 初始化将格子填充为0
  for (let i = 0; i < n; i++) {
    temp[i] = Array(m).fill(0)
  }

  // 如果起始或终止目标有障碍物，则直接返回0
  if (arr[0][0] == 1 || arr[n - 1][m - 1] == 1) {
    return 0
  }

  // 遍历二维数组的列数
  for (i = 0; i < n; i++) {
    // 遍历二维数组的行数
    for (let j = 0; j < m; j++) {
      if (i == 0 && j == 0) {
        temp[i][j] = 1;
        // 第一种边界情况：1行n列
      } else if (i == 0) {
        if (arr[i][j] != 1 && temp[i][j - 1] != 0) {
          temp[i][j] = 1;
        } else {
          temp[i][j] = 0;
        }
        // 第二种边界情况： m行1列
      } else if (j == 0) {
        if (arr[i][j] != 1 && temp[i - 1][j] != 0) {
          temp[i][j] = 1;
        } else {
          temp[i][j] = 0;
        }
      } else if (arr[i][j] != 1) {
        // 如果不是上述的两种边界情况，终止条件的到达方式是i-1,j和i,j-1的和
        temp[i][j] = temp[i - 1][j] + temp[i][j - 1]
      }
    }
  }
  return temp[n - 1][m - 1]
}