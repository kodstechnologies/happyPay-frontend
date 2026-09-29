
import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Headphones,
  Mail,
  MessageCircle,
  Paperclip,
  Plus,
  Search,
  Send,
  X,
} from "lucide-react";

/* ============================================================
   TYPES
============================================================ */

type TicketStatus = "Resolved" | "In Progress";

type Ticket = {
  id: string;
  status: TicketStatus;
  title: string;
  category: string;
  preview: string;
  issue: string;
  response: string;
};

type FaqCategory =
  | "All"
  | "AEPS ATM"
  | "DMT Transfer"
  | "CMS Flow";

type FaqItem = {
  id: number;
  category: Exclude<FaqCategory, "All">;
  question: string;
  answer: string;
};

/* ============================================================
   SAMPLE TICKETS
============================================================ */

const tickets: Ticket[] = [
  {
    id: "HP-TIC-49210",
    status: "Resolved",
    title: "Cholamandalam Finance deposit acknowledgment",
    category: "CMS Cash Drop",
    preview:
      "Deposited ₹49,813 for vehicle finance. Receipt generated successfully.",
    issue:
      "Deposited ₹49,813 for vehicle finance. Receipt generated successfully.",
    response:
      "Transaction confirmed with Cholamandalam Finance pool ledger. Commission credited to wallet.",
  },
  {
    id: "HP-TIC-51829",
    status: "In Progress",
    title: "Withdrawal timeout - SBI customer account debited",
    category: "AEPS / Aadhaar ATM",
    preview:
      "Customer withdrawal of ₹2,500 timed out due to NPCI switch delay.",
    issue:
      "Customer withdrawal of ₹2,500 timed out due to NPCI switch delay.",
    response:
      "NPCI reconciliation switch is processing auto-reversal. Expected credit back to customer within 24-48 hours.",
  },
];

/* ============================================================
   FAQ DATA
============================================================ */

const faqItems: FaqItem[] = [
  {
    id: 1,
    category: "AEPS ATM",
    question:
      "Customer bank debited but HappyPay showed Failed / Timeout?",
    answer:
      "If the customer's bank account has been debited but the HappyPay transaction shows Failed or Timeout, the transaction may be under NPCI reconciliation. The amount is normally processed through the auto-reversal process. Check the transaction status before initiating another withdrawal.",
  },
  {
    id: 2,
    category: "AEPS ATM",
    question:
      "How does the mandatory Daily Retailer 2FA work?",
    answer:
      "Daily Retailer 2FA is required once per day for the registered retailer mobile number. After successful verification, access to sensitive financial services is enabled for that day.",
  },
  {
    id: 3,
    category: "DMT Transfer",
    question:
      "What is the CCF (Customer Convenience Fee) and retailer commission in DMT?",
    answer:
      "The Customer Convenience Fee is the applicable fee charged for a DMT transaction. The retailer commission is the commission credited to the retailer based on the applicable transaction slab.",
  },
  {
    id: 4,
    category: "DMT Transfer",
    question:
      'Beneficiary bank status shows "Pending" in DMT?',
    answer:
      "A Pending status means the beneficiary bank has not yet provided the final transaction status. Allow the transaction to complete reconciliation before retrying the transfer.",
  },
  {
    id: 5,
    category: "CMS Flow",
    question:
      "How do Cash Drop and Cash Collection work for EMI repayments?",
    answer:
      "Cash Collection is used to collect the repayment amount from the customer, while Cash Drop is used to deposit the collected amount against the applicable finance or EMI account.",
  },
  {
    id: 6,
    category: "CMS Flow",
    question:
      "How quickly is money settled to my primary bank account?",
    answer:
      "Settlement timing depends on the applicable settlement cycle and transaction processing status. Completed transactions are settled according to the retailer's configured settlement schedule.",
  },
  {
    id: 7,
    category: "AEPS ATM",
    question:
      "My biometric scanner (Mantra / Morpho) is not recognized?",
    answer:
      "Make sure the biometric device is properly connected and the required RD service is installed and running. Reconnect the device and restart the RD service before trying the transaction again.",
  },
];

/* ============================================================
   SUPPORT CHANNEL CARD
============================================================ */

