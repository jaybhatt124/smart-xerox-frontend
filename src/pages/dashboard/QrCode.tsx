import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import QRCode from "qrcode";
import { Check, Copy, Download, FileImage, FileText, RefreshCw, ExternalLink } from "lucide-react";
import { Button, Card, Modal, SectionTitle, Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { downloadBlob } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";

export default function QrCodePage() {
  const toast = useToast();
  const qc = useQueryClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ["qr"], queryFn: api.qrInfo });

  useEffect(() => {
    if (!data?.print_url) return;
    QRCode.toDataURL(data.print_url, {
      width: 360,
      margin: 1,
      color: { dark: "#0F172A", light: "#FFFFFF" },
      errorCorrectionLevel: "M",
    })
      .then(setDataUrl)
      .catch(() => setDataUrl(null));
  }, [data?.print_url]);

  const regenerate = useMutation({
    mutationFn: api.regenerateQr,
    onSuccess: () => {
      toast.success("QR link regenerated", "The old QR code no longer works.");
      setConfirmOpen(false);
      void qc.invalidateQueries({ queryKey: ["qr"] });
      void qc.invalidateQueries({ queryKey: ["public-shop"] });
    },
    onError: (e: Error) => toast.error("Could not regenerate", e.message),
  });

  const download = async (format: "png" | "svg" | "poster") => {
    try {
      const res = await api.qrBlob(format);
      const blob = await res.blob();
      const ext = format === "poster" ? "svg" : format;
      downloadBlob(blob, `${data?.public_shop_id ?? "shop"}-${format}.${ext}`);
    } catch (e) {
      toast.error("Download failed", e instanceof Error ? e.message : "Try again.");
    }
  };

  const copyLink = async () => {
    if (!data?.print_url) return;
    await navigator.clipboard.writeText(data.print_url);
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Shop QR Code</h1>
        <p className="text-sm text-muted">Print and display this QR so customers can submit print requests.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Your QR code" subtitle="Scan to open your printing page" />
          <div className="flex flex-col items-center rounded-2xl border border-line bg-white p-6">
            {isLoading || !dataUrl ? (
              <Skeleton className="h-56 w-56" />
            ) : (
              <img src={dataUrl} alt="Shop QR code" className="h-56 w-56" />
            )}
            <p className="mt-4 text-center text-sm font-bold text-ink">{data?.public_shop_id}</p>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
            <code className="min-w-0 flex-1 truncate text-xs text-slate-600">{data?.print_url}</code>
            <button onClick={copyLink} className="rounded-lg p-1.5 text-slate-500 hover:bg-white" title="Copy link">
              {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            </button>
            {data?.print_url && (
              <a href={data.print_url} target="_blank" rel="noreferrer" className="rounded-lg p-1.5 text-slate-500 hover:bg-white" title="Open">
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </Card>

        <Card>
          <SectionTitle title="Downloads & options" subtitle="Share your QR online or in print" />
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start" leftIcon={<FileImage className="h-4 w-4" />} onClick={() => download("png")}>
              Download PNG
            </Button>
            <Button variant="outline" className="w-full justify-start" leftIcon={<FileText className="h-4 w-4" />} onClick={() => download("svg")}>
              Download SVG (scalable)
            </Button>
            <Button variant="outline" className="w-full justify-start" leftIcon={<Download className="h-4 w-4" />} onClick={() => download("poster")}>
              Download printable QR poster
            </Button>
          </div>
          <div className="mt-5 rounded-xl border border-line bg-slate-50 p-4">
            <p className="text-sm font-semibold text-ink">Printable poster</p>
            <p className="mt-1 text-sm text-muted">
              The poster includes your shop name, "Scan to Print", the instructions
              <span className="font-medium text-slate-600"> Upload • Customize • Submit</span> and Smart Xerox branding.
            </p>
          </div>
          <div className="mt-5">
            <Button variant="ghost" className="text-amber-700 hover:bg-amber-50" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={() => setConfirmOpen(true)}>
              Regenerate QR link
            </Button>
            <p className="mt-1 text-xs text-slate-400">
              Regenerating creates a new public link. Previously printed QR codes will stop working.
            </p>
          </div>
        </Card>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Regenerate QR link?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button variant="danger" loading={regenerate.isPending} onClick={() => regenerate.mutate()}>
              Yes, regenerate
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          This creates a new public shop link and QR code. Any previously printed QR codes will no longer work.
          This action cannot be undone.
        </p>
      </Modal>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
