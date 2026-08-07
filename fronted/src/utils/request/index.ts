import axios, { type AxiosRequestConfig } from "axios";

const requestInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000",
  timeout: 10_000,
  headers: { Accept: "application/json" },
});

export async function request<ResponseData = unknown, RequestData = unknown>(
  config: AxiosRequestConfig<RequestData>,
): Promise<ResponseData> {
  const response = await requestInstance.request<ResponseData>(config);
  return response.data;
}
