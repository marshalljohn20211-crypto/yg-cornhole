import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Gauge, ShieldCheck, Target } from "lucide-react";
import { connection } from "next/server";
import { formatPrice, type Product, type Subcategory } from "../data/products";
import { getCatalog } from "../lib/catalog";
import SiteHeader from "../ui/site-header";
import StoreFooter from "../ui/store-footer";

export const metadata: Metadata = {
  title: "ACL Bags & Speed Guide | YG Cornhole",
  description: "Compare YG Cornhole ACL bag families, speed profiles, and available sets.",
};

const familyCopy: Record<string, { callout: string; use: string }> = {
  "phenom-x": { callout: "Quick confidence", use: "Clean finish speed with a composed, readable control side." },
  "felon-x": { callout: "True balance", use: "Two versatile faces for players who want options every round." },
  "menace-x": { callout: "Block to finish", use: "Grip for cuts and blocks, plus the pace to close the frame." },
  "prodigy-x": { callout: "Everyday pace", use: "Dependable push speed built for a steady tournament rotation." },
  "hellion-x": { callout: "Shape and recover", use: "Fast finish with enough control to work every part of the lane." },
};

type BagFamily = {
  subcategory: Pick<Subcategory, "slug" | "name" | "description" | "defaultPrice">;
  products: Product[];
};

function speedLabel(product?: Product) {
  if (!product || product.speedFast === undefined || product.speedControl === undefined) return null;
  return `${product.speedFast} / ${product.speedControl}`;
}

