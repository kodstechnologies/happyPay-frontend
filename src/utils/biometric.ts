/**
 * Biometric Utilities for parsing RD Service (MFS110/Mantra) PID XML
 */

export interface ExtractedBiometricData {
  dc: string;
  ci: string;
  hmac: string;
  mc: string;
  dpId: string;
  PidDatatype: string;
  Piddata: string;
  rdsId: string;
  rdsVer: string;
  sessionKey: string;
  mi: string;
  errInfo: string;
  errCode: string;
  fCount: string;
  fType: string;
  iCount: string;
  iType: string;
  pCount: string;
  pType: string;
  srno: string;
  qScore: string;
  nmPoints: string;
  sysid: string;
  ts: string;
}

/**
 * Extracts and formats all biometric data fields from the RD Service PID XML.
 * @param xml Raw PID XML string returned by the biometric device capture.
 * @returns Structured biometric data object matching DMT/AEPS schema expectations.
 */
export function extractBiometricData(xml: string): ExtractedBiometricData {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  const resp = doc.querySelector("Resp");
  const device = doc.querySelector("DeviceInfo");
  const skey = doc.querySelector("Skey");
  const hmac = doc.querySelector("Hmac");
  const data = doc.querySelector("Data");

  const getAttr = (el: Element | null, name: string): string => el?.getAttribute(name) || "";

  const srno =
    getAttr(device, "srno") ||
    getAttr(resp, "srno") ||
    device?.querySelector('Param[name="srno"]')?.getAttribute("value") ||
    "";

  const ts =
    device?.querySelector('Param[name="ts"]')?.getAttribute("value") ||
    getAttr(resp, "ts") ||
    new Date().toISOString();

  const sysid =
    getAttr(device, "sysid") ||
    getAttr(resp, "sysid") ||
    device?.querySelector('Param[name="sysid"]')?.getAttribute("value") ||
    "";

  return {
    dc: getAttr(device, "dc"),
    ci: getAttr(skey, "ci"),
    hmac: hmac?.textContent?.trim() || "",
    mc: getAttr(device, "mc"),
    dpId: getAttr(device, "dpId"),
    PidDatatype: getAttr(data, "type"),
    Piddata: data?.textContent?.trim() || "",
    rdsId: getAttr(device, "rdsId"),
    rdsVer: getAttr(device, "rdsVer"),
    sessionKey: skey?.textContent?.trim() || "",
    mi: getAttr(device, "mi"),
    errInfo: getAttr(resp, "errInfo"),
    errCode: getAttr(resp, "errCode"),
    fCount: getAttr(resp, "fCount") || "1",
    fType: getAttr(resp, "fType") || "0",
    iCount: getAttr(resp, "iCount") || "0",
    iType: getAttr(resp, "iType") || "0",
    pCount: getAttr(resp, "pCount") || "0",
    pType: getAttr(resp, "pType") || "0",
    srno,
    qScore: getAttr(resp, "qScore"),
    nmPoints: getAttr(resp, "nmPoints"),
    sysid,
    ts,
  };
}
