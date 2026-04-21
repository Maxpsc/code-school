import { useState, useRef, useCallback } from 'react'

/**
 * 虚拟列表 Demo
 *
 * 左侧: 普通长列表，渲染所有卡片，会卡顿
 * 右侧: 虚拟列表，只渲染可见区域的卡片，流畅
 */

const ITEM_COUNT = 10000 // 总数据量
const ITEM_HEIGHT = 120 // 每个卡片高度
const VISIBLE_COUNT = 10 // 可见区域卡片数

interface DataItem {
	id: number
	content: string
}

// 生成模拟数据
function generateData(count: number): DataItem[] {
	return Array.from({ length: count }, (_, i) => ({
		id: i,
		content: `卡片 ${i + 1}`,
	}))
}

// ==================== 普通长列表 (会卡顿) ====================
function NormalList({ data }: { data: DataItem[] }) {
	return (
		<div
			style={{
				overflow: 'auto',
				height: '100%',
				background: '#fff5f5',
			}}
		>
			{data.map(item => (
				<div
					key={item.id}
					style={{
						height: ITEM_HEIGHT,
						border: '1px solid #ffcccc',
						margin: '4px',
						padding: '10px',
						background: '#ffeeee',
						borderRadius: '8px',
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'center',
					}}
				>
					<h4 style={{ margin: '0 0 10px 0' }}>{item.content}</h4>
					<p style={{ margin: 0, color: '#666', fontSize: '12px' }}>
						这是第 {item.id + 1} 个卡片的内容描述，包含一些文本信息...
					</p>
					<div style={{ marginTop: '10px', fontSize: '11px', color: '#999' }}>
						ID: {item.id} | 渲染时间: {Date.now()}
					</div>
				</div>
			))}
		</div>
	)
}

