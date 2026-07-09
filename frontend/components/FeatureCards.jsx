import { motion } from 'framer-motion';
import BgDecor from './BgDecor';
import { GiArtificialIntelligence } from 'react-icons/gi';
import { MdFoodBank, MdOutlineHealthAndSafety } from 'react-icons/md';
import { TbBrain, TbChartBar, TbCalendarStats } from 'react-icons/tb';
import { BsChatDotsFill } from 'react-icons/bs';
import { FiZap } from 'react-icons/fi';

const features = [
  {
    icon: GiArtificialIntelligence,
    emoji: '🍎',
    title: 'AI Diet Recommendation',
    desc: 'Generate personalized diet plans based on your age, BMI, health goals, and dietary preferences using advanced machine learning.',
    color: 'from-emerald-400 to-teal-500',
    light: 'bg-emerald-50',
    border: 'hover:border-emerald-300',
    tag: 'Personalized',
  },
  {
    icon: MdOutlineHealthAndSafety,
    emoji: '❤️',
    title: 'Health Condition Prediction',
    desc: 'Predict potential health risks such as obesity, diabetes, or nutrient deficiencies using predictive health models.',
    color: 'from-rose-400 to-pink-500',
    light: 'bg-rose-50',
    border: 'hover:border-rose-300',
    tag: 'Predictive AI',
  },
  {
    icon: TbChartBar,
    emoji: '🔥',
    title: 'Calorie Tracker',
    desc: 'Track your daily calorie intake and expenditure with beautiful visual charts and real-time progress monitoring.',
    color: 'from-orange-400 to-amber-500',
    light: 'bg-orange-50',
    border: 'hover:border-orange-300',
    tag: 'Real-time',
  },
  {
    icon: TbCalendarStats,
    emoji: '📅',
    title: 'Weekly Meal Planner',
    desc: 'Automatically generate balanced 7-day meal plans tailored to your nutritional needs, taste preferences, and health goals.',
    color: 'from-purple-400 to-violet-500',
    light: 'bg-purple-50',
    border: 'hover:border-purple-300',
    tag: 'Automated',
  },
  {
    icon: BsChatDotsFill,
    emoji: '🤖',
    title: 'AI Nutrition Chatbot',
    desc: 'Chat with our intelligent nutrition assistant for instant answers to diet queries, recipe ideas, and wellness advice.',
    color: 'from-emerald-500 to-green-600',
    light: 'bg-emerald-50',
    border: 'hover:border-emerald-300',
    tag: 'Conversational AI',
  },
  {
    icon: TbBrain,
    emoji: '🧠',
    title: 'Reinforcement Learning Planner',
    desc: 'Our adaptive AI continuously learns from your eating patterns to optimize diet recommendations over time.',
    color: 'from-indigo-400 to-blue-500',
    light: 'bg-indigo-50',
    border: 'hover:border-indigo-300',
    tag: 'Adaptive AI',
  },
  {
    icon: FiZap,
    emoji: '⚡',
    title: 'Instant Insights',
    desc: 'Get real-time nutritional breakdowns, macro balances, micronutrient gaps, and evidence-based dietary recommendations.',
    color: 'from-yellow-400 to-orange-400',
    light: 'bg-yellow-50',
    border: 'hover:border-yellow-300',
    tag: 'Instant',
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function FeatureCards() {
  return (
    <section id="features" className="relative py-24 bg-gradient-to-b from-white to-emerald-50/30 overflow-hidden">
      <BgDecor theme="food" />
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Powerful Features
          </span>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 font-[Outfit]">
            Everything You Need for a{' '}
            <span className="gradient-text">Healthier Life</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Our AI-powered platform combines cutting-edge technology with nutritional science
            to deliver a truly personalized health experience.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              variants={cardVariants}
              whileHover={{ y: -8, scale: 1.02 }}
              className={`card p-6 border border-gray-100 ${feature.border} cursor-pointer group`}
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg shadow-current/20 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="text-white text-xl" />
              </div>

              {/* Tag */}
              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${feature.light} text-gray-600 mb-3`}>
                {feature.emoji} {feature.tag}
              </span>

              {/* Title */}
              <h3 className="text-base font-bold text-gray-900 mb-2 leading-snug group-hover:text-emerald-600 transition-colors duration-200">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-500 leading-relaxed">
                {feature.desc}
              </p>

              {/* Learn more */}
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-emerald-600 opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-2 group-hover:translate-x-0">
                Learn more →
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
