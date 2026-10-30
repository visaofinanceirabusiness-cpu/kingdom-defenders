// Documento PDF de una clase — texto real generado del lado del
// servidor (no una captura de pantalla), para que el docente pueda
// descargarlo e imprimirlo o mandarlo por WhatsApp/email. Incluye el
// contenido de estudio (introducción, temas, evaluación); las
// actividades interactivas se listan por título (jugarlas tiene
// sentido en la app, no en un papel), salvo Trivia/Verdadero-Falso/
// Completar que si van con su contenido porque funcionan como guía
// de estudio o cuestionario impreso.
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { GAME_DEFINITIONS, isValidGameType } from '@/lib/games/registry';

// 'Helvetica' es una de las 14 fuentes estándar de PDF, ya incluida
// en @react-pdf/renderer — no hace falta Font.register para usarla.
const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica', color: '#1f2937' },
  title: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  meta: { fontSize: 10, color: '#6b7280', marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: 700, marginTop: 18, marginBottom: 6, color: '#4338ca' },
  temaTitle: { fontSize: 12, fontWeight: 700, marginTop: 12, marginBottom: 4 },
  label: { fontSize: 9, fontWeight: 700, color: '#6b7280', marginTop: 6, marginBottom: 2 },
  paragraph: { fontSize: 10.5, lineHeight: 1.5, marginBottom: 2 },
  activityBox: { marginTop: 8, padding: 8, backgroundColor: '#f9fafb', borderRadius: 4 },
  activityTitle: { fontSize: 11, fontWeight: 700, marginBottom: 4 },
  question: { fontSize: 10, fontWeight: 700, marginTop: 6 },
  option: { fontSize: 9.5, marginLeft: 10 },
  correct: { fontSize: 9, color: '#059669', marginTop: 2 },
  image: { maxWidth: 260, maxHeight: 180, marginTop: 6, marginBottom: 6, objectFit: 'contain' },
  imageSmall: { maxWidth: 160, maxHeight: 110, marginTop: 4, marginBottom: 4, objectFit: 'contain' },
  footer: { position: 'absolute', bottom: 20, left: 40, right: 40, fontSize: 8, color: '#9ca3af', textAlign: 'center' },
});

type Seccion = { section_type: string; title: string; content: unknown; position: number };
type Actividad = { title: string; game_template_id: string; config: unknown; lesson_section_id: string | null };

