import React from 'react';
import { formatDistanceToNow } from 'date-fns';

const NotificationsModal = ({ notifications, onClose, onNotificationClick }) => {

  const getNotificationMessage = (notification) => {
    const actor = <strong className="text-white">{notification.actor_username}</strong>;
    const preview = <em className="text-gray-400">"{notification.content_preview}..."</em>;

    switch (notification.type) {
      case 'mention_post':
        return <>{actor} mentioned you in a post: {preview}</>;
      case 'mention_comment':
        return <>{actor} mentioned you in a comment: {preview}</>;
      case 'reply_post':
        return <>{actor} replied to your post.</>;
      case 'reply_comment':
        return <>{actor} replied to your comment: {preview}</>;
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
              {notifications.map(notif => (
                <div 
                  key={notif.id} 
                  onClick={() => onNotificationClick(notif)}
                  className={`p-4 border-b border-gray-700/50 flex items-start gap-3 cursor-pointer hover:bg-gray-700/50 transition-colors ${!notif.is_read ? 'bg-blue-900/20' : ''}`}
                >
                  <div className="relative">
                    {notif.actor_avatar_url ? (
                      <img src={`http://127.0.0.1:8000${notif.actor_avatar_url}`} alt={notif.actor_username} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-xs font-bold">
                        {notif.actor_username.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    {!notif.is_read && <span className="absolute top-0 left-0 block h-2 w-2 rounded-full bg-blue-500 ring-2 ring-gray-800"></span>}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-300">
                      {getNotificationMessage(notif)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal;
