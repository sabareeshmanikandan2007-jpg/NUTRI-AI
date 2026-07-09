const PROFILE_STORAGE_KEY = 'nutriai-profile'
const PROFILE_REMINDER_MUTED_UNTIL_KEY = 'nutriai-profile-reminder-muted-until'

const REQUIRED_FIELDS = [
  { key: 'name', label: 'Full Name' },
  { key: 'age', label: 'Age' },
  { key: 'gender', label: 'Gender' },
  { key: 'height', label: 'Height' },
  { key: 'weight', label: 'Weight' },
  { key: 'activityLevel', label: 'Activity Level' },
  { key: 'goal', label: 'Weight Card' },
]

const OPTIONAL_FIELDS = []

const PLACEHOLDER_VALUES = new Set(['select', 'select...', 'choose', 'choose one', 'select gender'])

const ACTIVITY_LEVEL_MAP = {
  sedentary: 'Sedentary',
  lightly_active: 'Lightly Active',
  moderately_active: 'Moderately Active',
  very_active: 'Very Active',
  moderate: 'Moderately Active',
}

function isFilled(value) {
  if (value === null || value === undefined) {
    return false
  }

  const normalized = String(value).trim()
  if (!normalized) {
    return false
  }

  return !PLACEHOLDER_VALUES.has(normalized.toLowerCase())
}

export function readStoredProfile() {
  try {
    const rawProfile = localStorage.getItem(PROFILE_STORAGE_KEY)
    return rawProfile ? JSON.parse(rawProfile) : null
  } catch {
    return null
  }
}

export function saveStoredProfile(profile) {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
}

export function formatActivityLevel(level) {
  if (!level) return ''
  const normalized = String(level).toLowerCase().replace(/\s+/g, '_')
  return ACTIVITY_LEVEL_MAP[normalized] || level
}

export function mapApiProfileToLocal(apiProfile = {}) {
  const activityLevel = formatActivityLevel(apiProfile.activity_level)

  return {
    name: apiProfile.name || '',
    age: apiProfile.age ?? '',
    gender: apiProfile.gender || '',
    height: apiProfile.height ?? '',
    weight: apiProfile.weight ?? '',
    activityLevel,
    goal: apiProfile.goal || 'balanced',
  }
}

export function mapFormToLocalProfile(form) {
  return {
    name: form.name,
    age: form.age ? Number(form.age) : null,
    gender: form.gender,
    height: form.height,
    weight: form.weight,
    activityLevel: form.activityLevel,
    goal: form.goal.toLowerCase().replace(/\s+/g, '_'),
  }
}

export function getProfileCompletionState(profile = readStoredProfile()) {
  const source = profile || {}
  const completedRequired = REQUIRED_FIELDS.filter(({ key }) => isFilled(source[key])).length
  const missingRequiredFields = REQUIRED_FIELDS.filter(({ key }) => !isFilled(source[key]))
  const optionalMissingFields = OPTIONAL_FIELDS.filter(({ key }) => !isFilled(source[key]))

  const profileCompleted = missingRequiredFields.length === 0
  const completionPercent = Math.round((completedRequired / REQUIRED_FIELDS.length) * 100)

  return {
    profileCompleted,
    completionPercent,
    missingRequiredFields,
    optionalMissingFields,
    requiredFields: REQUIRED_FIELDS,
    optionalFields: OPTIONAL_FIELDS,
  }
}

export function syncProfileCompletionFlag(profile = readStoredProfile()) {
  const completionState = getProfileCompletionState(profile)
  const nextProfile = {
    ...(profile || {}),
    profileCompleted: completionState.profileCompleted,
    profileCompletionPercent: completionState.completionPercent,
  }

  saveStoredProfile(nextProfile)
  return {
    profile: nextProfile,
    ...completionState,
  }
}

export async function fetchAndSyncProfile(token) {
  if (!token) {
    return syncProfileCompletionFlag(readStoredProfile())
  }

  try {
    try {
      await fetch('/api/profile/init', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch {
      // Profile init is best-effort for new users.
    }

    const response = await fetch('/api/profile', {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
      return syncProfileCompletionFlag(readStoredProfile())
    }

    const data = await response.json()
    const apiProfile = data?.data
    if (!apiProfile) {
      return syncProfileCompletionFlag(readStoredProfile())
    }

    const localProfile = mapApiProfileToLocal(apiProfile)
    if (typeof apiProfile.profile_completed === 'boolean') {
      localProfile.profileCompleted = apiProfile.profile_completed
    }

    return syncProfileCompletionFlag(localProfile)
  } catch {
    return syncProfileCompletionFlag(readStoredProfile())
  }
}

export function getProfileReminderMutedUntil() {
  const value = Number(localStorage.getItem(PROFILE_REMINDER_MUTED_UNTIL_KEY) || 0)
  return Number.isFinite(value) ? value : 0
}

export function setProfileReminderMutedUntil(timestamp) {
  localStorage.setItem(PROFILE_REMINDER_MUTED_UNTIL_KEY, String(timestamp))
}

export function clearProfileReminderMutedUntil() {
  localStorage.removeItem(PROFILE_REMINDER_MUTED_UNTIL_KEY)
}

export { PROFILE_STORAGE_KEY, PROFILE_REMINDER_MUTED_UNTIL_KEY, REQUIRED_FIELDS, OPTIONAL_FIELDS }
