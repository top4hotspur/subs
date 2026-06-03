function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function paragraphsToHtml(body: string): string {
  return body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => {
      const bulletLines = paragraph.split("\n").map((line) => line.trim()).filter(Boolean);
      if (bulletLines.length > 0 && bulletLines.every((line) => line.startsWith("- ") || line.startsWith("* "))) {
        return `<ul style="margin:16px 0;padding-left:22px;color:#334155;line-height:1.6;">${bulletLines
          .map((line) => `<li>${escapeHtml(line.slice(2).trim())}</li>`)
          .join("")}</ul>`;
      }
      return `<p style="margin:0 0 16px;color:#334155;line-height:1.6;">${escapeHtml(paragraph).replaceAll("\n", "<br />")}</p>`;
    })
    .join("");
}

export function renderCustomerMarketingEmail(input: {
  businessName: string;
  title: string;
  subject: string;
  body: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  unsubscribeLink: string;
}): { text: string; html: string } {
  const ctaLabel = input.ctaLabel?.trim() || "View offer";
  const ctaUrl = input.ctaUrl?.trim() || null;
  const contactLines = [
    input.contactEmail ? `Email: ${input.contactEmail}` : null,
    input.contactPhone ? `Phone: ${input.contactPhone}` : null,
  ].filter(Boolean);
  const text = [
    input.businessName,
    "",
    input.title,
    "",
    input.body.trim(),
    ctaUrl ? `\n${ctaLabel}: ${ctaUrl}` : null,
    contactLines.length > 0 ? `\nContact ${input.businessName}:\n${contactLines.join("\n")}` : null,
    "",
    `Unsubscribe from marketing messages from ${input.businessName}:`,
    input.unsubscribeLink,
    "",
    "Transactional booking emails are not affected by this marketing preference.",
    "Powered by MyExperiment.club",
  ].filter((line): line is string => line !== null).join("\n");

  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#f8fafc;font-family:Helvetica,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;">
            <tr>
              <td style="background:#0f766e;padding:26px 28px;">
                <p style="margin:0 0 8px;color:#ccfbf1;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">${escapeHtml(input.businessName)}</p>
                <h1 style="margin:0;color:#ffffff;font-size:26px;line-height:1.2;">${escapeHtml(input.title)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                ${paragraphsToHtml(input.body)}
                ${ctaUrl ? `<p style="margin:24px 0;"><a href="${escapeHtml(ctaUrl)}" style="display:inline-block;border-radius:999px;background:#5eead4;color:#064e3b;font-weight:700;text-decoration:none;padding:12px 18px;">${escapeHtml(ctaLabel)}</a></p>` : ""}
                <div style="margin-top:24px;border-top:1px solid #e2e8f0;padding-top:18px;color:#475569;font-size:14px;line-height:1.6;">
                  <p style="margin:0 0 8px;font-weight:700;color:#0f172a;">Contact ${escapeHtml(input.businessName)}</p>
                  ${input.contactEmail ? `<p style="margin:0;">Email: <a href="mailto:${escapeHtml(input.contactEmail)}" style="color:#0f766e;">${escapeHtml(input.contactEmail)}</a></p>` : ""}
                  ${input.contactPhone ? `<p style="margin:0;">Phone: ${escapeHtml(input.contactPhone)}</p>` : ""}
                </div>
              </td>
            </tr>
            <tr>
              <td style="background:#f1f5f9;padding:18px 28px;color:#64748b;font-size:12px;line-height:1.6;">
                <p style="margin:0 0 8px;">You are receiving this because you opted in to marketing messages from ${escapeHtml(input.businessName)}.</p>
                <p style="margin:0 0 8px;"><a href="${escapeHtml(input.unsubscribeLink)}" style="color:#0f766e;font-weight:700;">Unsubscribe from these marketing messages</a></p>
                <p style="margin:0;">Transactional booking emails are not affected. Powered by MyExperiment.club.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { text, html };
}
