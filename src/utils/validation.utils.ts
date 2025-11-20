// Utilidades de validación
// Será implementado según necesidad

export function validateTaskId(taskId: string): boolean {
  return Boolean(taskId && taskId.trim().length > 0);
}

