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
  referenceKey: string;
  amount: number | string;
  beneficiaryId: string | number;
  outletid: string | number;
  remitterMobile: string;
}

export interface TransactionPayload {
  latitude: string;
  longitude: string;
  txnid: string;
  amount: number | string;
  mode: string;
  ifsc: string;
  referenceKey: string;
  account: string;
  remitterMobile: string;
  outletid: string;
  otp?: string;
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

  try {
    const response = await api.post("/api/v1/dmt/remitter-ekyc", cleanPayload);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string; msg?: string; data?: { msg?: string } } } };
    const data = err?.response?.data;
    const msg = String(data?.message || data?.msg || data?.data?.msg || "").trim().toLowerCase();
    if (msg.includes("transaction successful") || msg === "successful" || msg === "success") {
      return {
        success: true,
        statusCode: 200,
        message: data?.message || data?.msg || data?.data?.msg || "Transaction Successful",
        data: data?.data || data,
      };
    }
    throw error;
  }
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
  outletid: string;
  remitterMobile: string;
}

export interface VerifyDeleteBeneficiaryOtpPayload {
  beneficiaryId: string | number;
  outletid: string;
  remitterMobile: string;
  referenceKey: string;
  otp: string;
}

/**
 * 7. Delete Beneficiary (Initiate)
 */
export const deleteBeneficiaryApi = async (payload: DeleteBeneficiaryPayload) => {
  const cleanPayload = {
    beneficiaryId: payload.beneficiaryId,
    outletid: String(payload.outletid).trim(),
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
    outletid: String(payload.outletid).trim(),
    remitterMobile: String(payload.remitterMobile).trim(),
    referenceKey: String(payload.referenceKey).trim(),
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
    referenceKey: String(payload.referenceKey).trim(),
    amount: payload.amount,
    beneficiaryId: payload.beneficiaryId,
    outletid: String(payload.outletid).trim(),
    remitterMobile: String(payload.remitterMobile).trim(),
  };
  const response = await api.post("/api/v1/dmt/generate-transaction-otp", cleanPayload);
  return response.data;
};

/**
 * 10. Execute Transaction
 */
export const executeTransactionApi = async (payload: TransactionPayload) => {
  const cleanPayload: Record<string, unknown> = {
    latitude: String(payload.latitude).trim(),
    longitude: String(payload.longitude).trim(),
    txnid: String(payload.txnid).trim(),
    amount: payload.amount,
    mode: String(payload.mode).trim(),
    ifsc: String(payload.ifsc).trim(),
    referenceKey: String(payload.referenceKey).trim(),
    account: String(payload.account).trim(),
    remitterMobile: String(payload.remitterMobile).trim(),
    outletid: String(payload.outletid).trim(),
  };

  if (payload.otp && String(payload.otp).trim()) {
    cleanPayload.otp = String(payload.otp).trim();
  }

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
