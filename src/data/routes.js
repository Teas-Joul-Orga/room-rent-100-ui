// import { path } from "framer-motion/client";

const sidebarMap = {
  Dashboard: {
    Overview: { path: "/dashboard", index: true },
    "List Pending": { path: "/dashboard/listpending" },
    "Monthly Income Chart": { path: "/dashboard/monthlyincome" },
  },

  Tenants: {
    "All Tenants": { path: "/dashboard/tenants", index: true },
    Active: { path: "/dashboard/tenants/activetenant" },
    Pending: { path: "/dashboard/tenants/pendingtenant" },
    "Add New Tenant": { path: "/dashboard/tenants/addtenant" },
    // "Edit Tenant": { path: "/dashboard/tenants/edit/:id" },
  },

  Furniture: {
    Furniture: { path: "/dashboard/furniture", index: true },
    "Add New Furniture Type": { path: "/dashboard/furniture/addnewfurniture" },
  },

  Rooms: {
    "All Rooms": { path: "/dashboard/rooms", index: true },
    Available: { path: "/dashboard/rooms/available" },
    Occupied: { path: "/dashboard/rooms/occupied" },
    Maintenance: { path: "/dashboard/rooms/maintenance" },
    "Add New Room": { path: "/dashboard/rooms/add" },
  },

  Lease: {
    "All Lease": { path: "/dashboard/lease", index: true },
    "Create New Lease": { path: "/dashboard/lease/createnewlease" },
    "Active Leases": { path: "/dashboard/lease/active" },
    "Expired Leases": { path: "/dashboard/lease/expired" },
  },

  "Utility bills & Payment": {
    "All Payment": { path: "/dashboard/utility", index: true },
    "Add Payment": { path: "/dashboard/utility/addpayment" },
    "Payment History": { path: "/dashboard/utility/paymenthistory" },
  },

  Report: {
    Report: { path: "/dashboard/report", index: true },
  },

  Chat: {
    Messages: { path: "/dashboard/chat", index: true },
  },

  Notifications: {
    "All Notifications": { path: "/dashboard/notifications", index: true },
  },

  Recyclebin: {
    "All Recycle bin": { path: "/dashboard/recyclebin", index: true },
    "Recently Deleted": { path: "/dashboard/recyclebin/recentlydeleted" },
  },
};

export default sidebarMap;
