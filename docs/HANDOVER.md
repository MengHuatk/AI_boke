# 交接文档 · Glass Notes 个人博客

> 面向接手这个项目的开发者。读完这一份就能独立继续开发。
> 最后更新：2026-10-16

---

## 1. 一句话现状

毛玻璃风格个人博客的**初版**。**只完成了首页**，但前后端骨架、构建链路、
设计系统都已打通并验证可跑。首页由 4 个玻璃盒子组成，所有文案与数据均来自
后端接口，代码里没有硬编码的内容。

初版刻意**没有**做的事：文章详情页、文章列表页、标签页、关于页、搜索、
评论、RSS、后台管理、登录、数据库、部署配置。这些是留给后续的扩展位。

---

## 2. 技术栈

| 层 | 选型 | 版本 |
| --- | --- | --- |
| 前端框架 | Next.js（App Router） | 16.4.2 |
| UI 库 | React | 19.3.0 |
| 样式 | Tailwind CSS（CSS-first 配置） | 4.x |
| 语言 | TypeScript（strict） | 5.x |
| 图标 | 内联 SVG，无图标库 | — |
| 后端 | FastAPI + Uvicorn | ≥ 0.115 |
| 数据校验 | Pydantic v2 + pydantic-settings | ≥ 2.9 |
| 内容源（初版） | JSON 文件 | — |

**为什么没有装 UI 组件库**：毛玻璃效果的成败在于模糊半径、描边高光、投影层次
这三层的精确配合，现成组件库的玻璃变体通常不满足需求，覆盖它的成本高于自己写。
所以视觉层是自己实现的，封装在 `globals.css` 的 `@utility` 里。

**为什么没有装图标库**：全站只用到 12 个图标，内联 SVG 换掉了约 40KB 的依赖。
需要新图标时往 `Icon.tsx` 的 `ICON_PATHS` 里加一条即可。

---

## 3. 目录结构

```
AI_project/
├── frontend/                        Next.js 应用
│   ├── src/
│   │   ├── app/                     —— 路由层（App Router）
│   │   │   ├── layout.tsx           根布局：字体、全局样式、套 SiteShell
│   │   │   ├── page.tsx             首页：取数据 + 拼区块
│   │   │   ├── not-found.tsx        404 页（也是未建路由的落地页）
│   │   │   └── globals.css          ★ 设计令牌 + 毛玻璃配方 + 动效时长
│   │   ├── components/
│   │   │   ├── ui/                  基础零件：GlassCard / GlassButton / TagChip …
│   │   │   ├── layout/              外壳：背景轮播 / 背景光斑 / 导航 / 页脚 / SiteShell
│   │   │   ├── home/                首页专属区块
│   │   │   └── post/                文章相关组件（供未来列表页复用）
│   │   └── lib/
│   │       ├── api.ts               ★ 所有后端调用的唯一出口
│   │       ├── types.ts             类型定义（镜像后端 schemas.py）
│   │       ├── config.ts            运行期配置（读环境变量）
│   │       ├── fallback.ts          后端不可用时的示例数据
│   │       └── format.ts            日期 / 数字 / 类名工具
│   ├── public/
│   │   ├── avatar.svg               头像占位图
│   │   ├── background.sample.svg    背景图示例（默认不启用，见 §7.2）
│   │   └── images/backgrounds/      背景轮播素材目录（真实照片放这里）
│   ├── next.config.ts               已关闭实验性的 cacheComponents（见 §8）
│   └── .env.example                 前端环境变量样例
│
├── backend/                         FastAPI 应用
│   ├── app/
│   │   ├── main.py                  应用工厂：CORS、路由挂载、/health
│   │   ├── core/config.py           ★ 集中配置（pydantic-settings）
│   │   ├── models/schemas.py        ★ API 响应模型（Pydantic）
│   │   ├── api/v1/
│   │   │   ├── router.py            v1 路由聚合，新模块在这里挂载
│   │   │   ├── site.py              /site /profile /home
│   │   │   ├── posts.py             /posts /posts/{slug}
│   │   │   └── tags.py              /tags /stats
│   │   ├── repositories/
│   │   │   ├── base.py              ★ 仓储接口（抽象）
│   │   │   ├── json_repository.py   当前实现：读 JSON
│   │   │   └── __init__.py          工厂函数，换数据源改这里
│   │   └── data/                    ★ 博客内容
│   │       ├── site.json            站点标题、导航、社交链接
│   │       ├── profile.json         头像、头衔、简介、技能
│   │       └── posts.json           文章列表（含正文）
│   ├── requirements.txt
│   └── .env.example                 后端环境变量样例
│
├── docs/HANDOVER.md                 本文档
└── README.md                        快速开始
```

