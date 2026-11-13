import { notFound } from "next/navigation";

import { TalkWorkspace } from "@/components/talks/TalkWorkspace";
import { getHomeData, getTalk, getTalks } from "@/lib/api";

interface TalkPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * 杂谈详情页（/talks/[slug]）——杂谈卡片点击的落点。
 *
 * 正文与相关推荐来自后端 /talks 接口；后端不可用时 getTalk 会退回同
 * slug 的本地 fixture。接口明确返回 404 时直接走全站 404，不拿示例
 * 内容冒充真实杂谈。
 */
export async function generateMetadata({ params }: TalkPageProps) {
  const { slug } = await params;
  const result = await getTalk(slug);
  const talk = result.data;

  if (!talk) return { title: "杂谈" };

  return { title: talk.title, description: talk.excerpt };
}

export default async function TalkPage({ params }: TalkPageProps) {
  const { slug } = await params;
  const [talkResult, home, talksResult] = await Promise.all([
    getTalk(slug),
    getHomeData(),
    getTalks(),
  ]);

  const talk = talkResult.data;
  if (!talk) notFound();

  const related = talksResult.data
    .filter((item) => item.slug !== talk.slug)
    .slice(0, 3);

  return (
    <TalkWorkspace
      talk={talk}
      profile={home.data.profile}
      socials={home.data.site.socials}
      related={related}
    />
  );
}
