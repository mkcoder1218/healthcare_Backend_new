import path from "path";
import { createdModels } from "../../model/db";

const ModelClass = createdModels["File"];

export class FileService {
  async fileSave(file: any) {
      const relativePath = path.join('uploads', file.filename);
    const newFile = ModelClass.create({
      path: relativePath,
    });

    return newFile;
  }
}
