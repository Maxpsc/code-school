

// https://juejin.cn/post/7004661323124441102

// 什么是微前端：
// 将不同的功能按照不同的维度拆成多个子应用，通过主应用来加载这些子应用；
// 目标是 将巨石应用 拆解成若干可以 自治的松耦合微应用，
// 将一个应用划分成若干个子应用，将子应用打包成一个个lib,当路由切换时加载不同的子应用，每个子应用是独立的，技术栈也不用做限制
// 三大核心原则： 独立运行、独立部署、独立开发
// 技术栈无关、环境隔离、消息通信、依赖复用

// 单实例：页面只存大一个子应用
// 多实例：当前页面有多个子应用

// 微前端实现方案
// 1. iframe: 每个子应用独立开发部署，通过iframe的方式将这些子应用嵌入到父应用中
//    优点：实现简单，子应用之间自带沙箱，天然隔离，互不影响
//    缺点：页面适配困难，依赖无法复用，资源开销大，通信困难
// 2. 路由基座式：微应用之间完全独立，统一由基座工程进行管理
//    代表： qiankun：不支持vite，拆分后的应用内容本身就小很多，webpack不会地项目造成太大的拖累
//          qiankun所解决的是微前端的运行时容器
//    优点：子应用独立构建，用户体验好，可控性强，适应快速迭代
//    缺点：学习与实现成本比较高，需要额外处理依赖复用
// 3. Webpack5模块联邦：去中心模式、去基座模式，每个应用单独部署在各自的服务器上，每个应用都可以引用其它应用，也可以被其它应用引用
//    代表：EMP
//    优点： 基于webpack5，无需引入新框架，学习成本低
//    缺点： 需要升级webpack5
// 4. WebComponent: 通过CustomEvent结合自定义的ShadowDom，将微前端封装成一个类WebComponent组件
//    代表： MicroApp


// CSS沙箱隔离的方案
// 1. BEM（Block Element Module）规范: 规范命名约束 （解决主子应用样式）
// 2. CSS-Modules构建时生成各自的作用域： 在打包的时候会自动将类名转换成 hash 值，完全杜绝 css 类名冲突的问题。（解决主子应用样式）
// 3. CSS in JS：用JS去写css,所有的css全在组件内部以此实现css模块化, styled-components 和 emotion （解决主子应用样式）
// 4. Shadow Dom 沙箱隔离: 为每个应用的容器包裹一个shadow dom节点，从而确保微应用的样式不会对全局造成影响 （解决主子应用样式）
// 5. Dynamic Stylesheet 动态样式表： 当应用切换时移除老应用样式，添加新应用样式 （解决子应用间样式问题）
// 6. postcss 增加命名空间

// JS沙箱隔离方案
// 1. proxy代理沙箱：微就用挂载的window是proxy代理出来的window，并不是真实的window，所以修改会被隔离掉
class ProxySandbox {
    constructor() {
        const rawWindow = window;
        const fakeWindow = {}
        const proxy = new Proxy(fakeWindow, {
            set(target, p, value) {
                target[p] = value;
                return true
            },
            get(target, p) {
                return target[p] || rawWindow[p];
            }
        });
        this.proxy = proxy
    }
}
let sandbox1 = new ProxySandbox();
let sandbox2 = new ProxySandbox();
window.a = 1;
((window) => {
    window.a = 'hello';
    console.log(window.a)
})(sandbox1.proxy);
((window) => {
    window.a = 'world';
    console.log(window.a)
})(sandbox2.proxy);

// 2.快照沙箱，在应用沙箱挂载或卸载时记录快照，在切换时依据快照恢复环境 (无法支持多实例)
// 不足： 1. 无法支持多实例，多应用同时改写window上的属性时，势必会出现状态混乱
// 2. 对window上的属性进行遍历，这是非常消耗性能的
class SnapshotSandbox {
    constructor() {
        this.proxy = window; 
        this.modifyPropsMap = {}; // 修改了那些属性
        this.active();
    }
    active() {
        this.windowSnapshot = {}; // window对象的快照
        for (const prop in window) {
            if (window.hasOwnProperty(prop)) {
                // 将window上的属性进行拍照
                this.windowSnapshot[prop] = window[prop];
            }
        }
        Object.keys(this.modifyPropsMap).forEach(p => {
            window[p] = this.modifyPropsMap[p];
        });
    }
    inactive() {
        for (const prop in window) { // diff 差异
            if (window.hasOwnProperty(prop)) {
                // 将上次拍照的结果和本次window属性做对比
                if (window[prop] !== this.windowSnapshot[prop]) {
                    // 保存修改后的结果
                    this.modifyPropsMap[prop] = window[prop]; 
                    // 还原window
                    window[prop] = this.windowSnapshot[prop]; 
                }
            }
        }
    }
}

// 获取微应用资源的方法：import-html-entry中的importEntry函数
// 做了几件事：一 是如何把资源获取到本地；二 如何处理这些资源
// 1. 调用fetch请求html资源（注意，不是js、css资源）；
// 2. 调用processTpl处理资源；
// 3. 调用getEmbedHTML对processTpl处理后的资源中链接的远程js、css资源取到本地并嵌入到html中 。

// 沙箱容器
// 三个对象： instance/mount/unmount

// 微前端通信方式：
// 1. 基于url： 使用简单但能力较弱，不适用于复杂的场景
// 2. 基于props: 适用于主子应用共享组件、公共方法等
// 3. 发布/订阅模式
// 4. 状态管理模式

// 采用iframe作为微前端解决方案的缺陷
// 使用iframe 会大幅增加内存和计算资源，因为 iframe 内所承载的页面需要一个全新并且完整的文档环境
// iframe 与上层应用并非同一个文档上下文导致
// 主应用劫持快捷键操作
// 事件无法冒泡顶层，针对整个应用统一处理时效
// 事件冒泡不穿透到主文档树上，焦点在子应用时，事件无法传递上一个文档流
// 跳转路径无法与上层文档同步，刷新丢失路由状态
// iframe 内元素会被限制在文档树中，视窗宽高限制问题
// iframe 登录态无法共享，子应用需要重新登录
// iframe 在禁用三方 cookie 时，iframe 平台服务不可用
// iframe 应用加载失败，内容发生错误主应用无法感知
// 难以计算出 iframe 作为页面一部分时的性能情况
// 无法预加载缓存 iframe 内容
// 无法共享基础库进一步减少包体积
// 事件通信繁琐且限制多

// 主子应用间的通信
// 1. initGlobalState: onGlobalStateChange/setGlobalState/offGlobalStateChange
// 2. 在主应用配置apps时以props将传递下去，子应用在生命周期获取props消费数据
// 应用间通信：
// 可以将方法和属性挂载到window上，就可以在应用间通信
// 如果主子应用全是vue, 可以在主应用中创建store(或者eventBus)，以props的形式传给子应用，这样所有子应用共用一个store

// MicroApp 是京东出的一款基于Web Component原生组件进行渲染的微前端框架
// 借鉴了WebComponent的思想，通过CustomEvent结合自定义的ShadowDom，将微前端封装成一个类WebComponent组件，从而实现微前端的组件化渲染

// WebComponent
// w3c 的 HTML 和 DOM 的特性，使得开发者可以创建可复用的组件
// 使用 Web Component 编写的组件是脱离框架的，换言之，也就是说使用 Web Component 开发的组件库，是适配所有框架的
// 1. 使用 template 属性来创建模板
// 2. 我们需要创建一个类: 查找模版内容，创建ShadowDom，再将模板添加到ShadowDom上
// 影子 DOM 的作用是将模板中的内容与全局 DOM 和 CSS 进行隔离，这样我们就可以实现元素和样式的私有化了
// 可以把影子 DOM 看成是一个作用域，其内部的样式和元素是不会影响到全局的样式和元素的

// Webpack5模块联邦：让多个独立构建的应用之间，动态的调用彼此的模块，跨应用间的模块共享
// 示例demo: https://segmentfault.com/a/1190000024449390
// 原理：宿主系统通过配置名称来引用远程模块，同时在编译阶段宿主系统是不需要了解远程模块的，仅在运行时通过加载远程模块的入口文件来实现
// 配置ModuleFederationPlugin
// 有两个主要概念： Host和Remote
// Host需要配置remote列表和shared模块
// Remote需要配置：项目名/打包方式/打包后的文件名/exposes提供的模块/shared共享的模块
// webpack编译阶段会把remotes里配置的模块忽略掉，避免将其打包进来
// shared里边定义的是依赖的公共库，避免重复加载

// lerna: A tool for managing JavaScript projects with multiple packages.
// link: https://juejin.cn/post/7136925215388499998
// 多种管理多packages javascript项目的方式, 自动解决packages之间的依赖关系, 通过git 检测文件改动，自动发布
// 两种模式：Locked mode 和 Independent Mode
// lerna + yarn workspace
// yarn workspace: 把所有依赖提升到顶层node_modules中，并在node_modules链到本地package,自动解决安装和link问题
// lerna init 生成package.json和lerna.json: package.json配置workspaces, lerna.json配置useWorkspaces为true
// lerna create <name> [location] 创建package，指定包名和安装位置
// yarn workspace 管理依赖
// yarn workspace packageB add packageA
// yarn workspaces add lodash
// yarn add -W -D typescript

// lerna changed: 原理需要先git add, git commit, 获取最新的 tag，然后用 git diff 获取自该 tag 以来有更新的文件，以此来确定有哪些需要发布的包。如果没有 tag，则认为全部的包都需要发布
// lerna published: 会打tag，上传git上传npm，如果你的包名带有scope，那需要在package.json中添加publicConfig， access:public

// commonjs 和 esm
// commonjs输出的是一个值的拷贝，esm输出的是一个值的引用
// commonjs是运行的时候加载，esm是编译时输出接口
// esm的import和export关键字在编译阶段就做了模块解析
// commonjs的require和module本质是函数或者对象，只有执行阶段运行时，这些函数和对象才被实例化，因此称为运行时加载
// commonjs是同步加载，esm是异步加载

// TreeShaking
// 静态分析是指在不动程序的条件下，进行程序分析的方法，ESM能做静态分析的原因是因为代码在引入前就已经确认了使用哪些库
// Treeshaking 是指一种依赖ESM模块静态分析实现的功能，可以在编译时安全地移除代码中未使用的部分
// 原理：程序从文件入口出发，扫描所有的模块依赖，以及模块的子依赖，将它链接起来形成抽像语法树AST,遍历抽象语法树看哪些代码未用到过，做好标记
// 最后，再将抽象语法树中没有用到的代码摇掉

// 什么是模块： 一个具有处理逻辑的js/ts文件，把相关的方法或对象进行导出，经过导入可以使用
// 模块化有什么作用：
// 1. 避免命名冲突；
// 2. 更好的分离按需加载
// 3. 高可复用性
// 4. 高可维护性
// 5. 分治
// import { foo } from 'antd' 按需导入方便打包工具做treeshaking

// import 和 require 导入的区别
// import是ESM模块，编译时调用，所以必须放在文件开头，是解构过程
// required是运行时调用，本质上是个赋值的过程，可以在任何地方调用

// AMD异步模块定义：主要用于浏览器，不支持静态程序分析，

// UMD： Universal Module Definition，跨平台的解决方案，同时在服务器端和浏览器端使用。
// 加载方式取决于所处的环境，node同步加载，浏览器异步加载

// commonjs 模块加载 esm 模块
// commonjs为什么不能加载esm模块，esm模块在import的时候是异步加载的，所以只要在commonjs中await，就可以实现commonjs的同步加载
import { startServer } from './bootstrap';
(async () => {
  await startServer()
})()

// 在esm中引入commonjs
// esm中是可以引入commonjs模块的，但只能整体加载不能局部加载

// Babel: 是一个javascript编译器，转译ECMASCRIPT 2015+的代码，使它在旧的浏览器环境中也能运行
// 转译分分三个过程： Parse解析/Transform转换/Generate代码生成
// babel的核心
// 1. parsing: @babel/parser 将源代码解析成ast,支持ESNext，Typescript，JSX等多种语法，不支持扩展
// 2. transforming @babel/traverse ast遍历器，实现了访问者模式，负责遍历、维护节点的状态与关联关系
// 3. printing @babel/generator
// babel插件的类型
// 语法插件 @babel/plugin-syntax-** 用于开启和配置Parser的某个功能特性
// 转换插件 对AST进行转换转换，实现转换为ES5代码、压缩、功能增强等目的，@babel/plugin-transform-**
// 预定义集合：@babel/preset-**, 插件集合或者分组，preset-react包含所有react相关插件
// 其它插件
// @babel/types: AST节点构造器和断言,插件开发时使用很频繁
// @babel/helper 辅助代码，单纯的语法转换可能无法让代码运行起来，比如低版本浏览器无法识别class关键字，这时候需要添加辅助代码，对class进行模拟
// 访问者模式
// 转换器操作AST一般是访问器模式，由这个访问者来进行统一的遍历操作，提供节点的操作方法，插件只需要定义自己感兴趣的节点，当访问者访问到该节点时就调用插件的visit方法

// git merge/rebase
// git merge 会将两个分支的提交按时间进行排序，并且会把最后两个commit合成一个commit,最后的分支呈现非线性结构
// merge: 是一种非破坏性的操作，但将产生一个额外的合并提交
// git rebase 将dev的当前提交复制到master的最新提交之后，会形成一个线性的分支树
// rebase: 通过为原始分支中的每个提交创建全新的 commits 来 重写 项目历史记录。
// git pull --rebase也是一样的，就是将自己的本地提交迁移后远端最后的commit之后
// git rebase的黄金法则：不要在公共分支上使用它

// git cherry-pick
// git cherry-pick commitHash 将指定的提交用于其它分支

// TanStack Query（ReactQuery）： 能够更高效的帮你管理服务端的状态，更新，缓存或重新获取

// SWR：state while revalidate
// 首先从缓存中取数据，然后再去真实地请求相应的数据，最后将缓存值和最新值作对比，如果缓存值与最新值相同，则不用更新，否则用新值来更新

// Vite：利用浏览器ESM特性导入组织代码，在服务端按需编译返回，服务器随起随用。
// link：https://juejin.cn/post/7064853960636989454
// 优点：
// 1. 冷启动快：No Bundle + esbuild预构建
// 2. 即时的模块热更新：基于ESM的HRM，同时利用浏览器缓存策略提升速度
// 3. 实现真正的按需加载
// webpack在启动的时候会构建项目模块的依赖图，如果项目中某个地方改动了代码，webpack会对相关依赖重新打包，随着项目增大，打包速度也会下降
// vite没有打包的过程而是启动了一个devServer，劫持浏览器的http请求，在后端进行相应的处理，将项目中使用到的文件通过简单的分离和整合，再返回给浏览器
// 热更新的原理：通过websocket创建浏览器和服务器的通信，监听文件的改变，当文件被修改时，服务端发送消息通知客户端修改相应的代码，客户端对不同的文件进行操作更新
// webpack还要重新再编译一次，vite无需打包，只需要请求更新后的模块重新加载
// 基于esbuild的依赖预编译优化：
// 为什么需要预构建： 1. 为了支持commonjs依赖：vite是基于浏览器原生支持ESM的能力实现的，但要求用户的代码必须是ESM模块，因此必须将Commonjs文件提前处理，转化为ESM模块；
// 2. 减少模块和请求数量：将内部模块的ESM依赖关系转换为单位模块，以提高后续页面性能，通过预构建 lodash-es 成为一个模块，也就只需要一个 HTTP 请求


// Typescript

// unknown: 不可预先定义的类型,可以替代any同时保留静态检查的能力，可以转化成任意类型，与any不同之处就是在静态编译的时候，unknown不能调用任何方法

// void与undefined功能类似，最大的区别是可以理解undefined是void的一个子集，当对函数的返回值不在意的时候可以用void

// never是指无法正常结束返回的类型，一个必定报错或者死循环的函数返回这样的类型，无法把其它类型赋值给never,any也不可以

// !非空断言运算符：用来强调对应的元素是非 null|undefined，特别适用于我们已经明确知道不会返回空值的场景，从而减少冗余的代码判断，如Ref
function Demo(): JSX.Elememt {
  const divRef = useRef<HTMLDivElement>();
  useEffect(() => {
    divRef.current!.scrollIntoView();	 // 当组件Mount后才会触发useEffect，故current一定是有值的
  }, []);
  return <div ref={divRef}>Demo</div>
}

// 可选链运算符?.：非空断言运算符作用于编译阶段的非空判断，而?.可选链可以用作运行时的非空判断
// a?.b 编译后会生成如下代码：
a === null || a === undefined ? void 0 : a.b

// 空值合并运算符??：左侧表达式结果为null或者undefined时，才会返回右侧表达式
let b = a ?? 10
let b = a !== null && a !== undefined ? a : 10

// 数字分隔符_：用来对长数字做任意的分隔，主要设计是为了便于数字的阅读，编译出来的代码是没有下划线的
let num: number = 1_2_345.6_78_9

// 健值获取keyof: 获取一个类型所有的键值，返回一个联合类型
type Person {
  name: string;
  age: number;
}
type PersonKey = keyof Person // 'name' | 'age'

// 实例类型获取typeof
const me: Person = {name: 'lsd', age: 30}
type P = typeof me // {name: string, age: number}

// 遍历属性 in: 对枚举类型进行遍历
// [ 自定义变量名 in 枚举类型 ]： 类型

// 泛型：继承了静态定义到动态调用的桥梁
// 泛型的语法格式：类型名<泛型列表> 具体类型定义
// 泛型约束： 泛型名 extends 类型
// 泛型条件： T extends U ? X : Y
// 泛型推断 infer：不用预先指定在泛型列表中，在运行时会自动判断，不过你得先预定义好整体的结构
type Foo<T> = T extends {t: infer Test} ? Test: string
// infer用来对满足的泛型类型进行子类型的抽取，

Partial<T>: 将泛型中全部属性变为可选
type Partial<T> = {
  [p in keyof T]?: T[p]
}

Record<K, T>: 将K中所有属性值转为T类型，通常用于申明一个普通对象
type Record<K extends keyof any, T> = {
  [key in K]: T
}
keyof any对应的类型为 string｜number | symbol

Pick < T, K > 将T类型中的K键列表提取出来，生成新的子键值对类型
type Pick<T, K extends keyof T> {
  [P in K]: T[P]
}

Exclude<T, U>：在T类型中去除T和U类型的交集，返回剩余的部分
type Exclude<T, U> = T extends U ? never : T


Omit<T, K>
type Omit<T, K> = Pick < T, Exclude<keyof T, K>

ReturnType<T>: 获取函数对应的返回值类型
type ReturnType<T entends (...args: any) => any> = T extends (...args: any) => infer R ? R : any

type Required<T> = { // 将类型中的所有属尾变为必选项
  [P in keyof T]-?: T[P]
}

// 偏好使用interface还是type来定义类型
// 从扩展的角度来说，type比interface方便扩展，只需要一个 &，而interface还需要extends
// type支持联合类型，interface不支持

// 判断一个类型是不是数组类型，如果是，就返回数组的元素类型
type Flatten<T> = T extends unknown[] ? T[number] : T
type Flatten<T> = T extends Array<infer Item> ? Item : T

// 转换为array
type ToArray<Type> = Type extends any ? Type[] : never
type StrArrOrNumArr = ToArray<string | number> // string[] | number[]


// TS类型体操： https://juejin.cn/post/7061556434692997156#heading-3
// 模式匹配: 实现字符串的增删改查和元组的增删改查
type A = [1, 2, 3]
type ExampleA = A extends [infer First, ...infer Rest] ? First : never
type B = '123'
type ExampleB = B extends `${infer FirstChar}${infer RestChar}` ? FirstChar : never

// 与或非
// And
type And<C1 extends boolean, C2 extends boolean> = C1 extends true ? C2 extends true ? true : false : false 
// Or
type Or<C1 extends boolean, C2 extends boolean> = C1 extends true ? true : C2 extends true ? true : false
// Not
type Not<C extends boolean> = C extends true ? false : true

// 判断左侧类型是否可以分配给右侧
type CheckLeftIsExtendsRight<T extends any, R extends any> = T extends R ? true : false
type Res1 = CheckLeftIsExtendsRight<{ name: 'lsd', age: 32 }, { name: 'lsd' }>
type Res2 = 1 | 2 extends 1 ? true : false
type Res3 = 1 extends 1 | 2 ? true : false

// 判断相等
type IsEqual<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false

// toString
type CanStringified = string | number | bigint | boolean | null | undefined
type Stringify<T extends CanStringified> = `${T}`
type Example1 = Stringify<0> // "0"
type Example2 = Stringify<-1> // "-1"
type Example3 = Stringify<0.1> // "0.1"
type Example4 = Stringify<"0.2"> // "0.2"
type Example5 = Stringify<undefined> // 'undefined'
type Example6 = Stringify<null> // 'null'

type NumberLike = number | `${number}`
// 判断是否为0
type IsZero<N extends NumberLike> = CheckLeftIsExtendsRight<N, 0 | '0'>

// GetChars 获取字符
type GetChars<S> = GetCharsHelper<S, never>
type GetCharsHelper<S, Acc> = S extends `${infer Char}${infer Rest}` ? GetCharsHelper<Rest, Char | Acc> : Acc
type GetCharsExa = GetChars<'abc'>

// Push： 在元祖后面插入一位
type Push<T extends unknown[], Item> = [...T, Item]

// Split: 分割字符串
// type Result = Split<'1,2,3', ','> // [1, 2, 3]
type SplitHelper<S extends string, SplitStr extends string = '', T extends string[] = []> = S extends `${infer Char}${SplitStr}${infer Rest}`
  ? SplitHelper<Rest, SplitStr, Push<T, Char>>
  : S extends string
  ? S extends ""
    ? T
    : Push<T, S>
  : never
type Split<S extends string, SplitStr extends string = ''> = SplitHelper<S, SplitStr>

// GetStringLength 获取字符串长度
type GetStringLength<S extends string> = Split<S>['length']

// CharAt: 获取字符串在索引位I下的字符
type CharAt<S extends string, I extends number> = Split<S>[I]

// Concat： 拼接两个字符串
type Concat<S1 extends string, S2 extends string> = `${S1}${S2}`

// Includes: 判断字符串是否包含子字符串
type Includes<S1 extends string, S2 extends string> = S1 extends `${infer Left}${S2}${infer Right}` ? true : false
type IncludesExam = Includes<'abcd', 'bc'>

// StartsWith: 判断字符串是否以子串开始
type StartsWith<S1 extends string, S2 extends string> = S1 extends `${S2}${infer Right}` ? true : false

// EndsWith：判断字符串是否以子串结束
type EndsWith<S1 extends string, S2 extends string> = S1 extends `${infer Left}${S2}` ? true : false

// IndexOf: 从左往右查找子串的位置
type IndexOfHelper<S1 extends string, S2 extends string> = S1 extends `${infer Left}${S2}${infer Right}` ? GetStringLength<Left> : -1
type IndexOf<S1 extends string, S2 extends string> = IndexOfHelper<S1, S2>

// LastIndexOf：从右往左查找子串的位置
type LastIndexOfHelper<S1 extends string, S2 extends string> = S1 extends `${infer Left}${S2}${infer Right}` ? GetStringLength<Right> : -1
type LastIndexOf<S1 extends string, S2 extends string> = LastIndexOfHelper<S1, S2>

// Replace: 在字符串查找并替换一处子串
type Replace<S extends string, MatchStr extends string, ReplaceStr extends string> = S extends `${infer Left}${MatchStr}${infer Right}`? 
  `${Left}${ReplaceStr}${Right}` : S

// ReplaceAll: 在字符串中查找并替换所有子串
type ReplaceAll<S extends string, MatchStr extends string, ReplaceStr extends string> = Includes<S, MatchStr> extends true?
ReplaceAll<Replace<S, MatchStr, ReplaceStr>, MatchStr, ReplaceStr> : S

// TrimLeft: 去掉字符串前面的空格
type TrimLeft<S extends string> = S extends `${' ' | '\t' | '\n'}${infer Right}` ? TrimLeft<Right> : S

// TrimRight: 去掉字符串后面的空格
type TrimRight<S extends string> = S extends `${infer Left}${' ' | '\t' | '\n'}` ? TrimRight<Left> : S

// Trim: 去掉字符串的空格
type Trim<S extends string> = TrimLeft<TrimRight<S>>

// ToUpperCase - 字符串转大写
type ToUpperCase<S extends string> = Uppercase<S>
type UppercaseExam = ToUpperCase<'abc'>

// ToLowerCase - 字符串转小写
type ToLowerCase<S extends string> = Lowercase<S>
type LowercaseExam = ToLowerCase<'ABC'>

// IsEqual - 数字类型是否相等
type IsEqual<L extends NumberLike, R extends NumberLike, Strict extends boolean = true> = Strict extends true ?
  CheckLeftIsExtendsRight<L, R> : CheckLeftIsExtendsRight<Stringify<L>, Stringify<R>>

// IsNotEqual: 数字类型是否不相等
type IsNotEqual<L extends NumberLike, R extends NumberLike, Strict extends boolean> = Not<IsEqual<L, R, Strict>>

// 构建一定长度的元组
type GetTupleHelper<Length extends number = 0, R extends unknown[] = []> = R['length'] extends Length ? R : GetTupleHelper<Length, [...R, unknown]>
type GetTuple<Length extends number = 0> = GetTupleHelper<Length>

// IntAddSingle: 整数相加

type IntAddSingleHelper<N1 extends number, N2 extends number> = [...GetTuple<N1>, ...GetTuple<N2>]['length']
type IntAddSingle<N1 extends number, N2 extends number> = IntAddSingleHelper<N1, N2>
type IntAddSingleExam = IntAddSingle<2, 3>

// 算法
// link: https://juejin.cn/post/6844903919722692621

// 时间复杂度：反映了程序从开始运行到结束所需要的时间，把算法中基本操作的重复次数作为算法的时间复杂度
// 常见的复杂度包括：
// O(1) 常数阶，没有循环语句
// O(logn) 对数复杂度
// O(n) 线性阶，一重循环，基本操作的执行频度与问题规模是呈线性
// O(n^2) 平方阶
// O(n^3) 立方阶
// O(2^2) 指数
// O(n!) 阶乘

// 空间复杂度是指运行完一个程度所需的内存大小

// 数据结构即元素之间存在的一种或者多种特定关系的集合，一般从两个维度来理解它，逻辑结构和存储结构
// 逻辑结构又分为线性结构和非线性结构，线性结构是有序数据元素的结合，包括栈，队列，链表，线性表
// 非线性结构指各个元素不再保持在一个线性序列中，包括二维数组和树
// 存储结构包括顺序存储，链式存储，索引存储，散列存储

// 二叉树
// 对象描述二叉树
const bt = {
  val: 1,
  left: {
    val: 2,
    left: {
      val: 5,
      left: null,
      right: null
    },
    right: null
  },
  right: {
    val: 3,
    left: null,
    right: {
      val: 6,
      right: {
        val: 7,
        left: null,
        right: null
      },
      left: null
    }
  }
}

class BinaryTreeNode {
  constructor(key) {
    this.val = key
    this.left = null
    this.right = null
  }
}

class BinaryTree {
  constructor() {
    this.root = null
  }
  insert(key) {
    let node = new BinaryTreeNode(key)
    if (this.root === null) {
      this.root = node
    } else {
      this.insertNode(this.root, node)
    }
  }
  insertNode(node, newNode) {
    if (node.val > newNode.val) {
      if (node.left) {
        this.insertNode(node.left, newNode)
      } else {
        node.left = newNode
      }
    } else {
      if (node.right) {
        this.insertNode(node.right, newNode)
      } else {
        node.right = newNode
      }
    }
  }
}

const TreeNodes = [56, 22, 81, 10, 30, 77, 92]
const tree = new BinaryTree()
TreeNodes.forEach(node => tree.insert(node))
console.log(tree, 'new tree')

// 前序遍历：中左右
// 递归实现：
const preOrderTraversal = (root, arr = []) => {
  if (root) {
    arr.push(root.val)
    preOrderTraversal(root.left, arr)
    preOrderTraversal(root.right, arr)
  }
  return arr
}
// 非递归实现：迭代
const pre = (root) => {
  const stack = [root]
  const res = []
  while (stack.length) {
    const cur = stack.pop()
    res.push(cur.val)
    if (cur.right) {
      stack.push(cur.right)
    }
    if (cur.left) {
      stack.push(cur.left)
    }
  }
  return res
}

const pre = (root) => {
  const stack = [root]
  const res = []
  while (stack.length) {
    const cur = stack.pop()
    res.push(cur.val)
    cur.right && stack.push(right)
    cur.left && stack.push(left)
  }
  return res
}

// 中序遍历：左中右
// 递归实现
const inOrderTraversal = (root, arr = []) => {
  if (root) {
    inOrderTraversal(root.left, arr)
    arr.push(root.val)
    inOrderTraversal(root.right. arr)
  }
  return arr
}
// 非递归实现: 左孩子入栈 -> 直至左孩子为空的节点; 节点出栈 -> 访问该节点; 以右孩子为目标节点，再依次执行前两步
const inOrder = (root) => {
  const res = []
  const stack = []
  let current = root
  while (stack.length || current) {
    while (current) {
      stack.push(current)
      current = current.left
    }
    current = stack.pop()
    res.push(current.val)
    current = current.right
  }
}

const inOrder = (root) => {
  const res = []
  const stack = []
  let cur = root
  while (cur || stack.length) {
    while (cur) {
      stack.push(cur)
      cur = cur.left
    }
    cur = stack.pop()
    res.push(cur.val)
    cur = cur.right
  }
  return res
}

// 后序遍历：左右中
// 递归实现
const postOrderTraversal = (root, arr = []) => {
  if (root) {
    postOrderTraversal(root.left, arr)
    postOrderTraversal(root.right, arr)
    arr.push(root.val)
  }
  return arr
}
// 非递归实现
const post = (root) => {
  const stack = [root]
  const res = []
  while (stack.length) {
    const cur = stack.pop()
    res.unshift(cur.val)
    if (cur.left) {
      stack.push(cur.left)
    }
    if (cur.right) {
      stack.push(cur.right)
    }
  }
  return res
}

// 二叉树全路径深度优先遍历
const fullPaths = (root) => {
  const res = []
  const dfs = (node, str) => {
    if (!node.left && !node.right) {
      res.push(str)
    }
    if (node.left) {
      dfs(node.left, `${str}->${node.left.val}`)
    }
    if (node.right) {
      dfs(node.right, `${str}->${node.right.val}`)
    }
  }
  dfs(root, root.val)
  return res
}


// 二叉树全路径求和
const fullPathSum = (root) => {
  if (!root) return 0
  const res = []
  const dfs = (node, num) => {
    if (!node.left && !node.right) {
      res.push(num)
    }
    if (node.left) {
      dfs(node.left, num + node.left.val)
    }
    if (node.right) {
      dfs(node.right, num + node.right.val)
    }
  }
  dfs(root, root.val)
  return res.reduce((pre, cur) => {
    return pre + cur
  }, 0)
}

// 重建二叉树： 输入某二叉树的前序遍历和中序遍历的结果，请重建出该二叉树
const reConstructBinaryTree = (pre, vin) => {
  if (!pre) return null
  if (pre.length === 1) return new BinaryTreeNode(pre[0])

  const rootVal = pre[0]
  const idx = vin.indexOf(rootVal)

  const vinLeft = vin.slice(0, idx)
  const vinRight = vin.slice(idx + 1)

  const preLeft = pre.slice(1, idx + 1)
  const preRight = pre.slice(idx + 1)

  const node = new BinaryTreeNode(rootVal)
  node.left = reConstructBinaryTree(preLeft,vinLeft)
  node.right = reConstructBinaryTree(preRight, vinRight)

  return node
}



// 反转二叉树
const invertTree = (root) => {
  if (!root) return null
  if (root.left) {
    invertTree(root.left)
  }
  if (root.right) {
    invertTree(root.right)
  }
  const tmp = root.left
  root.left = root.right
  root.right = tmp
  return root
}


