import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User as UserIcon, LogOut, MessageSquare } from 'lucide-react';
import api from '../services/api';

const SOCKET_URL = 'http://localhost:3000/chat';

export const Chat: React.FC = () => {
  const { user, logout, signMessage } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    // 1️⃣ Initialize Socket with HMAC Handshake
    const timestamp = new Date().toISOString();
    const signature = signMessage(timestamp);

    const newSocket = io(SOCKET_URL, {
      extraHeaders: {
        'x-api-key': user.apiKey,
        'x-timestamp': timestamp,
        'x-signature': signature,
      },
      // Fallback for query if headers fail in some environments
      query: {
        'x-api-key': user.apiKey,
        'x-timestamp': timestamp,
        'x-signature': signature,
      }
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to Chat');
      newSocket.emit('identify');
    });

    newSocket.on('receive_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    setSocket(newSocket);

    // 2️⃣ Fetch Users
    api.get('/auth/get-users').then((res) => {
      setUsers(res.data.filter((u: any) => u._id !== user.id));
    });

    return () => {
      newSocket.close();
    };
  }, [user]);

  useEffect(() => {
    if (selectedUser) {
      // Fetch history (using socket or axios)
      socket?.emit('get_history', { otherUserId: selectedUser._id }, (history: any) => {
        setMessages(history);
      });
    }
  }, [selectedUser, socket]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !selectedUser || !socket) return;

    const msgData = {
      receiverId: selectedUser._id,
      content: inputValue,
    };

    socket.emit('send_message', msgData, (res: any) => {
      if (res.status === 'sent') {
        setMessages((prev) => [
          ...prev,
          { senderId: user?.id, content: inputValue, createdAt: new Date() },
        ]);
        setInputValue('');
      }
    });
  };

  return (
    <div className="flex h-screen bg-slate-950 text-white font-sans">
      {/* Sidebar */}
      <div className="w-80 border-r border-slate-800 flex flex-col bg-slate-900/50">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold">
              {user?.name[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold">{user?.name}</p>
              <p className="text-xs text-indigo-400">Online</p>
            </div>
          </div>
          <button onClick={logout} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition">
            <LogOut size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Contacts</p>
          {users.map((u) => (
            <button
              key={u._id}
              onClick={() => setSelectedUser(u)}
              className={`w-full flex items-center space-x-3 p-3 rounded-xl transition ${
                selectedUser?._id === u._id ? 'bg-indigo-500/10 border border-indigo-500/20' : 'hover:bg-slate-800/50'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                <UserIcon size={20} className="text-slate-400" />
              </div>
              <div className="text-left">
                <p className="font-medium">{u.name}</p>
                <p className="text-xs text-slate-500 truncate w-32">Click to message</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {selectedUser ? (
          <>
            <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                <UserIcon size={20} />
              </div>
              <h2 className="text-xl font-bold">{selectedUser.name}</h2>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
              <AnimatePresence>
                {messages.map((msg, i) => {
                  const isMine = msg.senderId === user?.id;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: isMine ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-4 rounded-2xl ${
                          isMine
                            ? 'bg-indigo-600 rounded-tr-none'
                            : 'bg-slate-800 rounded-tl-none'
                        }`}
                      >
                        <p>{msg.content}</p>
                        <p className="text-[10px] mt-1 opacity-50 text-right">
                          {new Date(msg.createdAt || msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            <form onSubmit={handleSendMessage} className="p-6 bg-slate-900/50 border-t border-slate-800">
              <div className="flex space-x-4 items-center bg-slate-950 p-2 rounded-2xl border border-slate-800">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent border-none focus:ring-0 p-3"
                />
                <button type="submit" className="p-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition">
                  <Send size={20} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <MessageSquare size={64} className="mb-4 opacity-20" />
            <p className="text-xl font-medium">Select a user to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};
