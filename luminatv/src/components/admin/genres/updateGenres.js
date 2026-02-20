import { SearchOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, message, Space, Table } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';

const UpdateGenres = () => {
    const [form] = Form.useForm();
    const [genres, setGenres] = useState([]);
    const [filteredGenres, setFilteredGenres] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedGenre, setSelectedGenre] = useState(null);
    const [updateData, setUpdateData] = useState({});

    useEffect(() => {
        fetchGenres();
    }, []);

    const fetchGenres = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('genres')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                message.error('Error fetching genres: ' + error.message);
                return;
            }

            setGenres(data);
            setFilteredGenres(data);
        } catch (error) {
            message.error('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (value) => {
        setSearchText(value);
        const filtered = genres.filter((genre) =>
            genre.name.toLowerCase().includes(value.toLowerCase()) ||
            genre.id.toString().includes(value)
        );
        setFilteredGenres(filtered);
    };

    const handleSelectGenre = (record) => {
        setSelectedGenre(record);
        form.setFieldsValue({
            genre_id: record.id,
            genre_name: record.name,
            description: record.description,
            slug: record.slug,
        });
        setUpdateData({});
    };

    const onSubmit = async (values) => {
        try {
            if (!selectedGenre) {
                message.error('Please select a genre first');
                return;
            }

            setLoading(true);

            const genreData = {
                name: values.genre_name || selectedGenre.name,
                description: values.description || selectedGenre.description || '',
                slug: values.slug || selectedGenre.slug,
                updated_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            };

            const { error } = await supabase
                .from('genres')
                .update(genreData)
                .eq('id', selectedGenre.id);

            if (error) {
                message.error('Error updating genre: ' + error.message);
                return;
            }

            message.success('Genre updated successfully!');
            fetchGenres();
            setSelectedGenre(null);
            form.resetFields();
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
            width: 250,
            ellipsis: true,
        },
        {
            title: 'Action',
            key: 'action',
            width: 120,
            render: (_, record) => (
                <Button
                    type={selectedGenre?.id === record.id ? 'primary' : 'default'}
                    onClick={() => handleSelectGenre(record)}
                    style={{
                        background: selectedGenre?.id === record.id
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
                    title="Select Genre to Update"
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
                            dataSource={filteredGenres}
                            loading={loading}
                            rowKey="id"
                            pagination={{ pageSize: 10 }}
                            style={{ color: '#ffffff' }}
                        />
                    </Space>
                </Card>
            </div>

            {selectedGenre && (
                <Card
                    title={`Update Genre: ${selectedGenre.name}`}
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
                            label="Genre ID"
                            name="genre_id"
                            labelCol={{ style: styles.label }}
                        >
                            <Input style={styles.input} disabled />
                        </Form.Item>

                        <Form.Item
                            label="Genre Name"
                            name="genre_name"
                            labelCol={{ style: styles.label }}
                            rules={[{ required: true, message: 'Please enter genre name' }]}
                        >
                            <Input
                                placeholder="Genre name"
                                style={styles.input}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Slug"
                            name="slug"
                            labelCol={{ style: styles.label }}
                        >
                            <Input
                                placeholder="Slug"
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
                                    Update Genre
                                </Button>
                                <Button
                                    onClick={() => {
                                        setSelectedGenre(null);
                                        form.resetFields();
                                    }}
                                    style={{
                                        backgroundColor: '#2a2a2a',
                                        borderColor: '#303030',
                                        color: '#ffffff',
                                    }}
                                >
                                    Deselect
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Card>
            )}
        </div>
    );
};

export default UpdateGenres;
