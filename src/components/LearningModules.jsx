import React, { useState, useEffect, useCallback } from 'react';
import api from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';
import ModuleViewer from './ModuleViewer';
import PreviewGateModal from './PreviewGateModal';
import {
  BookOpen, Package, Lock, Zap, PlayCircle, ImageOff,
  Loader2, RefreshCw, Clock, CheckCircle2
} from 'lucide-react';

const PlanBadge = ({ plan }) => {
  const p = (plan || '').toLowerCase();
  if (p.includes('platinum')) return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest bg-purple-900/30 text-purple-400 border border-purple-500/30">Platinum</span>;
  if (p.includes('premium')) return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest bg-blue-900/20 text-engine-neon border border-engine-neon/30">Premium</span>;
  return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest bg-engine-bg text-gray-400 border border-white/10">Free</span>;
};

const ModuleCard = ({ module, onOpen, isPremiumLimited }) => {
  const isPaid = module.price > 0;
  return (
    <div className="group relative flex flex-col bg-engine-panel border border-engine-neon/10 hover:border-engine-neon/40 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_25px_rgba(var(--engine-neon-rgb),0.08)]">
      {/* Thumbnail */}
      <div className="relative w-full h-40 bg-engine-bg overflow-hidden shrink-0">
        {module.thumbnail_url
          ? <img src={`${import.meta.env.VITE_API_BASE_URL}${module.thumbnail_url}`} alt={module.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center"><ImageOff className="w-8 h-8 text-gray-700" /></div>
        }
        {module.video_url && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg">
            <PlayCircle className="w-3 h-3 text-engine-neon" />
            <span className="text-[9px] font-bold text-engine-neon uppercase tracking-widest">Video</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <h3 className="text-white font-bold text-sm leading-tight line-clamp-2">{module.title}</h3>
        {module.description && <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{module.description}</p>}

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
          <span className={`font-extrabold text-sm ${isPaid ? 'text-engine-neon' : 'text-green-400'}`}>
            {isPaid ? `$${module.price.toFixed(2)}` : 'Free'}
          </span>
          <button
            onClick={() => onOpen(module)}
            disabled={isPremiumLimited}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-extrabold uppercase tracking-widest transition-all
              ${isPremiumLimited
                ? 'opacity-40 cursor-not-allowed bg-gray-800 text-gray-500 border border-gray-700'
                : 'bg-engine-neon/10 border border-engine-neon/40 text-engine-neon hover:bg-engine-neon hover:text-engine-bg shadow-[0_0_10px_rgba(var(--engine-neon-rgb),0.1)]'
              }`}
          >
            {isPremiumLimited ? <Lock className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
            {isPremiumLimited ? 'Limit' : 'Learn'}
          </button>
        </div>
      </div>
    </div>
  );
};

const BundleCard = ({ bundle, onOpen }) => (
  <div className="group relative flex flex-col bg-engine-panel border border-purple-500/10 hover:border-purple-500/40 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_25px_rgba(147,51,234,0.1)]">
    {/* Stacked thumbnail */}
    <div className="relative w-full h-44 bg-engine-bg overflow-hidden shrink-0">
      {bundle.modules?.slice(0, 3).map((m, i) => (
        m.thumbnail_url
          ? <img
              key={m.id}
              src={`${import.meta.env.VITE_API_BASE_URL}${m.thumbnail_url}`}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: 1 - i * 0.3, transform: `scale(${1 - i * 0.04}) translateY(${i * 4}px)`, zIndex: 3 - i }}
            />
          : null
      ))}
      {!bundle.modules?.some(m => m.thumbnail_url) && (
        <div className="w-full h-full flex items-center justify-center"><Package className="w-10 h-10 text-gray-700" /></div>
      )}
      <div className="absolute top-2 left-2 flex items-center gap-1 bg-purple-900/80 backdrop-blur-sm px-2.5 py-1 rounded-lg z-10">
        <Package className="w-3 h-3 text-purple-400" />
        <span className="text-[9px] font-extrabold text-purple-300 uppercase tracking-widest">{bundle.modules?.length || 0} Modules</span>
      </div>
    </div>

    <div className="flex flex-col flex-1 p-4 gap-3">
      <h3 className="text-white font-bold text-sm leading-tight">{bundle.title}</h3>
      {bundle.description && <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{bundle.description}</p>}

      {/* Module list preview */}
      <div className="space-y-1">
        {bundle.modules?.slice(0, 3).map(m => (
          <div key={m.id} className="flex items-center gap-2 text-xs text-gray-400">
            <CheckCircle2 className="w-3 h-3 text-purple-400 shrink-0" />
            <span className="truncate">{m.title}</span>
          </div>
        ))}
        {bundle.modules?.length > 3 && (
          <p className="text-xs text-gray-600 pl-5">+{bundle.modules.length - 3} more modules</p>
        )}
      </div>

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
        <span className="font-extrabold text-sm text-purple-400">${bundle.price.toFixed(2)}</span>
        <button
          onClick={() => onOpen(bundle)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-extrabold uppercase tracking-widest bg-purple-600/20 border border-purple-500/40 text-purple-400 hover:bg-purple-600 hover:text-white transition-all shadow-[0_0_10px_rgba(147,51,234,0.1)]"
        >
          <Package className="w-3 h-3" /> Open Bundle
        </button>
      </div>
    </div>
  </div>
);

const LearningModules = () => {
  const { userData } = useAuth();
  const [modules, setModules] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewsToday, setViewsToday] = useState(0);

  // Viewer state
  const [viewerModule, setViewerModule] = useState(null);
  const [viewerModules, setViewerModules] = useState([]); // for bundle navigation
  const [viewerIndex, setViewerIndex] = useState(0);

  // Gate modal
  const [gateItem, setGateItem] = useState(null);
  const [gateType, setGateType] = useState('module');

  const plan = (userData?.plan || '').toLowerCase();
  const isPlatinum = userData?.role === 'admin' || plan.includes('platinum');
  const isPremium = plan.includes('premium');
  const DAILY_LIMIT = 3;
  const isPremiumLimited = isPremium && viewsToday >= DAILY_LIMIT;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [modRes, bunRes] = await Promise.all([
        api.get('/learning/modules'),
        api.get('/learning/bundles'),
      ]);
      setModules(modRes.data);
      setBundles(bunRes.data);
      if (isPremium) {
        const vRes = await api.get('/learning/my_views_today');
        setViewsToday(vRes.data.views_today);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [isPremium]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openModule = async (module) => {
    if (isPlatinum) { setViewerModules([module]); setViewerIndex(0); setViewerModule(module); return; }
    try {
      const res = await api.get(`/learning/modules/${module.id}`);
      if (isPremium) setViewsToday(v => v + 1);
      setViewerModules([res.data]);
      setViewerIndex(0);
      setViewerModule(res.data);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'object' && (detail?.reason === 'gate' || detail?.reason === 'premium_limit')) {
        setGateItem(detail.module || module);
        setGateType('module');
      }
    }
  };

  const openBundle = async (bundle) => {
    if (isPlatinum) {
      setViewerModules(bundle.modules);
      setViewerIndex(0);
      setViewerModule(bundle.modules[0]);
      return;
    }
    try {
      const res = await api.get(`/learning/bundles/${bundle.id}`);
      if (isPremium) setViewsToday(v => Math.min(v + res.data.modules.length, DAILY_LIMIT));
      setViewerModules(res.data.modules);
      setViewerIndex(0);
      setViewerModule(res.data.modules[0]);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'object') {
        setGateItem(detail.bundle || bundle);
        setGateType('bundle');
      }
    }
  };

  const closeViewer = () => { setViewerModule(null); setViewerModules([]); setViewerIndex(0); };
  const goNext = () => { const ni = viewerIndex + 1; setViewerIndex(ni); setViewerModule(viewerModules[ni]); };
  const goPrev = () => { const ni = viewerIndex - 1; setViewerIndex(ni); setViewerModule(viewerModules[ni]); };

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white uppercase tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
            Learning Modules
          </h1>
          <p className="text-gray-400 text-sm mt-1">Master trading with our expert-crafted content.</p>
        </div>
        <div className="flex items-center gap-3">
          {userData && <PlanBadge plan={userData.plan} />}
          {isPremium && !isPlatinum && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border ${isPremiumLimited ? 'bg-red-900/20 border-red-500/30 text-red-400' : 'bg-engine-neon/5 border-engine-neon/20 text-engine-neon'}`}>
              <Clock className="w-3.5 h-3.5" />
              {viewsToday}/{DAILY_LIMIT} today
            </div>
          )}
          {isPlatinum && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-900/20 border border-purple-500/30 text-purple-400">
              <Zap className="w-3.5 h-3.5" /> Unlimited Access
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-engine-neon animate-spin" />
        </div>
      ) : (
        <>
          {/* Single Modules Section */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="w-5 h-5 text-engine-neon" />
              <h2 className="text-lg font-extrabold text-white uppercase tracking-widest">Individual Modules</h2>
              <span className="text-xs text-gray-600 font-mono">{modules.length} available</span>
            </div>
            {modules.length === 0
              ? <p className="text-gray-600 text-sm py-12 text-center border border-white/5 rounded-2xl">No modules published yet.</p>
              : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {modules.map(m => <ModuleCard key={m.id} module={m} onOpen={openModule} isPremiumLimited={isPremiumLimited} />)}
                </div>
            }
          </section>

          {/* Bundle Section */}
          {bundles.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <Package className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-extrabold text-white uppercase tracking-widest">Module Bundles</h2>
                <span className="text-xs text-gray-600 font-mono">{bundles.length} available</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {bundles.map(b => <BundleCard key={b.id} bundle={b} onOpen={openBundle} />)}
              </div>
            </section>
          )}
        </>
      )}

      {/* Modals */}
      {viewerModule && (
        <ModuleViewer
          module={viewerModule}
          onClose={closeViewer}
          onNext={goNext}
          onPrev={goPrev}
          hasNext={viewerIndex < viewerModules.length - 1}
          hasPrev={viewerIndex > 0}
          currentIndex={viewerIndex}
          totalCount={viewerModules.length}
        />
      )}
      {gateItem && (
        <PreviewGateModal
          item={gateItem}
          type={gateType}
          onClose={() => setGateItem(null)}
        />
      )}
    </div>
  );
};

export default LearningModules;
