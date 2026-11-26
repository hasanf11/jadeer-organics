import "server-only";

import ExcelJS from "exceljs";

/** Build a styled .xlsx download. */
export async function excelResponse(
  filename: string,
  sheetName: string,
  columns: { header: string; key: string; width?: number }[],
  rows: Record<string, string | number | null>[],
): Promise<Response> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Ja'deer Organics";
  const sheet = workbook.addWorksheet(sheetName, { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = columns.map((c) => ({ ...c, width: c.width ?? 18 }));
  // Prevent spreadsheet formula injection from customer-typed text.
  sheet.addRows(rows.map((row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [k, typeof v === "string" && /^[=+\-@\t\r]/.test(v) ? `'${v}` : v]))));
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2F8F3A" } };
  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
