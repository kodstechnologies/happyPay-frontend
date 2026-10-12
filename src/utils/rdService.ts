import { checkDeviceStatus, captureBiometric, captureBiometricFetch } from "../apis/bioKyc";

export interface RDDeviceResponse {
  success: boolean;
  message: string;
  data: string;
}

export interface ActiveDevice {
  port: number;
  name: string;
}

class RDService {
  // Common ports used by Mantra, Morpho, SecuGen, etc.
  private static readonly PORTS = [11100, 11101, 11102, 11103, 11104, 11105];

  // The XML configuration requested by UIDAI
  private static getPidOptions() {
    return `
      <PidOptions ver="1.0">
          <Opts fCount="1" fType="0" iCount="0" iType="0" pCount="0" pType="0" format="0" pidVer="2.0" timeout="10000" posh="UNKNOWN" env="P" />
      </PidOptions>
    `.trim();
  }

  /**
   * Scans all local ports to find ALL active biometric devices
   */
  public async scanAllDevices(): Promise<ActiveDevice[]> {
    const activeDevices: ActiveDevice[] = [];

    // Use Promise.allSettled to scan all ports concurrently (much faster)
    const scanPromises = RDService.PORTS.map(async (port) => {
      try {
        const response = await checkDeviceStatus(port);
        if (response.status >= 200 && response.status < 300) {
          const deviceInfo = response.data;

          if (typeof deviceInfo === "string" && deviceInfo.includes("RDService")) {
            // Extract the 'info' attribute for the device name (e.g. info="Mantra MFS100")
            const match = deviceInfo.match(/info="([^"]+)"/i);
            const deviceName = match ? match[1] : `Unknown Device (Port ${port})`;

            activeDevices.push({ port, name: deviceName });
          }
        }
      } catch {
        // Ignore dead ports
      }
    });

    await Promise.allSettled(scanPromises);
    return activeDevices;
  }

  /**
   * Captures the fingerprint from a SPECIFIC port using multiple methods
   */
  public async captureFingerprint(port: number | null): Promise<RDDeviceResponse> {
    if (!port) {
      return { success: false, message: "Please select a Biometric Device first.", data: "" };
    }

    console.log(`Attempting to capture biometric from port ${port} using multiple methods...`);

    // Method 1: Try axios-based approach
    try {
      const response = await captureBiometric(port, RDService.getPidOptions());
      const pidData = response.data;
      console.log("Axios capture response:", { status: response.status, dataLength: pidData?.length });

      if (typeof pidData === "string" && pidData.includes('errCode="0"')) {
        return { success: true, message: "Fingerprint captured successfully", data: pidData };
      } else {
        return this.parseErrorResponse(pidData);
      }
    } catch (axiosError) {
      console.error("Axios method failed, trying fetch:", axiosError);
      
      // Method 2: Try fetch-based approach
      try {
        const fetchResponse = await captureBiometricFetch(port, RDService.getPidOptions());
        const pidData = fetchResponse.data;
        console.log("Fetch capture response:", { status: fetchResponse.status, dataLength: pidData?.length });

        if (typeof pidData === "string" && pidData.includes('errCode="0"')) {
          return { success: true, message: "Fingerprint captured successfully", data: pidData };
        } else {
          return this.parseErrorResponse(pidData);
        }
      } catch (fetchError) {
        console.error("Fetch method also failed:", fetchError);
        
        // Method 3: Try direct HTTP request with XMLHttpRequest (for legacy compatibility)
        try {
          const xhrResponse = await this.captureWithXHR(port, RDService.getPidOptions());
          if (xhrResponse.success) {
            return xhrResponse;
          }
        } catch (xhrError) {
          console.error("XHR method also failed:", xhrError);
        }

        return this.buildErrorResponse(axiosError, port);
      }
    }
  }

  /**
   * Legacy XMLHttpRequest method for maximum compatibility
   */
  private captureWithXHR(port: number, pidOptions: string): Promise<RDDeviceResponse> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const url = `http://127.0.0.1:${port}/capture`;
      
      xhr.timeout = 15000;
      xhr.open('POST', url, true);
      xhr.setRequestHeader('Content-Type', 'text/xml');
      xhr.setRequestHeader('Accept', '*/*');
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const pidData = xhr.responseText;
          if (pidData.includes('errCode="0"')) {
            resolve({ success: true, message: "Fingerprint captured successfully", data: pidData });
          } else {
            resolve(this.parseErrorResponse(pidData));
          }
        } else {
          reject(new Error(`XHR failed with status ${xhr.status}`));
        }
      };
      
      xhr.onerror = () => reject(new Error('XHR network error'));
      xhr.ontimeout = () => reject(new Error('XHR timeout'));
      
      xhr.send(pidOptions);
    });
  }

  /**
   * Parse error codes from RD Service response
   */

private parseErrorResponse(pidData: string | null): RDDeviceResponse {
  const errorMatch = pidData?.match(/errCode="(\d+)"/);
  const errorCode = errorMatch ? errorMatch[1] : "unknown";

  let errorMessage: string;

  switch (errorCode) {
    case "700":
      errorMessage =
        "Timeout error - Please place finger properly on the scanner.";
      break;

    case "1140":
      errorMessage =
        "Poor finger quality - Please clean finger and scanner, try again.";
      break;

    case "513":
      errorMessage =
        "Device not ready - Please check device connection.";
      break;

    default:
      errorMessage =
        `Capture failed (Error: ${errorCode}) - Please try again.`;
  }

  return {
    success: false,
    message: errorMessage,
    data: pidData || "",
  };
}

  /**
   * Build error response from caught exceptions
   */
  private buildErrorResponse(error: unknown, port: number): RDDeviceResponse {
    let errorMessage = "RD Service disconnected during capture.";
    
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; statusText?: string } };
      if (axiosError.response) {
        if (axiosError.response.status === 405) {
          errorMessage = "RD Service method not supported. Your device may require different software or drivers.";
        } else if (axiosError.response.status === 404) {
          errorMessage = "RD Service endpoint not found. Please verify the biometric device service is properly installed and running.";
        } else {
          errorMessage = `RD Service error (${axiosError.response.status}): ${axiosError.response.statusText || 'Unknown error'}`;
        }
      }
    } else if (error && typeof error === 'object' && 'code' in error) {
      const networkError = error as { code?: string };
      if (networkError.code === 'ECONNREFUSED') {
        errorMessage = `Cannot connect to RD Service on port ${port}. Please ensure the biometric device service is running.`;
      } else if (networkError.code === 'ETIMEDOUT') {
        errorMessage = "RD Service timeout. Please check device connection and try again.";
      }
    }
    
    return { success: false, message: errorMessage, data: "" };
  }
}

export const rdService = new RDService();
