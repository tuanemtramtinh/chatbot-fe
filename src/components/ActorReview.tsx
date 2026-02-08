/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Table, Button, Space, Typography, message as antdMessage, Popconfirm, Input, Card, Badge, Tooltip } from 'antd';
import { DeleteOutlined, MergeCellsOutlined, PlusOutlined, CheckOutlined, UndoOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useEffect, useState, useRef } from 'react';
import type { ActorEntity, AliasEntity } from './api';
import { UserStoriesPanel } from './UserStoriesPanel';

const { Title, Text } = Typography;

// --- TYPES ---
export interface UIActor extends ActorEntity {
  id: string; // React Key
  status: 'candidate' | 'approved';
}

interface ActorReviewProps {
  actors: UIActor[];
  rawStoryText: string;
  onConfirm: (candidates: ActorEntity[], approved: ActorEntity[]) => void;
}

export const ActorReview = ({ actors: initialActors, rawStoryText, onConfirm }: ActorReviewProps) => {
  // --- STATE ---
  const [candidates, setCandidates] = useState<UIActor[]>([]);
  const [approved, setApproved] = useState<UIActor[]>([]);
  const [selectedCandidateKeys, setSelectedCandidateKeys] = useState<React.Key[]>([]);

  const initialized = useRef(false);

  useEffect(() => {
    if (initialActors.length > 0 && !initialized.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCandidates(initialActors.filter((a) => a.status !== 'approved'));
      setApproved(initialActors.filter((a) => a.status === 'approved'));
      initialized.current = true;
    }
  }, [initialActors]);

  const updateLists = (newCandidates: UIActor[], newApproved: UIActor[]) => {
    setCandidates(newCandidates);
    setApproved(newApproved);
  };

  // --- ACTIONS: APPROVE / REVERT / DELETE ---

  const handleApprove = (id: string) => {
    const actor = candidates.find((a) => a.id === id);
    if (actor) {
      const newCandidates = candidates.filter((a) => a.id !== id);
      const newApproved = [...approved, { ...actor, status: 'approved' as const }];
      setSelectedCandidateKeys((prev) => prev.filter((k) => k !== id));
      updateLists(newCandidates, newApproved);
      antdMessage.success('Actor approved');
    }
  };

  const handleRevert = (id: string) => {
    const actor = approved.find((a) => a.id === id);
    if (actor) {
      const newApproved = approved.filter((a) => a.id !== id);
      const newCandidates = [...candidates, { ...actor, status: 'candidate' as const }];
      updateLists(newCandidates, newApproved);
    }
  };

  const handleApproveAll = () => {
    const all = [...approved, ...candidates.map((c) => ({ ...c, status: 'approved' as const }))];
    setSelectedCandidateKeys([]);
    updateLists([], all);
    antdMessage.success('Approved all candidates');
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
  };

  const handleAddCandidate = () => {
    const newActor: UIActor = {
      id: Date.now().toString(),
      actor: `New Actor`,
      aliases: [],
      sentence_idx: [],
      status: 'candidate',
    };
    updateLists([...candidates, newActor], approved);
  };

  // --- ACTIONS: EDITING DATA ---

  // 1. Edit Main Fields (Name, Sentence Indices)
  const handleFieldChange = (id: string, field: keyof UIActor, value: any, listType: 'candidate' | 'approved') => {
    const list = listType === 'candidate' ? candidates : approved;
    const newList = list.map((a) => (a.id === id ? { ...a, [field]: value } : a));

    if (listType === 'candidate') updateLists(newList, approved);
    else updateLists(candidates, newList);
  };

  // 2. Edit Alias Fields (Name, Indices)
  const handleAliasChange = (actorId: string, aliasIdx: number, field: keyof AliasEntity, value: any, listType: 'candidate' | 'approved') => {
    const list = listType === 'candidate' ? candidates : approved;
    const newList = list.map((actor) => {
      if (actor.id !== actorId) return actor;
      const newAliases = [...actor.aliases];
      // Safely update the specific alias
      newAliases[aliasIdx] = { ...newAliases[aliasIdx], [field]: value };
      return { ...actor, aliases: newAliases };
    });

    if (listType === 'candidate') updateLists(newList, approved);
    else updateLists(candidates, newList);
  };

  // 3. Add/Remove Alias
  const addAlias = (actorId: string, listType: 'candidate' | 'approved') => {
    const list = listType === 'candidate' ? candidates : approved;
    const newList = list.map((actor) => {
      if (actor.id !== actorId) return actor;
      return { ...actor, aliases: [...actor.aliases, { alias: 'New Alias', sentences: [] }] };
    });
    if (listType === 'candidate') updateLists(newList, approved);
    else updateLists(candidates, newList);
  };

  const removeAlias = (actorId: string, aliasIdx: number, listType: 'candidate' | 'approved') => {
    const list = listType === 'candidate' ? candidates : approved;
    const newList = list.map((actor) => {
      if (actor.id !== actorId) return actor;
      return { ...actor, aliases: actor.aliases.filter((_, i) => i !== aliasIdx) };
    });
    if (listType === 'candidate') updateLists(newList, approved);
    else updateLists(candidates, newList);
  };

  // --- ACTIONS: MERGE ---

  const handleMergeCandidates = () => {
    if (selectedCandidateKeys.length < 2) {
      antdMessage.warning('Select at least 2 actors to merge');
      return;
    }

    const selectedActors = candidates.filter((actor) => selectedCandidateKeys.includes(actor.id));
    const firstActor = selectedActors[0];
    const mergedNames = selectedActors.map((a) => a.actor).join(' / ');

    // Merge Aliases: Flatten all aliases from selected actors
    const allAliases = selectedActors.flatMap((a) => a.aliases);
    // Optional: You might want to deduplicate here based on alias name

    // Merge Sentences: Unique & Sorted
    const mergedSentences = Array.from(new Set(selectedActors.flatMap((a) => a.sentence_idx || []))).sort((a, b) => a - b);

    const mergedActor: UIActor = {
      id: firstActor.id,
      actor: mergedNames,
      aliases: allAliases,
      sentence_idx: mergedSentences,
      status: 'candidate',
    };

    const newCandidates = [...candidates.filter((actor) => !selectedCandidateKeys.includes(actor.id)), mergedActor];
    setSelectedCandidateKeys([]);
    updateLists(newCandidates, approved);
    antdMessage.success('Merged successfully');
  };

  // --- RENDER HELPERS ---

  // Helper: Parse string "1, 2" into number array [1, 2]
  const parseIndices = (val: string): number[] => {
    return val
      .split(',')
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n));
  };

  // 1. Sentence Input Component
  const renderSentenceInput = (indices: number[], onChange: (val: number[]) => void) => (
    <Input
      value={indices.join(', ')}
      onChange={(e) => onChange(parseIndices(e.target.value))}
      placeholder="e.g. 0, 1"
      style={{ width: '100%', fontSize: 12 }}
      size="small"
    />
  );

  // 2. Complex Alias Column Renderer
  const renderAliasColumn = (record: UIActor, listType: 'candidate' | 'approved') => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {record.aliases.map((aliasItem, idx) => (
        <div key={idx} style={{ display: 'flex', gap: 4, alignItems: 'center', border: '1px solid #f0f0f0', padding: 2, borderRadius: 4 }}>
          {/* Alias Name Input */}
          <Input
            value={aliasItem.alias}
            onChange={(e) => handleAliasChange(record.id, idx, 'alias', e.target.value, listType)}
            size="small"
            variant="borderless"
            style={{ flex: 1, minWidth: 60 }}
          />

          {/* Alias Sentences Input */}
          <Tooltip title="Sentence Indices (e.g. 0, 2)">
            <div style={{ width: 60 }}>
              {renderSentenceInput(aliasItem.sentences, (nums) => handleAliasChange(record.id, idx, 'sentences', nums, listType))}
            </div>
          </Tooltip>

          {/* Remove Alias Button */}
          <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => removeAlias(record.id, idx, listType)} />
        </div>
      ))}
      <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => addAlias(record.id, listType)}>
        Add Alias
      </Button>
    </div>
  );

  // 3. Main Columns Definition
  const getColumns = (listType: 'candidate' | 'approved') => [
    {
      title: 'Actor Name',
      dataIndex: 'actor',
      width: '25%',
      render: (text: string, record: UIActor) => (
        <Input
          value={text}
          onChange={(e) => handleFieldChange(record.id, 'actor', e.target.value, listType)}
          variant="borderless"
          placeholder="Actor Name"
          style={{ padding: '4px 0', fontWeight: 600 }}
        />
      ),
    },
    {
      title: 'Aliases & Sentences',
      dataIndex: 'aliases',
      width: '45%',
      render: (_: any, record: UIActor) => renderAliasColumn(record, listType),
    },
    {
      title: 'Main Found In',
      dataIndex: 'sentence_idx',
      width: '20%',
      render: (idxs: number[], record: UIActor) => (
        <Tooltip title="Sentences where the main actor name appears">
          {renderSentenceInput(idxs, (nums) => handleFieldChange(record.id, 'sentence_idx', nums, listType))}
        </Tooltip>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: '10%',
      render: (_: any, record: UIActor) => (
        <Space>
          {listType === 'candidate' ? (
            <Tooltip title="Approve">
              <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleApprove(record.id)} />
            </Tooltip>
          ) : (
            <Tooltip title="Revert">
              <Button type="link" size="small" icon={<UndoOutlined />} onClick={() => handleRevert(record.id)} />
            </Tooltip>
          )}
          <Popconfirm title="Delete?" onConfirm={() => handleDelete(record.id, listType)}>
            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleConfirm = () => {
    // Strip UI fields before sending back
    const cleanCandidates = candidates.map(({ id, status, ...rest }) => rest);
    const cleanApproved = approved.map(({ id, status, ...rest }) => rest);
    onConfirm(cleanCandidates, cleanApproved);
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
      {/* 1. REFERENCE PANEL (Shows sentences with indices) */}
      <UserStoriesPanel rawText={rawStoryText} />

      {/* 2. HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>
          Review Actors
        </Title>
        <Button type="primary" size="large" onClick={handleConfirm} disabled={approved.length === 0}>
          Confirm Approved ({approved.length}) & Continue
        </Button>
      </div>

      {/* 3. CANDIDATES TABLE */}
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
          <Space>
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
          columns={getColumns('candidate')}
          dataSource={candidates}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <div style={{ textAlign: 'center', color: '#1890ff' }}>
        <ArrowDownOutlined style={{ fontSize: '24px' }} />
      </div>

      {/* 4. APPROVED TABLE */}
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
        <Table columns={getColumns('approved')} dataSource={approved} rowKey="id" pagination={false} locale={{ emptyText: 'No actors approved yet.' }} />
      </Card>
    </div>
  );
};

export default ActorReview;
