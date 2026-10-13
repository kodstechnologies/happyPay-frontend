import api from "../config/axiosInstance";
// import type { ExtractedBiometricData } from "../utils/biometric";

export interface RemitterEkycPayload {
  mobile: string;
  outletid?: string | number;
  referenceKey?: string;
  latitude: string | number;
  longitude: string | number;
  txnid: string | number;
  ci: string;
  hmac: string;
  Piddata: string;
  ts: string;
  dpId: string;
  dc: string;
  mi: string;
  mc: string;
  rdsVer: string;
  rdsId: string;
  sessionKey: string;
  srno: string;
}

export interface RemitterPayload {
  mobile: string;
  aadhaar?: string;
}

export interface RegisterRemitterPayload extends RemitterPayload {
  aadhaar: string;
  referenceKey?: string;
}

export interface VerifyRemitterOtpPayload extends RemitterPayload {
  otp: string;
  referenceKey?: string;
}

export interface AddBeneficiaryPayload {
  bankId: string | number;
  outletid: string | number;
  name: string;
  ifsc: string;
  accountNumber: string;
  beneficiaryMobile: string;
  remitterMobile: string;
}

export interface BeneficiaryPayload extends RemitterPayload {
  bene_id?: string | number;
  bene_name?: string;
  account_number?: string;
  accountNumber?: string;
  ifsc?: string;
  bankIfsc?: string;
  bank_name?: string;
  otp?: string;
  txnid?: string;
  latitude?: string | number;
  longitude?: string | number;
}

export interface TransactionOtpPayload {
  mobile: string;
  amount: number | string;
  bene_id?: string | number;
  beneficiaryId?: string | number;
}

export interface TransactionPayload {
  mobile: string;
  amount: number | string;
  bene_id: string | number;
  beneficiaryId?: string | number;
  mode: string; // IMPS | NEFT
  otp?: string;
  latlong?: string;
  client_ref_id?: string;
}

/**
 * 1. Login / Query Remitter
 */
export const loginRemitterApi = async (payload: RemitterPayload) => {
  const response = await api.post("/api/v1/dmt/login-remitter", payload);
  return response.data;
};

/**
 * 2. Register Remitter (Send OTP)
 */
export const registerRemitterApi = async (payload: RegisterRemitterPayload) => {
  const response = await api.post("/api/v1/dmt/register-remitter", payload);
  return response.data;
};

/**
 * 3. Verify Remitter OTP
 */
export const verifyRemitterOtpApi = async (payload: VerifyRemitterOtpPayload) => {
  const response = await api.post("/api/v1/dmt/register-remitter-verify", payload);
  return response.data;
};

/**
 * 3.1 Perform Remitter eKYC
 */
export const remitterEkycApi = async (payload: RemitterEkycPayload) => {
  const cleanPayload = {
    mobile: payload.mobile,
    outletid: payload.outletid,
    referenceKey: payload.referenceKey,
    latitude: payload.latitude,
    longitude: payload.longitude,
    txnid: payload.txnid,
    ci: payload.ci,
    hmac: payload.hmac,
    Piddata: payload.Piddata,
    ts: payload.ts,
    dpId: payload.dpId,
    dc: payload.dc,
    mi: payload.mi,
    mc: payload.mc,
    rdsVer: payload.rdsVer,
    rdsId: payload.rdsId,
    sessionKey: payload.sessionKey,
    srno: payload.srno,
  };
  const response = await api.post("/api/v1/dmt/remitter-ekyc", cleanPayload);
  return response.data;
};

/**
 * 4. Fetch Beneficiaries
 */
export const fetchBeneficiariesApi = async (payload: RemitterPayload) => {
  const response = await api.post("/api/v1/dmt/fetch-beneficiaries", payload);
  return response.data;
};

export interface VerifyAccountPayload {
  txnid: string;
  accountNumber: string;
  bankIfsc: string;
  latitude: string | number;
  longitude: string | number;
  mobile?: string;
}

