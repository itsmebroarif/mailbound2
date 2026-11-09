// WORLD 1 — RESIDENTIAL DISTRICT (Rosy Fields Village)
// Suburban neighborhood, tutorial zone. 8 NPCs, 3 secret stamps, 3 main missions.

export default {
  id: "w1",
  name: "Residential District",
  bounds: 56,
  spawn: [0, -48], // jetPad area
  jetPad: [0, -48],
  hub: [0, -6], // post office doorstep
  theme: {
    sky: 0xa9dcff,
    fog: 0xa9dcff,
    fogNear: 34,
    fogFar: 135,
    sun: 0xfff1bd,
    sunIntensity: 1.05,
    hemiIntensity: 0.68,
    skyFill: 0xbfe6ff,
    groundFill: 0x9c8a5c,
    sunPos: [56, 60, -34],
    groundMap: "grass",
    groundTint: 0xffffff,
    boundary: [
      { make: "pine", x: -52, z: -52, opts: { scale: 1.6 } },
      { make: "pine", x: 52, z: -52, opts: { scale: 1.6 } },
      { make: "mountainCone", x: -58, z: 0, opts: { scale: 1.1 } },
      { make: "mountainCone", x: 58, z: 0, opts: { scale: 1.1 } },
      { make: "pine", x: -50, z: 52, opts: { scale: 1.5 } },
      { make: "pine", x: 50, z: 52, opts: { scale: 1.5 } },
      { make: "mountainCone", x: 0, z: -64, opts: { scale: 0.9 } },
      { make: "mountainCone", x: 0, z: 62, opts: { scale: 1.2 } },
    ],
  },
  props: [
    // roads (plain visuals — no collider)
    { make: "roadPatch", x: 0, z: 0, opts: { w: 104, d: 7 } },
    { make: "roadPatch", x: 0, z: 0, ry: Math.PI / 2, opts: { w: 104, d: 7 } },

    // THE POST OFFICE (hub building)
    {
      make: "shop",
      x: 0,
      z: -7,
      opts: { w: 7, d: 6, h: 4.4, color: 0xffce4b, ry: 0 },
    },
    { make: "mailbox", x: 4.2, z: -4.5 },

    // houses
    {
      make: "house",
      x: -10,
      z: -20,
      ry: 0.4,
      opts: { w: 5, d: 5, h: 3.1, wall: 0xffe4e1, roofColor: 0xc95d4a },
    },
    {
      make: "house",
      x: -34,
      z: 2,
      ry: Math.PI / 2,
      opts: { w: 5.4, d: 4.6, h: 3.0, wall: 0xe4f0ff, roofColor: 0x4c5870 },
    },
    {
      make: "house",
      x: 24,
      z: -18,
      ry: -0.35,
      opts: { w: 6, d: 5, h: 3.6, wall: 0xeafae4, roofColor: 0x74b352 },
    },
    {
      make: "house",
      x: 26,
      z: 8,
      ry: Math.PI / 2,
      opts: { w: 5, d: 5.2, h: 3.0, wall: 0xfff4b8, roofColor: 0xf59e19 },
    },
    {
      make: "house",
      x: 8,
      z: 26,
      ry: 2.6,
      opts: { w: 5.6, d: 4.8, h: 3.2, wall: 0xffe4f3, roofColor: 0x9d4edd },
    },
    {
      make: "house",
      x: -18,
      z: 28,
      ry: 1.8,
      opts: { w: 5, d: 5, h: 3.0, wall: 0xf0faff, roofColor: 0x2e6df2 },
    },

    // cafe & clicknship
    {
      make: "shop",
      x: -28,
      z: -12,
      ry: 0.9,
      opts: { w: 6, d: 5, h: 3, color: 0x9fd08a, ry: 0 },
    },

    // park plaza
    { make: "fountain", x: 19, z: 17 },
    { make: "bench", x: 13.5, z: 14, ry: 0.4 },
    { make: "bench", x: 24.5, z: 14, ry: -0.4 },
    { make: "bench", x: 13.5, z: 20.5, ry: 2.6 },
    { make: "bench", x: 24.5, z: 20.5, ry: -2.6 },
    { make: "tree", x: 11, z: 12, opts: { scale: 1.2 } },
    { make: "tree", x: 27, z: 16, opts: { scale: 1.35 } },
    { make: "bush", x: 16, z: 13.5 },
    { make: "bush", x: 23, z: 20.8 },

    // streetlamp placement
    { make: "lamp", x: -40, z: 5.2 },
    { make: "lamp", x: -24, z: 5.2 },
    { make: "lamp", x: -8, z: 5.2 },
    { make: "lamp", x: 8, z: 5.2 },
    { make: "lamp", x: 24, z: 5.2 },
    { make: "lamp", x: 40, z: 5.2 },
    { make: "lamp", x: 4.2, z: -40 },
    { make: "lamp", x: -4.2, z: -20 },
    { make: "lamp", x: 4.2, z: 20 },
    { make: "lamp", x: -4.2, z: 38 },

    // fence line catching the park
    { make: "fenceRun", x: 12, z: 8, ry: Math.PI / 2, opts: { len: 7 } },

    // a couple of scattered trees & rocks
    { make: "pine", x: 44, z: -30, opts: { scale: 1.3 } },
    { make: "pine", x: -44, z: -26, opts: { scale: 1.5 } },
    { make: "tree", x: -42, z: 14, opts: { scale: 1.5 } },
    { make: "tree", x: 40, z: 28, opts: { scale: 1.3 } },
    { make: "rock", x: -32, z: -38, opts: { scale: 1.3 } },
    { make: "rock", x: 36, z: 38, opts: { scale: 1.1 } },


    // ===== STRIP-MALL BOULEVARD (semua ry menghadap utara ke jalan) =====
    { make: 'warnet', x: -44, z: 36, ry: Math.PI },
    { make: 'wartel', x: -37, z: 34, ry: Math.PI },
    { make: 'warkop', x: -29, z: 34.5, ry: Math.PI },
    { make: 'warungRoti', x: -20, z: 36, ry: Math.PI },
    { make: 'pepStore', x: -11, z: 36, ry: Math.PI },
    { make: 'warungKue', x: -2, z: 36, ry: Math.PI },
    { make: 'rentalPS', x: 8, z: 36, ry: Math.PI },
    { make: 'dealerMobil', x: 24, z: 36 },
    { make: 'cafeMegah', x: 38, z: 36, ry: Math.PI },
    // ===== SEKOLAH =====
    { make: 'school', x: -44, z: 14, ry: 0.8, opts: { type: 'SD' } },
    { make: 'school', x: -46, z: -12, ry: -0.7, opts: { type: 'SMP' } },
    { make: 'school', x: 46, z: -14, ry: 0.6, opts: { type: 'SMA' } },
    { make: 'saung', x: 28, z: 12 },
    { make: 'wartel', x: 5.2, z: -12.6 },
    { make: 'warnet', x: -5.6, z: -12.6, ry: Math.PI },
    { make: 'saung', x: 33, z: 28 },

    // step crates parkour towards a rooftop secret (higher vantage)
    { make: "crateStack", x: -13, z: -21.6, opts: { h: 1 } },
    { make: "crateStack", x: -15.3, z: -17.4, opts: { h: 2 } },
  ],
  collectibles: [
    [42, 12],
    [-20, 4],
    [24.5, 17],
    [7.2, -38],
    [-32, -22],
    [6, 8.4],
    [-8, 46],
    [38, -6],
  ],
  enemyZones: [
    {
      cx: 32,
      cz: -28,
      radius: 12,
      archs: [
        { arch: "grunt", count: 2 },
        { arch: "runner", count: 1 },
      ],
    },
    {
      cx: -32,
      cz: 22,
      radius: 12,
      archs: [
        { arch: "grunt", count: 2 },
        { arch: "runner", count: 1 },
      ],
    },
  ],
  npcs: [
    {
      id: "pip",
      name: "Postmaster Pip",
      pos: [1.9, -3.9],
      facing: 0,
      palette: {
        shirt: 0x2e6df2,
        pants: 0x141628,
        skin: 0xffd9b3,
        hair: 0x5b3a24,
        hat: "cap",
      },
      role: "hub",
      dialog: {
        intro: [
          "Halo! Kurir baru, ya? Selamat datang di program MAILBOUND.",
          "Aku Pip, kepala stasiun pos Rosy Fields.",
          "Satu RUTE paling penting di setiap dunia — kami menyebutnya Rute Utama. Selesaikan, dan pesawat putih kami akan menjemputmu.",
        ],
        repeat: [
          "Surat-surat ini tidak akan mengirim dirinya sendiri.",
          "Checklist kamu: lari, antar, berkelahi, ulangi. Itu tugas kurir.",
        ],
      },
    },
    {
      id: "granny",
      name: "Granny Maple",
      pos: [-9.2, -17],
      facing: 1.6,
      palette: {
        shirt: 0xb58a5a,
        pants: 0x6e4f2a,
        skin: 0xffd9b3,
        hair: 0xe0dcd7,
        hat: "bun",
      },
      role: "npc",
      dialog: {
        intro: [
          "Seorang kurir! Akhirnya, kirim dari kota. Masuk sini, sayang.",
          "Ayo ke sini… sudah coba biskuit buatanku? Masih hangat pagi ini.",
        ],
        repeat: [
          "Suamiku dulu jago bakar-bakar dari fajar sampai senja. Sekarang misi terbesarnya mencari sarapan.",
        ],
      },
      secret: {
        type: "bring",
        need: 2,
        item: "maple_cookie",
        hint: "Bawa ember kuemu sendiri: 2 stempel emas aku yang urus.",
      },
    },
    {
      id: "mayor",
      name: "Mayor Bumble",
      pos: [-33, 3.9],
      facing: -0.9,
      palette: {
        shirt: 0xffce4b,
        pants: 0x141628,
        skin: 0xe8b390,
        hair: 0x8a8f9c,
        hat: null,
      },
      role: "npc",
      dialog: {
        intro: [
          "Ahem. Aku Mayor Bumble, wali kota Rosy Fields.",
          "Tugas pertamamu yang benar: jaga warga, jaga perdamaian, dan jangan biarkan satu surat jatuh.",
        ],
        repeat: [
          "Letters keep this town’s blood flowing!",
          "Dan jangan — sekali-sekali — menempel surat dengan sapu tanganmu sendiri.",
        ],
      },
    },
    {
      id: "hoa",
      name: "Hoa si Penjaga Toko",
      pos: [-27.5, -9.5],
      facing: 2.2,
      palette: {
        shirt: 0x9fd08a,
        pants: 0x31363f,
        skin: 0xffc9a3,
        hair: 0x141628,
        hat: null,
      },
      role: "npc",
      dialog: {
        intro: [
          "Selamat datang di Click & Ship — semua yang kamu cari ada di sini, kecuali kesabaran — sudah habis.",
          "Mau kirim kaca? Yang ini bepergian seperti seorang pangeran kaca.",
        ],
        repeat: [
          "Diskon nol persen sepanjang tahun!",
          "Tunggu — itu amplopmu? Tanda tangannya indah sekali.",
        ],
      },
    },
    {
      id: "nino",
      name: "Nino",
      pos: [20.8, 20.6],
      facing: 2.8,
      palette: {
        shirt: 0xff9e9e,
        pants: 0x2e6df2,
        skin: 0xffd9b3,
        hair: 0x5b3a24,
        hat: null,
        scale: 0.78,
      },
      role: "npc",
      dialog: {
        intro: [
          "Kurir beneran! Keren!",
          "Kata ibuku aku boleh ikut pos setelah lulus sekolah. Untuk sekarang bantu-bantu di taman saja!",
        ],
        repeat: [
          "Nanti pesawat datang, mendaratlah RENDAH! Aku mau melihatnya!",
          "Salam untuk dunia berikutnya ya!",
        ],
      },
    },
    {
      id: "thistle",
      name: "Thistle si Tukang Kebun",
      pos: [15.2, 19.4],
      facing: 0.8,
      palette: {
        shirt: 0x57b86e,
        pants: 0x31363f,
        skin: 0xe8b390,
        hair: 0x5b3a24,
        hat: null,
      },
      role: "npc",
      dialog: {
        intro: [
          "Aku Thistle. Penjaga taman, musuh rumput liar, musuh celeng gemuk.",
          "Cium aroma itu? Itu pupuk dari kiriman kantong posmu sendiri.",
          "Jangan injak bunga mapel liar di sudut sana.",
        ],
        repeat: [
          "Kalau kamu suka tanaman, mampir ke dunia keempat: hutan.",
          "Ada bunga yang cuma bermekaran waktu pesawat lewat di atas.",
        ],
      },
    },
    {
      id: "sage",
      name: "Mailman Sage",
      pos: [4.4, -9.9],
      facing: 2.2,
      palette: {
        shirt: 0x59d0c8,
        pants: 0x31363f,
        skin: 0xffd9b3,
        hair: 0x141628,
        hat: "straw",
      },
      role: "npc",
      dialog: {
        intro: [
          "Berhentilah, kurir muda. Empat puluh tahun aku membawa surat.",
          "Setiap kotak pos punya cerita. Setiap cerita, sayangnya, berakhir di tujuan.",
        ],
        repeat: [
          "Gratis pelajaran hari ini: satu stempel emas bisa membeli yang tidak bisa dibeli koin… tapi bukan waktu.",
          "Kembali lagi denganku — pembicaraan kita akan berbelok rahasia.",
        ],
      },
      secret: {
        type: "talk",
        need: 3,
        item: "quill_shield",
        hint: "Datanglah lagi beberapa kali. Kemurnian niat tidak bisa dibeli.",
      },
    },
    {
      id: "clod",
      name: "Clod si Trainee",
      pos: [8.2, 0.5],
      facing: 2.6,
      palette: {
        shirt: 0x8aa4c8,
        pants: 0x31363f,
        skin: 0xffc9a3,
        hair: 0x5b3a24,
        hat: "cap",
      },
      role: "npc",
      dialog: {
        intro: [
          "Halo! Namaku Clod, trainee tes keempat belas!",
          "Hari ini aku belajar: lari dulu. Baca labelnya… nanti.",
        ],
        repeat: [
          "Kalian semua terlihat profesional. Aku bahkan belum lulus tes Mengangkat Ember.",
          "Sering ngobrol dengan Sage; dia tahu semua surat yang pernah ditulis.",
        ],
      },
    },
  ],
  traffic: [
    { kind: 'car', x1: -55, z1: 2.2, x2: 55, z2: 2.2, count: 2, speed: 8.5, colors: [0xff5d73, 0xffd34d] },
    { kind: 'car', x1: 55, z1: -2.2, x2: -55, z2: -2.2, count: 2, speed: 8.5, colors: [0x59d0c8, 0xff8a3d] },
    { kind: 'bike', x1: 2.3, z1: -55, x2: 2.3, z2: 55, count: 2, speed: 13, colors: [0x59d0c8, 0xff5d73] },
    { kind: 'bike', x1: -2.3, z1: 55, x2: -2.3, z2: -55, count: 1, speed: 13, colors: [0xffce4b] },
    { kind: 'train', x1: -80, z1: 47, x2: 80, z2: 47, count: 1, speed: 17, every: 20 },
  ],
  missions: [
    {
      id: "w1_m1",
      title: "Amplop untuk Granny Maple",
      type: "standard",
      from: { npc: "pip", name: "Postmaster Pip" },
      to: { npc: "granny" },
      rewards: { xp: 45, coins: 14 },
      main: true,
      intro:
        "Paket berisi bumbu kue dan foto yang lama hilang. Antarkan ke Granny Maple, rumah berpapan ungu di sebelah utara jalan raya.",
      outro: 'Granny: "Oh, pip sudah menulis surat juga? Berkibar hari ini!"',
    },
    {
      id: "w1_m2",
      title: "Kornet dari Hoa",
      type: "urgent",
      timeLimit: 180,
      from: { npc: "pip", name: "Postmaster Pip" },
      to: { npc: "hoa" },
      rewards: { xp: 70, coins: 22 },
      main: true,
      requireMissions: ["w1_m1"],
      intro:
        "Hoa menunggu paket kornet paling segar. Kalau sampai rusak, aku yang harus dengar ceramahnya. Seperti biasa.",
      outro:
        'Hoa: "Segar! Sempurna! Kembalilah kapan pun — jangan bawa hutang."',
    },
    {
      id: "w1_m3",
      title: "Rute Taman",
      type: "multi",
      from: { npc: "pip", name: "Postmaster Pip" },
      to: { multi: [{ npc: "nino" }, { npc: "thistle" }] },
      rewards: { xp: 95, coins: 30 },
      main: true,
      requireMissions: ["w1_m2"],
      intro:
        "Dua amplop wisuda rasa surat: satu untuk Nino di taman, satu untuk Thistle penjaga taman. Ambil dan antar keduanya.",
      outro:
        'Nino: "AYOCOK! Aku pasti bilang ke dunia berikutnya kurir Rosy Fields adalah legenda!"',
    },
    {
      id: "w1_s1",
      title: "Surat Pribadi Mayor",
      type: "standard",
      from: { npc: "mayor", name: "Mayor Bumble" },
      to: { npc: "pip" },
      rewards: { xp: 50, coins: 20 },
      requireMissions: ["w1_m1"],
      side: true,
      intro:
        "Surat ini berisi proposal kota yang sangat… formal. Pip perlu lihatnya sebelum sidang.",
      outro: "Pip menyegel amplop dan tersenyum diam-diam.",
    },
    {
      id: "w1_s2",
      title: "Toples Kaca Hoa",
      type: "fragile",
      fragile: true,
      from: { npc: "hoa", name: "Hoa si Penjaga Toko" },
      to: { npc: "granny" },
      rewards: { xp: 60, coins: 26 },
      requireMissions: ["w1_m1"],
      side: true,
      intro:
        "Toples kaca edisi terbatas. JANGAN ada benturan keras sedikit pun, boleh?",
      outro:
        "Granny memindahkan toples itu ke rak termahalnya dengan penuh upacara.",
    },
  ],
};
