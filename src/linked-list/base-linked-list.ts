/**
 * 基本链表
 */
export class LinkedList<T> {
	private _key: string
	private _value: T

	public prev: LinkedList<T> | null = null

	public next: LinkedList<T> | null = null

	constructor(key: string, value: T) {
		this._key = key
		this._value = value
	}
	
	public get key() {
		return this._key
	}

	public get value() {
		return this._value
	}
}