import axios from "axios";

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




export const getDeviceInfo = async (port: number) => {
  const response = await axios({
    method: "DEVICEINFO",
    url: `http://127.0.0.1:${port}/rd/info`,
    timeout: 5000,
    responseType: "text",
  });

  return response;
};

export const captureBiometric = async (
  port: number,
  pidOptions: string
) => {
  const url = `http://127.0.0.1:${port}/rd/capture`;

  const response = await axios({
    method: "POST",
    url,
    data: pidOptions,
    timeout: 30000,
    headers: {
      "Content-Type": "text/xml",
      Accept: "*/*",
    },
    responseType: "text",
  });

  return response;
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
