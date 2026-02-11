import { fetchApi } from "./client";

export interface CsvExport {
  id: string;
  userId: string;
  batchId: string;
  fileName: string;
  filePath: string | null;
  fileSize: number | null;
  totalRows: number;
  isArchived: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListExportsResponse {
  exports: CsvExport[];
  total: number;
  page: number;
  limit: number;
}

export interface GenerateCsvRequest {
  batchId: string;
  sendEmail?: boolean;
}

export const csvApi = {
  generate: (data: GenerateCsvRequest, token: string) =>
    fetchApi<{ status: string; data: { taskId: string; message: string } }>(
      "/api/csv/generate",
      {
        method: "POST",
        body: JSON.stringify(data),
        token,
      }
    ),

  listExports: (page = 1, limit = 20, token: string) => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));

    return fetchApi<{ status: string; data: ListExportsResponse }>(
      `/api/csv/exports?${params.toString()}`,
      {
        method: "GET",
        token,
      }
    );
  },

  download: async (id: string, token: string): Promise<Blob> => {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const response = await fetch(`${apiUrl}/api/csv/download/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Download failed",
      }));
      throw new Error(error.message || "Download failed");
    }

    return response.blob();
  },

  archive: (id: string, token: string) =>
    fetchApi<{ status: string; data: CsvExport }>(
      `/api/csv/${id}/archive`,
      {
        method: "PATCH",
        token,
      }
    ),
};
