import { checkDeviceStatus, captureBiometric } from "../apis/bioKyc";

export interface RDDeviceResponse {
  success: boolean;
  message: string;
  data: string | null;
}

export interface ActiveDevice {
  port: number;
  name: string;
  type?: "mantra" | "morpho" | "secugen" | "precision" | "startek" | "nextrd" | "unknown";
  capturePath?: string;
  status?: string;
}

class RDService {
  // Standard port range used by biometric RD services (11100 to 11120 matching provider reference)
  private static readonly PORTS = Array.from({ length: 21 }, (_, i) => 11100 + i);

  // The XML configuration requested by UIDAI (default fType="2" for ISO 19794-2 banking standard)
  private static getPidOptions(wadh?: string, fType: string = "2", otp?: string) {
    const safeWadh = (wadh || "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;");
    const wadhAttr = safeWadh ? ` wadh="${safeWadh}"` : "";
    const safeOtp = (otp || "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;");
    const otpAttr = safeOtp ? ` otp="${safeOtp}"` : "";
    const safeFType = fType || "2";
    return `
      <PidOptions ver="1.0">
          <Opts fCount="1" fType="${safeFType}" iCount="0" pCount="0" format="0" pidVer="2.0" timeout="10000" posh="UNKNOWN" env="P"${wadhAttr}${otpAttr} />
          <CustOpts>
              <Param name="mantrakey" value="" />
          </CustOpts>
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
            // Parse XML to extract device type and interface paths (matching provider reference)
            let deviceType: ActiveDevice["type"] = "unknown";
            let deviceName = `Device (Port ${port})`;
            let capturePath = "/rd/capture";
            let status = "";

            try {
              const parser = new DOMParser();
              const doc = parser.parseFromString(deviceInfo, "text/xml");
              const rdServiceEl = doc.querySelector("RDService");
              status = rdServiceEl?.getAttribute("status") || "";
              const info = rdServiceEl?.getAttribute("info") || "";

              if (/\bMantra\b/i.test(info)) {
                deviceType = "mantra";
                deviceName = "Mantra MFS Series";
              } else if (/\bMorpho_RD_Service\b/i.test(info) || /\bMorpho\b/i.test(info)) {
                deviceType = "morpho";
                deviceName = "Morpho MSO Series";
              } else if (/\bSecuGen\b/i.test(info)) {
                deviceType = "secugen";
                deviceName = "SecuGen Hamster";
              } else if (/\bPrecision\b/i.test(info)) {
                deviceType = "precision";
                deviceName = "Precision Biometric";
              } else if (/\bStartek\b/i.test(info)) {
                deviceType = "startek";
                deviceName = "Startek FM220";
              } else if (/\bNEXT\b/i.test(info)) {
                deviceType = "nextrd";
                deviceName = "Next Biometrics";
              } else if (info) {
                deviceName = info;
              }

              // Dynamic interface path discovery matching provider reference
              const interfaces = Array.from(doc.querySelectorAll("Interface"));
              const captureInterface = interfaces.find(
                (el) => el.getAttribute("path")?.includes("capture") || el.getAttribute("id")?.toUpperCase() === "CAPTURE"
              );
              if (captureInterface) {
                capturePath = captureInterface.getAttribute("path") || "/rd/capture";
              }
            } catch {
              const match = deviceInfo.match(/info="([^"]+)"/i);
              if (match) deviceName = match[1];
            }

            console.log(`Found device on port ${port}: ${deviceName} (${capturePath})`);
            activeDevices.push({ port, name: deviceName, type: deviceType, capturePath, status });
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
   * Supports both legacy signature (port, wadh) and options object { wadh, fType, capturePath }
   */
  public async captureFingerprint(
    port: number | null,
    wadhOrOptions?: string | { wadh?: string; fType?: string; capturePath?: string; otp?: string }
  ): Promise<RDDeviceResponse> {
    if (!port) {
      return { success: false, message: "Please select a Biometric Device first.", data: null };
    }

    const options = typeof wadhOrOptions === "string" 
      ? { wadh: wadhOrOptions, fType: "2", capturePath: "/rd/capture" } 
      : wadhOrOptions || {};

    const wadh = options.wadh;
    const fType = options.fType || "2";
    const capturePath = options.capturePath || "/rd/capture";
    const otp = options.otp;

    try {
      console.log(`Starting fingerprint capture on port ${port} (${capturePath}, fType=${fType}${otp ? ", with OTP" : ""})...`);
      const pidOptions = RDService.getPidOptions(wadh, fType, otp);
      
      // First try the regular captureBiometric method
      try {
        const response = await captureBiometric(port, pidOptions, capturePath);
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
          const fetchResponse = await captureBiometricFetch(port, pidOptions, capturePath);
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


