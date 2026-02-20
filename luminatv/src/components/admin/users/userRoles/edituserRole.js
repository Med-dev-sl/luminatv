import { EditOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Checkbox, Drawer, Form, Input, message, Space, Table } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { supabase } from '../../../../supabaseClient';

const EditUserRole = () => {
    const [form] = Form.useForm();
    const [roles, setRoles] = useState([]);
    const [filteredRoles, setFilteredRoles] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);
    const [drawerVisible, setDrawerVisible] = useState(false);
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

    const generateSlug = (text) => {
        return text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    };

    const handleEdit = (record) => {
        setSelectedRole(record);
        form.setFieldsValue({
            role_name: record.role_name,
            slug: record.slug,
            description: record.description,
            permissions: record.permissions || [],
        });
        setDrawerVisible(true);
    };

    const handleNameChange = (e) => {
        const slug = generateSlug(e.target.value);
        form.setFieldValue('slug', slug);
    };

    const onSubmit = async (values) => {
        try {
            setLoading(true);

            const roleData = {
                role_name: values.role_name,
                description: values.description || '',
                slug: values.slug,
                permissions: values.permissions || [],
                updated_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            };

            const { error } = await supabase
                .from('user_roles')
                .update(roleData)
                .eq('id', selectedRole.id);

            if (error) {
                message.error('Error updating role: ' + error.message);
                return;
            }

            message.success('Role updated successfully!');
            setDrawerVisible(false);
            fetchRoles();
        } catch (error) {
            message.error('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
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
            <Card
                title="Edit User Role"
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

            <Drawer
                title="Edit User Role"
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
                        label="Role Name"
                        name="role_name"
                        labelCol={{ style: styles.label }}
                        rules={[{ required: true, message: 'Please enter role name' }]}
                    >
                        <Input
                            placeholder="e.g., Admin, Content Manager"
                            onChange={handleNameChange}
                            style={styles.input}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Slug"
                        name="slug"
                        labelCol={{ style: styles.label }}
                        rules={[{ required: true, message: 'Slug is required' }]}
                    >
                        <Input
                            placeholder="auto-generated"
                            style={styles.input}
                            disabled
                        />
                    </Form.Item>

                    <Form.Item
                        label="Description"
                        name="description"
                        labelCol={{ style: styles.label }}
                    >
                        <Input.TextArea
                            placeholder="Role description"
                            rows={4}
                            style={styles.input}
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
                                Update Role
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

export default EditUserRole;
