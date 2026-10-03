"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { useAuth } from "@/lib/context/auth-context";
import { useActor } from "@/lib/context/actor-context";
import {
  ConversationWithLinks,
  ChatMessageRow,
  ChatAttachmentRow,
} from "@/lib/supabase/database.types";
import {
  createConversation,
  getConversation,
  listConversations,
  sendMessage,
  uploadChatFile,
} from "@/lib/supabase/queries-chat";
import { listCustomers } from "@/lib/supabase/queries-customers";
import { listOrders } from "@/lib/supabase/queries-orders";
import { logActivity } from "@/lib/supabase/activity";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { CardsListSkeleton } from "@/components/ui/page-skeletons";
import { Field, inputCls, selectCls } from "@/components/forms/fields";
import {
  ArrowLeft,
  ExternalLink,
  Plus,
  Send,
  Paperclip,
  FileText,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

type ThreadMessage = ChatMessageRow & { chat_attachments: ChatAttachmentRow[] };

function AttachmentView({ att }: { att: ChatAttachmentRow }) {
  const isPhoto = att.kind === "photo" || /\.(png|jpe?g|gif|webp|avif)$/i.test(att.url);
  if (isPhoto && att.url && !att.url.startsWith("#")) {
    return (
      <div className="relative w-36 h-36 bg-[#FAF9F6] border border-[#E6E3DB] rounded-xs overflow-hidden">
        <Image src={att.url} alt={att.name || "Photo"} fill className="object-cover" />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 p-2 bg-white border border-[#E6E3DB] rounded-xs text-xs max-w-[240px]">
      <FileText className="w-4 h-4 text-neutral-400 shrink-0" />
      <div className="min-w-0">
        <div className="font-medium text-black truncate">{att.name || "File"}</div>
        {att.size_text && (
          <div className="text-[10px] font-mono text-neutral-400">{att.size_text}</div>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { permissions } = useAuth();
  const { actor } = useActor();
  const [conversations, setConversations] = useState<ConversationWithLinks[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [customers, setCustomers] = useState<{ id: string; customer_name: string }[]>([]);
  const [orders, setOrders] = useState<{ id: string; order_number: string; customer_id: string | null }[]>([]);

  const [newOpen, setNewOpen] = useState(false);
  const [newCustomerId, setNewCustomerId] = useState("");
  const [newOrderId, setNewOrderId] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newBody, setNewBody] = useState("");

  const [reply, setReply] = useState("");
  const [sendAs, setSendAs] = useState<"staff" | "customer">("staff");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const canWrite = permissions.includes("chat.write");

  const refreshList = async () => {
    try {
      setConversations(await listConversations());
    } catch (e) {
      setLoadError((e as Error).message);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const [convs, custs, ords] = await Promise.all([
          listConversations(),
          listCustomers(),
          listOrders(),
        ]);
        setConversations(convs);
        setCustomers(custs.map((c) => ({ id: c.id, customer_name: c.customer_name })));
        setOrders(
          ords.map((o) => ({ id: o.id, order_number: o.order_number, customer_id: o.customer_id }))
        );
        if (convs.length > 0) setSelectedId(convs[0].id);
      } catch (e) {
        setLoadError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setThread([]);
      return;
    }
    (async () => {
      setThreadLoading(true);
      try {
        const detail = await getConversation(selectedId);
        setThread(detail?.messages ?? []);
      } catch (e) {
        console.error(e);
      } finally {
        setThreadLoading(false);
      }
    })();
  }, [selectedId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread]);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;
  const selectedOrderId = selected?.order_id ?? null;

  const handleNewConversation = async () => {
    if (!newCustomerId || !newBody.trim()) return;
    const customerName =
      customers.find((c) => c.id === newCustomerId)?.customer_name ?? "";
    const conv = await createConversation({
      customer_id: newCustomerId,
      order_id: newOrderId || null,
      subject: newSubject.trim() || `Chat with ${customerName}`,
    });
    await sendMessage({
      conversation_id: conv.id,
      sender: "staff",
      sender_name: actor,
      body: newBody.trim(),
    });
    await logActivity({
      actor,
      action: "added",
      entityType: "conversation",
      entityId: conv.id,
      entityLabel: conv.subject,
      customerId: newCustomerId,
      customerName,
      orderId: newOrderId || null,
      orderNumber: orders.find((o) => o.id === newOrderId)?.order_number ?? "",
    });
    setNewOpen(false);
    setNewCustomerId("");
    setNewOrderId("");
    setNewSubject("");
    setNewBody("");
    await refreshList();
    setSelectedId(conv.id);
  };

  const handleSend = async () => {
    if (!selectedId || (!reply.trim() && pendingFiles.length === 0)) return;
    setSending(true);
    try {
      const uploaded = [];
      for (const file of pendingFiles) {
        const up = await uploadChatFile(selectedId, file);
        uploaded.push({
          order_id: selectedOrderId,
          kind: (file.type.startsWith("image/") ? "photo" : "file") as "photo" | "file",
          url: up.url,
          name: up.name,
          size_text: up.size,
        });
      }
      const senderName =
        sendAs === "staff"
          ? actor
          : (selected?.customers?.customer_name ?? "Customer");
      await sendMessage({
        conversation_id: selectedId,
        sender: sendAs,
        sender_name: senderName,
        body: reply.trim() || (uploaded.length > 0 ? "Shared a file." : ""),
        attachments: uploaded,
      });
      setReply("");
      setPendingFiles([]);
      const detail = await getConversation(selectedId);
      setThread(detail?.messages ?? []);
      await refreshList();
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <CardsListSkeleton cards={3} />;

  return (
    <RouteGuard requiredPermission="chat.read" requiredFeature="chat" moduleName="Customer Chat">
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#E6E3DB]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-black tracking-tight">
              Customer Chat
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Conversations with clients — shared photos and files land on the order too.
            </p>
          </div>
          {canWrite && (
            <Button variant="default" size="sm" className="h-8 text-xs shrink-0" onClick={() => setNewOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New Chat
            </Button>
          )}
        </div>

        {loadError && (
          <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xs">
            {loadError}{" "}
            <button onClick={refreshList} className="underline font-medium">Retry</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Conversation list */}
          <div className={cn("space-y-3", selectedId && "hidden lg:block")}>
            {conversations.map((conv) => {
              const last = conv.chat_messages[conv.chat_messages.length - 1];
              const isActive = conv.id === selectedId;
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className={cn(
                    "w-full text-left p-4 bg-white border transition-colors rounded-xs space-y-1.5",
                    isActive ? "border-black" : "border-[#E6E3DB] hover:border-black/40"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium text-black truncate">
                      {conv.customers?.customer_name ?? "Unknown"}
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-500 truncate">
                    {conv.subject}
                    {conv.orders && ` · ${conv.orders.order_number}`}
                  </div>
                  {last && (
                    <div className="text-[11px] text-neutral-400 truncate">
                      {last.sender_name}: {last.body}
                    </div>
                  )}
                </button>
              );
            })}
            {conversations.length === 0 && !loadError && (
              <div className="text-center py-12 text-xs text-neutral-400">
                No conversations yet.
              </div>
            )}
          </div>

          {/* Thread */}
          <div className={cn("lg:col-span-2", !selectedId && "hidden lg:block")}>
            {selected ? (
              <div className="bg-white border border-[#E6E3DB] rounded-xs flex flex-col min-h-[480px] max-h-[70vh]">
                {/* Thread header */}
                <div className="px-4 py-3 border-b border-[#E6E3DB] flex items-center gap-3">
                  <button
                    onClick={() => setSelectedId(null)}
                    className="lg:hidden p-1 text-neutral-500 hover:text-black"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-black truncate">
                      {selected.customers ? (
                        <Link href={`/customers/${selected.customers.id}`} className="underline underline-offset-2">
                          {selected.customers.customer_name}
                        </Link>
                      ) : (
                        "Unknown"
                      )}
                    </div>
                    <div className="text-[11px] text-neutral-400 truncate">
                      {selected.subject}
                      {selected.orders && (
                        <>
                          {" · "}
                          <Link href={`/orders/${selected.orders.id}`} className="underline underline-offset-2 font-mono">
                            {selected.orders.order_number}
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {threadLoading ? (
                    <div className="text-center py-8 text-xs text-neutral-400">Loading…</div>
                  ) : (
                    thread.map((msg) => {
                      const mine = msg.sender === "staff";
                      return (
                        <div key={msg.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                          <div
                            className={cn(
                              "max-w-[80%] p-3 rounded-xs space-y-2",
                              mine ? "bg-black text-white" : "bg-[#FAF9F6] border border-[#E6E3DB] text-black"
                            )}
                          >
                            <div className={cn("text-[10px] font-mono", mine ? "text-white/60" : "text-neutral-400")}>
                              {msg.sender_name}
                            </div>
                            {msg.body && <div className="text-xs leading-relaxed">{msg.body}</div>}
                            {msg.chat_attachments.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {msg.chat_attachments.map((att) => (
                                  <AttachmentView key={att.id} att={att} />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Composer */}
                {canWrite && (
                  <div className="p-3 border-t border-[#E6E3DB] space-y-2">
                    {pendingFiles.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {pendingFiles.map((f, i) => (
                          <span key={i} className="text-[11px] font-mono bg-[#F4F2ED] border border-[#E6E3DB] px-2 py-1 rounded-xs flex items-center gap-1.5">
                            {f.name}
                            <button onClick={() => setPendingFiles((p) => p.filter((_, j) => j !== i))} className="text-neutral-400 hover:text-black">✕</button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileRef}
                        type="file"
                        multiple
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files) setPendingFiles((p) => [...p, ...Array.from(e.target.files!)]);
                          e.target.value = "";
                        }}
                      />
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="p-2 border border-[#E6E3DB] hover:border-black rounded-xs text-neutral-500 hover:text-black transition-colors shrink-0"
                        title={selectedOrderId ? "Attach — will also appear on the linked order" : "Attach"}
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>
                      <input
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder={selectedOrderId ? "Reply… (attachments also go to the order)" : "Reply…"}
                        className="flex-1 px-2.5 py-2 bg-white border border-[#E6E3DB] text-xs focus:outline-none focus:border-black rounded-xs"
                      />
                      <div className="flex items-center bg-[#F4F2ED] border border-[#E6E3DB] p-0.5 rounded-xs shrink-0">
                        {(["staff", "customer"] as const).map((s) => (
                          <button
                            key={s}
                            onClick={() => setSendAs(s)}
                            title={s === "customer" ? "Preview as customer (demo)" : "Send as staff"}
                            className={cn(
                              "px-2 py-1 text-[10px] font-medium capitalize transition-all rounded-xs",
                              sendAs === s ? "bg-white text-black shadow-xs" : "text-neutral-500"
                            )}
                          >
                            {s === "staff" ? "Staff" : "Client*"}
                          </button>
                        ))}
                      </div>
                      <Button variant="default" size="sm" className="h-8 shrink-0" disabled={sending || (!reply.trim() && pendingFiles.length === 0)} onClick={handleSend}>
                        <Send className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      *Client sends simulate the customer-facing site for demo.
                      {selectedOrderId ? " Attachments auto-attach to the linked order." : " Link an order to auto-share attachments there."}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden lg:flex bg-white border border-[#E6E3DB] rounded-xs min-h-[480px] items-center justify-center text-xs text-neutral-400">
                Select a conversation.
              </div>
            )}
          </div>
        </div>

        {/* New conversation dialog */}
        {canWrite && (
          <Dialog open={newOpen} onOpenChange={setNewOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>New Chat</DialogTitle>
                <DialogDescription>Start a conversation with a client.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 py-2 text-xs">
                <Field label="Customer">
                  <select className={selectCls} value={newCustomerId} onChange={(e) => { setNewCustomerId(e.target.value); setNewOrderId(""); }}>
                    <option value="">Select…</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.customer_name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Order (optional)">
                  <select className={selectCls} value={newOrderId} onChange={(e) => setNewOrderId(e.target.value)}>
                    <option value="">None</option>
                    {orders
                      .filter((o) => !newCustomerId || o.customer_id === newCustomerId)
                      .map((o) => (
                        <option key={o.id} value={o.id}>{o.order_number}</option>
                      ))}
                  </select>
                </Field>
                <Field label="Subject" className="col-span-2">
                  <input className={inputCls} value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="e.g. Sleeve fitting" />
                </Field>
                <Field label="First Message" className="col-span-2">
                  <textarea rows={3} className={inputCls} value={newBody} onChange={(e) => setNewBody(e.target.value)} />
                </Field>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setNewOpen(false)}>Cancel</Button>
                <Button variant="default" size="sm" disabled={!newCustomerId || !newBody.trim()} onClick={handleNewConversation}>
                  Start Chat
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* External link hint */}
        <div className="text-[11px] text-neutral-400 flex items-center gap-1">
          <ExternalLink className="w-3 h-3" />
          Customer names and order numbers always link to their pages.
        </div>
      </div>
    </RouteGuard>
  );
}
