import React, { useState, useEffect } from "react";
import { Sparkles, Users, Globe, X } from "lucide-react";
import api from "../lib/axios";
import { createPortal } from "react-dom";

const ShareStrategyModal = ({ isOpen, onClose, simulationData, showFlash }) => {
  const [caption, setCaption] = useState("");
  const [communities, setCommunities] = useState([]);
  const [selectedDestinations, setSelectedDestinations] = useState({
    home: true, // Default to home feed
    communities: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchJoinedCommunities();
    }
  }, [isOpen]);

  const fetchJoinedCommunities = async () => {
    try {
      // 1. Fetch joined community IDs
      const joinedRes = await api.get("/users/me/joined_communities");
      const joinedIds = joinedRes.data;

      // 2. Fetch all communities and filter
      const allCommRes = await api.get("/communities");
      const joined = allCommRes.data.filter(c => joinedIds.includes(c.id));
      setCommunities(joined);
    } catch (error) {
      console.error("Failed to fetch communities", error);
    }
  };

  const toggleCommunity = (id) => {
    setSelectedDestinations(prev => {
      const current = prev.communities;
      if (current.includes(id)) {
        return { ...prev, communities: current.filter(cId => cId !== id) };
      } else {
        return { ...prev, communities: [...current, id] };
      }
    });
  };

  const handleShare = async () => {
    if (!selectedDestinations.home && selectedDestinations.communities.length === 0) {
      showFlash("Please select at least one destination.", "error");
      return;
    }
    
    if (!simulationData || !simulationData.formData) {
      showFlash("Simulation data is missing.", "error");
      return;
    }

    setIsSubmitting(true);
    
    // Serialize relevant simulation data
    const strategyDataStr = JSON.stringify({
      formData: simulationData.formData,
      summary: simulationData.summary,
      monte_carlo: simulationData.monte_carlo,
      daily_breakdown: simulationData.daily_breakdown // include so we can render line chart in feed
    });

    try {
      // We need to send requests for Home and each selected community
      const promises = [];

      if (selectedDestinations.home) {
        const formData = new FormData();
        formData.append("content", caption);
        formData.append("strategy_data", strategyDataStr);
        promises.push(api.post("/posts", formData));
      }

      for (const commId of selectedDestinations.communities) {
        const formData = new FormData();
        formData.append("content", caption);
        formData.append("community_id", commId);
        formData.append("strategy_data", strategyDataStr);
        promises.push(api.post("/posts", formData));
      }

      await Promise.all(promises);
      
      showFlash("Strategy shared successfully!", "success");
      setCaption("");
      setSelectedDestinations({ home: true, communities: [] });
      onClose();
    } catch (error) {
      console.error("Failed to share strategy", error);
      showFlash("Failed to share strategy. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-engine-bg/90 backdrop-blur-engine p-4" onClick={onClose}>
      <div 
        className="bg-engine-panel border border-engine-panel-border/30 p-8 rounded-2xl shadow-panel-neon max-w-md w-full relative animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-engine-neon/50 hover:text-engine-neon transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-extrabold text-white mb-6 flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-engine-neon drop-shadow-panel-neon" /> 
          Share Strategy
        </h3>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">
              Caption
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Describe your strategy or what you learned..."
              className="w-full bg-engine-bg border border-engine-panel-border/30 rounded-xl p-3 text-white text-sm focus:border-engine-panel-border focus:shadow-panel-neon outline-none h-24 resize-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-3">
              Share To
            </label>
            
            <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-2">
              {/* Home Feed Option */}
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border transition-all hover:bg-engine-button/5 border-engine-panel-border/30">
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${selectedDestinations.home ? 'border-engine-button-border bg-engine-button/20' : 'border-gray-600'}`}>
                  {selectedDestinations.home && <div className="w-2.5 h-2.5 rounded-full bg-engine-button shadow-button-neon"></div>}
                </div>
                <input 
                  type="checkbox" 
                  checked={selectedDestinations.home}
                  onChange={(e) => setSelectedDestinations(prev => ({ ...prev, home: e.target.checked }))}
                  className="hidden"
                />
                <Globe className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-bold text-white">Home Feed</span>
              </label>

              {/* Communities Options */}
              {communities.map(comm => (
                <label key={comm.id} className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border transition-all hover:bg-engine-button/5 border-engine-panel-border/30">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${selectedDestinations.communities.includes(comm.id) ? 'border-engine-button-border bg-engine-button/20' : 'border-gray-600'}`}>
                    {selectedDestinations.communities.includes(comm.id) && <div className="w-2.5 h-2.5 rounded-full bg-engine-button shadow-button-neon"></div>}
                  </div>
                  <input 
                    type="checkbox" 
                    checked={selectedDestinations.communities.includes(comm.id)}
                    onChange={() => toggleCommunity(comm.id)}
                    className="hidden"
                  />
                  <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white border border-engine-panel-border/50" style={{ background: comm.bg_value }}>
                    {comm.name.substring(0,2).toUpperCase()}
                  </div>
                  <span className="text-sm font-bold text-white">{comm.name}</span>
                </label>
              ))}
              
              {communities.length === 0 && (
                <p className="text-xs text-gray-500 italic px-2">You haven't joined any communities yet.</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-engine-panel-border/10 flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleShare}
              disabled={isSubmitting || (!selectedDestinations.home && selectedDestinations.communities.length === 0)}
              className={`px-6 py-2.5 bg-engine-button text-engine-bg text-xs font-extrabold uppercase tracking-widest rounded-xl transition-all shadow-button-neon flex items-center gap-2
                ${isSubmitting || (!selectedDestinations.home && selectedDestinations.communities.length === 0) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#00e5ff] hover:shadow-[0_0_20px_rgba(0,207,255,0.6)]'}`}
            >
              {isSubmitting ? 'Sharing...' : 'Share Strategy'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ShareStrategyModal;
