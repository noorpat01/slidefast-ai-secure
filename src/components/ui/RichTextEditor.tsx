import React, { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './RichTextEditor.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  maxHeight?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Enter content...',
  className = '',
  maxHeight = '200px'
}) => {


  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'color': [] }, { 'background': [] }],
        ['clean']
      ],
    },
    clipboard: {
      // toggle to add extra line breaks when pasting HTML:
      matchVisual: false,
    }
  }), []);

  const formats = [
    'header', 'bold', 'italic', 'underline',
    'list', 'bullet',
    'color', 'background'
  ];

  // Convert HTML content to plain text for backend compatibility while preserving some formatting
  const handleChange = (content: string) => {
    // Strip HTML tags but preserve basic structure for display
    const plainText = content
      .replace(/<p>/g, '')
      .replace(/<\/p>/g, '\n')
      .replace(/<strong>/g, '**')
      .replace(/<\/strong>/g, '**')
      .replace(/<em>/g, '*')
      .replace(/<\/em>/g, '*')
      .replace(/<u>/g, '_')
      .replace(/<\/u>/g, '_')
      .replace(/<ol>/g, '')
      .replace(/<\/ol>/g, '')
      .replace(/<ul>/g, '')
      .replace(/<\/ul>/g, '')
      .replace(/<li>/g, '• ')
      .replace(/<\/li>/g, '\n')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<[^>]*>/g, '') // Remove any remaining HTML tags
      .trim();
    
    onChange(plainText);
  };

  // Convert plain text back to HTML for display in editor
  const getDisplayValue = (plainValue: string) => {
    if (!plainValue) return '';
    
    return plainValue
      .split('\n')
      .map(line => {
        if (line.startsWith('• ')) {
          return `<ul><li>${line.substring(2)}</li></ul>`;
        }
        if (line.trim() === '') {
          return '<p><br></p>';
        }
        return `<p>${line}</p>`;
      })
      .join('');
  };

  return (
    <div 
      className={`rich-text-editor ${className}`}
      style={{ '--editor-max-height': maxHeight } as React.CSSProperties}
    >
      <ReactQuill
        theme="snow"
        value={getDisplayValue(value)}
        onChange={handleChange}
        placeholder={placeholder}
        modules={modules}
        formats={formats}
      />
    </div>
  );
};

export default RichTextEditor;