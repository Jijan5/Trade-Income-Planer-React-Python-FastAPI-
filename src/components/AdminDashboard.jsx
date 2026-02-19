import React, { useState, useEffect, useCallback } from "react";
import api from "../lib/axios";
import { useAuth } from "../contexts/AuthContext";
import ContactMessages from "./ContactMessages";

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
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "users", label: "User Management", icon: "👥" },
    { id: "subscriptions", label: "Subscriptions", icon: "💳" },
    { id: "content", label: "Content Moderation", icon: "📝" },
    { id: "reports", label: "Reports", icon: "🚩" },
    { id: "feedbacks", label: "Feedbacks", icon: "💬" },
    { id: "contactMessages", label: "Contact Messages", icon: "📧" },
    { id: "broadcast", label: "Broadcast", icon: "📢" },
    { id: "appeals", label: "Appeals", icon: "⚖️" },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Custom Flash Notification */}
      {flash && (
        <div
          className={`fixed top-24 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-fade-in ${
            flash.type === "success"
              ? "bg-gray-800 border-green-500 text-green-400"
              : "bg-gray-800 border-red-500 text-red-400"
          }`}
        >
          <span className="text-2xl">
            {flash.type === "success" ? "✅" : "❌"}
          </span>
          <div>
            <h4 className="font-bold text-sm uppercase">{flash.type}</h4>
            <p className="text-sm text-gray-300">{flash.message}</p>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-gray-800 border border-gray-600 p-6 rounded-xl shadow-2xl max-w-sm w-full text-center">
            <h3
              className={`text-lg font-bold mb-2 ${
                confirmModal.type === "success"
                  ? "text-green-400"
                  : "text-white"
              }`}
            >
              {confirmModal.type === "success"
                ? "Confirm Action"
                : "Are you sure?"}
            </h3>
            <p className="text-gray-400 text-sm mb-6">{confirmModal.message}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() =>
                  setConfirmModal({ ...confirmModal, isOpen: false })
                }
                className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal({ ...confirmModal, isOpen: false });
                }}
                className={`px-4 py-2 rounded text-white text-sm font-bold transition-colors ${
                  confirmModal.type === "success"
                    ? "bg-green-600 hover:bg-green-500"
                    : "bg-red-600 hover:bg-red-500"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR - SCROLLABLE */}
      {/* Added overflow-y-auto and fixed height calculation to make it scrollable */}
      <div className="w-full md:w-64 bg-gray-800 rounded-lg border border-gray-700 md:h-[calc(100vh-9rem)] overflow-y-auto sticky top-24 flex-shrink-0 shadow-lg z-20">
        <div className="p-4 border-b border-gray-700 bg-gray-900/50 sticky top-0 z-10 backdrop-blur-sm flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Admin Panel</h2>
            <p className="text-xs text-gray-400">
              Welcome, {userData?.username}
            </p>
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 focus:outline-none"
          >
            {isSidebarOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
        <nav
          className={`p-2 space-y-1 ${
            isSidebarOpen ? "block" : "hidden"
          } md:block`}
        >
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                activeTab === item.id
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-400 hover:bg-gray-700 hover:text-white"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 bg-gray-800 rounded-lg border border-gray-700 p-6 min-h-[500px] shadow-lg">
        {activeTab === "dashboard" && stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
              <h3 className="text-gray-400 text-xs uppercase font-bold mb-2">
                Total Users
              </h3>
              <p className="text-3xl font-bold text-white">
                {stats.totalUsers}
              </p>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
              <h3 className="text-gray-400 text-xs uppercase font-bold mb-2">
                Active Subs
              </h3>
              <p className="text-3xl font-bold text-green-400">
                {stats.activeSubs}
              </p>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
              <h3 className="text-gray-400 text-xs uppercase font-bold mb-2">
                Est. MRR
              </h3>
              <p className="text-3xl font-bold text-blue-400">${stats.mrr}</p>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="overflow-x-auto animate-fade-in">
            <input
              type="text"
              placeholder="Search users..."
              onChange={(e) => setSearchUsers(e.target.value)}
              className="mb-4 bg-gray-900 border border-gray-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500 w-full"
            />
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-gray-900 text-gray-200 uppercase font-bold">
                <tr>
                  <th className="p-3 rounded-tl-lg">User</th>
                  <th className="p-3">Plan</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 rounded-tr-lg">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredUsers().map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="p-3">
                      <div className="font-bold text-white">{u.username}</div>
                      <div className="text-xs">{u.email}</div>
                      {u.full_name && (
                        <div className="text-[10px] text-gray-500">
                          {u.full_name}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          u.plan === "Platinum"
                            ? "bg-purple-900 text-purple-300"
                            : u.plan === "Premium"
                            ? "bg-blue-900 text-blue-300"
                            : "bg-gray-700"
                        }`}
                      >
                        {u.plan}
                      </span>
                      {u.plan_billing_cycle && (
                        <div className="text-[10px] mt-1">
                          {u.plan_billing_cycle}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                          u.status === "active"
                            ? "bg-green-900/50 text-green-400"
                            : "bg-red-900/50 text-red-400"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditUser(u)}
                          className="text-blue-400 hover:text-white font-bold text-xs border border-blue-900 hover:bg-blue-900 px-3 py-1 rounded transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="text-red-400 hover:text-white font-bold text-xs border border-red-900 hover:bg-red-900 px-3 py-1 rounded transition-colors"
                        >
                          Delete
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
          <div className="overflow-x-auto animate-fade-in">
            <h3 className="text-lg font-bold text-white mb-4">
              Active Subscriptions
            </h3>
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-gray-900 text-gray-200 uppercase font-bold">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Plan</th>
                  <th className="p-3">Billing</th>
                  <th className="p-3">Expires</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {users
                  .filter((u) => u.plan !== "Free")
                  .map((u) => (
                    <tr key={u.id} className="hover:bg-gray-700/50">
                      <td className="p-3 font-bold text-white">{u.username}</td>
                      <td className="p-3">
                        <span className="text-blue-400">{u.plan}</span>
                      </td>
                      <td className="p-3">{u.plan_billing_cycle || "-"}</td>
                      <td className="p-3">
                        {u.plan_expires_at
                          ? new Date(u.plan_expires_at).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                {users.filter((u) => u.plan !== "Free").length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-4 text-center">
                      No active subscriptions.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "content" && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-bold text-white mb-4">Recent Posts</h3>
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-gray-900 p-4 rounded border border-gray-700 flex justify-between items-start"
              >
                <div>
                  <p className="text-sm font-bold text-blue-400">
                    {post.username}
                  </p>
                  <p className="text-gray-300 mt-1">{post.content}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(post.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDeletePost(post.id)}
                  className="text-red-400 hover:text-white text-xs border border-red-900 bg-red-900/20 px-3 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "reports" && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-bold text-white mb-4">User Reports</h3>
            {reports.length === 0 ? (
              <p className="text-gray-500">No reports found.</p>
            ) : (
              reports.map((report) => (
                <div
                  key={report.id}
                  className="bg-gray-900 p-4 rounded border border-red-900/50 flex justify-between items-center"
                >
                  <div>
                    <p className="text-sm text-red-400 font-bold">
                      Reported by: {report.reporter_username}
                    </p>
                    <p className="text-gray-300">Reason: {report.reason}</p>
                    <p className="text-xs text-gray-500">
                      Target ID:{" "}
                      {report.post_id
                        ? `Post #${report.post_id}`
                        : `Comment #${report.comment_id}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {report.post_id && (
                      <button
                        onClick={() => handleDeletePost(report.post_id)}
                        className="text-red-400 border border-red-900 px-3 py-1 rounded text-xs"
                      >
                        Delete Content
                      </button>
                    )}
                    <button
                      onClick={() => handleDismissReport(report.id)}
                      className="text-gray-400 border border-gray-700 px-3 py-1 rounded text-xs"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "feedbacks" && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-bold text-white mb-4">
              User Feedbacks
            </h3>
            {feedbacks.length === 0 ? (
              <p className="text-gray-500">No feedbacks yet.</p>
            ) : (
              feedbacks.map((fb, idx) => (
                <div
                  key={fb.id || idx}
                  className="bg-gray-900 p-4 rounded border border-gray-700"
                >
                  <div className="flex justify-between mb-2">
                    <span className="text-blue-400 font-bold text-sm">
                      {fb.email}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {fb.date || new Date(fb.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-300">{fb.message}</p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "contactMessages" && (
          <ContactMessages showFlash={showFlash} />
        )}

        {activeTab === "appeals" && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-bold text-white mb-4">
              Suspension Appeals
            </h3>
            {users.filter((u) => u.appeal_status === "pending").length === 0 ? (
              <p className="text-gray-500">No pending appeals.</p>
            ) : (
              users
                .filter((u) => u.appeal_status === "pending")
                .map((u) => (
                  <div
                    key={u.id}
                    className="bg-gray-900 p-4 rounded border border-yellow-600/50"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-lg font-bold text-white">
                          {u.username}{" "}
                          <span className="text-xs text-gray-500">
                            ({u.email})
                          </span>
                        </p>
                        <p className="text-xs text-red-400 mt-1">
                          Suspended Until:{" "}
                          {u.suspended_until
                            ? new Date(u.suspended_until).toLocaleString()
                            : "Indefinite"}
                        </p>
                        <p className="text-xs text-gray-400">
                          Reason: {u.suspension_reason}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              message: `Approve appeal for ${u.username}? This will unsuspend the user immediately.`,
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
                                  // Clean payload for UserUpdateAdmin
                                  delete payload.id;
                                  delete payload.created_at;
                                  delete payload.updated_at;
                                  delete payload.hashed_password;
                                  delete payload.avatar_url;
                                  delete payload.reset_token;
                                  delete payload.reset_token_expires;
                                  await api.put(
                                    `/admin/users/${u.id}`,
                                    payload
                                  );
                                  fetchUsers();
                                  showFlash(
                                    "Appeal approved. User unsuspended.",
                                    "success"
                                  );
                                } catch (e) {
                                  showFlash(
                                    "Failed to approve appeal.",
                                    "error"
                                  );
                                }
                              },
                            });
                          }}
                          className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-xs font-bold"
                        >
                          Approve
                        </button>
                        <button
                          onClick={async () => {
                            const reason = prompt("Enter rejection reason:");
                            if (!reason) return;
                            try {
                              const payload = {
                                ...u,
                                appeal_status: "rejected",
                                appeal_response: reason,
                              };
                              // Clean payload
                              delete payload.id;
                              delete payload.created_at;
                              delete payload.updated_at;
                              delete payload.hashed_password;
                              delete payload.avatar_url;
                              delete payload.reset_token;
                              delete payload.reset_token_expires;
                              await api.put(`/admin/users/${u.id}`, payload);
                              fetchUsers();
                              showFlash("Appeal rejected.", "success");
                            } catch (e) {
                              showFlash("Failed to reject appeal.", "error");
                            }
                          }}
                          className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-xs font-bold"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                    <div className="bg-gray-800 p-3 rounded border border-gray-700">
                      <p className="text-xs text-gray-400 uppercase font-bold mb-1">
                        Appeal Message:
                      </p>
                      <p className="text-gray-300 text-sm italic">
                        "{u.appeal_message}"
                      </p>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {activeTab === "broadcast" && (
          <div className="max-w-xl animate-fade-in">
            <h3 className="text-lg font-bold text-white mb-4">
              System Broadcast
            </h3>
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
              <label className="block text-sm font-bold text-gray-400 mb-2">
                Message to All Users
              </label>
              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white focus:border-blue-500 outline-none h-32 resize-none"
                placeholder="Type your announcement here..."
              />
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleBroadcast}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-bold transition-colors"
                >
                  Send Broadcast
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-600 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6 border-b border-gray-700 pb-4">
              Edit User:{" "}
              <span className="text-blue-400">{editingUser.username}</span>
            </h3>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 uppercase mb-1 font-bold">
                    Plan Level
                  </label>
                  <select
                    value={editFormData.plan}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, plan: e.target.value })
                    }
                    className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-blue-500 outline-none"
                  >
                    <option value="Free">Free</option>
                    <option value="Basic">Basic</option>
                    <option value="Premium">Premium</option>
                    <option value="Platinum">Platinum</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase mb-1 font-bold">
                    Billing Cycle
                  </label>
                  <select
                    value={editFormData.plan_billing_cycle}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        plan_billing_cycle: e.target.value,
                      })
                    }
                    className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-blue-500 outline-none"
                  >
                    <option value="">None</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase mb-1 font-bold">
                    Expires At
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
                    className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase mb-1 font-bold">
                    Account Status
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        status: e.target.value,
                      })
                    }
                    className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-blue-500 outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase mb-1 font-bold">
                    Full Name
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
                    className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase mb-1 font-bold">
                    Phone Number
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
                    className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
              {/* Suspension Fields */}
              {editFormData.status === "suspended" && (
                <div className="bg-red-900/20 p-4 rounded-lg border border-red-500/30 mt-4 space-y-4 animate-fade-in">
                  <h4 className="font-bold text-red-300">Suspension Details</h4>
                  <div>
                    <label className="block text-xs text-gray-400 uppercase mb-2 font-bold">
                      Reason
                    </label>
                    <div className="space-y-2 text-sm">
                      {[
                        "Spamming",
                        "Inappropriate Content",
                        "Hate Speech",
                        "other",
                      ].map((reason) => (
                        <label
                          key={reason}
                          className="flex items-center gap-2 text-gray-300"
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
                            className="w-4 h-4 text-red-500 bg-gray-700 border-gray-600 focus:ring-red-600"
                          />
                          {reason.charAt(0).toUpperCase() + reason.slice(1)}
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
                        placeholder="Specify other reason..."
                        className="mt-2 w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-sm focus:border-red-500 outline-none"
                      ></textarea>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 uppercase mb-2 font-bold">
                      Duration (Leave 0 for Indefinite)
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Days
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
                          className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-red-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white font-bold transition-colors"
                >
                  Save Changes
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
