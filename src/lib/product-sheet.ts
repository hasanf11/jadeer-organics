import "server-only";

import ExcelJS from "exceljs";
import { BADGES, BADGE_KEYS, type BadgeKey } from "@/lib/badges";
import { parseDollars, slugify } from "@/lib/format";

// ---------------------------------------------------------------------------
// The products spreadsheet: one row per size. The same layout is used for the
// empty template, the export of current products and the import, so an admin
// can export, edit in Excel and import the file back.
// ---------------------------------------------------------------------------

type ColumnKey =
  | "name"
  | "name_ar"
  | "category"
  | "size"
  | "size_ar"
  | "price"
  | "compare_at"
  | "stock"
  | "status"
  | "bestseller"
  | "labels"
  | "tagline"
  | "tagline_ar"
  | "description"
  | "description_ar"
  | "ingredients"
  | "ingredients_ar"
  | "how_to_use"
  | "how_to_use_ar"
  | "sort_order"
  | "sku"
  | "slug";

type Column = {
  key: ColumnKey;
  header: string;
  width: number;
  required?: boolean;
  arabic?: boolean;
  product?: boolean; // a product detail (only needed on the product's first row)
  note: string;
  aliases?: string[];
};

export const PRODUCT_COLUMNS: Column[] = [
  { key: "name", header: "Name (English)", width: 28, required: true, note: "The product name. Rows with the same name (or web address) are sizes of the same product.", aliases: ["name", "product", "product name"] },
  { key: "name_ar", header: "Name (Arabic)", width: 24, arabic: true, product: true, note: "Shown on the Arabic site." },
  { key: "category", header: "Category", width: 22, product: true, note: "Pick from the list." },
  { key: "size", header: "Size", width: 14, required: true, note: "For example 250 ml, 500 g, 1 L or Pack. One row per size.", aliases: ["size (english)", "size name"] },
  { key: "size_ar", header: "Size (Arabic)", width: 14, arabic: true, note: "Optional. For example ٥٠٠ مل." },
  { key: "price", header: "Price ($)", width: 11, required: true, note: "In US dollars, for example 6.50", aliases: ["price", "price usd"] },
  { key: "compare_at", header: "Price before sale ($)", width: 14, note: "Optional. Fill it to show a sale (crossed-out price). Type 0 to remove a sale.", aliases: ["price before sale", "compare at price", "old price"] },
  { key: "stock", header: "Stock", width: 9, note: "How many you have now. Leave empty to keep the current stock.", aliases: ["stock quantity", "quantity", "qty"] },
  { key: "status", header: "Status", width: 12, product: true, note: "Published (visible in the shop), Draft (hidden) or Archived. New products are Published if left empty." },
  { key: "bestseller", header: "Bestseller", width: 11, product: true, note: "Yes to show it in “Bestsellers” on the home page.", aliases: ["featured", "show in bestsellers"] },
  { key: "labels", header: "Labels", width: 26, product: true, note: `Separate with commas. Allowed: ${BADGE_KEYS.map((k) => BADGES[k].label).join(", ")}.`, aliases: ["badges", "tags"] },
  { key: "tagline", header: "Short tagline (English)", width: 32, product: true, note: "One short sentence under the name.", aliases: ["tagline"] },
  { key: "tagline_ar", header: "Short tagline (Arabic)", width: 32, arabic: true, product: true, note: "", aliases: ["tagline arabic"] },
  { key: "description", header: "Description (English)", width: 44, product: true, note: "", aliases: ["description"] },
  { key: "description_ar", header: "Description (Arabic)", width: 44, arabic: true, product: true, note: "" },
  { key: "ingredients", header: "Ingredients (English)", width: 32, product: true, note: "", aliases: ["ingredients"] },
  { key: "ingredients_ar", header: "Ingredients (Arabic)", width: 32, arabic: true, product: true, note: "" },
  { key: "how_to_use", header: "How to use / storage (English)", width: 32, product: true, note: "", aliases: ["how to use", "how to use (english)"] },
  { key: "how_to_use_ar", header: "How to use / storage (Arabic)", width: 32, arabic: true, product: true, note: "", aliases: ["how to use (arabic)"] },
  { key: "sort_order", header: "Display order", width: 10, product: true, note: "Optional. Smaller numbers appear first.", aliases: ["sort order", "order"] },
  { key: "sku", header: "SKU", width: 14, note: "Optional. Your own code for this size." },
  { key: "slug", header: "Web address", width: 28, note: "Leave empty for new products (it is made from the name). Don't change it for existing products: it is how they are matched.", aliases: ["slug", "url"] },
];

