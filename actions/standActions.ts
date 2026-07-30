"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function cargarStandsMasivos(standsData: { nombre: string }[]) {
  try {
    const nuevosStands = standsData.map((stand) => {
      const baseUsername = stand.nombre.replace(/\s+/g, '').substring(0, 10).toLowerCase();
      const username = `${baseUsername}_${Math.floor(Math.random() * 1000)}`;
      const password = Math.random().toString(36).slice(-6);

      return {
        role: "STAND" as const,
        username,
        password,
        nombreStand: stand.nombre,
      };
    });

    await prisma.user.createMany({
      data: nuevosStands,
      skipDuplicates: true,
    });

    revalidatePath("/master");
    return { success: true, message: `${nuevosStands.length} stands creados con éxito.` };
  } catch (error) {
    console.error("Error al cargar stands masivos:", error);
    return { success: false, message: "Hubo un error al guardar los stands en la base de datos." };
  }
}

export async function crearStandManual(nombre: string, logo?: string) {
  try {
    if (!nombre || nombre.trim() === "") {
      return { success: false, message: "El nombre del stand es requerido." };
    }

    const baseUsername = nombre.replace(/\s+/g, '').substring(0, 10).toLowerCase();
    const username = `${baseUsername}_${Math.floor(Math.random() * 1000)}`;
    const password = Math.random().toString(36).slice(-6);

    await prisma.user.create({
      data: {
        role: "STAND",
        username,
        password,
        nombreStand: nombre.trim(),
        logo: logo || null,
      }
    });

    revalidatePath("/master");
    return { success: true, message: `Stand "${nombre.trim()}" creado exitosamente.` };
  } catch (error) {
    console.error("Error al crear stand manual:", error);
    return { success: false, message: "Hubo un error al crear el stand." };
  }
}

export async function obtenerStands() {
  try {
    const stands = await prisma.user.findMany({
      where: { role: "STAND" },
      select: {
        id: true,
        nombreStand: true,
        username: true,
        password: true,
        logo: true,
        createdAt: true,
      },
      // AQUÍ ESTÁ LA ACTUALIZACIÓN: Orden alfabético por nombre
      orderBy: { nombreStand: "asc" }
    });
    return stands;
  } catch (error) {
    console.error("Error al obtener stands:", error);
    return [];
  }
}

export async function actualizarStand(id: string, nombreStand: string, password?: string, logo?: string) {
  try {
    const data: any = { nombreStand };
    
    if (password && password.trim() !== "") {
      data.password = password;
    }
    
    if (logo !== undefined) {
      data.logo = logo;
    }
    
    await prisma.user.update({ 
      where: { id }, 
      data 
    });
    
    revalidatePath("/master");
    return { success: true, message: "Stand actualizado correctamente." };
  } catch (error) {
    console.error("Error al actualizar stand:", error);
    return { success: false, message: "Error al actualizar el stand." };
  }
}

export async function eliminarStand(id: string) {
  try {
    // Primero borramos las calificaciones asociadas para evitar errores de llave foránea
    await prisma.rating.deleteMany({ where: { standId: id } });
    
    // Luego borramos el stand
    await prisma.user.delete({ where: { id } });
    
    revalidatePath("/master");
    return { success: true, message: "Stand eliminado correctamente." };
  } catch (error) {
    console.error("Error al eliminar stand:", error);
    return { success: false, message: "Error al eliminar el stand." };
  }
}