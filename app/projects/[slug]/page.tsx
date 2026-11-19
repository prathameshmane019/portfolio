import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Project } from "@/data/projects";
import { readPortfolioContent } from "@/lib/content-store";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { projects, profile } = await readPortfolioContent();
  const project = projects.find((item) => item.slug === slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.description,
    openGraph: {
      title: `${project.title} | ${profile.name}`,
      description: project.description,
      type: "article",
    },
  };
}

function CaseImage({ project, label, imageUrl }: { project: Project; label: string; imageUrl?: string }) {
  return (
    <figure className={`detail-image ${project.confidential ? "detail-redacted" : ""}`}>
      {project.confidential ? (
        <div className="redacted-sheet">
          <span>CLIENT / ENTERPRISE WORK</span>
          <strong>{project.shortTitle.toUpperCase()}</strong>
          <i /><i /><i />
          <div className="redaction-bars"><b /><b /><b /></div>
          <small>DETAILS LIMITED</small>
        </div>
      ) : imageUrl ? (
        <Image className="detail-project-image" src={imageUrl} alt={`${project.shortTitle} — ${label.toLowerCase()}`} width={1600} height={1000} unoptimized />
      ) : (
        <div className="detail-screen">
          <div className="detail-screen-top"><span>PM / PROJECT LOG</span><span>{project.shortTitle}</span></div>
          <div className="detail-screen-body">
            <i /><i /><i />
            <div><b /><b /><b /></div>
          </div>
        </div>
      )}
      <figcaption>{label} — {project.confidential ? "REDACTED VISUAL" : imageUrl ? "PROJECT IMAGE" : "PROJECT VISUAL"}</figcaption>
      <span className="detail-image-cross">+</span>
    </figure>
  );
}

function ProjectLinks({ project }: { project: Project }) {
  return (
    <div className="detail-external-links">
      {project.live && <a href={project.live} target="_blank" rel="noreferrer">LIVE PROJECT ↗</a>}
      {project.github && <a href={project.github} target="_blank" rel="noreferrer">SOURCE CODE ↗</a>}
      {project.confidential && <span>CLIENT / ENTERPRISE WORK: DETAILS LIMITED</span>}
    </div>
  );
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const { projects } = await readPortfolioContent();
  const index = projects.findIndex((item) => item.slug === slug);
  if (index < 0) notFound();
  const project = projects[index];
  const nextProject = projects[(index + 1) % projects.length];

  return (
    <main className="case-detail">
      <div className="page-shell">
        <Link className="detail-back" href="/#work">← RETURN TO WORK INDEX</Link>
        <header className="detail-hero">
          <p className="detail-entry">CASE FILE {project.number} / {project.category.join(" · ").toUpperCase()}</p>
          <h1>{project.shortTitle}</h1>
          <p className="detail-intro">{project.description}</p>
          <ProjectLinks project={project} />
          <div className="detail-meta-strip">
            <div><span>ROLE</span><strong>{project.role}</strong></div>
            <div><span>YEAR</span><strong>{project.year}</strong></div>
            <div><span>STACK</span><strong>{project.stack.join(" / ")}</strong></div>
            <div><span>LINK</span><strong>{project.live || project.github ? "AVAILABLE ABOVE" : "PRIVATE"}</strong></div>
          </div>
        </header>

        <CaseImage project={project} label="FIG. 01" imageUrl={project.coverImage} />

        <section className="detail-story">
          <div className="detail-story-label">01 / THE PROBLEM</div>
          <div className="detail-story-copy">
            <h2>Problem<span>.</span></h2>
            <p>{project.challenge}</p>
          </div>
        </section>

        <section className="detail-story detail-story-reverse">
          <div className="detail-story-label">02 / THE BUILD</div>
          <div className="detail-story-copy">
            <h2>Build<span>.</span></h2>
            <p>{project.overview}</p>
            <ul>{project.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
          </div>
        </section>
        <section className="detail-story">
          <div className="detail-story-label">03 / THE ROLE</div>
          <div className="detail-story-copy">
            <h2>What I did<span>.</span></h2>
            <ul>{project.contribution.map((item) => <li key={item}>{item}</li>)}</ul>
            <div className="detail-stack">{project.stack.map((item) => <span key={item}>{item}</span>)}</div>
          </div>
        </section>

        <section className="detail-story detail-learned">
          <div className="detail-story-label">04 / THE TAKEAWAY</div>
          <div className="detail-story-copy">
            <h2>Learned<span>.</span></h2>
            <p>{project.learned}</p>
            <p className="detail-solution"><span>BUILD NOTE / </span>{project.solution}</p>
          </div>
        </section>

        {project.screenshots && project.screenshots.length > 0 && (
          <div className="detail-gallery">
            <span>PROJECT SCREENSHOTS / {project.screenshots.length.toString().padStart(2, "0")} IMAGES</span>
            {project.screenshots.map((imageUrl, imageIndex) => (
              <CaseImage project={project} key={imageUrl} imageUrl={imageUrl} label={`FIG. ${String(imageIndex + 2).padStart(2, "0")}`} />
            ))}
          </div>
        )}

        <Link className="next-case" href={`/projects/${nextProject.slug}`}>
          <span>NEXT CASE FILE / {nextProject.number}</span>
          <strong>{nextProject.shortTitle} <i>↗</i></strong>
        </Link>
      </div>
    </main>
  );
}
