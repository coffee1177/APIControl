import axios, { type AxiosRequestConfig } from "axios";

interface ApiErrorResponse {
  detail?: unknown;
}

export interface PaginatedResponse<Item> {
  items: Item[];
  page: number;
  size: number;
  total: number;
}

export class RequestError extends Error {
  status?: number;
  detail?: unknown;

  constructor(message: string, status?: number, detail?: unknown) {
    super(message);
    this.name = "RequestError";
    this.status = status;
    this.detail = detail;
  }
}

function getDetailMessage(detail: unknown): string | undefined {
  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === "object" && item !== null && "msg" in item) {
          return String(item.msg);
        }
        return undefined;
      })
      .filter((message): message is string => Boolean(message));
    return messages.length > 0 ? messages.join("；") : undefined;
  }

  return undefined;
}

const requestInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000",
  timeout: 10_000,
  headers: { Accept: "application/json" },
});

export async function request<ResponseData = unknown, RequestData = unknown>(
  config: AxiosRequestConfig<RequestData>,
): Promise<ResponseData> {
  try {
    const response = await requestInstance.request<ResponseData>(config);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      const detail = error.response?.data?.detail;
      const message =
        getDetailMessage(detail) ??
        (error.code === "ECONNABORTED"
          ? "请求超时，请稍后重试"
          : error.response
            ? "请求失败，请稍后重试"
            : "无法连接服务，请检查网络或后端服务");
      throw new RequestError(message, error.response?.status, detail);
    }

    throw error;
  }
}
