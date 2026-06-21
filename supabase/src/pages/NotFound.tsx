import { Link } from "react-router-dom";
import { PageHero } from "../components/layout/PageHero";

export function NotFound() {
  return (
    <>
      <PageHero eyebrow="Error 404" title="Page not found" intro="That page has wandered off the ground." />
      <section className="sw-section">
        <div className="sw-container">
          <Link to="/" className="sw-btn">
            Back to home
          </Link>
        </div>
      </section>
    </>
  );
}
