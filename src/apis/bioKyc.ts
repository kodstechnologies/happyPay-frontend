import axios from "axios";

export const checkDeviceStatus = async (port: number) => {
  return await axios({
    method: "RDSERVICE",
    url: `http://127.0.0.1:${port}/`,
    timeout: 1000, 
  });
};

export const captureBiometric = async (port: number, pidOptions: string) => {
  return await axios({
    method: "CAPTURE",
    url: `http://127.0.0.1:${port}/capture`,
    data: pidOptions,
    headers: {
      "Content-Type": "text/xml",
    },
    timeout: 15000,
  });
};
