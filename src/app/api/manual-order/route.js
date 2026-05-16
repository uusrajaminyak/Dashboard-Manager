import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(request) {
  try {
    const body = await request.json();
    const { driver_id, kerani_id, afdeling, blok, tonase, tanggal } = body;

    const { error } = await supabaseAdmin.from("orders").insert([
      {
        driver_id: driver_id,
        kerani_id: kerani_id,
        afdeling: afdeling,
        blok: blok,
        estimasi_tonase: tonase,
        tonase_aktual: tonase, 
        status: "completed",
        completed_at: `${tanggal}T12:00:00Z`, 
        keterangan: "Input Manual oleh Manajer", 
      },
    ]);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Data susulan berhasil ditambahkan",
    });
  } catch (error) {
    console.error("Kesalahan input manual:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 },
    );
  }
}
