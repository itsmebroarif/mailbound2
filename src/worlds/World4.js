// WORLD 4 — WILD FOREST (The Whispering Hollow)
// Dense forest, river, waterfall, cave. Beatrix & Rowan carry secrets.

export default {
  id: 'w4',
  name: 'Wild Forest',
  bounds: 66,
  spawn: [0, -56],
  jetPad: [0, -56],
  hub: [0, 8],
  theme: {
    sky: 0xffd2a6,
    fog: 0x9cc4ac, fogNear: 22, fogFar: 90,
    sun: 0xffe0aa, sunIntensity: 0.85, hemiIntensity: 0.55,
    skyFill: 0xb6d4c1, groundFill: 0x2e4d38, sunPos: [30, 34, -58],
    groundMap: 'grass', groundTint: 0xa5d39a,
    water: { x: 0, z: -18, w: 140, d: 10, y: -0.5, repeatX: 14, repeatY: 1 },
    boundary: [
      { make: 'pine', x: -60, z: 0, opts: { scale: 2.1 } }, { make: 'pine', x: 60, z: 0, opts: { scale: 2.1 } },
      { make: 'pine', x: -48, z: -52, opts: { scale: 1.6 } }, { make: 'pine', x: 48, z: -52, opts: { scale: 1.6 } },
      { make: 'mountainCone', x: 0, z: -70, opts: { scale: 1.5, color: 0x4b614b } },
      { make: 'mountainCone', x: -58, z: 46, opts: { scale: 1.3, color: 0x4b614b } },
      { make: 'mountainCone', x: 58, z: 46, opts: { scale: 1.3, color: 0x4b614b } },
      { make: 'pine', x: -34, z: 60, opts: { scale: 1.7 } }, { make: 'pine', x: 34, z: 60, opts: { scale: 1.7 } },
    ],
  },
  props: [
    // river crossing: bridge at x=0 across the z=-18 river band
    { make: 'bridge', x: 0, z: -18, ry: 0, opts: { len: 16 } },

    // waterfall at the eastern bend, feeding the river
    { make: 'waterfall', x: 50, z: -18, ry: -Math.PI / 2, opts: { w: 9, h: 10 } },

    // ranger hut (hub) with campfire
    { make: 'cabin', x: 0, z: 10, ry: 0, opts: {} },
    { make: 'campfire', x: 2.4, z: 4.9, opts: {} },

    // hidden cabins
    { make: 'cabin', x: -24, z: 22, ry: 0.8, opts: {} },
    { make: 'cabin', x: 26, z: 26, ry: -0.7, opts: {} },

    // cave mouth — irresistible
    { make: 'caveArch', x: -40, z: -28, ry: Math.PI / 4, opts: {} },

    // dense tree clusters
    { make: 'pine', x: -14, z: -6, opts: { scale: 1.1 } },
    { make: 'pine', x: 14, z: -4, opts: { scale: 1.2 } },
    { make: 'pine', x: -12, z: -26, opts: { scale: 1.3 } },
    { make: 'pine', x: 22, z: -30, opts: { scale: 1.1 } },
    { make: 'tree', x: -28, z: -8, opts: { scale: 1.3 } },
    { make: 'tree', x: 18, z: 2, opts: { scale: 1.5 } },
    { make: 'tree', x: -30, z: 30, opts: { scale: 1.4 } },
    { make: 'tree', x: 36, z: 8, opts: { scale: 1.25 } },
    { make: 'tree', x: -6, z: 34, opts: { scale: 1.5 } },
    { make: 'pine', x: 40, z: -34, opts: { scale: 1.5 } },
    { make: 'pine', x: -34, z: 6, opts: { scale: 1.2 } },

    // fallen logs / rocks
    { make: 'rock', x: -8, z: -30, opts: { scale: 1.6 } },
    { make: 'rock', x: 34, z: -2, opts: { scale: 1.2 } },
    { make: 'rock', x: -44, z: 22, opts: { scale: 2.1 } },
    { make: 'bush', x: -16, z: 30 }, { make: 'bush', x: 10, z: 14 }, { make: 'bush', x: 30, z: -26 },

    // bee farm corner
    { make: 'stall', x: 24, z: 30, ry: 2.4, opts: { color: 0xffb43d } },
    { make: 'warkop', x: 27, z: 39, ry: 2.2 },
    { make: 'saung', x: -38, z: 40 },
    { make: 'school', x: -34, z: -14, ry: 2.8, opts: { type: 'SMP' } },

  ],
  collectibles: [
    [-40, -30], [34, -16], [0, -18], [-22, 20], [50, -18], [10, 40], [-46, -2], [28, 16],
  ],
  enemyZones: [
    { cx: -30, cz: -16, radius: 13, archs: [{ arch: 'beast', count: 2 }, { arch: 'runner', count: 1 }] },
    { cx: 22, cz: -8, radius: 12, archs: [{ arch: 'beast', count: 2 }] },
    { cx: -36, cz: 36, radius: 12, archs: [{ arch: 'brute', count: 1 }, { arch: 'beast', count: 1 }] },
  ],
  npcs: [
    {
      id: 'rowan', name: 'Ranger Rowan', pos: [1.8, 7.6], facing: 2.4,
      palette: { shirt: 0x57b86e, pants: 0x31363f, skin: 0xffc9a3, hair: 0x141628, hat: null },
      role: 'hub',
      dialog: {
        intro: ['Stop there, courier — good news: the river is safe today.', 'Rowan, ranger hutan. Aku menjaga Hollow ini mendengarkan dan tidak ada yang menginjak lumut.'],
        repeat: ['Setiap pohon di sini hidup lebih lama dari orang yang menanamnya.', 'The cave won\'t ever close. Caves dislike closing.'],
      },
      secret: { type: 'talk', need: 2, item: 'forest_charm', hint: 'Keep coming back. The forest trusts patience by ear, not by mouth.' },
    },
    {
      id: 'beatrix', name: 'Beatrix si Peternak Lebah', pos: [23, 28.2], facing: 2.4,
      palette: { shirt: 0xffb43d, pants: 0x31363f, skin: 0xffd9b3, hair: 0x5b3a24, hat: 'straw' },
      role: 'npc',
      dialog: {
        intro: ['Ah! Tamu! Hati-hati lebah gemuk, mereka lebih lembut dari penampilannya.', 'Aku menanam madu untuk ranger, dan sekali untuk seorang inspektur pos yang sangat sopan.'],
        repeat: ['Lebah-lebah menolak terbang di atas sungai saat bulan purnama. Secara ilmiah, baik hati.', 'Setiap toples diberi label bunga pertama yang ditolak lebah.'],
      },
      secret: { type: 'bring', need: 4, item: 'honey_vial', hint: 'Bawa empat stempel emas dan aku tukar dengan madu yang menenangkan tangan gemetar.' },
    },
    {
      id: 'kuga', name: 'Kuga si Penjaga Kabin', pos: [-23, 24.7], facing: 1.1,
      palette: { shirt: 0xb58a5a, pants: 0x31363f, skin: 0xe8b390, hair: 0x141628, hat: 'straw' },
      role: 'npc',
      dialog: {
        intro: ['Selamat datang ke kabin utara. Air: segar. Atap: anti-lumut.', 'Kuga, penjaga kabin utara.'],
        repeat: ['Semua batang kayu di sini ditebang di abad yang lalu. Kami tidak pernah memotong lagi.', 'Bawa kayu bakar dan aku tukar cerita untuk cerita.'],
      },
    },
    {
      id: 'ellen', name: 'Ellen si Pemancing', pos: [-7.6, -19.4], facing: -0.5,
      palette: { shirt: 0x59d0c8, pants: 0x31363f, skin: 0xffd9b3, hair: 0x5b3a24, hat: null },
      role: 'npc',
      dialog: {
        intro: ['Oh! Itu kurir, BUKAN ikan! Hari yang baik untuk menangkap keduanya.', 'Ellen, memancing sejak sungai masih muda.'],
        repeat: ['Aku pernah dapat ikan terbesarku tanpa umpan.', 'Emas di bawah air berkilau minggu hujan.'],
      },
    },
    {
      id: 'dusty', name: 'Dusty si Pengembara', pos: [-38.2, -25.3], facing: 2.1,
      palette: { shirt: 0x8aa4c8, pants: 0x141628, skin: 0xffc9a3, hair: 0x141628, hat: null },
      role: 'npc',
      dialog: {
        intro: ['(Dusty does not define himself)', 'Kalau kamu temukan gua, tetap di luar gua.'],
        repeat: ['Aku tiba kemarin. Atau satu dekade lalu. Waktu bertingkah aneh di sekitar gua.'],
      },
    },
    {
      id: 'lena', name: 'Lena si Kolektor Music Box', pos: [25.3, 27.8], facing: 2.2,
      palette: { shirt: 0xc58cff, pants: 0x31363f, skin: 0xffd9b3, hair: 0x141628, hat: null },
      role: 'npc',
      dialog: {
        intro: ['Enam belas nada kecil, dan setiap nadanya berkabel.', 'Lena, kolektor kotak musik. Delapan puluh satu di antara mereka bernyanyi di truk saya.'],
        repeat: ['Nomor enam puluh dua hanya bermain saat angin bertiup ke timur.', 'Beberapa di antaranya berisi surat. Tidak semua harus dibuka.'],
      },
    },
    {
      id: 'rusty', name: 'Rusty si Pelukis Jembatan', pos: [3.8, -19.1], facing: 1.4,
      palette: { shirt: 0xff9e9e, pants: 0x31363f, skin: 0xe8b390, hair: 0x141628, hat: null },
      role: 'npc',
      dialog: {
        intro: ['Stabil… seimbang sempurna… tuh!', 'Aku melukis satu jembatan setiap tahun dan tidak ada yang kubenci di antara mereka.'],
        repeat: ['Dua belas lapis cat dan satu izin tunggal. Keajaiban birokrasi kota.', 'Jembatan baja hum, suatu hari kita akan mendengar simfoni.'],
      },
    },
    {
      id: 'nilla', name: 'Nilla si Penghuni Gua', pos: [-42.3, -30.6], facing: 0.8,
      palette: { shirt: 0x6b5f86, pants: 0x31363f, skin: 0xe0cdc1, hair: 0x141628, hat: null },
      role: 'npc',
      dialog: {
        intro: ['shhhh — be still. The cave is listening.', 'Nilla. Aku mengerucut ke sudut.'],
        repeat: ['Iaung rintihan di bawah gua bukan makhluk — belum.', 'Tanya Dusty soal angin. Dia punya catatan.'],
      },
    },
  ],
  missions: [
    {
      id: 'w4_m1', title: 'Ranger Post Utara', type: 'standard',
      from: { npc: 'rowan', name: 'Ranger Rowan' }, to: { npc: 'kuga' },
      rewards: { xp: 150, coins: 42 }, main: true,
      intro: 'Kuga menunggu kotak jarum kompas di kabin utara. Awasi kayunya — mereka tidak pernah minta diduduki.',
      outro: 'Kuga membuka kotak dengan sungkur. Kebiasaan buruk itu menular.',
    },
    {
      id: 'w4_m2', title: 'The River Vial', type: 'fragile', fragile: true,
      from: { npc: 'rowan', name: 'Ranger Rowan' },
      to: { npc: 'beatrix' },
      rewards: { xp: 160, coins: 46 }, main: true,
      requireMissions: ['w4_m1'],
      intro: 'Botol madu kristal — TIDAK BOLEH jatuh, TIDAK BOLEH miring, TIDAK BOLEH kena bersin. Seberangi jembatan, lalu belok kiri sekali, sangat menghormati setiap batu di jalan.',
      outro: 'Beatrix mengangkatnya ke matahari, mengangguk sekali, lalu menyegel tutupnya tiga kali.',
    },
    {
      id: 'w4_m3', title: 'The Hidden Grove Relay', type: 'multi',
      from: { npc: 'rowan', name: 'Ranger Rowan' },
      to: { multi: [{ point: [-40, -30] }, { npc: 'rusty' }, { point: [34, 22] }] },
      rewards: { xp: 185, coins: 54 }, main: true,
      requireMissions: ['w4_m2'],
      intro: 'Mulut gua layak dapat amplop merah. Rusty layak dapat kartu royalti. Gugusan timur sini layak dapat sandwich jamur.',
      outro: 'Hollow berderik puas — masa lalu dan pos, dalam satu akhir pekan.',
    },
    {
      id: 'w4_s1', title: 'The Angler\'s Prize', type: 'urgent', timeLimit: 150,
      from: { npc: 'ellen', name: 'Ellen si Pemancing' }, to: { npc: 'rowan' },
      rewards: { xp: 85, coins: 18 }, side: true,
      intro: 'Ellen menangkap sesuatu yang tidak bisa dia kenali. Sesuatu itu bergerak. Dia TIDAK mau menebak.',
      outro: 'Rowan meneliti, lalu mengunci peti sebelum kabur — misterius.',
    },
    {
      id: 'w4_s2', title: 'Music-box Sixteen', type: 'standard',
      from: { npc: 'lena', name: 'Lena si Kolektor Music Box' }, to: { npc: 'nilla' },
      rewards: { xp: 95, coins: 26 }, side: true,
      intro: 'Music-box enam belas TIDAK bisa buka sendiri, jadi Lena ingin dikirim ke Nilla. Nilla mungkin tahu cara membukanya. Atau tidak.',
      outro: 'Kotak itu memainkan enam belas nada. Entah di mana, air menjawab.',
    },
  ],
};
