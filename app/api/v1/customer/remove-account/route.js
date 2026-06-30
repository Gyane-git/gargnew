import pool from "@/utils/db";
import { getAuthUser, unauthorizedResponse } from "@/utils/authUser";

export async function DELETE(req) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser?.id) return unauthorizedResponse();

    const [result] = await pool.execute(
      "UPDATE users SET status = 0, remember_token = NULL, updated_at = NOW() WHERE id = ?",
      [authUser.id],
    );

    if (result.affectedRows === 0) return unauthorizedResponse();

    return Response.json({
      success: true,
      message: "Account removed successfully.",
    });
  } catch (error) {
    console.error("REMOVE ACCOUNT ERROR:", error);
    return Response.json({ success: false, errors: [{ message: "Internal server error. Please try again." }] }, { status: 500 });
  }
}
