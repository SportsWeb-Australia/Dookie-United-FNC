import type { ElementType } from "react";
import { useEdit } from "../../lib/edit";

/** Inline-editable text. In edit mode it becomes click-to-type; saves on blur. */
export function EditableText({
  k,
  value,
  as = "span",
  className,
}: {
  k: string;
  value: string;
  as?: ElementType;
  className?: string;
}) {
  const { canEdit, editing, value: getVal, save, busyKey } = useEdit();
  const current = getVal(k, value);
  const Tag = as;

  if (canEdit && editing) {
    return (
      <Tag
        className={`${className ?? ""} sw-editable`.trim()}
        contentEditable
        suppressContentEditableWarning
        data-busy={busyKey === k || undefined}
        onBlur={(e: { currentTarget: HTMLElement }) => {
          const text = e.currentTarget.textContent ?? "";
          if (text !== current) save(k, text);
        }}
      >
        {current}
      </Tag>
    );
  }
  return <Tag className={className}>{current}</Tag>;
}

/** Inline-editable image with a Swap button in edit mode. */
export function EditableImage({
  k,
  value,
  alt = "",
  className,
}: {
  k: string;
  value: string;
  alt?: string;
  className?: string;
}) {
  const { canEdit, editing, value: getVal, uploadImage, busyKey } = useEdit();
  const src = getVal(k, value);

  if (canEdit && editing) {
    return (
      <span className="sw-editable-img">
        {src ? <img src={src} alt={alt} className={className} /> : <span className="sw-editable-img-empty">No image</span>}
        <label className="sw-editable-img-btn">
          {busyKey === k ? "Uploading…" : "Swap image"}
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadImage(k, file);
              e.target.value = "";
            }}
          />
        </label>
      </span>
    );
  }
  return src ? <img src={src} alt={alt} className={className} /> : null;
}

/** Floating toggle — only rendered for signed-in club admins. */
export function EditToggle() {
  const { canEdit, editing, setEditing, error } = useEdit();
  if (!canEdit) return null;
  return (
    <div className="sw-edit-toggle-wrap">
      {error && <span className="sw-edit-toggle-err">{error}</span>}
      <button className={`sw-edit-toggle${editing ? " on" : ""}`} onClick={() => setEditing(!editing)}>
        {editing ? "✓ Done editing" : "✎ Edit page"}
      </button>
    </div>
  );
}
