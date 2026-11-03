/** 周一在前的星期标签，与日历网格的列顺序一致 */
const WEEKDAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"];

/** 0 = 周日 … 6 = 周六 */
const WEEKDAY_NAMES = ["日", "一", "二", "三", "四", "五", "六"];

/** 6 行 × 7 列 = 42 格，固定行数让盒子高度不随月份跳动 */
const CELL_COUNT = 42;

interface TalkCalendarProps {
  /** ISO 日期时间字符串，如 "2026-10-30T21:10:00" */
  publishedAt: string;
}

/**
 * 右轨发布日期日历 320×341，替代文章页的目录盒。
 *
 * 只展示本篇发布所在的那个月：表头是年/月，主体是 6×7 的月历网格，
 * 发布当天用淡紫蓝圆底 + 外发光标出，底部补完整日期、星期与时间。
 * 纯静态，不需要客户端状态；月份切换、其他日期跳转都不在本组件内。
 *
 * 日期解析全部走字符串切片 + UTC：发布时间的年月日不能因为服务器
 * 时区不同而错位，星期也要和日历格子里的数字保持一致。
 */
export function TalkCalendar({ publishedAt }: TalkCalendarProps) {
  const [year, month, day] = publishedAt.slice(0, 10).split("-").map(Number);
  const time = publishedAt.slice(11, 16);

  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  // 周日是 0，换算成「周一在前」后，首行左侧的空白格数
  const leadingBlanks = (firstWeekday + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const weekday =
    WEEKDAY_NAMES[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];

  const cells = Array.from({ length: CELL_COUNT }, (_, index) => {
    const date = index - leadingBlanks + 1;
    return date >= 1 && date <= daysInMonth ? date : null;
  });

  return (
    <div
      role="group"
      aria-label="发布日期日历"
      className="glass-panel-thick flex h-[341px] w-full shrink-0 flex-col rounded-glass px-5 py-4"
    >
      <div className="flex items-center justify-between">
        <span className="font-xiaowei text-[13px] text-white/60">发布日期</span>
        <span className="text-[12px] text-white/45 tabular-nums">
          {year} / {String(month).padStart(2, "0")}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-7 text-center text-[11px] text-white/35">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="mt-2 grid min-h-0 flex-1 grid-cols-7 grid-rows-6 text-center text-[12px]">
        {cells.map((date, index) =>
          date === null ? (
            <span key={index} aria-hidden />
          ) : (
            <span key={index} className="flex items-center justify-center">
              <span
                className={
                  date === day
                    ? "grid size-7 place-items-center rounded-full border border-neon-500/60 bg-neon-500/20 font-medium text-neon-500 shadow-[0_0_14px_-2px_var(--color-neon-500)] tabular-nums"
                    : "grid size-7 place-items-center text-white/60 tabular-nums"
                }
              >
                {date}
              </span>
            </span>
          ),
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-[11px] text-white/45">
        <span className="tabular-nums">
          {year}年{month}月{day}日
        </span>
        <span className="tabular-nums">
          周{weekday} · {time}
        </span>
      </div>
    </div>
  );
}
