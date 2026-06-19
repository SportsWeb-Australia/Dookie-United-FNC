import { Link } from "react-router-dom";
import type { ReactNode } from "react";

interface Props {
  href: string;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
}

/** Internal paths ("/x") use the router; anything else opens as an external link. */
export function SmartLink({ href, className, children, ariaLabel }: Props) {
  const isInternal = href.startsWith("/");
  if (isInternal) {
    return (
      <Link to={href} className={className} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }
  return (
    <a
      href={href}
      className={className}
      aria-label={ariaLabel}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}
