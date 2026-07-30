"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Función 1: La que ya teníamos para el panel del Stand
export async function obtenerCalificacionesStand(standId: string) {
  try {
    const calificaciones = await prisma.rating.findMany({
      where: { standId: standId },
      include: {
        cliente: {
          select: { 
            nombres: true, 
            apellidos: true, 
            institucion: true, 
            cargo: true, 
            telefono: true, // <-- SOLUCIÓN: Agregamos el teléfono aquí
            correo: true 
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return calificaciones;
  } catch (error) {
    return [];
  }
}

// Función 2: Obtener datos antes de calificar (Verificar si ya calificó)
export async function obtenerInfoEncuesta(standId: string, clienteId: string) {
  try {
    const stand = await prisma.user.findUnique({ where: { id: standId } });
    if (!stand || stand.role !== "STAND") return { error: "Stand no encontrado" };

    const yaCalifico = await prisma.rating.findUnique({
      where: {
        clienteId_standId: { clienteId, standId }
      }
    });

    const settings = await prisma.settings.findUnique({ where: { id: "global" } });

    return {
      standNombre: stand.nombreStand,
      yaCalifico: !!yaCalifico,
      activarEstrellas: settings?.activarEstrellas ?? true
    };
  } catch (error) {
    return { error: "Error al cargar datos" };
  }
}

// Función 3: Guardar la calificación final
export async function enviarCalificacion(clienteId: string, standId: string, comentario: string, estrellas: number | null) {
  try {
    await prisma.rating.create({
      data: { clienteId, standId, comentario, estrellas }
    });
    
    // Refrescamos las rutas para que los contadores se actualicen
    revalidatePath("/cliente");
    revalidatePath("/stand");
    revalidatePath("/master");
    
    return { success: true };
  } catch (error) {
    return { error: "Hubo un error al guardar tu calificación. Intenta nuevamente." };
  }
}