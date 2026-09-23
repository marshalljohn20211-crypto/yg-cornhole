import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  ChevronRight,
  CircleCheck,
  DraftingCompass,
  Layers3,
  PackageCheck,
  Paintbrush,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import HomeMotion from "./ui/home-motion";
import SiteHeader from "./ui/site-header";

const products = [
  { name: "Phenom X", profile: "Quick / composed", speed: "7 / 4.5", price: "$89.99", image: "/images/shop/phenom-x.jpeg", alt: "Patriotic skull Phenom X cornhole bags", slug: "phenom-x-bags" },
  { name: "Felon X", profile: "True balance", speed: "7 / 5", price: "$89.99", image: "/images/shop/felon-x.jpeg", alt: "Patriotic Felon X cornhole bags", slug: "felon-x-bags" },
  { name: "Menace X", profile: "Block / finish", speed: "8 / 3", price: "$89.99", image: "/images/shop/menace-x.jpeg", alt: "Patriotic Menace X cornhole bags", slug: "menace-x-bags" },
  { name: "Prodigy X", profile: "Versatile pace", speed: "8 / 5", price: "$89.99", image: "/images/shop/prodigy-x.jpeg", alt: "Patriotic Prodigy X cornhole bags", slug: "prodigy-x-bags" },
];

const customWork = [
  { src: "/images/gallery/custom-board-detroit.jpeg", title: "Motor City Matchup", type: "Custom board set", description: "A city-first set built around hometown rivalries and league-night energy." },
  { src: "/images/gallery/eagles-board.jpeg", title: "Eagles 3373", type: "Club boards", description: "A clean club build with patriotic detail and high-contrast center artwork." },
  { src: "/images/gallery/outdoors-board.jpeg", title: "Field & Stream", type: "Custom concept", description: "Full-coverage outdoor artwork made for the cabin and the tournament lane." },
];

const faqs = [
  ["How do I choose a bag speed?", "Start with your natural throw. A flatter, harder release usually benefits from more control; a softer or higher arc often needs a quicker slide side. Our 1–10 profiles make the tradeoff easy to compare."],
  ["Are YG bags tournament legal?", "Competition models are built to ACL specifications. Look for the ACL-approved callout on the individual bag before ordering for sanctioned play."],
  ["Can you turn my idea into a board design?", "Yes. Send your colors, logos, names, or rough concept. We turn it into a production-ready proof, refine it with you, and only build after approval."],
  ["Do you make gear for leagues and events?", "We can coordinate boards, bags, jerseys, mini awards, and event graphics so your tournament or league looks like one complete program."],
];

