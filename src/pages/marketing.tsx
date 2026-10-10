import { Link } from "react-router-dom";
import {
  Clock,
  FileText,
  Mail,
  MapPin,
  Phone,
  Printer,
  QrCode,
  ShieldCheck,
  Smartphone,
  Upload,
  Wallet,
} from "lucide-react";
import { Button, Card } from "@/components/ui";

function PageHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <section className="bg-gradient-to-br from-primary-50 via-white to-cyan-50 py-14">
      <div className="container-page max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">{eyebrow}</p>
        <h1 className="mt-2 text-4xl font-extrabold text-ink">{title}</h1>
        <p className="mt-3 text-lg text-muted">{subtitle}</p>
      </div>
    </section>
  );
}

export function Features() {
  const items = [
    { icon: QrCode, t: "Shop QR codes", d: "Permanent QR per shop with PNG, SVG and printable poster downloads." },
    { icon: Upload, t: "PDF uploads", d: "Drag-and-drop, real validation, page counting and secure previews." },
    { icon: Smartphone, t: "Mobile-first flow", d: "Optimised for phones so customers can submit in under a minute." },
    { icon: Wallet, t: "Dynamic pricing", d: "Per-shop rates for A4/A3/Letter, B&W & colour, with minimums." },
    { icon: Clock, t: "Live order feed", d: "New requests appear instantly with notifications and optional sound." },
    { icon: ShieldCheck, t: "Privacy-first", d: "Documents auto-delete after completion; only metadata is retained." },
    { icon: FileText, t: "Manual control", d: "Preview, print and progress each job through a clear status flow." },
    { icon: Printer, t: "Future-ready", d: "Architecture prepared for a Windows print agent and online payments." },
  ];
  return (
    <div>
      <PageHeader
        eyebrow="Features"
        title="A complete counter workflow"
        subtitle="Everything a print shop needs to receive and manage digital print requests."
      />
      <section className="container-page grid gap-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((i) => (
          <Card key={i.t}>
            <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-primary-50 text-primary">
              <i.icon className="h-5 w-5" />
            </div>
            <p className="font-bold text-ink">{i.t}</p>
            <p className="mt-1 text-sm text-muted">{i.d}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}

export function HowItWorks() {
  const customer = [
    "Scan the shop QR code",
    "Upload your PDF",
    "Choose print settings",
    "See the price instantly",
    "Submit — pay at the shop",
    "Track your order status",
  ];
  const owner = [
    "Register and get approved",
    "Configure your printing rates",
    "Print & display your QR poster",
    "Receive structured orders",
    "Preview and print manually",
    "Mark printed, ready & collected",
  ];
  return (
    <div>
      <PageHeader
        eyebrow="How it works"
        title="From scan to collected"
        subtitle="A transparent, manual workflow for Phase 1 — with a clear path to automation."
      />
      <section className="container-page grid gap-8 py-14 lg:grid-cols-2">
        <Card>
          <h2 className="text-xl font-bold text-ink">For customers</h2>
          <ol className="mt-4 space-y-3">
            {customer.map((c, i) => (
              <li key={c} className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-50 text-sm font-bold text-primary">
                  {i + 1}
                </span>
                <span className="text-slate-700">{c}</span>
              </li>
            ))}
          </ol>
        </Card>
        <Card>
          <h2 className="text-xl font-bold text-ink">For shop owners</h2>
          <ol className="mt-4 space-y-3">
            {owner.map((c, i) => (
              <li key={c} className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-cyan-50 text-sm font-bold text-accent">
                  {i + 1}
                </span>
                <span className="text-slate-700">{c}</span>
              </li>
            ))}
          </ol>
        </Card>
      </section>
      <div className="container-page pb-16 text-center">
        <Link to="/register"><Button size="lg">Register your shop</Button></Link>
      </div>
    </div>
  );
}

export function PricingPage() {
  const rows = [
    ["A4", "Black & White", "₹2"],
    ["A4", "Colour", "₹10"],
    ["A3", "Black & White", "₹5"],
    ["A3", "Colour", "₹20"],
    ["Letter", "Black & White", "₹3"],
    ["Letter", "Colour", "₹12"],
  ];
  return (
    <div>
      <PageHeader
        eyebrow="Pricing"
        title="Simple, shop-controlled pricing"
        subtitle="These are sample rates. Every shop owner sets their own prices independently."
      />
      <section className="container-page max-w-2xl py-14">
        <Card className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">Paper</th>
                <th className="px-5 py-3 font-semibold">Mode</th>
                <th className="px-5 py-3 font-semibold">Sample price / page</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.join()} className="bg-white">
                  <td className="px-5 py-3 font-semibold text-ink">{r[0]}</td>
                  <td className="px-5 py-3 text-slate-700">{r[1]}</td>
                  <td className="px-5 py-3 font-semibold text-primary">{r[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <p className="mt-4 text-center text-sm text-muted">
          Smart Xerox itself is free to try in Phase 1. Online payments and automatic printing are{" "}
          <span className="font-semibold text-primary">Coming Soon</span>.
        </p>
      </section>
    </div>
  );
}

export function Contact() {
  return (
    <div>
      <PageHeader
        eyebrow="Contact"
        title="Talk to the Smart Xerox team"
        subtitle="Questions, feedback or partnership enquiries — we'd love to hear from you."
      />
      <section className="container-page max-w-3xl py-14">
        <div className="grid gap-5 sm:grid-cols-3">
          <Card className="text-center">
            <Mail className="mx-auto h-6 w-6 text-primary" />
            <p className="mt-2 font-semibold text-ink">Email</p>
            <p className="text-sm text-muted">support@smartxerox.app</p>
          </Card>
          <Card className="text-center">
            <Phone className="mx-auto h-6 w-6 text-primary" />
            <p className="mt-2 font-semibold text-ink">Phone</p>
            <p className="text-sm text-muted">+91 90000 00000</p>
          </Card>
          <Card className="text-center">
            <MapPin className="mx-auto h-6 w-6 text-primary" />
            <p className="mt-2 font-semibold text-ink">Office</p>
            <p className="text-sm text-muted">Bengaluru, India</p>
          </Card>
        </div>
        <Card className="mt-6">
          <p className="text-sm text-muted">
            This is a Phase 1 demonstration build. Contact form delivery is not wired to a live inbox
            yet — please use the email address above. Demo and simulated operations are clearly
            labelled throughout the product.
          </p>
          <Link to="/register" className="mt-4 inline-block">
            <Button>Register your shop</Button>
          </Link>
        </Card>
      </section>
    </div>
  );
}
