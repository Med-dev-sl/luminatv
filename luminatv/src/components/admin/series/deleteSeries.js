import { DeleteOutlined } from '@ant-design/icons';
import { Button, Card, message, Modal, Space, Table } from 'antd';
import { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';

const DeleteSeries = () => {
    const [loading, setLoading] = useState(false);
    const [series, setSeries] = useState([]);

    useEffect(() => {
        fetchSeries();
    }, []);

    const fetchSeries = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('series')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setSeries(data || []);
        } catch (error) {
            message.error('Failed to load series');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id, title) => {
        Modal.confirm({
            title: 'Delete Series',
            content: `Are you sure you want to delete "${title}"? This action cannot be undone.`,
            okText: 'Delete',
            okType: 'danger',
            async onOk() {
                try {
                    setLoading(true);
                    const { error } = await supabase
                        .from('series')
                        .delete()
                        .eq('id', id);
                    if (error) throw error;
                    message.success('Series deleted successfully');
                    fetchSeries();
                } catch (error) {
                    message.error('Failed to delete series');
                    console.error(error);
                } finally {
                    setLoading(false);
                }
            },
        });
    };

    const columns = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            width: 150,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 100,
        },
        {
            title: 'Seasons',
            dataIndex: 'total_seasons',
            key: 'total_seasons',
            width: 100,
        },
        {
            title: 'Episodes',
            dataIndex: 'total_episodes',
            key: 'total_episodes',
            width: 100,
        },
        {
            title: 'Rating',
            dataIndex: 'rating',
            key: 'rating',
            width: 100,
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
                        onClick={() => handleDelete(record.id, record.title)}
                    >
                        Delete
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <Card
            title="Delete Series"
            loading={loading}
        >
            <Table
                columns={columns}
                dataSource={series}
                rowKey="id"
                loading={loading}
                scroll={{ x: 800 }}
            />
        </Card>
    );
};

export default DeleteSeries;
