import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Box } from "@chakra-ui/react";
import DashboardLayout from "./layouts/DashboardLayout";

// Dashboard
import Dashboard from "./page/dashboard/Dashboard";
import Overview from "./page/dashboard/Overview";
import TenantDashboard from "./page/tenant/TenantDashboard";
import ListPending from "./page/dashboard/ListPending";
import MonthlyIncomeChart from "./page/dashboard/MonthlyIncomeChart";

// Rooms
import AllRoom from "./page/room/AllRoom";
import AvailableRoom from "./page/room/AvailableRoom";
import OccupiedRoom from "./page/room/OccupiedRoom";
import MaintenanceRoom from "./page/room/MaintenanceRoom";
import AddNewRoom from "./page/room/AddNewRoom";

// Lease
import NewLease from "./page/lease/NewLease";
import ActiveLease from "./page/lease/ActiveLease";
import ExpiredLease from "./page/lease/ExpiredLease";
import CreateNewLease from "./page/lease/CreateNewLease";

// Chat
import Chat from "./page/chat/Chat";

// Notification
import Notification from "./page/notification/Notification";

// Report
import Report from "./page/report/Report";

// Recycle Bin
import AllRecyclebin from "./page/recycleben/AllRecyclebin";

// Announcements
import Announcements from "./page/announcements/Announcements";

// Settings
import Settings from "./page/settings/Settings";

//Tenant
import AllTenants from "./page/tenant/AllTenants";
import ActiveTenant from "./page/tenant/ActiveTenant";
import PendingTenant from "./page/tenant/PendingTenant";
import AddNewTenant from "./page/tenant/AddNewTenant";
import ViewTenant from "./page/tenant/ViewTenant";
import CreateAccount from "./page/tenant/CreateAccount";

//Users
import AllUsers from "./page/user/AllUsers";

//Payment
import Payment from "./page/payment/Payment";

// Expenses
import Expense from "./page/dashboard/Expense";

//Utility
import Utility from "./page/utility/Utility";
import AddPayment from "./page/utility/Addpayment";
import PaymentHistory from "./page/utility/PaymentHistory";

//Furniture
import Furniture from "./page/furniture/Furniture";
import Allpayment from "./page/utility/Allpayment";
import Login from "./Login";
import ProtectedRoute from "./protectedroute";
// import ChangePassword from "./page/tenant/ChangePassword";
import AddNewFurniture from "./page/furniture/AddNewFurniture";
import RoomFurniture from "./page/furniture/RoomFurniture";
import EditRoom from "./page/room/EditRoom";
import ViewRoom from "./page/room/ViewRoom";
import ViewFurniture from "./page/furniture/ViewFurniture";
import Leases from "./page/lease/Lease";
import ViewLease from "./page/lease/ViewLease";
import AddBill from "./page/utility/AddBill";
import RecordPayment from "./page/utility/RecordPayment";

function App() {
  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <BrowserRouter>
        <Routes>
          {/* login page public */}
          <Route path="/login" element={<Login />} />
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Dashboard */}

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={localStorage.getItem('role') === 'tenant' ? <TenantDashboard /> : <Dashboard />} />
            <Route path="listpending" element={<ListPending />} />
            <Route path="monthlyincome" element={<MonthlyIncomeChart />} />
            {/* </Route> */}

            {/* Tenants */}
            <Route path="tenants">
              <Route index element={<AllTenants />} />
              <Route path="activetenant" element={<ActiveTenant />} />
              <Route path="pendingtenant" element={<PendingTenant />} />
              <Route path="addtenant" element={<AddNewTenant />} />
              <Route path="edit/:id" element={<AddNewTenant />} />
              <Route path="view/:id" element={<ViewTenant />} />
              <Route path="createaccount/:id" element={<CreateAccount />} />
              {/* <Route path="changepassword" element={<ChangePassword />} /> */}
            </Route>
            {/* Users */}
            <Route path="users">
              <Route index element={<AllUsers />} />
            </Route>

            {/* Furniture  */}
            <Route path="furniture">
              <Route index element={<Furniture />} />
              <Route
                path="addnewfurniture"
                element={<AddNewFurniture key="add" />}
              />
              <Route path="edit/:id" element={<AddNewFurniture key="edit" />} />
              <Route path="viewfurniture/:id" element={<ViewFurniture />} />
              <Route path="room/:room" element={<RoomFurniture />} />
            </Route>

            {/* Rooms */}
            <Route path="rooms">
              <Route index element={<AllRoom />} />
              <Route path="available" element={<AvailableRoom />} />
              <Route path="occupied" element={<OccupiedRoom />} />
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
            </Route>

            {/* Chat */}
            <Route path="chat" element={<Chat />} />

            {/* Maintenance */}
            <Route path="maintenance" element={<MaintenanceRoom />} />

            {/* Notification */}
            <Route path="notifications" element={
              <Box p={4} display="flex" justifyContent="center">
                <Box w="full" maxW="600px" shadow="sm" border="1px" borderColor="gray.100" rounded="xl" bg="white" _dark={{ bg: "gray.800", borderColor: "gray.700" }}>
                  <Notification />
                </Box>
              </Box>
            } />

            {/* Report */}
            <Route path="report" element={<Report />} />

            {/* Settings */}
            <Route path="settings" element={<Settings />} />

            {/* Trash */}
            <Route path="recyclebin" element={<AllRecyclebin />} />

            {/* Announcements */}
            <Route path="announcements" element={<Announcements />} />

            {/* Expenses */}
            <Route path="expenses" element={<Expense />} />

            {/* Payments */}
            <Route path="payments" element={<Payment />} />

            {/* utitlity */}
            <Route path="utility">
              <Route index element={<Utility />} />
              <Route path="addpayment" element={<AddPayment />} />
              <Route path="addbill" element={<AddBill />} />
              <Route path="recordpayment" element={<RecordPayment />} />
              <Route path="paymenthistory" element={<PaymentHistory />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