export default function Home() {
  return (
    <main id="top">
      <HomeMotion />

      <SiteHeader />

      <section className="hero" aria-labelledby="hero-title">
        <Image
          className="hero-backdrop"
          src="/images/yg-new-site-mast.jpeg"
          alt="YG Cornhole professional apparel, ACL bags, and custom board lineup"
          fill
          priority
          sizes="100vw"
        />
        <div className="hero-shade" />
        <div className="hero-content">
          <p className="hero-kicker hero-eyebrow">Built by people who play</p>
          <h1 id="hero-title">
            <span className="hero-line">Six years of</span>
            <span className="hero-line">chasing the</span>
            <span className="hero-line">perfect throw.</span>
          </h1>
          <p className="hero-lede">YG Cornhole makes custom bags, boards, and apparel with a player’s eye for the details that actually matter: feel in the hand, consistency on the board, and gear that stands up to one more game.</p>
          <div className="hero-actions">
            <Link className="button button--teal" href="/about">Meet YG Cornhole <ArrowRight size={17} /></Link>
            <Link className="button button--outline" href="/shop">Shop all gear</Link>
          </div>
        </div>
        <div className="hero-corner">
          <span>06 years building</span>
          <strong>ACL approved</strong>
        </div>
      </section>

      <section className="trust-strip" aria-label="YG Cornhole benefits">
        <div><BadgeCheck /><span><strong>ACL approved</strong>Competition-ready bags</span></div>
        <div><Target /><span><strong>Player tuned</strong>Clear speed profiles</span></div>
        <div><Sparkles /><span><strong>Built your way</strong>Custom boards and gear</span></div>
      </section>

      <section className="category-section content-shell" aria-labelledby="category-title">
        <div className="section-header reveal-up">
          <div><span className="section-label">Bags / boards / apparel</span><h2 id="category-title">One brand. Every way to play.</h2></div>
          <Link className="arrow-link" href="/shop">Shop all gear <ArrowRight size={16} /></Link>
        </div>

        <div className="category-grid">
          <Link className="category-card category-card--bags reveal-up" href="/acl-bags">
            <Image src="/images/yg-new-site-mast.jpeg" alt="YG Cornhole professional product lineup" fill sizes="(max-width: 760px) 100vw, 50vw" />
            <div className="category-overlay" />
            <div className="category-copy"><span>Competition bags</span><h3>Find your feel.</h3><b>Shop bags <ArrowRight size={16} /></b></div>
          </Link>
          <Link className="category-card category-card--boards reveal-up" href="/shop?category=custom-boards">
            <Image src="/images/client/make-your-lane.jpg" alt="Four custom cornhole board designs featuring wood, team, patriotic, and fishing artwork" fill sizes="(max-width: 760px) 100vw, 50vw" />
            <div className="category-overlay" />
            <div className="category-copy"><span>Custom boards</span><h3>Make the lane yours.</h3><b>Build a set <ArrowRight size={16} /></b></div>
          </Link>
          <Link className="category-card category-card--apparel reveal-up" id="apparel" href="/shop?category=t-shirts">
            <Image src="/images/client/wear-the-game.jpg" alt="YG Cornhole custom hoodies and performance jerseys in team and patriotic designs" fill sizes="(max-width: 760px) 100vw, 50vw" />
            <div className="category-overlay" />
            <div className="category-copy"><span>YG apparel</span><h3>Wear the game.</h3><b>Shop apparel <ArrowRight size={16} /></b></div>
          </Link>
        </div>
      </section>

      <section className="drop-editorial" aria-labelledby="drop-title">
        <div className="drop-intro reveal-up">
          <span className="section-label section-label--light">Fresh from the shop</span>
          <h2 id="drop-title">Built loud.<br />Thrown clean.</h2>
          <p>Original personalities, serious playing surfaces. Pick the design that feels like you, then choose the speed profile that fits your release.</p>
          <Link className="button button--white" href="/shop?category=cornhole-bags">Explore the bag wall <ArrowRight size={17} /></Link>
        </div>
        <div className="drop-grid">
          <article className="drop-card drop-card--lineup reveal-clip">
            <Image src="/images/yg-new-site-mast.jpeg" alt="YG Cornhole apparel, competition bags, and custom board lineup" fill sizes="(max-width: 760px) 100vw, 55vw" />
            <div><span>More ways to play</span><strong>The full personality lineup</strong></div>
          </article>
          <article className="drop-card drop-card--cutout reveal-clip">
            <Image src="/images/pics/pic-08.png" alt="Pair of black and orange custom cornhole bags" fill sizes="(max-width: 760px) 50vw, 25vw" />
            <div><span>Hometown series</span><strong>Match-day heat</strong></div>
          </article>
          <article className="drop-card drop-card--cutout reveal-clip">
            <Image src="/images/pics/pic-16.png" alt="USA hoodie with matching custom cornhole bags" fill sizes="(max-width: 760px) 50vw, 25vw" />
            <div><span>Team collection</span><strong>Full match-day kit</strong></div>
          </article>
        </div>
      </section>

      <section className="featured-section" id="featured" aria-labelledby="featured-title">
        <div className="content-shell">
          <div className="section-header reveal-up">
            <div><span className="section-label">ACL player lineup</span><h2 id="featured-title">Choose your speed.</h2></div>
            <Link className="arrow-link" href="/acl-bags">Compare bag profiles <ArrowRight size={16} /></Link>
          </div>
          <div className="product-grid">
            {products.map((product, index) => (
              <article className="product-card reveal-up" key={product.name}>
                <div className="product-image">
                  <Image src={product.image} alt={product.alt} fill sizes="(max-width: 760px) 80vw, 25vw" />
                  <span className="product-index" aria-hidden="true">0{index + 1}</span>
                  {index === 0 && <span className="product-badge">Best seller</span>}
                </div>
                <div className="product-meta"><span>{product.profile}</span><span>Speed {product.speed}</span></div>
                <h3>{product.name}</h3>
                <div className="product-footer"><strong>{product.price}</strong><Link href={`/shop/${product.slug}`}>View bag <ChevronRight size={16} /></Link></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="profile-section content-shell" aria-labelledby="profile-title">
        <div className="profile-heading reveal-up">
          <span className="section-label">Bag finder / the quick read</span>
          <h2 id="profile-title">Don&apos;t guess at your next bag.</h2>
          <p>Every side has a job. Use these four starting points to narrow the wall before you dial in the exact fabric and fill.</p>
        </div>
        <div className="profile-grid">
          {[
            ["01", "Block", "1–4", "Maximum hold for cuts, rolls, and guarding the lane."],
            ["02", "Control", "3–6", "A forgiving setup for players who value placement first."],
            ["03", "Balanced", "5–7", "Predictable pace on both sides and an easy everyday choice."],
            ["04", "Finish", "7–10", "Quick fabric built to collect, push, and disappear in the hole."],
          ].map(([number, title, speed, description]) => (
            <article className="profile-card reveal-up" key={title}>
              <span>{number}</span><div className="profile-meter"><i style={{ width: `${Number(speed.split("–")[1]) * 10}%` }} /></div>
              <h3>{title}</h3><b>Speed {speed}</b><p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="custom-work" aria-labelledby="custom-work-title">
        <div className="custom-work-shell content-shell">
          <div className="custom-work-intro reveal-up">
            <div><span className="section-label">Recent custom work</span><h2 id="custom-work-title">Your story belongs on the boards.</h2></div>
            <p>Family traditions, hometown pride, milestone birthdays, club identity—these are not template swaps. Every set begins with the people who will play on it.</p>
          </div>
          <div className="custom-work-grid">
            {customWork.map((work, index) => (
              <article className={`custom-work-card reveal-clip${index === 0 ? " custom-work-card--feature" : ""}`} key={work.title}>
                <div className="custom-work-visual">
                  <Image
                    src={work.src}
                    alt={`${work.title} custom YG Cornhole project`}
                    fill
                    sizes={index === 0 ? "(max-width: 760px) 100vw, 62vw" : "(max-width: 760px) 100vw, (max-width: 1080px) 50vw, 25vw"}
                  />
                  <span className="custom-work-stamp">Built to play</span>
                </div>
                <div className="custom-work-details">
                  <span>{work.type}</span>
                  <h3>{work.title}</h3>
                  <p>{work.description}</p>
                </div>
              </article>
            ))}
          </div>
          <p className="portfolio-note">Selected client work shown for portfolio inspiration. Artwork and marks remain the property of their respective owners.</p>
        </div>
      </section>

      <section className="boards-banner" id="boards" aria-labelledby="boards-title">
        <Image src="/images/pics/pic-03.png" alt="Pair of blue custom family cornhole boards" fill sizes="100vw" />
        <div className="boards-shade" />
        <div className="boards-content reveal-up">
          <span className="section-label section-label--light">From blank board to game day</span>
          <h2 id="boards-title">Your design.<br />Official play.</h2>
          <p>Regulation builds, custom graphics, and the craftsmanship to become the set everyone asks about.</p>
          <Link className="button button--white" href="/contact">Start a custom set <ArrowRight size={17} /></Link>
        </div>
      </section>

      <section className="process-section content-shell" aria-labelledby="process-title">
        <div className="section-header reveal-up"><div><span className="section-label">Custom without the confusion</span><h2 id="process-title">From idea to first toss.</h2></div><p className="section-side-copy">One clear process, with a real proof before your design ever reaches the shop floor.</p></div>
        <div className="process-grid">
          <article className="reveal-up"><span>01</span><Paintbrush /><h3>Share the spark</h3><p>Send the theme, colors, logos, names, and references you want us to build around.</p></article>
          <article className="reveal-up"><span>02</span><DraftingCompass /><h3>Review the proof</h3><p>We compose the artwork and work through the details with you before production.</p></article>
          <article className="reveal-up"><span>03</span><Layers3 /><h3>Build the set</h3><p>Your approved art meets a regulation-ready structure, clean finish, and careful assembly.</p></article>
          <article className="reveal-up"><span>04</span><CircleCheck /><h3>Make it game day</h3><p>We complete a final quality check, pack the set, and get it ready for the first toss.</p></article>
        </div>
      </section>

      <section className="apparel-feature" id="apparel-feature" aria-labelledby="apparel-title">
        <div className="apparel-copy reveal-up">
          <span className="section-label section-label--light">Look like a team. Play like one.</span>
          <h2 id="apparel-title">Custom jerseys, built for your crew.</h2>
          <p>League night, a tournament run, or the whole club—carry your identity from the boards to the bracket with coordinated colors, names, and graphics.</p>
          <ul><li><CircleCheck size={17} /> Front-and-back custom layouts</li><li><CircleCheck size={17} /> Team color and sponsor placement</li><li><CircleCheck size={17} /> Individual player names available</li></ul>
          <Link className="button button--teal" href="/contact">Start a team order <ArrowRight size={17} /></Link>
        </div>
        <div className="jersey-gallery">
          <div className="jersey-image jersey-image--primary reveal-clip"><Image src="/images/pics/pic-06.png" alt="Black and gold custom team jersey shown front and back" fill sizes="(max-width: 760px) 100vw, 35vw" /></div>
          <div className="jersey-image jersey-image--secondary reveal-clip"><Image src="/images/pics/pic-16.png" alt="USA hoodie and matching custom bag set" fill sizes="(max-width: 760px) 70vw, 25vw" /></div>
        </div>
      </section>

      <section className="events-section content-shell" aria-labelledby="events-title">
        <div className="events-copy reveal-up"><span className="section-label">One event. One visual system.</span><h2 id="events-title">Give them something worth playing for.</h2><p>We can take a tournament from first impression to final award with matching event boards, mini trophies, bags, and apparel. Whether it is 16 friends or a full community bracket, the details make the day feel official.</p><div className="event-features"><span><Users /> Leagues & clubs</span><span><CalendarDays /> Birthdays & fundraisers</span><span><Trophy /> Awards & prizes</span></div></div>
        <div className="event-gallery">
          <div className="event-image event-image--one reveal-clip"><Image src="/images/pics/pic-11.png" alt="Custom mini cornhole board awards for a soccer tournament" fill sizes="(max-width: 760px) 100vw, 35vw" /></div>
          <div className="event-image event-image--two reveal-clip"><Image src="/images/pics/pic-04.png" alt="Timberfest Throwdown custom cornhole tournament awards" fill sizes="(max-width: 760px) 70vw, 24vw" /></div>
        </div>
      </section>

      <section className="reasons content-shell" aria-labelledby="reasons-title">
        <div className="section-header reveal-up"><div><span className="section-label">Why shop YG</span><h2 id="reasons-title">Made to earn a spot in your rotation.</h2></div></div>
        <div className="reason-grid">
          <article className="reveal-up"><ShieldCheck /><h3>Competition ready</h3><p>ACL-approved equipment built for serious rounds and repeatable play.</p></article>
          <article className="reveal-up"><PackageCheck /><h3>Checked by hand</h3><p>Small-shop attention from the first stitch to the final packed order.</p></article>
          <article className="reveal-up"><Target /><h3>Easy to compare</h3><p>Honest speed profiles help you pick the bag that complements your release.</p></article>
        </div>
      </section>

      <section className="faq-section content-shell" aria-labelledby="faq-title">
        <div className="faq-intro reveal-up"><span className="section-label">Straight answers</span><h2 id="faq-title">Before you throw.</h2><p>Need something more specific? Talk directly with the shop and we&apos;ll help you find the right next step.</p><Link className="arrow-link" href="/contact">Ask YG Cornhole <ArrowRight size={16} /></Link></div>
        <div className="faq-list">
          {faqs.map(([question, answer], index) => <details className="reveal-up" key={question} open={index === 0}><summary><span>0{index + 1}</span>{question}<b>+</b></summary><p>{answer}</p></details>)}
        </div>
      </section>

      <section className="testimonial-band" aria-label="Customer testimonial">
        <div className="rating" aria-label="Five out of five stars">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={18} fill="currentColor" />)}</div>
        <blockquote>“The bags broke in exactly how I hoped, and the control side is money. YG earned a permanent place in my lineup.”</blockquote>
        <p>— League player, verified buyer</p>
      </section>

      <section className="newsletter" id="newsletter">
        <div><span className="section-label section-label--light">Fresh drops. Tournament news. No filler.</span><h2>Stay in the game.</h2></div>
        <form><label htmlFor="email">Email address</label><div><input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" /><button type="button">Join the list <ArrowRight size={16} /></button></div></form>
      </section>

      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand"><Link className="brand" href="/" aria-label="YG Cornhole home"><span className="brand-mark" aria-hidden="true"><b>Y</b><b>G</b><b>B</b><b>C</b></span><span><strong>YG</strong> CORNHOLE</span></Link><p>Competition gear with a player’s point of view.</p></div>
          <div><h3>Shop</h3><Link href="/acl-bags">ACL bags</Link><Link href="/shop?category=custom-boards">Custom boards</Link><Link href="/shop?category=t-shirts">Apparel</Link></div>
          <div><h3>Help</h3><Link href="/contact">Contact us</Link><Link href="/contact">Shipping</Link><Link href="/contact">Returns</Link></div>
          <div><h3>YG Cornhole</h3><Link href="/about">Our story</Link><Link href="/acl-bags">Speed guide</Link><Link href="/acl-bags">ACL approval</Link></div>
        </div>
        <div className="footer-bottom"><span>© 2026 YG Cornhole</span><span>Made for the cornhole community.</span></div>
      </footer>
    </main>
  );
}
