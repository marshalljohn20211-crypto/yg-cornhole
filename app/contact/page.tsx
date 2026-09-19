import type { Metadata } from "next";
import Image from "next/image";
import { Clock3, Mail, MapPin } from "lucide-react";
import ContactForm from "../ui/contact-form";
import SiteHeader from "../ui/site-header";
import StoreFooter from "../ui/store-footer";

export const metadata: Metadata = {
  title: "Contact YG Cornhole | Start a Custom Build",
  description: "Contact YG Cornhole about custom boards, competition bags, team apparel, and event orders.",
};

export default function ContactPage() {
  return (
    <main className="store-page brand-page">
      <SiteHeader />
      <section className="contact-hero">
        <div><span>Custom orders / Questions / Team gear</span><h1>Let&apos;s build what you throw next.</h1></div>
        <p>Tell us what you&apos;re making, who it&apos;s for, and when it needs to hit the lane. We&apos;ll help shape the right build.</p>
      </section>
      <section className="contact-layout">
        <div className="contact-brief">
          <div className="contact-brief__image"><Image src="/images/gallery/custom-board-plaid.jpeg" alt="Plaid custom cornhole board set by YG Cornhole" fill sizes="(max-width: 820px) 100vw, 42vw" /></div>
          <div className="contact-points">
            <a href="mailto:hello@ygcornhole.com"><Mail /><span><b>Email the shop</b>hello@ygcornhole.com</span></a>
            <div><Clock3 /><span><b>Typical reply</b>Within 1–2 business days</span></div>
            <div><MapPin /><span><b>Built in the USA</b>Shipping available nationwide</span></div>
          </div>
        </div>
        <ContactForm />
      </section>
      <StoreFooter />
    </main>
  );
}
