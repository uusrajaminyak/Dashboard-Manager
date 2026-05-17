import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(request) {
  try {
    const { bulan, tahun } = await request.json();

    // 1. Tentukan rentang waktu (Awal bulan sampai akhir bulan)
    const startDate = `${tahun}-${bulan.toString().padStart(2, "0")}-01T00:00:00Z`;
    const nextMonth = bulan === 12 ? 1 : bulan + 1;
    const nextYear = bulan === 12 ? tahun + 1 : tahun;
    const endDate = `${nextYear}-${nextMonth.toString().padStart(2, "0")}-01T00:00:00Z`;
    const { data: ordersTarget, error: searchError } = await supabaseAdmin
      .from("orders")
      .select("bukti_foto_url")
      .gte("completed_at", startDate)
      .lt("completed_at", endDate)
      .not("bukti_foto_url", "is", null);

    if (searchError) throw searchError;

    if (ordersTarget && ordersTarget.length > 0) {
      const fileNames = ordersTarget.map((order) => {
        const urlParts = order.bukti_foto_url.split("/");
        return urlParts[urlParts.length - 1];
      });

      const { error: storageError } = await supabaseAdmin.storage
        .from("bukti_pengiriman")
        .remove(fileNames);

      if (storageError)
        console.error("Gagal hapus storage, lanjut hapus DB:", storageError);
    }

    const { error: deleteError } = await supabaseAdmin
      .from("orders")
      .delete()
      .gte("completed_at", startDate)
      .lt("completed_at", endDate);

    if (deleteError) throw deleteError;

    return NextResponse.json({
      success: true,
      message: `Sukses! Data dan foto bulan ${bulan}/${tahun} berhasil dihapus.`,
    });
  } catch (error) {
    console.error("Kesalahan Tutup Buku:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 },
    );
  }
}
