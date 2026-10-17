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
  [key: string]: unknown;
}

export interface CmsPaymentApiResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  data?: CmsPaymentResponseData;
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

export default {
  initiateCmsPaymentApi,
};
