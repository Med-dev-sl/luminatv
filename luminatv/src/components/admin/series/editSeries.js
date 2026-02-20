import { EditOutlined, CloudUploadOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, InputNumber, message, Modal, Select, Space, Table, Upload, Tabs, Progress } from 'antd';
import { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';

const EditSeries = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [series, setSeries] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingSeries, setEditingSeries] = useState(null);
    const [categories, setCategories] = useState([]);
    const [genres, setGenres] = useState([]);
    const [casts, setCasts] = useState([]);
    const [posters, setPosters] = useState([]);
    const [trailers, setTrailers] = useState([]);
    const [episodes, setEpisodes] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        fetchSeries();
        fetchCategories();
        fetchGenres();
    }, []);

    useEffect(() => {
        fetchCasts();
    }, []);

    const fetchSeries = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('series')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setSeries(data || []);
        } catch (error) {
            message.error('Failed to load series');
            console.error(error);
        } finally {
            setLoading(false);
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

    const fetchCasts = async () => {
        try {
            const { data, error } = await supabase.from('casts').select('id, name').eq('is_active', true);
            if (error) throw error;
            setCasts(data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchRelatedData = async (seriesId) => {
        try {
            const [{ data: pData }, { data: tData }, { data: eData }] = await Promise.all([
                supabase.from('series').select('id, poster_url').eq('id', seriesId),
                supabase.from('series_trailers').select('*').eq('series_id', seriesId),
                supabase.from('series_episodes').select('*').eq('series_id', seriesId),
            ]);
            setPosters(pData && pData.length ? [{ poster_url: pData[0].poster_url }] : []);
            setTrailers(tData || []);
            setEpisodes(eData || []);
        } catch (error) {
            console.error(error);
        }
    };

    const handleEdit = (seriesItem) => {
        setEditingSeries(seriesItem);
        form.setFieldsValue(seriesItem);
        fetchRelatedData(seriesItem.id);
        fetchCasts();
        setIsModalVisible(true);
    };

    const uploadSeriesPoster = async (file, seriesId) => {
        if (!file) return null;
        setUploading(true);
        setUploadProgress(0);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${seriesId}-poster-${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('Movies_Posters').upload(`posters/${fileName}`, file);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('Movies_Posters').getPublicUrl(`posters/${fileName}`);
            const { error: dbError } = await supabase.from('series').update({ poster_url: data.publicUrl }).eq('id', seriesId);
            if (dbError) throw dbError;
            message.success('Poster uploaded');
            await fetchRelatedData(seriesId);
            setUploadProgress(100);
            return true;
        } catch (error) {
            message.error('Failed to upload poster');
            console.error(error);
            return false;
        } finally {
            setUploading(false);
        }
    };

    const uploadSeriesTrailer = async (file, seriesId) => {
        if (!file) return null;
        setUploading(true);
        setUploadProgress(0);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${seriesId}-trailer-${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('Series_Trailers').upload(`trailers/${fileName}`, file);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('Series_Trailers').getPublicUrl(`trailers/${fileName}`);
            const { error: dbError } = await supabase.from('series_trailers').insert([{ series_id: seriesId, title: 'Uploaded Trailer', video_url: data.publicUrl, is_primary: true }]);
            if (dbError) throw dbError;
            message.success('Trailer uploaded');
            await fetchRelatedData(seriesId);
            setUploadProgress(100);
            return true;
        } catch (error) {
            message.error('Failed to upload trailer');
            console.error(error);
            return false;
        } finally {
            setUploading(false);
        }
    };

    const uploadSeriesEpisode = async (file, seriesId, seasonNumber = 1, episodeNumber = 1, title = 'Episode') => {
        if (!file) return null;
        setUploading(true);
        setUploadProgress(0);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${seriesId}-ep-${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('Series_Episodes').upload(`episodes/${fileName}`, file);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('Series_Episodes').getPublicUrl(`episodes/${fileName}`);
            const epRecord = { series_id: seriesId, season_number: seasonNumber, episode_number: episodeNumber, title, video_url: data.publicUrl, transcoding_status: 'completed' };
            const { error: dbError } = await supabase.from('series_episodes').insert([epRecord]);
            if (dbError) throw dbError;
            message.success('Episode uploaded');
            await fetchRelatedData(seriesId);
            setUploadProgress(100);
            return true;
        } catch (error) {
            message.error('Failed to upload episode');
            console.error(error);
            return false;
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateSeries = async (values) => {
        try {
            setLoading(true);
            const { error } = await supabase
                .from('series')
                .update({
                    title: values.title,
                    description: values.description,
                    category_id: values.category_id,
                    genre_ids: values.genre_ids || [],
                    total_seasons: values.total_seasons,
                    total_episodes: values.total_episodes,
                    status: values.status,
                    rating: values.rating,
                })
                .eq('id', editingSeries.id);
            
            if (error) throw error;
            message.success('Series updated successfully');
            setIsModalVisible(false);
            fetchSeries();
        } catch (error) {
            message.error('Failed to update series');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            width: 150,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 100,
        },
        {
            title: 'Seasons',
            dataIndex: 'total_seasons',
            key: 'total_seasons',
            width: 100,
        },
        {
            title: 'Episodes',
            dataIndex: 'total_episodes',
            key: 'total_episodes',
            width: 100,
        },
        {
            title: 'Rating',
            dataIndex: 'rating',
            key: 'rating',
            width: 100,
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 120,
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => handleEdit(record)}
                    >
                        Edit
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Card
                title="Edit Series"
                loading={loading}
            >
                <Table
                    columns={columns}
                    dataSource={series}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 800 }}
                />
            </Card>

            <Modal
                title="Edit Series"
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                width={700}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleUpdateSeries}
                >
                    <Form.Item
                        name="title"
                        label="Title"
                        rules={[{ required: true, message: 'Please enter series title' }]}
                    >
                        <Input placeholder="Series Title" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Description"
                    >
                        <Input.TextArea rows={4} placeholder="Series description" />
                    </Form.Item>

                    <Form.Item
                        name="category_id"
                        label="Category"
                        rules={[{ required: true, message: 'Please select a category' }]}
                    >
                        <Select placeholder="Select category">
                            {categories.map(cat => (
                                <Select.Option key={cat.id} value={cat.id}>{cat.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="genre_ids"
                        label="Genres"
                    >
                        <Select mode="multiple" placeholder="Select genres">
                            {genres.map(genre => (
                                <Select.Option key={genre.id} value={genre.id}>{genre.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="total_seasons"
                        label="Total Seasons"
                    >
                        <InputNumber placeholder="1" min={1} />
                    </Form.Item>

                    <Form.Item
                        name="total_episodes"
                        label="Total Episodes"
                    >
                        <InputNumber placeholder="0" min={0} />
                    </Form.Item>

                    <Form.Item
                        name="status"
                        label="Status"
                    >
                        <Select placeholder="Select status">
                            <Select.Option value="ongoing">Ongoing</Select.Option>
                            <Select.Option value="completed">Completed</Select.Option>
                            <Select.Option value="cancelled">Cancelled</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="rating"
                        label="Rating"
                    >
                        <InputNumber placeholder="0" min={0} max={10} step={0.1} />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block>
                            Update Series
                        </Button>
                    </Form.Item>
                </Form>
                <Tabs
                    items={[
                        {
                            key: '1',
                            label: 'Poster',
                            children: (
                                <div>
                                    <Upload beforeUpload={() => false} accept="image/*" maxCount={1} onChange={(info) => { if (info.file) uploadSeriesPoster(info.file, editingSeries?.id); }}>
                                        <Button icon={<CloudUploadOutlined />}>Upload Poster</Button>
                                    </Upload>
                                    {uploading && <Progress percent={uploadProgress} />}
                                    <div style={{ marginTop: 12 }}>
                                        {posters.map((p, i) => (
                                            <div key={i}><a href={p.poster_url} target="_blank" rel="noreferrer">{p.poster_url}</a></div>
                                        ))}
                                    </div>
                                </div>
                            ),
                        },
                        {
                            key: '2',
                            label: 'Trailers',
                            children: (
                                <div>
                                    <Upload beforeUpload={() => false} accept="video/*" maxCount={1} onChange={(info) => { if (info.file) uploadSeriesTrailer(info.file, editingSeries?.id); }}>
                                        <Button icon={<CloudUploadOutlined />}>Upload Trailer</Button>
                                    </Upload>
                                    {uploading && <Progress percent={uploadProgress} />}
                                    <div style={{ marginTop: 12 }}>
                                        {trailers.map(t => (
                                            <div key={t.id}><a href={t.video_url} target="_blank" rel="noreferrer">{t.title || t.video_url}</a></div>
                                        ))}
                                    </div>
                                </div>
                            ),
                        },
                        {
                            key: '3',
                            label: 'Episodes',
                            children: (
                                <div>
                                    <Upload beforeUpload={() => false} accept="video/*" maxCount={1} onChange={(info) => { if (info.file) uploadSeriesEpisode(info.file, editingSeries?.id); }}>
                                        <Button icon={<PlayCircleOutlined />}>Upload Episode</Button>
                                    </Upload>
                                    {uploading && <Progress percent={uploadProgress} />}
                                    <div style={{ marginTop: 12 }}>
                                        {episodes.map(e => (
                                            <div key={e.id}><a href={e.video_url} target="_blank" rel="noreferrer">{e.title || e.video_url}</a></div>
                                        ))}
                                    </div>
                                </div>
                            ),
                        },
                    ]}
                />
            </Modal>
        </div>
    );
};

export default EditSeries;