★ 标记的是最常改动的文件。

---

## 4. 启动

### 环境要求

- Node.js ≥ 20（开发时用的是 24.16）
- Python ≥ 3.10（开发时用的是 3.10.0）

### 后端

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

- 接口文档：<http://127.0.0.1:8000/docs>
- 健康检查：<http://127.0.0.1:8000/health>

### 前端

```bash
cd frontend
npm install
npm run dev
```

打开 <http://localhost:3000>。

两个服务可以任意顺序启动。**前端先起、后端后起也没问题**：首页会先渲染示例
数据并显示一条开发期提示条，后端可用后刷新（或等 60 秒缓存过期）即切换到真实数据。

---

## 5. 数据是怎么流动的

改动任何内容前，先理解这条链路：

```
backend/app/data/*.json
        ↓  读取 + 校验
JsonContentRepository          (repositories/json_repository.py)
        ↓  返回 Pydantic 模型
FastAPI 路由                   (api/v1/*.py)
        ↓  JSON over HTTP
前端 request<T>()              (lib/api.ts)
        ↓  失败则降级到 fallback.ts
getHomeData() → DataResult<T>  { data, source }
        ↓
app/page.tsx  →  各区块组件  →  GlassCard
```

**关键约定**：

1. **内容只存在一处**。文章正文只在 `posts.json`；标签和统计数字由
   `json_repository.py` 从文章**推导**出来，不需要也不允许手动维护第二份。
2. **前端不做业务计算**。统计数字、标签计数、精选筛选全在后端完成，
   前端只负责渲染。
3. **类型两边镜像**。`lib/types.ts` 的字段名与 `schemas.py` 完全一致
   （都是 snake_case）。改一边必须改另一边。
4. **组件不直接 fetch**。所有网络调用都经过 `lib/api.ts`。

---

## 6. 「不写死」体现在哪四个地方

这是本次搭建的核心要求，具体收口在：

| 收口点 | 文件 | 改它能影响什么 |
| --- | --- | --- |
| **内容数据** | `backend/app/data/*.json` | 站点名、导航项、社交链接、头像、简介、文章、标签 |
| **设计令牌** | `frontend/src/app/globals.css` 的 `@theme` | 配色、圆角、模糊强度、动效时长 |
| **运行期配置** | `.env` / `.env.local`（见两个 `.env.example`） | 后端地址、缓存时长、超时、首页条数、语言、**背景轮播图与遮罩强度** |
| **仓储实现** | `backend/app/repositories/` | 内容从哪来（JSON → 数据库 → CMS） |

组件里**没有**出现：硬编码的导航文案、硬编码的颜色值、硬编码的接口地址、
硬编码的自我介绍、硬编码的统计数字。

---

## 7. 常见改动怎么做

### 7.1 改配色 / 整体质感

只改 `frontend/src/app/globals.css`。

```css
@theme {
  --color-brand-500: oklch(0.63 0.19 275);   /* 主色，改这里全站跟着变 */
  --color-aurora-violet: oklch(0.62 0.25 300); /* 背景光斑色 */
  --radius-glass: 1.25rem;                    /* 玻璃圆角 */
  --blur-glass: 16px;                         /* 玻璃模糊半径 */
}
```

毛玻璃的三层配方在 `@utility glass-panel` / `glass-panel-strong` /
`glass-panel-subtle` / `glass-interactive` 里，**改这四个比改任何组件都有效**。

