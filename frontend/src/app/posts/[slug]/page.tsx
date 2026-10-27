import { PostWorkspace } from "@/components/post/PostWorkspace";
import { getHomeData, getPost } from "@/lib/api";
import { TEST_POSTS } from "@/lib/archive-fixtures";

/**
 * 文章详情页（/posts/[slug]）——归档卡片点击的落点，
 * 此前是归档页跳转链里唯一的 404。
 *
 * 数据并流三路：正文走 getPost（后端未起时退到示例文章，
 * slug 不存在同理）；介绍盒吃首页聚合接口的 profile/socials；
 * 相关推荐取归档 fixture 里排除本篇之后的前三篇。
 */
export const metadata = { title: "文章" };

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [post, home] = await Promise.all([getPost(slug), getHomeData()]);

  return (
    <PostWorkspace
      post={post.data}
      profile={home.data.profile}
      socials={home.data.site.socials}
      related={TEST_POSTS.filter((item) => item.slug !== post.data.slug).slice(0, 3)}
    />
  );
}
