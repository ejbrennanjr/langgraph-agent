import { getSourceFile } from "@/libs/typescript-graph/mappers/utils/getSourceFile";
import { Project, SourceFile } from "ts-morph";

jest.mock("ts-morph", () => ({
  Project: jest.fn().mockImplementation(() => ({
    getSourceFile: jest.fn(),
    addSourceFileAtPath: jest.fn(),
  })),
}));

describe("getSourceFile", () => {
  let project: Project;
  const mockFilePath = "/path/to/file.ts";

  beforeEach(() => {
    project = new Project();
    (project.getSourceFile as jest.Mock).mockReset();
    (project.addSourceFileAtPath as jest.Mock).mockReset();
  });

  it("should return the source file if it exists in the project", () => {
    const mockSourceFile = {} as SourceFile;
    (project.getSourceFile as jest.Mock).mockReturnValue(mockSourceFile);

    const result = getSourceFile(project, mockFilePath);

    expect(project.getSourceFile).toHaveBeenCalledWith(mockFilePath);
    expect(project.addSourceFileAtPath).not.toHaveBeenCalled();
    expect(result).toBe(mockSourceFile);
  });

  it("should add and return the source file if it does not exist in the project", () => {
    const mockSourceFile = {} as SourceFile;
    (project.getSourceFile as jest.Mock).mockReturnValue(null);
    (project.addSourceFileAtPath as jest.Mock).mockReturnValue(mockSourceFile);

    const result = getSourceFile(project, mockFilePath);

    expect(project.getSourceFile).toHaveBeenCalledWith(mockFilePath);
    expect(project.addSourceFileAtPath).toHaveBeenCalledWith(mockFilePath);
    expect(result).toBe(mockSourceFile);
  });

  it("should throw an error if the source file cannot be processed", () => {
    const mockError = new Error("File not found");
    (project.getSourceFile as jest.Mock).mockReturnValue(null);
    (project.addSourceFileAtPath as jest.Mock).mockImplementation(() => {
      throw mockError;
    });

    expect(() => getSourceFile(project, mockFilePath)).toThrowError(
      `Failed to process source file: ${mockFilePath}. ${mockError.message}`
    );

    expect(project.getSourceFile).toHaveBeenCalledWith(mockFilePath);
    expect(project.addSourceFileAtPath).toHaveBeenCalledWith(mockFilePath);
  });
});
