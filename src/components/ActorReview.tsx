/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/ActorReview.tsx
import { Table, Button, Space, Typography, message as antdMessage, Popconfirm, Input } from 'antd';
import { DeleteOutlined, MergeCellsOutlined, PlusOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';

const { Title } = Typography;

export interface Actor {
  id: string;
  name: string;
  type: 'Person' | 'System';
  description?: string;
  confidenceScore: number;
}

interface ActorReviewProps {
  actors: Actor[];
  onUpdate: (actors: Actor[]) => void;
  onConfirm: (actors: Actor[]) => void;
}

export const ActorReview = ({ actors: initialActors, onUpdate, onConfirm }: ActorReviewProps) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [actors, setActors] = useState<Actor[]>(initialActors);

  useEffect(() => {
    setActors(initialActors);
  }, [initialActors]);

  const handleDelete = (id: string) => {
    const newActors = actors.filter((actor) => actor.id !== id);
    setActors(newActors);
    const newSelectedKeys = selectedRowKeys.filter((key) => key !== id);
    setSelectedRowKeys(newSelectedKeys);
    onUpdate(newActors);
    antdMessage.success('Đã xóa Actor');
  };

  const handleAdd = () => {
    const newActor: Actor = {
      id: Date.now().toString(),
      name: `New Actor`,
      type: 'Person',
      description: '',
      confidenceScore: 1.0,
    };
    const newActors = [...actors, newActor];
    setActors(newActors);
    onUpdate(newActors);
  };

  const handleFieldChange = (id: string, field: keyof Actor, value: any) => {
    const newActors = actors.map((actor) => {
      if (actor.id === id) {
        return { ...actor, [field]: value };
      }
      return actor;
    });
    setActors(newActors);
    onUpdate(newActors);
  };

  const handleMerge = () => {
    if (selectedRowKeys.length < 2) {
      antdMessage.warning('Vui lòng chọn ít nhất 2 Actor để gộp');
      return;
    }

    const selectedActors = actors.filter((actor) => selectedRowKeys.includes(actor.id));
    const firstActor = selectedActors[0];
    const mergedNames = selectedActors.map((a) => a.name).join(' / ');

    // Create merged actor with highest confidence
    const mergedActor: Actor = {
      id: firstActor.id,
      name: mergedNames,
      type: firstActor.type,
      description: selectedActors
        .map((a) => a.description)
        .filter(Boolean)
        .join('; '),
      confidenceScore: Math.max(...selectedActors.map((a) => a.confidenceScore)),
    };

    // Remove selected actors and add merged one
    const newActors = [...actors.filter((actor) => !selectedRowKeys.includes(actor.id)), mergedActor];

    setActors(newActors);
    setSelectedRowKeys([]);
    onUpdate(newActors);
    antdMessage.success('Đã gộp Actors thành công');
  };

  const columns = [
    {
      title: 'Tên Actor',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Actor, b: Actor) => a.name.localeCompare(b.name),
      render: (text: string, record: Actor) => (
        <Input value={text} onChange={(e) => handleFieldChange(record.id, 'name', e.target.value)} variant="borderless" style={{ padding: 0 }} />
      ),
    },
    // {
    //   title: 'Loại',
    //   dataIndex: 'type',
    //   key: 'type',
    //   render: (type: string) => <Tag color={type === 'Person' ? 'blue' : 'purple'}>{type}</Tag>,
    // },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      render: (text: string, record: Actor) => (
        <Input.TextArea
          value={text}
          onChange={(e) => handleFieldChange(record.id, 'description', e.target.value)}
          variant="borderless"
          autoSize={{ minRows: 1, maxRows: 3 }}
          style={{ padding: 0, resize: 'none' }}
        />
      ),
    },
    // {
    //   title: 'Điểm tin cậy',
    //   dataIndex: 'confidenceScore',
    //   key: 'confidenceScore',
    //   sorter: (a: Actor, b: Actor) => a.confidenceScore - b.confidenceScore,
    //   render: (score: number) => {
    //     const color = score < 0.8 ? 'warning' : 'success';
    //     return <Tag color={color}>{(score * 100).toFixed(0)}%</Tag>;
    //   },
    // },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: Actor) => (
        <Popconfirm title="Bạn có chắc muốn xóa Actor này?" onConfirm={() => handleDelete(record.id)} okText="Xóa" cancelText="Hủy">
          <Button type="text" danger icon={<DeleteOutlined />} size="small">
            Từ chối/Xóa
          </Button>
        </Popconfirm>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => {
      setSelectedRowKeys(keys);
    },
  };

  // const rowClassName = (record: Actor) => {
  //   return record.confidenceScore < 0.8 ? 'low-confidence-row' : '';
  // };

  return (
    <div style={{ padding: '16px' }}>
      <Title level={4} style={{ marginBottom: '16px' }}>
        Actor Review
      </Title>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Space style={{ marginBottom: '16px' }}>
          <Button type="primary" icon={<MergeCellsOutlined />} onClick={handleMerge} disabled={selectedRowKeys.length < 2}>
            Gộp đã chọn ({selectedRowKeys.length})
          </Button>
          <Button type="dashed" icon={<PlusOutlined />} onClick={handleAdd}>
            Thêm Actor
          </Button>
        </Space>
        <Button type="primary" onClick={() => onConfirm(actors)} disabled={actors.length === 0}>
          Xác nhận và tiếp tục
        </Button>
      </div>

      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={actors}
        rowKey="id"
        // rowClassName={rowClassName}
        pagination={{ pageSize: 10 }}
        style={{
          backgroundColor: 'white',
        }}
      />

      <style>{`
        .low-confidence-row {
          background-color: #fffbe6 !important;
        }
        .low-confidence-row:hover {
          background-color: #fff9e6 !important;
        }
      `}</style>
    </div>
  );
};

export default ActorReview;
