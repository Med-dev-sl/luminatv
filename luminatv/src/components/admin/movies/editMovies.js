import { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { Table, Button, Modal, message, Input, Space, Spin, Card, Drawer, Form, Select, InputNumber, DatePicker } from 'antd';
import { EditOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const EditMovies = () => {
    const [form] = Form.useForm();
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredMovies, setFilteredMovies] = useState([]);
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [categories, setCategories] = useState([]);
    const [genres, setGenres] = useState([]);
    const [movieGenres, setMovieGenres] = useState([]);

    useEffect(() => {
        fetchMovies();
        fetchCategories();
        fetchGenres();
    }, []);

    useEffect(() => {
        if (searchTerm === '') {
            setFilteredMovies(movies);
        } else {
            const filtered = movies.filter(movie =>
                movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                movie.id.toString().includes(searchTerm)
            );
            setFilteredMovies(filtered);
        }
    }, [searchTerm, movies]);

    const fetchMovies = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('movies')
                .select('id, title, release_date, rating, status, created_at, category_id, description, duration, language, country, budget, revenue')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMovies(data);
            setFilteredMovies(data);
        } catch (error) {
            message.error('Failed to load movies');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('id, name');
            if (error) throw error;
            setCategories(data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchGenres = async () => {
        try {
            const { data, error } = await supabase
                .from('genres')
                .select('id, name');
            if (error) throw error;
            setGenres(data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchMovieGenres = async (movieId) => {
        try {
            const { data, error } = await supabase
                .from('movie_genres')
                .select('genre_id')
                .eq('movie_id', movieId);
            if (error) throw error;
            setMovieGenres(data.map(mg => mg.genre_id));
        } catch (error) {
            console.error(error);
        }
    };

    const handleEdit = async (movie) => {
        setSelectedMovie(movie);
        await fetchMovieGenres(movie.id);
        form.setFieldsValue({
            title: movie.title,
            description: movie.description,
            category_id: movie.category_id,
            genres: [],
            release_date: movie.release_date ? dayjs(movie.release_date) : null,
            duration: movie.duration,
            rating: movie.rating,
            language: movie.language,
            country: movie.country,
            budget: movie.budget,
            revenue: movie.revenue,
        });
        setDrawerVisible(true);
    };

    const handleUpdate = async (values) => {
        try {
            // Update movie details
            const { error: updateError } = await supabase
                .from('movies')
                .update({
                    title: values.title,
                    description: values.description,
                    category_id: values.category_id,
                    release_date: values.release_date ? values.release_date.format('YYYY-MM-DD') : null,
                    duration: values.duration,
                    rating: values.rating,
                    language: values.language,
                    country: values.country,
                    budget: values.budget,
                    revenue: values.revenue,
                })
                .eq('id', selectedMovie.id);

            if (updateError) throw updateError;

            // Update genres if changed
            if (values.genres && values.genres.length > 0) {
                // Delete existing genres
                await supabase
                    .from('movie_genres')
                    .delete()
                    .eq('movie_id', selectedMovie.id);

                // Insert new genres
                const genreRecords = values.genres.map(genreId => ({
                    movie_id: selectedMovie.id,
                    genre_id: genreId,
                }));

                const { error: genreError } = await supabase
                    .from('movie_genres')
                    .insert(genreRecords);

                if (genreError) throw genreError;
            }

            message.success('Movie updated successfully!');
            setDrawerVisible(false);
            fetchMovies();
        } catch (error) {
            message.error(error.message || 'Failed to update movie');
            console.error(error);
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
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            sorter: (a, b) => a.title.localeCompare(b.title),
        },
        {
            title: 'Release Date',
            dataIndex: 'release_date',
            key: 'release_date',
            render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A',
        },
        {
            title: 'Rating',
            dataIndex: 'rating',
            key: 'rating',
            render: (rating) => rating ? `${rating}/10` : 'N/A',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const colors = {
                    published: '#52c41a',
                    draft: '#faad14',
                    archived: '#f5222d',
                };
                return <span style={{ color: colors[status] || '#fff' }}>{status}</span>;
            },
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(record)}
                    style={{ backgroundColor: '#4a9eff', border: 'none' }}
                >
                    Edit
                </Button>
            ),
        },
    ];

    return (
        <div style={{ padding: '20px', color: '#fff' }}>
            <Card title="Edit Movies" style={{ backgroundColor: '#1f1f1f', borderColor: '#303030' }}>
                <Space style={{ marginBottom: '20px', width: '100%' }}>
                    <Input
                        placeholder="Search by title or ID..."
                        prefix={<SearchOutlined />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '300px', backgroundColor: '#2a2a2a', color: '#fff', border: '1px solid #404040' }}
                    />
                    <Button onClick={fetchMovies} loading={loading}>
                        Refresh
                    </Button>
                </Space>

                <Spin spinning={loading}>
                    <Table
                        columns={columns}
                        dataSource={filteredMovies}
                        rowKey="id"
                        pagination={{ pageSize: 10 }}
                        style={{ color: '#fff' }}
                        bordered
                    />
                </Spin>
            </Card>

            <Drawer
                title="Edit Movie"
                placement="right"
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
                width={500}
                bodyStyle={{ backgroundColor: '#1f1f1f' }}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleUpdate}
                    style={{ color: '#fff' }}
                >
                    <Form.Item
                        label="Movie Title"
                        name="title"
                        rules={[{ required: true, message: 'Please enter movie title' }]}
                    >
                        <Input placeholder="Enter movie title" style={{ backgroundColor: '#2a2a2a', color: '#fff', border: '1px solid #404040' }} />
                    </Form.Item>

                    <Form.Item
                        label="Description"
                        name="description"
                    >
                        <Input.TextArea rows={3} style={{ backgroundColor: '#2a2a2a', color: '#fff', border: '1px solid #404040' }} />
                    </Form.Item>

                    <Form.Item
                        label="Category"
                        name="category_id"
                        rules={[{ required: true, message: 'Please select a category' }]}
                    >
                        <Select placeholder="Select a category">
                            {categories.map(cat => (
                                <Select.Option key={cat.id} value={cat.id}>{cat.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Genres"
                        name="genres"
                    >
                        <Select
                            mode="multiple"
                            placeholder="Select genres"
                        >
                            {genres.map(genre => (
                                <Select.Option key={genre.id} value={genre.id}>{genre.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Release Date"
                        name="release_date"
                    >
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        label="Duration (minutes)"
                        name="duration"
                    >
                        <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        label="Rating"
                        name="rating"
                    >
                        <InputNumber min={0} max={10} step={0.1} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        label="Language"
                        name="language"
                    >
                        <Input style={{ backgroundColor: '#2a2a2a', color: '#fff', border: '1px solid #404040' }} />
                    </Form.Item>

                    <Form.Item
                        label="Country"
                        name="country"
                    >
                        <Input style={{ backgroundColor: '#2a2a2a', color: '#fff', border: '1px solid #404040' }} />
                    </Form.Item>

                    <Form.Item
                        label="Budget ($)"
                        name="budget"
                    >
                        <InputNumber style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        label="Revenue ($)"
                        name="revenue"
                    >
                        <InputNumber style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            style={{
                                background: 'linear-gradient(135deg, #001a4d 0%, #000000 100%)',
                                color: '#ffffff',
                                border: 'none',
                                width: '100%',
                            }}
                        >
                            Update Movie
                        </Button>
                    </Form.Item>
                </Form>
            </Drawer>
        </div>
    );
};

export default EditMovies;
