"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { getConversationId, listMessages, sendChat } from "@/lib/data";
import { REPLY_TIME } from "@/lib/config";
import { timeOf } from "@/lib/format";
import { Action } from "@/components/Shell";
import { Ico } from "@/components/Icons";
import { ErrorBox, Loading, SignInPrompt } from "@/components/ui";
import type { ChatMessage } from "@/lib/types";

const QUICK = ["Where is my order?", "Change my measurements", "Custom design enquiry", "Price for stitching"];

export default function Chat() {
  const { customer, ready, chatContext, setChatContext } = useStore();
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [convo, setConvo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const aboutSent = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!customer) return;
    let alive = true;
    const pull = async (first: boolean) => {
      try {
        const id = convo ?? (await getConversationId(customer, false));
        if (!alive) return;
        if (id) {
          setConvo(id);
          setMsgs(await listMessages(id));
        }
        if (first) setLoading(false);
      } catch (e) {
        if (alive) {
          setErr((e as Error).message);
          setLoading(false);
        }
      }
    };
    pull(true);
    const t = setInterval(() => pull(false), 8000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [customer, convo]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [msgs.length]);

  if (!ready) return <Loading rows={2} />;
  if (!customer) return <SignInPrompt what="your chat with Varnika" next="/chat" />;

  const send = async (raw: string) => {
    const t = raw.trim();
    if (!t || sending) return;
    setSending(true);
    setErr(null);
    const body = chatContext && !aboutSent.current ? `(About ${chatContext}) ${t}` : t;
    try {
      await sendChat(customer, body);
      aboutSent.current = true;
      setText("");
      const id = convo ?? (await getConversationId(customer, false));
      if (id) {
        setConvo(id);
        setMsgs(await listMessages(id));
      }
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="chathead">
        <span className="avatar">V</span>
        <div>
          <b>Varnika team</b>
          <span>{REPLY_TIME} · 10 am to 8 pm</span>
        </div>
      </div>
      {chatContext && (
        <div className="note" style={{ marginTop: 0 }}>
          <Ico n="tag" />
          <span>
            About: <b>{chatContext}</b>{" "}
            <button type="button" className="link" onClick={() => setChatContext(null)} style={{ marginLeft: 6 }}>
              Clear
            </button>
          </span>
        </div>
      )}
      {err && <ErrorBox message={err} />}
      <div className="thread">
        {loading ? (
          <Loading rows={2} />
        ) : msgs.length ? (
          msgs.map((m) => (
            <div key={m.id} className={`msg ${m.sender === "customer" ? "me" : ""}`}>
              <p>{m.body}</p>
              <small>{timeOf(m.created_at)}</small>
            </div>
          ))
        ) : (
          <div className="msg">
            <p>Namaste! This is the Varnika team. How can we help you today?</p>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="chips quick">
        {QUICK.map((q) => (
          <button key={q} type="button" className="chip" onClick={() => send(q)}>
            {q}
          </button>
        ))}
      </div>
      <Action>
        <form
          className="chatbar"
          onSubmit={(e) => {
            e.preventDefault();
            send(text);
          }}
        >
          <input type="text" placeholder="Write a message" autoComplete="off" value={text} onChange={(e) => setText(e.target.value)} />
          <button type="submit" className="btn primary sm" disabled={sending || !text.trim()}>
            Send
          </button>
        </form>
      </Action>
    </>
  );
}
