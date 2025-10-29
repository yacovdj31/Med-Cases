import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import { Link } from 'react-router-dom';

export default function AdminHomePage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    (async () => {
      const res = await api.get('/admin/chat/threads');
      setItems(res.data);
    })();
  }, []);

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Users</h1>

      <div className="grid md:grid-cols-2 gap-3">
        {items.map(({ user, lastMessage, unreadForAdmin }) => (
          <Link
            to={`/admin/user/${user._id}`}
            key={user._id}
            className="p-4 bg-white rounded-lg shadow border hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold">{user.name || user.email}</div>
              {unreadForAdmin > 0 && (
                <span className="text-xs rounded-full bg-red-600 text-white px-2 py-0.5">
                  {unreadForAdmin}
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600">{user.email} · {user.country}</div>
            <div className="text-sm text-gray-500 mt-1 italic line-clamp-1">
              {lastMessage ? lastMessage.text : 'No messages yet'}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
