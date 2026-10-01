import { Navigate, type RouteObject } from "react-router-dom";
import ProtectedRoutes from "../components/auth/ProtectedRoutes";
import AppLayout from "../layout/full/AppLayout";
import BlankLayout from "../layout/blank/BlankLayout";
import RetailerLogin from "../pages/retailer/auth/RetailerLogin";
import RetailerRegister from "../pages/retailer/auth/Register";
import Dashboard from "../pages/Dasboard/Dashboard";
import RetailerKycPending from "../pages/retailer/auth/RetailerKYCPending";
import RetailerKycApproved from "../pages/retailer/auth/RetailerKYCApproved";

import Aeps from "../pages/retailer/aeps/Aeps";
import AadhaarPay from "../pages/retailer/aadhaar-pay/AadhaarPay";
import Dmt from "../pages/retailer/dmt/Dmt";
import Cms from "../pages/retailer/cms/Cms";
import UpiCashPoint from "../pages/retailer/upi-cash-point/UpiCashPoint";
import BBPS from "../pages/retailer/bbps/Bbps";
import DistributorDashboard from "../pages/distributor/DistributorDashboard";
import SettlementToBank from "../pages/retailer/settlement/SettlementToBank";
import SettlementToRetailer from "../pages/retailer/settlement/SettlementToRetailer";
import SettlementToDistributor from "../pages/retailer/settlement/SettlementToDistributor";

// TRANSACTIONS
import Transactions from "../pages/history/Transactions"

// PROFILE
import Profile from "../pages/retailer/profile/Profile";
import ShopInformation from "../pages/retailer/profile/ShopInformation";
import BankDetails from "../pages/retailer/profile/BankDetails";
import Settlements from "../pages/retailer/profile/Settlements";
import SecuritySettings from "../pages/retailer/profile/SecuritySettings";
import HelpSupport from "../pages/retailer/profile/HelpSupport";
import Wallet from "../pages/retailer/wallet/Wallet";
import AdminLogin from "../pages/admin/auth/AdminLogin";
import ForgotPassword from "../pages/admin/auth/ForgotPassword";
import ResetPassword from "../pages/admin/auth/ResetPassword";
import AdminProtectedRoute from "../components/admin/AdminProtectedRoute";
import AdminLayout from "../layout/full/AdminLayout";
import AdminDashboard from "../pages/admin/dashboard/AdminDashboard";
import AdminProfile from "../pages/admin/profile/AdminProfile";
import AdminSupport from "../pages/admin/support/AdminSupport";
import AdminRetailers from "../pages/admin/retailers/AdminRetailers";
import AdminRetailerDetails from "../pages/admin/retailers/AdminRetailerDetails";
import AdminAuditLogs from "../pages/admin/audit/AdminAuditLogs";
import AdminTransactions from "../pages/admin/transactions/AdminTransactions";
import AdminCustomers from "../pages/admin/customers/AdminCustomers";
import AdminCommissions from "../pages/admin/commissions/AdminCommissions";
import AdminCmsConfig from "../pages/admin/cms/AdminCmsConfig";
import AdminNotifications from "../pages/admin/notifications/AdminNotifications";
import AdminBanners from "../pages/admin/banners/AdminBanners";

import Fingerprint from "../pages/dev/fingerPrint";

const Router: RouteObject[] = [
  // ADMIN AUTH
  {
    path: "/admin/login",
    element: <BlankLayout />,
    children: [
      {
        index: true,
        element: <AdminLogin />,
      },
    
    ],
  },
  {
    path: "/finger-print",
    element: <Fingerprint />,
  },
  {
    path: "/admin/forgot-password",
    element: <BlankLayout />,
    children: [{ index: true, element: <ForgotPassword /> }],
  },

  {
    path: "/admin/reset-password",
    element: <BlankLayout />,
    children: [{ index: true, element: <ResetPassword /> }],
  },

  // ADMIN DASHBOARD
  {
    path: "/admin",
    element: <AdminProtectedRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: "dashboard", element: <AdminDashboard /> },
          { path: "retailers", element: <AdminRetailers /> },
          { path: "retailers/:id", element: <AdminRetailerDetails /> },
          { path: "transactions", element: <AdminTransactions /> },
          { path: "customers", element: <AdminCustomers /> },
          { path: "commissions", element: <AdminCommissions /> },
          { path: "banners", element: <AdminBanners /> },
          { path: "cms", element: <AdminCmsConfig /> },
          { path: "profile", element: <AdminProfile /> },
          { path: "support", element: <AdminSupport /> },
          { path: "audit-logs", element: <AdminAuditLogs /> },
          { path: "notifications", element: <AdminNotifications /> },
        ],
      },
    ],
  },

  // RETAILER
  {
    path: "/retailer",
    element: <ProtectedRoutes />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <Dashboard />,
          },

          // AEPS
          {
            path: "aeps",
            element: <Aeps />,
          },

          // AADHAAR PAY
          {
            path: "aadhaar-pay",
            element: <AadhaarPay />,
          },

          // DMT
          {
            path: "dmt",
            element: <Dmt />,
          },

          // CMS
          {
            path: "cms",
            element: <Cms />,
          },

          // UPI CASH POINT
          {
            path: "upi-cash-point",
            element: <UpiCashPoint />,
          },
          {
            path: "bbps",
            element: <BBPS />,
          },


          // SETTLEMENT SUB-ROUTES
          {
            path: "settlement/bank",
            element: <SettlementToBank />,
          },
          {
            path: "settlement/retailer",
            element: <SettlementToRetailer />,
          },
          {
            path: "settlement/distributor",
            element: <SettlementToDistributor />,
          },

          // TRANSACTIONS
          {
            path: "transactions",
            element: <Transactions />,
          },

          {
            path: "wallet",
            element: <Wallet />,
          },

          {
            path: "distributor",
            element: <DistributorDashboard />,
          },

          // PROFILE
          {
            path: "profile",
            element: <Profile />,
          },

          // SHOP INFORMATION
          {
            path: "profile/shop",
            element: <ShopInformation />,
          },

          // BANK DETAILS
          {
            path: "profile/bank",
            element: <BankDetails />,
          },

          // SETTLEMENTS
          {
            path: "profile/settlements",
            element: <Settlements />,
          },

          // SECURITY SETTINGS
          {
            path: "profile/security",
            element: <SecuritySettings />,
          },

          // HELP & SUPPORT
          {
            path: "profile/support",
            element: <HelpSupport />,
          },
        ],
      },
    ],
  },

  // ROOT — redirect to retailer login
  {
    path: "/",
    element: <BlankLayout />,
    children: [
      {
        index: true,
        element: <RetailerLogin />,
      },
    ],
  },

  // RETAILER LOGIN
  {
    path: "/retailer/login",
    element: <BlankLayout />,
    children: [
      {
        index: true,
        element: <RetailerLogin />,
      },
    ],
  },

  // RETAILER REGISTER
  {
    path: "/retailer/register",
    element: <BlankLayout />,
    children: [
      {
        index: true,
        element: <RetailerRegister />,
      },
    ],
  },

  // KYC PENDING
  {
    path: "/retailer/kyc-pending",
    element: <BlankLayout />,
    children: [
      {
        index: true,
        element: <RetailerKycPending />,
      },
    ],
  },

  // KYC APPROVED
  {
    path: "/retailer/kyc-approved",
    element: <BlankLayout />,
    children: [
      {
        index: true,
        element: <RetailerKycApproved />,
      },
    ],
  },

];

export default Router;