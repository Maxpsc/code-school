import { useRef, useEffect, useState, useCallback, memo } from "react";
import "./index.less";

// ==================== 类型定义 ====================
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface Props {
  messages: Message[];
  streamingText?: string;
}

// ==================== 子组件 ====================
const MemoMessageItem = memo(function MemoMessageItem({
  message,
}: {
  message: Message;
}) {
  const isUser = message.role === "user";

  return (
    <div className={`message-item ${isUser ? "user" : "assistant"}`}>
      <div className="message-avatar">
        {isUser ? "👤" : "🤖"}
      </div>
      <div className="message-content">
        <div className="message-bubble">{message.content}</div>
        <div className="message-time">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
});

function StreamingMessage({ text }: { text: string }) {
  return (
    <div className="message-item assistant">
      <div className="message-avatar">🤖</div>
      <div className="message-content">
        <div className="message-bubble streaming">
          {text}
          <span className="cursor" />
        </div>
      </div>
    </div>
  );
}

// ==================== ChatList 核心组件 ====================
function ChatList({ messages, streamingText }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // 1. 监听用户是否还在底部
  useEffect(() => {
    const root = containerRef.current;
    const target = bottomRef.current;
    if (!root || !target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
				console.log(111, entry)
				setShouldAutoScroll(entry.isIntersecting)
			},
      { root, threshold: 1 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  // 2. 流式更新时，只有允许自动跟随才滚动
  useEffect(() => {
    if (!shouldAutoScroll) return;

    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({
        block: "end",
        behavior: "auto",
      });
    });
  }, [messages, streamingText, shouldAutoScroll]);

  return (
    <div ref={containerRef} className="chat-list">
      {messages.map((m) => (
        <MemoMessageItem key={m.id} message={m} />
      ))}

      {streamingText ? <StreamingMessage text={streamingText} /> : null}

      <div ref={bottomRef} />

      {!shouldAutoScroll && (
        <button
          className="scroll-to-bottom"
          onClick={() => {
            bottomRef.current?.scrollIntoView({
              block: "end",
              behavior: "smooth",
            });
          }}
        >
          ↓ 回到底部
        </button>
      )}
    </div>
  );
}

// ==================== Demo: Mock 流式 AI 对话 ====================
const MOCK_RESPONSES = [
  "这是一条模拟的AI回复，会逐字显示出来。",
  "你好！有什么可以帮助你的吗？我可以回答各种问题。",
  "React 的 useEffect 会在组件挂载后执行，返回的清理函数会在卸载时调用。",
];

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function* createStream(text: string) {
  for (const char of text) {
    yield char;
  }
}

export default function AiChatDemo() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: generateId(),
      role: "assistant",
      content: "你好！我是 AI 助手，可以模拟流式输出。试着发送消息吧！",
      timestamp: Date.now() - 60000,
    },
  ]);
  const [input, setInput] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const streamRef = useRef<Generator<string> | null>(null);
  const timerRef = useRef<number | null>(null);

  const startStream = useCallback((text: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current = createStream(text);
    setStreamingText("");

    timerRef.current = window.setInterval(() => {
      const result = streamRef.current?.next();
      if (result?.done) {
        clearInterval(timerRef.current!);
        timerRef.current = null;
        setStreamingText("");
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: "assistant",
            content: text,
            timestamp: Date.now(),
          },
        ]);
        streamRef.current = null;
      } else {
        setStreamingText((prev) => prev + result?.value);
      }
    }, 40);
  }, []);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // 模拟 AI 响应（随机选一条）
    const mockResponse =
      MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
    setTimeout(() => startStream(mockResponse), 300);
  }, [input, startStream]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h2>AI 流式对话</h2>
      <ChatList messages={messages} streamingText={streamingText} />
      <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="输入消息..."
          style={{
            flex: 1,
            padding: "10px 14px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            fontSize: "14px",
          }}
        />
        <button
          onClick={handleSend}
          style={{
            padding: "10px 20px",
            background: "#4a90e2",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          发送
        </button>
      </div>
    </div>
  );
}
