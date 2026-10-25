import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AlertTriangle, BookOpen, FileText, LayoutDashboard, LogOut, Pencil, Plus, RefreshCw, Search, ShieldCheck, Trash2 } from 'lucide-react';
import './style.css';

const API = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');
const emptyForm = { title: '', slug: '', abstract: '', authors: '', keywords: '', status: 'draft', fullText: '' };
const tabs = [
  ['overview', 'Overview', LayoutDashboard],
  ['articles', 'Articles', FileText],
  ['issues', 'Issues', BookOpen],
  ['screening', 'Originality screening', ShieldCheck],
];
const pageTitles = {
  overview: 'Dashboard overview',
  articles: 'Article management',
  issues: 'Issue management',
  screening: 'Originality screening',
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('tnsf_token') || '');
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [articles, setArticles] = useState([]);
  const [tab, setTab] = useState('overview');
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [screenText, setScreenText] = useState('');
  const [screenResult, setScreenResult] = useState(null);

  async function api(path, options = {}) {
    let response;
    try {
      response = await fetch(`${API}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers || {}),
        },
      });
    } catch {
      throw new Error(`Cannot reach the API server at ${API}. Make sure the backend is running.`);
    }
    const text = response.status === 204 ? '' : await response.text();
    let data = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = {};
      }
    }
    if (!response.ok || (text && !(response.headers.get('content-type') || '').includes('application/json'))) {
      throw new Error(data.error || data.message || `Request failed (HTTP ${response.status}). Check VITE_API_BASE and that the API is reachable.`);
    }
    return data;
  }

  async function load() {
    if (!token) return;
    try {
      const [me, articleData] = await Promise.all([api('/auth/me'), api('/admin/articles')]);
      setUser(me.user);
      setArticles(articleData.items || []);
      setError('');
    } catch (loadError) {
      setError(loadError.message);
      if (/session|Authentication|Invalid/i.test(loadError.message)) {
        localStorage.removeItem('tnsf_token');
        setToken('');
      }
    }
  }

  useEffect(() => {
    if (token) load();
  }, [token]);

  async function login(event) {
    event.preventDefault();
    setError('');
    try {
      const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      localStorage.setItem('tnsf_token', data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (loginError) {
      setError(loginError.message);
    }
  }

  function logout() {
    localStorage.removeItem('tnsf_token');
    setToken('');
    setUser(null);
  }

  function closeForm() {
    setShowForm(false);
    setEditingArticle(null);
    setForm(emptyForm);
  }

  function openNewArticle() {
    setEditingArticle(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function editArticle(article) {
    setEditingArticle(article);
    setForm({
      title: article.title || '',
      slug: article.slug || '',
      abstract: article.abstract || '',
      authors: (article.authors || []).map(author => author.name).join(', '),
      keywords: (article.keywords || []).join(', '),
      status: article.status || 'draft',
      fullText: '',
    });
    setShowForm(true);
    setError('');
  }

  async function saveArticle(event) {
    event.preventDefault();
    setError('');
    try {
      const data = {
        ...form,
        authors: form.authors.split(',').map(name => ({ name: name.trim() })).filter(author => author.name),
        keywords: form.keywords.split(',').map(keyword => keyword.trim()).filter(Boolean),
      };
      if (editingArticle && !data.fullText) delete data.fullText;
      await api(editingArticle ? `/admin/articles/${editingArticle._id}` : '/admin/articles', {
        method: editingArticle ? 'PATCH' : 'POST',
        body: JSON.stringify(data),
      });
      closeForm();
      await load();
    } catch (saveError) {
      setError(saveError.message);
    }
  }

  async function publish(article) {
    try {
      await api(`/admin/articles/${article._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'published', publishedAt: new Date().toISOString() }),
      });
      await load();
    } catch (publishError) {
      setError(publishError.message);
    }
  }

  async function deleteArticle(article) {
    if (!window.confirm(`Delete “${article.title}”? This cannot be undone.`)) return;
    setError('');
    try {
      await api(`/admin/articles/${article._id}`, { method: 'DELETE' });
      await load();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  async function checkText(event) {
    event.preventDefault();
    setScreenResult(null);
    try {
      setScreenResult(await api('/screening/check', { method: 'POST', body: JSON.stringify({ text: screenText }) }));
    } catch (screenError) {
      setError(screenError.message);
    }
  }

  if (!token) {
    return (
      <div className="login-page">
        <div className="login-topbar">
          <span>TNSF E-Journal · Editorial Workspace</span>
          <span>Authorized personnel only</span>
        </div>
        <div className="tricolor" aria-hidden="true"/>
        <div className="login-wrap">
          <div className="login-card">
            <div className="login-brand">
              <span className="logo"><ShieldCheck size={26}/></span>
              <span>
                <b>TNSF E-JOURNAL</b>
                <small className="tamil" lang="ta">தமிழ்நாடு அறிவியல் இயக்கம்</small>
              </span>
            </div>
            <p className="eyebrow">EDITORIAL WORKSPACE</p>
            <h1>Journal administration</h1>
            <p className="sub">Sign in to manage TNSF E-Journal content.</p>
            <form onSubmit={login}>
              <label>
                Email address
                <input type="email" value={email} onChange={event => setEmail(event.target.value)} required autoComplete="username"/>
              </label>
              <label>
                Password
                <input type="password" value={password} onChange={event => setPassword(event.target.value)} required autoComplete="current-password"/>
              </label>
              {error && <p className="error" role="alert">{error}</p>}
              <button className="btn primary">Sign in securely</button>
            </form>
            <p className="fine">Authorized editorial personnel only. Keep your credentials private.</p>
          </div>
        </div>
      </div>
    );
  }

  const canDelete = user?.role === 'admin';

  return (
    <>
      <a className="skip-link" href="#admin-main">Skip to main content</a>
      <div className="app">
        <aside className="sidebar">
          <div className="sidebrand">
            <span className="logo"><BookOpen/></span>
            <span>
              <b>TNSF E-JOURNAL</b>
              <small>EDITORIAL CONSOLE</small>
              <small className="tamil" lang="ta">தமிழ்நாடு அறிவியல் இயக்கம்</small>
            </span>
          </div>
          <p className="side-label">WORKSPACE</p>
          {tabs.map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              className={tab === key ? 'active' : ''}
              onClick={() => setTab(key)}
              aria-current={tab === key ? 'page' : undefined}
            >
              <Icon size={18}/> {label}
            </button>
          ))}
          <div className="side-bottom">
            <div className="avatar">{(user?.name || 'A').slice(0, 1).toUpperCase()}</div>
            <div className="user-info">
              <b>{user?.name || 'Administrator'}</b>
              <small>{user?.role || 'editor'}</small>
            </div>
            <button className="logout" type="button" onClick={logout} title="Sign out" aria-label="Sign out">
              <LogOut size={17}/>
            </button>
          </div>
        </aside>
        <div className="content">
          <div className="admin-topbar">
            <span>TNSF E-Journal · Editorial Workspace</span>
            <span className="topbar-right">Authorized personnel only</span>
          </div>
          <div className="tricolor" aria-hidden="true"/>
          <main className="main" id="admin-main">
            <header className="bar">
              <div>
                <p className="eyebrow">TNSF E-JOURNAL / WORKSPACE</p>
                <h1>{pageTitles[tab]}</h1>
              </div>
              <button className="iconbtn" type="button" onClick={load} title="Refresh">
                <RefreshCw size={16}/> Refresh
              </button>
            </header>

            {error && (
              <div className="alert" role="alert">
                <AlertTriangle size={18}/>
                <span>{error}</span>
                <button type="button" onClick={() => setError('')} aria-label="Dismiss error">×</button>
              </div>
            )}

            {tab === 'overview' && (
              <Overview
                articles={articles}
                user={user}
                onNew={() => { setTab('articles'); openNewArticle(); }}
                onArticles={() => setTab('articles')}
                onPublish={publish}
                onEdit={editArticle}
                onDelete={deleteArticle}
                canDelete={canDelete}
              />
            )}

            {tab === 'articles' && (
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <h2>Articles</h2>
                    <p>Create and manage journal article metadata.</p>
                  </div>
                  <button className="btn primary" type="button" onClick={() => showForm ? closeForm() : openNewArticle()}>
                    <Plus size={16}/> New article
                  </button>
                </div>
                {showForm && (
                  <ArticleForm
                    form={form}
                    setForm={setForm}
                    editingArticle={editingArticle}
                    onSubmit={saveArticle}
                    onCancel={closeForm}
                  />
                )}
                <ArticleTable
                  articles={articles}
                  onPublish={publish}
                  onEdit={editArticle}
                  onDelete={deleteArticle}
                  canDelete={canDelete}
                />
              </section>
            )}

            {tab === 'issues' && (
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <h2>Journal issues</h2>
                    <p>Issue creation endpoint is available in the API; the dashboard form is a next integration step.</p>
                  </div>
                </div>
              </section>
            )}

            {tab === 'screening' && (
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <h2>Originality screening</h2>
                    <p>Compare a manuscript with published articles in this journal database.</p>
                  </div>
                </div>
                <form className="screen-form" onSubmit={checkText}>
                  <label>
                    Manuscript text
                    <textarea
                      required
                      minLength="1"
                      value={screenText}
                      onChange={event => setScreenText(event.target.value)}
                      placeholder="Paste the article text to compare against published journal articles…"
                    />
                  </label>
                  <button className="btn primary" type="submit">
                    <Search size={16}/> Check internal similarity
                  </button>
                </form>
                {screenResult && (
                  <div className="results">
                    <h3>Screening report</h3>
                    <p>{screenResult.wordCount || 0} words · {screenResult.eligible ? 'Comparison completed' : 'More text required'}</p>
                    <p className="notice">{screenResult.scope || screenResult.message}</p>
                  </div>
                )}
              </section>
            )}

            <footer className="admin-footer">
              <span>TNSF E-Journal · Editorial workspace</span>
              <span>Secure access · Record publication decisions</span>
            </footer>
          </main>
        </div>
      </div>
    </>
  );
}

