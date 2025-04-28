import { Routes, Route } from 'react-router-dom';
import './App.css'
import Layout from './components/Layout'; // Import Layout
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WorkoutsPage from './pages/WorkoutsPage'; // Importă noua pagină
import AuthCallback from './components/AuthCallback'; // Importă componenta de callback
import NutritionPage from './pages/NutritionPage'; // <-- Importă pagina de nutriție
// Import other pages later

function App() {

  return (
    <Routes>
      {/* Ruta pentru Google Auth Callback - fără Layout */}
      <Route path="/auth-callback" element={<AuthCallback />} />

      {/* Rutele principale, inclusiv cele publice, folosesc Layout */}
      <Route path="/" element={<Layout />}> { /* Main layout route */}
        { /* Nested routes that will render inside Layout's Outlet */}
        <Route index element={<HomePage />} /> { /* Default route for '/' */}
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="workouts" element={<WorkoutsPage />} /> {/* Adaugă ruta pentru workouts */}
        <Route path="nutrition" element={<NutritionPage />} /> {/* <-- Adaugă ruta pentru nutriție */}
        {/* Add other routes: Dashboard, Training, etc. */}

        {/* Catch-all route for 404 Not Found (optional) */}
        {/* <Route path="*" element={<NotFoundPage />} /> */}
      </Route>
    </Routes>
  )
}

export default App
