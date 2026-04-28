const fs = require('fs');

const addTranslations = (file, newKeys) => {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const key in newKeys) {
    if (!data[key]) {
      data[key] = {};
    }
    data[key] = { ...data[key], ...newKeys[key] };
  }
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

const en = {
  nav: {
    home: "Home",
    announcement: "Announcement",
    about_us: "About Us",
    back_to_home: "Back to Home"
  },
  landing: {
    hero_pre: "Exploring the",
    hero_main: "Rental",
    hero_highlight: "Community",
    hero_desc: "More than just listings — we're building neighborhoods. Discover your next home and connect with a community that fits your lifestyle.",
    find_house: "Find House",
    explore_more: "Explore More",
    avail_title: "Available Rooms",
    avail_desc: "Browse our current vacancies and find a space that fits your lifestyle.",
    search_placeholder: "Search by room name or details...",
    no_rooms_found: "No rooms currently available that match your search.",
    clear_search: "Clear Search",
    available_badge: "Available",
    floor: "Floor",
    view_details: "View Details",
    book_now: "Book Now",
    login_to_book: "Login to Book",
    show_less: "Show Less",
    view_all_rooms: "View All Rooms ({{count}})",
    location_title: "Our Location",
    location_desc: "Visit us or get in touch. We are conveniently located at"
  },
  about: {
    title: "About Arun Muy Kea",
    subtitle: "Transforming the rental experience in Cambodia through innovation, community, and trust.",
    mission_title: "Our Mission",
    mission_desc: "To provide affordable, comfortable, and well-managed living spaces that foster a sense of belonging and community for everyone. We strive to simplify the rental process through technology and exceptional service.",
    vision_title: "Our Vision",
    vision_desc: "To become the leading rental community platform in Cambodia, known for our integrity, modern facilities, and the vibrant neighborhoods we help build.",
    community_title: "Our Vibrant Community",
    community_desc: "We believe that a house becomes a home when you're surrounded by a supportive community.",
    shared_spaces: "Shared Spaces",
    shared_desc: "Our common areas are designed to encourage interaction and help neighbors become friends.",
    events_title: "Community Events",
    events_desc: "From holiday dinners to weekend gatherings, we host events that bring everyone together.",
    safe_title: "Safe & Secure",
    safe_desc: "Peace of mind is our priority, with 24/7 security and a community that looks out for one another.",
    team_title: "Meet Our Team",
    team_desc: "The dedicated professionals behind Arun Muy Kea.",
    team_msg: "Dedicated to making your rental experience smooth and enjoyable."
  },
  footer: {
    desc: "The most reliable room rental management system. Powered by",
    quick_links: "Quick Links",
    contact_details: "Contact Details",
    about_title: "About",
    about_desc: "Find your perfect home with our easy-to-use rental platform. We prioritize comfort and affordability.",
    rights: "All rights reserved."
  },
  announcements: {
    board_title: "Community Feed",
    board_desc: "Stay updated with the latest news from your community.",
    property_mgmt: "Property Management",
    scheduled_for: "Scheduled for {{date}}",
    official_update: "Official Update",
    queued: "Queued",
    no_news_title: "No news at the moment",
    no_news_desc: "Everything is quiet across the community."
  }
};

