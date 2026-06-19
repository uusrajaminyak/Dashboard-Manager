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

    const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(
      id,
      { ban_duration: "876000h" },
    );

    if (banError) throw banError;

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ is_online: false, role: "nonaktif" })
      .eq("id", id);

    if (profileError) throw profileError;

    return NextResponse.json({
      success: true,
      message: "Akun berhasil dinonaktifkan permanen",
    });
  } catch (error) {
    console.error("Kesalahan penonaktifan:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 },
    );
  }
}
