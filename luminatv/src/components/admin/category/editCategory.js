import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Space, message, Table, Drawer, ColorPicker, InputNumber } from 'antd';
import { EditOutlined, SearchOutlined } from '@ant-design/icons';
import { supabase } from '../../../supabaseClient';
import dayjs from 'dayjs';

const EditCategory = () => {
    const [form] = Form.useForm();
    const [categories, setCategories] = useState([]);
    const [filteredCategories, setFilteredCategories] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);

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

    const generateSlug = (text) => {
        return text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    };

    const handleEdit = (record) => {
        setSelectedCategory(record);
        form.setFieldsValue({
            name: record.name,
            slug: record.slug,
            description: record.description,
            color_code: record.color_code,
            display_order: record.display_order,
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

            const categoryData = {
                name: values.name,
                description: values.description || '',
                slug: values.slug,
                color_code: values.color_code ? values.color_code.toHexString() : '#001a4d',
                display_order: values.display_order || 0,
                updated_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            };

            const { error } = await supabase
                .from('categories')
                .update(categoryData)
                .eq('id', selectedCategory.id);

            if (error) {
                message.error('Error updating category: ' + error.message);
                return;
            }

            message.success('Category updated successfully!');
            setDrawerVisible(false);
            fetchCategories();
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
                title="Edit Category"
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

            <Drawer
                title="Edit Category"
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
                                Update Category
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

export default EditCategory;
