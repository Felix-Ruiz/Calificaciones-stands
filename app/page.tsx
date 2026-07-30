import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function HomePage() {
  // Ahora sí puede leer las opciones de sesión completas
  const session = await getServerSession(authOptions);

  // Si no hay sesión, al login
  if (!session) {
    redirect("/login");
  }

  // Leer el rol y redirigir
  const role = session.user?.role;
  
  if (role === "MASTER") redirect("/master");
  if (role === "STAND") redirect("/stand");
  if (role === "CLIENTE") redirect("/cliente");

  // Si algo sale mal y no tiene un rol válido, lo mandamos al login de vuelta para evitar pantallas negras
  redirect("/login");
}