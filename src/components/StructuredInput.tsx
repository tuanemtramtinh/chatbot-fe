// Guide:
// Format_def for sentence type format
// All field are required
// src/components/StructuredInput.tsx
import { Input, Form, Button, Flex, Typography, Select, Card, Divider, Tooltip, message } from 'antd';
import { useState } from 'react';
import { KeywordSuggester } from './KeywordSuggester';
import { DeleteOutlined, PlusOutlined, SendOutlined, InfoCircleOutlined, SwapOutlined } from '@ant-design/icons';
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
  regex: RegExp;
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
    regex: /As\s+(a|an|the)\s+(.+?),\s+I\s+want\s+to\s+(.+?)\s+so\s+that\s+(.+)/i,
  },
  // system_req: {
  //   label: 'System Requirement',
  //   fields: [
  //     { key: 'actor', label: 'The', type: 'text', placeholder: 'System/Component', width: '40%' },
  //     { key: 'action', label: 'shall', type: 'suggester', placeholder: 'Function/Behavior (e.g. validate input)' },
  //   ],
  //   template: (v) => `The ${v.actor} shall ${v.action}.`,
  //   regex: /The\s+(.+?)\s+shall\s+(.+)/i
  // },
  // gherkin: {
  //   label: 'Gherkin (Scenario)',
  //   fields: [
  //     { key: 'given', label: 'Given', type: 'text', placeholder: 'Precondition (e.g. User is logged in)' },
  //     { key: 'when', label: 'When', type: 'text', placeholder: 'Event (e.g. User clicks save)' },
  //     { key: 'then', label: 'Then', type: 'textarea', placeholder: 'Result (e.g. Data is saved)', rows: 2 },
  //   ],
  //   template: (v) => `Given ${v.given}, When ${v.when}, Then ${v.then}.`,
  //   regex: /Given\s+(.+?),\s+When\s+(.+?),\s+Then\s+(.+)/i
  // },
};

// --- TYPES ---

interface Block {
  id: string;
  format: keyof typeof FORMAT_DEFS;
  values: Record<string, string>; // Stores dynamic values like { actor: 'User', action: 'Login' }
  errors: Record<string, string>; // Stores errors per field
}

interface StructuredInputProps {
  onSubmit: (fullText: string) => void;
  isSubmitting?: boolean;
}

