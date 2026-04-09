'use client'
import { useEffect, useState, useRef } from 'react'
import Sidebar from '@/components/Sidebar'
import TopNav from '@/components/TopNav'
import { getProjects, getNotes, upsertNote, deleteNote, toggleNotePin, Note, Project } from '@/lib/supabase'

// ─── Color palette ───────────────────────────────────
const NOTE_COLORS: { id: string; label: string; bg: string; border: string; text: string; header: string }[] = [
  { id: 'yellow', label: 'Yellow',  bg: '#2a2200', border: '#5a4800', text: '#e8d87a', header: '#c8b840' },
  { id: 'green',  label: 'Green',   bg: '#0a2010', border: '#184828', text: '#7acf8a', header: '#4aaf5a' },
  { id: 'blue',   label: 'Blue',    bg: '#0a1828', border: '#1a3860', text: '#7ab8eb', header: '#3a88db' },
  { id: 'pink',   label: 'Pink',    bg: '#280a18', border: '#581838', text: '#eb7ab8', header: '#db3a88' },
  { id: 'purple', label: 'Purple',  bg: '#180a28', border: '#381858', text: '#b87aeb', header: '#8838db' },
  { id: 'orange', label: 'Orange',  bg: '#281400', border: '#583000', text: '#ebb87a', header: '#db8838' },
  { id: 'teal',   label: 'Teal',    bg: '#0a2228', border: '#185058', text: '#7ae8eb', header: '#38c8db' },
  { id: 'gray',   label: 'Gray',    bg: '#1a1a18', border: '#2a2a27', text: '#a8a6a0', header: '#888780' },
]

const lightColors: Record<string, { bg: string; border: string; text: string; header: string }> = {
  yellow: { bg: '#fff9e0', border: '#f0d840', text: '#4a3a00', header: '#7a6000' },
  green:  { bg: '#e8f8ec', border: '#80d890', text: '#0a3018', header: '#187030' },
  blue:   { bg: '#e0eef8', border: '#80b8e8', text: '#0a1848', header: '#184888' },
  pink:   { bg: '#f8e0ec', border: '#e880b8', text: '#480a28', header: '#880848' },
  purple: { bg: '#f0e0f8', border: '#c880e8', text: '#280a48', header: '#580888' },
  orange: { bg: '#fff0e0', border: '#f0a840', text: '#481400', header: '#883000' },
  teal:   { bg: '#e0f8f8', border: '#80d8e8', text: '#0a2848', header: '#087888' },
  gray:   { bg: '#f0f0ee', border: '#c0c0bc', text: '#2a2a28', header: '#686860' },
}

