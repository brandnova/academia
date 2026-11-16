import { permanentRedirect } from "next/navigation";

export default async function HubBySchoolRedirect({ params }) {
  const { schoolId } = await params;
  permanentRedirect(`/schools/${schoolId}`);
}