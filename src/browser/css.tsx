import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './css.less'

// ==================== CSS 打字机 ====================
// 原理：JS 动态计算每行字符数，设置 animation-duration
// CSS steps(1) 逐字符显示，clip-path 从右向左切出
const CSS_LINES = [
  '这是第一行文字，包含中英文混合',
  '第二行 - 支持换行！',
  '第三行：Hello World 2024',
]

function useCssTypewriter(lines: string[]) {
  const lineRefs = useRef<(HTMLSpanElement | null)[]>([])

  useEffect(() => {
    const CHAR_SPEED = 0.1 // 每字符 0.1s
    lineRefs.current.forEach((el, i) => {
      if (!el) return
      const len = lines[i].length
      // steps(N+1): N 个字符需要 N+1 步（0→1→2→...→N）
      el.style.animationTimingFunction = `steps(${len + 1})`
      el.style.animationDuration = `${len * CHAR_SPEED}s`
    })
  }, [lines])

  return { lineRefs }
}

function CssTypewriterDemo() {
  const { lineRefs } = useCssTypewriter(CSS_LINES)

  return (
    <div className="typewriter-css">
      {CSS_LINES.map((line, i) => (
        <p key={i}>
          <span
            className="line"
            ref={(el) => { lineRefs.current[i] = el }}
          >
            {line}
          </span>
        </p>
      ))}
    </div>
  )
}

// ==================== JS 打字机 ====================
// 原理：setInterval 逐字追加到 state，光标闪烁独立运行
function useJsTypewriter(text: string, speed = 80) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const idxRef = useRef(0)

  useEffect(() => {
    if (displayed.length === text.length) {
      setDone(true)
      return
    }
    const timer = setTimeout(() => {
      setDisplayed(text.slice(0, idxRef.current + 1))
      idxRef.current++
    }, speed)
    return () => clearTimeout(timer)
  }, [displayed, text, speed])

  return { displayed, done }
}

function JsTypewriterDemo() {
  const text = 'JavaScript 实现的打字机效果，支持任意文本内容～'
  const { displayed, done } = useJsTypewriter(text)

  return (
    <div className="typewriter-js">
      <span>{displayed}</span>
      {!done && <span className="cursor" />}
    </div>
  )
}

// ==================== 主组件 ====================
export default function CssTypewriter() {
  return (
    <div className="container">
      <h1>Typewriter Effect</h1>
      <Link to="/">
        <button className="back-btn">返回首页</button>
      </Link>

      <h2>1. CSS 打字机（clip-path + JS 动态 duration）</h2>
      <CssTypewriterDemo />

      <h2>2. JS 打字机（setTimeout 逐字追加）</h2>
      <JsTypewriterDemo />
    </div>
  )
}
