'use strict';

const BLOGS_API = 'https://katikn.com/api/blogs';
const PROJECT_ID = '1';

/* ── Field helpers (handle varied API shapes) ── */
function pick(obj, ...keys) {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
  }
  return null;
}

function getCategory(blog) {
  const cat = pick(blog, 'category', 'categories');
  if (!cat) return 'General';
  if (typeof cat === 'string') return cat;
  if (Array.isArray(cat)) return cat[0]?.name || cat[0] || 'General';
  if (typeof cat === 'object') return cat.name || cat.title || 'General';
  return 'General';
}

function getExcerpt(blog) {
  return pick(blog, 'excerpt', 'summary', 'description') || '';
}

function getImage(blog) {
  return pick(blog, 'cover_image', 'coverImage', 'image', 'thumbnail', 'featured_image', 'featuredImage');
}

function getContent(blog) {
  return pick(blog, 'content', 'body', 'html', 'text') || '';
}

function getReadTime(blog) {
  return pick(blog, 'read_time', 'readTime', 'reading_time', 'readingTime');
}

function getAuthor(blog) {
  const a = pick(blog, 'author', 'author_name', 'authorName', 'written_by');
  if (!a) return null;
  if (typeof a === 'string') return a;
  if (typeof a === 'object') return a.name || a.full_name || null;
  return null;
}

function formatDate(blog) {
  const raw = pick(blog, 'published_at', 'publishedAt', 'created_at', 'createdAt', 'date');
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/* ── Category emoji map ── */
const CAT_ICONS = {
  default: '📝',
  'google reviews': '⭐',
  'reputation': '🏆',
  'marketing': '📣',
  'tips': '💡',
  'case studies': '📊',
  'product': '🚀',
  'industry': '🏗️',
  'growth': '📈',
  'seo': '🔍',
};
function catIcon(cat) {
  return CAT_ICONS[cat.toLowerCase()] || CAT_ICONS.default;
}

/* ══════════════════════════════════════
   ALL BLOGS PAGE  (blog.html)
══════════════════════════════════════ */
(function initBlogList() {
  const grid       = document.getElementById('blogGrid');
  const filterWrap = document.getElementById('blogFilters');
  if (!grid) return; // not on this page

  let allBlogs = [];
  let activeCategory = 'all';

  /* Render 6 skeleton cards while loading */
  grid.innerHTML = Array.from({ length: 6 }, () => `
    <div class="blog-skeleton">
      <div class="skeleton-img"></div>
      <div class="skeleton-body">
        <div class="skeleton-line" style="width:30%;height:12px;"></div>
        <div class="skeleton-line" style="width:90%;height:18px;margin-top:14px;"></div>
        <div class="skeleton-line" style="width:75%;height:18px;"></div>
        <div class="skeleton-line" style="width:100%;height:12px;margin-top:12px;"></div>
        <div class="skeleton-line" style="width:85%;height:12px;"></div>
        <div class="skeleton-line" style="width:55%;height:12px;"></div>
      </div>
    </div>`).join('');

  fetch(`${BLOGS_API}?project_id=${PROJECT_ID}`)
    .then(r => r.json())
    .then(json => {
      const data = Array.isArray(json) ? json : (json.data || json.blogs || []);
      allBlogs = data.filter(b => (b.status || '').toLowerCase() === 'active');
      buildFilters(allBlogs);
      renderCards(allBlogs);
    })
    .catch(() => {
      grid.innerHTML = `
        <div class="blog-empty">
          <div class="blog-empty-icon">📡</div>
          <h3>Couldn't load posts</h3>
          <p>Check your connection and try refreshing the page.</p>
        </div>`;
    });

  function buildFilters(blogs) {
    if (!filterWrap) return;
    const cats = [...new Set(blogs.map(getCategory))].sort();
    const all = filterWrap.querySelector('[data-category="all"]');
    cats.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.dataset.category = cat;
      btn.textContent = cat;
      filterWrap.appendChild(btn);
    });
    filterWrap.addEventListener('click', e => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      activeCategory = btn.dataset.category;
      filterWrap.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b === btn));
      const filtered = activeCategory === 'all'
        ? allBlogs
        : allBlogs.filter(b => getCategory(b) === activeCategory);
      renderCards(filtered);
    });
  }

  function renderCards(blogs) {
    if (!blogs.length) {
      grid.innerHTML = `
        <div class="blog-empty">
          <div class="blog-empty-icon">${activeCategory === 'all' ? '✍️' : catIcon(activeCategory)}</div>
          <h3>No posts yet</h3>
          <p>${activeCategory === 'all' ? 'We\'re working on our first posts. Check back soon!' : `No posts in "${activeCategory}" yet.`}</p>
        </div>`;
      return;
    }
    grid.innerHTML = blogs.map(blogCard).join('');
  }

  function blogCard(blog) {
    const img      = getImage(blog);
    const cat      = getCategory(blog);
    const excerpt  = getExcerpt(blog);
    const date     = formatDate(blog);
    const readTime = getReadTime(blog);
    const id       = blog.id || blog._id || blog.slug;

    const imgHtml = img
      ? `<img class="blog-card-img" src="${escHtml(img)}" alt="${escHtml(blog.title || '')}" loading="lazy">`
      : `<div class="blog-card-img-placeholder">${catIcon(cat)}</div>`;

    const metaParts = [];
    if (date) metaParts.push(`<span>${date}</span>`);
    if (readTime) metaParts.push(`<span class="blog-card-meta-dot"></span><span>${readTime} min read</span>`);

    return `
      <a class="blog-card" href="blog-post.html?id=${encodeURIComponent(id)}">
        ${imgHtml}
        <div class="blog-card-body">
          <span class="blog-card-cat">${escHtml(cat)}</span>
          <h2 class="blog-card-title">${escHtml(blog.title || 'Untitled')}</h2>
          ${excerpt ? `<p class="blog-card-excerpt">${escHtml(excerpt)}</p>` : ''}
          ${metaParts.length ? `<div class="blog-card-meta">${metaParts.join('')}</div>` : ''}
        </div>
      </a>`;
  }
})();

