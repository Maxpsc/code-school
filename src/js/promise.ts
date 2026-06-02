//  * 22. 手写 Promise.all
// 考点：异步聚合、顺序保持、失败短路
function promiseAll(tasks: any[]) {
	return new Promise((resolve, reject) => {
		// 处理空数组的边界情况
		if (tasks.length === 0) {
			return resolve([])
		}

		let count = 0
		const result = [] as any[]

		tasks.forEach((task, i) => {
			// 使用 Promise.resolve 包裹，兼容传入非 Promise 的普通值的情况
			Promise.resolve(task)
				.then(res => {
					count += 1
					result[i] = res
					if (count === tasks.length) {
						resolve(result)
					}
				})
				.catch(reject) // 等价于 err => reject(err) 简写
		})
	})
}


// 23. 手写 Promise.race
// 考点：竞速语义、状态竞争
function promiseRace(tasks: any[]) {
	return new Promise((resolve, reject) => {
		for (const task of tasks) {
			// 同理，使用 Promise.resolve 处理非 Promise 元素
			Promise.resolve(task).then(resolve, reject)
		}
	})
}


// 24. 手写并发控制（limit pool / Myscheduler）
// 考点：任务队列、Promise 调度
// 这题这两年非常值得重点准备，既能考异步，又贴近工程场景。近年题单中也常把“并发限制 Promise”列为高频。

// 任务调度器
class MyScheduler {
	private maxConcurrent: number
	private runningCount: number
	private queue: (() => void)[]

	constructor(limit: number) {
		this.maxConcurrent = limit
		this.runningCount = 0
		this.queue = []
	}

	add(task: () => Promise<any>) {
		return new Promise((resolve, reject) => {
			// 包装原任务，使其在完成时可以自动调用下一个任务
			const runner = () => {
				this.runningCount++
				task()
					.then(resolve)
					.catch(reject)
					.finally(() => {
						this.runningCount--
						this.next()
					})
			}

			if (this.runningCount < this.maxConcurrent) {
				runner()
			} else {
				this.queue.push(runner)
			}
		})
	}

	private next() {
		if (this.queue.length > 0 && this.runningCount < this.maxConcurrent) {
			const nextTask = this.queue.shift()
			nextTask && nextTask()
		}
	}
}
// 调用示例
const scheduler = new MyScheduler(2)
const delay = (ms: number, name: string) => () =>
  new Promise(resolve => {
    console.log(`${name} start`)
    setTimeout(() => {
      console.log(`${name} done`)
      resolve(name)
    }, ms)
  })

scheduler.add(delay(1000, 'task1'))
scheduler.add(delay(500, 'task2'))
scheduler.add(delay(300, 'task3'))
scheduler.add(delay(200, 'task4'))
// 并发限制为 2，task1、task2 先执行，task3、task4 排队




class MySchedulerV2 {
	private _limit = 0
	private _runningCount = 0
	private queue = [] as any[]
	constructor(limit: number) {
		this._limit = limit
	}
	public add(task: () => Promise<any>) {
		return new Promise((resolve, reject) => {
			const runner = () => {
				this._runningCount += 1
				task().then((resolve)).catch(reject).finally(() => {
					this._runningCount -= 1
					this.next()
				})
			}
			if (this._runningCount < this._limit) {
				runner()
			} else {
				this.queue.push(runner)
			}
		})
	}

	private next() {
		if (this.queue.length && this._runningCount < this._limit) {
			const task = this.queue.shift()
			task?.()
		}
	}

}






class Task {
	limit = 0
	queue = [] as any[]
	current = 0
	constructor(limit: number) {
		this.limit = limit
	}

	add(task: () => Promise<any>) {
		return new Promise((resolve, reject) => {
			const runner = () => {
				this.current += 1
				task().then(resolve).catch(reject).finally(() => {
					this.current -= 1
					this.next()
				})
			}
			if (this.current < this.limit) {
				runner()
			} else {
				this.queue.push(runner)
			}
		})
	}
	next() {
		if (this.current < this.limit && this.queue.length) {
			const task = this.queue.shift()
			task?.()
		}
	}
}



class Scheduler {
	max = 0;
	current = 0;
	queue = []
	constructor(max: number) {
		this.max = max
		this.current = 0
		this.queue = []
	}
	add(task: () => Promise<any>) {
		return new Promise((resolve, reject) => {
			const runner = () => {
				this.current += 1
				task().then(resolve).catch(reject).finally(() => {
					
				})
			}
		})
	}
	next() {

	}
}