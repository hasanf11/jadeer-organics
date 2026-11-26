"use client";

import { PiPrinterBold } from "react-icons/pi";

export default function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-primary btn-sm">
      <PiPrinterBold /> Print
    </button>
  );
}
