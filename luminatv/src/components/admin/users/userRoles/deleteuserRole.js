import { DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Input, Modal, Space, Table, message } from 'antd';
import { useEffect, useState } from 'react';
import { supabase } from '../../../../supabaseClient';

const DeleteUserRole = () => {
    const [roles, setRoles] = useState([]);
    const [filteredRoles, setFilteredRoles] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('user_roles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                message.error('Error fetching roles: ' + error.message);
                return;
            }

            setRoles(data);
            setFilteredRoles(data);
        } catch (error) {
            message.error('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (value) => {
        setSearchText(value);
        const filtered = roles.filter((role) =>
            role.role_name.toLowerCase().includes(value.toLowerCase()) ||
            role.id.toString().includes(value)
        );
        setFilteredRoles(filtered);
    };

    const deleteRole = async (roleId) => {
        try {
            setLoading(true);

            // First, remove all user role assignments
            const { error: assignmentError } = await supabase
                .from('user_roles_assignment')
                .delete()
                .eq('role_id', roleId);

            if (assignmentError) {
                message.error('Error removing role assignments: ' + assignmentError.message);
                return;
            }

            // Delete the role
            const { error } = await supabase
                .from('user_roles')
                .delete()
                .eq('id', roleId);

            if (error) {
                message.error('Error deleting role: ' + error.message);
                return;
            }

            message.success('Role deleted successfully!');
            fetchRoles();
        } catch (error) {
            message.error('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (record) => {
        Modal.confirm({
            title: 'Delete Role',
            content: `Are you sure you want to delete "${record.role_name}"? This action cannot be undone.`,
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk() {
                deleteRole(record.id);
            },
        });
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
        },
        {
            title: 'Role Name',
            dataIndex: 'role_name',
            key: 'role_name',
            sorter: (a, b) => a.role_name.localeCompare(b.role_name),
        },
        {
            title: 'Slug',
            dataIndex: 'slug',
            key: 'slug',
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            width: 250,
            ellipsis: true,
        },
        {
            title: 'Status',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (active) => <span style={{ color: active ? 'green' : 'red' }}>{active ? 'Active' : 'Inactive'}</span>,
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
                title="Delete User Role"
                style={styles.card}
                headStyle={{ color: '#ffffff', borderBottomColor: '#303030' }}
            >
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Input
                        placeholder="Search by role name or ID"
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => handleSearch(e.target.value)}
                        style={styles.searchInput}
                    />
                    <Table
                        columns={columns}
                        dataSource={filteredRoles}
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

export default DeleteUserRole;
