import type { PhotoAlbum, PhotoItem } from "@/lib/types";

/**
 * 照片墙测试数据。
 *
 * 真实照片集接入后端后整文件删除，由 /photos 页面改从接口取
 * PhotoAlbum[] 替代。当前先复用 public/images/backgrounds 里的
 * 八张背景图占位，同一张图会在不同照片集里重复出现，方便先把
 * 堆叠、散开、瀑布流三套布局调出来。
 *
 * 每张照片的 width / height 是源文件的真实像素尺寸，
 * 详情页的瀑布流靠它在图片加载前占住高度，避免布局跳动。
 */
const PHOTO_LIBRARY: Record<string, PhotoItem> = {
  p1: {
    id: "photo-01",
    src: "/images/backgrounds/01.jpg",
    alt: "示例照片 01",
    title: "城市灯火",
    width: 2174,
    height: 1295,
  },
  p2: {
    id: "photo-02",
    src: "/images/backgrounds/02.jpg",
    alt: "示例照片 02",
    title: "街角",
    width: 5338,
    height: 2861,
  },
  p3: {
    id: "photo-03",
    src: "/images/backgrounds/03.jpg",
    alt: "示例照片 03",
    title: "山雾",
    width: 3250,
    height: 3575,
  },
  p4: {
    id: "photo-04",
    src: "/images/backgrounds/04.jpg",
    alt: "示例照片 04",
    title: "海面",
    width: 3800,
    height: 2400,
  },
  p5: {
    id: "photo-05",
    src: "/images/backgrounds/05.jpg",
    alt: "示例照片 05",
    title: "午后",
    width: 2079,
    height: 2079,
  },
  p6: {
    id: "photo-06",
    src: "/images/backgrounds/06.jpg",
    alt: "示例照片 06",
    title: "树影",
    width: 1681,
    height: 2071,
  },
  p7: {
    id: "photo-07",
    src: "/images/backgrounds/07.jpg",
    alt: "示例照片 07",
    title: "波光",
    width: 2079,
    height: 2079,
  },
  p8: {
    id: "photo-08",
    src: "/images/backgrounds/08.jpg",
    alt: "示例照片 08",
    title: "暮色",
    width: 1570,
    height: 884,
  },
};

export const PHOTO_ALBUMS: PhotoAlbum[] = [
  {
    id: "album-city-nights",
    slug: "city-nights",
    title: "城市夜色",
    description: "霓虹、车流，和凌晨两点还没关掉的便利店。",
    created_at: "2026-03-14",
    photos: [PHOTO_LIBRARY.p1, PHOTO_LIBRARY.p4, PHOTO_LIBRARY.p8, PHOTO_LIBRARY.p2, PHOTO_LIBRARY.p5],
  },
  {
    id: "album-mountains",
    slug: "mountains",
    title: "山野四季",
    description: "雾从谷底升起来的时候，山才真正醒着。",
    created_at: "2026-05-02",
    photos: [PHOTO_LIBRARY.p3, PHOTO_LIBRARY.p6, PHOTO_LIBRARY.p5, PHOTO_LIBRARY.p7],
  },
  {
    id: "album-everyday",
    slug: "everyday",
    title: "人间烟火",
    description: "菜市场的灯、路边的猫，和生活本来的样子。",
    created_at: "2025-12-21",
    photos: [PHOTO_LIBRARY.p2, PHOTO_LIBRARY.p5, PHOTO_LIBRARY.p1, PHOTO_LIBRARY.p6, PHOTO_LIBRARY.p7],
  },
  {
    id: "album-coastline",
    slug: "coastline",
    title: "海岸线",
    description: "潮水退下去以后，沙滩上留下整片天空的倒影。",
    created_at: "2026-07-08",
    photos: [PHOTO_LIBRARY.p4, PHOTO_LIBRARY.p8, PHOTO_LIBRARY.p7, PHOTO_LIBRARY.p3],
  },
  {
    id: "album-virtual",
    slug: "virtual",
    title: "虚拟之境",
    description: "屏幕里的光也是光，代码里也能长出一片森林。",
    created_at: "2026-01-19",
    photos: [PHOTO_LIBRARY.p5, PHOTO_LIBRARY.p1, PHOTO_LIBRARY.p3, PHOTO_LIBRARY.p2, PHOTO_LIBRARY.p6],
  },
  {
    id: "album-film",
    slug: "film",
    title: "旧日胶片",
    description: "那些拍糊了也舍不得删的瞬间。",
    created_at: "2024-11-30",
    photos: [PHOTO_LIBRARY.p6, PHOTO_LIBRARY.p7, PHOTO_LIBRARY.p8, PHOTO_LIBRARY.p4],
  },
];

/**
 * 从所有相册里随机挑一张照片，供首页相册精选使用。
 *
 * 只在服务端组件里调用：每次渲染换一张，页面受 60s 缓存影响。
 * 放在数据层而不是组件渲染里，避免 React 的 purity 规则把
 * 组件内的 Math.random 当成重渲染时的不可预测状态。
 */
export function pickRandomSpotlight() {
  const album = PHOTO_ALBUMS[Math.floor(Math.random() * PHOTO_ALBUMS.length)];
  const photo = album.photos[Math.floor(Math.random() * album.photos.length)];
  return { album, photo };
}
