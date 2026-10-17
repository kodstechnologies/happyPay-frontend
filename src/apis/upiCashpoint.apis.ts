import api from "../config/axiosInstance";

export interface InitiateUpiCashpointPayload {
  amount: number | string;
  latitude: string | number;
  longitude: string | number;
  merchantLoginId?: string | number;
  mobile?: string;
  txnid?: string;
}

export interface UpiCashpointResponseData {
  status?: boolean | string | number;
  response_code?: number;
  statuscode?: string;
  txnid?: string;
  orderid?: string;
  qrString?: string;
  qrCode?: string;
  upiUri?: string;
  intentUrl?: string;
  rrn?: string;
  bankRefNum?: string;
  message?: string;
  msg?: string;
  amount?: number | string;
  [key: string]: unknown;
}

export interface UpiCashpointApiResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  data?: UpiCashpointResponseData;
}

/**
 * Initiate UPI Cashpoint Payment transaction
 * Calls POST /api/v1/upi-cashpoint/initiate-payment
 */
export const initiateUpiCashpointPaymentApi = async (
  payload: InitiateUpiCashpointPayload
): Promise<UpiCashpointApiResponse> => {
  const response = await api.post<UpiCashpointApiResponse>(
    "/api/v1/upi-cashpoint/initiate-payment",
    payload
  );
  return response.data;
};

export default {
  initiateUpiCashpointPaymentApi,
};
