import { Button, Card, Form, Input, message, Select, Space } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';

const AddUsers = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [roles, setRoles] = useState([]);

    useEffect(() => {
        fetchRoles();
    }, []);

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

    const onSubmit = async (values) => {
        try {
            setLoading(true);

            // First, create the user in auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: values.email,
                password: values.password,
            });

            if (authError) {
                message.error('Error creating auth user: ' + authError.message);
                return;
            }

            // Then create user record in users table
            const userData = {
                id: authData.user?.id,
                email: values.email,
                first_name: values.first_name || '',
                last_name: values.last_name || '',
                phone: values.phone || '',
                country: values.country || '',
                status: values.status || 'active',
                created_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                updated_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            };

            const { error: userError } = await supabase
                .from('users')
                .insert([userData]);

            if (userError) {
                message.error('Error creating user record: ' + userError.message);
                return;
            }

            // Assign role to user if provided
            if (values.role_id) {
                const { error: roleError } = await supabase
                    .from('user_roles_assignment')
                    .insert([{
                        user_id: authData.user?.id,
                        role_id: values.role_id,
                        assigned_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                    }]);

                if (roleError) {
                    message.error('Error assigning role: ' + roleError.message);
                    return;
                }
            }

            message.success('User created successfully!');
            form.resetFields();
        } catch (error) {
            message.error('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const styles = {
        container: {
            padding: '20px',
            backgroundColor: '#1a1a1a',
            minHeight: '100vh',
        },
        card: {
            backgroundColor: '#1f1f1f',
            borderColor: '#303030',
            color: '#ffffff',
        },
        label: {
            color: '#ffffff',
        },
        input: {
            backgroundColor: '#2a2a2a',
            borderColor: '#303030',
            color: '#ffffff',
        },
        select: {
            backgroundColor: '#2a2a2a',
            borderColor: '#303030',
        },
        button: {
            background: 'linear-gradient(135deg, #001a4d 0%, #000000 100%)',
            borderColor: 'transparent',
            color: '#ffffff',
            height: '35px',
            fontSize: '14px',
        },
    };

    return (
        <div style={styles.container}>
            <Card
                title="Add New User"
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
                        label="Password"
                        name="password"
                        labelCol={{ style: styles.label }}
                        rules={[
                            { required: true, message: 'Please enter password' },
                            { min: 6, message: 'Password must be at least 6 characters' }
                        ]}
                    >
                        <Input.Password
                            placeholder="Enter password"
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
                        initialValue="active"
                    >
                        <Select
                            style={styles.select}
                            options={[
                                { label: 'Active', value: 'active' },
                                { label: 'Inactive', value: 'inactive' },
                                { label: 'Suspended', value: 'suspended' },
                            ]}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Assign Role (Optional)"
                        name="role_id"
                        labelCol={{ style: styles.label }}
                    >
                        <Select
                            style={styles.select}
                            placeholder="Select a role"
                            options={roles.map(role => ({
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
                                Create User
                            </Button>
                            <Button
                                onClick={() => form.resetFields()}
                                style={{
                                    backgroundColor: '#2a2a2a',
                                    borderColor: '#303030',
                                    color: '#ffffff',
                                }}
                            >
                                Reset
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default AddUsers;
