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
  payment: {
    booking: "Booking"
  }
};

const km = {
  payment: {
    booking: "ការកក់"
  }
};

addTranslations('src/locales/en.json', en);
addTranslations('src/locales/km.json', km);
console.log('Translations injected successfully!');
