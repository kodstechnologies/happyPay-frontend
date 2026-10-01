import { useState } from "react";
import Modal from "../../../components/common/Modal";
import Button from "../../../components/common/Button";
import Input from "../../../components/common/Input";
import OtpInput from "../../../components/common/OtpInput";
import { CheckCircle2, Building, User, Users } from "lucide-react";

interface SettlementModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (amount: number, type: string) => void;
}

type SettlementType = "bank" | "retailer" | "distributor" | null;

export default function SettlementModal({ open, onClose, onSuccess }: SettlementModalProps) {
  const [step, setStep] = useState<"options" | "amount" | "verify" | "mpin">("options");
  const [type, setType] = useState<SettlementType>(null);
  const [amount, setAmount] = useState("");
  const [mobile, setMobile] = useState("");
  const [mobileVerified, setMobileVerified] = useState(false);
  const [mpin, setMpin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setStep("options");
    setType(null);
    setAmount("");
    setMobile("");
    setMobileVerified(false);
    setMpin("");
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSelectType = (selectedType: SettlementType) => {
    setType(selectedType);
    setStep("amount");
  };

  const handleVerifyMobile = () => {
    if (mobile.length === 10) {
      setMobileVerified(true);
    }
  };

  const handleAmountSubmit = () => {
    if (Number(amount) > 0) {
      if (type === "retailer") {
        setStep("verify");
      } else {
        setStep("mpin");
      }
    }
  };

  const handleVerifySubmit = () => {
    if (mobileVerified) {
      setStep("mpin");
    }
  };

  const handleSubmit = () => {
    if (mpin.length >= 4) {
      setIsSubmitting(true);
      setTimeout(() => {
        onSuccess(Number(amount), type || "bank");
        handleClose();
      }, 1000);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Settlement" size="sm">
      {step === "options" && (
        <div className="space-y-3 pt-2">
          <p className="mb-4 text-sm text-slate-500">Choose where you want to transfer your wallet balance.</p>
          
          <button 
            type="button" 
            onClick={() => handleSelectType("bank")}
            className="flex w-full items-center gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-[#7c3aed] hover:bg-[#f5f0ff]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f0ff] text-[#7c3aed]">
              <Building className="h-5 w-5" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-slate-900">Transfer to Bank</h3>
              <p className="text-xs text-slate-500">Send to your primary bank account</p>
            </div>
          </button>

          <button 
            type="button" 
            onClick={() => handleSelectType("retailer")}
            className="flex w-full items-center gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-[#7c3aed] hover:bg-[#f5f0ff]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f0ff] text-[#7c3aed]">
              <User className="h-5 w-5" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-slate-900">Transfer to Retailer</h3>
              <p className="text-xs text-slate-500">Send to another retailer's wallet</p>
            </div>
          </button>

          <button 
            type="button" 
            onClick={() => handleSelectType("distributor")}
            className="flex w-full items-center gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-[#7c3aed] hover:bg-[#f5f0ff]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f0ff] text-[#7c3aed]">
              <Users className="h-5 w-5" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-slate-900">Transfer to Distributor</h3>
              <p className="text-xs text-slate-500">Send to your distributor's account</p>
            </div>
          </button>
        </div>
      )}

      {step === "amount" && (
        <div className="space-y-4 pt-2">
          {type === "bank" && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
              <span className="font-semibold">Primary Bank Account:</span>
              <p className="mt-1">HDFC Bank ending in 1234</p>
            </div>
          )}
          
          <Input 
            label="Enter Amount" 
            type="number"
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
            placeholder="₹0.00" 
            autoFocus
          />
          
          <Button 
            fullWidth 
            onClick={handleAmountSubmit}
            disabled={!amount || Number(amount) <= 0}
          >
            Continue
          </Button>
        </div>
      )}

      {step === "verify" && (
        <div className="space-y-4 pt-2">
          <Input 
            label="Receiver Mobile Number" 
            value={mobile} 
            onChange={(e) => {
              setMobile(e.target.value.replace(/\D/g, "").slice(0, 10));
              setMobileVerified(false);
            }} 
            placeholder="10-digit mobile number" 
          />
          
          {!mobileVerified ? (
            <Button 
              fullWidth 
              variant="outline"
              onClick={handleVerifyMobile}
              disabled={mobile.length !== 10}
            >
              Verify Mobile
            </Button>
          ) : (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
              Retailer Verified Successfully
            </div>
          )}
          
          <Button 
            fullWidth 
            onClick={handleVerifySubmit}
            disabled={!mobileVerified}
          >
            Continue to MPIN
          </Button>
        </div>
      )}

      {step === "mpin" && (
        <div className="space-y-6 pt-2 text-center">
          <div>
            <p className="text-sm text-slate-500">You are transferring</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">₹{amount}</p>
            
            <p className="mt-2 text-sm font-medium text-slate-700">
              {type === "bank" && "To Primary Bank Account"}
              {type === "retailer" && `To Retailer (${mobile})`}
              {type === "distributor" && "To Distributor Account"}
            </p>
          </div>
          
          <div className="mx-auto max-w-[280px]">
            <p className="mb-3 text-sm font-semibold text-slate-700">Enter your MPIN to confirm</p>
            <OtpInput length={4} value={mpin} onChange={setMpin} />
          </div>
          
          <Button 
            fullWidth 
            onClick={handleSubmit}
            disabled={mpin.length < 4 || isSubmitting}
            loading={isSubmitting}
          >
            Confirm Settlement
          </Button>
        </div>
      )}
    </Modal>
  );
}
