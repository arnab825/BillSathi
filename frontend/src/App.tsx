import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { IntakePage } from './pages/IntakePage';
import { EvidenceWorkspacePage } from './pages/EvidenceWorkspacePage';
import { AnomalyCenterPage } from './pages/AnomalyCenterPage';
import { RegisterPage } from './pages/RegisterPage';
import { VendorIntelligencePage } from './pages/VendorIntelligencePage';
import { SettingsPage } from './pages/SettingsPage';

import { ToastProvider } from './context/ToastContext';
import { CurrencyProvider } from './context/CurrencyContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5000,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CurrencyProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppLayout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/intake" element={<IntakePage />} />
                <Route path="/workspace" element={<EvidenceWorkspacePage />} />
                <Route path="/anomalies" element={<AnomalyCenterPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/vendors" element={<VendorIntelligencePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppLayout>
          </BrowserRouter>
        </ToastProvider>
      </CurrencyProvider>
    </QueryClientProvider>
  );
}

export default App;
