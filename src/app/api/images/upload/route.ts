import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const;

// Usado por el constructor manual de clases (y, a futuro, por
// cualquier pantalla que necesite que el docente suba una imagen) —
// sube a un bucket público (lesson-images) porque los alumnos sin
// cuenta también tienen que poder verla.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Tu sesión expiró — volvé a iniciar sesión.' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No se recibió ninguna imagen.' }, { status: 400 });
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return NextResponse.json({ error: 'La imagen supera el tamaño máximo permitido (5MB).' }, { status: 400 });
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return NextResponse.json({ error: 'Solo se aceptan imágenes PNG, JPG, WEBP o GIF.' }, { status: 400 });
  }

  const extension = file.name.split('.').pop() ?? 'png';
  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage.from('lesson-images').upload(path, buffer, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: `No se pudo subir la imagen: ${uploadError.message}` }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('lesson-images').getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
