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
      return { success: false, message: "Please select a Biometric Device first.", data: null };
    }

    try {
      // Delegate network request to the API layer
      const response = await captureBiometric(port, RDService.getPidOptions());

      const pidData = response.data;
      
      // Basic validation to ensure the device actually captured something
      if (typeof pidData === "string" && pidData.includes('errCode="0"')) {
        return { success: true, message: "Fingerprint captured successfully", data: pidData };
      } else {
        return { success: false, message: "Capture failed or user removed finger too early.", data: pidData };
      }

    } catch {
      return { success: false, message: "RD Service disconnected during capture.", data: null };
    }
  }
}

export const rdService = new RDService();
