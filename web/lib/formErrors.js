// DRF rejects a form with { field: ["message"] }. clientFetch keeps that raw
// body on err.fields. fieldMap names the form's fields and the API key each
// one answers to:
//   fieldErrorsFrom(err, { title: "title", department: "department_id" })
// Returns the first message per field, plus a general message for anything
// that did not match one of them (a { error: "..." } body, a hub_id problem,
// a network failure).
export function fieldErrorsFrom(err, fieldMap) {
  const body = err?.fields && typeof err.fields === "object" ? err.fields : {};
  const fields = {};
  let matched = false;

  for (const [name, apiKey] of Object.entries(fieldMap)) {
    const value = body[apiKey];
    const message = Array.isArray(value) ? value[0] : typeof value === "string" ? value : "";
    fields[name] = message || "";
    if (message) matched = true;
  }

  return { fields, general: matched ? "" : err?.message || "Something went wrong." };
}