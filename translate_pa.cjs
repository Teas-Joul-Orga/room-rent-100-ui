const fs = require('fs');

let content = fs.readFileSync('src/page/PublicAnnouncements.jsx', 'utf8');

// Nav
content = content.replace(/>\s*Home\s*<\/Button>/g, ">{t('nav.home')}</Button>");
content = content.replace(/>\s*Announcement\s*<\/Button>/g, ">{t('nav.announcement')}</Button>");
content = content.replace(/>\s*About Us\s*<\/Button>/g, ">{t('nav.about_us')}</Button>");
content = content.replace(/>\s*Back to Home\s*<\/Button>/g, ">{t('nav.back_to_home')}</Button>");

// Announcement Texts
content = content.replace(/>\s*Community Feed\s*<\/Heading>/g, ">{t('announcements.board_title')}</Heading>");
content = content.replace(/>\s*Stay updated with the latest news from your community.\s*<\/Text>/g, ">{t('announcements.board_desc')}</Text>");
content = content.replace(/>\s*Property Management\s*<\/Text>/g, ">{t('announcements.property_mgmt')}</Text>");
content = content.replace(/`Scheduled for \$\{dayjs\(a\.published_at\)\.format\('MMM D'\)\}`/g, "t('announcements.scheduled_for', { date: dayjs(a.published_at).format('MMM D') })");
content = content.replace(/>\s*Official Update\s*<\/Text>/g, ">{t('announcements.official_update')}</Text>");
content = content.replace(/>\s*Queued\s*<\/Badge>/g, ">{t('announcements.queued')}</Badge>");
content = content.replace(/>\s*No news at the moment\s*<\/Text>/g, ">{t('announcements.no_news_title')}</Text>");
content = content.replace(/>\s*Everything is quiet across the community.\s*<\/Text>/g, ">{t('announcements.no_news_desc')}</Text>");

// Footer
content = content.replace(/>\s*The most reliable room rental management system.\s*<\/Text>/g, ">{t('footer.desc')}</Text>");
content = content.replace(/>\s*Quick Links\s*<\/Heading>/g, ">{t('footer.quick_links')}</Heading>");
content = content.replace(/>\s*Contact Details\s*<\/Heading>/g, ">{t('footer.contact_details')}</Heading>");
content = content.replace(/>\s*About\s*<\/Heading>/g, ">{t('footer.about_title')}</Heading>");
content = content.replace(/>\s*Find your perfect home with our easy-to-use rental platform.\s*<\/Text>/g, ">{t('footer.about_desc')}</Text>");
content = content.replace(/Arun Muy Kea. All rights reserved./g, "Arun Muy Kea. {t('footer.rights')}");

fs.writeFileSync('src/page/PublicAnnouncements.jsx', content);
console.log('PublicAnnouncements.jsx translated');