const fs = require('fs');

let content = fs.readFileSync('src/page/About.jsx', 'utf8');

// Add import
if (!content.includes('useTranslation')) {
  content = content.replace('import { useNavigate } from "react-router-dom";', 'import { useNavigate } from "react-router-dom";\nimport { useTranslation } from "react-i18next";');
  content = content.replace('const navigate = useNavigate();', 'const navigate = useNavigate();\n  const { t } = useTranslation();');
}

// Nav and Header
content = content.replace(/>\s*Back to Home\s*<\/Button>/g, ">{t('nav.back_to_home')}</Button>");
content = content.replace(/>\s*Home\s*<\/Button>/g, ">{t('nav.home')}</Button>");
content = content.replace(/>\s*Announcement\s*<\/Button>/g, ">{t('nav.announcement')}</Button>");
content = content.replace(/>\s*About Us\s*<\/Button>/g, ">{t('nav.about_us')}</Button>");

// About texts
content = content.replace(/>\s*About Arun Muy Kea\s*<\/Heading>/g, ">{t('about.title')}</Heading>");
content = content.replace(/>\s*Transforming the rental experience in Cambodia through innovation, community, and trust.\s*<\/Text>/g, ">{t('about.subtitle')}</Text>");
content = content.replace(/>\s*Our Mission\s*<\/Heading>/g, ">{t('about.mission_title')}</Heading>");
content = content.replace(/>\s*To provide affordable, comfortable, and well-managed living spaces that foster a sense of belonging and community for everyone. We strive to simplify the rental process through technology and exceptional service.\s*<\/Text>/g, ">{t('about.mission_desc')}</Text>");
content = content.replace(/>\s*Our Vision\s*<\/Heading>/g, ">{t('about.vision_title')}</Heading>");
content = content.replace(/>\s*To become the leading rental community platform in Cambodia, known for our integrity, modern facilities, and the vibrant neighborhoods we help build.\s*<\/Text>/g, ">{t('about.vision_desc')}</Text>");
content = content.replace(/>\s*Our Vibrant Community\s*<\/Heading>/g, ">{t('about.community_title')}</Heading>");
content = content.replace(/>\s*We believe that a house becomes a home when you're surrounded by a supportive community.\s*<\/Text>/g, ">{t('about.community_desc')}</Text>");
content = content.replace(/>\s*Shared Spaces\s*<\/Heading>/g, ">{t('about.shared_spaces')}</Heading>");
content = content.replace(/>\s*Our common areas are designed to encourage interaction and help neighbors become friends.\s*<\/Text>/g, ">{t('about.shared_desc')}</Text>");
content = content.replace(/>\s*Community Events\s*<\/Heading>/g, ">{t('about.events_title')}</Heading>");
content = content.replace(/>\s*From holiday dinners to weekend gatherings, we host events that bring everyone together.\s*<\/Text>/g, ">{t('about.events_desc')}</Text>");
content = content.replace(/>\s*Safe & Secure\s*<\/Heading>/g, ">{t('about.safe_title')}</Heading>");
content = content.replace(/>\s*Peace of mind is our priority, with 24\/7 security and a community that looks out for one another.\s*<\/Text>/g, ">{t('about.safe_desc')}</Text>");

// Team
content = content.replace(/>\s*Meet Our Team\s*<\/Heading>/g, ">{t('about.team_title')}</Heading>");
content = content.replace(/>\s*The dedicated professionals behind Arun Muy Kea.\s*<\/Text>/g, ">{t('about.team_desc')}</Text>");
content = content.replace(/>\s*Dedicated to making your rental experience smooth and enjoyable.\s*<\/Text>/g, ">{t('about.team_msg')}</Text>");

// Footer
content = content.replace(/>\s*The most reliable room rental management system.\s*<\/Text>/g, ">{t('footer.desc')}</Text>");
content = content.replace(/>\s*Quick Links\s*<\/Heading>/g, ">{t('footer.quick_links')}</Heading>");
content = content.replace(/>\s*Contact Details\s*<\/Heading>/g, ">{t('footer.contact_details')}</Heading>");
content = content.replace(/>\s*About\s*<\/Heading>/g, ">{t('footer.about_title')}</Heading>");
content = content.replace(/>\s*Find your perfect home with our easy-to-use rental platform.\s*<\/Text>/g, ">{t('footer.about_desc')}</Text>");
content = content.replace(/Arun Muy Kea. All rights reserved./g, "Arun Muy Kea. {t('footer.rights')}");

fs.writeFileSync('src/page/About.jsx', content);
console.log('About.jsx translated');