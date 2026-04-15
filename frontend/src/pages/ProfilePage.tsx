import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
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
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) navigate('/login')
      else setUser(user)
      setLoading(false)
    })
  }, [navigate])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="profile-loading">
        <span className="spinner" /> Loading profile…
      </div>
    )
  }

  if (!user) return null

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'there'
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <div className="home-layout">
      <nav className="home-nav">
        <div className="nav-brand">
          <div className="brand-icon">R</div>
          <span className="brand-name">Resolve</span>
        </div>
        <div className="nav-user">
          <div className="user-avatar">
            {avatarUrl
              ? <img src={avatarUrl} alt={displayName} referrerPolicy="no-referrer" />
              : <span>{initials}</span>
            }
          </div>
          <span className="user-email">{user.email}</span>
          <button className="btn-secondary" onClick={handleSignOut}>Sign out</button>
        </div>
      </nav>

      <div className="profile-page">
        <div className="profile-header">
          <button className="btn-ghost" onClick={() => navigate('/')}>← Back</button>
          <div>
            <h1 className="profile-title">Profile</h1>
            <p className="profile-subtitle">Manage your personal information, work experience, education, skills, projects, and achievements.</p>
          </div>
        </div>

        <div className="profile-tabs">
          <button className={`profile-tab ${activeTab === 'personal' ? 'active' : ''}`} onClick={() => setActiveTab('personal')}>Personal Info</button>
          <button className={`profile-tab ${activeTab === 'experience' ? 'active' : ''}`} onClick={() => setActiveTab('experience')}>Work Experience</button>
          <button className={`profile-tab ${activeTab === 'education' ? 'active' : ''}`} onClick={() => setActiveTab('education')}>Education</button>
          <button className={`profile-tab ${activeTab === 'skills' ? 'active' : ''}`} onClick={() => setActiveTab('skills')}>Skills</button>
          <button className={`profile-tab ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => setActiveTab('projects')}>Projects</button>
          <button className={`profile-tab ${activeTab === 'achievements' ? 'active' : ''}`} onClick={() => setActiveTab('achievements')}>Achievements</button>
        </div>

        <div className="profile-content">
          {activeTab === 'personal' && <PersonalInfoSection userId={user.id} />}
          {activeTab === 'experience' && <WorkExperienceSection />}
          {activeTab === 'education' && <EducationSection />}
          {activeTab === 'skills' && <SkillsSection />}
          {activeTab === 'projects' && <ProjectsSection />}
          {activeTab === 'achievements' && <AchievementsSection />}
        </div>
      </div>
    </div>
  )
}
