import { EditOutlined, SearchOutlined, CloudUploadOutlined, PictureOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { Button, Card, DatePicker, Drawer, Form, Input, InputNumber, Select, Space, Spin, Table, message, Upload, Tabs, Progress } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';

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
    const [posters, setPosters] = useState([]);
    const [trailers, setTrailers] = useState([]);
    const [videos, setVideos] = useState([]);
    const [casts, setCasts] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

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

    const fetchCasts = async () => {
        try {
            const { data, error } = await supabase
                .from('casts')
                .select('id, name')
                .eq('is_active', true);
            if (error) throw error;
            setCasts(data);
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

    const fetchRelatedData = async (movieId) => {
        try {
            const [{ data: pData }, { data: tData }, { data: vData }] = await Promise.all([
                supabase.from('movie_posters').select('*').eq('movie_id', movieId),
                supabase.from('movie_trailers').select('*').eq('movie_id', movieId),
                supabase.from('movie_videos').select('*').eq('movie_id', movieId),
            ]);
            setPosters(pData || []);
            setTrailers(tData || []);
            setVideos(vData || []);
        } catch (error) {
            console.error(error);
        }
    };

    const handleEdit = async (movie) => {
        setSelectedMovie(movie);
        await fetchMovieGenres(movie.id);
        await fetchRelatedData(movie.id);
        await fetchCasts();
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

    const uploadMovieVideo = async (file, movieId) => {
        if (!file) return null;
        setUploading(true);
        setUploadProgress(0);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${movieId}-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('Movie_Videos')
                .upload(`videos/${fileName}`, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('Movie_Videos')
                .getPublicUrl(`videos/${fileName}`);

            const { error: dbError } = await supabase
                .from('movie_videos')
                .insert([
                    {
                        movie_id: movieId,
                        title: 'Uploaded Video',
                        video_url: data.publicUrl,
                        is_primary: true,
                        transcoding_status: 'completed',
                    }
                ]);
            if (dbError) throw dbError;
            message.success('Movie video uploaded successfully!');
            setUploadProgress(100);
            await fetchRelatedData(movieId);
            return true;
        } catch (error) {
            message.error(error.message || 'Failed to upload video');
            console.error(error);
            return false;
        } finally {
            setUploading(false);
        }
    };

    const uploadMovieTrailer = async (file, movieId) => {
        if (!file) return null;
        setUploading(true);
        setUploadProgress(0);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${movieId}-trailer-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('Movie_Trailers')
                .upload(`trailers/${fileName}`, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('Movie_Trailers')
                .getPublicUrl(`trailers/${fileName}`);

            const { error: dbError } = await supabase
                .from('movie_trailers')
                .insert([
                    {
                        movie_id: movieId,
                        title: 'Uploaded Trailer',
                        video_url: data.publicUrl,
                        is_primary: true,
                    }
                ]);

            if (dbError) throw dbError;
            message.success('Movie trailer uploaded successfully!');
            setUploadProgress(100);
            await fetchRelatedData(movieId);
            return true;
        } catch (error) {
            message.error(error.message || 'Failed to upload trailer');
            console.error(error);
            return false;
        } finally {
            setUploading(false);
        }
    };

    const uploadMoviePoster = async (file, movieId) => {
        if (!file) return null;
        setUploading(true);
        setUploadProgress(0);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${movieId}-poster-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('Movies_Posters')
                .upload(`posters/${fileName}`, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('Movies_Posters')
                .getPublicUrl(`posters/${fileName}`);

            const { error: dbError } = await supabase
                .from('movie_posters')
                .insert([
                    {
                        movie_id: movieId,
                        poster_url: data.publicUrl,
                        poster_type: 'poster',
                        is_primary: true,
                    }
                ]);

            if (dbError) throw dbError;
            message.success('Movie poster uploaded successfully!');
            setUploadProgress(100);
            await fetchRelatedData(movieId);
            return true;
        } catch (error) {
            message.error(error.message || 'Failed to upload poster');
            console.error(error);
            return false;
        } finally {
            setUploading(false);
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

                <Tabs
                    items={[
                        {
                            key: '1',
                            label: 'Movie Video',
                            children: (
                                <Form layout="vertical" style={{ color: '#fff' }}>
                                    <Form.Item label="Upload Movie Video">
                                        <Upload
                                            beforeUpload={() => false}
                                            accept="video/*"
                                            maxCount={1}
                                            onChange={(info) => {
                                                if (info.file) {
                                                    uploadMovieVideo(info.file, selectedMovie?.id);
                                                }
                                            }}
                                        >
                                            <Button icon={<CloudUploadOutlined />} style={{ backgroundColor: '#4a9eff', color: '#fff', border: 'none' }}>
                                                Choose Video
                                            </Button>
                                        </Upload>
                                    </Form.Item>
                                    {uploading && <Progress percent={uploadProgress} />}
                                    <div style={{ marginTop: 12 }}>
                                        {videos.map(v => (
                                            <div key={v.id} style={{ marginBottom: 8 }}>
                                                <a href={v.video_url} target="_blank" rel="noreferrer" style={{ color: '#fff' }}>{v.title || v.video_url}</a>
                                            </div>
                                        ))}
                                    </div>
                                </Form>
                            ),
                        },
                        {
                            key: '2',
                            label: 'Movie Trailer',
                            children: (
                                <Form layout="vertical" style={{ color: '#fff' }}>
                                    <Form.Item label="Upload Trailer">
                                        <Upload
                                            beforeUpload={() => false}
                                            accept="video/*"
                                            maxCount={1}
                                            onChange={(info) => {
                                                if (info.file) {
                                                    uploadMovieTrailer(info.file, selectedMovie?.id);
                                                }
                                            }}
                                        >
                                            <Button icon={<CloudUploadOutlined />} style={{ backgroundColor: '#4a9eff', color: '#fff', border: 'none' }}>
                                                Choose Trailer
                                            </Button>
                                        </Upload>
                                    </Form.Item>
                                    {uploading && <Progress percent={uploadProgress} />}
                                    <div style={{ marginTop: 12 }}>
                                        {trailers.map(t => (
                                            <div key={t.id} style={{ marginBottom: 8 }}>
                                                <a href={t.video_url} target="_blank" rel="noreferrer" style={{ color: '#fff' }}>{t.title || t.video_url}</a>
                                            </div>
                                        ))}
                                    </div>
                                </Form>
                            ),
                        },
                        {
                            key: '3',
                            label: 'Movie Poster',
                            children: (
                                <Form layout="vertical" style={{ color: '#fff' }}>
                                    <Form.Item label="Upload Poster">
                                        <Upload
                                            beforeUpload={() => false}
                                            accept="image/*"
                                            maxCount={1}
                                            onChange={(info) => {
                                                if (info.file) {
                                                    uploadMoviePoster(info.file, selectedMovie?.id);
                                                }
                                            }}
                                        >
                                            <Button icon={<CloudUploadOutlined />} style={{ backgroundColor: '#4a9eff', color: '#fff', border: 'none' }}>
                                                Choose Poster
                                            </Button>
                                        </Upload>
                                    </Form.Item>
                                    {uploading && <Progress percent={uploadProgress} />}
                                    <div style={{ marginTop: 12 }}>
                                        {posters.map(p => (
                                            <div key={p.id} style={{ marginBottom: 8 }}>
                                                <a href={p.poster_url} target="_blank" rel="noreferrer" style={{ color: '#fff' }}>{p.title || p.poster_url}</a>
                                            </div>
                                        ))}
                                    </div>
                                </Form>
                            ),
                        },
                    ]}
                />
            </Drawer>
        </div>
    );
};

export default EditMovies;
