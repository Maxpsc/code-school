const store: Record<string, number> = {}
const getKey = (...keys: number[]) => keys.join(',')

const createDeepProxy = (keys: number[] = []): any => {
  return new Proxy(() => {}, {
    apply(_t, _ta, args) {
      const key = getKey(...keys, ...args)
      return store[key] ?? 0
    },
    get(target, prop) {
      if (prop === Symbol.iterator) return undefined
      if (prop === 'length') return Infinity
      if (prop === 'valueOf') {
        const key = getKey(...keys)
        return () => store[key] ?? 0
      }
      if (typeof prop === 'symbol') return undefined
      const num = Number(prop)
      if (isNaN(num)) return undefined
      return createDeepProxy([...keys, num])
    }
  })
}

const a: any = createDeepProxy()

store['1,2'] = 3
store['1,2,3'] = 6
store['100,200,300'] = 600

console.log(a[1][2] + 3)           // 6
console.log(a[1][2][3] + 4)        // 10
console.log(a[100][200][300] + 400) // 1000
