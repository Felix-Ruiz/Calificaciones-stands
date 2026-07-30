"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function obtenerAjustes() {
  try {
    let ajustes = await prisma.settings.findUnique({ where: { id: "global" } });
    if (!ajustes) {
      ajustes = await prisma.settings.create({
        data: { id: "global", requiredStandsForLottery: 5, activarEstrellas: true }
      });
    }
    return ajustes;
  } catch (error) {
    return { requiredStandsForLottery: 5, activarEstrellas: true };
  }
}

export async function guardarAjustes(requiredStandsForLottery: number, activarEstrellas: boolean) {
  try {
    await prisma.settings.upsert({
      where: { id: "global" },
      update: { requiredStandsForLottery, activarEstrellas },
      create: { id: "global", requiredStandsForLottery, activarEstrellas }
    });
    revalidatePath("/master");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al guardar los ajustes" };
  }
}

export async function obtenerParticipantesSorteo(requiredStands: number) {
  try {
    const clientes = await prisma.user.findMany({
      where: { role: "CLIENTE" },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        username: true,
        institucion: true,
        _count: { select: { calificacionesDadas: true } }
      }
    });
    // Filtramos los que cumplen el requisito de stands mínimos
    return clientes.filter((c: any) => c._count.calificacionesDadas >= requiredStands);
  } catch (error) {
    return [];
  }
}

export async function registrarGanador(clienteId: string, detalles: string) {
  try {
    await prisma.lotteryWinner.create({
      data: { clienteId, detalles }
    });
    revalidatePath("/master");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al registrar ganador" };
  }
}

export async function obtenerHistorialGanadores() {
  try {
    return await prisma.lotteryWinner.findMany({
      include: {
        cliente: {
          select: {
            id: true, nombres: true, apellidos: true, username: true, institucion: true, cargo: true, telefono: true, correo: true,
            _count: { select: { calificacionesDadas: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  } catch (error) {
    return [];
  }
}

// NUEVA FUNCIÓN: ELIMINAR GANADOR DEL HISTORIAL
export async function eliminarGanadorHistorial(id: string) {
  try {
    await prisma.lotteryWinner.delete({ where: { id } });
    revalidatePath("/master");
    return { success: true, message: "Premio eliminado del historial." };
  } catch (error) {
    return { success: false, message: "Error al eliminar el ganador del historial." };
  }
}