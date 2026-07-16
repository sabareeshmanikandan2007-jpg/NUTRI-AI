import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiX, FiMic, FiRefreshCw } from 'react-icons/fi';
import { BsChatDotsFill } from 'react-icons/bs';
import { GiLeafSwirl } from 'react-icons/gi';
import { apiFetch } from '../scripts/api';

const INITIAL_MESSAGES = [
  {
    id: 1,
    sender: 'ai',
    text: "👋 Hi! I'm NutriAI, your personal nutrition assistant. I can help you with personalized diet advice, meal suggestions, calorie information, and more. What would you like to know?",
    time: 'Just now',
  },
];

const QUICK_REPLIES = [
  'Best foods for weight loss?',
  'How many calories daily?',
  'Create a meal plan for me',
  'Foods high in protein?',
];

async function getAIResponse(text) {
  try {
    const res = await apiFetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('Chat API error:', res.status, errorData);
      throw new Error(`Chat API error: ${errorData.error || res.statusText}`);
    }

    const data = await res.json();
    return data.reply || 'I could not generate a response right now. Please try again.';
  } catch (error) {
    console.error('Chat request failed:', error);
    return 'I am having trouble reaching the AI service right now. Please try again in a moment.';
  }
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const nextMessageId = useRef(2);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText) return;
    setInput('');
    const userMsg = { id: nextMessageId.current++, sender: 'user', text: userText, time: 'Just now' };
    setMessages(prev => [...prev, userMsg]);
    setTyping(true);
    const reply = await getAIResponse(userText);
    setTyping(false);
    const aiMsg = { id: nextMessageId.current++, sender: 'ai', text: reply, time: 'Just now' };
    setMessages(prev => [...prev, aiMsg]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetChat = () => setMessages(INITIAL_MESSAGES);

  return (
    <>
      {/* Floating button */}
      <motion.button
        id="chatbot-toggle"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 2, type: 'spring', stiffness: 200 }}
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-2xl shadow-emerald-500/40 pulse-green ${open ? 'hidden' : 'flex'}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <BsChatDotsFill className="text-white text-xl" />
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">1</span>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-24px)] rounded-2xl shadow-2xl shadow-emerald-900/20 overflow-hidden border border-emerald-100"
            style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-700 p-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <GiLeafSwirl className="text-white text-lg" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">NutriAI Assistant</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-300" />
                    <span className="text-emerald-100 text-[11px]">Online · Nutrition Expert</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={resetChat} className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                  <FiRefreshCw size={13} />
                </button>
                <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                  <FiX size={14} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white" style={{ minHeight: 0 }}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'ai' && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                      <GiLeafSwirl className="text-white text-[10px]" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                      msg.sender === 'ai'
                        ? 'chat-bubble-ai'
                        : 'chat-bubble-user'
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {typing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                    <GiLeafSwirl className="text-white text-[10px]" />
                  </div>
                  <div className="chat-bubble-ai px-4 py-3 flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.span
                        key={i}
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        className="w-1.5 h-1.5 rounded-full bg-white/70"
                      />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick replies */}
            <div className="px-3 py-2 flex gap-2 overflow-x-auto bg-white border-t border-gray-100 flex-shrink-0">
              {QUICK_REPLIES.map((reply) => (
                <button
                  key={reply}
                  onClick={() => sendMessage(reply)}
                  className="flex-shrink-0 text-[11px] font-medium px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                >
                  {reply}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2 flex-shrink-0">
              <button className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-emerald-50 flex items-center justify-center text-gray-400 hover:text-emerald-600 transition-colors">
                <FiMic size={16} />
              </button>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about nutrition..."
                className="flex-1 bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none border border-gray-200 focus:border-emerald-400 transition-colors"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => sendMessage()}
                disabled={!input.trim()}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiSend size={14} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
