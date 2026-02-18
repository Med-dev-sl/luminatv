import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, DatePicker, Form, Input, InputNumber, message, Select, Spin, Upload } from 'antd';
import { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';

const AddMovies = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [genres, setGenres] = useState([]);
    const [posterFile, setPosterFile] = useState(null);
    const [posterPreview, setPosterPreview] = useState(null);

    useEffect(() => {
        fetchCategories();
        fetchGenres();
    }, []);

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
        reader.readAsArrayBuffer(file);
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
