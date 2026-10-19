import React, { useState } from 'react';
import { 
  Video, 
  Plus, 
  Search, 
  X, 
  ArrowUp, 
  ArrowDown, 
  ExternalLink, 
  Trash2, 
  Play, 
  Eye 
} from 'lucide-react';

export default function AdminVideosTab({
  freeVideos,
  setFreeVideos,
  persistAll,
  triggerToast
}) {
  const [videoSearchQuery, setVideoSearchQuery] = useState('');
  const [showAddVideoModal, setShowAddVideoModal] = useState(false);
  const [previewVideoModal, setPreviewVideoModal] = useState(null);
  const [newVideo, setNewVideo] = useState({
    title: '',
    videoId: '',
    desc: ''
  });

  const extractCleanYouTubeId = (urlOrId) => {
    if (!urlOrId) return '';
    const str = String(urlOrId).trim();
    const match = str.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|watch\?.+&v=))([\w-]{11})/);
    if (match && match[1]) return match[1];
    const clean = str.split('?')[0].split('&')[0].replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (/^[\w-]{11}$/.test(clean)) return clean;
    return clean.length >= 11 ? clean.slice(-11) : clean;
  };

  const handleMoveVideo = (index, direction) => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= freeVideos.length) return;
    const nextList = [...freeVideos];
    const temp = nextList[index];
    nextList[index] = nextList[targetIdx];
    nextList[targetIdx] = temp;
    setFreeVideos(nextList);
    persistAll({ freeVideos: nextList });
    triggerToast('Video order updated!');
  };

  const handleAddVideo = (e) => {
    e.preventDefault();
    const cleanId = extractCleanYouTubeId(newVideo.videoId);
    if (!cleanId) {
      alert('Please enter a valid YouTube Video ID or URL.');
      return;
    }
    const item = {
      id: Date.now(),
      videoId: cleanId,
      title: newVideo.title.trim() || 'YouTube Class',
      desc: (newVideo.desc || newVideo.title || 'Class Video').trim()
    };
    const updated = [item, ...freeVideos];
    setFreeVideos(updated);
    persistAll({ freeVideos: updated });
    setNewVideo({ title: '', videoId: '', desc: '' });
    setShowAddVideoModal(false);
    triggerToast('🎬 YouTube video added successfully!');
  };

  const filteredVideos = freeVideos.filter(v => {
    if (!videoSearchQuery.trim()) return true;
    const q = videoSearchQuery.toLowerCase().trim();
    return (v.title || '').toLowerCase().includes(q) || (v.videoId || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header & Control Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/25 shrink-0">
              <Video className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Free YouTube Video Classes
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
                  {freeVideos.length} {freeVideos.length === 1 ? 'Class' : 'Classes'}
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Sync Active
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Manage featured YouTube classes, open lectures, and revision playlists displayed on the student homepage.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setNewVideo({ title: '', videoId: '', desc: '' });
                setShowAddVideoModal(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-bold shadow-md shadow-rose-600/25 hover:shadow-lg transition-all cursor-pointer border-none"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Video</span>
            </button>
          </div>
        </div>

        {/* Search Toolbar */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={videoSearchQuery}
              onChange={(e) => setVideoSearchQuery(e.target.value)}
              placeholder="Search video by title or YouTube ID..."
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-10 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-rose-500 transition-all font-medium"
            />
            {videoSearchQuery && (
              <button
                type="button"
                onClick={() => setVideoSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="hidden sm:inline">Showing:</span>
            <span className="font-bold text-slate-800">{filteredVideos.length} of {freeVideos.length} videos</span>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredVideos.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <Video className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-800">
              {videoSearchQuery ? 'No matching video classes found' : 'No video classes in library'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              {videoSearchQuery ? 'Try searching with a different keyword or clear the search filter.' : 'Click the button below to add your first YouTube video lecture.'}
            </p>
          </div>
          {videoSearchQuery ? (
            <button
              type="button"
              onClick={() => setVideoSearchQuery('')}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border-none cursor-pointer"
            >
              Clear Filter
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setNewVideo({ title: '', videoId: '', desc: '' });
                setShowAddVideoModal(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold border-none cursor-pointer shadow-md shadow-rose-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Video</span>
            </button>
          )}
        </div>
      ) : (
        /* Video Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredVideos.map((vid, idx) => {
            const actualIdx = freeVideos.findIndex(v => (v.id && vid.id) ? v.id === vid.id : v.videoId === vid.videoId);
            const cleanId = extractCleanYouTubeId(vid.videoId) || vid.videoId;
            const isFirst = actualIdx === 0;
            const isLast = actualIdx === freeVideos.length - 1;

            return (
              <div
                key={vid.id || idx}
                className="bg-white rounded-3xl border border-slate-200/90 hover:border-rose-300 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group"
              >
                {/* Card Top Action Bar */}
                <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 font-mono text-[11px] font-black flex items-center justify-center shadow-2xs shrink-0">
                      #{String(actualIdx + 1).padStart(2, '0')}
                    </span>
                    <span className="text-xs font-bold text-slate-700 truncate" title={vid.title}>
                      {vid.title || 'Untitled Lecture'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Move Up */}
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => handleMoveVideo(actualIdx, 'up')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer border-none bg-transparent transition-colors"
                      title="Move Earlier in List"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    {/* Move Down */}
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => handleMoveVideo(actualIdx, 'down')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer border-none bg-transparent transition-colors"
                      title="Move Later in List"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Open on YouTube */}
                    <a
                      href={`https://www.youtube.com/watch?v=${cleanId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white cursor-pointer transition-colors inline-flex items-center"
                      title="Open on YouTube (New Tab)"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete "${vid.title || 'this video'}"?`)) {
                          const updated = freeVideos.filter((_, i) => i !== actualIdx);
                          setFreeVideos(updated);
                          persistAll({ freeVideos: updated });
                          triggerToast('🗑️ Video removed from library.');
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer border-none bg-transparent transition-colors"
                      title="Delete Video"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4 flex-1">
                  {/* High-Resolution Thumbnail with Hover Play Button & Modal Trigger */}
                  <div 
                    onClick={() => setPreviewVideoModal({ title: vid.title, videoId: cleanId })}
                    className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 ring-1 ring-slate-200/80 cursor-pointer group/thumb shadow-inner"
                    title="Click to preview video player"
                  >
                    <img
                      src={`https://img.youtube.com/vi/${cleanId}/mqdefault.jpg`}
                      alt={vid.title}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://img.youtube.com/vi/${cleanId}/hqdefault.jpg`;
                      }}
                      className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-500 opacity-95 group-hover/thumb:opacity-100"
                    />
                    
                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10 group-hover/thumb:from-black/70 transition-colors" />

                    {/* Center Frosted Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-13 h-13 rounded-full bg-rose-600/90 group-hover/thumb:bg-rose-600 text-white flex items-center justify-center shadow-xl shadow-rose-900/40 backdrop-blur-xs group-hover/thumb:scale-110 transition-all duration-300">
                        <Play className="w-6 h-6 fill-white ml-0.5" />
                      </div>
                    </div>

                    {/* Top badges */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-black/70 backdrop-blur-md text-white border border-white/20">
                        YouTube
                      </span>
                    </div>

                    {/* Bottom overlay strip: ID chip + Click hint */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-[11px] font-semibold">
                      <span className="font-mono bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 text-slate-200">
                        ID: {cleanId}
                      </span>
                      <span className="flex items-center gap-1 bg-rose-600/90 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold shadow-xs">
                        <Eye className="w-3 h-3" />
                        Instant Preview
                      </span>
                    </div>
                  </div>

                  {/* Form Fields: Title & ID with smart paste auto-extraction */}
                  <div className="space-y-3 pt-1">
                    {/* Video Title Input */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                        <span>Video Title</span>
                        <span className="text-[10px] text-slate-400 font-normal">Shown on student homepage</span>
                      </label>
                      <input
                        type="text"
                        value={vid.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = freeVideos.map((v, i) => i === actualIdx ? { ...v, title: val } : v);
                          setFreeVideos(updated);
                          persistAll({ freeVideos: updated });
                        }}
                        placeholder="e.g. Admission Preparation Routine Hack"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all shadow-2xs"
                      />
                    </div>

                    {/* YouTube Video ID / Link Input */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                        <span>YouTube Video ID or Link</span>
                        <span className="text-[10px] text-slate-400 font-normal">Supports full links or 11-char ID</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={vid.videoId}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const clean = extractCleanYouTubeId(raw) || raw.trim();
                            const updated = freeVideos.map((v, i) => i === actualIdx ? { ...v, videoId: clean } : v);
                            setFreeVideos(updated);
                            persistAll({ freeVideos: updated });
                          }}
                          placeholder="e.g. rMGOI-A5czA or https://youtube.com/watch?v=..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-20 py-2.5 text-xs font-mono font-medium text-slate-800 outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(cleanId);
                            triggerToast('📋 Video ID copied to clipboard!');
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-[10px] font-bold border-none cursor-pointer transition-colors"
                          title="Copy ID to Clipboard"
                        >
                          Copy ID
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Bottom Strip */}
                <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setPreviewVideoModal({ title: vid.title, videoId: cleanId })}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer bg-transparent border-none p-0 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Watch Preview</span>
                  </button>

                  <a
                    href={`https://www.youtube.com/watch?v=${cleanId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    <span>Open on YouTube</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add Video */}
      {showAddVideoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add YouTube Video</h3>
                  <p className="text-[11px] text-slate-500">Feature a new video class on student homepage</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddVideoModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddVideo} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Video Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Free Medical Admission Physics Lecture"
                  value={newVideo.title}
                  onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-rose-500 transition-all font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">YouTube Link or Video ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  value={newVideo.videoId}
                  onChange={(e) => setNewVideo({ ...newVideo, videoId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-rose-500 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Short Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Complete conceptual breakdown with shortcut tricks."
                  value={newVideo.desc}
                  onChange={(e) => setNewVideo({ ...newVideo, desc: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-rose-500 transition-all resize-y"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddVideoModal(false)}
                  className="px-5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold border-none cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold border-none cursor-pointer shadow-md shadow-rose-500/20 transition-all"
                >
                  Add Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cinema Video Preview Player */}
      {previewVideoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-600/20 text-rose-500 flex items-center justify-center">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white truncate max-w-md">
                    {previewVideoModal.title || 'Video Class Preview'}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    YouTube ID: {previewVideoModal.videoId}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`https://www.youtube.com/watch?v=${previewVideoModal.videoId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold inline-flex items-center gap-1.5 transition-colors no-underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>YouTube</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewVideoModal(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${previewVideoModal.videoId}?autoplay=1&rel=0`}
                title={previewVideoModal.title || 'Video Preview'}
                className="w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