export const MAX_IMPORT_ROWS = 2000;
const STATUS_VALUES = ["Published", "Draft", "Archived"];
const FIRST_DATA_ROW = 2;
const LAST_VALIDATED_ROW = MAX_IMPORT_ROWS + 1;

const columnLetter = (index: number) => {
  let n = index + 1;
  let s = "";
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
};

/** Text that Excel would run as a formula is stored as plain text. */
const safe = (value: string | number | null | undefined) =>
  typeof value === "string" && /^[=+\-@\t\r]/.test(value) ? `'${value}` : value ?? null;

export type SheetRow = Partial<Record<ColumnKey, string | number | null>>;

/** The products workbook (empty for the template, or filled for an export). */
export async function productWorkbook(rows: SheetRow[], categories: { name: string; name_ar: string }[]): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Ja'deer Organics";

  const sheet = workbook.addWorksheet("Products", { views: [{ state: "frozen", xSplit: 1, ySplit: 1 }] });
  sheet.columns = PRODUCT_COLUMNS.map((c) => ({ header: c.required ? `${c.header} *` : c.header, key: c.key, width: c.width }));
  for (const row of rows) sheet.addRow(Object.fromEntries(Object.entries(row).map(([k, v]) => [k, safe(v)])));

  const header = sheet.getRow(1);
  header.height = 34;
  PRODUCT_COLUMNS.forEach((c, i) => {
    const cell = header.getCell(i + 1);
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: c.required ? "FFE0592A" : c.product ? "FF1F5A36" : "FF146B66" } };
    cell.alignment = { vertical: "middle", wrapText: true };
    if (c.note) cell.note = c.note;
    const column = sheet.getColumn(i + 1);
    if (c.arabic) column.alignment = { horizontal: "right", readingOrder: "rtl", vertical: "top", wrapText: true };
    else if (["description", "ingredients", "how_to_use"].includes(c.key)) column.alignment = { vertical: "top", wrapText: true };
    if (c.key === "price" || c.key === "compare_at") column.numFmt = "0.00";
  });

  // Drop-down lists, kept on a hidden sheet.
  const lists = workbook.addWorksheet("Lists", { state: "hidden" });
  lists.getColumn(1).values = ["Category", ...categories.map((c) => c.name)];
  lists.getColumn(2).values = ["Status", ...STATUS_VALUES];
  lists.getColumn(3).values = ["Bestseller", "Yes", "No"];
  const range = (key: ColumnKey) => {
    const letter = columnLetter(PRODUCT_COLUMNS.findIndex((c) => c.key === key));
    return `${letter}${FIRST_DATA_ROW}:${letter}${LAST_VALIDATED_ROW}`;
  };
  const list = (key: ColumnKey, formula: string, prompt: string) =>
    // `dataValidations` exists on worksheets at runtime but is missing from the type definitions.
    (sheet as unknown as { dataValidations: { add: (range: string, rule: object) => void } }).dataValidations.add(range(key), {
      type: "list",
      allowBlank: true,
      formulae: [formula],
      showErrorMessage: true,
      errorStyle: "warning",
      errorTitle: "Not in the list",
      error: prompt,
    });
  if (categories.length) list("category", `Lists!$A$2:$A$${categories.length + 1}`, "Please pick a category from the list.");
  list("status", "Lists!$B$2:$B$4", "Use Published, Draft or Archived.");
  list("bestseller", "Lists!$C$2:$C$3", "Use Yes or No.");

  // Instructions in plain words.
  const help = workbook.addWorksheet("How to use");
  help.getColumn(1).width = 30;
  help.getColumn(2).width = 90;
  const lines: [string, string][] = [
    ["How to import products", ""],
    ["1. One row per size", "A product sold in 250 ml and 500 ml takes two rows with the same name. Fill the product details (category, description…) on its first row; the other rows only need the name, size, price and stock."],
    ["2. Required columns", "The orange columns: Name (English), Size and Price ($). Everything else is optional."],
    ["3. New or existing?", "Products are matched by their Web address. New products are created; existing ones are updated. Empty cells keep what is already saved, so you can import only the columns you want to change."],
    ["4. Sizes", "Sizes are matched by their name (for example 500 ml). New sizes are added; sizes not in the file are left as they are."],
    ["5. Stock", "Type how many you have now. The difference is saved in the stock history. Leave it empty to keep the current stock."],
    ["6. Photos", "Add photos afterwards from Admin → Products → (the product) → Photos."],
    ["7. Import", "Save the file, then in Admin → Products → Import, choose it. You will see a preview and any mistakes (with their row numbers) before anything is saved."],
    ["", ""],
    ["Categories", categories.map((c) => `${c.name}${c.name_ar ? ` (${c.name_ar})` : ""}`).join(", ") || "Create categories first in Admin → Categories."],
    ["Labels", BADGE_KEYS.map((k) => BADGES[k].label).join(", ")],
    ["Status", "Published = visible in the shop · Draft = hidden · Archived = old product"],
    ["", ""],
    ["Example", ""],
  ];
  lines.forEach((line, i) => {
    const row = help.addRow(line);
    row.alignment = { vertical: "top", wrapText: true };
    if (i === 0 || line[0] === "Example") row.font = { bold: true, size: i === 0 ? 16 : 12, color: { argb: "FF1F5A36" } };
    else row.getCell(1).font = { bold: true };
  });
  const exampleHeader = help.addRow(["Name (English)", "Size · Price ($) · Stock · Category"]);
  exampleHeader.font = { bold: true };
  help.addRow(["Extra Virgin Olive Oil", "500 ml · 12 · 20 · Oils & Vinegars (first row: also category, description…)"]);
  help.addRow(["Extra Virgin Olive Oil", "1 L · 22 · 10 (second size: name, size, price and stock are enough)"]);

  return workbook.xlsx.writeBuffer() as Promise<ArrayBuffer>;
}

