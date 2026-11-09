// WORLD 2 — METROPOLIS (Neon Crayon City)
// Vertical city: elevated roads, alleys, sky bridges, office roofs.

export default {
  id: "w2",
  name: "Metropolis",
  bounds: 64,
  spawn: [0, -58],
  jetPad: [0, -58],
  hub: [0, 0],
  theme: {
    sky: 0x2b2450,
    fog: 0x2b2450,
    fogNear: 28,
    fogFar: 120,
    sun: 0x9db4ff,
    sunIntensity: 0.72,
    hemiIntensity: 0.58,
    skyFill: 0x3a2f63,
    groundFill: 0x3a3242,
    sunPos: [-40, 54, -30],
    groundMap: "asphalt",
    groundTint: 0xffffff,
    boundary: [
      { make: "tower", x: -62, z: 0, opts: { w: 8, h: 26, color: 0x8aa4c8 } },
      { make: "tower", x: 62, z: 0, opts: { w: 9, h: 32, color: 0x7a89b0 } },
      { make: "tower", x: 0, z: 62, opts: { w: 10, h: 24, color: 0x8aa4c8 } },
      { make: "tower", x: 0, z: -62, opts: { w: 9, h: 30, color: 0x7a89b0 } },
    ],
  },
  props: [
    // avenues
    { make: "roadPatch", x: 0, z: 0, opts: { w: 128, d: 9 } },
    { make: "roadPatch", x: 0, z: 0, ry: Math.PI / 2, opts: { w: 128, d: 9 } },

    // the dispatch HQ (mission hub) — glowing post block
    {
      make: "tower",
      x: 0,
      z: 0,
      opts: { w: 8, d: 7, h: 12, color: 0xffd9a0, roofColor: 0xffb43d },
    },

    // Midtown towers (a few have climbable stairs)
    {
      make: "tower",
      x: -26,
      z: 18,
      opts: { w: 7, h: 16, color: 0x8aa4c8, roofColor: 0x4c5870 },
    },
    {
      make: "tower",
      x: 22,
      z: 22,
      opts: { w: 6.4, h: 22, color: 0x8aa4c8, roofColor: 0x4c5870 },
    },
    {
      make: "tower",
      x: -20,
      z: -24,
      opts: { w: 6.8, h: 14, color: 0x7a89b0, roofColor: 0x4c5870 },
    },
    {
      make: "tower",
      x: 26,
      z: -20,
      opts: { w: 7.4, h: 18, color: 0x8aa4c8, roofColor: 0x4c5870 },
    },

    // climbable stairs onto mid tower (step: auto-climb via stepH)
    {
      make: "stairs",
      x: -26,
      z: 10.9,
      opts: { steps: 14, rise: 0.5, run: 0.62, w: 2.4 },
      ry: Math.PI,
    },
    {
      make: "stairs",
      x: 26,
      z: -27.3,
      opts: { steps: 18, rise: 0.5, run: 0.62, w: 2.4 },
    },

    // market district
    { make: "stall", x: -10, z: 30, ry: 0.4, opts: { color: 0xffce4b } },
    { make: "stall", x: 4, z: 32, opts: { color: 0xff5d73 } },
    { make: "stall", x: 18, z: 30, ry: -0.4, opts: { color: 0x59d0c8 } },

    // underpass tunnel mouths (visual)
    { make: "caveArch", x: 44, z: 12, ry: -Math.PI / 2 },
    { make: "caveArch", x: -46, z: -10, ry: Math.PI / 2 },

    // parklet pocket
    { make: "fountain", x: 12, z: -8 },
    { make: "bench", x: 8, z: -6.5, ry: 0.6 },
    { make: "bench", x: 16, z: -9, ry: 2.2 },

    { make: "lamp", x: -32, z: 6.1 },
    { make: "lamp", x: 20, z: 6 },
    { make: "lamp", x: -14, z: -6.1 },
    { make: "lamp", x: 14, z: -6.1 },
    { make: "lamp", x: 36, z: -26 },
    { make: "lamp", x: -40, z: -14 },

    { make: "crateStack", x: -4, z: -14, opts: { h: 1 } },
    // ===== strip mall bawah: hiburan & makanan =====
    { make: 'warnet', x: -30, z: 43, ry: Math.PI },
    { make: 'rentalPS', x: 15, z: 43, ry: Math.PI },
    { make: 'warungRoti', x: -8, z: 43, ry: Math.PI },
    // ===== SMA 3 NEGERI =====
    { make: "school", x: 49, z: 10, ry: -0.5, opts: { type: 'SMA' } },
    { make: 'dealerMobil', x: 34, z: -42 },
    { make: 'cafeMegah', x: -15, z: 33, ry: Math.PI },
    { make: 'saung', x: -44, z: -34 },
    { make: 'wartel', x: -45, z: 12 },
    { make: "crateStack", x: 3, z: -15.8, opts: { h: 2 } },
    { make: "crateStack", x: 12, z: 12, opts: { h: 1 } },
    { make: "rock", x: -36, z: 28, opts: { scale: 1.2 } },
    { make: "rock", x: 30, z: 40, opts: { scale: 1.5 } },
    { make: "pine", x: -46, z: -34, opts: { scale: 1.2 } },
    { make: "pine", x: 44, z: 30, opts: { scale: 1.1 } },
  ],
  collectibles: [
    [-26, 16, "roof"], // rooftop cache on tower (via stairs)
    [12, -8],
    [-20, -26],
    [26, -22],
    [4, 31],
    [-44, 8],
    [36, 22],
    [0, 34],
  ],
  enemyZones: [
    {
      cx: -30,
      cz: -8,
      radius: 12,
      archs: [
        { arch: "grunt", count: 2 },
        { arch: "shooter", count: 1 },
      ],
    },
    {
      cx: 30,
      cz: 12,
      radius: 12,
      archs: [
        { arch: "runner", count: 2 },
        { arch: "shooter", count: 1 },
      ],
    },
    {
      cx: -36,
      cz: 36,
      radius: 11,
      archs: [
        { arch: "grunt", count: 1 },
        { arch: "brute", count: 1 },
      ],
    },
  ],
  npcs: [
    {
      id: "meridian",
      name: "Director Meridian",
      pos: [1.7, -4.4],
      facing: 0.7,
      palette: {
        shirt: 0x31363f,
        pants: 0x141628,
        skin: 0xffd9b3,
        hair: 0x141628,
        hat: "cap",
      },
      role: "hub",
      dialog: {
        intro: [
          "Halo. Director Meridian, Dispatch Metropolis.",
          "Kami memindahkan lebih banyak paket daripada air yang dipindahkan sungai.",
          "Setiap kiriman di kota ini punya aplikasi. Tapi tidak ada aplikasi yang bisa mengantar surat. Tanganmu yang bisa.",
        ],
        repeat: [
          "Ruteku cuma grid kota. Kalau bosan — cari skybridge.",
          "Kamu bisa lompat atap kalau sabar dengan tumpukan crates.",
        ],
      },
    },
    {
      id: "pia",
      name: "Pia si Penjaga Merpati",
      pos: [-26, 15.3],
      facing: 0.3,
      palette: {
        shirt: 0x6b5f86,
        pants: 0x31363f,
        skin: 0xffc9a3,
        hair: 0x141628,
        hat: null,
      },
      role: "npc",
      dialog: {
        intro: [
          "Shh — burung merpati sedang tidur siang. Mencurigakan, ya?",
          "Kupikir mereka sedang memvisualisasikan kotak langit di atas kita.",
        ],
        repeat: [
          "Kirim salamku ke atap berikutnya!",
          "Ada merpati yang selalu ikuti pesawat putih kita. Namanya Wint. Dia gratis dan cinta pesawat itu.",
        ],
      },
      secret: {
        type: "talk",
        need: 2,
        item: "pigeon_whistle",
        hint: "Bicara lagi denganku. Wint justru butuh dengar cerita dari keluarga pesawat itu.",
      },
    },
    {
      id: "zip",
      name: "ZIP si Mekanik",
      pos: [22, 2.6],
      facing: 2.4,
      palette: {
        shirt: 0xff5d73,
        pants: 0x31363f,
        skin: 0xffd9b3,
        hair: 0x5b3a24,
        hat: null,
      },
      role: "npc",
      dialog: {
        intro: [
          "Aturan pertama bertemu mekanik: tinggalkan gigimu di pintu.",
          "Nama aku ZIP. Aku memperbaiki apa pun yang masuk sini: motor, brankas, pesawat, kadang cita-cita.",
        ],
        repeat: [
          "Bawa aku tiga stempel emas dan aku pasang kakimu dengan kaki turbo.",
          "Aku juga jual helm. Helm tidak membuat pintar, tapi membuat tampan.",
        ],
      },
      secret: {
        type: "bring",
        need: 3,
        item: "turbo_greaves",
        hint: "Membawa 3 stempel emas? Kaki turbo siap kusolder untukmu.",
      },
    },
    {
      id: "veda",
      name: "Veda si Juarang",
      pos: [-11.2, 28.4],
      facing: Math.PI,
      palette: {
        shirt: 0xffce4b,
        pants: 0x31363f,
        skin: 0xffc9a3,
        hair: 0x5b3a24,
        hat: null,
      },
      role: "npc",
      dialog: {
        intro: [
          "Sekali lagi: diskon secepat kedipan mata, tanpa syarat. Kecuali stempel emas — itu mata uang.",
          "Kurir pertama di pasar yang berhenti omong soal cuaca akan menerima panggilan Selasa. Tidak akan pernah ada Selasa.",
        ],
        repeat: [
          "Kami melipat pangsit madu-jeruk lipatan terbalik. Gaya Metropolis.",
          "Setiap lagu di kota ini selalu tentang macet. Semuanya.",
        ],
      },
    },
    {
      id: "rey",
      name: "Rey si Pelari Atap",
      pos: [26, -11.3],
      facing: 0.9,
      palette: {
        shirt: 0x2e6df2,
        pants: 0x141628,
        skin: 0xe8b390,
        hair: 0x141628,
        hat: "cap",
      },
      role: "npc",
      dialog: {
        intro: [
          "Rey. National-class rooftop runner.",
          "Empat belas gelar juara atap ke atap. Aku kalah semuanya dari kurir yang bahkan tidak berlari di atap.",
        ],
        repeat: [
          "Tip pro: ambil tangga paling kiri. Jauhi kerikil. Selalu kerikil.",
          "Pesawat putih itu megah sekali di atas pegunungan awan.",
        ],
      },
    },
    {
      id: "mabel",
      name: "Mabel si Petugas Lobi",
      pos: [6.8, 3.5],
      facing: 2.1,
      palette: {
        shirt: 0xe8635f,
        pants: 0x31363f,
        skin: 0xffc9a3,
        hair: 0x8a5a33,
        hat: null,
      },
      role: "npc",
      dialog: {
        intro: [
          "Clerk Mabel, lantai dua puluh delapan. Baru selesai lembur yang tidak akan disetujui siapa pun.",
          "Mau dengar tentang kode pos YyyZ-444-Artav-08-infLag? Kamu tanya.",
        ],
        repeat: [
          "Daur ulang stempel membuat kita abadi, tahu.",
          "Kalau capek, coba teater lobi. Tidak ada sofa bersabuk keamanan di sana. Anehnya cozy.",
        ],
      },
    },
    {
      id: "dimas",
      name: "Dimas si Seniman Jalanan",
      pos: [-29, -5.2],
      facing: 1.1,
      palette: {
        shirt: 0x59d0c8,
        pants: 0x141628,
        skin: 0xffd9b3,
        hair: 0x5b3a24,
        hat: null,
      },
      role: "npc",
      dialog: {
        intro: [
          "Keep it down! I am art.",
          "Dimas, seniman jalanan. Aku melukis surat yang tidak sampai.",
        ],
        repeat: [
          "Mural besar itu wajah teman yang kutemukan lagi. Dia belum tahu.",
          "Atap timur itu punyaku — tapi kamu boleh meluncur kapan pun.",
        ],
      },
    },
    {
      id: "yuk",
      name: "Yuk si Supir Taksi",
      pos: [0, 7.2],
      facing: Math.PI,
      palette: {
        shirt: 0x9fd08a,
        pants: 0x31363f,
        skin: 0xffc9a3,
        hair: 0x141628,
        hat: "straw",
      },
      role: "npc",
      dialog: {
        intro: [
          "Ha! Kurir lolos dari taksi, taksi tidak pernah lolos dari kurir.",
          "Nama aku Yuk. Mau skip macet? Aku punya taksi atmosfer.",
        ],
        repeat: [
          "Pesawat putih itu makin dekat setiap hari. Seharusnya itu pertanda baik.",
          "Tell Wint I once gave him a ride. He still owes me a pigeon-peck.",
        ],
      },
    },
  ],
  traffic: [
    { kind: 'car', x1: -60, z1: 3.5, x2: 60, z2: 3.5, count: 2, speed: 10, colors: [0xffd34d, 0x59d0c8] },
    { kind: 'car', x1: 60, z1: -3.5, x2: -60, z2: -3.5, count: 2, speed: 10, colors: [0xff5d73, 0x2e6df2] },
    { kind: 'car', x1: 3.5, z1: -60, x2: 3.5, z2: 60, count: 1, speed: 9, colors: [0xffe0f0] },
    { kind: 'bike', x1: -3.5, z1: 60, x2: -3.5, z2: -60, count: 2, speed: 14, colors: [0xffd34d, 0x141628] },
    { kind: 'train', x1: -70, z1: 54, x2: 70, z2: 54, count: 1, speed: 18, every: 15 },
  ],
  traffic: [
    { kind: 'car', x1: -60, z1: 3.5, x2: 60, z2: 3.5, count: 2, speed: 10, colors: [0xffd34d, 0x59d0c8] },
    { kind: 'car', x1: 60, z1: -3.5, x2: -60, z2: -3.5, count: 2, speed: 10, colors: [0xff5d73, 0x2e6df2] },
    { kind: 'bike', x1: -3.5, z1: 60, x2: -3.5, z2: -60, count: 2, speed: 14, colors: [0xffd34d, 0x141628] },
    { kind: 'train', x1: -70, z1: 54, x2: 70, z2: 54, count: 1, speed: 18, every: 15 },
  ],
  missions: [
    {
      id: "w2_m1",
      title: "Kode Underpass Utara",
      type: "standard",
      from: { npc: "meridian", name: "Director Meridian" },
      to: { point: [44, 12] },
      rewards: { xp: 110, coins: 30 },
      main: true,
      intro:
        "Kotak hitam ini harus sampai ke terowongan utara, sebelum tengah malam tanpa lampu. Jangan dilihat apa pun yang ada di dalam.",
      outro: "Semprotan batu menutup keretakan. Terowongan tetap sunyi.",
    },
    {
      id: "w2_m2",
      title: "Rute Atap: Pia & Wint",
      type: "standard",
      from: { npc: "meridian", name: "Director Meridian" },
      to: { npc: "pia" },
      rewards: { xp: 120, coins: 36 },
      main: true,
      requireMissions: ["w2_m1"],
      intro:
        "Pia menunggu sekotak biji eksotik untuk pigeon-pigeonnya. Cari tangga terdekat, atau gunakan parkour crates dan kurir atap.",
      outro:
        "Wint mengepak satu bungkus untuk dirinya sendiri. Dia tidak diundang berbagi jaring.",
    },
    {
      id: "w2_m3",
      title: "Commercial Rush Hour",
      type: "multi",
      from: { npc: "meridian", name: "Director Meridian" },
      to: {
        multi: [{ point: [4, 31.5] }, { npc: "mabel" }, { point: [-22, -11] }],
      },
      rewards: { xp: 150, coins: 44 },
      main: true,
      requireMissions: ["w2_m2"],
      intro:
        "Tiga pemberhentian: pasar Veda → lobi Mabel → alley Dimas yang bercahaya dinding. Jalan cepat, wajah datar.",
      outro: "Motto seminggu ini: setiap surat pasti sampai.",
    },
    {
      id: "w2_s1",
      title: "Spare Parts untuk ZIP",
      type: "standard",
      from: { npc: "meridian", name: "Director Meridian" },
      to: { npc: "zip" },
      rewards: { xp: 80, coins: 24 },
      side: true,
      requireMissions: ["w2_m1"],
      intro:
        "ZIP mengidam motor cadangannya. Antar, tapi jangan pegang porosnya.",
      outro: "ZIP memasang motor itu secepat kedipan mata.",
    },
    {
      id: "w2_s2",
      title: "Paket Berkilau di Pasar",
      type: "urgent",
      timeLimit: 240,
      from: { npc: "veda", name: "Veda si Juarang" },
      to: { npc: "meridian" },
      rewards: { xp: 95, coins: 28 },
      side: true,
      intro:
        "Wanita pasar paling misterius ini punya paket yang dicari semua orang — tapi dia jualah yang kaget. Sekarang antar ke HQ.",
      outro: "Paket recan, entah isinya apa. Terima kasih semua yang tahu.",
    },
  ],
};
