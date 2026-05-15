import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function DELETE(request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Karyawan tidak ditemukan" },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Akun berhasil dihapus",
    });
  } catch (error) {
    console.error("Kesalahan hapus:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 },
    );
  }
}
