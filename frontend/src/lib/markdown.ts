/**
 * Markdown 正文的锚点公共约定。
 *
 * 目录提取（extractHeadings）与正文渲染（PostArticle 的 h2/h3 映射）
 * 必须从同一个 headingId 派生锚点 id，否则 TOC 点击会跳空。
 * 消费方：components/post/*。
 */

export interface HeadingEntry {
  level: 2 | 3;
  /** 目录里的展示文本：去掉行内装饰符后的纯标题 */
  text: string;
  id: string;
}

/** 标题锚点 id：剥掉 * _ ` ~ 等行内装饰，空白压成连字符 */
export function headingId(text: string): string {
  return text
    .replace(/[*_`~]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/** 从正文抽出 h2/h3 小标题序列；``` 围栏内部的 # 行不算标题 */
export function extractHeadings(body: string): HeadingEntry[] {
  const headings: HeadingEntry[] = [];
  let inFence = false;

  for (const line of body.split("\n")) {
    if (line.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = /^(#{2,3})\s+(.+)$/.exec(line);
    if (match) {
      const text = match[2].replace(/[*_`~]/g, "").trim();
      headings.push({
        level: match[1].length as 2 | 3,
        text,
        id: headingId(text),
      });
    }
  }

  return headings;
}
