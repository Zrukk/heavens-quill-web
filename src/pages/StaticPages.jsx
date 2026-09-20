import { Link } from 'react-router-dom'
import { Info, Mail, Shield, ArrowLeft, MessageCircle, BookOpen } from 'lucide-react'

function PageWrapper({ icon, title, children }) {
  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 700 }}>
      <Link
        to="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          color: 'var(--text-muted)',
          fontSize: '0.9rem',
          marginBottom: 24,
        }}
      >
        <ArrowLeft size={15} />
        Kembali ke Beranda
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ color: 'var(--gold)' }}>{icon}</span>
        <h1 className="gradient-text" style={{ fontSize: '1.8rem' }}>{title}</h1>
      </div>

      <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.7 }}>
        {children}
      </div>
    </div>
  )
}

export function About() {
  return (
    <PageWrapper icon={<Info size={26} />} title="Tentang Kami">
      <p>
        <strong style={{ color: 'var(--text)' }}>Heaven's Quill</strong> adalah platform baca novel
        terjemahan yang dikelola secara independen. Kami menerjemahkan novel-novel populer dari
        Tionghoa, Jepang, dan Korea ke dalam Bahasa Indonesia, agar pembaca Indonesia bisa menikmati
        karya-karya terbaik tanpa terkendala bahasa.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', marginTop: 24 }}>Visi Kami</h2>
      <p>
        Menjadi salah satu sumber utama novel terjemahan berkualitas di Indonesia, dengan
        terjemahan yang enak dibaca, rapi, dan konsisten. Kami percaya bahwa cerita yang bagus
        layak dinikmati siapa saja, tanpa batas bahasa.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', marginTop: 24 }}>Apa yang Kami Lakukan</h2>
      <p>
        Kami mengkurasi novel-novel populer dari berbagai genre — mulai dari fantasy, sci-fi,
        misteri, hingga romance — lalu menerjemahkannya dengan pendekatan yang mengutamakan
        kualitas bahasa dan kenyamanan membaca. Setiap chapter dirilis secara berkala, dengan
        fokus pada konsistensi dan kecepatan update.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', marginTop: 24 }}>Dukungan</h2>
      <p>
        Heaven's Quill beroperasi secara mandiri. Jika kamu menikmati apa yang kami kerjakan,
        kamu bisa mendukung kami melalui halaman donasi. Setiap dukungan sangat berarti untuk
        menjaga situs ini tetap hidup dan terus berkembang.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', marginTop: 24 }}>Komunitas</h2>
      <p>
        Bergabunglah dengan komunitas kami di Discord untuk diskusi, info update terbaru, dan
        ngobrol santai sesama pembaca novel:
      </p>
      <p>
        <a
          href="https://discord.gg/EA7Tew7rut"
          target="_blank"
          rel="noopener noreferrer"
          className="btn"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 4 }}
        >
          <MessageCircle size={16} />
          Gabung Discord
        </a>
      </p>

      <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', marginTop: 24 }}>Kontak</h2>
      <p>
        Punya pertanyaan, masukan, atau kerja sama? Silakan hubungi kami di halaman{' '}
        <Link to="/kontak" style={{ color: 'var(--gold)' }}>Kontak</Link>.
      </p>
    </PageWrapper>
  )
}

