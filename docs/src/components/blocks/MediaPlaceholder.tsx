import { Chevron } from "../layout/Chevron";

interface Props {
  label?: string;
  ratio?: string;
  className?: string;
}

/**
 * Branded stand-in for a photo/video. Swap for a real <img>/<video> when assets
 * are supplied — it carries the club gradient so layouts read correctly now.
 */
export function MediaPlaceholder({ label = "Photo placeholder", ratio = "16 / 9", className }: Props) {
  return (
    <div
      className={`sw-media-ph${className ? ` ${className}` : ""}`}
      style={{ aspectRatio: ratio }}
      role="img"
      aria-label={label}
    >
      <Chevron />
      <span className="sw-media-ph-label">{label}</span>
    </div>
  );
}
