import { ArrowLeft, Eye, Download, CheckCircle, XCircle, X, FileText, ShieldCheck, ShieldAlert, Clock, ZoomIn, ZoomOut, RotateCw, Search, Store, User, CreditCard, MapPin, Phone, Mail, IndianRupee, TrendingUp } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DUMMY_RETAILERS, DUMMY_SUB_RETAILERS, generateTransactions } from "./mockRetailers";
import type { SubRetailer } from "./mockRetailers";
import Pagination from "../../../components/common/Pagination";

type Tab = 'registration' | 'transactions' | 'retailers';
type TxFilter = 'AEPS' | 'DMT' | 'CMS' | 'UPI Cashpoint' | 'Aadhar pay' | 'BBPS' | 'Others';
type DocStatus = 'pending' | 'approved' | 'rejected';

interface DocumentItem {
  id: string;
  label: string;
  value: string;
  imageUrl: string;
  status: DocStatus;
  rejectionReason?: string;
  uploadedAt: string;
}

export default function AdminRetailerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<Tab>('registration');
  const [txFilter, setTxFilter] = useState<TxFilter>('AEPS');
  
  // Document viewer modal
  const [viewingDoc, setViewingDoc] = useState<DocumentItem | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  
  // Rejection modal
  const [rejectingDoc, setRejectingDoc] = useState<DocumentItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionReasonError, setRejectionReasonError] = useState('');
  const rejectionTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Retailers tab state
  const [subRetailerSearch, setSubRetailerSearch] = useState('');
  const [subRetailerPage, setSubRetailerPage] = useState(1);
  const SUB_RETAILER_PAGE_SIZE = 5;

  // Retailer Profile Modal
  const [viewingRetailer, setViewingRetailer] = useState<SubRetailer | null>(null);
  const [retailerTxPage, setRetailerTxPage] = useState(1);
  const [retailerTxFilter, setRetailerTxFilter] = useState<string>('all');
  const RETAILER_TX_PAGE_SIZE = 8;
  
  // Document statuses (local state for demo)
  const [documents, setDocuments] = useState<DocumentItem[]>([
    {
      id: 'pan',
      label: 'PAN Card',
      value: 'ABCDE1234F',
      imageUrl: '/docs/pan_card.jpg',
      status: 'pending',
      uploadedAt: '2026-09-15'
    },
    {
      id: 'aadhaar',
      label: 'Aadhaar Card',
      value: '1234-5678-9012',
      imageUrl: '/docs/aadhaar_card.jpg',
      status: 'approved',
      uploadedAt: '2026-09-15'
    },
    {
      id: 'gst',
      label: 'Business Proof (GST)',
      value: '29ABCDE1234F1Z5',
      imageUrl: '/docs/gst_certificate.jpg',
      status: 'rejected',
      rejectionReason: 'Document is blurry and name does not match the registered business name. Please re-upload a clear copy.',
      uploadedAt: '2026-09-16'
    }
  ]);

  // Just read from dummy items
  const selected = DUMMY_RETAILERS.find(item => item.id === id);

  useEffect(() => {
    if (rejectingDoc && rejectionTextareaRef.current) {
      rejectionTextareaRef.current.focus();
    }
  }, [rejectingDoc]);

  const handleApprove = (docId: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === docId ? { ...doc, status: 'approved' as DocStatus, rejectionReason: undefined } : doc
    ));
  };

  const handleRejectSubmit = () => {
    if (!rejectionReason.trim()) {
      setRejectionReasonError('Please provide a reason for rejection');
      return;
    }
    if (rejectionReason.trim().length < 10) {
      setRejectionReasonError('Rejection reason must be at least 10 characters');
      return;
    }
    if (rejectingDoc) {
      setDocuments(prev => prev.map(doc => 
        doc.id === rejectingDoc.id ? { ...doc, status: 'rejected' as DocStatus, rejectionReason: rejectionReason.trim() } : doc
      ));
      setRejectingDoc(null);
      setRejectionReason('');
      setRejectionReasonError('');
    }
  };

  const handleDownload = (doc: DocumentItem) => {
    const link = document.createElement('a');
    link.href = doc.imageUrl;
    link.download = `${doc.label.replace(/\s+/g, '_')}_${doc.value}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusConfig = (status: DocStatus) => {
    switch (status) {
      case 'approved':
        return {
          icon: <ShieldCheck className="h-3.5 w-3.5" />,
          label: 'Approved',
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          border: 'border-emerald-200',
          ring: 'ring-emerald-500/20',
          dot: 'bg-emerald-500'
        };
      case 'rejected':
        return {
          icon: <ShieldAlert className="h-3.5 w-3.5" />,
          label: 'Rejected',
          bg: 'bg-rose-50',
          text: 'text-rose-700',
          border: 'border-rose-200',
          ring: 'ring-rose-500/20',
          dot: 'bg-rose-500'
        };
      default:
        return {
          icon: <Clock className="h-3.5 w-3.5" />,
          label: 'Pending Review',
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          border: 'border-amber-200',
          ring: 'ring-amber-500/20',
          dot: 'bg-amber-500'
        };
    }
  };

  // Sub-retailers filtered + paginated
  const filteredSubRetailers = useMemo(() => {
    if (!subRetailerSearch.trim()) return DUMMY_SUB_RETAILERS;
    const q = subRetailerSearch.toLowerCase();
    return DUMMY_SUB_RETAILERS.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.mobile.includes(q) ||
      r.id.toLowerCase().includes(q)
    );
  }, [subRetailerSearch]);

  const subRetailerTotalPages = Math.ceil(filteredSubRetailers.length / SUB_RETAILER_PAGE_SIZE);
  const paginatedSubRetailers = filteredSubRetailers.slice(
    (subRetailerPage - 1) * SUB_RETAILER_PAGE_SIZE,
    subRetailerPage * SUB_RETAILER_PAGE_SIZE
  );

  // Retailer transaction data (memoized per retailer)
  const retailerTransactions = useMemo(() => {
    if (!viewingRetailer) return [];
    return generateTransactions(viewingRetailer.id);
  }, [viewingRetailer]);

  const filteredRetailerTx = useMemo(() => {
    if (retailerTxFilter === 'all') return retailerTransactions;
    return retailerTransactions.filter(tx => tx.type === retailerTxFilter);
  }, [retailerTransactions, retailerTxFilter]);

  const retailerTxTotalPages = Math.ceil(filteredRetailerTx.length / RETAILER_TX_PAGE_SIZE);
  const paginatedRetailerTx = filteredRetailerTx.slice(
    (retailerTxPage - 1) * RETAILER_TX_PAGE_SIZE,
    retailerTxPage * RETAILER_TX_PAGE_SIZE
  );

  const txStatusBadge: Record<string, string> = {
    success: 'bg-emerald-100 text-emerald-700',
    failed: 'bg-rose-100 text-rose-700',
    pending: 'bg-amber-100 text-amber-700',
  };

  const kycBadge: Record<string, { bg: string; text: string }> = {
    approved: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    pending: { bg: 'bg-amber-50', text: 'text-amber-700' },
    rejected: { bg: 'bg-rose-50', text: 'text-rose-700' },
  };

  const statusBadge: Record<string, { bg: string; text: string }> = {
    active: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    pending: { bg: 'bg-amber-50', text: 'text-amber-700' },
    blocked: { bg: 'bg-rose-50', text: 'text-rose-700' },
  };

  if (!selected) {
    return <div className="p-8 text-center text-slate-500 font-medium">Retailer not found</div>;
  }

  const personalInfoFields = [
    { label: "Retailer Name", value: selected.fullName },
    { label: "Mobile Number", value: selected.mobile },
    { label: "Email Address", value: selected.email },
    { label: "Gender", value: "Male" },
    { label: "DOB", value: "15/08/1988" },
    { label: "Educational Qualification", value: "Bachelor's Degree" },
  ];

  const shopInfoFields = [
    { label: "Shop Name", value: selected.shop?.name || "Dummy Shop" },
    { label: "Shop Category", value: "Mobile & Accessories" },
    { label: "Property Type", value: "Rented" },
    { label: "Shop Address", value: selected.shop?.address ? `${selected.shop.address.addressLine || ''}, ${selected.shop.address.city || ''}, ${selected.shop.address.state || ''}` : "Dummy Address" },
  ];

  const bankInfoFields = [
    { label: "Bank Name", value: "State Bank of India" },
    { label: "IFSC Code", value: "SBIN0001234" },
    { label: "Account Number", value: "XXXXXXXX9012" },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              {selected.fullName}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {selected.id} • <span className="uppercase text-[10px] font-bold text-[#315bd1] ml-1 bg-[#f0f4ff] px-2 py-0.5 rounded-full">{selected.role}</span>
              <span className={`ml-2 uppercase text-[10px] font-bold px-2 py-0.5 rounded-full ${
                selected.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                selected.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                'bg-rose-50 text-rose-700'
              }`}>{selected.status}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Action buttons removed as requested */}
        </div>
      </div>

      <div className="hp-card rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex gap-6 border-b border-slate-100 pb-0">
          <button
            onClick={() => setActiveTab('registration')}
            className={`text-sm font-bold pb-3 px-1 ${activeTab === 'registration' ? 'text-[#315bd1] border-b-2 border-[#315bd1]' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Registration
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`text-sm font-bold pb-3 px-1 ${activeTab === 'transactions' ? 'text-[#315bd1] border-b-2 border-[#315bd1]' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Transactions
          </button>
          {selected.role === 'distributor' && (
            <button
              onClick={() => setActiveTab('retailers')}
              className={`text-sm font-bold pb-3 px-1 ${activeTab === 'retailers' ? 'text-[#315bd1] border-b-2 border-[#315bd1]' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Retailers
            </button>
          )}
        </div>

        {activeTab === 'registration' && (
          <div className="mt-6 space-y-8 animate-slide-in-right">
            {/* ── Personal Information ── */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-lg bg-[#315bd1]/10 flex items-center justify-center">
                  <svg className="h-3.5 w-3.5 text-[#315bd1]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Personal Information</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {personalInfoFields.map((field, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{field.label}</p>
                    <p className="mt-1 text-sm font-bold text-slate-800 break-all">{field.value || "-"}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Shop Information ── */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <svg className="h-3.5 w-3.5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
                </div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Shop Information</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {shopInfoFields.map((field, idx) => (
                  <div key={idx} className={`rounded-xl border border-slate-200 bg-slate-50/70 p-4 ${idx === shopInfoFields.length - 1 ? 'sm:col-span-2 lg:col-span-1' : ''}`}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{field.label}</p>
                    <p className="mt-1 text-sm font-bold text-slate-800 break-all">{field.value || "-"}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Bank Information ── */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-lg bg-teal-500/10 flex items-center justify-center">
                  <svg className="h-3.5 w-3.5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                </div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Bank Details</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {bankInfoFields.map((field, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{field.label}</p>
                    <p className="mt-1 text-sm font-bold text-slate-800 break-all">{field.value || "-"}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Documents & KYC ── */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <FileText className="h-3.5 w-3.5 text-orange-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Documents & KYC Verification</h3>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    {documents.filter(d => d.status === 'approved').length} Approved
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-600">
                    <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                    {documents.filter(d => d.status === 'pending').length} Pending
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-600">
                    <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                    {documents.filter(d => d.status === 'rejected').length} Rejected
                  </span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-1">
                {documents.map((doc) => {
                  const statusConfig = getStatusConfig(doc.status);
                  return (
                    <div
                      key={doc.id}
                      className={`rounded-2xl border-2 ${statusConfig.border} bg-white overflow-hidden transition-all duration-300 hover:shadow-lg`}
                      style={{ boxShadow: '0 2px 12px -3px rgba(15, 23, 42, 0.06)' }}
                    >
                      <div className="flex flex-col sm:flex-row">
                        {/* Document Image Thumbnail */}
                        <div
                          className="relative group sm:w-56 h-40 sm:h-auto flex-shrink-0 bg-slate-100 cursor-pointer overflow-hidden"
                          onClick={() => { setViewingDoc(doc); setZoom(1); setRotation(0); }}
                        >
                          <img
                            src={doc.imageUrl}
                            alt={doc.label}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2">
                              <span className="bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-lg">
                                <Eye className="h-4 w-4 text-slate-700" />
                              </span>
                            </div>
                          </div>
                          {/* Status badge on image */}
                          <div className={`absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${statusConfig.bg} ${statusConfig.text} ring-1 ${statusConfig.ring} backdrop-blur-sm`}>
                            {statusConfig.icon}
                            {statusConfig.label}
                          </div>
                        </div>

                        {/* Document Details */}
                        <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h4 className="text-sm font-bold text-slate-800">{doc.label}</h4>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  Uploaded on {new Date(doc.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 flex items-center gap-2">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Document No:</span>
                              <span className="text-sm font-bold text-slate-700 font-mono tracking-wide">{doc.value}</span>
                            </div>

                            {/* Show rejection reason if rejected */}
                            {doc.status === 'rejected' && doc.rejectionReason && (
                              <div className="mt-3 rounded-lg bg-rose-50 border border-rose-100 p-3">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-rose-500 mb-1">Rejection Reason</p>
                                <p className="text-xs text-rose-700 leading-relaxed">{doc.rejectionReason}</p>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="mt-4 flex items-center gap-2 flex-wrap">
                            {/* View Button */}
                            <button
                              onClick={() => { setViewingDoc(doc); setZoom(1); setRotation(0); }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all duration-200 hover:shadow-sm"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </button>

                            {/* Download Button */}
                            <button
                              onClick={() => handleDownload(doc)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-[#315bd1]/10 text-[#315bd1] hover:bg-[#315bd1]/20 transition-all duration-200 hover:shadow-sm"
                            >
                              <Download className="h-3.5 w-3.5" />
                              Download
                            </button>

                            <div className="flex-1"></div>

                            {/* Approve / Reject Buttons */}
                            {doc.status !== 'approved' && (
                              <button
                                onClick={() => handleApprove(doc.id)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-all duration-200 shadow-sm hover:shadow-md"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                Approve
                              </button>
                            )}
                            {doc.status !== 'rejected' && (
                              <button
                                onClick={() => { setRejectingDoc(doc); setRejectionReason(''); setRejectionReasonError(''); }}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-rose-500 text-white hover:bg-rose-600 transition-all duration-200 shadow-sm hover:shadow-md"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Reject
                              </button>
                            )}
                            {doc.status === 'approved' && (
                              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                                <CheckCircle className="h-3.5 w-3.5" />
                                Document Verified
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="mt-6 flex flex-col gap-5">
            <div className="flex flex-wrap gap-2">
              {(['AEPS', 'UPI Cashpoint', 'Aadhar pay', 'BBPS', 'DMT', 'CMS', 'Others'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setTxFilter(tab)}
                  className={`px-5 py-2 rounded-lg text-xs font-bold transition-colors ${txFilter === tab ? 'bg-[#315bd1] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              {txFilter === 'AEPS' && (
                <table className="hp-table">
                  <thead>
                    <tr>
                      <th>Customer No</th>
                      <th>Aadhar</th>
                      <th>Bank</th>
                      <th>Transaction Type</th>
                      <th>Amount</th>
                      <th>Commission</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.status === 'pending' ? (
                      <tr>
                        <td colSpan={7} className="text-center py-6 text-slate-500 font-medium">No transactions found</td>
                      </tr>
                    ) : (
                      <tr>
                        <td className="font-medium text-slate-700">9876543210</td>
                        <td>XXXX-XXXX-1234</td>
                        <td>SBI</td>
                        <td className="font-medium">Cash Withdraw</td>
                        <td className="font-medium text-slate-700">₹5,000</td>
                        <td className="font-bold text-emerald-600">₹15.00</td>
                        <td><span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold">Success</span></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
              {txFilter === 'DMT' && (
                <table className="hp-table">
                  <thead>
                    <tr>
                      <th>Sender Mobile</th>
                      <th>Receiver Name</th>
                      <th>Account No</th>
                      <th>IFSC</th>
                      <th>Amount</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.status === 'pending' ? (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-slate-500 font-medium">No transactions found</td>
                      </tr>
                    ) : (
                      <tr>
                        <td className="font-medium text-slate-700">9998887776</td>
                        <td>John Doe</td>
                        <td>1234567890</td>
                        <td>SBIN0001234</td>
                        <td className="font-medium text-slate-700">₹15,000</td>
                        <td>2026-09-24</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
              {txFilter === 'CMS' && (
                <table className="hp-table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Emp Info</th>
                      <th>Transaction Type</th>
                      <th>Amount</th>
                      <th>Trans ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.status === 'pending' ? (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-slate-500 font-medium">No transactions found</td>
                      </tr>
                    ) : (
                      <tr>
                        <td className="font-medium text-slate-700">Zomato</td>
                        <td>EMP-1029</td>
                        <td className="font-medium">Cash Drop</td>
                        <td className="font-medium text-slate-700">₹8,500</td>
                        <td>TXN987654321</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
              {txFilter === 'UPI Cashpoint' && (
                <table className="hp-table">
                  <thead>
                    <tr>
                      <th>VPA / UPI ID</th>
                      <th>Customer Name</th>
                      <th>Amount</th>
                      <th>Reference No</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.status === 'pending' ? (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-slate-500 font-medium">No transactions found</td>
                      </tr>
                    ) : (
                      <tr>
                        <td className="font-medium text-slate-700">user@upi</td>
                        <td>Amit Kumar</td>
                        <td className="font-medium text-slate-700">₹2,000</td>
                        <td>REF987654321</td>
                        <td>2026-09-24</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
              {txFilter === 'Aadhar pay' && (
                <table className="hp-table">
                  <thead>
                    <tr>
                      <th>Aadhar</th>
                      <th>Bank</th>
                      <th>Amount</th>
                      <th>Reference No</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.status === 'pending' ? (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-slate-500 font-medium">No transactions found</td>
                      </tr>
                    ) : (
                      <tr>
                        <td className="font-medium text-slate-700">XXXX-XXXX-4321</td>
                        <td>HDFC Bank</td>
                        <td className="font-medium text-slate-700">₹4,500</td>
                        <td>REF123456789</td>
                        <td>2026-09-23</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
              {txFilter === 'BBPS' && (
                <table className="hp-table">
                  <thead>
                    <tr>
                      <th>Biller</th>
                      <th>Category</th>
                      <th>Customer ID</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.status === 'pending' ? (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-slate-500 font-medium">No transactions found</td>
                      </tr>
                    ) : (
                      <tr>
                        <td className="font-medium text-slate-700">BESCOM</td>
                        <td>Electricity</td>
                        <td>CUST98765</td>
                        <td className="font-medium text-slate-700">₹1,200</td>
                        <td><span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold">Success</span></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
              {txFilter === 'Others' && (
                <div className="p-8 text-center text-slate-500 font-medium">No other transactions found</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'retailers' && selected.role === 'distributor' && (
          <div className="mt-6 space-y-4 animate-slide-in-right">
            {/* Search & Stats Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-[#315bd1]" />
                <span className="text-sm font-bold text-slate-700">{filteredSubRetailers.length} Retailers</span>
                <span className="text-xs text-slate-400">under this distributor</span>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={subRetailerSearch}
                  onChange={(e) => { setSubRetailerSearch(e.target.value); setSubRetailerPage(1); }}
                  placeholder="Search retailers..."
                  className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-[#315bd1] focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="hp-table">
                <thead>
                  <tr>
                    <th>Retailer ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Mobile</th>
                    <th>Status</th>
                    <th>KYC</th>
                    <th>Created</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSubRetailers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-500 font-medium">No retailers found</td>
                    </tr>
                  ) : (
                    paginatedSubRetailers.map((sub) => (
                      <tr key={sub.id}>
                        <td className="font-bold text-[#315bd1]">{sub.id}</td>
                        <td className="font-bold text-slate-800">{sub.name}</td>
                        <td className="text-slate-600">{sub.email}</td>
                        <td>{sub.mobile}</td>
                        <td>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusBadge[sub.status]?.bg || 'bg-slate-100'} ${statusBadge[sub.status]?.text || 'text-slate-600'}`}>
                            {sub.status}
                          </span>
                        </td>
                        <td>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${kycBadge[sub.kycStatus]?.bg || 'bg-slate-100'} ${kycBadge[sub.kycStatus]?.text || 'text-slate-600'}`}>
                            {sub.kycStatus}
                          </span>
                        </td>
                        <td className="text-slate-500">{sub.createdAt}</td>
                        <td className="text-center">
                          <button
                            onClick={() => { setViewingRetailer(sub); setRetailerTxPage(1); setRetailerTxFilter('all'); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#315bd1]/10 text-[#315bd1] hover:bg-[#315bd1]/20 transition-all duration-200"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={subRetailerPage}
              totalPages={subRetailerTotalPages}
              onPageChange={setSubRetailerPage}
              totalItems={filteredSubRetailers.length}
              pageSize={SUB_RETAILER_PAGE_SIZE}
            />
          </div>
        )}
      </div>

      {/* ── Retailer Profile Modal ── */}
      {viewingRetailer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ animation: 'fadeIn 200ms ease-out' }}
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setViewingRetailer(null)}
          />
          <div
            className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col"
            style={{ animation: 'scaleIn 250ms cubic-bezier(0.22, 1, 0.36, 1)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#315bd1] to-[#4f78e8] flex items-center justify-center shadow-md shadow-[#315bd1]/20">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">{viewingRetailer.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500 font-mono">{viewingRetailer.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${statusBadge[viewingRetailer.status]?.bg} ${statusBadge[viewingRetailer.status]?.text}`}>{viewingRetailer.status}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${kycBadge[viewingRetailer.kycStatus]?.bg} ${kycBadge[viewingRetailer.kycStatus]?.text}`}>KYC: {viewingRetailer.kycStatus}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewingRetailer(null)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body — scrollable */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5 space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/60 p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">Total Txns</span>
                  </div>
                  <p className="text-lg font-extrabold text-blue-700">{viewingRetailer.totalTransactions}</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/60 p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <IndianRupee className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Volume</span>
                  </div>
                  <p className="text-lg font-extrabold text-emerald-700">{viewingRetailer.totalVolume}</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-violet-50 to-violet-100/50 border border-violet-200/60 p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Store className="h-3.5 w-3.5 text-violet-600" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-violet-500">Shop</span>
                  </div>
                  <p className="text-sm font-bold text-violet-700 truncate">{viewingRetailer.shopName}</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/60 p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-amber-600" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Bank</span>
                  </div>
                  <p className="text-sm font-bold text-amber-700 truncate">{viewingRetailer.bankName}</p>
                </div>
              </div>

              {/* Profile Details Grid */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200">
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Profile Details</h4>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-100">
                  {[
                    { icon: <User className="h-3.5 w-3.5" />, label: 'Full Name', value: viewingRetailer.name },
                    { icon: <Mail className="h-3.5 w-3.5" />, label: 'Email', value: viewingRetailer.email },
                    { icon: <Phone className="h-3.5 w-3.5" />, label: 'Mobile', value: viewingRetailer.mobile },
                    { icon: <FileText className="h-3.5 w-3.5" />, label: 'PAN Number', value: viewingRetailer.pan },
                    { icon: <FileText className="h-3.5 w-3.5" />, label: 'Aadhaar', value: viewingRetailer.aadhar },
                    { icon: <Store className="h-3.5 w-3.5" />, label: 'Shop Name', value: viewingRetailer.shopName },
                    { icon: <MapPin className="h-3.5 w-3.5" />, label: 'Address', value: viewingRetailer.shopAddress },
                    { icon: <CreditCard className="h-3.5 w-3.5" />, label: 'Bank', value: `${viewingRetailer.bankName} (${viewingRetailer.ifsc})` },
                    { icon: <CreditCard className="h-3.5 w-3.5" />, label: 'Account No', value: viewingRetailer.accountNumber },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-white p-3.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-slate-400">{item.icon}</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{item.label}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 break-all">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transactions Section */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Transaction History ({filteredRetailerTx.length})</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {['all', 'AEPS', 'DMT', 'CMS', 'UPI', 'BBPS', 'Aadhaar Pay'].map(f => (
                      <button
                        key={f}
                        onClick={() => { setRetailerTxFilter(f); setRetailerTxPage(1); }}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-colors ${
                          retailerTxFilter === f
                            ? 'bg-[#315bd1] text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {f === 'all' ? 'All' : f}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="hp-table">
                    <thead>
                      <tr>
                        <th>Txn ID</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Commission</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRetailerTx.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-slate-500 font-medium">No transactions found</td>
                        </tr>
                      ) : (
                        paginatedRetailerTx.map((tx) => (
                          <tr key={tx.id}>
                            <td className="font-mono text-xs font-bold text-slate-600">{tx.id}</td>
                            <td>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700">{tx.type}</span>
                            </td>
                            <td className="font-medium text-slate-700">{tx.description}</td>
                            <td className="font-bold text-slate-800">{tx.amount}</td>
                            <td className="font-bold text-emerald-600">{tx.commission}</td>
                            <td>
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${txStatusBadge[tx.status]}`}>{tx.status}</span>
                            </td>
                            <td className="text-slate-500">{tx.date}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Transaction Pagination */}
                <div className="border-t border-slate-100 px-4 py-3">
                  <Pagination
                    currentPage={retailerTxPage}
                    totalPages={retailerTxTotalPages}
                    onPageChange={setRetailerTxPage}
                    totalItems={filteredRetailerTx.length}
                    pageSize={RETAILER_TX_PAGE_SIZE}
                    compact
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Document Viewer Modal ── */}
      {viewingDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ animation: 'fadeIn 200ms ease-out' }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setViewingDoc(null)}
          />
          
          {/* Modal Container */}
          <div
            className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            style={{ animation: 'scaleIn 250ms cubic-bezier(0.22, 1, 0.36, 1)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-[#315bd1]/10 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-[#315bd1]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{viewingDoc.label}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Document No: <span className="font-mono font-bold">{viewingDoc.value}</span></p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Zoom controls */}
                <button
                  onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                  className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-xs font-bold text-slate-600 min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                  className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setRotation(r => (r + 90) % 360)}
                  className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
                  title="Rotate"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
                <div className="w-px h-6 bg-slate-200 mx-1"></div>
                <button
                  onClick={() => handleDownload(viewingDoc)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#315bd1] text-white hover:bg-[#2848a8] transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </button>
                <button
                  onClick={() => setViewingDoc(null)}
                  className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Image Area */}
            <div className="flex-1 overflow-auto bg-slate-900/5 p-6 flex items-center justify-center" style={{ minHeight: '400px' }}>
              <div
                className="transition-transform duration-300 ease-out"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center'
                }}
              >
                <img
                  src={viewingDoc.imageUrl}
                  alt={viewingDoc.label}
                  className="max-w-full max-h-[60vh] rounded-lg shadow-xl object-contain"
                  style={{ background: 'white' }}
                />
              </div>
            </div>

            {/* Footer with status */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {(() => {
                  const sc = getStatusConfig(viewingDoc.status);
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold ${sc.bg} ${sc.text} ring-1 ${sc.ring}`}>
                      {sc.icon}
                      {sc.label}
                    </span>
                  );
                })()}
                <span className="text-xs text-slate-400">
                  Uploaded: {new Date(viewingDoc.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {viewingDoc.status !== 'approved' && (
                  <button
                    onClick={() => { handleApprove(viewingDoc.id); setViewingDoc(prev => prev ? { ...prev, status: 'approved', rejectionReason: undefined } : null); }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-sm"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Approve
                  </button>
                )}
                {viewingDoc.status !== 'rejected' && (
                  <button
                    onClick={() => { setRejectingDoc(viewingDoc); setRejectionReason(''); setRejectionReasonError(''); }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-rose-500 text-white hover:bg-rose-600 transition-colors shadow-sm"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Rejection Reason Modal ── */}
      {rejectingDoc && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ animation: 'fadeIn 200ms ease-out' }}
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => { setRejectingDoc(null); setRejectionReason(''); setRejectionReasonError(''); }}
          />
          <div
            className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            style={{ animation: 'scaleIn 250ms cubic-bezier(0.22, 1, 0.36, 1)' }}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center">
                  <ShieldAlert className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Reject Document</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{rejectingDoc.label} – {rejectingDoc.value}</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 pb-2">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                ref={rejectionTextareaRef}
                value={rejectionReason}
                onChange={(e) => { setRejectionReason(e.target.value); setRejectionReasonError(''); }}
                placeholder="Please provide a detailed reason for rejecting this document (minimum 10 characters)..."
                rows={4}
                className={`w-full rounded-xl border ${rejectionReasonError ? 'border-rose-300 ring-2 ring-rose-500/20' : 'border-slate-200'} bg-slate-50/80 p-3.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#315bd1] focus:ring-2 focus:ring-[#315bd1]/20 transition-all resize-none`}
              />
              {rejectionReasonError && (
                <p className="mt-1.5 text-xs text-rose-500 font-medium">{rejectionReasonError}</p>
              )}

              {/* Quick rejection reasons */}
              <div className="mt-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Quick Select Reason</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Document is blurry or unclear',
                    'Name mismatch',
                    'Document expired',
                    'Invalid document format',
                    'Information not readable',
                  ].map((reason) => (
                    <button
                      key={reason}
                      onClick={() => { setRejectionReason(reason); setRejectionReasonError(''); }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                        rejectionReason === reason
                          ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 mt-2 flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => { setRejectingDoc(null); setRejectionReason(''); setRejectionReasonError(''); }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-500 text-white hover:bg-rose-600 transition-all shadow-sm hover:shadow-md flex items-center gap-1.5"
              >
                <XCircle className="h-3.5 w-3.5" />
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Inline keyframe styles ── */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
