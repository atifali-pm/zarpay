/**
 * Typed fetch client pointed at the Zarpay backend. Reads `extra.apiUrl`
 * from `app.json` so the URL can be swapped per environment without
 * code changes. Carries a bearer token from `expo-secure-store` on
 * authenticated calls.
 */
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import type {
  ApiError,
  CurrentRateResponse,
  PublicUser,
  QuoteRequest,
  QuoteResponse,
  SignInRequest,
  SignInResponse,
  TransferDetail,
} from "@zarpay/types";

const API_URL: string =
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ??
  "http://localhost:3010";

const TOKEN_KEY = "zarpay.auth.token";

export class ApiClientError extends Error {
  status: number;
  code?: string;
  details?: Record<string, string>;
  constructor(status: number, payload: ApiError) {
    super(payload.error);
    this.name = "ApiClientError";
    this.status = status;
    this.code = payload.code;
    this.details = payload.details;
  }
}

async function request<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (init.auth !== false) {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : undefined;
  if (!res.ok) {
    throw new ApiClientError(res.status, (data as ApiError) ?? { error: res.statusText });
  }
  return data as T;
}

export const api = {
  async getCurrentRate(): Promise<CurrentRateResponse> {
    return request<CurrentRateResponse>("/api/rates/current", { auth: false });
  },

  async signIn(body: SignInRequest): Promise<SignInResponse> {
    const result = await request<SignInResponse>("/api/auth/signin", {
      method: "POST",
      body: JSON.stringify(body),
      auth: false,
    });
    await SecureStore.setItemAsync(TOKEN_KEY, result.token);
    return result;
  },

  async signOut(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },

  async getMe(): Promise<{ user: PublicUser }> {
    return request<{ user: PublicUser }>("/api/me");
  },

  async quoteTransfer(body: QuoteRequest): Promise<QuoteResponse> {
    return request<QuoteResponse>("/api/transfers/quote", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async getTransferDetail(id: string): Promise<TransferDetail> {
    return request<TransferDetail>(`/api/transfers/${encodeURIComponent(id)}`);
  },
};

export { API_URL };
