import { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import { motion } from 'framer-motion'
import { FaFire, FaHistory } from 'react-icons/fa'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function ProgressCharts() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const token = localStorage.getItem('nutriai-auth-token')
        const response = await fetch('/api/progress', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const result = await response.json()
        if (result.success) {
          setData(result.data)
        }
      } catch (err) {
        console.error('Progress fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProgress()
  }, [])

  if (loading) return <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
  if (!data) return null

  const burnData = {
    labels: data.calorie_burn?.map((d) => {
      const date = new Date(d.date)
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    }) || [],
    datasets: [
      {
        label: 'Calories Burned',
        data: data.calorie_burn?.map((d) => d.burn) || [],
        borderColor: 'rgb(244, 63, 94)',
        backgroundColor: 'rgba(244, 63, 94, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Calories Consumed',
        data: data.calorie_burn?.map((d) => d.intake) || [],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 6
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      y: { 
        beginAtZero: true,
        grid: { color: '#f1f5f9' }
      },
      x: {
        grid: { display: false }
      }
    },
  }

  return (
    <div className="grid gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-rose-100 bg-white p-6 shadow-sm"
      >
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
            <FaFire />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Daily Active Chart</h3>
            <p className="text-xs text-slate-500">Estimated total calorie burn</p>
          </div>
        </div>
        <div className="h-64">
          <Line data={burnData} options={chartOptions} />
        </div>
      </motion.div>
    </div>
  )
}
