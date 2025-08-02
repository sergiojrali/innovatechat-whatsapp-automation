import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';
import { AuthProvider } from "./contexts/AuthContext";

import Dashboard from "./pages/dashboard";
import CampaignMonitoring from "./pages/campaign-monitoring";
import WhatsAppSessionsManagement from "./pages/whats-app-sessions-management";
import Login from "./pages/login";
import SystemConfiguration from "./pages/system-configuration";
import CampaignCreation from "./pages/campaign-creation";
import ContactManagement from "./pages/contact-management";
import AdminUserManagement from "./pages/admin-user-management";
import LiveChatMonitoring from "./pages/live-chat-monitoring";
import AgentManagement from "./pages/agent-management";
import AIConfiguration from "./pages/ai-configuration";
import Register from "./pages/register";
import NotFound from "./pages/NotFound";

function Routes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <ScrollToTop />
          <RouterRoutes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/whatsapp-sessions" element={<WhatsAppSessionsManagement />} />
            <Route path="/contacts" element={<ContactManagement />} />
            <Route path="/campaigns/create" element={<CampaignCreation />} />
            <Route path="/campaigns/monitor" element={<CampaignMonitoring />} />
            <Route path="/chat" element={<LiveChatMonitoring />} />
            <Route path="/agents" element={<AgentManagement />} />
            <Route path="/ai-config" element={<AIConfiguration />} />
            <Route path="/admin/users" element={<AdminUserManagement />} />
            <Route path="/admin/settings" element={<SystemConfiguration />} />
            <Route path="*" element={<NotFound />} />
          </RouterRoutes>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default Routes;