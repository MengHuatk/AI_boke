# 背景图轮播素材

把背景照片放进这个目录，然后在 `frontend/.env.local` 里登记路径。
页面背景会按登记的先后顺序**交叉淡化**轮播（上一张渐隐、下一张渐显，无位移）。

## 怎么用

1. 把照片拷进本目录，例如 `01.jpg`、`02.jpg`
2. 在 `frontend/.env.local` 里写：

   ```bash
   NEXT_PUBLIC_BACKGROUND_IMAGES="/images/backgrounds/01.jpg,/images/backgrounds/02.jpg"
   NEXT_PUBLIC_BACKGROUND_INTERVAL=8
   ```

3. **重启 `npm run dev`** —— `NEXT_PUBLIC_` 变量是构建期内联的，热更新不会生效

## 建议

- **尺寸**：1920×1080 以上、横构图。图片以 `background-size: cover` 铺满视口，图太小放大后会糊
- **格式**：`.webp` 或 `.jpg`。本目录的文件会被原样发布，不做压缩，所以请自行压好再放进来
- **数量**：2 张以上才会轮播；只登记 1 张就是静态背景
- **顺序**：env 里的先后顺序就是播放顺序
- **间隔**：`NEXT_PUBLIC_BACKGROUND_INTERVAL` 要**大于**淡化时长（默认 1.5s），
  否则上一轮没淡完就被打断，会退化成硬切
- **亮度**：照片越亮，玻璃面板上的文字越难读。先调 `NEXT_PUBLIC_BACKGROUND_IMAGE_DIM`
  （默认 `0.6`，往大调），别急着换图
- **模糊**：想让照片退到幕后，把 `NEXT_PUBLIC_BACKGROUND_IMAGE_BLUR` 调到 `8`–`20`

## 本目录为空时会怎样

不渲染轮播层、不报错，页面回落到纯极光渐变 —— 也就是初版的默认外观。