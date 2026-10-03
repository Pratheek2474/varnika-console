"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { TicketWithLinks } from "@/lib/supabase/database.types";
import { listTickets, updateTicketStatus } from "@/lib/supabase/queries-ops";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CardsListSkeleton } from "@/components/ui/page-skeletons";
import { ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useActor } from "@/lib/context/actor-context";
import { logActivity } from "@/lib/supabase/activity";

export default function TicketsPage() {
  const { actor } = useActor();
  const [tickets, setTickets] = useState<TicketWithLinks[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketWithLinks | null>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoadError(null);
      setTickets(await listTickets());
    } catch (e) {
      setLoadError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const resolveTicket = async (id: string) => {
    const target = tickets.find((t) => t.id === id);
    await updateTicketStatus(id, "resolved");
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "resolved" } : t))
    );
    if (selectedTicket?.id === id) {
      setSelectedTicket((prev) => (prev ? { ...prev, status: "resolved" } : null));
    }
    if (target) {
      await logActivity({
        actor,
        action: "resolved",
        entityType: "ticket",
        entityId: id,
        entityLabel: target.ticket_number,
        customerId: target.customer_id,
        customerName: target.customers?.customer_name ?? "",
        orderId: target.order_id,
        orderNumber: target.orders?.order_number ?? "",
      });
    }
  };

  if (loading) return <CardsListSkeleton cards={3} />;

  return (
    <RouteGuard
      requiredPermission="tickets.read"
      requiredFeature="support_tickets"
      moduleName="Client Queries"
    >
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#E6E3DB]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-black tracking-tight">
              Client Queries & Tickets
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Client requests, bespoke alteration adjustments, and order inquiries.
            </p>
          </div>
        </div>

        {loadError && (
          <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xs">
            {loadError}{" "}
            <button onClick={refresh} className="underline font-medium">Retry</button>
          </div>
        )}

        {/* Tickets List */}
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const customer = ticket.customers;
            const order = ticket.orders;
            return (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className="p-5 bg-white border border-[#E6E3DB] hover:border-black cursor-pointer transition-colors space-y-2 rounded-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-black">
                      {ticket.ticket_number}
                    </span>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {ticket.status.replace("_", " ")}
                    </Badge>
                  </div>

                  <span className="text-[11px] font-mono text-neutral-400">
                    {formatDate(ticket.created_at)}
                  </span>
                </div>

                <div className="text-sm font-medium text-black">
                  {ticket.subject}
                </div>

                <div className="text-xs text-neutral-600 line-clamp-1 bg-[#FAF9F6] p-2.5 border border-[#E6E3DB] rounded-xs">
                  "{ticket.last_message}"
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
                  <span>
                    Client:{" "}
                    {customer ? (
                      <Link
                        href={`/customers/${customer.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-black font-medium hover:underline inline-flex items-center gap-1"
                      >
                        {customer.customer_name}
                        <ExternalLink className="w-3 h-3 text-neutral-400" />
                      </Link>
                    ) : (
                      <strong className="text-black font-medium">—</strong>
                    )}
                    {order && (
                      <span className="ml-2">
                        · Order:{" "}
                        <Link
                          href={`/orders/${order.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-mono text-black hover:underline inline-flex items-center gap-1"
                        >
                          {order.order_number}
                          <ExternalLink className="w-3 h-3 text-neutral-400" />
                        </Link>
                      </span>
                    )}
                  </span>
                  <span>Assigned: {ticket.assigned_to || "—"}</span>
                </div>
              </div>
            );
          })}
          {tickets.length === 0 && !loadError && (
            <div className="text-center py-12 text-xs text-neutral-400">
              No queries found.
            </div>
          )}
        </div>

        {/* Modal */}
        {selectedTicket && (() => {
          const customer = selectedTicket.customers;
          const order = selectedTicket.orders;
          return (
            <Dialog
              open={Boolean(selectedTicket)}
              onOpenChange={(open) => !open && setSelectedTicket(null)}
            >
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-neutral-500">
                      {selectedTicket.ticket_number}
                    </span>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {selectedTicket.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <DialogTitle className="text-base font-semibold text-black">
                    {selectedTicket.subject}
                  </DialogTitle>
                  <DialogDescription>
                    Client: {customer?.customer_name ?? "—"}
                    {order && ` · Order: ${order.order_number}`}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2 text-xs">
                  <div className="p-3 bg-[#FAF9F6] border border-[#E6E3DB] rounded-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-neutral-500">Customer</span>
                      {customer ? (
                        <Link href={`/customers/${customer.id}`} className="font-medium text-black hover:underline inline-flex items-center gap-1">
                          {customer.customer_name}
                          <ExternalLink className="w-3 h-3 text-neutral-400" />
                        </Link>
                      ) : (
                        <span className="font-medium text-neutral-400">—</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-neutral-500">Order</span>
                      {order ? (
                        <Link href={`/orders/${order.id}`} className="font-mono text-black hover:underline inline-flex items-center gap-1">
                          {order.order_number}
                          <ExternalLink className="w-3 h-3 text-neutral-400" />
                        </Link>
                      ) : (
                        <span className="font-mono text-neutral-400">—</span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-[#FAF9F6] border border-[#E6E3DB] rounded-xs">
                    <span className="text-[11px] text-neutral-400">
                      Client Note:
                    </span>
                    <p className="mt-1 text-black leading-relaxed">
                      {selectedTicket.last_message}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-700">
                      Reply:
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Type your response..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="w-full p-2.5 bg-white border border-[#E6E3DB] text-xs focus:outline-none focus:border-black rounded-xs"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#F0ECE1]">
                    {selectedTicket.status !== "resolved" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resolveTicket(selectedTicket.id)}
                      >
                        Mark Resolved
                      </Button>
                    ) : (
                      <span className="text-xs text-neutral-500 font-mono">
                        Resolved
                      </span>
                    )}
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        setReplyText("");
                        setSelectedTicket(null);
                      }}
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          );
        })()}
      </div>
    </RouteGuard>
  );
}
