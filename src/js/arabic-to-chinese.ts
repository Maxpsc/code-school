const DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九']
const UNITS = ['', '十', '百', '千']
const HIGH_UNITS = ['', '万', '亿']

export function arabicToChinese(num: number | string): string {
  const n = typeof num === 'string' ? parseInt(num, 10) : num
  if (isNaN(n)) return '不是有效数字'
  if (n === 0) return '零'

  const str = Math.abs(n).toString()
  const len = str.length

  const chunks: string[] = []
  for (let i = len; i > 0; i -= 4) {
    chunks.unshift(str.slice(Math.max(0, i - 4), i))
  }

  const parts: string[] = []
  let pendingZero = false

  for (let i = 0; i < chunks.length; i++) {
    const chunkVal = parseInt(chunks[i])
    const highUnit = HIGH_UNITS[chunks.length - i - 1]

    let chunkResult = ''
    for (let j = 0; j < chunks[i].length; j++) {
      const d = parseInt(chunks[i][j])
      if (d !== 0) {
        chunkResult += DIGITS[d] + UNITS[chunks[i].length - j - 1]
      } else if (chunkResult.length > 0 && !chunkResult.endsWith('零')) {
        chunkResult += '零'
      }
    }
    chunkResult = chunkResult.replace(/零+$/, '')

    if (chunkVal !== 0) {
      if (parts.length > 0 && (chunkVal < 1000 || pendingZero)) parts.push('零')
      parts.push(chunkResult + highUnit)
      pendingZero = false
    } else if (highUnit && chunks.slice(i + 1).some(c => parseInt(c) !== 0)) {
      pendingZero = true
    }
  }

  let result = parts.join('').replace(/零+/g, '零').replace(/^零+|零+$/g, '')
  result = result.replace(/^一十/, '十')
  return result
}
