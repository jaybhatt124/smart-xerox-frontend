import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Info,
  Loader2,
  Printer,
  RefreshCw,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { Badge, Button, Card, Input, Label, Select, Textarea } from "@/components/ui";
import { useToast } from "@/context/ToastContext";
import { API_BASE, api, fileUrl } from "@/lib/api";
import { cn, formatBytes, formatCurrency } from "@/lib/utils";
import type { ColorMode, DocumentMeta, PaperSize, PrintSides } from "@/types";

function parsePageRanges(spec: string, total: number): { pages: number[]; error?: string } {
  const s = spec.trim().toUpperCase();
  if (!s || s === "ALL") return { pages: Array.from({ length: total }, (_, i) => i + 1) };
  const set = new Set<number>();
  for (const chunk of s.split(",")) {
    const part = chunk.trim();
    if (!part) continue;
    if (part.includes("-")) {
      const [a, b] = part.split("-");
      const start = Number(a);
      const end = Number(b);
      if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start)
        return { pages: [], error: `Invalid range "${part}"` };
      if (end > total) return { pages: [], error: `"${part}" exceeds ${total} pages` };
      for (let i = start; i <= end; i++) set.add(i);
    } else {
      const n = Number(part);
      if (!Number.isInteger(n) || n < 1) return { pages: [], error: `Invalid page "${part}"` };
      if (n > total) return { pages: [], error: `Page ${n} exceeds ${total} pages` };
      set.add(n);
    }
  }
  if (set.size === 0) return { pages: [], error: "No pages selected" };
  return { pages: [...set].sort((a, b) => a - b) };
}

interface UploadState {
  meta: DocumentMeta | null;
  progress: number;
  error: string | null;
}