export function Contact() {
  return (
    <PageWrapper icon={<Mail size={26} />} title="Kontak">
      <p>
        Ada pertanyaan, masukan, laporan bug, atau ingin bekerja sama dengan Heaven's Quill?
        Kami senang mendengar dari kamu.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', marginTop: 24 }}>Email</h2>
      <p>
        Untuk urusan resmi, kirim email ke:{' '}
        <a
          href="mailto:heavensquill1@gmail.com"
          style={{ color: 'var(--gold)', fontWeight: 600 }}
        >
          heavensquill1@gmail.com
        </a>
      </p>

      <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', marginTop: 24 }}>Media Sosial</h2>
      <p>Kamu juga bisa menghubungi kami lewat:</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
        <a
          href="https://instagram.com/heavensquill1"
          target="_blank"
          rel="noopener noreferrer"
          className="card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            color: 'var(--text)',
          }}
        >
          <span style={{ fontSize: 20 }}>📷</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Instagram</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              @heavensquill1
            </div>
          </div>
        </a>

        <a
          href="https://discord.gg/EA7Tew7rut"
          target="_blank"
          rel="noopener noreferrer"
          className="card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            color: 'var(--text)',
          }}
        >
          <MessageCircle size={20} color="var(--gold)" />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Discord</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Gabung komunitas Heaven's Quill
            </div>
          </div>
        </a>
      </div>

      <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', marginTop: 24 }}>Waktu Respon</h2>
      <p>
        Kami biasanya merespon dalam 1–3 hari kerja. Mohon bersabar jika ada keterlambatan,
        karena Heaven's Quill dijalankan oleh tim kecil.
      </p>

      <div
        style={{
          marginTop: 32,
          padding: 16,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          fontSize: '0.9rem',
        }}
      >
        <strong style={{ color: 'var(--text)' }}>Catatan:</strong> Kami tidak menerima permintaan
        untuk menghapus konten tanpa alasan yang jelas. Jika kamu adalah pemegang hak cipta dan
        merasa ada konten yang melanggar, silakan hubungi kami lewat email dengan bukti kepemilikan.
      </div>
    </PageWrapper>
  )
}

