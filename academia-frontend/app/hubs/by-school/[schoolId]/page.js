import { redirect } from "next/navigation";

export default async function HubBySchoolRedirect({ params }) {
  const { schoolId } = await params;
  redirect(`/schools/${schoolId}`);
}