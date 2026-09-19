"use client";

import { FormEvent, useState } from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "react-toastify";

export default function ContactForm() {
  const [projectType, setProjectType] = useState("Custom boards");

  function submitInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "");
    const email = String(form.get("email") ?? "");
    const message = String(form.get("message") ?? "");
    const subject = encodeURIComponent(`${projectType} inquiry from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nProject: ${projectType}\n\n${message}`);
    toast.info("Your email draft is ready to send.");
    window.location.href = `mailto:hello@ygcornhole.com?subject=${subject}&body=${body}`;
  }

  return (
    <form className="contact-form" onSubmit={submitInquiry}>
      <span>Project brief</span>
      <h2>Tell us what&apos;s in your head.</h2>
      <div className="contact-form__grid">
        <label>Your name<input name="name" autoComplete="name" required /></label>
        <label>Email address<input name="email" type="email" autoComplete="email" required /></label>
      </div>
      <fieldset>
        <legend>What are we building?</legend>
        <div>{["Custom boards", "Cornhole bags", "Team apparel", "Event order"].map((option) => <button key={option} type="button" className={projectType === option ? "is-selected" : ""} onClick={() => setProjectType(option)}>{option}</button>)}</div>
      </fieldset>
      <label>Project details<textarea name="message" rows={6} placeholder="Quantity, colors, artwork, deadline, and anything else we should know…" required /></label>
      <button className="contact-submit" type="submit">Open email draft <ArrowRight size={18} /></button>
      <p>Submitting opens your email app with the project brief filled in. Nothing is sent until you choose Send.</p>
    </form>
  );
}
