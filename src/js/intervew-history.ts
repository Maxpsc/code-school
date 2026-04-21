
/**
 * 有效 IP 地址 正好由四个整数（每个整数位于 0 到 255 之间组成，且不能含有前导 0），整数之间用 '.' 分隔。

例如："0.1.2.201" 和 "192.168.1.1" 是 有效 IP 地址，但是 "0.011.255.245"、"192.168.1.312" 和 "192.168@1.1" 是 无效 IP 地址。

给定一个只包含数字的字符串 s ，用以表示一个 IP 地址，返回所有可能的有效 IP 地址，这些地址可以通过在 s 中插入 '.' 来形成。你 不能 重新排序或删除 s 中的任何数字。你可以按 任何 顺序返回答案。

输入：s = "25525511135"
输出：["255.255.11.135","255.255.111.35"]

输入：s = "101023"
输出：["1.0.10.23","1.0.102.3","10.1.0.23","10.10.2.3","101.0.2.3"]
 */

function restoreIpAddresses(s) {
	// 最终结果，["1.0.10.23","1.0.102.3","10.1.0.23","10.10.2.3","101.0.2.3"]
  const res = [];
	// 当前有效路径
  const path = [];

  function isValid(segment) {
    const n = parseInt(segment, 10);
    // 不能有前导 0（除了单独的 "0"）
    if (segment.length > 1 && segment[0] === '0') return false;
    return n >= 0 && n <= 255;
  }

	// dfs, start表示当前数字下标
  function backtrack(start) {
    // 已拼凑了 4 段
    if (path.length === 4) {
			// 没有剩余数字，表示有效ip
      if (start === s.length) {
        res.push(path.join('.'));
      }
      return;
    }

    // 剩余字符过多直接剪枝
    const remaining = s.length - start;
		// 还需要几个数字
    const need = 4 - path.length;
		// 剩余字符无法满足
    if (remaining < need || remaining > need * 3) {
			console.log(`remaining:${remaining} need:${need}`)
			return
		}

    // 每次尝试取 1~3 个字符作为一段
    for (let len = 1; len <= 3 && start + len <= s.length; len++) {
      const segment = s.slice(start, start + len);
			console.log('segment', segment)
      if (!isValid(segment)) continue;

      path.push(segment);
			console.log('before', path)
      backtrack(start + len);
			console.log('after', path)
      path.pop();
			console.log('after pop', path)
    }
  }

  backtrack(0);
  return res;
}

// 测试
console.log(restoreIpAddresses('25525511135')); // ['255.255.11.135', '255.255.111.35']
console.log(restoreIpAddresses('101023')); 
// [
//     "1.0.10.23",
//     "1.0.102.3",
//     "10.1.0.23",
//     "10.10.2.3",
//     "101.0.2.3"
// ]
console.log(restoreIpAddresses('0000')); // ['0.0.0.0']


function restoreIP(s) {
	const res = []
	const path = []
	// 校验ip有效
	function isValid(s) {
		const num = parseInt(s, 10)
		// 0开头
		if (s.length > 1 && s[0] === '0')  return false
		return num >= 0 && num <= 255
	}

	function dfs(start) {
		// 满足条件，追加到res
		if (start === s.length && path.length === 4) {
			console.log('find', path)
			res.push(path.join('.'))
			return
		}

		// 以下为优化剪枝，不影响结果
		// 剩余数字不满足 或超过要求，则return
		const remain = s.length - start
		// 还需要几个数字
		const need = 4 - path.length
		if (remain < need || remain > need * 3) return 

		// 优化结束

		for (let i = 1;i<=3;i++) {
			const target = s.slice(start, start + i)
			if (!isValid(target)) continue
			path.push(target)
			dfs(start + i)
			path.pop()
		}
	}
	dfs(0)
	return res
}