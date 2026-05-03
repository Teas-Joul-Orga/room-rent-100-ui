import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

let echoInstance = null;

const echo = () => {
    if (echoInstance) return echoInstance;
    
    const token = (localStorage.getItem('token') || sessionStorage.getItem('token'));
    const host = import.meta.env.VITE_REVERB_HOST || 'localhost';
    const port = import.meta.env.VITE_REVERB_PORT || 8080;
    const protocol = import.meta.env.VITE_REVERB_SCHEME || 'http';
    
    // Dynamically derive auth endpoint from API URL
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
    const authEndpoint = apiUrl.replace('/api/v1', '/api/broadcasting/auth');

    echoInstance = new Echo({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY || 'ia6m3xrvsph7zmudqiif',
        wsHost: host,
        wsPort: port,
        wssPort: port,
        forceTLS: protocol === 'https',
        enabledTransports: ['ws', 'wss'],
        authEndpoint: authEndpoint,
        auth: {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
        },
    });
    return echoInstance;
};

// Also expose a way to reset the instance (e.g. on logout/login)
export const resetEcho = () => {
    if (echoInstance) {
        echoInstance.disconnect();
        echoInstance = null;
    }
};

export default echo;
