import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 15;

type Payload = { name?: unknown; email?: unknown; location?: unknown; note?: unknown; photo?: unknown; website?: unknown };

const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]!);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Payload;
    if (clean(body.website, 100)) return NextResponse.json({ ok: true });

    const name = clean(body.name, 80);
    const email = clean(body.email, 254).toLowerCase();
    const location = clean(body.location, 120);
    const note = clean(body.note, 500);
    const photo = clean(body.photo, 11_000_000);

    if (!name || !emailPattern.test(email)) return NextResponse.json({ error: "Please check their name and email address." }, { status: 400 });
    const match = photo.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!match || match[2].length > 10_700_000) return NextResponse.json({ error: "Please choose a valid photo under 8 MB." }, { status: 400 });

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM;
    if (!apiKey || !from) return NextResponse.json({ error: "Email delivery has not been configured yet." }, { status: 503 });

    const joinUrl = process.env.NEXT_PUBLIC_JOIN_URL || "https://jointomorrow.org";
    const safeName = escapeHtml(name);
    const safeLocation = escapeHtml(location);
    const safeNote = escapeHtml(note);
    const locationPhrase = safeLocation ? ` at ${safeLocation}` : " today";
    const html = `<!doctype html><html><body style="margin:0;background:#f5f0e8;color:#080808;font-family:Arial,sans-serif"><div style="max-width:620px;margin:auto;background:#f5f0e8"><div style="background:#050505;padding:38px 34px;color:#f5f0e8"><div style="color:#3da5d9;font-weight:900;letter-spacing:4px">TC</div><p style="margin:36px 0 0;letter-spacing:3px;font-size:12px">TODAY,</p><h1 style="font-size:48px;line-height:.92;margin:8px 0 4px;letter-spacing:-2px">YOU MET<br><span style="color:#3da5d9">TOMORROW.</span></h1></div><img src="cid:meeting-photo" alt="The moment we met" style="display:block;width:100%;max-height:520px;object-fit:cover"><div style="padding:38px 34px;font-size:17px;line-height:1.65"><p>${safeName},</p><p>It was genuinely a pleasure meeting you${locationPhrase}. I promised I’d send our picture—and a little more about what we’re building.</p>${safeNote ? `<div style="border-left:4px solid #3da5d9;margin:28px 0;padding:4px 0 4px 20px;font-size:20px;font-weight:700">“${safeNote}”</div>` : ""}<h2 style="margin-top:38px;font-size:26px">TOMORROW STARTS TODAY.</h2><p>I started The Tomorrow Club because I believe too many people wait for someone else to build the future they hope to see. Tomorrow isn’t something we inherit—it’s something we create together.</p><p>If today’s conversation resonated with you, I’d love to invite you to learn more. There’s no pressure—just an open invitation.</p><p style="margin:36px 0"><a href="${escapeHtml(joinUrl)}" style="display:block;background:#3da5d9;color:#050505;text-align:center;text-decoration:none;padding:18px;font-weight:900;letter-spacing:1px">JOIN THE MOVEMENT</a></p><p style="margin-top:40px">Until tomorrow becomes today,<br><strong>Kyren Garel</strong><br><span style="color:#555">Founder, The Tomorrow Club</span></p></div><div style="background:#050505;color:#aaa;padding:22px 34px;font-size:11px;line-height:1.5">You received this personal follow-up because we met and you shared your email address. This message does not subscribe you to a mailing list.</div></div></body></html>`;

    const result = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [email],
        reply_to: "info@jointomorrow.org",
        subject: `${name}, today you met Tomorrow.`,
        html,
        attachments: [{ filename: "our-photo.jpg", content: match[2], content_id: "meeting-photo" }]
      })
    });
    const resultBody = await result.json();
    if (!result.ok) {
      console.error("Resend delivery failed", result.status, resultBody);
      return NextResponse.json({ error: "Email delivery failed. Please try again." }, { status: 502 });
    }
    return NextResponse.json({ ok: true, id: resultBody.id });
  } catch (error) {
    console.error("Introduction request failed", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
