import { apiClient } from "../client";
import { getToken } from "../../../utils/auth";

export interface BiometricPayload {
  outlet_id: string;
  referenceKey: string;
  latitude: string;
  longitude: string;
  dc: string;
  ci: string;
  hmac: string;
  mc: string;
  dpId: string;
  PidDatatype: string;
  Piddata: string;
  rdsId: string;
  rdsVer: string;
  sessionKey: string;
  mi: string;
  errInfo: string;
  errCode: string;
  fCount: string;
  fType: string;
  iCount: string;
  iType: string;
  pCount: string;
  pType: string;
  srno: string;
  qScore: string;
  nmPoints: string;
  sysid: string;
}

export interface TfaPayload extends BiometricPayload {
  aadhaar: string;
  ts: string;
}

interface Envelope<T> {
  success?: boolean;
  message?: string;
  data: T;
}

const authOptions = () => ({
  token: getToken() ?? undefined,
});

function attr(element: Element | null, name: string) {
  return element?.getAttribute(name) || "";
}

export function parsePidXml(xml: string): Omit<
  BiometricPayload,
  "outlet_id" | "referenceKey" | "latitude" | "longitude"
> {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  const resp = doc.querySelector("Resp");
  const device = doc.querySelector("DeviceInfo");
  const skey = doc.querySelector("Skey");
  const hmac = doc.querySelector("Hmac");
  const data = doc.querySelector("Data");

  return {
    dc: attr(device, "dc"),
    ci: attr(skey, "ci"),
    hmac: hmac?.textContent?.trim() || "",
    mc: attr(device, "mc"),
    dpId: attr(device, "dpId"),
    PidDatatype: attr(data, "type"),
    Piddata: data?.textContent?.trim() || "",
    rdsId: attr(device, "rdsId"),
    rdsVer: attr(device, "rdsVer"),
    sessionKey: skey?.textContent?.trim() || "",
    mi: attr(device, "mi"),
    errInfo: attr(resp, "errInfo"),
    errCode: attr(resp, "errCode"),
    fCount: attr(resp, "fCount") || "1",
    fType: attr(resp, "fType") || "0",
    iCount: attr(resp, "iCount") || "0",
    iType: attr(resp, "iType") || "0",
    pCount: attr(resp, "pCount") || "0",
    pType: attr(resp, "pType") || "0",
    srno: attr(device, "srno") || attr(resp, "srno"),
    qScore: attr(resp, "qScore"),
    nmPoints: attr(resp, "nmPoints"),
    sysid: attr(device, "sysid"),
  };
}

function findAction(value: unknown): string {
  if (!value || typeof value !== "object") return "";

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findAction(item);
      if (found) return found;
    }
    return "";
  }

  const record = value as Record<string, unknown>;
  if (typeof record.action === "string") return record.action;
  if (typeof record.Action === "string") return record.Action;

  for (const nested of Object.values(record)) {
    if (nested && typeof nested === "object") {
      const found = findAction(nested);
      if (found) return found;
    }
  }

  return "";
}

export function isActionRequired(value: unknown) {
  const action = findAction(value).trim().toLowerCase().replace(/-/g, " ");
  return action === "action required";
}

export interface EkycPrompt {
  message: string;
  outletId: string;
  referenceKey: string;
  pidOptionWadh: string;
}

export function readEkycPrompt(value: unknown): EkycPrompt {
  const prompt: EkycPrompt = {
    message: "Biometric authentication required",
    outletId: "",
    referenceKey: "",
    pidOptionWadh: "",
  };

  const walk = (current: unknown) => {
    if (!current || typeof current !== "object") return;
    const record = current as Record<string, unknown>;

    if (typeof record.msg === "string" && record.msg.trim()) {
      prompt.message = record.msg;
    }
    if (typeof record.outletId === "string" && record.outletId && !prompt.outletId) {
      prompt.outletId = record.outletId;
    }
    if (typeof record.referenceKey === "string") {
      prompt.referenceKey = record.referenceKey;
    }
    if (typeof record.pidOptionWadh === "string") {
      prompt.pidOptionWadh = record.pidOptionWadh;
    }

    Object.values(record).forEach(walk);
  };

  walk(value);
  return prompt;
}

export function doEkyc(payload: BiometricPayload) {
  return apiClient<Envelope<unknown>>("/api/v1/aeps/do-ekyc", {
    ...authOptions(),
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function doBioEkyc(payload: BiometricPayload) {
  return apiClient<Envelope<unknown>>("/api/v1/auth/do-bio-ekyc", {
    ...authOptions(),
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function verifyTfa(payload: TfaPayload) {
  return apiClient<Envelope<unknown>>("/api/v1/aeps/verify-tfa", {
    ...authOptions(),
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function checkDoEkyc(outletId?: string) {
  return apiClient<
    Envelope<{
      provider: unknown;
      ekyc: unknown;
      kycRequired: boolean;
    }>
  >("/api/v1/auth/check-ekyc", {
    ...authOptions(),
    method: "POST",
    body: JSON.stringify({ outlet_id: outletId || "" }),
  });
}

export function checkAepsLoginStatus(outletId?: string) {
  return apiClient<
    Envelope<{
      outletId: string;
      kycRequired: boolean;
      provider: unknown;
    }>
  >("/api/v1/aeps/login-status", {
    ...authOptions(),
    method: "POST",
    body: JSON.stringify({ outlet_id: outletId || "" }),
  });
}

export function getRetailerKyc(retailerId: string) {
  return apiClient<
    Envelope<{
      outletId?: string | null;
      aadhaarNumber?: string | null;
    }>
  >(`/api/v1/aeps/retailer/${retailerId}/kyc-details`, {
    ...authOptions(),
    method: "GET",
  });
}
