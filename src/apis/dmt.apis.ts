import api from "../config/axiosInstance";

export interface RemitterPayload {
  mobile: string;
}

export interface RegisterRemitterPayload extends RemitterPayload {
  aadhaar: string;
}

export interface VerifyRemitterOtpPayload extends RemitterPayload {
  otp: string;
}

export interface BeneficiaryPayload extends RemitterPayload {
  bene_id?: string | number;
  bene_name?: string;
  account_number?: string;
  ifsc?: string;
  bank_name?: string;
  otp?: string;
}

export interface TransactionPayload extends RemitterPayload {
  amount: number | string;
  bene_id?: string | number;
  mode?: string; // IMPS/NEFT
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
 * 4. Fetch Beneficiaries
 */
export const fetchBeneficiariesApi = async (payload: RemitterPayload) => {
  const response = await api.post("/api/v1/dmt/fetch-beneficiaries", payload);
  return response.data;
};

/**
 * 5. Verify Beneficiary Bank Account
 */
export const verifyBeneficiaryApi = async (payload: BeneficiaryPayload) => {
  const response = await api.post("/api/v1/dmt/verify-beneficiary", payload);
  return response.data;
};

/**
 * 6. Add Beneficiary
 */
export const addBeneficiaryApi = async (payload: BeneficiaryPayload) => {
  const response = await api.post("/api/v1/dmt/add-beneficiary", payload);
  return response.data;
};

/**
 * 7. Delete Beneficiary (Initiate)
 */
export const deleteBeneficiaryApi = async (payload: BeneficiaryPayload) => {
  const response = await api.post("/api/v1/dmt/delete-beneficiary", payload);
  return response.data;
};

/**
 * 8. Verify Delete Beneficiary (OTP)
 */
export const verifyDeleteBeneficiaryOtpApi = async (payload: BeneficiaryPayload) => {
  const response = await api.post("/api/v1/dmt/delete-beneficiary-verify", payload);
  return response.data;
};

/**
 * 9. Generate Transaction OTP
 */
export const generateTransactionOtpApi = async (payload: TransactionPayload) => {
  const response = await api.post("/api/v1/dmt/generate-transaction-otp", payload);
  return response.data;
};

/**
 * 10. Execute Transaction
 */
export const executeTransactionApi = async (payload: TransactionPayload) => {
  const response = await api.post("/api/v1/dmt/do-transaction", payload);
  return response.data;
};
