// Guide:
// Format_def for sentence type format
// All field are required

/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/StructuredInput.tsx
import { Input, Form, Button, Flex, Typography, Select, Card, Divider, Tooltip } from 'antd';
import { useState } from 'react';
import { KeywordSuggester } from './KeywordSuggester';
import { DeleteOutlined, PlusOutlined, SendOutlined, InfoCircleOutlined } from '@ant-design/icons';
import Paragraph from 'antd/es/typography/Paragraph';
import { validateNonActor } from '../utils/nonActorValidator';

const { Text, Title } = Typography;
const { Option } = Select;

// --- 1. CONFIGURATION: Define your Sentence Structures here ---
type InputType = 'text' | 'select' | 'textarea' | 'suggester';

interface FieldConfig {
  key: string;
  label?: string; // Prefix label (e.g., "As", "Given")
  placeholder: string;
  type: InputType;
  options?: string[]; // For 'select' type
  width?: string | number;
  rows?: number; // For 'textarea'
}

interface FormatDefinition {
  label: string;
  fields: FieldConfig[];
  template: (values: Record<string, string>) => string;
}

const FORMAT_DEFS: Record<string, FormatDefinition> = {
  user_story: {
    label: 'User Story',
    fields: [
      { key: 'article', label: 'As', type: 'select', options: ['a', 'an', 'the'], width: 70, placeholder: '-' },
      { key: 'actor', type: 'text', placeholder: 'Actor (e.g. User)', width: '25%' },
      { key: 'action', label: 'I want to', type: 'suggester', placeholder: 'Action (e.g. login)' },
      { key: 'benefit', label: 'so that', type: 'textarea', placeholder: 'Benefit (e.g. access data)', rows: 1 },
    ],
    template: (v) => `As ${v.article} ${v.actor}, I want to ${v.action} so that ${v.benefit}.`,
  },
  system_req: {
    label: 'System Requirement',
    fields: [
      { key: 'actor', label: 'The', type: 'text', placeholder: 'System/Component', width: '40%' },
      { key: 'action', label: 'shall', type: 'suggester', placeholder: 'Function/Behavior (e.g. validate input)' },
    ],
    template: (v) => `The ${v.actor} shall ${v.action}.`,
  },
  gherkin: {
    label: 'Gherkin (Scenario)',
    fields: [
      { key: 'given', label: 'Given', type: 'text', placeholder: 'Precondition (e.g. User is logged in)' },
      { key: 'when', label: 'When', type: 'text', placeholder: 'Event (e.g. User clicks save)' },
      { key: 'then', label: 'Then', type: 'textarea', placeholder: 'Result (e.g. Data is saved)', rows: 2 },
    ],
    template: (v) => `Given ${v.given}, When ${v.when}, Then ${v.then}.`,
  },
};

// --- TYPES ---

interface Block {
  id: string;
  format: keyof typeof FORMAT_DEFS;
  values: Record<string, string>; // Stores dynamic values like { actor: 'User', action: 'Login' }
  errors: Record<string, string>; // Stores errors per field
}

interface StructuredInputProps {
  onSubmit: (fullText: string, blocks: any[]) => void;
  isSubmitting?: boolean;
}

