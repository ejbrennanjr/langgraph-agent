export enum ImportPathType {
  AbsolutePath = "AbsolutePath", // Absolute imports starting from the project root
  AliasPath = "AliasPath", // Imports using tsconfig aliases like '@/components/Button'
  NodeBuiltInModule = "NodeBuiltInModule", // Node.js built-in modules like 'fs' or 'path'
  NpmModule = "NpmModule", // Imports from node_modules like 'lodash' or 'react'
  RelativePath = "RelativePath", // Imports like './utils/helper' or '../components/Button'
}
