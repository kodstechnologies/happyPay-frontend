import type { AdminRetailer } from "../../../types/admin/retailer";

const dummyNames = [
  "Rahul Sharma", "Priya Patel", "Amit Singh", "Neha Gupta", "Vikram Reddy",
  "Anjali Desai", "Suresh Kumar", "Pooja Verma", "Ravi Raj", "Sneha Joshi"
];

export let DUMMY_RETAILERS: AdminRetailer[] = dummyNames.map((name, i) => ({
  id: `RET${String(i + 1).padStart(4, '0')}`,
  fullName: name,
  email: `${name.split(' ')[0].toLowerCase()}${i + 1}@example.com`,
  mobile: `987654321${i}`,
  panCard: `ABCDE1234${String.fromCharCode(65 + i)}`,
  kycStatus: i < 2 ? "approved" : (i % 2 === 0 ? "approved" : "pending"),
  status: i < 2 ? "approved" : (i % 3 === 0 ? "pending" : "approved"),
  role: i < 2 ? "distributor" : "retailer",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  aadhaarVerified: true,
  shop: {
    name: `${name.split(' ')[0]}'s Shop`,
    address: {
      addressLine: "123 Main St",
      city: "Mumbai",
      state: "Maharashtra"
    }
  }
})) as AdminRetailer[];

export const updateDummyRetailerStatus = (id: string, newStatus: AdminRetailer['status']) => {
  DUMMY_RETAILERS = DUMMY_RETAILERS.map((item) => 
    item.id === id ? { ...item, status: newStatus } as AdminRetailer : item
  );
};

// ── Sub-retailers under a distributor ──
export interface SubRetailer {
  id: string;
  name: string;
  aadhar: string;
  email: string;
  mobile: string;
  pan: string;
  status: 'active' | 'pending' | 'blocked';
  kycStatus: 'approved' | 'pending' | 'rejected';
  shopName: string;
  shopAddress: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  createdAt: string;
  totalTransactions: number;
  totalVolume: string;
}

const subNames = [
  "Ashok Kumar", "Sunita Devi", "Manoj Tiwari", "Kavita Rani", "Deepak Yadav",
  "Rekha Singh", "Rajesh Mishra", "Suman Gupta", "Arun Prasad", "Geeta Kumari",
  "Vijay Chauhan", "Meena Agarwal", "Pankaj Dubey", "Nirmala Jha", "Sandeep Soni",
  "Lakshmi Iyer", "Ramesh Pandey", "Shobha Das", "Naveen Reddy", "Anita Bose",
  "Harish Patil", "Preeti Sharma", "Gopal Nair", "Madhuri Saxena", "Rakesh Jain"
];

const banks = ["State Bank of India", "HDFC Bank", "ICICI Bank", "Punjab National Bank", "Bank of Baroda", "Axis Bank", "Canara Bank"];
const cities = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Jaipur", "Lucknow", "Ahmedabad"];

export const DUMMY_SUB_RETAILERS: SubRetailer[] = subNames.map((name, i) => ({
  id: `SRET${String(i + 1).padStart(4, '0')}`,
  name,
  aadhar: `${1000 + i * 111}-${2000 + i * 222}-${3000 + i * 333}`,
  email: `${name.split(' ')[0].toLowerCase()}${i + 1}@example.com`,
  mobile: `90000${String(i + 11111).padStart(5, '0')}`,
  pan: `${String.fromCharCode(65 + (i % 26))}BCDE${1000 + i}${String.fromCharCode(70 + (i % 5))}`,
  status: i % 5 === 0 ? 'pending' : i % 7 === 0 ? 'blocked' : 'active',
  kycStatus: i % 4 === 0 ? 'pending' : i % 6 === 0 ? 'rejected' : 'approved',
  shopName: `${name.split(' ')[0]}'s ${['Mobile Shop', 'Digital Store', 'Electronics Hub', 'Recharge Center', 'Pay Point'][i % 5]}`,
  shopAddress: `${100 + i} ${['MG Road', 'Station Road', 'Market Street', 'Ring Road', 'Civil Lines'][i % 5]}, ${cities[i % cities.length]}`,
  bankName: banks[i % banks.length],
  accountNumber: `XXXXXXXX${String(1000 + i * 7).slice(-4)}`,
  ifsc: `${['SBIN', 'HDFC', 'ICIC', 'PUNB', 'BARB', 'UTIB', 'CNRB'][i % 7]}000${1000 + i}`,
  createdAt: `2026-0${Math.min(9, Math.floor(i / 3) + 1)}-${String(10 + (i % 20)).padStart(2, '0')}`,
  totalTransactions: Math.floor(Math.random() * 500) + 10,
  totalVolume: `₹${(Math.floor(Math.random() * 500) + 50).toLocaleString('en-IN')},000`,
}));

// Dummy transactions for sub-retailers
export interface SubRetailerTransaction {
  id: string;
  type: 'AEPS' | 'DMT' | 'CMS' | 'UPI' | 'BBPS' | 'Aadhaar Pay';
  amount: string;
  commission: string;
  status: 'success' | 'failed' | 'pending';
  referenceNo: string;
  date: string;
  description: string;
}

export const generateTransactions = (retailerId: string): SubRetailerTransaction[] => {
  const types: SubRetailerTransaction['type'][] = ['AEPS', 'DMT', 'CMS', 'UPI', 'BBPS', 'Aadhaar Pay'];
  const statuses: SubRetailerTransaction['status'][] = ['success', 'success', 'success', 'failed', 'pending'];
  const descriptions: Record<SubRetailerTransaction['type'], string[]> = {
    'AEPS': ['Cash Withdrawal', 'Balance Inquiry', 'Mini Statement', 'Cash Deposit'],
    'DMT': ['Fund Transfer', 'NEFT Transfer', 'IMPS Transfer'],
    'CMS': ['Cash Drop - Zomato', 'Cash Drop - Swiggy', 'Cash Collection - Flipkart'],
    'UPI': ['QR Payment', 'UPI Collect', 'UPI Cash Point'],
    'BBPS': ['Electricity Bill', 'Mobile Recharge', 'DTH Recharge', 'Gas Bill', 'Water Bill'],
    'Aadhaar Pay': ['Aadhaar Payment'],
  };

  const hash = retailerId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const count = 15 + (hash % 30);
  
  return Array.from({ length: count }, (_, i) => {
    const type = types[(i + hash) % types.length];
    const amount = (500 + ((i * hash * 7) % 9500));
    const commission = Math.floor(amount * 0.003 * 100) / 100;
    return {
      id: `TXN${retailerId.replace('SRET', '')}${String(i + 1).padStart(4, '0')}`,
      type,
      amount: `₹${amount.toLocaleString('en-IN')}`,
      commission: `₹${commission.toFixed(2)}`,
      status: statuses[(i + hash) % statuses.length],
      referenceNo: `REF${Date.now().toString(36).toUpperCase()}${String(i).padStart(3, '0')}`,
      date: `2026-09-${String(Math.max(1, 28 - (i % 28))).padStart(2, '0')}`,
      description: descriptions[type][(i + hash) % descriptions[type].length],
    };
  });
};
