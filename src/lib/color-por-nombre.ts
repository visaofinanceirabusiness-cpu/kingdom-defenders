// Color determinístico a partir de un nombre — mismo nombre, mismo
// color siempre, sin coordinar nada entre quien dibuja y quien mira.
// Compartido entre PresenciaClase y los cursores en vivo de la
// pizarra, para que la persona se vea del mismo color en los dos
// lados.
const COLORES = ['#dc2626', '#2563eb', '#16a34a', '#d97706', '#7c3aed', '#db2777'];

export function colorPorNombre(nombre: string): string {
  let hash = 0;
  for (const c of nombre) hash = (hash * 31 + c.charCodeAt(0)) % COLORES.length;
  return COLORES[hash];
}