// 二叉树的镜像：递归交换二叉树所有节点左右节点的位置
const mirrorTree = (root) => {
  if (root) {
    const temp = root.right
    root.right = root.left
    root.left = temp
    mirrorTree(root.right)
    mirrorTree(root.left)
  }
  return root
}

// 判断对称二叉树：一个二叉树同此二叉树的镜向是相同的称为对称二叉树
const isSymmetrical = (root) => isSymmetricalTree(root, root)
const isSymmetricalTree = (node1, node2) => {
  if (!node1 && !node2) return true
  if (!node1 || !node2) return false
  if (node1.val !== node2.val) return false
  return isSymmetricalTree(node1.left, node2.right) && isSymmetricalTree(node1.right, node2.left)
}

// 二叉树第k个节点：给定一棵二叉搜索树，请找出其中的第k小的结点
// 二叉树中序遍历就是排序后的数组
const KNode = (root, k) => {
  const arr = []
  const stack = []
  let current = root
  while (stack.length || current) {
    while (current) {
      stack.push(current)
      current = current.left
    }
    current = stack.pop()
    arr.push(current.val)
    current = current.right
  }
  if (k > 0 && k <= arr.length) {
    return arr[k-1]
  }
  return null
}

// 输入一个整数数组，判断该数组是不是某二叉搜索树的后序遍历的结果
const VerifySequenceOfBST = (sequence) => {
  if (sequence && sequence.length) {
    const len = sequence.length
    const root = sequence[len - 1]

    for (var i = 0; i < len; i++) {
      if (sequence[i] > root) {
        break
      }
    }

    for (let j = i; j < len; j++) {
      if (sequence[j] < root) {
        return false
      }
    }

    let left = true
    if (i > 0) {
      left = VerifySequenceOfBST(sequence.slice(0, i))
    }

    let right = true
    if (i < len) {
      right = VerifySequenceOfBST(sequence.slice(i, len))
    }

    return left && right
  }
}

// 二叉树最大深度：深度优先遍历 + 分治
const treeDepth = (root) => {
  return !root ? 0 : Math.max(treeDepth(root.left), treeDepth(root.right)) + 1
}

// 二叉树最小深度：深度优先 + 分治
const minDepth = (root) => {
  if (!root) return 0
  if (!root.left) return minDepth(root.right) + 1
  if (!root.right) return minDepth(root.left) + 1
  return Math.min(minDepth(node.left), minDepth(node.right)) + 1
}

// 平衡二叉树：每个子树的深度之差不超过1
// 在遍历二叉树每个节点前都会遍历其左右子树
// 比较左右子树的深度，若差值大于1 则返回一个标记 -1表示当前子树不平衡
// 左右子树有一个不是平衡的，或左右子树差值大于1，则整课树不平衡
// 若左右子树平衡，返回当前树的深度（左右子树的深度最大值+1）
const isBalanced = (root) => {
  return balanced(root) !== -1
}
const balanced = (root) => {
  if (!root) return 0
  const left = balanced(node.left)
  const right = balanced(node.right)
  if (left === -1 || right === -1 || Math.abs(left - right) > 1) {
    return -1
  }
  return Math.max(left, right) + 1
} 

//二叉树中和为某一值的路径
const findPath = (root, expectNum) => {
  const res = []
  const findPathCore = (node, sum, stack) => {
    stack.push(node.val)
    sum += node.val
    if (!node.left && !node.right && sum === expectNum) {
      res.push(stack.slice(0))
    }
    if (node.left) {
      findPathCore(node.left, sum, stack)
    }
    if (node.right) {
      findPathCore(node.right, sum, stack)
    }
    stack.pop()
  }
  if (root) {
    findPathCore(root, 0, [])
  }
  return res
}

// 二叉树路径总和
// https://leetcode.cn/problems/path-sum/
const hasPathSum = function (root, sum) {
    if (!root) return false
    sum = sum - root.val
    if (!root.left && !root.right) {
        return sum === 0
    }
    return hasPathSum(root.left, sum) ||  hasPathSum(root.right, sum)
};

// 二叉树路径总和，不需要从根节点开始，不需要到叶子结点结束
// https://leetcode.cn/problems/path-sum-iii/
const pathSum = (root, target) => {
  if (!root) return 0
  const dfs = (node, sum) => {
    if (!node) return 0
    let res = 0
    if (node.val === sum) {
      res++
    }
    res = res + dfs(node.left, sum - node.val)
    res = res + dfs(node.right, sum - node.val)
    return res
  }
  return dfs(root, target) + pathSum(root.left, target) + pathSum(root.right, target)
}


// 请实现两个函数，分别用来序列化和反序列化二叉树
const serializeTree = (root, arr = []) => {
  const dfs = (root) => {
    if (!root) {
      arr.push('#')
      return
    }
    arr.push(root.val)
    dfs(root.left)
    dfs(root.right)
  }
  dfs(root)
  return arr.join(',')
}

const deserialize = (s) => {
  if (!s) {
    return null
  }
  const arr = s.split(',')
  const deserializeCore = (arr) => {
    let node = null
    const current = arr.shift()
    if (current !== '#') {
      node = { val: current }
      node.left = deserializeCore(arr)
      node.right = deserializeCore(arr)
    }
    return node
  return deserializeCore(arr)
}


// 二叉树中的中序后继
// const getNext = (pNode) => {
//   if (!pNode) return null
//   // 如果有右子树，则为右子树下面的最近左子树节点
//   if (pNode.right) {
//     while (pNode.left) {
//       pNode = pNode.left
//     }
//     return pNode
//   } else {
//     while (pNode) {
//       // 如果没有右子树，则向上查找最近的左子树节点
//       if (pNode.next.left = pNode) return pNode.left
//       pNode = pNode.left
//     }
//   }
//   return null
// }

// 二叉树的中序后继
// https://leetcode.cn/problems/P5rCT8/
const inorderSuccessor = (root, p) => {
  let cur = root
  let res = null
  while (cur) {
    if (cur.val > p.val) {
      res = cur
      cur = cur.left
    } else {
      cur = cur.right
    }
  }
  return res
}

// 二叉树的子结构
// https://leetcode.cn/problems/shu-de-zi-jie-gou-lcof/
function isSubStructure(A, B) {
    if(!A||!B) return false;
    const dfs=(A,B)=>{
        if(!B) return true;
        if(!A) return false;
        return A.val===B.val && dfs(A.left,B.left) && dfs(A.right,B.right);
    };

    return dfs(A,B) || isSubStructure(A.left, B) || isSubStructure(A.right,B)
};


// 链表
// 只有遍历才能查询，查询慢，但插入和删除快

class ListNode {
  constructor(key) {
    this.val = key
    this.next = null
  }
}

// 从尾到头打印链表
const printListFromTailToHead = (head) => {
  const res = []
  let current = head
  while (current) {
    res.unshift(current.val)
    current = current.next
  }
  return res
}

// 反转链表
const revertList1 = (head) => {
  let prev = null
  let next = null
  let cur = head
  while (cur !== null) {
    next = cur.next
    cur.next = prev
    prev = cur
    cur = next
  }
  return prev
}

const reverseList2 = (head) => {
  let cur = head
  let prev = null
  while (cur) {
    [cur.next, prev, cur] = [prev, cur, cur.next]
  }
  return prev
}

// 判断链表有环： 快慢指针
// https://leetcode.cn/problems/linked-list-cycle/
const hasCycle = (head) => {
  if (!head || !head.next) {
    return false
  }
  let slower = head
  let faster = head.next
  while (slower !== faster) {
    if (!faster || !faster.next) {
      return false
    }
    slower = slower.next
    faster = faster.next.next
  }
  return true
}

// 合并两个有序列链表: 输入两个单调递增的链表，输出两个链表合成后的链表
// https://leetcode.cn/problems/merge-two-sorted-lists/submissions/
const mergeOrderedList = (head1, head2) => {
  if (!head1) return head2
  if (!head2) return head1
  let head
  if (head1.val < head2.val) {
    head = head1
    head.next = mergeOrderedList(head1.next, head2)
  } else {
    head = head2
    head.next = mergeOrderedList(head1, head2.next)
  }
  return head
}

// 链表倒数第k个节点: front先k步，然后behind再走，front到终点的时候，behind就是倒数第k个
const findKthToTail = (head, k) => {
  if (!head || !k) return null
  let front = head
  let behind = head
  let index = 1
  while (front && font.next) {
    index++
    front = front.next
    if (index > k) {
      behind = behind.next
    }
  }
  return behind
}

// 相交链表(两个链表的第一个公共节点)
// https://leetcode.cn/problems/intersection-of-two-linked-lists/submissions/
var getIntersectionNode = function(headA, headB) {
    if (!headA || !headB) return null
    let p1 = headA
    let p2 = headB
    while (p1 !== p2) {
        p1 = p1 === null ?  headB : p1.next
        p2 = p2 === null ?  headA : p2.next
    }
    return p1
};

// 链表环的入口节点
// https://leetcode.cn/problems/c32eOV/solution/by-1105389168-igvv/
var detectCycle = function(head) {
    if (!head) return null
    let cur = head
    const map = new Map()
    while (cur) {
        if (map.has(cur)) return cur
        map.set(cur, true)
        cur = cur.next
    }
    return null
};

// 约瑟夫环问题：0,1,...,n-1这n个数字排成一个圆圈，从数字0开始，每次从这个圆圈里删除第m个数字。求出这个圆圈里剩下的最后一个数字。
const lastRemainedOne = (n, m) => {
  if (n < 1 || m < 1) return -1
  const head = {val: 0}
  let current = head
  for (let i = 1; i < n; i++) {
    current.next = { val: i }
    current = current.next
  }
  current.next = head

  while (current.next !== current) {
    for (let i = 0; i < m - 1; i++) {
      current = current.next
    }
    current.next = current.next.next
  }
  return current.val
}

// 不给head的情部下删除中间node节点
// https://leetcode.cn/problems/delete-node-in-a-linked-list/submissions/
var deleteNode = function(node) {
    node.val = node.next.val
    node.next = node.next.next
};

// 删除链表中的节点
// https://leetcode.cn/problems/shan-chu-lian-biao-de-jie-dian-lcof/submissions/
const deleteNode = (head, val) => {
  let pre = head
  let cur = head.next
  if (pre.val === val) return cur
  while (pre && pre.next) {
    if (cur.val === val) {
      pre.next = cur.next
    }
    pre = pre.next
    cur = cur.next
  }
  return head
}

// 数组
// 输入一个正整数数组，把数组里所有数字拼接起来排成一个数，打印能拼接出的所有数字中最小的一个。[3, 32, 321]
// sort 函数排序， （a, b）=> a - b 返回值大于0,则a, b交换位置 <= 0 不变
// https://leetcode.cn/problems/ba-shu-zu-pai-cheng-zui-xiao-de-shu-lcof/submissions/
var minNumber = function(nums) {
    nums.sort((a, b) => ('' + a + b) - ('' + b + a))
    return nums.join('')
};

// 第一个只出现一次的字符
// https://leetcode.cn/problems/di-yi-ge-zhi-chu-xian-yi-ci-de-zi-fu-lcof/submissions/
var firstUniqChar = function(s) {
    if (!s.length) return ''
    for (let val of s) {
        if (s.indexOf(val) === s.lastIndexOf(val)) {
            return val
        }
    }
    return ''
};

// 调整数组顺序使奇数位于偶数前面
// https://leetcode.cn/problems/diao-zheng-shu-zu-shun-xu-shi-qi-shu-wei-yu-ou-shu-qian-mian-lcof/
const exchange = (nums) => {
  let l = 0
  let r = nums.length - 1
  while (l < r) {
    if (nums[l] % 2 === 0 && nums[r] % 2 === 1) {
      [nums[l], nums[r]] = [nums[r], nums[l]]
    }
    if (nums[l] % 2 === 1) l++
    if (nums[r] % 2 === 0) r--
  }
  return nums
}


// 构建乘积数组：给定一个数组A[0,1,...,n-1],请构建一个数组B[0,1,...,n-1],其中B中的元素B[i]=A[0]*A[1]*...*A[i-1]*A[i+1]*...*A[n-1]。不能使用除法。
// 转换为二维矩阵，先计算下三角，再计算上三角
// https://leetcode.cn/problems/gou-jian-cheng-ji-shu-zu-lcof/
const constructArr = (arr) => {
  const res = []
  let temp = 1
  for (let i = 0; i < arr.length; i++) {
    res[i] = temp
    temp = temp * arr[i]
  }
  temp = 1
  for (let j = arr.length - 1; j >= 0; j--) {
    res[j] = res[j] * temp
    temp = temp * arr[j]
  }
  return res
}


// 和为S的连续正整数序列
// https://leetcode.cn/problems/he-wei-sde-lian-xu-zheng-shu-xu-lie-lcof/submissions/
// 下面是滑动窗口框架
// let left = 0, right = 0;
// while (right < s.size()) {`
//     // 增大窗口
//     window.add(s[right]);
//     right++;

//     while (window needs shrink) {
//         // 缩小窗口
//         window.remove(s[left]);
//         left++;
//     }
// }
const findContinuousSequence = (target) => {
  let l = 1
  let r = 2
  let sum = 3
  const res = []
  while (l < r) {
    if (sum === target) {
      const arr = []
      for (let i = l; i <= r; i++) {
        arr.push(i)
      }
      res.push(arr)
      sum = sum - l
      l++
    } else if (sum > target) {
      sum = sum - l
      l++
    } else {
      r++
      sum = sum + r
    }
  }
  return res
}


// 和为S的两个数字：输入一个递增排序的数组和一个数字S，在数组中查找两个数，使得他们的和正好是S，如果有多对数字的和等于S，输出两个数的乘积最小的
var twoSum = function(arr, sum) {
  if (Array.isArray(arr) && arr.length) {
    let left = 0
    let right = arr.length - 1
    while (left < right) {
      const s = arr[left] + arr[right]
      if (s < sum) {
        left++
      } else if (s > sum) {
        right--
      } else {
        return [arr[left], arr[right]]
      }
    }
  }
  return []
};

// 连续子数组的最大值：输入一个整型数组，数组里有正数也有负数。数组中的一个或连续多个整数组成一个子数组。求所有子数组的和的最大值，要求时间复杂度为O(n)
// 动态规划：dp[i] = dp[i - 1] + nums[i] 或者 dp[i] = nums[i]
 var maxSubArray = function(nums) {
    const len = nums.length
    if (len === 0 ) return 0
    const dp = [nums[0]]
    let max = nums[0]
    for (let i = 1; i < len; i++) {
        dp[i] = Math.max(dp[i - 1] + nums[i], nums[i])
        max = Math.max(max, dp[i])
    }
    return max
};

// 两数之和
const twoSum = (arr, sum) => {
  const map = {}
  for (let i = 0; i < arr.length; i++) {
    map[arr[i]] = i
  }
  for (let i = 0; i < arr.length1; i++) {
    const temp = sum - arr[i]
    if (map[temp] && map[temp] !== i) {
      return [i, map[temp]]
    }
  }
}

// 扑克牌顺子：扑克牌中随机抽5张，判断是不是顺子，即是不是连续的
// 大小王可当任意数，大小王可以当作0, 大小王的张数大于大等间隔数即可，把大小王往间隔里边放即
const isContinuous = (numbers) => {
  if (!Array.isArray(numbers) || !numbers.length) return false
  numbers.sort((a, b) => a - b)
  let kingNum = 0
  let spaceNum = 0
  for (let i = 0; i < numbers.length - 1; i++) {
    if (numbers[i] === 0) {
      kingNum++
    } else {
      const space = numbers[i+1] - numbers[i]
      if (space === 0) return false
      spaceNum = spaceNum + space - 1
    }
  }
  return kingNum >= spaceNum
}

// 三数之和：去重
// 思路先排序，然后再遍历，每个值右侧的子数组再做两数之和的操作
var threeSum = function(nums) {
    const results = []
    nums.sort((a, b) => a - b)
    for (let i = 0; i < nums.length; i++) {
      if (i && nums[i] === nums[i -1]) {
          continue
      }
      let left = i + 1
      let right = nums.length - 1
      while (left < right) {
          const sum = nums[i] + nums[left] + nums[right]
          if (sum === 0) {
              results.push([nums[i], nums[left], nums[right]])
              while (left < right && nums[left] === nums[left + 1]) {
                  left++
              }
              while (left < right && nums[right] === nums[right - 1]) {
                  right--
              }
              left++
              right--
          } else if (sum > 0) {
              right--
          } else {
              left++
          }
      }
  }
  return results
}


// React 原理
// GUI渲染线程与JS线程是互斥的，所以JS脚本执行与浏览器布局与绘制不能同时执行。浏览器刷新频率为60hz，即每16.6ms浏览器刷新一次
// 如果js脚本执行时间过长，就没有时间进行布局与绘制，导致页面卡顿掉帧
// 解决方案：浏览器在每一帧留一定的时间（5ms）用来执行js，预留时间不够用时，将线程控制权还给浏览器使其有时间渲染UI，
// React则等待下一帧时间来继续被中断的工作，这种将长任务分解到每一帧去执行的操作叫时间切片，
// 而时间切片的关键是：将同步的更新变为可中断的异步更新

// React16框架可以分为三层：
// Scheduler： 调度器，调度任务的优先级，高优任务优先进去Reconciler
// Reconciler： 协调器，负责找出变化的组件，当Scheduler将任务交给Reconciler后，Reconciler会为变化的虚拟DOM打上代表增删改的标记
// Render：渲染器，负责将变化的组件渲染到页面上，根据DOM上的标记，同步执行对应的操作
// 其中Scheduler和Reconciler中的步骤随时可能被以下原因中断：有同有其它更高优任务需要执行，当前帧有没有剩余时间

// Fiber架构
// 代数架构是函数编程的一个概念，用于将副作用从函数调用中分离
// 双缓存：在内存中构建并直接替换的技术，React使用双缓存来完成fiber树的构建与替换，对应着DOM树的创建与更新
// 有两棵树：current Fiber树和 workInProgress树，每次状态更新都会产生新的workInProgress树，通过current与workInProgress的替
// 换来完成DOM更新

// Render工作的阶段被称为commit阶段，commit阶段分为三个子阶段：
// before mutation阶段：执行DOM操作前，
// mutation阶段：执行DOM操作
// layout阶段：执行DOM操作后
// react render的核心设计思想：
// 1. 当发生渲染或者更新操作时，react创建一系列的任务，任务带有优先级，然后构建workInProgress fiber 链表树
// 2. 遍历任务列表去执行任务。每一帧先执行浏览器的渲染任务，如果当前帧还有空闲时间，则执行任务直到当前帧时间用完；
// 如果当前帧没有空闲时间，则等下一帧空闲再去执行，
// 如果当前帧没有空亲时间，但当前任务链表有任务到期或者有立即执行的任务，必须执行的时候就以丢失几帧的代价去执行这些任务，执行完任务从链表中删除

// React diff
// diff策略
// 只对同级元素进行比较，如果出现跨层级的DOM节点更新，则不进行复用
// 两个不同类型的组件会产生两棵不同的树，直接替换掉
// 对于同一层级的子节点，开发者可以通过key来确定哪些子元素可以在不同渲染中保持稳定

// 隐式类型转换
// Object => number
// 先调用valueOf方法，能否得到一个基础数据类型，如能使用Number()对基础类型进行转换，转换为number
// 如果调用valueOf没有得到基础类型，则调用toString方法看能否得到一个基础类型，如用，使用Number()进行转换，不能则报错
// Object => string
// 先调用toString方法，看能否得到一个基础类型，如果能，使用String()对基础类型进行转换
// 如果toString没有得到基础类型，则调用valueOf方法看能否得到一个基础类型，如能使用String()进行转换，不能则报错
// 其它类型转换为boolean: undefined null +0 -0 NaN 转换为false，其它均为true
// 基础类型的比较： string/boolean 和 number比较时都先转换成number, string和boolean比较时也都转换成number
// 引用类型和基础类型比较：和boolean类型比较转转换为true, 和number和string类型比较，先调用valueOf看能否转换为基础类型，
// 能的话再进行基础类型的比较，不能则调用toString转换，再做基础类型的比较
const a = {
  count: 0,
  valueOf() {
    this.count++
    if (this.count === 1) {
      return 'a'
    } else if (this.count === 2) {
      return 'b'
    } else {
      return 'c'
    }
  }
}
console.log( a == 'a' && a == 'b' && a == 'c')

// 高频手写题
// 防抖函数：把触发频繁的事件合并成一次去执行，在指定时间内只执行一次回调函数，如果指定时间内又触发了该事件，则回调函数的执行时间重新开始计时
// 在事件被触发n秒后再执行回调，如果在这n秒内又被触发，则重新计时。
// 应用场景： search联想搜索/window触发resize事件
const debounce = function (fn, wait) {
  let timer = null
  return function (...args) {
    let self = this
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      fn.apply(self, args)
    })
  }
}


// 节流函数：指频繁触发事件时，只会在指定的时间段内执行事件回调，即触发事件间隔大于等于指定的时间才会执行回调函数
// 应用场景：scroll事件
const throttle = (func, wait) => {
  let prev = Date.now()
  return function (...args) {
    let cur = Date.now()
    if (cur - prev > wait) {
      func.apply(this, args)
      prev = cur
    }
  }
}

// instanceOf: 检测构造函数的prototype属性是否出现在某个实例对象的原型链上
const _instanceOf = (left, right) => {
  let rightProto = right.prototype
  let leftProto = left.__proto__
  while (true) {
    if (leftProto === null) return false
    if (leftProto === rightProto) return true
    leftProto  = leftProto.__proto__
  }
}

// new 操作符：创建一个全新的对象，这个对象__proto__指向构造函数的prototype，执行构造函数，改变this指向，
// 返回值为object类型作为返回值返回，否则返回新创建的对象
function myNew(fn, ...args) {
  let obj = {}
  Object.setPrototypeOf(obj, fn.prototype)
  const res = fn.apply(obj, args)
  return res instanceof Object ? res : obj
}

function object(obj) { // 这也是手写Object.create
  function F() {}
  F.prototype = obj
  F.prototype.constructor = F
  return new F()
}

// call
Function.prototype.myCall = function (context = window, ...args) {
  let key = Symbol['key']
  context[key] = this
  const res = context[key](...args)
  delete context[key]
  return res
}

// apply
Function.prototype.myApply = function (context = window, args) {
  let key = Symbol['key']
  context[key] = this
  let res = context[key](...args)
  delete context[key]
  return res
}

// bind
Function.prototype.myBind = function (context = window, ...args) {
  let self = this
  let fBound = function (...innerArgs) {
    return self.apply(this instanceof fBound ? this : context, args.concat(innerArgs))
  }
  fBound.prototype = Object.create(this.prototype)
  return fBound
}

Function.prototype.myBind = function (context = window, ...args) {
  const key = Symbol("fn");
  context[key] = this;
  return function (..._args) {
    const newArgs = args.concat(_args);
    let res =  context[fnSymbol](...newArgs);
    delete context[key]; 
    return res
  }
}

// 深拷贝
function deepClone(obj) {
  if (obj !== 'object' || obj === null) {
    return obj
  }
  let copy = {}
  if (obj.constructor === Array) {
    copy = []
  }
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      copy[key] = deepClone(obj[key])
    }
  }
  return copy
}

// 考虑循环引用
function deepClone(obj, hash = new WeakMap()) {
  if (obj == null) return obj
  if (obj instanceof RegExp) return new RegExp(obj)
  if (obj instanceof Date) return new Date(obj)
  if (typeof obj !== 'object') return obj
  if (hash.has(obj)) return hash.get(obj)
  let copy = new obj.constructor()
  hash.set(obj, copy)
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      copy[key] = deepClone(obj[key], hash)
    }
  }
  return copy
}

// weakmap 与 map
// 1. WeakMap 只能使用对象作为key
// 2. 弱引用，对象没有引用时，就会回收
// 3. 没有size
// 4. 不能clear
// 5. 不能遍历


// 继承：子类可以使用父类的功能，并对这些功能进行扩展
// 原型链继承: 
Child.prototype = new Parent()
// 缺点：创建子类时，无法向父类传参；原型对象中所有属性都被共享了，修改原型对象中的引用类型，所有子例的实例都会受到影响

// 构造函数继承
function Child(name) {
  Parent.call(this, name)
}
// 支持子类向父类传参； 解决了原型链继承中共享父类原型引用类型的问题
// 只能继承父类实例的属性和方法，无法继承父类原型上的属性和方法，无法实现函数的复用


// 组合继承
Child.prototype = new Parent()
function Child(name) {
  Parent.call(this, name)
}
// 缺点：调用了两次父例的构建函数，一次是call，将父类的实例复制到子类的实例对象中，另一个是new存到子类的原型对象上

// 寄生组合继承
Child.prototype = Object.create(Parent.prototype)
function Child(name) {
  Parent.call(this, name)
}
Child.prototype.constructor = Child

// 原型式寄成:创建一个构建函数，构建函数的原型指向对象，然后用new操作符创建实例并返回
function createObj(obj) {
  function F() { }
  F.prototype = obj
  F.prototype.constructor = F
  return new F()
}

// resole
Promise.resolve = (param) => {
  if (param instanceof Promise) return param
  return new Promise((resolve, reject) => {
     if (param && param.then && typeof param.then === 'function') {
      param.then(resolve, reject)
    } else {
      resolve(param)
    }
  })
}

// reject
Promise.reject = (reason) => {
  return new Promise((resolve, reject) => {
    reject(reason)
  })
}

Promise.prototype.catch = (cb) => {
  return this.then(null, cb)
}

// finally
Promise.prototype.finally = function (callback) {
  return this.then(data => {
    return Promise.resolve(callback()).then(() => data)
  }, err => {
    return Promise.resolve(callback()).then(() => {
      throw err
    })
  })
}

// promise.all
Promise.all = function (promises) {
  return new Promise((resolve, reject) => {
    let res = []
    let idx = 0
    let len = promises.length
    if (len === 0) {
      resolve(res)
      return
    }
    for (let i = 0; i < len; i++) {
      Promise.resolve(promises[i]).then(data => {
        res[i] = data
        idx++
        if (idx === len) resolve(res)
      }).catch(err => {
        reject(err)
      })
    }
  })
}

Promise.allSettled = function (promises) {
  return new Promise((resolve, reject) => {
    let len = promises.length
    let idx = 0
    let res = []
    const setRes = (index, data) => {
      res[index] = data
      idx++
      if (idx === len) {
        resolve(res)
      }
    }
    for (let i = 0; i < len; i++) {
      let cur = promises[i]
      if (typeof cur.then === 'function') {
        cur.then(data => {
          setRes(i, {status: 'fulfilled', value: data})
        }, err => {
          setRes(i, {status: 'rejected', value: err})
        })
      } else {
        setRes(i, {status: 'fulfilled', value: cur})
      }
    }
  })
}


Promise.race = function (promises) {
  return new Promise((resolve, reject) => {
    let len = promises.length
    for (let i = 0; i < len; i++) {
      Promise.resolve(promises[i]).then(data => {
        resolve(data)
        return 
      }).catch(err => {
        throw err
      })
    }
  })
}

Promise.any = function (promises) {
  return new Promise((resolve, reject) => {
    const len = promises.length
    let count = 0
    for (let i = 0; i < len; i++) {
      const cur = promises[i]
      Promise.resolve(cur).then(val => {
        resolve(val)
      }, err => {
        count++
        if (count == len) {
          reject('All promises are rejected')
        }
      })
    }
  })
}

function myPromise(constructor) {
  let self = this
  self.status = 'pending'
  self.value = undefined
  self.reason = undefined

  function resolve(val) {
    if (self.status === 'pending') {
      self.status = 'resolved'
      self.value = val
    }
  }

  function reject(err) {
    if (self.status === 'pending') {
      self.status = 'rejected'
      self.reason = err
    }
  }

  try {
    constructor(resolve, reject)
  } catch (err) {
    reject(err)
  }
}

myPromise.prototype.then = function (onResolved, onRejected) {
  let self = this
  switch (self.status) {
    case 'resolved':
      onResolved(self.value)
      break;
    case 'rejected':
      onRejected(self.reason)
      break;
    default:
  }
}

const promisify = fn => {
  return (...args) => {
    return new Promise((resolve, reject) => {
      fn(...args, (err, data) => {
        if (err) {
          reject(err)
        }
        resolve(data)
      })
    })
  }
}

const promisifyAll = target => {
  Reflect.ownKeys(target).forEach((key) => {
    target[key + 'Async'] = promisify(target[key])
  })
  return target
}

class EventEmitter {
  constructor() {
    this.events = {}
  }

  on(name, cb) {
    this.events[name] = [...(this.events[name] ?? []), cb]
  }

  emit(name, ...args) {
    if (!this.events[name]) return
    this.events[name].forEach(fn => fn(...args))
  }

  off(name, cb) {
    if (!this.events[name]) return
    this.events[name] = this.events[name].filter(fn => fn != cb && fn.l != cb)
  }

  once(name, cb) {
    const one = (...args) => {
      cb(...args)
      this.off(name, one)
    }
    one.l = cb
    this.on(name, one)
  }
}

class EventBus {
  constructor() {
    this.events = {}
  }

  on(name, cb) {
    this.events[name] = [...this.events[name], cb]
  }

  emit(name, ...args) {
    if (!this.events[name]) return
    this.events[name].forEach(fn => fn(...args))
  }

  off(name) {
    this.events[name] = null
  }
  
  once(name, cb) {
    const one = (...args) => {
      cb(...args)
      this.off(name)
    }
    this.on(name, one)
  }
}


class Subject {
  constructor(name) {
    this.state = 'initial'
    this.observers = []
  }
  attach(o) {
    this.observers.push(o)
  }
  setState(state) {
    this.state = state
    this.observers.forEach(o => o.update(this))
  }
}
class Observer {
  constructor(name) {
    this.name = name
  }
  update(s) {
    console.log(`{this.name} notice the state change of ${s.state}`)
  }
}

// 单例模式
// link: https://juejin.cn/post/6844903874210299912

function Singleton(name) {
  this.name = name
}
function createSingleton(name) {
  let instance
  return function(name) {
    if (instance) return instance
    return instance = new Singleton(name)
  }
}

// ajax
function ajax(url) {
  let xhr = new XMLHttpRequest()
  return new Promise((resolve, reject) => {
    xhr.open('get', url)
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status <= 300) {
          resolve(JSON.parse(xhr.responseText))
        } else {
          reject('error')
        }
      }
    }
    xhr.send()
  })
}

// jsonp
function jsonp({url, params, callback}) {
  return new Promise((resolve, reject) => {
    let script = document.createElement('script')
    window[callback] = data => {
      resolve(data)
      document.body.removeChild(script)
    }
    const arr = []
    for (let key in params) {
      arr.push(`${key}=${params[key]}`)
    }
    script.type = 'text/javascript'
    script.src = `${url}?callback=${callback}&${arr.join('&')}`
    document.body.appendChild(script)
  })
}

function *iteratorGenerator() {
  yield '1'
  yield '2'
  yield '3'
}
const iterator = iteratorGenerator()
iterator.next()
iterator.next()
iterator.next()

function iteratorGenerator1(list) {
  let len = list.length
  let idx = 0
  return {
    next: function () {
      let done = idx >= length
      let value = done ? undefined : list[idx]
      idx++
      return {
        done,
        value
      }
    }
  }
}

// Object.seal 和 Object.freeze的区别是，seal后的writable为true，freeze后是false
function myFreeze(obj) {
  if (obj instanceof Object) {
    Object.seal(obj)
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        Object.defineProperties(obj, key, {
          writable: false
        })
        myFreeze(obj[key])
      }
    }
  }
}

Object.is = function (x, y) {
  if (x === y) {
    return x !== 0 || 1/x === 1/y
  }
  return x !== x && y !== y
}

const square = v => v * v
const double = v => v * 2
const addOne = v => v + 1

function compose(...funcs) {
  if (funcs.length === 1) return funcs[0]
  return (...args) => {
    return funcs.reduce((pre, cur) => {
      return cur(pre)
    }, args)
  }
}
const fn3 = compose(square, double, addOne)
console.log(fn3(3))

