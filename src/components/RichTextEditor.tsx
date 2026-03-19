import { Bold, ImagePlus } from 'lucide-react';
import { useEffect, useId, useRef, useState, type CSSProperties, type ChangeEvent } from 'react';
import { normalizeRichTextHtml } from '../lib/richText';

type RichTextEditorProps = {
  label?: string;
  value: string;
  onChange: (next: string) => void;
  onUploadImage?: (file: File) => Promise<string>;
  minHeight?: number;
};

const FONT_SIZE_OPTIONS = ['14', '16', '18', '20', '24', '28', '32'] as const;
const LINE_HEIGHT_OPTIONS = ['1.2', '1.3', '1.4', '1.6', '1.8', '1.9', '2.0', '2.2'] as const;
const COLOR_PRESETS = [
  { label: '진한 검정', value: '#111111' },
  { label: '기본', value: '#444444' },
  { label: '회색', value: '#666666' },
  { label: '초록', value: '#39b54a' },
  { label: '파랑', value: '#2563eb' },
  { label: '빨강', value: '#dc2626' },
] as const;
const TEXT_PRESETS = [
  {
    label: '타이틀',
    fontSize: '24',
    lineHeight: '1.4',
    color: '#111111',
    fontWeight: '400',
  },
  {
    label: '본문',
    fontSize: '17',
    lineHeight: '1.8',
    color: '#444444',
    fontWeight: '400',
  },
] as const;

const EXEC_COMMAND_FONT_SIZE_MARKERS = new Set(['48px', 'xxx-large', '-webkit-xxx-large']);
const BLOCK_SELECTOR = 'p, div, li, blockquote, h1, h2, h3, h4, h5, h6';

function unwrapElement(element: HTMLElement) {
  const parent = element.parentNode;
  if (!parent) {
    return;
  }

  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element);
  }

  parent.removeChild(element);
}

function clearFontSizeStyle(element: HTMLElement) {
  if (!element.style.fontSize) {
    return;
  }

  element.style.removeProperty('font-size');

  if (!element.getAttribute('style')?.trim()) {
    element.removeAttribute('style');
  }
}

function normalizeExecCommandFontSize(root: HTMLElement, fontSize: string) {
  const targetFontSize = `${fontSize}px`;
  const fontSizeMarkers = Array.from(root.querySelectorAll<HTMLElement>('font[size="7"], [style]')).filter((node) => {
    if (node.tagName === 'FONT' && node.getAttribute('size') === '7') {
      return true;
    }

    return EXEC_COMMAND_FONT_SIZE_MARKERS.has(node.style.fontSize.trim().toLowerCase());
  });

  fontSizeMarkers.forEach((node) => {
    Array.from(node.querySelectorAll<HTMLElement>('[style], font[size]')).forEach((child) => {
      if (child === node) {
        return;
      }

      clearFontSizeStyle(child);

      if (child.tagName === 'FONT' && child.getAttribute('size')) {
        child.removeAttribute('size');
      }
    });

    if (node.tagName === 'FONT') {
      const span = document.createElement('span');
      span.style.fontSize = targetFontSize;

      while (node.firstChild) {
        span.appendChild(node.firstChild);
      }

      node.replaceWith(span);
      return;
    }

    node.style.fontSize = targetFontSize;
  });

  Array.from(root.querySelectorAll<HTMLElement>('span, font')).reverse().forEach((node) => {
    if (node.tagName === 'FONT' && !node.attributes.length) {
      unwrapElement(node);
      return;
    }

    if (node.tagName === 'SPAN' && !node.attributes.length) {
      unwrapElement(node);
    }
  });
}

function normalizeExecCommandTextColor(root: HTMLElement, color: string) {
  Array.from(root.querySelectorAll<HTMLElement>('font[color]')).forEach((node) => {
    const span = document.createElement('span');
    span.style.color = color;

    while (node.firstChild) {
      span.appendChild(node.firstChild);
    }

    node.replaceWith(span);
  });

  Array.from(root.querySelectorAll<HTMLElement>('span, font')).reverse().forEach((node) => {
    if (node.tagName === 'FONT' && !node.attributes.length) {
      unwrapElement(node);
      return;
    }

    if (node.tagName === 'SPAN' && !node.attributes.length) {
      unwrapElement(node);
    }
  });
}

function cleanupInlineFormatting(root: HTMLElement) {
  Array.from(root.querySelectorAll<HTMLElement>('[style], font[size], font[color]')).forEach((node) => {
    node.style.removeProperty('font-size');
    node.style.removeProperty('line-height');
    node.style.removeProperty('color');
    node.style.removeProperty('font-weight');

    if (node.tagName === 'FONT') {
      node.removeAttribute('size');
      node.removeAttribute('color');
    }

    if (!node.getAttribute('style')?.trim()) {
      node.removeAttribute('style');
    }
  });

  Array.from(root.querySelectorAll<HTMLElement>('span, font')).reverse().forEach((node) => {
    if (node.tagName === 'FONT' && !node.attributes.length) {
      unwrapElement(node);
      return;
    }

    if (node.tagName === 'SPAN' && !node.attributes.length) {
      unwrapElement(node);
    }
  });
}

