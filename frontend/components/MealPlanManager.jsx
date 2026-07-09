import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronDown, FaChevronUp, FaMagic, FaSave, FaCheck } from 'react-icons/fa';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function MealPlanManager({ goal = 'maintain', calories, onSavePlan }) {
  const [mealPlan, setMealPlan] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedDay, setExpandedDay] = useState(days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]);
  const [saveStatus, setSaveStatus] = useState(null);

  // Load existing plan from backend if available
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const token = localStorage.getItem('nutriai-auth-token');
        if (!token) return;

        const response = await fetch('/api/meal-plan/stored', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.data && result.data.meal_plan && Object.keys(result.data.meal_plan).length > 0) {
            setMealPlan(result.data.meal_plan);
          }
        }
      } catch (_error) {
        console.error('Error fetching meal plan:', _error);
      }
    };
    fetchPlan();
  }, []);

  const generatePlan = async () => {
    setIsGenerating(true);
    try {
      const g = goal.toLowerCase().replace(' ', '_');
      const response = await fetch(`/api/meal-plan?goal=${g}&calories=${calories}`);
      if (response.ok) {
        const data = await response.json();
        // The API returns a 7-day plan in a 'days' array
        if (data.days && Array.isArray(data.days)) {
          const mappedPlan = {};
          data.days.forEach(dayObj => {
            mappedPlan[dayObj.day.toLowerCase()] = {
              breakfast: dayObj.breakfast || '',
              lunch: dayObj.lunch || '',
              dinner: dayObj.dinner || ''
            };
          });
          setMealPlan(mappedPlan);
        }
      }
    } catch (_error) {
      console.error('Error generating plan:', _error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMealChange = (day, mealType, value) => {
    setMealPlan(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [mealType]: value
      }
    }));
    setSaveStatus(null);
  };

  const saveToBackend = async () => {
    setSaveStatus('saving');
    try {
      const token = localStorage.getItem('nutriai-auth-token');
      const response = await fetch('/api/meal-plan/store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ meal_plan: mealPlan })
      });

      if (response.ok) {
        setSaveStatus('success');
        if (onSavePlan) onSavePlan(mealPlan);
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    }
  };

  const isPlanEmpty = Object.keys(mealPlan).length === 0;

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 text-left">7-Day Meal Scheduler</h3>
          <p className="text-sm text-slate-500 text-left">Set your plan to receive personalized email reminders.</p>
        </div>
        <button
          type="button"
          onClick={generatePlan}
          disabled={isGenerating}
          className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-100 disabled:opacity-50"
        >
          <FaMagic className={isGenerating ? 'animate-spin' : ''} />
          {isGenerating ? 'Generating...' : 'Auto-Generate'}
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white">
        {isPlanEmpty ? (
          <div className="p-8 text-center">
            <p className="text-slate-500">No meal plan set yet. Use Auto-Generate to get started!</p>
          </div>
        ) : (
          <div className="divide-y divide-emerald-50 text-left">
            {days.map(day => {
              const dayKey = day.toLowerCase();
              const isExpanded = expandedDay === day;
              const dayMeals = mealPlan[dayKey] || { breakfast: '', lunch: '', dinner: '' };

              return (
                <div key={day} className="group transition-colors hover:bg-emerald-50/30">
                  <header
                    onClick={() => setExpandedDay(isExpanded ? null : day)}
                    className="flex cursor-pointer items-center justify-between px-5 py-4"
                  >
                    <span className="font-semibold text-slate-800">{day}</span>
                    <div className="flex items-center gap-4 text-emerald-600">
                      <span className="text-xs font-medium text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {dayMeals.breakfast ? 'Plan Set ✓' : 'Empty'}
                      </span>
                      {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                    </div>
                  </header>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden bg-slate-50/50"
                      >
                        <div className="grid gap-4 p-5 sm:grid-cols-3">
                          <MealInput
                            label="Breakfast"
                            emoji="🍳"
                            value={dayMeals.breakfast}
                            onChange={(e) => handleMealChange(dayKey, 'breakfast', e.target.value)}
                          />
                          <MealInput
                            label="Lunch"
                            emoji="🍛"
                            value={dayMeals.lunch}
                            onChange={(e) => handleMealChange(dayKey, 'lunch', e.target.value)}
                          />
                          <MealInput
                            label="Dinner"
                            emoji="🌙"
                            value={dayMeals.dinner}
                            onChange={(e) => handleMealChange(dayKey, 'dinner', e.target.value)}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!isPlanEmpty && (
        <div className="flex items-center justify-end gap-3 pt-2">
           {saveStatus === 'success' && (
            <span className="text-sm font-medium text-emerald-600 flex items-center gap-1">
              <FaCheck /> Plan saved successfully
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-sm font-medium text-red-600">Failed to save plan</span>
          )}
          <button
            type="button"
            onClick={saveToBackend}
            disabled={saveStatus === 'saving'}
            className="btn-green flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold shadow-lg shadow-emerald-200 transition active:scale-95 disabled:opacity-50"
          >
            <FaSave />
            {saveStatus === 'saving' ? 'Saving...' : 'Save Schedule'}
          </button>
        </div>
      )}
    </div>
  );
}

function MealInput({ label, emoji, value, onChange }) {
  return (
    <div className="space-y-1.5 ">
      <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
        <span className="text-sm">{emoji}</span> {label}
      </span>
      <textarea
        value={value}
        onChange={onChange}
        rows={2}
        placeholder={`What's for ${label.toLowerCase()}?`}
        className="w-full resize-none rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition duration-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
      />
    </div>
  );
}
