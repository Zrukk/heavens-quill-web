# Heaven's Quill — Web Reader

## Jalanin di komputer sendiri (opsional, buat cek dulu sebelum online)
npm install
npm run dev
Buka link yang muncul (biasanya http://localhost:5173).

## Deploy ke Vercel
1. Login ke vercel.com pakai GitHub
2. "Add New Project" → pilih repo `heavens-quill-web`
3. Sebelum klik Deploy, buka "Environment Variables", tambahin:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Klik Deploy.

## Struktur
- `src/pages/NovelList.jsx` — halaman utama, daftar novel
- `src/pages/NovelDetail.jsx` — sinopsis + daftar chapter
- `src/pages/ChapterReader.jsx` — baca chapter, auto-simpan progress
- `src/pages/Login.jsx` — daftar/masuk pembaca
- `src/lib/supabase.js` — koneksi ke database
