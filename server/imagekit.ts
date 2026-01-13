import ImageKit from "imagekit";

let imagekitInstance: ImageKit | null = null;

export function getImageKit(): ImageKit {
  if (!imagekitInstance) {
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

    if (!publicKey || !privateKey || !urlEndpoint) {
      throw new Error("ImageKit credentials not configured. Please set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT.");
    }

    imagekitInstance = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint,
    });
  }

  return imagekitInstance;
}

export async function uploadToImageKit(
  fileBuffer: Buffer,
  fileName: string,
  folder: string = "/docs"
): Promise<{ url: string; fileId: string }> {
  const imagekit = getImageKit();
  
  const result = await imagekit.upload({
    file: fileBuffer,
    fileName: fileName,
    folder: folder,
    useUniqueFileName: true,
  });

  return {
    url: result.url,
    fileId: result.fileId,
  };
}

export async function deleteFromImageKit(fileId: string): Promise<void> {
  const imagekit = getImageKit();
  await imagekit.deleteFile(fileId);
}
