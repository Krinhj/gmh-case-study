declare module "html-to-docx" {
  interface DocxOptions {
    pageSize?: {
      width?: number;
      height?: number;
    };
    margins?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
    orientation?: "portrait" | "landscape";
  }

  export default function htmlToDocx(
    html: string,
    options?: DocxOptions,
    template?: ArrayBuffer | Uint8Array | null,
    transformDocument?: boolean
  ): Promise<ArrayBuffer>;
}
