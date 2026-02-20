import { Button, Card, ColorPicker, Form, Input, InputNumber, Space, message } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { supabase } from '../../../supabaseClient';

const AddCategory = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

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

            const categoryData = {
                name: values.name,
                description: values.description || '',
                slug: values.slug,
                color_code: values.color_code ? values.color_code.toHexString() : '#001a4d',
                display_order: values.display_order || 0,
                created_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                updated_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            };

            const { data, error } = await supabase
                .from('categories')
                .insert([categoryData]);

            if (error) {
                message.error('Error creating category: ' + error.message);
                return;
            }

            message.success('Category created successfully!');
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
    };

    return (
        <div style={styles.container}>
            <Card
                title="Add New Category"
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
                        label="Category Name"
                        name="name"
                        labelCol={{ style: styles.label }}
                        rules={[{ required: true, message: 'Please enter category name' }]}
                    >
                        <Input
                            placeholder="e.g., Action, Comedy, Drama"
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
                            placeholder="Category description"
                            rows={4}
                            style={styles.input}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Color Code"
                        name="color_code"
                        labelCol={{ style: styles.label }}
                    >
                        <ColorPicker />
                    </Form.Item>

                    <Form.Item
                        label="Display Order"
                        name="display_order"
                        labelCol={{ style: styles.label }}
                    >
                        <InputNumber
                            placeholder="0"
                            style={{ backgroundColor: '#2a2a2a', borderColor: '#303030', color: '#ffffff' }}
                            min={0}
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
                                Create Category
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

export default AddCategory;