function mySetInterval(fn, t) {
  let timer = null
  function interval() {
    fn()
    timer = setTimeout(() => {
      interval()
    }, t)
  }
  timer = setTimeout(() => {
    interval()
  }, t)
  return {
    cancel: () => {
      clearTimeout(timer)
    }
  }
}

const mySetTimeout = (fn, t) => {
  let timer = setInterval(() => {
    fn()
    clearInterval(timer)
  }, t)
}

class LRU {
  constructor(length) {
    this.length = length
    this.data = new Map()
  }

  set(key, value) {
    const data = this.data
    if (data.has(key)) {
      data.delete(key)
    }
    data.set(key, value)
    if (data.size > this.length) {
      const delKey = data.keys().next().value
      data.delete(delKey)
    }
  }

  get(key) {
    const data = this.data
    if (!data.has(key)) return null
    const val = data.get(key)
    data.delete(key)
    data.set(key, val)
    return val
  }
}

function _render(vnode) {
  if (typeof vnode === 'number') {
    vnode = String(vnode)
  }
  if (typeof vnode === 'string') {
    return document.createTextNode(vnode)
  }
  let dom = document.createElement(vnode.tag)
  if (vnode.attrs) {
    Object.keys(vnode.attrs).forEach((key) => {
      const val = vnode.attrs[key]
      dom.setAttribute(key, val)
    })
  }
  dom.children.forEach(item => {
    dom.appendChild(_render(item))
  })
  return dom
}

// 双向绑定

let proxy = new Proxy({}, {
  get: function (target, key) {
    return 35
  }
  set: function (target, key, value, reciever) {
    target[key] = value
    return true
  }
})

//  响应式原理
Object.defineProperty(obj, key, {
  enumerable: true,
  configurable: true,
  get: function getter() {

  }
  set: function setter() {

  }
})

let nObj = new Proxy(obj, {
  get: function (target, key, reciever) {
    
  }
  set: function (target, key, value, receiver) {
    
  }
})

// 双向绑定原理
// vue是通过数据劫持结合发布订阅模式来实现双向绑定的
// Observer监听器：监听属性的变化通知订阅者
// Watched订阅器：收到属性的变化然后更新视图
// Compile解析器：解析指令，初始化模版，绑定订阅者

// 在Vue模版编译过程中的指令和数据绑定都会实例化一个Watcher实例，实例化过程中会触发get方法将自身指向Dep.target
// data在Obsever时执行getter会触发dep.depend方法进行依赖收集，即在dep实例的subs添加观究者Watcher实例
// 当data中被Observer的某个对象值发生变化后，触发subs中观察它的wacher执行update方法，最后实际上是调用watcher的回调函数据，进而更新视图



// Dep的实现:收集属性值的变化，一旦set方法触发，更新视图
class Dep {
  constructor() {
    this.subs = []
  }
  addSub(sub) {
    this.subs.push(sub)
  }
  notify() {
    const subs = this.subs.slice()
    subs.forEach(sub => {
      sub.update()
    })
  }
}
Dep.target = null
  
// Observer
function Dep() {
  this.subs = []
}
Dep.prototype.addSub = function (sub) {
  this.subs.push(sub)
}
Dep.prototype.notify = function () {
  this.subs.forEach(sub => sub.notify())
}
Dep.target = null

function observe(data) {
  if (!data || typeof data !== 'object') {
    return 
  }
  Object.keys(data).forEach(key => {
    defineReactive(data, key, data[key])
  })
}

function defineReactive(data, key, value) {
  observe(value)
  const dep = new Dep()
  Object.defineProperty(data, key, {
    get: function () {
      if (Dep.target) {
        dep.addSub(Dep.target)
      }
      return value
    }
    set: function (newVal) {
      if (value !== newVal) {
        value = newVal
        dep.notify()
      }
    }
  })
}

function defineReactive(data, key, value) {
  observe(value)
  const dep = new Dep()
  Object.defineProperty(data, key, {
    get: function () {
      if (Dep.target) {
        dep.addSub(Dep.target)
      }
      return value
    },
    set: function (val) {
      if (newVal !== value) {
        value = newVal
        dep.notify()
      }
    }
  })
}

// Watcher
function Watcher(vm, prop, callback) {
  this.vm = vm
  this.prop = prop
  this.callback = callback
  this.value = this.get()
}
Watcher.prototype = {
  get: function () {
    Dep.target = this
    const value = this.vm.$data[this.prop]
    Dep.target = null
    return value
  }
  update: function () {
    const oldValue = this.value
    const value = this.vm.$data[this.prop]
    if (value !== oldValue) {
      this.value = value
      callback(value)
    }
  }
}

// vue常用的事件修饰符有哪些
// .stop 阻止冒泡
// .prevent 阻止默认事件
// .self 仅绑定元素自身可触发
// .once 只触发一次

// v-on如何绑定多个事件
// 通过传入对象来绑定多个事件，v-on="{ input:onInput,focus:onFocus,blur:onBlur }"

// Vue 初始化页面闪动问题如何解决
// 出现该问题是因为在 Vue 代码尚未被解析之前，尚无法控制页面中 DOM 的显示，所以会看见模板字符串等代码。
// 解决方案是，在 css 代码中添加 v-cloak 规则，同时在待编译的标签上添加 v-cloak 属性：

// vue项目如何清除浏览器缓存
// 项目打包的时候给每个打包文件加上 hash 值，一般是在文件后面加上时间戳；
// 在 html 文件中加入 meta 标签，content 属性设置为no-cache;

// hash和history
// hash 通过 window.onhashchange 的方式，来监听 hash 的改变，借此实现无刷新跳转的功能。
// hash 永远不会提交到 server 端（可以理解为只在前端自生自灭）。
// history API 是 H5 提供的新特性，允许开发者直接更改pushState 、 replaceState来改变前端路由，即更新浏览器 URL 地址而不重新发起请求。
// 使用 history 模式时，在对当前的页面进行刷新时，此时浏览器会重新发起请求。如果 nginx 没有匹配得到当前的 url ，就会出现 404 的页面， 在使用 history 模式时，需要通过服务端来允许地址可访问，

// vue字符串模版解析功能
function render(template, data) {
  let reg = /\{\{(\w+)\}\}/
  if (reg.test(template)) {
    let name = reg.exec(template)[1]
    template = template.replace(name, data[name])
    return render(template, data)
  }
  return template
}

// 函数劫持array
function observeArray(arr) {
  const methods = ['push', 'pop', 'shift', 'unshift', 'splice', 'reverse', 'sort']
  const origialProto = Array.prototype
  const arrProto = Object.create(origialProto)
  methods.forEach(method => {
    arrProto[method] = function (...args) {
      const res = origialProto[method].apply(this, args)
      return res
    }
   })
  arr.__proto__ = arrProto
}

Array.prototype.myForEach = function (callback, context = window) {
  let self = this
  let len = self.length
  for (let i = 0; i < len; i++) {
    typeof callback === 'function' && callback.call(context, self[i], i)
  }
}

Array.prototype.myFilter = function (callback, context = window) {
  let self = this
  let len = self.length
  let res = []
  for (let i = 0; i < len; i++) {
    if (callback.call(context, self[i], i, self)) {
      res.push(self[i])
    }
  }
  return res
}

Array.prototype.myFind = function (callback) {
  for (let i = 0; i < this.length; i++) {
    if (callback(this[i], i)) {
      return this[i]
    }
  }
}

Array.prototype.myFindIndex = function (callback) {
  for (let i = 0; i < this.length; i++) {
    if (callback(this[i], i)) {
      return i
    }
  }
}

Array.prototype.myMap = function (callback, context = window) {
  let arr = Array.prototype.slice.call(this)
  let res = []
  for (let i = 0; i < arr.length; i++) {
    res.push(callback.call(context, arr[i], i, this))
  }
}

Array.prototype.myReduce = function (fn, initialValue) {
  const arr = Array.prototype.slice.call(this)
  let res = initialValue ? initialValue : arr[0]
  let startIdx = initialValue ? 0 : 1
  for (let i = startIdx; i < arr.length; i++) {
    res = fn.call(null, res, arr[i], i, this)
  }
  return res
}

Array.prototype.myEvery = functon(callback, context = window) {
  let flag = true
  for (let i = 0; i < this.length; i++) {
    if (!callback.call(context, this[i], i, this)) {
      flag = false
      break
    }
  }
  return flag
}

Array.prototype.mySome = function (callback, context = window) {
  let flag = false
  for (let i = 0; i < this.length; i++) {
    if (callback.call(context, this[i], i, this)) {
      flag = true
      break
    }
  }
  return flag
}

// 扁平化数组
JSON.stringify(arr)

arr.flat(Infinity)

// 递归
function flatten(arr) {
  return arr.reduce((pre, cur) => {
    return pre.concat(Array.isArray(cur) ? flatten(cur) : cur)
  }, [])
}

// 迭代
function flatten(arr) {
  while (arr.some(item => Array.isArray(item))) {
    arr = [].concat(...arr)
  }
  return arr
}

function flatten (arr, n) {
  if(n < 1) return arr
  n--
  return arr.reduce((pre, cur) => {
    return pre.concat(Array.isArray(cur) ? flatten(cur, n) : cur)
  }, [])
}

Array.myIsArray = function(o) {
  return Array.prototype.toString.call(o) === '[object Array]'
}

function ArrayOf() {
  return Array.prototype.slice.call(arguments)
}

// 数组去重

function distict(arr) {
  return Array.from(new Set(arr))
}

function distict(arr) {
  return arr.filter((i, idx) => arr.indexOf(i) === idx)
}

function distict(arr) {
  let res =  []
  for (let i = 0; i < arr.length; i++) {
    if (!res.includes(i)) {
      res.push(i)
    }
  }
  return res
}

function distict(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[j] === arr[i]) {
        arr.splice(j,1)
        len--
        j--
      }
    }
  }
  return arr
}

// TODO
// 数组中根据id去重
function duplicateById(arr) {
  return arr.reduce((pre, cur) => {
    let ids = pre.map(i => i.id)
    return ids.includes(cur.id) ? pre : [...pre, cur]
  }, [])
}

// 数组中根据不同的key去重
function duplicateKey(arr, getKey) {
  const map = arr.reduce((pre, cur) => {
    const key = getKey(cur)
    if (!pre[key]) {
      pre[key] = cur
    }
    return pre
  }, {})
  return Object.values(map)
}

// 字符串中字母出现的次数
str.split('').reduce((pre, cur) => {
  pre[cur] ? pre[cur]++ : pre[cur] = 1
  return pre
}, {})

// 千分位运算符
function parseToMoney(num) {
  num = num.toFixed(3)
  let [int, dec] = num.split('.')
  int = int.replace(/\d(?=(\d{3})+$)/g, '$&,')
  return int + '.' + (dec ?? '')
}



// 正则实现
function parseToBankCardNo (num) {
  let res = '' + num
  res = res.replace(/\d(?=(\d{4})+$)/g, '$& ')
  return res
}

// random7 实现 random10
// https://leetcode.cn/problems/implement-rand10-using-rand7/solution/guan-fang-ti-jie-fang-fa-javascript-by-l-60bc/
const rand10 = () => {
    let m, n, num;
    do {
        m = rand7();
        n = rand7();
        // 使生成的[1,49]等概率
        num = m + (n - 1) * 7;
    } while(num > 40)
    // 将[1,40]转化为[1,10]
    return 1 + ((num - 1) % 10);
};

function isPhoneNumber(num) {
  let reg = /^1[34578]\d{9}$/
  return reg.test(num)
}

function isEmail(str) {
  let reg = /^([A-Za-z0-9_\.\-])+@([A-Za-z0-9_\.\-])+\.([a-zA-Z]{2, 4})+$/
  return reg.test(str)
}

function getCookie(name) {
  let reg = new RegExp('(^| )' + name + '=([^;]*)')
  let match = document.cookie.match(reg)
  if (match) return unescape(match[2])
}

function trim(str) {
  let reg = /^\s+|\s+$/g
  return str.replace(reg, '')
}


const multiFn = (a, b, c) => a * b * c
const curry = (fn, arr = []) => {
  let len = fn.length
  return (...args) => {
    const newArgs = [...arr, ...args]
    if (newArgs.length === len) {
      return fn(...newArgs)
    } else {
      return curry(fn, newArgs)
    }
  }
}
const multi = curry(multiFn)
console.log(multi(1)(2)(3))


function add(...args) {
  let fn = (...newArgs) => {
    return add.apply(null, args.concat(newArgs))
  }
  fn.toString = () => {
    return args.reduce((pre, cur) => pre + cur)
  }
  return fn
}
+add(1, 2)(3)

Number.prototype.add = function (num) {
  return this.valueOf() + num
}
Number.prototype.minus = function (num) {
  return this.valueOf() - num
}


// 返回重复次数最多的字段
function maxRepeatedChar(str) {
  const map = str.split('').reduce((pre, cur) => {
    pre[cur] ? pre[cur]++ : pre[cur] = 1
    return pre
  }, {})
  let max = 0
  let res
  Object.keys(map).forEach(i => {
    if (map[i] > max) {
      res = [i, map[i]]
    }
  })
  return res
}

// 字符串查找
// 请使用最基本的遍历来实现判断字符串 a 是否被包含在字符串 b 中，并返回第一次出现的位置（找不到返回 -1）。
function isContain(a, b) {
  for (let i in b) {
    if (a[0] === b[i]) {
      let tmp = true;
      for (let j in a) {
        if (a[j] !== b[~~i + ~~j]) {
          tmp = false;
        }
      }
      if (tmp) {
        return i;
      }
    }
  }
  return -1;
}

// 最长不重复子串：滑动窗口
// https://leetcode.cn/problems/longest-substring-without-repeating-characters/submissions/
// j 标是第几个重复，i遍历字符串, 
// 借助数组，如果res有当前str，则一直shift，至到没有，再把当前str加入，重新开始
function longestNotDuplicateString(str) {
  const res = []
  let max = 0
  for (let s of str) {
    while (res.includes(s)) {
      res.shift()
    }
    res.push(s)
    max = Math.max(max, res.length)
  }
  return max
}

// 数组全排列：回溯算法
// result = []
// backtrack(路径, 选择列表):
//     if 满足结束条件:
//         result.add(路径)
//         return
    
//     for 选择 in 选择列表:
//         做选择
//         backtrack(路径, 选择列表)
//         撤销选择
const permute = (arr) => {
  const res = []
  const back = (path) => {
    if (path.length === arr.length) {
      res.push(path.slice())
      return
    }
    for (let i = 0; i < arr.length; i++) {
      if (path.indexOf(arr[i]) === -1) {
        path.push(arr[i])
        back(path)
        path.pop()
      }
    }
  }
  back([])
  return res
}

const subsets = (nums) => {
  const res = []
  const back = (path, start) => {
    res.push([...path])
    for (let i = start; i < nums.length; i++) {
      path.push(nums[i])
      back(start + 1)
      path.pop()
    }
  }
  back([], 0)
  return res
}

// 对象扁平化 a.b.c = 3
function flatObj(obj) {
  let res = {}
  const flat = (item, preKey = '') => {
    Object.entries(item).forEach(([key, value]) => {
      const newKey = preKey ? `${preKey}.${key}` : key
      if (value && typeof value === 'object') {
        flat(value, newKey)
      } else {
        res[newKey] = value
      }
    })
  }
  flat(obj)
  return res
}

// 管理本地缓存过期的函数

class Storage {
  constructor(name) {
    this.name = 'storage'
  }

  setItem(params) {
    let obj = {
      name: '',
      value: '',
      expire: null,
      startTime: Date.now()
    }
    let options = {}
    Object.assign(options, obj, params)
    if (options.expire) {
      localStorage.setItem(options.name, JSON.stringify(options))
    } else {
      const type = Object.prototype.toString.call(options.value)
      if (type === '[object Object]' || type === 'object Array') {
        options.value = JSON.stringify(options.value)
      } 
      localStorage.setItem(options.name, options.value)
    }
  }

  getItem(name) {
    let item = localStorage.get(name)
    try {
      item = JSON.parse(item)
    } catch (e) {
      item = item
    }
    if (item.expire) {
      if (Date.now() - item.startTime > item.expire) {
        localStorage.removeItem(name)
        return false
      } else {
        return item.value
      }
    } else {
      return item.value
    }
  }

  removeItem(name) {

  }

  clear() {
    localStorage.clear()
  }
}


function chunk(arr, len) {
  let res = []
  if (len > 0) {
    for (let i = 0; i < arr.length; i += len) {
      res.push(arr.slice(i, i + len))
    }
  }
  return res
}

// 手写深度比较

function isObject(obj) {
  return (typeof obj === 'object' && obj !== null);
}
function isEqual(obj1, obj2) {
  if (!isObject(obj1) || !isObject(obj2)) {
    return obj1 === obj2
  }

  if (obj1 === obj2) return true

  const len1 = Object.keys(obj1).length
  const len2 = Object.keys(obj2).length
  if (len1 !== len2) return false

  for (let key in obj1) {
    if (!isEqual(obj1[key], obj2[key])) {
      return false
    }
  }

  return true
}

function jsonStringify(obj) {
  let type = typeof obj
  if (type !== 'object') {
    if (/string|function|undefined/.test(type)) {
      obj = '"' + obj + '"'
    }
    return String(obj)
  } else {
    let json = []
    let isArray = Array.isArray(obj)
    for (let key in obj) {
      let v = obj[key]
      let type = typeof v
      if (/string|function|undefined/.test(type)) {
        v = '"' + v + '"'
      } else if (type === 'object') {
        v = jsonStringify(v)
      }
      json.push((isArray ? "" : '"' + key + '":') + String(v))
    }
    return (isArray ? "[" : "{") + String(json) + (isArray ? "]" : "}").replace(/'/g, '"')
  }
}

function jsonParse(json) {
  return (new Function('return ' + json))()
}

// 解析URL Param对象
function parseParams(url) {
  // const paramStr = /.+\?(.+)$/.exec(url)[1]
  const paramStr = url.split('?')[1]
  const paramArr = paramStr.split('&')
  let res = {}
  paramArr.forEach((p) => {
    if (/=/.test(p)) {
      let [key, val] = p.split('=')
      val = decodeURIComponent(val)
      if (res[key]) {
        res[key] = [].concat(res[key], val)
      } else {
        res[key] = val
      }
    } else {
      res[p] = true
    }
  })
  return res
}
let url = 'http://www.domain.com/?user=anonymous&id=123&id=456&city=%E5%8C%97%E4%BA%AC&enabled';
parseParams(url)

var s1 = "get-element-by-id"
function transferCamelCase(s) {
  return s.replace(/-\w/g, function(x) {
    return x.slice(1).toUpperCase()
  })
}
transferCamelCase(s1)

function getType(obj) {
  if (obj === null) return String(null)
  return typeof obj === 'object' ? Object.prototype.toString.call(obj).replace('[object ',  '').replace(']', '').toLowerCase() : typeof obj
}

function listToTree(data) {
  const map = {}
  for (let i = 0; i < data.length; i++) {
    map[data.id] =  data
  }
  const res = []
  for (let key in map) {
    if (map[key].parentId != 0) {
      map[map[key].parentId] = [...( map[map[key].parentId] ?? []), map[key]]
    } else {
      res.push(map[key])
    }
  }
  return res
}

function treeToList(tree) {
  let res = []
  const dfs = () => {
    tree.forEach((item) => {
      if (item.children) {
        dfs(item.children)
        delete item.children
      }
      res.push(item)
    })
  }
  dfs(tree)
  return res
}

// O(n^2)
// TODO
function bubbleSort(arr) {
  const len = arr.length
  if (len === 0) return []
  for (let i = 0; i < len; i++) {
    for (let j = 0; j < len - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        let temp = arr[j + 1]
        arr[j + 1] = arr[j]
        arr[j] = temp
      }
    }
  }
  return arr
}

// O(nlongn)
function quickSort(arr) {
  if (arr.length <= 1) return arr
  const idx = Math.floor(arr.length / 2)
  const base = arr.splice(idx, 1)
  let left = []
  let right = []
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] < base) {
      left.push(arr[i])
    } else {
      right.push(arr[i])
    }
  }
  return quickSort(left).concat(base, quickSort(right))
}

function selectSort(arr) {
  const len = arr.length
  let minIdx
  for (let i = 0; i < arr.length - 1; i++) {
    minIdx = i
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[j] < arr[minIdx]) {
        minIdx = j
      }
    }
    if (minIdx !== i) {
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]]
    }
  }
  return arr
}

function insertSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    let j = i
    let target = arr[j]
    while (j > 0 && target[j - 1] > target) {
      arr[j] = arr[j - 1]
      j--
    }
    arr[j] = target
  }
  return arr
}

function binarySearch(arr, key) {
  let start = 0
  let end = arr.length - 1
  while (start <= end) {
    let mid = Math.floor((start + end) / 2)
    if (arr[mid] === key) {
      return mid
    } else if (arr[mid] < key) {
      start = mid + 1
    } else {
      end = mid - 1
    }
  }
  return -1
}


const sleep = (time) => new Promise(resolve => setTimeout(resolve, time))

const union = (a, b) => a.filter(i => b.includes(i))

// async-pool
function createRequest(tasks, pool, cb) {
  class TaskQueue {
    constructor() {
      this.queue = []
      this.result = []
      this.running = 0
    }

    pushTask(task) {
      this.queue.push(task)
      this.next()
    }

    next() {
      while (this.running < pool && this.queue.length) {
        this.running++
        let task = this.queue.shift()
        task().then(res => {
          this.result.push(res)
        }).finally(() => {
          this.running--
          this.next()
        })
      }
      if (this.running === 0) cb(this.result)
    }
  }

  const TQ = new TaskQueue()
  tasks.forEach(task => {
    TQ.pushTask(task)
  })
}

class Scheduler {
  constructor(limit) {
    this.limit = limit
    this.number = 0
    this.queue = []
  }

  addTask(time, str) {
    const target = () => new Promise((resolve) => {
      setTimeout(() => {
        console.log(str)
        resolve()
      }, time)
    })
    this.queue.push(target)
    this.start() // 取决于马上执行还是执行start时执行
  }

  start() {
    while (this.number < this.limit && this.queue.length) {
      let task = this.queue.shift()
      task().then(() => {
        this.number--
        this.start()
      })
    }
  }
}

// 不使用+号，使用下面这个方法这个方法，来实现多个数的累加
function asyncAdd(a, b, callback) {
  setTimeout(() => {
    callback(null, a + b)
  }, 500)
}


function promiseAdd(a, b) => {
  return new Promise((resolve, reject) => {
    asyncAdd(a, b, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

async function parallelSum(...args) {
  if (args.length === 1) return args[0]
  const tasks = []
  for (let i = 0; i < args.length; i += 2) {
    tasks.push(promiseAdd(args[i], args[i + 1] || 0))
  }
  const results = await Promise.all(tasks)
  return parallelSum(...results)
}

function serialSum(...args) {
  return args.reduce((pre, cur) => pre.then((res) => promiseAdd(res, cur)), Promise.resolve(0))
}

// 串行promises: 简单版
const iteratorPromise = (...promises) => {
  const iter = () => {
    if (promises.length) {
      promises.shift().then(iter)
    }
  }
  iter()
}
// 复杂版
const serialPromises = (...promises) => {
  const len = promises.length
  const res = []
  return new Promise((resolve, reject) => {
    if (len === 0) {
      resolve(res)
    }
    let idx = 1
    const iter = (v) => {
      res.push(v)
      if (idx + 1 < len) {
        promises[idx]().then(iter)
        idx++
      } else {
        promises[idx]().then(val => {
          res.push(val)
          resolve(res)
        }).catch(err => {
          reject(err)
        })
      }
    }
    promises[0]().then(iter)
  })
}

// 图片懒加载
// getBoundingClientRect: 返回6个属性，top/bottom/left/right/width/height相对浏览器视口的位置
// offsetWidth/offsetHeight包括border/padding/content
// clientWidth/clientHeight只包括content的宽高
function isVisible(el) {
  const pos = el.getBoundingClientRect()
  const windowHeight = document.documentElement.clientHeight
  const topVisible = pos.top > 0 && pos.top < windowHeight
  const bottomVisible = pos.bottom > 0 && pos.bottom < windowHeight
  return topVisible || bottomVisible
}
function lazyLoadImage() {
  const images = document.querySelectorAll('img')
  for (let image of images) {
    const realSrc = image.getAttribute('data-src')
    if (isVisible(image)) {
      image.src = realSrc
    }
  }
}

function getValue(obj, key, defaultVal) {
  let res = obj
  const keys = key.replace(/\]/g, '').replace(/\[/g, '.').split('.').filter(i => i !== '')
  for (let i = 0; i < keys.length; i++) {
    if (res[keys[i]] !== undefined) {
      res = res[keys[i]]
    } else {
      return defaultVal
    }
  }
  return res
}
var object = { a: [{ b: { c: 3 } }] }; // path: 'a[0].b.c'
var array = [{ a: { b: [1] } }]; // path: '[0].a.b[0]'
console.log(getValue(object, "a[0].b.c", 0)); // 输出3
console.log(getValue(array, "[0].a.b[0]", 12)); // 输出 1
console.log(getValue(array, "[0].a.b[0].c", 12)); // 12

function sortVersions(versions) {
  versions.sort((a, b) => {
    const arr1 = a.split('.')
    const arr2 = b.Split('.')
    let i = 0
    while (true) {
      const s1 = arr1[i]
      const s2 = arr2[i]
      i++
      if (s1 === undefined || s2 === undefined) {
        return arr2.length  - arr1.length
      }
      if (s1 === s2) continue
      return s2 - s1
    }
  })
  return versions
}

function domToJson(dom) {
  let res = {}
  res.tag = dom.tagName
  res.children = []
  dom.childNodes.forEach((item) => res.children.push(domToJson(item)))
  return res
}

function sliceBigData(total, once) {
  const ul = document.getElementById('container')
  const page = Math.ceil(total / once)
  let index = 0
  function loop(curTotal, curIndex) {
    if (curTotal <= 0) return
    const pageCount = Math.min(once, curTotal)
    window.requestAnimationFrame(function () {
      for (let i = 0; i < pageCount; i++) {
        let li = document.createElement('li')
        li.innerHTML = curIndex + i
        ul.appendChild(li)
      }
      loop(curTotal - pageCount, curIndex + pageCount)
    })
    
  }
  loop(total, index)
}

// 大数相加，通过string来实现
function add(a, b) {
  const len = Math.max(a.length, b.length)
  const num1 = a.padStart(len, '0')
  const num2 = b.padStart(len, '0')
  let sum = ''
  let cur = 0
  let pre = 0
  for (let i = len - 1; i >= 0; i--) {
    cur = Number(num1[i]) + Number(num2[i]) + pre
    pre = Math.floor(cur / 10)
    sum = cur % 10 + sum
  }
  if (pre) {
    sum = pre + sum
  }
  return sum
}

function getTenNum(testArray, n) {
  const map = {}
  const res = []
  while (n > 0) {
    const idx = Math.floor(Math.random() * testArray.length)
    if (!map[idx]) {
      res.push(testArray[idx])
      map[idx] = true
      n--
    }
  }
  return res
}

function getTenNum(arr, n) {
  const cloneArr = [...arr]
  const res = []
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * cloneArr.length)
    res.push(cloneArr[idx])
    cloneArr.splice(idx, 1)
  }
  return res
}

function longestPrefix(strs) {
  const str = strs[0]
  let idx = 0
  while (idx < str.length) {
    const curStr = str.slice(0, idx + 1)
    for (let i = 0; i < strs.length; i++) {
      if (!strs[i] || !strs[i].startsWith(curStr)) {
        return str.slice(0, idx)
      }
    }
    idx++
  }
  return str
}

function isValid(s) {
  if (s.length % 2 === 1) return false
  const map = {
    '{': '}',
    '[': ']',
    '(': ')'
  }
  const stack = []
  for (let i = 0; i < s.length; i++) {
    if (['{', '[', '('].includes(s[i])) {
      stack.push(s[i])
    } else {
      const cur = stack.pop()
      if (s[i] !== map[cur]) {
        return false
      }
    }
  }
  if (stack.length) return false
  return true
}

String.prototype.myPadStart = function (targetLen, padString = ' ') {
  let originalStr = String(this)
  const originalLen = originalStr.length
  const diff = targetLen - originalLen
  if (diff <= 0) return originalStr
  let str = ''
  while (str.length < diff) {
    str = str + padString
  }
  return str.slice(0, diff) + originalStr
}

// 提取对象中所有value大于2的键值对并返回最新的对象
// Object.entries将对将的转化为键值的二维数组
// Object.fromEntries将二维数组转化为对象
function abstractObj(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([key, val]) => val > 2)
  )
}

function recursion(obj) {
  const keys = Object.keys(obj)
  keys.forEach((key) => {
    const newKey = key.replace(/_/g, '')
    obj[newKey] = recursion(obj[key])
    delete obj[key]
  })
  return obj
}

function regReplace(obj) {
  try {
    const temp = JSON.stringify(obj).replace(/_/g, '')
    return JSON.parse(temp)
  } catch (err) {
    return obj
  }
}

const a = { b: {c: 1} }
const hasCycle = (obj) => {
  const map = new Map()
  let res = false
  const loop = (obj) => {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      const val = obj[keys[i]]
      if (map.has(val)) {
        res = true
        return
      }
      map.set(val, keys[i])
      if (val && typeof val === 'object') {
        loop(val)
      }
    }
  }
  loop(obj)
  return res
}

function findMaxThree(arr) {
  if (arr.length <= 3) return arr
  const res = []
  const map = new Map()
  arr.forEach((item, key) => map.set(item, key))
  for (let i = 0; i < arr.length; i++) {
    if (res.length < 3) {
      res.push(arr[i])
    } else {
      for (let j = 0; j < 3; j++) {
        if (arr[i] > res[j]) {
          res[j] = arr[i]
        }
      }
    }
  }
  return res.map((i) => map.get(i))
}

// 盒模型如何设置、获取盒模型对应的宽和高

document.style.width / height // 只能获取行内样式
window.getComputedStyle(element).width/height
element.getBoundingClientRect().width/height

// BFC： 块级格式化上下文
// 创建了一个独立的空间，空间内的元素不受外面元素的影响
// 触发条件：
overflow: hidden / auto
position: fixed / absolute
display: inline-block / flex / inline-flex / tabel-cell
// 原理：
// BFC内部的元素会margin会边距重叠
// BFC创建独立的容器，外边的元素不影响里边的元素
// BFC元素不与float box元素重叠
// 计算BFC的高度时，float子元素也参与计算

// 三栏布局
// .left {float: left} .right{float: right} // float
// .left {position: absolute, left: 0} .right {position: absolute, right: 0} .center{left: 300, right: 300} // absolute
// .father { display: flex} .left{width: 300} .right{width: 300} .center {flex: 1} // flex
// .father {display: table} .son{display: table-cell} .left{width: 300} .right {width: 300}
// .father {display: grid; width: 100%; grid-template-rows: 100px; grid-template-columns: 300px auto 300px}

// CSRF： cross-site request forgery 跨站请求伪造
// 登录授信网站A，并在本地生成cookies，在不登出A的情况下，访问恶意网站B，
// B会请求A网站的接口，带着cookies，所以就模拟了A的操作权限
// 解决方法： 
// 1. 使用验证码
// 2. token验证
// 3. Referer验证：只接受本站的请求，服务器才做响应

// XSS: cross-site scripting:跨域脚本攻击
// 恶意攻击者往 Web 页面里插入恶意可执行网页脚本代码，当用户浏览该页之时，嵌入其中 Web 里面的脚本代码会被执行，从而可以达到攻击者盗取用户信息或其他侵犯用户安全隐私的目的。
// 也是一种代码注入攻击
// 类型：反射型/存储型/DOM型
// 解决方法：
// 1. httpOnly: 防止js获取cookies
// 2. 服务器对脚本进行过滤和转码
  
