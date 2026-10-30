// Compartido entre la publicación de clases (código de 6) y el alta
// de alumnos (código de 8) — mismo alfabeto sin 0/O/1/I para que no
// se confundan al escribirlos a mano o dictarlos en voz alta.
const ALFABETO_SIN_AMBIGUOS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generarCodigoAcceso(longitud = 6): string {
  return Array.from({ length: longitud }, () => ALFABETO_SIN_AMBIGUOS[Math.floor(Math.random() * ALFABETO_SIN_AMBIGUOS.length)]).join('');
}
