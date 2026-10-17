# 首页萤火虫光点层 · 执行方案

> 状态：待实施。本文档只描述改动，不含任何已落地的代码。
> 适用对象：按本方案实施改动的 AI 或开发者。所有数值均已定稿，不需要再自行判断。

---

## 1. 需求复述

在首页视口新增一层装饰性光点（萤火虫）：

- 背景图片之上、其余所有组件之下；
- 随机数量（10–15 只）、随机位置、随机大小（2–4px）；
- 白色实心圆 + `#94FF94` 绿色外发光；
- 在视口内上下左右无规律漂移；
- 单只呈现「由小到大出现 → 亮着飘一段时间 → 由大到小消失」，然后不断循环补位，整体密度恒定。

## 2. 已确认的决策

| 决策项 | 结论 |
| --- | --- |
| 实现路线 | 纯 CSS 关键帧 + 内联 CSS 变量，与 `GrassField.tsx` 同一套路。不引动画库、不上 canvas、不跑 `requestAnimationFrame` |
| 「持续 4–6s」的含义 | 指满 size 的**保持期**。生长与收缩各约 1s |
| 层级 | `z-[-4]`：草地层（`z-[-5]`）之上，正文（默认 z-index）之下 |
| 显示范围 | 仅桌面端，`hidden lg:block`，与草地一致 |

## 3. 现状层叠参考（勿改动，仅供定位）

```
-z-10  AuroraBackground（含 BackgroundCarousel）  ← 背景图
-z-5   GrassField                                  ← 草地
-z-4   FireflyShadow                               ← 本次新增
auto   Navbar(sticky z-50) / main 内容 / Footer     ← 正文
```

三者都是 `position: fixed` + `pointer-events-none`，互不影响交互。

## 4. 影响范围

| 文件 | 动作 |
| --- | --- |
| `frontend/src/components/home/FireflyShadow.tsx` | 新建 |
| `frontend/src/app/globals.css` | 追加 2 个 `@keyframes`（放在 `grass-sway` 之后，同一个「关键帧」小节内） |
| `frontend/src/app/page.tsx` | import 并在 `<GrassField />` 之后插一行 `<FireflyShadow />` |

除此之外不动任何文件。**不要**改 `SiteShell.tsx`、`AuroraBackground.tsx`、`GrassField.tsx`。

---

## 5. 结构设计：一只萤火虫 = 两层 span

两层各司其职、互不打架——外层只负责平移，内层只负责缩放与透明度，因此两组动画的 `transform` 不会互相覆盖：

```
<span  外层：absolute 定位 + firefly-wander（translate3d）
  └ <span  内层：size / 圆形 / 白色背景 / 绿色 box-shadow + firefly-life（scale + opacity）
```

- 定位用百分比 `left/top`，**因此不需要监听 resize**；
- 中心对齐用负 margin（`-size/2`），不用 `translate(-50%,-50%)`，避免占用外层的 `transform`；
- 数量恒定靠 `animation-iteration-count: infinite` + 负延迟错相位实现，**不需要任何 JS 定时器**。

## 6. 随机参数表（照抄，勿改）

| 字段 | 含义 | 取值范围 |
| --- | --- | --- |
| `count` | 只数 | `10 + Math.floor(Math.random() * 6)` → 10–15 |
| `x` / `y` | 位置，视口百分比 | `2–98` / `6–94`（留出余量，光晕不被 `overflow-hidden` 整颗裁掉） |
| `size` | 直径 px | `2–4` |
| `peak` | 峰值不透明度 | `0.55–0.95`（纯白点在背景图上不宜满 alpha） |
| `life` | 生灭总时长 s | `6–8` |
| `wander` | 漂移一轮时长 s | `7–13` |
| `lifeDelay` | 生灭相位 s | `-random(0, 8)`，即 `-random(0, life 上界)` |
| `wanderDelay` | 漂移相位 s | `-random(0, 13)`，同上取上界而非自身时长 |
| `w1x…w3y` | 3 个漂移锚点位移 px | 幅度 `25–90`，正负号各 50% 随机 |

**延迟一律取负、且以上界为随机范围**：负延迟让动画从周期中段开始，避免开场全场同时从 0 长出来；用固定上界而不是各自的随机时长，才能保证任一相位都可能被抽中。这两个做法 `GrassField.tsx` 已经在用。

### 关于「保持期 4–6s」的算术（重要，勿"修正"）

CSS 关键帧的百分比位置不接受 `var()`／`calc()`，所以三段时长只能写死比例：

```
firefly-life:  0% → 15%  生长   ｜  15% → 85%  保持  ｜  85% → 100%  收缩
```

配合 `life ∈ [6, 8]s`：

- 生长 = 15% × life = **0.9–1.2s**
- 保持 = 70% × life = **4.2–5.6s** ✅ 落在需求要求的 4–6s 内
- 收缩 = 15% × life = **0.9–1.2s**

