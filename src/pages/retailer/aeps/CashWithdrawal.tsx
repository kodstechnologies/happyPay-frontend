import { WalletCards, ArrowLeft } from "lucide-react";

interface CashWithdrawalProps {
  onBack?: () => void;
  onNext?: () => void;
}

const CashWithdrawal = ({ onBack, onNext }: CashWithdrawalProps) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
      )}

      <div>
        <h2 className="text-2xl font-bold text-slate-900">Cash Withdrawal</h2>
        <p className="mt-2 text-base text-slate-500">Withdraw cash from your bank account</p>
      </div>

      <div className="rounded-2xl border border-purple-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-purple-50 mb-4">
            <WalletCards className="h-10 w-10 text-purple-600" />
          </div>
          <p className="text-center text-sm text-slate-600">
            Cash withdrawal flow will be implemented here
          </p>
        </div>

        {onNext && (
          <button
            type="button"
            onClick={onNext}
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 text-sm font-bold text-white shadow-md transition-all hover:bg-purple-700"
          >
            CONTINUE
          </button>
        )}
      </div>
    </div>
  );
};

export default CashWithdrawal;
