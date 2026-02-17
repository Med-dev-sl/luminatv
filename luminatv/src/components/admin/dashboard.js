
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import '../styles/button.css';

const Dashboard = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const containerStyle = {
        padding: '2rem',
        color: 'white',
        backgroundColor: '#1a1a1a',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    };

    return (
        <div style={containerStyle}>
            <h1>Admin Dashboard</h1>
            <p>Welcome, Admin!</p>
            <button onClick={handleLogout} style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px' }}>
                Logout
            </button>
        </div>
    );
};

export default Dashboard;
