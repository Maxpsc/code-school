import { useState, useEffect } from 'react'

interface LogEntry {
  id: number
  type: 'macro' | 'micro' | 'sync'
  label: string
  order: number
}


export default function EventLoopDemo() {
  const [displayLogs, setDisplayLogs] = useState<LogEntry[]>([])

  const runDemo = async () => {
    setDisplayLogs([])

    // 1. 同步代码首先执行
    console.log('1. 同步代码')

    // 2. 微任务 - Promise.then
    Promise.resolve().then(() => {
      console.log('3. Promise.then (微任务)')
      setTimeout(() => {
        console.log('9. 微任务回调发起的 setTimeout (宏任务)')
      }, 0)
    })

    // 3. 宏任务 - setTimeout
    setTimeout(() => {
      console.log('7. setTimeout (宏任务)')
      Promise.resolve().then(() => {
        console.log('8. 宏任务回调发起的 Promise.then (微任务)')
      })
    }, 0)

    // 4. 微任务 - queueMicrotask
    queueMicrotask(() => {
      console.log('4. queueMicrotask (微任务)')
    })

    // 5. 微任务 - Promise.resolve().then().then() 链式调用
    Promise.resolve()
      .then(() => {
        console.log('5. Promise.then 链式 1 (微任务)')
      })
      .then(() => {
        console.log('6. Promise.then 链式 2 (微任务)')
      })

    // 6. 同步代码继续
    console.log('2. 同步代码')

    // 等待下一个微任务检查点更新UI
    await Promise.resolve()
    setDisplayLogs([...logs])

    // 等待宏任务执行
    setTimeout(() => {
      setDisplayLogs([...logs])
    }, 10)
  }

  useEffect(() => {
    // runDemo()
  }, [])

  const getTypeStyle = (type: 'macro' | 'micro' | 'sync') => {
    switch (type) {
      case 'macro':
        return { backgroundColor: '#ff6b6b', color: 'white' }
      case 'micro':
        return { backgroundColor: '#4ecdc4', color: 'white' }
      case 'sync':
        return { backgroundColor: '#45b7d1', color: 'white' }
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>JavaScript 事件循环机制</h2>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={runDemo}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer',
            backgroundColor: '#4a90e2',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
          }}
        >
          重新运行演示
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>任务类型说明</h3>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <span style={{ ...getTypeStyle('sync'), padding: '5px 10px', borderRadius: '3px' }}>
            同步代码 (Sync)
          </span>
          <span style={{ ...getTypeStyle('micro'), padding: '5px 10px', borderRadius: '3px' }}>
            微任务 (Microtask) - Promise.then, queueMicrotask
          </span>
          <span style={{ ...getTypeStyle('macro'), padding: '5px 10px', borderRadius: '3px' }}>
            宏任务 (Macrotask) - setTimeout, setInterval, I/O
          </span>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>执行顺序</h3>
        <p>1. 同步代码立即执行</p>
        <p>2. 所有微任务在同步代码结束后立即执行</p>
        <p>3. 宏任务等待微任务清空后执行</p>
        <p>4. 每执行完一个宏任务后，会检查是否有新的微任务</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>运行日志</h3>
        <div
          style={{
            border: '1px solid #ddd',
            borderRadius: '5px',
            padding: '15px',
            maxHeight: '400px',
            overflowY: 'auto',
            backgroundColor: '#f8f9fa',
          }}
        >
          {displayLogs.map((log) => (
            <div
              key={log.id}
              style={{
                padding: '8px 12px',
                marginBottom: '5px',
                borderRadius: '3px',
                ...getTypeStyle(log.type),
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>
                {log.label}
              </span>
              <span style={{ fontSize: '12px', opacity: 0.8 }}>
                {log.type === 'macro' ? '宏任务' : log.type === 'micro' ? '微任务' : '同步'}
              </span>
            </div>
          ))}
          {displayLogs.length === 0 && <p style={{ color: '#666' }}>点击按钮开始演示...</p>}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>代码示例</h3>
        <pre
          style={{
            backgroundColor: '#2d2d2d',
            color: '#f8f8f2',
            padding: '15px',
            borderRadius: '5px',
            overflow: 'auto',
          }}
        >{`// 事件循环执行顺序示例
async function eventLoopDemo() {
  console.log('1. 同步代码 start')

  Promise.resolve().then(() => {
    console.log('3. Promise.then (微任务)')
  })

  setTimeout(() => {
    console.log('5. setTimeout (宏任务)')
  }, 0)

  queueMicrotask(() => {
    console.log('4. queueMicrotask (微任务)')
  })

  console.log('2. 同步代码 end')

  // 等待微任务
  await Promise.resolve()

  // 等待宏任务
  setTimeout(() => {
    console.log('6. 最后一个 setTimeout')
  }, 0)
}`}</pre>
      </div>
    </div>
  )
}