export function Privacy() {
  return (
    <PageWrapper icon={<Shield size={26} />} title="Kebijakan Privasi">
      <p style={{ fontStyle: 'italic' }}>
        Terakhir diperbarui: 19 September 2026
      </p>

      <p>
        Kebijakan Privasi ini menjelaskan bagaimana Heaven's Quill mengumpulkan, menggunakan,
        dan melindungi informasi pengunjung. Dengan mengakses situs ini, kamu menyetujui praktik
        yang dijelaskan di bawah ini.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', marginTop: 24 }}>1. Informasi yang Kami Kumpulkan</h2>
      <p>
        Kami dapat mengumpulkan informasi non-pribadi seperti jenis browser, perangkat, halaman
        yang dikunjungi, dan waktu kunjungan. Jika kamu mendaftar akun, kami menyimpan email dan
        nama tampilan yang kamu berikan.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', marginTop: 24 }}>2. Cookie dan Teknologi Serupa</h2>
      <p>
        Situs ini menggunakan cookie untuk meningkatkan pengalaman pengguna, menyimpan preferensi
        (seperti tema dan ukuran font), dan menampilkan iklan yang relevan. Cookie adalah file
        kecil yang disimpan di perangkatmu.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', marginTop: 24 }}>3. Iklan Pihak Ketiga (Adsterra)</h2>
      <p>
        Heaven's Quill menampilkan iklan melalui jaringan pihak ketiga, saat ini{' '}
        <strong style={{ color: 'var(--text)' }}>Adsterra</strong>. Adsterra dan mitranya dapat
        menggunakan cookie, web beacon, dan teknologi serupa untuk menayangkan iklan yang relevan
        berdasarkan kunjunganmu ke situs ini dan situs lain di internet.
      </p>
      <p>
        Iklan ini membantu kami menutupi biaya operasional situs. Kami berusaha semaksimal mungkin
        memfilter kategori iklan yang tidak sesuai (seperti judi, konten dewasa, atau materi
        berbahaya), namun jaringan iklan pihak ketiga tidak sepenuhnya dapat kami kontrol.
      </p>
      <p>
        Untuk informasi lebih lanjut tentang bagaimana Adsterra menangani data, kunjungi{' '}
        <a
          href="https://adsterra.com/privacy-policy/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--gold)' }}
        >
          Kebijakan Privasi Adsterra
        </a>.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', marginTop: 24 }}>4. Google AdSense (Jika Ada)</h2>
      <p>
        Jika kami mengaktifkan Google AdSense di masa depan, Google sebagai vendor pihak ketiga
        akan menggunakan cookie (termasuk cookie DART) untuk menayangkan iklan berdasarkan
        kunjunganmu. Kamu dapat menonaktifkan iklan yang dipersonalisasi dengan mengunjungi{' '}
        <a
          href="https://www.google.com/settings/ads"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--gold)' }}
        >
          Pengaturan Iklan Google
        </a>.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', marginTop: 24 }}>5. Penggunaan Informasi</h2>
      <p>
        Informasi yang kami kumpulkan digunakan untuk: mengoperasikan situs, meningkatkan kualitas
        layanan, menampilkan iklan, dan mencegah penyalahgunaan. Kami tidak menjual data pribadi
        pengguna ke pihak ketiga.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', marginTop: 24 }}>6. Keamanan</h2>
      <p>
        Kami berusaha melindungi data pengguna dengan langkah-langkah keamanan yang wajar. Namun,
        tidak ada metode transmisi di internet yang 100% aman. Kami tidak dapat menjamin keamanan
        absolut.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', marginTop: 24 }}>7. Tautan ke Situs Lain</h2>
      <p>
        Situs ini dapat berisi tautan ke situs pihak ketiga (termasuk iklan). Kami tidak
        bertanggung jawab atas kebijakan privasi atau konten dari situs-situs tersebut.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', marginTop: 24 }}>8. Hak Pengguna</h2>
      <p>
        Kamu berhak untuk mengakses, memperbarui, atau menghapus akunmu kapan saja. Jika ingin
        menghapus akun, hubungi kami melalui halaman{' '}
        <Link to="/kontak" style={{ color: 'var(--gold)' }}>Kontak</Link>.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', marginTop: 24 }}>9. Penggunaan AdBlock</h2>
      <p>
        Kami tidak melarang penggunaan AdBlock. Kamu bebas menggunakan AdBlock atau pemblokir
        iklan lain untuk kenyamanan membaca. Situs ini tetap dapat diakses sepenuhnya tanpa
        mematikan AdBlock.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', marginTop: 24 }}>10. Perubahan Kebijakan</h2>
      <p>
        Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Perubahan akan
        dipublikasikan di halaman ini dengan tanggal pembaruan terbaru.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', marginTop: 24 }}>11. Kontak</h2>
      <p>
        Jika ada pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami melalui
        halaman <Link to="/kontak" style={{ color: 'var(--gold)' }}>Kontak</Link> atau email
        ke{' '}
        <a href="mailto:heavensquill1@gmail.com" style={{ color: 'var(--gold)' }}>
          heavensquill1@gmail.com
        </a>.
      </p>
    </PageWrapper>
  )
}

