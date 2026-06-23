// Typed API functions for the Phase 7 Lead Import System.
import { apiFetch } from "./client";

export type CsvProvider = "apollo" | "linkedin" | "salesnavigator" | "generic";

export interface CompanyPreview {
  name: string;
  industry: string;
  country: string;
  dmCount: number;
}

export interface LeadPreview {
  name: string;
  role: string;
  normalizedRole: string;
  email: string;
  company: string;
  linkedin: string;
}

export interface QualityReport {
  score: number;
  grade: "A" | "B" | "C" | "D";
  totalRows: number;
  validRows: number;
  skippedRows: number;
  parseErrorCount: number;
  completeness: {
    company: number;
    title: number;
    email: number;
    linkedin: number;
    country: number;
    employees: number;
  };
  duplicatesInFile: { companies: number; decisionMakers: number };
  titleNormalization: { coverage: number; normalized: number; unmatched: number };
  sourceDetection: { provider: CsvProvider; confidence: number; matchedSignals: string[] };
  seniorityDistribution: Record<string, number>;
  topRoles: Array<{ role: string; count: number }>;
  warnings: string[];
}

export interface ImportPreviewResult {
  provider: CsvProvider;
  filename: string;
  totalRows: number;
  validRows: number;
  skippedRows: number;
  companiesDetected: number;
  decisionMakersDetected: number;
  parseErrors: Array<{ row: number; message: string }>;
  quality: QualityReport;
  companyPreview: CompanyPreview[];
  leadPreview: LeadPreview[];
}

export interface ImportStats {
  batchSlug: string;
  provider: CsvProvider;
  totalRows: number;
  companiesCreated: number;
  companiesSkipped: number;
  decisionMakersCreated: number;
  decisionMakersSkipped: number;
  errorCount: number;
  errors: Array<{ row: number; message: string }>;
}

export interface ImportBatch {
  id: number;
  slug: string;
  filename: string;
  provider: string;
  rowCount: number | null;
  companiesCreated: number | null;
  companiesSkipped: number | null;
  decisionMakersCreated: number | null;
  decisionMakersSkipped: number | null;
  errorCount: number | null;
  status: string | null;
  createdAt: string | null;
  completedAt: string | null;
}

function makeFormData(file: File): FormData {
  const form = new FormData();
  form.append("file", file);
  return form;
}

/** Parse a CSV and return a preview without writing to the database. */
export function previewImport(file: File): Promise<ImportPreviewResult> {
  return apiFetch<ImportPreviewResult>("/import/preview", {
    method: "POST",
    body: makeFormData(file),
  });
}

/** Commit the CSV to the database and return import statistics. */
export function confirmImport(file: File): Promise<ImportStats> {
  return apiFetch<ImportStats>("/import/confirm", {
    method: "POST",
    body: makeFormData(file),
  });
}

/** Fetch all import batches ordered by most recent first. */
export function fetchImportBatches(): Promise<ImportBatch[]> {
  return apiFetch<ImportBatch[]>("/import/batches");
}

/** Delete a batch audit record (does NOT delete the imported companies/DMs). */
export function deleteImportBatch(slug: string): Promise<void> {
  return apiFetch<void>(`/import/batches/${slug}`, { method: "DELETE" });
}
