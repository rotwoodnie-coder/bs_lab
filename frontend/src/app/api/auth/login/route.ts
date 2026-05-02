import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    success: true,
    data: {
      accessToken: "mock.access.token.has_binding.false.school_level_id.小学",
      refreshToken: "mock.refresh.token.has_binding.false.school_level_id.小学",
      has_binding: false,
      school_level_id: "小学",
    },
    error: null,
  });
}
