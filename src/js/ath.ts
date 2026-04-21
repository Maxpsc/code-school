/** 一个token管理器，freshToken用来获取token，当多个并发调用getToken，只取一次freshToken结果 */
function tokenManager(freshToken: () => Promise<string>) {
	let cachedToken: string | null = null
	let pendingPromise: Promise<string> | null = null

	return {
		async getToken() {
			if (cachedToken !== null) {
				return cachedToken
			}
			if (pendingPromise !== null) {
				return pendingPromise
			}
			pendingPromise = freshToken().then((token) => {
				cachedToken = token
				pendingPromise = null
				return token
			})
			return pendingPromise
		},
		invalidate() {
			cachedToken = null
			pendingPromise = null
		}
	}
}


/**
 * 实现一个arrange函数，进行工作和时间的调度
 * 如arrage('tom').wait(5).do('commit').execute()
 * tom is notified
		等待5s	
		start to commit
 */
function arrange(name) {
	const tasks = [] as any[]

	tasks.push(() => {
		console.log(`${name} is notified`)
	})

	async function execute() {
		for (const task of tasks) {
			await task()
		}
	}
	function wait(seconds) {
		tasks.push(() => new Promise(resolve => setTimeout(resolve, seconds * 1000)))
		return this
	}
	function doSth(sth) {
		tasks.push(() => {
			console.log(`start to ${sth}`)
		})
		return this
	}
	function waitFirst(seconds) {
		tasks.unshift(() => new Promise(resolve => setTimeout(resolve, seconds * 1000)))
		return this
	}
	return {
		execute,
		wait,
		waitFirst,
		do: doSth
	}
}

class Arrage {
	private _name: string
	private _tasks = [] as Array<() => Promise<any> | any>
	constructor(name: string) {
		this._name = name
		this._tasks.push(() => console.log(`${this._name} is notified`))
	}

	public async execute() {
		for (const task of this._tasks) {
			await task()
		}
	}
	public do(sth: string) {
		this._tasks.push(() => console.log(`start to ${sth}`))
		return this
	}
	public wait(duration: number) {
		this._tasks.push(() => new Promise(resolve => setTimeout(resolve, duration * 1000)))
		return this
	}
	public waitFirst(duration: number) {
		this._tasks.unshift(() => new Promise(resolve => setTimeout(resolve, duration * 1000)))
		return this
	}
}