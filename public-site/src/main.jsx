import React, { useEffect, useState } from 'react';
import { AlertTriangle, ArrowUpRight, BookOpen, CalendarDays, ChevronLeft, FileText, Menu, Microscope, Search, X } from 'lucide-react';
import { createRoot } from 'react-dom/client';
import './style.css';

const API = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');
const ARTICLE_PATH = /^\/article\/([^/]+)\/?$/;

function articleSlug() {
  const match = ARTICLE_PATH.exec(window.location.pathname);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function formatDate(value) {
  return value
    ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Publication date unavailable';
}

function excerpt(text = '', max = 180) {
  const value = String(text || '');
  return value.length > max ? `${value.slice(0, max).trimEnd()}…` : value;
}

function authorNames(article) {
  return (article.authors || []).map(author => author.name).filter(Boolean).join(', ') || 'Authors unavailable';
}

function sitePath(path = '') {
  const pathname = window.location.pathname;
  const articleIndex = pathname.indexOf('/article/');
  const root = articleIndex >= 0 ? pathname.slice(0, articleIndex + 1) : pathname.replace(/[^/]*$/, '');
  return `${root}${path}`;
}

function Header() {
  const [menu, setMenu] = useState(false);
  const links = [
    ['About', '#about'],
    ['Publications', '#publications'],
    ['Issues', '#issues'],
    ['News & Events', '#news'],
    ['Contact', '#contact'],
  ];
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <div className="topbar">
        <div className="topbar-inner">
          <span><span className="tamil" lang="ta">தமிழ்நாடு அறிவியல் இயக்கம்</span><span className="topbar-en"> · Tamil Nadu Science Forum</span></span>
          <span>Science for the People · <span className="tamil" lang="ta">மக்களுக்கான அறிவியல்</span></span>
        </div>
      </div>
      <header className="site-header">
        <div className="top">
          <a className="brand" href={sitePath()} aria-label="TNSF E-Journal home">
            <span className="seal"><Microscope size={23}/></span>
            <span>
              <b>TNSF E-JOURNAL</b>
              <small>Science for the People</small>
              <small className="brand-tamil tamil" lang="ta">மக்களுக்கான அறிவியல்</small>
            </span>
          </a>
          <button
            className="mobile"
            onClick={() => setMenu(open => !open)}
            aria-label={menu ? 'Close menu' : 'Open menu'}
            aria-expanded={menu}
            aria-controls="primary-nav"
          >
            {menu ? <X/> : <Menu/>}
          </button>
          <nav id="primary-nav" className={menu ? 'nav open' : 'nav'} aria-label="Primary" onClick={() => setMenu(false)}>
            {links.map(([label, href]) => <a key={href} href={sitePath(href)}>{label}</a>)}
          </nav>
        </div>
        <div className="tricolor" aria-hidden="true"/>
      </header>
    </>
  );
}

function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-brand">
            <a className="brand footbrand" href={sitePath()}>
              <span className="seal"><Microscope size={21}/></span>
              <span>
                <b>TNSF E-JOURNAL</b>
                <small>Science for the People</small>
                <small className="brand-tamil tamil" lang="ta">மக்களுக்கான அறிவியல்</small>
              </span>
            </a>
            <p>An open-access journal platform for science-related ideas, articles and publications from the TNSF community.</p>
          </div>
          <div>
            <h3>Quick links</h3>
            <a href={sitePath('#about')}>About</a>
            <a href={sitePath('#publications')}>Publications</a>
            <a href={sitePath('#issues')}>Issues</a>
            <a href={sitePath('#contact')}>Contact</a>
          </div>
          <div>
            <h3>Journal information</h3>
            <p>Articles are published after editorial review and approval.</p>
            <p>For verified news and event announcements, use official TNSF channels.</p>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} TNSF E-Journal platform</span>
          <span>Science for the People</span>
        </div>
      </div>
    </footer>
  );
}

