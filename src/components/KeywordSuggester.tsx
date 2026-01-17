// src/components/KeywordSuggester.tsx
import { Tag, Input } from 'antd';

const RELATIONAL_KEYWORDS = ['must', 'if', 'unless', 'include', 'extend'];

interface KeywordSuggesterProps {
  value: string;
  onChange: (value: string) => void;
  onKeywordClick?: (keyword: string) => void;
  placeholder?: string;
  isSubmitting?: boolean;
}

export const KeywordSuggester = ({ value, onChange, onKeywordClick, placeholder = 'Nhập yêu cầu của bạn...', isSubmitting }: KeywordSuggesterProps) => {
  return (
    <div style={{ width: '100%' }}>
      <Input.TextArea rows={3} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} disabled={isSubmitting} />
      <div style={{ marginTop: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', color: '#666' }}>Gợi ý từ khóa:</span>
        {RELATIONAL_KEYWORDS.map((keyword) => (
          <Tag
            key={keyword}
            color="blue"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              onChange(value + (value ? ' ' : '') + keyword + ' ');
              onKeywordClick?.(keyword);
            }}
          >
            {keyword}
          </Tag>
        ))}
      </div>
    </div>
  );
};

export default KeywordSuggester;
