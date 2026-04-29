import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import api from "../lib/axios";
import { useAuth } from "../contexts/AuthContext";
import VerifiedBadge from "./VerifiedBadge";
import { countryCodes } from "../utils/countryCodes";
import AuthenticatedImage from "./AuthenticatedImage";
import ImageCropModal from "./ImageCropModal";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// Memoized Community List
const MyCommunitiesList = React.memo(({ myCommunities, openEditModal }) => {
  if (myCommunities.length === 0) {
    return <p className="text-[#00cfff]/50 text-center py-6 font-extrabold uppercase tracking-widest text-[10px]">You haven't created any communities yet.</p>;
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {myCommunities.map(comm => (
        <div key={comm.id} className="bg-[#030308]/60 border border-[#00cfff]/10 p-5 rounded-xl flex justify-between items-center hover:bg-[#00cfff]/5 hover:border-[#00cfff]/30 transition-all duration-300 shadow-[0_0_10px_rgba(0,0,0,0.5)] hover:shadow-[0_0_15px_rgba(0,207,255,0.1)]">
          <div className="flex items-center gap-4">
          {comm.avatar_url ? <img src={`${API_BASE_URL}${comm.avatar_url}`} className="w-12 h-12 rounded-full object-cover border border-[#00cfff]/30 shadow-[0_0_10px_rgba(0,207,255,0.2)]" /> : <div className="w-12 h-12 rounded-full bg-[#00cfff]/10 border border-[#00cfff]/30 flex items-center justify-center font-extrabold text-[#00cfff] text-sm shadow-[0_0_10px_rgba(0,207,255,0.1)]">{comm.name.substring(0,2).toUpperCase()}</div>}          <div>
              <h4 className="font-extrabold text-white text-sm uppercase tracking-wider">{comm.name}</h4>
              <p className="text-[10px] text-[#00cfff]/70 uppercase tracking-widest font-bold mt-1">{comm.members_count} Members</p>
            </div>
          </div>
          <button onClick={() => openEditModal(comm)} className="text-[10px] bg-[#030308] border border-[#00cfff]/30 hover:bg-[#00cfff]/10 hover:border-[#00cfff]/50 text-[#00cfff] hover:text-[#00e5ff] hover:shadow-[0_0_10px_rgba(0,207,255,0.2)] px-4 py-2 rounded-lg font-extrabold uppercase tracking-widest transition-all">EDIT</button>
        </div>
      ))}
    </div>
  );
});

