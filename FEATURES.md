# 🎵 Fitur Aplikasi Music Streaming

Aplikasi ini adalah platform *streaming* musik modern berbasis web yang dibangun menggunakan **Next.js**, **Tailwind CSS**, dan **Zustand**. Berikut adalah daftar lengkap fitur-fitur yang saat ini **sudah** tersedia dan berjalan dengan baik di dalam aplikasi:

## 🔍 Pencarian & Penelusuran (Discovery)
- **Pencarian Real-Time**: Pengguna dapat mencari lagu, artis, atau album dan langsung mendapatkan hasil asli dari *database* YouTube Music.
- **Halaman Beranda (Home)**: Menampilkan rekomendasi lagu yang sedang tren secara dinamis saat aplikasi pertama kali dibuka.
- **Sistem Fallback Pintar**: Jika terjadi masalah pada hasil pencarian API, sistem secara cerdas akan menyaring hasil yang rusak sehingga UI tetap tampil sempurna.

## 🎧 Sistem Pemutar Musik (Player Engine)
- **Streaming Audio Asli (Natif)**: Mendengarkan audio berkualitas tinggi (Format `m4a`) yang di-*stream* secara langsung dan cepat menggunakan *engine* `yt-dlp`. 
- **Bypass CORS & Proxy Server**: Aplikasi memiliki *endpoint* API mandiri (`/api/music/stream`) yang menjembatani server YouTube dengan klien agar pemutaran musik tidak diblokir oleh *browser*.
- **Cache Stream Cerdas**: URL *streaming* yang didapatkan akan disimpan dalam memori (Cache) selama 5 menit. Jika lagu yang sama diputar ulang, pemuatannya akan terjadi secara instan tanpa perlu menghubungi YouTube ulang.
- **Retry Mechanism**: Jika koneksi terputus tiba-tiba atau *stream* mati, *Player* secara otomatis akan mencoba memuat ulang koneksi hingga 2 kali sebelum memutuskan untuk melompat ke lagu berikutnya.

## 🎛️ Antarmuka Pemutar (Player Bar)
- **Kontrol Penuh**: Tombol Play/Pause, Skip Next, dan Skip Previous.
- **Progress Bar Interaktif**: Pengguna bisa menggeser (*seek*) titik pemutaran lagu ke menit atau detik manapun.
- **Kontrol Volume**: Pengaturan volume suara (*slider* dan tombol *mute*) yang disimpan secara persisten.
- **Deteksi Interaksi (Autoplay Policy)**: Sistem dirancang untuk menghormati aturan *browser* (Autoplay Policy) di mana lagu hanya akan diputar secara otomatis setelah ada interaksi (klik) dari pengguna, mencegah munculnya peringatan *error*.

## 📂 Sistem Antrean (Queue System)
- **Konteks Antrean Dinamis**: Jika memutar lagu dari halaman "Search", maka seluruh hasil pencarian tersebut otomatis masuk ke antrean. Hal yang sama berlaku jika diputar dari halaman "Home" atau "Favorites".
- **Queue Panel Sidebar**: Panel antrean visual di sisi kanan untuk melihat urutan lagu yang akan diputar selanjutnya.
- **Auto-Advance**: Saat satu lagu selesai, aplikasi secara otomatis memutar lagu selanjutnya dari antrean.

## 💾 Penyimpanan & Personalisasi (Persist State)
- **Riwayat Terakhir Tersimpan**: Berkat integrasi `localStorage` (Zustand Persist), jika Anda me-*refresh* atau menutup *browser* lalu membukanya kembali, **lagu yang terakhir diputar, daftar antrean, progress lagu (detik ke berapa), dan volume suara** akan kembali persis seperti semula.
- **Sistem Favorit (Liked Songs)**: Pengguna dapat menyukai lagu (ikon hati). Semua lagu yang disukai tersimpan dan dapat diakses kapan saja di halaman khusus "Favorites".
- **Recently Played**: Sistem diam-diam sudah mencatat 10 lagu terakhir yang Anda putar (meski UI-nya di halaman beranda masih akan dikembangkan lebih lanjut di pembaruan berikutnya).

---
*Dokumen ini dibuat secara otomatis untuk melacak perkembangan aplikasi.*
