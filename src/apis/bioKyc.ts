import axios, { AxiosError } from "axios";

// Alternative RD Service integration approaches

export const checkDeviceStatus = async (port: number) => {
  const url = `http://127.0.0.1:${port}/`;

  try {
    const response = await axios({
      method: "RDSERVICE",
      url,
      timeout: 5000,
      responseType: "text",
    });

    console.log("RD Service status:", response.data);
    return response;
  } catch (error) {
    console.error("RD Service status check failed:", error);
    throw error;
  }
};

export const captureBiometric = async (port: number, pidOptions: string) => {
  const endpoints = [
    // Method 1: Standard CAPTURE method
    { method: "CAPTURE", url: `http://127.0.0.1:${port}/capture` },
    // Method 2: POST to capture endpoint
    { method: "POST", url: `http://127.0.0.1:${port}/capture` },
    // Method 3: POST to root with specific headers
    { method: "POST", url: `http://127.0.0.1:${port}/` },
    // Method 4: Different capture endpoints
    { method: "POST", url: `http://127.0.0.1:${port}/rd/capture` },
    { method: "POST", url: `http://127.0.0.1:${port}/rdservice/capture` },
    // Method 5: Try with form data instead of XML
    { method: "POST", url: `http://127.0.0.1:${port}/capture`, isFormData: true },
  ];

  let lastError: unknown = null;

  for (let i = 0; i < endpoints.length; i++) {
    const endpoint = endpoints[i];
    
    try {
      console.log(`Trying method ${i + 1}: ${endpoint.method} ${endpoint.url}`);
      
      const requestConfig: {
        method: string;
        url: string;
        timeout: number;
        data?: string | URLSearchParams;
        headers?: Record<string, string>;
      } = {
        method: endpoint.method,
        url: endpoint.url,
        timeout: 15000,
      };

      if (endpoint.isFormData) {
        // Some RD services expect form data
        const formData = new URLSearchParams();
        formData.append('pidOptions', pidOptions);
        requestConfig.data = formData;
        requestConfig.headers = {
          'Content-Type': 'application/x-www-form-urlencoded',
        };
      } else {
        // Standard XML payload
        requestConfig.data = pidOptions;
        requestConfig.headers = {
          'Content-Type': 'text/xml',
          'Accept': '*/*',
          'User-Agent': 'RDServiceClient/1.0',
        };
      }

      const response = await axios(requestConfig);
      console.log(`Success with method ${i + 1}:`, { status: response.status, dataLength: response.data?.length });
      return response;

    } catch (error) {
      console.log(`Method ${i + 1} failed:`, error instanceof AxiosError ? error.response?.status : 'Network error');
      lastError = error;
      
      // If it's a 404 or connection refused, try next method immediately
      if (error instanceof AxiosError) {
        if (error.response?.status === 404 || error.code === 'ECONNREFUSED') {
          continue;
        }
        // For 405 Method Not Allowed, definitely try next method
        if (error.response?.status === 405) {
          continue;
        }
      }
    }
  }

  // If all methods failed, throw the last error
  throw lastError || new Error('All biometric capture methods failed');
};

// Alternative implementation using native fetch (in case axios has issues)
export const captureBiometricFetch = async (port: number, pidOptions: string) => {
  const endpoints = [
    { method: 'POST', url: `http://127.0.0.1:${port}/capture`, contentType: 'text/xml' },
    { method: 'POST', url: `http://127.0.0.1:${port}/`, contentType: 'text/xml' },
    { method: 'POST', url: `http://127.0.0.1:${port}/capture`, contentType: 'application/x-www-form-urlencoded', isFormData: true },
  ];

  for (let i = 0; i < endpoints.length; i++) {
    const endpoint = endpoints[i];
    
    try {
      console.log(`Fetch method ${i + 1}: ${endpoint.method} ${endpoint.url}`);
      
      let body: string | URLSearchParams;
      if (endpoint.isFormData) {
        body = new URLSearchParams();
        body.append('pidOptions', pidOptions);
      } else {
        body = pidOptions;
      }

      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: {
          'Content-Type': endpoint.contentType,
          'Accept': '*/*',
          'User-Agent': 'RDServiceClient/1.0',
        },
        body: body,
      });

      if (response.ok) {
        const data = await response.text();
        console.log(`Fetch success with method ${i + 1}:`, { status: response.status, dataLength: data.length });
        return { data, status: response.status, statusText: response.statusText };
      } else {
        console.log(`Fetch method ${i + 1} failed:`, response.status, response.statusText);
      }
    } catch (error) {
      console.log(`Fetch method ${i + 1} error:`, error);
    }
  }

  throw new Error('All fetch methods failed');
};
