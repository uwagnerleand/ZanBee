/**
 * Redimensiona e comprime imagens diretamente no navegador usando HTML5 Canvas.
 * Otimiza fotos pesadas de celulares (5MB a 15MB) para imagens leves (~40KB a 80KB),
 * prontas para serem gravadas diretamente no Firestore Database.
 */
export async function compressImage(
  dataUrlOrFile: string | File,
  maxWidth = 850,
  maxHeight = 850,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve) => {
    // Se não for base64 nem arquivo (ex: URL normal http ou path relativo ./images/...), retorna direto
    if (typeof dataUrlOrFile === "string" && !dataUrlOrFile.startsWith("data:image/")) {
      resolve(dataUrlOrFile);
      return;
    }

    let resolved = false;
    let objectUrl: string | null = null;

    const safeResolve = (val: string) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(safetyTimer);
      if (objectUrl) {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {}
      }
      resolve(val);
    };

    // Timeout de segurança: nunca deixa a tela travada carregando por mais de 3 segundos
    const safetyTimer = setTimeout(() => {
      console.warn("Tempo de processamento da imagem excedeu 3s. Usando fallback rápido.");
      if (typeof dataUrlOrFile === "string") {
        safeResolve(dataUrlOrFile);
      } else {
        const reader = new FileReader();
        reader.onload = () => safeResolve((reader.result as string) || "");
        reader.onerror = () => safeResolve("");
        reader.readAsDataURL(dataUrlOrFile);
      }
    }, 3000);

    const img = new Image();

    // Atenção: NUNCA definir crossOrigin para data: ou blob: URLs, pois causa bloqueio no Chrome/Safari
    if (typeof dataUrlOrFile === "string" && dataUrlOrFile.startsWith("http")) {
      img.crossOrigin = "anonymous";
    }

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (!width || !height) {
          safeResolve(typeof dataUrlOrFile === "string" ? dataUrlOrFile : "");
          return;
        }

        // Calcula novas dimensões mantendo a proporção (aspect ratio)
        if (width > maxWidth || height > maxHeight) {
          if (width / maxWidth > height / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          safeResolve(typeof dataUrlOrFile === "string" ? dataUrlOrFile : "");
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Gera JPEG otimizado
        const compressed = canvas.toDataURL("image/jpeg", quality);
        safeResolve(compressed);
      } catch (err) {
        console.warn("Canvas falhou ao processar imagem:", err);
        safeResolve(typeof dataUrlOrFile === "string" ? dataUrlOrFile : "");
      }
    };

    img.onerror = (err) => {
      console.warn("Falha ao carregar imagem para o compressor:", err);
      if (typeof dataUrlOrFile === "string") {
        safeResolve(dataUrlOrFile);
      } else {
        const reader = new FileReader();
        reader.onload = () => safeResolve((reader.result as string) || "");
        reader.onerror = () => safeResolve("");
        reader.readAsDataURL(dataUrlOrFile);
      }
    };

    if (typeof dataUrlOrFile === "string") {
      img.src = dataUrlOrFile;
    } else {
      try {
        objectUrl = URL.createObjectURL(dataUrlOrFile);
        img.src = objectUrl;
      } catch (err) {
        const reader = new FileReader();
        reader.onload = () => {
          img.src = reader.result as string;
        };
        reader.onerror = () => safeResolve("");
        reader.readAsDataURL(dataUrlOrFile);
      }
    }
  });
}
