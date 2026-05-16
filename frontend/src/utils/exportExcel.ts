import * as XLSX from 'xlsx';

export interface ExportColumn<T extends Record<string, unknown>> {
  title: string;
  dataIndex: keyof T;
  render?: (value: T[keyof T], record: T) => string | number;
}

/** Export table data to Excel file */
export function exportTableToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  filename = 'export.xlsx',
): void {
  const headers = columns.map((c) => c.title);
  const rows = data.map((record) =>
    columns.map((col) => {
      const raw = record[col.dataIndex];
      return col.render ? col.render(raw, record) : String(raw ?? '');
    }),
  );
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Sheet1');
  XLSX.writeFile(workbook, filename);
}
