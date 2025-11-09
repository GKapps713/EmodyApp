// src/features/compose/lib/logging.ts
export const DEBUG = true;

export const makeTimer = () => {
  const t0 = Date.now();
  return (label: string) => {
    const ms = Date.now() - t0;
    DEBUG && console.log(`⏱️ ${label} +${ms}ms`);
  };
};

export const log = (phase: string, message: string, extra?: any) => {
  if (!DEBUG) return;
  if (extra !== undefined) {
    console.log(`🔹 [${phase}] ${message}`, extra);
  } else {
    console.log(`🔹 [${phase}] ${message}`);
  }
};
