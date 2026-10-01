import { useState } from "react";
import { mfs110Service } from "../../services/bimetric/mfs110.service";

export default function MFS110Test() {

    const [status, setStatus] = useState("Not checked");
    const [deviceInfo, setDeviceInfo] = useState("");
    const [pidData, setPidData] = useState("");

    const discover = async () => {

        setStatus("Checking RD Service...");

        const result = await mfs110Service.discover();

        setStatus(result.message);

        if (result.data) {
            console.log("RD SERVICE:", result.data);
        }
    };

    const getDeviceInfo = async () => {

        setStatus("Getting device information...");

        const result = await mfs110Service.getDeviceInfo();

        setStatus(result.message);

        if (result.data) {
            setDeviceInfo(result.data);
        }
    };

    const capture = async () => {

        setStatus("Place your finger on the MFS110...");

        const result = await mfs110Service.capture();

        setStatus(result.message);

        if (result.data) {
            setPidData(result.data);
        }
    };

    return (
        <div>

            <h1>MFS110 Test</h1>

            <p>
                Status: <strong>{status}</strong>
            </p>

            <br />
            <button onClick={discover}>
                Discover AVDM
            </button>
            <br />
            <button onClick={getDeviceInfo}>
                Device Info
            </button>
            <br />
            <button onClick={capture}>
                Capture Fingerprint
            </button>
            <br />
            <button
                onClick={() => {
                    setStatus("Reset");
                    setDeviceInfo("");
                    setPidData("");
                }}
            >
                Reset
            </button>

            <hr />

            <h2>Device Info</h2>

            <pre>
                {deviceInfo}
            </pre>

            <h2>PID Data</h2>

            <pre>
                {pidData}
            </pre>

        </div>
    );
}