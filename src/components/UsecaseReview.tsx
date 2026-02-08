/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/UsecaseReview.tsx
import { Table, Button, Space, Typography, message as antdMessage, Popconfirm, Input, Card, Badge, Tooltip } from 'antd';
import { DeleteOutlined, MergeCellsOutlined, PlusOutlined, CheckOutlined, UndoOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useEffect, useState, useRef } from 'react';

const { Title, Text } = Typography;

export interface Usecase {
  id: string;
  name: string;
  alias: string[];
  sentences_idx: number[];
  status?: 'candidate' | 'approved';
}

interface UsecaseReviewProps {
  usecases: Usecase[];
  onConfirm: (candidates: Usecase[], approved: Usecase[]) => void;
}

export const UsecaseReview = ({ usecases: initialUsecases, onConfirm }: UsecaseReviewProps) => {
  // --- STATE ---
  const [candidates, setCandidates] = useState<Usecase[]>([]);
  const [approved, setApproved] = useState<Usecase[]>([]);
  const [selectedCandidateKeys, setSelectedCandidateKeys] = useState<React.Key[]>([]);
  // Use Ref to prevent cascading renders (only load initial data once)
  const hasInitialized = useRef(false);
  useEffect(() => {
    // Only load if we have data and haven't initialized yet
    if (initialUsecases.length > 0 && !hasInitialized.current) {
      const incomingCandidates = initialUsecases.filter((a) => a.status !== 'approved');
      const incomingApproved = initialUsecases.filter((a) => a.status === 'approved');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCandidates(incomingCandidates);
      setApproved(incomingApproved);
      hasInitialized.current = true;
    }
  }, [initialUsecases]);

  const updateLists = (newCandidates: Usecase[], newApproved: Usecase[]) => {
    setCandidates(newCandidates);
    setApproved(newApproved);
  };

  // --- ACTIONS ---
  const handleApprove = (id: string) => {
    const actorToMove = candidates.find((a) => a.id === id);
    if (actorToMove) {
      const newCandidates = candidates.filter((a) => a.id !== id);
      const newApproved = [...approved, actorToMove];

      setSelectedCandidateKeys((prev) => prev.filter((k) => k !== id));
      updateLists(newCandidates, newApproved);
      antdMessage.success('Đã duyệt Usecase');
    }
  };

  const handleRevert = (id: string) => {
    const actorToMove = approved.find((a) => a.id === id);
    if (actorToMove) {
      const newApproved = approved.filter((a) => a.id !== id);
      const newCandidates = [...candidates, actorToMove];

      updateLists(newCandidates, newApproved);
    }
  };

  const handleApproveAll = () => {
    const newApproved = [...approved, ...candidates];
    setSelectedCandidateKeys([]);
    updateLists([], newApproved);
    antdMessage.success('Đã duyệt tất cả');
  };

  const handleDelete = (id: string, listType: 'candidate' | 'approved') => {
    if (listType === 'candidate') {
      const newCandidates = candidates.filter((a) => a.id !== id);
      setSelectedCandidateKeys((prev) => prev.filter((k) => k !== id));
      updateLists(newCandidates, approved);
    } else {
      const newApproved = approved.filter((a) => a.id !== id);
      updateLists(candidates, newApproved);
    }
    antdMessage.success('Đã xóa Usecase');
  };

  const handleAddCandidate = () => {
    const newUsecase: Usecase = {
      id: Date.now().toString(),
      name: `New Usecase`,
      alias: [],
      sentences_idx: [],
    };
    const newCandidates = [...candidates, newUsecase];
    updateLists(newCandidates, approved);
  };

  const handleFieldChange = (id: string, field: keyof Usecase, value: any, listType: 'candidate' | 'approved') => {
    if (listType === 'candidate') {
      const newCandidates = candidates.map((a) => (a.id === id ? { ...a, [field]: value } : a));
      updateLists(newCandidates, approved);
    } else {
      const newApproved = approved.map((a) => (a.id === id ? { ...a, [field]: value } : a));
      updateLists(candidates, newApproved);
    }
  };

  const handleMergeCandidates = () => {
    if (selectedCandidateKeys.length < 2) {
      antdMessage.warning('Chọn ít nhất 2 Usecase để gộp');
      return;
    }

    const selectedUsecases = candidates.filter((actor) => selectedCandidateKeys.includes(actor.id));
    const firstUsecase = selectedUsecases[0];
    const mergedNames = selectedUsecases.map((a) => a.name).join(' / ');

    const mergedUsecase: Usecase = {
      id: firstUsecase.id,
      name: mergedNames,
      alias: [],
      sentences_idx: [],
    };

    const newCandidates = [...candidates.filter((actor) => !selectedCandidateKeys.includes(actor.id)), mergedUsecase];

    setSelectedCandidateKeys([]);
    updateLists(newCandidates, approved);
    antdMessage.success('Đã gộp thành công');
  };

  // --- COLUMNS ---
  const renderInput = (text: string, record: Usecase, field: keyof Usecase, listType: 'candidate' | 'approved') => (
    <Input
      value={text}
      onChange={(e) => handleFieldChange(record.id, field, e.target.value, listType)}
      variant="borderless"
      placeholder="Usecase Name"
      style={{ padding: 0, fontWeight: 500 }}
    />
  );

  const candidateColumns = [
    {
      title: 'Tên Usecase (Candidates)',
      dataIndex: 'name',
      key: 'name',
      width: '30%',
      render: (text: string, record: Usecase) => renderInput(text, record, 'name', 'candidate'),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: '10%',
      render: (_: any, record: Usecase) => (
        <Space>
          <Tooltip title="Approve">
            <Button type="link" size="small" shape="circle" icon={<CheckOutlined />} onClick={() => handleApprove(record.id)} />
          </Tooltip>
          <Popconfirm title="Delete?" onConfirm={() => handleDelete(record.id, 'candidate')}>
            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const approvedColumns = [
    {
      title: 'Tên Usecase (Approved)',
      dataIndex: 'name',
      key: 'name',
      width: '30%',
      render: (text: string, record: Usecase) => renderInput(text, record, 'name', 'approved'),
    },
    {
      title: 'Action',
      key: 'action',
      width: '10%',
      render: (_: any, record: Usecase) => (
        <Space>
          <Tooltip title="Revert">
            <Button size="small" type="link" icon={<UndoOutlined />} onClick={() => handleRevert(record.id)} />
          </Tooltip>
          <Popconfirm title="Delete?" onConfirm={() => handleDelete(record.id, 'approved')}>
            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>
          Review & Approve Usecases
        </Title>
        <Button type="primary" size="middle" onClick={() => onConfirm(candidates, approved)} disabled={approved.length === 0}>
          Confirm Approved ({approved.length}) & Continue
        </Button>
      </div>

      {/* --- TABLE 1: CANDIDATES --- */}
      <Card
        size="small"
        title={
          <Space>
            <Badge status="warning" />
            <Text strong>Candidates</Text>
            <Badge count={candidates.length} style={{ backgroundColor: '#faad14' }} />
          </Space>
        }
        extra={
          <Space style={{ padding: 10 }}>
            <Button type="text" icon={<MergeCellsOutlined />} onClick={handleMergeCandidates} disabled={selectedCandidateKeys.length < 2}>
              Merge
            </Button>
            <Button type="text" icon={<ArrowDownOutlined />} onClick={handleApproveAll} disabled={candidates.length === 0}>
              Approve All
            </Button>
            <Button type="dashed" size="middle" icon={<PlusOutlined />} onClick={handleAddCandidate}>
              Add
            </Button>
          </Space>
        }
        style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '300px' }}
        styles={{ body: { flex: 1, overflow: 'auto', padding: 0 } }}
      >
        <Table
          rowSelection={{
            selectedRowKeys: selectedCandidateKeys,
            onChange: setSelectedCandidateKeys,
          }}
          columns={candidateColumns}
          dataSource={candidates}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <div style={{ textAlign: 'center', color: '#1890ff' }}>
        <ArrowDownOutlined style={{ fontSize: '24px' }} />
      </div>

      {/* --- TABLE 2: APPROVED --- */}
      <Card
        size="small"
        title={
          <Space>
            <Badge status="success" />
            <Text strong>Approved</Text>
            <Badge count={approved.length} style={{ backgroundColor: '#52c41a' }} />
          </Space>
        }
        style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '200px', border: '1px solid #b7eb8f' }}
        styles={{ body: { flex: 1, overflow: 'auto', padding: 0 } }}
      >
        <Table columns={approvedColumns} dataSource={approved} rowKey="id" pagination={false} locale={{ emptyText: 'No usecases approved yet.' }} />
      </Card>
    </div>
  );
};

export default UsecaseReview;
