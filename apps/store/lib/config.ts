/** Shop-wide settings. Change here, not in screens. */
export const STITCH_FEE = 650; // added per piece when stitched to measurements
export const SHIPPING = 120; // flat shipping per order
export const STITCH_DAYS = "10–15 days";
export const READY_DAYS = "3–5 days";
export const REPLY_TIME = "Usually replies within 10 minutes";
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ""; // digits only, e.g. 919848000000

export const MEASURE_FIELDS: { key: MeasureKey; label: string; hint: string }[] = [
  { key: "chest", label: "Bust", hint: "Around the fullest part" },
  { key: "waist", label: "Waist", hint: "Around the natural waistline" },
  { key: "shoulder", label: "Shoulder", hint: "Shoulder tip to shoulder tip" },
  { key: "sleeve_length", label: "Sleeve length", hint: "Shoulder tip to where the sleeve ends" },
  { key: "sleeve_round", label: "Sleeve round", hint: "Around the arm where the sleeve ends" },
  { key: "armhole", label: "Armhole", hint: "Around the arm at the shoulder" },
  { key: "blouse_length", label: "Blouse length", hint: "Shoulder to the blouse hem" },
  { key: "front_neck_deep", label: "Front neck depth", hint: "Shoulder to neckline, front" },
  { key: "back_neck_deep", label: "Back neck depth", hint: "Shoulder to neckline, back" },
];

export type MeasureKey =
  | "chest"
  | "waist"
  | "shoulder"
  | "sleeve_length"
  | "sleeve_round"
  | "armhole"
  | "blouse_length"
  | "front_neck_deep"
  | "back_neck_deep";

export const SIZE_GUIDE = [
  ["XS", 32, 28, 13.5],
  ["S", 34, 30, 14],
  ["M", 36, 32, 14.5],
  ["L", 38, 34, 15],
  ["XL", 40, 36, 15.5],
] as const;

export const VISIT_SLOTS = ["11:00 am", "12:30 pm", "3:00 pm", "4:30 pm", "6:00 pm"];
