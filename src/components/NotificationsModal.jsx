import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '../contexts/NotificationContext';
import VerifiedBadge from './VerifiedBadge';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const NotificationsModal = ({ onClose, onNotificationClick }) => {
  const { notifications, markAllRead, unreadCount } = useNotifications();
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (e, id) => {
    e.stopPropagation(); // Prevent modal from closing when clicking the button
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getNotificationMessage = (notification) => {
    const actor = (
      <strong className="text-engine-neon inline-flex items-center drop-shadow-[0_0_2px_#00cfff] font-extrabold uppercase tracking-widest text-[11px] mr-1">
        {notification.actor_username}
        <VerifiedBadge user={{ role: notification.actor_role, plan: notification.actor_plan }} />
      </strong>
    );
    const preview = <em className="text-white italic ml-1 drop-shadow-[0_0_2px_rgba(255,255,255,0.3)]">"{notification.content_preview}..."</em>;

    switch (notification.type) {
      case 'react_post':
        return <>{actor} <span className="text-engine-neon/70">reacted to your post.</span></>;
      case 'mention_post':
        return <>{actor} <span className="text-engine-neon/70">mentioned you in a post:</span> {preview}</>;
      case 'mention_comment':
        return <>{actor} <span className="text-engine-neon/70">mentioned you in a comment:</span> {preview}</>;
      case 'reply_post':
        return <>{actor} <span className="text-engine-neon/70">replied to your post.</span></>;
      case 'reply_comment':
        return <>{actor} <span className="text-engine-neon/70">replied to your comment:</span> {preview}</>;
      case 'system_broadcast':
        return <span className="text-engine-neon/80">{notification.content_preview}</span>;
      default:
        return <span className="text-engine-neon/70">You have a new notification.</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-engine-bg/80 backdrop-blur-sm transition-all" onClick={onClose}>
      <div 
        className="w-full max-w-sm h-full bg-engine-panel/95 border-l border-engine-neon/30 shadow-[-20px_0_50px_rgba(var(--engine-neon-rgb),0.1)] flex flex-col animate-slide-in-right backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-engine-neon/20 flex justify-between items-center bg-engine-bg/50">
          <h3 className="font-extrabold text-white flex items-center gap-3 uppercase tracking-widest drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
            NOTIFICATIONS
            {unreadCount > 0 && <span className="bg-red-600/80 border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)] text-white text-[9px] px-2 py-0.5 rounded-md">{unreadCount}</span>}
          </h3>
          <div className="flex items-center gap-4">
            <button onClick={markAllRead} className="text-engine-neon/70 hover:text-engine-neon text-[10px] font-extrabold uppercase tracking-widest drop-shadow-[0_0_3px_currentColor] transition-all whitespace-nowrap">MARK ALL READ</button>
            <button onClick={onClose} className="text-engine-neon/50 hover:text-engine-neon transition-colors font-extrabold text-xl leading-none">&times;</button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {notifications.length === 0 ? (
            <p className="text-engine-neon/50 text-center p-10 text-[10px] font-extrabold uppercase tracking-widest">NO NEW NOTIFICATIONS.</p>
          ) : (
            <div className="divide-y divide-[#00cfff]/10">
              {notifications.map(notif => {
                const isBroadcast = notif.type === 'system_broadcast';
                const isExpanded = !!expanded[notif.id];
                const isExpandable = isBroadcast && notif.content_preview.length > 120;

                return (
                  <div 
                    key={notif.id} 
                    onClick={() => !isBroadcast && onNotificationClick(notif)}
                    className={`p-5 flex items-start gap-4 transition-colors ${!notif.is_read ? 'bg-engine-button/10' : ''} ${isBroadcast ? 'cursor-default' : 'cursor-pointer hover:bg-engine-button/5 group'}`}
                  >
                    <div className="relative mt-1">
                      {isBroadcast ? (
                        <div className="w-10 h-10 bg-engine-bg rounded-xl flex items-center justify-center text-lg border border-engine-neon/50 shadow-[0_0_10px_rgba(var(--engine-neon-rgb),0.2)]">
                          📢
                        </div>
                      ) : notif.actor_avatar_url ? (
                        <img src={`${API_BASE_URL}${notif.actor_avatar_url}`} alt={notif.actor_username} className="w-10 h-10 rounded-xl object-cover border border-engine-neon/30 shadow-[0_0_10px_rgba(var(--engine-neon-rgb),0.1)] group-hover:border-engine-neon/70 transition-all" />
                      ) : (
                        <div className="w-10 h-10 bg-engine-bg border border-engine-neon/30 rounded-xl flex items-center justify-center text-[10px] font-extrabold uppercase tracking-widest text-engine-neon shadow-[0_0_10px_rgba(var(--engine-neon-rgb),0.1)] group-hover:border-engine-neon/70 transition-all">
                          {notif.actor_username.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      {!notif.is_read && <span className="absolute -top-1 -right-1 block h-3 w-3 rounded-full bg-engine-button ring-2 ring-[#0a0f1c] shadow-[0_0_8px_var(--engine-neon)]"></span>}
                    </div>
                    <div className="flex-1">
                      <div className="text-[11px] leading-relaxed">
                        {isBroadcast ? (
                          <>
                            <strong className="text-engine-neon drop-shadow-[0_0_2px_#00cfff] flex items-center font-extrabold uppercase tracking-widest mb-1">
                              {notif.actor_username}
                              <VerifiedBadge user={{ role: 'admin', plan: 'Free' }} />
                            </strong>
                            <p className={`mt-1 text-engine-neon/80 font-medium ${!isExpanded && isExpandable ? 'line-clamp-3' : ''}`}>
                              {getNotificationMessage(notif)}
                            </p>
                            {isExpandable && (
                              <button onClick={(e) => toggleExpand(e, notif.id)} className="text-engine-neon text-[9px] font-extrabold uppercase tracking-widest mt-2 hover:drop-shadow-[0_0_3px_#00cfff] transition-all">
                                {isExpanded ? 'SHOW LESS' : 'SHOW MORE'}
                              </button>
                            )}
                          </>
                        ) : getNotificationMessage(notif)}
                      </div>
                      <p className="text-[9px] text-engine-neon/40 mt-2 font-mono uppercase tracking-widest">
                        {(() => {
                          try {
                            return formatDistanceToNow(new Date(notif.created_at), { addSuffix: true });
                          } catch (e) { return ""; }
                        })()}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal;
