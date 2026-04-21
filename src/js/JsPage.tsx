import { useState } from 'react'
import EventLoopDemo from './event-loop'

/**
 * 函数防抖
 * 某个时间段内无论触发多少次，都只执行最后一次
 * immediate=true 表示立即执行
 */
function debounce(cb: Function, wait = 500, immediate = false) {
  let timer: ReturnType<typeof setTimeout> | null = null
  return function (this: unknown) {
    if (timer) clearTimeout(timer)
    const ctx = this
    const args = arguments

    if (!timer && immediate) {
      cb.apply(ctx, args)
    }
    timer = setTimeout(function () {
      cb.apply(ctx, args)
    }, wait)
  }
}

/**
 * 函数节流
 * 在固定时间间隔触发，忽略多次触发
 * leading: true 首次触发
 * trailing: true 结束时触发
 */
function throttle(fn: Function, wait: number, leading = true, trailing = true) {
  let timer: ReturnType<typeof setTimeout> | null = null
  return function (this: unknown) {
    const ctx = this
    const args = arguments
    if (!timer) {
      leading && fn.apply(ctx, args)
      timer = setTimeout(function () {
        timer = null
        trailing && fn.apply(ctx, args)
      }, wait)
    }
  }
}

export default function JsPage() {
  const [showEventLoop, setShowEventLoop] = useState(false)
  const [debounceCount, setDebounceCount] = useState(0)
  const [throttleCount, setThrottleCount] = useState(0)

  const handleDebounce = debounce(() => {
    setDebounceCount((c) => c + 1)
    console.log('Debounce 执行了!')
  }, 300)

  const handleThrottle = throttle(() => {
    setThrottleCount((c) => c + 1)
    console.log('Throttle 执行了!')
  }, 300)

  const triggerBoth = () => {
    handleDebounce()
    handleThrottle()
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>JavaScript 核心机制</h1>

      <div style={{ marginBottom: '30px' }}>
        <h2>防抖与节流</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* 防抖 */}
          <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
            <h3>函数防抖 (Debounce)</h3>
            <p>某个时间段内无论触发多少次，都只执行最后一次</p>
            <p>300ms 内连续点击只会执行一次</p>
            <button onClick={triggerBoth} style={buttonStyle}>
              连续点击测试 (防抖 + 节流)
            </button>
            <p>防抖执行次数: <strong>{debounceCount}</strong></p>
          </div>

          {/* 节流 */}
          <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
            <h3>函数节流 (Throttle)</h3>
            <p>在固定时间间隔触发，忽略多次触发</p>
            <p>300ms 内只会执行一次</p>
            <button onClick={triggerBoth} style={buttonStyle}>
              连续点击测试 (防抖 + 节流)
            </button>
            <p>节流执行次数: <strong>{throttleCount}</strong></p>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2>事件循环 (Event Loop)</h2>
        <button
          onClick={() => setShowEventLoop(!showEventLoop)}
          style={{ ...buttonStyle, marginBottom: '15px' }}
        >
          {showEventLoop ? '隐藏' : '显示'} 事件循环演示
        </button>
        {showEventLoop && <EventLoopDemo />}
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2>代码示例</h2>
        <pre style={codeStyle}>{`/**
 * 函数防抖
 */
export function debounce(cb, wait = 500, immediate = false) {
  let timer
  return function() {
    timer && clearTimeout(timer)
    const ctx = this
    const args = arguments

    if (!timer && immediate) {
      cb.apply(ctx, args)
    }
    timer = setTimeout(function() {
      cb.apply(ctx, args)
    }, wait)
  }
}

/**
 * 函数节流
 */
export function throttle(fn, wait, leading = true, trailing = true) {
  let timer
  return function() {
    const ctx = this
    const args = arguments
    if (!timer) {
      leading && fn.apply(ctx, args)
      timer = setTimeout(function() {
        timer = null
        trailing && fn.apply(ctx, args)
      }, wait)
    }
  }
}`}</pre>
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

const codeStyle: React.CSSProperties = {
  backgroundColor: '#2d2d2d',
  color: '#f8f8f2',
  padding: '15px',
  borderRadius: '5px',
  overflow: 'auto',
}
