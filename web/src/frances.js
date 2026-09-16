// Frances: "au kg" pero "a la gelule" (femenino), y "d'acide" pero "de creatine" (elision
// delante de vocal o h muda). Dos reglas que ninguna plantilla puede ignorar sin que la
// frase delate que la escribio un programa.
export const auFr = (u) => (/^g[ée]lule/.test(u) ? `à la ${u}` : `au ${u}`);
export const deFr = (x) => (/^[aeiouyéèêàâîôûœh]/i.test(String(x).trim()) && !/^HMB\b/.test(x)
  ? `d’${x}` : `de ${x}`);
