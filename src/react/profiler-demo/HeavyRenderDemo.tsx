import { useState, useMemo, useCallback, createContext, useContext } from 'react'

/**
 * 渲染卡顿复现 Demo
 *
 * 问题1: 在 render 中执行耗时计算，导致主线程阻塞
 * 问题2: 父组件状态更新导致所有子组件不必要的重新渲染
 * 问题3: Context  value 每次都是新对象，导致所有消费者重新渲染
 */

// ==================== 问题1: 耗时计算在渲染中 ====================
function HeavyComputation() {
	const [count, setCount] = useState(0)

	// 模拟在 render 中进行耗时计算
	function expensiveTask(n: number): number {
		let result = 0
		for (let i = 0; i < n * 10000000; i++) {
			result += Math.sqrt(i)
		}
		return result
	}

	// 每次状态更新都会触发耗时计算
	const computedValue = expensiveTask(count + 1)

	return (
		<div style={{ padding: '20px', border: '1px solid red', margin: '10px' }}>
			<h3>问题1: 渲染中执行耗时计算</h3>
			<p>count: {count}</p>
			<p>computed value: {computedValue.toFixed(0)}</p>
			<button onClick={() => setCount(c => c + 1)}>increment (会卡顿!)</button>
		</div>
	)
}

// ==================== 问题2: 不必要的子组件渲染 ====================
function ChildComponent({ name, value }: { name: string; value: number }) {
	console.log(`ChildComponent "${name}" rendered`)
	return (
		<div style={{ padding: '10px', background: '#f0f0f0', margin: '5px' }}>
			{name}: {value}
		</div>
	)
}

// 父组件 - 每次都会创建新对象
function ParentWithObjectProps() {
	const [count, setCount] = useState(0)

	// BUG: 每次渲染都创建新对象，导致 React 认为 props 变了
	const style = { color: 'blue' }
	const config = { theme: 'dark', size: 'large' }

	return (
		<div style={{ padding: '20px', border: '1px solid orange', margin: '10px' }}>
			<h3>问题2: props 传入新对象 (引用变化)</h3>
			<p>count: {count}</p>
			<p>style: {JSON.stringify(style)}, config: {JSON.stringify(config)}</p>
			<ChildComponent name="styled" value={count} />
			<ChildComponent name="configured" value={count} />
			{/* 每次点击都会触发这两个 ChildComponent 重新渲染，即使 name/value 没变 */}
			<button onClick={() => setCount(c => c + 1)}>increment (子组件不应重新渲染)</button>
		</div>
	)
}

// ==================== 问题3: Context value 是新对象 ====================
const HeavyContext = createContext<{ theme: string; toggle: () => void }>({
	theme: 'light',
	toggle: () => {},
})

function ContextConsumer({ label }: { label: string }) {
	const context = useContext(HeavyContext)
	console.log(`ContextConsumer "${label}" rendered`)
	return <div style={{ padding: '5px' }}>{label}: {context.theme}</div>
}

function ParentWithContextValue() {
	const [count, setCount] = useState(0)

	// BUG: 每次渲染都创建新对象
	const contextValue = {
		theme: count % 2 === 0 ? 'light' : 'dark',
		toggle: () => console.log('toggle'),
	}

	return (
		<div style={{ padding: '20px', border: '1px solid purple', margin: '10px' }}>
			<h3>问题3: Context value 每次都是新对象</h3>
			<p>count: {count}</p>
			<HeavyContext.Provider value={contextValue}>
				<ContextConsumer label="consumer1" />
				<ContextConsumer label="consumer2" />
				<ContextConsumer label="consumer3" />
				{/* 每次 count 变化，所有 Consumer 都会重新渲染 */}
			</HeavyContext.Provider>
			<button onClick={() => setCount(c => c + 1)}>toggle (消费者不应重新渲染)</button>
		</div>
	)
}

// ==================== 正常版本对比 ====================
function MemoizedChild({ name, value }: { name: string; value: number }) {
	console.log(`MemoizedChild "${name}" rendered (should NOT re-render)`)
	return (
		<div style={{ padding: '10px', background: '#e0ffe0', margin: '5px' }}>
			{name}: {value}
		</div>
	)
}

// 正确做法: 使用 useMemo 和 useCallback
function CorrectParent() {
	const [count, setCount] = useState(0)

	// 正确: 使用 useMemo 保持对象引用稳定
	const style = useMemo(() => ({ color: 'blue' }), [])
	const config = useMemo(() => ({ theme: 'dark', size: 'large' }), [])

	// 正确: 使用 useCallback 保持函数引用稳定
	const handleClick = useCallback(() => {
		console.log('clicked')
	}, [])

	return (
		<div style={{ padding: '20px', border: '1px solid green', margin: '10px' }}>
			<h3>正确做法: 使用 useMemo/useCallback 稳定引用</h3>
			<p>count: {count}</p>
			<p>style: {JSON.stringify(style)}, config: {JSON.stringify(config)}, handleClick: {typeof handleClick}</p>
			<MemoizedChild name="styled" value={count} />
			<button onClick={() => setCount(c => c + 1)}>increment (子组件不会重新渲染)</button>
		</div>
	)
}

// ==================== 主组件 ====================
export default function HeavyRenderDemo() {
	return (
		<div style={{ padding: '20px' }}>
			<h2>React Profiler - 渲染卡顿复现</h2>
			<p>打开 React DevTools Profiler，录制点击按钮后的渲染，分析哪些是不必要的渲染</p>

			<HeavyComputation />
			<ParentWithObjectProps />
			<ParentWithContextValue />
			<CorrectParent />

			<div style={{ marginTop: '20px', padding: '10px', background: '#eee' }}>
				<h4>如何复现:</h4>
				<ol>
					<li>打开 React DevTools → Profiler</li>
					<li>点击 "Record" 开始录制</li>
					<li>点击各区域的按钮</li>
					<li>停止录制，查看 renders 数量</li>
				</ol>
			</div>
		</div>
	)
}
