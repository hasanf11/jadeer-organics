import { Almarai, DM_Serif_Display, El_Messiri, Plus_Jakarta_Sans } from "next/font/google";

// English: DM Serif Display (striking, high-contrast headlines) with
// Plus Jakarta Sans (clean, modern text).
export const displayEn = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display-en",
  display: "swap",
});

export const bodyEn = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body-en",
  display: "swap",
});

// Arabic: El Messiri (elegant, distinctive headlines) with Almarai
// (very readable modern text).
export const displayAr = El_Messiri({
  subsets: ["arabic", "latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display-ar",
  display: "swap",
});

export const bodyAr = Almarai({
  subsets: ["arabic"],
  weight: ["300", "400", "700", "800"],
  variable: "--font-body-ar",
  display: "swap",
});

export const fontVariables = `${displayEn.variable} ${bodyEn.variable} ${displayAr.variable} ${bodyAr.variable}`;
