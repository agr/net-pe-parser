import { MetadataTables } from "src/Structures.js";

export const ResolutionScope: Array<MetadataTables> = [
    MetadataTables.Module,
    MetadataTables.ModuleRef,
    MetadataTables.AssemblyRef,
    MetadataTables.TypeRef,
];

export const TypeDefOrRef: Array<MetadataTables> = [
    MetadataTables.TypeDef,
    MetadataTables.TypeRef,
    MetadataTables.TypeSpec,
];