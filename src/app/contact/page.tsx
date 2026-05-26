import Link from "next/link";
import { PublicContactForm } from "@/components/contact/public-contact-form";

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Need help choosing or setting up your site?</h1>
        <p className="mt-3 text-slate-600">
          Support is on hand to help you choose the right demo, confirm domain options, and get your business live quickly.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Tell us what you need and we&apos;ll get back to you as soon as possible.
        </p>
      </section>

      <PublicContactForm />

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm text-slate-700">
          Want to keep exploring first? You can still{" "}
          <Link href="/#industries" className="font-medium text-sky-700 hover:text-sky-900">
            choose an industry demo
          </Link>{" "}
          or{" "}
          <Link href="/setup/barbers" className="font-medium text-sky-700 hover:text-sky-900">
            submit a setup request
          </Link>{" "}
          when you&apos;re ready.
        </p>
      </section>
    </main>
  );
}

