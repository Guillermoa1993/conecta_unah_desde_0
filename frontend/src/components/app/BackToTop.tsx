import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 200);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <button
      onClick={scrollToTop}
      className={`fixed z-40 flex flex-col items-center justify-center rounded-full size-11 backdrop-blur-sm border border-white/20 transition-all duration-300 ${
        visible ? "pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      style={{
        bottom: "calc(4rem + 60px)",
        right: "1.5rem",
        backgroundColor: "rgba(255,255,255,0.5)",
        opacity: visible ? 0.5 : 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = "1";
        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.9)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = "0.5";
        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.5)";
      }}
      aria-label="Volver al inicio"
    >
      <ChevronUp className="size-4 -mb-[6px]" style={{ color: "var(--puma-blue)" }} />
      <ChevronUp className="size-4 -mt-[6px]" style={{ color: "var(--puma-blue)" }} />
    </button>
  );
}
