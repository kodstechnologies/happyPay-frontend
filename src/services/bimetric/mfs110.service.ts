// import axios from "axios";

// const RD_PORT = 11100;
// // In dev, requests go through Vite proxy (see vite.config.ts) to avoid CORS.
// const RD_BASE_URL =
//   import.meta.env.VITE_RD_SERVICE_URL ??
//   (import.meta.env.DEV ? "/rd-service" : `http://127.0.0.1:${RD_PORT}`);
// const USE_RD_REST_PROXY = import.meta.env.DEV && RD_BASE_URL.startsWith("/");

// export interface RDResponse {
//   success: boolean;
//   status: number | null;
//   message: string;
//   data: string | null;
// }

// class MFS110Service {

//   /**
//    * 1. Discover RD Service
//    */
//   async discover(): Promise<RDResponse> {
//     try {
//       const response = await axios({
//         method: USE_RD_REST_PROXY ? "GET" : "RDSERVICE",
//         url: USE_RD_REST_PROXY ? `${RD_BASE_URL}/discover` : `${RD_BASE_URL}/`,
//         timeout: 3000,
//       });

//       const xml = response.data;

//       if (!xml || typeof xml !== "string") {
//         return {
//           success: false,
//           status: response.status,
//           message: "Invalid RD Service response",
//           data: null,
//         };
//       }

//       return {
//         success: true,
//         status: response.status,
//         message: "MFS110 RD Service discovered successfully",
//         data: xml,
//       };

//     } catch (error) {
//       console.error("Error discovering MFS110 RD Service:", error);
//       return {
//         success: false,
//         status: null,
//         message:
//           "MFS110 RD Service is not reachable. Check whether RD Service is running.",
//         data: null,
//       };
//     }
//   }

//   /**
//    * 2. Get Device Info
//    */
//   async getDeviceInfo(): Promise<RDResponse> {
//     try {
//       const response = await axios({
//         method: USE_RD_REST_PROXY ? "GET" : "DEVICEINFO",
//         url: USE_RD_REST_PROXY ? `${RD_BASE_URL}/info` : `${RD_BASE_URL}/rd/info`,
//         timeout: 5000,
//       });

//       console.log("MFS110 device info response:", response.data);

//       return {
//         success: true,
//         status: response.status,
//         message: "Device information received",
//         data: response.data,
//       };

//     } catch (error) {
//       console.error("Error getting MFS110 device information:", error);
//       return {
//         success: false,
//         status: null,
//         message: "Unable to get MFS110 device information",
//         data: null,
//       };
//     }
//   }

//   /**
//    * 3. Capture fingerprint
//    */
//   async capture(wadh?: string): Promise<RDResponse> {
//     const safeWadh = (wadh || "")
//       .replace(/&/g, "&amp;")
//       .replace(/"/g, "&quot;");
//     const wadhAttr = safeWadh ? `\n    wadh="${safeWadh}"` : "";

//     const pidOptions = `
// <?xml version="1.0"?>
// <PidOptions ver="1.0">
//   <Opts
//     fCount="1"
//     fType="0"
//     iCount="0"
//     pCount="0"
//     pgCount="2"
//     format="0"
//     pidVer="2.0"
//     timeout="10000"
//     pTimeout="20000"
//     posh="UNKNOWN"
//     env="P"
//   />
//   <CustOpts>
//     <Param name="mantrakey" value="" />
//   </CustOpts>
// </PidOptions>
// `.trim();

//     try {
//       const response = await axios({
//         method: USE_RD_REST_PROXY ? "POST" : "CAPTURE",
//         url: USE_RD_REST_PROXY ? `${RD_BASE_URL}/capture` : `${RD_BASE_URL}/rd/capture`,
//         headers: {
//           "Content-Type": "text/xml",
//         },
//         data: pidOptions,
//         timeout: 30000,
//       });

//       const pidXml = response.data;

//       console.log("MFS110 capture response:", pidXml);

//       if (typeof pidXml !== "string") {
//         return {
//           success: false,
//           status: response.status,
//           message: "Invalid capture response",
//           data: null,
//         };
//       }

//       // Check actual RD capture result
//       const success =
//         /errCode=["']0["']/i.test(pidXml);

//       return {
//         success,
//         status: response.status,
//         message: success
//           ? "Fingerprint captured successfully"
//           : "Fingerprint capture failed",
//         data: pidXml,
//       };

//     } catch (error) {
//       console.error("Error capturing fingerprint:", error);
//       return {
//         success: false,
//         status: null,
//         message:
//           "Unable to communicate with MFS110 RD Service during capture",
//         data: null,
//       };
//     }
//   }

