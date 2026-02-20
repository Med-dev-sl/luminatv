import { EditOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Drawer, Form, Input, message, Space, Table } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';

const EditGenres = () => {
    const [form] = Form.useForm();
    const [genres, setGenres] = useState([]);
    const [filteredGenres, setFilteredGenres] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [selectedGenre, setSelectedGenre] = useState(null);

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

    const generateSlug = (text) => {
        return text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    };

    const handleEdit = (record) => {
        setSelectedGenre(record);
        form.setFieldsValue({
            name: record.name,
            slug: record.slug,
            description: record.description,
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

            const genreData = {
                name: values.name,
                description: values.description || '',
                slug: values.slug,
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
            setDrawerVisible(false);
            fetchGenres();
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
                title="Edit Genre"
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

            <Drawer
                title="Edit Genre"
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
                                Update Genre
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

export default EditGenres;