// 点击劫持
// 一种视觉欺诈的攻击手段，攻击者将需要攻击的网站通过iframe的方式嵌入自己的页面，并将iframe设置为透明，在页面中透出一个按钮诱导用户点击
// 实际上点击的是iframe的button
// 防御措施
// X-FRAME-OPTIONS, 有三个值
// DENY： 不允许通过iframe的方式展示
// SAMEORIGIN: 在相同域名的情况下通过iframe展示
// ALLOW-FROM：表示可以在指定来源的iframe中展示

// 同源策略： 限制一个源的文档和脚本如何与另一个源的资源进行交互
// 同源：协议 + 域名 + 端口均相同
// 限制体现在：
// 1. 无法获取cookies/localStorage/IndexDB
// 2. 无法操作DOM
// 3. 不能发送ajax请求

// 前后端如何通信
// ajax/socket/cors

// 跨域
// jsonp: 仅支持get
// cors：服务端配置，支持所有类型的http请求，是跨域的根本解决方案
// websocket: 双工通信
// postMessage: 多窗口间/页面与iframe间通信
// node代理：服务器不受同源策略的限制

// 前端错误监控
// 前端错误分类： 
// 1. 运行时错误（代码错误） 
// 捕获方式：
// a. window.onerror
// b. try {} catch {}
// window.onerror 无法捕获跨域js运行错误
// HTML5支持本地获取跨域脚本的错误信息
// 1. 跨域脚本的服务器必须通过 access-control-allow-origin头信息，允许当前域名可以获取错误信息
// 2. 当前域名的script标签上增加crossorigin属性，表明指定的src是允许跨域的地址
// 2. 资源加载错误
// a. img/script标签添加onerrorL事件，来捕获资源加载错误
// b. 资源加载错误，虽然会阻止冒泡，但不会阻止捕获，可以在head里加一个script
// window.addEventListener('error', function() {}, true)
// 3. 报错上报
// a. ajax上报
// b. 利用Image对象发送消息(new Image()).src = 'http://post.error.com?data=msg'

// http
// 特点：
// 1. 无连接： 连接一次就会断开，不会继续保持连接
// 2. 无状态： 一次请求结束后，就断开了，第二次请求时服务端没有记住之前的状态
// 3. 简单快速： 每个资源都通过url来定位
// 4. 灵活：http头部有一个数据类型，通过http协议可以完成不同数据类型的传输

// http报文的组成
// 请求报文： 
// 1. 请求行
// 2. 请求头
// 3. 空行
// 4. 请求体
// 响应报文
// 1. 响应行
// 2. 响应头
// 3. 空行
// 4. 响应体

// get 与 post
// 1. 浏览器回退时，get请求不会重新请求，post会重新请求
// 2. get请求会被浏览器缓存，post不会
// 3. get请求的参数会被保留在浏览器的历史记录里，post不会
// 4. get请求的url参数有大小限制，2k,
// 5. get请求参数暴露在url上，post在请求体中

//长连接/持久连接
// http 1.1通过使用connection：keep-alive进行长链接，客户端请求一次后，服务端会继续保持连接（一般是15s），避免重新建立连接
// 2.0 比 1.1的优势
// 1. 多路复用
// 2. 头部压缩
// 3. 服务端推送
// 4. 二进制传输

// 前端SEO需要考虑哪些
// 1. 语义化的HTML标签：搜索引擎更容易理解网页
// 2. 重要的HTML写在前面：搜索引擎是抓取HTML的顺序是从上至下，有的引擎抓取长度是有限的
// 3. 重要的内容不要用js输出，爬虫不会执行js获取内容
// 4. 少用iframe，搜索引擎不用抓取iframe的内容
// 5. 图片要加alt属性
// 6. 提高网站速度：网站速度是搜索引擎排序的重要指标

// image的title和alt属性
// title是鼠标hover上去时会显示
// alt属性是图片内容的等价描述， 图片无法加载时显示，提高图片的高可访问性，搜索引擎也会重点分析

// OPTIONS请求即预检请求，可用于检测服务器允许的http方法。当发起跨域请求时，
// 由于安全原因，触发一定条件时浏览器会在正式请求之前自动先发起OPTIONS请求，即CORS预检请求，
// 服务器若接受该跨域请求，浏览器才继续发起正式请求。

// 从输入url到浏览器渲染经历哪些步骤
// 1. DNS解析域名的实际IP地址
// 浏览器缓存 => 本机缓存 => hosts文件 => 路由器缓存 => ISP => 域名服务器
// 2. 检查浏览器是否有缓存
// 流览器的缓存分为强缓存和协商缓存
// 首先会判断是否命中强缓存： 强缓存不会发送请求，直接从缓存中读取，可以设置header的expire和cache-control字段，expire采用绝对时间，受本地时间影响，cache采用相对时间，单位为s
// 未命中则去判断协商缓存：last-modified和etag，last-modified对比的是时间，etag比较的是hash值，etag更精准
// 3. 建立TCP连接
// 三次握手建立连接：客户端发送SYN报文段发送连接请求，确认服务端是否开启端口准备连接；
// 服务端接受报文，并返回一个SYN+ACK报文端给客户端；客户端接收SYN+ACK报文段，向服务端发ACK报文段表示确认 => 连接建立可以开始传输数据了
// 4. 发送请求获取html：向服务器的ip地址发送请求，将url对应的静态资源返回，如果是服务端渲染，会把模版和数据渲染好的html返回给前端
// 5. 浏览器解析html文档：解析html为一个个标签，下载资源，
// 6. 渲染页面：构建DOM树 => 构建CSSOM树 => 合成RenderTree => 进入布局阶段，计算每个节点的位置（Layout）=> 绘制整个页面（Paint）
// 7. 浏览器执行js脚本：async/defer => 这个过程中会有dom操作
// 8. 发起网络请求：发送ajax/socket网络请求
// 9. 处理事件循环等异步逻辑：开始处理setTimeout/setInterval/promise等宏任务、微任务队列

// defer/async
// 相同点：两都都会异步下载脚本，下载过程不会影响页面解析
// defer: 会在解析完成后，DOMContentLoaded前，顺序执行
// async：脚本下载完成后立即执行
// 应用场景：脚本依赖DOM元素和其它脚本的执行时，使用defer
// 如何两上都设置，则defer优先级高

// 对称加密和非对称加密
// 对称加密：发送方和接收方使用同一个密钥去加密和解密
// 非对称加密：使用一对密钥，即公钥和私钥，私钥自己保存，公钥是公共的密钥，任何人都可以获得 => 用公钥加密，用私钥解密，安全性更好

// https原理
// 1. 客户端发起一个https请求，并会生成一个随机数1， 将随机数1，自己支持的SSL版本号以及加密算法这些信息告诉服务器B
// 2. 服务端收到后，确认加密算法，然后生成一个随机数2，并将随机数和CA证书一起返回给客户端A
// 3. 客户端收到后，验证CA证书的有效性，验证通过后用CA证书中公钥加密随机数3返回给服务端
// 4. 服务端收到后用私钥解密得到真正的随机数3
// 5. 此时，客户端和服务端都有随机数1，2，3，然后得用这三个随机数生成对话密钥，之后用对话密钥进行国密和解密
// 6. 客户端通知服务端，后面使用对话密钥来完成，通过服务端客户端的握手结束
// 7. 服务端通知客户端，后面使用对话密钥来完成，通知客户端服务端的握手结束
// 8. SSL的握手部分结束

// 前端性能优化
// 1. 网络传输性能优化
// 1.1 使用浏览器缓存，服务器配置etag字段（etag会把缓存存放到硬盘上，否则在内存）
// 1.2 资源打包压缩：js压缩/html压缩/css提取并压缩/服务端开启Gzip传输压缩
// 1.3 图片资源优化：使用雪碧图/使用iconfont/使用webp/图片懒加载
// 1.4 使用CDN分发
// 1.5 预加载： dns-prefetch/preload
// 2. 页面渲染性能优化
// 2.1 不要用js操作元素样式
// 2.2 DOM元素离线更新
// 2.3 尽量减少DOM深度
// 2.4 对于大量重绘重排的元素开启GPU加速

// html5 新特性
// 1. 语义化的标签 header footer section nav article
// 2. 媒体播放video/audio
// 3. 拖拽api
// 4. canvas画板
// 5. 地理位置geolocation
// 6. webworker
// 7. localStorage/sessionStorage
// 8. websocket
// 9. postMessage跨窗口通信
// 10. 历中管理history
// 11. Form Data对象

// cookie localStorage sessionStorage
// 1. cookie用于客户端和服务端间传输，localStorage/sessionStorage仅存在本地
// 2. cookie大小不超过4k， localStorage/sessionStorage 可以达到5M
// 3. localStorage除非手动clear，否则一直有效；sessionStorage在页面关闭时删除；cookie有过期时间限制 

// iframe有哪些缺点
// iframe会阻塞主页面的onload事件
// 搜索引擎无法解析这种页面，不利于seo
// 与主页面共享连接池，影响页面的并行加载

// 块级元素 内联元素 内联块元素（button/input/select/image/textarea）
// 块级元素会独占一行，而内联元素和内联块元素则会在一行内显示；
// 块级元素和内联块元素可设置 width、height 属性，而内联元素设置无效；
// 块级元素的 width 默认为 100%，而内联元素则是根据其自身的内容或子元素来决定其宽度；

// canvas 和 svg的区别
// svg放大不会失真，canvas会
// canvas可以导出为图片，svg不行
// svg支持事件处理，canvas不支持

// 渐近增强 和 优雅降级
// 渐近增强： 针对低版本浏览器进行构建页面，保证基本的功能，然后再针对高版本的浏览器进行效果、交互等改进和追加功能达到更好的用户体验
// 优雅降级： 一开始就构建完整的功能，再针对低版本的浏览器进行兼容
// 区别： 优雅降级是从复杂的开始，渐近增强是从基础的开始

// 为什么用多域名来存储网站资源会更有效
// 1. 突破浏览器并发限制
// 2. 节约主域名连接数，优化网页响应速度
// 3. 节约cookie带宽
// 4. CDN缓存更方便，方便用户就近获取资源

// src和href的区别
// src（source）用于替换当前元素， href(reference)用于当前文档和引用资源之间建立联系
// src 浏览器解析到当前元素时，会暂停其它资源的下载和处理
// href解决到当前元素时，会并行下载资源，并不会停止对当前文档的处理

// 制作网页用到的图片
// png/jpeg/git/svg/webp
// 在质量相同的情况下，WebP格式图像的体积要比JPEG格式图像小40%

// 从用户刷新网页开始，一次js请求一般情况下有哪些地方会有缓存处理？
// dns缓存 cdn缓存 浏览器缓存

// 一个页面有大量图片（电商），如何优先
// 懒加载
// 预加载
// 雪碧图 / iconfont / base64
// 如果图片过大，可以使用特殊编码的图片，加载时会先加载一张压缩的特别厉害的缩略图，以提高用户体验。

// title与h1 b与strong i与em
// title属性没有明确语意，只是个标题，h1则表示层次明确的标题
// strong表示强调，用粗全表示，seo时会有侧重，b只是表示粗体
// i表示内容为斜体，em表示强调的文本

// cookie的弊端
// 数量和长度的限制：每个域名只有20个cookie，每个cookie不超过4kb,超过就会被截断
// 如果cookies被拦截，就可以获取到所有session信息。

// jwt: json web token
// 是一种认证协议，用来校验请求的身份信息和身份权限
// 特点是：客户端存储
// 由header/payload/signature三部分组成
// 其中header和payload是json格式，header描述这个token的基本信息，比如signature的加密算法类型
// payload是用户信息，token是将header/payload base64化，再和header/token+自定义私钥一起生成加密字符串，通过.拼接在一起
// 1. 客户端使用用户名跟密码请求登录
// 2. 服务端收到请求，去验证用户名与密码
// 3. 验证成功后，服务端会签发一个 token 并把这个 token 发送给客户端
// 4. 客户端收到 token 以后，会把它存储起来，比如放在 cookie 里或者 localStorage 里
// 5. 客户端每次向服务端请求资源的时候需要带着服务端签发的 token
// 6. 服务端收到请求，然后去验证客户端请求里面带着的 token ，如果验证成功，就向客户端返回请求的数据
// 每一次请求都需要携带 token，需要把 token 放到 HTTP 的 Header 里
// 基于 token 的用户认证是一种服务端无状态的认证方式，服务端不用存放 token 数据。用解析 token 的计算时间换取 session 的存储空间，从而减轻服务器的压力，减少频繁的查询数据库
// refresh token 是专用于刷新 access token 的 token。如果没有 refresh token，也可以刷新 access token，但每次刷新都要用户输入登录用户名与密码，会很麻烦。有了 refresh token，可以减少这个麻烦，客户端直接用 refresh token 去更新 access token，无需用户进行额外的操作。

// css sprite
// 将很多小图拼接到一个图片中，再通过background-position和元素尺寸调整需要显示的背景图案
// 优点：减少http请求；提高图片压缩化，减小图片大小
// 缺点：维护麻烦，一个图片变更要重新布局整个图片

// display:none 和 visibility:hidden的区别
// 相同占：都是让元素不可见
// 区别：
// 1. display:none的元素不会出现在渲染树中，渲染时不占任何空间，visibility元素会出现在渲染树中，渲染时会占空间，只是不可见
// 2. 更改元素的display属性会导致文档重排，更改visibility只会让当前元素重绘，成本低
// 3. display:none是非继承属性，更改子元素的display属性不会显示；visibility是继承属性，更改子元素的visibility为true会显示子元素

// link 和 @import
// 1. link是html标签，除加载css，可以加载favicon； @import是css语法，只能用来加载css
// 2. 页面加载时，link会和html同时加载；而@import引入的css会在页面加载完成后加载
// 3. link没有兼容性问题，@import在版本低的浏览器里有兼容性问题
// 4. 可以通过js操作DOM,插入link标签来改变样式，而@import的方式插入样式

// FOUC: flash of unstyled content
// 把样式表放到文档的head：用户定义样式表加载出来之前，浏览器使用默认样式显示文档，用户样式加载后又重新渲染，造面页面闪烁

// display/float/position三者的关系
// display为none时，float/position都无效
// display不为none, 设置float后，display会转为block
// 同时设置了display/float/position后，float变为none, display转为block
// 绝对定位、弹性布局、网格布局中的display会被块级化

// 为什么要进条css样式初始化
// 因为浏览器之间有兼容性差异，有一些标签的默认值不同，会导致在不同浏览器的显示不一样

// 清除浮动的方式
// 设置你元素的高度
// 父元素新加一个div，设置clear:both
// 父元素增加一个伪元素： ::after{clear: both;}
// 父元素设置overflow:hidden

// css3新增伪类
// p:first-of-type
// p:last-of-type
// p:only-type
// p:nth-child

// 伪类和伪元素的区别
// 伪类以:开头，用于选择处于特定状态的元素，不会产生新的元素
// 伪元素以::开头，用于在文档中插入虚构的元素， ::after ::before ::selection ::first-line ::first-letter

// css优先级
// !important > 行联样式 > id  > class > tag > 通配符

// inline-block 元素间的显示的间隙
// 产生原因：HTML代码中的空格，回车换行被转成一个空白符，空白符中一定的宽度
// 解决方案：
// 1. 移除标签间的空格
// 2. 父元素设置font-size为0
// 3. 使用margin负值
// 4. 设置父元素display:table word-spacing:-1rem

// 行内元素float生效后，会更像inline-block，即padding-top/padding-bottom/width/height都是有效果的

// css3动画的属性
// transition
// transform
// animation

// base64编码原理 => 编码后比编码前大
// 每三个字符为一组，按ASCII码为8位二进制 => 将24位分为4组，每组为6位 => 每组前补两个0变成8位 => 再对应编码表取值
// 优点：可以加密，减少http请求
// 缺点：需要消耗CPU进行编解码

// sass/less/stylus的区别
// 编译环境不同：sass需要ruby环境，less需要less.js，stylus需要安装node
// 变量符不一样：sass: $, less: @, stylus:驼峰
// 输出风格不同

// postCss
// 是一个js工具，可以将css代码转换为抽象语法树（AST），然后提供接口用于使用js插件对其分析和修改
// 常见的如 auto-prefixer

// css3写一个幻灯片
.ani {
  width: 480px;
  height: 320px;
  background-size: cover;
  -webkit-animation-name: 'loop'
}
@-webkit-keyframes 'loop' {
  0 % {
    background: url()
  }
  25 % {
    background: url()
  }
  50 % {
    background: url()
  }
  75 % {
    background: url()
  }
  100 % {
    background: url()
  }
}

// rgba 与 opacity的透明效果有什么不同
// rgba()和opacity都能实现透明效果，但最大的不同是opacity作用于元素，以及元素内的所有内容的透明度，
// 而rgba()只作用于元素的颜色或其背景色。（设置rgba透明的元素的子元素不会继承透明效果！）

// css中可以让文字在垂直和水平方向上重叠的两个属性是什么？
// line-height小于font-size，垂直方向上重叠
// letter-spacing为负数， 水平方向中上重叠

// 如何垂直居中一个image
.container {
  display: table - cell;
  text - align: center;
  vertical - align: middle;
}

// px em rem
// px 固定像素单位
// em 继承父元素的font-size大小
// rem 为根元素的font-size大小

// css hack
// 利用不同浏览器对CSS的支持和解析结果不一样编写针对特定浏览器样式。

// css 哪些属性可以继承
// 字体属性：font、font-family、font-size、font-style、font-variant、font-weight
// 字母间距属性：letter-spancing
// 可见性属性：visibility
// 文字展示属性：line-height、text-align、text-indent、text-transform
// 字间距属性：word-spacing

// 隐藏元素的方法
// display:none
// visibility: hidden
// opacity: 0
// transform: scale(0)
// height: 0 border: 0
// position: absolute 然后给一个极大的负值

// 多列等高布局
// 1. table: .father {display: table} .son {display: table-cell}
// 2. flex:  .father {display: flex}  .son {flex: 1}
// 3. grid:  .father {display: grid}

// css优化提高性能的方法
// css雪碧图
// 合并css文件减少http请求
// 提取公共样式
// 减少无效样式代码
// 避免样式嵌套过深
// 避免使用css表达式

// 浏览器是如何解析css选择器的：从右到左

// 抽离样式模块
// css拆成两部分： 公共css  和  业务css
// 网站的配色/字体/交互提取出来为公共css
// 对于业务的css要使用公共的前缀

// 响应式设计的基本原理
// 网站能够兼容多个终端，而不是为每个终端做一个版本
// 媒体查询为不同尺寸的设备适配不同的样式
// 对于低版本的浏览器，可以采用js获取屏幕宽度，然后通过resize方法来实现
// 动态rem

function autoResponse(width = 750) {
  const target = document.documentElement
  if (target.clientWidth > 600) {
    target.style.fontSize = '40px'
  } else {
    target.style.fontSize = `{target.clientWidth/width}px`
  }
}
autoResponse()
window.addEventListener('resize', autoResponse)

// a标签上个伪类的执行顺序
// link visited hover active

// 如何修改chrome记住密码后自动填充表单的黄色背景
// 1. 关闭自动填充 from上加 autocomplete='off'
// 2. input:-webkit-autofill {background-color: transparent}

input['search']:: -webkit - search - cancel - button {
  -webkit-appearance: none
}

// line-height： 行高，两行文字基线之间的距离
// px
// em： 相对于当前元素的字体大小
// 纯数字： 当前元素的字体大小的倍数
// %： 相对于当前元素的字体大小

// IOS 手机浏览器字体锯齿设置
font-smoothing: antialiased


// 一个高度自适应的div，里面有两个div，一个高度100px，希望另一个填满剩下的高度
// 1. calc
// .sub {height: calc(100% -100px)}
// 2. flex
// .super{display: flex; flex-direction: column} .sub {flex: 1}
// 3. 绝对定位
// .super {position: relative;} .sub { position: absolute; top: 100px; bottom: 0}

// 渲染层
// DOM树中每个节点对应一个渲染对象（Render Object），当他们的渲染对象处于相同的坐标空间（z轴）时，就会形成一个渲染层
// 渲染层将保证页面元素以正确的顺序堆叠
// 浏览器如何创建新的渲染层
// 1. 根元素document
// 2. 有明确的定位属性
// 3. opacity < 1
// 4. css filter
// 5. css mask
// 6. css transform
// 7. overflow不为visible
// 合成层：满足某些特殊条件的渲染层，会被浏览器自动提升为合成层
// 满足哪些特殊条件会提升为合成型
// 1. 3D transform
// 2. video/canvas/iframe
// 3. position:fixed
// 4. will-change

// 闭包：指有权访问别一个函数作用域中变量的函数，创建闭包就是在函数内创建另一个函数，通过另一个函数访问这个函数的局部变量
// 特点：函数内嵌函数；内部函数可以访问层的参数和变量；外层的参数和变量不被回收
// 优点： 避免全局变量污染，封装私有属性，实现缓存
// 缺点： 常驻内存，使用不当造成内存泄露
// 使用注意点： 退出函数之前，将不使用的局部变量全部删除

// let const
// 特点： 块级作用域；暂时性死区；重复声明报错；不绑定全局作用域(不会绑定到window下)
// 区别： const 声明常量，不允许修改（对象可以个改值，但不可以修改绑定，也就是不能直接赋值[] {}, 只能通过查找属性赋值）, const声明后必须马上赋值，否则会报错
// 暂时性死区： 只要一进入当前作用域，所要使用的变量就存在了，但是不可获取，只有等到声明变量的那行代码出现，才可以获取和使用

// 变量提升
// js会经历编译阶段和执行阶段，编译阶段就是搜集所有的变量声明，并将这些声明提前

// 什么是作用域
// js将作用域定义为一套规则，这套规则用来管理在当前作用域和子作用域中如何查作变量名和函函名

// 什么是作用域链
// 当访问一个变量时，编译器首先会在当前作用域查找是否有这个标识标识符，如果没有就继续向父作用域里找，直到全局作用域
// 这就构成了作用域链，保证当前作用域对符合访问权限的变量和函数有访问

// 事件代理
// 又称事件委托，是利用DOM元素的事件冒泡，将原本绑定的事件委托给父元素, 以提高性能
// 如对li的监听，可以放到ul上

// this的指向：总是指向函数的直接调用者
// 作为函数调用，指向window
// 最为对象的就去调用，指向最后调用对象
// 作为构建函数调用，改变this指向，指向实例
// apply/call/bind的参数调用，指向第一个参数，如果为null就是window
// 箭头函数的this指向，函数定义时的this,而非执行时（最近一层非箭头函数的this）
// 改变this指向的方法
// 1. call/apply/bind
// 2. 箭头函数
// 3. new 一个构建函数

// 箭头函数
// 1. 书写简单
// 2. 箭头函数不绑定this, 箭头函数的this是指向定义时的this,而非执行时（最近的非箭头函数的this）
// 3. 箭头函数不能做为构建函数用
// 4. 箭头函数没有arguments
// 5. 不存在原型对象prototype属性

// 模块化开发怎么做
const module = ()(functon() { return { m1, m2 } })
// 立即执行函数，不暴露私有属性

// 异步加载js的方法
// 1. async
// 2. defer
// 3. 动态创建script
// 4. LABjs: loading and blocking javascript

// 造成内存泄漏的原因
// 1. 不恰当的闭包
// 2. 遗忘的定时器
// 3. 遗忘的事件监听
// 4. 游离的DOM引用
// 5. 隐式全局变量
// 6. 未清理的console
// 7. setTimeout第一个参数为字符串而非函数时也会造成内存泄漏

// eval
// 把字符串解析成js代码再执行（两次，性能差，一次解析，一次执行）
// 可以把json字符串转换为json对象 
let obj = eval('(' + jsonStr + ')')

// 判断一个数组
// Array.isArray
// arr instanceof Array
// arr.constructor === Array
// Object.prototype.toString.call(arr) === '[object Array]'

// callee 和 caller
// callee 是 arguments对象的指针，指向拥有arguments这个对象的函数
// caller 保存着调用当前函数的函数的引用，如何为window则为null

// 实现一个拖拽
window.onload = function () {
  var box = document.getElementById('#id')
  box.onmousedown = function (e) {
    var distanceX = e.clientX - box.offsetLeft
    var distanceY = e.clientY - box.offsetTop

    document.onmousemove = function (ev) {
      let left = ev.clientX - distanceX
      let top = ev.clientY - distanceY
      if (left <= 0) {
        left = 0
      } else if (left >= document.documentElement.clientWidth - box.offsetWidth) {
        left = document.documentElement.clientWidth - box.offsetWidth
      }

      if (top <= 0) {
        top = 0
      } else if (top >= document.documentElement.clientHeight - box.offsetHeight) {
        top = document.documentElement.clientHeight - box.offsetHeight
      }

      box.style.left = left + 'px'
      box.style.top = top + 'px'
    }

    box.onmoveup = function () {
      document.onmousemove = null
      box.onmouseup = null
    }
  }
}

// js 实现连续动画
const dom = document.getElementById('id')
let flag = true
let left = 0
function render() {
  left === 0 ? flag = true : left === 100 ? flag = false : ''
  flag ? dom.style.left = `${left++}px` : dom.style.left = `${left--}px`
}
function animate() {
  render()
  requestAnimationFrame(animate)
}
animate()

// Electron的理解：electron本身是一个套了chrome的nodejs程序
// 因为是chrome： 无兼容性问题
// NodeJS可以做的，它都可以做

// 单例模式的Storage
class Storage {
  static getInstance() {
    if (!Storage.instance) {
      Storage.instance = new Storage()
    }
    return Storage.instance
  }
   getItem(key){
        return localStorage.getItem(key)
  }
  setItem(key,value){
        return localStorage.setItem(key,value)
  }
}

// 闭包片
const ProxyCreateSingleton = (function(){
    let instance;
    return function(name) {
        // 代理函数仅作管控单例
        if (instance) {
            return instance;
        }
        return instance = new Singleton(name);
    }
})();
// 独立的Singleton类，处理对象实例
const Singleton = function(name) {
    this.name = name;
}
Singleton.prototype.getName = function() {
    console.log(this.name);
}
let Winner = new PeozyCreateSingleton('Winner');
let Looser = new PeozyCreateSingleton('Looser');

// 垃圾回收机制的两种方法： 标记清除 和 引用计数

// js对象生命周期的理解
// 创建对象时，引擎会为对象分配内配
// 垃圾回收器定期扫描对象，对象被其它变量引用则计数+1
// 如果被引用计数为零，则回收该对象的内存

// 超时处理
const requestHandle = (url, time) => {
  const request = axios(url)
  const timeout = new Promise((_, reject) => {
    setTimeout(() => {
      reject('timeout')
    }, time)
  })
  return Promise.race([request, timeout])
}

// 数组找第N大值
function findMaxNumbers(arr, N) {
  if (arr.length < N) return null
  arr.sort((a, b) => b - a)
  const res = Array.from(new Set(arr))
  return res[N - 1] ?? null
}

 // BOM 和 DOM
 // Document Object Model： 文档对象模型, 根节点是document
 // Browser Object Model：浏览器对象模式，核心是window，包括document/navigator/history/location/screen

// 如何删除一个cookie： 将expires移为前一天
const date = new Date()
date.setDate(date.getDate() - 1)
document.cookie = 'user=' + encodeURIComponent('name') + ';expires=' + new Date(date)

// 为什么通常在发送数据埋点请求的时候使用的是 1x1 像素的透明 gif 图片
// 1. 能够完成完整的http请求
// 2. 触发get请求后不需要获取和处理数据，服务端也不用返回
// 3. 没有跨域的问题
// 4. 执行过程无阻塞
// 5. GIF的最低合法体积最小，应该是40+kb
// 6. 相对XMLHTTPRequest的get请求，性能更好

// 判断是否为合法的网址
function isUrl(url) {
  try {
    new URL(url)
    return true
  } catch (err) {
    return false
  }
}

// Loader：本质是一个函数，在函数中对接收的内容进行转化，webpack只认识js，loader就是一个翻译官对其它类型的资源进行转译的预处理工作
// file-loader
// url-loader
// css-loader
// style-loader
// sass-loader
// ts-loader
// babel-loader
// postcss-loader
// eslint-loader

// Plugin：基于事件流框架Tapable，本质上就是发布订阅机制，在webpack运行周期里去广播，插件监听到在合适的时机通过webpack API去改变输出结果
// html-webpack-plugin
// uglifyjs-webpack-plugin
// mini-css-extract-plugin
// clean-webpack-plugin
// webpack-parallel-uglify-plugin
// clean-webpack-plugin

// source-map 是将编译、打包、压缩后的代码映射回源码的过程，打包压缩后的代码不可读，想要调试就需要source-map

// 模块打包原理

// interface 与 type 区别
// 相同点：都可以定义拉口；都可以继承(extends 和 &操作符)
// 不同点：type可以定义联合类型/元组/基础类型

enum Direction {
  Up,
  Down,
  Left,
  Right,
}

var Direction
(function () { 
  Direction[Direction['up'] = 0] = 'up'
})(Direction || Direction = {})


// 为什么vue不需要fiber

// 项目管理
// 研发项目的基本流程
// 需求评审 => 视觉/交互评审 => 技术方案评审 => 研发 => 测试用例评审 => 提测 => 验收反馈、优化 => 上线 => 复盘

// 项目启动
// 需求评审
// 1. 业务场景是否考虑周全
// 2. 合作方是否时间充足（依赖的合作方没有时间开发）

// 规划过程
// 1. 排期（制作进度计划）
// 1.1 需求分解
// 1.2 预留buffer(并行的开发任务多，buffer要留得越多；如何单次需求越大，buffer要留得越多)
// 2. 识别风险
// 2.1 技术风险：为什么有要技术方案评审（开发文档）
// 2.2 管理风险
// 列一些场景：
// 1. 接口依赖方是否能按时提供接口
// 2. 视觉和交互稿能否按时交付
// 3. 技术方案的可行性是否评估到位
// 4. 受影响的范围是否考虑周全

// 执行过程
// 1. 需求变更
// 1.1 出现变更不能盲目执行
// 1.2 任何的需求变更都要重新进生评估
// 1.3 要对需求进行持续跟踪，所有需求都需要在平台中录入并更新，方便后面对需求的管理
// 2. 自测：冒烟测试

// 监控过程
// 1. 工作报告：日报/周报
// 1.1 个人周报中体现 本周的进度；下周的计划；工作中遇到的问题和建议
// 1.2 团队角度：重点业务关键节点的check
// 2. 站会（晨会）：协同的过程

// 收尾阶段
// 上线前： 功能测试/视觉走查/产品验收/业务方功能演示
// 上线后： 监控告警/人员值班/项目复盘


import { useRef } from 'react'
const usePrevious = val => {
  const pre = useRef()
  const cur = useRef()
  useEffect(() => {
    pre.current = cur.current
    cur.current = val
  }, [val])
  return pre.current
}

const useTimeout = (cb, delay) => {
  const memorizedCb = useRef()

  useEffect(() => {
    memorizedCb.current = cb
  }, [cb])
  
  useEffect(() => {
    if (delay !== null) {
      const timer = setTimeout(() => {
        memorizedCb.current()
      }, delay)
    }
    return () => {
      clearTimeout(timer)
    }
  }, [delay])
}

const useInterval = (cb, delay) => {
  const memorizedCb = useRef()

  useEffect(() => {
    memorizedCb.current = cb
  }, [cb])

  useEffect(() => {
    if (delay !== null) {
      const timer = setInterval(() => {
        memorizedCb.current()
      })
    }
    return () => {
      clearInterval(timer)
    }
  }, [delay])
}

const useLatest = val => {
  const ref = useRef()
  ref.current = val
  return ref.current
}

const useDebounceFn = (fn, options) => {
  const ref = useRef()
  ref.current = fn

  const debounced = useMemo(() => {
    return debounce((...args) => ref.current(...args), options)
  }, [])

  useEffect(() => {
    return () => {
      debounce.cancel()
    }
  })

  return {
    run: debounced,
    cancel: debounced.cancel,
    flush: debounced.flush
  }
}

