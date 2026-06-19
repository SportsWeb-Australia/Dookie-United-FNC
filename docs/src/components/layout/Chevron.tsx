/** The diagonal triple-bar — the template's signature, drawn from the club logo. */
export function Chevron() {
  return (
    <span className="sw-chevron" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

/** Short diagonal accent rule used above section headings. */
export function AccentBars() {
  return (
    <div className="sw-accent-bars" aria-hidden="true">
      <i />
      <i />
      <i />
    </div>
  );
}
