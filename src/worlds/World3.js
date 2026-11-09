// WORLD 3 — THEME PARK (The Ferris-Graveyard Fair)
// Abandoned amusement park. Elite enemy Ringmaster. Chuckles secret.

export default {
  id: 'w3',
  name: 'Theme Park',
  bounds: 58,
  spawn: [0, -50],
  jetPad: [0, -50],
  hub: [0, -14],
  theme: {
    sky: 0xff9e6d,
    fog: 0xd4697f, fogNear: 26, fogFar: 105,
    sun: 0xffa985, sunIntensity: 0.9, hemiIntensity: 0.6,
    skyFill: 0xd8a2ff, groundFill: 0x5c2a45, sunPos: [-30, 46, 55],
    groundMap: 'parkpath', groundTint: 0xfff2e0,
    boundary: [
      { make: 'mountainCone', x: -62, z: 0, opts: { scale: 1.15, color: 0x6b4a63 } },
      { make: 'mountainCone', x: -40, z: -56, opts: { scale: 0.9, color: 0x6b4a63 } },
      { make: 'mountainCone', x: 44, z: 56, opts: { scale: 1.15, color: 0x6b4a63 } },
      { make: 'pine', x: 40, z: -50, opts: { scale: 1.4, } },
      { make: 'hauntedHouse', x: -44, z: -34, opts: { ry: 0.5 } },
    ],
  },
  props: [
    // main path spine
    { make: 'roadPatch', x: 0, z: 0, ry: Math.PI / 2, opts: { w: 116, d: 8, mapId: 'parkpath' } },

    // grand entrance
    { make: 'foamGate', x: 0, z: -14, ry: Math.PI, opts: {} },
    { make: 'stall', x: -6.5, z: -12.4, ry: Math.PI / 6, opts: { color: 0xffce4b } },
    { make: 'stall', x: 6.5, z: -12.4, ry: -Math.PI / 6, opts: { color: 0x59d0c8 } },

    // ferris wheel
    { make: 'ferrisWheel', x: -26, z: 14, opts: {} },
    { make: 'bench', x: -18, z: 12, ry: -0.7 }, { make: 'bench', x: -34, z: 12, ry: 0.7 },

    // carousel with singing box
    { make: 'carousel', x: 18, z: 16, opts: {} },
    { make: 'bench', x: 16, z: 22, ry: Math.PI }, { make: 'bench', x: 21, z: 22, ry: Math.PI },

    // roller coaster loop
    { make: 'coaster', x: 30, z: -12, ry: 0.3, opts: {} },

    // food court
    { make: 'stall', x: -8, z: 30, ry: 0.4, opts: { color: 0xff5d73 } },
    { make: 'stall', x: 6, z: 32, ry: -0.3, opts: { color: 0xffce4b } },
    { make: 'stall', x: -14, z: 36, ry: 0.7, opts: { color: 0x58f7dd } },

    // haunted building
    { make: 'hauntedHouse', x: -32, z: -18, ry: 0.5 },

    // food stalls in haunted corner
    { make: 'crateStack', x: -27.4, z: -12.5, opts: { h: 1 } },
    { make: 'crateStack', x: -24, z: -18, opts: { h: 2 } },

    // lamps: fairground strings (cast as warm lamps)
    { make: 'lamp', x: -10, z: -5 }, { make: 'lamp', x: 10, z: -5 }, { make: 'lamp', x: -10, z: 8 }, { make: 'lamp', x: 10, z: 8 },
    { make: 'lamp', x: -16, z: 30 }, { make: 'lamp', x: 16, z: 30 },

    // pond & water attraction (visual only, shallow bowl)
    { make: 'fountain', x: -18, z: 38 },
    { make: 'stall', x: 8, z: 44, ry: -0.9, opts: { color: 0xc58cff } },

    { make: 'warnet', x: -22, z: -27, ry: 0.9 },
    { make: 'pepStore', x: 27, z: 25, ry: -0.6 },
    { make: 'warungKue', x: -14, z: 28, ry: 0.7 },
    { make: 'saung', x: -30, z: 14 },

    // scatter park trees
    { make: 'tree', x: -40, z: 6, opts: { scale: 1.3, leafColors: [0xff9e6d, 0xffc46e] } },
    { make: 'tree', x: 40, z: -24, opts: { scale: 1.2, leafColors: [0xc58cff, 0xff9e9e] } },
    { make: 'tree', x: -44, z: 26, opts: { scale: 1.4, leafColors: [0xffce4b, 0xc58cff] } },
    { make: 'tree', x: 44, z: 32, opts: { scale: 1.2, leafColors: [0x59d0c8, 0x58f7dd] } },
  ],
  collectibles: [
    [-26, 24], [18, 26], [30, -18], [-32, -24], [-14, 38], [30, 6], [0, 44], [-44, -8],
  ],
  enemyZones: [
    { cx: 20, cz: -20, radius: 12, archs: [{ arch: 'runner', count: 2 }, { arch: 'shooter', count: 1 }] },
    { cx: -16, cz: 28, radius: 12, archs: [{ arch: 'grunt', count: 2 }, { arch: 'brute', count: 1 }] },
    { cx: 30, cz: -12, radius: 9, archs: [{ arch: 'elite', count: 1 }], elite: true },
  ],
  npcs: [
    {
      id: 'munchkin', name: 'Munchkin si Jaga Gerbang', pos: [2.1, -12.6], facing: Math.PI,
      palette: { shirt: 0xff5d73, pants: 0x141628, skin: 0xffd9b3, hair: 0x141628, hat: null, scale: 0.9 },
      role: 'hub',
      dialog: {
        intro: ['Hmph. I check all visitors\' shoes before the wire passes.', 'Munchkin. Jaga gerbang. Aku buka jam sembilan, jam sembilan-lima belas, dan kapan pun seseorang memanggil dengan sopan.'],
        repeat: ['Urutan operasi: antar dulu, panik nanti, berteriak kencang ketiga.', 'Dan selesaikan Rute Utama — pesawat putih hanya percaya pada mereka yang menyelesaikannya.'],
      },
    },
    {
      id: 'chuckles', name: 'Chuckles si Badut', pos: [-7.4, 27.8], facing: 0.9,
      palette: { shirt: 0xffb43d, pants: 0x2e6df2, skin: 0xffd9b3, hair: 0xff5d73, hat: null },
      role: 'npc',
      dialog: {
        intro: ['HO-HOOO! Kurir yang kinclong sekali!', 'Chuckles, siap melayani. Tidak ada bos tetap — tapi CV-ku termasuk satu trampolin meledak.'],
        repeat: ['Ha! Cuaca buruk untuk tertawa dan cuaca bagus untuk balon!', 'Ingat tawa terbahakmu? Suatu hari ia akan terbang lewat dengan mesin pesawat.'],
      },
      secret: { type: 'talk', need: 2, item: 'lucky_ball', hint: 'Bicara lagi, nanti ball-ku mulai menghitung jari…' },
    },
    {
      id: 'mimi', name: 'Mimi si Penjual Kios', pos: [7.6, 31.5], facing: 2.2,
      palette: { shirt: 0xff9e9e, pants: 0x59d0c8, skin: 0xffd9b3, hair: 0x5b3a24, hat: null, scale: 0.78 },
      role: 'npc',
      dialog: {
        intro: ['Kami jual permen tusuk, surat dari Paman Beda, dan bebek hias.', 'Kalau kamu punya stempel emas, aku ingat namamu selamanya. Mungkin.'],
        repeat: ['Ada hantu di rumah bolong? Bukan. Cuma Chuckles. Kemarin, tepatnya.'],
      },
    },
    {
      id: 'hettie', name: 'Hetty si Penjaga Hollow', pos: [-31.5, -15.2], facing: 0.5,
      palette: { shirt: 0x6b5f86, pants: 0x141628, skin: 0xe0cdc1, hair: 0x141628, hat: null },
      role: 'npc',
      dialog: {
        intro: ['Selamat datang di aula bolong, di mana lampu berdengung terbalik.', 'Hetty, penjaga. Aku jaga tempat ini tetap bersih… supaya dia tidak kembali.'],
        repeat: ['Kalau kamu dengar bisik tertawa, terus berjalan. Selalu terus berjalan.', 'Chuckles tahu lebih banyak dari yang dia tunjukkan. Tanya dua kali.'],
      },
    },
    {
      id: 'finn', name: 'Finn si Penjual Makanan', pos: [5.2, 33.1], facing: 2.3,
      palette: { shirt: 0xffce4b, pants: 0x141628, skin: 0xffc9a3, hair: 0x141628, hat: null },
      role: 'npc',
      dialog: {
        intro: ['Bagel tusuk! Strudel pisang asam! Tawa impor!', 'Duduk dulu, kurir. Kamu haus sekali.'],
        repeat: ['Setiap Selasa kami sapu kabin bianglala. Tidak ada yang kembali dengan warna yang sama.'],
      },
    },
    {
      id: 'zoey', name: 'Zoey si Penjual Manisan', pos: [-8.3, 35.2], facing: 2.6,
      palette: { shirt: 0xff5d73, pants: 0x141628, skin: 0xffd9b3, hair: 0x5b3a24, hat: null },
      role: 'npc',
      dialog: {
        intro: ['Cokelat udara-berpendingin. Ia meleleh lebih lambat daripada kesabaranku.', 'Zoey. Tidak boleh pakai sepatu di sini — enam bangku, tanpa kecuali.'],
        repeat: ['Stempel emas? Mimi berkhayal tentang itu.', 'Hati-hati kuda putarnya — hari ini mereka berlari kencang.'],
      },
    },
    {
      id: 'farid', name: 'Mime Farid', pos: [14.8, 18.4], facing: 1.9,
      palette: { shirt: 0x8aa4c8, pants: 0x31363f, skin: 0xffd9b3, hair: 0x141628, hat: null },
      role: 'npc',
      dialog: {
        intro: ['(Farid mimes a heavy box of imaginary letters slipping from his hands. You genuinely wince.)'],
        repeat: ['(Farid tips an invisible cap. Somewhere over the coaster, a letter glides.)'],
      },
    },
    {
      id: 'brisk', name: 'Brisk si Pemimpin Band', pos: [17.3, 21.3], facing: 0.7,
      palette: { shirt: 0x2e6df2, pants: 0x141628, skin: 0xe8b390, hair: 0x5b3a24, hat: 'cap' },
      role: 'npc',
      dialog: {
        intro: ['Tiga keindahan berjalan di dunia ini: pesawat putih, musik live, dan orang yang menyelesaikan kirimannya.', 'Brisk, pemimpin marching band. Ya, aku pemain drum; tidak, aku belum akan main drum itu untukmu.'],
        repeat: ['Kami latihan konser 5:42 setiap Minggu — itu menandai surat pertama yang pernah dikirim.', 'Amplop gede, gayamu — aku hargai.'],
      },
    },
  ],
  missions: [
    {
      id: 'w3_m1', title: 'Selamat Datang di Taman', type: 'standard',
      from: { npc: 'munchkin', name: 'Munchkin si Jaga Gerbang' },
      to: { npc: 'brisk' },
      rewards: { xp: 135, coins: 36 }, main: true,
      intro: '340 tiket untuk konser sore ini. Brisk menunggu, kucingnya juga lapar.',
      outro: 'Brisk mengatur irama latihan drum pertama kalinya di tahun ini. Dengan tiket kita.',
    },
    {
      id: 'w3_m2', title: 'Haunted Post', type: 'urgent', timeLimit: 240,
      from: { npc: 'munchkin', name: 'Munchkin si Jaga Gerbang' },
      to: { npc: 'hettie' },
      rewards: { xp: 140, coins: 40 }, main: true,
      requireMissions: ['w3_m1'],
      intro: 'Hetty di Haunted Hollow menunggu rekaman lagu lama yang pernah terdengar di sana. Jangan berbicara dengan gemuruhnya.',
      outro: 'Hetty memegang rekaman itu seperti jimat.',
    },
    {
      id: 'w3_m3', title: 'Tiga Jalur Menawar Pesta', type: 'multi',
      from: { npc: 'munchkin', name: 'Munchkin si Jaga Gerbang' },
      to: { multi: [{ npc: 'finn' }, { npc: 'zoey' }, { npc: 'brisk' }] },
      rewards: { xp: 170, coins: 52 }, main: true,
      requireMissions: ['w3_m2'],
      intro: 'Untuk festival: Finn harus mendapat sirkuit kunci, Zoey mencari seruling kayu, Brisk ingin biss perhentian.',
      outro: 'Festival termasuk dana kota. Kota siap menunggu.',
    },
    {
      id: 'w3_s1', title: 'Latihan Band 08:00', type: 'timed', timeLimit: 150,
      from: { npc: 'brisk', name: 'Brisk si Pemimpin Band' }, to: { npc: 'mimi' },
      rewards: { xp: 90, coins: 24 }, side: true,
      intro: 'Sheet musik ke Mimi di kios. Karena tidak ada yang tahu lebih pendek lagi.',
      outro: 'Mimi memegang sheet musiknya seperti harta karun.',
    },
    {
      id: 'w3_s2', title: 'Proyeksi Cahaya Chuckles', type: 'standard',
      from: { npc: 'chuckles', name: 'Chuckles si Badut' }, to: { npc: 'hettie' },
      rewards: { xp: 90, coins: 26 }, side: true,
      intro: 'Kotak proyektor ke Hetty. Lucu sekali sisi minggu ini.',
      outro: 'Hetty mengucapkan terima kasih dengan satu tepuk tangan yang terasa sangat lama.',
    },
  ],
};
