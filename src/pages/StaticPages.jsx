import { Link } from 'react-router-dom'
import { Info, Mail, Shield, ArrowLeft, Instagram, MessageCircle } from 'lucide-react'

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
          <Instagram size={20} color="var(--gold)" />
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
        Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
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

      <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', marginTop: 24 }}>3. Google AdSense dan Pihak Ketiga</h2>
      <p>
        Heaven's Quill menggunakan <strong style={{ color: 'var(--text)' }}>Google AdSense</strong>{' '}
        untuk menampilkan iklan. Google, sebagai vendor pihak ketiga, menggunakan cookie (termasuk
        cookie DART) untuk menayangkan iklan berdasarkan kunjunganmu ke situs ini dan situs lain
        di internet.
      </p>
      <p>
        Kamu dapat menonaktifkan iklan yang dipersonalisasi dengan mengunjungi{' '}
        <a
          href="https://www.google.com/settings/ads"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--gold)' }}
        >
          Pengaturan Iklan Google
        </a>. Untuk informasi lebih lanjut tentang bagaimana Google menggunakan data, kunjungi{' '}
        <a
          href="https://policies.google.com/technologies/partner-sites"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--gold)' }}
        >
          Kebijakan Google
        </a>.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', marginTop: 24 }}>4. Penggunaan Informasi</h2>
      <p>
        Informasi yang kami kumpulkan digunakan untuk: mengoperasikan situs, meningkatkan kualitas
        layanan, menampilkan iklan, dan mencegah penyalahgunaan. Kami tidak menjual data pribadi
        pengguna ke pihak ketiga.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', marginTop: 24 }}>5. Keamanan</h2>
      <p>
        Kami berusaha melindungi data pengguna dengan langkah-langkah keamanan yang wajar. Namun,
        tidak ada metode transmisi di internet yang 100% aman. Kami tidak dapat menjamin keamanan
        absolut.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', marginTop: 24 }}>6. Tautan ke Situs Lain</h2>
      <p>
        Situs ini dapat berisi tautan ke situs pihak ketiga. Kami tidak bertanggung jawab atas
        kebijakan privasi atau konten dari situs-situs tersebut.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', marginTop: 24 }}>7. Hak Pengguna</h2>
      <p>
        Kamu berhak untuk mengakses, memperbarui, atau menghapus akunmu kapan saja. Jika ingin
        menghapus akun, hubungi kami melalui halaman{' '}
        <Link to="/kontak" style={{ color: 'var(--gold)' }}>Kontak</Link>.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', marginTop: 24 }}>8. Perubahan Kebijakan</h2>
      <p>
        Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Perubahan akan
        dipublikasikan di halaman ini dengan tanggal pembaruan terbaru.
      </p>

      <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', marginTop: 24 }}>9. Kontak</h2>
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
