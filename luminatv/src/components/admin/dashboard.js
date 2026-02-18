
import {
    DashboardOutlined,
    DeleteOutlined,
    EditOutlined,
    LogoutOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    PlusOutlined,
    SyncOutlined,
    VideoCameraOutlined,
    AppstoreOutlined,
    BarsOutlined,
    UserOutlined,
    TeamOutlined
} from '@ant-design/icons';
import { Button, Layout, Menu, Modal, theme, ConfigProvider } from 'antd';
import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import './dashboard.css';

const { Header, Sider, Content } = Layout;

const Dashboard = () => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const darkTheme = {
        token: {
            colorBgBase: '#141414',
            colorTextBase: '#ffffff',
            colorPrimary: '#001a4d',
            colorBgContainer: '#1f1f1f',
            colorBorder: '#303030',
            colorText: '#ffffff',
            colorTextSecondary: '#d9d9d9',
            colorTextTertiary: '#8c8c8c',
            borderRadius: 6,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.45)',
        },
        algorithm: theme.darkAlgorithm,
    };

    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const handleLogout = async () => {
        Modal.confirm({
            title: 'Confirm Logout',
            content: 'Are you sure you want to logout?',
            okText: 'Yes',
            cancelText: 'No',
            onOk() {
                supabase.auth.signOut();
                navigate('/');
            },
            onCancel() {
                // User clicked No, do nothing
            },
        });
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
        {
            key: 'sub2',
            icon: <AppstoreOutlined />,
            label: 'Categories',
            children: [
                {
                    key: '/admin/dashboard/category/add',
                    icon: <PlusOutlined />,
                    label: 'Add Category',
                    onClick: () => navigate('/admin/dashboard/category/add'),
                },
                {
                    key: '/admin/dashboard/category/delete',
                    icon: <DeleteOutlined />,
                    label: 'Delete Category',
                    onClick: () => navigate('/admin/dashboard/category/delete'),
                },
                {
                    key: '/admin/dashboard/category/edit',
                    icon: <EditOutlined />,
                    label: 'Edit Category',
                    onClick: () => navigate('/admin/dashboard/category/edit'),
                },
                {
                    key: '/admin/dashboard/category/update',
                    icon: <SyncOutlined />,
                    label: 'Update Category',
                    onClick: () => navigate('/admin/dashboard/category/update'),
                },
            ],
        },
        {
            key: 'sub3',
            icon: <BarsOutlined />,
            label: 'Genres',
            children: [
                {
                    key: '/admin/dashboard/genres/add',
                    icon: <PlusOutlined />,
                    label: 'Add Genre',
                    onClick: () => navigate('/admin/dashboard/genres/add'),
                },
                {
                    key: '/admin/dashboard/genres/delete',
                    icon: <DeleteOutlined />,
                    label: 'Delete Genre',
                    onClick: () => navigate('/admin/dashboard/genres/delete'),
                },
                {
                    key: '/admin/dashboard/genres/edit',
                    icon: <EditOutlined />,
                    label: 'Edit Genre',
                    onClick: () => navigate('/admin/dashboard/genres/edit'),
                },
                {
                    key: '/admin/dashboard/genres/update',
                    icon: <SyncOutlined />,
                    label: 'Update Genre',
                    onClick: () => navigate('/admin/dashboard/genres/update'),
                },
            ],
        },
        {
            key: 'sub4',
            icon: <UserOutlined />,
            label: 'Users',
            children: [
                {
                    key: '/admin/dashboard/users/add',
                    icon: <PlusOutlined />,
                    label: 'Add User',
                    onClick: () => navigate('/admin/dashboard/users/add'),
                },
                {
                    key: '/admin/dashboard/users/delete',
                    icon: <DeleteOutlined />,
                    label: 'Delete User',
                    onClick: () => navigate('/admin/dashboard/users/delete'),
                },
                {
                    key: '/admin/dashboard/users/edit',
                    icon: <EditOutlined />,
                    label: 'Edit User',
                    onClick: () => navigate('/admin/dashboard/users/edit'),
                },
                {
                    key: '/admin/dashboard/users/update',
                    icon: <SyncOutlined />,
                    label: 'Update User',
                    onClick: () => navigate('/admin/dashboard/users/update'),
                },
                {
                    key: 'sub4-roles',
                    icon: <TeamOutlined />,
                    label: 'User Roles',
                    children: [
                        {
                            key: '/admin/dashboard/users/roles/add',
                            icon: <PlusOutlined />,
                            label: 'Add User Role',
                            onClick: () => navigate('/admin/dashboard/users/roles/add'),
                        },
                        {
                            key: '/admin/dashboard/users/roles/delete',
                            icon: <DeleteOutlined />,
                            label: 'Delete User Role',
                            onClick: () => navigate('/admin/dashboard/users/roles/delete'),
                        },
                        {
                            key: '/admin/dashboard/users/roles/edit',
                            icon: <EditOutlined />,
                            label: 'Edit User Role',
                            onClick: () => navigate('/admin/dashboard/users/roles/edit'),
                        },
                        {
                            key: '/admin/dashboard/users/roles/update',
                            icon: <SyncOutlined />,
                            label: 'Update User Role',
                            onClick: () => navigate('/admin/dashboard/users/roles/update'),
                        },
                    ],
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
        if (location.pathname.includes('/category')) {
            return ['sub2'];
        }
        if (location.pathname.includes('/genres')) {
            return ['sub3'];
        }
        if (location.pathname.includes('/users')) {
            if (location.pathname.includes('/roles')) {
                return ['sub4', 'sub4-roles'];
            }
            return ['sub4'];
        }
        return [];
    };

    return (
        <ConfigProvider theme={darkTheme}>
            <Layout style={{ minHeight: '100vh', width: '100vw', backgroundColor: '#141414' }}>
                <Sider 
                    trigger={null} 
                    collapsible 
                    collapsed={collapsed} 
                    theme="dark"
                    style={{ backgroundColor: '#141414' }}
                >
                    <div style={{ height: 32, margin: 16, background: 'linear-gradient(135deg, #001a4d 0%, #000000 100%)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
                        {collapsed ? 'LTV' : 'LuminaTV Admin'}
                    </div>
                    <Menu
                        theme="dark"
                        mode="inline"
                        defaultSelectedKeys={[getSelectedKey()]}
                        defaultOpenKeys={getOpenKeys()}
                        selectedKeys={[getSelectedKey()]}
                        items={menuItems}
                        style={{ backgroundColor: '#141414', borderRight: 'none' }}
                    />
                </Sider>
                <Layout style={{ backgroundColor: '#1a1a1a' }}>
                    <Header style={{ 
                        padding: 0, 
                        background: '#1f1f1f', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        paddingRight: '20px',
                        borderBottom: '1px solid #303030',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.45)'
                    }}>
                        <Button
                            type="text"
                            icon={collapsed ? <MenuUnfoldOutlined style={{ color: '#fff' }} /> : <MenuFoldOutlined style={{ color: '#fff' }} />}
                            onClick={() => setCollapsed(!collapsed)}
                            style={{
                                fontSize: '16px',
                                width: 64,
                                height: 64,
                                color: '#fff',
                            }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <span style={{ fontWeight: 500, color: '#fff' }}>Admin User</span>
                            <Button
                                icon={<LogoutOutlined />}
                                onClick={handleLogout}
                                style={{
                                    background: 'linear-gradient(135deg, #001a4d 0%, #000000 100%)',
                                    color: '#ffffff',
                                    border: 'none',
                                    fontWeight: '500'
                                }}
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
                            background: '#1a1a1a',
                            borderRadius: borderRadiusLG,
                            overflowY: 'auto',
                            color: '#ffffff',
                        }}
                    >
                        <Outlet />
                    </Content>
                </Layout>
            </Layout>
        </ConfigProvider>
    );
};

export default Dashboard;
