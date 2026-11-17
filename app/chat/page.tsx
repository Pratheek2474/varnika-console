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
  getConversation,
  listConversations,
  sendMessage,
  uploadChatFile,
} from "@/lib/supabase/queries-chat";
import { listOrders } from "@/lib/supabase/queries-orders";
import { Button } from "@/components/ui/button";
import { CardsListSkeleton } from "@/components/ui/page-skeletons";
import {
  ArrowLeft,
  ExternalLink,
  Send,
  Paperclip,
  FileText,
  RefreshCw,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Message } from "@/components/ui/message";
import { MessageScroller } from "@/components/ui/message-scroller";
import { Attachment } from "@/components/ui/attachment";

type ThreadMessage = ChatMessageRow & { chat_attachments: ChatAttachmentRow[] };

const AVATAR_COLORS = [
  "bg-wine",
  "bg-gold",
  "bg-sage",
  "bg-wine-2",
  "bg-neutral-600",
];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function AttachmentView({ att }: { att: ChatAttachmentRow }) {
  const isPhoto =
    att.kind === "photo" || /\.(png|jpe?g|gif|webp|avif)$/i.test(att.url);
  return (
    <Attachment
      name={att.name || "File"}
      type={isPhoto ? "photo" : "file"}
      size={att.size_text || undefined}
      url={att.url && !att.url.startsWith("#") ? att.url : undefined}
    />
  );
}

