import api from "../../../config/axiosInstance";
import type { AxiosResponse } from "axios";

interface Envelope<T> {
  success?: boolean;
  message?: string;
  data: T;
}

const unwrap = <T,>(response: AxiosResponse<Envelope<T>>) => response.data;

export interface BiometricPayload {
  userId?: string;
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
  ts: string;
}

export interface TfaPayload extends Omit<BiometricPayload, "referenceKey"> {
  referenceKey?: string;
  actcode: string;
  aadhaar: string;
  ts: string;
}

interface Envelope<T> {
  success?: boolean;
  status?: string;
  statusCode?: number;
  message?: string;
  msg?: string;
  data: T;
}

function attr(element: Element | null, name: string) {
  return element?.getAttribute(name) || "";
}

export function parsePidXml(
  xml: string,
): Omit<
  BiometricPayload,
  "outlet_id" | "referenceKey" | "latitude" | "longitude"
> {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  const resp = doc.querySelector("Resp");
  const device = doc.querySelector("DeviceInfo");
  const skey = doc.querySelector("Skey");
  const hmac = doc.querySelector("Hmac");
  const data = doc.querySelector("Data");
  const srno =
    attr(device, "srno") ||
    attr(resp, "srno") ||
    device?.querySelector('Param[name="srno"]')?.getAttribute("value") ||
    "";
  const ts =
    device?.querySelector('Param[name="ts"]')?.getAttribute("value") || "";
  const sysid =
    attr(device, "sysid") ||
    attr(resp, "sysid") ||
    device?.querySelector('Param[name="sysid"]')?.getAttribute("value") ||
    resp?.querySelector('Param[name="sysid"]')?.getAttribute("value") ||
    "";

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
    fType: "2",
    iCount: attr(resp, "iCount") || "0",
    iType: attr(resp, "iType") || "0",
    pCount: attr(resp, "pCount") || "0",
    pType: attr(resp, "pType") || "0",
    srno: srno,
    qScore: attr(resp, "qScore"),
    nmPoints: attr(resp, "nmPoints"),
    sysid: sysid,
    ts: ts,
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

  const seen = new Set<unknown>();

  const walk = (current: unknown) => {
    if (!current || typeof current !== "object" || seen.has(current)) return;
    seen.add(current);

    const record = current as Record<string, unknown>;

    const rawMsg =
      record.msg ??
      record.message ??
      record.error;

    let msgCandidate = "";
    if (typeof rawMsg === "string" && rawMsg.trim()) {
      msgCandidate = rawMsg.trim();
    } else if (typeof rawMsg === "object" && rawMsg !== null) {
      const inner = (rawMsg as Record<string, unknown>).msg || (rawMsg as Record<string, unknown>).message;
      if (typeof inner === "string" && inner.trim()) {
        msgCandidate = inner.trim();
      }
    }

    if (
      msgCandidate &&
      !msgCandidate.toLowerCase().startsWith("request failed with status code") &&
      (prompt.message === "Biometric authentication required" ||
        prompt.message.toLowerCase().startsWith("request failed with status code") ||
        !prompt.message)
    ) {
      prompt.message = msgCandidate;
    }

    const rawOutlet = record.outletId ?? record.outlet_id;
    if (
      (typeof rawOutlet === "string" || typeof rawOutlet === "number") &&
      String(rawOutlet).trim() &&
      !prompt.outletId
    ) {
      prompt.outletId = String(rawOutlet).trim();
    }

    const refCandidate =
      record.referenceKey ||
      record.referencekey ||
      record.ReferenceKey ||
      record.reference_key ||
      record.refKey ||
      record.ref_key;
    if (typeof refCandidate === "string" && refCandidate.trim()) {
      prompt.referenceKey = refCandidate.trim();
    }

    const wadhCandidate =
      record.pidOptionWadh ||
      record.pidoptionwadh ||
      record.PidOptionWadh ||
      record.wadh ||
      record.Wadh;
    if (typeof wadhCandidate === "string" && wadhCandidate.trim()) {
      prompt.pidOptionWadh = wadhCandidate.trim();
    }

    Object.values(record).forEach(walk);
  };

  // Prioritize error response data if value is an Axios error
  if (value && typeof value === "object") {
    const valObj = value as Record<string, unknown>;
    const resData = (valObj.response as Record<string, unknown> | undefined)?.data;
    if (resData && typeof resData === "object") {
      walk(resData);
    }
  }

  walk(value);

  if (value && typeof value === "object" && "data" in (value as Record<string, unknown>)) {
    walk((value as Record<string, unknown>).data);
  }

  return prompt;
}

