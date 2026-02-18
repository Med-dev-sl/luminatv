import React, { useState, useEffect } from 'react';
import { Input, Table, Button, Modal, message, Card, Space } from 'antd';
import { DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { supabase } from '../../../supabaseClient';

const DeleteUsers = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                message.error('Error fetching users: ' + error.message);
                return;
            }

            setUsers(data);
            setFilteredUsers(data);
        } catch (error) {
            message.error('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (value) => {
        setSearchText(value);
        const filtered = users.filter((user) =>
            user.email.toLowerCase().includes(value.toLowerCase()) ||
            user.first_name?.toLowerCase().includes(value.toLowerCase()) ||
            user.last_name?.toLowerCase().includes(value.toLowerCase()) ||
            user.id.includes(value)
        );
        setFilteredUsers(filtered);
    };

    const deleteUser = async (userId) => {
        try {
            setLoading(true);

            // First, delete user roles assignment
            const { error: roleError } = await supabase
                .from('user_roles_assignment')
                .delete()
                .eq('user_id', userId);

            if (roleError) {
                message.error('Error removing user roles: ' + roleError.message);
                return;
            }

            // Delete the user record
            const { error: userError } = await supabase
                .from('users')
                .delete()
                .eq('id', userId);

            if (userError) {
                message.error('Error deleting user: ' + userError.message);
                return;
            }

            message.success('User deleted successfully!');
            fetchUsers();
        } catch (error) {
            message.error('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (record) => {
        Modal.confirm({
            title: 'Delete User',
            content: `Are you sure you want to delete "${record.first_name} ${record.last_name}" (${record.email})? This action cannot be undone.`,
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk() {
                deleteUser(record.id);
            },
        });
    };

    const columns = [
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            sorter: (a, b) => a.email.localeCompare(b.email),
        },
        {
            title: 'First Name',
            dataIndex: 'first_name',
            key: 'first_name',
        },
        {
            title: 'Last Name',
            dataIndex: 'last_name',
            key: 'last_name',
        },
        {
            title: 'Phone',
            dataIndex: 'phone',
            key: 'phone',
            width: 120,
        },
        {
            title: 'Country',
            dataIndex: 'country',
            key: 'country',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = 'green';
                if (status === 'inactive') color = 'orange';
                if (status === 'suspended') color = 'red';
                return <span style={{ color }}>{status}</span>;
            },
        },
        {
            title: 'Action',
            key: 'action',
            width: 120,
            render: (_, record) => (
                <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(record)}
                    loading={loading}
                    style={{ width: '100%' }}
                >
                    Delete
                </Button>
            ),
        },
    ];

    const styles = {
        container: {
            padding: '20px',
            backgroundColor: '#1a1a1a',
            minHeight: '100vh',
        },
        card: {
            backgroundColor: '#1f1f1f',
            borderColor: '#303030',
        },
        searchInput: {
            backgroundColor: '#2a2a2a',
            borderColor: '#303030',
            color: '#ffffff',
            marginBottom: '20px',
        },
    };

    return (
        <div style={styles.container}>
            <Card
                title="Delete User"
                style={styles.card}
                headStyle={{ color: '#ffffff', borderBottomColor: '#303030' }}
            >
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Input
                        placeholder="Search by email, name, or ID"
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => handleSearch(e.target.value)}
                        style={styles.searchInput}
                    />
                    <Table
                        columns={columns}
                        dataSource={filteredUsers}
                        loading={loading}
                        rowKey="id"
                        pagination={{ pageSize: 10 }}
                        style={{ color: '#ffffff' }}
                    />
                </Space>
            </Card>
        </div>
    );
};

export default DeleteUsers;
