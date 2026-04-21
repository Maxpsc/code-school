import { useRef, useEffect, useCallback, useState } from 'react'

type Fn = (...args: any) => any

/** 获取最新的值 */
export function useLatest<T>(val: T) {
	const ref = useRef(val)
	ref.current = val
	return ref
}

/** 持久化 function，保证函数地址永不变化 */
export function useMemoizedFn<T extends Fn>(fn: T): T {
	const fnRef = useRef(fn)
	fnRef.current = fn

	const memoizedFn = useCallback((...args: any[]) => {
		return fnRef.current(...args)
	}, []) as T

	return memoizedFn
}

/** setInterval */
export function useInterval(fn: Fn, delay?: number) {
	const fnRef = useRef(fn)

	useEffect(() => {
		if (delay === undefined) return
		fnRef.current = fn
		const id = setInterval(() => fnRef.current(), delay)
		return () => clearInterval(id)
	}, [delay])

	useEffect(() => {
		const id = setInterval(() => fnRef.current(), delay)
		return () => clearInterval(id)
	}, [])
}

/** setTimeout */
export function useTimeout(fn: Fn, delay?: number) {
	const fnRef = useRef(fn)

	useEffect(() => {
		if (delay === undefined) return
		fnRef.current = fn
		const id = setTimeout(() => fnRef.current(), delay)
		return () => clearTimeout(id)
	}, [delay])
}


/** 
 * debounce
 * value更新后，delay一段时间若无更新，则真正触发
 */
  export function useDebounce<T>(value: T, delay: number): T {
		const [debouncedValue, setDebouncedValue] = useState<T>(value)

		useEffect(() => {
				if (delay <= 0) {
						setDebouncedValue(value)
						return
				}

				const timer = setTimeout(() => {
						setDebouncedValue(value)
				}, delay)

				return () => clearTimeout(timer)
		}, [value, delay])

		return debouncedValue
}

/**
 * debounce 函数
 * 多次调用只会在 delay 后执行一次
 */
export function useDebounceFn<T extends (...args: any[]) => any>(fn: T, delay: number): T {
	const fnRef = useRef(fn)
	const timer = useRef<number | null>(null)

	fnRef.current = fn
	const debouncedFn = useCallback((...args: any[]) => {
		if (timer.current) {
			clearTimeout(timer.current)
		}
		timer.current = setTimeout(() => {
			fnRef.current?.(...args)
		}, delay) as unknown as number
	}, [delay]) as T
	return debouncedFn
}