export default async function AclBagsPage() {
  await connection();
  const catalog = await getCatalog();
  const bagProducts = catalog.products.filter((product) => product.category === "cornhole-bags");
  const bagSubcategories = catalog.subcategories.filter((subcategory) => subcategory.category === "cornhole-bags");
  const groupedFamilies: BagFamily[] = bagSubcategories
    .map((subcategory) => ({
      subcategory,
      products: bagProducts.filter((product) => product.subcategory === subcategory.slug),
    }))
    .filter((family) => family.products.length > 0);
  const directProducts = bagProducts.filter((product) => !product.subcategory);
  const families: BagFamily[] = directProducts.length
    ? [
        ...groupedFamilies,
        {
          subcategory: {
            slug: "more-acl-bags",
            name: "More ACL Bags",
            description: "Individual bag sets that are not assigned to a family yet.",
          },
          products: directProducts,
        },
      ]
    : groupedFamilies;

  return (
    <main className="acl-page" id="main-content">
      <SiteHeader />

      <section className="acl-hero" aria-labelledby="acl-title">
        <div className="acl-hero__copy">
          <span>YG / ACL bag families</span>
          <h1 id="acl-title">One throw.<br />Find your finish.</h1>
          <p>Start with a bag family, compare its fast and control sides, then choose the set that fits your game.</p>
          <div className="acl-hero__actions">
            <Link href="#compare">Explore families <ArrowRight size={17} /></Link>
            <Link href="/shop?category=cornhole-bags">Shop every bag</Link>
          </div>
        </div>
        <div className="acl-hero__visual">
          <Image
            src="/images/acl-bags-workshop.jpg"
            alt="YG Cornhole bag families arranged across a workshop table"
            fill
            priority
            sizes="(max-width: 820px) 100vw, 48vw"
          />
          <div><span>Current lineup</span><strong>{groupedFamilies.length}</strong><b>ACL bag families</b></div>
        </div>
      </section>

      <section className="acl-legend" aria-label="How to read bag speeds">
        <div><Gauge /><span><b>Fast side</b>How quickly the bag finishes toward the hole.</span></div>
        <div><Target /><span><b>Control side</b>How much grip you have for blocks, cuts, and placement.</span></div>
        <div><ShieldCheck /><span><b>Family first</b>Choose a feel, then compare the available sets inside it.</span></div>
      </section>

      <section className="acl-comparison" id="compare" aria-labelledby="compare-title">
        <div className="acl-comparison__heading">
          <span>Compare the rotation</span>
          <h2 id="compare-title">Choose a family. Then pick your set.</h2>
          <p>Each family shares a playing style. The products inside it are the available designs and set variations, all managed from the store admin.</p>
        </div>

        {families.length ? (
          <>
            <nav className="acl-family-nav" aria-label="Jump to an ACL bag family">
              {families.map((family, index) => (
                <Link key={family.subcategory.slug} href={`#family-${family.subcategory.slug}`}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{family.subcategory.name}</strong>
                  <small>{family.products.length} {family.products.length === 1 ? "set" : "sets"}</small>
                </Link>
              ))}
            </nav>

            <div className="acl-family-list">
              {families.map((family, familyIndex) => {
                const profile = familyCopy[family.subcategory.slug];
                const referenceProduct = family.products.find((product) => speedLabel(product)) ?? family.products[0];
                const sharedPrice = family.subcategory.defaultPrice;
                return (
                  <section
                    className="acl-family"
                    id={`family-${family.subcategory.slug}`}
                    aria-labelledby={`family-title-${family.subcategory.slug}`}
                    key={family.subcategory.slug}
                  >
                    <header className="acl-family__header">
                      <div className="acl-family__number">{String(familyIndex + 1).padStart(2, "0")}</div>
                      <div className="acl-family__intro">
                        <span>{profile?.callout ?? "ACL bag family"}</span>
                        <h3 id={`family-title-${family.subcategory.slug}`}>{family.subcategory.name}</h3>
                        <p>{family.subcategory.description ?? profile?.use ?? "Explore the available sets in this ACL bag family."}</p>
                      </div>
                      <div className="acl-family__profile">
                        {speedLabel(referenceProduct) ? (
                          <div className="acl-speed-pair" aria-label={`${referenceProduct.speedFast} fast side, ${referenceProduct.speedControl} control side`}>
                            <div><strong>{referenceProduct.speedFast}</strong><span>Fast</span></div>
                            <i aria-hidden="true" />
                            <div><strong>{referenceProduct.speedControl}</strong><span>Control</span></div>
                          </div>
                        ) : null}
                        <span>{sharedPrice ? `${formatPrice(sharedPrice)} shared family price` : `${family.products.length} available ${family.products.length === 1 ? "set" : "sets"}`}</span>
                      </div>
                    </header>

                    <div className="acl-family__products">
                      {family.products.map((bag) => (
                        <article className="acl-family-product" key={bag.slug}>
                          <Link className="acl-family-product__image" href={`/shop/${bag.slug}`} aria-label={`View ${bag.name}`}>
                            <Image src={bag.image} alt={bag.alt} fill sizes="(max-width: 560px) 100vw, (max-width: 1100px) 50vw, 32vw" />
                            {bag.badge ? <span>{bag.badge}</span> : null}
                          </Link>
                          <div className="acl-family-product__copy">
                            <span>{bag.eyebrow}</span>
                            <h4>{bag.name}</h4>
                            <p>{bag.description}</p>
                          </div>
                          <div className="acl-family-product__footer">
                            <strong>{formatPrice(bag.price)}</strong>
                            <Link href={`/shop/${bag.slug}`}>View set <ArrowRight size={16} /></Link>
                          </div>
                        </article>
                      ))}
                    </div>

                    {family.subcategory.slug !== "more-acl-bags" ? (
                      <Link className="acl-family__shop-link" href={`/shop?category=cornhole-bags&subcategory=${family.subcategory.slug}`}>
                        Shop all {family.subcategory.name} sets <ArrowRight size={17} />
                      </Link>
                    ) : null}
                  </section>
                );
              })}
            </div>
          </>
        ) : (
          <div className="acl-family-empty">
            <span>Lineup update in progress</span>
            <h3>New ACL bag families are being prepared.</h3>
            <Link href="/shop">Browse the full shop <ArrowRight size={17} /></Link>
          </div>
        )}
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
