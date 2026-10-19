/*
 * Writing: the posts listed in the "Writing" section.
 *
 * To add a Medium post, copy one of the entries below and fill it in. Only
 * `title`, `url` and `date` are required. Order doesn't matter: the newest post
 * is shown first (unless one is marked `featured: true`, which pins it to the top).
 *
 * New posts also show up on their own: `node scripts/sync-medium.mjs`, or the
 * GitHub Action in .github/workflows/sync-medium.yml, pulls your latest posts
 * from Medium's RSS feed into content/medium-feed.js (summary, read time and
 * cover image included). Anything listed here wins over the synced copy of the
 * same post, so you can tidy a title or tags, or hide a post with `hidden: true`.
 */
window.WRITING = {
  // Your Medium handle or profile URL. Leave empty to hide the Medium links.
  medium: "@mohitsoni_",

  posts: [
    {
      title: "PostgreSQL 18 + pgvector: The Definitive Guide to Building Production-Grade RAG Pipelines",
      url: "https://medium.com/@mohitsoni_/postgresql-18-pgvector-the-definitive-guide-to-building-production-grade-rag-pipelines-239ee9c0e56f",
      date: "2026-02-16",
      tags: ["PostgreSQL", "pgvector", "AI"],
    },
    {
      title: "Beyond LeetCode: How Data Structures Drive Real-World Backend Systems",
      url: "https://medium.com/@mohitsoni_/beyond-leetcode-how-data-structures-drive-real-world-backend-systems-1b489c84b955",
      date: "2026-01-24",
      tags: ["Data structures", "Backend", "PostgreSQL"],
    },
    {
      title: "Secrets of Scale: 4 Counter-Intuitive Postgres Database Tricks That Power Tech Giants",
      url: "https://medium.com/@mohitsoni_/secrets-of-scale-4-counter-intuitive-postgres-database-tricks-that-power-tech-giants-3013326709f5",
      date: "2025-10-24",
      tags: ["PostgreSQL", "Indexing", "Scaling"],
    },
    {
      title: "The Unseen Symphony: What Really Happens When You Connect to PostgreSQL",
      url: "https://medium.com/@mohitsoni_/the-unseen-symphony-what-really-happens-when-you-connect-to-postgresql-053cd7c27ba9",
      date: "2025-10-22",
      tags: ["PostgreSQL", "Database internals"],
    },
    {
      title: "6 Surprising Truths About RabbitMQ I Wish I’d Known Sooner",
      url: "https://medium.com/@mohitsoni_/6-surprising-truths-about-rabbitmq-i-wish-id-known-sooner-4b9b78593d1b",
      date: "2025-10-21",
      tags: ["RabbitMQ", "Messaging", "Distributed systems"],
    },

    // Template for the next one:
    // {
    //   title: "Post title",
    //   url: "https://medium.com/@mohitsoni_/your-post-slug-1a2b3c4d5e6f",
    //   date: "2026-11-01",                // YYYY-MM-DD
    //   summary: "Optional. One or two sentences; otherwise the first paragraph from Medium is used.",
    //   tags: ["Django", "Payments"],      // optional
    //   readTime: 8,                       // optional, minutes
    //   featured: false                    // optional
    // },
  ],
};
