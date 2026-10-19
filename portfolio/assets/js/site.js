/*
 * Mohit Soni · portfolio
 * Progressive enhancement only: every section reads fine with JavaScript off.
 * No dependencies, no build step, no trackers.
 */
(() => {
  'use strict';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const make = (tag, className) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  };

  const root = document.documentElement;
  const NOW = new Date();
  const EMAIL = 'workmohitsoni0@gmail.com';
  const RESUME_URL = 'assets/Mohit_Soni_Resume.pdf';
  const PROFILES = {
    linkedin: 'https://www.linkedin.com/in/mohitsoni0',
    github: 'https://github.com/m0hits0ni',
  };
  const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent || '');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointer = window.matchMedia('(pointer: coarse)');

  /* ---------- Best-effort storage (private windows and blocked storage throw) ---------- */

  const store = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* not critical */ } },
    remove(key) { try { localStorage.removeItem(key); } catch (e) { /* not critical */ } },
  };

  /* ---------- Toast + clipboard ---------- */

  const toastEl = $('[data-toast]');
  let toastTimer = 0;

  function toast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 2400);
  }

  async function copyText(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      toast(`${label} copied`);
    } catch (e) {
      // Older browsers and some in-app webviews refuse the async API.
      const field = make('textarea');
      field.value = text;
      field.setAttribute('readonly', '');
      field.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
      document.body.appendChild(field);
      field.select();
      let copied = false;
      try { copied = document.execCommand('copy'); } catch (err) { copied = false; }
      field.remove();
      toast(copied ? `${label} copied` : `Couldn’t copy automatically: ${text}`);
    }
  }

  // A real link click opens a new tab in more places than window.open (popup blockers, webviews).
  function openUrl(url) {
    const link = make('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function scrollToSection(id) {
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
    try { history.replaceState(null, '', `#${id}`); } catch (e) { /* file:// in some browsers */ }
    const heading = $('h2, h1', target);
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
  }

  /* ---------- Theme ---------- */

  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const themeMetas = $$('meta[name="theme-color"]');
  themeMetas.forEach((meta) => { meta.dataset.default = meta.getAttribute('content') || ''; });

  const currentTheme = () => root.getAttribute('data-theme') || (darkQuery.matches ? 'dark' : 'light');

  function syncThemeUI() {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    $$('[data-theme-toggle]').forEach((button) => {
      button.setAttribute('aria-label', `Switch to ${next} theme`);
      button.title = `Switch to ${next} theme`;
    });
    // Keep the mobile browser chrome in step with an explicit choice.
    const explicit = root.hasAttribute('data-theme');
    const bg = getComputedStyle(root).getPropertyValue('--bg').trim();
    themeMetas.forEach((meta) => meta.setAttribute('content', explicit && bg ? bg : meta.dataset.default));
  }

  function applyTheme(choice) {
    if (choice === 'system') {
      root.removeAttribute('data-theme');
      store.remove('theme');
    } else {
      root.setAttribute('data-theme', choice);
      store.set('theme', choice);
    }
    syncThemeUI();
  }

  $$('[data-theme-toggle]').forEach((button) => {
    button.addEventListener('click', () => applyTheme(currentTheme() === 'dark' ? 'light' : 'dark'));
  });
  if (darkQuery.addEventListener) darkQuery.addEventListener('change', syncThemeUI);
  syncThemeUI();

  /* ---------- Masthead + scroll spy ---------- */

  const masthead = $('[data-masthead]');
  const onScroll = () => { if (masthead) masthead.classList.toggle('is-scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const navLinks = $$('.nav a[href^="#"]');
  const spied = navLinks.map((link) => document.getElementById(link.hash.slice(1))).filter(Boolean);
  if ('IntersectionObserver' in window && spied.length) {
    const inView = new Map();
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => inView.set(entry.target.id, entry.isIntersecting));
      const current = spied.find((section) => inView.get(section.id));
      navLinks.forEach((link) => {
        if (current && link.hash === `#${current.id}`) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    spied.forEach((section) => spy.observe(section));
  }

  /* ---------- Small live details ---------- */

  $$('[data-mod-key]').forEach((node) => { node.textContent = isMac ? '⌘K' : 'Ctrl K'; });
  $$('[data-year]').forEach((node) => { node.textContent = String(NOW.getFullYear()); });

  const clocks = $$('[data-clock]');
  if (clocks.length) {
    let clockFormat = null;
    try {
      clockFormat = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false,
      });
    } catch (e) { clockFormat = null; }
    const tick = () => {
      if (!clockFormat) return;
      const time = clockFormat.format(new Date());
      clocks.forEach((node) => { node.textContent = time; node.setAttribute('datetime', time); });
    };
    tick();
    setInterval(tick, 20000);
  }

  $$('[data-copy]').forEach((button) => {
    button.addEventListener('click', () => copyText(button.dataset.copy, button.dataset.copyLabel || 'Text'));
  });

  $$('[data-copy-link]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const hash = link.getAttribute('href');
      try { history.replaceState(null, '', hash); } catch (e) { /* ignore */ }
      copyText(window.location.href.split('#')[0] + hash, 'Link to this section');
    });
  });

  /* ---------- Dates: durations and "years of experience" never go stale ---------- */

  const parseMonth = (value) => {
    if (!value || value === 'now') return { y: NOW.getFullYear(), m: NOW.getMonth() + 1 };
    const [y, m] = value.split('-').map(Number);
    return { y, m: m || 1 };
  };
  const monthIndex = (d) => d.y * 12 + (d.m - 1);
  // Inclusive of both months, the way LinkedIn counts: Sep 2022 – Feb 2025 is 2y 6m.
  const monthsBetween = (from, to) => monthIndex(to) - monthIndex(from) + 1;
  const formatSpan = (months) => {
    const years = Math.floor(months / 12);
    const rest = months % 12;
    return [years ? `${years}y` : '', rest ? `${rest}m` : ''].filter(Boolean).join(' ') || '1m';
  };

  $$('[data-span]').forEach((node) => {
    const [from, to] = node.dataset.span.split('..');
    node.textContent = formatSpan(monthsBetween(parseMonth(from), parseMonth(to)));
  });

  $$('[data-years-since]').forEach((node) => {
    const elapsed = monthsBetween(parseMonth(node.dataset.yearsSince), parseMonth('now')) - 1;
    node.textContent = String(Math.max(1, Math.floor(elapsed / 12)));
  });

  /* ---------- Experience trace: lay spans out against today's date ---------- */

  const trace = $('[data-trace]');
  if (trace) {
    const start = parseMonth(trace.dataset.axisStart || '2020-01');
    const now = parseMonth('now');
    // Domain runs to the end of the current month, plus one month of air.
    const domain = monthIndex(now) - monthIndex(start) + 2;
    const x = (d) => (monthIndex(d) - monthIndex(start)) / domain;
    const endOf = (d) => x(d) + 1 / domain;

    const body = $('.trace__body', trace);
    if (body) body.style.setProperty('--now', endOf(now).toFixed(4));

    $$('.span[data-range]', trace).forEach((row) => {
      const [from, to] = row.dataset.range.split('..');
      row.style.setProperty('--s', x(parseMonth(from)).toFixed(4));
      row.style.setProperty('--e', endOf(parseMonth(to)).toFixed(4));
    });

    const axis = $('[data-trace-axis]', trace);
    if (axis) {
      axis.textContent = '';
      for (let year = start.y; year <= now.y; year += 1) {
        const tick = make('span', 'tick');
        tick.style.setProperty('--x', x({ y: year, m: 1 }).toFixed(4));
        tick.textContent = String(year);
        axis.appendChild(tick);
      }
      axis.appendChild(make('span', 'tick tick--now'));
    }

    // Hovering a role lights up its span, so the list and the trace read as one thing.
    $$('[data-role]').forEach((block) => {
      if (block.classList.contains('span')) return;
      const row = $(`.span[data-role="${block.dataset.role}"]`, trace);
      if (!row) return;
      block.addEventListener('mouseenter', () => row.classList.add('is-hover'));
      block.addEventListener('mouseleave', () => row.classList.remove('is-hover'));
    });
  }

  /* ---------- Writing: Medium posts from content/posts.js (+ the optional synced feed) ---------- */

  const writingConfig = window.WRITING || {};
  const syncedFeed = window.MEDIUM_FEED || {};

  function mediumProfile(input) {
    const raw = String(input || '').trim();
    if (!raw) return null;
    let match = raw.match(/^https?:\/\/(?:www\.)?medium\.com\/(@[\w.-]+)/i);
    if (match) return { label: match[1], url: `https://medium.com/${match[1]}` };
    match = raw.match(/^https?:\/\/([\w-]+)\.medium\.com/i);
    if (match) return { label: `${match[1]}.medium.com`, url: `https://${match[1]}.medium.com` };
    match = raw.match(/^@?([\w.-]+)$/);
    if (match) return { label: `@${match[1]}`, url: `https://medium.com/@${match[1]}` };
    if (/^https?:\/\//i.test(raw)) return { label: raw.replace(/^https?:\/\//i, '').replace(/\/$/, ''), url: raw };
    return null;
  }

  const profile = mediumProfile(writingConfig.medium || syncedFeed.handle);

  $$('[data-medium-link]').forEach((link) => {
    if (!profile) return;
    link.href = profile.url;
    link.hidden = false;
  });
  $$('[data-medium-item]').forEach((item) => { item.hidden = !profile; });
  $$('[data-medium-handle]').forEach((node) => { node.textContent = profile ? profile.label : ''; });

  // Medium post URLs end in a hex id; use it so the same post matches across URL variants.
  function postKey(url) {
    try {
      const parsed = new URL(url);
      const id = parsed.pathname.match(/(?:^|[-/])([0-9a-f]{10,16})\/?$/i);
      if (id) return `id:${id[1].toLowerCase()}`;
      return `url:${parsed.hostname.replace(/^www\./, '')}${parsed.pathname.replace(/\/$/, '')}`.toLowerCase();
    } catch (e) {
      return `raw:${String(url).trim().toLowerCase()}`;
    }
  }

  function parseDay(value) {
    const match = String(value || '').match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
    if (!match) return null;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3] || 1));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  // Spelled out by hand: some ICU versions print "Sept", which looks odd next to "Aug".
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formatDay = (value) => {
    const date = parseDay(value);
    return date ? `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}` : '';
  };

  function collectPosts() {
    const merged = new Map();
    const add = (post, source) => {
      if (!post || typeof post !== 'object') return;
      const key = postKey(post.url);
      merged.set(key, { ...(merged.get(key) || {}), ...post, source });
    };
    (Array.isArray(syncedFeed.posts) ? syncedFeed.posts : []).forEach((post) => add(post, 'feed'));
    // Hand-written entries win, so a summary or tag list can be rewritten.
    (Array.isArray(writingConfig.posts) ? writingConfig.posts : []).forEach((post) => add(post, 'manual'));

    const valid = [];
    merged.forEach((post) => {
      if (post.hidden) return;
      const okUrl = /^https?:\/\//i.test(String(post.url || ''));
      if (!post.title || !okUrl || !parseDay(post.date)) {
        console.warn('[writing] Skipped a post. Each post needs a title, an http(s) url and a YYYY-MM-DD date:', post);
        return;
      }
      valid.push({
        title: String(post.title).trim(),
        url: String(post.url).trim(),
        date: String(post.date),
        summary: post.summary ? String(post.summary).trim() : '',
        tags: Array.isArray(post.tags) ? post.tags.map(String).filter(Boolean) : [],
        readTime: Number(post.readTime) > 0 ? Math.round(Number(post.readTime)) : 0,
        image: /^https:\/\//i.test(String(post.image || '')) ? String(post.image) : '',
        featured: Boolean(post.featured),
      });
    });

    valid.sort((a, b) => parseDay(b.date) - parseDay(a.date));
    const featured = valid.findIndex((post) => post.featured);
    if (featured > 0) valid.unshift(valid.splice(featured, 1)[0]);
    return valid;
  }

  const posts = collectPosts();

  (() => {
    const mount = $('[data-writing]');
    if (!mount) return;
    const LIMIT = 6;
    let activeTag = '';
    let expanded = false;

    function renderEmpty() {
      const box = make('div', 'writing__empty');
      const title = make('strong');
      title.textContent = 'First posts are on the way.';
      const text = make('p');
      text.textContent = 'I write about backend engineering and lending infrastructure. New posts appear here as soon as they’re published on Medium.';
      box.append(title, text);
      if (profile) {
        const follow = make('a', 'btn btn--small');
        follow.href = profile.url;
        follow.target = '_blank';
        follow.rel = 'noopener';
        follow.textContent = 'Follow on Medium ↗';
        box.appendChild(follow);
      }
      mount.appendChild(box);
    }

    function renderPost(post, lead) {
      const withCover = lead && Boolean(post.image);
      const item = make('li', ['post', lead && 'post--lead', withCover && 'post--cover'].filter(Boolean).join(' '));
      const link = make('a', 'post__link');
      link.href = post.url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.title = 'Opens on Medium';

      const date = make('time', 'post__date');
      date.dateTime = post.date;
      date.textContent = formatDay(post.date);

      const main = make('div', 'post__main');
      const title = make('h3', 'post__title');
      title.textContent = post.title;
      main.appendChild(title);
      if (post.summary) {
        const summary = make('p', 'post__summary');
        summary.textContent = post.summary;
        main.appendChild(summary);
      }
      const meta = make('p', 'post__meta');
      const bits = [];
      if (post.readTime) bits.push(`${post.readTime} min read`);
      bits.push(...post.tags.slice(0, 4));
      bits.forEach((bit) => {
        const span = make('span');
        span.textContent = bit;
        meta.appendChild(span);
      });
      if (bits.length) main.appendChild(meta);

      const go = make('span', 'post__go');
      go.setAttribute('aria-hidden', 'true');
      go.textContent = '↗';

      link.append(date, main, go);
      if (withCover) {
        const image = make('img', 'post__image');
        image.src = post.image;
        image.alt = '';
        image.loading = 'lazy';
        image.decoding = 'async';
        image.referrerPolicy = 'no-referrer';
        // If the cover fails to load, fall back to the plain layout.
        image.addEventListener('error', () => {
          image.remove();
          item.classList.remove('post--cover');
        });
        link.appendChild(image);
      }
      item.appendChild(link);
      return item;
    }

    function render() {
      mount.textContent = '';
      if (!posts.length) {
        renderEmpty();
        return;
      }

      // A topic only earns a filter chip if it groups at least two posts.
      const counts = new Map();
      posts.forEach((post) => post.tags.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1)));
      const tags = Array.from(counts.entries())
        .filter(([, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([tag]) => tag);

      if (posts.length >= 5 && tags.length >= 2) {
        const filters = make('div', 'writing__filters');
        filters.setAttribute('role', 'group');
        filters.setAttribute('aria-label', 'Filter posts by topic');
        ['', ...tags].forEach((tag) => {
          const chip = make('button', 'chip');
          chip.type = 'button';
          chip.textContent = tag || 'All';
          chip.setAttribute('aria-pressed', String(tag === activeTag));
          chip.addEventListener('click', () => {
            activeTag = tag;
            expanded = false;
            render();
          });
          filters.appendChild(chip);
        });
        mount.appendChild(filters);
      }

      const visible = activeTag ? posts.filter((post) => post.tags.includes(activeTag)) : posts;
      const list = make('ul', 'posts');
      visible.forEach((post, index) => {
        const item = renderPost(post, index === 0 && !activeTag);
        if (!expanded && index >= LIMIT) item.hidden = true;
        list.appendChild(item);
      });
      mount.appendChild(list);

      if (!expanded && visible.length > LIMIT) {
        const more = make('button', 'btn btn--small writing__more');
        more.type = 'button';
        more.textContent = `Show all ${visible.length} posts`;
        more.addEventListener('click', () => {
          expanded = true;
          render();
          const next = $$('.post__link', mount)[LIMIT];
          if (next) next.focus();
        });
        mount.appendChild(more);
      }
    }

    render();
  })();

  /* ---------- Command menu (⌘K / Ctrl K / "/") ---------- */

  (() => {
    const dialog = $('[data-palette]');
    const openers = $$('[data-palette-open]');
    if (!dialog || typeof dialog.showModal !== 'function') {
      openers.forEach((button) => { button.hidden = true; });
      return;
    }
    const input = $('.palette__input', dialog);
    const list = $('.palette__list', dialog);
    const box = $('.palette__box', dialog);
    let commands = [];
    let shown = [];
    let active = 0;

    const labelOf = (command) => (typeof command.label === 'function' ? command.label() : command.label);
    // "resume" should find "résumé".
    const fold = (text) => String(text).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

    function buildCommands() {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      const items = [
        { group: 'Go to', label: 'Experience', hint: '#experience', keywords: 'career trace jobs roles kuhoo zucol tmedia', run: () => scrollToSection('experience') },
        { group: 'Go to', label: 'Selected work', hint: '#work', keywords: 'case studies projects decision engine green channel emi loan calculations payments migration postmortem redis', run: () => scrollToSection('work') },
        { group: 'Go to', label: 'Stack', hint: '#stack', keywords: 'skills architecture tools django postgres redis rabbitmq aws', run: () => scrollToSection('stack') },
        { group: 'Go to', label: 'Writing', hint: '#writing', keywords: 'blog medium posts articles', run: () => scrollToSection('writing') },
        { group: 'Go to', label: 'About', hint: '#about', keywords: 'bio principles how i work education', run: () => scrollToSection('about') },
        { group: 'Go to', label: 'Contact', hint: '#contact', keywords: 'email hire reach message', run: () => scrollToSection('contact') },
        { group: 'Actions', label: 'Copy email address', hint: EMAIL, keywords: 'mail contact', run: () => copyText(EMAIL, 'Email address') },
        { group: 'Actions', label: 'Open résumé', hint: 'PDF', keywords: 'resume cv download pdf', run: () => openUrl(RESUME_URL) },
        { group: 'Actions', label: `Switch to ${next} theme`, hint: 'theme', keywords: 'dark light mode appearance', run: () => applyTheme(next) },
        { group: 'Actions', label: 'Match system theme', hint: 'theme', keywords: 'auto dark light mode appearance', run: () => applyTheme('system') },
        { group: 'Elsewhere', label: 'LinkedIn', hint: 'in/mohitsoni0', keywords: 'profile social', run: () => openUrl(PROFILES.linkedin) },
        { group: 'Elsewhere', label: 'GitHub', hint: 'm0hits0ni', keywords: 'code repos source', run: () => openUrl(PROFILES.github) },
      ];
      if (profile) {
        items.push({ group: 'Elsewhere', label: 'Medium', hint: profile.label, keywords: 'blog writing', run: () => openUrl(profile.url) });
      }
      posts.slice(0, 8).forEach((post) => {
        items.push({ group: 'Posts', label: post.title, hint: formatDay(post.date), keywords: post.tags.join(' '), run: () => openUrl(post.url) });
      });
      return items;
    }

    function score(command, terms) {
      const label = fold(labelOf(command));
      const haystack = fold(`${label} ${command.keywords || ''} ${command.group}`);
      if (!terms.every((term) => haystack.includes(term))) return 0;
      if (label.startsWith(terms[0])) return 3;
      return label.includes(terms[0]) ? 2 : 1;
    }

    function setActive(index) {
      if (!shown.length) return;
      active = (index + shown.length) % shown.length;
      $$('.palette__item', list).forEach((item) => {
        item.setAttribute('aria-selected', String(item.id === `cmd-${active}`));
      });
      const current = document.getElementById(`cmd-${active}`);
      if (current) {
        input.setAttribute('aria-activedescendant', current.id);
        current.scrollIntoView({ block: 'nearest' });
      }
    }

    function renderList() {
      list.textContent = '';
      if (!shown.length) {
        const empty = make('li', 'palette__empty');
        empty.setAttribute('role', 'presentation');
        empty.textContent = 'Nothing matches. Try “email”, “résumé” or “redis”.';
        list.appendChild(empty);
        input.removeAttribute('aria-activedescendant');
        return;
      }
      const grouped = !input.value.trim();
      let lastGroup = '';
      shown.forEach((command, index) => {
        if (grouped && command.group !== lastGroup) {
          const heading = make('li', 'palette__group');
          heading.setAttribute('role', 'presentation');
          heading.setAttribute('aria-hidden', 'true');
          heading.textContent = command.group;
          list.appendChild(heading);
          lastGroup = command.group;
        }
        const option = make('li', 'palette__item');
        option.id = `cmd-${index}`;
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', 'false');
        const label = make('span', 'palette__label');
        label.textContent = labelOf(command);
        option.appendChild(label);
        if (command.hint) {
          const hint = make('span', 'palette__hint');
          hint.textContent = command.hint;
          option.appendChild(hint);
        }
        option.addEventListener('pointermove', () => { if (active !== index) setActive(index); });
        option.addEventListener('click', () => run(index));
        list.appendChild(option);
      });
      setActive(0);
    }

    function filter() {
      const terms = fold(input.value.trim()).split(/\s+/).filter(Boolean);
      if (!terms.length) {
        shown = commands.slice();
      } else {
        shown = commands
          .map((command, order) => ({ command, order, score: score(command, terms) }))
          .filter((entry) => entry.score > 0)
          .sort((a, b) => b.score - a.score || a.order - b.order)
          .map((entry) => entry.command);
      }
      renderList();
    }

    function open() {
      if (dialog.open) return;
      commands = buildCommands();
      input.value = '';
      filter();
      // On touch screens the list works as a menu: focus the panel, not the search box,
      // so the on-screen keyboard stays down until someone taps the field.
      const touch = coarsePointer.matches;
      if (box) box.toggleAttribute('autofocus', touch);
      dialog.showModal();
      if (touch && box) box.focus({ preventScroll: true });
      else input.focus();
    }

    function close() {
      if (dialog.open) dialog.close();
    }

    function run(index) {
      const command = shown[index];
      if (!command) return;
      close();
      command.run();
    }

    input.addEventListener('input', filter);

    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown') { event.preventDefault(); setActive(active + 1); }
      else if (event.key === 'ArrowUp') { event.preventDefault(); setActive(active - 1); }
      else if (event.key === 'Home' && event.target !== input) { event.preventDefault(); setActive(0); }
      else if (event.key === 'End' && event.target !== input) { event.preventDefault(); setActive(shown.length - 1); }
      else if (event.key === 'Enter' && event.target === input) { event.preventDefault(); run(active); }
    });

    // A click on the backdrop lands on the <dialog> itself.
    dialog.addEventListener('click', (event) => { if (event.target === dialog) close(); });

    openers.forEach((button) => button.addEventListener('click', open));
    $$('[data-palette-close]', dialog).forEach((button) => button.addEventListener('click', close));

    const isTyping = (node) => node && (node.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(node.tagName));
    document.addEventListener('keydown', (event) => {
      if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (dialog.open) close(); else open();
        return;
      }
      if (event.key === '/' && !dialog.open && !isTyping(event.target) && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        open();
      }
    });
  })();

  /* ---------- For whoever opens DevTools ---------- */

  try {
    console.log(
      '%c200 OK%c  You opened the console, so we’ll probably get along.\nPlain HTML, CSS and a little JavaScript. Say hello: ' + EMAIL,
      'font: 700 11px ui-monospace, monospace; color: #fff; background: #314ed2; padding: 2px 6px; border-radius: 3px;',
      'font: 12px ui-monospace, monospace;'
    );
  } catch (e) { /* console unavailable */ }
})();
