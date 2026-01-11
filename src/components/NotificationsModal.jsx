import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import VerifiedBadge from './VerifiedBadge';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const NotificationsModal = ({ notifications, onClose, onNotificationClick }) => {
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (e, id) => {
    e.stopPropagation(); // Prevent modal from closing when clicking the button
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getNotificationMessage = (notification) => {
    const actor = (
      <strong className="text-white inline-flex items-center">
        {notification.actor_username}
        <VerifiedBadge user={{ role: notification.actor_role, plan: notification.actor_plan }} />
      </strong>
    );
    const preview = <em className="text-gray-400">"{notification.content_preview}..."</em>;

    switch (notification.type) {
      case 'react_post':
        return <>{actor} reacted to your post.</>;
      case 'mention_post':
        return <>{actor} mentioned you in a post: {preview}</>;
      case 'mention_comment':
        return <>{actor} mentioned you in a comment: {preview}</>;
      case 'reply_post':
        return <>{actor} replied to your post.</>;
      case 'reply_comment':
        return <>{actor} replied to your comment: {preview}</>;
      case 'system_broadcast':
        return <>{notification.content_preview}</>;
      default:
        return 'You have a new notification.';
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end" onClick={onClose}>
      <div 
        className="w-full max-w-sm h-full bg-gray-800 border-l border-gray-700 shadow-2xl flex flex-col animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h3 className="font-bold text-white">Notifications</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-gray-500 text-center p-8">You have no notifications.</p>
          ) : (
            <div>
              {notifications.map(notif => {
                const isBroadcast = notif.type === 'system_broadcast';
                const isExpanded = !!expanded[notif.id];
                const isExpandable = isBroadcast && notif.content_preview.length > 120;

                return (
                  <div 
                    key={notif.id} 
                    onClick={() => !isBroadcast && onNotificationClick(notif)}
                    className={`p-4 border-b border-gray-700/50 flex items-start gap-3 transition-colors ${!notif.is_read ? 'bg-blue-900/20' : ''} ${isBroadcast ? 'cursor-default' : 'cursor-pointer hover:bg-gray-700/50'}`}
                  >
                    <div className="relative">
                      {isBroadcast ? (
                        <div className="w-8 h-8 bg-red-800 rounded-full flex items-center justify-center text-sm font-bold border-2 border-red-500">
                          📢
                        </div>
                      ) : notif.actor_avatar_url ? (
                        <img src={`${API_BASE_URL}${notif.actor_avatar_url}`} alt={notif.actor_username} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-xs font-bold">
                          {notif.actor_username.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      {!notif.is_read && <span className="absolute top-0 left-0 block h-2 w-2 rounded-full bg-blue-500 ring-2 ring-gray-800"></span>}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-300">
                        {isBroadcast ? (
                          <>
                            <strong className="text-white flex items-center">
                              {notif.actor_username}
                              <VerifiedBadge user={{ role: 'admin', plan: 'Free' }} />
                            </strong>
                            <p className={`mt-1 leading-relaxed ${!isExpanded && isExpandable ? 'line-clamp-3' : ''}`}>
                              {getNotificationMessage(notif)}
                            </p>
                            {isExpandable && (
                              <button onClick={(e) => toggleExpand(e, notif.id)} className="text-blue-400 text-xs font-bold mt-2 hover:underline">
                                {isExpanded ? 'Show Less' : 'Show More'}
                              </button>
                            )}
                          </>
                        ) : getNotificationMessage(notif)}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
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