/**
 * 5. Verify Beneficiary Bank Account (Penny-drop name inquiry)
 */
export const verifyAccountApi = async (payload: VerifyAccountPayload) => {
  const response = await api.post("/api/v1/dmt/verify-account", payload);
  return response.data;
};

export interface VerifyBeneficiaryPayload {
  outletid: string | number;
  referenceKey: string;
  beneficiaryId: string;
  otp: string;
  remitterMobile: string;
}

/**
 * 6. Verify Beneficiary OTP (Confirm beneficiary addition)
 */
export const verifyBeneficiaryApi = async (payload: VerifyBeneficiaryPayload) => {
  const response = await api.post("/api/v1/dmt/verify-beneficiary", payload);
  return response.data;
};


/**
 * 6. Add Beneficiary
 */
export const addBeneficiaryApi = async (payload: AddBeneficiaryPayload) => {
  const response = await api.post("/api/v1/dmt/add-beneficiary", payload);
  return response.data;
};

export interface DeleteBeneficiaryPayload {
  beneficiaryId: string | number;
  remitterMobile: string;
}

export interface VerifyDeleteBeneficiaryOtpPayload {
  beneficiaryId: string | number;
  remitterMobile: string;
  otp: string;
}

/**
 * 7. Delete Beneficiary (Initiate)
 */
export const deleteBeneficiaryApi = async (payload: DeleteBeneficiaryPayload) => {
  const cleanPayload = {
    beneficiaryId: payload.beneficiaryId,
    remitterMobile: String(payload.remitterMobile).trim(),
  };
  const response = await api.post("/api/v1/dmt/delete-beneficiary", cleanPayload);
  return response.data;
};

/**
 * 8. Verify Delete Beneficiary (OTP)
 */
export const verifyDeleteBeneficiaryOtpApi = async (payload: VerifyDeleteBeneficiaryOtpPayload) => {
  const cleanPayload = {
    beneficiaryId: payload.beneficiaryId,
    remitterMobile: String(payload.remitterMobile).trim(),
    otp: String(payload.otp).trim(),
  };
  const response = await api.post("/api/v1/dmt/delete-beneficiary-verify", cleanPayload);
  return response.data;
};

/**
 * 9. Generate Transaction OTP (Required for amounts > 5000)
 */
export const generateTransactionOtpApi = async (payload: TransactionOtpPayload) => {
  const cleanPayload = {
    mobile: String(payload.mobile).trim(),
    amount: payload.amount,
    ...(payload.bene_id || payload.beneficiaryId ? { bene_id: payload.bene_id || payload.beneficiaryId } : {}),
  };
  const response = await api.post("/api/v1/dmt/generate-transaction-otp", cleanPayload);
  return response.data;
};

/**
 * 10. Execute Transaction
 */
export const executeTransactionApi = async (payload: TransactionPayload) => {
  const cleanPayload = {
    mobile: String(payload.mobile).trim(),
    amount: payload.amount,
    bene_id: payload.bene_id || payload.beneficiaryId,
    mode: payload.mode,
    latlong: payload.latlong || "28.7041,77.1025",
    client_ref_id: payload.client_ref_id || `DMT_${Date.now()}`,
    ...(payload.otp ? { otp: String(payload.otp).trim() } : {}),
  };
  const response = await api.post("/api/v1/dmt/do-transaction", cleanPayload);
  return response.data;
};

/**
 * 11. Fetch All Banks List
 */
export interface AuthBank {
  id: number;
  bank_id: number;
  name: string;
  iin?: string;
  aeps_enabled?: number;
  aadhaarpay_enabled?: number;
}

export const getBanksApi = async (params: { page?: number; limit?: number } = { page: 1, limit: 500 }) => {
  const response = await api.get("/api/v1/auth/banks", { params });
  return response.data;
};
