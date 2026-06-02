import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'

// 导入所有题目的代码（这些文件会打印到控制台）
import './js/debounce-throttle.js'
import './js/flat.ts'
import './react/new-features.ts'
import './react/hooks.ts'

// 页面组件
import JsPage from './js/JsPage'
import App from './react/reducer-context-list/index'
import HeavyRenderDemo from './react/profiler-demo/HeavyRenderDemo'
import VirtualListDemo from './react/virtual-list-demo/VirtualListDemo'
import CssTypewriter from './browser/css'
import AiChatDemo from './react/ai-chat'

console.log('=== Code School 面试题目集 ===')

function Home() {
	return (
		<div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
			<h1 style={{ textAlign: 'center', marginBottom: '40px' }}>Code School - 面试笔试题</h1>

			<div style={{ display: 'grid', gap: '20px' }}>
				<RouteCard title="动态规划 DP" path="/dp" description="背包问题、滑雪问题、斐波那契数列等经典DP问题" />
				<RouteCard title="JavaScript 核心" path="/js" description="事件循环、防抖节流、闭包、原型链等" />
				<RouteCard title="链表" path="/linked-list" description="LRU缓存、链表操作" />
				<RouteCard title="React 进阶" path="/react" description="Hooks、Context、性能优化、虚拟列表" />
			</div>

			<h2 style={{ marginTop: '40px', marginBottom: '20px' }}>专项 Demo</h2>
			<ul style={{ lineHeight: '2' }}>
				<li><Link to="/task-list">Task List (useReducer + Context)</Link></li>
				<li><Link to="/profiler-demo">Profiler 渲染卡顿复现</Link></li>
				<li><Link to="/virtual-list">虚拟列表滚动</Link></li>
				<li><Link to="/css-typewriter">CSS 打字机效果</Link></li>
				<li><Link to="/ai-chat">AI 流式对话</Link></li>
				<li><a href="/vue.html">Vue 3 Todo List (Composition API)</a></li>
			</ul>
		</div>
	)
}

function RouteCard({ title, path, description }: { title: string; path: string; description: string }) {
	return (
		<Link to={path} style={{ textDecoration: 'none', color: 'inherit' }}>
			<div
				style={{
					border: '1px solid #ddd',
					borderRadius: '12px',
					padding: '20px',
					cursor: 'pointer',
					transition: 'box-shadow 0.2s, transform 0.2s',
				}}
				onMouseEnter={(e) => {
					e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
					e.currentTarget.style.transform = 'translateY(-2px)'
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.boxShadow = 'none'
					e.currentTarget.style.transform = 'none'
				}}
			>
				<h2 style={{ margin: '0 0 10px 0', color: '#4a90e2' }}>{title}</h2>
				<p style={{ margin: 0, color: '#666' }}>{description}</p>
			</div>
		</Link>
	)
}

function ReactPage() {
	return (
		<div style={{ padding: '20px' }}>
			<h1>React 进阶</h1>

			<div style={{ display: 'grid', gap: '20px', marginBottom: '30px' }}>
				<div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
					<h3>useReducer + Context</h3>
					<p>状态管理模式，替代 Redux 的轻量方案</p>
					<Link to="/task-list">
						<button style={buttonStyle}>打开 Demo</button>
					</Link>
				</div>

				<div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
					<h3>Profiler 渲染性能</h3>
					<p>复现并分析渲染性能问题</p>
					<Link to="/profiler-demo">
						<button style={buttonStyle}>打开 Demo</button>
					</Link>
				</div>

				<div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
					<h3>虚拟列表</h3>
					<p>大数据量列表的优化方案</p>
					<Link to="/virtual-list">
						<button style={buttonStyle}>打开 Demo</button>
					</Link>
				</div>
			</div>

			<div>
				<h3>相关链接</h3>
				<ul>
					<li><a href="https://react.dev/learn" target="_blank" rel="noopener">React 官方文档</a></li>
				</ul>
			</div>
		</div>
	)
}

const buttonStyle: React.CSSProperties = {
	padding: '8px 16px',
	backgroundColor: '#4a90e2',
	color: 'white',
	border: 'none',
	borderRadius: '4px',
	cursor: 'pointer',
}

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/js" element={<JsPage />} />
				<Route path="/react" element={<ReactPage />} />
				<Route path="/task-list" element={<App />} />
				<Route path="/profiler-demo" element={<HeavyRenderDemo />} />
				<Route path="/virtual-list" element={<VirtualListDemo />} />
				<Route path="/css-typewriter" element={<CssTypewriter />} />
				<Route path="/ai-chat" element={<AiChatDemo />} />
			</Routes>
		</BrowserRouter>
	</React.StrictMode>
)
