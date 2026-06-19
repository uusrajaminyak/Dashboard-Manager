"use client";
import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export default function DasborManajer() {
  const [karyawan, setKaryawan] = useState([]);
  const [memuatData, setMemuatData] = useState(true);

  const [orders, setOrders] = useState([]);
  const [memuatOrders, setMemuatOrders] = useState(true);

  const [tabAktif, setTabAktif] = useState("riwayat");

  const [nama, setNama] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("driver");
  const [loadingAkun, setLoadingAkun] = useState(false);

  const [manualDriver, setManualDriver] = useState("");
  const [manualKerani, setManualKerani] = useState("");
  const [manualTanggal, setManualTanggal] = useState("");
  const [manualAfdeling, setManualAfdeling] = useState("");
  const [manualBlok, setManualBlok] = useState("");
  const [manualTonase, setManualTonase] = useState("");
  const [loadingManual, setLoadingManual] = useState(false);

  const [kataKunci, setKataKunci] = useState("");
  const [filterPosisi, setFilterPosisi] = useState("semua");

  const [bulanTutup, setBulanTutup] = useState(new Date().getMonth() + 1);
  const [tahunTutup, setTahunTutup] = useState(new Date().getFullYear());
  const [teksKonfirmasi, setTeksKonfirmasi] = useState("");
  const [loadingTutupBuku, setLoadingTutupBuku] = useState(false);

  const ambilDataKaryawan = async () => {
    setMemuatData(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("nama_lengkap");
    if (data) setKaryawan(data);
    setMemuatData(false);
  };

  const ambilDataOrders = async () => {
    setMemuatOrders(true);
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        id, 
        completed_at, 
        afdeling, 
        blok, 
        estimasi_tonase,
        tonase_aktual, 
        status,
        nab_barcode,
        keterangan,
        driver:profiles!driver_id(nama_lengkap),
        kerani:profiles!kerani_id(nama_lengkap)
      `,
      )
      .order("completed_at", { ascending: false });

    if (!error && data) setOrders(data);
    setMemuatOrders(false);
  };

  useEffect(() => {
    ambilDataKaryawan();
    ambilDataOrders();
  }, []);

  const unduhCSV = () => {
    if (orders.length === 0) {
      alert("Tidak ada data untuk diunduh.");
      return;
    }

    let csvContent =
      "Tanggal,Supir,Kerani,Afdeling,Blok,Barcode NAB,Est. Tonase,Tonase Aktual,Status,Keterangan\n";

    orders.forEach((row) => {
      const tanggal = row.completed_at
        ? new Date(row.completed_at).toLocaleDateString("id-ID")
        : "-";
      const namaSupir = row.driver ? row.driver.nama_lengkap : "-";
      const namaKerani = row.kerani ? row.kerani.nama_lengkap : "-";
      const nab = row.nab_barcode || "-";
      const est = row.estimasi_tonase || "0";
      const akt = row.tonase_aktual || "0";
      const ket = row.keterangan ? row.keterangan.replace(/,/g, " ") : "-";

      csvContent += `${tanggal},${namaSupir},${namaKerani},${row.afdeling},${row.blok},${nab},${est},${akt},${row.status},${ket}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Laporan_Ritase_${new Date().toLocaleDateString("id-ID")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTutupBuku = async (e) => {
    e.preventDefault();
    if (teksKonfirmasi !== "HAPUS") {
      alert("Konfirmasi tidak valid. Harap ketik 'HAPUS' dengan huruf besar.");
      return;
    }

    const yakin = window.confirm(
      `Peringatan!\n\nData ritase dan foto pada periode ${bulanTutup}/${tahunTutup} akan dihapus secara permanen. Pastikan Anda sudah mengunduh laporan CSV.\n\nLanjutkan proses penghapusan?`,
    );
    if (!yakin) return;

    setLoadingTutupBuku(true);
    try {
      const res = await fetch("/api/cleaning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bulan: parseInt(bulanTutup),
          tahun: parseInt(tahunTutup),
        }),
      });
      const data = await res.json();

      if (data.success) {
        alert(data.message);
        setTeksKonfirmasi("");
        ambilDataOrders();
      } else {
        alert(`Gagal memproses data: ${data.error}`);
      }
    } catch (err) {
      alert("Terjadi kendala saat menghubungi server.");
    } finally {
      setLoadingTutupBuku(false);
    }
  };

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
        alert(`Pendaftaran berhasil.\nNama: ${nama}\nKata Sandi: ${password}`);
        setNama("");
        setPassword("");
        ambilDataKaryawan();
      } else {
        alert(`Pendaftaran gagal: ${data.error}`);
      }
    } catch (err) {
      alert("Terjadi kendala jaringan saat mendaftarkan akun.");
    } finally {
      setLoadingAkun(false);
    }
  };

  const handleHapus = async (id, namaKaryawan) => {
    const konfirmasi = window.confirm(
      `Apakah Anda yakin ingin menghapus akun "${namaKaryawan}" secara permanen?`,
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
        ambilDataKaryawan();
      } else {
        alert(`Gagal menghapus akun: ${data.error}`);
      }
    } catch (err) {
      alert("Terjadi kendala jaringan saat menghapus akun.");
    }
  };

  const handleHapusOrder = async (id) => {
    const konfirmasi = window.confirm(
      "Apakah Anda yakin ingin menghapus data transaksi ini?",
    );
    if (!konfirmasi) return;

    try {
      const res = await fetch("/api/delete-order", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        ambilDataOrders();
      } else {
        alert(`Gagal menghapus transaksi: ${data.error}`);
      }
    } catch (err) {
      alert("Terjadi kendala jaringan saat menghapus transaksi.");
    }
  };

  const handleInputManual = async (e) => {
    e.preventDefault();
    if (!manualDriver || !manualKerani || !manualTanggal) {
      alert("Harap lengkapi pilihan Supir, Kerani, dan Tanggal.");
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
        alert("Data ritase manual berhasil disimpan.");
        setManualAfdeling("");
        setManualBlok("");
        setManualTonase("");
        ambilDataOrders();
      } else {
        alert(`Gagal menyimpan data: ${data.error}`);
      }
    } catch (err) {
      alert("Terjadi kendala jaringan saat menyimpan data.");
    } finally {
      setLoadingManual(false);
    }
  };
  const handleUploadExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoadingManual(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: "binary", cellDates: true });

        // <-- PERBAIKAN 2: Perbaikan typo variabel worksheet
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const dataExcel = XLSX.utils.sheet_to_json(ws);

        if (dataExcel.length === 0) {
          alert("File Excel kosong.");
          setLoadingManual(false);
          return;
        }

        let berhasil = 0;
        let gagal = 0;
        let pesanGagal = [];

        for (const [index, baris] of dataExcel.entries()) {
          const barisKe = index + 2;

          if (
            !baris["Tanggal"] ||
            !baris["Nama Supir"] ||
            !baris["Nama Kerani"] ||
            !baris["Afdeling"] ||
            !baris["Blok"] ||
            !baris["Tonase Aktual"] ||
            !baris["NAB"]
          ) {
            gagal++;
            pesanGagal.push(`Baris ${barisKe}: Data tidak lengkap`);
            continue;
          }

          const supirTarget = karyawan.find(
            (k) =>
              k.role === "driver" &&
              k.nama_lengkap.toLowerCase() ===
                baris["Nama Supir"].toLowerCase(),
          );
          const keraniTarget = karyawan.find(
            (k) =>
              k.role === "kerani" &&
              k.nama_lengkap.toLowerCase() ===
                baris["Nama Kerani"].toLowerCase(),
          );

          if (!supirTarget || !keraniTarget) {
            gagal++;
            pesanGagal.push(
              `Baris ${barisKe}: Supir atau Kerani tidak ditemukan`,
            );
            continue;
          }

          let tanggalInput;
          if (baris["Tanggal"] instanceof Date) {
            tanggalInput = baris["Tanggal"].toISOString();
          } else if (typeof baris["Tanggal"] === "number") {
            tanggalInput = new Date(
              (baris["Tanggal"] - 25569) * 86400 * 1000,
            ).toISOString();
          } else {
            tanggalInput = new Date(baris["Tanggal"]).toISOString();
          }

          const tonaseKilo = parseFloat(
            baris["Tonase Aktual"].toString().replace(",", "."),
          );
          const tonaseAktualFinal =
            tonaseKilo > 100 ? tonaseKilo / 1000 : tonaseKilo;

          const payloadOrder = {
            driver_id: supirTarget.id,
            kerani_id: keraniTarget.id,
            afdeling: baris["Afdeling"].toString().toUpperCase(),
            blok: baris["Blok"].toString().toUpperCase(),
            estimasi_tonase: tonaseAktualFinal,
            tonase_aktual: tonaseAktualFinal,
            status: "completed",
            nab_barcode: baris["NAB"].toString(),
            keterangan: "Input Massal Excel",
            created_at: tanggalInput,
            started_at: tanggalInput,
            completed_at: tanggalInput,
          };

          const { error } = await supabase.from("orders").insert(payloadOrder);
          if (error) {
            gagal++;
            pesanGagal.push(
              `Baris ${barisKe}: Gagal menyimpan (${error.message})`,
            );
          } else {
            berhasil++;
          }
        }
        alert(
          `Proses selesai.\nBerhasil: ${berhasil}\nGagal: ${gagal}\n\n${pesanGagal.join("\n")}`,
        );
        ambilDataOrders();
      } catch (err) {
        alert("Terjadi kesalahan saat membaca file Excel.");
      } finally {
        setLoadingManual(false);
        e.target.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const karyawanDifilter = karyawan.filter((k) => {
    const cocokNama = k.nama_lengkap
      ?.toLowerCase()
      .includes(kataKunci.toLowerCase());
    const cocokPosisi = filterPosisi === "semua" || k.role === filterPosisi;
    return cocokNama && cocokPosisi;
  });

  const daftarDriver = karyawan.filter((k) => k.role === "driver");
  const daftarKerani = karyawan.filter((k) => k.role === "kerani");

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-center bg-slate-800 p-4 rounded-xl shadow gap-4">
        <h1 className="text-2xl font-bold text-white tracking-wide">
          <span className="text-blue-400 font-normal">Manager Center</span>
        </h1>
        <button
          onClick={unduhCSV}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded shadow transition-all"
        >
          Unduh Laporan
        </button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow p-2 flex flex-col gap-1">
            <button
              onClick={() => setTabAktif("riwayat")}
              className={`py-3 px-4 font-bold text-left rounded-lg transition-all ${tabAktif === "riwayat" ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              Riwayat Transaksi
            </button>
            <button
              onClick={() => setTabAktif("akun")}
              className={`py-3 px-4 font-bold text-left rounded-lg transition-all ${tabAktif === "akun" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              Kelola Karyawan
            </button>
            <button
              onClick={() => setTabAktif("manual")}
              className={`py-3 px-4 font-bold text-left rounded-lg transition-all ${tabAktif === "manual" ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              Input Susulan
            </button>
            <button
              onClick={() => setTabAktif("tutupbuku")}
              className={`py-3 px-4 font-bold text-left rounded-lg transition-all ${tabAktif === "tutupbuku" ? "bg-red-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              Hapus Data Lama
            </button>
          </div>

          <div className="bg-white rounded-xl shadow overflow-hidden">
            {tabAktif === "akun" && (
              <form onSubmit={handleDaftar} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Nama Karyawan
                  </label>
                  <input
                    type="text"
                    required
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    className="w-full border p-2 rounded bg-white text-slate-900 focus:outline-none"
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
                    className="w-full border p-2 rounded bg-white text-slate-900 font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Posisi
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full border p-2 rounded bg-white text-slate-900 focus:outline-none"
                  >
                    <option value="driver">Driver</option>
                    <option value="kerani">Kerani</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={loadingAkun}
                  className={`w-full font-bold py-3 rounded text-white ${loadingAkun ? "bg-slate-400" : "bg-blue-600 hover:bg-blue-700"}`}
                >
                  Daftarkan Akun
                </button>
              </form>
            )}

            {tabAktif === "manual" && (
              <form onSubmit={handleInputManual} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supir
                  </label>
                  <select
                    required
                    value={manualDriver}
                    onChange={(e) => setManualDriver(e.target.value)}
                    className="w-full border p-2 rounded bg-white text-slate-900 focus:outline-none"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kerani
                  </label>
                  <select
                    required
                    value={manualKerani}
                    onChange={(e) => setManualKerani(e.target.value)}
                    className="w-full border p-2 rounded bg-white text-slate-900 focus:outline-none"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    required
                    value={manualTanggal}
                    onChange={(e) => setManualTanggal(e.target.value)}
                    className="w-full border p-2 rounded bg-white text-slate-900 focus:outline-none"
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
                      value={manualAfdeling}
                      onChange={(e) => setManualAfdeling(e.target.value)}
                      className="w-full border p-2 rounded bg-white text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Blok
                    </label>
                    <input
                      type="text"
                      required
                      value={manualBlok}
                      onChange={(e) => setManualBlok(e.target.value)}
                      className="w-full border p-2 rounded bg-white text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tonase Aktual
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={manualTonase}
                    onChange={(e) => setManualTonase(e.target.value)}
                    className="w-full border p-2 rounded bg-white text-slate-900 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loadingManual}
                  className={`w-full font-bold py-3 rounded text-white mt-2 ${loadingManual ? "bg-slate-400" : "bg-emerald-600 hover:bg-emerald-700"}`}
                >
                  Simpan
                </button>
                <div className="my-6 border-t border-slate-200 pt-6">
                  <p className="text-sm font-bold text-slate-800 mb-2">
                    Atau Upload File Excel
                  </p>
                  <p className="text-xs text-slate-500 mb-3">
                    Format Kolom: Tanggal | Nama Supir | Nama Kerani | Afdeling
                    | Blok | Tonase Aktual | NAB
                  </p>

                  <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-6 hover:bg-slate-50 transition-colors text-center">
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={handleUploadExcel}
                      disabled={loadingManual}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="text-slate-600">
                      {loadingManual ? (
                        <span className="font-semibold text-blue-600">
                          Memproses Excel... Mohon tunggu.
                        </span>
                      ) : (
                        <>
                          <span className="block font-semibold">
                            Klik atau Seret file Excel ke sini
                          </span>
                          <span className="text-xs mt-1 block">
                            Format yang didukung: .xlsx
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            )}

            {tabAktif === "tutupbuku" && (
              <form onSubmit={handleTutupBuku} className="p-6 space-y-4">
                <div className="bg-red-50 text-red-800 text-xs p-3 rounded mb-2 border border-red-200">
                  Perhatian: Proses ini akan menghapus data ritase dan lampiran
                  foto dari server secara permanen.
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Bulan
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={bulanTutup}
                      onChange={(e) => setBulanTutup(e.target.value)}
                      className="w-full border p-2 rounded bg-white text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tahun
                    </label>
                    <input
                      type="number"
                      min="2024"
                      value={tahunTutup}
                      onChange={(e) => setTahunTutup(e.target.value)}
                      className="w-full border p-2 rounded bg-white text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-red-600 mb-1">
                    Ketik konfirmasi: HAPUS
                  </label>
                  <input
                    type="text"
                    required
                    value={teksKonfirmasi}
                    onChange={(e) => setTeksKonfirmasi(e.target.value)}
                    className="w-full border border-red-300 bg-red-50 text-red-900 font-mono p-2 rounded focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loadingTutupBuku}
                  className={`w-full font-bold py-3 rounded text-white mt-2 ${loadingTutupBuku ? "bg-slate-400" : "bg-red-600 hover:bg-red-700"}`}
                >
                  Proses Tutup Buku
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-xl shadow overflow-hidden flex flex-col h-[80vh]">
          {tabAktif === "riwayat" ? (
            <>
              <div className="bg-slate-50 p-4 border-b flex justify-between items-center shrink-0">
                <h2 className="font-bold text-slate-800">Riwayat Transaksi</h2>
                <button
                  onClick={ambilDataOrders}
                  className="text-sm border bg-white text-slate-700 px-3 py-1 rounded hover:bg-slate-100 shadow-sm"
                >
                  Muat Ulang
                </button>
              </div>
              <div className="overflow-y-auto flex-1 bg-white">
                {memuatOrders ? (
                  <p className="p-6 text-center text-slate-500">
                    Memuat data...
                  </p>
                ) : (
                  <table className="w-full text-left border-collapse text-sm bg-white text-slate-900">
                    <thead className="sticky top-0 bg-slate-100 z-10 shadow-sm border-b">
                      <tr className="text-slate-700">
                        <th className="p-3 font-semibold">Tanggal</th>
                        <th className="p-3 font-semibold">Supir</th>
                        <th className="p-3 font-semibold">Lokasi</th>
                        <th className="p-3 font-semibold">Barcode NAB</th>
                        <th className="p-3 font-semibold text-right">Tonase</th>
                        <th className="p-3 font-semibold">Status</th>
                        <th className="p-3 font-semibold text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => (
                        <tr
                          key={o.id}
                          className="border-b hover:bg-slate-50 text-slate-900"
                        >
                          <td className="p-3 text-slate-900">
                            {o.completed_at
                              ? new Date(o.completed_at).toLocaleDateString(
                                  "id-ID",
                                )
                              : "-"}
                          </td>
                          <td className="p-3 font-medium text-blue-700">
                            {o.driver?.nama_lengkap || "-"}
                          </td>
                          <td className="p-3 text-slate-900">
                            {o.afdeling}/{o.blok}
                          </td>
                          <td className="p-3 font-mono text-xs text-slate-800">
                            {o.nab_barcode || "-"}
                          </td>
                          <td className="p-3 text-right font-bold text-slate-900">
                            {o.tonase_aktual || o.estimasi_tonase || "0"} T
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${o.keterangan ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}
                            >
                              {o.keterangan ? "Manual" : o.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleHapusOrder(o.id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold transition-colors"
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
            </>
          ) : tabAktif === "akun" ? (
            <>
              <div className="p-4 bg-slate-50 border-b flex gap-3 shrink-0">
                <input
                  type="text"
                  placeholder="Cari nama karyawan..."
                  value={kataKunci}
                  onChange={(e) => setKataKunci(e.target.value)}
                  className="flex-1 border p-2 rounded bg-white text-slate-900 focus:outline-none"
                />
                <select
                  value={filterPosisi}
                  onChange={(e) => setFilterPosisi(e.target.value)}
                  className="border p-2 rounded w-32 bg-white text-slate-900 focus:outline-none"
                >
                  <option value="semua">Semua</option>
                  <option value="driver">Driver</option>
                  <option value="kerani">Kerani</option>
                </select>
              </div>
              <div className="overflow-y-auto flex-1 bg-white">
                <table className="w-full text-left border-collapse text-sm bg-white text-slate-900">
                  <thead className="sticky top-0 bg-slate-100 shadow-sm border-b">
                    <tr className="text-slate-600">
                      <th className="p-3">Nama</th>
                      <th className="p-3">Posisi</th>
                      <th className="p-3">Kata Sandi</th>
                      <th className="p-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {karyawanDifilter.map((k) => (
                      <tr
                        key={k.id}
                        className="border-b hover:bg-slate-50 text-slate-900"
                      >
                        <td className="p-3 font-medium text-slate-800">
                          {k.nama_lengkap}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 text-xs font-bold rounded-full ${k.role === "driver" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}
                          >
                            {k.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3">{k.kata_sandi}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleHapus(k.id, k.nama_lengkap)}
                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500 p-6 text-center bg-white">
              Pilih menu di sebelah kiri untuk mengelola sistem.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
