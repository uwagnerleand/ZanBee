/**
 * Redimensiona e comprime imagens diretamente no navegador usando HTML5 Canvas.
 * Permite salvar fotos leves (~40KB a 80KB) diretamente como Base64 no Firestore (Database),
 * sem estourar o limite de 1MB por documento e dispensando o plano pago/Blaze do Firebase Storage.
 */
export async function compressImage(
  dataUrlOrFile: string | File,
  maxWidth = 900,
  maxHeight = 900,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Se não for base64 nem arquivo (ex: URL normal ou path relativo), retorna direto
    if (typeof dataUrlOrFile === "string" && !dataUrlOrFile.startsWith("data:image/")) {
      resolve(dataUrlOrFile);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";

    const process = () => {
      try {
        let { width, height } = img;
        if (!width || !height) {
          resolve(typeof dataUrlOrFile === "string" ? dataUrlOrFile : "");
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
          resolve(typeof dataUrlOrFile === "string" ? dataUrlOrFile : "");
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Tenta WebP primeiro (mais compacto), fallback para JPEG
        let compressed = canvas.toDataURL("image/webp", quality);
        if (!compressed || !compressed.startsWith("data:image/webp")) {
          compressed = canvas.toDataURL("image/jpeg", quality);
        }

        resolve(compressed);
      } catch (err) {
        console.warn("Falha ao comprimir imagem via Canvas, mantendo original:", err);
        resolve(typeof dataUrlOrFile === "string" ? dataUrlOrFile : "");
      }
    };

    img.onload = process;
    img.onerror = () => {
      if (typeof dataUrlOrFile === "string") {
        resolve(dataUrlOrFile);
      } else {
        reject(new Error("Não foi possível carregar a imagem para compressão."));
      }
    };

    if (typeof dataUrlOrFile === "string") {
      img.src = dataUrlOrFile;
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        img.src = reader.result as string;
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(dataUrlOrFile);
    }
  });
}
