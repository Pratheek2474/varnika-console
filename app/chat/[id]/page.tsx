"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ChatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params?.id as string | undefined;

  useEffect(() => {
    if (chatId) {
      router.replace(`/chat?c=${chatId}`);
    } else {
      router.replace("/chat");
    }
  }, [chatId, router]);

  return null;
}