import React, { useState } from 'react';
import { Form, Input, Button, Card, Space, message, Checkbox } from 'antd';
import { supabase } from '../../../../supabaseClient';
import dayjs from 'dayjs';

const AddUserRole = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

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

    const generateSlug = (text) => {
        return text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    };

    const handleNameChange = (e) => {
        const slug = generateSlug(e.target.value);
        form.setFieldValue('slug', slug);
    };

    const onSubmit = async (values) => {
        try {
            setLoading(true);

            const selectedPermissions = values.permissions || [];

            const roleData = {
                role_name: values.role_name,
                slug: values.slug,
                description: values.description || '',
                permissions: selectedPermissions,
                is_active: true,
                created_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                updated_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            };

            const { data, error } = await supabase
                .from('user_roles')
                .insert([roleData]);

            if (error) {
                message.error('Error creating role: ' + error.message);
                return;
            }

            message.success('Role created successfully!');
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
        button: {
            background: 'linear-gradient(135deg, #001a4d 0%, #000000 100%)',
            borderColor: 'transparent',
            color: '#ffffff',
            height: '35px',
            fontSize: '14px',
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
                title="Add New User Role"
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
                        label="Role Name"
                        name="role_name"
                        labelCol={{ style: styles.label }}
                        rules={[{ required: true, message: 'Please enter role name' }]}
                    >
                        <Input
                            placeholder="e.g., Admin, Content Manager, Finance Officer"
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
                            placeholder="Role description and responsibilities"
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
                                Create Role
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

export default AddUserRole;
