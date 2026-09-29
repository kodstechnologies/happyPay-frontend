import { useState } from "react";
import { 
  CreditCard, 
  Smartphone, 
  Bluetooth, 
  BluetoothSearching, 
  BluetoothConnected, 
  CheckCircle2, 
  Loader2,
  IndianRupee,
  ShieldCheck,
  SmartphoneNfc
} from "lucide-react";

type DeviceType = "PAX_D180" | "MOREFUN_MP63" | "WISEASY_WPOS";

type Step = 
  | "SELECT_DEVICE_TYPE"
  | "SCANNING"
  | "DEVICE_LIST"
  | "CONNECTING"
  | "SERVICE_SELECTION"
  | "WITHDRAW_FORM"
  | "WAITING_FOR_CARD"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "BALANCE_WAITING"
  | "BALANCE_RESULT";

export default function MicroAtm() {
  
  const [step, setStep] = useState<Step>("SELECT_DEVICE_TYPE");
  const [connectedDevice, setConnectedDevice] = useState<string | null>(null);
  const [txnId, setTxnId] = useState<string>("");
  
  // Form state
  const [mobile, setMobile] = useState("");
  const [amount, setAmount] = useState("");
  const [balanceAmount, setBalanceAmount] = useState<number | null>(null);

  const handleDeviceTypeSelect = (type: DeviceType) => {
    // Simulated selection
    console.log(type);
    setStep("SCANNING");
    
    setTimeout(() => {
      setStep("DEVICE_LIST");
    }, 2000);
  };

  const handleConnect = (deviceName: string) => {
    setStep("CONNECTING");
    
    setTimeout(() => {
      setConnectedDevice(deviceName);
      setStep("SERVICE_SELECTION");
    }, 1500);
  };

  const handleWithdrawClick = () => {
    setStep("WITHDRAW_FORM");
  };

  const handleBalanceClick = () => {
    setStep("BALANCE_WAITING");
    
    // Simulate user entering PIN on device
    let pinLength = 0;
    const pinInterval = setInterval(() => {
      if (pinLength < 4) {
        pinLength++;
      } else {
        clearInterval(pinInterval);
        setTimeout(() => {
          setBalanceAmount(8450.50);
          setStep("BALANCE_RESULT");
        }, 1500);
      }
    }, 500);
  };

  const handleInitiateWithdraw = () => {
    if (!mobile || !amount) return;
    
    setStep("WAITING_FOR_CARD");
    
    // Automatically proceed to processing after 5 seconds
    setTimeout(() => {
      setStep("PROCESSING");
      
      setTimeout(() => {
        setTxnId(`MATM${Math.floor(Math.random()*10000000)}`);
        setStep("SUCCESS");
      }, 2000);
    }, 5000);
  };

  const resetFlow = () => {
    setMobile("");
    setAmount("");
    setBalanceAmount(null);
    setTxnId("");
    setStep("SERVICE_SELECTION");
  };

  return (
    <div className="min-h-full bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <SmartphoneNfc className="h-8 w-8 text-[#7c3aed]" />
            Micro ATM
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Offer cash withdrawals using Micro ATM</p>
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          
          {/* =========================================================
              WEB PORTAL FLOW
          ========================================================= */}
            
            {/* STEP 1: SELECT DEVICE TYPE */}
            {step === "SELECT_DEVICE_TYPE" && (
              <div className="bg-white rounded-[24px] p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 animate-in zoom-in-95 duration-300">
                <div className="mb-5 pb-4 border-b border-slate-100">
                  <h2 className="text-[17px] font-bold text-slate-800">Select Device Type</h2>
                  <p className="text-slate-500 text-[13px] mt-0.5">Which Micro ATM device are you using?</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { id: "PAX_D180" as DeviceType, name: "Device A", desc: "Standard mATM" },
                    { id: "MOREFUN_MP63" as DeviceType, name: "Device B", desc: "Bluetooth Pinpad" },
                    { id: "WISEASY_WPOS" as DeviceType, name: "Device C", desc: "Smart POS" }
                  ].map((device) => (
                    <button 
                      key={device.id}
                      onClick={() => handleDeviceTypeSelect(device.id)}
                      className="flex flex-col items-center justify-center p-6 border-2 border-slate-100 rounded-[16px] hover:border-[#7c3aed] hover:bg-[#faf5ff] transition-all group"
                    >
                      <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-3 group-hover:bg-white group-hover:shadow-sm transition-all">
                        <Smartphone className="h-6 w-6 text-slate-400 group-hover:text-[#7c3aed]" />
                      </div>
                      <span className="text-[15px] font-bold text-slate-700 group-hover:text-[#7c3aed]">{device.name}</span>
                      <span className="text-[11px] text-slate-400 mt-1 text-center">{device.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: SCANNING */}
            {step === "SCANNING" && (
              <div className="bg-white rounded-[24px] p-10 sm:p-14 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="relative mb-6">
                  <div className="absolute -inset-4 rounded-full bg-[#f3e8ff] animate-ping opacity-75"></div>
                  <div className="absolute -inset-8 rounded-full bg-[#f3e8ff]/50 animate-ping opacity-50" style={{ animationDelay: '200ms' }}></div>
                  <div className="h-16 w-16 bg-[#f3e8ff] rounded-full flex items-center justify-center relative z-10">
                    <BluetoothSearching className="h-8 w-8 text-[#7c3aed] animate-pulse" />
                  </div>
                </div>
                <h2 className="text-[18px] font-bold text-slate-800 mb-1">Scanning for devices</h2>
                <p className="text-slate-500 text-[13px]">Make sure your Micro ATM is turned on and Bluetooth is enabled.</p>
              </div>
            )}

            {/* STEP 3: DEVICE LIST */}
            {step === "DEVICE_LIST" && (
              <div className="bg-white rounded-[24px] p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 animate-in zoom-in-95 duration-300">
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
                  <button onClick={() => setStep("SELECT_DEVICE_TYPE")} className="text-slate-400 hover:text-slate-600 transition-colors">
                    ← Back
                  </button>
                  <div>
                    <h2 className="text-[17px] font-bold text-slate-800">Available Devices</h2>
                    <p className="text-slate-500 text-[13px] mt-0.5">Select your device to pair</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {[
                    { id: "1234", name: "1234 Bluetooth", signal: "Strong" },
                    { id: "1235", name: "1235", signal: "Medium" },
                    { id: "1236", name: "1236", signal: "Weak" },
                  ].map((device) => (
                    <button 
                      key={device.id}
                      onClick={() => handleConnect(device.name)}
                      className="w-full flex items-center justify-between p-4 border border-slate-100 rounded-[16px] hover:border-[#7c3aed] hover:bg-[#faf5ff] transition-all group text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
                          <Bluetooth className="h-5 w-5 text-slate-400 group-hover:text-[#7c3aed]" />
                        </div>
                        <div>
                          <p className="text-[15px] font-bold text-slate-700 group-hover:text-[#7c3aed]">{device.name}</p>
                          <p className="text-[11px] text-slate-400">{device.signal} Signal</p>
                        </div>
                      </div>
                      <span className="text-[12px] font-semibold text-[#7c3aed] opacity-0 group-hover:opacity-100 transition-opacity">
                        Connect
                      </span>
                    </button>
                  ))}
                </div>
                
                <div className="mt-5 text-center">
                  <button onClick={() => {
                    setStep("SCANNING");
                    setTimeout(() => setStep("DEVICE_LIST"), 2000);
                  }} className="text-[#7c3aed] text-[13px] font-semibold hover:underline">
                    Rescan for devices
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: CONNECTING */}
            {step === "CONNECTING" && (
              <div className="bg-white rounded-[24px] p-10 sm:p-14 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="relative mb-6">
                  <div className="absolute -inset-4 rounded-full bg-[#f3e8ff] animate-pulse"></div>
                  <div className="h-16 w-16 bg-[#f3e8ff] rounded-full flex items-center justify-center relative z-10">
                    <Loader2 className="h-8 w-8 text-[#7c3aed] animate-spin" />
                  </div>
                </div>
                <h2 className="text-[18px] font-bold text-slate-800 mb-1">Connecting to {connectedDevice}</h2>
                <p className="text-slate-500 text-[13px]">Pairing with your device securely...</p>
              </div>
            )}
            {/* STEP 5: SERVICE SELECTION */}
            {step === "SERVICE_SELECTION" && (
              <div className="bg-white rounded-[24px] p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-[17px] font-bold text-slate-800">Select Service</h2>
                    <p className="text-slate-500 text-[13px] mt-0.5">What would the customer like to do?</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f3e8ff] text-[#7c3aed] text-[11px] font-bold">
                    <BluetoothConnected className="h-3 w-3" />
                    {connectedDevice}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={handleBalanceClick}
                    className="flex flex-col items-center justify-center p-6 border-2 border-slate-100 rounded-[16px] hover:border-[#08ae82] hover:bg-[#f2fdf9] transition-all group"
                  >
                    <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center mb-3 group-hover:bg-white group-hover:shadow-sm transition-all">
                      <ShieldCheck className="h-5 w-5 text-slate-400 group-hover:text-[#08ae82]" />
                    </div>
                    <span className="text-[15px] font-bold text-slate-700 group-hover:text-[#08ae82]">Balance Enquiry</span>
                    <span className="text-[11px] text-slate-400 mt-1.5 text-center group-hover:text-[#08ae82]/70">Check account balance securely</span>
                  </button>
                  
                  <button 
                    onClick={handleWithdrawClick}
                    className="flex flex-col items-center justify-center p-6 border-2 border-slate-100 rounded-[16px] hover:border-[#7c3aed] hover:bg-[#faf5ff] transition-all group"
                  >
                    <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center mb-3 group-hover:bg-white group-hover:shadow-sm transition-all">
                      <IndianRupee className="h-5 w-5 text-slate-400 group-hover:text-[#7c3aed]" />
                    </div>
                    <span className="text-[15px] font-bold text-slate-700 group-hover:text-[#7c3aed]">Cash Withdrawal</span>
                    <span className="text-[11px] text-slate-400 mt-1.5 text-center group-hover:text-[#7c3aed]/70">Withdraw cash from any bank</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 6: WITHDRAW FORM */}
            {step === "WITHDRAW_FORM" && (
              <div className="bg-white rounded-[24px] p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
                  <button onClick={() => setStep("SERVICE_SELECTION")} className="text-slate-400 hover:text-slate-600 transition-colors">
                    ← Back
                  </button>
                  <h2 className="text-[17px] font-bold text-slate-800">Cash Withdrawal</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Customer Mobile Number</label>
                    <div className="relative">
                      <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input 
                        type="text" 
                        maxLength={10}
                        placeholder="Enter 10 digit number"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed]/10 outline-none transition-all font-medium text-[14px] text-slate-800"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Withdrawal Amount</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[15px]">₹</span>
                      <input 
                        type="text" 
                        placeholder="Enter amount (e.g. 500)"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#7c3aed] focus:ring-4 focus:ring-[#7c3aed]/10 outline-none transition-all font-bold text-[17px] text-slate-800"
                      />
                    </div>
                    
                    <div className="flex gap-2 mt-2.5">
                      {["500", "1000", "2000", "5000"].map((preset) => (
                        <button 
                          key={preset}
                          onClick={() => setAmount(preset)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[11px] font-bold transition-colors"
                        >
                          ₹{preset}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    onClick={handleInitiateWithdraw}
                    disabled={!mobile || !amount}
                    className="w-full mt-2 py-3 bg-[#7c3aed] hover:bg-[#6d28d9] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-[14px] font-bold rounded-xl shadow-[0_8px_20px_-10px_rgba(49,91,209,0.8)] transition-all flex items-center justify-center gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    Initiate Transaction
                  </button>
                </div>
              </div>
            )}

            {/* STEP 7/8: WAITING OR PROCESSING */}
            {(step === "WAITING_FOR_CARD" || step === "PROCESSING" || step === "BALANCE_WAITING") && (
              <div className="bg-white rounded-[24px] p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col items-center justify-center text-center">
                <div className="relative mb-6">
                  <div className="absolute -inset-3 rounded-full bg-[#f3e8ff] animate-pulse"></div>
                  <CreditCard className="h-10 w-10 text-[#7c3aed] relative z-10" />
                  {step === "PROCESSING" && (
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                      <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
                    </div>
                  )}
                </div>
                
                <h2 className="text-[17px] font-bold text-slate-800">
                  {step === "PROCESSING" ? "Processing Transaction..." : "Transaction Initiated"}
                </h2>
                <p className="text-slate-500 text-[13px] mt-1.5">
                  {step === "PROCESSING" 
                    ? "Please wait while we process the request securely."
                    : "Please instruct customer to insert card and enter PIN on the mATM device."}
                </p>
              </div>
            )}

            {/* STEP 9: SUCCESS RESULT */}
            {step === "SUCCESS" && (
              <div className="bg-white rounded-[24px] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#08ae82]/20 text-center relative overflow-hidden">
                <div className="absolute -right-8 -top-8 h-32 w-32 bg-[#e7f8f3] rounded-full blur-3xl"></div>
                <div className="absolute -left-8 -bottom-8 h-32 w-32 bg-[#e7f8f3] rounded-full blur-3xl"></div>
                
                <div className="relative z-10">
                  <div className="h-16 w-16 rounded-full bg-[#08ae82] text-white flex items-center justify-center mx-auto mb-4 shadow-[0_8px_20px_-8px_rgba(8,174,130,0.6)]">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h2 className="text-[20px] font-bold text-slate-800 mb-1">Transaction Successful</h2>
                  <p className="text-slate-500 text-[13px] mb-6">₹{amount} has been added to your wallet</p>
                  
                  <div className="bg-slate-50 rounded-[16px] p-5 border border-slate-100 max-w-sm mx-auto space-y-2.5 mb-6">
                    <div className="flex justify-between text-[13px]">
                      <span className="text-slate-500">Amount Withdraw</span>
                      <span className="font-bold text-slate-800">₹{amount}</span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-slate-500">Customer Mobile</span>
                      <span className="font-bold text-slate-800">+91 {mobile}</span>
                    </div>
                    <div className="flex justify-between text-[13px] pt-2.5 border-t border-slate-200">
                      <span className="text-slate-500">Txn ID</span>
                      <span className="font-mono font-bold text-slate-600">{txnId}</span>
                    </div>
                  </div>
                  
                  <button onClick={resetFlow} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[13px] font-bold rounded-xl transition-colors">
                    New Transaction
                  </button>
                </div>
              </div>
            )}

            {/* BALANCE RESULT */}
            {step === "BALANCE_RESULT" && (
              <div className="bg-white rounded-[24px] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#7c3aed]/20 text-center">
                <div className="h-14 w-14 rounded-full bg-[#f3e8ff] text-[#7c3aed] flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <h2 className="text-slate-500 font-semibold text-[13px] mb-1">Available Balance</h2>
                <div className="text-[28px] font-bold text-[#7c3aed] tracking-tight mb-6">
                  ₹{balanceAmount?.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                </div>
                
                <div className="flex gap-3 justify-center">
                  <button onClick={resetFlow} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[13px] font-bold rounded-xl transition-colors">
                    Done
                  </button>
                  <button onClick={handleWithdrawClick} className="px-5 py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-[13px] font-bold rounded-xl shadow-lg transition-colors flex items-center gap-1.5">
                    <IndianRupee className="h-4 w-4" />
                    Withdraw Now
                  </button>
                </div>
              </div>
            )}

        </div>
      </div>
    </div>
  );
}
