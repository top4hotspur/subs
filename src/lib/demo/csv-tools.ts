export type CsvPreview = {
  type: "services" | "staff";
  rows: string[];
  fileName: string;
};

export function parseSimpleCsv(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(1)
    .map((line) => line.split(",")[0]?.replace(/^"|"$/g, "")?.trim())
    .filter((value) => Boolean(value));
}

export function downloadCsvTemplate(filename: string, csv: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export async function readCsvFile(file: File): Promise<string[]> {
  const content = await file.text();
  return parseSimpleCsv(content);
}
