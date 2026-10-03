"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface MessageScrollerProps extends React.HTMLAttributes<HTMLDivElement> {
  onLoadMore?: () => void;
}

const MessageScroller = React.forwardRef<HTMLDivElement, MessageScrollerProps>(
  ({ className, children, onLoadMore, ...props }, ref) => {
    const scrollerRef = React.useRef<HTMLDivElement>(null);
    const bottomRef = React.useRef<HTMLDivElement>(null);

    const scrollToBottom = React.useCallback((behavior: ScrollBehavior = "smooth") => {
      bottomRef.current?.scrollIntoView({ behavior });
    }, []);

    React.useEffect(() => {
      scrollToBottom("auto");
    }, [children, scrollToBottom]);

    const handleScroll = React.useCallback(() => {
      if (!scrollerRef.current || !onLoadMore) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollerRef.current;
      if (scrollTop <= 50) onLoadMore();
    }, [onLoadMore]);

    return (
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className={cn(
          "flex-1 overflow-y-auto pb-4 px-4",
          "scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent"
        )}
        {...props}
      >
        <div className="flex flex-col gap-3">{children}</div>
        <div ref={bottomRef} />
      </div>
    );
  }
);
MessageScroller.displayName = "MessageScroller";

export { MessageScroller };