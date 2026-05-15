import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, nama_lengkap, role } = body;

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
      });

    if (authError) throw authError;

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert([
        {
          id: authData.user.id,
          nama_lengkap: nama_lengkap,
          role: role,
          is_online: false,
          estimasi_gaji_bulan_ini: 0,
        },
      ]);

    if (profileError) throw profileError;

    return NextResponse.json({
      success: true,
      message: "Karyawan berhasil didaftarkan",
    });
  } catch (error) {
    console.error("Terjadi kesalahan:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 },
    );
  }
}
