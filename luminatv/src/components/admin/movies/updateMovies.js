import { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { Table, Button, Modal, message, Input, Space, Spin, Card, Drawer, Form, Select, Upload, Tabs, Progress } from 'antd';
import { CloudUploadOutlined, SearchOutlined, PlayCircleOutlined, PictureOutlined } from '@ant-design/icons';

const UpdateMovies = () => {
    const [form] = Form.useForm();
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredMovies, setFilteredMovies] = useState([]);
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchMovies();
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
                .select('id, title, release_date, rating, status, created_at')
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

    const handleUpdate = (movie) => {
        setSelectedMovie(movie);
        setDrawerVisible(true);
        form.resetFields();
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

            // Save to database
            const { error: dbError } = await supabase
                .from('movie_videos')
                .insert([
                    {
                        movie_id: movieId,
                        title: form.getFieldValue('video_title') || 'Main Movie',
                        video_url: data.publicUrl,
                        duration: form.getFieldValue('duration'),
                        video_quality: form.getFieldValue('quality'),
                        language: form.getFieldValue('language'),
                        is_primary: true,
                        transcoding_status: 'completed',
                    }
                ]);

            if (dbError) throw dbError;

            message.success('Movie video uploaded successfully!');
            setUploadProgress(100);
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

            // Save to database
            const { error: dbError } = await supabase
                .from('movie_trailers')
                .insert([
                    {
                        movie_id: movieId,
                        title: form.getFieldValue('trailer_title') || 'Movie Trailer',
                        video_url: data.publicUrl,
                        video_quality: form.getFieldValue('quality'),
                        is_primary: true,
                    }
                ]);

            if (dbError) throw dbError;

            message.success('Movie trailer uploaded successfully!');
            setUploadProgress(100);
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

            // Save to database
            const { error: dbError } = await supabase
                .from('movie_posters')
                .insert([
                    {
                        movie_id: movieId,
                        poster_url: data.publicUrl,
                        poster_type: form.getFieldValue('poster_type') || 'vertical',
                        is_primary: true,
                    }
                ]);

            if (dbError) throw dbError;

            message.success('Movie poster uploaded successfully!');
            setUploadProgress(100);
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
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Button
                    type="primary"
                    icon={<CloudUploadOutlined />}
                    onClick={() => handleUpdate(record)}
                    style={{ backgroundColor: '#4a9eff', border: 'none' }}
                >
                    Upload
                </Button>
            ),
        },
    ];

    return (
        <div style={{ padding: '20px', color: '#fff' }}>
            <Card title="Update Movies (Upload Videos/Trailers/Posters)" style={{ backgroundColor: '#1f1f1f', borderColor: '#303030' }}>
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
                title={`Upload Content - ${selectedMovie?.title}`}
                placement="right"
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
                width={600}
                bodyStyle={{ backgroundColor: '#1f1f1f' }}
            >
                <Tabs
                    items={[
                        {
                            key: '1',
                            label: 'Movie Video',
                            icon: <PlayCircleOutlined />,
                            children: (
                                <Form layout="vertical" style={{ color: '#fff' }}>
                                    <Form.Item label="Video Title">
                                        <Input placeholder="Main Movie" style={{ backgroundColor: '#2a2a2a', color: '#fff' }} />
                                    </Form.Item>
                                    <Form.Item label="Video Quality">
                                        <Select placeholder="Select quality">
                                            <Select.Option value="480p">480p</Select.Option>
                                            <Select.Option value="720p">720p (HD)</Select.Option>
                                            <Select.Option value="1080p">1080p (Full HD)</Select.Option>
                                            <Select.Option value="4K">4K</Select.Option>
                                        </Select>
                                    </Form.Item>
                                    <Form.Item label="Language">
                                        <Input placeholder="e.g., English" style={{ backgroundColor: '#2a2a2a', color: '#fff' }} />
                                    </Form.Item>
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
                                </Form>
                            ),
                        },
                        {
                            key: '2',
                            label: 'Movie Trailer',
                            icon: <PlayCircleOutlined />,
                            children: (
                                <Form layout="vertical" style={{ color: '#fff' }}>
                                    <Form.Item label="Trailer Title">
                                        <Input placeholder="Movie Trailer" style={{ backgroundColor: '#2a2a2a', color: '#fff' }} />
                                    </Form.Item>
                                    <Form.Item label="Video Quality">
                                        <Select placeholder="Select quality">
                                            <Select.Option value="480p">480p</Select.Option>
                                            <Select.Option value="720p">720p (HD)</Select.Option>
                                            <Select.Option value="1080p">1080p (Full HD)</Select.Option>
                                            <Select.Option value="4K">4K</Select.Option>
                                        </Select>
                                    </Form.Item>
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
                                </Form>
                            ),
                        },
                        {
                            key: '3',
                            label: 'Movie Poster',
                            icon: <PictureOutlined />,
                            children: (
                                <Form layout="vertical" style={{ color: '#fff' }}>
                                    <Form.Item label="Poster Type">
                                        <Select placeholder="Select type">
                                            <Select.Option value="vertical">Vertical</Select.Option>
                                            <Select.Option value="horizontal">Horizontal</Select.Option>
                                            <Select.Option value="square">Square</Select.Option>
                                        </Select>
                                    </Form.Item>
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
                                </Form>
                            ),
                        },
                    ]}
                />
            </Drawer>
        </div>
    );
};

export default UpdateMovies;