const useDebounce = (val => {
  const [debounced, setDebounced] = useState(val)
  const { run } = useDebounceFn(() => setDebounced(val))
  useEffect(() => {
    run()
  }, [val])
  return debounced
})

// useEffect的第二个参数
// 1. 不传参数，默认的行为每次render都会执行
// 2. 空数组，等同于组件的componentDidMount
// 3. 1个值的数组，比较该值有变化有执行
// 4. 多个值的数组，有一个不相等就执行

// fiber树
// 每一个节点都有三个指针：分别指向第一个子节点；下一个兄弟节点；父节点
// 遍历过程：
// 1. 从根节点开始遍历，遍历该节点的子节点、下一个兄弟节点，如果两者都遍历完了，则回到它的父节点
// 2. 当一个节点的子节点遍历完成，才认为该节点遍历完成
// 3. 当遍历发生中断时，只要保留下当前节点的索引，断点是可以恢复，因为每个节点都保持着对父节点的引用
// 渲染的过程可以被中断，可以将控制权交回浏览器，让位给高优先级的任务，浏览器空闲后再恢复渲染。

// 树和fiber看起来很像，但实际上一个是树一个是链表
// React Fiber是React 16提出的一种更新机制，使用链表取代了树，将虚拟dom连接，使得组件更新的流程可以被中断恢复；它把组件渲染的工作分片，到时会主动让出渲染主线程

// 为什么react需要fiber而vue不需要
// 1. 因为react先天不足，无脑刷新，所以需要fiber纤程去把组件渲染工作切片；vue基于数据劫持，更新粒度更小，没有这个压力
// 2. fiber因为保留了兄弟节点和父节点的引用，所以中断后只要保留中断的节点索引，就可以恢复之前的工作进度

// react中元素与组件的区别
// react元素是最小的基本单位，JSX语法创建的一个react元素，不是真实的DOM，仅是js对象，无法直接调用DOM的API 
// 组件，常规就两类class语法组件和无状态函数组件
// 元素是组件的基本单位，组件是由元素构成的，而组件本质是类或者纯函数

// React的forwardingRefs 用于获取子组件的元素
// React.forwardRef 会创建一个React组件，这个组件能够将其接受的 ref 属性转发到其组件树下的另一个组件中

// 受控组件和非受控组件
// 受控组件：是指组件的值保存在state中，在输入过程中，通过onchange事件获取输入的值，再通过setState去更新状态
// 非受控组件：不再为每一个状态更新编写数据处理函数，可以通过ref操作真实DOM

// 状态提升
// 几个组件有共用状态数据的情况，可以把这几个组件共享的状态，提升到最近的公共父组件中进行管理

// 高阶组件HOC
// 高阶组件不是组件，而是增强函数，可以输入一个元组件，再返回一个增强后的新组件，是一种设计模式
// 优点：逻辑复用，影响被包裹组件的内部逻辑
// 缺点：hoc传递的props容易和被包裹的组件重名，进行被覆盖

// 什么是Context
// 通过组件树提供了一个传递数据的方法，从而避免了在每一级都手动地去写props
// 跨层级的组件数据传递。

// react中的portal
// 将子级件渲染到父组件以外的DOM节点的API

// Error Boundary
// 也是一个react组件，捕获子组件的js异常，设置备用UI渲染，防止整个页面崩掉
// 可以给顶级路由级件加ErrorBoundary，也可以为任意的子组件去加

// react事件机制
// 用户为onClick添加函数时，React并没有将click绑定到DOM上
// 在document这块用一个对所有的事件的监听，当事件冒泡到document时，再封装事件回调函数交给中间层SyntheticEvent
// 所以当事件触发的时候，使用统一的分发函数dispatchEvent将指定函数执行。
// 这样做减少了内存的消耗，还能在组件挂载和销毁时统一订阅或移除事件
// 冒泡到浏览器的也不是原生的事件，而是react自己合成的事件
// 合成事件机制第一个抹平了浏览器间的兼容性问题，赋予了跨浏览器开发的能力
// 合成事件机制是创建了一个事件池专门管理他们的创建和销毁，使用时从池子里取然后创建对象，结束后就销毁对象上的属性

// React实现了一个合成事件层，定义的事件处理器会接收到一个合成事件对象的实例，且与原生事件有相同的接口，支持事件冒泡

// 什么时候重新渲染组件
// props改变/setState改变都会触发重新渲染

// 函数组件和class组件的区别
// 1. 没有生命周期
// 2. 没有this
// 3. 不需要实例化
// 4. 使用内置hooks和自定义hooks来模拟生命周期的功能
// 5. 代码更容易维护
// 类组件是面向对象编程（继承/this/实例化）； hooks函数式编程，无副作用，引用透明
// 性能上类组件使用shouldComponentUpdate方法进行优化，函数组件使用useMemo/useCallback更新
// 函数式组件比类组件更细粒度的逻辑组织与复用

// Fragment的理解
// 组件返回的元素只能有一个根元素。为了不添加多余的DOM节点，我们可以使用Fragment标签来包裹所有的元素，Fragment标签不会渲染出任何元素

//  React如何获取组件对应的DOM元素
// 1. 字符串格式
// 2. callback ref: 参数是节点的实例

// 避免重复渲染
// 避免重复渲染常用的解决方案是使用 PureComponent 或者使用 React.memo（useMemo） 等组件缓存 API，减少重新渲染
// 对于函数式组件，useMemo(避免不必要的引用变量更新)/useCallback(缓存函数)
// ImmutableJS第三方的库

// setState并不是单纯地同步或者异步
// 在react生命周期事件和合成事件中，都可以走合并操作，延迟更新的策略，
// 而在react无法控制的地方， 原生事件（addEventListener）/setTimeout/setInterval等事件中走同步操作

// hook的使用限制
// 1. 必须同函数组件的顶层调用
// 2. 不可以在循环、条件、或者嵌套函数中使用

// 汉诺塔 hanota: 递归实现
// https://leetcode.cn/problems/hanota-lcci/
// https://leetcode.cn/problems/hanota-lcci/solution/by-1105389168-tijv/
const hanota = (A, B, C) => {
  const n = A.length
  const move = (n, A, B, C) => { // 将A中n个盘子移到C
    if (n === 1) {
      C.push(A.pop())
      return 
    }
    move(n - 1, A, C, B) // 将A中n-1移到B
    C.push(A.pop()) // A中最大那个移到C
    move(n - 1, B, A, C) // 将B中n-1个移动到C
  }
  move(n, A, B, C)
}

Function.prototype.a = function() {
    alert(2);
}
Object.prototype.b = function() {
    alert(1);
}
function A () {}
const a = new A();
a.a(); // a.a is not a function
a.b(); // 1
a.constructor.a()


// 5条跑道，25个人赛跑，假设每人每次跑步速度恒定，无计时器。问，最少比几次选出最快的3个人。
// 答案 7次
// 1. 分五组，每组跑一次，排名 +5
// 2. 每组第一名跑一次，排名 +1 （排除掉倒数两个人所在的团队所有成员）
// 3. 第一组的第二名，第三名，和第二组的第一，第二名，以及第三组的第一名再跑一次，先两人出来发即可 +1

// 替换元素和非替换元素
// 替换元素： 浏览器根据元素的属性和标签来决定元素的具体显示内容，img根据src, input根据type
// 非替换元素：内容直接展示给客户端，大多数html标签是非替换元素
// img的margin-top设置有效

// 分别给定入栈序列和出栈序列，判断该出栈序列是否是可能的正确的出栈序列
// 比如入栈序列为 [1, 2, 3, 4, 5]，出栈序列为[3, 2, 5, 4, 1]，则该出栈序列是正确的，因为可以按照下列入栈出栈顺序
// 入栈 1 => 入栈 2 => 入栈 3 => 出栈 3 => 出栈 2 => 入栈 4 => 入栈 5 => 出栈 5 => 出栈4 => 出栈 1
// 使用辅助栈来模拟入栈出栈过程
function isTrueOutStack(inStack, outStack) {
  const stack = []
  while (inStack.length) {
    while (true) {
      stack.push(inStack.shift())
      if (stack[stack.length - 1] === outStack[0]) break
    }
    while (stack[stack.length - 1] === outStack[0]) {
      stack.pop()
      outStack.shift()
      if (stack.length <= 0) break
    }
  }
  return stack.length === 0
}

let obj =JSON.parse('{"a":1,"b":"str","c":[2,3],"d":{"e":4}}');
let s= "";
s+= "{\n"+solve(obj,2)+"}";
function solve(obj,tab){//没有缩进版本的
  let tmp="";
  if(Array.isArray(obj)){
    tab++;
    for(let i in obj){
      tmp+=addEmpty(tab)+i+",\n";
    }
  }else{
  for(let i in obj){
    tmp+=addEmpty(tab);
    if(typeof obj[i]!="object"){
      if(typeof obj[i]=="string"){
        tmp+='\"'+i+'\":\"'+obj[i]+'\"';
      } else {
        tmp+='\"'+i+'\":'+obj[i];
      }
    } else if(Array.isArray(obj[i])){
      tmp+='\"'+i+'\":'+"[\n"+solve(obj[i],tab)+addEmpty(tab)+"]";
    } else {
      tmp+='\"'+i+'\":'+"{\n"+addEmpty(tab)+solve(obj[i],tab)+ addEmpty(tab)+"}";
    };
    tmp+=",\n"
  }
  }
  return tmp;
}
function addEmpty(tab){
 let tmp="";
 for(let i=0;i<tab;i++){
  tmp+=" ";
 }
 return tmp;
}
console.log(s);

// 乘积最大子数组
function maxProduct(nums) {
  let res = -Infinity
  let imax = 1
  let imin = 1
  for (let num of nums) {
    if (num < 0) {
      [imax, imin] = [imin, imax]
    }
    imax = Math.max(imax * num, num)
    imin = Math.max(imin * num, num)
    res = Math.max(res, imax)
  }
  return res
}

// 洗牌算法
function shuttle(arr) {
  const len = arr.length
  for (let i = len - 1; i >= 0; i--) {
    const idx = Math.floor(Math.random() * i)
    [arr[i], arr[idx]] = [arr[idx], arr[i]]
  }
  return arr
}

function shuttle(arr) {
  const res = []
  for (let i = len - 1; i >= 0; i--) {
    const idx = Math.floor(Math.random() * i)
    res.push(arr[idx])
    arr.splice(idx, 1)
  }
  return res
}

// 尾递归优化斐波那契函数
function fibonacci(n, pre, cur) {
  if (n === 0) return 0
  if (n === 1) return cur
  return fibonacci(n-1, cur, pre + cur)
}

function fibonacci(n, pre, cur) {
  if (n === 0) return 0
  if (n === 1) return cur
  return fibonacci(n-1, cur, pre + cur)
}

// 一个无限长有序可重复数组N，查X最后出现的位置
function findX(arr, x) {
  let start = 0
  let end = arr.length - 1
  while (left <= right) {
    let mid = Math.floor((start + end) / 2)
    if (arr[mid] > x) {
      end = mid - 1
    } else if (arr[mid] < x) {
      start = mid + 1
    } else {
      while (arr[mid] === x) {
        mid++
      }
      return mid - 1
    }
  }
  return -1
}

// 请实现一个cacheRequest方法，保证当前ajax请求相同资源时，真实网络层中，实际只发出一次请求（假设已经存在request方法用于封装ajax请求）
const dict = new Map()
const catchRequest = (url, options = {}) => {
  const cacheKey = options.cacheKey || url
  const cacheInfo = dict.get(cacheKey)
  if (!cacheInfo) {
    return handleRequest(url, cacheKey)
  }
  if (cacheInfo.status === 'SUCCESS') {
    return Promise.resolve(cacheInfo.response)
  }
  if (catchInfo.status === 'PENDING') {
    return new Promise((resolve, reject) => {
      cacheInfo.resolves.push(resolve)
      cacheInfo.rejects.push(reject)
    })
  }
  return handleRequest(url, cacheKey)
}

const setCache = (cacheKey, info) =>  {
  dict.set(cacheKey, {
    ...(dict.get(cacheKey) ?? {}),
    ...(info ?? {})
  })
}

const notify = (cacheKey, value) => {
  let queue 
  const cacheInfo = dict.get(cacheKey)
  if (cacheInfo.status === 'SUCCESS') {
    queue = cacheInfo.resolves
  } else {
    queue = cacheInfo.rejects
  }
  while (queue.length) {
    const cb = queue.shift()
    cb(value)
  }
  setCache(cacheKey, {resolves: [], rejects: []})
}

const handleRequest = (url, cacheKey) => {
  setCache(cacheKey, {
    status: 'PENDING',
    resolves: [],
    rejects: []
  })

  return request(url).then(res => {
    setCache(cacheKey, {
      status: 'SUCCESS',
      response: res
    })
    notify(cacheKey, res)
    return Promise.resolve(res)
  }).catch(err => {
    setCache(cacheKey, {
      status: 'FAIL',
    })
    notify(cacheKey, err)
    return Promise.reject(err)
  })
}

// 脚手架的插件机制

// node-cli的原理

// 分发饼干
// https://leetcode.cn/problems/assign-cookies/solution/dai-ma-jian-ji-de-jie-fa-jsban-ben-by-it-x9e1/
const findContentChildren = (g, s) => { // g 胃口arr, s 饼干arr
  let i = 0
  let j = 0
  let num = 0
  g.sort((a, b) => a - b)
  s.sort((a, b) => a - b)
  while (i < g.length && j < s.length) {
    if (s[j] >= g[i]) {
      num++
      i++
      j++
    } else {
      j++
    }
  }
  return num
}

// @vue-cli：基于yarn的monorepo，@vue/cli @vue/cli-service @vue/cli-plugin-babel @vue/cli-plugin-vuex @vue/cli-plugin-router
// 一个插件就是一个npm包，总共有generator模块和service服务两部分组成
// generator负责说明该插件希望对生成的模版做哪些改动
// service 对vue-cli-service这个主命令注册新的副命令，或者对@vue/cli自带的命令做出修改

// hooks原理

// useEffect原理

// redux

// 二维码扫码登录原理
// 1. 待描述状态： PC端跟服务端交互，获取二维码生成id，并展示在浏览器上
// 2. 已扫描，待确认：移动端完成扫码，并获取上一步生成的id，发送给服务端，服务端返回一个临时token；pc浏览器定时轮询二维码状态是否发生变化
// 3. 已确认：移动端携带一次性token发送到服务端，服务端完成更新后会更新二维码，并发送token给pc端，后续pc用这个token开始和服务端通信

// 单词搜索： 深度优先搜索
// https://leetcode.cn/problems/word-search/solution/by-confident-coldenbfp-38bv/
const exist = (board, word) => {
  const n = board.length
  const m = board[0].length
  const wLen = word.length

  const find = (i, j, idx) => {
    if (idx === wLen) return true
    if (i >= n || j >= m || i < 0 || j < 0) return false
    if (board[i][j] !== word[idx]) return false
    // 如果，board[i][j] === word[idx]向四个方向去找
    const res = find(i, j+1, idx + 1) || find(i+1, j, idx + 1) || find(i -1, j, idx +1) || find(i, j-1, idx + 1)
    return res
  }
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      if (find(i, j, 0)) return true
    }
  }
  return false
}

// useEffect useLayoutEffect
// useEffect 是异步调度，等页面渲染完成后再去执行，不会阻塞页面渲染
// useLayoutEffect 是指新的DOM准备完成，但未渲染到屏幕上，同步执行

// 为什么如果不把依赖放到deps上, useEffect回调执行的时候还会是旧值
// effect对象只有在deps变化的时候才会重新生成，如果不把依赖数据放到deps里边，create的还是上次的回调，函数内部用到的依赖还是上次更时的

// useTransition 和 useDeferredValue
// 相同： 本质是延迟任务更新
// useTransition是把更新任务变成了延迟更新任务，useDeferredValue是产生一个新的值，这个值作为延迟状

// v-if 和 v-show
// 相同点：都能控制dom元素在页面的显示
// v-if：是将dom元素真正的添加或者删除，而v-show只是通过css属性display:none来控制显隐
// v-if是真正的条件渲染，它确保在切换过程中条件块内的事件监听器和子组件适当地销毁和重建
// v-if会触发组件的生命周期，但v-show不会
// v-if为true的时候，就会触发beforeCreate/create/beforeMount/mounted钩子
// 变为false的时候，又会触发beforeDestroy/destroyed
// v-if比v-show的开销大，如果频繁地切换，使用v-show，如果运行时条件很少改变则用v-if就好

// v-for 与 v-if同时使用
// v-for的优先级比v-if高，导致两个指令出现在一个dom上时，先渲染出列表然后每一条数据又再v-if一次
// 合适的作法是采用computed属性，将v-if不需要的属性过滤掉，再使用过滤后抽数据用v-for渲染

// 避免使用index作为标识
// key作为diff算法的唯一标识，如果在list中使用index作为key,在数组插入新元素后，插入后面的key均发生变化
// 导致旧的元素也需要重新渲染，开销大，所以建议使用在整个生命周期比较稳定的值来做key， 比如id

// 释放组件资源
// 在组件销毁后，将绑定的事件/定时器去清除，避免内存泄漏

// 长列表优化： vue-virtual-scroller

// 路由懒加载：import语法

// vue data为什么必须是函数
// 组件是可复用的vue实例，一个组件被创建好之后，就可能被用在各个地方，而组件不管被复用了多少次，
// 组件中的data数据都应该是相互隔离，互不影响的，基于这一理念，组件每复用一次，data数据就应该被复制一次，
// 之后，当某一处复用的地方组件内data数据被改变时，其他复用地方组件的data数据不受影响，
// 组件中的data写成一个函数，数据以函数返回值形式定义，这样每复用一次组件，就会返回一份新的data，
// 类似于给每个组件实例创建一个私有的数据空间，让各个组件实例维护各自的数据。而单纯的写成对象形式，
// 就使得所有组件实例共用了一份data，就会造成一个变了全都会变的结果。

// vue 2.x 生命周期
// beforeCreate，在实例初始化之后，数据观测 (data observer) 和 event/watcher 事件配置之前被调用，此时不能访问data和ref
// created，在实例创建完成后被立即调用。在这一步，实例已完成以下的配置：数据观测 (data observer)，属性和方法的运算，watch/event 事件回调。然而，挂载阶段还没开始，$el 属性目前尚不可用,data可访问，$ref仍为undefined
// beforeMount，在挂载开始之前被调用：相关的 render 函数首次被调用,ref仍不可用
// mounted，实例被挂载后调用，这时 el 被新创建的 vm.$el 替换了。 如果根实例挂载到了一个文档内的元素上，当mounted被调用时 vm.$el 也在文档内，ref可用
// beforeUpdate，数据更新时调用，发生在虚拟 DOM 打补丁之前。这里适合在更新之前访问现有的 DOM，比如手动移除已添加的事件监听器。
// updated，由于数据更改导致的虚拟 DOM 重新渲染和打补丁，在这之后会调用该钩子。
// activated，被 keep-alive 缓存的组件激活时调用。
// deactivated，被 keep-alive 缓存的组件停用时调用。
// beforeDestroy，实例销毁之前调用。在这一步，实例仍然完全可用。
// destroyed，实例销毁后调用。该钩子被调用后，对应 Vue 实例的所有指令都被解绑，所有的事件监听器被移除，所有的子实例也都被销毁。
// errorCaptured，当捕获一个来自子孙组件的错误时被调用。

// vue 3.x生命周期
// 被替换： 1. beforeCreate --> setup() 2. created --> setup()
// 重命名： 1. beforeMount --> onBeforeMount
//         2. mounted --> onMounted
//        3. beforeUpdate --> onBeforeUpdate
//        4. updated --> onUpdated
//        5. beforeDestroy --> onBeforeUnmount
//        6. destroyed --> onUnmounted
//        7. errCaptured --> onErrorCaptured
// 新增： onRenderTracked onRenderTriggered
// setup 将 vue2.x中的 beforeCreate 和 created 代替，以一个setup函数的形式，可以灵活组织代码
// 在setup里，每个生命周期可以是一个函数，在里面执行
// setup是一个入口函数，本质是面象函数编程，取消了this，取而代之的是props组件参数和context上下文信息

// 2. 如何理解vue的单向数据流
// 所有的prop都使得其父子prop之前形成了一个单向下行绑定，即父级prop的更新会向下流动到子组件中，但子组件不可以更改prop值
// 每次父组件发生更新时，子组件中所有的prop都将会刷新为最新的值
  
// 6. vue的父组件和子组件生命周期钩子函数执行顺序
// 加载渲染过程  beforeCreate -> 父 created -> 父 beforeMount -> 子 beforeCreate -> 子 created -> 子 beforeMount -> 子 mounted -> 父 mounted
// 子组件更新 beforeUpdate -> 子 beforeUpdate -> 子 updated -> 父 updated
// 销毁 beforeDestroy -> 子 beforeDestroy -> 子 destroyed -> 父 destroyed

// 19 $set 实现原理
// 如果目标是数组，直接使用数组的splice方法触发响应式
// 如果目标是对象，且key存在，则直接修改
// 如果目标是对象，但本身不是响应式的，直接赋值，使用defineReactive方法进行响应式处理

// 21 虚拟DOM实现原理
// 用js对象模拟真实dom树，对真实dom进行抽象
// diff算法比较两新旧两棵虚拟DOM树的差异
// patch算法将对比结果映射到真实DOM树上
  
// 26 组件中的data是否可以用箭头函数，什么原理
// VUE中不用使用箭头函数的地方
// 1. 不应该使用箭头函数来定义一个生命周期
// 2. 不应该使用箭头函数来定义method函数
// 3. 不应该使有前头函数来定义计算属性函数
// 4。 不应该对data属性使用箭头函数
// 5。 不应该使用箭头函数来定义watcher函数
// 使用箭头函数，绑定了父级作用域的上下文，this将不会按照预期指向Vue实例

// 28 vuex 里的 mutation就可以修改state的值，为什么还要设置一个action
// action可以处理异步操作，一般会封一些长流程的逻辑，而且可以多重mutation修改state的值
// mvvm模型中，保持view渲染层的执行逻辑简单明了，与业务逻辑解耦

// vuex的原理
// Vuex是通过new Vue来实现响应式的
// Vuex有两个对象： install方法和Store类
// install方法就是把Store这个实类挂载到所有的组件上，注意是同一个Store实例
// store实例下面有commit/dispatch这些方法以，Store实例将用户传入的state包装成data，作为new Vue的参数，实现了state的响应式
  
// 常见的microtask: promise.then MutationObserver nodejs中的process.nextTick
// 常见的macrotask: setTimeout MessageChannel postMessage setImmediate
// $nextTick原理：
// Promise -> setImmediate -> MessageChannel -> setTimeout
// vue 使用异步队列的方式来控制DOM更新和nextTick回调先后执行
// microtask因为其高优先级特性，能确保队列中的微任务在一次事件循环前被执行完毕
// 因为兼容性问题，不得不做了microtask向macrotask的降级方案
  
// vue导航守卫有哪些
// 全局守卫： router.beforeEach(全局前置守卫，进入路由之前)； afterEach; beforeResolve
// next()进入当前路由；next(false)取消当前路由，url地址重置为from路由地址；next({path: ''})或者next({name:''})重新开始一个新的导航
// 路由独享守卫：可以为某些路由单独配置守卫，beforeEnter, 调用顺序在全局前置前置守卫后面，不会被全局守卫覆盖
// 路由组件内的守卫：beforeRouteEnter/beforeRouteUpdate/beforeRouteLeave
// beforeRouteEnter 里拿不到实例的this,组件实例还没有被创建
// router.onError(callback => {}) 捕获在导航守卫中函数中的错误
// 从一个页面跳到另一个页面的钩子完整顺序
// beforeRouteLeave -> beforeEach -> beforeEnter -> beforeRouteEnter -> beforeResolve -> afterEach -> beforeCreate -> created -> beforeMount -> deactivated 或者 beforeDestroy destroy -> mounted -> activated

// Composition API 核心语法
// setup
// reactive
// ref
// isRef
// toRefs
// computed
// readonly
// provide inject

// 前端性能哪些指标
// FP: first-paint, 从页面加载到第一个像素绘制到页面上的时间，也可以理解为白屏时间
// FCP：first-content-paint, 从页面加载开始到页面内任何部分在屏幕上完成渲染的时间，控制在1.8s以内
// LCP：largest-contentful-paint, 从页面开始加载到最大文本块或者图像元素在屏幕上完成渲染的时间，控制在2.5s以内
// DOMContentLoaded: HTML被完全加载和解析
// load: 整个页面及所依赖的资源如样式表和图片都完成加载时，将触发load事件；如页面没有异步加载的图片和dom，那个load时间就可以理解为首屏渲染时间

// 上报渲染时间
// 在dom不再变化后进行上报，一般在load事件后dom就不再变化，可以在这个时间点进行上报
  
// 如何监控页面的卡顿：通过requestAnimationFrame去计算浏览器的帐数
const frames = []
function fps() {
  let frame = 0
  let lastSecond = Date.now()
  function calculateFPS() {
    frame++
    const now = Date.now()
    if (lastSecond + 1000 <= now) {
      const fps = Math.round((frame * 1000) / (now - lastSecond))
      frames.push(fps) 
      frame = 0
      lastSecond = now
    }
    requestAnimationFrame(calculateFPS)
  }
  calculateFPS()
}

// Vue路由变更渲染时间
// 1. 监听路由钩子，在路由切换时触发router.beforeEach钩子，在钩子的回调函数里把当前时间标记为渲染开始时间
// 2. Vue.mixin对所有组件的mounted注入一个函数，每个函都都执行一个防抖
// 3. 当最后一个组件的mounted触发时，就代表该路由下的所有组件都挂载完成，可以获取渲染时间了

// 使用 window.onerror 可以监听 js 错误。
// 使用 addEventListener() 监听 error 事件，可以捕获到资源加载失败错误。
// 使用 addEventListener() 监听 unhandledrejection 事件，可以捕获到未处理的 promise 错误。
// 利用 window.onerror 是捕获不到 Vue 错误的，它需要使用 Vue 提供的 API 进行监听。 Vue.config.errorHandler

// 上报时机有三种：
// 采用 requestIdleCallback/setTimeout 延时上报。
// 在 beforeunload 回调函数里上报。
// 缓存上报数据，达到一定数量后再上报。
// 先缓存上报数据，缓存到一定数量后，利用 requestIdleCallback/setTimeout 延时上报。

// 买卖股票的最佳时机I：买卖一次
//给定一个数组 prices ，它的第 i 个元素 prices[i] 表示一支给定股票第 i 天的价格。
// 你只能选择 某一天 买入这只股票，并选择在 未来的某一个不同的日子 卖出该股票。设计一个算法来计算你所能获取的最大利润。
// 返回你可以从这笔交易中获取的最大利润。如果你不能获取任何利润，返回 0 
const maxProfit1 = (prices) => {
  let res = 0
  let pre = prices[0]
  for (let i = 1; i < prices.length; i++) {
    pre = Math.min(pre, prices[i])
    res = Math.max(res, prices[i] - pre)
  }
  return res
}
  
// 买卖股票的最佳时机II：买卖多次(累加法)
// 给你一个整数数组 prices ，其中 prices[i] 表示某支股票第 i 天的价格。
// 在每一天，你可以决定是否购买和/或出售股票。你在任何时候 最多 只能持有 一股 股票。你也可以先购买，然后在同一天出售。
// 返回你能获得的最大利润 。
const maxProfit2 = (prices) => {
  if (!Array.isArray(prices) || prices.length === 0) return 0
  let res = 0
  for (let i = 1; i < prices.length; i++) {
    if (prices[i + 1] > prices[i]) {
      res += prices[i+1] - prices[i]
    }
  }
  return res
}



// 括号生成
// 数字 n 代表生成括号的对数，请你设计一个函数，用于能够生成所有可能的并且 有效的 括号组合。
// https://leetcode.cn/problems/generate-parentheses/
const generateParenthesis = n => {
  const res = []
  const dfs = (lRemain, rRemain, str) => {
    if (str.length === 2 * n) {
      res.push(str)
      return
     } 
    if (lRemain > 0) {
      dfs(lRemain - 1, rRemain, str+='(' )
    }
    if (rRemain > lRemain) {
      dfs(lRemain, rRemain - 1, str+=')')
    }
  }
  dfs(n, n, '')
  return res
}

// 写法上的区别:vue2使用的是options(选项)Api,vue3的是composition Api(当然vue3也兼容composition api)。options Api中methods，compute，data等api都是分散的。而composition api中的代码是根据逻辑功能来组织的,我们可以将一个功能所定义的methods，compute，data等api会放在一起,让我们可以更灵活地组合组件逻辑。
// vue2将响应式数据放到data函数中,而vue3则是使用ref和reactive将数据声明为响应式
// 响应式实现方式:vue2中是通过Object.defineProperty对数据劫持实现的,vue3中则是使用Proxy对数据代理实现的。
// 生命周期区别:vue3中将beforeCreate和created合并到了setup函数中
// 根节点: vue3组件允许多个根节点,而vue2只允许一个
// 内置组件: vue3新增了传送组件Teleport和异步依赖处理组件Suspense

// 一只青蛙一次可以跳上1级台阶，也可以跳上2级台阶。求该青蛙跳上一个 n 级的台阶总共有多少种跳法。
// 答案需要取模 1e9+7（1000000007），如计算初始结果为：1000000008，请返回 1。
// https://leetcode.cn/problems/qing-wa-tiao-tai-jie-wen-ti-lcof/
const numWay = (n) => {
  if (n === 0 || n === 1) return 1
  const mod = 1000000007
  const arr = [1, 1]
  for (let i = 2; i <= n; i++) {
    arr[i] = (arr[i - 1] + arr[i -2 ]) % mode
  }
  return arr[n]
}

// 打家劫舍：dp[n] = Math.max(dp[n-1], dp[n-2]+num)
// 你是一个专业的小偷，计划偷窃沿街的房屋。每间房内都藏有一定的现金，影响你偷窃的唯一制约因素就是相邻的房屋装有相互连通的防盗系统，如果两间相邻的房屋在同一晚上被小偷闯入，系统会自动报警。
// 给定一个代表每个房屋存放金额的非负整数数组，计算你在不触动警报装置的情况下，能够偷窃到的最高金额
// https://leetcode.cn/problems/house-robber/submissions/
const rob = nums => {
  const len = nums.length
  const dp = [nums[0], Math.max(nums[0], nums[1])]
  for (let i = 2; i < len; i++) {
      dp[i] = Math.max(dp[i-1], dp[i-2] + nums[i])
  }
  return dp[len-1]
}

// 最大正方形：由0,1组成的二维矩阵，找到只含1的最大下方形，返回其面积
// https://leetcode.cn/problems/maximal-square/solution/zui-da-zheng-fang-xing-by-leetcode-solution/
const maxSquare = (matrix) => {
  if (matrix.length === 0) return 0
  let maxLen = 0
  const rowLen = matrix.length
  const colLen = matrix[0].length
  for (let row = 0; row < rowLen; row++) {
    for (let col = 0; col < colLen; col++) {
      matrix[row][col] = +matrix[row][col]
      if (row != 0 && col != 0) {
        matrix[row][col] = Math.min(matrix[row -1][col], matrix[row][col - 1], matrix[row - 1][col - 1]) + 1
      }
      maxLen = Math.max(maxLen, matrix[row][col])
    }
  }
  return maxLen ** 2
}

// 零钱兑换
// 给定不同面额的硬币coins和一个总金额amount
// 编写一个函数来计算可以凑成总金额所需的最少的硬币个数。如果没有任何一种硬币组合能组成总金额，返回 -1
const coinChange = (coins, amount) => {
  const dp = new Array(amount + 1).fill(Infinity)
  dp[0] = 0
  for (let i = 1; i <= amount; i++) {
    for (let coin of coins) {
      if (i - coin > 0) {
        dp[i] = Math.min(dp[i], dp[i - coin] + 1)
      }
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount]
}

// 不同路径
// 一个机器人位于一个 m x n 网格的左上角
// 机器人每次只能向下或者向右移动一步。机器人试图达到网格的右下角。
const uniquePaths = (m, n) => {
  const dp = new Array(m).fill(0).map(() => new Array(n).fill(0))
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (i == 0 || j == 0) {
        dp[i][j] = 1
      } else {
        dp[i][j] = dp[i - 1][j] + dp[i][j - 1]
      }
    }
  }
  return dp[m - 1, n - 1]
}

