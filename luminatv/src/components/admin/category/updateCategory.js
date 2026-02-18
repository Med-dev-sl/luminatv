import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Space, message, Table, Upload, Progress } from 'antd';
import { UploadOutlined, SearchOutlined } from '@ant-design/icons';
import { supabase } from '../../../supabaseClient';

const UpdateCategory = () => {
    const [form] = Form.useForm();
    const [categories, setCategories] = useState([]);
    const [filteredCategories, setFilteredCategories] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

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

    const handleSelectCategory = (record) => {
        setSelectedCategory(record);
        form.setFieldsValue({
            category_id: record.id,
            category_name: record.name,
        });
    };

    const uploadCategoryIcon = async (file) => {
        try {
            if (!selectedCategory) {
                message.error('Please select a category first');
                return false;
            }

            setLoading(true);
            setUploadProgress(0);

            const fileName = `category_${selectedCategory.id}_${Date.now()}_icon.png`;

            // Simulate progress
            const progressInterval = setInterval(() => {
                setUploadProgress((prev) => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return prev;
                    }
                    return prev + Math.random() * 30;
                });
            }, 300);

            const { data, error: uploadError } = await supabase.storage
                .from('Category_Icons')
                .upload(fileName, file);

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (uploadError) {
                message.error('Upload failed: ' + uploadError.message);
                return false;
            }

            // Get public URL
            const { data: publicUrlData } = supabase.storage
                .from('Category_Icons')
                .getPublicUrl(fileName);

            // Update category with icon URL
            const { error: updateError } = await supabase
                .from('categories')
                .update({
                    icon_url: publicUrlData.publicUrl,
                })
                .eq('id', selectedCategory.id);

            if (updateError) {
                message.error('Error updating category icon: ' + updateError.message);
                return false;
            }

            message.success('Category icon uploaded successfully!');
            setUploadProgress(0);
            fetchCategories();
            setSelectedCategory(null);
            form.resetFields();
            return false;
        } catch (error) {
            message.error('Error: ' + error.message);
            return false;
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
            title: 'Icon',
            dataIndex: 'icon_url',
            key: 'icon_url',
            width: 100,
            render: (icon) =>
                icon ? (
                    <img
                        src={icon}
                        alt="category-icon"
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '4px',
                            objectFit: 'cover',
                        }}
                    />
                ) : (
                    <span style={{ color: '#8c8c8c' }}>No icon</span>
                ),
        },
        {
            title: 'Action',
            key: 'action',
            width: 120,
            render: (_, record) => (
                <Button
                    type={selectedCategory?.id === record.id ? 'primary' : 'default'}
                    onClick={() => handleSelectCategory(record)}
                    style={{
                        background: selectedCategory?.id === record.id
                            ? 'linear-gradient(135deg, #001a4d 0%, #000000 100%)'
                            : '#2a2a2a',
                        borderColor: '#303030',
                        color: '#ffffff',
                        width: '100%',
                    }}
                >
                    Select
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
        button: {
            background: 'linear-gradient(135deg, #001a4d 0%, #000000 100%)',
            borderColor: 'transparent',
            color: '#ffffff',
        },
    };

    return (
        <div style={styles.container}>
            <div style={{ marginBottom: '20px' }}>
                <Card
                    title="Select Category to Update"
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

            {selectedCategory && (
                <Card
                    title={`Update Category: ${selectedCategory.name}`}
                    style={styles.card}
                    headStyle={{ color: '#ffffff', borderBottomColor: '#303030' }}
                >
                    <Form
                        form={form}
                        layout="vertical"
                        autoComplete="off"
                    >
                        <Form.Item
                            label="Category ID"
                            name="category_id"
                            labelCol={{ style: styles.label }}
                        >
                            <Input style={styles.input} disabled />
                        </Form.Item>

                        <Form.Item
                            label="Category Name"
                            name="category_name"
                            labelCol={{ style: styles.label }}
                        >
                            <Input style={styles.input} disabled />
                        </Form.Item>

                        <Form.Item
                            label="Category Icon"
                            labelCol={{ style: styles.label }}
                        >
                            <Upload
                                beforeUpload={(file) => {
                                    const isImage = file.type.startsWith('image/');
                                    if (!isImage) {
                                        message.error('Only image files are allowed!');
                                        return false;
                                    }
                                    uploadCategoryIcon(file);
                                    return false;
                                }}
                                maxCount={1}
                                accept="image/*"
                            >
                                <Button
                                    icon={<UploadOutlined />}
                                    style={{
                                        backgroundColor: '#2a2a2a',
                                        borderColor: '#303030',
                                        color: '#ffffff',
                                    }}
                                >
                                    Upload Icon
                                </Button>
                            </Upload>
                        </Form.Item>

                        {uploadProgress > 0 && (
                            <Form.Item label="Upload Progress" labelCol={{ style: styles.label }}>
                                <Progress percent={Math.round(uploadProgress)} status="active" />
                            </Form.Item>
                        )}

                        <Form.Item>
                            <Button
                                onClick={() => {
                                    setSelectedCategory(null);
                                    form.resetFields();
                                }}
                                style={{
                                    backgroundColor: '#2a2a2a',
                                    borderColor: '#303030',
                                    color: '#ffffff',
                                }}
                            >
                                Deselect Category
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            )}
        </div>
    );
};

export default UpdateCategory;
