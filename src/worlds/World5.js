// WORLD 5 — COASTAL PARADISE (The Drowned Lighthouse)
// Tropical beach. Final boss: UYEHH, the Jelly Slime — sweet but ravenous.

export default {
  id: 'w5',
  name: 'Coastal Paradise',
  bounds: 68,
  spawn: [0, -60],
  jetPad: [0, -60],
  hub: [0, 0],
  theme: {
    sky: 0x8ee6ff,
    fog: 0x8ee6ff, fogNear: 40, fogFar: 170,
    sun: 0xfff4c4, sunIntensity: 1.15, hemiIntensity: 0.68,
    skyFill: 0xcff4ff, groundFill: 0x8f7755, sunPos: [46, 56, -30],
    groundMap: 'sand', groundTint: 0xffffff,
    water: { x: 38, z: -100, w: 150, d: 340, y: -0.5, repeatX: 10, repeatY: 12 },
    boundary: [
      { make: 'palm', x: -60, z: 40, opts: { scale: 1.4 } }, { make: 'palm', x: -52, z: -30, opts: { scale: 1.1 } },
      { make: 'palm', x: -38, z: 58, opts: { scale: 1.2 } }, { make: 'palm', x: -64, z: 8, opts: { scale: 1.25 } },
      { make: 'mountainCone', x: -58, z: -66, opts: { scale: 1.15, color: 0x6f8f7a } },
      { make: 'mountainCone', x: -34, z: 68, opts: { scale: 1.0, color: 0x6f8f7a } },
    ],
  },
  props: [
    // ocean edge: rock barrier east side (x=22) prevents walking on the sea
    { make: 'rock', x: 22, z: -40, opts: { scale: 2.6, color: 0x7d6a52 } },
    { make: 'rock', x: 22, z: -20, opts: { scale: 2.4, color: 0x7d6a52 } },
    { make: 'rock', x: 22, z: 0, opts: { scale: 2.8, color: 0x7d6a52 } },
    { make: 'rock', x: 22, z: 20, opts: { scale: 2.4, color: 0x7d6a52 } },
    { make: 'rock', x: 22, z: 40, opts: { scale: 2.6, color: 0x7d6a52 } },

    // the lighthouse — boss arena plaza behind it
    { make: 'lighthouse', x: 10, z: -44, opts: {} },

    // dock area north
    { make: 'dock', x: -6, z: -40, ry: 0, opts: { len: 12 } },
    { make: 'boat', x: -8.5, z: -47.5, ry: 0.4 },
    { make: 'boat', x: -1.2, z: -37, ry: -0.8 },
    { make: 'crateStack', x: -12, z: -34, opts: { h: 1 } },
    { make: 'crateStack', x: -4.5, z: -33.6, opts: { h: 2 } },

    // resort stripe, center
    { make: 'house', x: -26, z: -14, ry: 0.6, opts: { w: 6.4, d: 5, h: 4, wall: 0xffd7f0, roofColor: 0xff5d73 } },
    { make: 'house', x: -32, z: 2, ry: Math.PI / 2, opts: { w: 5, d: 5, h: 3, wall: 0xc8f7ff, roofColor: 0x59d0c8 } },
    { make: 'umbrella', x: -8, z: 10, opts: { color: 0xffce4b } },
    { make: 'umbrella', x: 4, z: 8, opts: { color: 0xff5d73 } },
    { make: 'umbrella', x: -2, z: 12, opts: { color: 0x59d0c8 } },

    // fishing village cluster south-west
    { make: 'house', x: -46, z: 16, ry: 1.1, opts: { w: 5.4, d: 4.6, h: 3.2, wall: 0xfff6d4, roofColor: 0xc95d4a } },
    { make: 'house', x: -44, z: 30, ry: 2.4, opts: { w: 5, d: 4.2, h: 2.9, wall: 0xf0e4ff, roofColor: 0x9d4edd } },
    { make: 'house', x: -38, z: 42, ry: 0.8, opts: { w: 6, d: 5, h: 3.6, wall: 0xe4f0ff, roofColor: 0x2e6df2 } },
    { make: 'dock', x: -30, z: 24, ry: Math.PI / 2, opts: { len: 9, w: 3.6 } },
    { make: 'crateStack', x: -34.5, z: 40.5, opts: { h: 1 } },

    // boss arena ring — marked stones
    { make: 'rock', x: -10, z: -8, opts: { scale: 1.8, color: 0x6f6a5a } },
    { make: 'rock', x: 10, z: -8, opts: { scale: 1.8, color: 0x6f6a5a } },
    { make: 'rock', x: -10, z: 6, opts: { scale: 1.8, color: 0x6f6a5a } },
    { make: 'rock', x: 10, z: 6, opts: { scale: 1.8, color: 0x6f6a5a } },
    { make: 'campfire', x: 0, z: -16, opts: {} },
    { make: 'campfire', x: 16, z: -6, opts: {} },
    { make: 'campfire', x: -16, z: -6, opts: {} },

    { make: 'palm', x: -18, z: -30, opts: { scale: 1.1 } },
    { make: 'warungKue', x: -22, z: -18, ry: 0.9 },
    { make: 'warungRoti', x: -30, z: -4, ry: 1.3 },
    { make: 'pepStore', x: -10, z: 6, ry: Math.PI },
    { make: 'cafeMegah', x: -20, z: 12, ry: Math.PI },
    { make: 'rentalPS', x: -38, z: 24, ry: 2.4 },
    { make: 'saung', x: -42, z: 44 },
    { make: 'school', x: -52, z: -16, ry: 1.9, opts: { type: 'SD' } },

    { make: 'palm', x: 8, z: 16, opts: { scale: 0.95 } },
    { make: 'palm', x: -28, z: -6, opts: { scale: 1.3 } },
    { make: 'palm', x: -4, z: 28, opts: { scale: 1.1 } },
    { make: 'umbrella', x: 10, z: 12, opts: { color: 0xffce4b } },
  ],
  collectibles: [
    [-6, -42], [22, -4], [10, -34], [-48, 34], [-3, 8], [-22, 22], [14, -12], [0, -46],
  ],
  enemyZones: [
    { cx: -28, cz: 24, radius: 13, archs: [{ arch: 'grunt', count: 2 }, { arch: 'shooter', count: 1 }] },
    { cx: -12, cz: -28, radius: 12, archs: [{ arch: 'runner', count: 2 }, { arch: 'brute', count: 1 }] },
  ],
  traffic: [
    { kind: 'car', x1: -62, z1: 7.5, x2: -8, z2: 7.5, count: 1, speed: 11, colors: [0xffce4b] },
    { kind: 'bike', x1: -46, z1: -9, x2: -46, z2: 20, count: 2, speed: 15, colors: [0x59d0c8, 0xffce4b] },
  ],
  arena: { cx: 0, cz: -16, radius: 13, messageID: 'w5_final' },
  npcs: [
    {
      id: 'coral', name: 'Kapten Coral', pos: [0, 2.4], facing: Math.PI,
      palette: { shirt: 0x2e6df2, pants: 0x141628, skin: 0xffc9a3, hair: 0x141628, hat: 'cap' },
      role: 'hub',
      dialog: {
        intro: ['Berhenti! Kamu meneteskan pasir di tamu saya. Catat itu di buku besar.', 'Coral. Kapten Patroli Pesisir dan rakyat\'s final exam.'],
        repeat: ['Mercusuar berkedip hari ini. Itu tidak selalu pertanda baik.', 'Saat air berbisik, nelayan menyulam. Saat mercusuar berdengung… kita berenang.'],
      },
      secret: { type: 'talk', need: 2, item: 'tide_trinket', hint: 'Duduk saja di api pelampung lama-lama dan aku akan serahkan Titem Trinket.' },
    },
    {
      id: 'nadia', name: 'Fisher Nadia', pos: [-33.5, 23.7], facing: 2.6,
      palette: { shirt: 0x9fd08a, pants: 0x31363f, skin: 0xffd9b3, hair: 0x141628, hat: 'straw' },
      role: 'npc',
      dialog: {
        intro: ['Burung pagi dapat sinar pagi. Burung telat tetap dapat sinar pagi.', 'Nadia, nelayan tiga generasi turun-temurun.'],
        repeat: ['Ikan paus adalah paket setia. Kamu antar mereka, mereka antar kamu pulang.', 'Hati-hati ombak yang lebih besar dari biasanya dengan sebuah mata.'],
      },
    },
    {
      id: 'cici', name: 'Cici si Host Resor', pos: [-24.4, -11.7], facing: 2.3,
      palette: { shirt: 0xff9e9e, pants: 0x31363f, skin: 0xffc9a3, hair: 0x141628, hat: null },
      role: 'npc',
      dialog: {
        intro: ['Selamat datang di Paradise Resort! Aturan kolam: sunscreen, maksimal sembilan handuk.', 'Aku punya kunci setiap kamar. Bahkan yang tertulis JANGAN DIMASUKI.'],
        repeat: ['Ujung jari mercusuar bersinar dengan kode yang hanya lokal yang tahu.', 'Seseorang meninggalkan piring kecil dengan satu biskuit di dalamnya. Masih hangat.'],
      },
    },
    {
      id: 'bahir', name: 'Bahir si Nakhoda Dermaga', pos: [-7.3, -37.2], facing: 0.9,
      palette: { shirt: 0xffb43d, pants: 0x31363f, skin: 0xe8b390, hair: 0x141628, hat: null },
      role: 'npc',
      dialog: {
        intro: ['Semua kedatangan dan keberangkatan check-in tepat waktu. Ini buku besarku.', 'Dockmaster Bahir. Penjaga 43 kunci, 71 tali, 2 rahasia.'],
        repeat: ['Berjemur dilarang selama shift patroli.', 'Bantu sesama pelaut. Atau minimal lambaikan tangan agresif.'],
      },
    },
    {
      id: 'lys', name: 'Lys si Penjaga Mercusuar', pos: [7.4, -39.3], facing: 2.4,
      palette: { shirt: 0xffce4b, pants: 0x141628, skin: 0xffc9a3, hair: 0x141628, hat: 'cap' },
      role: 'npc',
      dialog: {
        intro: ['Hati-hati, kurir. Menara itu membawa seluruh laut\'s patience.', 'Lys, penjaga mercusuar. Dua puluh satu tahun, sembilan badai, satu biskuit legendaris.'],
        repeat: ['Laut berbohong pada matamu malam ini, jadi tonton dengan sopan.', 'Terang. Gelap. Terang. Gelap. Begitulah caranya sejak dulu.'],
      },
    },
    {
      id: 'kiki', name: 'Kiki si Penjaga Tidepool', pos: [3.2, 13.3], facing: 2.4,
      palette: { shirt: 0x59d0c8, pants: 0xffce4b, skin: 0xffd9b3, hair: 0x5b3a24, hat: null, scale: 0.78 },
      role: 'npc',
      dialog: {
        intro: ['Haha! Kamu adalah coaster BESAR!', 'Kiki! Aku pemilik tidepool. Udang karang kerja untukku.'],
        repeat: ['Tidepool bersinar tengah malam, dan tidak ada satu pun misteri yang belum terungkap di sana.', 'Tonton ombak bersamaku… mereka adalah kesepakatan rahasia.'],
      },
    },
    {
      id: 'ruiz', name: 'Sailor Ruiz', pos: [-9.6, -32.8], facing: 0.7,
      palette: { shirt: 0x31363f, pants: 0x141628, skin: 0xe8b390, hair: 0x141628, hat: 'straw' },
      role: 'npc',
      dialog: {
        intro: ['Salty air is legal, but landlocked warnings still apply.', 'Ruiz, pelaut-kurir, pembawa yang mustahil.'],
        repeat: ['Ada badai yang tidak pernah datang tapi selalu masuk.', 'Nelayan benar soal ombak dengan mata. Itu memang mata.'],
      },
    },
    {
      id: 'anchovy', name: 'Anchovy si Mekanik', pos: [-3.5, -31.2], facing: 1.2,
      palette: { shirt: 0xff5d73, pants: 0x31363f, skin: 0xffc9a3, hair: 0x141628, hat: null },
      role: 'npc',
      dialog: {
        intro: ['Tidak ada yang disebut terlalu banyak kunci Inggris. Beberapa orang berargumen ada.', 'Anchovy, mekanik perahu. Rusia, Jepang, Prancis, dan mesin Tiny Slime.'],
        repeat: ['Beberapa mesin menjerit. Yang ini bernyanyi sangat pelan — sampai tidak lagi.', 'Memperbaiki pesawat butuh 3 baut dan empat hari. Aku masih di hari kedua.'],
      },
    },
  ],
  missions: [
    {
      id: 'w5_m1', title: 'Resor Grand Papan', type: 'multi',
      from: { npc: 'coral', name: 'Kapten Coral' },
      to: { multi: [{ npc: 'cici' }, { npc: 'nadia' }] },
      rewards: { xp: 180, coins: 52 }, main: true,
      intro: 'Pertama host resor, kedua anggota keluarga nelayan\'s family. Both needed yesterday. You are miracle delivery on two legs.',
      outro: 'Cici dan Nadia sama-sama tanda tangan — namamu kini korespondensi resmi pesisir.',
    },
    {
      id: 'w5_m2', title: 'Surat Mercusuar', type: 'standard',
      from: { npc: 'coral', name: 'Kapten Coral' }, to: { npc: 'lys' },
      rewards: { xp: 190, coins: 56 }, main: true,
      requireMissions: ['w5_m1'],
      intro: 'Lys di atas mercusuar — surat dari seseorang yang kenal seseorang yang butuh cahaya. Bawa hati-hati, shelf-to-shelf jika perlu.',
      outro: 'Lys membukanya di tahun kedua puluh satu, menyalakan lampu, dan mendesah seperti cuaca tersenyum.',
    },
    {
      id: 'w5_m3', title: 'The Last Contract', type: 'standard',
      from: { npc: 'coral', name: 'Kapten Coral' }, to: { npc: 'coral' },
      rewards: { xp: 220, coins: 60 }, main: true,
      requireMissions: ['w5_m2'],
      intro: 'Ada SATU kontrak terakhir. Makhluk di terumbu karang menyebut dirinya UYEHH — dan sedang menuju pantai SEKARANG.',
      outro: 'Kapten Coral menatap laut. Laut menatap balik.',
      boss: true,
    },
    {
      id: 'w5_s1', title: 'Darurat Kue', type: 'urgent', timeLimit: 180,
      from: { npc: 'cici', name: 'Cici si Host Resor' }, to: { npc: 'anchovy' },
      rewards: { xp: 95, coins: 24 }, side: true,
      intro: 'Satu biskuit sempurna, dirancang Cici, menuju Anchovy. JANGAN sampai jatuh.',
      outro: 'Anchovy mengambil satu gigitan dan memperbaiki mesin dengan kekuatan rahang.',
    },
    {
      id: 'w5_s2', title: 'Tidepool Ledger', type: 'standard',
      from: { npc: 'kiki', name: 'Kiki si Penjaga Tidepool' }, to: { npc: 'coral' },
      rewards: { xp: 80, coins: 20 }, side: true,
      intro: 'Kiki sudah menyimpan buku besar tidepool selama sebulan — hari ini dia serahkan ke Kapten.',
      outro: 'Kapten Coral menusukkan ke api sebelum sadar itu semua tanda tangan rumput laut.',
    },
  ],
};
