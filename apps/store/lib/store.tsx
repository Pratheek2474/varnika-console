"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./supabase";
import { ensureCustomer, fetchProducts, lineUnit } from "./data";
import { SHIPPING, STITCH_FEE } from "./config";
import type { BagLine, Customer, Product } from "./types";
import type { Session } from "@supabase/supabase-js";

export interface StitchDraft {
  garment: string;
  measure: "saved" | "form" | "visit";
  fabric: "mine" | "varnika";
  lining: string;
  neck: string;
  sleeve: string;
  notes: string;
  photos: File[];
}

const NEW_DRAFT: StitchDraft = {
  garment: "Blouse",
  measure: "saved",
  fabric: "mine",
  lining: "With lining",
  neck: "As per photo",
  sleeve: "Elbow",
  notes: "",
  photos: [],
};

interface Ctx {
  products: Product[];
  productsLoading: boolean;
  productsError: string | null;
  reloadProducts: () => Promise<void>;
  byId: (id: string) => Product | undefined;

  ready: boolean; // auth state known
  session: Session | null;
  customer: Customer | null;
  setCustomer: (c: Customer) => void;
  sendCode: (digits: string) => Promise<void>;
  verifyCode: (digits: string, code: string) => Promise<Customer>;
  signOut: () => Promise<void>;
  requireAuth: (nextPath: string) => boolean;
  consumeAfter: () => string | null;

  bag: BagLine[];
  bagCount: number;
  bagLines: { product: Product; line: BagLine }[];
  bagSubtotal: number;
  bagMrp: number;
  payable: number;
  addToBag: (productId: string, mode: "stitch" | "ready", size: string) => void;
  setQty: (productId: string, qty: number) => void;
  clearBag: () => void;

  favs: Set<string>;
  toggleFav: (id: string) => void;

  draft: StitchDraft;
  setDraft: (patch: Partial<StitchDraft>) => void;
  resetDraft: () => void;

  toast: (msg: string) => void;
  toastMsg: string | null;
  chatContext: string | null;
  setChatContext: (c: string | null) => void;
}

const StoreContext = createContext<Ctx | null>(null);

export function useStore(): Ctx {
  const c = useContext(StoreContext);
  if (!c) throw new Error("useStore must be used inside <StoreProvider>");
  return c;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // private mode: the bag simply won't survive a reload
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const afterRef = useRef<string | null>(null);

  const [bag, setBag] = useState<BagLine[]>([]);
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [draft, setDraftState] = useState<StitchDraft>(NEW_DRAFT);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [chatContext, setChatContext] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 1900);
  }, []);

  // catalog
  const reloadProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      setProductsError(null);
      setProducts(await fetchProducts());
    } catch (e) {
      setProductsError((e as Error).message);
    } finally {
      setProductsLoading(false);
    }
  }, []);
  useEffect(() => {
    reloadProducts();
  }, [reloadProducts]);

  // bag + saved, from this device (write only after the first read, or an empty state would erase them)
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setBag(readJson<BagLine[]>("varnika-bag", []));
    setFavs(new Set(readJson<string[]>("varnika-favs", [])));
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated) writeJson("varnika-bag", bag);
  }, [bag, hydrated]);
  useEffect(() => {
    if (hydrated) writeJson("varnika-favs", Array.from(favs));
  }, [favs, hydrated]);

  // auth
  const attach = useCallback(async (s: Session | null) => {
    setSession(s);
    if (!s) {
      setCustomer(null);
      return;
    }
    try {
      setCustomer(await ensureCustomer(s.user.id, s.user.phone ?? ""));
    } catch (e) {
      console.error(e);
    }
  }, []);
  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(async ({ data }) => {
      await attach(data.session);
      if (alive) setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "SIGNED_OUT") attach(null);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [attach]);

  const sendCode = useCallback(async (digits: string) => {
    const { error } = await supabase.auth.signInWithOtp({ phone: `+91${digits}` });
    if (error) throw new Error(error.message);
  }, []);
  const verifyCode = useCallback(
    async (digits: string, code: string) => {
      const { data, error } = await supabase.auth.verifyOtp({ phone: `+91${digits}`, token: code, type: "sms" });
      if (error || !data.session) throw new Error(error?.message ?? "That code didn't work");
      const c = await ensureCustomer(data.session.user.id, `+91${digits}`);
      setSession(data.session);
      setCustomer(c);
      return c;
    },
    []
  );
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setCustomer(null);
  }, []);
  const requireAuth = useCallback(
    (nextPath: string) => {
      if (customer) return true;
      afterRef.current = nextPath;
      router.push("/sign-in");
      toast("Sign in to continue");
      return false;
    },
    [customer, router, toast]
  );
  const consumeAfter = useCallback(() => {
    const n = afterRef.current;
    afterRef.current = null;
    return n;
  }, []);

  // bag
  const byId = useCallback((id: string) => products.find((p) => p.id === id), [products]);
  const bagLines = useMemo(
    () =>
      bag
        .map((line) => ({ product: products.find((p) => p.id === line.productId) as Product, line }))
        .filter((l) => l.product),
    [bag, products]
  );
  const bagCount = bagLines.reduce((s, l) => s + l.line.qty, 0);
  const bagSubtotal = bagLines.reduce((s, l) => s + lineUnit(l.product, l.line) * l.line.qty, 0);
  const bagMrp = bagLines.reduce(
    (s, l) =>
      s + ((l.product.mrp > l.product.price ? l.product.mrp : l.product.price) + (l.line.mode === "stitch" ? STITCH_FEE : 0)) * l.line.qty,
    0
  );
  const payable = bagSubtotal + (bagCount ? SHIPPING : 0);

  const addToBag = useCallback((productId: string, mode: "stitch" | "ready", size: string) => {
    setBag((prev) => {
      const hit = prev.find((l) => l.productId === productId);
      if (hit) return prev.map((l) => (l.productId === productId ? { ...l, mode, size, qty: l.qty + 1 } : l));
      return [...prev, { productId, mode, size, qty: 1 }];
    });
  }, []);
  const setQty = useCallback((productId: string, qty: number) => {
    setBag((prev) =>
      qty <= 0 ? prev.filter((l) => l.productId !== productId) : prev.map((l) => (l.productId === productId ? { ...l, qty } : l))
    );
  }, []);
  const clearBag = useCallback(() => setBag([]), []);

  const toggleFav = useCallback((id: string) => {
    setFavs((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }, []);

  const setDraft = useCallback((patch: Partial<StitchDraft>) => setDraftState((d) => ({ ...d, ...patch })), []);
  const resetDraft = useCallback(() => setDraftState(NEW_DRAFT), []);

  const value: Ctx = {
    products,
    productsLoading,
    productsError,
    reloadProducts,
    byId,
    ready,
    session,
    customer,
    setCustomer,
    sendCode,
    verifyCode,
    signOut,
    requireAuth,
    consumeAfter,
    bag,
    bagCount,
    bagLines,
    bagSubtotal,
    bagMrp,
    payable,
    addToBag,
    setQty,
    clearBag,
    favs,
    toggleFav,
    draft,
    setDraft,
    resetDraft,
    toast,
    toastMsg,
    chatContext,
    setChatContext,
  };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