const SupportChannelCard = ({
  icon,
  iconBackground,
  iconColor,
  badge,
  badgeBackground,
  badgeColor,
  title,
  value,
  onClick,
}: {
  icon: ReactNode;
  iconBackground: string;
  iconColor: string;
  badge: string;
  badgeBackground: string;
  badgeColor: string;
  title: string;
  value: string;
  onClick?: () => void;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full min-w-0 rounded-2xl border border-[#d4d6dc] bg-white p-5 text-left shadow-[0_1px_3px_rgba(23,32,51,0.03)] transition hover:border-[#7c3aed]/40 hover:shadow-[0_3px_10px_rgba(23,32,51,0.06)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{
            backgroundColor: iconBackground,
          }}
        >
          <span style={{ color: iconColor }}>
            {icon}
          </span>
        </div>

        <span
          className="rounded-lg px-3 py-1.5 text-xs font-bold"
          style={{
            backgroundColor: badgeBackground,
            color: badgeColor,
          }}
        >
          {badge}
        </span>
      </div>

      <h3 className="mt-5 text-base font-bold text-[#5d6677]">
        {title}
      </h3>

      <p className="mt-1 text-sm text-[#4e5562]">
        {value}
      </p>
    </button>
  );
};

/* ============================================================
   STATUS BADGE
============================================================ */

