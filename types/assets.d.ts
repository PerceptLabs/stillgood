declare module "*?url" {
  const url: string;
  export default url;
}

declare module "pdfjs-dist/build/pdf.mjs" {
  export * from "pdfjs-dist";
}

declare module "@/lib/advanced-workloads.mjs" {
  export function buildBenchmarkPdf(options?: {
    pageCount?: number;
    linesPerPage?: number;
    seed?: number;
  }): Uint8Array;
}
