import React, { useRef, useState } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, BookOpen, Package, Image, X, Check } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

// ─── Module Form Modal ────────────────────────────────────────────────────────
const ModuleFormModal = ({ data, setData, onSave, onClose, title }) => {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const inp = (field) => (e) => setData(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="w-full max-w-2xl my-8 bg-[#0a0f1c]/95 border border-[#00cfff]/30 rounded-2xl shadow-[0_0_40px_rgba(0,207,255,0.1)]">
        <div className="flex justify-between items-center p-6 border-b border-[#00cfff]/10">
          <h3 className="text-white font-extrabold uppercase tracking-widest text-sm">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest block mb-1">Title *</label>
            <input value={data.title} onChange={inp('title')} className="w-full bg-[#030308] border border-[#00cfff]/20 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#00cfff] transition-all" placeholder="Module title..." />
          </div>
          {/* Description */}
          <div>
            <label className="text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest block mb-1">Short Description</label>
            <textarea value={data.description} onChange={inp('description')} rows={2} className="w-full bg-[#030308] border border-[#00cfff]/20 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#00cfff] transition-all resize-none" placeholder="Brief tagline..." />
          </div>
          {/* Content */}
          <div>
            <label className="text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest block mb-1">Content (HTML/Rich Text)</label>
            <div className="react-quill-dark">
              <ReactQuill 
                theme="snow" 
                value={data.content_html} 
                onChange={(val) => setData(prev => ({ ...prev, content_html: val }))}
                placeholder="Write your module content here..."
                modules={{
                  toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link', 'image', 'video'],
                    ['clean']
                  ]
                }}
              />
            </div>
          </div>
          {/* YouTube URL */}
          <div>
            <label className="text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest block mb-1">YouTube Video URL (optional)</label>
            <input value={data.video_url} onChange={inp('video_url')} className="w-full bg-[#030308] border border-[#00cfff]/20 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#00cfff] transition-all font-mono" placeholder="https://www.youtube.com/watch?v=..." />
          </div>
          {/* Price + Published row */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest block mb-1">Price ($)</label>
              <input type="number" min="0" step="0.01" value={data.price} onChange={inp('price')} className="w-full bg-[#030308] border border-[#00cfff]/20 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#00cfff] transition-all" />
            </div>
            <div className="flex items-end pb-2.5">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div
                  className={`w-12 h-6 rounded-full transition-all relative ${data.is_free ? 'bg-green-500' : 'bg-gray-700'}`}
                  onClick={() => setData(prev => ({ ...prev, is_free: !prev.is_free }))}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${data.is_free ? 'left-7' : 'left-1'}`} />
                </div>
                <span className="text-sm font-bold text-gray-300">Free</span>
              </label>
            </div>
            <div className="flex items-end pb-2.5">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div
                  className={`w-12 h-6 rounded-full transition-all relative ${data.is_published ? 'bg-[#00cfff]' : 'bg-gray-700'}`}
                  onClick={() => setData(prev => ({ ...prev, is_published: !prev.is_published }))}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${data.is_published ? 'left-7' : 'left-1'}`} />
                </div>
                <span className="text-sm font-bold text-gray-300">{data.is_published ? 'Published' : 'Draft'}</span>
              </label>
            </div>
          </div>
          {/* Thumbnail upload */}
          <div>
            <label className="text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest block mb-1">Thumbnail Image</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#030308] border border-[#00cfff]/20 text-[#00cfff] text-xs font-bold hover:bg-[#00cfff]/10 transition-all"
              >
                <Image className="w-4 h-4" /> {file ? 'Change Image' : 'Upload Thumbnail'}
              </button>
              {file && <span className="text-xs text-gray-400 truncate max-w-[180px]">{file.name}</span>}
              {!file && data.thumbnail_url && <span className="text-xs text-green-400">✓ Has existing thumbnail</span>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => setFile(e.target.files[0])} />
          </div>
        </div>
        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-[#00cfff]/10">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-transparent border border-[#00cfff]/30 text-[#00cfff] text-xs font-extrabold uppercase tracking-widest hover:bg-[#00cfff]/10 transition-all">Cancel</button>
          <button
            onClick={() => onSave(file)}
            disabled={!data.title.trim()}
            className="px-5 py-2.5 rounded-xl bg-[#00cfff] text-[#030308] text-xs font-extrabold uppercase tracking-widest hover:bg-[#00e5ff] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(0,207,255,0.3)]"
          >
            Save Module
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Bundle Form Modal ─────────────────────────────────────────────────────────
const BundleFormModal = ({ data, setData, onSave, onClose, title, allModules }) => {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const inp = (field) => (e) => setData(prev => ({ ...prev, [field]: e.target.value }));

  const toggleMod = (id) => {
    setData(prev => ({
      ...prev,
      module_ids: prev.module_ids.includes(id) ? prev.module_ids.filter(x => x !== id) : [...prev.module_ids, id]
    }));
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="w-full max-w-2xl my-8 bg-[#0a0f1c]/95 border border-purple-500/30 rounded-2xl shadow-[0_0_40px_rgba(147,51,234,0.1)]">
        <div className="flex justify-between items-center p-6 border-b border-purple-500/10">
          <h3 className="text-white font-extrabold uppercase tracking-widest text-sm">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-[10px] font-extrabold text-purple-400/70 uppercase tracking-widest block mb-1">Bundle Title *</label>
            <input value={data.title} onChange={inp('title')} className="w-full bg-[#030308] border border-purple-500/20 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-purple-500 transition-all" placeholder="Bundle name..." />
          </div>
          <div>
            <label className="text-[10px] font-extrabold text-purple-400/70 uppercase tracking-widest block mb-1">Description</label>
            <textarea value={data.description} onChange={inp('description')} rows={2} className="w-full bg-[#030308] border border-purple-500/20 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-purple-500 transition-all resize-none" placeholder="Bundle description..." />
          </div>

          {/* Module selection */}
          <div>
            <label className="text-[10px] font-extrabold text-purple-400/70 uppercase tracking-widest block mb-2">Select Modules to Include</label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {allModules.length === 0 && <p className="text-gray-600 text-xs py-4 text-center">No modules available. Create modules first.</p>}
              {allModules.map(m => (
                <label key={m.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${data.module_ids.includes(m.id) ? 'bg-purple-900/20 border-purple-500/40' : 'bg-[#030308] border-purple-500/10 hover:border-purple-500/30'}`}>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 ${data.module_ids.includes(m.id) ? 'bg-purple-600 border-purple-500' : 'border-gray-600'}`} onClick={() => toggleMod(m.id)}>
                    {data.module_ids.includes(m.id) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm text-gray-300">{m.title}</span>
                  <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded ${m.is_published ? 'text-green-400 bg-green-900/20' : 'text-gray-500 bg-gray-900/20'}`}>{m.is_published ? 'Published' : 'Draft'}</span>
                </label>
              ))}
            </div>
            <p className="text-gray-600 text-xs mt-1">{data.module_ids.length} module(s) selected</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-extrabold text-purple-400/70 uppercase tracking-widest block mb-1">Bundle Price ($)</label>
              <input type="number" min="0" step="0.01" value={data.price} onChange={inp('price')} className="w-full bg-[#030308] border border-purple-500/20 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-purple-500 transition-all" />
            </div>
            <div className="flex items-end pb-2.5">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  className={`w-12 h-6 rounded-full transition-all relative ${data.is_free ? 'bg-green-500' : 'bg-gray-700'}`}
                  onClick={() => setData(prev => ({ ...prev, is_free: !prev.is_free }))}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${data.is_free ? 'left-7' : 'left-1'}`} />
                </div>
                <span className="text-sm font-bold text-gray-300">Free</span>
              </label>
            </div>
            <div className="flex items-end pb-2.5">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  className={`w-12 h-6 rounded-full transition-all relative ${data.is_published ? 'bg-purple-500' : 'bg-gray-700'}`}
                  onClick={() => setData(prev => ({ ...prev, is_published: !prev.is_published }))}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${data.is_published ? 'left-7' : 'left-1'}`} />
                </div>
                <span className="text-sm font-bold text-gray-300">{data.is_published ? 'Published' : 'Draft'}</span>
              </label>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-purple-400/70 uppercase tracking-widest block mb-1">Bundle Thumbnail (optional)</label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#030308] border border-purple-500/20 text-purple-400 text-xs font-bold hover:bg-purple-500/10 transition-all">
                <Image className="w-4 h-4" /> {file ? 'Change' : 'Upload'}
              </button>
              {file && <span className="text-xs text-gray-400 truncate max-w-[180px]">{file.name}</span>}
              {!file && data.thumbnail_url && <span className="text-xs text-green-400">✓ Has existing thumbnail</span>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => setFile(e.target.files[0])} />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-purple-500/10">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-transparent border border-purple-500/30 text-purple-400 text-xs font-extrabold uppercase tracking-widest hover:bg-purple-500/10 transition-all">Cancel</button>
          <button onClick={() => onSave(file)} disabled={!data.title.trim()} className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-extrabold uppercase tracking-widest hover:bg-purple-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(147,51,234,0.3)]">
            Save Bundle
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Learning Admin Panel ─────────────────────────────────────────────────
const LearningAdminPanel = ({
  subTab, setSubTab, modules, bundles, loading,
  moduleForm, setModuleForm, moduleFormData, setModuleFormData,
  bundleForm, setBundleForm, bundleFormData, setBundleFormData,
  onNewModule, onEditModule, onDeleteModule, onSaveModule,
  onNewBundle, onEditBundle, onDeleteBundle, onSaveBundle,
  onToggleModule,
}) => {
  return (
    <div className="animate-fade-in space-y-6">
      {/* Sub-tab switcher */}
      <div className="flex items-center gap-1 bg-[#030308] p-1 rounded-xl border border-[#00cfff]/10 w-fit">
        <button onClick={() => setSubTab('modules')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-widest transition-all ${subTab === 'modules' ? 'bg-[#00cfff]/10 text-[#00cfff] border border-[#00cfff]/30 shadow-[0_0_10px_rgba(0,207,255,0.1)]' : 'text-gray-500 hover:text-gray-300'}`}>
          <BookOpen className="w-3.5 h-3.5" /> Individual Modules
        </button>
        <button onClick={() => setSubTab('bundles')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-widest transition-all ${subTab === 'bundles' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30 shadow-[0_0_10px_rgba(147,51,234,0.1)]' : 'text-gray-500 hover:text-gray-300'}`}>
          <Package className="w-3.5 h-3.5" /> Bundles
        </button>
      </div>

      {/* ── Modules sub-tab ── */}
      {subTab === 'modules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-extrabold uppercase tracking-widest text-sm">Individual Modules <span className="text-gray-600 font-mono ml-2">({modules.length})</span></h3>
            <button onClick={onNewModule} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00cfff]/10 border border-[#00cfff]/30 text-[#00cfff] text-xs font-extrabold uppercase tracking-widest hover:bg-[#00cfff]/20 transition-all shadow-[0_0_10px_rgba(0,207,255,0.1)]">
              <Plus className="w-3.5 h-3.5" /> New Module
            </button>
          </div>
          {loading ? (
            <p className="text-gray-600 text-xs text-center py-8">Loading...</p>
          ) : modules.length === 0 ? (
            <p className="text-gray-600 text-xs text-center py-12 border border-[#00cfff]/10 rounded-xl">No modules yet. Click "New Module" to create one.</p>
          ) : (
            <div className="space-y-2">
              {modules.map(m => (
                <div key={m.id} className="flex items-center gap-4 p-4 bg-[#030308]/60 border border-[#00cfff]/10 rounded-xl hover:border-[#00cfff]/30 transition-all group">
                  {m.thumbnail_url
                    ? <img src={`${import.meta.env.VITE_API_BASE_URL}${m.thumbnail_url}`} alt="" className="w-14 h-10 rounded-lg object-cover shrink-0 border border-[#00cfff]/10" />
                    : <div className="w-14 h-10 rounded-lg bg-[#0a0f1c] border border-[#00cfff]/10 flex items-center justify-center shrink-0"><BookOpen className="w-4 h-4 text-gray-600" /></div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{m.title}</p>
                    <p className="text-gray-500 text-xs truncate">{m.description || 'No description'}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {m.is_free ? (
                      <span className="text-green-400 font-extrabold text-sm uppercase">Free</span>
                    ) : (
                      <span className="text-[#00cfff] font-extrabold text-sm">${m.price.toFixed(2)}</span>
                    )}
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest border ${m.is_published ? 'bg-green-900/20 text-green-400 border-green-500/30' : 'bg-gray-900/20 text-gray-500 border-gray-700'}`}>
                      {m.is_published ? <><Eye className="w-2.5 h-2.5 inline mr-1" />Live</> : <><EyeOff className="w-2.5 h-2.5 inline mr-1" />Draft</>}
                    </span>
                    <button onClick={() => onEditModule(m)} className="opacity-50 group-hover:opacity-100 text-[#00cfff] hover:bg-[#00cfff]/10 p-1.5 rounded-lg transition-all"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => onDeleteModule(m.id)} className="opacity-50 group-hover:opacity-100 text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Bundles sub-tab ── */}
      {subTab === 'bundles' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-extrabold uppercase tracking-widest text-sm">Module Bundles <span className="text-gray-600 font-mono ml-2">({bundles.length})</span></h3>
            <button onClick={onNewBundle} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600/10 border border-purple-500/30 text-purple-400 text-xs font-extrabold uppercase tracking-widest hover:bg-purple-600/20 transition-all shadow-[0_0_10px_rgba(147,51,234,0.1)]">
              <Plus className="w-3.5 h-3.5" /> New Bundle
            </button>
          </div>
          {loading ? (
            <p className="text-gray-600 text-xs text-center py-8">Loading...</p>
          ) : bundles.length === 0 ? (
            <p className="text-gray-600 text-xs text-center py-12 border border-purple-500/10 rounded-xl">No bundles yet. Click "New Bundle" to create one.</p>
          ) : (
            <div className="space-y-2">
              {bundles.map(b => (
                <div key={b.id} className="flex items-center gap-4 p-4 bg-[#030308]/60 border border-purple-500/10 rounded-xl hover:border-purple-500/30 transition-all group">
                  {b.thumbnail_url
                    ? <img src={`${import.meta.env.VITE_API_BASE_URL}${b.thumbnail_url}`} alt="" className="w-14 h-10 rounded-lg object-cover shrink-0 border border-purple-500/10" />
                    : <div className="w-14 h-10 rounded-lg bg-[#0a0f1c] border border-purple-500/10 flex items-center justify-center shrink-0"><Package className="w-4 h-4 text-gray-600" /></div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{b.title}</p>
                    <p className="text-gray-500 text-xs">{(b.module_ids || []).length} module(s)</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {b.is_free ? (
                      <span className="text-green-400 font-extrabold text-sm uppercase">Free</span>
                    ) : (
                      <span className="text-purple-400 font-extrabold text-sm">${b.price.toFixed(2)}</span>
                    )}
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest border ${b.is_published ? 'bg-green-900/20 text-green-400 border-green-500/30' : 'bg-gray-900/20 text-gray-500 border-gray-700'}`}>
                      {b.is_published ? 'Live' : 'Draft'}
                    </span>
                    <button onClick={() => onEditBundle(b)} className="opacity-50 group-hover:opacity-100 text-purple-400 hover:bg-purple-500/10 p-1.5 rounded-lg transition-all"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => onDeleteBundle(b.id)} className="opacity-50 group-hover:opacity-100 text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {moduleForm && (
        <ModuleFormModal
          data={moduleFormData}
          setData={setModuleFormData}
          onSave={onSaveModule}
          onClose={() => setModuleForm(null)}
          title={moduleForm === 'new' ? 'New Learning Module' : 'Edit Module'}
        />
      )}
      {bundleForm && (
        <BundleFormModal
          data={bundleFormData}
          setData={setBundleFormData}
          onSave={onSaveBundle}
          onClose={() => setBundleForm(null)}
          title={bundleForm === 'new' ? 'New Module Bundle' : 'Edit Bundle'}
          allModules={modules}
        />
      )}
    </div>
  );
};

export default LearningAdminPanel;
