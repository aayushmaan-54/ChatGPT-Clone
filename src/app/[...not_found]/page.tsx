import { redirect } from "next/navigation";


export default function NotFoundCatchAll() {
  // Redirect to the home page when a 404 error occurs
  redirect("/");
}
