import { useState } from 'react';
import { motion } from 'framer-motion';
import BgDecor from './BgDecor';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { FiDroplet, FiActivity, FiTrendingUp, FiAward } from 'react-icons/fi';
import { GiMuscleUp } from 'react-icons/gi';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

const macroData = {
  labels: ['Protein', 'Carbs', 'Fat', 'Fiber'],
  datasets: [{
    data: [25, 50, 20, 5],
    backgroundColor: ['#3B82F6', '#F59E0B', '#EF4444', '#10B981'],
    borderWidth: 0,
    hoverOffset: 6,
  }],
};

const weeklyCalories = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [{
    label: 'Calories',
    data: [1800, 2100, 1950, 2200, 1750, 2050, 1900],
    fill: true,
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderColor: '#10B981',
    borderWidth: 2.5,
    pointBackgroundColor: '#10B981',
    pointRadius: 4,
    tension: 0.4,
  }],
};

const macroBar = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: 'Protein (g)',
      data: [68, 75, 72, 80, 65, 78, 70],
      backgroundColor: 'rgba(59,130,246,0.8)',
      borderRadius: 6,
    },
    {
      label: 'Carbs (g)',
      data: [200, 220, 190, 240, 180, 215, 200],
      backgroundColor: 'rgba(245,158,11,0.8)',
      borderRadius: 6,
    },
    {
      label: 'Fat (g)',
      data: [50, 55, 48, 60, 45, 52, 50],
      backgroundColor: 'rgba(239,68,68,0.8)',
      borderRadius: 6,
    },
  ],
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 11 } } },
  },
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 16 } },
  },
  cutout: '70%',
};

const barOptions = {
  ...chartOptions,
  plugins: {
    legend: { position: 'top', labels: { font: { size: 11 }, padding: 16, boxWidth: 12 } },
  },
};

const StatCard = ({ icon: Icon, title, value, unit, color, sub, progress }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    whileHover={{ y: -4 }}
    className="card p-5 border border-gray-100"
  >
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
        <Icon className="text-white text-lg" />
      </div>
      <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">{sub}</span>
    </div>
    <p className="text-xs text-gray-500 mb-1">{title}</p>
    <p className="text-2xl font-extrabold text-gray-900">
      {value}<span className="text-sm font-medium text-gray-400 ml-1">{unit}</span>
    </p>
    {progress !== undefined && (
      <div className="mt-3 progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
    )}
  </motion.div>
);

export default function Dashboard() {
  const [bmi] = useState(22.4);
  const [water, setWater] = useState(6);

  return (
    <section id="dashboard" className="relative py-24 bg-gradient-to-b from-emerald-50/30 to-white overflow-hidden">
      <BgDecor theme="fitness" />
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Live Health Metrics
          </span>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 font-[Outfit]">
            Your <span className="gradient-text">Health Dashboard</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Real-time tracking of your nutrition, fitness, and wellness metrics.
          </p>
        </motion.div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard icon={FiActivity} title="Daily Calories" value="1,543" unit="kcal" color="bg-gradient-to-br from-emerald-400 to-emerald-600" sub="75% of goal" progress={75} />
          <StatCard icon={GiMuscleUp} title="Protein Intake" value="72" unit="g" color="bg-gradient-to-br from-blue-400 to-blue-600" sub="80% of goal" progress={80} />
          <StatCard icon={FiTrendingUp} title="BMI Index" value={bmi} unit="" color="bg-gradient-to-br from-purple-400 to-purple-600" sub="Normal" />
          <StatCard icon={FiDroplet} title="Water Intake" value={water} unit="glasses" color="bg-gradient-to-br from-cyan-400 to-cyan-600" sub={`${water}/8 glasses`} progress={(water / 8) * 100} />
        </div>

        {/* Charts row */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Weekly calories line chart */}
          <div className="lg:col-span-2 card p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-gray-900">Weekly Calorie Trend</h3>
                <p className="text-xs text-gray-400">7-day overview</p>
              </div>
              <div className="flex gap-2">
                {['Week', 'Month'].map(t => (
                  <button key={t} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${t === 'Week' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-emerald-50'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ height: 220 }}>
              <Line data={weeklyCalories} options={chartOptions} />
            </div>
          </div>

          {/* Macro doughnut */}
          <div className="card p-6 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-1">Macro Breakdown</h3>
            <p className="text-xs text-gray-400 mb-4">Today&apos;s distribution</p>
            <div style={{ height: 200 }}>
              <Doughnut data={macroData} options={doughnutOptions} />
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Macro bar chart */}
          <div className="lg:col-span-2 card p-6 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-1">Weekly Macro Tracking</h3>
            <p className="text-xs text-gray-400 mb-4">Protein, carbs, and fat by day</p>
            <div style={{ height: 220 }}>
              <Bar data={macroBar} options={barOptions} />
            </div>
          </div>

          {/* BMI + Water panel */}
          <div className="flex flex-col gap-5">
            {/* BMI */}
            <div className="card p-6 border border-gray-100 flex-1">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FiAward className="text-emerald-500" />
                BMI Indicator
              </h3>
              <div className="relative mb-3">
                <div className="h-3 rounded-full bg-gradient-to-r from-blue-400 via-emerald-400 to-orange-400 to-red-500" />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 border-emerald-500 shadow transition-all"
                  style={{ left: `${((bmi - 15) / 25) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mb-3">
                <span>Underweight</span><span>Normal</span><span>Obese</span>
              </div>
              <p className="text-3xl font-extrabold gradient-text text-center">{bmi}</p>
              <p className="text-center text-xs text-emerald-600 font-semibold mt-1">Normal Weight ✓</p>
            </div>

            {/* Water tracker */}
            <div className="card p-6 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FiDroplet className="text-cyan-500" />
                Water Intake
              </h3>
              <div className="grid grid-cols-8 gap-1 mb-3">
                {[...Array(8)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setWater(i + 1)}
                    className={`h-8 rounded-lg transition-all duration-200 ${i < water ? 'bg-cyan-400 shadow-sm' : 'bg-gray-100 hover:bg-cyan-100'}`}
                  >
                    {i < water && <FiDroplet className="w-full text-white text-xs" />}
                  </button>
                ))}
              </div>
              <p className="text-sm text-center text-gray-600">
                <span className="font-bold text-cyan-500">{water}</span> of 8 glasses today
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
