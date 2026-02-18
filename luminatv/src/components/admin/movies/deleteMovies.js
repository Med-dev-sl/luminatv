import { DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Input, Modal, Space, Spin, Table, message } from 'antd';
import { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';

const DeleteMovies = () => {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredMovies, setFilteredMovies] = useState([]);

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

    const handleDelete = (movieId, title) => {
        Modal.confirm({
            title: 'Confirm Delete',
            content: `Are you sure you want to delete "${title}"? This action cannot be undone.`,
            okText: 'Delete',
            cancelText: 'Cancel',
            okButtonProps: { danger: true },
            onOk: async () => {
                await deleteMovie(movieId);
            },
        });
    };

    const deleteMovie = async (movieId) => {
        try {
            // Delete associated genres
            await supabase
                .from('movie_genres')
                .delete()
                .eq('movie_id', movieId);

            // Delete associated casts
            await supabase
                .from('movie_casts')
                .delete()
                .eq('movie_id', movieId);

            // Delete associated trailers
            await supabase
                .from('movie_trailers')
                .delete()
                .eq('movie_id', movieId);

            // Delete associated videos
            await supabase
                .from('movie_videos')
                .delete()
                .eq('movie_id', movieId);

            // Delete associated posters
            await supabase
                .from('movie_posters')
                .delete()
                .eq('movie_id', movieId);

            // Finally delete the movie
            const { error } = await supabase
                .from('movies')
                .delete()
                .eq('id', movieId);

            if (error) throw error;

            message.success('Movie deleted successfully!');
            fetchMovies();
        } catch (error) {
            message.error(error.message || 'Failed to delete movie');
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
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(record.id, record.title)}
                >
                    Delete
                </Button>
            ),
        },
    ];

    return (
        <div style={{ padding: '20px', color: '#fff' }}>
            <Card title="Delete Movies" style={{ backgroundColor: '#1f1f1f', borderColor: '#303030' }}>
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
        </div>
    );
};

export default DeleteMovies;
