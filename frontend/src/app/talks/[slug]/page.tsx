import { notFound } from "next/navigation";

import { TalkWorkspace } from "@/components/talks/TalkWorkspace";
import { getHomeData } from "@/lib/api";
import { TALKS } from "@/lib/talks-fixtures";

interface TalkPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * 杂谈详情页（/talks/[slug]）——杂谈卡片点击的落点。
 *
 * 正文与相关推荐都来自本地 fixture；介绍盒吃首页聚合接口的
 * profile/socials，写法与文章详情页保持一致。slug 不在 fixture 里
 * 直接走全站 404，不像文章页那样退回示例文章。
 */
export function generateStaticParams() {
  return TALKS.map((talk) => ({ slug: talk.slug }));
}

export async function generateMetadata({ params }: TalkPageProps) {
  const { slug } = await params;
  const talk = TALKS.find((item) => item.slug === slug);

  if (!talk) return { title: "杂谈" };

  return { title: talk.title, description: talk.excerpt };
}

export default async function TalkPage({ params }: TalkPageProps) {
  const { slug } = await params;
  const talk = TALKS.find((item) => item.slug === slug);

  if (!talk) notFound();

  const home = await getHomeData();
  const related = TALKS.filter((item) => item.slug !== talk.slug).slice(0, 3);

  return (
    <TalkWorkspace
      talk={talk}
      profile={home.data.profile}
      socials={home.data.site.socials}
      related={related}
    />
  );
}
