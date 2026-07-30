"use server";

import { prisma } from "@/lib/prisma";

export async function obtenerEstadisticasCliente(clienteId: string) {
  try {
    const calificaciones = await prisma.rating.findMany({
      where: { clienteId: clienteId },
      include: {
        stand: {
          select: { nombreStand: true } 
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return {
      total: calificaciones.length,
      // AQUÍ ESTÁ LA SOLUCIÓN: Le decimos explícitamente a TypeScript que "c" es de tipo "any"
      historial: calificaciones.map((c: any) => ({
        id: c.id,
        standNombre: c.stand.nombreStand,
        fecha: c.createdAt,
        estrellas: c.estrellas,
        comentario: c.comentario
      }))
    };
  } catch (error) {
    console.error("Error al obtener estadísticas del cliente:", error);
    return { total: 0, historial: [] };
  }
}