"use server";

import { prisma } from "@/lib/prisma";

// 1. Obtener todas las calificaciones que ha recibido un Stand específico
export async function obtenerDetallesStandMaster(standId: string) {
  try {
    const calificaciones = await prisma.rating.findMany({
      where: { standId: standId },
      include: {
        cliente: {
          select: { nombres: true, apellidos: true, institucion: true, username: true } // El Master SÍ puede ver el documento (username)
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return calificaciones;
  } catch (error) {
    console.error(error);
    return [];
  }
}

// 2. Obtener todas las calificaciones que ha dado un Visitante (Cliente) específico
export async function obtenerDetallesClienteMaster(clienteId: string) {
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
    return calificaciones;
  } catch (error) {
    console.error(error);
    return [];
  }
}