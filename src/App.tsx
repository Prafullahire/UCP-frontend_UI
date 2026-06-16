import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ReportsPage from './features/reports/ReportsPage';
import DashboardPage from './features/dashboard/DashboardPage';
import SupportPage from './features/support/SupportPage';
import OrdersPage from './features/orders/OrdersPage';
import NewForwardOrderPage from './features/orders/NewForwardOrderPage';
import NewReverseOrderPage from './features/orders/NewReverseOrderPage';
import EditForwardOrderPage from './features/orders/EditForwardOrderPage';
import ShipOrderPage from './features/orders/ShipOrderPage';
import PickupRequestPage from './features/orders/PickupRequestPage';
import ProfilePage from './features/profile/ProfilePage';
import NdrPage from './features/ndr/NdrPage';
import RateCalculatorPage from './features/info-center/RateCalculatorPage';
import RateCardPage from './features/info-center/RateCardPage';
import PincodeServiceabilityPage from './features/info-center/PincodeServiceabilityPage';
import ComingSoonPage from './components/ui/ComingSoonPage';
import Landing from './pages/Landing/Landing.tsx';
import SignupPage from './pages/Auth/SignupPage';
import './App.css';

/**
 * Top-level routing.
 *
 * The Reports menu (built from `ui-source/screens/all_reports_v2.html`)
 * routes to `/reports`. Every other nav destination listed in
 * `data/navConfig.tsx` gets a placeholder route here so the active state
 * resolves correctly while the modules are still being built.
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Landing />} />
        <Route path="/auth/register" element={<SignupPage />} />
        <Route path="/*" element={
          <MainLayout>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Implemented modules */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/reports" element={<ReportsPage />} />

          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/new-forward" element={<NewForwardOrderPage />} />
          <Route path="/orders/new-reverse" element={<NewReverseOrderPage />} />
          <Route path="/orders/:id/edit" element={<EditForwardOrderPage />} />
          <Route path="/orders/:id/ship" element={<ShipOrderPage />} />
          <Route path="/orders/pickup-request" element={<PickupRequestPage />} />

          <Route path="/profile" element={<ProfilePage />} />

          <Route path="/ndr" element={<NdrPage />} />

          <Route path="/info/rate-calculator" element={<RateCalculatorPage />} />
          <Route path="/info/rate-card" element={<RateCardPage />} />
          <Route path="/info/pincode" element={<PincodeServiceabilityPage />} />

          {/* Placeholders — keep paths in sync with `data/navConfig.tsx` */}
          <Route path="/finance/wallet" element={<ComingSoonPage title="Wallet" />} />
          <Route path="/finance/remittance" element={<ComingSoonPage title="Remittance" />} />
          <Route path="/finance/invoices" element={<ComingSoonPage title="Invoice & Credits" />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/services" element={<ComingSoonPage title="Services" />} />
          <Route path="/services/channels" element={<ComingSoonPage title="Channels" />} />
          <Route path="/settings" element={<ComingSoonPage title="Settings" />} />

              {/* Fallback */}
              <Route path="*" element={<ComingSoonPage title="Page Not Found" />} />
            </Routes>
          </MainLayout>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