function Overview({ articles, user, onNew, onArticles, onPublish, onEdit, onDelete, canDelete }) {
  return (
    <>
      <div className="welcome">
        <div>
          <p className="eyebrow">EDITORIAL OPERATIONS</p>
          <h2>Welcome back, {user?.name?.split(' ')[0] || 'Editor'}.</h2>
          <p>Manage article records and review originality screening signals.</p>
        </div>
        <button className="btn primary" type="button" onClick={onNew}>
          <Plus size={17}/> New article
        </button>
      </div>
      <div className="stats">
        <div>
          <span>Total articles</span>
          <b>{articles.length}</b>
          <small>All statuses</small>
        </div>
        <div>
          <span>Published</span>
          <b>{articles.filter(article => article.status === 'published').length}</b>
          <small>Publicly visible</small>
        </div>
        <div>
          <span>Drafts</span>
          <b>{articles.filter(article => article.status === 'draft').length}</b>
          <small>Not yet published</small>
        </div>
        <div>
          <span>Archived</span>
          <b>{articles.filter(article => article.status === 'archived').length}</b>
          <small>Retained records</small>
        </div>
      </div>
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Recent articles</h2>
            <p>Latest edited records</p>
          </div>
          <button className="textbtn" type="button" onClick={onArticles}>View all →</button>
        </div>
        <ArticleTable
          articles={articles.slice(0, 6)}
          onPublish={onPublish}
          onEdit={onEdit}
          onDelete={onDelete}
          canDelete={canDelete}
        />
      </section>
    </>
  );
}

