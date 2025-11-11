
import { GoogleGenAI, Type } from "@google/genai";
import { DeliveryNoteItem } from "../types";

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        if (typeof reader.result === 'string') {
            resolve(reader.result.split(',')[1]);
        }
    };
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const parseDeliveryNoteImage = async (imageFile: File): Promise<DeliveryNoteItem[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const imagePart = await fileToGenerativePart(imageFile);
  const textPart = {
    text: `Extrae los items de esta nota de entrega. Devuelve un JSON array donde cada objeto tiene "codigo", "producto", y "cantidad". Asegúrate que "cantidad" sea un número. Ignora las filas vacías. Si no puedes determinar un valor, usa null. El JSON debe ser válido.`,
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [imagePart, textPart] },
     config: {
       responseMimeType: "application/json",
       responseSchema: {
         type: Type.ARRAY,
         items: {
           type: Type.OBJECT,
           properties: {
             codigo: {
               type: Type.STRING,
               description: 'El código o SKU del producto.',
             },
             producto: {
               type: Type.STRING,
               description: 'La descripción del producto.',
             },
             cantidad: {
               type: Type.NUMBER,
               description: 'La cantidad del producto.',
             },
           },
           required: ["codigo", "producto", "cantidad"],
         },
       },
     },
  });

  try {
    const jsonString = response.text.trim();
    const parsedData = JSON.parse(jsonString);
    if (Array.isArray(parsedData)) {
      return parsedData.filter(
        (item): item is DeliveryNoteItem =>
          item &&
          typeof item.codigo === 'string' &&
          typeof item.producto === 'string' &&
          typeof item.cantidad === 'number'
      );
    }
    return [];
  } catch (error) {
    console.error("Error parsing JSON from Gemini:", error);
    throw new Error("La respuesta de la IA no es un JSON válido.");
  }
};

export const generateProviderMessage = async (providerName: string): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Actúa como el gerente de comunicaciones de la empresa "${providerName}". Genera un mensaje corto, profesional y amigable para añadir al final de una nota de entrega. El mensaje puede ser un agradecimiento por la confianza, un aviso de nuevos productos o una promoción especial. Sé creativo y conciso. El mensaje no debe exceder las 3 líneas.`,
    });

    return response.text.trim();
};

export const generateTransactionReason = async (
    productName: string,
    transactionType: 'entry' | 'exit',
    quantity: number
): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const typeText = transactionType === 'entry' ? 'ingreso' : 'egreso';

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Genera un motivo conciso y profesional para una transacción de inventario. Producto: "${productName}", Tipo de transacción: ${typeText}, Cantidad: ${quantity}. Ejemplos: "Ajuste de inventario por conteo físico.", "Recepción de proveedor.", "Merma por producto dañado.", "Venta a cliente final." Sé breve y descriptivo.`,
    });

    return response.text.trim();
};
