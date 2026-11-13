"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { TalkSearch } from "@/components/talks/TalkSearch";
import { TalkTagBar } from "@/components/talks/TalkTagBar";
import { TalkWall } from "@/components/talks/TalkWall";
import type { Talk } from "@/lib/types";

const ALL_TALK_TAG = "全部";

/** 内容区与说说页一致：1200px 上限，窄屏留 1rem 边距，用负外边距破格居中 */
const WIDE_WIDTH = "min(1200px, calc(100vw - 2rem))";

/** 搜索防抖：连续输入合并成一次过滤 + 一次 FLIP */
const SEARCH_DEBOUNCE_MS = 220;

function subscribeWide(callback: () => void) {
  const query = window.matchMedia("(min-width: 768px)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function getWideSnapshot() {
  return window.matchMedia("(min-width: 768px)").matches;
}

function getServerWideSnapshot() {
  return false;
}

/**
 * 杂谈页主体。
 *
 * 数据由服务端页面通过 /talks 接口取得后传入；接口不可用时页面层会
 * 退回本地 fixture，因此这里的筛选与动画逻辑不需要关心数据来源。
 *
 * 自上而下：标题 → 副标题 → 512×58 搜索胶囊 → 标签区 → 三列 / 两列瀑布流。
 *
 * 标签切换立即播 FLIP；搜索输入保留即时值，停止输入 220ms 后才应用
 * appliedQuery 并递增 filterSignal，因此连续打字只会在停顿后播一次
 * 完整重排。标签切换会取消未触发的搜索定时器，并立即应用当前输入，
 * 保证一次操作只对应一次动画。
 *
 * 首访错峰入场只播一次：1.5s 后摘掉 view-rise / view-fade，后续筛选
 * 不会再被入场动画干扰。
 */
export function TalksBanner({ talks }: { talks: Talk[] }) {
  const [selectedTag, setSelectedTag] = useState(ALL_TALK_TAG);
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [filterSignal, setFilterSignal] = useState(0);
  const [animateEntrance, setAnimateEntrance] = useState(true);
  const searchTimerRef = useRef<number | null>(null);

  // 768px 以下两列，以上三列。服务端先按两列渲染，客户端接管后修正，
  // 避免服务端与客户端首次渲染不一致。
  const isWide = useSyncExternalStore(
    subscribeWide,
    getWideSnapshot,
    getServerWideSnapshot,
  );
  const columns = isWide ? 3 : 2;

  useEffect(() => {
    if (!animateEntrance) return;

    const timer = window.setTimeout(() => setAnimateEntrance(false), 1500);
    return () => window.clearTimeout(timer);
  }, [animateEntrance]);

  // 卸载时收掉还没触发的搜索定时器
  useEffect(() => {
    return () => {
      if (searchTimerRef.current !== null) {
        window.clearTimeout(searchTimerRef.current);
        searchTimerRef.current = null;
      }
    };
  }, []);

  const appliedKeyword = appliedQuery.trim().toLowerCase();
  const tags = [
    ALL_TALK_TAG,
    ...Array.from(new Set(talks.flatMap((talk) => talk.tags))),
  ];

  const visibleTalks = talks.filter((talk) => {
    if (selectedTag !== ALL_TALK_TAG && !talk.tags.includes(selectedTag)) {
      return false;
    }

    if (!appliedKeyword) return true;

    return (
      talk.title.toLowerCase().includes(appliedKeyword) ||
      talk.excerpt.toLowerCase().includes(appliedKeyword) ||
      talk.tags.some((tag) => tag.toLowerCase().includes(appliedKeyword)) ||
      talk.mood.toLowerCase().includes(appliedKeyword)
    );
  });

  const trimmedAppliedQuery = appliedQuery.trim();
  const emptyText = trimmedAppliedQuery
    ? `没有找到与「${trimmedAppliedQuery}」匹配的杂谈`
    : selectedTag === ALL_TALK_TAG
      ? "这片云端还没有被写下。"
      : `「${selectedTag}」下还没有杂谈`;

  function clearSearchTimer() {
    if (searchTimerRef.current !== null) {
      window.clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
  }

  function handleSelectTag(tag: string) {
    if (tag === selectedTag) return;

    // 标签切换立即应用当前输入，并取消尚未触发的搜索防抖，
    // 保证一次操作只对应一次 FLIP。
    clearSearchTimer();
    setAppliedQuery(query);
    setIsSearching(false);
    setAnimateEntrance(false);
    setSelectedTag(tag);
    setFilterSignal((current) => current + 1);
  }

  function handleQueryChange(value: string) {
    setAnimateEntrance(false);
    setQuery(value);

    clearSearchTimer();

    // 输入回到已应用的查询（例如只多打了个空格）时不重播
    if (value.trim() === appliedQuery.trim()) {
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimerRef.current = window.setTimeout(() => {
      searchTimerRef.current = null;
      setAppliedQuery(value);
      setIsSearching(false);
      setFilterSignal((current) => current + 1);
    }, SEARCH_DEBOUNCE_MS);
  }

  return (
    <section
      aria-label="云端杂谈"
      className="flex flex-col items-center gap-6 font-xiaowei"
      style={{
        width: WIDE_WIDTH,
        marginInline: `calc((100% - ${WIDE_WIDTH}) / 2)`,
      }}
    >
      <header className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-[50px] leading-tight text-white/90">云端杂谈</h1>
        <p className="text-[14px] text-white/50">
          代码、生活、邦多利与虚拟世界的碎片记录
        </p>
      </header>

      <TalkSearch
        value={query}
        onChange={handleQueryChange}
        searching={isSearching}
      />

      <TalkTagBar
        tags={tags}
        selectedTag={selectedTag}
        onSelectTag={handleSelectTag}
      />

      <TalkWall
        talks={visibleTalks}
        columns={columns}
        filterSignal={filterSignal}
        animateEntrance={animateEntrance}
        emptyText={emptyText}
      />
    </section>
  );
}
