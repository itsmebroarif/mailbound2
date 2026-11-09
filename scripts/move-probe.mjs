import { chromium } from "playwright-core";
const browser = await chromium.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-gpu-sandbox",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
page.on("pageerror", (e) => console.log("[pageerror]", e.message));
await page.goto("http://127.0.0.1:4173/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2600);
await page.evaluate(() => document.querySelector('[data-act="new"]')?.click());
await page.waitForTimeout(300);
await page.evaluate(() => document.querySelector('[data-act="go"]')?.click());
await page.waitForFunction(() => !!window.MB?.app.worldScene, null, {
  timeout: 60000,
});

// face yaw=0 (F=+z), teleport into open ground, freeze camera
const setup = await page.evaluate(() => {
  const ws = window.MB.app.worldScene;
  ws.camera.yaw = 0;
  ws.player.pos.set(0, 0, 6);
  ws.player.model.position.set(0, 0, 6);
  ws.player.vel.set(0, 0, 0);
  return { px: ws.player.pos.x, pz: ws.player.pos.z };
});
console.log("start", JSON.stringify(setup));

const press = async (key, ms) => {
  await page.keyboard.down(key);
  await page.waitForTimeout(ms);
  await page.keyboard.up(key);
  await page.waitForTimeout(250);
  return page.evaluate(() => ({
    x: +window.MB.app.worldScene.player.pos.x.toFixed(2),
    z: +window.MB.app.worldScene.player.pos.z.toFixed(2),
  }));
};
console.log("W  (expect +z):", await press("w", 700));
console.log("S  (expect -z):", await press("s", 700));
console.log("D  (expect -x):", await press("d", 700));
console.log("A  (expect +x):", await press("a", 700));
await browser.close();
