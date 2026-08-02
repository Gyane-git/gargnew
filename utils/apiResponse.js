// Response envelope helpers for endpoints added to mirror the legacy Laravel V1 API
// (gargdental). Existing routes keep using their own inline Response.json() calls and
// utils/authUser.js's unauthorizedResponse() - these helpers are additive, only used by
// new Laravel-compatibility routes, so they never change behavior of pre-existing endpoints.

export const successResponse = (message, extraFields = {}, status = 200) =>
  Response.json({ success: true, message, ...extraFields }, { status });

// Mirrors Laravel's Helpers::error_processor($validator): first error message per field,
// flattened into a {code,message} array. This is the DOMINANT Laravel V1 validation-error
// shape (most controllers use it) - a few endpoints deviate and must not use this helper
// (e.g. ReviewController::addReview uses a raw nested shape under a `status` key at 422).
export const validationErrorResponse = (fieldErrors, status = 403) =>
  Response.json(
    {
      success: false,
      message: "Validation errors",
      errors: Object.entries(fieldErrors).map(([code, message]) => ({
        code,
        message: Array.isArray(message) ? message[0] : message,
      })),
    },
    { status },
  );

// Mirrors Laravel's global exception handler shape for auth:api routes with no/invalid
// Passport token (bootstrap/app.php renders this for any unauthenticated request/api/*).
// Distinct from utils/authUser.js's unauthorizedResponse() ({success:false,...}) which
// existing routes already rely on - do not swap those to this helper.
export const unauthenticatedResponse = (message = "Valid authentication token required") =>
  Response.json({ error: "Unauthenticated", message }, { status: 401 });

export const serverErrorResponse = (message, error, status = 500) =>
  Response.json(
    { success: false, message, error: error?.message || String(error) },
    { status },
  );
