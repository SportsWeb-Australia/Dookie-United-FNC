import { useEffect, useRef, useState } from "react";
import { uploadToStorage } from "../lib/upload";

/**
 * Dependency-free image field with a crop/frame tool.
 * - Locks framing to a target aspect ratio per slot.
 * - Shows recommended dimensions and warns on low-resolution sources.
 * - Crops client-side to a canvas, then uploads the result to the club's
 *   Supabase Storage bucket and returns the public URL.
 */
// Image-quality coaching links. NOTE: placeholder URLs — Carson to confirm the
// real "why image quality matters" explainer + the Click Sports Media booking page.
const IMG_HELP_URL = "https://www.sportsweb.com.au/help/photo-quality";
const IMG_BOOK_URL = "https://www.clicksportsmedia.com.au/book";

export function ImageField({
  label,
  hint,
  aspect,
  targetW,
  value,
  folder,
  clubId,
  transparent = false,
  onUploaded,
}: {
  label: string;
  hint?: string;
  aspect: number; // width / height
  targetW: number; // output width in px (height derived from aspect)
  value: string;
  folder: string;
  clubId: string;
  transparent?: boolean;
  onUploaded: (url: string) => void | Promise<void>;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErr(null);
    setSrc(URL.createObjectURL(file));
  };

  const handleApply = async (blob: Blob) => {
    setBusy(true);
    setErr(null);
    try {
      const ext = transparent ? "png" : "jpg";
      const file = new File([blob], `${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.${ext}`, {
        type: transparent ? "image/png" : "image/jpeg",
      });
      const url = await uploadToStorage(file, clubId, folder);
      await onUploaded(url);
      setSrc(null);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Upload failed.");
    }
    setBusy(false);
  };

  return (
    <div className="sw-imgfield">
      <div className="sw-imgfield-label">{label}</div>
      <div className="sw-imgfield-row">
        <div className="sw-imgfield-thumb" style={{ aspectRatio: String(aspect) }}>
          {value ? <img src={value} alt="" /> : <span>No image yet</span>}
        </div>
        <div className="sw-imgfield-meta">
          {hint && <p className="sw-imgfield-hint">{hint}</p>}
          <p className="sw-imgfield-coach">
            Use the largest, sharpest photo you have — low-resolution images look blurry on big screens.{" "}
            <a href={IMG_HELP_URL} target="_blank" rel="noreferrer">Why it matters</a>
          </p>
          <button type="button" className="sw-btn sw-btn--ghost sw-btn--sm" onClick={() => inputRef.current?.click()} disabled={busy}>
            {busy ? "Uploading…" : value ? "Replace image" : "Upload image"}
          </button>
          {err && <p className="sw-imgfield-err">{err}</p>}
          <input ref={inputRef} type="file" accept="image/*" hidden onChange={pick} />
        </div>
      </div>
      {src && (
        <CropModal
          src={src}
          aspect={aspect}
          targetW={targetW}
          transparent={transparent}
          onCancel={() => setSrc(null)}
          onApply={handleApply}
        />
      )}
    </div>
  );
}

function CropModal({
  src,
  aspect,
  targetW,
  transparent,
  onCancel,
  onApply,
}: {
  src: string;
  aspect: number;
  targetW: number;
  transparent: boolean;
  onCancel: () => void;
  onApply: (blob: Blob) => void;
}) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [lowRes, setLowRes] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  // display crop box (CSS px); height derived from aspect
  const BOX_W = 360;
  const BOX_H = Math.round(BOX_W / aspect);

  useEffect(() => {
    const im = new Image();
    im.onload = () => {
      setImg(im);
      setLowRes(im.naturalWidth < targetW * 0.9);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    im.src = src;
  }, [src, targetW]);

  // cover-fit baseline: image fully covers the box at zoom = 1
  const cover = img ? Math.max(BOX_W / img.naturalWidth, BOX_H / img.naturalHeight) : 1;
  const dispW = img ? img.naturalWidth * cover * zoom : 0;
  const dispH = img ? img.naturalHeight * cover * zoom : 0;

  const clamp = (o: { x: number; y: number }) => ({
    x: Math.min(0, Math.max(BOX_W - dispW, o.x)),
    y: Math.min(0, Math.max(BOX_H - dispH, o.y)),
  });

  useEffect(() => {
    setOffset((o) => clamp(o));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, img]);

  const onDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const nx = drag.current.ox + (e.clientX - drag.current.x);
    const ny = drag.current.oy + (e.clientY - drag.current.y);
    setOffset(clamp({ x: nx, y: ny }));
  };
  const onUp = () => {
    drag.current = null;
  };

  const apply = () => {
    if (!img) return;
    const outW = targetW;
    const outH = Math.round(targetW / aspect);
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // map crop-box pixels back to source pixels
    const s = cover * zoom; // displayed px per source px
    const sx = -offset.x / s;
    const sy = -offset.y / s;
    const sW = BOX_W / s;
    const sH = BOX_H / s;
    if (!transparent) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, outW, outH);
    }
    ctx.drawImage(img, sx, sy, sW, sH, 0, 0, outW, outH);
    canvas.toBlob(
      (blob) => {
        if (blob) onApply(blob);
      },
      transparent ? "image/png" : "image/jpeg",
      0.9
    );
  };

  return (
    <div className="sw-crop-overlay" role="dialog" aria-modal="true">
      <div className="sw-crop-card">
        <div className="sw-crop-head">
          <strong>Frame your image</strong>
          <span>Drag to move · slider to zoom</span>
        </div>
        <div
          ref={boxRef}
          className="sw-crop-box"
          style={{ width: BOX_W, height: BOX_H, touchAction: "none" }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          {img && (
            <img
              src={src}
              alt=""
              draggable={false}
              style={{
                position: "absolute",
                left: offset.x,
                top: offset.y,
                width: dispW,
                height: dispH,
                maxWidth: "none",
                userSelect: "none",
              }}
            />
          )}
          <div className="sw-crop-grid" aria-hidden="true" />
        </div>
        <input
          className="sw-crop-zoom"
          type="range"
          min={1}
          max={4}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          aria-label="Zoom"
        />
        {lowRes && (
          <div className="sw-crop-warn">
            <p>Heads up: this image is smaller than the recommended size, so it may look a little soft. A larger photo will look sharper.</p>
            <p className="sw-crop-warn-cta">
              Want crisp, professional shots? SportsWeb's photography team can run a club action or media day.{" "}
              <a href={IMG_BOOK_URL} target="_blank" rel="noreferrer">Book a Click Sports Media day →</a>
            </p>
          </div>
        )}
        <div className="sw-crop-actions">
          <button type="button" className="sw-btn sw-btn--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="sw-btn" onClick={apply}>
            Use this image
          </button>
        </div>
      </div>
    </div>
  );
}
