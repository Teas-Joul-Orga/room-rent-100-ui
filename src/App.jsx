import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Box } from '@chakra-ui/react';
import DashboardLayout from './layouts/DashboardLayout';
import ReloadPrompt from './components/ReloadPrompt';

// Admin Pages
import AdminDashboard from "./page/admin/Dashboard";
import AdminOverview from "./page/admin/Overview";
import AdminListPending from "./page/admin/ListPending";
import AdminMonthlyIncomeChart from "./page/admin/MonthlyIncomeChart";
import AdminAnnouncements from "./page/announcements/AdminAnnouncements";
import AdminChat from "./page/admin/AdminChat";
import AdminUtility from "./page/utility/Utility";
import AdminAddBill from "./page/utility/AddBill";
import AdminRecordPayment from "./page/utility/RecordPayment";
import AdminPaymentHistory from "./page/utility/PaymentHistory";
import AdminAllTenants from "./page/admin/AllTenants";
import AdminActiveTenant from "./page/admin/ActiveTenant";
import AdminPendingTenant from "./page/admin/PendingTenant";
import AdminAddNewTenant from "./page/admin/AddNewTenant";
import AdminViewTenant from "./page/admin/ViewTenant";
import AdminCreateAccount from "./page/admin/CreateAccount";
import AdminExpense from "./page/admin/Expense";

// Tenant Pages
import TenantDashboard from "./page/tenant/Dashboard";
import TenantLease from "./page/tenant/Lease";
import TenantLeaseHistory from "./page/tenant/LeaseHistory";
import TenantLeaseDetail from "./page/tenant/LeaseDetail";
import TenantUtility from "./page/tenant/Utility";
import TenantAnnouncements from "./page/tenant/Announcements";
import TenantChat from "./page/tenant/Chat";

// Shared/Common
import AllRoom from "./page/room/AllRoom";
import AvailableRoom from "./page/room/AvailableRoom";
import OccupiedRoom from "./page/room/OccupiedRoom";
import MaintenanceRoom from "./page/room/MaintenanceRoom";
import AddNewRoom from "./page/room/AddNewRoom";
import EditRoom from "./page/room/EditRoom";
import ViewRoom from "./page/room/ViewRoom";

import NewLease from "./page/lease/NewLease";
import ActiveLease from "./page/lease/ActiveLease";
import ExpiredLease from "./page/lease/ExpiredLease";
import CreateNewLease from "./page/lease/CreateNewLease";
import Leases from "./page/lease/Lease";
import ViewLease from "./page/lease/ViewLease";

import Notification from "./page/notification/Notification";
import Report from "./page/report/Report";
import AllRecyclebin from "./page/recycleben/AllRecyclebin";
import Settings from "./page/settings/Settings";
import AllUsers from "./page/user/AllUsers";
import Profile from "./page/user/Profile";
import Payment from "./page/payment/Payment";
import Furniture from "./page/furniture/Furniture";
import AddNewFurniture from "./page/furniture/AddNewFurniture";
import RoomFurniture from "./page/furniture/RoomFurniture";
import ViewFurniture from "./page/furniture/ViewFurniture";

import Login from "./Login";
import ProtectedRoute from "./protectedroute";

// Wrapper to dynamically pick the right dashboard/page based on role
function DashboardIndex() {
  const role = localStorage.getItem('role')?.toLowerCase();
  return role === 'tenant' ? <TenantDashboard /> : <AdminDashboard />;
}

function ChatPage() {
  const role = localStorage.getItem('role')?.toLowerCase();
  return role === 'tenant' ? <TenantChat /> : <AdminChat />;
}

function AnnouncementPage() {
  const role = localStorage.getItem('role')?.toLowerCase();
  return role === 'tenant' ? <TenantAnnouncements /> : <AdminAnnouncements />;
}