// --- PARSER HELPER ---
const parseParagraphToBlocks = (text: string): Block[] => {
  // Split by sentence endings (period followed by space or newline)
  const sentences = text.split(/\.\s*|\n/).filter((s) => s.trim().length > 0);

  return sentences.map((sentence) => {
    const trimmed = sentence.trim();

    let detectedFormat: keyof typeof FORMAT_DEFS = 'user_story'; // Default fall back
    let isMatched = false;

    // Explicitly type objects to satisfy TypeScript Record<string, string>
    const extractedValues: Record<string, string> = {};
    const errors: Record<string, string> = {};

    // Dynamic Loop through FORMAT_DEFS
    for (const [formatKey, def] of Object.entries(FORMAT_DEFS)) {
      const match = trimmed.match(def.regex);

      if (match) {
        detectedFormat = formatKey as keyof typeof FORMAT_DEFS;
        isMatched = true;

        // Map regex capture groups (indices 1..n) to fields (indices 0..n)
        def.fields.forEach((field, index) => {
          const capturedValue = match[index + 1];
          extractedValues[field.key] = capturedValue ? capturedValue.trim() : '';
        });
        break; // Stop after first valid match
      }
    }

    if (!isMatched) {
      // Fallback: Dump text into actor field and flag error
      // Note: We use 'user_story' as the base format for errors
      extractedValues['article'] = 'a';
      extractedValues['actor'] = '';
      extractedValues['action'] = '';
      extractedValues['benefit'] = '';
      errors['actor'] = 'Invalid format. Could not parse.';
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      format: detectedFormat,
      values: extractedValues,
      errors: errors,
    };
  });
};

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
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');

  // --- ACTIONS ---
  const handleToggleMode = () => {
    if (isBulkMode) {
      // Switching TO Form Mode: Parse text
      const parsedBlocks = parseParagraphToBlocks(bulkText);
      // Only update blocks if there is text to parse, otherwise keep existing
      if (bulkText.trim().length > 0) {
        setBlocks(parsedBlocks);
      }
    } else {
      // Switching TO Bulk Mode: Generate text
      const currentText = blocks.map((b) => FORMAT_DEFS[b.format].template(b.values)).join('\n');
      setBulkText(currentText);
    }
    setIsBulkMode(!isBulkMode);
  };

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
    let finalBlocks = blocks;

    // If in Bulk Mode, parse first
    if (isBulkMode) {
      finalBlocks = parseParagraphToBlocks(bulkText);

      // Check for parse errors
      const hasParseErrors = finalBlocks.some((b) => Object.keys(b.errors).length > 0);
      if (hasParseErrors) {
        message.error('Some lines could not be parsed. Switched to Form Mode to fix errors.');
        setBlocks(finalBlocks);
        setIsBulkMode(false); // Force switch to form mode to see red errors
        return;
      }
    }

    // Validate Form Mode Blocks
    let hasGlobalError = false;

    const validatedBlocks = finalBlocks.map((block) => {
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
      if (isBulkMode) setIsBulkMode(false);
      return;
    }

    // Generate Full Paragraph
    const fullParagraph = validatedBlocks.map((b) => FORMAT_DEFS[b.format].template(b.values)).join('\n');
    onSubmit(fullParagraph);
  };

  const isFormValid = blocks.every((b) => Object.keys(b.errors).length === 0 && Object.values(b.values).every((v) => v.trim()));

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
      {/* HEADER */}
      <Flex justify="space-between" align="center" style={{ marginBottom: '16px' }}>
        <Title level={5} style={{ margin: 0 }}>
          Input Stories
        </Title>
        <Flex gap="small">
          <Button size="small" icon={<SwapOutlined />} onClick={handleToggleMode} type={isBulkMode ? 'primary' : 'default'}>
            {isBulkMode ? 'Switch to Form' : 'Switch to Paragraph'}
          </Button>
          <Tooltip title={isBulkMode ? 'Parse text back into forms.' : 'Paste multiple stories at once.'}>
            <InfoCircleOutlined style={{ color: '#1890ff', marginTop: 4 }} />
          </Tooltip>
        </Flex>
      </Flex>

      {/* CONTENT AREA */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
        {isBulkMode ? (
          // BULK PASTE MODE
          <Card size="small" title="Bulk Entry Mode" style={{ height: '100%', display: 'flex', flexDirection: 'column' }} styles={{ body: { flex: 1 } }}>
            <Input.TextArea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={'As a user, I want to login so that I can access data.\nThe Admin shall validate accounts.'}
              style={{ height: '100%', resize: 'none', border: 'none', boxShadow: 'none' }}
            />
            <div style={{ marginTop: 10, borderTop: '1px solid #eee', paddingTop: 10 }}>
              <Text type="secondary" style={{ fontSize: '11px' }}>
                <InfoCircleOutlined /> Paste your stories here. They must strictly match the supported formats.
              </Text>
            </div>
          </Card>
        ) : (
          // STRUCTURED FORM MODE
          <>
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
                    blocks.length > 1 && (
                      <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemoveBlock(block.id)} disabled={isSubmitting} />
                    )
                  }
                >
                  {formatDef.fields.map((field) => (
                    <Form.Item
                      key={field.key}
                      style={{ marginBottom: 8 }}
                      validateStatus={block.errors[field.key] ? 'error' : ''}
                      help={block.errors[field.key]}
                    >
                      <Flex gap="small" align={field.type === 'textarea' ? 'start' : 'center'}>
                        {field.label && (
                          <span style={{ minWidth: field.label.length > 10 ? 'auto' : 60, fontWeight: 500, marginTop: field.type === 'textarea' ? 5 : 0 }}>
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
          </>
        )}
      </div>

      <Divider style={{ margin: '12px 0' }} />

      {/* FOOTER PREVIEW */}
      <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '4px', marginBottom: '12px', border: '1px solid #f0f0f0' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          Preview:
        </Text>
        <Paragraph style={{ margin: 0, color: '#4B54D5', fontSize: '13px' }}>
          {isBulkMode
            ? bulkText || <span style={{ color: '#ccc' }}>(Empty)</span>
            : blocks.map((b, i) => <span key={i}>{FORMAT_DEFS[b.format].template(b.values)}&nbsp;</span>)}
        </Paragraph>
      </div>

      <Button
        type="primary"
        icon={<SendOutlined />}
        onClick={handleSubmit}
        disabled={(!isFormValid && !isBulkMode) || isSubmitting}
        loading={isSubmitting}
        block
        size="large"
      >
        Submit Stories
      </Button>
    </Form>
  );
};

export default StructuredInput;
