"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export default function DasborManajer() {
  const [nama, setNama] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("driver");
  const [loading, setLoading] = useState(false);

  const [karyawan, setKaryawan] = useState([]);
  const [memuatData, setMemuatData] = useState(true);

  // --- STATE BARU UNTUK FITUR PENCARIAN & FILTER ---
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

  const handleDaftar = async (e) => {
    e.preventDefault();
    setLoading(true);

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
      setLoading(false);
    }
  };

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

  // --- LOGIKA FILTERING ---
  const karyawanDifilter = karyawan.filter((k) => {
    const cocokNama = k.nama_lengkap
      .toLowerCase()
      .includes(kataKunci.toLowerCase());
    const cocokPosisi = filterPosisi === "semua" || k.role === filterPosisi;
    return cocokNama && cocokPosisi;
  });

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 bg-white rounded-xl shadow-lg overflow-hidden h-fit">
          <div className="bg-blue-600 p-6 text-center">
            <h1 className="text-xl font-bold text-white">Tambah Karyawan</h1>
          </div>
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
              disabled={loading}
              className={`w-full font-bold py-3 rounded-lg text-white ${loading ? "bg-slate-400" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {loading ? "Memproses..." : "Daftarkan"}
            </button>
          </form>
        </div>

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
