/**
 * التطبيق الرئيسي - مخزن البنود الجمركية
 */
import { Switch, Route, Router as WouterRouter, Redirect } from 'wouter';
import { AuthProvider, useAuth } from './app/AuthContext';
import { DraftProvider } from './app/DraftContext';
import { SettingsProvider } from './app/SettingsContext';
import { OfflineBanner } from './components/OfflineBanner';
import { LoadingScreen } from './components/LoadingScreen';
import { Layout } from './components/Layout';
import { isFirebaseConfigured } from './lib/firebase';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import ItemDetailsPage from './pages/ItemDetailsPage';
import AddEditItemPage from './pages/AddEditItemPage';
import CalculatorPage from './pages/CalculatorPage';
import DraftPage from './pages/DraftPage';
import OperationsPage from './pages/OperationsPage';
import OperationDetailPage from './pages/OperationDetailPage';
import InventoryPage from './pages/InventoryPage';
import SettingsPage from './pages/SettingsPage';
import UsersPage from './pages/UsersPage';
import BackupsPage from './pages/BackupsPage';

function AppRoutes() {
  const { firebaseUser, appUser, loading } = useAuth();

  if (loading) return <LoadingScreen message="جاري التحميل..." />;

  // المستخدم غير مسجل
  if (!firebaseUser) {
    return (
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Switch>
          <Route path="/login" component={LoginPage} />
          <Route path="/register" component={RegisterPage} />
          <Route><Redirect to="/login" /></Route>
        </Switch>
      </WouterRouter>
    );
  }

  // المستخدم محظور أو معطل
  if (appUser && (appUser.status === 'blocked' || appUser.status === 'disabled')) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <div className="text-4xl mb-4">🚫</div>
        <h1 className="text-xl font-bold text-foreground mb-2">الحساب موقوف</h1>
        <p className="text-sm text-muted-foreground">
          {appUser.status === 'blocked'
            ? 'حسابك محظور. تواصل مع المسؤول.'
            : 'حسابك معطل. تواصل مع المسؤول.'}
        </p>
      </div>
    );
  }

  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Layout>
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/search" component={SearchPage} />
          <Route path="/calculator" component={CalculatorPage} />
          <Route path="/draft" component={DraftPage} />
          <Route path="/operations" component={OperationsPage} />
          <Route path="/operations/:id" component={OperationDetailPage} />
          <Route path="/inventory" component={InventoryPage} />
          <Route path="/inventory/add" component={AddEditItemPage} />
          <Route path="/inventory/edit/:id">
            {(params) => <AddEditItemPage />}
          </Route>
          <Route path="/items/:id" component={ItemDetailsPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route path="/users" component={UsersPage} />
          <Route path="/backups" component={BackupsPage} />
          <Route path="/login"><Redirect to="/" /></Route>
          <Route>
            <div className="p-6 text-center text-muted-foreground" dir="rtl">
              <p className="text-lg font-medium">الصفحة غير موجودة</p>
            </div>
          </Route>
        </Switch>
      </Layout>
    </WouterRouter>
  );
}

function FirebaseSetupScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background" dir="rtl">
      <div className="text-5xl mb-6">⚙️</div>
      <h1 className="text-2xl font-bold text-foreground mb-3">إعداد Firebase مطلوب</h1>
      <p className="text-muted-foreground mb-6 max-w-sm leading-relaxed">
        لم يتم ضبط إعدادات Firebase بعد. يرجى إضافة متغيرات البيئة المطلوبة لتشغيل التطبيق.
      </p>
      <div className="bg-muted rounded-xl p-4 text-right font-mono text-xs text-foreground/80 w-full max-w-sm space-y-1">
        <p>VITE_FIREBASE_API_KEY</p>
        <p>VITE_FIREBASE_AUTH_DOMAIN</p>
        <p>VITE_FIREBASE_PROJECT_ID</p>
        <p>VITE_FIREBASE_STORAGE_BUCKET</p>
        <p>VITE_FIREBASE_MESSAGING_SENDER_ID</p>
        <p>VITE_FIREBASE_APP_ID</p>
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        راجع ملف <code className="bg-muted px-1 rounded">.env.example</code> للمساعدة
      </p>
    </div>
  );
}

export default function App() {
  if (!isFirebaseConfigured()) {
    return <FirebaseSetupScreen />;
  }

  return (
    <SettingsProvider>
      <AuthProvider>
        <DraftProvider>
          <OfflineBanner />
          <AppRoutes />
        </DraftProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}