function Homepage({ articles, issues, query, setQuery, busy, error, search, retry, clearSearch }) {
  return (
    <>
      <Header/>
      <main id="main-content">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">TAMIL NADU SCIENCE FORUM</p>
            <h1>Science that informs.<br/><em>Knowledge that empowers.</em></h1>
            <p className="lead">Explore journal articles, research and science communication from the TNSF community.</p>
            <div className="actions">
              <a className="btn primary" href="#publications">Explore publications <ArrowUpRight size={17}/></a>
              <a className="btn ghost" href="#about">About the journal</a>
            </div>
            <div className="trust">
              <span><BookOpen size={17}/> Research & ideas</span>
              <span><FileText size={17}/> Article archive</span>
            </div>
          </div>
          <div className="hero-art">
            <div className="orb"><Microscope size={64} strokeWidth={1.5}/></div>
            <h2>Open access journal</h2>
            <p>Research, articles and science communication from the TNSF community.</p>
            <div className="art-note"><span className="dot"/> Curiosity builds a better future</div>
          </div>
        </section>

        <section id="about" className="intro">
          <div>
            <p className="eyebrow">OUR PURPOSE</p>
            <h2>Making science accessible to everyone.</h2>
          </div>
          <p>TNSF E-Journal provides a home for science-related ideas, articles and publications. Browse the archive and discover work by authors in the science community.</p>
        </section>

        <section id="publications" className="section">
          <div className="section-head">
            <div>
              <p className="eyebrow">READ & DISCOVER</p>
              <h2>Latest publications</h2>
              <p className="muted">Search published articles by title, abstract or keyword.</p>
            </div>
            <form className="search" onSubmit={search} role="search">
              <Search size={19}/>
              <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search articles..." aria-label="Search articles"/>
              <button disabled={busy}>{busy ? 'Searching…' : 'Search'}</button>
            </form>
          </div>
          {busy ? (
            <p className="muted" aria-live="polite">Loading publications…</p>
          ) : error ? (
            <div className="empty" role="alert">
              <AlertTriangle size={30}/>
              <h3>Could not load publications</h3>
              <p>{error}</p>
              <button className="btn primary" onClick={retry}>Try again</button>
            </div>
          ) : articles.length ? (
            <div className="cards">
              {articles.map(article => (
                <article className="card" key={article._id}>
                  <div className="card-icon"><FileText/></div>
                  <p className="tag">{article.issue ? `VOL. ${article.issue.volume} · ISSUE ${article.issue.issueNumber}` : 'JOURNAL ARTICLE'}</p>
                  <h3>{article.title}</h3>
                  <p>{excerpt(article.abstract)}</p>
                  <div className="authors">{authorNames(article)}</div>
                  <div className="card-foot">
                    <span>{formatDate(article.publishedAt)}</span>
                    <a href={sitePath(`article/${encodeURIComponent(article.slug)}`)}>Read article <ArrowUpRight size={15}/></a>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty">
              <BookOpen size={30}/>
              <h3>{query.trim() ? 'No matching articles' : 'No published articles yet'}</h3>
              <p>{query.trim() ? `No articles matched “${query.trim()}”. Try a different search.` : 'Published articles will appear here when added by the editorial team.'}</p>
              {query.trim() && <button className="btn ghost" onClick={clearSearch}>Clear search</button>}
            </div>
          )}
        </section>

        <section id="issues" className="section issues">
          <div className="section-head">
            <div>
              <p className="eyebrow">THE ARCHIVE</p>
              <h2>Journal issues</h2>
            </div>
          </div>
          {issues.length ? (
            <div className="issue-grid">
              {issues.map(issue => (
                <div className="issue" key={issue._id}>
                  <div className="issue-cover">
                    <BookOpen size={34}/>
                    <span>TNSF<br/>E-JOURNAL</span>
                  </div>
                  <div>
                    <p className="tag">VOLUME {issue.volume} · ISSUE {issue.issueNumber}</p>
                    <h3>{issue.title}</h3>
                    <p className="muted">{issue.year}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="muted">Published journal issues will appear here.</p>}
        </section>

        <section id="news" className="banner">
          <CalendarDays size={26}/>
          <div>
            <p className="eyebrow">STAY CONNECTED</p>
            <h2>Science, society and shared learning.</h2>
            <p>Check official TNSF channels for verified news and event announcements.</p>
          </div>
        </section>

        <section id="contact" className="contact">
          <div>
            <p className="eyebrow">GET IN TOUCH</p>
            <h2>Questions about a publication?</h2>
            <p>Contact the journal editorial team through the organization’s officially published contact channels.</p>
          </div>
          <a className="btn primary" href="#about">Journal information <ArrowUpRight size={17}/></a>
        </section>
      </main>
      <Footer/>
    </>
  );
}

function ArticlePage({ article, busy, error, onHome }) {
  if (busy) {
    return (
      <div className="article-page">
        <Header/>
        <main id="main-content">
          <section className="section">
            <p className="muted" aria-live="polite">Loading article…</p>
          </section>
        </main>
        <Footer/>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="article-page">
        <Header/>
        <main id="main-content">
          <section className="section">
            <div className="empty" role="alert">
              <FileText size={30}/>
              <h3>{error || 'Article not found'}</h3>
              <p>The article may have been removed or is not published.</p>
              <button className="btn primary" onClick={onHome}>Return to publications</button>
            </div>
          </section>
        </main>
        <Footer/>
      </div>
    );
  }

  return (
    <div className="article-page">
      <Header/>
      <main id="main-content">
        <section className="section">
          <button className="back" onClick={onHome}><ChevronLeft size={18}/> Home</button>
          <div className="section-head">
            <div>
              <p className="eyebrow">ARTICLE</p>
              <h1>{article.title}</h1>
            </div>
          </div>
          <p className="tag">{article.issue ? `VOL. ${article.issue.volume} · ISSUE ${article.issue.issueNumber}` : 'JOURNAL ARTICLE'}</p>
          <p className="muted">{formatDate(article.publishedAt)} · {authorNames(article)}</p>
          <div className="article-body">
            <h3>Abstract</h3>
            <p>{article.abstract}</p>
            {article.keywords?.length ? <div className="keywords"><strong>Keywords:</strong> {article.keywords.join(', ')}</div> : null}
          </div>
          <div className="article-meta">
            {article.doi ? <span><strong>DOI:</strong> {article.doi}</span> : null}
            {article.license ? <span><strong>License:</strong> {article.license}</span> : null}
          </div>
          {article.pdfUrl ? <a className="btn primary" href={article.pdfUrl} target="_blank" rel="noopener noreferrer">Download PDF <ArrowUpRight size={15}/></a> : null}
        </section>
      </main>
      <Footer/>
    </div>
  );
}

function App() {
  const [articles, setArticles] = useState([]);
  const [issues, setIssues] = useState([]);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [article, setArticle] = useState(null);
  const [articleBusy, setArticleBusy] = useState(false);
  const [articleError, setArticleError] = useState('');

  async function load(searchQuery = '') {
    setBusy(true);
    setError('');
    try {
      const [articlesResponse, issuesResponse] = await Promise.all([
        fetch(`${API}/articles?limit=12&q=${encodeURIComponent(searchQuery)}`),
        fetch(`${API}/issues`),
      ]);
      if (!articlesResponse.ok || !issuesResponse.ok) throw new Error('The API returned an error.');
      const [articleData, issueData] = await Promise.all([articlesResponse.json(), issuesResponse.json()]);
      setArticles(Array.isArray(articleData.items) ? articleData.items : []);
      setIssues(Array.isArray(issueData.items) ? issueData.items : []);
    } catch {
      setArticles([]);
      setIssues([]);
      setError('Unable to reach the publication service. Please check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function loadArticle(slug) {
    setArticleBusy(true);
    setArticleError('');
    try {
      const response = await fetch(`${API}/articles/${encodeURIComponent(slug)}`);
      if (!response.ok) {
        setArticle(null);
        setArticleError(response.status === 404 ? 'Article not found' : 'Unable to load this article');
        return;
      }
      const data = await response.json();
      setArticle(data.article || null);
      if (!data.article) setArticleError('Article not found');
    } catch {
      setArticle(null);
      setArticleError('Unable to load this article');
    } finally {
      setArticleBusy(false);
    }
  }

  const slug = articleSlug();

  useEffect(() => { if (!slug) load(); }, []);
  useEffect(() => {
    if (slug) loadArticle(slug);
    else {
      setArticle(null);
      setArticleError('');
    }
  }, [slug]);

  const goHome = () => { window.location.href = sitePath(); };

  return slug
    ? <ArticlePage article={article} busy={articleBusy} error={articleError} onHome={goHome}/>
    : <Homepage
        articles={articles}
        issues={issues}
        query={query}
        setQuery={setQuery}
        busy={busy}
        error={error}
        search={event => { event.preventDefault(); if (!busy) load(query); }}
        retry={() => load(query)}
        clearSearch={() => { setQuery(''); load(''); }}
      />;
}

createRoot(document.getElementById('root')).render(<App/>);
