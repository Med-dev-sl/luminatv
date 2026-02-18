import { Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import '../styles/button.css';
import Sidebar from './sidebar';

const Dashboard = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const dashboardContainerStyle = {
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: '#000000ff',
        color: 'white',
    };

    const contentStyle = {
        flex: 1,
        padding: '2rem',
        overflowY: 'auto',
        height: '100%',
    };

    return (
        <div style={dashboardContainerStyle}>
            <Sidebar />
            <div style={contentStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1>Admin Dashboard</h1>
                    <button onClick={handleLogout} style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>
                        Logout
                    </button>
                </div>
                <Outlet />
            </div>
        </div>
    );
};

export default Dashboard;
