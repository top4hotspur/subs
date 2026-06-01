import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { verifySalesUnsubscribeToken } from "@/lib/sales/sales-unsubscribe-token";

type Props = {
  searchParams: Promise<{ token?: string }>;
};

export default async function SalesUnsubscribePage({ searchParams }: Props) {
  const { token } = await searchParams;
  const parsed = token ? verifySalesUnsubscribeToken(token) : null;

  if (parsed) {
    await prisma.salesLead.updateMany({
      where: { id: parsed.leadId },
      data: {
        marketingStatus: "UNSUBSCRIBED",
        unsubscribedAt: new Date(),
        doNotContactReason: "Lead unsubscribed from marketing outreach link.",
      },
    });
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Unsubscribe updated</h1>
        <p className="mt-2 text-sm text-slate-700">
          {parsed
            ? "You have been unsubscribed from sales outreach emails."
            : "We could not verify this unsubscribe link."}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          If you still receive messages, contact MyExperiment.club support.
        </p>
        <Link className="mt-4 inline-block text-sm font-semibold text-sky-700" href="/">
          Return to homepage
        </Link>
      </section>
    </main>
  );
}
