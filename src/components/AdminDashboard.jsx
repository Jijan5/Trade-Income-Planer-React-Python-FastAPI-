import React, { useState, useEffect, useCallback } from "react";
import api from "../lib/axios";
import { useAuth } from "../contexts/AuthContext";
import ContactMessages from "./ContactMessages";
import { LayoutDashboard, Users, CreditCard, FileText, Flag, MessageSquare, Mail, Megaphone, Scale, TriangleAlert, X, Check } from "lucide-react";

const AdminDashboard = () => {
  const { userData } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [searchUsers, setSearchUsers] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit User State
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [flash, setFlash] = useState(null);
  const [reports, setReports] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [posts, setPosts] = useState([]);
  const [searchContent, setSearchContent] = useState("");
  const [searchFeedback, setSearchFeedback] = useState("");

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    message: "",
    onConfirm: null,
    type: "danger",
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [rejectModal, setRejectModal] = useState({ isOpen: false, user: null, reason: "" });

  const fetchStats = async () => {
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const fetchReports = async () => {
    try {
      const res = await api.get("/admin/reports");
      setReports(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      const res = await api.get("/admin/feedbacks");
      setFeedbacks(res.data);
    } catch (e) {
      // Fallback to local storage if API fails
      const local = JSON.parse(localStorage.getItem("local_feedbacks") || "[]");
      setFeedbacks(local);
    }
  };

  const fetchAllPosts = async () => {
    try {
      const res = await api.get("/posts?limit=50");
      setPosts(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (activeTab === "reports") fetchReports();
    if (activeTab === "feedbacks") fetchFeedbacks();
    if (activeTab === "content") fetchAllPosts();
    let interval;
    if (activeTab === "appeals") {
      fetchUsers();
      interval = setInterval(fetchUsers, 3000);
    }
    return () => clearInterval(interval);
  }, [activeTab]);

  const filteredUsers = useCallback(() => {
    const search = searchUsers.toLowerCase();
    return users.filter(
      (user) =>
        user.username.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search)
    );
  }, [users, searchUsers]);

  const showFlash = (message, type = "success") => {
    setFlash({ message, type });
    setTimeout(() => setFlash(null), 3000);
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    try {
      await api.post("/admin/broadcast", { message: broadcastMessage });
      showFlash("Broadcast sent successfully!", "success");
      setBroadcastMessage("");
    } catch (e) {
      showFlash("Failed to send broadcast.", "error");
    }
  };

  const handleDeletePost = async (postId) => {
    const executeDelete = async () => {
      try {
        await api.delete(`/posts/${postId}`);
        setPosts(posts.filter((p) => p.id !== postId));
        showFlash("Post deleted.", "success");
        fetchReports();
      } catch (e) {
        showFlash("Failed to delete post.", "error");
      }
    };
    setConfirmModal({
      isOpen: true,
      message:
        "Are you sure you want to delete this post? This action cannot be undone.",
      onConfirm: executeDelete,
      type: "danger",
    });
  };

  const handleDismissReport = async (reportId) => {
    try {
      await api.delete(`/admin/reports/${reportId}`);
      setReports(reports.filter((r) => r.id !== reportId));
      fetchReports();
      showFlash("Report dismissed.", "success");
    } catch (e) {
      showFlash("Failed to dismiss report.", "error");
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditFormData({
      username: user.username,
      email: user.email,
      role: user.role,
      plan: user.plan,
      status: user.status,
      full_name: user.full_name || "",
      country_code: user.country_code || "",
      phone_number: user.phone_number || "",
      plan_billing_cycle: user.plan_billing_cycle || "",
      plan_expires_at: user.plan_expires_at
        ? user.plan_expires_at.split("T")[0]
        : "",
      suspension_reason_preset: [
        "Spamming",
        "Inappropriate Content",
        "Hate Speech",
      ].includes(user.suspension_reason)
        ? user.suspension_reason
        : "other",
      suspension_reason_other: [
        "Spamming",
        "Inappropriate Content",
        "Hate Speech",
      ].includes(user.suspension_reason)
        ? ""
        : user.suspension_reason || "",
      suspension_duration_days: 0,
      suspension_duration_hours: 0,
    });
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...editFormData };
      // Ensure date is in ISO format if present
      if (payload.plan_expires_at) {
        payload.plan_expires_at = new Date(
          payload.plan_expires_at
        ).toISOString();
      } else {
        payload.plan_expires_at = null;
      }

      if (payload.status === "suspended") {
        const days = parseInt(payload.suspension_duration_days || 0);
        const hours = parseInt(payload.suspension_duration_hours || 0);

        if (days > 0 || hours > 0) {
          const suspendedUntil = new Date();
          suspendedUntil.setDate(suspendedUntil.getDate() + days);
          suspendedUntil.setHours(suspendedUntil.getHours() + hours);
          payload.suspended_until = suspendedUntil.toISOString();
        } else {
          payload.suspended_until = null; // Indefinite
        }

        payload.suspension_reason =
          payload.suspension_reason_preset === "other"
            ? payload.suspension_reason_other
            : payload.suspension_reason_preset;
      }

      delete payload.suspension_reason_preset;
      delete payload.suspension_reason_other;
      delete payload.suspension_duration_days;
      delete payload.suspension_duration_hours;

      await api.put(`/admin/users/${editingUser.id}`, payload);
      setEditingUser(null);
      fetchUsers();
      fetchStats(); // Refresh stats as plan might change
      showFlash("User updated successfully", "success");
    } catch (e) {
      showFlash("Failed to update user", "error");
    }
  };

  const handleDeleteUser = async (userId) => {
    setConfirmModal({
      isOpen: true,
      message:
        "Are you sure you want to delete this user? This will permanently remove their account and all associated data.",
      type: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/admin/users/${userId}`);
          setUsers(users.filter((u) => u.id !== userId));
          showFlash("User deleted successfully.", "success");
          fetchStats();
        } catch (e) {
          showFlash(
            e.response?.data?.detail ||
              "Failed to delete user. Check database constraints.",
            "error"
          );
        }
      },
    });
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "users", label: "User Management", icon: <Users className="w-4 h-4" /> },
    { id: "subscriptions", label: "Subscriptions", icon: <CreditCard className="w-4 h-4" /> },
    { id: "content", label: "Content Moderation", icon: <FileText className="w-4 h-4" /> },
    { id: "reports", label: "Reports", icon: <Flag className="w-4 h-4" /> },
    { id: "feedbacks", label: "Feedbacks", icon: <MessageSquare className="w-4 h-4" /> },
    { id: "contactMessages", label: "Contact Messages", icon: <Mail className="w-4 h-4" /> },
    { id: "broadcast", label: "Broadcast", icon: <Megaphone className="w-4 h-4" /> },
    { id: "appeals", label: "Appeals", icon: <Scale className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Custom Flash Notification */}
      {flash && (
        <div
          className={`fixed top-24 right-6 z-50 px-6 py-4 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.5)] border flex items-center gap-3 animate-fade-in backdrop-blur-md ${
            flash.type === "success"
              ? "bg-[#030308]/90 border-green-500/50 text-green-400 shadow-[0_0_15px_rgba(74,222,128,0.2)]"
              : "bg-[#030308]/90 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
          }`}
        >
          <span className="text-2xl drop-shadow-[0_0_5px_currentColor]">
            {flash.type === "success" ? "✔" : "✖"}
          </span>
          <div>
            <h4 className="font-extrabold text-[10px] uppercase tracking-widest">{flash.type}</h4>
            <p className="text-[11px] text-gray-300 font-medium">{flash.message}</p>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#030308]/90 backdrop-blur-md p-4 animate-fade-in">
          <div className={`bg-[#0a0f1c]/95 border p-8 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] max-w-sm w-full text-center ${confirmModal.type === 'success' ? 'border-green-500/30' : 'border-red-500/30'}`}>
            <h3
              className={`text-xl font-extrabold mb-4 uppercase tracking-widest flex flex-col items-center gap-3 ${
                confirmModal.type === "success"
                  ? "text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]"
                  : "text-red-400 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]"
              }`}
            >
              <span className="text-4xl">{confirmModal.type === "success" ? "✔" : "⚠"}</span>
              {confirmModal.type === "success"
                ? "CONFIRM ACTION"
                : "ARE YOU SURE?"}
            </h3>
            <p className="text-gray-400 text-sm mb-8 font-medium">{confirmModal.message}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() =>
                  setConfirmModal({ ...confirmModal, isOpen: false })
                }
                className="px-6 py-2.5 rounded-xl bg-[#030308] border border-[#00cfff]/30 hover:bg-[#00cfff]/10 text-[#00cfff] text-[11px] font-extrabold uppercase tracking-widest transition-all"
              >
                CANCEL
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal({ ...confirmModal, isOpen: false });
                }}
                className={`px-6 py-2.5 rounded-xl text-[11px] font-extrabold uppercase tracking-widest transition-all ${
                  confirmModal.type === "success"
                    ? "bg-green-600/20 text-green-400 border border-green-500/50 hover:bg-green-600 hover:text-white shadow-[0_0_15px_rgba(74,222,128,0.2)] hover:shadow-[0_0_25px_rgba(74,222,128,0.5)]"
                    : "bg-red-600/20 text-red-400 border border-red-500/50 hover:bg-red-600 hover:text-white shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)]"
                }`}
              >
                CONFIRM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Appeal Modal */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#030308]/90 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-[#0a0f1c]/95 border border-red-500/30 p-8 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.2)] max-w-sm w-full text-center">
            <h3 className="text-xl font-extrabold mb-4 uppercase tracking-widest flex flex-col items-center gap-3 text-red-400 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]">
              <span className="text-4xl">⚠</span>
              REJECT APPEAL
            </h3>
            <p className="text-gray-400 text-sm mb-4 font-medium">Please enter a reason for rejecting the appeal:</p>
            <input 
              type="text" 
              value={rejectModal.reason} 
              onChange={(e) => setRejectModal({...rejectModal, reason: e.target.value})} 
              className="w-full bg-[#030308] border border-red-500/30 rounded-xl px-4 py-3 text-white text-xs font-mono focus:border-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.2)] outline-none transition-all mb-8"
              placeholder="Rejection reason..."
              autoFocus
            />
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setRejectModal({ isOpen: false, user: null, reason: "" })}
                className="px-6 py-2.5 rounded-xl bg-[#030308] border border-[#00cfff]/30 hover:bg-[#00cfff]/10 text-[#00cfff] text-[11px] font-extrabold uppercase tracking-widest transition-all"
              >
                CANCEL
              </button>
              <button
                onClick={async () => {
                  if (!rejectModal.reason.trim()) { showFlash("Reason is required.", "error"); return; }
                  try {
                    const u = rejectModal.user;
                    const payload = { ...u, appeal_status: "rejected", appeal_response: rejectModal.reason };
                    delete payload.id; delete payload.created_at; delete payload.updated_at; delete payload.hashed_password; delete payload.avatar_url; delete payload.reset_token; delete payload.reset_token_expires;
                    await api.put(`/admin/users/${u.id}`, payload);
                    fetchUsers();
                    showFlash("Appeal rejected.", "success");
                    setRejectModal({ isOpen: false, user: null, reason: "" });
                  } catch (e) {
                    showFlash("Failed to reject appeal.", "error");
                  }
                }}
                className="px-6 py-2.5 rounded-xl text-[11px] font-extrabold uppercase tracking-widest transition-all bg-red-600/20 text-red-400 border border-red-500/50 hover:bg-red-600 hover:text-white shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)]"
              >
                REJECT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR - SCROLLABLE */}
      <div className="w-full md:w-64 bg-[#0a0f1c]/60 rounded-2xl border border-[#00cfff]/20 md:h-[calc(100vh-9rem)] overflow-y-auto sticky top-24 flex-shrink-0 shadow-[0_0_20px_rgba(0,207,255,0.05)] backdrop-blur-md z-20 custom-scrollbar">
        <div className="p-6 border-b border-[#00cfff]/10 bg-[#030308]/60 sticky top-0 z-10 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-extrabold text-white uppercase tracking-widest drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">Admin Panel</h2>
            <p className="text-[10px] text-[#00cfff]/70 uppercase tracking-widest mt-1 font-bold">
              SYS_ADMIN: {userData?.username}
            </p>
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden text-[#00cfff]/50 hover:text-[#00cfff] p-2 rounded-lg hover:bg-[#00cfff]/10 focus:outline-none transition-all"
          >
            {isSidebarOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>
        <nav className={`p-3 space-y-1 ${isSidebarOpen ? "block" : "hidden"} md:block`}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl text-[11px] font-extrabold uppercase tracking-widest transition-all ${
                activeTab === item.id
                  ? "bg-[#00cfff]/10 text-[#00cfff] border border-[#00cfff]/30 shadow-[0_0_15px_rgba(0,207,255,0.2)]"
                  : "text-[#00cfff]/50 hover:bg-[#00cfff]/5 hover:text-[#00cfff] border border-transparent"
              }`}
            >
              <span className="text-lg drop-shadow-[0_0_3px_currentColor]">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 bg-[#0a0f1c]/60 backdrop-blur-md rounded-2xl border border-[#00cfff]/20 p-8 min-h-[500px] shadow-[0_0_20px_rgba(0,207,255,0.05)] overflow-hidden">
        {activeTab === "dashboard" && stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
            <div className="bg-[#030308]/60 p-6 rounded-2xl border border-[#00cfff]/10 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
              <h3 className="text-[#00cfff]/50 text-[10px] uppercase font-extrabold tracking-widest mb-3">
                TOTAL USERS
              </h3>
              <p className="text-4xl font-mono font-bold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
                {stats.totalUsers}
              </p>
            </div>
            <div className="bg-[#030308]/60 p-6 rounded-2xl border border-[#00cfff]/10 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
              <h3 className="text-[#00cfff]/50 text-[10px] uppercase font-extrabold tracking-widest mb-3">
                ACTIVE SUBS
              </h3>
              <p className="text-4xl font-mono font-bold text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">
                {stats.activeSubs}
              </p>
            </div>
            <div className="bg-[#030308]/60 p-6 rounded-2xl border border-[#00cfff]/10 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
              <h3 className="text-[#00cfff]/50 text-[10px] uppercase font-extrabold tracking-widest mb-3">
                EST. MRR
              </h3>
              <p className="text-4xl font-mono font-bold text-[#00cfff] drop-shadow-[0_0_5px_#00cfff]">
                ${stats.mrr}
              </p>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="overflow-x-auto animate-fade-in custom-scrollbar">
            <input
              type="text"
              placeholder="SEARCH USERS..."
              onChange={(e) => setSearchUsers(e.target.value)}
              className="mb-6 bg-[#030308] border border-[#00cfff]/30 text-white px-5 py-3 rounded-xl focus:outline-none focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] w-full font-mono text-xs placeholder:text-[#00cfff]/30 uppercase tracking-widest transition-all"
            />
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-[#030308] text-[#00cfff] text-[10px] uppercase font-extrabold tracking-widest border-b border-[#00cfff]/20">
                <tr>
                  <th className="p-4 rounded-tl-xl">USER</th>
                  <th className="p-4">PLAN</th>
                  <th className="p-4">STATUS</th>
                  <th className="p-4 rounded-tr-xl">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#00cfff]/10">
                {filteredUsers().map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-[#00cfff]/5 transition-colors group"
                  >
                    <td className="p-4">
                      <div className="font-extrabold text-white text-sm">{u.username}</div>
                      <div className="text-[11px] text-[#00cfff]/70 font-mono mt-0.5">{u.email}</div>
                      {u.full_name && (
                        <div className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">
                          {u.full_name}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-widest border ${
                          u.plan === "Platinum"
                            ? "bg-purple-900/20 text-purple-400 border-purple-500/30"
                            : u.plan === "Premium"
                            ? "bg-blue-900/20 text-[#00cfff] border-[#00cfff]/30"
                            : "bg-[#030308] text-gray-400 border-gray-700"
                        }`}
                      >
                        {u.plan}
                      </span>
                      {u.plan_billing_cycle && (
                        <div className="text-[9px] text-[#00cfff]/50 font-bold uppercase tracking-widest mt-2">
                          {u.plan_billing_cycle}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-md text-[9px] font-extrabold uppercase tracking-widest border ${
                          u.status === "active"
                            ? "bg-green-900/20 text-green-400 border-green-500/30 shadow-[0_0_5px_rgba(74,222,128,0.2)]"
                            : "bg-red-900/20 text-red-400 border-red-500/30 shadow-[0_0_5px_rgba(239,68,68,0.2)]"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-3 opacity-50 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditUser(u)}
                          className="text-[#00cfff] hover:text-white font-extrabold text-[10px] uppercase tracking-widest border border-[#00cfff]/30 hover:bg-[#00cfff]/20 px-4 py-1.5 rounded-lg transition-all shadow-[0_0_10px_rgba(0,207,255,0.1)]"
                        >
                          EDIT
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="text-red-400 hover:text-white font-extrabold text-[10px] uppercase tracking-widest border border-red-500/30 hover:bg-red-600/30 px-4 py-1.5 rounded-lg transition-all shadow-[0_0_10px_rgba(239,68,68,0.1)]"
                        >
                          DEL
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "subscriptions" && (
          <div className="overflow-x-auto animate-fade-in custom-scrollbar">
            <h3 className="text-lg font-extrabold text-white mb-6 uppercase tracking-widest drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
              ACTIVE SUBSCRIPTIONS
            </h3>
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-[#030308] text-[#00cfff] text-[10px] uppercase font-extrabold tracking-widest border-b border-[#00cfff]/20">
                <tr>
                  <th className="p-4 rounded-tl-xl">USER</th>
                  <th className="p-4">PLAN</th>
                  <th className="p-4">BILLING</th>
                  <th className="p-4 rounded-tr-xl">EXPIRES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#00cfff]/10">
                {users
                  .filter((u) => u.plan !== "Free")
                  .map((u) => (
                    <tr key={u.id} className="hover:bg-[#00cfff]/5 transition-colors">
                      <td className="p-4 font-extrabold text-white">{u.username}</td>
                      <td className="p-4">
                        <span className="text-[#00cfff] font-bold drop-shadow-[0_0_3px_#00cfff]">{u.plan}</span>
                      </td>
                      <td className="p-4 font-mono text-xs text-[#00cfff]/70">{u.plan_billing_cycle || "-"}</td>
                      <td className="p-4 font-mono text-xs text-gray-400">
                        {u.plan_expires_at
                          ? new Date(u.plan_expires_at).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                {users.filter((u) => u.plan !== "Free").length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-[#00cfff]/50 text-[10px] font-extrabold uppercase tracking-widest">
                      NO ACTIVE SUBSCRIPTIONS
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "content" && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-extrabold text-white mb-6 uppercase tracking-widest drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">RECENT POSTS</h3>
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-[#030308]/60 p-5 rounded-xl border border-[#00cfff]/10 flex justify-between items-start hover:border-[#00cfff]/30 transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)]"
              >
                <div>
                  <p className="text-xs font-extrabold text-[#00cfff] uppercase tracking-widest drop-shadow-[0_0_3px_#00cfff]">
                    @{post.username}
                  </p>
                  <p className="text-gray-300 mt-2 font-medium leading-relaxed">{post.content}</p>
                  <p className="text-[10px] text-[#00cfff]/50 font-mono mt-3 uppercase tracking-widest">
                    {new Date(post.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDeletePost(post.id)}
                  className="text-red-400 hover:text-white text-[10px] font-extrabold uppercase tracking-widest border border-red-500/30 bg-red-900/20 px-4 py-2 rounded-lg transition-all shadow-[0_0_10px_rgba(239,68,68,0.1)] hover:bg-red-600 hover:border-red-500"
                >
                  DEL
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "reports" && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-extrabold text-white mb-6 uppercase tracking-widest drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">USER REPORTS</h3>
            {reports.length === 0 ? (
              <p className="text-[#00cfff]/50 text-[10px] font-extrabold uppercase tracking-widest p-8 text-center border border-[#00cfff]/10 rounded-xl bg-[#030308]/50">NO REPORTS FOUND.</p>
            ) : (
              reports.map((report) => (
                <div
                  key={report.id}
                  className="bg-[#030308]/80 p-5 rounded-xl border border-red-500/30 flex justify-between items-center shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                >
                  <div>
                    <p className="text-[11px] text-red-400 font-extrabold uppercase tracking-widest drop-shadow-[0_0_3px_rgba(239,68,68,0.5)]">
                      REPORTED BY: @{report.reporter_username}
                    </p>
                    <p className="text-gray-300 mt-2 font-medium">REASON: {report.reason}</p>
                    <p className="text-[10px] text-[#00cfff]/50 font-mono mt-2 uppercase tracking-widest">
                      TARGET:{" "}
                      {report.post_id
                        ? `POST #${report.post_id}`
                        : `COMMENT #${report.comment_id}`}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    {report.post_id && (
                      <button
                        onClick={() => handleDeletePost(report.post_id)}
                        className="text-red-400 hover:text-white border border-red-500/50 bg-red-900/20 px-4 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-widest transition-all shadow-[0_0_10px_rgba(239,68,68,0.1)] hover:bg-red-600"
                      >
                        DEL CONTENT
                      </button>
                    )}
                    <button
                      onClick={() => handleDismissReport(report.id)}
                      className="text-[#00cfff]/70 hover:text-white border border-[#00cfff]/30 bg-[#00cfff]/5 px-4 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-widest transition-all hover:bg-[#00cfff]/20"
                    >
                      DISMISS
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "feedbacks" && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-extrabold text-white mb-6 uppercase tracking-widest drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
              USER FEEDBACK
            </h3>
            {feedbacks.length === 0 ? (
              <p className="text-[#00cfff]/50 text-[10px] font-extrabold uppercase tracking-widest p-8 text-center border border-[#00cfff]/10 rounded-xl bg-[#030308]/50">NO FEEDBACKS YET.</p>
            ) : (
              feedbacks.map((fb, idx) => (
                <div
                  key={fb.id || idx}
                  className="bg-[#030308]/60 p-5 rounded-xl border border-[#00cfff]/10 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                >
                  <div className="flex justify-between mb-3 border-b border-[#00cfff]/10 pb-2">
                    <span className="text-[#00cfff] font-extrabold text-[11px] font-mono tracking-widest drop-shadow-[0_0_3px_#00cfff]">
                      {fb.email}
                    </span>
                    <span className="text-[#00cfff]/50 text-[10px] font-mono uppercase tracking-widest">
                      {fb.date || new Date(fb.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-300 font-medium leading-relaxed text-sm">{fb.message}</p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "contactMessages" && (
          <ContactMessages showFlash={showFlash} />
        )}

        {activeTab === "appeals" && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-extrabold text-white mb-6 uppercase tracking-widest drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
              SUSPENSION APPEALS
            </h3>
            {users.filter((u) => u.appeal_status === "pending").length === 0 ? (
              <p className="text-[#00cfff]/50 text-[10px] font-extrabold uppercase tracking-widest p-8 text-center border border-[#00cfff]/10 rounded-xl bg-[#030308]/50">NO PENDING APPEALS.</p>
            ) : (
              users
                .filter((u) => u.appeal_status === "pending")
                .map((u) => (
                  <div
                    key={u.id}
                    className="bg-[#030308]/80 p-6 rounded-2xl border border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.1)]"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-lg font-extrabold text-white uppercase tracking-widest drop-shadow-[0_0_3px_rgba(255,255,255,0.3)]">
                          {u.username}{" "}
                          <span className="text-[10px] text-[#00cfff]/50 font-mono ml-2 lowercase tracking-normal">
                            ({u.email})
                          </span>
                        </p>
                        <p className="text-[10px] text-red-400 mt-2 font-bold uppercase tracking-widest font-mono">
                          SUSPENDED UNTIL:{" "}
                          <span className="text-white">
                          {u.suspended_until
                            ? new Date(u.suspended_until).toLocaleString()
                            : "INDEFINITE"}
                          </span>
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-bold">
                          REASON: <span className="text-yellow-400">{u.suspension_reason}</span>
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              message: `APPROVE appeal for ${u.username}? This will unsuspend the user immediately.`,
                              type: "success",
                              onConfirm: async () => {
                                try {
                                  const payload = {
                                    ...u,
                                    status: "active",
                                    suspended_until: null,
                                    appeal_status: "approved",
                                    appeal_response:
                                      "Your appeal has been approved. Welcome back.",
                                  };
                                  delete payload.id;
                                  delete payload.created_at;
                                  delete payload.updated_at;
                                  delete payload.hashed_password;
                                  delete payload.avatar_url;
                                  delete payload.reset_token;
                                  delete payload.reset_token_expires;
                                  await api.put(`/admin/users/${u.id}`, payload);
                                  fetchUsers();
                                  showFlash("Appeal approved. User unsuspended.", "success");
                                } catch (e) {
                                  showFlash("Failed to approve appeal.", "error");
                                }
                              },
                            });
                          }}
                          className="bg-green-600/20 border border-green-500/50 hover:bg-green-600 text-green-400 hover:text-white px-5 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all shadow-[0_0_10px_rgba(74,222,128,0.2)]"
                        >
                          APPROVE
                        </button>
                        <button
                          onClick={() => {
                            setRejectModal({ isOpen: true, user: u, reason: "" });
                          }}
                          className="bg-red-600/20 border border-red-500/50 hover:bg-red-600 text-red-400 hover:text-white px-5 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                        >
                          REJECT
                        </button>
                      </div>
                    </div>
                    <div className="bg-[#0a0f1c]/50 p-4 rounded-xl border border-[#00cfff]/10 shadow-inner">
                      <p className="text-[9px] text-[#00cfff]/70 uppercase font-extrabold tracking-widest mb-2 border-b border-[#00cfff]/10 pb-1">
                        APPEAL MESSAGE:
                      </p>
                      <p className="text-gray-300 text-sm italic font-medium leading-relaxed">
                        "{u.appeal_message}"
                      </p>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {activeTab === "broadcast" && (
          <div className="max-w-2xl mx-auto animate-fade-in">
            <h3 className="text-lg font-extrabold text-white mb-6 uppercase tracking-widest drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
              SYSTEM BROADCAST
            </h3>
            <div className="bg-[#030308]/80 p-8 rounded-2xl border border-[#00cfff]/30 shadow-[0_0_20px_rgba(0,207,255,0.1)]">
              <label className="block text-[10px] font-extrabold text-[#00cfff]/70 uppercase tracking-widest mb-3">
                MESSAGE TO ALL USERS
              </label>
              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="w-full bg-[#0a0f1c] border border-[#00cfff]/30 rounded-xl p-4 text-white focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] outline-none h-40 resize-none font-mono text-sm placeholder:text-[#00cfff]/20 transition-all custom-scrollbar"
                placeholder="TYPE YOUR ANNOUNCEMENT HERE..."
              />
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleBroadcast}
                  className="bg-[#00cfff] hover:bg-[#00e5ff] text-[#030308] px-8 py-3.5 rounded-xl font-extrabold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(0,207,255,0.4)] hover:shadow-[0_0_25px_rgba(0,207,255,0.6)] hover:-translate-y-0.5"
                >
                  SEND BROADCAST
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030308]/90 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-[#0a0f1c]/95 p-8 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-[#00cfff]/30 shadow-[0_0_30px_rgba(0,207,255,0.15)] custom-scrollbar">
            <h3 className="text-xl font-extrabold text-white mb-8 border-b border-[#00cfff]/20 pb-4 uppercase tracking-widest flex items-center gap-3">
              <span className="text-[#00cfff]">⚙</span> EDIT USER:{" "}
              <span className="text-[#00cfff] drop-shadow-[0_0_3px_#00cfff]">{editingUser.username}</span>
            </h3>
            <form onSubmit={handleUpdateUser} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <label className="block text-[10px] text-[#00cfff]/70 uppercase tracking-widest mb-2 font-extrabold">
                    PLAN LEVEL
                  </label>
                  <select
                    value={editFormData.plan}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, plan: e.target.value })
                    }
                    className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl p-3 text-white focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] outline-none font-mono appearance-none transition-all cursor-pointer text-xs"
                  >
                    <option value="Free">FREE</option>
                    <option value="Basic">BASIC</option>
                    <option value="Premium">PREMIUM</option>
                    <option value="Platinum">PLATINUM</option>
                  </select>
                </div>
                <div className="relative">
                  <label className="block text-[10px] text-[#00cfff]/70 uppercase tracking-widest mb-2 font-extrabold">
                    BILLING CYCLE
                  </label>
                  <select
                    value={editFormData.plan_billing_cycle}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        plan_billing_cycle: e.target.value,
                      })
                    }
                    className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl p-3 text-white focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] outline-none font-mono appearance-none transition-all cursor-pointer text-xs"
                  >
                    <option value="">NONE</option>
                    <option value="Monthly">MONTHLY</option>
                    <option value="Yearly">YEARLY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-[#00cfff]/70 uppercase tracking-widest mb-2 font-extrabold">
                    EXPIRES AT
                  </label>
                  <input
                    type="date"
                    value={editFormData.plan_expires_at}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        plan_expires_at: e.target.value,
                      })
                    }
                    className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl p-3 text-white focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] outline-none font-mono transition-all text-xs"
                  />
                </div>
                <div className="relative">
                  <label className="block text-[10px] text-[#00cfff]/70 uppercase tracking-widest mb-2 font-extrabold">
                    ACCOUNT STATUS
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        status: e.target.value,
                      })
                    }
                    className={`w-full bg-[#030308] border ${editFormData.status === 'suspended' ? 'border-red-500/50 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)] focus:border-red-500' : 'border-[#00cfff]/30 text-white focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)]'} rounded-xl p-3 outline-none font-mono appearance-none transition-all cursor-pointer text-xs`}
                  >
                    <option value="active">ACTIVE</option>
                    <option value="suspended">SUSPENDED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-[#00cfff]/70 uppercase tracking-widest mb-2 font-extrabold">
                    FULL NAME
                  </label>
                  <input
                    type="text"
                    value={editFormData.full_name}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        full_name: e.target.value,
                      })
                    }
                    className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl p-3 text-white focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] outline-none font-mono transition-all text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#00cfff]/70 uppercase tracking-widest mb-2 font-extrabold">
                    PHONE NUMBER
                  </label>
                  <input
                    type="text"
                    value={editFormData.phone_number}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        phone_number: e.target.value,
                      })
                    }
                    className="w-full bg-[#030308] border border-[#00cfff]/30 rounded-xl p-3 text-white focus:border-[#00cfff] focus:shadow-[0_0_15px_rgba(0,207,255,0.2)] outline-none font-mono transition-all text-xs"
                  />
                </div>
              </div>
              {/* Suspension Fields */}
              {editFormData.status === "suspended" && (
                <div className="bg-red-900/10 p-6 rounded-xl border border-red-500/30 mt-6 space-y-6 animate-fade-in shadow-[inset_0_0_20px_rgba(239,68,68,0.05)]">
                  <h4 className="font-extrabold text-red-400 uppercase tracking-widest drop-shadow-[0_0_3px_rgba(239,68,68,0.5)]">SUSPENSION DETAILS</h4>
                  <div>
                    <label className="block text-[10px] text-red-400/70 uppercase mb-3 font-extrabold tracking-widest">
                      REASON
                    </label>
                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                      {[
                        "Spamming",
                        "Inappropriate Content",
                        "Hate Speech",
                        "other",
                      ].map((reason) => (
                        <label
                          key={reason}
                          className="flex items-center gap-3 text-gray-300 cursor-pointer hover:bg-red-900/20 p-2 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                        >
                          <input
                            type="radio"
                            name="suspension_reason_preset"
                            value={reason}
                            checked={
                              editFormData.suspension_reason_preset === reason
                            }
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                suspension_reason_preset: e.target.value,
                              })
                            }
                            className="w-4 h-4 text-red-500 bg-[#030308] border-red-500/50 focus:ring-red-600 focus:ring-2 focus:ring-offset-1 focus:ring-offset-[#0a0f1c]"
                          />
                          <span className="uppercase">{reason}</span>
                        </label>
                      ))}
                    </div>
                    {editFormData.suspension_reason_preset === "other" && (
                      <textarea
                        value={editFormData.suspension_reason_other}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            suspension_reason_other: e.target.value,
                          })
                        }
                        placeholder="SPECIFY OTHER REASON..."
                        className="mt-4 w-full bg-[#030308] border border-red-500/50 rounded-xl p-3 text-white text-xs font-mono focus:border-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.2)] outline-none placeholder:text-red-500/30 transition-all custom-scrollbar h-20 resize-none"
                      ></textarea>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] text-red-400/70 uppercase mb-3 font-extrabold tracking-widest">
                      DURATION (LEAVE 0 FOR INDEFINITE)
                    </label>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[9px] text-red-400/50 mb-1 font-extrabold tracking-widest uppercase">
                          DAYS
                        </label>
                        <input
                          type="number"
                          value={editFormData.suspension_duration_days}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              suspension_duration_days: e.target.value,
                            })
                          }
                          className="w-full bg-[#030308] border border-red-500/50 rounded-xl p-3 text-white focus:border-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.2)] outline-none font-mono text-xs transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-[#00cfff]/20">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-8 py-3 bg-[#030308] hover:bg-[#00cfff]/10 border border-[#00cfff]/30 rounded-xl text-[#00cfff] text-[11px] font-extrabold uppercase tracking-widest transition-all"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-[#00cfff] hover:bg-[#00e5ff] rounded-xl text-[#030308] text-[11px] font-extrabold uppercase tracking-widest shadow-[0_0_15px_rgba(0,207,255,0.4)] hover:shadow-[0_0_25px_rgba(0,207,255,0.6)] hover:-translate-y-0.5 transition-all"
                >
                  SAVE CHANGES
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
