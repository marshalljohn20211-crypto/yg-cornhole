import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Crosshair, Layers3, ShieldCheck } from "lucide-react";
import SiteHeader from "../ui/site-header";
import StoreFooter from "../ui/store-footer";

export const metadata: Metadata = {
  title: "About YG Cornhole | Built by People Who Play",
  description: "Meet YG Cornhole and the player-led approach behind its bags, boards, and apparel.",
};

export default function AboutPage() {
  return (
    <main className="store-page brand-page">
      <SiteHeader />
      <section className="brand-hero brand-hero--about">
        <div className="brand-hero__copy">
          <span>Built by people who play</span>
          <h1>The game is the proving ground.</h1>
          <p>YG Cornhole builds competition gear with a player&apos;s eye for the details that decide a game: release, slide, balance, durability, and identity.</p>
          <Link href="/shop">Shop the lineup <ArrowRight size={18} /></Link>
        </div>
        <div className="brand-hero__visual">
          <Image src="/images/gallery/bag-lineup.jpeg" alt="A lineup of colorful YG Cornhole competition bags" fill priority sizes="(max-width: 820px) 100vw, 48vw" />
          <div><b>YG / 2027</b><strong>Player tested</strong></div>
        </div>
      </section>

      <section className="brand-story">
        <div className="brand-story__lead"><span>Why YG</span><h2>Built loud.<br />Thrown clean.</h2></div>
        <div className="brand-story__copy">
          <p>We treat every bag, board, and jersey as part of the same system. It has to perform, it has to hold up, and it has to feel unmistakably yours when it reaches the lane.</p>
          <p>That means listening to players, sweating the small construction choices, and giving custom artwork enough room to tell the whole story.</p>
        </div>
      </section>

      <section className="brand-pillars" aria-label="What guides YG Cornhole">
        <article><Crosshair /><span>01 / Feel</span><h3>Tuned for the throw</h3><p>Profiles, surfaces, and materials are chosen around control in the hand and consistency on the board.</p></article>
        <article><Layers3 /><span>02 / Identity</span><h3>Your story, edge to edge</h3><p>Club marks, hometown pride, player personas, and milestones become equipment worth bringing to every game.</p></article>
        <article><ShieldCheck /><span>03 / Build</span><h3>Ready for another round</h3><p>Every piece is designed for repeat use—from reinforced boards to competition bags and breathable team gear.</p></article>
      </section>

      <section className="brand-work">
        <div className="brand-work__image"><Image src="/images/gallery/fishing-board.jpeg" alt="Hops and Reels custom cornhole board artwork" fill sizes="(max-width: 820px) 100vw, 55vw" /></div>
        <div className="brand-work__copy"><span>Custom starts here</span><h2>Bring us the story. We&apos;ll build the lane.</h2><p>Whether it begins with a team, a birthday, a business, or a sketch on your phone, we turn the idea into gear made to be played.</p><Link href="/contact">Start a custom build <ArrowRight size={18} /></Link></div>
      </section>
      <StoreFooter />
    </main>
  );
}