export function doEkyc(payload: BiometricPayload) {
  return api.post<Envelope<unknown>>("/api/v1/aeps/do-ekyc", payload).then(unwrap);
}

export function doBioEkyc(payload: BiometricPayload) {
  return api.post<Envelope<unknown>>("/api/v1/auth/do-bio-ekyc", payload).then(unwrap);
}

export function checkAepsLoginStatus(outletId?: string) {
  return api.post<
    Envelope<{
      outletId: string;
      kycRequired: boolean;
      provider: unknown;
    }>
  >("/api/v1/aeps/login-status", { outlet_id: outletId || "" }).then(unwrap);
}

export function verifyTfa(payload: TfaPayload) {
  return api.post<Envelope<unknown>>("/api/v1/aeps/verify-tfa", payload).then(unwrap);
}

export interface OnboardMerchantResult {
  userId?: string;
  outletId?: string | number;
  eKYCStatus?: string;
  alreadyOnboarded?: boolean;
  message?: string;
  msg?: string;
  status?: string;
  onboarding?: unknown;
  name?: string;
  dateOfBirth?: string;
  gender?: string;
  pincode?: string;
  state?: string;
  city?: string;
  address?: string;
  profilePic?: string | null;
  data?: {
    outletId?: string | number;
    outlet_id?: string | number;
    name?: string;
    dateOfBirth?: string;
    gender?: string;
    pincode?: string;
    state?: string;
    city?: string;
    address?: string;
    profilePic?: string | null;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export function onboardAepsMerchant() {
  return api.post<Envelope<OnboardMerchantResult>>("/api/v1/aeps/onboard").then(unwrap);
}

export function checkDoEkyc(outletId?: string, userId?: string) {
  return api.post<Envelope<{
    provider: unknown;
    ekyc: unknown;
    kycRequired: boolean;
    status?: string;
    eKYCStatus?: string;
    referenceKey?: string;
    pidOptionWadh?: string;
    message?: string;
  }>>("/api/v1/auth/check-ekyc", {
    outlet_id: outletId || "",
    userId: userId || "",
  }).then(unwrap);
}

export function getRetailerKyc(retailerId: string) {
  return api.get<Envelope<{
    outletId?: string | null;
    aadhaarNumber?: string | null;
  }>>(`/api/v1/aeps/retailer/${retailerId}/kyc-details`).then(unwrap);
}

export interface AepsServicePayload extends Partial<Omit<BiometricPayload, "referenceKey">> {
  outlet_id: string;
  referenceKey: string | null;
  latitude: string;
  longitude: string;
  aadhaar: string;
  ts: string;
  mobile?: string;
  bankiin?: string;
}

export interface CashWithdrawalPayload extends AepsServicePayload {
  amount: number;
}

export interface SendAepsOtpPayload {
  outlet_id: string;
  referenceKey: string;
  latitude: string;
  longitude: string;
  aadhaar: string;
  MobileNumber: string;
  bankiin: string;
  amount: number;
}

export function balanceEnquiry(payload: AepsServicePayload) {
  return api.post<Envelope<unknown>>("/api/v1/aeps/balance-enquiry", payload).then(unwrap);
}

export function miniStatement(payload: AepsServicePayload) {
  return api.post<Envelope<unknown>>("/api/v1/aeps/mini-statement", payload).then(unwrap);
}

export function cashWithdrawal(payload: CashWithdrawalPayload) {
  return api.post<Envelope<Record<string, unknown>>>("/api/v1/aeps/cash-withdraw", payload).then(unwrap);
}

export interface CashDepositPayload extends AepsServicePayload {
  txnid: string;
  amount: number;
  PidDatatype?: string;
  Piddata: string;
  sysid: string;
  nmPoints: string;
  qScore: string;
  pCount: string;
  srno: string;
  pType: string;
  fType: string;
  iType: string;
  iCount: string;
  fCount: string;
  mi: string;
  errCode: string;
  errInfo: string;
  sessionKey: string;
  rdsVer: string;
  rdsId: string;
  dpId: string;
  mc: string;
  hmac: string;
  ci: string;
  dc: string;
  mobile: string;
  bankiin: string;
}

export function cashDeposit(payload: CashDepositPayload) {
  return api.post<Envelope<Record<string, unknown>>>("/api/v1/aeps/cash-deposit", payload).then(unwrap);
}

export function sendAepsOtp(payload: SendAepsOtpPayload) {
  return api.post<Envelope<Record<string, unknown>>>("/api/v1/aeps/send-otp", payload).then(unwrap);
}