// ---------------------------------------------------------------------------
// Reading an uploaded file.
// ---------------------------------------------------------------------------

export type ImportVariant = {
  label: string;
  label_ar: string | null;
  sku: string | null;
  price_cents: number | null;
  compare_at_cents: number | null;
  stock: number | null;
};

export type ImportProduct = {
  slug: string;
  name: string;
  name_ar: string | null;
  category_id: string | null;
  status: "published" | "draft" | "archived" | null;
  is_featured: boolean | null;
  badges: BadgeKey[] | null;
  tagline: string | null;
  tagline_ar: string | null;
  description: string | null;
  description_ar: string | null;
  ingredients: string | null;
  ingredients_ar: string | null;
  how_to_use: string | null;
  how_to_use_ar: string | null;
  sort_order: number | null;
  variants: ImportVariant[];
};

export type ImportIssue = { row: number | null; message: string };

export type ExistingCatalog = {
  categories: { id: string; name: string; name_ar: string; slug: string }[];
  products: { slug: string; name: string; variants: { label: string; price_cents: number }[] }[];
};

export type ParsedImport = {
  products: ImportProduct[];
  errors: ImportIssue[];
  warnings: ImportIssue[];
};

const normalizeHeader = (value: string) =>
  value
    .toLowerCase()
    .replace(/\*/g, "")
    .replace(/\s+/g, " ")
    .trim();

const LIMITS: Partial<Record<ColumnKey, number>> = {
  name: 120,
  name_ar: 120,
  size: 40,
  size_ar: 40,
  tagline: 200,
  tagline_ar: 200,
  description: 10000,
  description_ar: 10000,
  ingredients: 3000,
  ingredients_ar: 3000,
  how_to_use: 3000,
  how_to_use_ar: 3000,
  sku: 60,
  slug: 130,
};

/** The text of a cell, whatever Excel stored in it (numbers, rich text, links, formulas). */
function cellText(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") {
    if ("richText" in value && Array.isArray(value.richText)) return value.richText.map((part) => part.text).join("");
    if ("text" in value && typeof value.text === "string") return value.text;
    if ("result" in value) return cellText(value.result as ExcelJS.CellValue);
    if ("error" in value) return "";
  }
  return "";
}

const yesNo = (raw: string): boolean | null | "bad" => {
  const v = raw.trim().toLowerCase();
  if (!v) return null;
  if (["yes", "y", "true", "1", "نعم", "✓", "x"].includes(v)) return true;
  if (["no", "n", "false", "0", "لا"].includes(v)) return false;
  return "bad";
};

const STATUS_WORDS: Record<string, ImportProduct["status"]> = {
  published: "published",
  live: "published",
  visible: "published",
  draft: "draft",
  hidden: "draft",
  archived: "archived",
};

const BADGE_LOOKUP = new Map<string, BadgeKey>(
  BADGE_KEYS.flatMap((key) => [
    [key, key],
    [key.replace(/-/g, " "), key],
    [BADGES[key].label.toLowerCase(), key],
  ]),
);
BADGE_LOOKUP.set("preservative free", "preservative-free");
BADGE_LOOKUP.set("made in lebanon", "local");
BADGE_LOOKUP.set("lebanese", "local");

