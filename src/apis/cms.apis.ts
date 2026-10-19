import api from "../config/axiosInstance";

export interface InitiateCmsPaymentPayload {
  amount: number | string;
  latitude: string | number;
  longitude: string | number;
  agency_id?: string | number;
  biller_id?: string | number;
  consumer_id?: string | number;
  mobile?: string;
  txnid?: string;
  [key: string]: unknown;
}

export interface CmsPaymentResponseData {
  status?: boolean | string | number;
  response_code?: number;
  statuscode?: string;
  txnid?: string;
  rrn?: string;
  bankRefNum?: string;
  message?: string;
  msg?: string;
  amount?: number | string;
  redirectionUrl?: string;
  [key: string]: unknown;
}

export interface CmsPaymentApiResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  data?: CmsPaymentResponseData;
  redirectionUrl?: string;
  status?: string;
  msg?: string;
}

export interface CmsRedirectionResponse {
  status: "SUCCESS" | "FAILED" | string;
  redirectionUrl: string;
  msg: string;
  data?: unknown;
}

export interface CmsCallbackData {
  status: "SUCCESS" | "FAILED" | "CANCELLED" | string;
  txnid?: string;
  rrn?: string;
  bankRefNum?: string;
  amount?: number | string;
  message?: string;
  msg?: string;
  [key: string]: unknown;
}

/**
 * Initiate CMS Payment (Cash Drop / Cash Collection)
 * Calls POST /api/v1/cms/initiate-payment
 */
export const initiateCmsPaymentApi = async (
  payload: InitiateCmsPaymentPayload
): Promise<CmsPaymentApiResponse> => {
  const response = await api.post<CmsPaymentApiResponse>(
    "/api/v1/cms/initiate-payment",
    payload
  );
  return response.data;
};

/**
 * Fetch CMS Redirection URL (Airtel Payments Bank Retailer Plugin)
 * Calls POST /api/v1/cms/initiate-payment and securely extracts redirectionUrl
 */
export const fetchCmsRedirectionUrlApi = async (
  coords?: { latitude: string; longitude: string }
): Promise<CmsRedirectionResponse> => {
  const payload: InitiateCmsPaymentPayload = {
    amount: 10,
    latitude: coords?.latitude || "28.7041",
    longitude: coords?.longitude || "77.1025",
  };

  const response = await api.post<CmsPaymentApiResponse>(
    "/api/v1/cms/initiate-payment",
    payload
  );

  const resData = response.data;
  const innerData = (resData?.data || resData) as unknown as Record<string, unknown>;
  const redirectionUrl =
    (innerData?.redirectionUrl as string) ||
    ((resData as unknown as Record<string, unknown>)?.redirectionUrl as string) ||
    "";

  const status =
    (innerData?.status as string) ||
    (resData?.success ? "SUCCESS" : "FAILED");

  const msg =
    (innerData?.msg as string) ||
    (innerData?.message as string) ||
    resData?.message ||
    "";

  return {
    status,
    redirectionUrl,
    msg,
    data: innerData,
  };
};

export default {
  initiateCmsPaymentApi,
  fetchCmsRedirectionUrlApi,
};

