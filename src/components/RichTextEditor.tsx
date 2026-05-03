import { useRef, useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import ImageIcon from '@mui/icons-material/Image';
import LinkIcon from '@mui/icons-material/Link';
import FormatColorTextIcon from '@mui/icons-material/FormatColorText';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import TitleIcon from '@mui/icons-material/Title';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const FONT_SIZES = [
  { label: 'Small', value: '0.875rem' },
  { label: 'Normal', value: '1rem' },
  { label: 'Large', value: '1.25rem' },
  { label: 'Heading 3', value: 'h3' },
  { label: 'Heading 2', value: 'h2' },
  { label: 'Heading 1', value: 'h1' },
];

const TEXT_COLORS = [
  '#111827', '#0E5B44', '#1D4ED8', '#DC2626',
  '#D97706', '#7C3AED', '#0891B2', '#BE185D',
  '#065F46', '#9CA3AF', '#6B7280', '#374151',
];

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isUpdatingFromProp, setIsUpdatingFromProp] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const savedSelectionRef = useRef<Range | null>(null);

  // Initialize editor content once on mount
  useEffect(() => {
    if (editorRef.current && value !== undefined) {
      editorRef.current.innerHTML = value || '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value changes into editor (e.g. when loading data)
  useEffect(() => {
    if (!editorRef.current) return;
    const currentHtml = editorRef.current.innerHTML;
    // Only update if content differs significantly (to avoid cursor jump on every keystroke)
    if (value !== currentHtml && !editorRef.current.contains(document.activeElement)) {
      setIsUpdatingFromProp(true);
      editorRef.current.innerHTML = value || '';
      setIsUpdatingFromProp(false);
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (isUpdatingFromProp || !editorRef.current) return;
    onChange(editorRef.current.innerHTML);
  }, [isUpdatingFromProp, onChange]);

  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const insertHeading = (tag: string) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const selectedText = range.toString() || 'Heading';
    const heading = document.createElement(tag as keyof HTMLElementTagNameMap);
    heading.textContent = selectedText;
    range.deleteContents();
    range.insertNode(heading);
    // Move cursor after element
    const newRange = document.createRange();
    newRange.setStartAfter(heading);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
    editorRef.current?.focus();
    handleInput();
  };

  const insertBlockquote = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const selectedText = range.toString() || 'Sanskrit verse or important quote...';
    const bq = document.createElement('blockquote');
    bq.textContent = selectedText;
    range.deleteContents();
    range.insertNode(bq);
    const newRange = document.createRange();
    newRange.setStartAfter(bq);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
    editorRef.current?.focus();
    handleInput();
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    const saved = savedSelectionRef.current;
    if (!saved) return;
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(saved);
    }
  };

  const applyColor = (color: string) => {
    restoreSelection();
    exec('foreColor', color);
    setColorPickerOpen(false);
  };

  const handleInsertImage = () => {
    restoreSelection();
    if (imageUrl) {
      const img = document.createElement('img');
      img.src = imageUrl;
      img.alt = imageAlt || 'Image';
      img.style.cssText = 'max-width: 100%; height: auto; border-radius: 12px; margin: 16px 0; display: block;';
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(img);
        const newRange = document.createRange();
        newRange.setStartAfter(img);
        sel.removeAllRanges();
        sel.addRange(newRange);
      } else if (editorRef.current) {
        editorRef.current.appendChild(img);
      }
      editorRef.current?.focus();
      handleInput();
    }
    setImageDialogOpen(false);
    setImageUrl('');
    setImageAlt('');
  };

  const ToolbarButton = ({
    title, onClick, children, active = false
  }: { title: string; onClick: () => void; children: React.ReactNode; active?: boolean }) => (
    <Tooltip title={title} arrow>
      <IconButton
        size="small"
        onClick={onClick}
        sx={{
          width: 34, height: 34, borderRadius: 1.5,
          bgcolor: active ? 'rgba(14,91,68,0.12)' : 'transparent',
          color: active ? 'primary.main' : 'text.secondary',
          '&:hover': { bgcolor: 'rgba(14,91,68,0.08)', color: 'primary.main' },
          transition: 'all 0.15s ease',
        }}
      >
        {children}
      </IconButton>
    </Tooltip>
  );

  const ToolbarDivider = () => (
    <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'white' }}>
      {/* Toolbar */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap',
        px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider',
        bgcolor: '#FAFAF8', minHeight: 52,
      }}>

        {/* Headings */}
        <Tooltip title="Heading 1">
          <IconButton size="small" onClick={() => insertHeading('h1')}
            sx={{ fontWeight: 900, fontSize: '1rem', width: 34, height: 34, borderRadius: 1.5, color: 'text.secondary', '&:hover': { bgcolor: 'rgba(14,91,68,0.08)', color: 'primary.main' } }}>
            H1
          </IconButton>
        </Tooltip>
        <Tooltip title="Heading 2">
          <IconButton size="small" onClick={() => insertHeading('h2')}
            sx={{ fontWeight: 800, fontSize: '0.9rem', width: 34, height: 34, borderRadius: 1.5, color: 'text.secondary', '&:hover': { bgcolor: 'rgba(14,91,68,0.08)', color: 'primary.main' } }}>
            H2
          </IconButton>
        </Tooltip>
        <Tooltip title="Heading 3">
          <IconButton size="small" onClick={() => insertHeading('h3')}
            sx={{ fontWeight: 700, fontSize: '0.82rem', width: 34, height: 34, borderRadius: 1.5, color: 'text.secondary', '&:hover': { bgcolor: 'rgba(14,91,68,0.08)', color: 'primary.main' } }}>
            H3
          </IconButton>
        </Tooltip>

        <ToolbarDivider />

        {/* Text styles */}
        <ToolbarButton title="Bold (Ctrl+B)" onClick={() => exec('bold')}>
          <FormatBoldIcon fontSize="small" />
        </ToolbarButton>
        <ToolbarButton title="Italic (Ctrl+I)" onClick={() => exec('italic')}>
          <FormatItalicIcon fontSize="small" />
        </ToolbarButton>
        <ToolbarButton title="Underline (Ctrl+U)" onClick={() => exec('underline')}>
          <FormatUnderlinedIcon fontSize="small" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Font size */}
        <Tooltip title="Font Size">
          <Select
            size="small"
            defaultValue="1rem"
            onChange={(e) => exec('fontSize', e.target.value as string)}
            sx={{
              height: 32, fontSize: '0.78rem', minWidth: 90,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
            }}
          >
            <MenuItem value="1" sx={{ fontSize: '0.75rem' }}>Small</MenuItem>
            <MenuItem value="3" sx={{ fontSize: '0.85rem' }}>Normal</MenuItem>
            <MenuItem value="4" sx={{ fontSize: '0.95rem' }}>Large</MenuItem>
            <MenuItem value="5" sx={{ fontSize: '1.05rem' }}>X-Large</MenuItem>
            <MenuItem value="6" sx={{ fontSize: '1.15rem' }}>H2 Size</MenuItem>
            <MenuItem value="7" sx={{ fontSize: '1.25rem' }}>H1 Size</MenuItem>
          </Select>
        </Tooltip>

        <ToolbarDivider />

        {/* Text Color */}
        <Box sx={{ position: 'relative' }}>
          <ToolbarButton title="Text Color" onClick={() => { saveSelection(); setColorPickerOpen(p => !p); }}>
            <FormatColorTextIcon fontSize="small" />
          </ToolbarButton>
          {colorPickerOpen && (
            <Box sx={{
              position: 'absolute', top: 40, left: 0, zIndex: 2000,
              bgcolor: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              borderRadius: 3, p: 2, display: 'grid', gridTemplateColumns: 'repeat(4, 28px)', gap: 1,
              border: '1px solid', borderColor: 'divider',
            }}>
              {TEXT_COLORS.map(color => (
                <Box
                  key={color}
                  onClick={() => applyColor(color)}
                  sx={{
                    width: 28, height: 28, borderRadius: 1.5, bgcolor: color,
                    cursor: 'pointer', transition: 'transform 0.15s',
                    border: '2px solid rgba(0,0,0,0.06)',
                    '&:hover': { transform: 'scale(1.2)', boxShadow: `0 0 0 2px ${color}44` },
                  }}
                />
              ))}
            </Box>
          )}
        </Box>

        <ToolbarDivider />

        {/* Lists */}
        <ToolbarButton title="Bullet List" onClick={() => exec('insertUnorderedList')}>
          <FormatListBulletedIcon fontSize="small" />
        </ToolbarButton>
        <ToolbarButton title="Numbered List" onClick={() => exec('insertOrderedList')}>
          <FormatListNumberedIcon fontSize="small" />
        </ToolbarButton>
        <ToolbarButton title="Blockquote / Sanskrit" onClick={insertBlockquote}>
          <FormatQuoteIcon fontSize="small" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Image */}
        <ToolbarButton title="Insert Image" onClick={() => { saveSelection(); setImageDialogOpen(true); }}>
          <ImageIcon fontSize="small" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Undo / Redo */}
        <ToolbarButton title="Undo (Ctrl+Z)" onClick={() => exec('undo')}>
          <UndoIcon fontSize="small" />
        </ToolbarButton>
        <ToolbarButton title="Redo (Ctrl+Y)" onClick={() => exec('redo')}>
          <RedoIcon fontSize="small" />
        </ToolbarButton>
      </Box>

      {/* Editable Content Area */}
      <Box sx={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        {!value && (
          <Typography
            variant="body1"
            sx={{
              position: 'absolute', top: 28, left: 32, color: 'text.disabled',
              pointerEvents: 'none', zIndex: 1, fontSize: '1.05rem', lineHeight: 1.7,
            }}
          >
            {placeholder || 'Start typing your article here...'}
          </Typography>
        )}
        <Box
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onBlur={handleInput}
          sx={{
            minHeight: '100%',
            px: { xs: 3, md: 6 },
            py: 4,
            outline: 'none',
            fontSize: '1.05rem',
            lineHeight: 1.85,
            color: '#1f2937',
            '& h1': { fontSize: '2.2rem', fontWeight: 800, color: '#111827', mb: 2, mt: 3, pb: 1, borderBottom: '2px solid rgba(14,91,68,0.12)' },
            '& h2': { fontSize: '1.7rem', fontWeight: 700, color: '#111827', mb: 2, mt: 4, pb: 1, borderBottom: '1px solid rgba(14,91,68,0.08)' },
            '& h3': { fontSize: '1.3rem', fontWeight: 700, color: '#1f2937', mb: 1.5, mt: 3 },
            '& p': { mb: 2 },
            '& ul, & ol': { pl: 4, mb: 3 },
            '& li': { mb: 1 },
            '& blockquote': {
              my: 3, px: 4, py: 2.5,
              borderLeft: '4px solid #0E5B44',
              bgcolor: '#F0FDF4',
              borderRadius: '0 12px 12px 0',
              fontStyle: 'italic',
              color: '#374151',
              fontSize: '1.1rem',
            },
            '& strong': { fontWeight: 700, color: '#111827' },
            '& em': { color: '#0E5B44', bgcolor: 'rgba(14,91,68,0.08)', px: 0.5, borderRadius: 0.5 },
            '& img': { maxWidth: '100%', borderRadius: 2, my: 2 },
          }}
        />
      </Box>

      {/* Image Insert Dialog */}
      <Dialog open={imageDialogOpen} onClose={() => setImageDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Insert Image</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            label="Image URL"
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            fullWidth size="small" sx={{ mb: 2, mt: 1 }}
            placeholder="https://example.com/image.jpg"
          />
          <TextField
            label="Alt text (description)"
            value={imageAlt}
            onChange={e => setImageAlt(e.target.value)}
            fullWidth size="small"
            placeholder="e.g. Srotas diagram"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setImageDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleInsertImage} variant="contained" disabled={!imageUrl}>Insert</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
