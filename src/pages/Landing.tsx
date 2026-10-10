import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  CreditCard,
  FileText,
  Printer,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Upload,
  Wallet,
} from "lucide-react";
import { Button, Card } from "@/components/ui";

const steps = [
  { icon: QrCode, title: "Scan the QR", text: "Customers scan your shop QR to open a mobile printing page — no app, no login." },
  { icon: Upload, title: "Upload PDF", text: "They upload a PDF and choose colour, paper, sides, copies and page range." },
  { icon: Wallet, title: "See the price", text: "Price is calculated instantly from your shop's rates. Pay at the counter." },
  { icon: Printer, title: "Print manually", text: "You receive the order, preview the document and print it. Mark it done." },
];

const features = [
  { icon: QrCode, title: "Unique shop QR", text: "Every shop gets a permanent QR code with PNG, SVG and printable poster downloads." },
  { icon: Smartphone, title: "Mobile-first", text: "The customer flow is designed for phones — fast, clear and touch-friendly." },
  { icon: FileText, title: "PDF intelligence", text: "Real page-count detection, validation and secure previews of uploaded documents." },
  { icon: CreditCard, title: "Server-side pricing", text: "Authoritative pricing with per-shop rates, minimums and handling charges." },
  { icon: Clock, title: "Live order feed", text: "New orders appear on your dashboard with notifications and optional sound." },
  { icon: ShieldCheck, title: "Privacy-first storage", text: "Documents auto-delete after completion. Only minimal order metadata is kept." },
];

const faqs = [
  { q: "Do customers need to install anything?", a: "No. Customers simply scan the QR code and use the mobile web page. No app, no account." },
  { q: "Is online payment available?", a: "Not in Phase 1. Customers pay at your shop counter. Online payments are planned and labelled 'Coming Soon'." },
  { q: "Does it print automatically?", a: "Not yet. Phase 1 is a manual workflow: you preview the document and print it yourself. The Windows print agent is planned for a future phase." },
  { q: "Who can see a customer's document?", a: "Only the shop the customer submitted to, through a short-lived secure link. Documents are deleted automatically after the retention period." },
];

export default function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-50 via-white to-cyan-50" />
        <div className="container-page grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> QR-based printing for modern shops
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight text-ink sm:text-5xl">
              Print Smarter. <br className="hidden sm:block" />
              <span className="text-primary">Skip the Waiting.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              Let customers scan, upload, and submit printing requests directly to your shop with
              Smart Xerox. Fewer lines, fewer mistakes, more orders.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register">
                <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Register Your Shop
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button size="lg" variant="outline">
                  See How It Works
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-slate-400">
              Automatic printing & online payments are <span className="font-semibold text-primary">Coming Soon</span>.
            </p>
          </div>

          <div className="relative">
            <div className="mx-auto max-w-sm rounded-[2rem] border border-line bg-white p-4 shadow-soft">
              <div className="rounded-3xl bg-secondary p-4">
                <div className="mb-3 flex items-center justify-between text-white">
                  <span className="text-sm font-semibold">Demo Print Hub</span>
                  <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-300">Accepting</span>
                </div>
                <div className="space-y-3 rounded-2xl bg-white p-4">
                  <div className="flex items-center gap-3 rounded-xl border border-dashed border-line p-4">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-sm font-semibold text-ink">notes.pdf</p>
                      <p className="text-xs text-muted">4 pages • 320 KB</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-slate-50 px-3 py-2"><span className="text-muted">Mode</span><p className="font-semibold">B&amp;W</p></div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2"><span className="text-muted">Paper</span><p className="font-semibold">A4</p></div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2"><span className="text-muted">Copies</span><p className="font-semibold">2</p></div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2"><span className="text-muted">Sides</span><p className="font-semibold">Single</p></div>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-primary-50 px-4 py-3">
                    <span className="text-sm text-primary-700">Total (pay at shop)</span>
                    <span className="text-lg font-bold text-primary-700">₹16</span>
                  </div>
                  <Button className="w-full">Submit Print Request</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container-page py-16">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-ink">How it works</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted">Four simple steps from scan to print.</p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Card key={s.title} className="relative">
              <span className="absolute right-4 top-4 text-3xl font-extrabold text-slate-100">{i + 1}</span>
              <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-primary-50 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <p className="font-bold text-ink">{s.title}</p>
              <p className="mt-1 text-sm text-muted">{s.text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-16">
        <div className="container-page">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-ink">Everything your shop needs</h2>
            <p className="mx-auto mt-2 max-w-xl text-muted">Built for Indian Xerox shops, from day one.</p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title}>
                <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-cyan-50 text-accent">
                  <f.icon className="h-5 w-5" />
                </div>
                <p className="font-bold text-ink">{f.title}</p>
                <p className="mt-1 text-sm text-muted">{f.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container-page py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-extrabold text-ink">Built for busy counters</h2>
            <ul className="mt-6 space-y-4">
              {[
                "Reduce queues — customers submit before they reach the counter.",
                "No typos or missed details: print settings are captured digitally.",
                "Track every order, from submitted to collected.",
                "Independent pricing per shop, with immutable order snapshots.",
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                  <span className="text-slate-700">{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <Card className="bg-secondary text-white">
            <p className="text-sm uppercase tracking-wide text-slate-400">QR-based printing</p>
            <p className="mt-2 text-2xl font-bold">One QR. Every order.</p>
            <p className="mt-3 text-sm text-slate-300">
              Print your shop QR poster and stick it near the counter. Customers scan, upload and
              submit — you get a clean, structured order.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              {["Upload", "Customize", "Submit"].map((t) => (
                <div key={t} className="rounded-xl bg-white/5 py-3 text-sm font-semibold">{t}</div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-16">
        <div className="container-page max-w-3xl">
          <h2 className="text-center text-3xl font-extrabold text-ink">Frequently asked questions</h2>
          <div className="mt-8 space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-line bg-card p-5">
                <summary className="cursor-pointer list-none font-semibold text-ink">{f.q}</summary>
                <p className="mt-2 text-sm text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page py-16">
        <div className="rounded-3xl bg-gradient-to-r from-primary to-accent p-10 text-center text-white">
          <h2 className="text-3xl font-extrabold">Ready to digitise your printing counter?</h2>
          <p className="mx-auto mt-2 max-w-xl text-white/90">
            Register your shop, get your QR code and start receiving structured print requests today.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/register">
              <Button size="lg" variant="secondary">Register Your Shop</Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
                Contact us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
