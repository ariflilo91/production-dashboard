'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import TopNav from '@/components/TopNav'
import { supabase, getProjects, Project } from '@/lib/supabase'

const COLORS = [
  '#378ADD','#1D9E75','#D85A30','#7F77DD','#D4537E','#BA7517',
  '#E05C9A','#20A8A8','#8B6FE8','#D4693A','#4CAF50','#FF7043',
]

export default function ProjectSettingsPage({ params }: { params: { project: string } }) {
  const projectId = params.project
  const router    = useRouter()

  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [project, setProject]         = useState<Project | null>(null)
  const [name, setName]               = useState('')
  const [code, setCode]               = useState('')
  const [color, setColor]             = useState('')
  const [status, setStatus]           = useState('Active')
  const [notes, setNotes]             = useState('')
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const [deleting, setDeleting]       = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [shareToast, setShareToast]   = useState(false)
  const [error, setError]             = useState('')

  useEffect(() => {
    async function load() {
      const [projs, { data: proj }] = await Promise.all([
        getProjects(),
        supabase.from('projects').select('*').eq('id', projectId).single(),
      ])
      setAllProjects(projs)
      if (proj) {
        setProject(proj); setName(proj.name); setCode(proj.code || '')
        setColor(proj.color); setStatus(proj.status); setNotes(proj.notes || '')
      }
    }
    load()
  }, [projectId])

  async function handleSave() {
    setSaving(true); setError(''); setSaved(false)
    try {
      const { error: err } = await supabase.from('projects').update({
        name, code, color, status, notes, updated_at: new Date().toISOString()
      }).eq('id', projectId)
      if (err) throw err
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to save.') }
    setSaving(false)
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      // Delete tasks, episodes, departments, holidays, then project
      await supabase.from('tasks').delete().eq('project_id', projectId)
      await supabase.from('episodes').delete().eq('project_id', projectId)
      await supabase.from('departments').delete().eq('project_id', projectId)
      await supabase.from('holidays').delete().eq('project_id', projectId)
      await supabase.from('projects').delete().eq('id', projectId)
      router.push('/')
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to delete.'); setDeleting(false) }
  }

  function handleShare() {
    const url = `${window.location.origin}/${projectId}`
    navigator.clipboard.writeText(url).then(() => {
      setShareToast(true)
      setTimeout(() => setShareToast(false), 3000)
    })
  }

  const inp: React.CSSProperties = {
    width: '100%', height: 38, padding: '0 12px', borderRadius: 8,
    border: '1px solid var(--border)', background: 'var(--bg-hover)',
    color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit',
  }
  const lbl: React.CSSProperties = {
    fontSize: 10, color: 'var(--text-dim)', display: 'block',
    marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em',
  }

  if (!project) return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', color: 'var(--text-dim)' }}>Loading...</div>
  )

  const sidebarProjects = allProjects.map(p => ({ id: p.id, name: p.name, color: p.color }))

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Sidebar projects={sidebarProjects} activeProjectId={projectId} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopNav breadcrumbs={[{ label: project.name }, { label: 'Settings' }]} />
        <div style={{ padding: 24, maxWidth: 560 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>Project settings</div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-sub)', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 16 }}>

            <div>
              <label style={lbl}>Project / IP name</label>
              <input value={name} onChange={e => setName(e.target.value)} style={inp} />
            </div>

            <div>
              <label style={lbl}>Project code</label>
              <input value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. DF-S2" style={{ ...inp, width: 200 }} />
            </div>

            <div>
              <label style={lbl}>Project colour</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)} style={{ width: 30, height: 30, borderRadius: '50%', background: c, cursor: 'pointer', border: color === c ? '3px solid var(--text-primary)' : '3px solid transparent', transform: color === c ? 'scale(1.2)' : 'scale(1)', transition: 'all 0.15s', outline: 'none', flexShrink: 0 }} />
                ))}
              </div>
            </div>

            <div>
              <label style={lbl}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} style={inp}>
                {['Active','Planning','On hold','Completed'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label style={lbl}>Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Broadcaster, delivery format, requirements..." style={{ ...inp, height: 'auto', padding: '10px 12px', resize: 'vertical', lineHeight: 1.6 }} />
            </div>

            {error && <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red-bdr)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--red)' }}>{error}</div>}
            {saved && <div style={{ background: 'var(--green-bg)', border: '1px solid var(--green-bdr)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>Settings saved!</div>}

            <button onClick={handleSave} disabled={saving} style={{ height: 40, borderRadius: 9, background: 'var(--blue-bg)', color: 'var(--blue)', border: '1px solid var(--blue-bdr)', fontSize: 13, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.6 : 1, fontFamily: 'inherit' }}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>

          {/* Share */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-sub)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Share project</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 14, lineHeight: 1.6 }}>
              Copy the project link to share with your team or stakeholders. Anyone with the link can view this project's timeline.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, height: 36, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-hover)', padding: '0 12px', display: 'flex', alignItems: 'center', fontSize: 11, color: 'var(--text-dim)', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {typeof window !== 'undefined' ? `${window.location.origin}/${projectId}` : `.../${projectId}`}
              </div>
              <button onClick={handleShare} style={{ height: 36, padding: '0 16px', borderRadius: 7, background: 'var(--blue-bg)', color: 'var(--blue)', border: '1px solid var(--blue-bdr)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                Copy link
              </button>
            </div>
            {shareToast && (
              <div style={{ marginTop: 10, fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>✓ Link copied to clipboard!</div>
            )}
          </div>

          {/* Danger zone */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--red-bdr)', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)', marginBottom: 6 }}>Danger zone</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 14, lineHeight: 1.6 }}>
              Permanently delete this project and all its tasks, episodes, departments, and holidays. This cannot be undone.
            </div>
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)} style={{ height: 36, padding: '0 16px', borderRadius: 7, border: '1px solid var(--red-bdr)', color: 'var(--red)', background: 'transparent', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Delete project
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>Are you sure? This cannot be undone.</div>
                <button onClick={handleDelete} disabled={deleting} style={{ height: 36, padding: '0 16px', borderRadius: 7, border: 'none', background: 'var(--red)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: deleting ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                  {deleting ? 'Deleting...' : 'Yes, delete permanently'}
                </button>
                <button onClick={() => setConfirmDelete(false)} style={{ height: 36, padding: '0 12px', borderRadius: 7, border: '1px solid var(--border)', color: 'var(--text-dim)', background: 'transparent', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
