import { request } from "../../utils/request";
import type { HealthResponse } from "./types";

export class HealthApi {
  check() {
    return request<HealthResponse>({ url: "/health", method: "GET" });
  }
}

export const healthApi = new HealthApi();