export function Rules() {
  return (
    <PageWrapper icon={<BookOpen size={26} />} title="Peraturan">
      <p style={{ fontStyle: 'italic' }}>
        Terakhir diperbarui: 20 September 2026
      </p>

      <p>
        Selamat datang di Heaven's Quill! Biar komunitas kita tetap nyaman dan asyik,
        tolong baca dan patuhi peraturan berikut. Dengan menggunakan situs ini, kamu
        dianggap sudah menyetujui semua peraturan di bawah.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', marginTop: 24 }}>1. Aturan Umum</h2>
      <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
        <li>Gunakan Bahasa Indonesia yang sopan dan mudah dipahami.</li>
        <li>Jangan spam, flood, atau mengirim pesan berulang-ulang.</li>
        <li>Jangan promosi produk/jasa/situs lain tanpa izin admin.</li>
        <li>Jangan upload konten ilegal, berbahaya, atau melanggar hukum.</li>
        <li>Hormati sesama pembaca dan penerjemah.</li>
      </ul>

      <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', marginTop: 24 }}>2. Aturan Komentar & Review</h2>
      <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
        <li>Dilarang SARA (Suku, Agama, Ras, Antargolongan) dan ujaran kebencian.</li>
        <li>Dilarang berkata kasar, menghina, atau melecehkan user lain.</li>
        <li>Dilarang spoiler tanpa tanda spoiler (gunakan fitur spoiler yang tersedia).</li>
        <li>Dilarang promosi judi, situs dewasa, atau konten ilegal lainnya.</li>
        <li>Kritik boleh, tapi sampaikan dengan sopan dan membangun.</li>
        <li>Komentar yang tidak relevan dengan chapter/novel akan dihapus.</li>
      </ul>

      <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', marginTop: 24 }}>3. Aturan Akun</h2>
      <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
        <li>Satu orang disarankan hanya punya satu akun.</li>
        <li>Dilarang menggunakan nama tampilan yang menyerupai admin/moderator.</li>
        <li>Dilarang menggunakan foto profil yang tidak pantas.</li>
        <li>Jangan bagikan password akunmu ke siapa pun.</li>
        <li>Akun yang melanggar bisa diblokir tanpa pemberitahuan sebelumnya.</li>
      </ul>

      <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', marginTop: 24 }}>4. Aturan Konten</h2>
      <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
        <li>Heaven's Quill hanya menampilkan karya terjemahan yang sudah diizinkan atau tersedia bebas.</li>
        <li>Dilarang menyalin konten dari Heaven's Quill tanpa izin dan kredit.</li>
        <li>Jika kamu pemegang hak cipta dan merasa keberatan, hubungi kami lewat halaman Kontak.</li>
        <li>Admin berhak menghapus konten yang dianggap melanggar tanpa pemberitahuan.</li>
      </ul>

      <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', marginTop: 24 }}>5. Sanksi Pelanggaran</h2>
      <p>Pelanggaran akan ditindak sesuai tingkat keparahan:</p>
      <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
        <li><strong style={{ color: 'var(--text)' }}>Peringatan:</strong> untuk pelanggaran ringan pertama kali.</li>
        <li><strong style={{ color: 'var(--text)' }}>Hapus konten:</strong> komentar/review yang melanggar akan dihapus.</li>
        <li><strong style={{ color: 'var(--text)' }}>Blokir sementara:</strong> 7 hari untuk pelanggaran sedang.</li>
        <li><strong style={{ color: 'var(--text)' }}>Blokir permanen:</strong> untuk pelanggaran berat atau berulang.</li>
      </ul>

      <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', marginTop: 24 }}>6. Pelaporan</h2>
      <p>
        Kalau kamu menemukan pelanggaran, tolong laporkan ke kami lewat halaman{' '}
        <Link to="/kontak" style={{ color: 'var(--gold)' }}>Kontak</Link> atau join Discord kami.
        Sertakan bukti (screenshot) biar lebih mudah ditindaklanjuti.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', marginTop: 24 }}>7. Perubahan Peraturan</h2>
      <p>
        Peraturan ini bisa berubah kapan saja tanpa pemberitahuan sebelumnya. Perubahan akan
        dipublikasikan di halaman ini dengan tanggal pembaruan terbaru.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', marginTop: 24 }}>8. Kontak</h2>
      <p>
        Ada pertanyaan tentang peraturan ini? Hubungi kami lewat halaman{' '}
        <Link to="/kontak" style={{ color: 'var(--gold)' }}>Kontak</Link>.
      </p>

      <div
        style={{
          marginTop: 32,
          padding: 16,
          background: 'var(--surface)',
          border: '1px solid var(--gold)',
          borderRadius: 'var(--radius)',
          fontSize: '0.9rem',
          textAlign: 'center',
        }}
      >
        <strong style={{ color: 'var(--gold)' }}>📚 Selamat membaca!</strong>
        <br />
        <span style={{ color: 'var(--text-muted)' }}>
          Dengan mengikuti peraturan, kita bantu Heaven's Quill jadi tempat yang nyaman buat semua.
        </span>
      </div>
    </PageWrapper>
  )
      }