//   /**
//    * 4. Reset / reinitialize
//    *
//    * Reset behavior can vary by RD implementation.
//    * Keep this separate until we confirm the exact reset
//    * operation exposed by your installed RD Service.
//    */
//   async reset(): Promise<RDResponse> {
//     return {
//       success: true,
//       status: null,
//       message: "Reset handled by RD Service/application",
//       data: null,
//     };
//   }
// }

// export const mfs110Service = new MFS110Service();




import axios from "axios";

const FIRST_RD_PORT = 11100;
const LAST_RD_PORT = 11120;
const REQUEST_TIMEOUT = 3000;
const CAPTURE_TIMEOUT = 30000;

// Keep this if your existing Vite proxy implements these endpoints.
// Otherwise, direct localhost requests are used.
const RD_BASE_URL = import.meta.env.VITE_RD_SERVICE_URL ?? "";
const USE_RD_REST_PROXY =
  import.meta.env.DEV && RD_BASE_URL.startsWith("/");

export interface RDResponse {
  success: boolean;
  status: number | null;
  message: string;
  data: string | null;
}

interface DiscoveredService {
  port: number;
  baseUrl: string;
  capturePath: string;
  infoPath: string;
  xml: string;
}

function escapeXmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function parseXml(xml: string): Document | null {
  try {
    const doc = new DOMParser().parseFromString(
      xml,
      "application/xml"
    );

    if (doc.querySelector("parsererror")) {
      return null;
    }

    return doc;
  } catch {
    return null;
  }
}

// function getXmlAttribute(
//   doc: Document,
//   selector: string,
//   attribute: string
// ): string {
//   return doc.querySelector(selector)?.getAttribute(attribute) ?? "";
// }

class MFS110Service {
  private discovered: DiscoveredService | null = null;

  /**
   * 1. Discover the RD service.
   * Matches the provider's port scan and Mantra identification.
   */
  async discover(): Promise<RDResponse> {
    this.discovered = null;

    // If the existing Vite proxy implements discovery,
    // preserve its route contract.
    if (USE_RD_REST_PROXY) {
      try {
        const response = await axios.get<string>(
          `${RD_BASE_URL}/discover`,
          {
            timeout: REQUEST_TIMEOUT,
            responseType: "text",
            transformResponse: [(data) => data],
          }
        );

        const xml =
          typeof response.data === "string"
            ? response.data
            : "";

        const doc = parseXml(xml);

        if (!doc) {
          return {
            success: false,
            status: response.status,
            message: "Invalid RD Service XML response",
            data: xml || null,
          };
        }

        const service = doc.querySelector("RDService");
        const status = service?.getAttribute("status") ?? "";
        const info = service?.getAttribute("info") ?? "";

        if (!/\bMantra\b/i.test(info)) {
          return {
            success: false,
            status: response.status,
            message: "The discovered RD service is not recognized as Mantra",
            data: xml,
          };
        }

        if (status !== "READY") {
          return {
            success: false,
            status: response.status,
            message: `Mantra RD Service is not ready: ${status || "unknown status"}`,
            data: xml,
          };
        }

        this.discovered = {
          port: 0,
          baseUrl: RD_BASE_URL,
          capturePath: "/capture",
          infoPath: "/info",
          xml,
        };

        return {
          success: true,
          status: response.status,
          message: "Mantra RD Service discovered and ready",
          data: xml,
        };
      } catch (error) {
        console.error("Mantra RD discovery failed:", error);

        return {
          success: false,
          status: null,
          message:
            "RD service proxy discovery failed. Check your Vite proxy configuration.",
          data: null,
        };
      }
    }

    // Direct mode: scan the same ports as the provider.
    for (
      let port = FIRST_RD_PORT;
      port <= LAST_RD_PORT;
      port++
    ) {
      const baseUrl = `http://127.0.0.1:${port}`;

      try {
        const response = await axios.request<string>({
          method: "RDSERVICE",
          url: `${baseUrl}/`,
          timeout: REQUEST_TIMEOUT,
          responseType: "text",
          transformResponse: [(data) => data],
        });

        const xml =
          typeof response.data === "string"
            ? response.data
            : "";

        const doc = parseXml(xml);

        if (!doc) {
          continue;
        }

        const service = doc.querySelector("RDService");
        const status = service?.getAttribute("status") ?? "";
        const info = service?.getAttribute("info") ?? "";

        if (!/\bMantra\b/i.test(info)) {
          continue;
        }

        // Match the provider's READY check.
        if (status !== "READY") {
          continue;
        }

        const interfaces = Array.from(
          doc.querySelectorAll("Interface")
        );

        const capturePath =
          interfaces.find(
            (item) => item.getAttribute("path") === "/rd/capture"
          )?.getAttribute("path") ?? "";

        const infoPath =
          interfaces.find(
            (item) => item.getAttribute("path") === "/rd/info"
          )?.getAttribute("path") ?? "";

        if (!capturePath || !infoPath) {
          console.warn(
            `Mantra RD Service on port ${port} does not advertise both required interfaces`
          );
          continue;
        }

        this.discovered = {
          port,
          baseUrl,
          capturePath,
          infoPath,
          xml,
        };

        console.info("Mantra RD Service ready on port:", port);

        return {
          success: true,
          status: response.status,
          message: `Mantra RD Service discovered on port ${port}`,
          data: xml,
        };
      } catch {
        // Continue scanning if this port is unavailable.
      }
    }

    return {
      success: false,
      status: null,
      message:
        "Mantra RD Service was not found on ports 11100–11120. Check the installed RD service, browser permissions, and proxy configuration.",
      data: null,
    };
  }

