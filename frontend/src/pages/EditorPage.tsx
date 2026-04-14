import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const SAMPLE_LATEX = `\\documentclass[letterpaper,11pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\begin{document}

%----------HEADING----------
\\begin{center}
  \\textbf{\\Huge \\scshape Jane Doe} \\\\ \\vspace{1pt}
  \\small 123-456-7890 $|$
  \\href{mailto:jane@example.com}{jane@example.com} $|$
  \\href{https://linkedin.com/in/janedoe}{linkedin.com/in/janedoe} $|$
  \\href{https://github.com/janedoe}{github.com/janedoe}
\\end{center}

%-----------EDUCATION-----------
\\section{Education}
  \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
      \\textbf{University of Example} \\hfill Aug 2020 -- May 2024 \\\\
      Bachelor of Science in Computer Science \\hfill GPA: 3.8/4.0
    }}
  \\end{itemize}

%-----------EXPERIENCE-----------
\\section{Experience}
  \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
      \\textbf{Software Engineer Intern} \\hfill Jun 2023 -- Aug 2023 \\\\
      \\textit{Acme Corp, San Francisco, CA} \\\\
      \\begin{itemize}
        \\item Built REST API endpoints serving 10k daily users using Java Spring Boot
        \\item Reduced query latency by 40\\% by optimizing PostgreSQL indexes
        \\item Shipped feature end-to-end across backend and React frontend
      \\end{itemize}
    }}
  \\end{itemize}

%-----------PROJECTS-----------
\\section{Projects}
  \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
      \\textbf{Resolve} $|$ \\emph{React, Spring Boot, Supabase, Gemini API} \\\\
      \\begin{itemize}
        \\item AI-powered resume tailoring app that generates LaTeX resumes from job descriptions
        \\item Implemented Supabase Auth with Row Level Security across 6 database tables
        \\item Built Monaco-based in-browser LaTeX editor with PDF compilation via texlive
      \\end{itemize}
    }}
  \\end{itemize}

%-----------SKILLS-----------
\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     \\textbf{Languages}{: Java, JavaScript, TypeScript, Python, SQL} \\\\
     \\textbf{Frameworks}{: Spring Boot, React, Node.js} \\\\
     \\textbf{Tools}{: Git, Docker, Supabase, PostgreSQL}
    }}
 \\end{itemize}

\\end{document}`
import MonacoEditor from '@monaco-editor/react'
import axios from 'axios'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function EditorPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState<User | null>(null)
  const [latexCode, setLatexCode] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [copyLabel, setCopyLabel] = useState('Copy LaTeX')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate('/login'); return }
      setUser(user)
    })
    const state = location.state as { latexCode?: string } | null
    setLatexCode(state?.latexCode ?? SAMPLE_LATEX)
  }, [navigate, location])

  const handleDownload = async () => {
    setDownloading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/resume/compile`,
        { latexCode },
        {
          headers: { Authorization: `Bearer ${session?.access_token}` },
          responseType: 'blob',
        }
      )
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.download = 'resume.pdf'
      link.click()
      window.URL.revokeObjectURL(url)
    } catch {
      setError('PDF compilation failed. Check your LaTeX for errors and try again.')
    } finally {
      setDownloading(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(latexCode)
    setCopyLabel('Copied!')
    setTimeout(() => setCopyLabel('Copy LaTeX'), 2000)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (!user) return null

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'there'
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <div className="editor-layout">
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

      <div className="editor-toolbar">
        <button className="btn-ghost" onClick={() => navigate('/generate')}>← Generate</button>
        <div className="editor-toolbar-right">
          {error && <span className="editor-toolbar-error">{error}</span>}
          <button className="btn-secondary" onClick={handleCopy} disabled={!latexCode}>
            {copyLabel}
          </button>
          <button className="btn-primary editor-download-btn" onClick={handleDownload} disabled={downloading || !latexCode}>
            {downloading ? <><span className="spinner" /> Compiling…</> : 'Download PDF'}
          </button>
        </div>
      </div>

      <div className="editor-body">
        <MonacoEditor
          height="100%"
          language="latex"
          theme="vs-dark"
          value={latexCode}
          onChange={val => setLatexCode(val ?? '')}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            lineNumbers: 'on',
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            padding: { top: 20, bottom: 20 },
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            fontLigatures: true,
          }}
        />
      </div>
    </div>
  )
}
