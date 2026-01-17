// src/components/StructuredInput.tsx
import { Input, Form, Button, Flex, Typography, Select, Card, Divider } from 'antd';
import { useState } from 'react';
import { KeywordSuggester } from './KeywordSuggester';
import { validateNonActor } from '../utils/nonActorValidator';
import { DeleteOutlined, PlusOutlined, SendOutlined } from '@ant-design/icons';
import Paragraph from 'antd/es/typography/Paragraph';

const { Text, Title } = Typography;
const { Option } = Select;

interface SvoBlock {
  id: string;
  article: string;
  actor: string;
  goal: string;
  benefit: string;
  actorError?: string;
  goalError?: string;
  benefitError?: string;
}

interface StructuredInputProps {
  onSubmit: (fullText: string, blocks: SvoBlock[]) => void;
  isSubmitting?: boolean;
}

export const StructuredInput = ({ onSubmit, isSubmitting }: StructuredInputProps) => {
  const [blocks, setBlocks] = useState<SvoBlock[]>(() => [{ id: Date.now().toString(), article: 'a', actor: '', goal: '', benefit: '' }]);

  const handleAddBlock = () => {
    setBlocks((prev) => [...prev, { id: Date.now().toString(), article: 'a', actor: '', goal: '', benefit: '' }]);
  };

  const handleRemoveBlock = (id: string) => {
    if (blocks.length > 1) {
      setBlocks((prev) => prev.filter((b) => b.id !== id));
    }
  };

  const updateBlock = (id: string, field: keyof SvoBlock, value: string) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== id) return block;
        const updatedBlock = { ...block, [field]: value };
        if (field === 'actor') {
          const validation = validateNonActor(value);
          updatedBlock.actorError = validation.isValid ? '' : validation.error || '';
        } else if (field === 'goal') {
          updatedBlock.goalError = value.trim() ? '' : 'Goal không được để trống';
        } else if (field === 'benefit') {
          updatedBlock.benefitError = value.trim() ? '' : 'Benefit không được để trống';
        }

        return updatedBlock;
      })
    );
  };

  const handleSubmit = () => {
    let hasError = false;
    const validatedBlocks = blocks.map((block) => {
      const actorVal = validateNonActor(block.actor);
      if (!actorVal.isValid) hasError = true;
      if (!block.goal.trim() || !block.benefit.trim()) hasError = true;

      return {
        ...block,
        actorError: actorVal.isValid ? undefined : actorVal.error || '',
        goalError: !block.goal.trim() ? 'Goal không được để trống' : '',
        benefitError: !block.benefit.trim() ? 'Benefit không được để trống' : '',
      };
    });
    if (hasError) {
      setBlocks(validatedBlocks);
      return;
    }
    // Generate Paragraph
    const fullParagraph = blocks.map((b) => `As ${b.article} ${b.actor}, I want to ${b.goal} so that ${b.benefit}.`).join(' ');

    onSubmit(fullParagraph, blocks);
  };

  // Helper to check if form is valid for enabling the button
  const isValid = blocks.every((b) => b.actor.trim() && b.goal.trim() && b.benefit.trim() && !b.actorError);

  return (
    <Form layout="vertical" style={{ padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
      <Title level={5} style={{ marginBottom: '16px' }}>
        Nhập theo cấu trúc: "As a/an/the &lt;actor&gt;, I want to &lt;goal&gt; so that &lt;benefit&gt;"
      </Title>

      {blocks.map((block, index) => (
        <Card
          key={block.id}
          size="small"
          style={{ marginBottom: '12px', borderColor: block.actorError ? '#ffa39e' : undefined }}
          title={
            <Text strong style={{ color: '#1890ff' }}>
              Sentence #{index + 1}
            </Text>
          }
          extra={
            blocks.length > 1 && <Button type="text" danger icon={<DeleteOutlined />} disabled={isSubmitting} onClick={() => handleRemoveBlock(block.id)} />
          }
        >
          <Form.Item style={{ marginBottom: 8 }} validateStatus={block.actorError ? 'error' : ''} help={block.actorError}>
            <Flex gap="small">
              <span style={{ minWidth: 20 }}>As</span>
              <Select value={block.article} onChange={(val) => updateBlock(block.id, 'article', val)} style={{ width: 70 }} disabled={isSubmitting}>
                <Option value="a">a</Option>
                <Option value="an">an</Option>
                <Option value="the">the</Option>
              </Select>
              <Input
                placeholder="Actor (e.g. User)"
                value={block.actor}
                onChange={(e) => updateBlock(block.id, 'actor', e.target.value)}
                status={block.actorError ? 'error' : ''}
                disabled={isSubmitting}
              />
            </Flex>
          </Form.Item>

          <Form.Item style={{ marginBottom: 8 }} validateStatus={block.goalError ? 'error' : ''} help={block.goalError}>
            <Flex gap="small" align="center">
              <span style={{ minWidth: 60 }}>I want to</span>
              <div style={{ flex: 1 }}>
                <KeywordSuggester
                  value={block.goal}
                  onChange={(val) => updateBlock(block.id, 'goal', val)}
                  placeholder="Goal (e.g. login)"
                  isSubmitting={isSubmitting}
                />
              </div>
            </Flex>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }} validateStatus={block.benefitError ? 'error' : ''} help={block.benefitError}>
            <Flex gap="small" align="center">
              <span style={{ minWidth: 60 }}>so that</span>
              <Input.TextArea
                autoSize={{ minRows: 1, maxRows: 3 }}
                placeholder="Benefit"
                value={block.benefit}
                onChange={(e) => updateBlock(block.id, 'benefit', e.target.value)}
                disabled={isSubmitting}
                style={{ flex: 1 }}
              />
            </Flex>
          </Form.Item>
        </Card>
      ))}
      <Button disabled={isSubmitting} type="dashed" block icon={<PlusOutlined />} onClick={handleAddBlock} style={{ marginBottom: '16px' }}>
        Add Another Sentence
      </Button>
      <Divider style={{ margin: '12px 0' }} />

      <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '4px', marginBottom: '12px', border: '1px solid #f0f0f0' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          Live Preview:
        </Text>
        <Paragraph ellipsis={{ rows: 3, expandable: true, symbol: 'more' }} style={{ margin: 0, color: '#4B54D5' }}>
          {blocks.map((b, i) => (
            <span key={i}>
              As {b.article} <strong>{b.actor || '...'}</strong>, I want to <strong>{b.goal || '...'}</strong> so that <strong>{b.benefit || '...'}</strong>
              .&nbsp;
            </span>
          ))}
        </Paragraph>
      </div>

      <Button type="primary" icon={<SendOutlined />} onClick={handleSubmit} disabled={!isValid || isSubmitting} loading={isSubmitting} block size="large">
        Submit Input
      </Button>
    </Form>
  );
};

export default StructuredInput;