export function ClasePdf({
  lesson,
  secciones,
  actividades,
  imagenes,
}: {
  lesson: { title: string; subject: string | null; topic: string | null; school_year: string | null };
  secciones: Seccion[];
  actividades: Actividad[];
  imagenes: Record<string, string>;
}) {
  const ordenadas = [...secciones].sort((a, b) => a.position - b.position);
  const introduccion = ordenadas.find((s) => s.section_type === 'introduction');
  const temas = ordenadas.filter((s) => s.section_type === 'tema');
  const evaluacion = ordenadas.find((s) => s.section_type === 'evaluation');

  // Solo se renderiza si ya se descargó y convirtió a data URI de
  // antemano (ver lib/pdf/imagenes.ts) — nunca se le pasa una URL
  // remota directo al <Image>, así el layout del PDF es síncrono.
  function resuelta(url: string | undefined): string | undefined {
    return url ? imagenes[url] : undefined;
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{lesson.title}</Text>
        <Text style={styles.meta}>
          {[lesson.subject, lesson.topic, lesson.school_year].filter(Boolean).join(' · ') || 'AulaPlay'}
        </Text>

        {introduccion &&
          (() => {
            const contenido = introduccion.content as { text?: string; image_url?: string } | null;
            const img = resuelta(contenido?.image_url);
            return (
              <View>
                <Text style={styles.sectionTitle}>Introducción</Text>
                {img && <Image src={img} style={styles.image} />}
                <Text style={styles.paragraph}>{contenido?.text ?? ''}</Text>
              </View>
            );
          })()}

        {temas.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Temas</Text>
            {temas.map((tema, i) => {
              const contenido = tema.content as { theory?: string; examples?: string; image_url?: string } | null;
              const img = resuelta(contenido?.image_url);
              return (
                <View key={i}>
                  <Text style={styles.temaTitle}>{tema.title}</Text>
                  {img && <Image src={img} style={styles.image} />}
                  <Text style={styles.label}>TEORÍA</Text>
                  <Text style={styles.paragraph}>{contenido?.theory ?? ''}</Text>
                  <Text style={styles.label}>EJEMPLOS</Text>
                  <Text style={styles.paragraph}>{contenido?.examples ?? ''}</Text>
                </View>
              );
            })}
          </View>
        )}

        {evaluacion && (
          <View>
            <Text style={styles.sectionTitle}>Evaluación</Text>
            <Text style={styles.paragraph}>{(evaluacion.content as { text?: string } | null)?.text ?? ''}</Text>
          </View>
        )}

        {actividades.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Actividades</Text>
            {actividades.map((actividad, i) => (
              <ActividadImpresa key={i} actividad={actividad} resuelta={resuelta} />
            ))}
          </View>
        )}

        <Text style={styles.footer} render={({ pageNumber, totalPages }) => `AulaPlay — página ${pageNumber} de ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}

function ActividadImpresa({ actividad, resuelta }: { actividad: Actividad; resuelta: (url: string | undefined) => string | undefined }) {
  const definicion = isValidGameType(actividad.game_template_id) ? GAME_DEFINITIONS[actividad.game_template_id] : null;
  const label = definicion?.label ?? actividad.game_template_id;

  if (actividad.game_template_id === 'trivia') {
    const config = actividad.config as {
      questions?: { question: string; options: string[]; correct_answer: string; image_url?: string }[];
    };
    return (
      <View style={styles.activityBox} wrap={false}>
        <Text style={styles.activityTitle}>
          {label} — {actividad.title}
        </Text>
        {(config.questions ?? []).map((q, i) => {
          const img = resuelta(q.image_url);
          return (
          <View key={i}>
            <Text style={styles.question}>
              {i + 1}. {q.question}
            </Text>
            {img && <Image src={img} style={styles.imageSmall} />}
            {q.options.map((o, j) => (
              <Text key={j} style={styles.option}>
                {o === q.correct_answer ? '[correcta] ' : '- '}
                {o}
              </Text>
            ))}
          </View>
          );
        })}
      </View>
    );
  }

  if (actividad.game_template_id === 'true_or_false') {
    const config = actividad.config as { statements?: { statement: string; is_true: boolean; image_url?: string }[] };
    return (
      <View style={styles.activityBox} wrap={false}>
        <Text style={styles.activityTitle}>
          {label} — {actividad.title}
        </Text>
        {(config.statements ?? []).map((s, i) => {
          const img = resuelta(s.image_url);
          return (
            <View key={i}>
              <Text style={styles.question}>
                {i + 1}. {s.statement} — <Text style={styles.correct}>{s.is_true ? 'Verdadero' : 'Falso'}</Text>
              </Text>
              {img && <Image src={img} style={styles.imageSmall} />}
            </View>
          );
        })}
      </View>
    );
  }

  if (actividad.game_template_id === 'fill_in_the_blank') {
    const config = actividad.config as { items?: { text_with_blank: string; correct_answer: string; image_url?: string }[] };
    return (
      <View style={styles.activityBox} wrap={false}>
        <Text style={styles.activityTitle}>
          {label} — {actividad.title}
        </Text>
        {(config.items ?? []).map((it, i) => {
          const img = resuelta(it.image_url);
          return (
            <View key={i}>
              <Text style={styles.question}>
                {i + 1}. {it.text_with_blank.replace('___', `[${it.correct_answer}]`)}
              </Text>
              {img && <Image src={img} style={styles.imageSmall} />}
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.activityBox} wrap={false}>
      <Text style={styles.activityTitle}>
        {label} — {actividad.title}
      </Text>
      <Text style={styles.paragraph}>(Esta actividad se juega interactivamente en la app.)</Text>
    </View>
  );
}
