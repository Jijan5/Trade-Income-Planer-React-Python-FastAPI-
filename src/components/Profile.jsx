import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import api from "../lib/axios";
import { useAuth } from "../contexts/AuthContext";
import VerifiedBadge from "./VerifiedBadge";
import { countryCodes } from "../utils/countryCodes";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// Memoized Community List
const MyCommunitiesList = React.memo(({ myCommunities, openEditModal }) => {
  if (myCommunities.length === 0) {
    return <p className="text-gray-500 text-center py-4">You haven't created any communities yet.</p>;
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {myCommunities.map(comm => (
        <div key={comm.id} className="bg-gray-900 border border-gray-700 p-4 rounded-lg flex justify-between items-center">
          <div className="flex items-center gap-3">
          {comm.avatar_url ? <img src={`${API_BASE_URL}${comm.avatar_url}`} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold text-xs">{comm.name.substring(0,2).toUpperCase()}</div>}
          <div>
              <h4 className="font-bold text-white text-sm">{comm.name}</h4>
              <p className="text-xs text-gray-500">{comm.members_count} Members</p>
            </div>
          </div>
          <button onClick={() => openEditModal(comm)} className="text-xs bg-gray-700 hover:bg-blue-600 text-white px-3 py-1.5 rounded transition-colors">Edit</button>
        </div>
      ))}
    </div>
  );
});

const Profile = ({ showFlash }) => {
  const { fetchUserProfile } = useAuth();
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

  // My Communities State
  const [myCommunities, setMyCommunities] = useState([]);
  const [editingComm, setEditingComm] = useState(null); // If not null, show edit modal

  // Edit Community Modal State
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
      setAvatarFile(file);
      setPreviewAvatar(URL.createObjectURL(file));
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
    if (!window.confirm(`Are you sure you want to kick ${usernameToKick} from the community?`)) return;

    const token = localStorage.getItem("token");
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
  };

  const filteredCountries = useMemo(() => countryCodes.filter(c => 
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) || 
    c.code.includes(countrySearch)
  ), [countrySearch]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* PROFILE EDIT SECTION */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 shadow-xl animate-fade-in">
      <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-700 pb-4 flex items-center">
        Edit Profile
        <VerifiedBadge user={user} className="ml-2" />
      </h2>

      {message.text && (
        <div className={`p-4 rounded mb-6 text-sm font-bold ${message.type === 'success' ? 'bg-green-900/50 text-green-400 border border-green-500/50' : 'bg-red-900/50 text-red-400 border border-red-500/50'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-700 group-hover:border-blue-500 transition-colors">
              {previewAvatar ? (
                <img src={previewAvatar} alt="Preview" className="w-full h-full object-cover" />
              ) : user.avatar_url ? (
                <img src={`${API_BASE_URL}${user.avatar_url}`} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-600 flex items-center justify-center text-4xl font-bold text-gray-400">
                  {user.username ? user.username.substring(0, 2).toUpperCase() : "U"}
                </div>
              )}
            </div>
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-xs font-bold">Change Photo</span>
            </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            hidden 
            accept="image/*" 
            onChange={handleFileChange} 
          />
          <p className="text-xs text-gray-500">Click image to upload new avatar</p>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Username</label>
            <input
              type="text"
              value={user.username}
              onChange={(e) => setUser({ ...user, username: e.target.value })}
              className="w-full bg-gray-900 border border-gray-600 rounded text-white p-3 focus:border-blue-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Email</label>
            <input
              type="email"
              value={user.email}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
              className="w-full bg-gray-900 border border-gray-600 rounded text-white p-3 focus:border-blue-500 outline-none"
              required
            />
          </div>
        </div>
        
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Full Name</label>
          <input
            type="text"
            value={user.full_name || ""}
            onChange={(e) => setUser({ ...user, full_name: e.target.value })}
            className="w-full bg-gray-900 border border-gray-600 rounded text-white p-3 focus:border-blue-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div ref={countryDropdownRef} className="relative">
            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Country Code</label>
            <div 
              className="w-full bg-gray-900 border border-gray-600 rounded text-white p-3 focus:outline-none focus:border-blue-500 cursor-pointer flex justify-between items-center"
              onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
            >
              <span>{user.country_code || "+1"}</span>
              <span className="text-xs text-gray-500">▼</span>
            </div>
            
            {isCountryDropdownOpen && (
              <div className="absolute top-full left-0 w-full bg-gray-800 border border-gray-600 rounded mt-1 z-50 max-h-60 overflow-y-auto shadow-xl">
                <div className="p-2 sticky top-0 bg-gray-800 border-b border-gray-700">
                  <input 
                    type="text" 
                    placeholder="Search country..." 
                    className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                {filteredCountries.map((country, idx) => (
                  <div 
                    key={`${country.name}-${idx}`}
                    className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-sm text-gray-300 flex justify-between items-center"
                    onClick={() => {
                      setUser({ ...user, country_code: country.code });
                      setIsCountryDropdownOpen(false);
                      setCountrySearch("");
                    }}
                  >
                    <span className="truncate mr-2">{country.name}</span>
                    <span className="text-gray-500 whitespace-nowrap">{country.code}</span>
                  </div>
                ))}
                {filteredCountries.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500 text-center">No results</div>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">WhatsApp Number</label>
            <input
              type="tel"
              value={user.phone_number || ""}
              onChange={(e) => setUser({ ...user, phone_number: e.target.value })}
              className="w-full bg-gray-900 border border-gray-600 rounded text-white p-3 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">New Password (Optional)</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave blank to keep current password"
            className="w-full bg-gray-900 border border-gray-600 rounded text-white p-3 focus:border-blue-500 outline-none"
          />
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>

    {/* YOUR COMMUNITIES SECTION */}
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 shadow-xl animate-fade-in">
        <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-700 pb-4 flex items-center gap-2">
          <span className="text-blue-500">👥</span> Your Communities
        </h2>
        <MyCommunitiesList myCommunities={myCommunities} openEditModal={openEditModal} />
    </div>

    {/* EDIT COMMUNITY MODAL */}
    {editingComm && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setEditingComm(null)}>
        <div className="bg-gray-800 border border-gray-600 p-6 rounded-xl shadow-2xl max-w-2xl w-full animate-fade-in my-8 overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-xl font-bold text-white mb-4">Edit Community: {editingComm.name}</h3>
          <div className="flex border-b border-gray-700 mb-6">
            <button onClick={() => setActiveEditTab('appearance')} className={`px-4 py-2 text-sm font-bold ${activeEditTab === 'appearance' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400'}`}>Appearance</button>
            <button onClick={() => setActiveEditTab('members')} className={`px-4 py-2 text-sm font-bold ${activeEditTab === 'members' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400'}`}>Members ({myCommunities.find(c => c.id === editingComm.id)?.members_count || 0})</button>
          </div>

          {activeEditTab === 'appearance' ? (
            <form onSubmit={handleUpdateCommunity} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Avatar (Optional)</label>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden border border-gray-600">
                      {previewEditCommAvatar ? <img src={previewEditCommAvatar} className="w-full h-full object-cover" alt="Preview" /> : <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">No Img</div>}
                      </div>
                      <input type="file" accept="image/*" onChange={(e) => {
                        const file = e.target.files[0];
                        if(file) { setEditCommAvatar(file); setPreviewEditCommAvatar(URL.createObjectURL(file)); }
                      }} className="text-xs text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Name</label>
                    <input type="text" value={editingComm.name} onChange={(e) => setEditingComm({...editingComm, name: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded text-white p-2 focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Description</label>
                    <textarea value={editingComm.description} onChange={(e) => setEditingComm({...editingComm, description: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded text-white p-2 h-24 resize-none focus:border-blue-500 outline-none" />
                  </div>
                </div>

                {/* Right Column: Appearance */}
                <div className="space-y-4 border-l border-gray-700 pl-6">
                  <h4 className="text-sm font-bold text-blue-400 uppercase">Appearance</h4>
                  
                  {/* Background Type */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Background Type</label>
                    <select value={editingComm.bg_type} onChange={(e) => setEditingComm({...editingComm, bg_type: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded text-white p-2 text-sm">
                      <option value="color">Solid Color</option>
                      <option value="gradient">Gradient</option>
                      <option value="image">Upload Image</option>
                    </select>
                  </div>

                  {/* Background Value */}
                  {editingComm.bg_type === 'image' ? (
                     <div>
                       <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Upload Background</label>
                       <input type="file" accept="image/*" onChange={(e) => {
                          const file = e.target.files[0];
                          if(file) { setEditCommBgImage(file); setPreviewEditCommBg(URL.createObjectURL(file)); }
                       }} className="text-xs text-gray-400 w-full" />
                     </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">
                        {editingComm.bg_type === 'color' ? 'Color Hex' : 'Gradient CSS'}
                      </label>
                      {editingComm.bg_type === 'gradient' ? (
                          <div className="space-y-2">
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <label className="text-[10px] text-gray-500 uppercase">Start Color</label>
                              <div className="flex items-center gap-2 bg-gray-900 border border-gray-600 rounded p-1">
                                <input type="color" value={editingComm.gradientStart || "#4facfe"} onChange={(e) => {
                                  const newVal = e.target.value;
                                  setEditingComm(prev => ({ ...prev, gradientStart: newVal, bg_value: `linear-gradient(${prev.gradientDir || "to right"}, ${newVal}, ${prev.gradientEnd || "#00f2fe"})` }));
                                }} className="h-6 w-6 bg-transparent border-0 cursor-pointer" />
                                <span className="text-xs text-gray-400">{editingComm.gradientStart || "#4facfe"}</span>
                              </div>
                            </div>
                            <div className="flex-1">
                              <label className="text-[10px] text-gray-500 uppercase">End Color</label>
                              <div className="flex items-center gap-2 bg-gray-900 border border-gray-600 rounded p-1">
                                <input type="color" value={editingComm.gradientEnd || "#00f2fe"} onChange={(e) => {
                                  const newVal = e.target.value;
                                  setEditingComm(prev => ({ ...prev, gradientEnd: newVal, bg_value: `linear-gradient(${prev.gradientDir || "to right"}, ${prev.gradientStart || "#4facfe"}, ${newVal})` }));
                                }} className="h-6 w-6 bg-transparent border-0 cursor-pointer" />
                                <span className="text-xs text-gray-400">{editingComm.gradientEnd || "#00f2fe"}</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-500 uppercase">Direction</label>
                            <select value={editingComm.gradientDir || "to right"} onChange={(e) => {
                                const newVal = e.target.value;
                                setEditingComm(prev => ({ ...prev, gradientDir: newVal, bg_value: `linear-gradient(${newVal}, ${prev.gradientStart || "#4facfe"}, ${prev.gradientEnd || "#00f2fe"})` }));
                            }} className="w-full bg-gray-900 border border-gray-600 rounded text-white p-1 text-xs">
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
                        <div className="flex gap-2">
                          <input type="color" value={editingComm.bg_value} onChange={(e) => setEditingComm({...editingComm, bg_value: e.target.value})} className="bg-gray-900 border border-gray-600 rounded text-white p-1 h-9 w-16" />
                        </div>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Text Color</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={editingComm.text_color} onChange={(e) => setEditingComm({...editingComm, text_color: e.target.value})} className="h-8 w-8 bg-transparent border-0 cursor-pointer" />
                        <span className="text-xs text-gray-400">{editingComm.text_color}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Font</label>
                      <select value={editingComm.font_family} onChange={(e) => setEditingComm({...editingComm, font_family: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded text-white p-1 text-xs">
                        <option value="sans">Sans Serif</option>
                        <option value="serif">Serif</option>
                        <option value="mono">Monospace</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Hover Animation</label>
                    <select value={editingComm.hover_animation} onChange={(e) => setEditingComm({...editingComm, hover_animation: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded text-white p-2 text-sm">
                      <option value="none">None (Lift)</option>
                      <option value="scale">Scale Up</option>
                      <option value="glow">Glow</option>
                    </select>
                  </div>
                  {editingComm.hover_animation === "glow" && (
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Glow Color</label>
                      <div className="flex items-center gap-2 bg-gray-900 border border-gray-600 rounded p-1">
                        <input type="color" value={editingComm.hover_color} onChange={(e) => setEditingComm({...editingComm, hover_color: e.target.value})} className="h-6 w-6 bg-transparent border-0 cursor-pointer" />
                        <span className="text-xs text-gray-400">{editingComm.hover_color}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Live Preview */}
              <div className="border-t border-gray-700 pt-4">
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Live Preview</label>
                <div 
                  style={{
                    color: editingComm.text_color,
                    fontFamily: editingComm.font_family === "serif" ? "serif" : editingComm.font_family === "mono" ? "monospace" : "sans-serif",
                    background: editingComm.bg_type === 'image' && previewEditCommBg ? `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${previewEditCommBg})` : editingComm.bg_value,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    "--glow-color": editingComm.hover_color,
                  }}
                  className={`rounded-xl border border-gray-600 p-6 relative overflow-hidden transition-all duration-300 w-full max-w-sm mx-auto
                    ${editingComm.hover_animation === "scale" ? "hover:scale-105" : ""}
                    ${editingComm.hover_animation === "glow" ? "hover:shadow-[0_0_20px_var(--glow-color)]" : "hover:shadow-xl"}
                    ${editingComm.hover_animation === "none" ? "hover:-translate-y-1" : ""}
                  `}>
                  <div className="flex items-center gap-3 mb-4">
                    {previewEditCommAvatar ? (
                      <img src={previewEditCommAvatar} className="w-12 h-12 rounded-full object-cover border-2 border-white/20" alt="Preview" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-xl font-bold border-2 border-white/20">
                        {editingComm.name ? editingComm.name.substring(0, 2).toUpperCase() : "NA"}
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-bold">{editingComm.name || "Community Name"}</h3>
                      <p className="text-xs opacity-70">by You</p>
                    </div>
                  </div>
                  <p className="text-sm mb-6 opacity-80">{editingComm.description || "Community description will appear here..."}</p>
                  <div className="flex items-center justify-between border-t border-white/10 pt-4 opacity-80">
                    <span className="text-sm">{myCommunities.find(c => c.id === editingComm.id)?.members_count || 1} Members</span>
                    <span className="text-sm font-bold">Join Group →</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditingComm(null)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded font-bold">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded font-bold">Save Changes</button>
              </div>
            </form>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {membersLoading ? (
                <p className="text-gray-400 text-center">Loading members...</p>
              ) : commMembers.map(member => (
                <div key={member.user_id} className="flex items-center justify-between bg-gray-900 p-3 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-3">
                    {member.avatar_url ? (
                      <img src={`${API_BASE_URL}${member.avatar_url}`} alt={member.username} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">{member.username.substring(0,2).toUpperCase()}</div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-white">{member.username}</p>
                      <p className="text-xs text-gray-500">Joined: {new Date(member.joined_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {editingComm.creator_username === member.username ? (
                    <span className="text-xs font-bold text-blue-400">Creator</span>
                  ) : (
                    <button onClick={() => handleKickMember(member.username)} className="text-xs bg-red-600/20 hover:bg-red-500 text-red-400 px-3 py-1 rounded">Kick</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )}
    </div>
  );
};

export default Profile;