// 剪绳子
// https://leetcode.cn/problems/jian-sheng-zi-lcof/solution/
const cuttingRope = (n) => {
  const dp = new Array(n + 1).fill(1)
  for (let i = 3; i <= n; i++) {
    for (let j = 1; j < i; j++) {
      dp[i] = Math.max(dp[i], j * (i - j), dp[i - j] * j )
    }
  }
  return dp[n]
}
  
// 跳跃游戏: 动态维护maxLen
// https://leetcode.cn/problems/jump-game/
// 只要从第一个位置开始逐步找能跳跃最远的位置，如果这个位置正好在最后一个下标或超过最后一个下标，那么一定能到达最后一个下标
const canJump = (nums) => {
  const idx = nums.length - 1
  let maxLen = 0
  for (let i = 0; i <= maxLen; i++) {
    maxLen = Math.max(maxLen, i + nums[i])
    if (maxLen >= idx) return true
  }
  return false
}

// 加油站
// https://leetcode.cn/problems/gas-station/solution/javascript-tan-xin-jie-fa-by-chinaniub-psdp/
const canCompleteCircuit = (gas, cost) => {
  let start = 0
  let sum = 0
  let cur = 0
  for (let i = 0; i < gas.length; i++) {
    sum += gas[i] - cost[i]
    cur += gas[i] - cost[i]
    if (cur < 0) {
      cur = 0
      start = i + 1
    }
  }
  if (sum < 0) return -1
  return start
}

// 输出旋转数组的最小元素
// https://leetcode.cn/problems/xuan-zhuan-shu-zu-de-zui-xiao-shu-zi-lcof/
const minArray = (arr) => {
  let left = 0
  let right = arr.length - 1
  while (left < right) {
    const mid = Math.floor((left + right) / 2)
    if (arr[mid] > arr[r]) {
      left = mid + 1
    } else if (arr[mid] === arr[r]) {
      right--
    } else {
      right = mid - 1
    }
  }
  return arr[left]
}
  
// 统计一个数字在排序数组中出现的次数
const getNumberOfK = (data, K) => {
  let left = 0
  let right = data.length - 1
  let pos = -1
  let count = 0
  while (left < right) {
    const mid = Math.floor((left + right) / 2)
    const val = data[mid]
    if (val === K) {
      pos = mid
      break
    } else if (val > K) {
      right = mid - 1
    } else {
      left = mid + 1
    }
  }
  if (pos !== undefined) {
    count++
    let low = pos
    let high = pos
    while (true) {
      low--
      if (data[low] === K) {
        count++
      } else {
        break
      }
    }
    while (true) {
      high++
      if (data[high] === K) {
        count++
      } else {
        break
      }
    }
    return count
  }
  return 0
}

// 0 ~ n-1中缺失的数字
// https://leetcode.cn/problems/que-shi-de-shu-zi-lcof/solution/dai-ma-jian-ji-de-jie-fa-jsban-ben-by-it-y9mw/
const missingNumber = (nums) => {
  let left = 0
  let right = nums.length - 1
  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    const val = nums[mid]
    if (mid === val) {
      left = mid + 1
    } else {
      right = mid - 1
    }
  }
  return left
}
  
// 最长上升子序列
const lengthOfLIS = (nums) => {
  const n = nums.length
  const dp = new Array(n).fill(1)
  let res = 1
  for (let i = 1; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i]) {
        dp[i] = Math.max(dp[i], dp[j] + 1)
      }
    }
    res = Math.max(res, dp[i])
  }
  return res
}

  
// 搜索二维矩阵
const matrixSearch = (matrix, target) => {
  if (matrix.length === 0 || matrix[0].length === 0) return false
  let res = false
  let rowLen = matrix.length
  let colLen = matrix[0].length
  while (true) {
    let row = rowLen - 1
    let col = 0
    const val = matrix[row][col]
    if (val === target) {
      res = true
      break
    }
    if (val > target) row--
    if (val < target) col++
  }
  return res
}

// 实现 pow(x, n) ，即计算 x 的 n 次幂函数
const myPow = (x, n) => {
  if (n === 0) return 1
  if (n === 1) return x
  if (n < 0) return myPow(1 / x, n)
  return n % 2 === 0 ? myPow(x * x, n / 2) : myPow(x * x, Math.floor(n / 2)) * x
}
  
// 给你一个整数数组 nums ，数组中的元素 互不相同 。返回该数组所有可能的子集（幂集）。
// 解集 不能 包含重复的子集。你可以按 任意顺序 返回解集。
// https://leetcode.cn/problems/subsets/
const subsets = nums => {
  const n = nums.length
  const res = []
  const back = (path, i) => {
    if (i <= n) {
      res.push(path)
    }
    for (let j = i; j < n; j++) {
      path.push(nums[j])
      back(path.slice(0), j + 1)
      path.pop()
    }
  }
  back([], 0)
  return res
}

// 数组全排列
const permute = arr => {
  const len = arr.length
  const res = []
  const back = (path) => {
    if (path.length === len) {
      res.push(path)
      return
    }
    for (let i = 0; i < len; i++) {
      if (path.indexOf(arr[i]) !== -1) {
        path.push(arr[i])
        back(path.slice(0))
        path.pop()
      }
    }
  }
  back([])
  return res
}

// 接雨水
function trap(height) {
  let res = 0
  let left = 0 
  let right = height.length - 1
  let maxLeft = 0
  let maxRight = 0
  while (left < right) {
    maxLeft = Math.max(height[left], maxLeft)
    maxRight = Math.max(height[right], maxRight)
    if (maxLeft < maxRight) {
      res += maxLeft - height[left]
      left++
    } else {
      res += maxRight - height[right]
      i--
    }
  return res
  }
  
// 盛最多水的容器
const maxArea = (heights) => {
  if (!height.length) return 0
  let left = 0
  let right = heights.length - 1
  let res = 0
  while (left < right) {
    if (arr[left] <= arr[right]) {
      let cur = arr[left] * (right - left)
      res = Math.max(res, cur)
      left++
    } else {
      let cur = arr[right] * (right - left)
      res = Math.max(res, cur)
      right--
    }
  }
  return res
}
  
// 长度最小子数组：滑动窗口
// 找出该数组中满足其和 ≥ target 的长度最小的 连续子数组
// https://leetcode.cn/problems/minimum-size-subarray-sum/
const minSubArrayLen = (nums, s) => {
  let left = 0
  let right = 0
  let sum = 0
  let len = Infinity
  while (right < nums.length) {
    sum += nums[right]
    while (sum > s) {
      len = Math.min(len, right - left + 1)
      sum = sum - nums[left]
      left++
    }
    right++
  }
  return len
}

// 删除链表的倒数第n个节点：快慢指针,快指针先走完n步，然后一起走，快指针走到最后的时候，慢指针正好走到要删除的前一位
const removeNthFromEnd = (head, n) => {
  let fast = head
  let slow = head
  while (n--) {
    fast = fast.next
  }
  while (fast.next) {
    fast = fast.next
    slow = slow.next
  }
  slow.next = slow.next.next
  return head
}

// 判断回文链表
// const reverseList = (head) => {
//   let cur = head
//   let prev = null
//   while (prev) {
//     [cur.next, prev, cur] = [prev, cur, cur.next]
//   }
//   return prev
// }
  
const reverseList = (head) => {
  let cur = head
  let prev = null
  while (cur) {
    [cur.next, prev, cur] = [pre, cur, cur.next]
  }
  return prev
}
  
const slowFast = (head) => {
  let slow = head
  let fast = head
  while (fast.next) {
    fast = fast.next.next
    slow = slow.next
  }
  return slow
}
const isPalindrome = head => {
  if (head === null || head.next === null) return true
  const prev = slowFast(head)
  const cur = reverseList(pre.next)
  const p1 = head
  const p2 = cur
  let res = true
  while (res && p2) {
    if (p1.val !== p2.value) {
      res = false
    }
    p1 = p1.next
    p2 = p2.next
  }
  return res
}

const hasCycle = (head) => {
  let fast = head.next.next
  let slow = head.next
  while (fast !== slow) {
    if (fast === null || fast.next === null) return false
    fast = fast.next.next
    slow = slow.next
  }
  return true
}
  
const findKthFromTail = (head, k) => {
  if (!head || k === 0) return null
  let fast = head
  let slow = head
  while (k--) {
    fast = fast.next
    if (!fast) return null
  }
  while (fast) {
    fast = fast.next
    slow = slow.next
  }
  return slow
}
  
const mergeList = (pHead1, pHead2) => {
  if (pHead1 === null) return pHead2
  if (pHead2 === null) return pHead1
  if (pHead1.val < pHead2.val) {
    pHead1.next = mergeList(pHead1.next, pHead2)
    return pHead1
  } else {
    pHead2.next = mergeList(pHead2.next, pHead1)
    return pHead2
  }
}

const findFirstCommonNode = (pHead1, pHead2) => {
  if (pHead1 === null || pHead2 === null) return null
  let p1 = pHead1
  let p2 = pHead2
  while (p1 != p2) {
    p1 = p1 === null ? pHead2 : p1.next
    p2 = p2 === null ? pHead1 : p2.next
  }
  return p1
}

const detectCycle = head => {
  let fast = head.next.next
  let slow = head.next
  let p = head
  while (fast !== slow) {
    fast = fast.next.next
    slow = fast.next
  }
  while (p !== slow) {
    p = p.next
    slow = slow.next
  }
  return slow
}

const isPalindrome = (s) => {
  const reg = /[a-z][0-9]/
  const arr = s.split('').map(x => x.toLowerCase()).filter(i => reg.test(i))
  let left = 0
  let right = arr.length - 1
  while (left <= right) {
    if (arr[left] !== arr[right]) return false
    left++
    right--
  }
  return true
}
   
// npm 与 yarn pnpm
// npm2是会出现大量的依赖递归，如果项目一旦过大，就会形成一棵巨大的依赖树，依赖包出现重复，形成嵌套地狱 
// 出现的问题：
// 1. 安装的结果占据了大量的空间资源，造成了资源的浪费
// 2. 安装重复依赖，安装时间过长
// 3. 目录层级嵌套过深，导致文件路径过长，windows系统下删除node_modules出现删除不掉的现象
// yarn: 通过铺平的方式，解决了依赖重复多次，嵌套路径过长的问题，但对于某个包有不同的版本，只能提升一个版本，后面的版本仍然还是嵌套的方式
// 扁平化的方案也有问题：幽灵依赖，明明没有在dependencies里声明，却可以在代码里require进来，如果哪天这个依赖不见了（因为是别的包引入的），项目就跑不起来了
// pnpm：节约磁盘空间并提升安装速度
// 1. 包都是从全局store硬链到node_modules/.pnpm，然后模块之前再通过软链接组织
// 2. 在node_modules下只会有显示出现在dependencies的包
  
// pnpm
// pnpm 是通过 hardlink 在全局里面搞个 store 目录来存储 node_modules 依赖里面的 hard link 地址，
// 然后在引用依赖的时候则是通过 symlink 去找到对应虚拟磁盘目录下(.pnpm 目录)的依赖地址

// peerDependencies
// 避免类似的核心依赖库被重复下载的问题。
// 如果用户显式依赖了核心库，则可以忽略各插件的 peerDependency 声明；
// 如果用户没有显式依赖核心库，则按照插件 peerDependencies 中声明的版本将库安装到项目根目录中；
// 当用户依赖的版本、各插件依赖的版本之间不相互兼容，会报错让用户自行修复；

// 软链接 与 硬链接
// Linux系统通过inode管理文件，inode存储着文件字节数、文件权限、链接数、数据block位置等信息
// 硬链接与源文件共用inode，除了文件名不同，其他与源文件一样
// 软链接类似于windows的快捷方式，有独立的inode
// 硬链接和软链接修改文件内容都会同步到源文件，因为本质上它们都是指向源文件的数据block

// node-cli 原理
  
// formily源码
  
// React源码

// CI/CD
  
// web-component
// 借助window.customElements.define去实现
// 优点：不需要加载任何外部模块，代码量小，易维护，可与任何框架结合，
// 缺点：兼容性差
// HTML Templates: 可复用的html标签，提供了和用户自定义标签的结合
// Shadow Dom: 对标签和样式的一组包装，该节点内部的所有样式会被限制仅在这个影子树里生效，具备天然的样式隔离和元素隔离属性
// Custom Elements：有特定行为且用户自命名的html元素
// 京东的microApp是基于web-component实现的
// 原理： 类web-component：由于shadow-dom存在兼容性问题，采用自定义的样式隔离和元素隔离来实现shadowDom类似的功能，然后再将微前端封闭在customElements中

// HTML Entry: 是指html作为资源加载入口，通过远程加载html，解析其dom结构来获取js/css静态资源来实现微前端的渲染

// react server component的流式渲染
// server component: 服务端渲染组件，拥有访问数据库/访问本地文件的能力，无法绑定事件对象，不具备交互性
// 更小的bundle体积，更好的服务端能力
// 流程：
// 1.  加载React Runtime和Client Root等js代码
// 2. 执行client root向服务端发出请求
// 3. 接收请求开始渲染组件树
// 4. 将渲染好的组件树以字符串的信息返回给浏览器
// 5. React Runtime开始渲染组件，且向服务器请求client component js bundle进行选择性注水

// 元组件 meta framework
  
// javascript中的 aop
// aop 面向切面编程：一种将代码注入现有函数或对象的方法，而无需修改目标逻辑。
Function.prototype.before = function (action) {
  let self = this
  return function (...args) {
    action.apply(this, args)
    const res = self.apply(this, args)
    return res
  }
}
Function.prototype.after = function(acton) {
  let self = this
  return function (...args) {
    const res = self.apply(this, args)
    action.apply(this, args)
    return res
  }
}
// 装饰器在作用于类的属性的时候，实际上是通过 Object.defineProperty 来对原有的descriptor进行封装
// 关键点是重写descriptor

// 为什么出现hooks之后，函数组件中可以定义state，保存在了哪里
// 每个hook都有对应的对象，这个对象上会存储状态，而这个hook对象又以单链表的形式存在fiber上，而fiber又是react的虚拟dom,存于内存中

// redux中间件原理
  
// react为什么不能在if循环里写hooks
// react是用链表来保证hooks的顺序，hook相关的信息存在一个hook对象里，而hook对象以是以单链表的形式相互串联
// 在首次渲染的时候，会按hook声明的顺序构建出一个有序链表并渲染
// 更新的时候按顺序去遍历之前构建好的链表，取出对应的数据进行渲染，hooks的渲染是通过依次遍历来定位每个hook内容
// 如果前后两次读到的链表在顺序上同现差异，那渲染结果是不可控的

// react中key的作用，以及为什么不能用index代替key
// react中的虚拟dom是通过diff算法对比更改前后发生的最小变化，再对真实dom进行修改
// 使用key的目的就是为了标识在前后两次渲染中元素的对象关系，防止不必要的更新操作
// 如果使用index标识key,数组在执行插入和排序后，原先的index不再对应原先的值，那这个key就失去了本身的意义

// setState是同步还是异步（所谓的异步是指是否批量更新，还是值变改后马上更新）
// 17版本里在setTimeout/setInterval/自定义事件里边是同步的，在相应的生命周期里同是步的
// 18的话所有的都是异步的

// React合成事件
// React合成事件是模拟原生DOM事件所有能力的一个事件对象
// 1. 在底层摸平各浏览器之间的差异，向开发人员提供统一、稳定、并且和DOM原生事件相同的事件接口
// 2. 自定义事件系统，让React掌握了事件处理的主动权，方便React对事件的中心化管理
// 核心由三部分构成： 事件合成/事件绑定/事件触发
// 事件合成：构建合成事件和原生事件的映射关系以及合成事件与事件处理插件的映射关系
// 事件绑定：React遍历元素的props如发现合成事件，即找到对应的原生事件绑定到document上，由dispatchEvent作为统一事件处理函数
// 大部分事件是事件冒泡，有一些是事件捕获，比如scroll/focus/blur发生在事件捕获阶段，如果多个元素绑定同一事件，在document上只会绑定一次
// 事件触发：执行dispatchEvent函数，创建一个合成事件源对象，保存了事件的信息，并传递给真正的事件处理函数，
// 声明事件执行队列，从事件源开始逐渐向上，冒泡事件则push,捕获事件则unshift
// 最后将事件妨行队列保存到事件对象上，依次取出事件队列上的事件执行，模拟出冒泡与捕获
// 事件池：每次用的事件源对象，在事件函数执行之后，事件源对象释放到事件池中；每次不必创建新的对象，从池中取出一个事件源对象有进行复用
// 事件处理函数执行完后，再放到事件池中并清空属性

// 换肤
// 1. 实现多套CSS样式通过动态修改link标签的href
// 2. 切换css选择器的方式进行主题样式切换：组件保留不变的样式，将需要变化的样式进行抽离
// 3. 通过全局css变量实现
  
// webpack优化
// 1. 构建时间的优化
// a. thread-loader,多进程打包，大大提高构建速度
// b. cache-loader，缓存资源，提高二次构建速度
// c. 开发环境中，使用HotModuleReplacementPlugin开启热更新，
// d. include指定要编译的文件夹，exclude排除指定文件夹
// e. 提升webpack版本，版本越高打包越快
// f. 区分构建环境：开发环境不需要代码压缩/生产环境需要
// 2. 打包体积的优化
// a. css-minimizer-webpack-plugin，css代码压缩和去重
// b. terser-webpack-plugin, js代码压缩
// c. 当mode为production时，webpack5自动开启tree-shaking打包优化
// d. 开发环境配置eval-cheap-module-source-map,线上环境配置nosources-source-map（只有错误的行列信息，无源代码文件）
// 3. 用户体验优化
// a. 模块懒加载
// b. compression-webpack-plugin，开启Gzip，提升用户的页面加载速度
// c. asset-module小图片转base64: 减少网络请求提高户体验
// d. 合理配置hash: 上线后没有改变的文件会命中缓存，从而达到优化目的

// hash文件指纹
// 1. hash: 每次构建生成唯一的一个hash，且所有文件的hash值是一样的，起不到缓存的作用
// 2. chunkhash：每个文件的hash根据它引入的chunk决定
// 3. contenthash：根据抽取到的内容来生成hash，之前用在MiniCssExtractPlugin来进行代码压缩
  
// vite
  
// 页面白屏
// 定义： 异常导致的渲染失败
// 白屏检测方案： 采样对比，利用document.elementsFromPoint api获取采样点坐标下的html元素
// 判断各个采样点是否为容器元素，根据采样点为容器元素的个数来判断是否为白屏
  
const BFS = (node) => {
  const res = []
  if (node) {
    const stack = [node]
    while (stack.length) {
      const cur = stack.shift()
      res.push(cur.tagName)
      cur.children.forEach(c => {
        stack.push(c)
      })
    }
  }
  return res
}


  
function DFS(node, nodeList = []) {
  if (node) {
    nodeList.push(node.tagName)
    let children = node.children
    if (children) {
      children.forEach(ele => {
        DFS(ele, nodeList)
      })
    }
    return nodeList
  }
}

// JSBridge:  Native 和非 Native 之间的桥梁，它的核心是 构建 Native 和非 Native 间消息通信的通道，而且是 双向通信的通道。
// 1. js 调用 native
// a. 注入API: 基于 Webview 提供的能力，我们可以向 Window 上注入对象或方法。JS 通过这个对象或方法进行调用时，执行对应的逻辑操作，可以直接调用 Native 的方法
// b. 拦截 URL Scheme: 通过拦截 URL Scheme 并解析 Scheme 来决定是否进行对应的 Native 代码逻辑处
// 2. native 调用 js
// a. 将js方法挂载到window对象下: Native 调用 JS 比较简单，只要 H5 将 JS 方法暴露在 Window 上给 Native 调用即可。

// 闭包手写
const closure = () => {
  let init = 0
  return function () {
    return ++init
  }
}
const f = closure()
  console.log(f())
  console.log(f())
const f1 = closure()
  console.log(f1())
  console.log(f1())

// 为什么说vue是一个渐进式框架
// 渐进式指的是由浅入深，从简单到复杂的一种方式，没有多做职责之外的事，只做了自己该做的事
// vue你可以用你想用或者需要用的功能特性，不想用的部分可以不使用，不强求开发人员一次性接受它的全部功能特性
  
// 使用伪元素来增加可点击区域:after
// 伪元素属于其父元素，创建具有特定宽度和高度的伪元素时，它将充当其父元素的单击/触摸/悬停区域

const first = () => (new Promise((resolve,reject)=>{
    console.log(3);
    let p = new Promise((resolve, reject)=>{
         console.log(7);
        setTimeout(()=>{
           console.log(5);
           resolve(6); 
        },0)
        resolve(1);
    }); 
    resolve(2);
    p.then((arg)=>{
        console.log(arg);
    });

}));

first().then((arg)=>{
    console.log(arg);
});
console.log(4);
// （第一次事件循环）3 7 4 （第一次的微任务）1 2 （第二次事件循环）5

// promise串行
function red() {
  console.log("red");
}
function green() {
  console.log("green");
}
function yellow() {
  console.log("yellow");
}
const light = function (time, cb) {
  return new Promise(resolve => {
    setTimeout(() => {
      cb()
      resolve()
    }, time)
  })
}
const step = function () {
  Promise.resolve().then(() => {
    return light(3000, red)
  }).then(() => {
    return light(2000, green)
  }).then(() => {
    return light(1000, yellow)
  }).then(() => {
    return step()
  })
}
step()

// 使用Promise实现每隔1秒输出1,2,3
const arr = [1, 2, 3]
arr.reduce((pre, cur) => {
  return pre.then(() => {
    return new Promise(r => {
      setTimeout(() => r(console.log(cur)), 1000)
    })
  })
}, Promise.resolve())

// 洋葱模型
// https://juejin.cn/post/7012031464237694983
app.compose = () => {
  const dispatch = (index) => {
    if (index === app.middlewares.length) return
    const cur = app.middlewares[index]
    return cur(() => dispatch(index + 1))
  }
  dispatch(0)
}

// 微任务 与 宏任务
const f = () => {
  Promise.resolve().then(f) // 一直在往微任务队列里加, 所以没办法去执行下一个宏任务，也就是控制台无法执行console
}
const f1 = () => {
  setTimeout(() => { // 因为是宏任务，可以去执行其它的script,所以控制台可以插入console
    f1()
  })
}
  
// ES6 展开运算符的作用
// 1. 展开数组/对象/字符串
// 2. 对数组和对象进行浅拷贝
// 3. 合并数组和对象
// 4. 将类数组转化为数组
// 5. 收集函数的剩余参数
  
// 按值与按址
let a = 1
function add(a) {
  a = a + 1
}
add(a)
console.log(a) // 1

let a = {}
debugger
function handle(a) {
  console.log(a)
  a = { b: 1 }
  console.log(a)
}
handle(a)
console.log(a) // {}
  

let a = {n: 1}
let b = a
a.x = a = {n: 2}  // a.x是指原先的引用地址新加了一个属性，指向a， 而a又开辟了新的地址，即{n: 2}
console.log(a.x) // undefined
console.log(b.x) // {n: 2}

// let const
// 特点： 块级作用域；不会被提升；重复声明报错；不绑定全局作用域(不会绑定到window下)
// 区别： const 声明常量，不允许修改（对象可以个改值，但不可以修改绑定，也就是不能直接赋值[] {}, 只能通过查找属性赋值）, const声明后必须马上赋值，否则会报错
// 暂时性死区： 只要一进入当前作用域，所要使用的变量就存在了，但是不可获取，只有等到声明变量的那行代码出现，才可以获取和使用

// 实现一个立即执行的定时器，解决4ms延迟的问题
// 用postMessage来实现具正0延迟的定时器
(function () {
  const timeouts = []
  const message = 'zero-timeout-msg'
  function setZeroTimeout(fn) {
    timeouts.push(fn)
    window.postMessage(message, '*')
  }
  function handler(e) {
    if (e.source === window && e.data === message) {
      const fn = timeouts.shift()
      fn()
    }
  }
  window.addEventListener('message', handler, true)
  window.setZeroTimeout = setZeroTimeout
})()


function Foo() {
    getName = function () {
        console.log(1);
    };
    return this;
};
Foo.getName = function () {
    console.log(2);
};
Foo.prototype.getName = function () {
    console.log(3);
};
var getName = function () {
    console.log(4);
};
function getName() {
    console.log(5);
};

Foo.getName(); // 2 查找Foo函数上的静态属性
getName(); // 4: 5的函数声明提升，然后被4的声明覆盖
Foo().getName(); // 1: 返回的this指向window，而函数中的getName由于水声明，也指向window，所以本质是重写了window.getName
getName(); // 1: 调用得写后的getName
new Foo.getName(); // 2: 点操作符的优先级高于new，其实就是对一个函数进行实例化
new Foo().getName(); // 3: 先执行new操作，然后返回的是this,this指向实例，实例上无getName方法，在原型链上找
new new Foo().getName(); 3: new (new Foo().getName())

function Foo() {
  Foo.a = function () {
    console.log(1);
  };
  this.a = function () {
    console.log(2);
  };
}
Foo.prototype.a = function () {
  console.log(4);
};
Function.prototype.a = function () {
  console.log(3);
};
Foo.a(); // 3: Foo本身没有a这个属性，就会在__proto__上查找，即Function.prototype上有，打印3
let obj = new Foo(); 
obj.a(); // 2: 实例化后，this指向实例，而且在实例化的过程中this新增了一个a属性，打印2
Foo.a(); // 1: 实例化的过程中

// 数组分组改成减法运算
// [5, [[4, 3], 2, 1]] 变成 (5 - ((4 - 3) - 2 - 1)) 
const run = (arr) => {
  return arr.reduce((pre, cur) => {
    const first = Array.isArray(pre) ? run(pre) : pre
    const last = Array.isArray(cur) ? run(cur) : cur
    return first - last
  })
}

// 组件设计的基本原则
// 1. 单一职责
// 2. 通用
// 3. 封装：隐藏内部细节和实现意义，通过props来实现行为控制和输出
// 4. 可测

// 原型链
// 原型 和 原型链
// 每一个构造函数都有一个prototype属性，这个属性指向一个对象，就也是原型对象
// 当使用构造函数创建实例的时候，prototype属性指向的原型对象就会成为实例的原型对象
// 原型对象默认有一个constructor属性，指向指向他的构造函数（构造函数和原型对象是互相指向的关系）
// 每个对象都有一个隐藏的属性，指向它的原型对象，这个属性可以通过Object.getPrototypeOf(obj) 或者 obj.__proto__来访问
// 构造函数的prototype属性和它所创建的实例对象的隐式prototype属性指向同一个对象，即 对象.__proto__ === 构造函数.prototype

// 无法通过call/apply/bind绑定箭头函数的this
var student = {
    name: '若川',
    doSth: function(){
        console.log(this.name);
        return () => {
            console.log('arrowFn:', this.name);
        }
    }
}
var person = {
    name: 'person',
}
student.doSth().call(person); // '若川'  'arrowFn:' '若川'
student.doSth.call(person)(); // 'person' 'arrowFn:' 'person'

// this指向
// 1. 普通函数调用： this指向window
// 2. 对象的方法调用：this指向最后的调用的对象
// 3. call/apply/bind调用：指向传入的第一个参数
// 4. 构造函数调用： this指向新生成的对象
// 5. 箭头函数： this指向最近一层非函头函数的this,否则为全局对象
// 6. DOM事件当中的this指向绑定事件的元素
// 优先级： new > call/apply/bind > obj.fn > fn

// react中的ref
// string ref: <input ref='ref' /> this.refs.ref
// callback ref: <Component ref={(el) => {console.log(el)}}/>传入是一个回调函数，传参是当前dom实例
// create ref: const ref = createRef 或者 useRef，通过current属性去引用， ref.current的变化不会主动让页面渲染
// 函数式组件没有实例，所以需要通过forwardRef进行转发
// 何时使用refs:
// 1. 管理焦点/文本选择/媒体播放
// 2. 触发强制动画
  
// arguments 考点
  // 函数没有包含 剩余参数、默认参数 和 解构赋值，那么arguments对象中的值会跟踪参数的值（反之亦然）。看下面的代码：
function func(a) { 
  arguments[0] = 99;   // 更新了arguments[0] 同样更新了a
  console.log(a);
}
func(10); // 99

function func(a) { 
  a = 99;              // 更新了a 同样更新了arguments[0] 
  console.log(arguments[0]);
}
func(10); // 99
  
// 如果有剩余参数/默认参数/解构赋值，那arguments对象的值与参数的值就不会相互影响
function func(a = 55) { 
  arguments[0] = 99; // updating arguments[0] does not also update a
  console.log(a);
}
func(10); // 10

function func(a = 55) { 
  a = 99; // updating a does not also update arguments[0]
  console.log(arguments[0]);
}
func(10); // 10

function side(arr) {
  arr[0] = arr[2]
}
function add(a, b, c) {
  c = 10
  side(arguments)
  return a + b +c
}
console.log(add(1, 2, 3)) // 22
  
function side(arr) {
  arr[0] = arr[2]
}
function add(a, b, c = 3) {
  c = 10
  side(arguments)
  return a + b +c
}
console.log(add(1, 2, 3)) // 13

const [state, setState] = useMyState(1)

useMount(() => {
  setState(2, console.log)
  setState(3)
  setState(5)
})

function useMemoizedFn(fn) {
  const fnRef = useRef();
  fnRef.current = useMemo(() => fn, [fn]);

  const memoizedFn = useRef();
  if (!memoizedFn.current) {
    memoizedFn.current = function (this, ...args) {
      return fnRef.current.apply(this, args);
    };
  }

  return memoizedFn.current;
}
  
// useMyState: 返回的setState方法支持第二个参数
const useMyState = (initialState) => {
  const [state, setState] = useState(initialState);
  const setMyState = useCallback((patch, cb) => {
    setState((prevState) => {
      const res = typeof patch === 'function' ? patch(prevState) : patch;
      cb?.(res)
      return res
    });
  }, []);
  return [state, setMyState];
};


// 管理oject类型的
// https://ahooks.js.org/zh-CN/hooks/use-set-state/
const useSetState = (initialState) => {
  const [state, setState] = useState(initialState);
  const setMergeState = useCallback((patch) => {
    setState((prevState) => {
      const newState = isFunction(patch) ? patch(prevState) : patch;
      return newState ? { ...prevState, ...newState } : prevState;
    });
  }, []);
  return [state, setMergeState];
};

import { useRef } from 'react'
const usePrevious = val => {
  const pre = useRef()
  const cur = useRef()
  useEffect(() => {
    pre.current = cur.current
    cur.current = val
  }, [val])
  return pre.current
}

function useTimeout(fn, delay) {
  const fnRef = useRef();  
  const timerRef = useRef();

  fnRef.current = fn

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      fnRef.current();
    }, delay);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [delay]);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, []);

  return clear;
}


