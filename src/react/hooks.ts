import { useRef, useMemo, useEffect } from 'react'

type Fn = (...args: any) => any

/** 获取最近的值 */
function useLatest(val: any) {
	const ref = useRef(val)
	ref.current = val

	return ref.current
}


/** 持久化function，保证函数地址永不变化 */
function useMemoizedFn(fn: Fn) {

}

/** setInterval */
function useInterval(fn: Fn, delay?: number) {
	
}

/** setTimeout */
function useTimeout(fn: Fn, delay?: number) {

}

function useDebounceEffect() {

}

function useDebounceFn() {

}

function useThrottleEffect() {

}

function useThrottleFn() {
	
}