function isRangeInsideEditor(range: Range, editor: HTMLElement) {
  return editor.contains(range.startContainer) && editor.contains(range.endContainer);
}

function findClosestBlockElement(node: Node | null, editor: HTMLElement) {
  let current = node instanceof HTMLElement ? node : node?.parentElement ?? null;

  while (current && current !== editor) {
    if (current.matches(BLOCK_SELECTOR)) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

function getSelectedBlockElements(range: Range, editor: HTMLElement) {
  const blocks = new Set<HTMLElement>();
  const commonAncestor =
    range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
      ? (range.commonAncestorContainer as Element)
      : range.commonAncestorContainer.parentElement;
  const scope = commonAncestor instanceof HTMLElement ? commonAncestor : editor;
  const scopedBlock = scope.closest(BLOCK_SELECTOR);

  if (scopedBlock instanceof HTMLElement && editor.contains(scopedBlock)) {
    blocks.add(scopedBlock);
  }

  Array.from(scope.querySelectorAll<HTMLElement>(BLOCK_SELECTOR)).forEach((element) => {
    if (editor.contains(element) && range.intersectsNode(element)) {
      blocks.add(element);
    }
  });

  const startBlock = findClosestBlockElement(range.startContainer, editor);
  const endBlock = findClosestBlockElement(range.endContainer, editor);

  if (startBlock) {
    blocks.add(startBlock);
  }

  if (endBlock) {
    blocks.add(endBlock);
  }

  return Array.from(blocks);
}

export function RichTextEditor({
  label,
  value,
  onChange,
  onUploadImage,
  minHeight = 520,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const selectionRangeRef = useRef<Range | null>(null);
  const fileInputId = useId();
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [editorError, setEditorError] = useState('');
  const [selectedTextColor, setSelectedTextColor] = useState('#444444');
  const [selectedLineHeight, setSelectedLineHeight] = useState('1.9');

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const normalizedValue = normalizeRichTextHtml(value);
    if (editor.innerHTML !== normalizedValue) {
      editor.innerHTML = normalizedValue;
    }
  }, [value]);

  useEffect(() => {
    const handleSelectionChange = () => {
      const editor = editorRef.current;
      const selection = window.getSelection();

      if (!editor || !selection || selection.rangeCount === 0) {
        return;
      }

      const range = selection.getRangeAt(0);
      if (!isRangeInsideEditor(range, editor)) {
        return;
      }

      selectionRangeRef.current = range.cloneRange();
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  const emitChange = () => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    onChange(editor.innerHTML);
  };

  const focusEditor = () => {
    editorRef.current?.focus();
  };

  const saveSelection = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    if (!isRangeInsideEditor(range, editor)) {
      return;
    }

    selectionRangeRef.current = range.cloneRange();
  };

  const restoreSelection = () => {
    const editor = editorRef.current;
    const savedRange = selectionRangeRef.current;

    if (!editor || !savedRange) {
      focusEditor();
      return false;
    }

    const selection = window.getSelection();
    if (!selection) {
      return false;
    }

    selection.removeAllRanges();
    selection.addRange(savedRange);
    return true;
  };

  const applyFontSize = (fontSize: string) => {
    restoreSelection();
    document.execCommand('styleWithCSS', false, 'false');
    document.execCommand('fontSize', false, '7');

    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    normalizeExecCommandFontSize(editor, fontSize);
    saveSelection();
    emitChange();
  };

  const applyBold = () => {
    restoreSelection();
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand('bold');
    saveSelection();
    emitChange();
  };

  const applyTextColor = (color: string) => {
    restoreSelection();
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand('foreColor', false, color);

    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    normalizeExecCommandTextColor(editor, color);
    saveSelection();
    emitChange();
  };

  const applyLineHeight = (lineHeight: string) => {
    const editor = editorRef.current;

    if (!editor || !restoreSelection()) {
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    const blocks = getSelectedBlockElements(range, editor);

    if (blocks.length === 0) {
      return;
    }

    blocks.forEach((block) => {
      block.style.lineHeight = lineHeight;

      if (!block.getAttribute('style')?.trim()) {
        block.removeAttribute('style');
      }
    });

    saveSelection();
    emitChange();
  };

  const applyTextPreset = (preset: (typeof TEXT_PRESETS)[number]) => {
    const editor = editorRef.current;

    if (!editor || !restoreSelection()) {
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    const blocks = getSelectedBlockElements(range, editor);

    if (blocks.length === 0) {
      return;
    }

    blocks.forEach((block) => {
      cleanupInlineFormatting(block);
      block.style.fontSize = `${preset.fontSize}px`;
      block.style.lineHeight = preset.lineHeight;
      block.style.color = preset.color;
      block.style.fontWeight = preset.fontWeight;
    });

    setSelectedLineHeight(preset.lineHeight);
    setSelectedTextColor(preset.color);
    saveSelection();
    emitChange();
  };

  const insertHtml = (html: string) => {
    restoreSelection();
    document.execCommand('insertHTML', false, html);
    saveSelection();
    emitChange();
  };

  const insertImageUrl = () => {
    const trimmedUrl = imageUrlInput.trim();

    if (!trimmedUrl) {
      return;
    }

    insertHtml(`<p><img src="${trimmedUrl}" alt="" /></p>`);
    setImageUrlInput('');
    setEditorError('');
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || !onUploadImage) {
      return;
    }

    setIsUploadingImage(true);
    setEditorError('');

    try {
      const uploadedUrl = await onUploadImage(file);
      insertHtml(`<p><img src="${uploadedUrl}" alt="" /></p>`);
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : '본문 이미지 업로드에 실패했어.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <div className="rich-text-editor">
      {label ? <span className="rich-text-editor__label">{label}</span> : null}

      <div className="rich-text-editor__toolbar">
        <div className="rich-text-editor__toolbar-group">
          <span className="rich-text-editor__toolbar-title">프리셋</span>
          {TEXT_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className="rich-text-editor__toolbar-button rich-text-editor__toolbar-button--preset"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => applyTextPreset(preset)}
            >
              {preset.label}
            </button>
          ))}
          <span className="rich-text-editor__toolbar-caption">선택한 문단 기준</span>
        </div>

        <div className="rich-text-editor__toolbar-group">
          <span className="rich-text-editor__toolbar-title">글자</span>
          <button
            type="button"
            className="rich-text-editor__toolbar-button rich-text-editor__toolbar-button--icon"
            onMouseDown={(event) => event.preventDefault()}
            onClick={applyBold}
            title="굵게"
          >
            <Bold size={16} />
            굵게
          </button>
        </div>

        <div className="rich-text-editor__toolbar-group">
          <span className="rich-text-editor__toolbar-title">폰트 크기</span>
          {FONT_SIZE_OPTIONS.map((fontSize) => (
            <button
              key={fontSize}
              type="button"
              className="rich-text-editor__toolbar-button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => applyFontSize(fontSize)}
            >
              {fontSize}px
            </button>
          ))}
        </div>

        <div className="rich-text-editor__toolbar-group">
          <span className="rich-text-editor__toolbar-title">행간</span>
          <select
            className="rich-text-editor__toolbar-select"
            value={selectedLineHeight}
            onChange={(event) => {
              const nextValue = event.target.value;
              setSelectedLineHeight(nextValue);
              applyLineHeight(nextValue);
            }}
          >
            {LINE_HEIGHT_OPTIONS.map((lineHeight) => (
              <option key={lineHeight} value={lineHeight}>
                {lineHeight}
              </option>
            ))}
          </select>
          <span className="rich-text-editor__toolbar-caption">선택한 문단 기준</span>
        </div>

        <div className="rich-text-editor__toolbar-group">
          <span className="rich-text-editor__toolbar-title">글자색</span>
          <div className="rich-text-editor__color-palette">
            {COLOR_PRESETS.map((colorPreset) => (
              <button
                key={colorPreset.value}
                type="button"
                className="rich-text-editor__color-swatch"
                style={{ '--swatch-color': colorPreset.value } as CSSProperties}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setSelectedTextColor(colorPreset.value);
                  applyTextColor(colorPreset.value);
                }}
                aria-label={`${colorPreset.label} 글자색 적용`}
                title={`${colorPreset.label} 글자색`}
              >
                <span />
              </button>
            ))}
          </div>
          <label className="rich-text-editor__color-picker">
            <input
              type="color"
              value={selectedTextColor}
              onChange={(event) => {
                const nextValue = event.target.value;
                setSelectedTextColor(nextValue);
                applyTextColor(nextValue);
              }}
              aria-label="직접 글자색 선택"
            />
            직접 선택
          </label>
        </div>

        <div className="rich-text-editor__toolbar-group">
          <span className="rich-text-editor__toolbar-title">이미지 삽입</span>
          <input
            type="text"
            value={imageUrlInput}
            onChange={(event) => setImageUrlInput(event.target.value)}
            className="rich-text-editor__url-input"
            placeholder="이미지 URL 붙여넣기"
          />
          <button
            type="button"
            className="rich-text-editor__toolbar-button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={insertImageUrl}
          >
            URL 삽입
          </button>
          <label htmlFor={fileInputId} className="rich-text-editor__toolbar-button rich-text-editor__toolbar-button--upload">
            <ImagePlus size={16} />
            {isUploadingImage ? '업로드 중...' : '업로드 삽입'}
          </label>
          <input
            id={fileInputId}
            type="file"
            accept="image/*"
            hidden
            onChange={handleImageUpload}
          />
        </div>
      </div>

      <div
        ref={editorRef}
        className="rich-text-editor__surface"
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        onFocus={saveSelection}
        style={{ minHeight }}
      />

      <p className="rich-text-editor__help">
        `타이틀`, `본문` 프리셋으로 빠르게 맞추고, 필요하면 글자 크기, 글자색, 행간을 추가 조절하면 돼.
      </p>

      {editorError ? <p className="form-feedback form-feedback--error">{editorError}</p> : null}
    </div>
  );
}
