import React, { useState, useEffect } from "react";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from "recharts";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview"); // overview, users, subscriptions
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [posts, setPosts] = useState([]);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubs: 0,
    mrr: 0, // Monthly Recurring Revenue
    userGrowth: [],
    subsDistribution: []
  });

  // Mock Data Generator (Untuk visualisasi sebelum backend siap)
  const mockStats = {
    totalUsers: 1250,
    activeSubs: 145,
    mrr: 2450,
    userGrowth: [
      { name: 'Jan', users: 400 },
      { name: 'Feb', users: 600 },
      { name: 'Mar', users: 800 },
      { name: 'Apr', users: 1000 },
      { name: 'May', users: 1250 },
    ],
    subsDistribution: [
      { name: 'Basic', value: 80 },
      { name: 'Premium', value: 45 },
      { name: 'Platinum', value: 20 },
    ]
  };

  const mockUsers = [
    { id: 1, username: "trader_pro", email: "pro@example.com", role: "user", status: "active", plan: "Premium", joined: "2023-01-15" },
    { id: 2, username: "newbie_01", email: "new@example.com", role: "user", status: "active", plan: "Free", joined: "2023-05-20" },
    { id: 3, username: "spammer_bot", email: "bot@spam.com", role: "user", status: "suspended", plan: "Free", joined: "2023-06-01" },
    { id: 4, username: "admin_master", email: "admin@tip.com", role: "admin", status: "active", plan: "Platinum", joined: "2022-11-01" },
  ];

  const mockSubscriptions = [
    { id: "TX-8821", user: "trader_pro", plan: "Premium", amount: 19, status: "paid", date: "2023-10-25", billing: "Monthly" },
    { id: "TX-8822", user: "admin_master", plan: "Platinum", amount: 279, status: "paid", date: "2023-10-24", billing: "Yearly" },
    { id: "TX-8823", user: "newbie_01", plan: "Basic", amount: 12, status: "pending", date: "2023-10-26", billing: "Monthly" },
    { id: "TX-8824", user: "spammer_bot", plan: "Basic", amount: 12, status: "failed", date: "2023-10-20", billing: "Monthly" },
    { id: "TX-8825", user: "whale_007", plan: "Platinum", amount: 28, status: "paid", date: "2023-10-26", billing: "Monthly" },
  ];

  const mockFeedbacks = [
    { id: 1, email: "user1@example.com", message: "Great app! Love the simulation feature.", date: "2023-10-20" },
    { id: 2, email: "trader_pro@example.com", message: "Can you add more indicators to the chart?", date: "2023-10-22" },
    { id: 3, email: "newbie@test.com", message: "I found a bug in the profile page.", date: "2023-10-25" },
  ];

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      // prepare data holders
      let fetchedUsers = mockUsers;
      let fetchedFeedbacks = mockFeedbacks;
      let fetchedCommunities = [];
      let fetchedPosts = [];

      //try fetching read data (feedbacks & users)
      try {
        const [usersRes, feedRes, commRes, postsRes] = await Promise.allSettled([
          axios.get("http://127.0.0.1:8000/api/admin/users", { headers: { Authorization: `Bearer ${token}` } }),
          axios.get("http://127.0.0.1:8000/api/admin/feedbacks", { headers: { Authorization: `Bearer ${token}` } }),
          axios.get("http://127.0.0.1:8000/api/communities"),
          axios.get("http://127.0.0.1:8000/api/admin/posts", { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (usersRes.status === 'fulfilled' && usersRes.value.data) {
            fetchedUsers = usersRes.value.data;
        }
        if (feedRes.status === 'fulfilled' && feedRes.value.data) {
            fetchedFeedbacks = feedRes.value.data;
        }
        if (commRes.status === 'fulfilled' && commRes.value.data) {
            fetchedCommunities = commRes.value.data;
        }
        if (postsRes.status === 'fulfilled' && postsRes.value.data) {
            fetchedPosts = postsRes.value.data;
        }
      } catch (err) {
        console.log("Backend endpoints not ready, using mock data.");
      }

      // Gabungkan feedback dari LocalStorage dengan data fetch/mock
      const localFeedbacks = JSON.parse(localStorage.getItem("local_feedbacks") || "[]");
      const combinedFeedbacks = [...localFeedbacks, ...fetchedFeedbacks];
      // Hapus duplikat berdasarkan ID (jika ada)
      const uniqueFeedbacks = Array.from(new Map(combinedFeedbacks.map(item => [item.id, item])).values())
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Set all states
      setStats(mockStats); // Stats still mock for now
      setUsers(fetchedUsers);
      setSubscriptions(mockSubscriptions);
      setFeedbacks(uniqueFeedbacks);
      setCommunities(fetchedCommunities);
      setPosts(fetchedPosts);

    } catch (error) {
      console.error("Failed to fetch admin data", error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendUser = async (userId) => {
    if(!window.confirm("Are you sure you want to suspend this user?")) return;
    const userToSuspend = users.find(u => u.id === userId);
    if (!userToSuspend) return;

    const token = localStorage.getItem("token");
    try {
        const updatedUser = { ...userToSuspend, status: "suspended" };
        await axios.put(`http://127.0.0.1:8000/api/admin/users/${userId}`, updatedUser, { headers: { Authorization: `Bearer ${token}` } });
        setUsers(users.map(u => u.id === userId ? {...u, status: "suspended"} : u));
        alert(`User ${userToSuspend.username} has been suspended.`);
    } catch (error) {
        alert("Failed to suspend user.");
    }
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    const token = localStorage.getItem("token");
    try {
      const res = await axios.put(
        `http://127.0.0.1:8000/api/admin/users/${editingUser.id}`,
        editingUser, // The state object matches the required payload
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state with the confirmed data from backend
      setUsers(users.map(u => u.id === editingUser.id ? res.data : u));
      setEditingUser(null);
      alert(`User ${editingUser.username} updated successfully!`);
    } catch (error) {
      console.error("Failed to update user", error);
      alert(error.response?.data?.detail || "Failed to update user.");
    }
  };

  const handleDeleteCommunity = async (communityId) => {
    if (!window.confirm("Are you sure you want to delete this community? This will remove all posts and members permanently.")) return;
    const token = localStorage.getItem("token");
    try {
        await axios.delete(`http://127.0.0.1:8000/api/communities/${communityId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setCommunities(communities.filter(c => c.id !== communityId));
        alert("Community deleted successfully.");
    } catch (error) {
        console.error("Delete failed", error);
        alert(error.response?.data?.detail || "Failed to delete community.");
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Delete this post permanently?")) return;
    const token = localStorage.getItem("token");
    try {
        await axios.delete(`http://127.0.0.1:8000/api/posts/${postId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setPosts(posts.filter(p => p.id !== postId));
    } catch (error) {
        alert("Failed to delete post.");
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastMsg.trim()) return;
    if (!window.confirm("Send this message to ALL users?")) return;

    const token = localStorage.getItem("token");
    try {
        await axios.post("http://127.0.0.1:8000/api/admin/broadcast", { message: broadcastMsg }, { headers: { Authorization: `Bearer ${token}` } });
        alert("Broadcast sent successfully!");
        setBroadcastMsg("");
    } catch (error) {
        alert("Failed to send broadcast.");
    }
  };

  const renderVerifiedBadge = (user) => {
    let badge = null;

    if (user.role === 'admin') {
      badge = { color: 'text-red-500', title: 'Admin' };
    } else if (user.plan === 'Platinum') {
      badge = { color: 'text-yellow-400', title: 'Platinum User' };
    }

    if (!badge) return null;

    return (
      <span title={badge.title} className={`${badge.color} ml-1`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.491 4.491 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
        </svg>
      </span>
    );
  };

  const COLORS = ['#3b82f6', '#8b5cf6', '#eab308'];

  // filter users for serch
  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-100px)] bg-gray-900 text-gray-100 overflow-hidden rounded-xl border border-gray-700 shadow-2xl animate-fade-in">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-red-500">🛡️</span> Admin Panel
          </h2>
          <p className="text-xs text-gray-500 mt-1">TIP Management System</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab("overview")}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-colors ${activeTab === "overview" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-700 hover:text-white"}`}
          >
            📊 Overview
          </button>
          <button 
            onClick={() => setActiveTab("users")}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-colors ${activeTab === "users" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-700 hover:text-white"}`}
          >
            👥 User Management
          </button>
          <button 
            onClick={() => setActiveTab("subscriptions")}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-colors ${activeTab === "subscriptions" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-700 hover:text-white"}`}
          >
            💳 Subscriptions
            </button>
          <button 
            onClick={() => setActiveTab("communities")}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-colors ${activeTab === "communities" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-700 hover:text-white"}`}
          >
            🏘️ Communities
          </button>
          <button 
            onClick={() => setActiveTab("content")}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-colors ${activeTab === "content" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-700 hover:text-white"}`}
          >
            📝 Content
          </button>
          <button 
            onClick={() => setActiveTab("broadcast")}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-colors ${activeTab === "broadcast" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-700 hover:text-white"}`}
          >
            📢 Broadcast
          </button>
          <button 
            onClick={() => setActiveTab("feedback")}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-colors ${activeTab === "feedback" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-700 hover:text-white"}`}
          >
            💬 Feedback
          </button>
        </nav>
        <div className="p-4 border-t border-gray-700">
          <div className="bg-gray-900 p-3 rounded text-xs text-gray-500">
            <p>Admin Access Level: <span className="text-green-400 font-bold">Super Admin</span></p>
            <p className="mt-1">v1.0.0 (Phase 1)</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-gray-900 p-8">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white mb-6">Dashboard Overview</h3>
                
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                    <p className="text-gray-400 text-sm uppercase font-bold">Total Users</p>
                    <p className="text-3xl font-bold text-white mt-2">{stats.totalUsers.toLocaleString()}</p>
                    <span className="text-green-400 text-xs font-bold">↑ 12% from last month</span>
                  </div>
                  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                    <p className="text-gray-400 text-sm uppercase font-bold">Active Subscriptions</p>
                    <p className="text-3xl font-bold text-blue-400 mt-2">{stats.activeSubs}</p>
                    <span className="text-gray-500 text-xs">Conversion Rate: {((stats.activeSubs/stats.totalUsers)*100).toFixed(1)}%</span>
                  </div>
                  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                    <p className="text-gray-400 text-sm uppercase font-bold">Monthly Revenue (MRR)</p>
                    <p className="text-3xl font-bold text-green-400 mt-2">${stats.mrr.toLocaleString()}</p>
                    <span className="text-green-400 text-xs font-bold">↑ 8% from last month</span>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h4 className="text-lg font-bold text-white mb-4">User Growth</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats.userGrowth}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="name" stroke="#9ca3af" />
                          <YAxis stroke="#9ca3af" />
                          <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151' }} />
                          <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h4 className="text-lg font-bold text-white mb-4">Plan Distribution</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.subsDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {stats.subsDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151' }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex justify-center gap-4 mt-2">
                        {stats.subsDistribution.map((entry, index) => (
                          <div key={index} className="flex items-center gap-1 text-xs text-gray-400">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                            {entry.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FEEDBACK TAB */}
            {activeTab === "feedback" && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white">User Feedback</h3>
                <div className="grid gap-4">
                  {feedbacks.length === 0 ? (
                    <p className="text-gray-500">No feedback available.</p>
                  ) : feedbacks.map((item) => (
                    <div key={item.id} className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-bold text-blue-400 text-sm">{item.email}</h4>
                        <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(item.created_at || item.date), { addSuffix: true })}</span>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">"{item.message}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* USERS TAB */}
            {activeTab === "users" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-white">User Management</h3>
                  <input 
                    type="text" 
                    placeholder="Search users..." 
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="bg-gray-800 border border-gray-600 rounded px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500" 
                  />
                </div>

                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Plan</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Joined</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-700/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                                {user.username.substring(0,2).toUpperCase()}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-white flex items-center">
                                  {user.username}
                                  {renderVerifiedBadge(user)}
                                </div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-900 text-purple-200' : 'bg-gray-700 text-gray-300'}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {user.plan}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'active' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.joined}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => setEditingUser(user)} className="text-blue-400 hover:text-blue-300 mr-3">Edit</button>
                            {user.status === 'active' && user.role !== 'admin' && (
                              <button onClick={() => handleSuspendUser(user.id)} className="text-red-400 hover:text-red-300">Suspend</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUBSCRIPTIONS TAB */}
            {activeTab === "subscriptions" && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white">Subscription Monitoring</h3>
                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Transaction ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Plan Details</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                      {subscriptions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-gray-700/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-400">
                            #{sub.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">
                            {sub.user}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-white">{sub.plan}</div>
                            <div className="text-xs text-gray-500">{sub.billing}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-green-400">
                            ${sub.amount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              sub.status === 'paid' ? 'bg-green-900 text-green-200' : 
                              sub.status === 'pending' ? 'bg-yellow-900 text-yellow-200' : 
                              'bg-red-900 text-red-200'
                            }`}>
                              {sub.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-blue-400 hover:text-blue-300 cursor-pointer">View Invoice</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* COMMUNITIES TAB */}
            {activeTab === "communities" && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white">Community Management</h3>
                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Creator</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Members</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                      {communities.map((comm) => (
                        <tr key={comm.id} className="hover:bg-gray-700/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{comm.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">{comm.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{comm.creator_username}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-400 font-mono">{comm.members_count}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button 
                              onClick={() => handleDeleteCommunity(comm.id)} 
                              className="text-red-400 hover:text-red-300 bg-red-900/20 hover:bg-red-900/40 px-3 py-1 rounded transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {communities.length === 0 && (
                        <tr>
                          <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No communities found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* CONTENT TAB */}
            {activeTab === "content" && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white">Content Moderation (All Posts)</h3>
                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Author</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Content Preview</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                      {posts.map((post) => (
                        <tr key={post.id} className="hover:bg-gray-700/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">{post.username}</td>
                          <td className="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">{post.content}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(post.created_at).toLocaleDateString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => handleDeletePost(post.id)} className="text-red-400 hover:text-red-300">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* BROADCAST TAB */}
            {activeTab === "broadcast" && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white">System Broadcast</h3>
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <p className="text-gray-400 mb-4 text-sm">Send a notification to ALL registered users. Use this for important announcements.</p>
                    <form onSubmit={handleBroadcast}>
                        <textarea 
                            value={broadcastMsg}
                            onChange={(e) => setBroadcastMsg(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-4 text-white focus:border-blue-500 outline-none h-32 resize-none"
                            placeholder="Type your announcement here..."
                            required
                        />
                        <div className="mt-4 flex justify-end">
                            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2">
                                <span>📢</span> Send Broadcast
                            </button>
                        </div>
                    </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setEditingUser(null)}>
          <div className="bg-gray-800 border border-gray-600 p-6 rounded-xl shadow-2xl max-w-md w-full animate-fade-in" onClick={e => e.stopPropagation()}>
             <h3 className="text-xl font-bold text-white mb-4">Edit User</h3>
             <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Username</label>
                  <input type="text" value={editingUser.username} onChange={e => setEditingUser({...editingUser, username: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Email</label>
                  <input type="email" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-blue-500 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1">Role</label>
                      <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-blue-500 outline-none">
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1">Status</label>
                      <select value={editingUser.status} onChange={e => setEditingUser({...editingUser, status: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-blue-500 outline-none">
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                      </select>
                   </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Plan</label>
                  <select value={editingUser.plan} onChange={e => setEditingUser({...editingUser, plan: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-blue-500 outline-none">
                     <option value="Free">Free</option>
                     <option value="Basic">Basic</option>
                     <option value="Premium">Premium</option>
                     <option value="Platinum">Platinum</option>
                  </select>
                </div>
             </div>
             <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setEditingUser(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
                <button onClick={handleSaveUser} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded font-bold">Save Changes</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
