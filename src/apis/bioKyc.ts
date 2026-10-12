import axios, { AxiosError } from "axios";

export const checkDeviceStatus = async (port: number) => {
  try {
    // Try the standard RDSERVICE method first
    return await axios({
      method: "RDSERVICE",
      url: `http://127.0.0.1:${port}/`,
      timeout: 1000, 
    });
  } catch (error) {
    // Fallback to GET method if RDSERVICE method is not supported
    try {
      return await axios({
        method: "GET",
        url: `http://127.0.0.1:${port}/`,
        timeout: 1000, 
      });
    } catch {
      throw error; // Throw the original error
    }
  }
};

export const captureBiometric = async (port: number, pidOptions: string) => {
  try {
    // Try the standard CAPTURE method first
    return await axios({
      method: "CAPTURE",
      url: `http://127.0.0.1:${port}/capture`,
      data: pidOptions,
      headers: {
        "Content-Type": "text/xml",
      },
      timeout: 15000,
    });
  } catch (error) {
    // If 405 Method Not Allowed, try POST method as fallback
    if (error instanceof AxiosError && error.response && error.response.status === 405) {
      try {
        console.log("CAPTURE method not allowed, trying POST method...");
        return await axios({
          method: "POST",
          url: `http://127.0.0.1:${port}/capture`,
          data: pidOptions,
          headers: {
            "Content-Type": "text/xml",
          },
          timeout: 15000,
        });
      } catch {
        // If POST also fails, try different endpoint variations
        try {
          console.log("POST to /capture failed, trying root endpoint...");
          return await axios({
            method: "POST",
            url: `http://127.0.0.1:${port}/`,
            data: pidOptions,
            headers: {
              "Content-Type": "text/xml",
            },
            timeout: 15000,
          });
        } catch {
          throw error; // Throw the original CAPTURE error
        }
      }
    }
    throw error;
  }
};
