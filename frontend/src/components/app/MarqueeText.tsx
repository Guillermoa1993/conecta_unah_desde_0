import { useRef, useLayoutEffect, useState } from "react";

export function MarqueeText({
  text,
  className = "",
  maxWidth = 150,
}: {
  text: string;
  className?: string;
  maxWidth?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [overflows, setOverflows] = useState(false);

  const animDelay = useRef(
    -((text.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 5) + 1) + "s",
  );

  useLayoutEffect(() => {
    const check = () => {
      if (containerRef.current && measureRef.current) {
        setOverflows(measureRef.current.scrollWidth > containerRef.current.clientWidth);
      }
    };
    check();
    const ro = new ResizeObserver(check);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [text]);

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden whitespace-nowrap ${className}`}
      style={{ width: `${maxWidth}px`, maxWidth: `${maxWidth}px` }}
    >
      <span
        ref={measureRef}
        aria-hidden
        style={{ position: "absolute", opacity: 0, pointerEvents: "none", whiteSpace: "nowrap" }}
      >
        {text}
      </span>
      {overflows ? (
        <div
          style={{
            display: "inline-flex",
            animation: `ceh-marquee 15s linear ${animDelay.current} infinite`,
          }}
        >
          <span>{text}</span>
          <span className="ml-4">{text}</span>
        </div>
      ) : (
        <span>{text}</span>
      )}
    </div>
  );
}
