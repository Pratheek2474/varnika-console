import Link from "next/link";
import { READY_DAYS, STITCH_DAYS } from "@/lib/config";
import { Title } from "@/components/ui";

const STEPS: [string, string][] = [
  ["Choose a style or ask for your own", "Browse the catalog, or send a custom request from the Stitch tab."],
  ["Tell us your size", "Use saved measurements, fill the measurement sheet, or book a store visit."],
  ["Pay to confirm", "Orders are confirmed once payment is received. We share the payment details on chat."],
  ["We stitch it", "Follow every stage in Orders. Message us any time."],
  [`Shipped in ${STITCH_DAYS}`, `Standard sizes ship in ${READY_DAYS}. Shipping charges apply and are shown before you order.`],
];

const FAQS: [string, string][] = [
  ["Can I change the design of a catalog piece?", "Yes. Tap “Want a change to this design?” on the product page and tell us what you'd like."],
  ["Can I send my own fabric?", "Yes. Choose “I'll send my fabric” in the Stitch flow. We share the address after your request."],
  ["What if it doesn't fit?", "Message us from the order page. We'll look at the fit with you and arrange an alteration."],
  ["How do I contact Varnika?", "Use chat or WhatsApp from the top of any screen."],
];

export default function Help() {
  return (
    <>
      <Title t="How to order" />
      <ol className="howto">
        {STEPS.map(([t, s], i) => (
          <li key={t}>
            <i className="tab">{i + 1}</i>
            <div>
              <b>{t}</b>
              <span>{s}</span>
            </div>
          </li>
        ))}
      </ol>
      <div className="sec">
        <h3 style={{ fontSize: 19 }}>Common questions</h3>
      </div>
      <div className="faq">
        {FAQS.map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
      <div style={{ padding: "18px 16px 0" }}>
        <Link className="btn outline block" href="/chat">
          Still have a question? Chat with us
        </Link>
      </div>
    </>
  );
}
