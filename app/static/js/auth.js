// Authentication Utilities - JWT Management and User Session

const AUTH_TOKEN_KEY = 'asesoriaimss_token';
const AUTH_USER_KEY = 'asesoriaimss_user';

// Get current user from localStorage
function getCurrentUser() {
    const userStr = localStorage.getItem(AUTH_USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
}

// Get auth token
function getAuthToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
}

// Check if user is authenticated
function isAuthenticated() {
    return !!getAuthToken();
}

// Check if user has specific role
function hasRole(role) {
    const user = getCurrentUser();
    return user && user.role === role;
}

// Save authentication data
function saveAuth(token, user) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

// Clear authentication data
function clearAuth() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
}

// Login function
async function login(email, password) {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error al iniciar sesión');
        }

        if (data.success && data.data.token) {
            saveAuth(data.data.token, data.data.user);
            return { success: true, user: data.data.user };
        }

        throw new Error('Respuesta inválida del servidor');
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
    }
}

// Register function
async function register(userData) {
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error al registrar usuario');
        }

        if (data.success && data.data.token) {
            saveAuth(data.data.token, data.data.user);
            return { success: true, user: data.data.user };
        }

        throw new Error('Respuesta inválida del servidor');
    } catch (error) {
        console.error('Register error:', error);
        return { success: false, error: error.message };
    }
}

// Logout function
function logout() {
    clearAuth();
    window.location.href = '/';
}

// OAuth login (Google)
async function loginWithGoogle(googleData) {
    try {
        const response = await fetch('/api/auth/google-login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(googleData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error al iniciar sesión con Google');
        }

        if (data.success && data.data.token) {
            saveAuth(data.data.token, data.data.user);
            return { success: true, user: data.data.user };
        }

        throw new Error('Respuesta inválida del servidor');
    } catch (error) {
        console.error('Google login error:', error);
        return { success: false, error: error.message };
    }
}

// OAuth login (Facebook)
async function loginWithFacebook(facebookData) {
    try {
        const response = await fetch('/api/auth/facebook-login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(facebookData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error al iniciar sesión con Facebook');
        }

        if (data.success && data.data.token) {
            saveAuth(data.data.token, data.data.user);
            return { success: true, user: data.data.user };
        }

        throw new Error('Respuesta inválida del servidor');
    } catch (error) {
        console.error('Facebook login error:', error);
        return { success: false, error: error.message };
    }
}

// Redirect based on user role
function redirectToDashboard() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = '/login';
        return;
    }

    switch (user.role) {
        case 'admin':
            window.location.href = '/admin';
            break;
        case 'professional':
            window.location.href = '/dashboard-profesional';
            break;
        case 'user':
            window.location.href = '/perfil-usuario';
            break;
        case 'tienda':
            window.location.href = '/tienda';
            break;
        case 'salon':
        case 'owner':
            window.location.href = '/admin'; // Start with Admin Mirror panel
            break;
        default:
            window.location.href = '/';
    }
}

// Require authentication (call on protected pages)
async function checkAuth(role = null) {
    // Legacy redirector function adaptation
    if (!isAuthenticated()) {
        window.location.href = '/login';
        return null; // Stop exec
    }
    const user = getCurrentUser();
    if (role && user.role !== role) {
        // Allow salons to see admin panel but maybe limited? 
        // For now, if role is 'admin' and user is 'salon', block.
        if (role === 'admin' && user.role === 'salon') {
            // Let them pass
        } else if (role === 'admin' && user.role !== 'admin') {
            alert('Acceso Denegado');
            window.location.href = '/';
            return null;
        }
    }
    return user;
}

// Update UI based on auth state
function updateAuthUI() {
    const user = getCurrentUser();
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');

    if (user && authButtons && userMenu) {
        authButtons.classList.add('hidden');
        userMenu.classList.remove('hidden');

        const userName = document.getElementById('userName');
        if (userName) {
            userName.textContent = user.full_name || user.email;
        }
    } else if (authButtons && userMenu) {
        authButtons.classList.remove('hidden');
        userMenu.classList.add('hidden');
    }
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
});

