
import { useState } from 'react';
import { supabase } from '../supabaseClient';
import Button from './button';

const LoginComponent = () => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [errorMsg, setErrorMsg] = useState('');
    // const navigate = useNavigate(); // handled by App.js state change

    // Add CSS for placeholder styling
    const placeholderStyle = `
        input::placeholder {
            color: #000000;
            font-size: 1rem;
        }
        input:focus::placeholder {
            color: rgba(0, 0, 0, 0.7);
        }
    `;

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
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-end',
            zIndex: 1000,
            paddingRight: '10%',
        },
        logo: {
            width: '150%',
            maxWidth: '250px',
            height: 'auto',
            marginBottom: '2rem',
            position: 'absolute',
            top: '2rem',
            left: '70%',
            transform: 'translateX(-50%)',
        },
        form: {
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            maxWidth: '350px',
            marginRight: '10%',
        },
        inputWrapper: {
            position: 'relative',
            marginBottom: '2rem',
        },
        input: {
            width: '100%',
            padding: '0.75rem 0',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: '2px solid #4a9eff',
            fontSize: '1rem',
            color: '#000000',
            outline: 'none',
            transition: 'border-color 0.3s ease',
        },
        inputFocus: {
            borderBottom: '2px solid #4a9eff',
        },
        label: {
            background: 'linear-gradient(135deg, #000000 0%, #001a4d 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '0.75rem',
            fontSize: '1rem',
            display: 'block',
            fontWeight: '500',
            letterSpacing: '0.5px',
        },
        title: {
            color: 'white',
            textAlign: 'center',
            marginBottom: '2rem',
            marginTop: 0,
            fontSize: '2rem',
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
            <style>{placeholderStyle}</style>
            <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="LuminaTV Logo" style={styles.logo} />
            <h2 style={styles.title}>LuminaTV Login</h2>
            {errorMsg && <div style={styles.error}>{errorMsg}</div>}
            <form onSubmit={handleLogin} style={styles.form}>
                <div style={styles.inputWrapper}>
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
                </div>
                <div style={styles.inputWrapper}>
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
                </div>
                <Button type="submit" loading={loading}>
                    Sign In
                </Button>
            </form>
        </div>
    );
};

export default LoginComponent;
