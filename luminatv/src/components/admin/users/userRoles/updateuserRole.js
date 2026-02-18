import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Space, message, Table, Checkbox } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { supabase } from '../../../../supabaseClient';
import dayjs from 'dayjs';

const UpdateUserRole = () => {
    const [form] = Form.useForm();
    const [roles, setRoles] = useState([]);
    const [filteredRoles, setFilteredRoles] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);

    const permissionsList = [
        { key: 'manage_users', label: 'Manage Users' },
        { key: 'manage_content', label: 'Manage Content (Movies/Series)' },
        { key: 'manage_categories', label: 'Manage Categories' },
        { key: 'manage_genres', label: 'Manage Genres' },
        { key: 'manage_casts', label: 'Manage Casts' },
        { key: 'manage_subscriptions', label: 'Manage Subscriptions' },
        { key: 'manage_payments', label: 'Manage Payments' },
        { key: 'view_analytics', label: 'View Analytics' },
        { key: 'view_reports', label: 'View Reports' },
    ];

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

    const handleSelectRole = (record) => {
        setSelectedRole(record);
        form.setFieldsValue({
            role_id: record.id,
            role_name: record.role_name,
            permissions: record.permissions || [],
        });
    };

    const onSubmit = async (values) => {
        try {
            if (!selectedRole) {
                message.error('Please select a role first');
                return;
            }

            setLoading(true);

            const roleData = {
                permissions: values.permissions || [],
                updated_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            };

            const { error } = await supabase
                .from('user_roles')
                .update(roleData)
                .eq('id', selectedRole.id);

            if (error) {
                message.error('Error updating role permissions: ' + error.message);
                return;
            }

            message.success('Role permissions updated successfully!');
            fetchRoles();
            setSelectedRole(null);
            form.resetFields();
        } catch (error) {
            message.error('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Role Name',
            dataIndex: 'role_name',
            key: 'role_name',
            sorter: (a, b) => a.role_name.localeCompare(b.role_name),
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            width: 250,
            ellipsis: true,
        },
        {
            title: 'Permissions Count',
            dataIndex: 'permissions',
            key: 'permissions',
            render: (perms) => (perms ? perms.length : 0),
        },
        {
            title: 'Action',
            key: 'action',
            width: 120,
            render: (_, record) => (
                <Button
                    type={selectedRole?.id === record.id ? 'primary' : 'default'}
                    onClick={() => handleSelectRole(record)}
                    style={{
                        background: selectedRole?.id === record.id
                            ? 'linear-gradient(135deg, #001a4d 0%, #000000 100%)'
                            : '#2a2a2a',
                        borderColor: '#303030',
                        color: '#ffffff',
                        width: '100%',
                    }}
                >
                    Select
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
        label: {
            color: '#ffffff',
        },
        input: {
            backgroundColor: '#2a2a2a',
            borderColor: '#303030',
            color: '#ffffff',
        },
        button: {
            background: 'linear-gradient(135deg, #001a4d 0%, #000000 100%)',
            borderColor: 'transparent',
            color: '#ffffff',
        },
        permissionsContainer: {
            backgroundColor: '#2a2a2a',
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid #303030',
        },
        checkboxLabel: {
            color: '#ffffff',
        },
    };

    return (
        <div style={styles.container}>
            <div style={{ marginBottom: '20px' }}>
                <Card
                    title="Select Role to Update Permissions"
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

            {selectedRole && (
                <Card
                    title={`Update Permissions: ${selectedRole.role_name}`}
                    style={styles.card}
                    headStyle={{ color: '#ffffff', borderBottomColor: '#303030' }}
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onSubmit}
                        autoComplete="off"
                    >
                        <Form.Item
                            label="Role ID"
                            labelCol={{ style: styles.label }}
                        >
                            <Input
                                value={selectedRole.id}
                                style={styles.input}
                                disabled
                            />
                        </Form.Item>

                        <Form.Item
                            label="Role Name"
                            labelCol={{ style: styles.label }}
                        >
                            <Input
                                value={selectedRole.role_name}
                                style={styles.input}
                                disabled
                            />
                        </Form.Item>

                        <Form.Item
                            label="Permissions"
                            name="permissions"
                            labelCol={{ style: styles.label }}
                        >
                            <div style={styles.permissionsContainer}>
                                <Checkbox.Group
                                    options={permissionsList.map(perm => ({
                                        label: <span style={styles.checkboxLabel}>{perm.label}</span>,
                                        value: perm.key,
                                    }))}
                                    style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                                />
                            </div>
                        </Form.Item>

                        <Form.Item>
                            <Space>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                    style={styles.button}
                                >
                                    Update Permissions
                                </Button>
                                <Button
                                    onClick={() => {
                                        setSelectedRole(null);
                                        form.resetFields();
                                    }}
                                    style={{
                                        backgroundColor: '#2a2a2a',
                                        borderColor: '#303030',
                                        color: '#ffffff',
                                    }}
                                >
                                    Deselect
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Card>
            )}
        </div>
    );
};

export default UpdateUserRole;
