import { useParams } from "react-router-dom";
import { useClub } from "../components/ClubContext";
import { PageHero } from "../components/layout/PageHero";
import { SmartLink } from "../components/SmartLink";
import { MediaEmbed } from "../components/blocks/MediaEmbed";
import { NotFound } from "./NotFound";
import { useSeo } from "../lib/seo";
import { slugify } from "../lib/slug";
import { formatDate } from "../lib/format";

export function NewsArticle() {
  const { slug } = useParams();
  const { club } = useClub();

  const post = club.news.find((p) => (p.slug ?? slugify(p.title)) === slug) ?? null;

  useSeo(
    post
      ? { title: `${post.title} | ${club.identity.name}`, description: post.excerpt }
      : null
  );

  if (!post) return <NotFound />;

  const others = club.news.filter((p) => p !== post).slice(0, 3);
  const byline = [post.author, formatDate(post.date)].filter(Boolean).join(" · ");

  return (
    <>
      <PageHero eyebrow={post.category} title={post.title} intro={byline} />

      <section className="sw-section">
        <div className="sw-container sw-article">
          <div className="sw-article-main">
            {post.image && <img className="sw-article-cover" src={post.image} alt="" />}

            {post.content ? (
              <div className="sw-prose" dangerouslySetInnerHTML={{ __html: post.content }} />
            ) : (
              <p className="sw-lead">{post.excerpt}</p>
            )}

            {post.video && <MediaEmbed url={post.video} title={post.title} />}

            <SmartLink href="/news" className="sw-link-arrow" >
              ← Back to all news
            </SmartLink>
          </div>

          {others.length > 0 && (
            <aside className="sw-article-side">
              <div className="sw-side-card">
                <h4>More news</h4>
                <ul>
                  {others.map((p) => (
                    <li key={p.id}>
                      <SmartLink href={`/news/${p.slug ?? slugify(p.title)}`}>{p.title}</SmartLink>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          )}
        </div>
      </section>
    </>
  );
}
