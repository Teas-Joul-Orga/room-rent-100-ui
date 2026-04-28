    const fs = require('fs');
const path = 'd:/laragon/www/TesJulFull/room-rent-100-ui/src/page/Admin/TenantRegistrationForm.jsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/<Heading size="sm"/g, '<Heading size="md"');
content = content.replace(/fontSize="2xs"/g, 'fontSize="xs"');
content = content.replace(/<Heading size="md"/g, '<Heading size="lg"');
content = content.replace(/fontSize="xs" fontStyle="italic"/g, 'fontSize="sm" fontStyle="italic"');
content = content.replace(/<Heading size="xs"/g, '<Heading size="sm"');

// We have two <Text fontSize="sm" fontWeight="bold"> elements that should become md
// Let's replace them first before we change xs to sm
content = content.replace(/<Text fontSize="sm"/g, '<Text fontSize="md"');

// Now replace all xs to sm for Text
content = content.replace(/<Text fontSize="xs"/g, '<Text fontSize="sm"');

fs.writeFileSync(path, content);
console.log("Done");
