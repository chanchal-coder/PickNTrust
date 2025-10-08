INSERT INTO canva_posts (content_type, content_id, caption, hashtags, platform, platforms, image_url, status)
VALUES ('product', 10001, 'EC2 AutoShare test (telegram)', '#PickNTrust #AutoShare #EC2', 'telegram', 'telegram', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600', 'pending');

INSERT INTO canva_posts (content_type, content_id, caption, hashtags, platform, platforms, image_url, status)
VALUES ('product', 10002, 'EC2 AutoShare test (facebook)', '#PickNTrust #AutoShare #EC2', 'facebook', 'facebook', 'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=600', 'pending');

SELECT id, content_type, content_id, platform, status, created_at FROM canva_posts WHERE content_id IN (10001,10002);
