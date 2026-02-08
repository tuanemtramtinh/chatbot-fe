// src/components/UserStoriesPanel.tsx
import { Card, Typography, Divider } from 'antd';

const { Text } = Typography;

interface UserStoriesPanelProps {
  rawText: string;
}

export const UserStoriesPanel = ({ rawText }: UserStoriesPanelProps) => {
  const sentences = rawText.split('\n').filter((s) => s.trim().length > 0);

  return (
    <Card
      size="small"
      title="Reference: User Stories"
      style={{ marginBottom: 16, maxHeight: '200px', overflowY: 'auto', background: '#fafafa' }}
      styles={{ body: { padding: '8px 12px' } }}
    >
      {sentences.map((sent, idx) => (
        <div key={idx} style={{ marginBottom: 4 }}>
          <Text type="secondary" style={{ marginRight: 8, userSelect: 'none' }}>
            [{idx}]
          </Text>
          <Text>{sent}</Text>
          {idx < sentences.length - 1 && <Divider style={{ margin: '4px 0' }} />}
        </div>
      ))}
    </Card>
  );
};