即保持期随机但略窄于 4–6s，这是刻意的取舍：**每只的保持时长仍是随机的、且始终在需求区间内**，换来的是零 JS 的三段式生命周期。若要求严格铺满 4–6s，把 `life` 范围改为 `5.75–8.55`s（保持期 4.03–5.99s），其余不动——但默认按 `6–8` 实施，整数好读。

## 7. `FireflyShadow.tsx` 实现要点

严格套用 `GrassField.tsx` 的既有骨架，逐条对应：

1. 首行 `"use client";`。
2. 顶部块注释（中文）说明：层级用途与 `z-[-4]` 的理由、两层 span 的分工、为什么保持期是 4.2–5.6s、为什么走 `useSyncExternalStore`。参照 `GrassField.tsx` 的注释密度与语气——写"为什么这么选"，不复述代码在做什么。
3. `interface Firefly`：扁平字段，即第 6 节表格的 13 个键（`x, y, size, peak, life, lifeDelay, wander, wanderDelay, w1x, w1y, w2x, w2y, w3x, w3y`）。每个字段一行 `/** */` 注释，仿 `Blade`。
4. `const RANGE = { ... } as const`：集中所有上下界，命名沿用 `xxxMin` / `xxxMax`。**不在 JSX 里出现魔法数字。**
5. 模块内私有辅助（不导出、不建 `lib/` 工具）：
   ```ts
   function randomBetween(min: number, max: number): number {
     return min + Math.random() * (max - min);
   }

   /** 幅度落在 [min, max]，方向随机 */
   function signedBetween(min: number, max: number): number {
     const magnitude = randomBetween(min, max);
     return Math.random() < 0.5 ? -magnitude : magnitude;
   }
   ```
6. `generateFireflies(): Firefly[]`：按第 6 节表格生成一屏。`count` 用第 6 节的表达式。
7. 水合安全快照三件套，与 `GrassField.tsx` 一模一样（模块级 `clientSnapshot` 缓存 + `subscribe` 返回空清理 + `getServerSnapshot` 返回 `null`）：
   ```ts
   let clientSnapshot: Firefly[] | null = null;
   function subscribe(): () => void { return () => {}; }
   function getClientSnapshot(): Firefly[] { clientSnapshot ??= generateFireflies(); return clientSnapshot; }
   function getServerSnapshot(): Firefly[] | null { return null; }
   ```
8. 组件体：`const flies = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);` → `if (flies === null) return null;` → 渲染。具名导出 `export function FireflyShadow()`（**不是 default**）。
9. 容器：
   ```tsx
   <div
     aria-hidden="true"
     className="pointer-events-none fixed inset-0 z-[-4] hidden overflow-hidden lg:block"
   >
   ```
10. 逐只渲染（外层）：
    ```tsx
    <span
      key={index}
      style={{
        position: "absolute",
        left: `${fly.x}%`,
        top: `${fly.y}%`,
        width: `${fly.size}px`,
        height: `${fly.size}px`,
        marginLeft: `${-fly.size / 2}px`,
        marginTop: `${-fly.size / 2}px`,
        animation: `firefly-wander ${fly.wander}s ease-in-out ${fly.wanderDelay}s infinite`,
        "--w1x": `${fly.w1x}px`, "--w1y": `${fly.w1y}px`,
        "--w2x": `${fly.w2x}px`, "--w2y": `${fly.w2y}px`,
        "--w3x": `${fly.w3x}px`, "--w3y": `${fly.w3y}px`,
      } as CSSProperties}
    >
    ```
11. 内层（可见的那个点）：
    ```tsx
    <span
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        borderRadius: "9999px",
        background: "rgb(255 255 255)",
        boxShadow: `0 0 ${fly.size * 2}px ${fly.size * 0.75}px rgb(148 255 148 / 0.8), ` +
                   `0 0 ${fly.size * 5}px ${fly.size * 2}px rgb(148 255 148 / 0.35)`,
        animation: `firefly-life ${fly.life}s ease-in-out ${fly.lifeDelay}s infinite`,
        "--peak": fly.peak,
      } as CSSProperties}
    />
    ```
    双层 `box-shadow`（近实远虚）模拟光晕，尺寸随 `size` 等比放大；`#94FF94` = `rgb(148 255 148)`。内层被外层 `scale` 缩放时阴影一并缩放，正好实现「光晕随点一起长大」。
12. `key={index}`：列表挂载后不再变化，沿用 `GrassField.tsx` 的做法。

## 8. `globals.css` 追加的关键帧

