interface TreeNode {
	left: TreeNode | null
	right: TreeNode | null
	value: number
}

/** 广度优先遍历 */
function BFS(node: TreeNode) {
	const res = [] as number[]
	const queue = [node]
	while (queue.length) {
		const cur = queue.shift() as TreeNode
		res.push(cur.value)
		cur.left && queue.push(cur.left)
		cur.right && queue.push(cur.right)
	}
	return res
}

/** 深度优先遍历，递归 */
function DFS(node: TreeNode | null, res: number[] = []) {
	if (!node) return res
	
	// 前序遍历-根节点的处理放在什么位置，就是XX序遍历
	res.push(node.value)
	DFS(node.left, res)
	DFS(node.right, res)
	return res
}

/**
 * 
 */

/** 深度优先遍历，迭代（前序遍历） */
function DFSWithStack(node: TreeNode | null) {
	if (!node) return []
	const res = [] as number[]
	const stack = [node]

	while (stack.length) {
		const cur = stack.pop() as TreeNode // 栈用 pop，队列用 shift
		res.push(cur.value)
		// 注意：先压右子节点，再压左子节点，这样左子节点先出栈
		cur.right && stack.push(cur.right)
		cur.left && stack.push(cur.left)
	}
	return res
}


/** 最大深度/根节点到叶子结点最长路径 */
function maxDepth(node: TreeNode | null): number {
	if (!node) return 0
	return Math.max(maxDepth(node.left), maxDepth(node.right)) + 1
}

/** 翻转二叉树，返回根节点 */
function reverseTree(node: TreeNode | null) {
	if (!node) return null
	const oldLeft = node.left
	node.left = reverseTree(node.right)
	node.right = reverseTree(oldLeft)
	return node
}

/** 判断是否对称二叉树 */
function isSymmetric(root: TreeNode | null) {
	if (!root) return true
	function check(left: TreeNode | null, right: TreeNode | null): boolean {
		if (!left && !right) return true
		if (!left || !right) return false
		return left.value === right.value && check(left.left, right.right) && check(left.right, right.left)
	}
	return check(root.left, root.right)
}


/** 二叉树的右视图 */
function rightSideView(root: TreeNode | null) {
	if (!root) return []
	const res = [] as number[]
	const queue: TreeNode[] = [root]

	while (queue.length > 0) {
		const levelSize = queue.length
		console.log(`\n========== 新的一轮 ==========`)
		console.log(`levelSize: ${levelSize}, queue: [${queue.map(n => n.value).join(', ')}]`)

		for (let i = 0; i < levelSize; i++) {
			const node = queue.shift()!
			console.log(`  处理节点 ${node.value}，i=${i}，是这层第${i + 1}个，共${levelSize}个`)

			if (i === levelSize - 1) {
				console.log(`  → i === levelSize - 1，加入结果: ${node.value}`)
				res.push(node.value)
			} else {
				console.log(`  → 不是这层最后一个，不加入结果`)
			}

			node.left && queue.push(node.left)
			node.right && queue.push(node.right)
			console.log(`  children 入队后，queue: [${queue.map(n => n.value).join(', ')}]`)
		}
	}

	console.log(`\n最终结果: [${res.join(', ')}]`)
	return res
}


/**
 * 二叉树的最近公共祖先
 * https://leetcode.cn/problems/lowest-common-ancestor-of-a-binary-tree/description/?envType=study-plan-v2&envId=top-100-liked
 */

function findAncestor(root: TreeNode | null, p: TreeNode | null, q: TreeNode | null): TreeNode | null {
	// 递归终止条件：
	// 1. root 为空
	// 2. root 等于 p 或 q（找到目标节点）
	if (!root || root === p || root === q) return root

	// 在左子树找 p 或 q
	const left = findAncestor(root.left, p, q)
	// 在右子树找 p 或 q
	const right = findAncestor(root.right, p, q)

	// 情况分析：
	// left 和 right 都不为空 → p、q 分别在左右子树，root 就是 LCA
	// 只有 left 不为空 → p、q 都在左子树，返回 left
	// 只有 right 不为空 → p、q 都在右子树，返回 right
	// 都为空 → p、q 都不在这棵树里
	if (left && right) return root
	return left ?? right ?? null
}