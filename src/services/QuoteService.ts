/**
 * QuoteService para Cortex Hub OS
 * Proporciona sabiduría académica y motivación diaria de Corty.
 */

const CORTY_QUOTES = [
  "El éxito es la suma de pequeños esfuerzos repetidos día tras día.",
  "Tu cerebro es un músculo; cada tarea es una repetición hacia la grandeza.",
  "No estudies para aprobar, estudia para liderar el futuro.",
  "El orden en tu Hub es el orden en tu mente. ¡Vamos por ese 5.0!",
  "Cada bloque de estudio te acerca un paso más a tu título profesional.",
  "La disciplina es el puente entre tus metas y tus logros.",
  "Cortex está sincronizado. Tu potencial también lo está.",
  "En el Búnker Offline, tu conocimiento es la única moneda que importa.",
  "No te detengas cuando estés cansado, detente cuando hayas terminado.",
  "La excelencia no es un acto, sino un hábito. Cultívalo hoy.",
  "Tu promedio es un reflejo de tu persistencia, no solo de tu inteligencia.",
  "El Oracle AI ha analizado tu camino: el éxito es inevitable si mantienes el foco.",
  "Organiza tu tiempo en Cronos y verás cómo el estrés desaparece.",
  "Un mar en calma nunca hizo a un marinero experto. ¡Afronta ese reto!",
  "Tu carrera es una maratón, no un sprint. Respira y avanza.",
  "El conocimiento es la mejor inversión que puedes hacer en ti mismo.",
  "Deja que el ruido del mundo desaparezca y entra en el Focus Mode.",
  "Cada nota que tomas es un ladrillo en la fortaleza de tu conocimiento.",
  "No busques el momento perfecto, toma el momento y hazlo perfecto.",
  "La curiosidad es el motor del aprendizaje. Sigue preguntando.",
  "Cortex Hub detecta alta energía académica. ¡Aprovéchala!",
  "Tus metas de semestre están grabadas en el core del sistema. ¡Cúmplelas!",
  "El fracaso es solo la oportunidad de comenzar de nuevo de forma más inteligente.",
  "Cree en ti mismo tanto como yo creo en tus algoritmos de aprendizaje.",
  "La educación es el arma más poderosa para cambiar el mundo.",
  "Tu futuro yo te agradecerá el esfuerzo que estás haciendo hoy.",
  "Enfócate en el progreso, no en la perfección.",
  "La mente es como un paracaídas, solo funciona si se abre.",
  "Aprender es descubrir que algo es posible. ¡Hazlo realidad!",
  "Cortex Hub OS: Tu sistema operativo para la excelencia académica.",
  "La motivación es lo que te pone en marcha, el hábito es lo que te mantiene."
];

export const QuoteService = {
  /**
   * Obtiene una frase aleatoria de Corty
   */
  getRandomQuote() {
    const index = Math.floor(Math.random() * CORTY_QUOTES.length);
    return CORTY_QUOTES[index];
  },

  /**
   * Genera el mensaje completo de bienvenida
   */
  getWelcomeMessage() {
    const quote = this.getRandomQuote();
    return `¡Hola! Aquí estoy. Te recuerdo que: "${quote}" (Puedes desactivarme en Ajustes si lo deseas).`;
  },

  /**
   * Verifica si debe mostrar la frase según el tiempo (mínimo 8 horas)
   */
  shouldShowQuote(lastDateISO: string | undefined) {
    if (!lastDateISO) return true;
    const lastDate = new Date(lastDateISO);
    const now = new Date();
    const diffMs = now.getTime() - lastDate.getTime();
    const diffHours = diffMs / 3600000;
    return diffHours >= 8;
  }
};