/* ══════════════════════════════════════
   SINGLE POST PAGE  (blog-post.html)
══════════════════════════════════════ */
(function initBlogPost() {
  const postWrap = document.getElementById('postContent');
  if (!postWrap) return; // not on this page

  const params = new URLSearchParams(location.search);
  const id = params.get('id');

  if (!id) {
    showPostError('Post not found', 'No post ID was specified.');
    return;
  }

  fetch(`${BLOGS_API}/${encodeURIComponent(id)}?project_id=${PROJECT_ID}`)
    .then(r => r.json())
    .then(json => {
      const blog = json.data || json.blog || json;
      if (!blog || !blog.id && !blog._id && !blog.title) throw new Error('empty');
      if ((blog.status || '').toLowerCase() !== 'active') {
        showPostError('Post unavailable', 'This post is no longer available.');
        return;
      }
      renderPost(blog);
    })
    .catch(() => {
      showPostError('Post not found', 'This post couldn\'t be loaded. It may have been removed.');
    });

  function renderPost(blog) {
    const cat      = getCategory(blog);
    const date     = formatDate(blog);
    const readTime = getReadTime(blog);
    const author   = getAuthor(blog);
    const img      = getImage(blog);
    const content  = getContent(blog);
    const excerpt  = getExcerpt(blog);

    /* Update <title> */
    document.title = `${blog.title || 'Post'} — lapio Blog`;

    /* Update meta description */
    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && excerpt) metaDesc.setAttribute('content', excerpt);

    /* Hero */
    const heroEl = document.getElementById('postHero');
    if (heroEl) {
      heroEl.innerHTML = `
        <div class="post-hero-inner">
          <a href="blog.html" class="post-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Blog
          </a>
          <span class="post-cat">${escHtml(cat)}</span>
          <h1>${escHtml(blog.title || 'Untitled')}</h1>
          <div class="post-meta">
            ${author ? `<span class="post-author">${escHtml(author)}</span>` : ''}
            ${author && date ? '<span class="post-meta-sep"></span>' : ''}
            ${date ? `<span>${date}</span>` : ''}
            ${readTime ? `<span class="post-meta-sep"></span><span>${readTime} min read</span>` : ''}
          </div>
        </div>`;
    }

    /* Cover image */
    const coverEl = document.getElementById('postCover');
    if (coverEl && img) {
      coverEl.innerHTML = `<img class="post-cover" src="${escHtml(img)}" alt="${escHtml(blog.title || '')}">`;
    }

    /* Content */
    postWrap.innerHTML = content
      ? `<div class="post-article">${content}</div>`
      : excerpt
        ? `<div class="post-article"><p>${escHtml(excerpt)}</p></div>`
        : `<div class="post-article"><p>No content available.</p></div>`;
  }

  function showPostError(title, msg) {
    const heroEl = document.getElementById('postHero');
    if (heroEl) heroEl.innerHTML = '';
    const coverEl = document.getElementById('postCover');
    if (coverEl) coverEl.innerHTML = '';
    postWrap.innerHTML = `
      <div class="post-error">
        <div class="blog-empty-icon" style="margin:0 auto 20px;">📄</div>
        <h2>${escHtml(title)}</h2>
        <p>${escHtml(msg)}</p>
        <a href="blog.html" class="btn-primary">← Back to Blog</a>
      </div>`;
  }
})();

/* ── Minimal XSS guard for user-facing text ── */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
