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

// export const captureBiometric = async (
//   port: number,
//   pidOptions: string
// ) => {
//   const url = `http://127.0.0.1:${port}/rd/capture`;

//   try {
//     console.log(`Attempting biometric capture on ${url}...`);
    
//     const response = await axios({
//       method: "POST",
//       url,
//       data: pidOptions,
//       timeout: 30000,
//       headers: {
//         "Content-Type": "text/xml",
//         Accept: "*/*",
//         "User-Agent": "RDServiceClient/1.0",
//       },
//       responseType: "text",
//     });

//     console.log(`Capture response from port ${port}:`, { 
//       status: response.status, 
//       dataLength: response.data?.length,
//       hasData: !!response.data
//     });

//     return response;
//   } catch (error) {
//     console.error(`Capture failed on port ${port}:`, error);
    
//     // Try alternative endpoint if primary fails
//     const altUrl = `http://127.0.0.1:${port}/capture`;
//     console.log(`Trying alternative endpoint: ${altUrl}...`);
    
//     try {
//       const altResponse = await axios({
//         method: "POST",
//         url: altUrl,
//         data: pidOptions,
//         timeout: 30000,
//         headers: {
//           "Content-Type": "text/xml",
//           Accept: "*/*",
//           "User-Agent": "RDServiceClient/1.0",
//         },
//         responseType: "text",
//       });

//       console.log(`Alternative capture response from port ${port}:`, { 
//         status: altResponse.status, 
//         dataLength: altResponse.data?.length 
//       });

//       return altResponse;
//     } catch (altError) {
//       console.error(`Alternative capture also failed on port ${port}:`, altError);
//       throw altError;
//     }
//   }
// };







export const captureBiometric = async (
  port: number,
  pidOptions: string,
  capturePath: string = "/rd/capture"
) => {
  const cleanPath = capturePath.startsWith("/") ? capturePath : `/${capturePath}`;
  return axios({
    method: "CAPTURE",
    url: `http://127.0.0.1:${port}${cleanPath}`,
    data: pidOptions,
    timeout: 30000,
    headers: {
      "Content-Type": "text/xml",
    },
    responseType: "text",
  });
};

// Alternative implementation using native fetch (in case axios has issues)
export const captureBiometricFetch = async (
  port: number,
  pidOptions: string,
  capturePath: string = "/rd/capture"
) => {
  const cleanPath = capturePath.startsWith("/") ? capturePath : `/${capturePath}`;
  const endpoints: { method: string; url: string; contentType: string; isFormData?: boolean }[] = [
    { method: 'CAPTURE', url: `http://127.0.0.1:${port}${cleanPath}`, contentType: 'text/xml' },
    { method: 'POST', url: `http://127.0.0.1:${port}${cleanPath}`, contentType: 'text/xml' },
    { method: 'POST', url: `http://127.0.0.1:${port}/capture`, contentType: 'text/xml' },
    { method: 'POST', url: `http://127.0.0.1:${port}/rd/capture`, contentType: 'text/xml' },
    { method: 'POST', url: `http://127.0.0.1:${port}/`, contentType: 'text/xml' },
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


// import axios from "axios";

// export const checkDeviceStatus = async (port: number) => {
//   return await axios({
//     method: "RDSERVICE",
//     url: `http://127.0.0.1:${port}/`,
//     timeout: 1000, 
//   });
// };

// export const captureBiometric = async (port: number, pidOptions: string) => {
//   return await axios.post(`http://127.0.0.1:${port}/capture`, pidOptions, {
//     headers: {
//       "Content-Type": "text/xml",
//     },
//   });
// };