function useInterval(fn,delay,options) {
  const immediate = options?.immediate;

  const fnRef = useRef()
  const timerRef = useRef();

  fnRef.current = fn

  useEffect(() => {
    if (immediate) {
      fnRef.current();
    }
    timerRef.current = setInterval(() => {
      fnRef.current();
    }, delay);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [delay]);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  return clear;
}

function useToggle(defaultValue, reverseValue) {
  const [state, setState] = useState(defaultValue);

  const actions = useMemo(() => {
    const reverseValueOrigin = (reverseValue === undefined ? !defaultValue : reverseValue)

    const toggle = () => setState((s) => (s === defaultValue ? reverseValueOrigin : defaultValue));
    const set = (value) => setState(value);
    const setLeft = () => setState(defaultValue);
    const setRight = () => setState(reverseValueOrigin);
    return {
      toggle,
      set,
      setLeft,
      setRight,
    };
  }, []);

  return [state, actions];
  }
  
const useLatest = val => {
  const ref = useRef()
  ref.current = val
  return ref.current
}

const useDebounceFn = (fn, options) => {
  const ref = useRef()
  ref.current = fn

  const debounced = useMemo(() => {
    return debounce((...args) => ref.current(...args), options)
  }, [])

  useEffect(() => {
    return () => {
      debounced.cancel()
    }
  })

  return {
    run: debounced,
    cancel: debounced.cancel,
    flush: debounced.flush
  }
}

const useDebounceFn = (fn, options) => {
  const ref = useRef()
  ref.current = fn

  const debounced = useMemo(() => debounce((...args) => ref.current(...args), options), [])

  useEffect(() => {
    return debounced.cancel()
  }, [])

  return {
    run: debounced,
    cancel: debounced.cancel
  }
}

const useDebounce = (val, options) => {
  const [debounced, setDebounced] = useState(val)
  const { run } = useDebounceFn(() => setDebounced(val), options)
  useEffect(() => {
    run()
  }, [val])
  return debounced
}
  
// react 自定义hook useCountDown
const useCountDown = (initialCount = 10, callback) => {
  const [counter, setCounter] = useState(initialCount)
  const ref = useRef()

  const start = () => {
    setCounter(initialCount)
    ref.current = () => {
      setInterval(() => {
        setCounter(prev => prev - 1)
      }, 1000)
    }
  }

  useEffect(() => {
    return () => {
      clearInterval(ref.current)
    }
  }, [])

  useEffect(() => {
    if (count === 0) {
      clearInterval(ref.current)
      callback()
    }
  }, [counter])

  return {
    start,
    count
  }
}

const useCountDown = (initialValue = 10, cb) => {
  const [counter, setCounter] = useState(initialValue)
  const ref = useRef()

  const start = () => {
    setCounter(initialValue)
    ref.current = setInterval(() => {
      setCounter(prev => prev - 1)
    }, 1000)
  }

  useEffect(() => {
    return () => {
      if (ref.current) {
        clearInterval(ref.current)
      }
    }
  }, [])

  useEffect(() => {
    if (counter === 0) {
      ref.current && clearInterval(ref.current)
      cb()
    }
  }, [counter])

  return {
    counter,
    start
  }
}
  
const useMove = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const fn = (e) => {
      setPosition({
        x: e.pageX,
        y: e.pageY
      })
    }
    window.addEventListener('mousemove', fn)
    return () => {
      window.removeEventListener('mousemove', fn)
    }
  }, [])

  return position
}

// 实现一个useBodyScrollLock ，当出现弹窗时 阻止背景滚动
const useBodyScrollLock = () => {
  useLayoutEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalStyle
    }
  }, [])
}

const useWindowSize = () => {
  const [size, setSize] = useState<WindowSize>({
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight
  })

  useEffect(() => {
      const fun = () => {
          setSize({
              width: document.documentElement.clientWidth,
              height: document.documentElement.clientHeight
          })
      }
      window.addEventListener('resize', fun)
      return () => {
          window.removeEventListener('resize', fun)
      }
  },[])
  return size
}
  
const useWindowScroll = () => {
  const [off, setOff] = useState({
      x: window.scrollX, 
      y: window.scrollY
  })
  useEffect(() => {
      const fun = () => {
          setOff({
              x: window.scrollX,
              y: window.scrollY
          })
      }
      //监听
      window.addEventListener('scroll', fun)
      return () => {
          //移除监听
          window.removeEventListener('scroll', fun)
      }
  })
  return off
}

const useLocalStorage = (key, defaultValue) => { 
  const [value, setValue] = useState(defaultValue)
  useEffect(() => {
      window.localStorage.setItem(key, value)
  },[key, value])
  return [value, setValue]
}

function useLockFn(fn) {
  const lockRef = useRef(false);
  return useCallback(
    async (...args) => {
      if (lockRef.current) return;
      lockRef.current = true;
      try {
        const ret = await fn(...args);
        lockRef.current = false;
        return ret;
      } catch (e) {
        lockRef.current = false;
        throw e;
      }
    },
    [fn],
  );
}
  
const useUpdate = () => {
  const [, setState] = useState({});
  return useCallback(() => setState({}), []);
};

const useReducer = (reducer, initialValue) => {
  const [state, setState] = useState(initialValue)
  const dispatch = (action) => {
    setState(reducer(state, action))
  }
  return [state, dispatch]
}
// 用法
const reducer = (state, action) =>  {
  switch (action.type) {
    case 'increment':
      return state + 1
    case 'decrement':
      return state - 1
    default:
      return state
  }
}
const [count, dispatch] = useReducer(reducer, 0)
const onClick = () => dispatch({type: 'increment'})

const useMount = (fn) => {
  useEffect(() => {
    fn?.();
  }, []);
};

const useMount = fn => {
  useEffect(() => {
    fn?.()
  }, [])
}

const useUnmount = (fn) => {
  const fnRef = useRef()
  fnRef.current = fn
  useEffect(() => {
    return () => {
      fnRef.current()
    }
  }, [])
};

// 只想模拟 componentDidUpdate
const mounted = useRef();
useEffect(() => {
  if (!mounted.current) {
    mounted.current = true;
  } else {
   console.log('I am didUpdate')
  }
});

// React18 新特性
// 1. Render: 新增了一个concurrent render 并发模式的渲染
// createRoot(root).render(<App/>), 删除了render方法的回调函数，这个回调可以用useEffect去实现模拟
// 2. FC中删除了children属性，如果在ts中需要自己定义
// 3. 18之前只有React事件当中，进行多个状态批量处理的操作，setTimeout/setInterval/原生事件处理函数中不做批量处理，18中所有更新都做批量处理
// 4. flushSync会退出批量更新
// 5. 返回空组件既支持null，又支持undefined
// 6. suspense不再跳过缺省值为null的fallback的suspense边界
// 7. CM: concurrent mode 异步可中断更新：fiber reconciler
// 8. 并发特性：被startTransition回调包裹的setState 触发的渲染被标记为不紧急渲染，这些渲染可能被其他紧急渲染所抢占
// 9. useDeferredValue: 只有当前没有紧急更新时，该值才会变为最, 跟startTransition一样

// useEvent: 封装事件处理函数
// 组件多次render保持引用一致
// 函数内能获取到最新的props与state
  
// render 正则
let template = '{{name}}很厉害，才{{age}}岁'
const context = { name: 'lsd', age: 32 }
const render = (template, context) => {
    return template.replace(/\{\{(.*?)\}\}/g, (_, key) => context[key.trim()])
}
render(template, context)

// super有两种调用方式：当成函数调用和当成对象来调用。
// super当成函数调用时，代表父类的构造函数，且返回的是子类的实例，也就是此时super内部的this指向子类。在子类的constructor中super()就相当于是Parent.constructor.call(this)。
// super当成对象调用时，普通函数中super对象指向父类的原型对象，静态函数中指向父类。且通过super调用父类的方法时，super会绑定子类的this，就相当于是Parent.prototype.fn.call(this)。

async function async1() {
    console.log('async1 start');  // 2
    await async2();
    console.log('async1 end'); // 8
}
async function async2() {
    console.log('async2 start'); // 3
    await async3();
    console.log('async2 end'); // 6
}
async function async3() {
    setTimeout(function() {
        console.log('async3');
    }, 0) // 10
}
console.log('script start');  // 1

setTimeout(function() {
    console.log('setTimeout'); // 9
}, 0)

async1();

new Promise(function(resolve) {
    console.log('promise1'); // 4
    resolve();
}).then(function() {
    console.log('promise2'); // 7
});
console.log('script end'); // 5

// async/await是一个语法糖 => 同步的方式执行异步的操作
  
// 状态机
// 状态总数（state）是有限的。
// 任一时刻，只处在一种状态之中。
// 某种条件下，会从一种状态转变（transition）到另一种状态。


// 0.1 + 0.2 === 3 // false
// 在两数相加时，会先转换成二进制，0.1 和 0.2 转换成二进制的时候尾数会发生无限循环，
// 然后进行对阶运算，JS 引擎对二进制进行截断，所以造成精度丢失。
// Number.EPSILON 等于2的-52次方，可以用来处理浮点数计算的精度问题
function withinErrorMargin(left, right) {
  return Math.abs(left - right) < Number.EPSILON
}

  function withinErrorMargin(left, right) {
  return Math.abs(left - right) < Math.EPSILON
}

// symbol有什么作用： 表示独一无二的变量，防止命名冲突
// symbol不会被常规的方法遍历到，模拟私有变量，Object.getOwnPropertySymbols/
// Reflect.ownKeys 等于 Object.getOwnPropertyNames(target).concat(Object.getOwnPropertySymbols(target))
// Symbol.for 可以创建相等的Symbol 
let s1 = Symbol.for('foo')
let s2 = Symbol.for('foo')
s1 === s2 // true


// 如何判断一个对象是不是空对象
Object.keys(obj).length === 0 // 这种方法有个问题，对于ES6新语法Symbol无法获取
let obj = {[Symbol()] : '1'}
// 应该把两种结合起来
Object.keys(obj).length === 0 && Object.getOwnPropertySymbols(obj).length === 0


// 实现一个对象被for of遍历： 手动给对象添加迭代器
var obj = { a: 1, b: 2, c: 3 }
const iterable = Object.create(Object.prototype, {
  [Symbol.iterator]: {
    enumerable: false,
    writable: false,
    configurable: true,
    value: function() {
      let _this = this
      const keys = Object.keys(_this)
      let index = 0
      return {
        next() {
          return {
            value: _this[keys[index++]],
            done: index > keys.length
          }
        }
      }
    }
  }
})
Object.setPrototypeOf(obj, iterable)
for(let v of obj) {console.log(v)}

// 作用域
// 在 JavaScript 中，我们将作用域定义为一套规则，这套规则用来管理引擎如何在当前作用域以及嵌套子作用域中根据标识符名称进行变量查找
  
// 作用域链
// 首先要了解作用域链，当访问一个变量时，编译器在执行这段代码时，会首先从当前的作用域中查找是否有这个标识符，如果没有找到，
// 就会去父作用域查找，如果父作用域还没找到继续向上查找，直到全局作用域为止,，而作用域链，就是有当前作用域与上层作用域的一系列变量对象组成，
// 它保证了当前执行的作用域对符合访问权限的变量和函数的有序访问。

// 闭包产生的本质
// 当前环境中存在指向父级作用域的引用
  
// 大数相加

// 阶梯问题

[] + [] // ""
let arr = []
arr.valueOf() // []
arr.toString() // ''
'' + '' = ''

{} + {} // "[object Object][object Object]"
let obj = {}
obj.valueOf() // {}
obj.toString() // [object Object]

{} +[] // 0
// 把{}当块语句，然后执行+[],也就是0
{ a: 1 } +[1, 2] // 1,2
  
[] + {} // '' + '[object Object]'
[1, 2] + { a: 1 }  // "1,2[object Object]"
  

// setTimeout和setInterval中时间参数并不是到点就立即执行，而是到点将其回调事件加入事件队列中。
// 按照队列先进先出的性质，该回调事件到点之后是否能执行取决于是否属于队列首位，如果前头还有其他事件在等待，则不能按点执行。
// 这并是导致事件等待执行时间出现误差的原因。 

// 每个 setTimeout 产生的任务会直接 push 到任务队列中；
// 而 setInterval 在每次把任务 push 到任务队列前，都要进行一下判断(看上次的任务是否仍在队列中，如果有则不添加，没有则添加)。
// 使用setInterval可能会有的问题：
// 1.使用 setInterval 时，某些间隔会被跳过；
// 2. 可能多个定时器会连续执行；

// setInterval 缺点是很明显的，为了解决这些弊端，可以使用 setTimeout() 代替。
// 1. 在前一个定时器执行完前，不会向队列插入新的定时器（解决缺点一）
// 2. 保证定时器间隔（解决缺点二）
function mySetInterval(fn, t) {
  let timer = null
  function interval() {
    fn()
    timer = setTimeout(() => {
      interval()
    }, t)
  }
  timer = setTimeout(() => {
    interval()
  }, t)
  return {
    cancel: () => {
      clearTimeout(timer)
    }
  }
}

// ES6 static 
// 通过 static 关键字定义静态方法。不能在类的实例上调用静态方法，而应该通过类本身调用。这些通常是实用程序方法，例如创建或克隆对象的功能。
// 1. 静态方法中调用其他静态方法,需要使用this关键字
// 2. 非静态方法中,不能使用this关键字来访问静态方法，通过 this.constructor来调用


// React Fiber数据结构
interface Fiber {
  /**
   * ⚛️ 节点的类型信息
   */
  // 标记 Fiber 类型, 例如函数组件、类组件、宿主组件
  tag: WorkTag,
  // 节点元素类型, 是具体的类组件、函数组件、宿主组件(字符串)
  type: any,

  /**
   * ⚛️ 结构信息
   */ 
  return: Fiber | null,
  child: Fiber | null,
  sibling: Fiber | null,
  // 子节点的唯一键, 即我们渲染列表传入的key属性
  key: null | string,

  /**
   * ⚛️ 节点的状态
   */
  // 节点实例(状态)：
  //        对于宿主组件，这里保存宿主组件的实例, 例如DOM节点。
  //        对于类组件来说，这里保存类组件的实例
  //        对于函数组件说，这里为空，因为函数组件没有实例
  stateNode: any,
  // 新的、待处理的props
  pendingProps: any,
  // 上一次渲染的props
  memoizedProps: any, // The props used to create the output.
  // 上一次渲染的组件状态
  memoizedState: any,


  /**
   * ⚛️ 副作用
   */
  // 当前节点的副作用类型，例如节点更新、删除、移动
  effectTag: SideEffectTag,
  // 和节点关系一样，React 同样使用链表来将所有有副作用的Fiber连接起来
  nextEffect: Fiber | null,

  /**
   * ⚛️ 替身
   * 指向旧树中的节点
   */
  alternate: Fiber | null,
}

// react中，调用setState方法后，会自顶向下重新渲染组件，自顶向下的含义是，该组件以及它的子组件全部需要渲染；
//而vue使用Object.defineProperty（vue @3迁移到了Proxy）对数据的设置（setter）和获取（getter）做了劫持，也就是说，vue能准确知道视图模版中哪一块用到了这个数据，并且在这个数据修改时，告诉这个视图，你需要重新渲染了。
// 所以当一个数据改变，react的组件渲染是很消耗性能的——父组件的状态更新了，所有的子组件得跟着一起渲染，它不能像vue一样，精确到当前组件的粒度。
  
// fiber 架构是 React 在 16 以后引入的，之前是 jsx -> render function -> vdom 然后直接递归渲染 vdom，
// 现在则是多了一步 vdom 转 fiber 的 reconcile，在 reconcile 的过程中创建 dom 和做 diff 并打上增删改的 effectTag，
// 然后一次性 commit。这个 reconcile 是可被打断的，可以调度，也就是 fiber 的 schedule。

// fiber遍历规则
// 1. 从根节点开始，依次遍历该节点的子节点、兄弟节点，如果两者都遍历了，则回到它的父节点；
// 2. 当一个节点的所有子节点遍历完成，才认为该节点遍历完成；
  
// requestIdleCallback是一个属于宏任务的回调，就像setTimeout一样。不同的是，setTimeout的执行时机由我们传入的回调时间去控制，
// requestIdleCallback是受屏幕的刷新率去控制。只需要知道它每隔16ms会被调用一次，它的回调函数可以获取本次可以执行的时间，每一个16ms除了requestIdleCallback的回调之外，还有其他工作，
// 所以能使用的时间是不确定的，但只要时间到了，就会停下节点的遍历。
const workLoop = (deadLine) => {
  let shouldYield = false;// 是否该让出线程
  while(!shouldYield){
      console.log('working')
      // 遍历节点等工作
      shouldYield = deadLine.timeRemaining()<1;
  }
  requestIdleCallback(workLoop)
}
requestIdleCallback(workLoop);

// Hook对象
export type Hook = {
  memoizedState: any, // useState中的state信息/useEffect中的effect对象/useMemo中缓存的值和deps/useRef中保存的是ref对象
  baseState: any, // 初始状态值，如`useState(0)`，则初始值为0
  baseUpdate: Update<any, any> | null,
  queue: UpdateQueue<any, any> | null, // 保存待更新队列和更新函数
  next: Hook | null,  // 指向下一个链表节点，即下一个hook对象
};
// 由 useState 返回的这个用来更新状态的函数（下文称为 dispatcher）
// 当我们在每次调用 dispatcher 时，并不会立刻对状态值进行修改（对的，状态值的更新是异步的），
// 而是创建一条修改操作——在对应 Hook 对象的queue属性挂载的链表上加一个新节点：

// useEffect
// 链表节点的数据结构为
const effect: Effect = {
    tag, // 用来标识依赖项有没有变动，如果为NoHookEffect的节点则会跳过
    create, // 用户使用useEffect传入的函数体
    destroy, // 上述函数体执行后生成的用来清除副作用的函数，将create的执行结果，也就是上面函数体的返回保持到destroy
    deps, // 依赖项列表
    next: (null: any),
};

// 函数第一次渲染组件和更新组件分别调用不同的hooks对象，我们现在就来看看HooksDispatcherOnMount 和 HooksDispatcherOnUpdate。
const HooksDispatcherOnMount = {
  useCallback: mountCallback,
  useEffect: mountEffect,
  useLayoutEffect: mountLayoutEffect,
  useMemo: mountMemo,
  useReducer: mountReducer,
  useRef: mountRef,
  useState: mountState,
};

const HooksDispatcherOnUpdate = {
  useCallback: updateCallback,
  useEffect: updateEffect,
  useLayoutEffect: updateLayoutEffect,
  useMemo: updateMemo,
  useReducer: updateReducer,
  useRef: updateRef,
  useState: updateState
};

// 我们来总结一下初始化阶段,react-hooks做的事情，
// 在一个函数组件第一次渲染执行上下文过程中，每个react - hooks执行，都会产生一个hook对象，并形成链表结构，
// 绑定在workInProgress的memoizedState属性上，然后react - hooks上的状态，绑定在当前hooks对象的memoizedState属性上。
// 对于effect副作用钩子，会绑定在workInProgress.updateQueue上，等到commit阶段，dom树构建完成，在执行每个 effect 副作用钩子。

// pushEffect 的作用：是创建 effect 对象，并将组件内的 effect 对象串成环状单向链表，
// 放到fiber.updateQueue上面。即 effect 除了保存在 fiber.memoizedState 对应的 hook 中，
// 还会保存在 fiber 的 updateQueue 中。
  
// updateQueue 的 effect 链表会作为最终被执行的主体，带到 commit 阶段处理。
// 即 fiber.updateQueue 会在本次更新的 commit 阶段中被处理，其中 useEffect 是异步调度的，
// 而 useLayoutEffect 的 effect 会在 commit 的 layout 阶段同步处理。
// 等到 commit 阶段完成，更新应用到页面上之后，开始处理 useEffect 产生的 effect，简单说：
// 1. useEffect 是异步调度，等页面渲染完成后再去执行，不会阻塞页面渲染。
// 2, uselayoutEffect 是在 commit 阶段新的 DOM 准备完成，但还未渲染到屏幕前，同步执行。

// 为什么fiber.updateQueue/useEffect 创建的 hook 对象中的 memoizedState 存的 effect 环状链表
// 方便定位到链表的第一个元素。updateQueue 指向它的最后一个 update，updateQueue.next 指向它的第一个update。
// 若不使用环状链表，updateQueue 指向最后一个元素，需要遍历才能获取链表首部。即使将updateQueue指向第一个元素，那么新增update时仍然要遍历到尾部才能将新增的接入链表

// 数组中的第K大数值
// https://leetcode.cn/problems/xx4gT2/solution/kuai-pai-zhi-hou-qu-dao-shu-di-kge-shu-b-5yk7/
const findKthLargest = function(nums, k) {
  const arr = sortArr(nums)
  return arr[arr.length - k]
};
const  sortArr = function(nums) {
  if(nums.length <= 1) return nums
  let l = [] ,r = []
  let mid = Math.floor((nums.length) / 2)
  let midVal = nums.splice(mid,1)[0]
  for (let i = 0; i < nums.length; i++){
      if(nums[i] < midVal){
          l.push(nums[i])
      } else {
          r.push(nums[i])
      }
  }
  return sortArr(l).concat(midVal).concat(sortArr(r))
}

const climbStairs = function(n) {
    if (n === 1) return 1
    if (n === 2) return 2
    const dp = [1, 2]
    for (let i = 2; i<n; i++) {
        dp[i] = dp[i - 1] + dp[ i -2]
    }
    return dp[n-1]
};

const climbStairs = function (n) {
  if (n === 1) return 1
  if (n === 2) return 2
  const dp = [1, 2]
  for (let i = 2; i < n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2]
  }
  return dp[n-1]
}
  
  
// 最小成本爬楼梯
// https://leetcode.cn/problems/min-cost-climbing-stairs/
const  minCostClimbingStairs = function(cost) {
  const len = cost.length
  const dp = [0, 0]
  for (let i =2; i <= len; i++) {
    dp[i] = Math.min(dp[i - 1] + cost[i - 1], dp[i - 2] + cost[ i - 2])
  }
  return dp[len]
};


// 编辑距离
// https://leetcode.cn/problems/edit-distance/submissions/
const minDistance = function(word1, word2) {
    const m = word1.length
    const n = word2.length
    let dp = new Array(m+1).fill(0).map(() => new Array(n+1).fill(0))

    //初始化数组，word1前i个字符最少需要i次操作，比如i次删除变成word2
    for (let i = 1; i <= m; i++) {
        dp[i][0] = i;
    }

    //初始化数组，word2前i个字符最少需要i次操作，比如j次插入变成word1
    for (let j = 1; j <= n; j++) {
        dp[0][j] = j;
    }

    for (let i = 1; i <= m; i++) {
        //循环word1和word2
        for (let j = 1; j <= n; j++) {
            if (word1[i - 1] === word2[j - 1]) {
                //如果word1[i-1] === word2[j-1],说明最后一个字符不用操作。
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                //dp[i-1][j] + 1：对应删除
                //dp[i][j-1] + 1：对应新增
                // dp[i-1][j-1] + 1：对应替换操作
                dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + 1);
            }
        }
    }

    return dp[m][n];
};

// 实现36进制转换
function getNum36() {
  const nums = []
  for (let i = 0; i < 36; i++) {
    if (i <= 9) {
      nums.push(i)
    } else {
      nums.push(String.fromCharCode(i + 87))
    }
  }
  return nums
}
function scale36(n) {
  const arr = []
  const nums = getNum36()
  let neg = ''
  if (n < 0) {
    net = '-'
    n = Math.abs(n)
  }
  while (n) {
    let res = n % 36
    arr.unshift(nums[res])
    n = parseInt(n / 36)
  }
  arr.unshift(neg)
  return arr.join('')
}

// 合并区间
// https://leetcode.cn/problems/merge-intervals/
const mergeIntervals = (intervals) => {
  const res = []
  intervals.sort((a, b) => a[0] - b[0])
  let prev = intervals[0]
  for (let i = 1; i < intervals.length; i++) {
    const cur = intervals[i]
    if (prev[1] > cur[0]) {
      prev[1] = Math.max(cur[1], prev[1])
    } else {
      res.push(prev)
      prev = cur
    }
  }
  res.push(prev)
  return res
}
  
// Vue框架的优点
// 1. 轻易级框架：几十kb
// 2. 简单易学：上手容易
// 3. 双向绑定：操作数据更新视图
// 4. 组件化开发：工程结构清晰，代码维护方便
// 5. 虚拟DOM，加载HTML节点，运行效率高

// Model-View-ViewModel
// 软件架构设计模式
// View层展示的不是Model层的数据，而是ViewModel的数据，由ViewModel与Model层交互，完全解耦了View层和Model层

// Vue通信
// 1. 父传子props
// 2. 子传父: $emit $on
// 3. Event Bus
// 4. Vuex
// 5. $parent/$children
// 6. $ref
// 7. provide/inject(祖先及后代)
// 8. $attrs获取父组件传进来，但没通过props接收的属性
  
Object.defineProperty 与 proxy
// 1. 一次只能对一个属性进行监听，需要遍历来对所有属性监听。这个我们在上面已经解决了。
// 2. 在遇到一个对象的属性还是一个对象的情况下，需要递归监听。
// 3. 对于对象的新增属性，需要手动监听
// 4. 对于数组通过push、unshift方法增加的元素，也无法监听

// HTTP和HTTPS的区别
// 1. https协议需要到ca申请证书
// 2. http是超文本传输协议，心思是明文传输，https则是具有安全性的ssl加密传输协议
// 3. http和https使用的链接凡是不同，默认的端口也不一样，http是80，https是443
// 4.http的连接很简单，是无状态的；https协议是由SSL+ HTTP协议构建的可进行加密传输、身份认证的网络协议，比http协议安全

// 对称加密 和 非对称加密
// 对称加密： 加密和解密用的同一个密钥，明显缺陷就是秘钥本身如何进行保密和安全传输
// 非对称加密： 用一对密密钥，一个保密的为私钥，一个公开的为公钥，私钥加密的只有公钥才能解开，公钥加密的数据只有私钥才能解开，
// 不需要传输私钥，公钥是公开的，常见的算法有RSA DSA
// 证书内包含数字签名、签名算法、公钥、有效时间；
// HTTP一个缺陷就是明文传输，数据被别人捕获后就可获取其中的信息，https传输的数据是经过加密的，即使抓包抓到也无法看到其人中的内容
// 非对称加密存在的问题，无法证明公开密钥本身是货真价实的公开密钥，这个可以通过这数字证书认证的方法防止伪装
// HTTPS 能过校验数字签名来防止内容篡改
// HTTPS 采用的是非对称加密和对称加密并用的混合加密机制
// 因为需要握手协商秘钥等信息，页面加载时间比使用http要长
// 加密和解密会消耗更多的cpu和内存资源
// 购买https所需证书也是一项开销
// https加密过程是怎样的
// 首先，客户端 A 访问服务器 B ，这时候客户端 A 会生成一个随机数1，把随机数1 、自己支持的 SSL 版本号以及加密算法等这些信息告诉服务器 B 。
//   服务器 B 知道这些信息后，然后确认一下双方的加密算法，然后服务端也生成一个随机数 2 ，并将随机数 2 和 CA 颁发给自己的证书一同返回给客户端 A 。
//   客户端 A 得到 CA 证书后，会去校验该 CA 证书的有效性，校验方法在上面已经说过了。校验通过后，客户端生成一个随机数3 ，然后用证书中的公钥加密随机数3 并传输给服务端 B 。
//   服务端 B 得到加密后的随机数3，然后利用私钥进行解密，得到真正的随机数3。
//   最后，客户端 A 和服务端 B 都有随机数1、随机数2、随机数3，然后双方利用这三个随机数生成一个对话密钥。之后传输内容就是利用对话密钥来进行加解密了。这时就是利用了对称加密，一般用的都是 AES 算法。
//   客户端 A 通知服务端 B ，指明后面的通讯用对话密钥来完成，同时通知服务器 B 客户端 A 的握手过程结束。
//   服务端 B 通知客户端 A，指明后面的通讯用对话密钥来完成，同时通知客户端 A 服务器 B 的握手过程结束。
//   SSL 的握手部分结束，SSL 安全通道的数据通讯开始，客户端 A 和服务器 B 开始使用相同的对话密钥进行数据通讯。

  // 跨域
  // 所谓同源策略，指 协议 + 域名 + 端口 三者相同，即使两个不同的域名指向同一个ip,也非同源
  // 同源策略限制的内容有：
  // cookie localstorage indexedDB 等存储性内容
  // DOM 节点
  // AJAX请求发送后，结果被浏览器拦截了
  // <img> <link href=xxx> <script src=xxx> 这三个标签是允许跨域加载资源的
  // 当协议 子域名 主域名 端口号 中任意一个不相同时，都算作不同域
  // 跨域并不是请求发不出去，请求能发出去，服务端能收到请求并正常返回，只是结果被浏览器拦截了
  // 表单可以发起跨域请求，而ajax不行，表单不会获取新的内容，可以发起跨域请求，ajax可以获取响应
  // 浏览器认为这是不安全的
  // 1. jsonp跨域，仅支持get方法，不安全可能会遭受xss攻击
  // 2. cors 后端配置access-control-allow-origin 请求时会出现简单请求和复杂请求
  // 复杂请求是指在正式通信之前，增加一次http查询请求，称为预检请求，方法是option，通过该请求来知道服务端是否允许跨域请求
  // 3. postMessage
  // frame.contentWindow.postMessage 发送
  // window.onmessage 接下并返回
  // 4. websocket: 浏览器与服务器间的全双工通信，ws和http都是应用层协议，都基于tcp协议，ws建立时需要借助http协议，
  // 连接建立好后，client 与 server 之间的双向通信就与http无关了
  // 5. node中间件代理
  // 同源策略是浏览器需要遵循的标准，而如果是服务器向服务器请求无需遵循同源策略
  // 按受客户端请求，将请求转发给服务器，拿到服务器响应数据，将响应转发给客户端
  // 6. nginx反向代理
  // 7. window.name + iframe
  // 8 document.domain + iframe
  // 小结： cors 支持所有类型的http请求，是跨域http请求的根本解决方案
  // 小结： node中间件和nginx反向代理，主要是得用同源策略对服务器不加限有制
  // 小结： 日常工作中，用得多的是cors 和 nginx 反向代理
  
// http 2.0
// 1. 二进制分帧：所有传输信息分割为更小的消息和帧，并对它们采用二进制格式的编码将其封装，实现低延迟和高吞吐量
// 2. 多路复用：允许同时通过单一的http/2 连接发起多重的请求-响应消息，解决了之前对同一域名下发起tcp/ip链接受限的阻塞问题
// 3. 头部压缩：对于相同的数据，不再通过每次请求和响应发送，通信期间几乎不会改变，首部发生了变化，则只需将变化的部分加入到header帧中，改变的部分会加入到头部字段表中， HPACK算法，用header字段里的索引代替实际的字段
// 4. 服务端推送：服务器向客户端推送资源无需客户端明确地请求，服务端推送能把客户端所需要的资源伴随着index.html一起发送到客户端，省去了客户端重复请求的步骤。

// 数组中比左边元素都大同时比右边元素都小的元素
// 要求时间复杂度 O(N)。比如：
// 输入：[2, 3, 1, 8, 9, 20, 12]
// 输出：3, 4
let arr = [2, 3, 1, 8, 9, 20, 12]
var res = function(arr) {
  if (arr.length < 3) {
      return [];
  }
  const res = [];
  const m = new Array(arr.length);
  let min = arr[arr.length - 1];
  // 先生成一个新数组，每个位置的值记录它右边(子数组中)最小的值（不包含它本身）
  for(let i = arr.length - 2; i > 0; i--) {
      m[i] = min;
      if (arr[i] < min) {
          min = arr[i];
      }
  };
  console.log(m);
  let max = arr[0];
  for(let i = 1; i < arr.length - 1; i++) {
      // 如果当前值是比它前面最大的值还要大
      if (arr[i] > max) {
          max = arr[i];
          // 并且比它右边最小的值还要小，则满足条件
          if (arr[i] < m[i]) {
              res.push(i);
          }
      }
  }
  return res;
}
res(arr)

const findTheOne = (arr) => {
  const res = []
  if (arr.length < 3) return res
  const tmp = []
  let min = arr[arr.length - 1]
  for (let i = arr.length - 2; i > 0; i--) {
    tmp[i] = min
    if (arr[i] < min) {
      min = arr[i]
    }
  }
  let max = arr[0]
  for (let i = 1; i < arr.length - 1; i++) {
    if (arr[i] > max) {
      max = arr[i]
      if (arr[i] < tmp[i]) {
        res.push[i]
      }
    }
  }
  return res
}

// 红包算法
const redPackage = (total, n) => {
  const res = []
  let num = n
  for (let i = 0; i < n - 1; i++) {
    const money = Math.random() * (total / num * 2)
    total = total - money
    num--
    res.push(money)
  }
  res.push(total)
  return res
}

