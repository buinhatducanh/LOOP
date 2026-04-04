const fs = require("fs");

const locales = ["ja", "ko", "zh"];
const src = JSON.parse(fs.readFileSync("src/i18n/messages/en.json", "utf8"));

locales.forEach((locale) => {
  const msg = JSON.parse(fs.readFileSync(`src/i18n/messages/${locale}.json`, "utf8"));

  const sections = ["search", "mediaClient", "portfolio", "leaderboard", "auth", "customer", "onboarding", "footer", "teamMember"];

  sections.forEach((sec) => {
    if (src[sec] && !msg[sec]) msg[sec] = {};
    if (!src[sec]) return;

    Object.keys(src[sec]).forEach((key) => {
      if (msg[sec] && msg[sec][key] === undefined) {
        // Placeholder: show English (user asked EN display)
        msg[sec][key] = src[sec][key];
      }
    });
  });

  fs.writeFileSync(`src/i18n/messages/${locale}.json`, JSON.stringify(msg, null, 2));
  console.log(`Updated ${locale}.json`);
});

console.log("All locale files updated.");