import axios from 'axios';

// Definește URL-ul de bază al API-ului tău
// Poți folosi variabile de mediu (import.meta.env.VITE_API_URL)
// const API_BASE_URL = 'http://localhost:5276/api'; // Comentat URL-ul vechi
const API_BASE_URL = '/api'; // Folosim calea relativă pentru proxy-ul Vite

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000, // Timeout de 10 secunde (opțional)
    headers: {
        'Content-Type': 'application/json',
    }
});

// Adaugă un interceptor pentru cereri
axiosInstance.interceptors.request.use(
    (config) => {
        // Ia token-ul din localStorage (sau unde îl stochezi)
        const token = localStorage.getItem('authToken'); // Asigură-te că folosești aceeași cheie ca în AuthContext
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Opcional: Adaugă un interceptor pentru răspunsuri (ex: pentru a gestiona 401 Unauthorized)
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token invalid sau expirat
            console.error("Axios Interceptor: Unauthorized (401). Logging out.");
            localStorage.removeItem('authToken');
            localStorage.removeItem('userInfo');
            // Redirecționează la login - folosim window.location deoarece suntem în afara contextului Router
            // Poți implementa o soluție mai elegantă cu un event bus sau context dacă preferi
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        // Returnează eroarea pentru a fi prinsă de .catch() în componentă
        return Promise.reject(error);
    }
);

export default axiosInstance; 