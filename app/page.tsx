"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";

type Step = "welcome" | "photo" | "details" | "preview" | "sending" | "success";
type Details = { name: string; email: string; location: string; note: string; website: string };

const blank: Details = { name: "", email: "", location: "", note: "", website: "" };

function Mark({ small = false }: { small?: boolean }) {
  return <div className={`mark ${small ? "markSmall" : ""}`}><img src="/tc-logo.png" alt="The Tomorrow Club" /></div>;
}

export default function Home() {
  const [step, setStep] = useState<Step>("welcome");
  const [photo, setPhoto] = useState("");
  const [details, setDetails] = useState<Details>(blank);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [step]);

  async function readPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Please choose a photo.");
    if (file.size > 20_000_000) return setError("That photo is too large. Please choose one under 20 MB.");
    try {
      const source = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Photo could not be read."));
        reader.readAsDataURL(file);
      });
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error("Photo could not be opened."));
        element.src = source;
      });
      const maxSide = 1600;
      const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Photo could not be prepared.");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      setPhoto(canvas.toDataURL("image/jpeg", 0.78));
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Photo could not be prepared.");
    }
  }

  function update(key: keyof Details, value: string) { setDetails((current) => ({ ...current, [key]: value })); }

  function preview(event: FormEvent) {
    event.preventDefault();
    if (!details.name.trim() || !details.email.trim()) return setError("Add their name and email to continue.");
    setError(""); setStep("preview");
  }

  async function send() {
    setError(""); setStep("sending");
    try {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...details, photo })
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 413) throw new Error("The photo was too large to send. Please retake it.");
      if (!response.ok) throw new Error(data.error || "The introduction could not be sent.");
      setTimeout(() => setStep("success"), 650);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The introduction could not be sent.");
      setStep("preview");
    }
  }

  function restart() { setPhoto(""); setDetails(blank); setError(""); setStep("photo"); if (inputRef.current) inputRef.current.value = ""; }

  return <main className={`app step-${step}`}>
    <header className="topbar"><Mark small /><span>FOUNDER EDITION <i>1.0</i></span></header>

    {step === "welcome" && <section className="screen welcome">
      <div className="welcomeCenter"><Mark /><p className="eyebrow">A PERSONAL INTRODUCTION</p><h1>I MET<br /><em>TOMORROW.</em></h1><p className="intro">Every conversation deserves a follow-up.</p></div>
      <button className="primary" onClick={() => setStep("photo")}>BEGIN <span>→</span></button>
    </section>}

    {step === "photo" && <section className="screen">
      <p className="stepLabel">01 / THE MOMENT</p><h2>Take our<br /><em>picture.</em></h2>
      <button className={`photoFrame ${photo ? "hasPhoto" : ""}`} onClick={() => inputRef.current?.click()} aria-label="Take or choose a photo">
        {photo ? <img src={photo} alt="Our meeting" /> : <div><span className="camera">＋</span><strong>CAPTURE THE MOMENT</strong><small>Tap to open your camera</small></div>}
      </button>
      <input ref={inputRef} className="fileInput" type="file" accept="image/*" onChange={readPhoto} />
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary" disabled={!photo} onClick={() => setStep("details")}>USE THIS PHOTO <span>→</span></button>
      {photo && <button className="textButton" onClick={() => inputRef.current?.click()}>RETAKE</button>}
    </section>}

    {step === "details" && <section className="screen">
      <p className="stepLabel">02 / THE CONNECTION</p><h2>Who did Tomorrow<br /><em>meet today?</em></h2>
      <form onSubmit={preview}>
        <label>Today I met…<input autoFocus value={details.name} onChange={(e) => update("name", e.target.value)} placeholder="Their name" maxLength={80} required /></label>
        <label>Their email is…<input type="email" autoCapitalize="none" autoCorrect="off" inputMode="email" value={details.email} onChange={(e) => update("email", e.target.value)} placeholder="name@example.com" maxLength={254} required /></label>
        <label>We met at… <small>OPTIONAL</small><input value={details.location} onChange={(e) => update("location", e.target.value)} placeholder="Event, place, or city" maxLength={120} /></label>
        <label>One thing I want them to remember… <small>OPTIONAL</small><textarea value={details.note} onChange={(e) => update("note", e.target.value)} placeholder="Write one personal sentence…" maxLength={500} rows={4} /><span className="count">{details.note.length} / 500</span></label>
        <label className="honeypot" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={details.website} onChange={(e) => update("website", e.target.value)} /></label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="primary" type="submit">PREVIEW THEIR EMAIL <span>→</span></button>
      </form>
    </section>}

    {step === "preview" && <section className="screen previewScreen">
      <p className="stepLabel">03 / THE INTRODUCTION</p><h2>Before you<br /><em>send.</em></h2>
      <div className="emailPreview">
        <div className="emailHead"><Mark small /><p>TODAY,</p><h3>YOU MET<br /><span>TOMORROW.</span></h3></div>
        {photo && <img className="emailPhoto" src={photo} alt="The moment we met" />}
        <div className="emailBody"><p>{details.name},</p><p>It was a pleasure meeting you{details.location ? ` at ${details.location}` : " today"}. I promised I’d send our picture—and a little more about what we’re building.</p>{details.note && <blockquote>“{details.note}”</blockquote>}<h4>TOMORROW STARTS TODAY.</h4><p>I started The Tomorrow Club because tomorrow isn’t something we inherit—it’s something we create together.</p><div className="fakeButton">JOIN THE MOVEMENT</div><p className="signature">Until tomorrow becomes today,<br /><strong>Kyren Garel</strong><br />Founder, The Tomorrow Club</p></div>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary" onClick={send}>SEND MY INTRODUCTION <span>→</span></button>
      <button className="textButton" onClick={() => setStep("details")}>EDIT DETAILS</button>
    </section>}

    {step === "sending" && <section className="screen status"><Mark /><p className="stepLabel">INTRODUCING TOMORROW…</p><div className="progress"><span /></div></section>}

    {step === "success" && <section className="screen status success"><div className="check">✓</div><p className="stepLabel">INTRODUCTION DELIVERED</p><h2>TOMORROW<br />HAS BEEN<br /><em>INTRODUCED.</em></h2><p>One conversation can change tomorrow.</p><button className="primary" onClick={restart}>MEET SOMEONE ELSE <span>→</span></button></section>}
  </main>;
}
