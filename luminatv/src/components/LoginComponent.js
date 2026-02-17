
import { useState } from 'react';
import { supabase } from '../supabaseClient';
import Button from './button';

const LoginComponent = () => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [errorMsg, setErrorMsg] = useState('');
    // const navigate = useNavigate(); // handled by App.js state change

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });
            if (error) throw error;
            // Successful login will update session in App.js and redirect
        } catch (error) {
            setErrorMsg(error.message);
        } finally {
            setLoading(false);
        }
    };

    const styles = {
        backgroundWrapper: {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundImage: `url(${process.env.PUBLIC_URL}/loginbg.png)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
        },
        container: {
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            maxWidth: '350px',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            borderRadius: '8px',
            backdropFilter: 'blur(5px)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        },
        input: {
            marginBottom: '1rem',
            padding: '0.75rem',
            borderRadius: '0px',
            border: 'none',
            fontSize: '1rem',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
        },
        title: {
            color: 'white',
            textAlign: 'center',
            marginBottom: '1.5rem',
            marginTop: 0,
        },
        label: {
            color: 'white',
            marginBottom: '0.5rem',
            fontSize: '0.9rem',
        },
        error: {
            color: '#ff6b6b',
            marginBottom: '1rem',
            textAlign: 'center',
            fontSize: '0.9rem',
        }
    };

    return (
        <div style={styles.backgroundWrapper}>
            <div style={styles.container}>
                <h2 style={styles.title}>LuminaTV Login</h2>
                {errorMsg && <div style={styles.error}>{errorMsg}</div>}
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={styles.label}>Email</label>
                    <input
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleChange}
                        style={styles.input}
                        required
                    />
                    <label style={styles.label}>Password</label>
                    <input
                        name="password"
                        type="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleChange}
                        style={styles.input}
                        required
                    />
                    <Button type="submit" loading={loading}>
                        Sign In
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default LoginComponent;
