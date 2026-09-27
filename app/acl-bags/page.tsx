import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Gauge, ShieldCheck, Target } from "lucide-react";
import { connection } from "next/server";
import { formatPrice } from "../data/products";
import { getCatalog } from "../lib/catalog";
import SiteHeader from "../ui/site-header";
import StoreFooter from "../ui/store-footer";

export const metadata: Metadata = {
  title: "ACL Bags & Speed Guide | YG Cornhole",
  description: "Compare fast and control-side speeds in YG Cornhole's current competition bag lineup.",
};

const feelCopy: Record<string, { callout: string; use: string }> = {
  "phenom-x-bags": { callout: "Quick confidence", use: "For a clean slide with a composed control side." },
  "felon-x-bags": { callout: "True balance", use: "For players who want two readable, versatile faces." },
  "menace-x-bags": { callout: "Block to finish", use: "For cuts and blocks that can still close the frame." },
  "prodigy-x-bags": { callout: "Everyday pace", use: "For dependable pushes and an easy tournament rotation." },
  "hellion-x-bags": { callout: "Shape and recover", use: "For a fast finish with enough grip to work the lane." },
};

export default async function AclBagsPage() {
  await connection();
  const catalog = await getCatalog();
  const aclBags = catalog.products.filter((product) => product.category === "cornhole-bags" && product.speedFast && product.speedControl);
  const heroBag = aclBags[0];

  return (
    <main className="acl-page" id="main-content">
      <SiteHeader />

      <section className="acl-hero" aria-labelledby="acl-title">
        <div className="acl-hero__copy">
          <span>YG / ACL bag lineup</span>
          <h1 id="acl-title">One throw.<br />Find your finish.</h1>
          <p>Compare both sides before you commit. The first number is the fast side; the second is the control side.</p>
          <div className="acl-hero__actions">
            <Link href="#compare">Compare bags <ArrowRight size={17} /></Link>
            <Link href="/shop?category=cornhole-bags">Shop every bag</Link>
          </div>
        </div>
        {heroBag ? <div className="acl-hero__visual">
          <Image src={heroBag.image} alt={heroBag.alt} fill priority sizes="(max-width: 820px) 100vw, 48vw" />
          <div><span>Fast / control</span><strong>{heroBag.speedFast} / {heroBag.speedControl}</strong><b>{heroBag.name}</b></div>
        </div> : null}
      </section>

      <section className="acl-legend" aria-label="How to read bag speeds">
        <div><Gauge /><span><b>Fast side</b>How quickly the bag finishes toward the hole.</span></div>
        <div><Target /><span><b>Control side</b>How much grip you have for blocks, cuts, and placement.</span></div>
        <div><ShieldCheck /><span><b>ACL Pro</b>Competition-sized sets built for serious play.</span></div>
      </section>

      <section className="acl-comparison" id="compare" aria-labelledby="compare-title">
        <div className="acl-comparison__heading">
          <span>Compare the rotation</span>
          <h2 id="compare-title">Pick the pace that matches your release.</h2>
          <p>More speed is not automatically better. Start with the shot you throw most often, then choose the control face that gives you confidence when the board gets crowded.</p>
        </div>

        <div className="acl-bag-list">
          {aclBags.map((bag, index) => {
            const feel = feelCopy[bag.slug];
            return (
              <article className="acl-bag-row" key={bag.slug}>
                <div className="acl-bag-row__number">0{index + 1}</div>
                <Link className="acl-bag-row__image" href={`/shop/${bag.slug}`} aria-label={`View ${bag.name}`}>
                  <Image src={bag.image} alt={bag.alt} fill sizes="(max-width: 720px) 100vw, 34vw" />
                </Link>
                <div className="acl-bag-row__copy">
                  <span>{feel?.callout}</span>
                  <h3>{bag.name}</h3>
                  <p>{feel?.use}</p>
                  <div className="acl-speed-pair" aria-label={`${bag.speedFast} fast side, ${bag.speedControl} control side`}>
                    <div><strong>{bag.speedFast}</strong><span>Fast</span></div>
                    <i aria-hidden="true" />
                    <div><strong>{bag.speedControl}</strong><span>Control</span></div>
                  </div>
                </div>
                <div className="acl-bag-row__action">
                  <strong>{formatPrice(bag.price)}</strong>
                  <Link href={`/shop/${bag.slug}`}>View bag <ArrowRight size={16} /></Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="acl-cta">
        <div><span>Still between two?</span><h2>Tell us how you throw.</h2></div>
        <p>Share your release, preferred shots, and the boards you play most. We will help you narrow the lineup.</p>
        <Link href="/contact">Ask the bag shop <ArrowRight size={17} /></Link>
      </section>

      <StoreFooter />
    </main>
  );
}
