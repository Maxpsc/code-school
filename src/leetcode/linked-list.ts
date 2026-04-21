export class ListNode {
	val: number
	next: ListNode | null
	constructor(val?: number, next?: ListNode | null) {
       this.val = (val===undefined ? 0 : val)
			this.next = (next===undefined ? null : next)
	}
}

/**
 * 反向链表
 * https://leetcode.cn/problems/reverse-linked-list/?envType=study-plan-v2&envId=top-100-liked
 */
function reverseList(head: ListNode | null): ListNode | null {
	if (!head || !head.next) return head
	
	const nHead = reverseList(head.next)
	const tail = head.next
	tail.next = head
	head.next = null
	return nHead
}



/**
 * 环形链表-判断链表中是否有环
 * https://leetcode.cn/problems/linked-list-cycle/description/?envType=study-plan-v2&envId=top-100-liked
 */
function hasCycle(head: ListNode | null): boolean {
	if (!head) return false
	const arr = [] as ListNode[]
	let cur = head
	while (cur.next) {
		if (arr.includes(cur.next)) return true
		arr.push(cur)
		cur = cur.next
	}
	return false
}


/**
 * 合并两个有序链表
 * https://leetcode.cn/problems/merge-two-sorted-lists/description/?envType=study-plan-v2&envId=top-100-liked
 */
function mergeTwoLists(list1: ListNode | null, list2: ListNode | null): ListNode | null {
  if (!list1) return list2
	if (!list2) return list1
	
	if (list1.val < list2.val) {
		list1.next = mergeTwoLists(list1.next, list2)
		return list1
	} else {
		list2.next = mergeTwoLists(list1, list2.next)
		return list2
	}
};