// 调整数组顺序使奇数位于偶数前面
// https://leetcode.cn/problems/diao-zheng-shu-zu-shun-xu-shi-qi-shu-wei-yu-ou-shu-qian-mian-lcof/
const exchange = (nums) => {
  let l = 0
  let r = nums.length - 1
  while (l < r) {
    if (nums[l] % 2 === 0 && nums[r] % 2 === 1) {
      [nums[l], nums[r]] = [nums[r], nums[l]]
    }
    if (nums[l] % 2 === 1) l++
    if (nums[r] % 2 === 0) r--
  }
  return nums
}

// 螺旋矩阵
// https://leetcode.cn/problems/spiral-matrix/
const spiralOrder = (matrix) => {
  if (!matrix || !matrix.length) return []
  let top = 0
  let bottom = matrix.length - 1
  let left = 0 
  let right = matrix[0].length - 1
  const res = []
  while (left <= right && top <= bottom) {
    for (let i = left; i <= right; i++) {
      res.push(matrix[top][i])
    }
    top++
    for (let i = top; i <= bottom; i++) {
      res.push(matrix[i][right])
    }
    right--
    if (left > right || top > bottom) break
    for (let i = right; i >= left; i--) {
      res.push(matrix[bottom][i])
    }
    bottom--
    for (let i = bottom; i>= top; i--) {
      res.push(matrix[i][left])
    }
    left++
  }
  return res
}

// 实现一个函数计算 "1+12-31+100-93"
let str = "1+12-31+100-93"
const parseStrToValue = (str) => {
  const arr = str.split('+')
  return arr.reduce((pre, cur) => {
    return pre + (cur.includes('-') ? cur.split('-').reduce((p, v) => p - v) : +cur)
  }, 0)
}

// 找出出现次数最多的单词
let str = 'An old woman had a cat. The cat was very old; she could not run quickly, and she could not bite, because she was so old. One day the old cat saw a mouse; she jumped and caught the mouse. But she could not bite it; so the mouse got out of her mouth and ran away, because the cat could not bite it'
const findTheMostWord = (str) => {
  const arr = str.split(' ')
  const map = {}
  let res = ''
  let max = 0
  arr.forEach(w => {
    const word = w.replace(/[^a-zA-Z]/g, '').toLowerCase()
    map[word] ? map[word]++ : (map[word] = 1)
    if (map[word] > max) {
      max = map[word]
      res = word
    }
  })
  return Object.entries(map).sort((a, b) => b[1] - a[1])
  // return res
}

// react性能优化
// 从两个方面考虑：
// 1. 减少重新render的次数，在react里边时间最长的就是reconciliation,如果不render就不会reconciliation
// 2. 减少计算的量，主要是减少重复计算的量，对于函数式组件来说，每次render都会重头开始执行函数调用
// 方法：
// 1. React.memo(减少render次数):  props没有变化的情况下，就算父组件重新渲染了，子组件也不会渲染。（做的是浅比较）
// React.memo高级用法： 第二个参数是可以传入函数控制对比的过程
// 2. useCallback(减少render次数): 把函数以及依赖项作为参数传入 useCallback，它将返回该回调函数的 memoized 版本，这个 memoizedCallback 只有在依赖项有变化的时候才会更新。
// 3. useMemo: 缓存计算量比较大的函数结果
// 4. 懒加载组件： React.lazy + suspense
// 5. 使用React.Fragments，避免额外标记，节省了渲染额外元素的工作量
// 6. 不要使用内联函数定义：不要用内联函数，而是在组件内部创建一个函数，并将事件绑定到该函数本身。这样每次调用 render 时就不会创建单独的函数实例了，React 进行虚拟 DOM diffing 时，它每次都会找到一个新的函数实例；因此在渲染阶段它会会绑定新函数并将旧实例扔给垃圾回收。
// 7. 避免使用内联样式属性：添加的内联样式是 JavaScript 对象而不是样式标记，要额外的脚本处理。
// 8. 优化React中的条件渲染，减少组件的安装与卸载操作
// 9. 使用ErrorBoundary为组件创建错误边界，局部组件的错误不应该影响整个应用
// 10. 渲染列表时，使用唯一键，key不仅影响性能，更重要的是标识，随机分配和更改的值不算标识

// React Vue diff算法对比
// 相同点：在处理老节点部分，都需要把节点处理 key - value 的 Map 数据结构，方便在往后的比对中可以快速通过节点的 key 取到对应的节点。
// 不同点：
// 1. Vue2 和 Vue3 的比对和更新是同步进行的，如果发现了那些节点需要移动或者更新或删除，是立即执行的，即不可中断的更新
//    React16以后的对比更新是异步可中断的
// 2. Vue2 和 Vue3 都使用了双端对比算法，React 的 Fiber 由于是单向链表的结构，不设置由右向左的链表之前，都无法实现双端对比

// 铺磁砖： 动态规划
// https://leetcode.cn/problems/tiling-a-rectangle-with-the-fewest-squares/submissions/
const tilingRectangle = function(n, m) {
  const  INF = Infinity
  const dp = new Array(n+1).fill(0).map(() => new Array(m+1).fill(0))
  for(let i = 1; i <= n; i++){
    for(let j = 1; j <= m; j++){
      //如果是正方形
      if(i == j){
        dp[i][j] = 1;
        continue;
      }
      dp[i][j] = INF;
      //1.横切
      for(let k = 1; k < i; k++){
        dp[i][j] = Math.min(dp[i][j], dp[k][j] + dp[i - k][j]);
      }
      //2.竖切
      for(let k = 1; k < j; k++){
        dp[i][j] = Math.min(dp[i][j], dp[i][k] + dp[i][j - k]);
      }
      
      //3.横竖切
      for(let p = 1; p <= Math.min(i, j); p++){
        for(let k = 1; k <= p; k++){
          if(p - k <= 0 || j - p <= 0 || i - p + k <= 0 || j - p - k <= 0) continue;
          dp[i][j] = Math.min(dp[i][j], dp[p - k][j - p] + dp[i - p + k][j - p - k] +dp[i - p][p + k] + 2);
        }
      }
    }
  }
  return dp[n][m];
};

// 基于requestAnimationFrame去实现setTimeout
const mySetTimeOut = (callBack, delay) => {
  let timer= null
  let startTime = Date.now()
  let endTime = startTime
  const loop = () => {
    timer = window.requestAnimationFrame(loop);
    endTime = Date.now () ;
    if (endTime - startTime >= delay){
      endTime = startTime = Date.now();
      cancelAnimationFrame(timer)
      callBack()
    }
  }
  timer = window.requestAnimationFrame(loop);
  return timer
}
  
mySetTimeOut(()=>{console.log('mySetTimeout')}, 20000);

// 基于requestAnimationFrame实现setInterval
const mySetInterval = (callBack, interval) => {
  let timer = null
  let startTime = Date.now()
  let endTime = startTime
  const loop = () => {
    timer = window.requestAnimationFrame(loop)
    endTime = Date.now()
    if (endTime - startTime >= interval){
      endTime = startTime = Date.now()
      callBack()
    }
  }
  timer= window.requestAnimationFrame(loop);
  return timer ;
}
const timer= mySetInterval(()=>{console.log('mySetInterval')}, 1000);

var x = {x: x}
console.log(x.x) // undefined

let y = { y: y }
console.log(y.y) // Reference error: y is not defined

let z = {}
z.z = z
console.log(z) // 一个循环引用
console.log(z === z.z) // true

// 判断满二叉树
// 逻辑是每如果为满二叉树，一定每一层的节点数都是上层节点数的两倍。
const isFullTree = (root) => {
  const nodes = [root]
  const dfs = (nodes) => {
    const subNodes = []
    for (let node of nodes) {
      node.left && subNodes.push(node.left)
      node.right && subNodes.push(node.right)
    }
    if (!subNodes.length) return true
    if (nodes.length * 2 !== subNodes.length) return false
    return dfs(subNodes)
  }
  return dfs(nodes)
}

// es5 实现 let
try{
  console.log('变量声明提升a', a);
}catch(error) {
  console.error('变量未定义');
  }
  
(function(){ // 通过立即执行函数创建块级作用域
  var a = 1;
  console.log('内部a:', a);
})();
  
try{
  console.log('外部a:', a);
}catch(error) {
  console.error('变量未定义');
}

// es5 实现 const 
var __const = function __const(data, value) {
  window.data = value // 把要定义的data挂载到window下，并赋值value
  Object.defineProperty(window, data, { // 利用Object.defineProperty的能力劫持当前对象，并修改其属性描述符
    enumerable: false,
    configurable: false,
    get: function () {
      return value
    },
    set: function (data) {
      if (data !== value) { // 当要对当前属性进行赋值时，则抛出错误！
        throw new TypeError('Assignment to constant variable.')
      } else {
        return value
      }
    }
  })
}

// 实现lazy链式调用
// https://juejin.cn/post/7078822242431270925
class Lazy {
  constructor(num) {
    this.res = num;
    this.cbs = []
  }

  add(num) {
    this.cbs.push({
      type: 'function',
      params: num,
      fn: function (num) {
        this.res += num
        console.log(this.res)}
    })
    return this;
  }

  multiply(num) {
    this.cbs.push({
      type: 'function',
      params: num,
      fn: function (num) {
        this.res *= num;
        console.log(this.res)
      }
    })
    return this;
  }

  top (fn) {
    this.cbs.push({
      type: 'callback',
      fn: function (cb) {
        cb(this.res)
      }
    })
    return this;
  }

  delay (time) {
    this.cbs.push({
      type: 'delay',
      fn: function() {
        return new Promise(resolve => {
          console.log(`等待${time}ms`);
          setTimeout(() => {
              resolve();
          }, time);
        })
      }
    })
    return this;
  }

  async output() {
    let cbs = this.cbs;
    for(let i = 0; i < cbs.length; i++) {
      const cb = cbs[i];
      let type = cb.type;
      if (type === 'function') {
        cb.fn.call(this, cb.params);
      } else if (type === 'callback') {
        cb.fn.call(this, this.res);
      } else if(type === 'delay') {
        await cb.fn();
      }
    }
    this.cbs = [];
  }
}
function lazy(num) {
    return new Lazy(num);
}
const lazyFun = lazy(2).add(2).top(console.log).delay(1000).multiply(3)

// 微前端：qiankun
// 微前端渲染过程：针对浏览器的渲染过程也可将其分为：HTML文本下载、 HTML拆解为语法树、拆解语法树中具备”副作用的内容“（对当前页面可能产生影响的内容）
// 如 Script、Style、Link 并交由沙箱处理进行后渲染，与一般的子应用不同的是需要子应用提供 provider，provider 中包含了子应用渲染和销毁的生命周期，这两个 Hook 可以应用缓存模式中进一步增强应用的渲染速度和性能。
// 运行期间主要会产生哪些副作用：全局变量、全局事件、定时器、网络请求、localStorage、Style 样式、DOM 元素

// vue-cli 脚手架机制
  
// formily源码

// 设计模式
// 1. 工厂模式
// 2. 单例模式
// 3. 发布订阅模式
// 4. 装饰器模式
// 5. 代理模式
// 6. 适配器模式

// 线程 进程
// 进程 和 线程
// 进程本质上就是一个程序在一个数据集上的动态执行过程
// 线程是一个基本的CPU执行单位，程序执行的最小单元
// 一个进程可以有多个线程, 这些线程之间彼此共享该进程的资源
// 浏览器是多进程的：
// https://juejin.cn/post/6844904040346681358
// 1 主进程，负责浏览器界面的显示与交互，各个页面的管理，创建与销毁
// 2 第三方插件进程， 每个类型的插件对应一个进程
// 3 GPU进程， 最多一个，用于3D绘制
// 4 渲染进程， 也就是浏览器内核
// 渲染进程内部是多线程的: GUI渲染线程，js引擎线程，事件触发线程，定时触发器线程，异步http请求线程
// GUI渲染线程：解析HTML CSS，构建DOM树和Render权势，布局和绘制
// js引擎，也叫js内核，负责处理js脚本
// GUI渲染线程和js引擎线程是互斥的，如果js执行时间过长，会造成页面渲染不连贯，导致页面渲染加载阻塞
// 事件处理线程： 鼠标点击
// 定时触发器线程： setTimeout setInterval
// 异步请求线程： xmlHttpRequest在边接后是通过浏览器新开一个线程请求

// 浏览器的垃圾回收机制
  // Scavenge算法：
  // 1. 标记：对对象区域中的垃圾进行标记
  // 2. 清除垃圾数据和整理碎片化内存：副垃圾回收器会把这些存活的对象复制到空闲区域中，并且有序的排列起来，复制后空闲区域就没有内存碎片了
  // 3. 角色翻转：完成复制后，对象区域与空闲区域进行角色翻转，也就是原来的对象区域变成空闲区域，原来的空闲区域变成了对象区域，这样就完成了垃圾对象的回收操作，同时这种角色翻转的操作还能让新生代中的这两块区域无限重复使用下去
  // 标记 - 清除算法：
  // 1. 标记：标记阶段就是从一组根元素开始，递归遍历这组根元素，在这个遍历过程中，能到达的元素称为活动对象，没有到达的元素就可以判断为垃圾数据。
  // 2. 清除：将垃圾数据进行清除。
  // 3. 产生内存碎片：对一块内存多次执行标记 - 清除算法后，会产生大量不连续的内存碎片。而碎片过多会导致大对象无法分配到足够的连续内存。
// 原理：垃圾收集器会定期（周期性）找出那些不在继续使用的变量，然后释放其内存
// 1. 标记清除：函数中声明一个变量，就将这个变量标记为“进入环境”；当变量离开环境时，则将其标记为“离开环境”，去掉环境中的变量以及被环境中的变量引用的变量的标记，后再被加上标记的变量将被视为准备删除的变量，销毁那些带标记的值并回收它们所占用的内存空间
// 2. 引用计数：跟踪记录每个值被引用的次数，会释放那些引用次数为 0 的值所占用的内存。

// 面向对象编程/函数式编程/命令式编程

// 前端如何做技术选型
// https://juejin.cn/post/6844904009250127885
// 1. 基于业务场景：技术服务于业务，要结合业务自身特点以及未来业务的可能演变方向进行技术选型
//    比如B端业务复杂，重点是开始发效率和长期的可维护性；C端更注重用户体验，以及兼容性
// 2. 当前团队的能力
//    当前团队的规模/团队成员的技术偏好/是否能在满足业务需求的同时，让团队成员也有成长
//    与公司整体的技术栈相协调
// 3. 降低成本，提高效率：更好的投入产出比，比如上手是否容易
// 4. 是否长期可维护：技术的社区生态是否完善、周边配套工具是否完善、否有人在维护，是否是大公司发起和采用的
// 5. 大道致简，切勿过渡设计
  
class Observer {
   constructor(name) {
      this.name = name
   }
   //观测到变化后的处理
   update(ob){
      console.log("观察者" + this.name + `-检测到被观察者${ob.id}变化`);
   }
}
//被观察者列
class Observed {
   constructor(event) {
      this.observers = [];
      this.event = event;
   }
   //添加观察者
   addObserver(observer) {
      this.observers.push(observer);
   }
   //删除观察者
   removeObserver(observer) {
      this.observers = this.observers.filter(o => {
         return o.event != observer.event;
      });
   }
   //通知所有的观察者
   notify() {
      this.observers.forEach(observer => {
         observer.update(this);
      });
   }
}

function handleKeyName(name) {
  let reg = /[A-Z]/g
  return name.replace(reg, function(upper) {
    return '_' + upper.toLowerCase()
  })
}
function changeKeyName(source, result = {}) {
  let reg = /[A-Z]/g
  for (let key in source) {
    if (source.hasOwnProperty(key) && reg.test(key)) {
      let newKey = handleKeyName(key)
      if (key !== null && typeof source[key] === 'object') {
        result[newKey] = changeKeyName(source[key], {})
      } else {
        result[newKey] = source[key]
      }
    }
  }
  return result
}

// recoil redux
// recoil更为原子化：
// 1. 状态定义是增量：可以在用的时候再定义新的状态，而不必将所有状态提前定义好再消费
// 2. 状态定义是分布式：式意味着状态的定义可以放在任何位置，不必统一注册到一个文件中
// 3. recoil状态不仅是纯状态，也可以是来自网络的状态
// 4. 批量创建状态atomFamily/selectorFamily
// 5. 如果使用了一个异步的 atom 或 selector ，则外层需要一个 Suspense 处理网络未返回时的 loading 状态

// redux： Flux 的特点就是单向数据流：
// redux在实现flux后还强调了三个基本原则：
// 1. 唯一的store
// 2. 保持状态只读
// 3. 数据改变只能用纯函数
// redux = Reducer + Flux
  
// pinia vuex

// store watch
  
// react为什么会有hooks
// 在你不需要写class 组件的情况下，就赋予了函数式组件 state 状态管理及生命周期函数的特性
// hooks优势：
// 写法简单：每一个Hook都是一个函数，因此它的写法十分简单，而且开发者更容易理解。
// 组合简单：Hook组合起来十分简单，组件只需要同时使用多个hook就可以使用到它们所有的功能。
// 容易扩展：Hook具有很高的可扩展性，你可以通过自定义Hook来扩展某个Hook的功能。
// 1. 函数式编程：更好的逻辑复用
// 2. 更好的组织代码：无法把代码分布在各个生命周期，使用hooks去模拟生命周期，代码高度聚合，可读性强，
// 3. 告别this，从函数中来到函数中去
// 4. 友好的渐近式

// react的调度
// 内部有五种优先级
expirationTime = performance.now() + 事件优先级的时间
var ImmediatePriority = 1;
var UserBlockingPriority = 2;
var NormalPriority = 3;
var LowPriority = 4;
var IdlePriority = 5;
// requestIdleCallback 只能一秒调用回调 20 次，这个完全满足不了现有的情况
// 在渲染以后只有宏任务是最先会被执行的，因此宏任务就是我们实现这一步的操作了，且各自也有优先级，我们肯定得选择优先级高的方式
// 所以选择了messageChannel，不选setImmediate是因为兼容性不好
// 调度流程： https://juejin.cn/post/6844903859937280014
// 首先每个任务都会有各自的优先级，通过当前时间加上优先级所对应的常量我们可以计算出 expirationTime，高优先级的任务会打断低优先级任务
// 在调度之前，判断当前任务是否过期，过期的话无须调度，直接调用 port.postMessage(undefined)，这样就能在渲染后马上执行过期任务了
// 如果任务没有过期，就通过 requestAnimationFrame 启动定时器，在重绘前调用回调方法
// 在回调方法中我们首先需要计算每一帧的时间以及下一帧的时间，然后执行 port.postMessage(undefined)
// channel.port1.onmessage 会在渲染后被调用，在这个过程中我们首先需要去判断当前时间是否小于下一帧时间。如果小于的话就代表我们尚有空余时间去执行任务；
// 如果大于的话就代表当前帧已经没有空闲时间了，这时候我们需要去判断是否有任务过期，过期的话不管三七二十一还是得去执行这个任务。
// 如果没有过期的话，那就只能把这个任务丢到下一帧看能不能执行了

// 我们可以通过port2进行发送消息，port1进行监听port2发送的消息。而MessageChannel属于宏任务，和setTimeout一样。所以onmessage触发的时机就是eventLoop中的下一个宏任务。
// onmessage函数每次执行都是一个时间切片，在react规定了5ms的执行时间，当react当中的任务执行超过5s时，就会调用postMessage发送消息，同时停止下个任务的执行，剩下的react任务只能再下次宏任务中执行了。

// react合成事件
// 1. 我们绑定的事件onClick等，并不是原生事件，而是由原生事件合成的React事件，比如 click事件合成为onClick事件。
// 比如blur, change, input, keydown, keyup等, 合成为onChange。
// 2. jsx 中绑定的事件(demo中的handerClick，handerChange),根本就没有注册到真实的dom上。是绑定在document上统一管理的。
// 3. React 想实现一个全浏览器的框架， 为了实现这种目标就需要提供全浏览器一致性的事件系统，以此抹平不同浏览器的差异

// 在React，diff DOM元素类型的fiber的props的时候， 如果发现是React合成事件，比如onClick，会按照事件系统逻辑单独处理。
// ② 根据React合成事件类型，找到对应的原生事件的类型，然后调用判断原生事件类型，大部分事件都按照冒泡逻辑处理，少数事件会按照捕获逻辑处理（比如scroll事件）。
// ③ 调用 addTrappedEventListener 进行真正的事件绑定，绑定在document上，dispatchEvent 为统一的事件处理函数。
// ④ 有一点值得注意: 只有上述那几个特殊事件比如 scorll,focus,blur等是在事件捕获阶段发生的，其他的都是在事件冒泡阶段发生的，无论是onClick还是onClickCapture都是发生在冒泡阶段，至于 React 本身怎么处理捕获逻辑的。我们接下来会讲到。
  
// ①首先通过统一的事件处理函数 dispatchEvent,进行批量更新batchUpdate。
// ②然后执行事件对应的处理插件中的extractEvents，合成事件源对象,每次React会从事件源开始，从上遍历类型为 hostComponent即 dom类型的fiber,判断props中是否有当前事件比如onClick,最终形成一个事件执行队列，React就是用这个队列，来模拟事件捕获->事件源->事件冒泡这一过程。
// ③最后通过runEventsInBatch执行事件队列，如果发现阻止冒泡，那么break跳出循环，最后重置事件源，放回到事件池中，完成整个流程。

// react17 后将事件绑定到container上，而不是document上，这样做的好处是微前端一个前端系统中可能有多个应用，如果继续采取全部绑定在document上，那么可能多应用下会出现问题。
// 取消事件池，避免在setTimeout里边拿不到e.target的问题
// 支持了获生事件捕获

// react事件机制
// 用户为onClick添加函数时，React并没有将click绑定到DOM上
// 在document这块用一个对所有的事件的监听，当事件冒泡到document时，再封装事件回调函数交给中间层SyntheticEvent
// 所以当事件触发的时候，使用统一的分发函数dispatchEvent将指定函数执行。
// 这样做减少了内存的消耗，还能在组件挂载和销毁时统一订阅或移除事件
// 冒泡到浏览器的也不是原生的事件，而是react自己合成的事件
// 合成事件机制第一个抹平了浏览器间的兼容性问题，赋予了跨浏览器开发的能力
// 合成事件机制是创建了一个事件池专门管理他们的创建和销毁，使用时从池子里取然后创建对象，结束后就销毁对象上的属性

// React实现了一个合成事件层，定义的事件处理器会接收到一个合成事件对象的实例，且与原生事件有相同的接口，支持事件冒泡

// React合成事件
// React合成事件是模拟原生DOM事件所有能力的一个事件对象
// 1. 在底层摸平各浏览器之间的差异，向开发人员提供统一、稳定、并且和DOM原生事件相同的事件接口
// 2. 自定义事件系统，让React掌握了事件处理的主动权，方便React对事件的中心化管理
// 核心由三部分构成： 事件合成/事件绑定/事件触发
// 事件合成：构建合成事件和原生事件的映射关系以及合成事件与事件处理插件的映射关系
// 事件绑定：React遍历元素的props如发现合成事件，即找到对应的原生事件绑定到document上，由dispatchEvent作为统一事件处理函数
// 大部分事件是事件冒泡，有一些是事件捕获，比如scroll/focus/blur发生在事件捕获阶段，如果多个元素绑定同一事件，在document上只会绑定一次
// 事件触发：执行dispatchEvent函数，创建一个合成事件源对象，保存了事件的信息，并传递给真正的事件处理函数，
// 声明事件执行队列，从事件源开始逐渐向上，冒泡事件则push,捕获事件则unshift
// 最后将事件妨行队列保存到事件对象上，依次取出事件队列上的事件执行，模拟出冒泡与捕获
// 事件池：每次用的事件源对象，在事件函数执行之后，事件源对象释放到事件池中；每次不必创建新的对象，从池中取出一个事件源对象有进行复用
// 事件处理函数执行完后，再放到事件池中并清空属性

// lazy实现
// https://juejin.cn/post/6844904191853494280

// suspense实现
// https://juejin.cn/post/7145450651383201822
  
// eval / new Function / with
// eval能够影响当前作用域及所有的父作用域的变量
// new Function 它是运行在一个独立的function内， 并且他的父作用域是window而不是当前作用域

// with
function foo(obj){
  with(obj){
    a=2;
  }
}
var o1={
  a:3
}
var o2={
  b:3
}
foo(o1);
console.log(o1.a)  //2
foo(o2);
console.log(o2.a)  //undefined 对o2对象执行时，o2并没有a属性，因此不会创建这个属性，o2.a保持undefined。
console.log(a)  //2   a被泄露到了全局作用域上了！
  

// vue-cli插件机制

// rem

// generator
// Generator实现的核心在于上下文的保存，函数并没有真的被挂起，每一次yield，其实都执行了一遍传入的生成器函数，
// 只是在这个过程中间用了一个context对象储存上下文，使得每次执行生成器函数的时候，都可以从上一个执行结果开始执行，看起来就像函数被挂起了一样
class Context {
  constructor() {
    this.prev = 0
    this.next = 0
    this.done = false
  }
  stop() {
    this.done = true
  }
}

function $gen(context) {
  // while (true) {
    switch (context.prev = context.next) {
      case 0:
        context.next = 2
        return 'result 1'
      case 2:
        context.next = 4
        return 'result 2'
      case 4:
        context.next = 6
        return 'result 3'
        break
      default:
        context.stop()
        return undefined
    }
  // }
}

const gen = function () {
  const context = new Context()
  return {
    next() {
      return {
        value: $gen(context),
        done: context.done
      }
    }
  }
}

const g = gen()
console.log(g.next())
console.log(g.next())
console.log(g.next())

// react Error Boundary
// ErrorBoundary可以捕获子孙组件中React工作流程内的错误。
// 工作流包括两部分：
// 1. render阶段：即组件render,diff算法发生的阶段
// 2. commit阶段，即渲染dom/componentDidMount/Update阶段
// 事件回调中的错误无法被捕获，是因为事件回调并不属于react工作流
// 借助了componentDidCatch和getDerivedStateFromError
// getDerivedStateFromError方法被约定为渲染备用UI
// componentDidCatch方法被约定为捕获打印错误信息

// JSX是如何一步步变成DOM的：JSX 会被编译为 React.createElement()， React.createElement() 将返回一个叫作“React Element”的 JS 对象。
// jsx 通过babel 转换成React.createElement的调用, createElement对数据进行格式化 ，
// 然后在调用ReactElement变成ELement对象，也就是虚拟DOM节点, 最后在通过ReactDOM.render()映射到真实的DOM元素中。

// 前端埋点监控
// 要做哪些方面的埋点：
// 1. 用户行为监控：PV/UV/用户点击操作
// 2. 页面性能监控：加载时间/白屏时间
// 3. 错误报警监控：
// SDK的设计：
// 1. SDK是一个类，它的使用是实例化后挂载到项目的window下，并传入id参数
// 2. 数据发送采用img.src
// 3. 自定义事件，处理pv/uv
// 4. 错误监控，js原生错误采用window.onerror和unhandledrejection/ vue有react有相应的处理机制
class StatisticSDK {
  constructor(productID){
    this.productID = productID;
  }
  // 数据发送
  send( baseURL, query={}){
    query.productID = this.productID;
      let queryStr = Object.entries(query).map(([key, value]) => `${key}=${value}`).join('&')
      let img = new Image();
      img.src = `${baseURL}?${queryStr}`
  }

  // 自定义事件
  event(key, val={}) {
    let eventURL = 'http://demo/'
    this.send(eventURL,{event:key,...val})
  }

  // pv曝光
  pv() {
    this.event('pv')
  }

  initPerformance(){
    let performanceURL = 'http://performance/'
    this.send(performanceURL,performance.timing)
  }
}

// Vue子组件的崩溃为什么不影响父组件的渲染
// Vue组件的渲染是通过虚拟DOM来实现的，当子组件出现错误导致崩溃时，vue的渲染机制会捕获这个错误，并通过错误处理函数来处理，而不是直接中断父组件的渲染流程
// 具体来说当当vue发现子组件渲染出错时，会在虚拟DOM中标注这个组件，同时将其对应的vnode标记为dirty,表示需要重新渲染
// 并忽略子组件的错误，等子组件的问题解决之后，父组件再次渲染，将子组件状态更新到视图上
// Vue2.x版本并没有像React ErrorBoundary那样专门的API来实现错误处理，而是通过errorCaptured来实现
// 当组件出现错误时会调用就近的errorCaptured钩子来捕获错误

// 在React中，当子组件发生错误时，如果没有ErrorBoundary进行捕获，这个错误会一直向上冒泡直到最近的ErrorBoundary，如果没有任何的错误边界捕获，会导致整个应用崩掉
// 子组组渲染结果会作为父组件的一部分渲染，当子组件崩溃时返回的渲染结果不再是有效的react组件，无法被父组件正常渲染

  
// import() 原理
function import(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script")
    const tempGlobal = "__tempModuleLoadingVariable" + Math.random().toString(32).substring(2)
    script.type = "module"
    script.textContent = `import * as m from ${url}; window.${tempGlobal} = m;`

    script.onload = () => {
      resolve(window[tempGlobal]);
      delete window[tempGlobal];
      script.remove();
    };

    script.onerror = () => {
      reject(new Error("Failed to load module script with URL " + url));
      delete window[tempGlobal];
      script.remove();
    };

    document.documentElement.appendChild(script);
  });
}

// React 懒加载原理
// 简单来说，React利用 React.lazy与import()实现了渲染时的动态加载 ，并利用Suspense来处理异步加载资源时页面应该如何显示的问题。

// vue 和 react 框架对比
// 相同点：
// 1. 都提倡组件化
// 2. 都采用vdom更新视图
// 3. 都采用了diff算法
// 3. 都实现了数据驱动视图
// 4. 都使用了router库实现url到组件的映射
// 5. 都有状态管理
// 不同点：
// 1. react推荐使用jsx，vue使用template单文件格式
// 2. react的render需要自顶向下做diff，而vue精确渲染，会跟踪每一个组件的依赖，不需要渲染整个组件树
// 3. diff算法不一样，vue采用双指针的方法进行对比，react由于没有反向链表，所以不能双指针，需要两次遍历对比

class _LazyMan {
  constructor(name) {
    this.name = name
    this.queue = []
    this.sayName(name)
    Promise.resolve().then(() => {
      let sequence = Promise.resolve()
      this.queue.forEach(item => {
        sequence = sequence.then(item)
      })
    })
  }

  sayName(name) {
    this.queue.push(() => {
      console.log(`Hi! this is ${name}!`)
    })
    return this
  }

  eat(meal) {
    this.queue.push(() => {
      console.log(`eat ${meal}`)
    })
    return this
  }

  _holdOn(time) {
    return () => new Promise(resolve => {
      setTimeout(() => {
        console.log(`Wake up after ${time} second`)
        resolve()
      }, time * 1000)
    })
  }

  sleep(time) {
    this.queue.push(this._holdOn(time))
    return this
  }

  sleepFirst(time) {
    this.queue.unshift(this._holdOn(time))
    return this
  }
}
const LazyMan = (name) => new _LazyMan(name);
LazyMan('Hank').sleepFirst(2).eat('dinner').sleep(3).eat('supper');

// 实现expect(3).toBe(3) expect(3).not.toBe(4)
function expect(actualVal) {
  function toBe(expectVal) {
    return actualVal === expectVal
  }

  function not() {
    return {
      toBe(expectNum) {
        return expectNum !== actualVal
      }
    }
  }

  return {
    not: not(),
    toBe
  }
}
expect(3).toBe(3)
expect(3).toBe(4)
expect(3).not.toBe(4)
expect(3).not.toBe(3)

// 面向对象设计的5大重要原则： SOLID
// S：单一职责原则
// O: 开放封闭原则
// L：里氏替换原则
// I：接口隔离原则
// D：依赖倒置原则









  


  
  
  




  

  




















 