export default function PrintFlow() {
  const { shopId = "" } = useParams();
  const toast = useToast();

  const shopQuery = useQuery({
    queryKey: ["public-shop", shopId],
    queryFn: () => api.publicShop(shopId),
    retry: false,
  });
  const shop = shopQuery.data;

  const [upload, setUpload] = useState<UploadState>({ meta: null, progress: 0, error: null });
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [colorMode, setColorMode] = useState<ColorMode>("BW");
  const [paperSize, setPaperSize] = useState<PaperSize>("A4");
  const [printSides, setPrintSides] = useState<PrintSides>("SINGLE");
  const [copies, setCopies] = useState(1);
  const [pageMode, setPageMode] = useState<"ALL" | "CUSTOM">("ALL");
  const [pageRanges, setPageRanges] = useState("");
  const [orientation, setOrientation] = useState("AUTO");
  const [fittingMode, setFittingMode] = useState("FIT_TO_PAGE");
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [instructions, setInstructions] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ order_number: string; tracking_url: string; total_price: number; message: string } | null>(null);
  const idempotencyKey = useRef(crypto.randomUUID());

  const services = shop?.services ?? [];
  const availablePapers = useMemo(
    () => [...new Set(services.filter((s) => s.is_enabled).map((s) => s.paper_size))],
    [services]
  );
  const availableColors = useMemo(
    () => [...new Set(services.filter((s) => s.is_enabled).map((s) => s.color_mode))] as ColorMode[],
    [services]
  );

  useEffect(() => {
    if (shop) {
      const ps = (shop.settings.default_paper_size as PaperSize) || "A4";
      if (availablePapers.includes(ps)) setPaperSize(ps);
      else if (availablePapers[0]) setPaperSize(availablePapers[0]);
      if (!availableColors.includes("COLOR")) setColorMode("BW");
      if (!shop.settings.duplex_enabled) setPrintSides("SINGLE");
    }
  }, [shop, availablePapers, availableColors]);

  const totalPages = upload.meta?.total_pages ?? 0;
  const parsed = useMemo(
    () => (pageMode === "ALL" ? { pages: Array.from({ length: totalPages }, (_, i) => i + 1) } : parsePageRanges(pageRanges, totalPages)),
    [pageMode, pageRanges, totalPages]
  );
  const selectedPages = parsed.pages.length;

  const priceQuery = useQuery({
    queryKey: ["price", shopId, paperSize, colorMode, printSides, copies, selectedPages],
    queryFn: () =>
      api.calculatePrice(shopId, {
        paper_size: paperSize,
        color_mode: colorMode,
        print_sides: printSides,
        copies,
        selected_page_count: selectedPages,
      }),
    enabled: !!shop && selectedPages > 0 && !!upload.meta,
  });

  const uploadFile = useCallback(
    (file: File) => {
      setUpload({ meta: null, progress: 0, error: null });
      const maxMb = shop?.settings.max_file_size_mb ?? 20;
      if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
        setUpload({ meta: null, progress: 0, error: "Only PDF files are accepted." });
        return;
      }
      if (file.size > maxMb * 1024 * 1024) {
        setUpload({ meta: null, progress: 0, error: `File must be under ${maxMb} MB.` });
        return;
      }
      const fd = new FormData();
      fd.append("shop_public_id", shopId);
      fd.append("file", file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_BASE}/api/documents/upload`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUpload((u) => ({ ...u, progress: Math.round((e.loaded / e.total) * 100) }));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const meta = JSON.parse(xhr.responseText) as DocumentMeta;
          setUpload({ meta, progress: 100, error: null });
          toast.success("Document uploaded", `${meta.total_pages} pages detected`);
        } else {
          let message = "Upload failed.";
          try {
            const data = JSON.parse(xhr.responseText);
            message = typeof data.detail === "string" ? data.detail : message;
          } catch { /* ignore */ }
          setUpload({ meta: null, progress: 0, error: message });
        }
      };
      xhr.onerror = () => setUpload({ meta: null, progress: 0, error: "Network error during upload." });
      xhr.send(fd);
    },
    [shopId, shop, toast]
  );

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const removeFile = () => {
    setUpload({ meta: null, progress: 0, error: null });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submit = async () => {
    if (!upload.meta) return;
    if (parsed.error) {
      toast.error("Check your page selection", parsed.error);
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.submitOrder({
        shop_public_id: shopId,
        storage_key: upload.meta.storage_key,
        original_filename: upload.meta.original_filename,
        file_size: upload.meta.file_size,
        total_document_pages: upload.meta.total_pages,
        selected_page_ranges: pageMode === "ALL" ? "ALL" : pageRanges.trim(),
        selected_page_count: selectedPages,
        copies,
        color_mode: colorMode,
        paper_size: paperSize,
        print_sides: printSides,
        orientation,
        fitting_mode: fittingMode,
        customer_name: customerName || null,
        customer_contact: customerContact || null,
        special_instructions: instructions || null,
        idempotency_key: idempotencyKey.current,
      });
      setResult({
        order_number: res.order_number,
        tracking_url: `/order/${res.tracking_token}`,
        total_price: res.total_price,
        message: res.message,
      });
      toast.success("Print request submitted", res.order_number);
    } catch (err) {
      toast.error("Could not submit", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------- render states ----------------
  if (shopQuery.isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (shopQuery.isError || !shop) {
    return (
      <CenteredMessage
        icon={<AlertTriangle className="h-10 w-10 text-amber-500" />}
        title="Shop not found"
        text="This QR code does not match an active shop. Please check with the shop staff."
      />
    );
  }
  if (!shop.accepts_orders_now) {
    return (
      <CenteredMessage
        icon={<AlertTriangle className="h-10 w-10 text-amber-500" />}
        title="Printing temporarily unavailable"
        text={`${shop.shop_name} is not accepting print requests right now. Please try again later.`}
        shop={shop}
      />
    );
  }
  if (result) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <Card className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-50">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-ink">Request submitted!</h1>
          <p className="mt-2 text-sm text-muted">{result.message}</p>
          <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-left">
            <Row label="Order number" value={<span className="font-bold text-ink">{result.order_number}</span>} />
            <Row label="Estimated amount" value={<span className="font-bold text-primary">{formatCurrency(result.total_price)}</span>} />
            <Row label="Payment" value="Pay at shop" />
          </div>
          <p className="mt-4 text-xs text-muted">
            Show your order number at the counter. Payment and printing are handled at the shop.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <Link to={result.tracking_url}>
              <Button className="w-full">Track my order</Button>
            </Link>
            <Link to={`/print/${shopId}`}>
              <Button variant="outline" className="w-full" onClick={() => { setResult(null); removeFile(); idempotencyKey.current = crypto.randomUUID(); }}>
                Submit another document
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-32">
      {/* Header */}
      <div className="bg-secondary text-white">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="flex items-center gap-3">
            {shop.logo_url ? (
              <img src={fileUrl(shop.logo_url)} alt="" className="h-12 w-12 rounded-xl bg-white object-contain p-1" />
            ) : (
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/10">
                <Printer className="h-6 w-6" />
              </span>
            )}
            <div className="min-w-0">
              <h1 className="truncate text-xl font-extrabold">{shop.shop_name}</h1>
              <p className="truncate text-sm text-slate-300">
                {[shop.address, shop.city, shop.state].filter(Boolean).join(", ") || "Printing services"}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <Badge tone="green">Accepting orders</Badge>
            {shop.business_hours && <Badge tone="cyan">{shop.business_hours}</Badge>}
            {shop.phone && <Badge tone="slate">{shop.phone}</Badge>}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        {/* Step 1: Upload */}
        <Card>
          <StepHeader n={1} title="Upload your PDF" />
          {!upload.meta ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={cn(
                "mt-3 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition",
                dragOver ? "border-primary bg-primary-50" : "border-line bg-white"
              )}
            >
              <UploadCloud className="h-10 w-10 text-primary" />
              <p className="mt-3 font-semibold text-ink">Drag &amp; drop your PDF here</p>
              <p className="mt-1 text-sm text-muted">or choose from your device</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
              />
              <Button className="mt-4" onClick={() => fileInputRef.current?.click()}>
                Choose PDF file
              </Button>
              <p className="mt-3 text-xs text-slate-400">
                PDF only · Max {shop.settings.max_file_size_mb} MB · Password-protected files are rejected
              </p>
              {upload.progress > 0 && upload.progress < 100 && (
                <div className="mt-4 w-full max-w-xs">
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${upload.progress}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-muted">Uploading… {upload.progress}%</p>
                </div>
              )}
              {upload.error && <p className="mt-3 text-sm text-red-600">{upload.error}</p>}
            </div>
          ) : (
            <div className="mt-3 grid gap-4 sm:grid-cols-[140px,1fr]">
              <div className="rounded-xl border border-line bg-slate-50 p-2">
                {upload.meta.preview_url ? (
                  <img
                    src={fileUrl(upload.meta.preview_url)}
                    alt="Document preview"
                    className="h-40 w-full rounded-lg object-contain"
                    onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                  />
                ) : (
                  <div className="grid h-40 place-items-center">
                    <FileText className="h-10 w-10 text-slate-300" />
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{upload.meta.original_filename}</p>
                    <p className="text-sm text-muted">
                      {upload.meta.total_pages} pages · {formatBytes(upload.meta.file_size)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={() => fileInputRef.current?.click()}>
                    Replace
                  </Button>
                  <Button variant="ghost" size="sm" leftIcon={<Trash2 className="h-4 w-4" />} onClick={removeFile}>
                    Remove
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
                  />
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Step 2: Configure */}
        {upload.meta && (
          <Card>
            <StepHeader n={2} title="Printing options" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Colour mode</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["BW", "COLOR"] as ColorMode[]).filter((c) => availableColors.includes(c)).map((c) => (
                    <Choice key={c} active={colorMode === c} onClick={() => setColorMode(c)}>
                      {c === "BW" ? "Black & White" : "Colour"}
                    </Choice>
                  ))}
                </div>
              </div>
              <div>
                <Label>Paper size</Label>
                <div className="grid grid-cols-3 gap-2">
                  {availablePapers.map((p) => (
                    <Choice key={p} active={paperSize === p} onClick={() => setPaperSize(p)}>
                      {p === "LETTER" ? "Letter" : p}
                    </Choice>
                  ))}
                </div>
              </div>
              <div>
                <Label>Print sides</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Choice active={printSides === "SINGLE"} onClick={() => setPrintSides("SINGLE")}>Single-sided</Choice>
                  {shop.settings.duplex_enabled && (
                    <Choice active={printSides === "DOUBLE"} onClick={() => setPrintSides("DOUBLE")}>Double-sided</Choice>
                  )}
                </div>
              </div>
              <div>
                <Label>Number of copies</Label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => setCopies((c) => Math.max(1, c - 1))}>–</Button>
                  <Input
                    type="number"
                    min={1}
                    max={shop.settings.max_copies}
                    value={copies}
                    onChange={(e) => setCopies(Math.min(shop.settings.max_copies, Math.max(1, Number(e.target.value) || 1)))}
                    className="text-center"
                  />
                  <Button variant="outline" size="icon" onClick={() => setCopies((c) => Math.min(shop.settings.max_copies, c + 1))}>+</Button>
                </div>
                <p className="mt-1 text-xs text-slate-400">Maximum {shop.settings.max_copies} copies</p>
              </div>

              <div className="sm:col-span-2">
                <Label>Page selection</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Choice active={pageMode === "ALL"} onClick={() => setPageMode("ALL")}>All {totalPages} pages</Choice>
                  <Choice active={pageMode === "CUSTOM"} onClick={() => setPageMode("CUSTOM")}>Custom range</Choice>
                </div>
                {pageMode === "CUSTOM" && (
                  <div className="mt-2">
                    <Input
                      placeholder="e.g. 1-3, 7, 10-12"
                      value={pageRanges}
                      onChange={(e) => setPageRanges(e.target.value)}
                    />
                    {parsed.error ? (
                      <p className="mt-1 text-sm text-red-600">{parsed.error}</p>
                    ) : (
                      <p className="mt-1 text-sm text-muted">{selectedPages} page(s) selected</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label>Page orientation</Label>
                <Select value={orientation} onChange={(e) => setOrientation(e.target.value)}>
                  <option value="AUTO">Automatic</option>
                  <option value="PORTRAIT">Portrait</option>
                  <option value="LANDSCAPE">Landscape</option>
                </Select>
              </div>
              <div>
                <Label>Page fitting</Label>
                <Select value={fittingMode} onChange={(e) => setFittingMode(e.target.value)}>
                  <option value="FIT_TO_PAGE">Fit to page</option>
                  <option value="ACTUAL_SIZE">Actual size</option>
                </Select>
              </div>
            </div>
          </Card>
        )}

        {/* Step 3: Details */}
        {upload.meta && (
          <Card>
            <StepHeader n={3} title="Your details (optional)" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Name</Label>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Your name" />
              </div>
              <div>
                <Label>Contact</Label>
                <Input value={customerContact} onChange={(e) => setCustomerContact(e.target.value)} placeholder="Phone or email" />
              </div>
              <div className="sm:col-span-2">
                <Label>Printing instructions (optional)</Label>
                <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="e.g. Please use 100 GSM paper" />
              </div>
            </div>
          </Card>
        )}

        <div className="flex items-center gap-2 rounded-xl bg-primary-50 px-4 py-3 text-sm text-primary-700">
          <Info className="h-4 w-4 shrink-0" />
          Online payment will be available soon. For now, pay at the shop counter.
        </div>
      </div>

      {/* Sticky price bar */}
      {upload.meta && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted">
                {priceQuery.data ? `${priceQuery.data.total_page_sides} page sides · ${priceQuery.data.estimated_sheets} sheets` : "Calculating…"}
              </p>
              <p className="text-lg font-extrabold text-ink">
                {priceQuery.data ? formatCurrency(priceQuery.data.total_price) : "—"}
                <span className="ml-1 text-xs font-normal text-muted">estimated</span>
              </p>
            </div>
            <Button
              size="lg"
              loading={submitting}
              disabled={selectedPages < 1 || !!parsed.error || priceQuery.isError}
              onClick={submit}
              leftIcon={<ArrowLeft className="h-4 w-4 rotate-180" />}
            >
              Submit · Pay at Shop
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepHeader({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-sm font-bold text-white">{n}</span>
      <h2 className="text-lg font-bold text-ink">{title}</h2>
    </div>
  );
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border px-3 py-2.5 text-sm font-medium transition",
        active ? "border-primary bg-primary-50 text-primary-700" : "border-line bg-white text-slate-600 hover:border-slate-300"
      )}
    >
      {children}
    </button>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}

function CenteredMessage({
  icon,
  title,
  text,
  shop,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  shop?: { shop_name: string; logo_url?: string | null };
}) {
  return (
    <div className="grid min-h-screen place-items-center bg-surface px-4">
      <Card className="max-w-md text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-slate-100">{icon}</div>
        {shop && <p className="mt-4 font-bold text-ink">{shop.shop_name}</p>}
        <h1 className="mt-2 text-xl font-extrabold text-ink">{title}</h1>
        <p className="mt-2 text-sm text-muted">{text}</p>
        <Link to="/" className="mt-5 inline-block">
          <Button variant="outline">Go home</Button>
        </Link>
      </Card>
    </div>
  );
}
