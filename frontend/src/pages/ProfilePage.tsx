import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PersonalInfoSection from '../components/PersonalInfoSection'
import WorkExperienceSection from '../components/WorkExperienceSection'
import EducationSection from '../components/EducationSection'
import SkillsSection from '../components/SkillsSection'
import ProjectsSection from '../components/ProjectsSection'
import AchievementsSection from '../components/AchievementsSection'

type Tab = 'personal' | 'experience' | 'education' | 'skills' | 'projects' | 'achievements'

export default function ProfilePage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('personal')
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate('/login')
      } else {
        setUserId(user.id)
      }
      setLoading(false)
    })
  }, [navigate])

  if (loading) {
    return (
      <div className="profile-loading">
        <span className="spinner" /> Loading profile…
      </div>
    )
  }

  if (!userId) return null

  return (
    <div className="profile-page">
      <div className="profile-header">
        <button className="btn-ghost" onClick={() => navigate('/')}>
          ← Back
        </button>
        <div>
          <h1 className="profile-title">Profile</h1>
          <p className="profile-subtitle">Manage your personal information, work experience, education, skills, projects, and achievements.</p>
        </div>
      </div>

      <div className="profile-tabs">
        <button
          className={`profile-tab ${activeTab === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          Personal Info
        </button>
        <button
          className={`profile-tab ${activeTab === 'experience' ? 'active' : ''}`}
          onClick={() => setActiveTab('experience')}
        >
          Work Experience
        </button>
        <button
          className={`profile-tab ${activeTab === 'education' ? 'active' : ''}`}
          onClick={() => setActiveTab('education')}
        >
          Education
        </button>
        <button
          className={`profile-tab ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveTab('skills')}
        >
          Skills
        </button>
        <button
          className={`profile-tab ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          Projects
        </button>
        <button
          className={`profile-tab ${activeTab === 'achievements' ? 'active' : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          Achievements
        </button>
      </div>

      <div className="profile-content">
        {activeTab === 'personal' && <PersonalInfoSection userId={userId} />}
        {activeTab === 'experience' && <WorkExperienceSection />}
        {activeTab === 'education' && <EducationSection />}
        {activeTab === 'skills' && <SkillsSection />}
        {activeTab === 'projects' && <ProjectsSection />}
        {activeTab === 'achievements' && <AchievementsSection />}
      </div>
    </div>
  )
}

