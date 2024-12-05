import { getSourceLocation } from "@/libs/typescript-graph/mappers/utils/getSourceLocation";
import { Node, SourceFile } from "ts-morph";

jest.mock("ts-morph", () => ({
  ...jest.requireActual("ts-morph"),
  Node: {
    ...jest.requireActual("ts-morph").Node,
    isSourceFile: jest.fn(),
  },
}));

describe("getSourceLocation", () => {
  const mockSourceFile = {
    getFilePath: jest.fn(() => "/path/to/file.ts"),
    getStart: jest.fn(() => 0),
    getEnd: jest.fn(() => 100),
    getLineAndColumnAtPos: jest.fn((pos) => ({
      line: Math.floor(pos / 10),
      column: pos % 10,
    })),
  };

  const mockNode = {
    getSourceFile: jest.fn(() => mockSourceFile),
    getStart: jest.fn(() => 10),
    getEnd: jest.fn(() => 50),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (Node.isSourceFile as unknown as jest.Mock).mockReset();
  });

  it("should extract location for a SourceFile", () => {
    (Node.isSourceFile as unknown as jest.Mock).mockReturnValue(true);

    const result = getSourceLocation(mockSourceFile as unknown as SourceFile);

    expect(result).toEqual({
      filePath: "/path/to/file.ts",
      startLine: 0,
      startColumn: 0,
      endLine: 10,
      endColumn: 0,
    });

    expect(mockSourceFile.getFilePath).toHaveBeenCalledTimes(1);
    expect(mockSourceFile.getStart).toHaveBeenCalledTimes(1);
    expect(mockSourceFile.getEnd).toHaveBeenCalledTimes(1);
    expect(mockSourceFile.getLineAndColumnAtPos).toHaveBeenCalledTimes(2);
  });

  it("should extract location for a Node", () => {
    (Node.isSourceFile as unknown as jest.Mock).mockReturnValue(false);

    const result = getSourceLocation(mockNode as unknown as Node);

    expect(result).toEqual({
      filePath: "/path/to/file.ts",
      startLine: 1,
      startColumn: 0,
      endLine: 5,
      endColumn: 0,
    });

    expect(mockNode.getSourceFile).toHaveBeenCalledTimes(1);
    expect(mockNode.getStart).toHaveBeenCalledTimes(1);
    expect(mockNode.getEnd).toHaveBeenCalledTimes(1);
    expect(mockSourceFile.getLineAndColumnAtPos).toHaveBeenCalledTimes(2);
  });
});
