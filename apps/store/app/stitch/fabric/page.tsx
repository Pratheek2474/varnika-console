"use client";

import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Action } from "@/components/Shell";
import { Ico, type IconName } from "@/components/Icons";
import { Steps3, Title } from "@/components/ui";

export default function StitchFabric() {
  const router = useRouter();
  const { draft, setDraft } = useStore();
  const opts: [typeof draft.fabric, IconName, string, string][] = [
    ["mine", "box", "I'll send my fabric", "Courier it or drop it at the boutique"],
    ["varnika", "grid", "Choose from Varnika fabrics", "We share options and prices on chat"],
  ];
  return (
    <>
      <Title t="Fabric" />
      <Steps3 n={1} labels={["Measure", "Fabric", "Design"]} />
      {opts.map(([k, icon, t, s]) => (
        <button key={k} type="button" className={`option ${draft.fabric === k ? "on" : ""}`} onClick={() => setDraft({ fabric: k })}>
          <span className="oi">
            <Ico n={icon} />
          </span>
          <div>
            <b>{t}</b>
            <span>{s}</span>
          </div>
          {draft.fabric === k && <Ico n="check" />}
        </button>
      ))}
      {draft.fabric === "mine" ? (
        <div className="note">
          <Ico n="pin" />
          <span>After you send the request, we&apos;ll share the boutique address and a reference number to write on the parcel.</span>
        </div>
      ) : (
        <div className="note">
          <Ico n="chat" />
          <span>We&apos;ll send photos of matching fabrics on chat after you send the request.</span>
        </div>
      )}
      <div className="sec" style={{ paddingTop: 18 }}>
        <h3 style={{ fontSize: 19 }}>Lining</h3>
      </div>
      <div className="chips">
        {["With lining", "Without lining", "You decide"].map((g) => (
          <button key={g} type="button" className={`chip ${draft.lining === g ? "on" : ""}`} onClick={() => setDraft({ lining: g })}>
            {g}
          </button>
        ))}
      </div>
      <Action>
        <button type="button" className="btn primary" onClick={() => router.push("/stitch/design")}>
          Continue
        </button>
      </Action>
    </>
  );
}