要整体换成浅色主题，思路是把 `@layer base` 里 `body` 的背景色和
`glass-panel` 的白色透明度反过来，并把 `@theme` 里的 `--color-ink-*` 换掉。
`html` 上的 `color-scheme: dark` 也要同步改。

### 7.2 换背景图 / 背景配色

页面背景由 `frontend/src/components/layout/AuroraBackground.tsx` 渲染，
从下往上四层叠加：

| 层 | 内容 | 由什么控制 |
| --- | --- | --- |
| 1 | 背景图轮播（可选） | `NEXT_PUBLIC_BACKGROUND_IMAGES` + `NEXT_PUBLIC_BACKGROUND_INTERVAL` |
| 2 | 压暗遮罩 | `NEXT_PUBLIC_BACKGROUND_IMAGE_DIM` |
| 3 | 极光光斑 | `AuroraBackground.tsx` 的 `BLOBS` 数组 + `@theme` 的 `--color-aurora-*` |
| 4 | 噪点 + 底部压暗 | 固定，一般不用动 |

第 1 层是 `BackgroundCarousel.tsx`（客户端组件，唯一需要状态的一层），
其余三层留在服务端组件 `AuroraBackground.tsx` 里。

#### 用照片轮播当页面背景

1. 把照片放进 `frontend/public/images/backgrounds/`（该目录下有 `README.md`
   写明尺寸与格式建议），比如 `01.jpg`、`02.jpg`
2. 在 `frontend/.env.local` 里加：

   ```bash
   NEXT_PUBLIC_BACKGROUND_IMAGES=/images/backgrounds/01.jpg,/images/backgrounds/02.jpg
   NEXT_PUBLIC_BACKGROUND_INTERVAL=8      # 每张停留几秒
   NEXT_PUBLIC_BACKGROUND_IMAGE_DIM=0.6   # 照片太亮就调大，玻璃面板上的字会更清楚
   NEXT_PUBLIC_BACKGROUND_IMAGE_BLUR=0    # 想更朦胧就调到 8–20
   ```

3. **重启 `npm run dev`** —— `NEXT_PUBLIC_` 变量是构建期内联的，热更新不会生效

仓库里带了一张示例图 `frontend/public/background.sample.svg`，想先看轮播效果
就把它填两次：`/background.sample.svg,/background.sample.svg`。

#### 轮播是怎么切的

**交叉淡化，不是左右平移**：上一张渐隐、下一张渐显。

实现是「底图 + 顶层」两层，**不是**让所有图一起改 `opacity`：

- 底图（`BackgroundCarousel.tsx` 里第一个 div）恒为不透明，永远是「上一张」
- 顶层（第二个 div）播 `crossfade-in` 关键帧，从 `opacity: 0` 淡到 `1`

为什么不能放任每张图各自淡：切换中点两张都不到全不透明，最底下的
`--color-ink-950` 就会透上来 —— 合成结果是 `t·B + (1−t)·[(1−t)·A + t·底色]`，
`A` 被衰减了两次，于是每换一张图整页会**暗一下再回亮**。底图恒不透明后
合成全程线性，这个坑就不存在。

顶层的 `key={tick}` 让每轮重新挂载、动画从头播；挂载的同一帧里底图换成
上一张，两张接的是同一画面，所以看不到接缝。这也让切换**不依赖
`animationend` 事件** —— 后台标签页被节流时不会卡死。

调参：

| 想改什么 | 改哪里 |
| --- | --- |
| 淡化时长（默认 1.5s） | `globals.css` 的 `@theme` → `--duration-bg-fade` |
| 停留间隔（默认 8s） | `NEXT_PUBLIC_BACKGROUND_INTERVAL` |
| 淡化曲线 | `BackgroundCarousel.tsx` 里 `animation` 那行的 `ease-in-out` |

> ⚠️ **停留间隔要大于淡化时长**，否则上一轮还没淡完就被下一轮打断，
> 视觉上会退化成一次硬切。

刻意不做位移：这一层相对视口固定不动，图片一移动整页背景都会跟着「晃」，
毛玻璃面板的稳定感就没了。

压暗遮罩**不跟着图一起淡化** —— 它是轮播层的兄弟节点、透明度恒定。
若让它跟着图淡，每次切图整页明暗都会闪一下。

