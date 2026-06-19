import { useEffect, useRef, type ReactNode } from "react";

/**
 * Lightweight rich-text editor. Outputs HTML into the field value, which the
 * article page renders inside .sw-prose. Dependency-free: uses a contentEditable
 * surface + the browser's formatting commands. Initialised from `value` once on
 * mount; remount it (via a key) to load a different record.
 */
export function RichText({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.innerHTML = value || "";
    // mount only — re-initialising on every value change would fight the cursor
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sync = () => {
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const exec = (command: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    sync();
  };

  const addLink = () => {
    const url = window.prompt("Link URL (include https://)");
    if (url) exec("createLink", url.trim());
  };

  // preventDefault on mousedown keeps the text selection while clicking a button
  const tool = (label: ReactNode, title: string, fn: () => void) => (
    <button type="button" title={title} onMouseDown={(e) => e.preventDefault()} onClick={fn}>
      {label}
    </button>
  );

  return (
    <div className="sw-rt">
      <div className="sw-rt-toolbar">
        {tool(<b>B</b>, "Bold", () => exec("bold"))}
        {tool(<i>I</i>, "Italic", () => exec("italic"))}
        {tool("H2", "Heading", () => exec("formatBlock", "h2"))}
        {tool("H3", "Subheading", () => exec("formatBlock", "h3"))}
        {tool("¶", "Normal text", () => exec("formatBlock", "p"))}
        {tool("• List", "Bulleted list", () => exec("insertUnorderedList"))}
        {tool("1. List", "Numbered list", () => exec("insertOrderedList"))}
        {tool("❝", "Quote", () => exec("formatBlock", "blockquote"))}
        {tool("Link", "Add link", addLink)}
        {tool("Unlink", "Remove link", () => exec("unlink"))}
        {tool("Clear", "Clear formatting", () => exec("removeFormat"))}
      </div>
      <div
        ref={ref}
        className="sw-rt-area sw-prose"
        contentEditable
        suppressContentEditableWarning
        onInput={sync}
        data-placeholder="Write the article…"
      />
    </div>
  );
}
