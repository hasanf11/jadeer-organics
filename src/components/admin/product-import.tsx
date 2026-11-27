"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  PiArrowCounterClockwiseBold,
  PiCheckCircleFill,
  PiDownloadSimpleBold,
  PiFileXlsBold,
  PiMicrosoftExcelLogoBold,
  PiUploadSimpleBold,
  PiWarningCircleFill,
  PiWarningFill,
} from "react-icons/pi";
import { importProductFile, previewProductImport, type ImportPreview } from "@/lib/admin-actions/product-import";

const money = (cents: number | null) => (cents == null ? "—" : `$${(cents / 100).toFixed(2).replace(/\.00$/, "")}`);
const STATUS: Record<string, string> = { published: "Published", draft: "Draft", archived: "Archived" };

function Step({ n, title, children, done = false }: { n: number; title: string; children: React.ReactNode; done?: boolean }) {
  return (
    <section className="rounded-3xl border border-line bg-white p-5 md:p-6">
      <h2 className="flex items-center gap-3 font-display text-xl">
        <span className={`grid size-8 shrink-0 place-items-center rounded-full font-sans text-sm font-bold text-white ${done ? "bg-leaf" : "bg-ink"}`}>{n}</span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Choose a file → see the preview and any mistakes → import. */
export default function ProductImport() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [checking, startChecking] = useTransition();
  const [importing, startImporting] = useTransition();

  const choose = (picked: File | null | undefined) => {
    if (!picked) return;
    setFile(picked);
    setPreview(null);
    setResult(null);
    const data = new FormData();
    data.set("file", picked);
    startChecking(async () => {
      try {
        setPreview(await previewProductImport(data));
      } catch {
        setResult({ ok: false, message: "The file couldn't be checked. Please try again." });
      }
    });
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    if (input.current) input.current.value = "";
  };

  const runImport = () => {
    if (!file || !preview?.ok) return;
    const data = new FormData();
    data.set("file", file);
    startImporting(async () => {
      try {
        const outcome = await importProductFile(data);
        setResult(outcome);
        if (outcome.ok) {
          setPreview(null);
          router.refresh();
        }
      } catch {
        setResult({ ok: false, message: "The import didn't go through and nothing was changed. Please try again." });
      }
    });
  };

  const s = preview?.summary;
  const total = s ? s.newProducts + s.updatedProducts : 0;

  return (
    <div className="grid gap-5">
      <Step n={1} title="Get the Excel file">
        <p className="text-ink-soft">
          Use our template: one row per size, with the same columns as the product form. To change existing products, download them, edit the file and import it back.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href="/admin/products/import/template" download className="btn btn-primary">
            <PiDownloadSimpleBold aria-hidden="true" /> Download empty template
          </a>
          <a href="/admin/products/export" download className="btn btn-soft">
            <PiMicrosoftExcelLogoBold aria-hidden="true" /> Download current products
          </a>
        </div>
        <ul className="mt-4 grid gap-1.5 text-sm text-ink-soft">
          <li>• <strong className="text-ink">Orange columns are required:</strong> Name (English), Size and Price ($).</li>
          <li>• <strong className="text-ink">A product with two sizes</strong> takes two rows with the same name. Fill the details (category, description…) on its first row.</li>
          <li>• <strong className="text-ink">Empty cells keep what is already saved,</strong> so you can update only prices or stock.</li>
          <li>• Photos are added afterwards from each product&apos;s page.</li>
        </ul>
      </Step>

      <Step n={2} title="Choose your file" done={Boolean(preview?.ok)}>
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            choose(e.dataTransfer.files?.[0]);
          }}
          className={`flex cursor-pointer flex-col items-center gap-2 rounded-3xl border-2 border-dashed p-8 text-center transition-colors ${
            dragging ? "border-leaf bg-mint" : "border-line bg-cream hover:border-leaf"
          }`}
        >
          <input
            ref={input}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            onChange={(e) => choose(e.target.files?.[0])}
          />
          {file ? <PiFileXlsBold size={36} className="text-leaf" aria-hidden="true" /> : <PiUploadSimpleBold size={36} className="text-ink-soft" aria-hidden="true" />}
          <span className="font-bold">{file ? file.name : "Choose an Excel file (.xlsx)"}</span>
          <span className="text-sm text-ink-soft">{file ? "Tap to choose a different file" : "or drag it here"}</span>
        </label>
        {checking && (
          <p className="mt-4 flex items-center gap-2 font-bold text-ink-soft" role="status">
            <span className="size-4 animate-spin rounded-full border-2 border-line border-t-leaf" /> Checking your file…
          </p>
        )}
      </Step>

      {result && (
        <div role={result.ok ? "status" : "alert"} className={`flex flex-wrap items-center gap-3 rounded-3xl p-5 font-bold ${result.ok ? "bg-mint text-leaf" : "bg-blush text-berry"}`}>
          {result.ok ? <PiCheckCircleFill size={24} aria-hidden="true" /> : <PiWarningCircleFill size={24} aria-hidden="true" />}
          <span className="flex-1">{result.message}</span>
          {result.ok && (
            <>
              <Link href="/admin/products" className="btn btn-primary btn-sm">See products</Link>
              <button type="button" onClick={reset} className="btn btn-soft btn-sm">Import another file</button>
            </>
          )}
        </div>
      )}

      {preview && s && (
        <Step n={3} title={preview.ok ? "Check and import" : "Fix the file"}>
          <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "New products", value: s.newProducts, tone: "bg-mint text-leaf" },
              { label: "Products updated", value: s.updatedProducts, tone: "bg-butter text-forest" },
              { label: "New sizes", value: s.newSizes, tone: "bg-mint text-leaf" },
              { label: "Sizes updated", value: s.updatedSizes, tone: "bg-butter text-forest" },
            ].map((box) => (
              <div key={box.label} className={`flex flex-col-reverse rounded-2xl p-4 ${box.tone}`}>
                <dt className="text-sm font-bold opacity-80">{box.label}</dt>
                <dd className="font-display text-3xl">{box.value}</dd>
              </div>
            ))}
          </dl>

          {preview.errors.length > 0 && (
            <div className="mt-5 rounded-2xl border-2 border-berry/30 bg-blush/50 p-4" role="alert">
              <p className="flex items-center gap-2 font-bold text-berry">
                <PiWarningCircleFill aria-hidden="true" />
                {preview.errors.length} problem{preview.errors.length === 1 ? "" : "s"} to fix in Excel. Nothing has been saved.
              </p>
              <ul className="mt-3 grid max-h-80 gap-1.5 overflow-y-auto text-sm">
                {preview.errors.map((issue, i) => (
                  <li key={i} className="flex gap-3">
                    {issue.row != null && <span className="shrink-0 rounded-md bg-white px-2 py-0.5 font-bold text-berry">Row {issue.row}</span>}
                    <span>{issue.message}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-ink-soft">Correct these rows, save the file and choose it again.</p>
            </div>
          )}

          {preview.warnings.length > 0 && (
            <div className="mt-4 rounded-2xl bg-butter/60 p-4">
              <p className="flex items-center gap-2 font-bold"><PiWarningFill className="text-tomato" aria-hidden="true" /> Good to know</p>
              <ul className="mt-2 grid gap-1 text-sm">
                {preview.warnings.map((issue, i) => (
                  <li key={i}>{issue.row != null && <strong>Row {issue.row}: </strong>}{issue.message}</li>
                ))}
              </ul>
            </div>
          )}

          {preview.items.length > 0 && (
            <div className="mt-5 overflow-x-auto rounded-2xl border border-line">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-cream text-xs uppercase tracking-wider text-ink-soft">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Sizes · price · stock</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.items.map((item, i) => (
                    <tr key={i} className="border-t border-line align-top">
                      <td className="px-4 py-3">
                        <span className="font-bold">{item.name}</span>{" "}
                        <span className={`chip ms-1 px-2 py-0.5 text-[0.7rem] ${item.isNew ? "bg-mint text-leaf" : "bg-butter text-forest"}`}>{item.isNew ? "New" : "Update"}</span>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">{item.category || (item.isNew ? "—" : "unchanged")}</td>
                      <td className="px-4 py-3 text-ink-soft">{STATUS[item.status] ?? "unchanged"}</td>
                      <td className="px-4 py-3">
                        {item.sizes.length === 0 ? (
                          <span className="text-ink-soft">details only</span>
                        ) : (
                          <ul className="grid gap-0.5">
                            {item.sizes.map((size, j) => (
                              <li key={j}>
                                <strong>{size.label}</strong> · {size.price == null ? (size.isNew ? "no price" : "price unchanged") : money(size.price)} · {size.stock == null ? (size.isNew ? "0 in stock" : "stock unchanged") : `${size.stock} in stock`}
                                {size.isNew && !item.isNew && <span className="ms-1 text-xs font-bold text-leaf">new size</span>}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="button" onClick={runImport} disabled={!preview.ok || importing || total === 0} className="btn btn-primary">
              {importing ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Importing…
                </>
              ) : (
                <>
                  <PiUploadSimpleBold aria-hidden="true" /> Import {total} product{total === 1 ? "" : "s"}
                </>
              )}
            </button>
            <button type="button" onClick={reset} className="btn btn-soft">
              <PiArrowCounterClockwiseBold aria-hidden="true" /> Start again
            </button>
            {preview.ok && <span className="text-sm text-ink-soft">Everything is saved together — if anything fails, nothing changes.</span>}
          </div>
        </Step>
      )}
    </div>
  );
}
