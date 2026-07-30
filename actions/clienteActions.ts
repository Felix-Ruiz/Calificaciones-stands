"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function cargarClientesMasivos(clientesData: any[]) {
  try {
    const nuevosClientes = clientesData.map((cliente: any) => {
      
      // Extraemos el teléfono probando todas las combinaciones posibles, incluyendo "TELÉFONO MÓVIL"
      const t = cliente.telefono || cliente.Telefono || cliente.TELEFONO || cliente.Teléfono || cliente.TELÉFONO || cliente.Celular || cliente.CELULAR || cliente["TELÉFONO MÓVIL"] || cliente["TELEFONO MOVIL"] || cliente["Teléfono móvil"] || cliente["Telefono movil"];

      // Extraemos el correo probando todas las combinaciones posibles, incluyendo "CORREO ELECTRÓNICO"
      const c = cliente.correo || cliente.Correo || cliente.CORREO || cliente.Email || cliente.email || cliente.EMAIL || cliente["CORREO ELECTRÓNICO"] || cliente["CORREO ELECTRONICO"] || cliente["Correo electrónico"] || cliente["Correo electronico"];

      return {
        role: "CLIENTE" as const,
        username: String(cliente.username || cliente.Documento || cliente.DOCUMENTO || Math.floor(Math.random() * 100000000)),
        password: String(cliente.password || cliente.Documento || cliente.DOCUMENTO || "123456"),
        
        nombres: cliente.nombres || cliente.Nombres || cliente.NOMBRES || cliente.nombre || cliente.Nombre || cliente.NOMBRE || "",
        
        apellidos: cliente.apellidos || cliente.Apellidos || cliente.APELLIDOS || cliente.apellido || cliente.Apellido || cliente.APELLIDO || "",
        
        institucion: cliente.institucion || cliente.Institución || cliente.INSTITUCIÓN || cliente.INSTITUCION || null,
        
        cargo: cliente.cargo || cliente.Cargo || cliente.CARGO || cliente["CARGO EN LA INSTITUCIÓN"] || cliente["CARGO EN LA INSTITUCION"] || cliente["Cargo en la institución"] || null,
        
        telefono: t ? String(t) : null,
        
        correo: c || null,
      };
    });

    await prisma.user.createMany({ 
      data: nuevosClientes, 
      skipDuplicates: true 
    });
    
    revalidatePath("/master");
    return { success: true, message: `${nuevosClientes.length} visitantes cargados exitosamente.` };
  } catch (error) { 
    return { success: false, message: "Error al cargar visitantes desde el Excel." }; 
  }
}

export async function obtenerClientes() {
  try {
    return await prisma.user.findMany({
      where: { role: "CLIENTE" },
      select: {
        id: true, 
        nombres: true, 
        apellidos: true, 
        username: true,
        institucion: true, 
        cargo: true,
        telefono: true,
        correo: true,
        _count: { select: { calificacionesDadas: true } }
      },
      orderBy: { createdAt: "desc" }
    });
  } catch (error) { 
    return []; 
  }
}

export async function actualizarCliente(id: string, data: any) {
  try {
    await prisma.user.update({
      where: { id },
      data: {
        nombres: data.nombres,
        apellidos: data.apellidos,
        username: data.username,
        institucion: data.institucion,
        cargo: data.cargo,
        telefono: data.telefono,
        correo: data.correo
      }
    });
    revalidatePath("/master");
    return { success: true, message: "Visitante actualizado correctamente." };
  } catch (error) { 
    return { success: false, message: "Error al actualizar el visitante." }; 
  }
}

export async function eliminarCliente(id: string) {
  try {
    await prisma.rating.deleteMany({ where: { clienteId: id } });
    await prisma.lotteryWinner.deleteMany({ where: { clienteId: id } });
    await prisma.user.delete({ where: { id } });
    
    revalidatePath("/master");
    return { success: true, message: "Visitante eliminado correctamente." };
  } catch (error) { 
    return { success: false, message: "Error al eliminar el visitante." }; 
  }
}

// ELIMINAR TODOS LOS CLIENTES
export async function eliminarTodosClientes() {
  try {
    const clientes = await prisma.user.findMany({ where: { role: "CLIENTE" }, select: { id: true } });
    
    const clienteIds = clientes.map((c: any) => c.id);

    await prisma.rating.deleteMany({ where: { clienteId: { in: clienteIds } } });
    await prisma.lotteryWinner.deleteMany({ where: { clienteId: { in: clienteIds } } });
    
    await prisma.user.deleteMany({ where: { role: "CLIENTE" } });
    
    revalidatePath("/master");
    return { success: true, message: "¡Todos los visitantes han sido eliminados!" };
  } catch (error) {
    return { success: false, message: "Error al eliminar los visitantes masivamente." };
  }
}