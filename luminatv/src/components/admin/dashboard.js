
import {
    DashboardOutlined,
    DeleteOutlined,
    EditOutlined,
    LogoutOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    PlusOutlined,
    SyncOutlined,
    VideoCameraOutlined
} from '@ant-design/icons';
import { Button, Layout, Menu, theme } from 'antd';
import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import './dashboard.css';

const { Header, Sider, Content } = Layout;

const Dashboard = () => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const menuItems = [
        {
            key: '/admin/dashboard',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
            onClick: () => navigate('/admin/dashboard'),
        },
        {
            key: 'sub1',
            icon: <VideoCameraOutlined />,
            label: 'Movies',
            children: [
                {
                    key: '/admin/dashboard/movies/add',
                    icon: <PlusOutlined />,
                    label: 'Add Movie',
                    onClick: () => navigate('/admin/dashboard/movies/add'),
                },
                {
                    key: '/admin/dashboard/movies/delete',
                    icon: <DeleteOutlined />,
                    label: 'Delete Movie',
                    onClick: () => navigate('/admin/dashboard/movies/delete'),
                },
                {
                    key: '/admin/dashboard/movies/edit',
                    icon: <EditOutlined />,
                    label: 'Edit Movie',
                    onClick: () => navigate('/admin/dashboard/movies/edit'),
                },
                {
                    key: '/admin/dashboard/movies/update',
                    icon: <SyncOutlined />,
                    label: 'Update Movie',
                    onClick: () => navigate('/admin/dashboard/movies/update'),
                },
            ],
        },
    ];

    // Determine selected keys based on current path
    const getSelectedKey = () => {
        return location.pathname;
    };

    const getOpenKeys = () => {
        if (location.pathname.includes('/movies')) {
            return ['sub1'];
        }
        return [];
    };

    return (
        <Layout style={{ minHeight: '100vh', width: '100vw' }}>
            <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
                <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                    {collapsed ? 'LTV' : 'LuminaTV Admin'}
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    defaultSelectedKeys={[getSelectedKey()]}
                    defaultOpenKeys={getOpenKeys()}
                    selectedKeys={[getSelectedKey()]}
                    items={menuItems}
                />
            </Sider>
            <Layout>
                <Header style={{ padding: 0, background: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '20px' }}>
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{
                            fontSize: '16px',
                            width: 64,
                            height: 64,
                        }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{ fontWeight: 500 }}>Admin User</span>
                        <Button
                            type="primary"
                            danger
                            icon={<LogoutOutlined />}
                            onClick={handleLogout}
                        >
                            Logout
                        </Button>
                    </div>
                </Header>
                <Content
                    style={{
                        margin: '24px 16px',
                        padding: 24,
                        minHeight: 280,
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                        overflowY: 'auto',
                    }}
                >
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default Dashboard;
