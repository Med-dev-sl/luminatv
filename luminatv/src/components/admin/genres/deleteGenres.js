import { DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Input, Modal, Space, Table, message } from 'antd';
import { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';

const DeleteGenres = () => {
    const [genres, setGenres] = useState([]);
    const [filteredGenres, setFilteredGenres] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);

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

    const deleteGenre = async (genreId) => {
        try {
            setLoading(true);

            // First, cascade delete - remove references in movie_genres junction table
            const { error: deleteJunctionError } = await supabase
                .from('movie_genres')
                .delete()
                .eq('genre_id', genreId);

            if (deleteJunctionError) {
                message.error('Error removing genre references: ' + deleteJunctionError.message);
                return;
            }

            // Also delete from series_genres if you have series
            const { error: deleteSeriesJunctionError } = await supabase
                .from('series_genres')
                .delete()
                .eq('genre_id', genreId);

            if (deleteSeriesJunctionError) {
                message.error('Error removing series genre references: ' + deleteSeriesJunctionError.message);
                return;
            }

            // Delete the genre
            const { error } = await supabase
                .from('genres')
                .delete()
                .eq('id', genreId);

            if (error) {
                message.error('Error deleting genre: ' + error.message);
                return;
            }

            message.success('Genre deleted successfully!');
            fetchGenres();
        } catch (error) {
            message.error('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (record) => {
        Modal.confirm({
            title: 'Delete Genre',
            content: `Are you sure you want to delete "${record.name}"? This action cannot be undone.`,
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk() {
                deleteGenre(record.id);
            },
        });
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
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(record)}
                    loading={loading}
                    style={{ width: '100%' }}
                >
                    Delete
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
    };

    return (
        <div style={styles.container}>
            <Card
                title="Delete Genre"
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
    );
};

export default DeleteGenres;