export const StructuredInput = ({ onSubmit, isSubmitting }: StructuredInputProps) => {
  // Initialize with one default User Story block
  const [blocks, setBlocks] = useState<Block[]>(() => [
    {
      id: Date.now().toString(),
      format: 'user_story',
      values: { article: 'a', actor: '', action: '', benefit: '' }, // Initial defaults
      errors: {},
    },
  ]);

  // --- ACTIONS ---

  const handleAddBlock = () => {
    setBlocks((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        format: 'user_story',
        values: { article: 'a', actor: '', action: '', benefit: '' },
        errors: {},
      },
    ]);
  };

  const handleRemoveBlock = (id: string) => {
    if (blocks.length > 1) {
      setBlocks((prev) => prev.filter((b) => b.id !== id));
    }
  };

  const handleFormatChange = (id: string, newFormat: string) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== id) return block;

        // When format changes, reset values to empty strings based on new fields
        const newFields = FORMAT_DEFS[newFormat].fields;
        const newValues: Record<string, string> = {};
        newFields.forEach((f) => {
          // Keep existing value if key matches (e.g. 'actor' might persist), else reset
          newValues[f.key] = block.values[f.key] || (f.key === 'article' ? 'a' : '');
        });

        return { ...block, format: newFormat, values: newValues, errors: {} };
      }),
    );
  };

  const updateValue = (id: string, fieldKey: string, value: string) => {
    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== id) return block;

        const newValues = { ...block.values, [fieldKey]: value };
        const newErrors = { ...block.errors };

        // 1. Basic Required Check
        if (!value.trim()) {
          newErrors[fieldKey] = 'This field is required';
        } else {
          delete newErrors[fieldKey];
        }

        // 2. Specific Validation for "Actor" fields
        if (fieldKey === 'actor' && value.trim()) {
          const val = validateNonActor(value);
          if (!val.isValid) {
            newErrors[fieldKey] = val.error || 'Invalid actor';
          }
        }

        return { ...block, values: newValues, errors: newErrors };
      }),
    );
  };

  const handleSubmit = () => {
    let hasGlobalError = false;

    const validatedBlocks = blocks.map((block) => {
      const def = FORMAT_DEFS[block.format];
      const newErrors: Record<string, string> = {};

      // Validate ALL fields defined in the current format
      def.fields.forEach((field) => {
        const val = block.values[field.key] || '';

        if (!val.trim()) {
          newErrors[field.key] = 'Required';
          hasGlobalError = true;
        }

        if (field.key === 'actor') {
          const v = validateNonActor(val);
          if (!v.isValid) {
            newErrors[field.key] = v.error || 'Invalid';
            hasGlobalError = true;
          }
        }
      });

      return { ...block, errors: newErrors };
    });

    if (hasGlobalError) {
      setBlocks(validatedBlocks);
      return;
    }

    // Generate Full Paragraph
    const fullParagraph = blocks.map((b) => FORMAT_DEFS[b.format].template(b.values)).join(' ');

    // Flatten data for the parent (optional: clean up structure)
    const payload = blocks.map((b) => ({
      id: b.id,
      format: b.format,
      ...b.values,
    }));

    onSubmit(fullParagraph, payload);
  };

  const isValid = blocks.every((b) => Object.keys(b.errors).length === 0 && Object.values(b.values).every((v) => v.trim()));

  // --- RENDER HELPERS ---
  const renderInput = (block: Block, field: FieldConfig) => {
    const value = block.values[field.key] || '';
    const error = block.errors[field.key];
    const status = error ? 'error' : '';

    const commonStyle = { flex: 1, minWidth: '120px' };

    switch (field.type) {
      case 'select':
        return (
          <Select
            value={value}
            onChange={(val) => updateValue(block.id, field.key, val)}
            style={{ width: field.width || 80 }}
            disabled={isSubmitting}
            status={status}
          >
            {field.options?.map((opt) => (
              <Option key={opt} value={opt}>
                {opt}
              </Option>
            ))}
          </Select>
        );
      case 'suggester':
        return (
          <div style={commonStyle}>
            <KeywordSuggester
              value={value}
              onChange={(val) => updateValue(block.id, field.key, val)}
              placeholder={field.placeholder}
              isSubmitting={isSubmitting}
            />
          </div>
        );
      case 'textarea':
        return (
          <Input.TextArea
            value={value}
            onChange={(e) => updateValue(block.id, field.key, e.target.value)}
            placeholder={field.placeholder}
            autoSize={{ minRows: field.rows || 1, maxRows: 3 }}
            status={status}
            disabled={isSubmitting}
            style={commonStyle}
          />
        );
      case 'text':
      default:
        return (
          <Input
            value={value}
            onChange={(e) => updateValue(block.id, field.key, e.target.value)}
            placeholder={field.placeholder}
            status={status}
            disabled={isSubmitting}
            style={{ width: field.width || undefined, ...commonStyle }}
          />
        );
    }
  };

  return (
    <Form
      layout="vertical"
      style={{ padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '12px', height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <Flex justify="space-between" align="center" style={{ marginBottom: '16px' }}>
        <Title level={5} style={{ margin: 0 }}>
          User Stories
        </Title>
        <Tooltip title="Select a sentences format and fill all required fields.">
          <InfoCircleOutlined style={{ color: '#1890ff' }} />
        </Tooltip>
      </Flex>

      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
        {blocks.map((block, index) => {
          const formatDef = FORMAT_DEFS[block.format];

          return (
            <Card
              key={block.id}
              size="small"
              style={{ marginBottom: '12px', borderColor: Object.keys(block.errors).length ? '#ffa39e' : undefined }}
              title={
                <Flex justify="space-between" align="center">
                  <Text strong style={{ color: '#1890ff' }}>
                    Sentence #{index + 1}
                  </Text>
                  <Select
                    value={block.format}
                    onChange={(val) => handleFormatChange(block.id, val)}
                    size="small"
                    style={{ width: 180 }}
                    disabled={isSubmitting}
                  >
                    {Object.entries(FORMAT_DEFS).map(([key, def]) => (
                      <Option key={key} value={key}>
                        {def.label}
                      </Option>
                    ))}
                  </Select>
                </Flex>
              }
              extra={
                blocks.length > 1 && <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemoveBlock(block.id)} disabled={isSubmitting} />
              }
            >
              {/* DYNAMIC FIELD RENDERING */}
              {formatDef.fields.map((field) => (
                <Form.Item key={field.key} style={{ marginBottom: 8 }} validateStatus={block.errors[field.key] ? 'error' : ''} help={block.errors[field.key]}>
                  <Flex gap="small" align={field.type === 'textarea' ? 'start' : 'center'}>
                    {field.label && (
                      <span
                        style={{
                          minWidth: field.label.length > 10 ? 'auto' : 60,
                          fontWeight: 500,
                          marginTop: field.type === 'textarea' ? 5 : 0,
                        }}
                      >
                        {field.label}
                      </span>
                    )}
                    {renderInput(block, field)}
                  </Flex>
                </Form.Item>
              ))}
            </Card>
          );
        })}

        <Button disabled={isSubmitting} type="dashed" block icon={<PlusOutlined />} onClick={handleAddBlock} style={{ marginBottom: '16px' }}>
          Add Sentence
        </Button>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '4px', marginBottom: '12px', border: '1px solid #f0f0f0' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          Preview:
        </Text>
        <Paragraph style={{ margin: 0, color: '#4B54D5' }}>
          {blocks.map((b, i) => (
            <span key={i}>
              {/* Using the template function to render the preview */}
              {FORMAT_DEFS[b.format].template(b.values)}&nbsp;
            </span>
          ))}
        </Paragraph>
      </div>

      <Button type="primary" icon={<SendOutlined />} onClick={handleSubmit} disabled={!isValid || isSubmitting} loading={isSubmitting} block size="large">
        Submit Stories
      </Button>
    </Form>
  );
};

export default StructuredInput;