function UtilityPage() {
  const role = localStorage.getItem('role')?.toLowerCase();
  return role === 'tenant' ? <TenantUtility /> : <AdminUtility />;
}

function App() {
  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <ReloadPrompt />
      <BrowserRouter>
        <Routes>
          {/* login page public */}
          <Route path="/login" element={<Login />} />
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Dashboard Area */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardIndex />} />
            <Route path="listpending" element={<AdminListPending />} />
            <Route path="monthlyincome" element={<AdminMonthlyIncomeChart />} />

            {/* Admin-only Management: Tenants */}
            <Route path="tenants">
              <Route index element={<AdminAllTenants />} />
              <Route path="activetenant" element={<AdminActiveTenant />} />
              <Route path="pendingtenant" element={<AdminPendingTenant />} />
              <Route path="addtenant" element={<AdminAddNewTenant />} />
              <Route path="edit/:id" element={<AdminAddNewTenant />} />
              <Route path="view/:id" element={<AdminViewTenant />} />
              <Route path="createaccount/:id" element={<AdminCreateAccount />} />
            </Route>

            {/* Users */}
            <Route path="users">
              <Route index element={<AllUsers />} />
            </Route>
            <Route path="profile" element={<Profile />} />

            {/* Furniture  */}
            <Route path="furniture">
              <Route index element={<Furniture />} />
              <Route path="addnewfurniture" element={<AddNewFurniture key="add" />} />
              <Route path="edit/:id" element={<AddNewFurniture key="edit" />} />
              <Route path="viewfurniture/:id" element={<ViewFurniture />} />
              <Route path="room/:room" element={<RoomFurniture />} />
            </Route>

            {/* Rooms */}
            <Route path="rooms">
              <Route index element={<AllRoom />} />
              <Route path="available" element={<AvailableRoom />} />
              <Route path="occupied" element={<OccupiedRoom />} />
              <Route path="add" element={<AddNewRoom />} />
              <Route path="viewroom/:id" element={<ViewRoom />} />
              <Route path="edit/:id" element={<EditRoom />} />
            </Route>

            {/* Lease */}
            <Route path="lease">
              <Route index element={<Leases />} />
              <Route path="new" element={<NewLease />} />
              <Route path="createnewlease" element={<CreateNewLease />} />
              <Route path="active" element={<ActiveLease />} />
              <Route path="expired" element={<ExpiredLease />} />
              <Route path="edit/:id" element={<CreateNewLease />} />
              <Route path="renew/:id" element={<CreateNewLease />} />
              <Route path="view/:id" element={<ViewLease />} />
              <Route path="my-lease" element={<TenantLease />} />
              <Route path="history" element={<TenantLeaseHistory />} />
              <Route path="history/:id" element={<TenantLeaseDetail />} />
            </Route>

            {/* Separated Hybrid Pages */}
            <Route path="chat" element={<ChatPage />} />
            <Route path="announcements" element={<AnnouncementPage />} />
            <Route path="utility">
              <Route index element={<UtilityPage />} />
              <Route path="addbill" element={<AdminAddBill />} />
              <Route path="recordpayment" element={<AdminRecordPayment />} />
              <Route path="paymenthistory" element={<AdminPaymentHistory />} />
            </Route>

            {/* Common Pages */}
            <Route path="maintenance" element={<MaintenanceRoom />} />
            <Route path="notifications" element={
              <Box p={4} display="flex" justifyContent="center">
                <Box w="full" maxW="600px" shadow="sm" border="1px" borderColor="gray.100" rounded="xl" bg="white" _dark={{ bg: "gray.800", borderColor: "gray.700" }}>
                  <Notification />
                </Box>
              </Box>
            } />
            <Route path="report" element={<Report />} />
            <Route path="settings" element={<Settings />} />
            <Route path="recyclebin" element={<AllRecyclebin />} />
            <Route path="expenses" element={<AdminExpense />} />
            <Route path="payments" element={<Payment />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
