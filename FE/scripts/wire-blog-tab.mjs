/**
 * Wire BlogTab → blogService.getAdminPosts()
 */
import { readFileSync, writeFileSync } from 'fs';

const f = readFileSync('d:/LOOP_COMPANY/LOOP/FE/src/app/components/admin/BlogTab.tsx', 'utf8');
let g = f;

// ── 1. Add imports ──────────────────────────────────────────────────────────
const oldReact = "import { useState } from 'react';";
const newReact = "import { useState, useEffect } from 'react';";
if (!g.includes('useEffect }')) g = g.replace(oldReact, newReact);

const oldBlogImport = "import { DS, GRD } from '../layout/ds';";
const newBlogImport = `import { DS, GRD } from '../layout/ds';
import { blogService } from '../../../api/blog.service';`;
if (!g.includes('blogService }')) {
  g = g.replace(oldBlogImport, newBlogImport);
}

// ── 2. Add state + useEffect in BlogTab ─────────────────────────────────────
const oldTabStart = `export function BlogTab() {
  const [posts, setPosts] = useState<BlogPost[]>(INITIAL_POSTS);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('Tất cả');
  const [filterStatus, setFilterStatus] = useState('Tất cả');
  const [modal, setModal] = useState<null | 'new' | BlogPost>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);`;

const newTabStart = `export function BlogTab() {
  const [apiPosts, setApiPosts] = useState<BlogPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState('');
  const [posts, setPosts] = useState<BlogPost[]>(INITIAL_POSTS);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('Tất cả');
  const [filterStatus, setFilterStatus] = useState('Tất cả');
  const [modal, setModal] = useState<null | 'new' | BlogPost>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPostsLoading(true);
    setPostsError('');
    blogService.getAdminPosts({ limit: 50 })
      .then(({ posts: fetched }) => { if (!cancelled) setApiPosts(fetched as unknown as BlogPost[]); })
      .catch(() => { if (!cancelled) setPostsError('Không tải được danh sách bài viết'); })
      .finally(() => { if (!cancelled) setPostsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Use API posts when loaded, fall back to mock
  const displayPosts = postsLoading && postsError === '' ? posts : apiPosts.length > 0 ? apiPosts : posts;`;

g = g.replace(oldTabStart, newTabStart);

// ── 3. Replace stats to use displayPosts ────────────────────────────────────
g = g.replace(
  'const published = posts.filter(p => p.status === \'published\');',
  'const published = displayPosts.filter(p => p.status === \'published\');'
);
g = g.replace(
  'const totalViews = published.reduce((s, p) => s + p.views, 0);',
  'const totalViews = published.reduce((s, p) => s + (p.views ?? 0), 0);'
);
g = g.replace(
  'const totalLikes = published.reduce((s, p) => s + p.likes, 0);',
  'const totalLikes = published.reduce((s, p) => s + (p.likes ?? 0), 0);'
);

// ── 4. Replace filtered to use displayPosts ─────────────────────────────────
g = g.replace(
  `const filtered = posts.filter(p =>
    (filterCat === 'Tất cả' || p.cat === filterCat) &&
    (filterStatus === 'Tất cả' || p.status === filterStatus) &&
    (p.title.toLowerCase().includes(search.toLowerCase()) || p.author.toLowerCase().includes(search.toLowerCase()))
  );`,
  `const filtered = displayPosts.filter(p =>
    (filterCat === 'Tất cả' || p.cat === filterCat) &&
    (filterStatus === 'Tất cả' || p.status === filterStatus) &&
    (p.title.toLowerCase().includes(search.toLowerCase()) || p.author.toLowerCase().includes(search.toLowerCase()))
  );`
);

// ── 5. Loading skeleton ─────────────────────────────────────────────────────
// Add loading state after toolbar, before table
const toolbarEnd = `<button onClick={() => setModal('new')}`;
const loadingRow = `{postsLoading && postsError === '' && (
          <div className="text-center py-16" style={{ color: DS.text4 }}>
            <div className="text-3xl mb-2">⏳</div>
            <div style={{ fontFamily: DS.mono, fontSize: 11 }}>Đang tải bài viết...</div>
          </div>
        )}
        {postsError && (
          <div className="text-center py-12" style={{ color: DS.red }}>
            <div style={{ fontFamily: DS.mono, fontSize: 12 }}>{postsError}</div>
          </div>
        )}`;
g = g.replace(toolbarEnd, loadingRow + '\n        ' + toolbarEnd);

writeFileSync('d:/LOOP_COMPANY/LOOP/FE/src/app/components/admin/BlogTab.tsx', g, 'utf8');
console.log('Done — BlogTab wired to blogService.getAdminPosts()');