登记 1 张图 = 静态背景（不启动计时器）；一张都不登记 = 回落到纯极光渐变，不报错。

只想要照片、不要极光光斑，再加一行 `NEXT_PUBLIC_BACKGROUND_AURORA=false`。
玻璃质感会弱一些 —— 可透的内容变单一了，面板就没那么「浮」。

> **不要跳过压暗遮罩。** 照片的亮度通常远高于深色界面，不压暗的话
> 玻璃面板上的浅色文字会直接糊掉。这是加背景图最常见的翻车点。

#### 只换极光配色

改 `globals.css` 的 `@theme`：

```css
--color-aurora-violet: oklch(0.62 0.25 300);
--color-aurora-cyan:   oklch(0.80 0.13 210);
--color-aurora-rose:   oklch(0.68 0.21 12);
--color-aurora-amber:  oklch(0.83 0.14 78);
```

想调光斑的位置、大小、数量，改 `AuroraBackground.tsx` 里的 `BLOBS` 数组 ——
数组有几项就有几个光斑，每项的 `opacity` 和 `animation` 也可以单独调。

#### 整页兜底色

最底下是 `globals.css` 里的 `--color-ink-950`，背景图和极光都盖在它上面。
换浅色主题时这个要跟 `body` 的背景色一起改。

> ⚠️ 背景容器是 `position: fixed`，所以背景图**不随页面滚动**。
> 这是有意的：内容在固定的色彩上滚动，毛玻璃的「透视」感才成立。
> 想改成跟随滚动，去掉 `AuroraBackground.tsx` 根节点的 `fixed` 即可，
> 但滚动时玻璃面板会跟着背景一起动，效果会打折。

### 7.3 加一个首页盒子

1. 在 `frontend/src/components/home/` 新建组件，用 `GlassCard` 当容器：

   ```tsx
   import { GlassCard } from "@/components/ui/GlassCard";
   import { SectionHeading } from "@/components/ui/SectionHeading";

   export function MySection({ items }: { items: string[] }) {
     return (
       <GlassCard as="section" padding="lg">
         <SectionHeading eyebrow="Eyebrow" title="标题" icon="sparkle" />
         <ul>{items.map((i) => <li key={i}>{i}</li>)}</ul>
       </GlassCard>
     );
   }
   ```

2. 在 `app/page.tsx` 里 import 并插进左栏或右栏：

   ```tsx
   <div className="flex flex-col gap-5">
     <HeroSection … />
     <MySection items={…} />
     <FeaturedPosts … />
   </div>
   ```

页面的栅格是 `lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]`，
窄屏自动堆叠成单栏。

### 7.4 加一个新页面（路由）

在 `frontend/src/app/` 下建目录即可，**不需要改任何外壳代码** ——
布局、背景光斑、导航、页脚都由 `layout.tsx` → `SiteShell` 自动套上。

```tsx
// src/app/posts/page.tsx
import { getHomeData } from "@/lib/api";

export const metadata = { title: "全部文章" };   // 自动拼成 "全部文章 · Glass Notes"

export default async function PostsPage() {
  const { data } = await getHomeData();
  return <div>{/* 用 GlassCard 拼内容 */}</div>;
}
```

动态路由同理：`src/app/posts/[slug]/page.tsx`，参数类型用全局的
`PageProps<"/posts/[slug]">`（Next 16 的 typed routes 自动生成）。

加完页面后，记得把入口加到 `backend/app/data/site.json` 的 `nav` 数组里 ——
导航栏是数据驱动的，不需要改 `Navbar.tsx`。

> 初始状态下，导航里的「文章 / 标签 / 关于」都会落到 `not-found.tsx`
> 那个「页面还在装修」的玻璃卡片上。建好对应路由后它们自然生效。

### 7.5 加一个 API 接口

后端三步：