function getColor(colorId: string, theme: 'dark' | 'light') {
  if (theme === 'light') return lightColors[colorId] ?? lightColors.yellow
  return NOTE_COLORS.find(c => c.id === colorId) ?? NOTE_COLORS[0]
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  if (d > 0) return `${d}d ago`
  if (h > 0) return `${h}h ago`
  if (m > 0) return `${m}m ago`
  return 'just now'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ─── Note Card ───────────────────────────────────────
function NoteCard({ note, theme, onEdit, onDelete, onTogglePin, onClick }: {
  note: Note; theme: 'dark' | 'light'
  onEdit: () => void; onDelete: () => void; onTogglePin: () => void; onClick: () => void
}) {
  const col = getColor(note.color, theme)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div
      style={{ background: col.bg, border: `1px solid ${col.border}`, borderRadius: 12, padding: 0, cursor: 'pointer', transition: 'all 0.15s', position: 'relative', display: 'flex', flexDirection: 'column', breakInside: 'avoid', marginBottom: 14 }}
      onClick={onClick}
    >
      {/* Pin indicator */}
      {note.pinned && (
        <div style={{ position: 'absolute', top: -6, right: 12, fontSize: 16, transform: 'rotate(45deg)', zIndex: 2 }}>📌</div>
      )}

      {/* Color header bar */}
      <div style={{ height: 4, background: col.header, borderRadius: '12px 12px 0 0' }} />

      <div style={{ padding: '12px 14px 10px' }}>
        {/* Title */}
        <div style={{ fontSize: 13, fontWeight: 700, color: col.header, marginBottom: 6, lineHeight: 1.3, paddingRight: 20 }}>
          {note.title}
        </div>

        {/* Body preview */}
        {note.body && (
          <div style={{ fontSize: 12, color: col.text, lineHeight: 1.6, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {note.body}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: `1px solid ${col.border}` }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: col.header }}>{note.author}</div>
            <div style={{ fontSize: 9, color: col.text, opacity: 0.7 }}>{timeAgo(note.created_at)}</div>
          </div>

          {/* Actions */}
          <div ref={menuRef} style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowMenu(s => !s)} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${col.border}`, background: 'transparent', color: col.text, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ···
            </button>
            {showMenu && (
              <div style={{ position: 'absolute', bottom: '110%', right: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', zIndex: 50, minWidth: 140, overflow: 'hidden' }}>
                <button onClick={() => { onEdit(); setShowMenu(false) }} style={{ width: '100%', padding: '9px 14px', background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: 12, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
                  ✏️ Edit note
                </button>
                <button onClick={() => { onTogglePin(); setShowMenu(false) }} style={{ width: '100%', padding: '9px 14px', background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: 12, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
                  📌 {note.pinned ? 'Unpin' : 'Pin to top'}
                </button>
                <div style={{ height: 1, background: 'var(--border-sub)', margin: '2px 0' }} />
                <button onClick={() => { if (confirm('Delete this note?')) { onDelete(); setShowMenu(false) } }} style={{ width: '100%', padding: '9px 14px', background: 'none', border: 'none', color: 'var(--red)', fontSize: 12, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
                  🗑️ Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Note Modal (view + edit) ────────────────────────
function NoteModal({ note, theme, onSave, onClose }: {
  note: Partial<Note> | null; theme: 'dark' | 'light'
  onSave: (n: Partial<Note>) => Promise<void>; onClose: () => void
}) {
  const isNew = !note?.id
  const [title, setTitle]   = useState(note?.title ?? '')
  const [body, setBody]     = useState(note?.body ?? '')
  const [author, setAuthor] = useState(note?.author ?? '')
  const [color, setColor]   = useState(note?.color ?? 'yellow')
  const [pinned, setPinned] = useState(note?.pinned ?? false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(isNew)
  const col = getColor(color, theme)

  async function save() {
    if (!title.trim()) return
    setSaving(true)
    await onSave({ id: note?.id, title: title.trim(), body: body.trim(), author: author.trim() || 'Anonymous', color, pinned })
    setSaving(false)
    onClose()
  }

  const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${col.border}`, background: col.bg, color: col.text, fontSize: 13, fontFamily: 'inherit', resize: 'none' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: col.bg, border: `1px solid ${col.border}`, borderRadius: 16, width: '100%', maxWidth: 540, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 48px rgba(0,0,0,0.5)', overflow: 'hidden' }}>

        {/* Color header */}
        <div style={{ height: 5, background: col.header }} />

        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Title */}
              <input
                value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Note title..." autoFocus
                style={{ ...inp, fontSize: 16, fontWeight: 700, height: 44 }}
              />

              {/* Body */}
              <textarea
                value={body} onChange={e => setBody(e.target.value)}
                placeholder="Write your note here..." rows={8}
                style={{ ...inp, lineHeight: 1.7 }}
              />

              {/* Author */}
              <input
                value={author} onChange={e => setAuthor(e.target.value)}
                placeholder="Your name (e.g. Arif)"
                style={{ ...inp, height: 38, fontSize: 12 }}
              />

              {/* Color picker */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: col.header, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>Colour</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {NOTE_COLORS.map(c => (
                    <button key={c.id} onClick={() => setColor(c.id)} title={c.label} style={{ width: 26, height: 26, borderRadius: '50%', background: c.header, cursor: 'pointer', border: color === c.id ? '3px solid var(--text-primary)' : '3px solid transparent', transform: color === c.id ? 'scale(1.2)' : 'scale(1)', transition: 'all 0.15s', outline: 'none', flexShrink: 0 }} />
                  ))}
                </div>
              </div>

              {/* Pin toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: col.text }}>
                <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} style={{ width: 14, height: 14, cursor: 'pointer' }} />
                📌 Pin this note to the top
              </label>
            </div>
          ) : (
            // View mode
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, gap: 10 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: col.header, lineHeight: 1.3, flex: 1 }}>{note?.title}</div>
                {note?.pinned && <span style={{ fontSize: 18 }}>📌</span>}
              </div>
              {note?.body && (
                <div style={{ fontSize: 14, color: col.text, lineHeight: 1.8, whiteSpace: 'pre-wrap', marginBottom: 20 }}>
                  {note.body}
                </div>
              )}
              <div style={{ paddingTop: 16, borderTop: `1px solid ${col.border}`, display: 'flex', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: col.header }}>{note?.author}</div>
                  <div style={{ fontSize: 10, color: col.text, opacity: 0.7 }}>{note?.created_at ? formatDate(note.created_at) : ''}</div>
                </div>
                {note?.updated_at !== note?.created_at && (
                  <div style={{ fontSize: 10, color: col.text, opacity: 0.5, alignSelf: 'flex-end' }}>
                    edited {timeAgo(note?.updated_at ?? '')}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div style={{ padding: '12px 20px', borderTop: `1px solid ${col.border}`, display: 'flex', gap: 8, background: col.bg }}>
          {editing ? (
            <>
              <button onClick={save} disabled={saving || !title.trim()} style={{ flex: 1, height: 38, borderRadius: 8, background: col.header, color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: saving || !title.trim() ? 'not-allowed' : 'pointer', opacity: saving || !title.trim() ? 0.5 : 1, fontFamily: 'inherit' }}>
                {saving ? 'Saving...' : isNew ? 'Add note' : 'Save changes'}
              </button>
              {!isNew && <button onClick={() => setEditing(false)} style={{ height: 38, padding: '0 16px', borderRadius: 8, border: `1px solid ${col.border}`, background: 'transparent', color: col.text, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>}
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} style={{ height: 38, padding: '0 16px', borderRadius: 8, background: col.header, color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>✏️ Edit</button>
              <button onClick={onClose} style={{ height: 38, padding: '0 16px', borderRadius: 8, border: `1px solid ${col.border}`, background: 'transparent', color: col.text, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Close</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────
export default function NotesPage() {
  const [projects, setProjects]   = useState<Project[]>([])
  const [notes, setNotes]         = useState<Note[]>([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState<Partial<Note> | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch]       = useState('')
  const [filterColor, setFilterColor] = useState('')
  const [theme, setTheme]         = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    // detect theme
    const isDark = !document.documentElement.classList.contains('light')
    setTheme(isDark ? 'dark' : 'light')

    const obs = new MutationObserver(() => {
      setTheme(document.documentElement.classList.contains('light') ? 'light' : 'dark')
    })
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    async function load() {
      const [projs, ns] = await Promise.all([getProjects(), getNotes()])
      setProjects(projs); setNotes(ns); setLoading(false)
    }
    load()
  }, [])

  async function handleSave(n: Partial<Note>) {
    const saved = await upsertNote(n)
    setNotes(prev => {
      const idx = prev.findIndex(x => x.id === saved.id)
      if (idx >= 0) { const a = [...prev]; a[idx] = saved; return a }
      return [saved, ...prev]
    })
    // Re-sort: pinned first, then by date
    setNotes(prev => [...prev].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }))
  }

  async function handleDelete(id: string) {
    await deleteNote(id)
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  async function handleTogglePin(note: Note) {
    await toggleNotePin(note.id, !note.pinned)
    setNotes(prev => [...prev.map(n => n.id === note.id ? { ...n, pinned: !n.pinned } : n)]
      .sort((a, b) => { if (a.pinned !== b.pinned) return a.pinned ? -1 : 1; return new Date(b.created_at).getTime() - new Date(a.created_at).getTime() }))
  }

  const filtered = notes.filter(n => {
    const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.body?.toLowerCase().includes(search.toLowerCase()) || n.author.toLowerCase().includes(search.toLowerCase())
    const matchColor  = !filterColor || n.color === filterColor
    return matchSearch && matchColor
  })

  const pinned   = filtered.filter(n => n.pinned)
  const unpinned = filtered.filter(n => !n.pinned)
  const sidebarProjects = projects.map(p => ({ id: p.id, name: p.name, color: p.color }))

  const inp: React.CSSProperties = { height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-primary)', fontSize: 12, fontFamily: 'inherit' }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Sidebar projects={sidebarProjects} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopNav
          breadcrumbs={[{ label: 'Notes & memos' }]}
          actions={
            <button onClick={() => { setModal({}); setShowModal(true) }} style={{ height: 28, padding: '0 14px', borderRadius: 7, background: 'var(--amber-bg)', color: 'var(--amber)', border: '1px solid var(--amber-bdr)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              + New note
            </button>
          }
        />

        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Notes &amp; memos</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{notes.length} note{notes.length !== 1 ? 's' : ''} · shared with everyone</div>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Search */}
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes..." style={{ ...inp, width: 180 }} />

              {/* Color filter */}
              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                <button onClick={() => setFilterColor('')} style={{ width: 22, height: 22, borderRadius: '50%', background: filterColor === '' ? 'var(--text-primary)' : 'var(--border)', border: '2px solid var(--border)', cursor: 'pointer', fontSize: 10, color: filterColor === '' ? 'var(--bg-base)' : 'transparent' }}>✓</button>
                {NOTE_COLORS.map(c => (
                  <button key={c.id} onClick={() => setFilterColor(filterColor === c.id ? '' : c.id)} title={c.label} style={{ width: 22, height: 22, borderRadius: '50%', background: c.header, cursor: 'pointer', border: filterColor === c.id ? '3px solid var(--text-primary)' : '2px solid transparent', transform: filterColor === c.id ? 'scale(1.15)' : 'scale(1)', transition: 'all 0.15s', outline: 'none' }} />
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '60px 0' }}>Loading notes...</div>
          ) : notes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-faint)' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8 }}>No notes yet</div>
              <div style={{ fontSize: 13, marginBottom: 24 }}>Add a note to share updates with your team</div>
              <button onClick={() => { setModal({}); setShowModal(true) }} style={{ height: 38, padding: '0 20px', borderRadius: 9, background: 'var(--amber-bg)', color: 'var(--amber)', border: '1px solid var(--amber-bdr)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                + Add first note
              </button>
            </div>
          ) : (
            <>
              {/* Pinned section */}
              {pinned.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    📌 Pinned
                  </div>
                  <div style={{ columns: 'auto 280px', columnGap: 14 }}>
                    {pinned.map(note => (
                      <NoteCard key={note.id} note={note} theme={theme}
                        onClick={() => { setModal(note); setShowModal(true) }}
                        onEdit={() => { setModal(note); setShowModal(true) }}
                        onDelete={() => handleDelete(note.id)}
                        onTogglePin={() => handleTogglePin(note)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* All notes */}
              {unpinned.length > 0 && (
                <div>
                  {pinned.length > 0 && (
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: 12 }}>
                      Other notes
                    </div>
                  )}
                  <div style={{ columns: 'auto 280px', columnGap: 14 }}>
                    {unpinned.map(note => (
                      <NoteCard key={note.id} note={note} theme={theme}
                        onClick={() => { setModal(note); setShowModal(true) }}
                        onEdit={() => { setModal(note); setShowModal(true) }}
                        onDelete={() => handleDelete(note.id)}
                        onTogglePin={() => handleTogglePin(note)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-faint)', fontSize: 13 }}>No notes match your search.</div>
              )}
            </>
          )}
        </div>
      </div>

      {showModal && (
        <NoteModal
          note={modal}
          theme={theme}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setModal(null) }}
        />
      )}
    </div>
  )
}
