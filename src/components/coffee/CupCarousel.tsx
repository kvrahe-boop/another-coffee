import { useRef } from "react";
import type { Drink } from "@/lib/coffee-data";

type Props = {
  drinks: Drink[];
  index: number;
  onIndexChange: (i: number) => void;
  onSelect: (drink: Drink) => void;
  compact?: boolean;
};

/** Cups queue: the current cup takes most of the screen, next cups peek behind it. */
export function CupCarousel({ drinks, index, onIndexChange, onSelect, compact }: Props) {
  const startX = useRef<number | null>(null);
  const moved = useRef(false);

  const go = (dir: 1 | -1) => {
    const next = Math.min(drinks.length - 1, Math.max(0, index + dir));
    if (next !== index) onIndexChange(next);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
    moved.current = false;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startX.current !== null && Math.abs(e.clientX - startX.current) > 8) moved.current = true;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
  };

  return (
    <div
      className={`relative w-full select-none touch-pan-y transition-[height] duration-500 ${
        compact ? "h-[36vh]" : "h-[72vh]"
      }`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (startX.current = null)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
      tabIndex={0}
      aria-roledescription="carrossel"
      aria-label="Bebidas"
    >
      {drinks.map((drink, k) => {
        const offset = k - index;
        let style: React.CSSProperties;
        if (offset === 0) {
          style = { transform: "translate(-50%, 0) scale(1)", opacity: 1, zIndex: 30 };
        } else if (offset > 0) {
          const o = Math.min(offset, 3);
          style = {
            transform: `translate(calc(-50% + ${o * 24}%), ${-o * 7}%) scale(${1 - o * 0.2})`,
            opacity: o > 2 ? 0 : 0.85 - o * 0.3,
            zIndex: 30 - o * 10,
            filter: `blur(${o * 1.2}px)`,
          };
        } else {
          style = { transform: "translate(-160%, 6%) scale(1.05)", opacity: 0, zIndex: 0 };
        }
        return (
          <button
            key={drink.id}
            type="button"
            aria-label={`${drink.name}, abrir opções`}
            aria-hidden={offset !== 0}
            tabIndex={offset === 0 ? 0 : -1}
            onClick={() => {
              if (moved.current) return;
              if (offset === 0) onSelect(drink);
              else if (offset > 0) onIndexChange(k);
            }}
            className={`absolute left-1/2 bottom-0 h-full origin-bottom transition-all duration-[650ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform ${
              offset === 0 ? "cursor-pointer" : "pointer-events-none"
            }`}
            style={style}
          >
            <img
              src={drink.image}
              alt={drink.name}
              width={1024}
              height={1536}
              loading={k === 0 ? "eager" : "lazy"}
              draggable={false}
              className={`h-full w-auto scale-[1.38] translate-y-[14%] object-contain drop-shadow-[0_40px_50px_rgba(60,40,15,0.28)] ${
                offset === 0 && !compact ? "animate-float-cup" : ""
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
