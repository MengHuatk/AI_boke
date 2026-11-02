import type { Moment, MomentAuthor, MomentImage } from "@/lib/types";

/**
 * 说说页测试数据。
 *
 * 真实数据接入后整文件删除，由 /moments 页面改从接口取 Moment[] 替代。
 * 刻意覆盖 0 / 1 / 2 / 3 / 6 / 9 / 12 张图：九宫格、+N 遮罩和灯箱
 * 左右切换都能在本地直接看到效果。
 */
const IMAGE_SIZES: Record<string, { width: number; height: number }> = {
  "/images/backgrounds/01.jpg": { width: 2174, height: 1295 },
  "/images/backgrounds/02.jpg": { width: 5338, height: 2861 },
  "/images/backgrounds/03.jpg": { width: 3250, height: 3575 },
  "/images/backgrounds/04.jpg": { width: 3800, height: 2400 },
  "/images/backgrounds/05.jpg": { width: 2079, height: 2079 },
  "/images/backgrounds/06.jpg": { width: 1681, height: 2071 },
  "/images/backgrounds/07.jpg": { width: 2079, height: 2079 },
  "/images/backgrounds/08.jpg": { width: 1570, height: 884 },
};

const photo = (src: string, alt: string): MomentImage => ({
  src,
  alt,
  ...IMAGE_SIZES[src],
});

export const MOMENT_AUTHOR: MomentAuthor = {
  name: "梦华",
  avatar: "/avatar.jpg",
};

export const MOMENTS: Moment[] = [
  {
    id: "m-001",
    content:
      "今天把阳台的灯修好了。暖黄色的光落在晾衣杆上，突然觉得这个租来的小房间也有了一点「家」的形状。",
    images: [],
    location: { province: "四川省", city: "成都市", district: "武侯区" },
    published_at: "2026-11-02T09:15:00",
  },
  {
    id: "m-002",
    content: "下班绕去河边走了二十分钟。风比想象中凉，但桂花还在开。",
    images: [photo("/images/backgrounds/06.jpg", "河边的傍晚")],
    location: { province: "四川省", city: "成都市", district: "锦江区" },
    published_at: "2026-11-01T20:40:00",
  },
  {
    id: "m-003",
    content:
      "周末的旧书店，淘到一本 1998 年的《瓦尔登湖》。扉页上有人用铅笔写了一句「去过湖边」。",
    images: [
      photo("/images/backgrounds/01.jpg", "旧书店的窗边"),
      photo("/images/backgrounds/02.jpg", "书页与光"),
      photo("/images/backgrounds/03.jpg", "街角的午后"),
    ],
    location: { province: "四川省", city: "成都市", district: "青羊区" },
    published_at: "2026-10-30T16:20:00",
  },
  {
    id: "m-004",
    content: "乐山的两天：雾、江、和一直没停的雨。九张图刚好装下这次短途。",
    images: [
      photo("/images/backgrounds/01.jpg", "雨里的江面"),
      photo("/images/backgrounds/02.jpg", "雾中的桥"),
      photo("/images/backgrounds/03.jpg", "山脚的石阶"),
      photo("/images/backgrounds/04.jpg", "路边的茶馆"),
      photo("/images/backgrounds/05.jpg", "窗外的雨"),
      photo("/images/backgrounds/06.jpg", "傍晚的渡口"),
      photo("/images/backgrounds/07.jpg", "青苔与石壁"),
      photo("/images/backgrounds/08.jpg", "回程的车窗"),
      photo("/images/backgrounds/01.jpg", "雾散之前"),
    ],
    location: { province: "四川省", city: "乐山市", district: "市中区" },
    published_at: "2026-10-28T11:05:00",
  },
  {
    id: "m-005",
    content:
      "大理的云低得像伸手就能碰到。照片太多，九宫格放不下，剩下的交给灯箱。",
    images: [
      photo("/images/backgrounds/01.jpg", "苍山下的云"),
      photo("/images/backgrounds/02.jpg", "洱海边的风"),
      photo("/images/backgrounds/03.jpg", "白墙与影子"),
      photo("/images/backgrounds/04.jpg", "巷子里的花"),
      photo("/images/backgrounds/05.jpg", "午后的院子"),
      photo("/images/backgrounds/06.jpg", "远处的塔"),
      photo("/images/backgrounds/07.jpg", "傍晚的云层"),
      photo("/images/backgrounds/08.jpg", "回程的路"),
      photo("/images/backgrounds/01.jpg", "清晨的湖面"),
      photo("/images/backgrounds/02.jpg", "路边的小店"),
      photo("/images/backgrounds/03.jpg", "屋檐下"),
      photo("/images/backgrounds/04.jpg", "最后一束光"),
    ],
    location: { province: "云南省", city: "大理白族自治州", district: "大理市" },
    published_at: "2026-10-24T18:30:00",
  },
  {
    id: "m-006",
    content: "西湖边晨跑，雾气把远处的桥吞掉了一半。",
    images: [
      photo("/images/backgrounds/04.jpg", "雾里的湖"),
      photo("/images/backgrounds/05.jpg", "早起的船"),
    ],
    location: { province: "浙江省", city: "杭州市", district: "西湖区" },
    published_at: "2026-10-18T09:50:00",
  },
  {
    id: "m-007",
    content:
      "深夜写代码，窗外有人在练萨克斯。跑调得很认真，居然把 bug 听顺眼了。",
    images: [],
    location: { province: "四川省", city: "成都市", district: "成华区" },
    published_at: "2026-10-10T22:10:00",
  },
  {
    id: "m-008",
    content: "九寨沟的水比照片更不真实。六张图，留一点给下次。",
    images: [
      photo("/images/backgrounds/03.jpg", "蓝色的水"),
      photo("/images/backgrounds/04.jpg", "林间的栈道"),
      photo("/images/backgrounds/05.jpg", "倒影"),
      photo("/images/backgrounds/06.jpg", "瀑布"),
      photo("/images/backgrounds/07.jpg", "山与云"),
      photo("/images/backgrounds/08.jpg", "离开时的路口"),
    ],
    location: {
      province: "四川省",
      city: "阿坝藏族羌族自治州",
      district: "九寨沟县",
    },
    published_at: "2026-09-30T14:25:00",
  },
];
