import { Link } from "react-router-dom";

/**
 * About page — brand identity layout ported from preview/full-site.html.
 * Values cards (Street Culture, Hip-Hop Culture, Brotherhood) are hardcoded design
 * elements with CSS flame animation; they are not CMS-editable by intent.
 */
export default function AboutPage() {
  return (
    <div className="container cms-page cms-page--about">
      <h1 className="page-title">About Mashood</h1>
      <div className="cms-body">
        <p className="about-tagline">Not made to follow. Made to lead.</p>
        <p>MASHOOD was born for those who refuse to stay in line.</p>
        <p>
          Rooted in hip-hop culture, street culture, graffiti, music, and the
          raw energy of the streets, we create clothing that represents
          individuality, confidence, and self-expression.
        </p>
        <p>
          We don&apos;t chase trends.
          <br />
          We create pieces that carry meaning.
        </p>
        <p>
          Every graphic, every fabric, and every detail is designed to remind
          you that your story deserves to be worn.
        </p>

        <hr className="cms-divider" />
        <h2>Our Values</h2>

        <div className="values-grid">
          <ValueCard
            title="Street Culture"
            body="Streetwear is more than clothing — it's a language. Every piece we create reflects the creativity, resilience, and attitude born from the streets."
          />
          <ValueCard
            title="Hip-Hop Culture"
            body="Hip-hop has always been about authenticity, expression, and turning struggle into art. That mindset shapes everything we design — from our graphics to the stories behind every collection."
          />
          <ValueCard
            title="Brotherhood"
            body="Built for the people who stand beside you. For the nights you'll never forget. For the ones who were there before anyone else."
          />
        </div>

        <hr className="cms-divider" />
        <h2>Our Approach</h2>
        <p>Quality over quantity.</p>
        <p>
          Every MASHOOD drop is produced in limited numbers because clothing
          should feel personal — not disposable.
        </p>
        <p>
          Every collection tells a different story, inspired by the culture that
          raised us and the people who continue to shape who we are.
        </p>

        <hr className="cms-divider" />
        <h2>For My Homies in the Hood</h2>
        <p>More than a slogan.</p>
        <p>
          It&apos;s a tribute to where we started, the people who shaped us,
          and the ones who stay beside us no matter how far the road goes.
        </p>
        <p>
          Because no matter where life takes you, you never forget your homies.
        </p>

        <p className="about-closing">Welcome to MASHOOD</p>
      </div>
    </div>
  );
}

/**
 * Single value card with CSS flame + ember animation effect.
 * @param {{ title: string, body: string }} props
 */
function ValueCard({ title, body }) {
  return (
    <div className="value-card">
      <div className="value-card__fire" aria-hidden="true">
        <span className="flame flame--1" />
        <span className="flame flame--2" />
        <span className="flame flame--3" />
        <span className="flame flame--4" />
        <span className="ember ember--1" />
        <span className="ember ember--2" />
        <span className="ember ember--3" />
      </div>
      <div className="value-card__inner">
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
    </div>
  );
}
