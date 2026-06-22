import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider, useApp } from './contexts/AppContext';
import { LandsProvider } from './contexts/LandsContext';
import { NotificationProvider } from './contexts/NotificationContext';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import AIAnalysisPage from './pages/AIAnalysisPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import GuidebookPage from './pages/GuidebookPage';
import MainLayout from './components/layout/MainLayout';
import LoadingScreen from './components/LoadingScreen';
// DISABLED: ToastContainer - Diganti dengan NotificationCenter di Sidebar
// import ToastContainer from './components/notifications/ToastContainer';

function PageContent() {
  const { activePage } = useApp();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activePage}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        {activePage === 'home' && <HomePage />}
        {activePage === 'dashboard' && <DashboardPage />}
        {activePage === 'ai-analysis' && <AIAnalysisPage />}
        {activePage === 'history' && <HistoryPage />}
        {activePage === 'settings' && <SettingsPage />}
        {activePage === 'guidebook' && <GuidebookPage />}
      </motion.div>
    </AnimatePresence>
  );
}

function AppInner() {
  const { user, loading, passwordRecovery } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user || passwordRecovery) {
    return <AuthPage />;
  }

  return (
    <NotificationProvider>
      <LandsProvider>
        <AppProvider>
          <MainLayout>
            <PageContent />
          </MainLayout>
          {/* DISABLED: ToastContainer moved to NotificationCenter in Sidebar */}
        </AppProvider>
      </LandsProvider>
    </NotificationProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
