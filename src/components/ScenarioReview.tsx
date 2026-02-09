// src/components/UseCaseDetailEditor.tsx
import { Table, Input, Card, Typography, Empty, Flex, Tooltip, Progress } from 'antd';
import { useEffect, useState } from 'react';
import type { UseCaseDetail } from './api';

const { Title, Text } = Typography;
const { TextArea } = Input;

// 1. Define the Data Structure

interface UseCaseDetailEditorProps {
  data: UseCaseDetail | null;
  onUpdate: (updatedData: UseCaseDetail) => void;
}

// Helper to structure the table rows
interface RowData {
  key: string;
  field: string; // The label (e.g., "Pre-conditions")
  value: string; // The editable value
  dataKey: keyof UseCaseDetail; // The key in the data object
}

export const UseCaseDetailEditor = ({ data, onUpdate }: UseCaseDetailEditorProps) => {
  const [editingData, setEditingData] = useState<UseCaseDetail | null>(null);

  // Sync internal state when prop data changes
  useEffect(() => {
    setEditingData(data);
  }, [data]);

  const handleCreateChange = (key: keyof UseCaseDetail, value: string) => {
    if (!editingData) return;
    const newData = { ...editingData, [key]: value };
    setEditingData(newData);
    onUpdate(newData); // Notify parent immediately
  };

  if (!editingData) {
    return (
      <div
        style={{
          height: '300px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#fafafa',
          border: '1px dashed #d9d9d9',
          marginTop: 16,
        }}
      >
        <Empty description="Select a Use Case node to view details" />
      </div>
    );
  }

  // Define rows for the table
  const dataSource: RowData[] = [
    { key: '1', field: 'Use Case Name', value: editingData.name, dataKey: 'name' },
    { key: '2', field: 'Primary Actor(s)', value: editingData.actors, dataKey: 'actors' },
    { key: '3', field: 'Description', value: editingData.description, dataKey: 'description' },
    { key: '4', field: 'Pre-conditions', value: editingData.preconditions, dataKey: 'preconditions' },
    { key: '5', field: 'Post-conditions', value: editingData.postconditions, dataKey: 'postconditions' },
    { key: '6', field: 'Main Flow', value: editingData.mainFlow, dataKey: 'mainFlow' },
    { key: '7', field: 'Alternative Flows', value: editingData.alternativeFlow, dataKey: 'alternativeFlow' },
  ];

  const columns = [
    {
      title: 'Field',
      dataIndex: 'field',
      key: 'field',
      width: '25%',
      render: (text: string) => <strong style={{ color: '#555' }}>{text}</strong>,
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (text: string, record: RowData) => {
        if (record.dataKey === 'mainFlow' || record.dataKey === 'alternativeFlow') {
          return (
            <TextArea
              value={text}
              onChange={(e) => handleCreateChange(record.dataKey, e.target.value)}
              autoSize={{ minRows: 3, maxRows: 10 }}
              variant="borderless"
              style={{ padding: 0, resize: 'none' }}
              placeholder="Enter steps..."
            />
          );
        }
        return (
          <TextArea
            value={text}
            onChange={(e) => handleCreateChange(record.dataKey, e.target.value)}
            autoSize={{ minRows: 1, maxRows: 4 }}
            variant="borderless"
            style={{ padding: 0, resize: 'none', fontWeight: record.dataKey === 'name' ? 'bold' : 'normal' }}
          />
        );
      },
    },
  ];

  // Helper to get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#52c41a'; // Green
    if (score >= 60) return '#faad14'; // Yellow
    return '#ff4d4f'; // Red
  };

  // Calculate Average
  const averageScore = Math.round((editingData.scores.completeness + editingData.scores.correctness + editingData.scores.relevance) / 3);

  return (
    <Card
      style={{ marginTop: '16px', borderTop: '3px solid #1890ff' }}
      styles={{ body: { padding: 0 } }}
      title={
        <Flex justify="space-between" align="center">
          <Title level={5} style={{ margin: 0 }}>
            Specification: {editingData.name}
          </Title>

          {/* --- NEW: SCOREBOARD SECTION --- */}
          <Flex gap="large" align="center" style={{ fontSize: '12px' }}>
            <Tooltip title="Does the scenario cover all necessary steps?">
              <Flex gap="small" align="center">
                <Text type="secondary">Completeness</Text>
                <Progress type="circle" percent={editingData.scores.completeness} width={30} strokeColor={getScoreColor(editingData.scores.completeness)} />
              </Flex>
            </Tooltip>

            <Tooltip title="Is the logic sound and free of contradictions?">
              <Flex gap="small" align="center">
                <Text type="secondary">Correctness</Text>
                <Progress type="circle" percent={editingData.scores.correctness} width={30} strokeColor={getScoreColor(editingData.scores.correctness)} />
              </Flex>
            </Tooltip>

            <Tooltip title="Does this align with the original requirement?">
              <Flex gap="small" align="center">
                <Text type="secondary">Relevance</Text>
                <Progress type="circle" percent={editingData.scores.relevance} width={30} strokeColor={getScoreColor(editingData.scores.relevance)} />
              </Flex>
            </Tooltip>

            <div style={{ borderLeft: '1px solid #f0f0f0', paddingLeft: '16px', marginLeft: '8px' }}>
              <Text strong style={{ color: getScoreColor(averageScore) }}>
                Avg: {averageScore}%
              </Text>
            </div>
          </Flex>
        </Flex>
      }
    >
      <Table
        dataSource={dataSource}
        columns={columns}
        pagination={false}
        bordered
        showHeader={false} // Hide header to look like a spec document
        size="middle"
      />
    </Card>
  );
};
