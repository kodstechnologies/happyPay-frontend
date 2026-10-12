import { checkDeviceStatus, captureBiometric } from "../apis/bioKyc";

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
   * Captures the fingerprint from a SPECIFIC port
   */
  public async captureFingerprint(port: number | null): Promise<RDDeviceResponse> {
    if (!port) {
      return { success: false, message: "Please select a Biometric Device first.", data: "" };
    }

    try {
      console.log(`Attempting to capture biometric from port ${port}...`);
      
      // Delegate network request to the API layer
      const response = await captureBiometric(port, RDService.getPidOptions());

      const pidData = response.data;
      console.log("Biometric capture response:", { status: response.status, dataLength: pidData?.length });

      // Basic validation to ensure the device actually captured something
      if (typeof pidData === "string" && pidData.includes('errCode="0"')) {
        return { success: true, message: "Fingerprint captured successfully", data: pidData };
      } else {
        // Check for specific error codes in the response
        const errorMatch = pidData?.match(/errCode="(\d+)"/);
        const errorCode = errorMatch ? errorMatch[1] : "unknown";
        
        let errorMessage = "Capture failed or user removed finger too early.";
        
        // Common RD Service error codes
        switch (errorCode) {
          case "700":
            errorMessage = "Timeout error - Please place finger properly on the scanner.";
            break;
          case "1140":
            errorMessage = "Poor finger quality - Please clean finger and scanner, try again.";
            break;
          case "513":
            errorMessage = "Device not ready - Please check device connection.";
            break;
          default:
            errorMessage = `Capture failed (Error: ${errorCode}) - Please try again.`;
        }
        
        return { success: false, message: errorMessage, data: pidData || "" };
      }

    } catch (error: unknown) {
      console.error("Biometric capture error:", error);
      
      let errorMessage = "RD Service disconnected during capture.";
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; statusText?: string } };
        if (axiosError.response) {
          if (axiosError.response.status === 405) {
            errorMessage = "RD Service method not supported. Please check if the biometric device service is running properly.";
          } else if (axiosError.response.status === 404) {
            errorMessage = "RD Service endpoint not found. Please verify the biometric device is connected and service is running.";
          } else {
            errorMessage = `RD Service error (${axiosError.response.status}): ${axiosError.response.statusText || 'Unknown error'}`;
          }
        }
      } else if (error && typeof error === 'object' && 'code' in error) {
        const networkError = error as { code?: string };
        if (networkError.code === 'ECONNREFUSED') {
          errorMessage = "Cannot connect to RD Service. Please ensure biometric device service is running on port " + port;
        } else if (networkError.code === 'ETIMEDOUT') {
          errorMessage = "RD Service timeout. Please check device connection and try again.";
        }
      }
      
      return { success: false, message: errorMessage, data: "" };
    }
  }
}

export const rdService = new RDService();
