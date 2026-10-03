"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { RouteGuard } from "@/components/layout/RouteGuard";
import ChatPage from "../page";

export default function ChatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params?.id as string | undefined;

  return (
    <RouteGuard requiredPermission="chat.read" requiredFeature="chat" moduleName="Customer Chat">
      <ChatPage initialSelectedId={chatId ?? null} />
    </RouteGuard>
  );
}