// ==================== 虚拟列表 ====================
function VirtualList({ data, containerHeight }: { data: DataItem[]; containerHeight: number }) {
	const [scrollTop, setScrollTop] = useState(0)
	const scrollRef = useRef<HTMLDivElement>(null)

	
	// 计算可见范围
	const startIndex = Math.floor(scrollTop / ITEM_HEIGHT)
	const endIndex = Math.min(
		startIndex + VISIBLE_COUNT + 2, // 多渲染几个防止闪烁
		data.length
	)

	console.log(scrollTop, startIndex, endIndex)

	// 可见的数据
	const visibleData = data.slice(startIndex, endIndex)

	// 处理滚动
	const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
		setScrollTop(e.currentTarget.scrollTop)
	}, [])

	// 滚动容器样式
	const scrollContainerStyle: React.CSSProperties = {
		height: containerHeight,
		overflow: 'auto',
		background: '#f0ffee',
		position: 'relative',
	}

	// 内容容器样式 (用于撑开滚动区域)
	const contentStyle: React.CSSProperties = {
		height: data.length * ITEM_HEIGHT,
		position: 'relative',
	}

	// 可见区域样式
	const visibleStyle: React.CSSProperties = {
		position: 'absolute',
		top: startIndex * ITEM_HEIGHT,
		left: 0,
		right: 0,
	}

	return (
		<div
			ref={scrollRef}
			style={scrollContainerStyle}
			onScroll={handleScroll}
		>
			<div style={contentStyle}>
				<div style={visibleStyle}>
					{visibleData.map(item => (
						<div
							key={item.id}
							style={{
								height: ITEM_HEIGHT,
								border: '1px solid #ccffcc',
								margin: '4px',
								padding: '10px',
								background: '#eeffee',
								borderRadius: '8px',
								boxSizing: 'border-box',
								display: 'flex',
								flexDirection: 'column',
								justifyContent: 'center',
							}}
						>
							<h4 style={{ margin: '0 0 10px 0' }}>{item.content}</h4>
							<p style={{ margin: 0, color: '#666', fontSize: '12px' }}>
								这是第 {item.id + 1} 个卡片的内容描述，包含一些文本信息...
							</p>
							<div style={{ marginTop: '10px', fontSize: '11px', color: '#999' }}>
								ID: {item.id} | 虚拟渲染
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}

// ==================== 增强版虚拟列表 (动态高度) ====================
function VirtualListDynamicHeight({ data, containerHeight }: { data: DataItem[]; containerHeight: number }) {
	const [scrollTop, setScrollTop] = useState(0)
	const scrollRef = useRef<HTMLDivElement>(null)

	// 模拟动态高度 (有些卡片更高)
	const getItemHeight = (index: number) => {
		if (index % 10 === 0) return ITEM_HEIGHT * 1.5 // 每10个卡片高一点
		if (index % 7 === 0) return ITEM_HEIGHT * 0.8
		return ITEM_HEIGHT
	}

	// 计算累积高度
	const itemHeights = data.map((_, i) => getItemHeight(i))
	const cumulativeHeights = itemHeights.reduce<number[]>((acc, h, i) => {
		acc.push((acc[i - 1] || 0) + h)
		return acc
	}, [])
	const totalHeight = cumulativeHeights[cumulativeHeights.length - 1] || 0

	// 计算可见范围 (二分查找优化)
	const findStartIndex = (scrollTop: number): number => {
		let left = 0, right = cumulativeHeights.length - 1
		while (left < right) {
			const mid = Math.floor((left + right) / 2)
			if (cumulativeHeights[mid] < scrollTop) {
				left = mid + 1
			} else {
				right = mid
			}
		}
		return Math.max(0, left - 1)
	}

	const startIndex = findStartIndex(scrollTop)
	let endIndex = startIndex
	let accumulatedHeight = cumulativeHeights[startIndex]

	while (endIndex < data.length - 1 && accumulatedHeight < scrollTop + containerHeight + ITEM_HEIGHT) {
		endIndex++
		accumulatedHeight += getItemHeight(endIndex)
	}

	// 可见的数据
	const visibleData = data.slice(startIndex, endIndex + 1)

	const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
		setScrollTop(e.currentTarget.scrollTop)
	}, [])

	const contentStyle: React.CSSProperties = {
		height: totalHeight,
		position: 'relative',
	}

	const visibleStyle: React.CSSProperties = {
		position: 'absolute',
		top: (startIndex > 0 ? cumulativeHeights[startIndex - 1] : 0),
		left: 0,
		right: 0,
	}

	return (
		<div
			ref={scrollRef}
			style={{
				height: containerHeight,
				overflow: 'auto',
				background: '#eeeeff',
			}}
			onScroll={handleScroll}
		>
			<div style={contentStyle}>
				<div style={visibleStyle}>
					{visibleData.map((item, idx) => {
						const actualIndex = startIndex + idx
						return (
							<div
								key={item.id}
								style={{
									height: getItemHeight(actualIndex),
									border: '1px solid #ccccff',
									margin: '4px',
									padding: '10px',
									background: '#eeeeff',
									borderRadius: '8px',
									boxSizing: 'border-box',
								}}
							>
								<h4 style={{ margin: '0 0 10px 0' }}>{item.content} (动态高度)</h4>
								<p style={{ margin: 0, color: '#666', fontSize: '12px' }}>
									这是第 {item.id + 1} 个卡片，包含动态高度测试...
								</p>
							</div>
						)
					})}
				</div>
			</div>
		</div>
	)
}

// ==================== 主组件 ====================
export default function VirtualListDemo() {
	const [data] = useState(() => generateData(ITEM_COUNT))
	const [containerHeight, setContainerHeight] = useState(500)

	return (
		<div style={{ padding: '20px' }}>
			<h2>虚拟列表 Demo</h2>
			<p>左侧: 普通列表渲染 {ITEM_COUNT.toLocaleString()} 个卡片 (会卡顿)</p>
			<p>右侧: 虚拟列表只渲染可见区域 (流畅)</p>

			<div style={{ marginBottom: '10px' }}>
				<label>
					容器高度:
					<input
						type="range"
						min="300"
						max="800"
						value={containerHeight}
						onChange={e => setContainerHeight(Number(e.target.value))}
					/>
					{containerHeight}px
				</label>
			</div>

			<div style={{ display: 'flex', gap: '20px', height: containerHeight + 50 }}>
				<div style={{ flex: 1 }}>
					<h3 style={{ color: '#cc0000' }}>普通列表 (渲染 {ITEM_COUNT.toLocaleString()} 个 DOM)</h3>
					<div style={{ height: containerHeight, overflow: 'hidden', border: '2px solid #cc0000', borderRadius: '8px' }}>
						<NormalList data={data} />
					</div>
				</div>

				<div style={{ flex: 1 }}>
					<h3 style={{ color: '#008800' }}>虚拟列表 (只渲染 ~{VISIBLE_COUNT * 2 + 4} 个 DOM)</h3>
					<div style={{ height: containerHeight, overflow: 'hidden', border: '2px solid #008800', borderRadius: '8px' }}>
						<VirtualList data={data} containerHeight={containerHeight} />
					</div>
				</div>
			</div>

			<div style={{ marginTop: '30px' }}>
				<h3>进阶: 动态高度虚拟列表</h3>
				<p>支持不同高度的卡片项，使用二分查找优化</p>
				<div style={{ height: containerHeight, overflow: 'hidden', border: '2px solid #0000cc', borderRadius: '8px' }}>
					<VirtualListDynamicHeight data={data} containerHeight={containerHeight} />
				</div>
			</div>

			<div style={{ marginTop: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
				<h4>虚拟列表原理:</h4>
				<ol style={{ margin: '5px 0', lineHeight: '1.8' }}>
					<li>计算可视区域能显示多少个元素</li>
					<li>滚动时根据 scrollTop 计算起始索引</li>
					<li>只渲染可视区域内的元素 + 少量缓冲</li>
					<li>用 padding/margin 撑起滚动区域高度</li>
					<li>滚动时更新可视区域，复用 DOM 节点</li>
				</ol>
			</div>
		</div>
	)
}
