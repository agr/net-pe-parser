import { MetadataTables } from "src/Structures.js";

export const TypeDefOrRef: Array<MetadataTables> = [
    MetadataTables.TypeDef,
    MetadataTables.TypeRef,
    MetadataTables.TypeSpec,
];

export const HasConstant: Array<MetadataTables> = [
    MetadataTables.Field,
    MetadataTables.Param,
    MetadataTables.Property,
];

export const HasCustomAttribute: Array<MetadataTables> = [
    MetadataTables.MethodDef,
    MetadataTables.Field,
    MetadataTables.TypeRef,
    MetadataTables.TypeDef,
    MetadataTables.Param,
    MetadataTables.InterfaceImpl,
    MetadataTables.MemberRef,
    MetadataTables.Module,
    MetadataTables.Permission,
    MetadataTables.Property,
    MetadataTables.Event,
    MetadataTables.StandAloneSig,
    MetadataTables.ModuleRef,
    MetadataTables.TypeSpec,
    MetadataTables.Assembly,
    MetadataTables.AssemblyRef,
    MetadataTables.File,
    MetadataTables.ExportedType,
    MetadataTables.ManifestResource,
    MetadataTables.GenericParam,
    MetadataTables.GenericParamConstraint,
    MetadataTables.MethodSpec,
];

export const HasFieldMarshall: Array<MetadataTables> = [
    MetadataTables.Field,
    MetadataTables.Param,
];

export const HasDeclSecurity: Array<MetadataTables> = [
    MetadataTables.TypeDef,
    MetadataTables.MethodDef,
    MetadataTables.Assembly,
];

export const MemberRefParent: Array<MetadataTables> = [
    MetadataTables.TypeDef,
    MetadataTables.TypeRef,
    MetadataTables.ModuleRef,
    MetadataTables.MethodDef,
    MetadataTables.TypeSpec,
];

export const HasSemantics: Array<MetadataTables> = [
    MetadataTables.Event,
    MetadataTables.Property,
];

export const MethodDefOrRef: Array<MetadataTables> = [
    MetadataTables.MethodDef,
    MetadataTables.MemberRef,
];

export const MemberForwarded: Array<MetadataTables> = [
    MetadataTables.Field,
    MetadataTables.MethodDef,
];

export const Implementation: Array<MetadataTables> = [
    MetadataTables.File,
    MetadataTables.AssemblyRef,
    MetadataTables.ExportedType,
];

export const CustomAttributeType: Array<MetadataTables> = [
    MetadataTables.NotUsed,
    MetadataTables.NotUsed,
    MetadataTables.MethodDef,
    MetadataTables.MemberRef,
    MetadataTables.NotUsed,
];

export const ResolutionScope: Array<MetadataTables> = [
    MetadataTables.Module,
    MetadataTables.ModuleRef,
    MetadataTables.AssemblyRef,
    MetadataTables.TypeRef,
];

export const TypeOrMethodDef: Array<MetadataTables> = [
    MetadataTables.TypeDef,
    MetadataTables.MethodDef,
];