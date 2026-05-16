"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export default function DasborManajer() {
  const [karyawan, setKaryawan] = useState([]);
  const [memuatData, setMemuatData] = useState(true);

  // --- STATE TAB KIRI ---
  const [tabAktif, setTabAktif] = useState("akun");

  // --- STATE FORM TAMBAH AKUN ---
  const [nama, setNama] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("driver");
  const [loadingAkun, setLoadingAkun] = useState(false);

  // --- STATE FORM INPUT MANUAL ---
  const [manualDriver, setManualDriver] = useState("");
  const [manualKerani, setManualKerani] = useState("");
  const [manualTanggal, setManualTanggal] = useState("");
  const [manualAfdeling, setManualAfdeling] = useState("");
  const [manualBlok, setManualBlok] = useState("");
  const [manualTonase, setManualTonase] = useState("");
  const [loadingManual, setLoadingManual] = useState(false);

  // --- STATE FILTER & PENCARIAN ---
  const [kataKunci, setKataKunci] = useState("");
  const [filterPosisi, setFilterPosisi] = useState("semua");

  const ambilDataKaryawan = async () => {
    setMemuatData(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, nama_lengkap, role")
      .order("role", { ascending: true })
      .order("nama_lengkap", { ascending: true });

    if (!error && data) {
      setKaryawan(data);
    }
    setMemuatData(false);
  };

  useEffect(() => {
    ambilDataKaryawan();
  }, []);

  // --- HANDLER TAMBAH AKUN ---
  const handleDaftar = async (e) => {
    e.preventDefault();
    setLoadingAkun(true);

    const emailAman = nama.toLowerCase().replace(/[^a-z0-9]/g, "");
    const generatedEmail = `${emailAman}@kebun.com`;

    try {
      const res = await fetch("/api/create-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: generatedEmail,
          password,
          nama_lengkap: nama,
          role,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert(`SUKSES!\n\nNama: ${nama}\nPassword: ${password}`);
        setNama("");
        setPassword("");
        ambilDataKaryawan();
      } else {
        alert(`Gagal: ${data.error}`);
      }
    } catch (err) {
      alert("Gagal terhubung ke server.");
    } finally {
      setLoadingAkun(false);
    }
  };

  // --- HANDLER HAPUS AKUN ---
  const handleHapus = async (id, namaKaryawan) => {
    const konfirmasi = window.confirm(
      `PERINGATAN!\n\nApakah Anda yakin ingin menghapus akun "${namaKaryawan}" secara permanen?`,
    );
    if (!konfirmasi) return;

    try {
      const res = await fetch("/api/delete-employee", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (data.success) {
        alert(`Akun ${namaKaryawan} berhasil dihapus.`);
        ambilDataKaryawan();
      } else {
        alert(`Gagal menghapus: ${data.error}`);
      }
    } catch (err) {
      alert("Kesalahan jaringan saat menghapus data.");
    }
  };

  // --- HANDLER INPUT MANUAL RITASE ---
  const handleInputManual = async (e) => {
    e.preventDefault();
    if (!manualDriver || !manualKerani || !manualTanggal) {
      alert("Harap pilih Supir, Kerani, dan Tanggal terlebih dahulu!");
      return;
    }

    setLoadingManual(true);
    try {
      const res = await fetch("/api/manual-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driver_id: manualDriver,
          kerani_id: manualKerani,
          tanggal: manualTanggal,
          afdeling: manualAfdeling.toUpperCase(),
          blok: manualBlok.toUpperCase(),
          tonase: parseFloat(manualTonase.replace(",", ".")),
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Data ritase susulan berhasil disinkronisasi ke sistem!");
        setManualAfdeling("");
        setManualBlok("");
        setManualTonase("");
      } else {
        alert(`Gagal menyimpan data: ${data.error}`);
      }
    } catch (err) {
      alert("Gagal terhubung ke server.");
    } finally {
      setLoadingManual(false);
    }
  };

  // --- LOGIKA FILTERING ---
  const karyawanDifilter = karyawan.filter((k) => {
    const cocokNama = k.nama_lengkap
      .toLowerCase()
      .includes(kataKunci.toLowerCase());
    const cocokPosisi = filterPosisi === "semua" || k.role === filterPosisi;
    return cocokNama && cocokPosisi;
  });

  // Pisahkan array untuk opsi dropdown Input Manual
  const daftarDriver = karyawan.filter((k) => k.role === "driver");
  const daftarKerani = karyawan.filter((k) => k.role === "kerani");

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* KOLOM KIRI: MULTI-TAB (TAMBAH AKUN / INPUT MANUAL) */}
        <div className="md:col-span-1 bg-white rounded-xl shadow-lg overflow-hidden h-fit">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setTabAktif("akun")}
              className={`flex-1 py-3 font-bold text-sm transition-colors ${tabAktif === "akun" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              Kelola Akun
            </button>
            <button
              onClick={() => setTabAktif("manual")}
              className={`flex-1 py-3 font-bold text-sm transition-colors ${tabAktif === "manual" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              Input Susulan
            </button>
          </div>

          {/* KONTEN TAB: TAMBAH AKUN */}
          {tabAktif === "akun" && (
            <form onSubmit={handleDaftar} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Nama
                </label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Kata Sandi
                </label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Posisi
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="driver">Driver</option>
                  <option value="kerani">Kerani</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={loadingAkun}
                className={`w-full font-bold py-3 rounded-lg text-white ${loadingAkun ? "bg-slate-400" : "bg-blue-600 hover:bg-blue-700"}`}
              >
                {loadingAkun ? "Memproses..." : "Daftarkan"}
              </button>
            </form>
          )}

          {/* KONTEN TAB: INPUT MANUAL RITASE */}
          {tabAktif === "manual" && (
            <form onSubmit={handleInputManual} className="p-6 space-y-4">
              <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded-lg mb-2 border border-amber-200">
                Gunakan form ini <b>hanya</b> untuk mendaftarkan ritase yang
                terlewat karena masalah aplikasi/HP di lapangan.
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Nama Supir
                </label>
                <select
                  required
                  value={manualDriver}
                  onChange={(e) => setManualDriver(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">Pilih Supir</option>
                  {daftarDriver.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nama_lengkap}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Nama Kerani
                </label>
                <select
                  required
                  value={manualKerani}
                  onChange={(e) => setManualKerani(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">Pilih Kerani</option>
                  {daftarKerani.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama_lengkap}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Tanggal Ritase
                </label>
                <input
                  type="date"
                  required
                  value={manualTanggal}
                  onChange={(e) => setManualTanggal(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Afdeling
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: OA"
                    value={manualAfdeling}
                    onChange={(e) => setManualAfdeling(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Blok
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 12"
                    value={manualBlok}
                    onChange={(e) => setManualBlok(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Tonase Aktual (Ton)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Contoh: 5.5"
                  value={manualTonase}
                  onChange={(e) => setManualTonase(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loadingManual}
                className={`w-full font-bold py-3 rounded-lg text-white mt-2 ${loadingManual ? "bg-slate-400" : "bg-emerald-600 hover:bg-emerald-700"}`}
              >
                {loadingManual ? "Menyimpan..." : "Simpan Data Susulan"}
              </button>
            </form>
          )}
        </div>

        {/* KOLOM KANAN: DATA KARYAWAN (TIDAK ADA PERUBAHAN) */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-[85vh]">
          <div className="bg-slate-800 p-6 flex justify-between items-center shrink-0">
            <h1 className="text-xl font-bold text-white">Data Karyawan</h1>
            <button
              onClick={ambilDataKaryawan}
              className="text-sm bg-slate-700 text-white px-3 py-1 rounded hover:bg-slate-600"
            >
              Muat Ulang
            </button>
          </div>

          <div className="p-4 bg-slate-50 border-b flex flex-col sm:flex-row gap-3 shrink-0">
            <input
              type="text"
              placeholder="Cari nama karyawan..."
              value={kataKunci}
              onChange={(e) => setKataKunci(e.target.value)}
              className="flex-1 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <select
              value={filterPosisi}
              onChange={(e) => setFilterPosisi(e.target.value)}
              className="border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none sm:w-40"
            >
              <option value="semua">Semua</option>
              <option value="driver">Driver</option>
              <option value="kerani">Kerani</option>
            </select>
          </div>

          <div className="p-0 overflow-y-auto flex-1">
            {memuatData ? (
              <p className="p-6 text-center text-slate-500">
                Menarik data dari server...
              </p>
            ) : karyawanDifilter.length === 0 ? (
              <p className="p-6 text-center text-slate-500 font-medium">
                {karyawan.length === 0
                  ? "Belum ada karyawan terdaftar."
                  : "Karyawan tidak ditemukan."}
              </p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm">
                  <tr className="text-slate-500 border-b">
                    <th className="p-4 font-semibold text-sm">Nama Pengguna</th>
                    <th className="p-4 font-semibold text-sm">Posisi</th>
                    <th className="p-4 font-semibold text-sm text-right">
                      Tindakan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {karyawanDifilter.map((k) => (
                    <tr key={k.id} className="border-b hover:bg-slate-50">
                      <td className="p-4 font-medium text-slate-800">
                        {k.nama_lengkap}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 text-xs font-bold rounded-full ${k.role === "driver" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}
                        >
                          {k.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleHapus(k.id, k.nama_lengkap)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded shadow text-sm font-semibold transition-colors"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
