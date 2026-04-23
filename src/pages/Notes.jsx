import { useEffect, useState, useRef } from "react";

const NOTES_KEY = "f1hq_notes_v1";

function loadNotes() {
  try { return JSON.parse(localStorage.getItem(NOTES_KEY) || "[]"); } catch { return []; }
}

function saveNotes(notes) {
  try { localStorage.setItem(NOTES_KEY, JSON.stringify(notes)); } catch { /* ignore */ }
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function Note({ note, onDelete, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.text);
  const taRef = useRef(null);

  useEffect(() => {
    if (editing && taRef.current) taRef.current.focus();
  }, [editing]);

  function save() {
    if (draft.trim()) onEdit(note.id, draft.trim());
    setEditing(false);
  }

  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderTop: `3px solid ${note.color || "var(--red)"}`,
      padding: "18px 20px", position: "relative", transition: "border-color 0.15s",
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(225,6,0,0.3)"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
    >
      {/* Tag */}
      {note.tag && (
        <span style={{
          fontFamily: "var(--font-head)", fontSize: 9, fontWeight: 800,
          letterSpacing: "0.2em", textTransform: "uppercase",
          color: note.color || "var(--red)", background: `${note.color || "var(--red)"}15`,
          padding: "2px 8px", marginBottom: 10, display: "inline-block",
        }}>{note.tag}</span>
      )}

      {/* Content */}
      {editing ? (
        <textarea ref={taRef} value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) save(); if (e.key === "Escape") setEditing(false); }}
          style={{
            width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(225,6,0,0.3)",
            color: "var(--text)", fontFamily: "var(--font-body)", fontSize: 14,
            lineHeight: 1.65, padding: "10px 12px", resize: "vertical",
            minHeight: 100, outline: "none", borderRadius: 0,
          }}
        />
      ) : (
        <div style={{ fontSize: 14, lineHeight: 1.65, color: "var(--text)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {note.text}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "var(--font-head)", fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.06em" }}>
          {formatDate(note.updatedAt || note.createdAt)}
        </span>
        {note.source && (
          <span style={{ fontFamily: "var(--font-head)", fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.06em" }}>
            · from {note.source}
          </span>
        )}

        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {editing ? (
            <>
              <button onClick={save} style={btnStyle("#39B54A")}>SAVE</button>
              <button onClick={() => { setEditing(false); setDraft(note.text); }} style={btnStyle()}>CANCEL</button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} style={btnStyle()}>EDIT</button>
              <button onClick={() => onDelete(note.id)} style={btnStyle("var(--red)")}>DELETE</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function btnStyle(color) {
  return {
    background: "none", border: `1px solid ${color || "var(--border)"}`,
    color: color || "var(--text-muted)", fontFamily: "var(--font-head)",
    fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
    textTransform: "uppercase", padding: "4px 12px", cursor: "pointer",
    transition: "all 0.15s",
  };
}

// Tag color palette
const TAG_COLORS = {
  "General": "var(--red)",
  "Strategy": "#FF8000",
  "Driver": "#3671C6",
  "Race": "var(--gold)",
  "News": "#39B54A",
};

function Notes() {
  const [notes, setNotes] = useState(loadNotes);
  const [newText, setNewText] = useState("");
  const [newTag, setNewTag] = useState("General");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [notif, setNotif] = useState("");
  const taRef = useRef(null);

  // Listen for copy-to-notes events from other pages
  useEffect(() => {
    function handler(e) {
      const text = e.detail?.text || "";
      if (!text) return;
      const note = {
        id: Date.now().toString(),
        text,
        tag: "News",
        color: TAG_COLORS["News"],
        source: "Copied from app",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setNotes(prev => {
        const updated = [note, ...prev];
        saveNotes(updated);
        return updated;
      });
      setNotif("Saved to Notes ✓");
      setTimeout(() => setNotif(""), 2500);
    }
    window.addEventListener("f1:copy-to-notes", handler);
    return () => window.removeEventListener("f1:copy-to-notes", handler);
  }, []);

  function addNote() {
    if (!newText.trim()) return;
    const note = {
      id: Date.now().toString(),
      text: newText.trim(),
      tag: newTag,
      color: TAG_COLORS[newTag] || "var(--red)",
      source: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [note, ...notes];
    setNotes(updated);
    saveNotes(updated);
    setNewText("");
  }

  function deleteNote(id) {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    saveNotes(updated);
  }

  function editNote(id, text) {
    const updated = notes.map(n => n.id === id ? { ...n, text, updatedAt: Date.now() } : n);
    setNotes(updated);
    saveNotes(updated);
  }

  function clearAll() {
    if (!window.confirm("Delete all notes? This cannot be undone.")) return;
    setNotes([]);
    saveNotes([]);
  }

  const tags = ["All", ...Object.keys(TAG_COLORS)];

  const filtered = notes.filter(n => {
    const matchTag = filter === "All" || n.tag === filter;
    const matchSearch = !search || n.text.toLowerCase().includes(search.toLowerCase());
    return matchTag && matchSearch;
  });

  return (
    <div className="container">
      <div className="page-subtitle">Personal · Saved to this device</div>
      <h1 className="page-title">My <span>Notes</span></h1>

      {/* Toast */}
      {notif && (
        <div style={{
          position: "fixed", bottom: 32, right: 32, zIndex: 999,
          background: "var(--bg-card)", border: "1px solid #39B54A",
          color: "#39B54A", fontFamily: "var(--font-head)", fontSize: 13,
          fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
          padding: "12px 20px", animation: "fadeUp 0.3s ease both",
        }}>
          {notif}
        </div>
      )}

      {/* ── How to copy ── */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderLeft: "3px solid #39B54A", padding: "12px 20px", marginBottom: 32 }}>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
          On the <strong style={{ color: "var(--text)" }}>News</strong> and <strong style={{ color: "var(--text)" }}>Race Story</strong> pages, tap the <strong style={{ color: "#39B54A" }}>+ NOTES</strong> button on any article or race summary to save it directly here.
        </p>
      </div>

      {/* ── New note input ── */}
      <div style={{ border: "1px solid var(--border)", borderTop: "3px solid var(--red)", padding: "20px 24px", marginBottom: 32, background: "var(--bg-card)" }}>
        <div className="section-label">New Note</div>

        {/* Tag selector */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
          {Object.keys(TAG_COLORS).map(t => (
            <button key={t} onClick={() => setNewTag(t)} style={{
              fontFamily: "var(--font-head)", fontSize: 10, fontWeight: 700,
              letterSpacing: "0.14em", textTransform: "uppercase",
              padding: "5px 12px", border: `1px solid ${newTag === t ? TAG_COLORS[t] : "var(--border)"}`,
              background: newTag === t ? `${TAG_COLORS[t]}15` : "transparent",
              color: newTag === t ? TAG_COLORS[t] : "var(--text-muted)",
              cursor: "pointer", transition: "all 0.15s",
            }}>{t}</button>
          ))}
        </div>

        <textarea ref={taRef} value={newText} onChange={e => setNewText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) addNote(); }}
          placeholder="Write anything — race observations, strategy thoughts, predictions... (Ctrl+Enter to save)"
          rows={4}
          style={{
            width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)",
            color: "var(--text)", fontFamily: "var(--font-body)", fontSize: 14,
            lineHeight: 1.65, padding: "12px 14px", resize: "vertical",
            outline: "none", borderRadius: 0,
          }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <button onClick={addNote} disabled={!newText.trim()} style={{
            background: newText.trim() ? "var(--red)" : "var(--border)",
            border: "none", color: newText.trim() ? "#fff" : "var(--text-muted)",
            fontFamily: "var(--font-head)", fontSize: 12, fontWeight: 800,
            letterSpacing: "0.15em", textTransform: "uppercase",
            padding: "10px 28px", cursor: newText.trim() ? "pointer" : "not-allowed",
            transition: "all 0.2s",
          }}>
            SAVE NOTE
          </button>
        </div>
      </div>

      {/* ── Filter + search ── */}
      {notes.length > 0 && (
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search notes..."
            style={{
              flex: 1, minWidth: 200, background: "var(--bg-card)", border: "1px solid var(--border)",
              color: "var(--text)", fontFamily: "var(--font-body)", fontSize: 13,
              padding: "8px 14px", outline: "none", borderRadius: 0,
            }}
          />
          {tags.map(t => (
            <button key={t} onClick={() => setFilter(t)} style={{
              fontFamily: "var(--font-head)", fontSize: 10, fontWeight: 700,
              letterSpacing: "0.14em", textTransform: "uppercase",
              padding: "6px 12px", border: `1px solid ${filter === t ? "var(--red)" : "var(--border)"}`,
              background: filter === t ? "rgba(225,6,0,0.1)" : "transparent",
              color: filter === t ? "var(--red)" : "var(--text-muted)",
              cursor: "pointer", transition: "all 0.15s",
            }}>{t}</button>
          ))}
          {notes.length > 0 && (
            <button onClick={clearAll} style={{ ...btnStyle("var(--red)"), marginLeft: "auto" }}>
              CLEAR ALL
            </button>
          )}
        </div>
      )}

      {/* ── Notes list ── */}
      {notes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 24px", color: "var(--text-muted)", fontFamily: "var(--font-head)", letterSpacing: "0.1em", textTransform: "uppercase", fontSize: 13 }}>
          No notes yet. Write one above or save content from the News or Race Story pages.
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 24px", color: "var(--text-muted)", fontFamily: "var(--font-head)", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          No notes match your filter.
        </div>
      ) : (
        <>
          <div style={{ fontFamily: "var(--font-head)", fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>
            {filtered.length} note{filtered.length !== 1 ? "s" : ""}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 2 }}>
            {filtered.map(note => (
              <Note key={note.id} note={note} onDelete={deleteNote} onEdit={editNote} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Notes;