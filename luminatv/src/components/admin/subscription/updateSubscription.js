import { SwapOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, InputNumber, message, Modal, Select, Space, Table } from 'antd';
import { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';

const UpdateSubscription = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [subscriptions, setSubscriptions] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingSubscription, setEditingSubscription] = useState(null);

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const fetchSubscriptions = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('subscription_plans')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setSubscriptions(data || []);
        } catch (error) {
            message.error('Failed to load subscriptions');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = (subscription) => {
        setEditingSubscription(subscription);
        form.setFieldsValue(subscription);
        setIsModalVisible(true);
    };

    const handleUpdateSubscription = async (values) => {
        try {
            setLoading(true);
            const { error } = await supabase
                .from('subscription_plans')
                .update({
                    name: values.name,
                    description: values.description,
                    slug: values.slug,
                    price: values.price,
                    currency: values.currency,
                    billing_cycle: values.billing_cycle,
                    duration_days: values.duration_days,
                    max_concurrent_streams: values.max_concurrent_streams,
                    video_quality: values.video_quality,
                    ad_supported: values.ad_supported,
                    is_active: values.is_active,
                    display_order: values.display_order,
                })
                .eq('id', editingSubscription.id);
            
            if (error) throw error;
            message.success('Subscription updated successfully');
            setIsModalVisible(false);
            fetchSubscriptions();
        } catch (error) {
            message.error('Failed to update subscription');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            width: 150,
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            width: 100,
            render: (price, record) => `${record.currency} ${price}`,
        },
        {
            title: 'Billing Cycle',
            dataIndex: 'billing_cycle',
            key: 'billing_cycle',
            width: 120,
        },
        {
            title: 'Duration (Days)',
            dataIndex: 'duration_days',
            key: 'duration_days',
            width: 120,
        },
        {
            title: 'Streams',
            dataIndex: 'max_concurrent_streams',
            key: 'max_concurrent_streams',
            width: 100,
        },
        {
            title: 'Quality',
            dataIndex: 'video_quality',
            key: 'video_quality',
            width: 100,
        },
        {
            title: 'Status',
            dataIndex: 'is_active',
            key: 'is_active',
            width: 100,
            render: (is_active) => is_active ? 'Active' : 'Inactive',
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 120,
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        icon={<SwapOutlined />}
                        size="small"
                        onClick={() => handleUpdate(record)}
                    >
                        Update
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Card
                title="Update Subscription Plans"
                loading={loading}
            >
                <Table
                    columns={columns}
                    dataSource={subscriptions}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 1000 }}
                />
            </Card>

            <Modal
                title="Update Subscription Plan"
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                width={700}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleUpdateSubscription}
                >
                    <Form.Item
                        name="name"
                        label="Plan Name"
                        rules={[{ required: true, message: 'Please enter plan name' }]}
                    >
                        <Input placeholder="e.g., Premium Monthly" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Description"
                    >
                        <Input.TextArea rows={3} placeholder="Plan description" />
                    </Form.Item>

                    <Form.Item
                        name="slug"
                        label="Slug"
                    >
                        <Input placeholder="e.g., premium-monthly" />
                    </Form.Item>

                    <Form.Item
                        name="price"
                        label="Price"
                        rules={[{ required: true, message: 'Please enter price' }]}
                    >
                        <InputNumber placeholder="0.00" step={0.01} min={0} />
                    </Form.Item>

                    <Form.Item
                        name="currency"
                        label="Currency"
                    >
                        <Input placeholder="USD" />
                    </Form.Item>

                    <Form.Item
                        name="billing_cycle"
                        label="Billing Cycle"
                        rules={[{ required: true, message: 'Please select billing cycle' }]}
                    >
                        <Select placeholder="Select billing cycle">
                            <Select.Option value="monthly">Monthly</Select.Option>
                            <Select.Option value="yearly">Yearly</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="duration_days"
                        label="Duration (Days)"
                        rules={[{ required: true, message: 'Please enter duration' }]}
                    >
                        <InputNumber placeholder="30" min={1} />
                    </Form.Item>

                    <Form.Item
                        name="max_concurrent_streams"
                        label="Max Concurrent Streams"
                    >
                        <InputNumber placeholder="1" min={1} />
                    </Form.Item>

                    <Form.Item
                        name="video_quality"
                        label="Video Quality"
                    >
                        <Select placeholder="Select quality">
                            <Select.Option value="480p">480p</Select.Option>
                            <Select.Option value="720p">720p</Select.Option>
                            <Select.Option value="1080p">1080p</Select.Option>
                            <Select.Option value="4K">4K</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="is_active"
                        label="Status"
                    >
                        <Select placeholder="Select status">
                            <Select.Option value={true}>Active</Select.Option>
                            <Select.Option value={false}>Inactive</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="display_order"
                        label="Display Order"
                    >
                        <InputNumber placeholder="0" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block>
                            Update Subscription Plan
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default UpdateSubscription;
