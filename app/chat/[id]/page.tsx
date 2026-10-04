"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
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
  sendMessage,
  uploadChatFile,
} from "@/lib/supabase/queries-chat";
import { listOrders } from "@/lib/supabase/queries-orders";
import { Button } from "@/components/ui/button";
import { CardsListSkeleton } from "@/components/ui/page-skeletons";
import { ArrowLeft, Send, Paperclip } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Message } from "@/components/ui/message";
import { MessageScroller } from "@/components/ui/message-scroller";
import { Attachment } from "@/components/ui/attachment";

type ThreadMessage = ChatMessageRow & { chat_attachments: ChatAttachmentRow[] };

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

export default function ChatDetailPage() {
  const params = useParams();
  const chatId = params?.id as string | undefined;
  const { permissions } = useAuth();
  const { actor } = useActor();

  const [thread, setThread] = React.useState<ThreadMessage[]>([]);
  const [threadLoading, setThreadLoading] = React.useState(true);
  const [reply, setReply] = React.useState("");
  const [pendingFiles, setPendingFiles] = React.useState<{ file: File; previewUrl?: string }[]>([]);
  const [sending, setSending] = React.useState(false);
  const [orders, setOrders] = React.useState<{ id: string; order_number: string; customer_id: string | null }[]>([]);
  const [conversation, setConversation] = React.useState<ConversationWithLinks | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const canWrite = permissions.includes("chat.write");

  useEffect(() => {
    if (!chatId) return;
    (async () => {
      setThreadLoading(true);
      try {
        const [detail, ords] = await Promise.all([
          getConversation(chatId),
          listOrders(),
        ]);
        setConversation(detail?.conversation ?? null);
        setThread(detail?.messages ?? []);
        setOrders(ords.map((o) => ({ id: o.id, order_number: o.order_number, customer_id: o.customer_id })));
      } catch (e) {
        console.error(e);
        toast.error((e as Error).message);
      } finally {
        setThreadLoading(false);
      }
    })();
  }, [chatId]);

  const latestOrderForCustomer = conversation?.customer_id
    ? (orders.find((o) => o.customer_id === conversation.customer_id) ?? null)
    : null;
  const effectiveOrderId = conversation?.order_id ?? latestOrderForCustomer?.id ?? null;

  const handleSend = async () => {
    if (!chatId || (!reply.trim() && pendingFiles.length === 0)) return;
    setSending(true);
    try {
      const uploaded = [];
      for (const { file } of pendingFiles) {
        const up = await uploadChatFile(chatId, file);
        uploaded.push({
          order_id: effectiveOrderId,
          kind: (file.type.startsWith("image/") ? "photo" : "file") as "photo" | "file",
          url: up.url,
          name: up.name,
          size_text: up.size,
        });
      }
      await sendMessage({
        conversation_id: chatId,
        sender: "staff",
        sender_name: actor,
        body: reply.trim() || (uploaded.length > 0 ? "Shared a file." : ""),
        attachments: uploaded,
      });
      setReply("");
      pendingFiles.forEach((p) => p.previewUrl && URL.revokeObjectURL(p.previewUrl));
      setPendingFiles([]);
      const detail = await getConversation(chatId);
      setThread(detail?.messages ?? []);
    } catch (e) {
      console.error(e);
      toast.error(`Could not send: ${(e as Error).message}`);
    } finally {
      setSending(false);
    }
  };

  if (threadLoading && !conversation) return <CardsListSkeleton cards={3} />;

  return (
    <RouteGuard requiredPermission="chat.read" requiredFeature="chat" moduleName="Customer Chat">
      <div className="h-[100dvh] lg:h-[calc(100dvh-3.5rem)] flex flex-col bg-[#FAF9F6] overflow-hidden">
        {/* Thread header — fixed to top */}
        <div className="px-3 py-2 border-b border-[#E6E3DB] bg-white flex items-center gap-3 shrink-0">
          <Link href="/chat" className="lg:hidden p-1.5 text-neutral-500 hover:text-black">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-medium text-sm shrink-0">
            {conversation?.customers?.customer_name.charAt(0) ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-black truncate">
              {conversation?.customers ? (
                <Link href={`/customers/${conversation.customers.id}`} className="underline underline-offset-2">
                  {conversation.customers.customer_name}
                </Link>
              ) : (
                "Unknown"
              )}
            </div>
            {effectiveOrderId && (
              <div className="text-[11px] text-neutral-400 truncate">
                <Link href={`/orders/${effectiveOrderId}`} className="underline underline-offset-2 font-mono">
                  {conversation?.orders?.order_number ?? latestOrderForCustomer?.order_number} · Latest order
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <MessageScroller onLoadMore={() => {}}>
          {threadLoading ? (
            <div className="text-center py-8 text-xs text-neutral-400">Loading…</div>
          ) : (
            thread.map((msg) => (
              <Message
                key={msg.id}
                variant={msg.sender === "staff" ? "own" : "default"}
                senderName={msg.sender_name}
                timestamp={new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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

        {/* Composer */}
        {canWrite && (
          <div className="px-3 py-2.5 border-t border-[#E6E3DB] bg-white shrink-0">
            {pendingFiles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {pendingFiles.map(({ file, previewUrl }, i) => (
                  <Attachment
                    key={i}
                    name={file.name}
                    type={file.type.startsWith("image/") ? "photo" : "file"}
                    size={`${Math.max(1, Math.round(file.size / 1024))} KB`}
                    url={previewUrl}
                    onRemove={() => setPendingFiles((p) => p.filter((_, j) => j !== i))}
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
                      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
                    }));
                    setPendingFiles((p) => [...p, ...files]);
                  }
                  e.target.value = "";
                }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="p-2 border border-[#E6E3DB] hover:border-black rounded-full text-neutral-500 hover:text-black transition-colors shrink-0"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Message…"
                className="flex-1 px-3.5 py-2 bg-[#F4F2ED] border border-[#E6E3DB] text-sm focus:outline-none focus:border-black rounded-full"
              />
              <Button variant="default" size="sm" className="h-9 w-9 p-0 rounded-full shrink-0" disabled={sending || (!reply.trim() && pendingFiles.length === 0)} onClick={handleSend}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}