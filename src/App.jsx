import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Box } from '@chakra-ui/react';
import DashboardLayout from './layouts/DashboardLayout';
import ReloadPrompt from './components/ReloadPrompt';

// Admin Pages
import AdminDashboard from "./page/Admin/Dashboard";
import AdminOverview from "./page/Admin/Overview";
import AdminListPending from "./page/Admin/ListPending";
import AdminMonthlyIncomeChart from "./page/Admin/MonthlyIncomeChart";
import AdminAnnouncements from "./page/announcements/AdminAnnouncements";
import AdminChat from "./page/Admin/AdminChat";
import AdminUtility from "./page/utility/Utility";
import AdminAddBill from "./page/utility/AddBill";
import AdminRecordPayment from "./page/utility/RecordPayment";
import AdminPaymentHistory from "./page/utility/PaymentHistory";
import AdminAllTenants from "./page/Admin/AllTenants";
import AdminActiveTenant from "./page/Admin/ActiveTenant";
import AdminPendingTenant from "./page/Admin/PendingTenant";
import AdminAddNewTenant from "./page/Admin/AddNewTenant";
import AdminViewTenant from "./page/Admin/ViewTenant";
import AdminCreateAccount from "./page/Admin/CreateAccount";
import AdminExpense from "./page/Admin/Expense";
import AdminBookingManagement from "./page/Admin/BookingManagement";
import TenantRegistrationForm from "./page/Admin/TenantRegistrationForm";

// Tenant Pages
import TenantDashboard from "./page/tenant/Dashboard";
import TenantLease from "./page/tenant/Lease";
import TenantLeaseHistory from "./page/tenant/LeaseHistory";
import TenantLeaseDetail from "./page/tenant/LeaseDetail";
import TenantUtility from "./page/tenant/Utility";
import TenantAnnouncements from "./page/tenant/Announcements";
import TenantChat from "./page/tenant/Chat";
import AvailableRooms from "./page/tenant/AvailableRooms";
import AvailableRoomDetail from "./page/tenant/AvailableRoomDetail";
import MyBookings from "./page/tenant/MyBookings";
// Shared/Common
import AllRoom from "./page/room/AllRoom";
import AvailableRoom from "./page/room/AvailableRoom";
import OccupiedRoom from "./page/room/OccupiedRoom";
import MaintenanceRoom from "./page/room/MaintenanceRoom";
import AddNewRoom from "./page/room/AddNewRoom";
import BulkCreateRooms from "./page/room/BulkCreateRooms";
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
import Bills from "./page/utility/Bills";

import Landing from "./page/Landing";
import PublicAnnouncements from "./page/PublicAnnouncements";
import Login from "./Login";
import Signup from "./Signup";
import ProtectedRoute from "./ProtectedRoute";
import NotFound from "./page/NotFound";

// Wrapper to dynamically pick the right dashboard/page based on role
function DashboardIndex() {
  const role = (localStorage.getItem('role') || sessionStorage.getItem('role'))?.toLowerCase();
  return role === 'tenant' ? <TenantDashboard /> : <AdminDashboard />;
}

function ChatPage() {
  const role = (localStorage.getItem('role') || sessionStorage.getItem('role'))?.toLowerCase();
  return role === 'tenant' ? <TenantChat /> : <AdminChat />;
}

function AnnouncementPage() {
  const role = (localStorage.getItem('role') || sessionStorage.getItem('role'))?.toLowerCase();
  return role === 'tenant' ? <TenantAnnouncements /> : <AdminAnnouncements />;
}

function UtilityPage() {
  const role = (localStorage.getItem('role') || sessionStorage.getItem('role'))?.toLowerCase();
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
          <Route path="/signup" element={<Signup />} />
          {/* Public Landing Pages */}
          <Route path="/" element={<Landing />} />
          <Route path="/announcements" element={<PublicAnnouncements />} />

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
              <Route index element={<ProtectedRoute allowedRoles={['admin']}><AdminAllTenants /></ProtectedRoute>} />
              <Route path="activetenant" element={<ProtectedRoute allowedRoles={['admin']}><AdminActiveTenant /></ProtectedRoute>} />
              <Route path="pendingtenant" element={<ProtectedRoute allowedRoles={['admin']}><AdminPendingTenant /></ProtectedRoute>} />
              <Route path="addtenant" element={<ProtectedRoute allowedRoles={['admin']}><AdminAddNewTenant /></ProtectedRoute>} />
              <Route path="edit/:id" element={<ProtectedRoute allowedRoles={['admin']}><AdminAddNewTenant /></ProtectedRoute>} />
              <Route path="view/:id" element={<ProtectedRoute allowedRoles={['admin']}><AdminViewTenant /></ProtectedRoute>} />
              <Route path="createaccount/:id" element={<ProtectedRoute allowedRoles={['admin']}><AdminCreateAccount /></ProtectedRoute>} />
              <Route path="registration-form" element={<ProtectedRoute allowedRoles={['admin']}><TenantRegistrationForm /></ProtectedRoute>} />
            </Route>

            <Route path="bookings" element={<ProtectedRoute allowedRoles={['admin']}><AdminBookingManagement /></ProtectedRoute>} />

            {/* Users */}
            <Route path="users" element={<ProtectedRoute allowedRoles={['admin']}><AllUsers /></ProtectedRoute>} />
            <Route path="profile" element={<Profile />} />

            {/* Furniture  */}
            <Route path="furniture">
              <Route index element={<Furniture />} />
              <Route path="addnewfurniture" element={<AddNewFurniture key="add" />} />
              <Route path="edit/:id" element={<AddNewFurniture key="edit" />} />
              <Route path="room/:room" element={<RoomFurniture />} />
            </Route>

            {/* Rooms */}
            <Route path="rooms">
              <Route index element={<AllRoom />} />
              <Route path="available" element={<AvailableRoom />} />
              <Route path="occupied" element={<OccupiedRoom />} />
              <Route path="add" element={<AddNewRoom />} />
              <Route path="bulk-create" element={<BulkCreateRooms />} />
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
            <Route path="bills" element={<Bills />} />
            
            {/* Tenant Discovery */}
            <Route path="available-rooms">
              <Route index element={<AvailableRooms />} />
              <Route path=":id" element={<AvailableRoomDetail />} />
            </Route>

            <Route path="my-bookings" element={<MyBookings />} />
          </Route>
          {/* Catch-all 404 Page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
