// Mezcla clases condicionales sin pelearse con strings — evita
// repetir `clsx`+`tailwind-merge` como dependencias extra para algo
// que se puede resolver con una función de 3 líneas en este proyecto.
export function cn(...clases: Array<string | false | null | undefined>): string {
  return clases.filter(Boolean).join(' ');
}