const km = {
  nav: {
    home: "ទំព័រដើម",
    announcement: "សេចក្តីប្រកាស",
    about_us: "អំពីយើង",
    back_to_home: "ត្រឡប់ទៅទំព័រដើម"
  },
  landing: {
    hero_pre: "ស្វែងយល់ពីសហគមន៍",
    hero_main: "ជួល",
    hero_highlight: "អចលនទ្រព្យ",
    hero_desc: "ច្រើនជាងការជួលអចលនទ្រព្យ — យើងកំពុងកសាងសហគមន៍រស់នៅមួយ។ ស្វែងរកផ្ទះរបស់អ្នកនិងរស់នៅក្នុងបរិយាកាសដែលសាកសមនឹងអ្នក។",
    find_house: "ស្វែងរកផ្ទះ",
    explore_more: "មើលបន្ថែម",
    avail_title: "បន្ទប់ទំនេរ",
    avail_desc: "ស្វែងរកយូនីតទំនេរនាពេលបច្ចុប្បន្នរបស់យើង ដែលសាកសមនឹងរបៀបរស់នៅរបស់អ្នក។",
    search_placeholder: "ស្វែងរកតាមឈ្មោះបន្ទប់ ឬលម្អិត...",
    no_rooms_found: "រកមិនឃើញបន្ទប់ទំនេរដែលត្រូវនឹងការស្វែងរករបស់អ្នកទេ។",
    clear_search: "សម្អាតការស្វែងរក",
    available_badge: "ទំនេរ",
    floor: "ជាន់",
    view_details: "មើលលម្អិត",
    book_now: "កក់ឥឡូវនេះ",
    login_to_book: "ចូលប្រើប្រាស់ដើម្បីកក់",
    show_less: "បង្ហាញតិចជាងមុន",
    view_all_rooms: "មើលបន្ទប់ទាំងអស់ ({{count}})",
    location_title: "ទីតាំងរបស់យើង",
    location_desc: "មកកាន់ទីតាំងផ្ទាល់ ឬទំនាក់ទំនងយើង។ យើងស្ថិតនៅទីតាំងដ៏ងាយស្រួលមួយនៅ"
  },
  about: {
    title: "អំពី អរុណ មួយគា",
    subtitle: "ផ្លាស់ប្តូរបទពិសោធន៍នៃការជួលនៅក្នុងប្រទេសកម្ពុជា តាមរយៈការបង្កើតថ្មី សហគមន៍ និងទំនុកចិត្ត។",
    mission_title: "បេសកកម្មរបស់យើង",
    mission_desc: "ដើម្បីផ្តល់នូវកន្លែងរស់នៅដែលមានតម្លៃសមរម្យ ផាសុកភាព និងមានការគ្រប់គ្រងល្អ ដែលផ្តល់នូវភាពកក់ក្តៅនិងសហគមន៍សម្រាប់មនុស្សគ្រប់គ្នា។ យើងខិតខំសម្រួលដំណើរការជួលតាមរយៈបច្ចេកវិទ្យា និងសេវាកម្មដ៏ល្អឥតខ្ចោះ។",
    vision_title: "ចក្ខុវិស័យរបស់យើង",
    vision_desc: "ដើម្បីក្លាយជាវេទិកាសហគមន៍ជួលឈានមុខគេនៅកម្ពុជា ដែលល្បីល្បាញដោយសារសុចរិតភាព គ្រឿងបរិក្ខារទំនើប និងសង្កាត់ដ៏រស់រវើកដែលយើងបានជួយស្ថាបនា។",
    community_title: "សហគមន៍ដ៏រស់រវើករបស់យើង",
    community_desc: "យើងជឿជាក់ថាផ្ទះមួយនឹងក្លាយជាលំនៅឋានដ៏ពិតប្រាកដ នៅពេលដែលអ្នកស្ថិតនៅជុំវិញសហគមន៍ដែលចេះគាំទ្រគ្នា។",
    shared_spaces: "ទីធ្លារួម",
    shared_desc: "តំបន់រួមរបស់យើងត្រូវបានរចនាឡើងដើម្បីលើកទឹកចិត្តឱ្យមានអន្តរកម្ម និងជួយឱ្យអ្នកជិតខាងក្លាយជាមិត្តភក្តិ។",
    events_title: "ព្រឹត្តិការណ៍សហគមន៍",
    events_desc: "ចាប់ពីពិធីជប់លៀងរហូតដល់ការជួបជុំចុងសប្តាហ៍ យើងរៀបចំព្រឹត្តិការណ៍ដែលនាំមនុស្សគ្រប់គ្នាមកជួបជុំគ្នា។",
    safe_title: "សុវត្ថិភាព និងសន្តិសុខ",
    safe_desc: "ភាពសុខសាន្តផ្លូវចិត្តគឺជាអាទិភាពរបស់យើង ជាមួយនឹងសន្តិសុខ ២៤ ម៉ោង និងសហគមន៍ដែលចេះថែរក្សាគ្នាទៅវិញទៅមក។",
    team_title: "ជួបជាមួយក្រុមការងាររបស់យើង",
    team_desc: "អ្នកជំនាញដែលលះបង់នៅពីក្រោយ អរុណ មួយគា។",
    team_msg: "ប្តេជ្ញាធ្វើឱ្យបទពិសោធន៍ជួលរបស់អ្នករលូន និងរីករាយ។"
  },
  footer: {
    desc: "ប្រព័ន្ធគ្រប់គ្រងការជួលបន្ទប់ដែលគួរឱ្យទុកចិត្តបំផុត។ គាំទ្រដោយ",
    quick_links: "តំណរភ្ជាប់រហ័ស",
    contact_details: "ព័ត៌មានទំនាក់ទំនង",
    about_title: "អំពី",
    about_desc: "ស្វែងរកផ្ទះដ៏ល្អឥតខ្ចោះរបស់អ្នកជាមួយវេទិកាជួលដ៏ងាយស្រួលរបស់យើង។ យើងផ្តល់អាទិភាពលើភាពងាយស្រួល និងផាសុកភាព។",
    rights: "រក្សាសិទ្ធិគ្រប់យ៉ាង។"
  },
  announcements: {
    board_title: "ព័ត៌មានសហគមន៍",
    board_desc: "តាមដានព័ត៌មានថ្មីៗពីសហគមន៍របស់អ្នក។",
    property_mgmt: "ការគ្រប់គ្រងអចលនទ្រព្យ",
    scheduled_for: "បានកំណត់ពេលសម្រាប់ {{date}}",
    official_update: "ព័ត៌មានផ្លូវការ",
    queued: "រង់ចាំផ្សាយ",
    no_news_title: "មិនមានព័ត៌មានថ្មីៗទេ",
    no_news_desc: "ស្ថានភាពគឺស្ងប់ស្ងាត់នៅទូទាំងសហគមន៍។"
  }
};

addTranslations('src/locales/en.json', en);
addTranslations('src/locales/km.json', km);
console.log('Translations injected successfully!');