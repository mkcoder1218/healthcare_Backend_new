import { createdModels } from "../../model/db";

const ModelClass = createdModels["File"];

export class FileService {
  async fileSave(file: any, body?: any) {
    const url = `/uploads/${file.filename}`;
    const newFile = await ModelClass.create({
      url: url,
      description: body?.description || null,
      type: body?.type || null,
    });

    return newFile;
  }
}
