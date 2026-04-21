const eventSource = new EventSource('/api/sse')

eventSource.onopen = () => {
  console.log('SSE connected')
}

eventSource.onmessage = (event) => {
  console.log('Message:', event.data)
}

eventSource.addEventListener('custom-event', (event) => {
  console.log('Custom event data:', (event as MessageEvent).data)
})

eventSource.onerror = (error) => {
  console.error('SSE error:', error)
  eventSource.close()
}
