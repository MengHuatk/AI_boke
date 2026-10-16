# frontend

Next.js 16 + React 19 + Tailwind CSS 4 前端。完整说明见仓库根目录的
[docs/HANDOVER.md](../docs/HANDOVER.md)。

```bash
npm install
npm run dev     # http://localhost:3000
```

后端地址通过 `.env.local` 配置，参照 [.env.example](.env.example)。

> 后端没启动时，首页会自动回退到 `src/lib/fallback.ts` 里的示例数据，
> 页面上会有一条开发期提示条，不会白屏。