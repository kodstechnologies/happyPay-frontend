import axios from "axios";

export const checkDeviceStatus = async (port: number) => {
  return await axios({
    method: "RDSERVICE",
    url: `http://127.0.0.1:${port}/`,
    timeout: 1000, 
  });
};

export const captureBiometric = async (port: number, pidOptions: string) => {
  return await axios.post(`http://127.0.0.1:${port}/capture`, pidOptions, {
    headers: {
      "Content-Type": "text/xml",
    },
  });
};
