import { useState } from "react";

/**
 * A small blue "?" circle that opens a short explanation popover. Use anywhere a
 * field or label needs a bit more context. Mobile-friendly: tap to open, tap
 * outside to close.
 *
 *   <HelpDot example="Est. 1952 · Melbourne's East">
 *     A short kicker line above your main heading.
 *   </HelpDot>
 */
export function HelpDot({
  label = "More info",
  children,
  example,
  href,
}: {
  label?: string;
  children?: React.ReactNode;
  example?: string;
  href?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <span style={{ position: "relative", display: "inline-flex", verticalAlign: "middle" }}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          setOpen((o) => !o);
        }}
        style={{
          width: 17,
          height: 17,
          borderRadius: "50%",
          background: "var(--accent, #2F6BFF)",
          color: "#fff",
          border: "none",
          fontSize: 11,
          fontWeight: 800,
          lineHeight: "17px",
          cursor: "pointer",
          padding: 0,
          marginLeft: 6,
          flex: "none",
        }}
      >
        ?
      </button>

      {open && (
        <>
          {/* outside-click catcher */}
          <span
            onClick={() => setOpen(false)}
            aria-hidden="true"
            style={{ position: "fixed", inset: 0, zIndex: 39 }}
          />
          <span
            role="tooltip"
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              zIndex: 40,
              width: "min(280px, 80vw)",
              background: "#fff",
              color: "#344054",
              border: "1px solid #e6e8ec",
              borderRadius: 10,
              boxShadow: "0 8px 24px rgba(16,24,40,0.14)",
              padding: "0.75rem 1.9rem 0.75rem 0.85rem",
              fontSize: "0.85rem",
              lineHeight: 1.5,
              fontWeight: 400,
              textTransform: "none",
              letterSpacing: "normal",
              whiteSpace: "normal",
            }}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={(e) => {
                e.preventDefault();
                setOpen(false);
              }}
              style={{
                position: "absolute",
                top: 4,
                right: 4,
                width: 22,
                height: 22,
                borderRadius: 6,
                border: "none",
                background: "none",
                color: "#98a2b3",
                fontSize: 16,
                lineHeight: "22px",
                cursor: "pointer",
                padding: 0,
              }}
            >
              ×
            </button>
            {children}
            {example && (
              <span style={{ display: "block", marginTop: "0.5rem", color: "#475467" }}>
                <strong style={{ fontWeight: 700 }}>Example:</strong> {example}
              </span>
            )}
            {href && (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-block",
                  marginTop: "0.55rem",
                  color: "var(--accent, #2F6BFF)",
                  fontWeight: 600,
                }}
              >
                Learn more →
              </a>
            )}
          </span>
        </>
      )}
    </span>
  );
}
