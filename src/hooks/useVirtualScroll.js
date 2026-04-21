import { useCallback, useRef, useState } from "react";

/**
 * Simple fixed-height virtual scroll.
 * @param {number} itemCount  - total items
 * @param {number} itemHeight - height of one item in px (including gap)
 * @param {number} containerH - visible height of scroll container
 * @param {number} overscan   - extra items rendered above/below viewport
 */
export function useVirtualScroll({
  itemCount,
  itemHeight,
  containerH,
  overscan = 5,
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  const onScroll = useCallback((e) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const totalHeight = itemCount * itemHeight;

  const startIdx = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerH / itemHeight) + overscan * 2;
  const endIdx = Math.min(itemCount - 1, startIdx + visibleCount);

  const offsetTop = startIdx * itemHeight;
  const offsetBottom = (itemCount - 1 - endIdx) * itemHeight;

  return {
    containerRef,
    onScroll,
    startIdx,
    endIdx,
    totalHeight,
    offsetTop,
    offsetBottom,
  };
}
