class EventEmitter {
	private _events: Map<string, Function[]> = new Map()
	
	public on(name: string, cb: Function) {
		if (this._events.get(name)) {
			this._events.get(name)?.push(cb)
		} else {
			this._events.set(name, [cb])
		}
	}
	public off(name: string, cb: Function) {
		if (!this._events.get(name)) return
		this._events.set(name, this._events.get(name)?.filter(i => i !== cb) ?? [])
	}
	public emit(name: string, ...payload: any[]) {
		const events = this._events.get(name)
		if (events?.length) {
			events.forEach(cb => {
				cb(...payload)
			})
		}
	}
	public clear(name: string) {
		this._events.delete(name)
	}
}