// ============================================
// LOCATION HELPERS (Hardcoded for stability)
// ============================================
const LOCATIONS = {
    "MX": {
        name: "México",
        states: {
            "AGU": { name: "Aguascalientes", cities: ["Aguascalientes", "Jesús María"] },
            "BCN": { name: "Baja California", cities: ["Tijuana", "Mexicali", "Ensenada"] },
            "BCS": { name: "Baja California Sur", cities: ["La Paz", "Los Cabos"] },
            "CAM": { name: "Campeche", cities: ["Campeche", "Ciudad del Carmen"] },
            "COA": { name: "Coahuila", cities: ["Saltillo", "Torreón", "Monclova"] },
            "COL": { name: "Colima", cities: ["Colima", "Manzanillo"] },
            "CHP": { name: "Chiapas", cities: ["Tuxtla Gutiérrez", "Tapachula", "San Cristóbal"] },
            "CHH": { name: "Chihuahua", cities: ["Chihuahua", "Ciudad Juárez"] },
            "CMX": { name: "Ciudad de México", cities: ["CDMX", "Coyoacán", "Polanco", "Santa Fe"] },
            "DUR": { name: "Durango", cities: ["Durango", "Gómez Palacio"] },
            "GUA": { name: "Guanajuato", cities: ["León", "Guanajuato", "Irapuato", "Celaya"] },
            "GRO": { name: "Guerrero", cities: ["Acapulco", "Chilpancingo"] },
            "HID": { name: "Hidalgo", cities: ["Pachuca", "Tulancingo"] },
            "JAL": { name: "Jalisco", cities: ["Guadalajara", "Zapopan", "Puerto Vallarta", "Tlaquepaque"] },
            "MEX": { name: "Estado de México", cities: ["Toluca", "Naucalpan", "Ecatepec", "Nezahualcóyotl"] },
            "MIC": { name: "Michoacán", cities: ["Morelia", "Uruapan"] },
            "MOR": { name: "Morelos", cities: ["Cuernavaca", "Jiutepec"] },
            "NAY": { name: "Nayarit", cities: ["Tepic", "Bahía de Banderas"] },
            "NLE": { name: "Nuevo León", cities: ["Monterrey", "San Pedro", "San Nicolás", "Apodaca"] },
            "OAX": { name: "Oaxaca", cities: ["Oaxaca de Juárez", "Salina Cruz"] },
            "PUE": { name: "Puebla", cities: ["Puebla", "Cholula", "Tehuacán"] },
            "QUE": { name: "Querétaro", cities: ["Querétaro", "San Juan del Río"] },
            "ROO": { name: "Quintana Roo", cities: ["Cancún", "Playa del Carmen", "Chetumal"] },
            "SLP": { name: "San Luis Potosí", cities: ["San Luis Potosí", "Matehuala"] },
            "SIN": { name: "Sinaloa", cities: ["Culiacán", "Mazatlán", "Los Mochis"] },
            "SON": { name: "Sonora", cities: ["Hermosillo", "Ciudad Obregón"] },
            "TAB": { name: "Tabasco", cities: ["Villahermosa", "Cárdenas"] },
            "TAM": { name: "Tamaulipas", cities: ["Reynosa", "Matamoros", "Tampico"] },
            "TLA": { name: "Tlaxcala", cities: ["Tlaxcala", "Apizaco"] },
            "VER": { name: "Veracruz", cities: ["Veracruz", "Xalapa", "Coatzacoalcos"] },
            "YUC": { name: "Yucatán", cities: ["Mérida", "Valladolid"] },
            "ZAC": { name: "Zacatecas", cities: ["Zacatecas", "Fresnillo"] }
        }
    },
    "US": {
        name: "Estados Unidos",
        states: {
            "CA": { name: "California", cities: ["Los Angeles", "San Francisco", "San Diego"] },
            "TX": { name: "Texas", cities: ["Houston", "Austin", "Dallas"] },
            "FL": { name: "Florida", cities: ["Miami", "Orlando"] },
            "NY": { name: "New York", cities: ["New York City", "Buffalo"] }
        }
    },
    "CO": { name: "Colombia", states: { "BOG": { name: "Bogotá", cities: ["Bogotá"] }, "ANT": { name: "Antioquia", cities: ["Medellín"] } } },
    "AR": { name: "Argentina", states: { "BUE": { name: "Buenos Aires", cities: ["Buenos Aires", "La Plata"] } } },
    "ES": { name: "España", states: { "MAD": { name: "Madrid", cities: ["Madrid"] }, "CAT": { name: "Cataluña", cities: ["Barcelona"] } } },
    "CL": { name: "Chile", states: { "SAN": { name: "Santiago", cities: ["Santiago"] } } },
    "PE": { name: "Perú", states: { "LIM": { name: "Lima", cities: ["Lima"] } } }
};

function populateCountries(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = '<option value="">Selecciona País</option>';
    Object.keys(LOCATIONS).forEach(code => {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = LOCATIONS[code].name;
        select.appendChild(option);
    });

    // Auto-select MX by default
    select.value = "MX";
    const event = new Event('change');
    select.dispatchEvent(event);

    // Listen for changes
    select.addEventListener('change', (e) => {
        const countryCode = e.target.value;
        const stateSelect = document.getElementById('salonState'); // Assumes ID
        populateStates(stateSelect, countryCode);
    });
}

function populateStates(selectElement, countryCode) {
    if (!selectElement) return;
    selectElement.disabled = false;
    selectElement.innerHTML = '<option value="">Selecciona Estado</option>';

    const country = LOCATIONS[countryCode];
    if (country && country.states) {
        Object.keys(country.states).forEach(code => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = country.states[code].name;
            selectElement.appendChild(option);
        });

        // Listen for changes
        selectElement.onchange = (e) => {
            const citySelect = document.getElementById('salonCity'); // Assumes ID
            populateCities(citySelect, countryCode, e.target.value);
        }
    }
}

function populateCities(selectElement, countryCode, stateCode) {
    if (!selectElement) return;
    selectElement.disabled = false;
    selectElement.innerHTML = '<option value="">Selecciona Ciudad</option>';

    const country = LOCATIONS[countryCode];
    if (country && country.states && country.states[stateCode]) {
        country.states[stateCode].cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            selectElement.appendChild(option);
        });
    }
}
