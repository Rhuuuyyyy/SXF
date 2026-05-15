// Maps frontend symptom string keys to the integer IDs expected by POST /api/v1/avaliacoes.
// IMPORTANT: these IDs must match the sintomas table seed in the database.
// Verify against the DB migration scripts once the database layer is configured.
export const SINTOMA_ID_MAP = {
  deficiencia_intelectual:   1,
  face_alongada_orelhas:     2,
  macroorquidismo:           3,
  hipermobilidade_articular: 4,
  dificuldades_aprendizagem: 5,
  deficit_atencao:           6,
  movimentos_repetitivos:    7,
  atraso_fala:               8,
  hiperatividade:            9,
  evita_contato_visual:      10,
  evita_contato_fisico:      11,
  agressividade:             12,
};