const Profile = ({ showFlash }) => {
  const { userData, avatarUrl, fetchUserProfile } = useAuth();
  const [user, setUser] = useState({
    username: "",
    email: "",
    full_name: "",
    country_code: "",
    phone_number: "",
    avatar_url: null,
  });
  const [password, setPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewAvatar, setPreviewAvatar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const fileInputRef = useRef(null);

  const [cropTarget, setCropTarget] = useState(null); // 'userAvatar' | 'editCommAvatar'
  const [rawCropFile, setRawCropFile] = useState(null);

  // My Communities State
  const [myCommunities, setMyCommunities] = useState([]);
  const [editingComm, setEditingComm] = useState(null); // If not null, show edit modal

  // Edit Community Modal State
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, message: "", onConfirm: null });
  const [activeEditTab, setActiveEditTab] = useState('appearance');
  const [commMembers, setCommMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Edit Community File States
  const [editCommAvatar, setEditCommAvatar] = useState(null);
  const [editCommBgImage, setEditCommBgImage] = useState(null);
  const [previewEditCommAvatar, setPreviewEditCommAvatar] = useState(null);
  const [previewEditCommBg, setPreviewEditCommBg] = useState(null);

  // Country Dropdown State
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const countryDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
        setIsCountryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchMyCommunities();
  }, []);

  useEffect(() => {
    if (editingComm && activeEditTab === 'members') {
        fetchCommMembers(editingComm.id);
    }
  }, [editingComm, activeEditTab]);

  const fetchProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await api.get("/users/me");
      setUser(res.data);
      if (res.data.avatar_url && !previewAvatar) {
        // Use the blob URL from context if available
        setUser(prev => ({...prev, avatar_url: avatarUrl}));
      }
    } catch (error) {
      console.error("Failed to fetch profile", error);
    }
  };

  const fetchMyCommunities = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await api.get("/users/me/communities");
      setMyCommunities(res.data);
    } catch (error) {
      console.error("Failed to fetch my communities", error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setRawCropFile(file);
      setCropTarget("userAvatar");
      e.target.value = null;
    }
  };

  const fetchCommMembers = async (communityId) => {
    setMembersLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await api.get(`/communities/${communityId}/members`);
        setCommMembers(res.data);
    } catch (error) {
        console.error("Failed to fetch members", error);
        showFlash(error.response?.data?.detail || "Could not load members.", "error");
    } finally {
        setMembersLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("username", user.username);
    formData.append("email", user.email);
    formData.append("full_name", user.full_name || "");
    formData.append("country_code", user.country_code || "");
    formData.append("phone_number", user.phone_number || "");
    if (password) formData.append("password", password);
    if (avatarFile) formData.append("avatar_file", avatarFile);

    try {
      const res = await api.put("/users/me", formData, {
        headers: { "Content-Type": undefined },
      });
      
      setUser(res.data);
      setPassword(""); // Clear password field
      setAvatarFile(null);
      setMessage({ type: "success", text: "Profile updated successfully!" });
      
      // Notify parent (App.jsx) to update navbar
      fetchUserProfile();
      
    } catch (error) {
      console.error("Update failed", error);
      setMessage({ 
        type: "error", 
        text: error.response?.data?.detail || "Failed to update profile." 
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = useCallback((comm) => {
    setEditingComm({
      ...comm,
      // Initialize gradient helpers if needed, though we mainly edit bg_value directly
      gradientStart: "#4facfe",
      gradientEnd: "#00f2fe",
      gradientDir: "to right"
    });
    setActiveEditTab('appearance'); // Default to appearance tab
    setCommMembers([]); // Clear previous members list
    setPreviewEditCommAvatar(comm.avatar_url ? `${API_BASE_URL}${comm.avatar_url}` : null);
    setPreviewEditCommBg(comm.bg_type === 'image' && comm.bg_value ? `${API_BASE_URL}${comm.bg_value}` : null);
    setEditCommAvatar(null);
    setEditCommBgImage(null);
  }, []);

  // Edit Community Handler (Reusing logic from Community.jsx but simplified for update)
  const handleUpdateCommunity = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("name", editingComm.name);
    formData.append("description", editingComm.description);
    formData.append("bg_type", editingComm.bg_type);
    formData.append("bg_value", editingComm.bg_value);
    formData.append("text_color", editingComm.text_color);
    formData.append("font_family", editingComm.font_family);
    formData.append("hover_animation", editingComm.hover_animation);
    formData.append("hover_color", editingComm.hover_color);
    
    if (editCommAvatar) formData.append("avatar_file", editCommAvatar);
    if (editCommBgImage && editingComm.bg_type === "image") formData.append("bg_image_file", editCommBgImage);

    try {
      await api.put(`/communities/${editingComm.id}`, formData, { headers: { "Content-Type": undefined } });
      showFlash("Community updated!", "success");
      setEditingComm(null);
      fetchMyCommunities();
    } catch (error) {
      showFlash("Failed to update community", "error");
    }
  };

  const handleKickMember = async (usernameToKick) => {
    if (!editingComm) return;
    setConfirmModal({
      isOpen: true,
      message: `Are you sure you want to kick ${usernameToKick} from the community?`,
      onConfirm: async () => {
        try {
            await api.delete(`/communities/${editingComm.id}/members/${usernameToKick}`);
            showFlash(`${usernameToKick} has been kicked.`, "success");
            // Refresh member list
            fetchCommMembers(editingComm.id);
            // Also refresh the main community list to update member count
            fetchMyCommunities(); 
        } catch (error) {
          showFlash(error.response?.data?.detail || "Failed to kick member.", "error");
        }
      }
    });
  };

  const filteredCountries = useMemo(() => countryCodes.filter(c => 
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) || 
    c.code.includes(countrySearch)
  ), [countrySearch]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      
      {/* PROFILE EDIT SECTION */}
      <div className="bg-[#0a0f1c]/60 p-8 rounded-2xl border border-[#00cfff]/20 shadow-[0_0_20px_rgba(0,207,255,0.05)] backdrop-blur-md animate-fade-in">
      <h2 className="text-2xl font-extrabold text-white uppercase tracking-widest mb-8 border-b border-[#00cfff]/10 pb-4 flex items-center gap-3 drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
        <span className="text-[#00cfff] drop-shadow-[0_0_5px_#00cfff]">⚙</span> Edit Profile
        <VerifiedBadge user={user} className="ml-2" />
      </h2>

      {message.text && (
        <div className={`p-4 rounded-xl mb-8 text-xs font-extrabold uppercase tracking-widest ${message.type === 'success' ? 'bg-green-900/20 text-green-400 border border-green-500/30 shadow-[0_0_10px_rgba(74,222,128,0.1)]' : 'bg-red-900/20 text-red-400 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.1)]'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-4 mb-10">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#00cfff]/30 group-hover:border-[#00cfff] transition-all duration-300 shadow-[0_0_20px_rgba(0,207,255,0.1)] group-hover:shadow-[0_0_25px_rgba(0,207,255,0.4)]">
              {previewAvatar ? (
                <img src={previewAvatar} alt="Preview" className="w-full h-full object-cover" />
              ) : avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#030308] flex items-center justify-center text-4xl font-extrabold text-[#00cfff]">
                  {user.username ? user.username.substring(0, 2).toUpperCase() : "U"}
                </div>
              )}
            </div>
            <div className="absolute inset-0 bg-[#030308]/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
              <span className="text-[#00cfff] text-[10px] font-extrabold uppercase tracking-widest drop-shadow-[0_0_5px_#00cfff]">CHANGE</span>
            </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            hidden 
            accept="image/*" 
            onChange={handleFileChange} 
          />
          <p className="text-[10px] font-bold text-[#00cfff]/50 uppercase tracking-widest">Click image to upload new avatar</p>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="relative">
            <label className="block text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest mb-2">USERNAME</label>
            <input
              type="text"
              value={user.username}
              onChange={(e) => setUser({ ...user, username: e.target.value })}
              className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl text-white p-3.5 font-mono focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] outline-none transition-all"
              required
            />
          </div>
          <div className="relative">
            <label className="block text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest mb-2">EMAIL</label>
            <input
              type="email"
              value={user.email}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
              className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl text-white p-3.5 font-mono focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] outline-none transition-all"
              required
            />
          </div>
        </div>
        
        <div className="relative">
          <label className="block text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest mb-2">FULL NAME</label>
          <input
            type="text"
            value={user.full_name || ""}
            onChange={(e) => setUser({ ...user, full_name: e.target.value })}
            className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl text-white p-3.5 font-mono focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] outline-none transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div ref={countryDropdownRef} className="relative">
            <label className="block text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest mb-2">COUNTRY CODE</label>
            <div 
              className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl text-white p-3.5 focus:outline-none focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] cursor-pointer flex justify-between items-center transition-all font-mono"
              onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
            >
              <span>{user.country_code || "+1"}</span>
              <span className="text-[10px] text-[#00cfff]">▼</span>
            </div>
            
            {isCountryDropdownOpen && (
              <div className="absolute top-full left-0 w-full bg-[#0a0f1c]/95 backdrop-blur-md border border-[#00cfff]/30 rounded-xl mt-2 z-50 max-h-60 overflow-y-auto shadow-[0_0_20px_rgba(0,207,255,0.15)] custom-scrollbar">
                <div className="p-3 sticky top-0 bg-[#0a0f1c] border-b border-[#00cfff]/20 z-10">
                  <input 
                    type="text" 
                    placeholder="SEARCH COUNTRY..." 
                    className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-lg px-3 py-2 text-[10px] font-extrabold uppercase tracking-widest text-white focus:outline-none focus:border-[#00cfff] focus:shadow-[0_0_10px_rgba(0,207,255,0.2)]"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                {filteredCountries.map((country, idx) => (
                  <div 
                    key={`${country.name}-${idx}`}
                    className="px-4 py-3 hover:bg-[#00cfff]/10 cursor-pointer text-xs font-mono text-gray-300 flex justify-between items-center transition-colors"
                    onClick={() => {
                      setUser({ ...user, country_code: country.code });
                      setIsCountryDropdownOpen(false);
                      setCountrySearch("");
                    }}
                  >
                    <span className="truncate mr-2 font-bold font-sans">{country.name}</span>
                    <span className="text-[#00cfff] whitespace-nowrap">{country.code}</span>
                  </div>
                ))}
                {filteredCountries.length === 0 && (
                  <div className="px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-[#00cfff]/50 text-center">NO RESULTS</div>
                )}
              </div>
            )}
          </div>
          <div className="relative">
            <label className="block text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest mb-2">WHATSAPP NUMBER</label>
            <input
              type="tel"
              value={user.phone_number || ""}
              onChange={(e) => setUser({ ...user, phone_number: e.target.value })}
              className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl text-white p-3.5 font-mono focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] outline-none transition-all"
            />
          </div>
        </div>

        <div className="relative">
          <label className="block text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest mb-2">NEW PASSWORD <span className="text-gray-500 lowercase ml-1">(optional)</span></label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="LEAVE BLANK TO KEEP CURRENT PASSWORD"
            className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl text-white p-3.5 font-mono focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] outline-none transition-all placeholder:text-gray-600 placeholder:text-[10px] placeholder:font-extrabold placeholder:tracking-widest"
          />
        </div>

        <div className="pt-6 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#00cfff] text-[#030308] hover:bg-[#00e5ff] px-8 py-3.5 rounded-xl font-extrabold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(0,207,255,0.4)] hover:shadow-[0_0_25px_rgba(0,207,255,0.6)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            {loading ? "SAVING..." : "SAVE CHANGES"}
          </button>
        </div>
      </form>
    </div>

    {/* YOUR COMMUNITIES SECTION */}
    <div className="bg-[#0a0f1c]/60 p-8 rounded-2xl border border-[#00cfff]/20 shadow-[0_0_20px_rgba(0,207,255,0.05)] backdrop-blur-md animate-fade-in">
        <h2 className="text-2xl font-extrabold text-white uppercase tracking-widest mb-8 border-b border-[#00cfff]/10 pb-4 flex items-center gap-3 drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
          <span className="text-[#00cfff] drop-shadow-[0_0_5px_#00cfff]">👥</span> Your Communities
        </h2>
        <MyCommunitiesList myCommunities={myCommunities} openEditModal={openEditModal} />
    </div>

    {/* Confirmation Modal */}
    {confirmModal.isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#030308]/90 backdrop-blur-md p-4 animate-fade-in">
        <div className="bg-[#0a0f1c]/95 border border-red-500/30 p-8 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.15)] max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
          <h3 className="text-xl font-extrabold text-white uppercase tracking-widest mb-3 flex flex-col items-center gap-3">
            <span className="text-4xl drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">⚠</span>
            Are you sure?
          </h3>
          <p className="text-gray-400 text-sm mb-8 font-medium">{confirmModal.message}</p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="px-6 py-2.5 rounded-xl bg-[#030308] border border-[#00cfff]/30 hover:bg-[#00cfff]/10 hover:border-[#00cfff]/50 text-[#00cfff] text-[11px] font-extrabold uppercase tracking-widest transition-all">Cancel</button>
            <button onClick={() => { confirmModal.onConfirm(); setConfirmModal({ ...confirmModal, isOpen: false }); }} className="px-6 py-2.5 rounded-xl bg-red-600/20 border border-red-500/50 hover:bg-red-600 hover:border-red-500 text-red-400 hover:text-white text-[11px] font-extrabold uppercase tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] transition-all">
              Confirm
            </button>
          </div>
        </div>
      </div>
    )}

    {/* EDIT COMMUNITY MODAL */}
    {editingComm && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030308]/90 backdrop-blur-md p-4" onClick={() => setEditingComm(null)}>
        <div className="bg-[#0a0f1c]/95 border border-[#00cfff]/30 p-8 rounded-2xl shadow-[0_0_30px_rgba(0,207,255,0.15)] max-w-2xl w-full animate-fade-in my-8 overflow-y-auto max-h-[90vh] custom-scrollbar" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-xl font-extrabold text-white mb-6 uppercase tracking-widest flex items-center gap-3 border-b border-[#00cfff]/10 pb-4">
            <span className="text-[#00cfff]">⚙</span> Edit: {editingComm.name}
          </h3>
          <div className="flex border-b border-[#00cfff]/20 mb-8">
            <button onClick={() => setActiveEditTab('appearance')} className={`px-6 py-3 text-[11px] font-extrabold uppercase tracking-widest transition-all ${activeEditTab === 'appearance' ? 'text-[#00cfff] border-b-2 border-[#00cfff] bg-[#00cfff]/5' : 'text-[#00cfff]/50 hover:text-[#00cfff] hover:bg-[#00cfff]/5'}`}>Appearance</button>
            <button onClick={() => setActiveEditTab('members')} className={`px-6 py-3 text-[11px] font-extrabold uppercase tracking-widest transition-all ${activeEditTab === 'members' ? 'text-[#00cfff] border-b-2 border-[#00cfff] bg-[#00cfff]/5' : 'text-[#00cfff]/50 hover:text-[#00cfff] hover:bg-[#00cfff]/5'}`}>Members <span className="ml-1 px-1.5 py-0.5 bg-[#00cfff]/20 text-[#00cfff] rounded-md font-mono">{myCommunities.find(c => c.id === editingComm.id)?.members_count || 0}</span></button>
          </div>

          {activeEditTab === 'appearance' ? (
            <form onSubmit={handleUpdateCommunity} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Basic Info */}
                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest mb-2">AVATAR <span className="lowercase text-gray-500 font-normal ml-1">(optional)</span></label>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-[#030308] overflow-hidden border border-[#00cfff]/30 shadow-[0_0_10px_rgba(0,207,255,0.1)]">
                      {previewEditCommAvatar ? <img src={previewEditCommAvatar} className="w-full h-full object-cover" alt="Preview" /> : <div className="w-full h-full flex items-center justify-center text-[#00cfff]/50 text-[10px] font-extrabold">NO IMG</div>}
                      </div>
                      <input type="file" accept="image/gif,image/png,image/jpeg,image/webp,image/*" onChange={(e) => {
                        const file = e.target.files[0];
                        if(file) { 
                          setRawCropFile(file);
                          setCropTarget("editCommAvatar");
                          e.target.value = null;
                        }
                      }} className="text-[10px] font-extrabold text-[#00cfff]/50 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[10px] file:font-extrabold file:uppercase file:tracking-widest file:bg-[#00cfff]/10 file:text-[#00cfff] hover:file:bg-[#00cfff]/20 cursor-pointer" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest mb-2">NAME</label>
                    <input type="text" value={editingComm.name} onChange={(e) => setEditingComm({...editingComm, name: e.target.value})} className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl text-white p-3 font-mono focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest mb-2">DESCRIPTION</label>
                    <textarea value={editingComm.description} onChange={(e) => setEditingComm({...editingComm, description: e.target.value})} className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl text-white p-3 font-sans h-28 resize-none focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] outline-none transition-all custom-scrollbar" />
                  </div>
                </div>

                {/* Right Column: Appearance */}
                <div className="space-y-5 md:border-l border-[#00cfff]/10 md:pl-8">
                  <h4 className="text-sm font-extrabold text-[#00cfff] uppercase tracking-widest mb-4">Aesthetics</h4>
                  
                  {/* Background Type */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest mb-2">BACKGROUND TYPE</label>
                    <select value={editingComm.bg_type} onChange={(e) => setEditingComm({...editingComm, bg_type: e.target.value})} className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl text-white p-3 text-xs font-extrabold uppercase tracking-widest focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] outline-none appearance-none cursor-pointer">
                      <option value="color">Solid Color</option>
                      <option value="gradient">Gradient</option>
                      <option value="image">Upload Image</option>
                    </select>
                  </div>

                  {/* Background Value */}
                  {editingComm.bg_type === 'image' ? (
                     <div>
                       <label className="block text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest mb-2">UPLOAD BACKGROUND</label>
                       <input type="file" accept="image/*" onChange={(e) => {
                          const file = e.target.files[0];
                          if(file) { setEditCommBgImage(file); setPreviewEditCommBg(URL.createObjectURL(file)); }
                       }} className="text-[10px] font-extrabold text-[#00cfff]/50 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[10px] file:font-extrabold file:uppercase file:tracking-widest file:bg-[#00cfff]/10 file:text-[#00cfff] hover:file:bg-[#00cfff]/20 cursor-pointer w-full" />
                     </div>
                  ) : (
                    <div className="animate-fade-in">
                      <label className="block text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest mb-2">
                        {editingComm.bg_type === 'color' ? 'COLOR HEX' : 'GRADIENT BUILDER'}
                      </label>
                      {editingComm.bg_type === 'gradient' ? (
                          <div className="space-y-4 p-4 bg-[#030308]/50 border border-[#00cfff]/20 rounded-xl">
                          <div className="flex gap-4">
                            <div className="flex-1">
                              <label className="text-[9px] text-[#00cfff]/50 font-extrabold uppercase tracking-widest block mb-1">START COLOR</label>
                              <div className="flex items-center gap-2 bg-[#030308] border border-[#00cfff]/30 rounded-lg p-1.5 focus-within:border-[#00cfff] focus-within:shadow-[0_0_10px_rgba(0,207,255,0.2)] transition-all">
                                <input type="color" value={editingComm.gradientStart || "#4facfe"} onChange={(e) => {
                                  const newVal = e.target.value;
                                  setEditingComm(prev => ({ ...prev, gradientStart: newVal, bg_value: `linear-gradient(${prev.gradientDir || "to right"}, ${newVal}, ${prev.gradientEnd || "#00f2fe"})` }));
                                }} className="h-6 w-6 bg-transparent border-0 cursor-pointer rounded overflow-hidden" />
                                <span className="text-xs text-gray-300 font-mono">{editingComm.gradientStart || "#4facfe"}</span>
                              </div>
                            </div>
                            <div className="flex-1">
                              <label className="text-[9px] text-[#00cfff]/50 font-extrabold uppercase tracking-widest block mb-1">END COLOR</label>
                              <div className="flex items-center gap-2 bg-[#030308] border border-[#00cfff]/30 rounded-lg p-1.5 focus-within:border-[#00cfff] focus-within:shadow-[0_0_10px_rgba(0,207,255,0.2)] transition-all">
                                <input type="color" value={editingComm.gradientEnd || "#00f2fe"} onChange={(e) => {
                                  const newVal = e.target.value;
                                  setEditingComm(prev => ({ ...prev, gradientEnd: newVal, bg_value: `linear-gradient(${prev.gradientDir || "to right"}, ${prev.gradientStart || "#4facfe"}, ${newVal})` }));
                                }} className="h-6 w-6 bg-transparent border-0 cursor-pointer rounded overflow-hidden" />
                                <span className="text-xs text-gray-300 font-mono">{editingComm.gradientEnd || "#00f2fe"}</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="text-[9px] text-[#00cfff]/50 font-extrabold uppercase tracking-widest block mb-1">DIRECTION</label>
                            <select value={editingComm.gradientDir || "to right"} onChange={(e) => {
                                const newVal = e.target.value;
                                setEditingComm(prev => ({ ...prev, gradientDir: newVal, bg_value: `linear-gradient(${newVal}, ${prev.gradientStart || "#4facfe"}, ${prev.gradientEnd || "#00f2fe"})` }));
                            }} className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-lg text-white p-2.5 text-xs font-extrabold uppercase tracking-widest appearance-none outline-none focus:border-[#00cfff]">
                              <option value="to right">To Right →</option>
                              <option value="to left">To Left ←</option>
                              <option value="to bottom">To Bottom ↓</option>
                              <option value="to top">To Top ↑</option>
                              <option value="45deg">Diagonal ↗</option>
                              <option value="135deg">Diagonal ↘</option>
                            </select>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 bg-[#030308] border border-[#00cfff]/30 rounded-xl p-2 w-full max-w-[120px] focus-within:border-[#00cfff] focus-within:shadow-[0_0_10px_rgba(0,207,255,0.2)] transition-all">
                            <input type="color" value={editingComm.bg_value} onChange={(e) => setEditingComm({...editingComm, bg_value: e.target.value})} className="h-8 w-8 bg-transparent border-0 cursor-pointer rounded overflow-hidden" />
                            <span className="text-xs font-mono text-gray-300">{editingComm.bg_value}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest mb-2">TEXT COLOR</label>
                      <div className="flex items-center gap-2 bg-[#030308] border border-[#00cfff]/30 rounded-xl p-2 focus-within:border-[#00cfff] focus-within:shadow-[0_0_10px_rgba(0,207,255,0.2)] transition-all">
                        <input type="color" value={editingComm.text_color} onChange={(e) => setEditingComm({...editingComm, text_color: e.target.value})} className="h-8 w-8 bg-transparent border-0 cursor-pointer rounded overflow-hidden" />
                        <span className="text-xs font-mono text-gray-300">{editingComm.text_color}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest mb-2">TYPOGRAPHY</label>
                      <select value={editingComm.font_family} onChange={(e) => setEditingComm({...editingComm, font_family: e.target.value})} className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl text-white p-3 text-xs font-extrabold uppercase tracking-widest appearance-none outline-none focus:border-[#00cfff]">
                        <option value="sans">Sans Serif</option>
                        <option value="serif">Serif</option>
                        <option value="mono">Monospace</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest mb-2">HOVER EFFECT</label>
                    <select value={editingComm.hover_animation} onChange={(e) => setEditingComm({...editingComm, hover_animation: e.target.value})} className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl text-white p-3 text-xs font-extrabold uppercase tracking-widest appearance-none outline-none focus:border-[#00cfff]">
                      <option value="none">Lift & Shadow</option>
                      <option value="scale">Scale Up</option>
                      <option value="glow">Neon Glow</option>
                    </select>
                  </div>
                  {editingComm.hover_animation === "glow" && (
                    <div className="animate-fade-in">
                      <label className="block text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest mb-2">GLOW COLOR</label>
                      <div className="flex items-center gap-2 bg-[#030308] border border-[#00cfff]/30 rounded-xl p-2 w-full max-w-[120px] focus-within:border-[#00cfff] focus-within:shadow-[0_0_10px_rgba(0,207,255,0.2)] transition-all">
                        <input type="color" value={editingComm.hover_color} onChange={(e) => setEditingComm({...editingComm, hover_color: e.target.value})} className="h-8 w-8 bg-transparent border-0 cursor-pointer rounded overflow-hidden" />
                        <span className="text-xs font-mono text-gray-300">{editingComm.hover_color}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Live Preview */}
              <div className="border-t border-[#00cfff]/10 pt-8 mt-4">
                <label className="block text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest mb-4 flex items-center justify-center gap-2"><span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> LIVE PREVIEW</label>
                <div 
                  style={{
                    color: editingComm.text_color,
                    fontFamily: editingComm.font_family === "serif" ? "serif" : editingComm.font_family === "mono" ? "monospace" : "sans-serif",
                    background: editingComm.bg_type === 'image' && previewEditCommBg ? `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${previewEditCommBg})` : editingComm.bg_value,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    "--glow-color": editingComm.hover_color,
                  }}
                  className={`rounded-2xl border border-white/20 p-8 relative overflow-hidden transition-all duration-300 w-full max-w-sm mx-auto shadow-2xl
                    ${editingComm.hover_animation === "scale" ? "hover:scale-105" : ""}
                    ${editingComm.hover_animation === "glow" ? "hover:shadow-[0_0_30px_var(--glow-color)] border-[var(--glow-color)]" : ""}
                    ${editingComm.hover_animation === "none" ? "hover:-translate-y-2 hover:shadow-[0_20px_30px_rgba(0,0,0,0.5)]" : ""}
                  `}>
                  <div className="flex items-center gap-4 mb-5">
                    {previewEditCommAvatar ? (
                      <img src={previewEditCommAvatar} className="w-14 h-14 rounded-full object-cover border-2 border-white/30 shadow-lg" alt="Preview" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-xl font-extrabold border-2 border-white/30 shadow-lg backdrop-blur-sm">
                        {editingComm.name ? editingComm.name.substring(0, 2).toUpperCase() : "NA"}
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-extrabold uppercase tracking-wide drop-shadow-md">{editingComm.name || "Community Name"}</h3>
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">BY YOU</p>
                    </div>
                  </div>
                  <p className="text-sm mb-8 opacity-90 font-medium leading-relaxed">{editingComm.description || "Community description will appear here. Make it catchy!"}</p>
                  <div className="flex items-center justify-between border-t border-white/20 pt-5 opacity-90">
                    <span className="text-xs font-bold font-mono bg-white/10 px-3 py-1 rounded-lg backdrop-blur-md">{myCommunities.find(c => c.id === editingComm.id)?.members_count || 1} MBRS</span>
                    <span className="text-xs font-extrabold uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">JOIN <span className="text-lg leading-none">→</span></span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-8">
                <button type="button" onClick={() => setEditingComm(null)} className="flex-1 bg-[#030308] border border-[#00cfff]/30 hover:bg-[#00cfff]/10 text-[#00cfff] hover:text-[#00e5ff] py-3.5 rounded-xl font-extrabold uppercase tracking-widest transition-all text-xs">CANCEL</button>
                <button type="submit" className="flex-1 bg-[#00cfff] text-[#030308] hover:bg-[#00e5ff] shadow-[0_0_15px_rgba(0,207,255,0.4)] hover:shadow-[0_0_25px_rgba(0,207,255,0.6)] hover:-translate-y-0.5 py-3.5 rounded-xl font-extrabold uppercase tracking-widest transition-all text-xs">SAVE CHANGES</button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-3 custom-scrollbar animate-fade-in">
              {membersLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                   <div className="w-8 h-8 border-4 border-[#00cfff]/20 border-t-[#00cfff] rounded-full animate-spin mb-4"></div>
                   <p className="text-[#00cfff] text-xs font-extrabold uppercase tracking-widest">Loading members...</p>
                </div>
              ) : commMembers.length > 0 ? commMembers.map(member => (
                <div key={member.user_id} className="flex items-center justify-between bg-[#030308]/60 p-4 rounded-xl border border-[#00cfff]/10 hover:border-[#00cfff]/30 hover:bg-[#00cfff]/5 transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center gap-4">
                    {member.avatar_url ? (
                      <img src={`${API_BASE_URL}${member.avatar_url}`} alt={member.username} className="w-10 h-10 rounded-full object-cover border border-[#00cfff]/30 shadow-[0_0_10px_rgba(0,207,255,0.1)]" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#00cfff]/10 border border-[#00cfff]/30 flex items-center justify-center text-sm font-extrabold text-[#00cfff] shadow-[0_0_10px_rgba(0,207,255,0.1)]">{member.username.substring(0,2).toUpperCase()}</div>
                    )}
                    <div>
                      <p className="text-sm font-extrabold text-white tracking-wide">{member.username}</p>
                      <p className="text-[10px] text-[#00cfff]/50 font-bold uppercase tracking-widest font-mono">Joined: {new Date(member.joined_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {editingComm.creator_username === member.username ? (
                    <span className="text-[10px] font-extrabold text-[#00cfff] uppercase tracking-widest bg-[#00cfff]/10 px-3 py-1 rounded-md border border-[#00cfff]/30 shadow-[0_0_10px_rgba(0,207,255,0.2)]">CREATOR</span>
                  ) : (
                    <button onClick={() => handleKickMember(member.username)} className="text-[10px] font-extrabold uppercase tracking-widest bg-red-900/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 hover:border-red-500 hover:text-red-300 px-4 py-2 rounded-lg transition-all shadow-[0_0_10px_rgba(239,68,68,0.1)]">KICK</button>
                  )}
                </div>
              )) : (
                 <p className="text-[#00cfff]/50 text-center py-6 font-extrabold uppercase tracking-widest text-[10px]">No members found.</p>
              )}
            </div>
          )}
        </div>
      </div>
    )}

    {/* Crop Modal for both User Avatar and Edit Community Avatar */}
    {cropTarget === "userAvatar" && rawCropFile && (
      <ImageCropModal 
        file={rawCropFile} 
        onApply={(croppedBlob, previewUrl) => {
          setAvatarFile(croppedBlob);
          setPreviewAvatar(previewUrl);
          setCropTarget(null);
          setRawCropFile(null);
        }} 
        onCancel={() => {
          setCropTarget(null);
          setRawCropFile(null);
        }} 
      />
    )}

    {cropTarget === "editCommAvatar" && rawCropFile && (
      <ImageCropModal 
        file={rawCropFile} 
        onApply={(croppedBlob, previewUrl) => {
          setEditCommAvatar(croppedBlob);
          setPreviewEditCommAvatar(previewUrl);
          setCropTarget(null);
          setRawCropFile(null);
        }} 
        onCancel={() => {
          setCropTarget(null);
          setRawCropFile(null);
        }} 
      />
    )}
    </div>
  );
};

export default Profile;
