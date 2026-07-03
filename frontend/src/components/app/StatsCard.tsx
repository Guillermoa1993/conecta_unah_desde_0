import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatsCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
  trend,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: "primary" | "gold" | "success" | "muted";
  trend?: { value: string; up?: boolean };
}) {
  const toneMap = {
    primary: "bg-primary/10 text-primary",
    gold: "bg-gold/20 text-foreground",
    success: "bg-success/15 text-success",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <div className="rounded-xl border bg-card p-5 shadow-soft hover:shadow-card transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </div>
          <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
          {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
        </div>
        <div className={cn("size-10 rounded-lg grid place-items-center", toneMap[tone])}>
          <Icon className="size-5" />
        </div>
      </div>
      {trend && (
        <div
          className={cn(
            "mt-3 text-xs font-medium inline-flex items-center gap-1",
            trend.up ? "text-success" : "text-destructive",
          )}
        >
          {trend.up ? "↑" : "↓"} {trend.value}
        </div>
      )}
    </div>
  );
}
