import { DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Input, Modal, Space, Table, message } from 'antd';
import { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';

const DeleteCategory = () => {
    const [categories, setCategories] = useState([]);
    const [filteredCategories, setFilteredCategories] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                message.error('Error fetching categories: ' + error.message);
                return;
            }

            setCategories(data);
            setFilteredCategories(data);
        } catch (error) {
            message.error('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (value) => {
        setSearchText(value);
        const filtered = categories.filter((category) =>
            category.name.toLowerCase().includes(value.toLowerCase()) ||
            category.id.toString().includes(value)
        );
        setFilteredCategories(filtered);
    };

    const deleteCategory = async (categoryId) => {
        try {
            setLoading(true);

            // First, cascade delete - remove related movies/series that only have this category
            // Note: This depends on your schema - adjust as needed

            // Delete the category
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', categoryId);

            if (error) {
                message.error('Error deleting category: ' + error.message);
                return;
            }

            message.success('Category deleted successfully!');
            fetchCategories();
        } catch (error) {
            message.error('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (record) => {
        Modal.confirm({
            title: 'Delete Category',
            content: `Are you sure you want to delete "${record.name}"? This action cannot be undone.`,
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk() {
                deleteCategory(record.id);
            },
        });
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
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
            width: 200,
            ellipsis: true,
        },
        {
            title: 'Color',
            dataIndex: 'color_code',
            key: 'color_code',
            width: 100,
            render: (color) => (
                <div
                    style={{
                        width: '30px',
                        height: '30px',
                        backgroundColor: color || '#001a4d',
                        borderRadius: '4px',
                        border: '1px solid #303030',
                    }}
                />
            ),
        },
        {
            title: 'Display Order',
            dataIndex: 'display_order',
            key: 'display_order',
            sorter: (a, b) => a.display_order - b.display_order,
        },
        {
            title: 'Action',
            key: 'action',
            width: 120,
            render: (_, record) => (
                <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(record)}
                    loading={loading}
                    style={{ width: '100%' }}
                >
                    Delete
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
    };

    return (
        <div style={styles.container}>
            <Card
                title="Delete Category"
                style={styles.card}
                headStyle={{ color: '#ffffff', borderBottomColor: '#303030' }}
            >
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Input
                        placeholder="Search by name or ID"
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => handleSearch(e.target.value)}
                        style={styles.searchInput}
                    />
                    <Table
                        columns={columns}
                        dataSource={filteredCategories}
                        loading={loading}
                        rowKey="id"
                        pagination={{ pageSize: 10 }}
                        style={{ color: '#ffffff' }}
                    />
                </Space>
            </Card>
        </div>
    );
};

export default DeleteCategory;
