import { useState, useEffect, useRef } from 'react';
import type { Task, Priority, Column, Subtask } from '../types';
import { X, Plus, FileText, Image, Film, Music, File, Download, Trash2, Check, ChevronDown, GripVertical, Pencil } from 'lucide-react';
import { CustomSelect } from './CustomSelect';
import type { AttachmentMeta } from '../store/attachmentStore';
import * as attachmentStore from '../store/attachmentStore';
import { v4 as uuidv4 } from 'uuid';
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';

function SortableSubtaskItem({ subtask, onToggle, onRemove, onEdit }: { subtask: Subtask; onToggle: (id: string) => void; onRemove: (id: string) => void; onEdit: (id: string, title: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({ id: subtask.id });
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(subtask.title);
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) editRef.current?.focus();
  }, [editing]);

  const commitEdit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== subtask.title) {
      onEdit(subtask.id, trimmed);
    } else {
      setEditValue(subtask.title);
    }
    setEditing(false);
  };

  const style = {
    transform: CSS.Translate.toString(transform) ?? 'translate3d(0, 0, 0)',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`subtask-item ${subtask.done ? 'done' : ''} ${isDragging ? 'dragging' : ''}`}>
      <button type="button" className="subtask-drag-handle" {...attributes} {...listeners}>
        <GripVertical size={14} />
      </button>
      <button type="button" className={`subtask-check ${subtask.done ? 'checked' : ''}`} onClick={() => onToggle(subtask.id)}>
        {subtask.done && <Check size={12} />}
      </button>
      {editing ? (
        <input
          ref={editRef}
          type="text"
          className="subtask-edit-input"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitEdit();
            if (e.key === 'Escape') { setEditValue(subtask.title); setEditing(false); }
          }}
        />
      ) : (
        <span className="subtask-title" onDoubleClick={() => setEditing(true)}>{subtask.title}</span>
      )}
      <div className="subtask-actions">
        {!editing && (
          <button type="button" className="icon-btn subtask-action-btn" onClick={() => setEditing(true)} aria-label="Edit subtask">
            <Pencil size={12} />
          </button>
        )}
        <button type="button" className="icon-btn subtask-action-btn danger" onClick={() => onRemove(subtask.id)} aria-label="Remove subtask">
          <X size={12} />
        </button>
      </div>
    </div>
  );
}

interface TaskModalProps {
  isOpen: boolean;
  task: Task | null;
  defaultColumnId: string;
  columns: Column[];
  onSave: (data: { title: string; description: string; priority: Priority; columnId: string; tags: string[]; startDate?: string; dueDate?: string; subtasks?: Subtask[]; estimate?: string; pendingFiles?: File[] }) => void;
  onClose: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return Image;
  if (type.startsWith('video/')) return Film;
  if (type.startsWith('audio/')) return Music;
  if (type.includes('pdf') || type.includes('document') || type.includes('text')) return FileText;
  return File;
}

