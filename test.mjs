import puppeteer from "puppeteer";
import fs from "fs";

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on("console", msg => console.log("PAGE LOG:", msg.text()));
  page.on("pageerror", error => console.log("PAGE ERROR:", error.message, error.stack));
  
  try {
    console.log("Navigating to Tenants page...");
    await page.goto("http://localhost:5173/dashboard/tenants", { waitUntil: "networkidle0", timeout: 10000 });
  } catch (err) {
    console.log("Nav err:", err);
  }

  try {
    console.log("Navigating to Furniture page...");
    await page.goto("http://localhost:5173/dashboard/furniture", { waitUntil: "networkidle0", timeout: 10000 });
  } catch (err) {
    console.log("Nav err:", err);
  }

  await browser.close();
})();
