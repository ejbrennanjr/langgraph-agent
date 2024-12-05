import { z } from "zod";

export enum FilePathType {
  Unresolved = "unresolved",
}
export const FilePathTypeSchema = z.nativeEnum(FilePathType);
