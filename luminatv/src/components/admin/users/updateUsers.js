import { SearchOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Form, Input, message, Modal, Select, Space, Table } from 'antd';
import { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';

const UpdateUsers = () => {
    const [form] = Form.useForm();
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userRoles, setUserRoles] = useState([]);
    const [allRoles, setAllRoles] = useState([]);

    useEffect(() => {
        fetchUsers();
        fetchAllRoles();
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

    const fetchAllRoles = async () => {
        try {
            const { data, error } = await supabase
                .from('user_roles')
                .select('id, role_name');

            if (error) {
                message.error('Error fetching roles: ' + error.message);
                return;
            }

            setAllRoles(data || []);
        } catch (error) {
            message.error('Error: ' + error.message);
        }
    };

    const fetchUserRoles = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('user_roles_assignment')
                .select('*, user_roles(id, role_name)')
                .eq('user_id', userId);

            if (error) {
                message.error('Error fetching user roles: ' + error.message);
                return;
            }

            setUserRoles(data || []);
        } catch (error) {
            message.error('Error: ' + error.message);
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

    const handleSelectUser = (record) => {
        setSelectedUser(record);
        form.setFieldsValue({
            user_id: record.id,
            email: record.email,
            full_name: `${record.first_name || ''} ${record.last_name || ''}`.trim(),
        });
        fetchUserRoles(record.id);
    };

    const addUserRole = async (values) => {
        try {
            if (!selectedUser) {
                message.error('Please select a user first');
                return;
            }

            if (!values.role_id) {
                message.error('Please select a role');
                return;
            }

            setLoading(true);

            // Check if role is already assigned
            const { data: existingRole } = await supabase
                .from('user_roles_assignment')
                .select('*')
                .eq('user_id', selectedUser.id)
                .eq('role_id', values.role_id);

            if (existingRole && existingRole.length > 0) {
                message.error('This role is already assigned to the user');
                setLoading(false);
                return;
            }

            const { error } = await supabase
                .from('user_roles_assignment')
                .insert([{
                    user_id: selectedUser.id,
                    role_id: values.role_id,
                    assigned_at: new Date().toISOString(),
                }]);

            if (error) {
                message.error('Error assigning role: ' + error.message);
                return;
            }

            message.success('Role assigned successfully!');
            form.setFieldValue('role_id', undefined);
            fetchUserRoles(selectedUser.id);
        } catch (error) {
            message.error('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const removeUserRole = async (roleAssignmentId) => {
        try {
            setLoading(true);

            const { error } = await supabase
                .from('user_roles_assignment')
                .delete()
                .eq('id', roleAssignmentId);

            if (error) {
                message.error('Error removing role: ' + error.message);
                return;
            }

            message.success('Role removed successfully!');
            fetchUserRoles(selectedUser.id);
        } catch (error) {
            message.error('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
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
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = 'green';
                if (status === 'inactive') color = 'orange';
                if (status === 'suspended') color = 'red';
                return <Badge status={color === 'green' ? 'success' : color === 'orange' ? 'warning' : 'error'} text={status} />;
            },
        },
        {
            title: 'Action',
            key: 'action',
            width: 120,
            render: (_, record) => (
                <Button
                    type={selectedUser?.id === record.id ? 'primary' : 'default'}
                    onClick={() => handleSelectUser(record)}
                    style={{
                        background: selectedUser?.id === record.id
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

    const roleColumns = [
        {
            title: 'Role Name',
            dataIndex: ['user_roles', 'role_name'],
            key: 'role_name',
        },
        {
            title: 'Assigned At',
            dataIndex: 'assigned_at',
            key: 'assigned_at',
            render: (date) => new Date(date).toLocaleDateString(),
        },
        {
            title: 'Action',
            key: 'action',
            width: 120,
            render: (_, record) => (
                <Button
                    danger
                    onClick={() => {
                        Modal.confirm({
                            title: 'Remove Role',
                            content: 'Are you sure you want to remove this role?',
                            okText: 'Remove',
                            okType: 'danger',
                            onOk() {
                                removeUserRole(record.id);
                            },
                        });
                    }}
                    loading={loading}
                    style={{ width: '100%' }}
                >
                    Remove
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
    };

    return (
        <div style={styles.container}>
            <div style={{ marginBottom: '20px' }}>
                <Card
                    title="Select User to Manage Roles"
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

            {selectedUser && (
                <>
                    <div style={{ marginBottom: '20px' }}>
                        <Card
                            title={`User Roles: ${selectedUser.email}`}
                            style={styles.card}
                            headStyle={{ color: '#ffffff', borderBottomColor: '#303030' }}
                        >
                            <Table
                                columns={roleColumns}
                                dataSource={userRoles}
                                loading={loading}
                                rowKey="id"
                                pagination={{ pageSize: 5 }}
                                style={{ color: '#ffffff' }}
                            />
                        </Card>
                    </div>

                    <Card
                        title={`Add Role to ${selectedUser.email}`}
                        style={styles.card}
                        headStyle={{ color: '#ffffff', borderBottomColor: '#303030' }}
                    >
                        <Form
                            layout="vertical"
                            onFinish={addUserRole}
                            autoComplete="off"
                        >
                            <Form.Item
                                label="User ID"
                                labelCol={{ style: styles.label }}
                            >
                                <Input
                                    value={selectedUser.id}
                                    style={styles.input}
                                    disabled
                                />
                            </Form.Item>

                            <Form.Item
                                label="Email"
                                labelCol={{ style: styles.label }}
                            >
                                <Input
                                    value={selectedUser.email}
                                    style={styles.input}
                                    disabled
                                />
                            </Form.Item>

                            <Form.Item
                                label="Select Role"
                                name="role_id"
                                labelCol={{ style: styles.label }}
                                rules={[{ required: true, message: 'Please select a role' }]}
                            >
                                <Select
                                    style={{ backgroundColor: '#2a2a2a', borderColor: '#303030' }}
                                    placeholder="Select a role to assign"
                                    options={allRoles.map(role => ({
                                        label: role.role_name,
                                        value: role.id,
                                    }))}
                                />
                            </Form.Item>

                            <Form.Item>
                                <Space>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={loading}
                                        style={styles.button}
                                    >
                                        Assign Role
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setSelectedUser(null);
                                            form.resetFields();
                                        }}
                                        style={{
                                            backgroundColor: '#2a2a2a',
                                            borderColor: '#303030',
                                            color: '#ffffff',
                                        }}
                                    >
                                        Deselect User
                                    </Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </Card>
                </>
            )}
        </div>
    );
};

export default UpdateUsers;
