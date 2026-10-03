import { supabase } from "./client";
import {
  ChatAttachmentRow,
  ChatMessageRow,
  ConversationWithLinks,
} from "./database.types";

function throwIf(error: unknown, action: string): void {
  if (error) throw new Error(`${action}: ${(error as Error).message}`);
}

const CONVERSATION_SELECT = `
  *,
  customers (id, customer_name),
  orders (id, order_number),
  chat_messages (id, body, sender_name, created_at)
`;

export async function listConversations(): Promise<ConversationWithLinks[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select(CONVERSATION_SELECT)
    .order("last_message_at", { ascending: false });
  throwIf(error, "Failed to load conversations");
  const rows = (data ?? []) as ConversationWithLinks[];
  for (const row of rows) {
    row.chat_messages.sort((a, b) =>
      a.created_at.localeCompare(b.created_at)
    );
  }
  return rows;
}

export interface ConversationDetail {
  conversation: ConversationWithLinks;
  messages: (ChatMessageRow & { chat_attachments: ChatAttachmentRow[] })[];
}

export async function getConversation(
  id: string
): Promise<ConversationDetail | null> {
  const { data: conversation, error } = await supabase
    .from("conversations")
    .select(CONVERSATION_SELECT)
    .eq("id", id)
    .single();
  if (error && (error as { code?: string }).code !== "PGRST116") {
    throw new Error(`Failed to load conversation: ${(error as Error).message}`);
  }
  if (!conversation) return null;

  const { data: messages, error: msgError } = await supabase
    .from("chat_messages")
    .select("*, chat_attachments (*)")
    .eq("conversation_id", id)
    .order("created_at");
  throwIf(msgError, "Failed to load messages");

  return {
    conversation: conversation as ConversationWithLinks,
    messages: (messages ?? []) as (ChatMessageRow & {
      chat_attachments: ChatAttachmentRow[];
    })[],
  };
}

export async function createConversation(input: {
  customer_id: string;
  order_id?: string | null;
  subject: string;
}): Promise<ConversationWithLinks> {
  const { data, error } = await supabase
    .from("conversations")
    .insert({
      customer_id: input.customer_id,
      order_id: input.order_id || null,
      subject: input.subject,
    })
    .select(CONVERSATION_SELECT)
    .single();
  throwIf(error, "Failed to start conversation");
  const created = data as ConversationWithLinks;
  created.chat_messages = [];
  return created;
}

export async function sendMessage(input: {
  conversation_id: string;
  sender: "customer" | "staff";
  sender_name: string;
  body: string;
  attachments?: {
    order_id?: string | null;
    kind: "photo" | "file";
    url: string;
    name: string;
    size_text: string;
  }[];
}): Promise<void> {
  const { data: message, error } = await supabase
    .from("chat_messages")
    .insert({
      conversation_id: input.conversation_id,
      sender: input.sender,
      sender_name: input.sender_name,
      body: input.body,
    })
    .select("id")
    .single();
  throwIf(error, "Failed to send message");

  if (input.attachments && input.attachments.length > 0) {
    const { error: attError } = await supabase.from("chat_attachments").insert(
      input.attachments.map((a) => ({
        conversation_id: input.conversation_id,
        message_id: (message as { id: string }).id,
        order_id: a.order_id || null,
        kind: a.kind,
        url: a.url,
        name: a.name,
        size_text: a.size_text,
      }))
    );
    throwIf(attError, "Failed to attach files");
  }
}

/** Upload a chat file to the order-photos bucket, returns public URL info. */
export async function uploadChatFile(
  conversationId: string,
  file: File
): Promise<{ url: string; name: string; size: string }> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `chat/${conversationId}/${Date.now()}_${safeName}`;
  const { error } = await supabase.storage
    .from("order-photos")
    .upload(path, file, { contentType: file.type || undefined });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  const {
    data: { publicUrl },
  } = supabase.storage.from("order-photos").getPublicUrl(path);
  const kb = file.size / 1024;
  const size =
    kb < 1024 ? `${Math.max(1, Math.round(kb))} KB` : `${(kb / 1024).toFixed(1)} MB`;
  return { url: publicUrl, name: file.name, size };
}

/** All chat attachments linked to one order — shown on its page. */
export async function listOrderAttachments(
  orderId: string
): Promise<ChatAttachmentRow[]> {
  const { data, error } = await supabase
    .from("chat_attachments")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });
  throwIf(error, "Failed to load order files");
  return (data ?? []) as ChatAttachmentRow[];
}

/** All attachments for a customer (across conversations) — shown on their page. */
export async function listCustomerAttachments(
  customerId: string
): Promise<(ChatAttachmentRow & { order_number?: string })[]> {
  const { data, error } = await supabase
    .from("chat_attachments")
    .select("*, conversations!inner (customer_id), orders (order_number)")
    .eq("conversations.customer_id", customerId)
    .order("created_at", { ascending: false });
  throwIf(error, "Failed to load customer files");
  return ((data ?? []) as (ChatAttachmentRow & {
    orders: { order_number: string } | null;
  })[]).map((a) => ({
    ...a,
    order_number: a.orders?.order_number,
  }));
}
