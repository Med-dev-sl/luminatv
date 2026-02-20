import { Button, Card, Form, Input, Space, message } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { supabase } from '../../../supabaseClient';

const AddGenres = () => {
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

            const genreData = {
                name: values.name,
                slug: values.slug,
                description: values.description || '',
                created_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                updated_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            };

            const { data, error } = await supabase
                .from('genres')
                .insert([genreData]);

            if (error) {
                message.error('Error creating genre: ' + error.message);
                return;
            }

            message.success('Genre created successfully!');
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
                title="Add New Genre"
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
                        label="Genre Name"
                        name="name"
                        labelCol={{ style: styles.label }}
                        rules={[{ required: true, message: 'Please enter genre name' }]}
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
                            placeholder="Genre description"
                            rows={4}
                            style={styles.input}
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
                                Create Genre
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

export default AddGenres;