export function TaskModal({ isOpen, task, defaultColumnId, columns, onSave, onClose }: TaskModalProps) {
  const [title, setTitle] = useState(() => task?.title ?? '');
  const [description, setDescription] = useState(() => task?.description ?? '');
  const [priority, setPriority] = useState<Priority>(() => task?.priority ?? 'medium');
  const [columnId, setColumnId] = useState(() => task?.columnId ?? defaultColumnId);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(() => task?.tags ?? []);
  const [startDate, setStartDate] = useState(() => task?.startDate ?? '');
  const [dueDate, setDueDate] = useState(() => task?.dueDate ?? '');
  const [estimate, setEstimate] = useState(() => task?.estimate ?? '');
  const [subtasks, setSubtasks] = useState<Subtask[]>(() => task?.subtasks ?? []);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [attachments, setAttachments] = useState<AttachmentMeta[]>([]);
  const [attachmentsToDelete, setAttachmentsToDelete] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(() =>
    !!(task?.startDate || task?.dueDate || task?.estimate || (task?.subtasks && task.subtasks.length > 0))
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    if (isOpen && task) {
      attachmentStore.getAttachmentsByTask(task.id)
        .then((a) => { if (!cancelled) setAttachments(a); })
        .catch(() => { if (!cancelled) setAttachments([]); });
      if (!cancelled) setAttachmentsToDelete([]);
    }
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    return () => { cancelled = true; };
  }, [isOpen, task]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    if (task && pendingFiles.length > 0) {
      for (const file of pendingFiles) {
        await attachmentStore.addAttachment(task.id, file);
      }
    }

    if (task && attachmentsToDelete.length > 0) {
      for (const id of attachmentsToDelete) {
        await attachmentStore.deleteAttachment(id);
      }
      setAttachments((prev) => prev.filter((a) => !attachmentsToDelete.includes(a.id)));
      setAttachmentsToDelete([]);
    }

    onSave({
      title: title.trim(),
      description: description.trim(),
      priority,
      columnId,
      tags,
      startDate: startDate || undefined,
      dueDate: dueDate || undefined,
      estimate: estimate.trim() || undefined,
      subtasks: subtasks.length > 0 ? subtasks : undefined,
      pendingFiles: task ? undefined : pendingFiles.length > 0 ? pendingFiles : undefined,
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const selected = Array.from(files);
    setPendingFiles((prev) => [...prev, ...selected]);
    requestAnimationFrame(() => { e.target.value = ''; });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setPendingFiles((prev) => [...prev, ...Array.from(files)]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteAttachment = (id: string) => {
    setAttachmentsToDelete((prev) => [...prev, id]);
  };

  const handleDownloadAttachment = async (att: AttachmentMeta) => {
    try {
      const blob = await attachmentStore.getAttachmentBlob(att.id);
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = att.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Download failed silently
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput('');
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleAddSubtask = () => {
    const text = subtaskInput.trim();
    if (!text) return;
    setSubtasks((prev) => [...prev, { id: uuidv4(), title: text, done: false }]);
    setSubtaskInput('');
  };

  const handleSubtaskKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSubtask();
    }
  };

  const toggleSubtask = (id: string) => {
    setSubtasks((prev) => prev.map((s) => s.id === id ? { ...s, done: !s.done } : s));
  };

  const removeSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const editSubtask = (id: string, newTitle: string) => {
    setSubtasks((prev) => prev.map((s) => s.id === id ? { ...s, title: newTitle } : s));
  };

  const subtaskSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  const handleSubtaskDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSubtasks((prev) => {
        const oldIndex = prev.findIndex((s) => s.id === active.id);
        const newIndex = prev.findIndex((s) => s.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{task ? 'Edit Task' : 'New Task'}</h2>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className={`form-group ${errors.title ? 'has-error' : ''}`}>
            <label htmlFor="task-title">Title</label>
            <input
              ref={inputRef}
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: '' })); }}
              placeholder="What needs to be done?"
            />
            {errors.title && <span className="field-error">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="task-desc">Description</label>
            <textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Priority</label>
              <CustomSelect
                value={priority}
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                ]}
                onChange={(v) => setPriority(v as Priority)}
              />
            </div>

            <div className="form-group">
              <label>Column</label>
              <CustomSelect
                value={columnId}
                options={columns.map((col) => ({ value: col.id, label: col.title }))}
                onChange={(v) => setColumnId(v)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Tags</label>
            <div className="tag-input-row">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Add tag and press Enter"
              />
              <button type="button" className="btn btn-secondary" onClick={handleAddTag}>Add</button>
            </div>
            {tags.length > 0 && (
              <div className="tags-list">
                {tags.map((tag) => (
                  <span key={tag} className="tag removable" onClick={() => setTags(tags.filter((t) => t !== tag))}>
                    {tag} <X size={12} />
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Attachments</label>
            <label
              className={`attachment-drop-zone ${isDragOver ? 'drag-over' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="file-input-hidden"
              />
              <Plus size={20} />
              <span>{isDragOver ? 'Drop files here' : 'Click or drag files here'}</span>
            </label>
            {(attachments.filter((a) => !attachmentsToDelete.includes(a.id)).length > 0 || pendingFiles.length > 0) && (
              <div className="attachment-list">
                {attachments
                  .filter((a) => !attachmentsToDelete.includes(a.id))
                  .map((att) => {
                  const Icon = getFileIcon(att.type);
                  return (
                    <div key={att.id} className="attachment-item">
                      <Icon size={15} className="attachment-icon" />
                      <span className="attachment-name" title={att.name}>{att.name}</span>
                      <span className="attachment-size">{formatFileSize(att.size)}</span>
                      <button type="button" className="icon-btn" onClick={() => handleDownloadAttachment(att)} aria-label="Download">
                        <Download size={13} />
                      </button>
                      <button type="button" className="icon-btn danger" onClick={() => handleDeleteAttachment(att.id)} aria-label="Remove">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
                {pendingFiles.map((file, i) => {
                  const Icon = getFileIcon(file.type);
                  return (
                    <div key={`pending-${i}`} className="attachment-item pending">
                      <Icon size={15} className="attachment-icon" />
                      <span className="attachment-name" title={file.name}>{file.name}</span>
                      <span className="attachment-size">{formatFileSize(file.size)}</span>
                      <button type="button" className="icon-btn danger" onClick={() => removePendingFile(i)} aria-label="Remove">
                        <X size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="button"
            className={`advanced-toggle ${showAdvanced ? 'open' : ''}`}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <ChevronDown size={14} className={`advanced-chevron ${showAdvanced ? 'rotated' : ''}`} />
            Advanced
          </button>

          <div className={`advanced-section ${showAdvanced ? 'open' : ''}`}>
            <div className="advanced-section-inner">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="task-start">Start Date</label>
                  <input
                    id="task-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="task-due">Due Date</label>
                  <input
                    id="task-due"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="task-estimate">Time Estimate</label>
                <input
                  id="task-estimate"
                  type="text"
                  value={estimate}
                  onChange={(e) => setEstimate(e.target.value)}
                  placeholder="e.g. 2h, 1d, 30m"
                />
              </div>

              <div className="form-group">
                <label>Subtasks</label>
                <div className="tag-input-row">
                  <input
                    type="text"
                    value={subtaskInput}
                    onChange={(e) => setSubtaskInput(e.target.value)}
                    onKeyDown={handleSubtaskKeyDown}
                    placeholder="Add subtask and press Enter"
                  />
                  <button type="button" className="btn btn-secondary" onClick={handleAddSubtask}>Add</button>
                </div>
                {subtasks.length > 0 && (
                  <DndContext
                    sensors={subtaskSensors}
                    collisionDetection={closestCenter}
                    modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                    onDragEnd={handleSubtaskDragEnd}
                  >
                    <SortableContext items={subtasks.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                      <div className="subtask-list">
                        {subtasks.map((s) => (
                          <SortableSubtaskItem key={s.id} subtask={s} onToggle={toggleSubtask} onRemove={removeSubtask} onEdit={editSubtask} />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">{task ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
