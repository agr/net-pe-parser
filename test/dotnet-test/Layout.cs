using System.Runtime.InteropServices;

namespace dotnet_test;

[StructLayout(LayoutKind.Explicit, Size = 4)]
public class ExplicitLayout {
    [FieldOffset(0)]public ushort Prop1;
    [FieldOffset(2)]public byte Prop2;
}