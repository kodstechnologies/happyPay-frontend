import { checkDeviceStatus, captureBiometric } from "../apis/bioKyc";

export interface RDDeviceResponse {
  success: boolean;
  message: string;
  data: string | null;
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

    console.log("Starting device scan on ports:", RDService.PORTS);

    // Use Promise.allSettled to scan all ports concurrently (much faster)
    const scanPromises = RDService.PORTS.map(async (port) => {
      try {
        console.log(`Scanning port ${port}...`);
        const response = await checkDeviceStatus(port);
        
        if (response.status >= 200 && response.status < 300) {
          const deviceInfo = response.data;
          
          console.log(`Port ${port} response:`, { status: response.status, data: deviceInfo });
          
          if (typeof deviceInfo === "string" && deviceInfo.includes("RDService")) {
            // Extract the 'info' attribute for the device name (e.g. info="Mantra MFS100")
            const match = deviceInfo.match(/info="([^"]+)"/i);
            const deviceName = match ? match[1] : `Unknown Device (Port ${port})`;
            
            console.log(`Found device on port ${port}: ${deviceName}`);
            activeDevices.push({ port, name: deviceName });
          }
        }
      } catch (error) {
        console.log(`Port ${port} scan failed:`, error);
        // Ignore dead ports
      }
    });

    await Promise.allSettled(scanPromises);
    
    console.log(`Device scan completed. Found ${activeDevices.length} devices:`, activeDevices);
    return activeDevices;
  }

  /**
   * Captures the fingerprint from a SPECIFIC port
   */
  public async captureFingerprint(port: number | null): Promise<RDDeviceResponse> {
    if (!port) {
      return { success: false, message: "Please select a Biometric Device first.", data: null };
    }

    try {
      console.log(`Starting fingerprint capture on port ${port}...`);
      
      // First try the regular captureBiometric method
      try {
        const response = await captureBiometric(port, RDService.getPidOptions());
        const pidData = response.data;
        
        console.log(`Capture response for port ${port}:`, { status: response.status, dataLength: pidData?.length });
        
        // Basic validation to ensure the device actually captured something
        if (typeof pidData === "string" && pidData.includes('errCode="0"')) {
          return { success: true, message: "Fingerprint captured successfully", data: pidData };
        } else if (typeof pidData === "string" && pidData.includes('errCode=')) {
          // Extract error code for better user feedback
          const errorMatch = pidData.match(/errCode="(\d+)"/);
          const errorCode = errorMatch ? errorMatch[1] : 'unknown';
          return { success: false, message: `Capture failed with error code: ${errorCode}`, data: pidData };
        } else {
          return { success: false, message: "Invalid response from biometric device", data: pidData };
        }
      } catch (axiosError) {
        console.log("Axios capture failed, trying fetch fallback...", axiosError);
        
        // Fallback to fetch method if axios fails
        try {
          const { captureBiometricFetch } = await import("../apis/bioKyc");
          const fetchResponse = await captureBiometricFetch(port, RDService.getPidOptions());
          const pidData = fetchResponse.data;
          
          console.log(`Fetch capture response for port ${port}:`, { status: fetchResponse.status, dataLength: pidData?.length });
          
          if (typeof pidData === "string" && pidData.includes('errCode="0"')) {
            return { success: true, message: "Fingerprint captured successfully (fetch fallback)", data: pidData };
          } else if (typeof pidData === "string" && pidData.includes('errCode=')) {
            const errorMatch = pidData.match(/errCode="(\d+)"/);
            const errorCode = errorMatch ? errorMatch[1] : 'unknown';
            return { success: false, message: `Capture failed with error code: ${errorCode}`, data: pidData };
          } else {
            return { success: false, message: "Invalid response from biometric device (fetch)", data: pidData };
          }
        } catch (fetchError) {
          console.error("Both axios and fetch capture methods failed:", fetchError);
          return { success: false, message: "All capture methods failed. Please check device connection.", data: null };
        }
      }

    } catch (error) {
      console.error("Fingerprint capture error:", error);
      return { success: false, message: "RD Service disconnected during capture.", data: null };
    }
  }
}

export const rdService = new RDService();


