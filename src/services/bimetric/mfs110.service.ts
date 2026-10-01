import axios from "axios";

const RD_PORT = 11100;
const RD_BASE_URL = `https://127.0.0.1:${RD_PORT}`;

export interface RDResponse {
  success: boolean;
  status: number | null;
  message: string;
  data: string | null;
}

class MFS110Service {

  /**
   * 1. Discover RD Service
   */
  async discover(): Promise<RDResponse> {
    try {
      const response = await axios({
        method: "RDSERVICE",
        url: `${RD_BASE_URL}/`,
        timeout: 3000,
      });

      const xml = response.data;

      if (!xml || typeof xml !== "string") {
        return {
          success: false,
          status: response.status,
          message: "Invalid RD Service response",
          data: null,
        };
      }

      return {
        success: true,
        status: response.status,
        message: "MFS110 RD Service discovered successfully",
        data: xml,
      };

    } catch (error) {
      return {
        success: false,
        status: null,
        message:
          "MFS110 RD Service is not reachable. Check whether RD Service is running.",
        data: null,
      };
    }
  }

  /**
   * 2. Get Device Info
   */
  async getDeviceInfo(): Promise<RDResponse> {
    try {
      const response = await axios({
        method: "GET",
        url: `${RD_BASE_URL}/rd/info`,
        timeout: 5000,
      });

      return {
        success: true,
        status: response.status,
        message: "Device information received",
        data: response.data,
      };

    } catch (error) {
      return {
        success: false,
        status: null,
        message: "Unable to get MFS110 device information",
        data: null,
      };
    }
  }

  /**
   * 3. Capture fingerprint
   */
  async capture(): Promise<RDResponse> {

    const pidOptions = `
<?xml version="1.0"?>
<PidOptions ver="1.0">
  <Opts
    fCount="1"
    fType="0"
    iCount="0"
    pCount="0"
    pgCount="2"
    format="0"
    pidVer="2.0"
    timeout="10000"
    pTimeout="20000"
    posh="UNKNOWN"
    env="P"
  />
  <CustOpts>
    <Param name="mantrakey" value="" />
  </CustOpts>
</PidOptions>
`.trim();

    try {
      const response = await axios({
        method: "POST",
        url: `${RD_BASE_URL}/rd/capture`,
        headers: {
          "Content-Type": "text/xml",
        },
        data: pidOptions,
        timeout: 30000,
      });

      const pidXml = response.data;

      if (typeof pidXml !== "string") {
        return {
          success: false,
          status: response.status,
          message: "Invalid capture response",
          data: null,
        };
      }

      // Check actual RD capture result
      const success =
        /errCode=["']0["']/i.test(pidXml);

      return {
        success,
        status: response.status,
        message: success
          ? "Fingerprint captured successfully"
          : "Fingerprint capture failed",
        data: pidXml,
      };

    } catch (error) {
      return {
        success: false,
        status: null,
        message:
          "Unable to communicate with MFS110 RD Service during capture",
        data: null,
      };
    }
  }

  /**
   * 4. Reset / reinitialize
   *
   * Reset behavior can vary by RD implementation.
   * Keep this separate until we confirm the exact reset
   * operation exposed by your installed RD Service.
   */
  async reset(): Promise<RDResponse> {
    return {
      success: true,
      status: null,
      message: "Reset handled by RD Service/application",
      data: null,
    };
  }
}

export const mfs110Service = new MFS110Service();