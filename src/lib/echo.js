import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

let echoInstance = null;

const echo = () => {
    if (echoInstance) return echoInstance;
    
    const token = localStorage.getItem('token');
    echoInstance = new Echo({
        broadcaster: 'reverb',
        key: 'ia6m3xrvsph7zmudqiif',
        wsHost: 'localhost',
        wsPort: 8080,
        wssPort: 8080,
        forceTLS: false,
        enabledTransports: ['ws', 'wss'],
        authEndpoint: 'http://localhost:8000/api/broadcasting/auth',
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
