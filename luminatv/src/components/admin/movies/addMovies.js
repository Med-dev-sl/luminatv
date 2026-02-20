import { PlusOutlined, CloudUploadOutlined, PictureOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { Button, Card, DatePicker, Form, Input, InputNumber, message, Select, Spin, Upload, Progress, Tabs } from 'antd';
import { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';

const AddMovies = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [genres, setGenres] = useState([]);
    const [posterFile, setPosterFile] = useState(null);
    const [posterPreview, setPosterPreview] = useState(null);
    const [trailerFile, setTrailerFile] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    const [casts, setCasts] = useState([]);

    useEffect(() => {
        fetchCategories();
        fetchGenres();
        fetchCasts();
    }, []);

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

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('id, name')
                .eq('is_active', true);
            if (error) throw error;
            setCategories(data);
        } catch (error) {
            message.error('Failed to load categories');
            console.error(error);
        }
    };

    const fetchGenres = async () => {
        try {
            const { data, error } = await supabase
                .from('genres')
                .select('id, name')
                .eq('is_active', true);
            if (error) throw error;
            setGenres(data);
        } catch (error) {
            message.error('Failed to load genres');
            console.error(error);
        }
    };

    const handlePosterUpload = async (file) => {
        if (!file) return null;

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('Movies_Posters')
                .upload(`posters/${fileName}`, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('Movies_Posters')
                .getPublicUrl(`posters/${fileName}`);

            return data.publicUrl;
        } catch (error) {
            message.error('Failed to upload poster');
            console.error(error);
            return null;
        }
    };

    const handleTrailerUpload = async (file) => {
        if (!file) return null;
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('Movie_Trailers')
                .upload(`trailers/${fileName}`, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('Movie_Trailers')
                .getPublicUrl(`trailers/${fileName}`);

            return data.publicUrl;
        } catch (error) {
            message.error('Failed to upload trailer');
            console.error(error);
            return null;
        }
    };

    const handleVideoUpload = async (file) => {
        if (!file) return null;
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('Movie_Videos')
                .upload(`videos/${fileName}`, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('Movie_Videos')
                .getPublicUrl(`videos/${fileName}`);

            return data.publicUrl;
        } catch (error) {
            message.error('Failed to upload video');
            console.error(error);
            return null;
        }
    };

    const onSubmit = async (values) => {
        setLoading(true);
        try {
            // Upload poster if provided
            let posterUrl = null;
            if (posterFile) {
                posterUrl = await handlePosterUpload(posterFile);
                if (!posterUrl) {
                    setLoading(false);
                    return;
                }
            }

            // Upload trailer and video if provided
            let trailerUrl = null;
            if (trailerFile) {
                trailerUrl = await handleTrailerUpload(trailerFile);
                if (!trailerUrl) {
                    setLoading(false);
                    return;
                }
            }

            let videoUrl = null;
            if (videoFile) {
                videoUrl = await handleVideoUpload(videoFile);
                if (!videoUrl) {
                    setLoading(false);
                    return;
                }
            }

            // Create slug from title
            const slug = values.title
                .toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-')
                .trim();

            const { data: movieData, error: movieError } = await supabase
                .from('movies')
                .insert([
                    {
                        title: values.title,
                        description: values.description,
                        slug: slug,
                        release_date: values.release_date ? values.release_date.format('YYYY-MM-DD') : null,
                        duration: values.duration,
                        rating: values.rating,
                        category_id: values.category_id,
                        poster_url: posterUrl,
                        language: values.language,
                        country: values.country,
                        budget: values.budget,
                        revenue: values.revenue,
                        status: 'published',
                        featured: false,
                    }
                ])
                .select();

            if (movieError) throw movieError;

            const movieId = movieData[0].id;

            // Insert movie genres
            if (values.genres && values.genres.length > 0) {
                const genreRecords = values.genres.map(genreId => ({
                    movie_id: movieId,
                    genre_id: genreId,
                }));

                const { error: genreError } = await supabase
                    .from('movie_genres')
                    .insert(genreRecords);

                if (genreError) throw genreError;
            }

            // Insert poster record into movie_posters table
            if (posterUrl) {
                const { error: posterError } = await supabase
                    .from('movie_posters')
                    .insert([
                        {
                            movie_id: movieId,
                            title: values.title,
                            poster_url: posterUrl,
                            poster_type: values.poster_type || 'poster',
                            is_primary: true,
                        }
                    ]);
                if (posterError) throw posterError;
            }

            // Insert trailer record
            if (trailerUrl) {
                const { error: trError } = await supabase
                    .from('movie_trailers')
                    .insert([
                        {
                            movie_id: movieId,
                            title: values.trailer_title || `${values.title} Trailer`,
                            video_url: trailerUrl,
                            is_primary: true,
                            transcoding_status: 'completed',
                        }
                    ]);
                if (trError) throw trError;
            }

            // Insert video record
            if (videoUrl) {
                const { error: vError } = await supabase
                    .from('movie_videos')
                    .insert([
                        {
                            movie_id: movieId,
                            title: values.video_title || `${values.title} Full`,
                            video_url: videoUrl,
                            is_primary: true,
                            transcoding_status: 'completed',
                        }
                    ]);
                if (vError) throw vError;
            }

            // Insert movie_casts records
            if (values.casts && values.casts.length > 0) {
                const castRecords = values.casts.map((castId, idx) => ({
                    movie_id: movieId,
                    cast_id: castId,
                    cast_order: idx + 1,
                }));

                const { error: castError } = await supabase
                    .from('movie_casts')
                    .insert(castRecords);

                if (castError) throw castError;
            }

            message.success('Movie added successfully!');
            form.resetFields();
            setPosterFile(null);
            setPosterPreview(null);
        } catch (error) {
            message.error(error.message || 'Failed to add movie');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePosterChange = (info) => {
        const file = info.file;
        setPosterFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onload = () => {
            setPosterPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleTrailerChange = (info) => {
        const file = info.file;
        setTrailerFile(file);
    };

    const handleVideoChange = (info) => {
        const file = info.file;
        setVideoFile(file);
    };

    return (
        <div style={{ padding: '20px', color: '#fff' }}>
            <Card title="Add New Movie" style={{ backgroundColor: '#1f1f1f', borderColor: '#303030' }}>
                <Spin spinning={loading}>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onSubmit}
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
                            <Input.TextArea rows={4} placeholder="Enter movie description" style={{ backgroundColor: '#2a2a2a', color: '#fff', border: '1px solid #404040' }} />
                        </Form.Item>

                        <Form.Item
                            label="Category"
                            name="category_id"
                            rules={[{ required: true, message: 'Please select a category' }]}
                        >
                            <Select placeholder="Select a category" style={{ backgroundColor: '#2a2a2a' }}>
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
                                style={{ backgroundColor: '#2a2a2a' }}
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
                            <DatePicker style={{ width: '100%', backgroundColor: '#2a2a2a', color: '#fff' }} />
                        </Form.Item>

                        <Form.Item
                            label="Duration (minutes)"
                            name="duration"
                        >
                            <InputNumber min={1} placeholder="Enter duration" style={{ width: '100%', backgroundColor: '#2a2a2a', color: '#fff' }} />
                        </Form.Item>

                        <Form.Item
                            label="Rating"
                            name="rating"
                        >
                            <InputNumber min={0} max={10} step={0.1} placeholder="0-10" style={{ width: '100%', backgroundColor: '#2a2a2a', color: '#fff' }} />
                        </Form.Item>

                        <Form.Item
                            label="Language"
                            name="language"
                        >
                            <Input placeholder="e.g., English, Spanish" style={{ backgroundColor: '#2a2a2a', color: '#fff', border: '1px solid #404040' }} />
                        </Form.Item>

                        <Form.Item
                            label="Country"
                            name="country"
                        >
                            <Input placeholder="e.g., USA, UK" style={{ backgroundColor: '#2a2a2a', color: '#fff', border: '1px solid #404040' }} />
                        </Form.Item>

                        <Form.Item
                            label="Budget ($)"
                            name="budget"
                        >
                            <InputNumber placeholder="Enter budget" style={{ width: '100%', backgroundColor: '#2a2a2a', color: '#fff' }} />
                        </Form.Item>

                        <Form.Item
                            label="Revenue ($)"
                            name="revenue"
                        >
                            <InputNumber placeholder="Enter revenue" style={{ width: '100%', backgroundColor: '#2a2a2a', color: '#fff' }} />
                        </Form.Item>

                        <Form.Item label="Poster Type" name="poster_type">
                            <Select placeholder="Select poster type" style={{ backgroundColor: '#2a2a2a' }}>
                                <Select.Option value="poster">Poster</Select.Option>
                                <Select.Option value="thumbnail">Thumbnail</Select.Option>
                                <Select.Option value="banner">Banner</Select.Option>
                            </Select>
                        </Form.Item>

                        <Form.Item label="Casts" name="casts">
                            <Select mode="multiple" placeholder="Select cast members" style={{ backgroundColor: '#2a2a2a' }}>
                                {casts.map(c => (
                                    <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item label="Trailer Title" name="trailer_title">
                            <Input placeholder="Trailer title" style={{ backgroundColor: '#2a2a2a', color: '#fff' }} />
                        </Form.Item>

                        <Form.Item label="Upload Trailer" name="trailer">
                            <Upload beforeUpload={() => false} onChange={handleTrailerChange} accept="video/*" maxCount={1}>
                                <Button icon={<CloudUploadOutlined />} style={{ backgroundColor: '#4a9eff', color: '#fff', border: 'none' }}>Upload Trailer</Button>
                            </Upload>
                        </Form.Item>

                        <Form.Item label="Video Title" name="video_title">
                            <Input placeholder="Full movie title" style={{ backgroundColor: '#2a2a2a', color: '#fff' }} />
                        </Form.Item>

                        <Form.Item label="Upload Video" name="video">
                            <Upload beforeUpload={() => false} onChange={handleVideoChange} accept="video/*" maxCount={1}>
                                <Button icon={<PlayCircleOutlined />} style={{ backgroundColor: '#4a9eff', color: '#fff', border: 'none' }}>Upload Video</Button>
                            </Upload>
                        </Form.Item>

                        <Form.Item
                            label="Movie Poster"
                            name="poster"
                        >
                            <Upload
                                beforeUpload={() => false}
                                onChange={handlePosterChange}
                                maxCount={1}
                                accept="image/*"
                            >
                                <Button icon={<PlusOutlined />} style={{ backgroundColor: '#4a9eff', color: '#fff', border: 'none' }}>
                                    Upload Poster
                                </Button>
                            </Upload>
                        </Form.Item>

                        {posterPreview && (
                            <div style={{ marginBottom: '20px' }}>
                                <img src={posterPreview} alt="Poster Preview" style={{ maxWidth: '200px', borderRadius: '8px' }} />
                            </div>
                        )}

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                style={{
                                    background: 'linear-gradient(135deg, #001a4d 0%, #000000 100%)',
                                    color: '#ffffff',
                                    border: 'none',
                                    width: '100%',
                                    height: '40px',
                                    fontWeight: '500'
                                }}
                            >
                                Add Movie
                            </Button>
                        </Form.Item>
                    </Form>
                </Spin>
            </Card>
        </div>
    );
};

export default AddMovies;
