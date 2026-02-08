/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react';
import { Table, Card, Button, Input, Typography, Badge, Tag, List } from 'antd';
import type { BackendUseCase } from './api';

const { Title, Text } = Typography;

interface UsecaseReviewProps {
  usecases: BackendUseCase[];
  // Updated: Returns just the final list of use cases
  onConfirm: (finalList: BackendUseCase[]) => void;
}

export const UsecaseReview = ({ usecases: initialUsecases, onConfirm }: UsecaseReviewProps) => {
  // --- STATE ---
  const [list, setList] = useState<BackendUseCase[]>([]);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialUsecases.length > 0 && !initialized.current) {
      // Map Backend Data -> UI Data
      const mapped = initialUsecases.map((uc, idx) => ({
        ...uc,
        uiId: `uc-${uc.id || idx}-${Date.now()}`,
      }));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setList(mapped);
      initialized.current = true;
    }
  }, [initialUsecases]);

  // --- ACTIONS ---
  const handleFieldChange = (id: number, field: keyof BackendUseCase, value: any) => {
    setList((prev) => prev.map((uc) => (uc.id === id ? { ...uc, [field]: value } : uc)));
  };

  const handleConfirm = () => {
    onConfirm(list);
  };

  // --- RENDER HELPERS ---

  // 1. Expanded Row: User Stories
  const renderExpandedRow = (record: BackendUseCase) => {
    return (
      <div style={{ padding: '8px 16px', background: '#f9f9f9', borderRadius: 4 }}>
        <Text strong style={{ fontSize: 12, color: '#666' }}>
          User Stories & Evidence:
        </Text>
        <List
          size="small"
          dataSource={record.user_stories}
          renderItem={(story) => (
            <List.Item style={{ padding: '4px 0', border: 'none' }}>
              <Text style={{ fontSize: 13 }}>
                <Badge status="default" />
                <Text strong>{story.actor}</Text> wants to <Text strong>{story.action}</Text>
                <span style={{ color: '#999', marginLeft: 8 }}>(Sentence #{story.sentence_idx})</span>
              </Text>
              <div style={{ paddingLeft: 20, fontSize: 12, color: '#888', fontStyle: 'italic' }}>"{story.original_sentence}"</div>
            </List.Item>
          )}
          locale={{ emptyText: <Text type="secondary">No user stories linked.</Text> }}
        />
      </div>
    );
  };

  // 2. Relationship Renderer
  const renderRelationships = (rels: { type: string; target_use_case: string }[] | undefined) => {
    if (!rels || rels.length === 0) return <Text type="secondary">-</Text>;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {rels.map((rel, idx) => (
          <Tag key={idx} color={rel.type === 'include' ? 'blue' : 'orange'}>
            &lt;&lt;{rel.type}&gt;&gt; {rel.target_use_case}
          </Tag>
        ))}
      </div>
    );
  };

  // 3. Columns Definition
  const columns = [
    {
      title: 'Use Case Name',
      dataIndex: 'name',
      width: '25%',
      render: (text: string, record: BackendUseCase) => (
        <Input
          value={text}
          onChange={(e) => handleFieldChange(record.id, 'name', e.target.value)}
          variant="borderless"
          style={{ fontWeight: 600 }}
          placeholder="Use Case Name"
        />
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      width: '35%',
      render: (text: string, record: BackendUseCase) => (
        <Input.TextArea
          value={text}
          onChange={(e) => handleFieldChange(record.id, 'description', e.target.value)}
          variant="borderless"
          autoSize={{ minRows: 1, maxRows: 3 }}
          style={{ fontSize: 13, color: '#555' }}
          placeholder="Description"
        />
      ),
    },
    {
      title: 'Relationships',
      dataIndex: 'relationships',
      width: '15%',
      render: (rels: any) => renderRelationships(rels),
    },
    {
      title: 'Actors',
      dataIndex: 'participating_actors',
      width: '15%',
      render: (actors: string[]) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {actors.map((a) => (
            <Tag key={a}>{a}</Tag>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>
          Review Use Cases
        </Title>
        <Button type="primary" size="large" onClick={handleConfirm} disabled={list.length === 0}>
          Confirm & Generate Diagram
        </Button>
      </div>

      {/* MAIN TABLE */}
      <Card
        size="small"
        style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        styles={{ body: { flex: 1, overflow: 'auto', padding: 0 } }}
      >
        <Table
          columns={columns}
          dataSource={list}
          rowKey="uiId"
          pagination={false}
          expandable={{
            expandedRowRender: renderExpandedRow,
            rowExpandable: (record) => record.user_stories.length > 0,
          }}
          locale={{ emptyText: 'No use cases generated.' }}
        />
      </Card>
    </div>
  );
};
