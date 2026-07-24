import { useState, useRef, useEffect, useCallback } from "react";
import { Clock } from "lucide-react";

interface Props {
  value: string;
  onChange: (value24: string) => void;
  error?: boolean;
}

const CLOCK_R = 110;
const CENTER = 130;
const NUM_R = 22;

function to24(h12: number, period: "AM" | "PM"): string {
  if (period === "AM") return h12 === 12 ? "0" : String(h12);
  return h12 === 12 ? "12" : String(h12 + 12);
}

function to12(h24: number): { hour12: number; period: "AM" | "PM" } {
  if (h24 === 0) return { hour12: 12, period: "AM" };
  if (h24 < 12) return { hour12: h24, period: "AM" };
  if (h24 === 12) return { hour12: 12, period: "PM" };
  return { hour12: h24 - 12, period: "PM" };
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function angleFromCenter(cx: number, cy: number, mx: number, my: number): number {
  return Math.atan2(my - cy, mx - cx);
}

function posOnCircle(
  cx: number,
  cy: number,
  r: number,
  angleRad: number,
): { x: number; y: number } {
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function nearestMinute(angleRad: number): number {
  const deg = ((angleRad * 180) / Math.PI + 90 + 360) % 360;
  const m = Math.round(deg / 6) % 60;
  return m;
}

function nearestHour(angleRad: number): number {
  const deg = ((angleRad * 180) / Math.PI + 90 + 360) % 360;
  let h = Math.round(deg / 30);
  if (h === 0) h = 12;
  return h;
}

export function AnalogTimePicker({ value, onChange, error }: Props) {
  const [open, setOpen] = useState(false);

  const parsed = value ? value.split(":").map(Number) : [0, 0];
  const h24 = parsed[0] || 0;
  const min = parsed[1] || 0;

  const { hour12: initHour, period: initPeriod } = to12(h24);

  const [mode, setMode] = useState<"hours" | "minutes">("hours");
  const [hour12, setHour12] = useState(initHour);
  const [minute, setMinute] = useState(min);
  const [period, setPeriod] = useState<"AM" | "PM">(initPeriod);

  const [dragValue, setDragValue] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    if (!open) return;
    setMode("hours");
    setHour12(initHour);
    setMinute(min);
    setPeriod(initPeriod);
    setDragValue(null);
  }, [open, initHour, initPeriod, min]);

  const getAngleFromEvent = useCallback((e: MouseEvent | React.MouseEvent | React.TouchEvent) => {
    const svg = svgRef.current;
    if (!svg) return 0;
    const rect = svg.getBoundingClientRect();
    const scaleX = (CENTER * 2) / rect.width;
    const scaleY = (CENTER * 2) / rect.height;
    let clientX: number, clientY: number;
    if ("touches" in e) {
      const t = e.touches[0] || (e as React.TouchEvent).changedTouches[0];
      clientX = t.clientX;
      clientY = t.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const svgX = (clientX - rect.left) * scaleX;
    const svgY = (clientY - rect.top) * scaleY;
    return angleFromCenter(CENTER, CENTER, svgX, svgY);
  }, []);

  const handlePointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      isDragging.current = true;
      const angle = getAngleFromEvent(e);
      if (mode === "hours") {
        const h = nearestHour(angle);
        setDragValue(h);
      } else {
        const m = nearestMinute(angle);
        setDragValue(m);
      }
    },
    [mode, getAngleFromEvent],
  );

  const handlePointerMove = useCallback(
    (e: MouseEvent | React.TouchEvent) => {
      if (!isDragging.current) return;
      const angle = getAngleFromEvent(e);
      if (mode === "hours") {
        const h = nearestHour(angle);
        setDragValue(h);
      } else {
        const m = nearestMinute(angle);
        setDragValue(m);
      }
    },
    [mode, getAngleFromEvent],
  );

  const handlePointerUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const val = dragValue;
    if (val === null) return;
    if (mode === "hours") {
      setHour12(val);
      setTimeout(() => setMode("minutes"), 150);
    } else {
      setMinute(val);
    }
    setDragValue(null);
  }, [mode, dragValue]);

  useEffect(() => {
    if (!open) return;
    const onMove = (e: MouseEvent) => handlePointerMove(e);
    const onUp = () => handlePointerUp();
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onUp as any);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onUp as any);
      window.removeEventListener("touchend", onUp);
    };
  }, [open, handlePointerMove, handlePointerUp]);

  const displayHour = dragValue !== null && mode === "hours" ? dragValue : hour12;
  const displayMin = dragValue !== null && mode === "minutes" ? dragValue : minute;

  const handleConfirm = () => {
    const h24val = parseInt(to24(hour12, period), 10);
    onChange(`${pad(h24val)}:${pad(minute)}`);
    setOpen(false);
  };

  const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  function hourAngle(h: number): number {
    return ((h % 12) * 30 - 90) * (Math.PI / 180);
  }

  function minuteAngle(m: number): number {
    return (m * 6 - 90) * (Math.PI / 180);
  }

  const activeNum = mode === "hours" ? displayHour : displayMin;
  const activeAngle = mode === "hours" ? hourAngle(displayHour) : minuteAngle(displayMin);

  const handEnd = posOnCircle(CENTER, CENTER, CLOCK_R - 28, activeAngle);
  const dotR = 4;

  return (
    <>
      <div className="relative mt-1">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "flex items-center gap-2 w-full h-11 px-3 rounded-lg border bg-background text-sm text-left transition",
            error ? "border-red-500" : "border-input hover:border-foreground/30",
          )}
        >
          <Clock className="size-4 shrink-0 text-muted-foreground" />
          {value ? (
            <span className="font-medium">
              {pad(displayHour)}:{pad(displayMin)} {period}
            </span>
          ) : (
            <span className="text-muted-foreground">Seleccionar hora</span>
          )}
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[200] grid place-items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-[340px] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Display */}
            <div className="flex items-center justify-center gap-2 pt-8 pb-4">
              <button
                type="button"
                onClick={() => setMode("hours")}
                className={`text-4xl font-light tabular-nums transition ${
                  mode === "hours"
                    ? "text-[#004B87] underline underline-offset-4 decoration-2"
                    : "text-[#64748b]"
                }`}
              >
                {pad(displayHour)}
              </button>
              <span className="text-4xl font-light text-[#64748b]">:</span>
              <button
                type="button"
                onClick={() => setMode("minutes")}
                className={`text-4xl font-light tabular-nums transition ${
                  mode === "minutes"
                    ? "text-[#004B87] underline underline-offset-4 decoration-2"
                    : "text-[#64748b]"
                }`}
              >
                {pad(displayMin)}
              </button>
              <div className="flex flex-col gap-0.5 ml-2">
                <button
                  type="button"
                  onClick={() => setPeriod("AM")}
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded transition ${
                    period === "AM"
                      ? "bg-[#004B87] text-white"
                      : "text-[#64748b] hover:text-[#004B87]"
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod("PM")}
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded transition ${
                    period === "PM"
                      ? "bg-[#004B87] text-white"
                      : "text-[#64748b] hover:text-[#004B87]"
                  }`}
                >
                  PM
                </button>
              </div>
            </div>

            {/* Clock face */}
            <div className="flex justify-center pb-2">
              <svg
                ref={svgRef}
                width={CENTER * 2}
                height={CENTER * 2}
                viewBox={`0 0 ${CENTER * 2} ${CENTER * 2}`}
                className="select-none touch-none"
                style={{ cursor: "pointer" }}
                onMouseDown={handlePointerDown}
                onTouchStart={handlePointerDown}
              >
                {/* Clock background circle */}
                <circle cx={CENTER} cy={CENTER} r={CLOCK_R} fill="#f4f6f8" />
                <circle
                  cx={CENTER}
                  cy={CENTER}
                  r={CLOCK_R}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth={1}
                />

                {/* Hand */}
                <line
                  x1={CENTER}
                  y1={CENTER}
                  x2={handEnd.x}
                  y2={handEnd.y}
                  stroke="#004B87"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                />
                {/* Center dot */}
                <circle cx={CENTER} cy={CENTER} r={dotR} fill="#004B87" />

                {/* Numbers */}
                {(mode === "hours" ? hours : minutes).map((n) => {
                  const angle = mode === "hours" ? hourAngle(n) : minuteAngle(n);
                  const pos = posOnCircle(CENTER, CENTER, CLOCK_R - 32, angle);
                  const isActive = activeNum === n;
                  const label = mode === "minutes" ? pad(n) : String(n);
                  return (
                    <g key={n}>
                      {isActive && <circle cx={pos.x} cy={pos.y} r={NUM_R * 0.7} fill="#004B87" />}
                      <text
                        x={pos.x}
                        y={pos.y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={isActive ? "white" : "#1e293b"}
                        fontSize={mode === "minutes" ? 13 : 15}
                        fontWeight={isActive ? "700" : "500"}
                        fontFamily="inherit"
                        style={{ pointerEvents: "none", userSelect: "none" }}
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-between px-6 py-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm font-semibold text-[#004B87] hover:opacity-70 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="text-sm font-semibold text-[#004B87] hover:opacity-70 transition"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
