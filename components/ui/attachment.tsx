"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { FileText, Image as ImageIcon, X, Download } from "lucide-react";

interface AttachmentProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  type?: "photo" | "file" | "pdf" | "doc" | "other";
  size?: string;
  url?: string;
  status?: "uploading" | "done" | "error";
  progress?: number;
  onRemove?: () => void;
  action?: React.ReactNode;
}

function Attachment({ className, name, type = "other", size, url, status, progress, onRemove, action, ...props }: AttachmentProps) {
  const Icon = type === "photo" ? ImageIcon : FileText;
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 p-2.5 bg-white border border-[#E6E3DB] rounded-xs max-w-[240px]",
        className
      )}
      {...props}
    >
      <div className="w-9 h-9 rounded-xs bg-[#F4F2ED] flex items-center justify-center shrink-0">
        <Icon className="w-4.5 h-4.5 text-neutral-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-black truncate">{name}</div>
        {size && <div className="text-[10px] text-neutral-400 font-mono">{size}</div>}
        {status === "uploading" && progress !== undefined && (
          <div className="w-full h-1 bg-[#F0ECE1] rounded-full mt-1">
            <div className="h-full bg-black rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
      {action ?? (
        onRemove ? (
          <button onClick={onRemove} className="p-1 text-neutral-400 hover:text-black">
            <X className="w-3.5 h-3.5" />
          </button>
        ) : url ? (
          <a href={url} target="_blank" rel="noreferrer" className="p-1 text-neutral-400 hover:text-black">
            <Download className="w-3.5 h-3.5" />
          </a>
        ) : null
      )}
    </div>
  );
}

export { Attachment };