const StatusBadge = ({
  status,
}: {
  status: TicketStatus;
}) => {
  if (status === "Resolved") {
    return (
      <span className="inline-flex shrink-0 items-center rounded-lg bg-[#dff5ea] px-3 py-1.5 text-xs font-bold text-[#20a873]">
        Resolved
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0 items-center rounded-lg bg-[#fff0d9] px-3 py-1.5 text-xs font-bold text-[#e59a20]">
      In Progress
    </span>
  );
};

/* ============================================================
   TICKET CARD
============================================================ */

const TicketCard = ({
  ticket,
  onClick,
}: {
  ticket: Ticket;
  onClick: () => void;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-2xl border border-[#d4d6dc] bg-white p-5 text-left shadow-[0_1px_3px_rgba(23,32,51,0.03)] transition hover:border-[#7c3aed]/40 hover:shadow-[0_3px_10px_rgba(23,32,51,0.06)]"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-base font-bold tracking-wide text-[#7c3aed]">
              {ticket.id}
            </span>

            <StatusBadge status={ticket.status} />
          </div>

          <h3 className="mt-4 pr-2 text-base font-bold leading-6 text-[#172033]">
            {ticket.title}
          </h3>

          <p className="mt-1.5 line-clamp-1 text-sm leading-5 text-[#5d626d]">
            {ticket.category} • {ticket.preview}
          </p>
        </div>

        <ChevronRight className="mt-10 h-5 w-5 shrink-0 text-[#1f242c] transition group-hover:translate-x-0.5" />
      </div>
    </button>
  );
};

/* ============================================================
   FAQ CATEGORY BUTTON
============================================================ */

const FaqCategoryButton = ({
  label,
  active,
  onClick,
}: {
  label: FaqCategory;
  active: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl border px-5 text-sm font-semibold transition ${
        active
          ? "border-[#dbe4fb] bg-[#e4ebfc] text-[#7c3aed]"
          : "border-[#cfd1d6] bg-white text-[#353942] hover:border-[#7c3aed]/40"
      }`}
    >
      {active && (
        <span className="text-lg leading-none">
          ✓
        </span>
      )}

      {label}
    </button>
  );
};

/* ============================================================
   HELP & SUPPORT
============================================================ */

const HelpSupport = () => {
  const navigate = useNavigate();

  /* ==========================================================
     TICKET DETAIL MODAL
  ========================================================== */

  const [selectedTicket, setSelectedTicket] =
    useState<Ticket | null>(null);

  /* ==========================================================
     RAISE SUPPORT TICKET MODAL
  ========================================================== */

  const [showRaiseTicketModal, setShowRaiseTicketModal] =
    useState(false);

  const [issueCategory, setIssueCategory] =
    useState("AEPS / Aadhaar ATM");

  const [transactionReference, setTransactionReference] =
    useState("");

  const [ticketSubject, setTicketSubject] =
    useState("");

  const [ticketDescription, setTicketDescription] =
    useState("");

  const [ticketFile, setTicketFile] =
    useState<File | null>(null);

  /* ==========================================================
     FAQ
  ========================================================== */

  const [searchQuery, setSearchQuery] =
    useState("");

  const [selectedCategory, setSelectedCategory] =
    useState<FaqCategory>("All");

  const [expandedFaq, setExpandedFaq] =
    useState<number | null>(null);

  /* ==========================================================
     FILTER FAQ
  ========================================================== */

  const filteredFaqs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return faqItems.filter((faq) => {
      const matchesCategory =
        selectedCategory === "All" ||
        faq.category === selectedCategory;

      const matchesSearch =
        !query ||
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.category.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  /* ==========================================================
     CLOSE TICKET DETAIL
  ========================================================== */

  const closeTicket = () => {
    setSelectedTicket(null);
  };

  /* ==========================================================
     CLOSE RAISE TICKET MODAL
  ========================================================== */

  const closeRaiseTicketModal = () => {
    setShowRaiseTicketModal(false);
  };

  /* ==========================================================
     SUBMIT SUPPORT TICKET
  ========================================================== */

  const handleSubmitTicket = () => {
    /*
     * UI only for now.
     * Backend/API integration can be added later.
     */

    setShowRaiseTicketModal(false);

    setIssueCategory("AEPS / Aadhaar ATM");
    setTransactionReference("");
    setTicketSubject("");
    setTicketDescription("");
    setTicketFile(null);
  };

  return (
    <div>

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <header className="mx-auto mb-4 w-full max-w-5xl rounded-2xl border border-white/80 bg-white/90 px-3 py-2 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.4)] backdrop-blur-md">
        <div className="flex min-h-14 items-center justify-between">

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/retailer/profile")}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition hover:bg-[#f2f4f8]"
              aria-label="Back to Profile"
            >
              <ArrowLeft className="h-5 w-5 text-[#172033]" />
            </button>
            <h1 className="text-lg font-bold text-[#172033]">
              Help &amp; Support
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setShowRaiseTicketModal(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-[#f2f4f8]"
            aria-label="Create support ticket"
          >
            <div className="relative">
              <ClipboardList className="h-5 w-5 text-[#172033]" />
              <Plus className="absolute -right-1.5 -top-1.5 h-3 w-3 text-[#172033]" />
            </div>
          </button>

        </div>
      </header>

      <main className="px-4 pb-6 sm:px-6">
        <div className="mx-auto w-full max-w-5xl space-y-6">

          {/* ==================================================
              DIRECT SUPPORT CHANNELS
          ================================================== */}

          <section>

            <h2 className="text-base font-semibold text-[#172033]">
              Direct Support Channels
            </h2>

            <p className="mt-1 text-xs text-[#555b67]">
              Fast response through toll-free helpline,
              WhatsApp or email
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">

              {/* TOLL FREE */}

              <SupportChannelCard
                icon={
                  <Headphones className="h-5 w-5" />
                }
                iconBackground="#e8edfc"
                iconColor="#7c3aed"
                badge="Free 24x7"
                badgeBackground="#eef2fc"
                badgeColor="#7c3aed"
                title="Toll-Free Helpline"
                value="1800 266 8484"
              />

              {/* WHATSAPP */}

              <SupportChannelCard
                icon={
                  <MessageCircle className="h-5 w-5" />
                }
                iconBackground="#e5f7ee"
                iconColor="#20a873"
                badge="Instant"
                badgeBackground="#e8f7ef"
                badgeColor="#20a873"
                title="WhatsApp Care"
                value="+91 91234 56780"
              />

              {/* EMAIL */}

              <SupportChannelCard
                icon={
                  <Mail className="h-5 w-5" />
                }
                iconBackground="#f6e9fa"
                iconColor="#a43aab"
                badge="Resolution in 4h"
                badgeBackground="#f8eafa"
                badgeColor="#a43aab"
                title="Email Support"
                value="support@happypay.in"
              />

              {/* DISPUTE TICKET */}

              <SupportChannelCard
                icon={
                  <ClipboardList className="h-5 w-5" />
                }
                iconBackground="#fff4e4"
                iconColor="#e59a20"
                badge="Priority Desk"
                badgeBackground="#fff5e4"
                badgeColor="#e59a20"
                title="Dispute Ticket"
                value="Raise new issue"
                onClick={() =>
                  setShowRaiseTicketModal(true)
                }
              />

            </div>
          </section>

          {/* ==================================================
              MY TICKETS & DISPUTES
          ================================================== */}

          <section>

            <h2 className="text-base font-semibold text-[#172033]">
              My Tickets &amp; Disputes
            </h2>

            <p className="mt-1 text-xs text-[#555b67]">
              Track ongoing support requests
            </p>

            <div className="mt-5 space-y-4">

              {tickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onClick={() =>
                    setSelectedTicket(ticket)
                  }
                />
              ))}

            </div>
          </section>

          {/* ==================================================
              FREQUENTLY ASKED QUESTIONS
          ================================================== */}

          <section>

            <h2 className="text-base font-semibold text-[#172033]">
              Frequently Asked Questions
            </h2>

            <p className="mt-1 text-xs text-[#555b67]">
              Quick answers for AEPS, DMT, CMS and Settlements
            </p>

            {/* SEARCH */}

            <div className="relative mt-5">

              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8490a3]" />

              <input
                type="text"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                placeholder="Search queries, error codes or features..."
                className="h-11 w-full rounded-xl border border-[#d6d9df] bg-white pl-16 pr-5 text-base text-[#172033] outline-none placeholder:text-[#9aa3b2] focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/10"
              />

            </div>

            {/* CATEGORY FILTERS */}

            <div className="mt-5 flex gap-3 overflow-x-auto pb-1">

              <FaqCategoryButton
                label="All"
                active={selectedCategory === "All"}
                onClick={() => {
                  setSelectedCategory("All");
                  setExpandedFaq(null);
                }}
              />

              <FaqCategoryButton
                label="AEPS ATM"
                active={
                  selectedCategory === "AEPS ATM"
                }
                onClick={() => {
                  setSelectedCategory("AEPS ATM");
                  setExpandedFaq(null);
                }}
              />

              <FaqCategoryButton
                label="DMT Transfer"
                active={
                  selectedCategory === "DMT Transfer"
                }
                onClick={() => {
                  setSelectedCategory("DMT Transfer");
                  setExpandedFaq(null);
                }}
              />

              <FaqCategoryButton
                label="CMS Flow"
                active={
                  selectedCategory === "CMS Flow"
                }
                onClick={() => {
                  setSelectedCategory("CMS Flow");
                  setExpandedFaq(null);
                }}
              />

            </div>

            {/* FAQ LIST */}

            <div className="mt-5 space-y-4">

              {filteredFaqs.map((faq) => {

                const isExpanded =
                  expandedFaq === faq.id;

                return (
                  <div
                    key={faq.id}
                    className="overflow-hidden rounded-2xl border border-[#d1d3d8] bg-white"
                  >

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedFaq(
                          isExpanded
                            ? null
                            : faq.id,
                        )
                      }
                      className="flex min-h-[60px] w-full items-center justify-between gap-5 px-5 py-4 text-left sm:px-6"
                    >

                      <span className="text-sm font-semibold leading-5 text-[#172033]">
                        {faq.question}
                      </span>

                      <ChevronDown
                        className={`h-6 w-6 shrink-0 text-[#30343b] transition-transform ${
                          isExpanded
                            ? "rotate-180"
                            : ""
                        }`}
                      />

                    </button>

                    {isExpanded && (
                      <div className="border-t border-[#eef0f3] px-5 pb-5 pt-4 sm:px-6">
                        <p className="text-sm leading-6 text-[#5d6675]">
                          {faq.answer}
                        </p>
                      </div>
                    )}

                  </div>
                );
              })}

              {/* EMPTY FAQ */}

              {filteredFaqs.length === 0 && (
                <div className="rounded-2xl border border-[#d1d3d8] bg-white px-5 py-10 text-center">

                  <Search className="mx-auto h-8 w-8 text-[#98a1b1]" />

                  <p className="mt-3 text-base font-semibold text-[#172033]">
                    No matching questions found
                  </p>

                  <p className="mt-1 text-sm text-[#687286]">
                    Try another search query or select
                    a different category.
                  </p>

                </div>
              )}

            </div>

          </section>

        </div>
      </main>

      {/* ======================================================
          RAISE SUPPORT TICKET MODAL
      ====================================================== */}

      {showRaiseTicketModal && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 sm:p-4"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeRaiseTicketModal();
            }
          }}
        >

          <div
            className="w-full max-w-2xl overflow-hidden rounded-t-[30px] bg-white shadow-2xl sm:max-h-[calc(100vh-32px)] sm:rounded-[22px]"
            role="dialog"
            aria-modal="true"
            aria-label="Raise Support Ticket"
          >

            <div className="max-h-[90vh] overflow-y-auto px-5 pb-7 pt-7 sm:px-8 sm:pb-8">

              {/* HEADER */}

              <div className="flex items-start justify-between gap-4">

                <h2 className="text-2xl font-bold text-[#172033] sm:text-3xl">
                  Raise Support Ticket
                </h2>

                <button
                  type="button"
                  onClick={closeRaiseTicketModal}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#4f5662] transition hover:bg-slate-100"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>

              </div>

              <p className="mt-5 text-base leading-6 text-[#5d626d] sm:text-lg">
                Our priority helpdesk responds within
                2 working hours.
              </p>

              {/* ==================================================
                  ISSUE CATEGORY
              ================================================== */}

              <div className="mt-7">

                <label className="text-base font-bold text-[#667185] sm:text-lg">
                  Issue Category
                </label>

                <div className="relative mt-3">

                  <div className="pointer-events-none absolute left-5 top-1/2 z-10 -translate-y-1/2">
                    <ClipboardList className="h-7 w-7 text-[#8490a3]" />
                  </div>

                  <select
                    value={issueCategory}
                    onChange={(event) =>
                      setIssueCategory(
                        event.target.value,
                      )
                    }
                    className="h-[104px] w-full appearance-none rounded-2xl border border-[#d6d9df] bg-[#f8f9fb] px-16 pr-14 text-base font-bold text-[#172033] outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/10 sm:text-lg"
                  >
                    <option>
                      AEPS / Aadhaar ATM
                    </option>

                    <option>
                      DMT Transfer
                    </option>

                    <option>
                      CMS Flow
                    </option>

                    <option>
                      Wallet / Settlement
                    </option>

                    <option>
                      Other
                    </option>
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-6 top-1/2 h-6 w-6 -translate-y-1/2 text-[#687286]" />

                </div>
              </div>

              {/* ==================================================
                  TRANSACTION REFERENCE
              ================================================== */}

              <div className="mt-7">

                <label className="text-base font-bold text-[#667185] sm:text-lg">
                  Transaction Reference ID (Optional)
                </label>

                <div className="relative mt-3">

                  <ClipboardList className="pointer-events-none absolute left-6 top-1/2 h-7 w-7 -translate-y-1/2 text-[#8490a3]" />

                  <input
                    type="text"
                    value={transactionReference}
                    onChange={(event) =>
                      setTransactionReference(
                        event.target.value,
                      )
                    }
                    placeholder="e.g. HP-CMS-74829 or RRN number"
                    className="h-[100px] w-full rounded-2xl border border-[#d6d9df] bg-[#f8f9fb] px-16 text-base text-[#172033] outline-none placeholder:text-[#a4aab5] focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/10 sm:text-lg"
                  />

                </div>
              </div>

              {/* ==================================================
                  SUBJECT
              ================================================== */}

              <div className="mt-7">

                <label className="text-base font-bold text-[#667185] sm:text-lg">
                  Subject
                </label>

                <div className="relative mt-3">

                  <ClipboardList className="pointer-events-none absolute left-6 top-1/2 h-7 w-7 -translate-y-1/2 text-[#8490a3]" />

                  <input
                    type="text"
                    value={ticketSubject}
                    onChange={(event) =>
                      setTicketSubject(
                        event.target.value,
                      )
                    }
                    placeholder="Brief summary of the issue"
                    className="h-[100px] w-full rounded-2xl border border-[#d6d9df] bg-[#f8f9fb] px-16 text-base text-[#172033] outline-none placeholder:text-[#a4aab5] focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/10 sm:text-lg"
                  />

                </div>
              </div>

              {/* ==================================================
                  DETAILED DESCRIPTION
              ================================================== */}

              <div className="mt-7">

                <label className="text-base font-bold text-[#667185] sm:text-lg">
                  Detailed Description
                </label>

                <textarea
                  value={ticketDescription}
                  onChange={(event) =>
                    setTicketDescription(
                      event.target.value,
                    )
                  }
                  placeholder="Describe what occurred, customer details, or error message shown..."
                  rows={5}
                  className="mt-3 w-full resize-none rounded-2xl border border-[#d6d9df] bg-[#f8f9fb] px-8 py-6 text-base leading-7 text-[#172033] outline-none placeholder:text-[#a4aab5] focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/10 sm:text-lg"
                />

              </div>

              {/* ==================================================
                  ATTACHMENT
              ================================================== */}

              <label className="mt-6 flex min-h-[72px] cursor-pointer items-center gap-4 rounded-2xl border-2 border-[#d0d2d6] bg-white px-6 transition hover:border-[#7c3aed]">

                <Paperclip className="h-7 w-7 shrink-0 text-[#505762]" />

                <span className="min-w-0 flex-1 truncate text-base text-[#4f535c] sm:text-lg">
                  {ticketFile
                    ? ticketFile.name
                    : "Attach receipt screenshot or error photo (Optional)"}
                </span>

                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(event) => {
                    const file =
                      event.target.files?.[0] ??
                      null;

                    setTicketFile(file);
                  }}
                />

              </label>

              {/* ==================================================
                  SUBMIT
              ================================================== */}

              <button
                type="button"
                onClick={handleSubmitTicket}
                className="mt-7 flex h-[80px] w-full items-center justify-center gap-4 rounded-2xl bg-[#7c3aed] text-lg font-bold text-white shadow-[0_5px_12px_rgba(49,91,209,0.25)] transition hover:bg-[#6d28d9] sm:h-[88px] sm:text-xl"
              >
                <Send className="h-7 w-7 fill-current" />

                Submit Ticket
              </button>

            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          TICKET DETAIL MODAL
          CENTERED MODAL — NOT BOTTOM SHEET
      ====================================================== */}

      {selectedTicket && (
        <div
          className="fixed inset-0 z-[50] flex items-center justify-center bg-slate-900/55 p-4 sm:p-6"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeTicket();
            }
          }}
        >

          <div
            className="w-full max-w-[680px] overflow-hidden rounded-[22px] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.25)]"
            role="dialog"
            aria-modal="true"
            aria-label="Ticket details"
          >

            <div className="max-h-[70vh] overflow-y-auto px-6 py-6 sm:px-8 sm:py-7">

              {/* ==================================================
                  TICKET HEADER
              ================================================== */}

              <div className="flex items-start justify-between gap-5">

                <h2 className="text-2xl font-bold leading-tight text-[#7c3aed] sm:text-3xl">
                  {selectedTicket.id}
                </h2>

                <StatusBadge
                  status={selectedTicket.status}
                />

              </div>

              {/* ==================================================
                  TITLE
              ================================================== */}

              <h3 className="mt-5 text-xl font-bold leading-7 text-[#172033] sm:text-2xl sm:leading-8">
                {selectedTicket.title}
              </h3>

              {/* ==================================================
                  CATEGORY
              ================================================== */}

              <p className="mt-2 text-sm text-[#667185] sm:text-base">
                Category: {selectedTicket.category}
              </p>

              {/* ==================================================
                  DIVIDER
              ================================================== */}

              <div className="my-7 border-t border-[#e4e6eb]" />

              {/* ==================================================
                  YOUR QUERY
              ================================================== */}

              <h4 className="text-lg font-bold text-[#687286]">
                Your Query / Issue
              </h4>

              <div className="mt-5 rounded-[20px] bg-[#f3f2fa] px-6 py-6 sm:px-7 sm:py-7">

                <p className="text-sm leading-6 text-[#687286] sm:text-base">
                  {selectedTicket.issue}
                </p>

              </div>

              {/* ==================================================
                  SUPPORT RESPONSE
              ================================================== */}

              <h4 className="mt-6 text-lg font-bold text-[#20a873]">
                Support Team Response
              </h4>

              <div className="mt-5 rounded-[20px] border border-[#b9e8d4] bg-[#eefbf5] px-6 py-6 sm:px-7 sm:py-7">

                <p className="text-sm leading-6 text-[#172033] sm:text-base">
                  {selectedTicket.response}
                </p>

              </div>

              {/* ==================================================
                  CLOSE
              ================================================== */}

              <button
                type="button"
                onClick={closeTicket}
                className="mt-7 flex h-[58px] w-full items-center justify-center rounded-[18px] border-2 border-[#c9d2e8] bg-white text-lg font-bold text-[#7c3aed] transition hover:bg-[#f5f7fc] sm:text-xl"
              >
                Close
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HelpSupport;

