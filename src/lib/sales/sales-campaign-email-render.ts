export type SalesEmailRenderOptions = {
  landingPageLink: string;
  demoLink: string;
  unsubscribeLink: string;
  siteUrl?: string;
};

const DEFAULT_BANNER_PATH = "/email/myexperiment-email-hero.png";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeUrl(baseUrl?: string): string {
  return (baseUrl || "").replace(/\/+$/, "");
}

function toAbsoluteUrl(url: string, siteUrl?: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const base = normalizeUrl(siteUrl);
  if (!base) return url;
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

function withLinkedUrls(text: string): string {
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  return escapeHtml(text).replace(urlPattern, (rawUrl) => {
    const safeUrl = escapeHtml(rawUrl);
    return `<a href="${safeUrl}" style="color:#0f766e;text-decoration:underline;word-break:break-word">${safeUrl}</a>`;
  });
}

function buildBodyBlocks(text: string, options: SalesEmailRenderOptions): string {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let paragraph: string[] = [];
  let bullets: string[] = [];

  const skipLinkOnlyLine = (line: string): boolean => {
    const trimmed = line.trim();
    return (
      trimmed === options.landingPageLink.trim() ||
      trimmed === options.demoLink.trim() ||
      trimmed === options.unsubscribeLink.trim()
    );
  };

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push(
      `<p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.65">${withLinkedUrls(paragraph.join(" "))}</p>`,
    );
    paragraph = [];
  };

  const flushBullets = () => {
    if (bullets.length === 0) return;
    blocks.push(
      `<ul style="margin:0 0 14px 20px;padding:0;color:#334155;font-size:15px;line-height:1.6">${bullets
        .map((item) => `<li style="margin:0 0 6px">${withLinkedUrls(item)}</li>`)
        .join("")}</ul>`,
    );
    bullets = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || skipLinkOnlyLine(line)) {
      flushParagraph();
      flushBullets();
      continue;
    }

    const bulletMatch = line.match(/^[-*]\s+(.+)/);
    if (bulletMatch) {
      flushParagraph();
      bullets.push(bulletMatch[1]);
      continue;
    }

    flushBullets();
    paragraph.push(line);
  }

  flushParagraph();
  flushBullets();
  return blocks.join("");
}

export function buildSalesCampaignEmailHtml(
  subject: string,
  text: string,
  options: SalesEmailRenderOptions,
): string {
  const bodyBlocks = buildBodyBlocks(text, options);
  const siteUrl = normalizeUrl(options.siteUrl);
  const heroUrl = toAbsoluteUrl(DEFAULT_BANNER_PATH, siteUrl);
  const landingLink = toAbsoluteUrl(options.landingPageLink, siteUrl);
  const demoLink = toAbsoluteUrl(options.demoLink, siteUrl);
  const unsubscribeLink = toAbsoluteUrl(options.unsubscribeLink, siteUrl);

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:Helvetica,Arial,sans-serif">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:20px 10px">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden">
            <tr>
              <td>
                <img src="${heroUrl}" alt="MyExperiment.club - a complete business website for GBP30/month" style="display:block;width:100%;height:auto;border:0" />
              </td>
            </tr>
            <tr>
              <td style="padding:24px 24px 12px">
                <h1 style="margin:0 0 14px;color:#0f3440;font-size:24px;line-height:1.3">${escapeHtml(subject)}</h1>
                ${bodyBlocks}
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:10px 0 6px">
                  <tr>
                    <td style="padding:0 12px 12px 0">
                      <a href="${escapeHtml(landingLink)}" style="display:inline-block;background:#5eead4;color:#083344;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:999px;font-size:14px">See how it works</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 8px;font-size:14px;line-height:1.55;color:#475569">
                  Want to view a working example first?
                  <a href="${escapeHtml(demoLink)}" style="color:#0f766e;text-decoration:underline;font-weight:600">View example demo</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 24px 24px;border-top:1px solid #e2e8f0;background:#f8fafc">
                <p style="margin:0 0 6px;font-size:13px;color:#475569">MyExperiment.club</p>
                <p style="margin:0 0 6px;font-size:12px;color:#64748b">
                  You are receiving this because your business was identified as a potential fit for our platform.
                </p>
                <p style="margin:0;font-size:12px;color:#64748b">
                  <a href="${escapeHtml(unsubscribeLink)}" style="color:#0f766e;text-decoration:underline">Unsubscribe from these emails</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function buildSalesCampaignPlainText(
  text: string,
  options: Pick<SalesEmailRenderOptions, "landingPageLink" | "demoLink" | "unsubscribeLink">,
): string {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  const parts = [normalized];
  if (!normalized.includes(options.landingPageLink)) {
    parts.push(`See how it works:\n${options.landingPageLink}`);
  }
  if (!normalized.includes(options.demoLink)) {
    parts.push(`View example demo:\n${options.demoLink}`);
  }
  if (!normalized.toLowerCase().includes("unsubscribe") || !normalized.includes(options.unsubscribeLink)) {
    parts.push(`Unsubscribe:\n${options.unsubscribeLink}`);
  }
  return parts.join("\n\n").trim();
}

