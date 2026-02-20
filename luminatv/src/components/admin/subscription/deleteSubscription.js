import { DeleteOutlined } from '@ant-design/icons';
import { Button, Card, message, Modal, Space, Table } from 'antd';
import { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';

const DeleteSubscription = () => {
    const [loading, setLoading] = useState(false);
    const [subscriptions, setSubscriptions] = useState([]);

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

    const handleDelete = (id, name) => {
        Modal.confirm({
            title: 'Delete Subscription',
            content: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
            okText: 'Delete',
            okType: 'danger',
            async onOk() {
                try {
                    setLoading(true);
                    const { error } = await supabase
                        .from('subscription_plans')
                        .delete()
                        .eq('id', id);
                    if (error) throw error;
                    message.success('Subscription deleted successfully');
                    fetchSubscriptions();
                } catch (error) {
                    message.error('Failed to delete subscription');
                    console.error(error);
                } finally {
                    setLoading(false);
                }
            },
        });
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
            width: 100,
            render: (_, record) => (
                <Space>
                    <Button
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                        onClick={() => handleDelete(record.id, record.name)}
                    >
                        Delete
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <Card
            title="Delete Subscription Plans"
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
    );
};

export default DeleteSubscription;
