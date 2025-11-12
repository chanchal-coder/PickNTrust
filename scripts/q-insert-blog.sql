-- Manual insert for minimal blog post to debug server-side 500
INSERT INTO blog_posts (
  title, excerpt, content, category, tags,
  image_url, video_url, pdf_url,
  published_at, created_at, read_time, slug,
  has_timer, timer_duration, timer_start_time
) VALUES (
  'Health Check Minimal 2', 'Check', 'Hello world', 'General', '[]',
  '', NULL, NULL,
  strftime('%s','now'), strftime('%s','now'), '1 min read', 'health-check-minimal-2',
  0, NULL, NULL
);