```python
# 1. models/schemas.py —— 定义响应模型
class ArchiveItem(BaseModel):
    year: int
    count: int

# 2. repositories/base.py —— 接口加抽象方法，json_repository.py 里实现
# 3. api/v1/ 下新建或复用路由文件，挂到 router.py
@router.get("/archive", response_model=list[ArchiveItem])
def list_archive(repo: ContentRepository = Depends(get_repository)):
    return repo.list_archive()
```

前端两步：

```ts
// 1. lib/types.ts —— 镜像类型
export interface ArchiveItem { year: number; count: number }

// 2. lib/api.ts —— 加 fetch 函数 + 带降级的读取函数
export function fetchArchive() {
  return request<ArchiveItem[]>("/archive");
}
```

路由层永远依赖 `ContentRepository` 抽象，不直接碰文件或数据库。

### 7.6 加一篇文章

编辑 `backend/app/data/posts.json`，追加一个对象：

```json
{
  "id": "p-006",
  "slug": "your-post-slug",
  "title": "标题",
  "excerpt": "列表页展示的摘要",
  "cover": null,
  "tags": ["标签A", "标签B"],
  "published_at": "2026-10-16",
  "reading_minutes": 6,
  "featured": false,
  "body": "正文。\n\n用 \\n 分段。"
}
```

- `slug` 全局唯一，是详情页的 URL 片段
- `featured: true` 才会出现在首页精选（首页取前 3 条，条数由
  `NEXT_PUBLIC_HOME_FEATURED_LIMIT` 控制）
- `tags` 里出现的新标签会**自动**计入标签云和统计，不需要注册
- 列表按 `published_at` 倒序，仓储层已排好，不用手动维护顺序

### 7.7 改导航项 / 社交链接 / 站点名

全部在 `backend/app/data/site.json`。

社交链接的 `icon` 字段取值必须是 `Icon.tsx` 里 `ICON_PATHS` 的 key
（`github` / `mail` / `rss` / `link` / `arrowRight` / `calendar` / `clock` /
`pin` / `hash` / `sparkle` / `document` / `layers` / `pen`）。
填了未知值不会报错，会回退到 `link` 图标。

### 7.8 加一个图标

编辑 `frontend/src/components/ui/Icon.tsx`，往 `ICON_PATHS` 加一条
24×24 viewBox 的 path 数据即可。

### 7.9 换成数据库

这是分层设计的主要目的。步骤：

1. 新建 `backend/app/repositories/sql_repository.py`，实现
   `ContentRepository` 的全部抽象方法（签名照抄 `base.py`）。
2. 在 `repositories/__init__.py` 的 `get_repository()` 里按配置返回新实现。
3. **路由层、API 契约、前端全部零改动。**

### 7.10 给导航加「当前页高亮」

`Navbar.tsx` 目前是服务端组件，因此没有高亮态。要做的话：

1. 文件顶部加 `"use client"`；
2. 引入 `usePathname()`，与 `item.href` 比对后切 class。

注意 `SiteShell`/`Navbar` 的数据来自服务端，改成客户端组件时要通过 props
把 `site` 传进去（现结构已经支持，`site` 本来就是 prop）。

---

## 8. 已知限制与设计取舍

### 8.1 主动关闭了 `cacheComponents`

Next 16 脚手架默认开启实验性的 `cacheComponents`（严格缓存组件模型）。
**初版把它关掉了**，原因：开启后每个异步数据访问都必须包 Suspense 或
加 `"use cache"` 指令，对这个规模的项目心智负担大于收益。

需要重新开启时，取消 `next.config.ts` 里的注释，并在 `lib/api.ts` 的
fetch 函数上加 `"use cache"` + `cacheLife`。

### 8.2 数据缓存是 60 秒的 ISR

`lib/api.ts` 里的 fetch 带 `next: { revalidate: 60 }`。

**这意味着后端数据的变更最长 60 秒后才在前端生效**，改 JSON 后刷新页面
看不到变化是正常的。调参用 `NEXT_PUBLIC_API_REVALIDATE`，设成 `0`
可以每次都取最新的。

> 缓存落在 `frontend/.next/cache`，**跨 dev server 重启依然有效**。
> 调试时如果怀疑是缓存问题，删掉 `frontend/.next` 目录再重启。

### 8.3 降级是静默的（仅开发期有提示）