  /**
   * 2. Get device information.
   */
  async getDeviceInfo(): Promise<RDResponse> {
    if (!this.discovered) {
      const discovery = await this.discover();

      if (!discovery.success) {
        return discovery;
      }
    }

    const service = this.discovered!;

    try {
      const response = await axios.request<string>({
        method: USE_RD_REST_PROXY ? "GET" : "DEVICEINFO",
        url: USE_RD_REST_PROXY
          ? `${service.baseUrl}${service.infoPath}`
          : `${service.baseUrl}${service.infoPath}`,
        timeout: 5000,
        responseType: "text",
        transformResponse: [(data) => data],
      });

      const xml =
        typeof response.data === "string"
          ? response.data
          : "";

      if (!parseXml(xml)) {
        return {
          success: false,
          status: response.status,
          message: "Invalid device information XML",
          data: xml || null,
        };
      }

      return {
        success: true,
        status: response.status,
        message: "Mantra device information received",
        data: xml,
      };
    } catch (error) {
      console.error("Mantra device information failed:", error);

      return {
        success: false,
        status: null,
        message: "Unable to get Mantra device information",
        data: null,
      };
    }
  }

  /**
   * 3. Capture fingerprint.
   *
   * PID XML follows the provider's supplied non-iris branch.
   */
  async capture(
    wadh = "",
    otp = ""
  ): Promise<RDResponse> {
    if (!this.discovered) {
      const discovery = await this.discover();

      if (!discovery.success) {
        return discovery;
      }
    }

    const service = this.discovered!;

    const safeWadh = escapeXmlAttribute(wadh);
    const safeOtp = escapeXmlAttribute(otp);

    // The provider always includes both attributes,
    // even when their values are empty.
    const pidOptions = `<PidOptions ver="1.0"><Opts fCount="1" fType="2" iCount="0" pCount="0" format="0" pidVer="2.0" timeout="10000" wadh="${safeWadh}" otp="${safeOtp}" posh="UNKNOWN" env="P"/><CustOpts><Param name="mantrakey" value=""/></CustOpts></PidOptions>`;

    try {
      const response = await axios.request<string>({
        method: USE_RD_REST_PROXY ? "POST" : "CAPTURE",
        url: `${service.baseUrl}${service.capturePath}`,
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
        },
        data: pidOptions,
        timeout: CAPTURE_TIMEOUT,
        responseType: "text",
        transformResponse: [(data) => data],
      });

      const pidXml =
        typeof response.data === "string"
          ? response.data
          : "";

      console.info("Mantra capture HTTP status:", response.status);

      const doc = parseXml(pidXml);

      if (!doc) {
        return {
          success: false,
          status: response.status,
          message: "RD Service returned invalid capture XML",
          data: pidXml || null,
        };
      }

      const resp = doc.querySelector("Resp");
      const errorCode = resp?.getAttribute("errCode");
      const errorInfo = resp?.getAttribute("errInfo") ?? "";

      if (!resp || errorCode !== "0") {
        return {
          success: false,
          status: response.status,
          message: `Fingerprint capture failed: ${errorInfo || `errCode=${errorCode ?? "missing"}`}`,
          data: pidXml,
        };
      }

      return {
        success: true,
        status: response.status,
        message: "Fingerprint captured successfully",
        data: pidXml,
      };
    } catch (error) {
      console.error("Mantra fingerprint capture failed:", error);

      return {
        success: false,
        status: null,
        message:
          "Unable to communicate with Mantra RD Service during capture. Check the browser console and RD service status.",
        data: null,
      };
    }
  }

  /**
   * 4. Reset placeholder.
   * This does not send a reset command to the physical device.
   */
  async reset(): Promise<RDResponse> {
    return {
      success: false,
      status: null,
      message:
        "No RD reset command is configured. Re-discover the service if needed.",
      data: null,
    };
  }
}

export const mfs110Service = new MFS110Service();