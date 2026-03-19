declare module 'jspdf/dist/jspdf.umd.min.js' {
  export class jsPDF {
    constructor(options?: unknown);
    internal: {
      pageSize: {
        getWidth(): number;
        getHeight(): number;
      };
    };
    setFont(fontName: string, fontStyle: string): void;
    setFontSize(size: number): void;
    text(text: string, x: number, y: number, options?: { align?: 'right' }): void;
    setLineWidth(width: number): void;
    line(x1: number, y1: number, x2: number, y2: number): void;
    getTextWidth(text: string): number;
    addPage(): void;
    output(type: 'bloburl' | 'dataurlstring'): string;
    save(filename: string): void;
    autoPrint?(): void;
  }

  const defaultExport: {
    jsPDF: typeof jsPDF;
  };

  export default defaultExport;
}
