import { useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

type Props = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  onChange: (next: { x1: number; y1: number; x2: number; y2: number }) => void;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function cubicBezierPoint(t: number, x1: number, y1: number, x2: number, y2: number) {
  // P0=(0,0), P1=(x1,y1), P2=(x2,y2), P3=(1,1)
  const u = 1 - t;
  const x = 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t;
  const y = 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t;
  return { x, y };
}

export function EasingBezierGraph({ x1, y1, x2, y2, onChange }: Props) {
  const ref = useRef<SVGSVGElement | null>(null);
  const [drag, setDrag] = useState<"p1" | "p2" | null>(null);

  const points = useMemo(() => {
    const W = 220;
    const H = 120;
    const samples = 40;
    const pts: Array<{ px: number; py: number }> = [];
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const p = cubicBezierPoint(t, x1, y1, x2, y2);
      pts.push({ px: p.x * W, py: (1 - p.y) * H });
    }
    return { W, H, pts };
  }, [x1, y1, x2, y2]);

  const curvePath = useMemo(() => {
    const { pts } = points;
    if (pts.length === 0) return "";
    return pts.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.px.toFixed(1)} ${p.py.toFixed(1)}`).join(" ");
  }, [points]);

  const controlPoints = useMemo(() => {
    const { W, H } = points;
    return {
      p1: { cx: x1 * W, cy: (1 - y1) * H },
      p2: { cx: x2 * W, cy: (1 - y2) * H },
    };
  }, [points, x1, y1, x2, y2]);

  const updateFromEvent = (e: ReactPointerEvent) => {
    if (!ref.current || !drag) return;
    const rect = ref.current.getBoundingClientRect();
    const px = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    const py = clamp((e.clientY - rect.top) / rect.height, 0, 1);

    // SVG y is downwards; bezier y is upwards (0 at bottom).
    const nx = px;
    const ny = 1 - py;

    if (drag === "p1") {
      onChange({ x1: nx, y1: ny, x2, y2 });
    } else {
      onChange({ x1, y1, x2: nx, y2: ny });
    }
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-2">
      <div className="mb-2 flex items-center justify-between text-[11px] text-zinc-400">
        <span>cubic-bezier</span>
        <span className="font-mono">{x1.toFixed(2)}, {y1.toFixed(2)}, {x2.toFixed(2)}, {y2.toFixed(2)}</span>
      </div>

      <svg
        ref={ref}
        width="220"
        height="120"
        viewBox="0 0 220 120"
        className="touch-none select-none"
        onPointerMove={updateFromEvent}
        onPointerUp={() => setDrag(null)}
        onPointerCancel={() => setDrag(null)}
      >
        {/* axis */}
        <line x1="0" y1="120" x2="220" y2="120" stroke="#27272a" strokeWidth="1" />
        <line x1="0" y1="120" x2="0" y2="0" stroke="#27272a" strokeWidth="1" />

        {/* grid */}
        {[0.25, 0.5, 0.75].map((v) => {
          const y = (1 - v) * 120;
          const x = v * 220;
          return (
            <g key={v}>
              <line x1={x} y1={120} x2={x} y2={0} stroke="#1f1f23" strokeWidth="1" opacity="0.7" />
              <line x1={0} y1={y} x2={220} y2={y} stroke="#1f1f23" strokeWidth="1" opacity="0.7" />
            </g>
          );
        })}

        {/* curve */}
        <path d={curvePath} stroke="#818cf8" strokeWidth="2.2" fill="none" />

        {/* control points */}
        <circle cx="0" cy="120" r="3.2" fill="#6b7280" />
        <circle cx="220" cy="0" r="3.2" fill="#6b7280" />

        <circle
          cx={controlPoints.p1.cx}
          cy={controlPoints.p1.cy}
          r="6"
          fill="#a5b4fc"
          stroke="#4f46e5"
          strokeWidth="2"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setDrag("p1");
          }}
        />
        <circle
          cx={controlPoints.p2.cx}
          cy={controlPoints.p2.cy}
          r="6"
          fill="#a5b4fc"
          stroke="#4f46e5"
          strokeWidth="2"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setDrag("p2");
          }}
        />
      </svg>
    </div>
  );
}