后端不可用时不会报错，而是返回 `fallback.ts` 的示例数据，页面照常渲染。
开发环境下页面顶部会有一条提示条（`DevNotice`），生产环境不显示。

**风险**：生产环境如果后端挂掉，访客看到的是示例数据而不是错误页。
上线前建议改成明确的错误提示，或接监控告警。

### 8.4 首页在构建时被预渲染

`npm run build` 会把首页静态化（ISR，1 分钟）。构建时如果后端没起，
静态产物里就是示例数据，需要等一次 revalidate 才会变成真实数据。

同理，`generateMetadata()` 也会去取后端站点配置。CI 上做生产构建时
**要先起后端**，否则会打进示例的站点标题。

### 8.5 未使用的文件

- `frontend/AGENTS.md` 由 `next dev` 自动生成和维护，不需要手动改，
  删了也会重新生成。
- `frontend/src/app/favicon.ico` 还是脚手架默认的，没有换成自己的图标。
- 仓库根目录的 `新建文本文档.txt` 是原有的空文件，未做处理。

### 8.6 未验证的部分

- **只在 Windows + Chromium 环境下验证过**。Safari 对 `backdrop-filter`
  需要 `-webkit-` 前缀（CSS 里已写），但真机未测。
- **移动端布局未在真机验证**。导航栏在 `md` 断点以下会隐藏文字导航项，
  只留站名和社交图标 —— 这是有意的简化，不是 bug。
- 未做过性能、无障碍（axe）和 SEO 的专项审计。

---

## 9. 本次已验证的内容

搭完之后实际跑过、确认可用的：

- [x] `npm run build` 通过，TypeScript strict 无错误
- [x] Tailwind 4 的 `@theme` 令牌与 `@utility` 玻璃配方正确编译进产物
- [x] 后端 `/health`、`/api/v1/stats`、`/api/v1/home` 返回正确 JSON
- [x] 首页在浏览器请求下 200，渲染出真实接口数据（标题、文章、统计 1.2k 字）
- [x] **后端关闭时首页仍 200**，渲染示例数据并显示开发期提示条
- [x] 后端恢复后，首页自动切回真实数据，提示条消失
- [x] `prefers-reduced-motion` 媒体查询已进入产物（动效可被系统设置关闭）
- [x] `NEXT_PUBLIC_BACKGROUND_AURORA=false` 能单独关掉极光光斑
      （光斑数 0，背景图与噪点保留）

> ⚠️ **待验证（背景轮播）**：背景层已从「单张静态图」改为「交叉淡化轮播」，
> 见 §7.2。上面那条背景图链路是在**旧实现**上验证的，已不适用。
> 轮播链路 —— 多图登记、交叉淡化切换、计时器循环、单图退化成静态、
> 零图退化成纯极光 —— **尚未实机验证**，接手后请先起 dev server 确认。

---

## 10. 接手后的建议顺序

1. 起前后端，确认首页能正常渲染（见 §4）
2. 通读 `frontend/src/app/page.tsx` 和 `globals.css` —— 这两个文件决定了
   页面结构和视觉基调
3. 建 `src/app/posts/page.tsx` 和 `src/app/posts/[slug]/page.tsx`，
   复用已有的 `PostCard`（它已经在 `components/post/` 下，就是为了这一步）
4. 建 `src/app/tags/[tag]/page.tsx`，标签云已经指向这个路由了
5. 补文章详情页的正文渲染 —— 目前 `body` 字段是纯文本，直接用 `\n`
   分段即可；要上 Markdown 的话建议在**后端**转成 HTML 再返回，前端不引
   Markdown 解析库
6. 换 favicon，补 `robots.txt` 与 sitemap
7. 做部署：前端可上 Vercel，后端任意容器平台；上线前务必处理 §8.3
8. 完成当前任务后重写此交接文档，方便后续交接工作

---

## 11. 联系与背景

- 项目搭建日期：2026-10-16
- 示例内容（`林澈` / `Glass Notes` / 五篇文章）均为占位数据，**上线前需全部替换**
- 头像 `frontend/public/avatar.svg` 同样是占位图