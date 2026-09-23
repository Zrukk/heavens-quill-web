import { Link, useLocation } from 'react-router-dom'
import { Info, Mail, Shield, ArrowLeft, MessageCircle, BookOpen, FileText } from 'lucide-react'

function PageWrapper({ icon, title, subtitle, children }) {
  const location = useLocation()

  const navLinks = [
    { to: '/tentang', label: 'Tentang Kami', icon: <Info size={14} /> },
    { to: '/kontak', label: 'Kontak', icon: <Mail size={14} /> },
    { to: '/peraturan', label: 'Peraturan', icon: <BookOpen size={14} /> },
    { to: '/kebijakan-privasi', label: 'Kebijakan Privasi', icon: <Shield size={14} /> },
  ]

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 60, maxWidth: 900 }}>
      <Link
        to="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          color: 'var(--text-muted)',
          fontSize: '0.9rem',
          marginBottom: 20,
        }}
      >
        <ArrowLeft size={15} />
        Kembali ke Beranda
      </Link>

      <div className="static-layout">
        {/* SIDEBAR NAVIGASI */}
        <aside className="static-sidebar">
          <div className="card" style={{ padding: 16 }}>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginBottom: 12,
                fontWeight: 600,
              }}
            >
              Halaman Informasi
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 'var(--radius)',
                      fontSize: '0.85rem',
                      textDecoration: 'none',
                      color: isActive ? 'var(--gold)' : 'var(--text-muted)',
                      background: isActive ? 'rgba(212, 175, 91, 0.1)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--gold)' : '3px solid transparent',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </aside>

        {/* KONTEN UTAMA */}
        <main className="static-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'rgba(212, 175, 91, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {icon}
            </div>
            <div>
              <h1 className="gradient-text" style={{ fontSize: '1.8rem', lineHeight: 1.2 }}>
                {title}
              </h1>
              {subtitle && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div
            className="card"
            style={{
              padding: 24,
              marginTop: 20,
              color: 'var(--text-muted)',
              fontSize: '0.95rem',
              lineHeight: 1.7,
            }}
          >
            {children}
          </div>
        </main>
      </div>

      {/* CSS */}
      <style>{`
        .static-layout {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .static-sidebar {
          order: 1;
        }
        .static-content {
          order: 2;
          min-width: 0;
        }
        @media (min-width: 800px) {
          .static-layout {
            display: grid;
            grid-template-columns: 220px 1fr;
            gap: 32px;
            align-items: start;
          }
          .static-sidebar {
            position: sticky;
            top: 80px;
          }
        }
      `}</style>
    </div>
  )
}

// Helper untuk heading
const H2 = ({ children }) => (
  <h2 style={{ fontSize: '1.1rem', color: 'var(--text)', marginTop: 24, marginBottom: 8 }}>
    {children}
  </h2>
)

export function About() {
  return (
    <PageWrapper icon={<Info size={22} color="var(--gold)" />} title="Tentang Kami" subtitle="Siapa di balik Heaven's Quill">
      <p style={{ marginTop: 0 }}>
        <strong style={{ color: 'var(--text)' }}>Heaven's Quill</strong> adalah platform baca novel
        terjemahan yang dikelola secara independen. Kami menerjemahkan novel-novel populer dari
        Tionghoa, Jepang, dan Korea ke dalam Bahasa Indonesia, agar pembaca Indonesia bisa menikmati
        karya-karya terbaik tanpa terkendala bahasa.
      </p>

      <H2>Visi Kami</H2>
      <p>
        Menjadi salah satu sumber utama novel terjemahan berkualitas di Indonesia, dengan
        terjemahan yang enak dibaca, rapi, dan konsisten. Kami percaya bahwa cerita yang bagus
        layak dinikmati siapa saja, tanpa batas bahasa.
      </p>

      <H2>Apa yang Kami Lakukan</H2>
      <p>
        Kami mengkurasi novel-novel populer dari berbagai genre — mulai dari fantasy, sci-fi,
        misteri, hingga romance — lalu menerjemahkannya dengan pendekatan yang mengutamakan
        kualitas bahasa dan kenyamanan membaca. Setiap chapter dirilis secara berkala, dengan
        fokus pada konsistensi dan kecepatan update.
      </p>

      <H2>Dukungan</H2>
      <p>
        Heaven's Quill beroperasi secara mandiri. Jika kamu menikmati apa yang kami kerjakan,
        kamu bisa mendukung kami melalui halaman donasi. Setiap dukungan sangat berarti untuk
        menjaga situs ini tetap hidup dan terus berkembang.
      </p>

      <H2>Komunitas</H2>
      <p>Bergabunglah dengan komunitas kami di Discord untuk diskusi, info update terbaru, dan ngobrol santai sesama pembaca novel:</p>
      <p>
        <a
          href="https://discord.gg/EA7Tew7rut"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn--gold"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 4 }}
        >
          <MessageCircle size={16} />
          Gabung Discord
        </a>
      </p>

      <H2>Kontak</H2>
      <p>
        Punya pertanyaan, masukan, atau kerja sama? Silakan hubungi kami di halaman{' '}
        <Link to="/kontak" style={{ color: 'var(--gold)' }}>Kontak</Link>.
      </p>
    </PageWrapper>
  )
}

