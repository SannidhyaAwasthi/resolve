import { useState, useEffect, useRef } from 'react'
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

// ── Spacing helper ────────────────────────────────────────────────────
function applySpacing(latex: string, percentage: number): string {
  return latex.replace(/\\vspace(\*?)\{([^}]+)\}/g, (_match, star, inner) => {
    const trimmed = inner.trim()
    const m = trimmed.match(/^(-?\d+(?:\.\d+)?)(pt|em|ex|mm|cm|in|bp|dd|pc|sp)?$/)
    if (!m) return _match
    const value = parseFloat(m[1])
    const unit = m[2] ?? ''
    const scaled = Math.round(value * (percentage / 100) * 10) / 10
    const formatted = scaled % 1 === 0 ? String(scaled) : scaled.toFixed(1)
    return `\\vspace${star}{${formatted}${unit}}`
  })
}

export default function EditorPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState<User | null>(null)
  const [latexCode, setLatexCode] = useState('')
  const [spacing, setSpacing] = useState(100)
  const [downloading, setDownloading] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showSaveBar, setShowSaveBar] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [copyLabel, setCopyLabel] = useState('Copy LaTeX')
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code')

  // Stores the LaTeX at 100% — only updated when the user manually edits
  const baseLatexRef = useRef('')
  // True while a spacing-driven setLatexCode is in flight
  const isSpacingUpdate = useRef(false)
  // Tracks current blob URL so we can revoke it before setting a new one
  const previewBlobUrl = useRef<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate('/login'); return }
      setUser(user)
    })
    const state = location.state as { latexCode?: string } | null
    const code = state?.latexCode ?? SAMPLE_LATEX
    baseLatexRef.current = code
    setLatexCode(code)
  }, [navigate, location])

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (previewBlobUrl.current) {
        URL.revokeObjectURL(previewBlobUrl.current)
      }
    }
  }, [])

  const handleSpacingChange = (newSpacing: number) => {
    setSpacing(newSpacing)
    isSpacingUpdate.current = true
    setLatexCode(applySpacing(baseLatexRef.current, newSpacing))
  }

  const handleEditorChange = (val: string | undefined) => {
    const code = val ?? ''
    if (isSpacingUpdate.current) {
      isSpacingUpdate.current = false
    } else {
      baseLatexRef.current = code
    }
    setLatexCode(code)
  }

  const compileLatex = async (): Promise<Blob> => {
    const { data: { session } } = await supabase.auth.getSession()
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/resume/compile`,
      { latexCode },
      {
        headers: { Authorization: `Bearer ${session?.access_token}` },
        responseType: 'blob',
      }
    )
    return new Blob([response.data], { type: 'application/pdf' })
  }

  const handlePreview = async () => {
    setPreviewing(true)
    setError(null)
    // Switch to preview tab on mobile
    setActiveTab('preview')
    try {
      const blob = await compileLatex()
      // Revoke previous blob URL before creating a new one
      if (previewBlobUrl.current) {
        URL.revokeObjectURL(previewBlobUrl.current)
      }
      const url = URL.createObjectURL(blob)
      previewBlobUrl.current = url
      setPreviewUrl(url)
    } catch {
      setError('PDF compilation failed. Check your LaTeX for errors and try again.')
    } finally {
      setPreviewing(false)
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    setError(null)
    try {
      const blob = await compileLatex()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'resume.pdf'
      link.click()
      URL.revokeObjectURL(url)
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

  const generatedResumeId = (location.state as { latexCode?: string; generatedResumeId?: string } | null)?.generatedResumeId ?? null

  const handleConfirmSave = async () => {
    if (!saveName.trim()) return
    setSaving(true)
    setError(null)
    try {
      const { error: dbError } = await supabase
        .from('saved_resumes')
        .insert({
          name: saveName.trim(),
          latex_code: latexCode,
          generated_resume_id: generatedResumeId,
        })
      if (dbError) throw dbError
      setSaveSuccess(true)
      setShowSaveBar(false)
      setSaveName('')
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
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
        <div className="nav-brand" onClick={() => navigate('/')}>
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
        <div className="editor-spacing-control">
          <label className="editor-spacing-label">
            Spacing <span className="editor-spacing-value">{spacing}%</span>
          </label>
          <input
            type="range"
            min={50}
            max={150}
            step={5}
            value={spacing}
            onChange={e => handleSpacingChange(Number(e.target.value))}
            className="editor-spacing-slider"
          />
        </div>

        <div className="editor-mobile-tabs">
          <button
            className={`editor-tab-btn ${activeTab === 'code' ? 'active' : ''}`}
            onClick={() => setActiveTab('code')}
          >
            Code
          </button>
          <button
            className={`editor-tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            Preview
          </button>
        </div>
      </div>

      <div className="editor-panels">
        {/* ── Left: Monaco Editor ── */}
        <div className={`editor-panel-code${activeTab === 'preview' ? ' mobile-hidden' : ''}`}>
          <MonacoEditor
            height="100%"
            language="latex"
            theme="vs-dark"
            value={latexCode}
            onChange={handleEditorChange}
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

        {/* ── Right: PDF Preview + Actions ── */}
        <div className={`editor-panel-preview${activeTab === 'code' ? ' mobile-hidden' : ''}`}>
          <div className="preview-pane">
            {previewing && (
              <div className="preview-spinner-wrap">
                <span className="spinner" />
                <span>Compiling…</span>
              </div>
            )}
            {!previewing && !previewUrl && (
              <div className="preview-placeholder">
                Click <strong>Preview</strong> to see your resume
              </div>
            )}
            {!previewing && previewUrl && (
              <iframe
                src={previewUrl}
                className="preview-iframe"
                title="Resume PDF"
              />
            )}
          </div>

          <div className="preview-actions">
            {error && <span className="editor-toolbar-error">{error}</span>}
            <div className="preview-action-buttons">
              <button
                className="btn-primary preview-action-btn"
                onClick={handlePreview}
                disabled={previewing || !latexCode}
              >
                {previewing ? <><span className="spinner" /> Compiling…</> : 'Preview'}
              </button>
              <button
                className="btn-secondary"
                onClick={handleDownload}
                disabled={downloading || !latexCode}
              >
                {downloading ? <><span className="spinner" /> Downloading…</> : 'Download PDF'}
              </button>
              <button
                className="btn-secondary"
                onClick={handleCopy}
                disabled={!latexCode}
              >
                {copyLabel}
              </button>
              {saveSuccess && (
                <span className="editor-save-success">✓ Saved</span>
              )}
              {!showSaveBar && (
                <button
                  className="btn-secondary"
                  onClick={() => setShowSaveBar(true)}
                  disabled={!latexCode}
                >
                  Save Resume
                </button>
              )}
              {showSaveBar && (
                <div className="editor-save-bar">
                  <input
                    className="editor-save-input"
                    type="text"
                    placeholder="Name this resume…"
                    value={saveName}
                    onChange={e => setSaveName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleConfirmSave()}
                    autoFocus
                  />
                  <button
                    className="btn-primary editor-save-confirm-btn"
                    onClick={handleConfirmSave}
                    disabled={!saveName.trim() || saving}
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    className="btn-ghost"
                    onClick={() => { setShowSaveBar(false); setSaveName('') }}
                  >
                    Cancel
                  </button>
                </div>
              )}
              <button
                className="btn-ghost"
                onClick={() => navigate('/generate')}
              >
                ← Generate Again
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
