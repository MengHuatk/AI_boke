/**
 * 首页简介卡的联系方式。
 *
 * 后端目前没有这些字段，先集中放在这里；换成真实账号时只改本文件。
 * GitHub 直接跳转，邮箱 / QQ / 微信点击复制。
 */

export const HOME_CONTACTS = {
  github: "https://github.com/MengHuatk/",
  email: "18482037254@163.com",
  qq: "1972698740",
  wechat: "FinalDuet",
} as const;

export type HomeContactKey = keyof typeof HOME_CONTACTS;