export function Contact() {
  return (
    <PageWrapper icon={<Mail size={22} color="var(--gold)" />} title="Kontak" subtitle="Hubungi kami kapan saja">
      <p style={{ marginTop: 0 }}>
        Ada pertanyaan, masukan, laporan bug, atau ingin bekerja sama dengan Heaven's Quill?
        Kami senang mendengar dari kamu.
      </p>

      <H2>Email</H2>
      <p>
        Untuk urusan resmi, kirim email ke:{' '}
        <a
          href="mailto:heavensquill1@gmail.com"
          style={{ color: 'var(--gold)', fontWeight: 600 }}
        >
          heavensquill1@gmail.com
        </a>
      </p>

      <H2>Media Sosial</H2>
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

      <H2>Waktu Respon</H2>
      <p>
        Kami biasanya merespon dalam 1–3 hari kerja. Mohon bersabar jika ada keterlambatan,
        karena Heaven's Quill dijalankan oleh tim kecil.
      </p>

      <div
        style={{
          marginTop: 24,
          padding: 16,
          background: 'var(--bg)',
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
    <PageWrapper icon={<Shield size={22} color="var(--gold)" />} title="Kebijakan Privasi" subtitle="Terakhir diperbarui: 20 September 2026">
      <p style={{ marginTop: 0 }}>
        Kebijakan Privasi ini menjelaskan bagaimana Heaven's Quill mengumpulkan, menggunakan,
        dan melindungi informasi pengunjung. Dengan mengakses situs ini, kamu menyetujui praktik
        yang dijelaskan di bawah ini.
      </p>

      <H2>1. Informasi yang Kami Kumpulkan</H2>
      <p>
        Kami dapat mengumpulkan informasi non-pribadi seperti jenis browser, perangkat, halaman
        yang dikunjungi, dan waktu kunjungan. Jika kamu mendaftar akun, kami menyimpan email dan
        nama tampilan yang kamu berikan.
      </p>

      <H2>2. Cookie dan Teknologi Serupa</H2>
      <p>
        Situs ini menggunakan cookie untuk meningkatkan pengalaman pengguna, menyimpan preferensi
        (seperti tema dan ukuran font), dan menampilkan iklan yang relevan. Cookie adalah file
        kecil yang disimpan di perangkatmu.
      </p>

      <H2>3. Iklan Pihak Ketiga (Monetag)</H2>
      <p>
        Heaven's Quill menampilkan iklan melalui jaringan pihak ketiga, saat ini{' '}
        <strong style={{ color: 'var(--text)' }}>Monetag</strong>. Monetag dan mitranya dapat
        menggunakan cookie, web beacon, dan teknologi serupa untuk menayangkan iklan yang relevan
        berdasarkan kunjunganmu ke situs ini dan situs lain di internet.
      </p>
      <p>
        Iklan ini membantu kami menutupi biaya operasional situs. Kami berusaha semaksimal mungkin
        memfilter kategori iklan yang tidak sesuai (seperti judi, konten dewasa, atau materi
        berbahaya), namun jaringan iklan pihak ketiga tidak sepenuhnya dapat kami kontrol.
      </p>
      <p>
        Untuk informasi lebih lanjut tentang bagaimana Monetag menangani data, kunjungi{' '}
        <a
          href="https://monetag.com/privacy-policy/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--gold)' }}
        >
          Kebijakan Privasi Monetag
        </a>.
      </p>

      <H2>4. Google AdSense (Jika Ada)</H2>
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

      <H2>5. Penggunaan Informasi</H2>
      <p>
        Informasi yang kami kumpulkan digunakan untuk: mengoperasikan situs, meningkatkan kualitas
        layanan, menampilkan iklan, dan mencegah penyalahgunaan. Kami tidak menjual data pribadi
        pengguna ke pihak ketiga.
      </p>

      <H2>6. Keamanan</H2>
      <p>
        Kami berusaha melindungi data pengguna dengan langkah-langkah keamanan yang wajar. Namun,
        tidak ada metode transmisi di internet yang 100% aman. Kami tidak dapat menjamin keamanan
        absolut.
      </p>

      <H2>7. Tautan ke Situs Lain</H2>
      <p>
        Situs ini dapat berisi tautan ke situs pihak ketiga (termasuk iklan). Kami tidak
        bertanggung jawab atas kebijakan privasi atau konten dari situs-situs tersebut.
      </p>

      <H2>8. Hak Pengguna</H2>
      <p>
        Kamu berhak untuk mengakses, memperbarui, atau menghapus akunmu kapan saja. Jika ingin
        menghapus akun, hubungi kami melalui halaman{' '}
        <Link to="/kontak" style={{ color: 'var(--gold)' }}>Kontak</Link>.
      </p>

      <H2>9. Penggunaan AdBlock</H2>
      <p>
        Kami tidak melarang penggunaan AdBlock. Kamu bebas menggunakan AdBlock atau pemblokir
        iklan lain untuk kenyamanan membaca. Situs ini tetap dapat diakses sepenuhnya tanpa
        mematikan AdBlock.
      </p>

      <H2>10. Perubahan Kebijakan</H2>
      <p>
        Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Perubahan akan
        dipublikasikan di halaman ini dengan tanggal pembaruan terbaru.
      </p>

      <H2>11. Kontak</H2>
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
    <PageWrapper icon={<BookOpen size={22} color="var(--gold)" />} title="Peraturan" subtitle="Terakhir diperbarui: 20 September 2026">
      <p style={{ marginTop: 0 }}>
        Selamat datang di Heaven's Quill! Biar komunitas kita tetap nyaman dan asyik,
        tolong baca dan patuhi peraturan berikut. Dengan menggunakan situs ini, kamu
        dianggap sudah menyetujui semua peraturan di bawah.
      </p>

      <H2>1. Aturan Umum</H2>
      <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
        <li>Gunakan Bahasa Indonesia yang sopan dan mudah dipahami.</li>
        <li>Jangan spam, flood, atau mengirim pesan berulang-ulang.</li>
        <li>Jangan promosi produk/jasa/situs lain tanpa izin admin.</li>
        <li>Jangan upload konten ilegal, berbahaya, atau melanggar hukum.</li>
        <li>Hormati sesama pembaca dan penerjemah.</li>
      </ul>

      <H2>2. Aturan Komentar & Review</H2>
      <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
        <li>Dilarang SARA (Suku, Agama, Ras, Antargolongan) dan ujaran kebencian.</li>
        <li>Dilarang berkata kasar, menghina, atau melecehkan user lain.</li>
        <li>Dilarang spoiler tanpa tanda spoiler (gunakan fitur spoiler yang tersedia).</li>
        <li>Dilarang promosi judi, situs dewasa, atau konten ilegal lainnya.</li>
        <li>Kritik boleh, tapi sampaikan dengan sopan dan membangun.</li>
        <li>Komentar yang tidak relevan dengan chapter/novel akan dihapus.</li>
      </ul>

      <H2>3. Aturan Akun</H2>
      <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
        <li>Satu orang disarankan hanya punya satu akun.</li>
        <li>Dilarang menggunakan nama tampilan yang menyerupai admin/moderator.</li>
        <li>Dilarang menggunakan foto profil yang tidak pantas.</li>
        <li>Jangan bagikan password akunmu ke siapa pun.</li>
        <li>Akun yang melanggar bisa diblokir tanpa pemberitahuan sebelumnya.</li>
      </ul>

      <H2>4. Aturan Konten</H2>
      <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
        <li>Heaven's Quill hanya menampilkan karya terjemahan yang sudah diizinkan atau tersedia bebas.</li>
        <li>Dilarang menyalin konten dari Heaven's Quill tanpa izin dan kredit.</li>
        <li>Jika kamu pemegang hak cipta dan merasa keberatan, hubungi kami lewat halaman Kontak.</li>
        <li>Admin berhak menghapus konten yang dianggap melanggar tanpa pemberitahuan.</li>
      </ul>

      <H2>5. Sanksi Pelanggaran</H2>
      <p>Pelanggaran akan ditindak sesuai tingkat keparahan:</p>
      <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
        <li><strong style={{ color: 'var(--text)' }}>Peringatan:</strong> untuk pelanggaran ringan pertama kali.</li>
        <li><strong style={{ color: 'var(--text)' }}>Hapus konten:</strong> komentar/review yang melanggar akan dihapus.</li>
        <li><strong style={{ color: 'var(--text)' }}>Blokir sementara:</strong> 7 hari untuk pelanggaran sedang.</li>
        <li><strong style={{ color: 'var(--text)' }}>Blokir permanen:</strong> untuk pelanggaran berat atau berulang.</li>
      </ul>

      <H2>6. Pelaporan</H2>
      <p>
        Kalau kamu menemukan pelanggaran, tolong laporkan ke kami lewat halaman{' '}
        <Link to="/kontak" style={{ color: 'var(--gold)' }}>Kontak</Link> atau join Discord kami.
        Sertakan bukti (screenshot) biar lebih mudah ditindaklanjuti.
      </p>

      <H2>7. Perubahan Peraturan</H2>
      <p>
        Peraturan ini bisa berubah kapan saja tanpa pemberitahuan sebelumnya. Perubahan akan
        dipublikasikan di halaman ini dengan tanggal pembaruan terbaru.
      </p>

      <H2>8. Kontak</H2>
      <p>
        Ada pertanyaan tentang peraturan ini? Hubungi kami lewat halaman{' '}
        <Link to="/kontak" style={{ color: 'var(--gold)' }}>Kontak</Link>.
      </p>

      <div
        style={{
          marginTop: 24,
          padding: 16,
          background: 'linear-gradient(135deg, rgba(212, 175, 91, 0.08), transparent)',
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
