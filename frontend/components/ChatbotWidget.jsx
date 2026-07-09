import { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FiMessageCircle, FiSend, FiX } from 'react-icons/fi'

export default function ChatbotWidget({ profileComplete = true, onCompleteProfile }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', text: 'Hi! I\'m NutriAI. Ask me anything about nutrition, meal suggestions, or your diet goals.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading || !profileComplete) return

    // Add user message
    const userMessage = { id: Date.now(), role: 'user', text: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Get user profile for context
      const profileStr = localStorage.getItem('nutriai-profile')
      const profile = profileStr ? JSON.parse(profileStr) : null

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          context: {
            userName: profile?.name || 'User',
            weight: profile?.weight || 70,
            goal: 'Maintain',
            activityLevel: profile?.activityLevel || 'Moderately Active',
          }
        }),
      })

      const data = await response.json()
      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        text: data?.reply || 'I couldn\'t process that. Please try again.'
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        text: 'Sorry, I\'m having trouble connecting. Please try again later.'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.95 }}
            className="mb-3 w-80 rounded-2xl border border-emerald-100 bg-white p-4 shadow-2xl flex flex-col h-96"
          >
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-800">NutriAI Chatbot</h4>
              <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-700">
                <FiX />
              </button>
            </div>
            
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-2">
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    msg.role === 'assistant'
                      ? 'bg-emerald-50 text-slate-800 rounded-bl-sm self-start'
                      : 'bg-emerald-500 text-white rounded-br-sm ml-auto'
                  }`}
                >
                  {msg.text}
                </motion.div>
              ))}
              {loading && (
                <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-emerald-50 px-3 py-2 text-sm text-slate-600">
                  <span className="inline-block">Thinking</span>
                  <span className="ml-1 inline-block animate-bounce">.</span>
                  <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="flex items-center gap-2">
              {!profileComplete ? (
                <div className="mb-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-slate-700">
                  Complete your profile to unlock personalized AI chat recommendations.
                  <button
                    type="button"
                    onClick={onCompleteProfile}
                    className="ml-2 font-semibold text-emerald-700 underline underline-offset-2"
                  >
                    Complete Profile
                  </button>
                </div>
              ) : null}
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask NutriAI..."
                disabled={loading || !profileComplete}
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 disabled:bg-grey-50"
              />
              <button 
                onClick={handleSend}
                disabled={loading || !input.trim() || !profileComplete}
                className="rounded-xl bg-emerald-500 p-2 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <FiSend />
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button
        onClick={() => setOpen((previous) => !previous)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl transition hover:bg-emerald-600"
      >
        <FiMessageCircle className="text-xl" />
      </button>
    </div>
  )
}
