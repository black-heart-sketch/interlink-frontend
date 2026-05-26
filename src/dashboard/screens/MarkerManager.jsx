import React, { useState, useEffect } from 'react';

export default function MarkerManager({ initialTime, markerDataToEdit, onSubmit, onCancel }) {
  const [time, setTime] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const isEditMode = Boolean(markerDataToEdit && markerDataToEdit._id);

  useEffect(() => {
    if (isEditMode) {
      setTime(markerDataToEdit.time || 0);
      setTitle(markerDataToEdit.title || '');
      setDescription(markerDataToEdit.description || '');
    } else {
      setTime(initialTime || 0);
      setTitle('');
      setDescription('');
    }
  }, [initialTime, markerDataToEdit, isEditMode]);

  const formatTimeForDisplay = (seconds) => {
    if (isNaN(seconds) || seconds === null || seconds < 0) return '00:00:00';
    return new Date(seconds * 1000).toISOString().substr(11, 8); // HH:MM:SS
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      time: time,
      title: title.trim(),
      description: description.trim()
    };
    if (isEditMode) {
      payload._id = markerDataToEdit._id;
    }
    if (onSubmit) {
      onSubmit(payload);
    }
  };

  const inputCls = "bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/60 transition-colors w-full";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-slate-400 text-sm font-semibold mb-2">Timestamp (HH:MM:SS)</label>
        <input
          type="text"
          value={formatTimeForDisplay(time)}
          disabled
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-400 outline-none w-full cursor-not-allowed"
        />
      </div>
      <div>
        <label className="block text-slate-400 text-sm font-semibold mb-2">Notion Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus={!isEditMode}
          placeholder="e.g. key formula, intro block"
          className={inputCls}
        />
      </div>
      <div>
        <label className="block text-slate-400 text-sm font-semibold mb-2">Notion Description (Optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Brief details..."
          className={inputCls}
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-3 rounded-xl border border-white/10 text-slate-300 bg-transparent hover:bg-white/5 cursor-pointer transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer border-none transition-colors"
        >
          {isEditMode ? 'Save Changes' : 'Add Notion'}
        </button>
      </div>
    </form>
  );
}
