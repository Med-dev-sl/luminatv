import { DeleteOutlined, EditOutlined, PlusOutlined, CloudUploadOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, InputNumber, message, Modal, Select, Space, Table, Upload } from 'antd';
import { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';

const AddSeries = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [series, setSeries] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingSeries, setEditingSeries] = useState(null);
    const [categories, setCategories] = useState([]);
    const [genres, setGenres] = useState([]);
    const [casts, setCasts] = useState([]);
    const [posterFile, setPosterFile] = useState(null);
    const [trailerFile, setTrailerFile] = useState(null);
    const [episodeFile, setEpisodeFile] = useState(null);

    useEffect(() => {
        fetchSeries();
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
            setCasts(data || []);
        } catch (error) {
            console.error(error);
        }
    };

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

    const handleAddSeries = async (values) => {
        try {
            setLoading(true);
            // upload poster if provided
            let posterUrl = null;
            if (posterFile) {
                const fileExt = posterFile.name.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('Movies_Posters')
                    .upload(`posters/${fileName}`, posterFile);
                if (uploadError) throw uploadError;
                const { data } = supabase.storage.from('Movies_Posters').getPublicUrl(`posters/${fileName}`);
                posterUrl = data.publicUrl;
            }

            const { data: seriesData, error } = await supabase
                .from('series')
                .insert([
                    {
                        title: values.title,
                        description: values.description,
                        category_id: values.category_id,
                        genre_ids: values.genre_ids || [],
                        seasons_count: values.total_seasons || 1,
                        status: values.status || 'ongoing',
                        rating: values.rating || 0,
                        release_date: values.release_date,
                        poster_url: posterUrl,
                        is_active: true,
                    }
                ])
                .select();
            
            if (error) throw error;
            const insertedSeries = seriesData && seriesData[0];
            const seriesId = insertedSeries ? insertedSeries.id : null;

            // insert casts
            if (seriesId && values.casts && values.casts.length > 0) {
                const castRecords = values.casts.map((castId) => ({ series_id: seriesId, cast_id: castId }));
                const { error: castError } = await supabase.from('series_casts').insert(castRecords);
                if (castError) throw castError;
            }

            // upload trailer
            if (seriesId && trailerFile) {
                const fileExt = trailerFile.name.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('Series_Trailers')
                    .upload(`trailers/${fileName}`, trailerFile);
                if (uploadError) throw uploadError;
                const { data } = supabase.storage.from('Series_Trailers').getPublicUrl(`trailers/${fileName}`);
                const { error: trError } = await supabase.from('series_trailers').insert([{ series_id: seriesId, title: values.trailer_title || `${values.title} Trailer`, video_url: data.publicUrl, is_primary: true, transcoding_status: 'completed' }]);
                if (trError) throw trError;
            }

            // upload initial episode
            if (seriesId && episodeFile) {
                const fileExt = episodeFile.name.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('Series_Episodes')
                    .upload(`episodes/${fileName}`, episodeFile);
                if (uploadError) throw uploadError;
                const { data } = supabase.storage.from('Series_Episodes').getPublicUrl(`episodes/${fileName}`);
                const epRecord = {
                    series_id: seriesId,
                    season_number: values.season_number || 1,
                    episode_number: values.episode_number || 1,
                    title: values.episode_title || `${values.title} Episode 1`,
                    video_url: data.publicUrl,
                    transcoding_status: 'completed',
                };
                const { error: epError } = await supabase.from('series_episodes').insert([epRecord]);
                if (epError) throw epError;
            }
            message.success('Series added successfully');
            form.resetFields();
            setIsModalVisible(false);
            fetchSeries();
        } catch (error) {
            message.error('Failed to add series');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSeries = async (id) => {
        Modal.confirm({
            title: 'Delete Series',
            content: 'Are you sure you want to delete this series?',
            okText: 'Delete',
            okType: 'danger',
            async onOk() {
                try {
                    setLoading(true);
                    const { error } = await supabase
                        .from('series')
                        .delete()
                        .eq('id', id);
                    if (error) throw error;
                    message.success('Series deleted successfully');
                    fetchSeries();
                } catch (error) {
                    message.error('Failed to delete series');
                    console.error(error);
                } finally {
                    setLoading(false);
                }
            },
        });
    };

    const handlePosterChange = (info) => {
        setPosterFile(info.file);
    };

    const handleTrailerChange = (info) => {
        setTrailerFile(info.file);
    };

    const handleEpisodeChange = (info) => {
        setEpisodeFile(info.file);
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
            title: 'Status Active',
            dataIndex: 'is_active',
            key: 'is_active',
            width: 100,
            render: (is_active) => is_active ? 'Active' : 'Inactive',
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
                        onClick={() => {
                            setEditingSeries(record);
                            form.setFieldsValue(record);
                            setIsModalVisible(true);
                        }}
                    />
                    <Button
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                        onClick={() => handleDeleteSeries(record.id)}
                    />
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Card
                title="Series Management"
                extra={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            setEditingSeries(null);
                            form.resetFields();
                            setIsModalVisible(true);
                        }}
                    >
                        Add Series
                    </Button>
                }
                loading={loading}
            >
                <Table
                    columns={columns}
                    dataSource={series}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 1000 }}
                />
            </Card>

            <Modal
                title={editingSeries ? 'Edit Series' : 'Add Series'}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                width={700}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleAddSeries}
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

                    <Form.Item label="Poster" name="poster">
                        <Upload beforeUpload={() => false} accept="image/*" maxCount={1} onChange={handlePosterChange}>
                            <Button icon={<CloudUploadOutlined />}>Upload Poster</Button>
                        </Upload>
                    </Form.Item>

                    <Form.Item label="Casts" name="casts">
                        <Select mode="multiple" placeholder="Select casts">
                            {casts.map(c => (
                                <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item label="Trailer Title" name="trailer_title">
                        <Input placeholder="Trailer title" />
                    </Form.Item>

                    <Form.Item label="Upload Trailer" name="trailer">
                        <Upload beforeUpload={() => false} accept="video/*" maxCount={1} onChange={handleTrailerChange}>
                            <Button icon={<CloudUploadOutlined />}>Upload Trailer</Button>
                        </Upload>
                    </Form.Item>

                    <Form.Item label="Episode Title" name="episode_title">
                        <Input placeholder="Episode title" />
                    </Form.Item>

                    <Form.Item label="Season Number" name="season_number">
                        <InputNumber min={1} placeholder="1" />
                    </Form.Item>

                    <Form.Item label="Episode Number" name="episode_number">
                        <InputNumber min={1} placeholder="1" />
                    </Form.Item>

                    <Form.Item label="Upload Episode Video" name="episode">
                        <Upload beforeUpload={() => false} accept="video/*" maxCount={1} onChange={handleEpisodeChange}>
                            <Button icon={<PlayCircleOutlined />}>Upload Episode</Button>
                        </Upload>
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block>
                            {editingSeries ? 'Update' : 'Add'} Series
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default AddSeries;
