"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/** Bottom sheet, rendered into the phone-width overlay. */
export function Sheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => setTarget(document.getElementById("overlay")), []);
  if (!open || !target) return null;
  return createPortal(
    <div className="sheetwrap">
      <button type="button" className="backdrop" onClick={onClose} aria-label="Close" />
      <div className="bsheet" role="dialog" aria-modal="true">
        <i className="grab" />
        {children}
      </div>
    </div>,
    target
  );
}
