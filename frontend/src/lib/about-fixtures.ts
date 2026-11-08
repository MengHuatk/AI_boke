/**
 * 关于页的文案与横幅图。
 *
 * 页面结构与动效都在 AboutCard 里，这里只放会被反复修改的文字和图片：
 * 换自我介绍、换横幅不用碰组件。
 */

export const ABOUT_BANNER = "/images/backgrounds/01.jpg";

export const ABOUT_GREETING = "Hello World, I'm 梦华";

/** 致谢段落里要变成外链的名字 */
export const ABOUT_LINK = {
  label: "XingHuiSama",
  href: "https://www.xinghuisama.top",
} as const;

/** 诗句里唯一被强调的词，其余文字保持原色 */
export const ABOUT_ACCENT = "迷途之星";

export const ABOUT_INTRO = {
  greeting: "你好，我是梦华。",
  body: [
    "一颗在生活中的迷途之星。",
    "喜欢动漫，目前正在进行人工智能的学习与应用。",
  ],
  thanks: {
    before: "这个博客我运用了人工智能进行辅助开发，参考了",
    after: "大佬的博客设计，特此感谢！",
  },
  poem: [
    "最后，",
    "向着同样颤抖的你",
    "我亦在此",
    "放声呐喊迷途之星的歌谣",
    "纵然步履踉跄",
    "仍在挣扎喘息",
    "吟唱迷途之星的歌谣。",
  ],
};
