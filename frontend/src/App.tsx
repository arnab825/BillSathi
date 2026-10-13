import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from './components/layout/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { IntakePage } from './pages/IntakePage';
import { EvidenceWorkspacePage } from './pages/EvidenceWorkspacePage';
import { AnomalyCenterPage } from './pages/AnomalyCenterPage';
import { RegisterPage } from './pages/RegisterPage';
import { VendorIntelligencePage } from './pages/VendorIntelligencePage';
import { SettingsPage } from './pages/SettingsPage';

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
      <BrowserRouter>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
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
          </main>
          <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-mono">
                <span className="font-bold text-slate-400">BillSathi</span>
                <span>•</span>
                <span>Proof Before Trust</span>
              </div>
              <div>
                Hacktoberfest 2026 DEV Open-Source AI Challenge • Week 2: Side Hustle
              </div>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