```css
/* 首页萤火虫层：外层 translate 漂移、内层 scale + opacity 生灭，
   两只动画周期互不成整数比，叠加后看不出重复。
   生灭三段比例写死（15% / 70% / 15%），因为关键帧的位置不接受 var()；
   配 6–8s 总时长即「生长 0.9–1.2s、保持 4.2–5.6s、收缩 0.9–1.2s」。
   --peak 与 --w*N 由 FireflyShadow.tsx 逐只注入。
   消费方是 FireflyShadow.tsx */
@keyframes firefly-life {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  15%,
  85% {
    transform: scale(1);
    opacity: var(--peak, 0.9);
  }
  100% {
    transform: scale(0);
    opacity: 0;
  }
}

/* 漂移：四个锚点首尾都回到原点，保证 0% 与 100% 重合，无限循环不跳变。
   ease-in-out 让每段末速度归零，停在锚点上略有迟疑，像虫子而不像滑动的贴图 */
@keyframes firefly-wander {
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }
  25% {
    transform: translate3d(var(--w1x, 0px), var(--w1y, 0px), 0);
  }
  50% {
    transform: translate3d(var(--w2x, 0px), var(--w2y, 0px), 0);
  }
  75% {
    transform: translate3d(var(--w3x, 0px), var(--w3y, 0px), 0);
  }
}
```

用 `transform: scale()` 而非独立的 `scale` 属性，跟同文件里 `drift` / `grass-sway` / `fade-up` 保持一致；漂移用 `translate3d` 同理。

## 9. `page.tsx` 接入

```tsx
import { FireflyShadow } from "@/components/home/FireflyShadow";
```

```tsx
      {/* 视口底部的草坪装饰层，垫在所有内容之下，仅电脑端显示 */}
      <GrassField />

      {/* 视空中的萤火虫光点层，垫在草地之上、所有内容之下，仅电脑端显示 */}
      <FireflyShadow />
```

顺序在 JSX 上不具意义（都是 `fixed` + 显式 z-index），并列放置是为了读代码时一眼看清装饰层的构成。

---

## 10. 非目标（明确不做，别顺手加）

- 不做 `prefers-reduced-motion` 分支——现有草地、极光、轮播都没做，加了就是分叉出第二套约定；
- 不做 resize 重算——位置是视口百分比，天然自适应；
- 不做鼠标趋光／避让、不做 canvas、不引动画库、不加 JS 定时器或 rAF；
- 不做「一批同生同灭」——需求要的密度恒定，靠每只独立循环实现；
- 不做特性开关、不做移动端降级、不给颜色新增 `@theme` 令牌（沿用 `GrassField.tsx` 在内联样式里写字面量 `rgb(...)` 的做法）；
- 不写测试、不启 `dev` 服务器、不跑构建（测试与运行验证归用户）。

## 11. 交付前静态自检（只读代码，不运行）

- [ ] `FireflyShadow.tsx` 首行是 `"use client";`，导出为具名 `FireflyShadow`；
- [ ] 无任何 `setTimeout` / `setInterval` / `requestAnimationFrame` / `useState` / `useEffect`；
- [ ] 随机只在 `getClientSnapshot` 路径上发生，`getServerSnapshot` 返回 `null`——不存在水合不匹配；
- [ ] 所有含 CSS 自定义属性的 style 对象都带 `as CSSProperties`；
- [ ] 容器 class 恰为 `pointer-events-none fixed inset-0 z-[-4] hidden overflow-hidden lg:block`；
- [ ] 关键帧名 `firefly-life` / `firefly-wander` 在 CSS 与组件里逐字一致，且未被 Tailwind 的 `--animate-*` 命名占用；
- [ ] 内外两层 span 各自只碰一个 `transform`（外 translate、内 scale），无覆盖冲突；
- [ ] `RANGE` 覆盖全部数值，JSX 与 style 对象里没有裸数字（`size * 2` 这类由 size 推导的除外）；
- [ ] `w*_x`/`w*_y` 的 CSS 变量名与关键帧里 `--w1x`…`--w3y` 一一对应，无错位；
- [ ] `npx tsc --noEmit` 与 `npm run lint` 由用户执行；实施方只需保证类型标注齐全（`Firefly` 接口、返回类型、`as CSSProperties`）。

## 12. 交付后请用户手验的项

1. 刷新首页：视口内出现 10–15 个白心绿晕小点，缓慢乱向漂移；
2. 单只点亮约 4–6s 后收小消失，且**不会出现全场同时熄灭**（相位错开）；
3. 滚动页面时光点不跟随滚动（`fixed`），且不遮挡任何点击（`pointer-events-none`）；
4. 窗口窄于 1024px 时整层消失（与草地同断点）；
5. 层叠正确：光点被正文卡片挡住、盖在草叶之上；
6. 数量在**页面刷新时**才重新随机（模块级快照缓存，与草地行为一致；Fast Refresh 不重置它，需要硬刷新）。

任何一条不符，回到第 6/7 节核对数值与结构，不要另起一套实现。

---

## 13. 后续清理项（本次不做，仅记录）

- `randomBetween` 现在会在 `GrassField.tsx` 与本文件各有一份 3 行实现。第三处需要时再提到 `lib/`，两处不提前抽公共工具；
- 装饰层的颜色（草的白、萤火虫的 `#94FF94`）都是组件内字面量。若将来要做整体换肤，再统一收进 `globals.css` 的 `@theme`，届时这一层与草地一并处理；
- `frontend/AGENTS.md` 写的「Next.js 15」与实际依赖 `next@16.4.2` 不符，属于文档过期，与本需求无关，可另行更正。