export default function ChatPage() {
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const initialSelectedId = searchParams?.get("c") ?? null;
  const { permissions } = useAuth();
  const { actor } = useActor();
  const [conversations, setConversations] = useState<ConversationWithLinks[]>(
    [],
  );
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId ?? null);
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [orders, setOrders] = useState<
    { id: string; order_number: string; customer_id: string | null }[]
  >([]);
  const [reply, setReply] = useState("");

  const [pendingFiles, setPendingFiles] = useState<{ file: File; previewUrl?: string }[]>([]);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const canWrite = permissions.includes("chat.write");

  const refreshList = async () => {
    try {
      setConversations(await listConversations());
    } catch (e) {
      setLoadError((e as Error).message);
    }
  };

  useEffect(() => {
    if (initialSelectedId) setSelectedId(initialSelectedId);
  }, [initialSelectedId]);

  // Sync selection when URL param changes
  useEffect(() => {
    if (initialSelectedId !== undefined) {
      setSelectedId(initialSelectedId);
    }
  }, [initialSelectedId]);

  useEffect(() => {
    (async () => {
      try {
        const [convs, ords] = await Promise.all([
          listConversations(),
          listOrders(),
        ]);
        setConversations(convs);
        setOrders(
          ords.map((o) => ({
            id: o.id,
            order_number: o.order_number,
            customer_id: o.customer_id,
          })),
        );
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

  const selected = conversations.find((c) => c.id === selectedId) ?? null;
  const latestOrderForCustomer = selected?.customer_id
    ? (orders.find((o) => o.customer_id === selected.customer_id) ?? null)
    : null;
  const effectiveOrderId =
    selected?.order_id ?? latestOrderForCustomer?.id ?? null;
  const effectiveOrderNumber =
    selected?.orders?.order_number ??
    latestOrderForCustomer?.order_number ??
    "";

  const handleSend = async () => {
    if (!selectedId || (!reply.trim() && pendingFiles.length === 0)) return;
    setSending(true);
    try {
      const uploaded = [];
      for (const { file } of pendingFiles) {
        const up = await uploadChatFile(selectedId, file);
        uploaded.push({
          order_id: effectiveOrderId,
          kind: (file.type.startsWith("image/") ? "photo" : "file") as
            | "photo"
            | "file",
          url: up.url,
          name: up.name,
          size_text: up.size,
        });
      }
      await sendMessage({
        conversation_id: selectedId,
        sender: "staff",
        sender_name: actor,
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
      toast.error(`Could not send: ${(e as Error).message}`);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <CardsListSkeleton cards={3} />;

  return (
    <RouteGuard
      requiredPermission="chat.read"
      requiredFeature="chat"
      moduleName="Customer Chat"
    >
      <div className="h-[calc(100dvh-3.5rem)] lg:h-[calc(100dvh-3.5rem)] flex flex-col bg-ivory overflow-hidden">
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* ─── Conversation list ─── */}
          <div
            className={cn(
              "w-full lg:w-80 border-r border-line bg-white flex flex-col overflow-hidden min-h-0",
              selectedId && "hidden lg:flex",
            )}
          >
            {/* List header: "Chats" + search + refresh + new */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-line shrink-0">
              <h1 className="text-lg">Chats</h1>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    refreshList();
                    if (selectedId)
                      getConversation(selectedId).then((d) =>
                        setThread(d?.messages ?? []),
                      );
                  }}
                  className="p-1.5 border border-line hover:border-wine rounded-full text-neutral-500 hover:text-black transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {loadError && (
              <div className="mx-3 mt-2 p-2.5 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xs shrink-0">
                {loadError}{" "}
                <button onClick={refreshList} className="underline font-medium">
                  Retry
                </button>
              </div>
            )}

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {conversations.map((conv) => {
                const last = conv.chat_messages[conv.chat_messages.length - 1];
                const isActive = conv.id === selectedId;
                const latestOrder =
                  conv.orders ??
                  orders.find((o) => o.customer_id === conv.customer_id);
                const name = conv.customers?.customer_name ?? "Unknown";
                return (
                  <Link
                    key={conv.id}
                    href={`/chat/${conv.id}`}
                    onClick={() => setSelectedId(conv.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 border-b border-line-soft hover:bg-ivory transition-colors flex items-center gap-3",
                      isActive && "bg-sunk",
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm shrink-0",
                        avatarColor(name),
                      )}
                    >
                      {name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            "text-sm font-medium truncate",
                            isActive ? "text-black" : "text-neutral-700",
                          )}
                        >
                          {name}
                        </span>
                        {last && (
                          <span className="text-[10px] text-neutral-400 shrink-0 ml-2 font-mono">
                            {new Date(last.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-xs text-neutral-500 truncate flex-1 avatarColor(name)">
                          {last
                            ? `${last.sender_name}: ${last.body}`
                            : "No messages yet"}
                        </span>
                        {latestOrder && (
                          <span className="text-[10px] text-neutral-400 shrink-0 ml-2 font-mono">
                            {latestOrder.order_number}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
              {conversations.length === 0 && !loadError && (
                <div className="text-center py-12 text-xs text-neutral-400">
                  No conversations yet.
                </div>
              )}
            </div>
          </div>

          {/* ─── Chat thread ─── */}
          <div
            className={cn(
              "flex-1 flex flex-col bg-sunk min-h-0",
              !selectedId && "hidden lg:flex",
            )}
          >
            {selected ? (
              <>
                {/* Thread header — fixed to top */}
                <div className="px-3 py-2 border-b border-line bg-white flex items-center gap-3 shrink-0">
                  <Link
                    href="/chat"
                    onClick={() => setSelectedId(null)}
                    className="lg:hidden p-1.5 text-neutral-500 hover:text-black"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Link>
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm shrink-0",
                      avatarColor(selected.customers?.customer_name ?? "?"),
                    )}
                  >
                    {selected.customers?.customer_name.charAt(0) ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-black truncate">
                      {selected.customers ? (
                        <Link
                          href={`/customers/${selected.customers.id}`}
                          className="underline underline-offset-2"
                        >
                          {selected.customers.customer_name}
                        </Link>
                      ) : (
                        "Unknown"
                      )}
                    </div>
                    <div className="text-[11px] text-neutral-400 truncate">
                      {selected.subject}
                      {effectiveOrderId && (
                        <>
                          {" · "}
                          <Link
                            href={`/orders/${effectiveOrderId}`}
                            className="underline underline-offset-2 font-mono"
                          >
                            {selected.orders
                              ? selected.orders.order_number
                              : effectiveOrderNumber}{" "}
                            · Latest order
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages — only this scrolls */}
                <MessageScroller onLoadMore={() => {}}>
                  {threadLoading ? (
                    <div className="text-center py-8 text-xs text-neutral-400">
                      Loading…
                    </div>
                  ) : (
                    thread.map((msg) => (
                      <Message
                        key={msg.id}
                        variant={msg.sender === "staff" ? "own" : "default"}
                        senderName={msg.sender_name}
                        timestamp={new Date(msg.created_at).toLocaleTimeString(
                          [],
                          { hour: "2-digit", minute: "2-digit" },
                        )}
                      >
                        {msg.body && <div>{msg.body}</div>}
                        {msg.chat_attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {msg.chat_attachments.map((att) => (
                              <AttachmentView key={att.id} att={att} />
                            ))}
                          </div>
                        )}
                      </Message>
                    ))
                  )}
                </MessageScroller>

                {/* Composer — fixed to bottom */}
                {canWrite && (
                  <div className="px-3 py-2.5 border-t border-line bg-white shrink-0">
                    {pendingFiles.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {pendingFiles.map(({ file, previewUrl }, i) => (
                          <Attachment
                            key={i}
                            name={file.name}
                            type={
                              file.type.startsWith("image/") ? "photo" : "file"
                            }
                            size={`${Math.max(1, Math.round(file.size / 1024))} KB`}
                            url={previewUrl}
                            onRemove={() =>
                              setPendingFiles((p) =>
                                p.filter((_, j) => j !== i),
                              )
                            }
                          />
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileRef}
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            const files = Array.from(e.target.files).map((file) => ({
                              file,
                              previewUrl: file.type.startsWith("image/")
                                ? URL.createObjectURL(file)
                                : undefined,
                            }));
                            setPendingFiles((p) => [...p, ...files]);
                          }
                          e.target.value = "";
                        }}
                      />
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="p-2 border border-line hover:border-wine rounded-full text-neutral-500 hover:text-black transition-colors shrink-0"
                        title={
                          effectiveOrderId
                            ? "Attach — will also appear on the customer and latest order"
                            : "Attach"
                        }
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>
                      <input
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        placeholder="Message…"
                        className="flex-1 px-3.5 py-2 bg-sunk border border-line text-sm focus:outline-none focus:border-wine rounded-full"
                      />
                      <Button
                        variant="default"
                        size="sm"
                        className="h-9 w-9 p-0 rounded-full shrink-0"
                        disabled={
                          sending ||
                          (!reply.trim() && pendingFiles.length === 0)
                        }
                        onClick={handleSend}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-1.5 text-center">
                      {effectiveOrderId
                        ? "Attachments also appear on the customer page and the latest order."
                        : "Attachments stay in chat."}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex bg-white items-center justify-center text-xs text-neutral-400">
                Select a conversation.
              </div>
            )}
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