function ArticleForm({ form, setForm, editingArticle, onSubmit, onCancel }) {
  return (
    <form className="article-form" onSubmit={onSubmit}>
      <div className="form-grid">
        <label>
          Article title
          <input required minLength="4" value={form.title} onChange={event => setForm({ ...form, title: event.target.value })}/>
        </label>
        <label>
          URL slug
          <input
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            placeholder="example-research-title"
            value={form.slug}
            onChange={event => setForm({ ...form, slug: event.target.value })}
          />
        </label>
        <label className="wide">
          Abstract
          <textarea required minLength="20" value={form.abstract} onChange={event => setForm({ ...form, abstract: event.target.value })}/>
        </label>
        <label>
          Authors (comma-separated)
          <input required placeholder="A. Author, B. Author" value={form.authors} onChange={event => setForm({ ...form, authors: event.target.value })}/>
        </label>
        <label>
          Keywords (comma-separated)
          <input value={form.keywords} onChange={event => setForm({ ...form, keywords: event.target.value })}/>
        </label>
        <label className="wide">
          {editingArticle ? 'Replace full text for internal similarity screening' : 'Full text for internal similarity screening'}
          <textarea
            placeholder={editingArticle ? 'Leave blank to retain the existing full text' : 'Paste authorized article text for internal matching (optional)'}
            value={form.fullText}
            onChange={event => setForm({ ...form, fullText: event.target.value })}
          />
        </label>
        <label>
          Status
          <select value={form.status} onChange={event => setForm({ ...form, status: event.target.value })}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </div>

      <div className="form-actions">
        <button type="button" className="btn secondary" onClick={onCancel}>Cancel</button>
        <button className="btn primary">{editingArticle ? 'Update article' : 'Save article'}</button>
      </div>
    </form>
  );
}

function ArticleTable({ articles, onPublish, onEdit, onDelete, canDelete }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Article</th>
            <th>Status</th>
            <th>Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {articles.map(article => (
            <tr key={article._id}>
              <td>
                <b>{article.title}</b>
                <small>{(article.authors || []).map(author => author.name).join(', ')}</small>
              </td>
              <td><span className={`status ${article.status}`}>{article.status}</span></td>
              <td>{new Date(article.updatedAt || article.createdAt).toLocaleDateString()}</td>
              <td>
                <div className="table-actions">
                  {article.status === 'draft' && <button className="textbtn" type="button" onClick={() => onPublish(article)}>Publish</button>}
                  <button className="textbtn" type="button" onClick={() => onEdit(article)}><Pencil size={14}/> Edit</button>
                  {canDelete && <button className="textbtn danger" type="button" onClick={() => onDelete(article)}><Trash2 size={14}/> Delete</button>}
                </div>
              </td>
            </tr>
          ))}
          {!articles.length && (
            <tr>
              <td colSpan="4" className="empty">No articles yet. Create your first article record.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App/>);
