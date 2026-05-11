import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Glimmora brand mark.
 *
 * The source image (`public/relocate-logo.png`, intrinsic 1656×447) is a
 * full brand lockup — symbol + wordmark + tagline. Rendering it at a
 * square size would squash the artwork, so we anchor on `height` and let
 * the width derive from the natural aspect ratio.
 *
 * Public API stays back-compat:
 *   - `size` (legacy): used as `height` if `height` isn't provided.
 *   - `height`: preferred prop for new call sites.
 *   - `withWordmark`: kept in the type so existing callers don't break,
 *     but is a no-op because the image already contains the wordmark.
 *   - `className`: passes through to the wrapper.
 */
interface GlimmoraMarkProps {
  className?: string;
  /** Render height in px (preferred). Width derives from natural aspect. */
  height?: number;
  /** Legacy. Treated as height. */
  size?: number;
  /** No-op: kept for back-compat. The logo image already includes the wordmark. */
  withWordmark?: boolean;
}

// Intrinsic dimensions of public/relocate-logo.png. Hard-coding the
// aspect ratio means the layout knows the rendered width before the image
// loads, which prevents CLS (cumulative layout shift) in the headers.
const INTRINSIC_W = 1656;
const INTRINSIC_H = 447;
const ASPECT = INTRINSIC_W / INTRINSIC_H; // ≈ 3.70

export function GlimmoraMark({
  className,
  height,
  size,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  withWordmark: _withWordmark = true,
}: GlimmoraMarkProps) {
  const h = height ?? size ?? 32;
  const w = Math.round(h * ASPECT);

  return (
    <span className={cn("inline-flex items-center align-middle", className)}>
      <Image
        src="/relocate-logo.png"
        alt="Glimmora"
        width={INTRINSIC_W}
        height={INTRINSIC_H}
        priority
        // Inline style sets the rendered box; explicit width+height attrs
        // above tell next/image the real dimensions for the srcSet.
        style={{ height: h, width: w }}
        className="select-none object-contain"
      />
    </span>
  );
}
