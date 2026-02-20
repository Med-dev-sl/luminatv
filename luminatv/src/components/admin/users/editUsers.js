import { EditOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Drawer, Form, Input, message, Select, Space, Table } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';

const EditUsers = () => {
    const [form] = Form.useForm();
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [roles, setRoles] = useState([]);

    useEffect(() => {
        fetchUsers();
        fetchRoles();
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

    const fetchRoles = async () => {
        try {
            const { data, error } = await supabase
                .from('user_roles')
                .select('id, role_name');

            if (error) {
                message.error('Error fetching roles: ' + error.message);
                return;
            }

            setRoles(data || []);
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

    const handleEdit = (record) => {
        setSelectedUser(record);
        form.setFieldsValue({
            email: record.email,
            first_name: record.first_name,
            last_name: record.last_name,
            phone: record.phone,
            country: record.country,
            status: record.status,
        });
        setDrawerVisible(true);
    };

    const onSubmit = async (values) => {
        try {
            setLoading(true);

            const userData = {
                email: values.email,
                first_name: values.first_name || '',
                last_name: values.last_name || '',
                phone: values.phone || '',
                country: values.country || '',
                status: values.status || 'active',
                updated_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            };

            const { error } = await supabase
                .from('users')
                .update(userData)
                .eq('id', selectedUser.id);

            if (error) {
                message.error('Error updating user: ' + error.message);
                return;
            }

            message.success('User updated successfully!');
            setDrawerVisible(false);
            fetchUsers();
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
            title: 'Phone',
            dataIndex: 'phone',
            key: 'phone',
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
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(record)}
                    style={{
                        background: 'linear-gradient(135deg, #001a4d 0%, #000000 100%)',
                        borderColor: 'transparent',
                        width: '100%',
                    }}
                >
                    Edit
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
        drawer: {
            backgroundColor: '#1f1f1f',
        },
        button: {
            background: 'linear-gradient(135deg, #001a4d 0%, #000000 100%)',
            borderColor: 'transparent',
            color: '#ffffff',
        },
    };

    return (
        <div style={styles.container}>
            <Card
                title="Edit User"
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

            <Drawer
                title="Edit User"
                placement="right"
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
                contentWrapperStyle={{ backgroundColor: '#1f1f1f' }}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onSubmit}
                    autoComplete="off"
                >
                    <Form.Item
                        label="Email"
                        name="email"
                        labelCol={{ style: styles.label }}
                        rules={[
                            { required: true, message: 'Please enter email' },
                            { type: 'email', message: 'Invalid email format' }
                        ]}
                    >
                        <Input
                            placeholder="user@example.com"
                            style={styles.input}
                        />
                    </Form.Item>

                    <Form.Item
                        label="First Name"
                        name="first_name"
                        labelCol={{ style: styles.label }}
                    >
                        <Input
                            placeholder="First name"
                            style={styles.input}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Last Name"
                        name="last_name"
                        labelCol={{ style: styles.label }}
                    >
                        <Input
                            placeholder="Last name"
                            style={styles.input}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Phone"
                        name="phone"
                        labelCol={{ style: styles.label }}
                    >
                        <Input
                            placeholder="Phone number"
                            style={styles.input}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Country"
                        name="country"
                        labelCol={{ style: styles.label }}
                    >
                        <Input
                            placeholder="Country"
                            style={styles.input}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Status"
                        name="status"
                        labelCol={{ style: styles.label }}
                    >
                        <Select
                            style={{ backgroundColor: '#2a2a2a', borderColor: '#303030' }}
                            options={[
                                { label: 'Active', value: 'active' },
                                { label: 'Inactive', value: 'inactive' },
                                { label: 'Suspended', value: 'suspended' },
                            ]}
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
                                Update User
                            </Button>
                            <Button
                                onClick={() => setDrawerVisible(false)}
                                style={{
                                    backgroundColor: '#2a2a2a',
                                    borderColor: '#303030',
                                    color: '#ffffff',
                                }}
                            >
                                Cancel
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Drawer>
        </div>
    );
};

export default EditUsers;