/** Read and check an uploaded products file. Nothing is saved here. */
export async function parseProductFile(buffer: ArrayBuffer, existing: ExistingCatalog): Promise<ParsedImport> {
  const errors: ImportIssue[] = [];
  const warnings: ImportIssue[] = [];
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch {
    return { products: [], errors: [{ row: null, message: "This file can't be read. Please save it as an Excel workbook (.xlsx) and try again." }], warnings };
  }

  const sheet = workbook.getWorksheet("Products") ?? workbook.worksheets.find((ws) => ws.state !== "hidden");
  if (!sheet) return { products: [], errors: [{ row: null, message: "The file has no sheets." }], warnings };

  // Find each column by its header text, wherever it is.
  const lookup = new Map<string, ColumnKey>();
  for (const c of PRODUCT_COLUMNS) {
    lookup.set(normalizeHeader(c.header), c.key);
    for (const alias of c.aliases ?? []) lookup.set(normalizeHeader(alias), c.key);
  }
  const positions = new Map<ColumnKey, number>();
  sheet.getRow(1).eachCell((cell, col) => {
    const key = lookup.get(normalizeHeader(cellText(cell.value)));
    if (key && !positions.has(key)) positions.set(key, col);
  });
  const missing = PRODUCT_COLUMNS.filter((c) => c.required && !positions.has(c.key)).map((c) => `“${c.header}”`);
  if (missing.length) {
    return {
      products: [],
      errors: [{ row: 1, message: `The first row must have the column titles. Missing: ${missing.join(", ")}. Download the template to see the expected columns.` }],
      warnings,
    };
  }

  const categoryByName = new Map<string, string>();
  for (const c of existing.categories) {
    for (const n of [c.name, c.name_ar, c.slug]) if (n) categoryByName.set(n.trim().toLowerCase(), c.id);
  }
  const existingBySlug = new Map(existing.products.map((p) => [p.slug, p]));
  const groups = new Map<string, { product: ImportProduct; firstRow: number; sizes: Map<string, number> }>();
  let dataRows = 0;

  const lastRow = sheet.actualRowCount ? sheet.rowCount : 0;
  for (let r = FIRST_DATA_ROW; r <= lastRow; r++) {
    const row = sheet.getRow(r);
    const raw = (key: ColumnKey) => {
      const col = positions.get(key);
      return col ? cellText(row.getCell(col).value).trim() : "";
    };
    const values = PRODUCT_COLUMNS.map((c) => raw(c.key));
    if (values.every((v) => !v)) continue; // empty row
    dataRows += 1;
    if (dataRows > MAX_IMPORT_ROWS) {
      errors.push({ row: r, message: `A file can have up to ${MAX_IMPORT_ROWS} rows. Please split it into smaller files.` });
      break;
    }

    const rowErrors: string[] = [];
    const textOf = (key: ColumnKey) => {
      const value = raw(key);
      const max = LIMITS[key];
      if (max && value.length > max) rowErrors.push(`“${PRODUCT_COLUMNS.find((c) => c.key === key)!.header}” is too long (max ${max} characters).`);
      return value.slice(0, max ?? value.length);
    };

    const name = textOf("name");
    const slugInput = textOf("slug");
    const slug = slugify(slugInput || name);
    if (!name && !slugInput) {
      errors.push({ row: r, message: "Name (English) is empty." });
      continue;
    }
    if (!slug) {
      errors.push({ row: r, message: "The name needs at least one English letter or number (it is used for the web address)." });
      continue;
    }

    let group = groups.get(slug);
    const isNew = !existingBySlug.has(slug);
    if (!group) {
      group = {
        firstRow: r,
        sizes: new Map(),
        product: {
          slug,
          name: name || existingBySlug.get(slug)?.name || "",
          name_ar: null,
          category_id: null,
          status: null,
          is_featured: null,
          badges: null,
          tagline: null,
          tagline_ar: null,
          description: null,
          description_ar: null,
          ingredients: null,
          ingredients_ar: null,
          how_to_use: null,
          how_to_use_ar: null,
          sort_order: null,
          variants: [],
        },
      };
      groups.set(slug, group);
    }
    const product = group.product;
    if (!product.name && name) product.name = name;

    // Product details: the first non-empty value wins.
    const setText = (key: "name_ar" | "tagline" | "tagline_ar" | "description" | "description_ar" | "ingredients" | "ingredients_ar" | "how_to_use" | "how_to_use_ar") => {
      const value = textOf(key);
      if (value && product[key] == null) product[key] = value;
    };
    (["name_ar", "tagline", "tagline_ar", "description", "description_ar", "ingredients", "ingredients_ar", "how_to_use", "how_to_use_ar"] as const).forEach(setText);

    const category = raw("category");
    if (category && product.category_id == null) {
      const found = categoryByName.get(category.toLowerCase());
      if (found) product.category_id = found;
      else rowErrors.push(`Unknown category “${category}”. Use one of: ${existing.categories.map((c) => c.name).join(", ")}.`);
    }

    const status = raw("status");
    if (status && product.status == null) {
      const found = STATUS_WORDS[status.toLowerCase()];
      if (found) product.status = found;
      else rowErrors.push(`Status “${status}” isn't valid. Use Published, Draft or Archived.`);
    }

    const bestseller = yesNo(raw("bestseller"));
    if (bestseller === "bad") rowErrors.push("Bestseller must be Yes or No.");
    else if (bestseller != null && product.is_featured == null) product.is_featured = bestseller;

    const labels = raw("labels");
    if (labels && product.badges == null) {
      const keys: BadgeKey[] = [];
      for (const part of labels.split(/[,;\n،]+/).map((p) => p.trim()).filter(Boolean)) {
        const key = BADGE_LOOKUP.get(part.toLowerCase());
        if (key) {
          if (!keys.includes(key)) keys.push(key);
        } else rowErrors.push(`Unknown label “${part}”. Allowed: ${BADGE_KEYS.map((k) => BADGES[k].label).join(", ")}.`);
      }
      product.badges = keys;
    }

    const order = raw("sort_order");
    if (order && product.sort_order == null) {
      const n = Number(order);
      if (Number.isInteger(n) && n >= 0 && n <= 100000) product.sort_order = n;
      else rowErrors.push("Display order must be a whole number (0 or more).");
    }

    // The size on this row.
    const size = textOf("size");
    const priceRaw = raw("price");
    const compareRaw = raw("compare_at");
    const stockRaw = raw("stock");
    const sizeAr = textOf("size_ar");
    const sku = textOf("sku");
    if (size) {
      const sizeKey = size.toLowerCase();
      if (group.sizes.has(sizeKey)) {
        rowErrors.push(`The size “${size}” appears twice for “${product.name}” (also on row ${group.sizes.get(sizeKey)}).`);
      } else {
        group.sizes.set(sizeKey, r);
        const money = (value: string, label: string) => {
          if (!value) return null;
          const amount = Number(value.replace(/[$,\s]/g, ""));
          const cents = Number.isFinite(amount) && amount >= 0 && amount < 100000 ? parseDollars(amount.toFixed(2)) : null;
          if (cents == null) rowErrors.push(`${label} “${value}” isn't a valid amount. Example: 6.50`);
          return cents;
        };
        const price = money(priceRaw, "Price");
        const compare = money(compareRaw, "Price before sale");
        let stock: number | null = null;
        if (stockRaw) {
          const n = Number(stockRaw);
          if (Number.isInteger(n) && n >= 0 && n <= 1000000) stock = n;
          else rowErrors.push("Stock must be a whole number (0 or more).");
        }
        const existingSize = existingBySlug.get(slug)?.variants.find((v) => v.label.toLowerCase() === sizeKey);
        if (!existingSize && price == null && !priceRaw) rowErrors.push(`Price is empty for the new size “${size}”.`);
        const effectivePrice = price ?? existingSize?.price_cents ?? null;
        if (compare && effectivePrice != null && compare <= effectivePrice) {
          warnings.push({ row: r, message: `“Price before sale” for ${product.name} (${size}) is not higher than the price, so no sale will show.` });
        }
        product.variants.push({ label: size, label_ar: sizeAr || null, sku: sku || null, price_cents: price, compare_at_cents: compare, stock });
      }
    } else if (priceRaw || compareRaw || stockRaw || sizeAr) {
      rowErrors.push("Size is empty. Every price and stock needs a size (for example 500 ml).");
    }

    for (const message of rowErrors) errors.push({ row: r, message });
    if (isNew && group.firstRow === r && !name) errors.push({ row: r, message: `No product has the web address “${slug}”. To add a new product, fill in Name (English).` });
  }

  const products = [...groups.values()].map((g) => g.product);
  for (const group of groups.values()) {
    const p = group.product;
    if (!existingBySlug.has(p.slug)) {
      if (!p.variants.length) errors.push({ row: group.firstRow, message: `The new product “${p.name}” needs at least one size with a price.` });
      if (!p.category_id) warnings.push({ row: group.firstRow, message: `“${p.name}” has no category, so it will only appear in Shop all.` });
    }
  }
  if (!dataRows) errors.push({ row: null, message: "The file has no products. Add one row per size under the column titles." });
  errors.sort((a, b) => (a.row ?? 0) - (b.row ?? 0));

  return { products, errors, warnings };
}
