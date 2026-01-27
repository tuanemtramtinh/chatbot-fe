// src/components/MessageHistory.tsx
import { DeleteOutlined, MessageOutlined } from '@ant-design/icons';
import { Card, Flex, Button, Empty, Typography } from 'antd';
import { useLocalChat } from '../hooks/useLocalChat';

const { Text } = Typography;

const formatTimeAgo = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'vừa xong';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
};

export const MessageHistory = () => {
  const { conversations, currentConversationId, switchConversation, deleteConversation } = useLocalChat();

  if (conversations.length === 0) {
    return (
      <Empty
        description={
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Chưa có cuộc hội thoại
          </Text>
        }
        style={{ padding: '16px' }}
      />
    );
  }

  return (
    <Flex flex={1} vertical gap="small" style={{ overflowY: 'auto', maxHeight: '400px' }}>
      {conversations
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .map((conv) => (
          <Card
            key={conv.id}
            hoverable
            size="small"
            style={{
              cursor: 'pointer',
              border: currentConversationId === conv.id ? '2px solid #4B54D5' : '1px solid #d9d9d9',
              backgroundColor: currentConversationId === conv.id ? '#f0f4ff' : 'white',
            }}
            onClick={() => switchConversation(conv.id)}
            styles={{ body: { padding: '8px 12px' } }}
          >
            <Flex vertical gap="small">
              <Flex justify="space-between" align="center">
                <Flex gap="small" align="center" style={{ flex: 1, minWidth: 0 }}>
                  <MessageOutlined style={{ color: '#4B54D5' }} />
                  <Text
                    strong
                    ellipsis
                    style={{
                      fontSize: '13px',
                      color: currentConversationId === conv.id ? '#4B54D5' : 'inherit',
                    }}
                  >
                    {conv.title}
                  </Text>
                </Flex>
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                  style={{ padding: '0 4px' }}
                />
              </Flex>
              <Text type="secondary" style={{ fontSize: '11px' }}>
                {formatTimeAgo(conv.updatedAt)}
              </Text>
              <Text type="secondary" style={{ fontSize: '11px' }}>
                {conv.messages.length} tin nhắn
              </Text>
            </Flex>
          </Card>
        ))}
    </Flex>
  );
};

export default MessageHistory;
