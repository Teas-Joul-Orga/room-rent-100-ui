const fs = require('fs');

let content = fs.readFileSync('src/page/Landing.jsx', 'utf8');

// Nav
content = content.replace(/>\s*Home\s*<\/Button>/g, ">{t('nav.home')}</Button>");
content = content.replace(/>\s*Announcement\s*<\/Button>/g, ">{t('nav.announcement')}</Button>");
content = content.replace(/>\s*About Us\s*<\/Button>/g, ">{t('nav.about_us')}</Button>");

// Hero
content = content.replace(/>\s*Exploring the\s*<\/Text>/g, ">{t('landing.hero_pre')}</Text>");
content = content.replace(/>\s*Rental \s*<Text as="span" color="red.400">\s*Community\s*<\/Text>\s*<\/Heading>/g, ">\n                {t('landing.hero_main')} <Text as=\"span\" color=\"red.400\">{t('landing.hero_highlight')}</Text>\n              </Heading>");
content = content.replace(/>\s*"More than just listings — we're building neighborhoods. Discover your next home and connect with a community that fits your lifestyle."\s*<\/Text>/g, ">{t('landing.hero_desc')}</Text>");
content = content.replace(/>\s*Find House\s*<\/Button>/g, ">{t('landing.find_house')}</Button>");
content = content.replace(/>\s*Explore More\s*<\/Button>/g, ">{t('landing.explore_more')}</Button>");

// Available Rooms
content = content.replace(/>\s*Available Rooms\s*<\/Heading>/g, ">{t('landing.avail_title')}</Heading>");
content = content.replace(/>\s*Browse our current vacancies and find a space that fits your lifestyle.\s*<\/Text>/g, ">{t('landing.avail_desc')}</Text>");
content = content.replace(/placeholder="Search by room name or details..."/g, 'placeholder={t("landing.search_placeholder")}');
content = content.replace(/>\s*No rooms currently available that match your search.\s*<\/Text>/g, ">{t('landing.no_rooms_found')}</Text>");
content = content.replace(/>\s*Clear Search\s*<\/Button>/g, ">{t('landing.clear_search')}</Button>");
content = content.replace(/>\s*Available\s*<\/Badge>/g, ">{t('landing.available_badge')}</Badge>");
content = content.replace(/Floor \{room\.floor/g, "{t('landing.floor')} {room.floor");
content = content.replace(/>\s*View Details\s*<\/Button>/g, ">{t('landing.view_details')}</Button>");
content = content.replace(/>\s*Book Now\s*</g, ">{t('landing.book_now')}<");
content = content.replace(/>\s*Login to Book\s*</g, ">{t('landing.login_to_book')}<");
content = content.replace(/>\s*Show Less\s*</g, ">{t('landing.show_less')}<");
content = content.replace(/`View All Rooms \(\$\{filteredRooms\.length\}\)`/g, "t('landing.view_all_rooms', { count: filteredRooms.length })");

// Location
content = content.replace(/>\s*Our Location\s*<\/Heading>/g, ">{t('landing.location_title')}</Heading>");
content = content.replace(/>\s*Visit us or get in touch. We are conveniently located at\s*<b/g, ">{t('landing.location_desc')} <b");

// Footer
content = content.replace(/>\s*The most reliable room rental management system. Powered by /g, ">{t('footer.desc')} ");
content = content.replace(/>\s*Quick Links\s*<\/Heading>/g, ">{t('footer.quick_links')}</Heading>");
content = content.replace(/>\s*Contact Details\s*<\/Heading>/g, ">{t('footer.contact_details')}</Heading>");
content = content.replace(/>\s*About\s*<\/Heading>/g, ">{t('footer.about_title')}</Heading>");
content = content.replace(/>\s*Find your perfect home with our easy-to-use rental platform. We prioritize comfort and affordability.\s*<\/Text>/g, ">{t('footer.about_desc')}</Text>");
content = content.replace(/ All rights reserved./g, " {t('footer.rights')}");

fs.writeFileSync('src/page/Landing.jsx', content);
console.log('Landing.jsx translated');