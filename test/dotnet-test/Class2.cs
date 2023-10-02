using System.Runtime.InteropServices;

namespace dotnet_test;

public class Class2
{
    public static int StaticIntProperty { get; set; } = 42;
    public string StringProperty { get; set; } = "Foobar";

    public void AnotherFn(int arg1)
    {
        var layout = new ExplicitLayout();
        layout.Prop1 = 21;
        var g = new Generic<string>("foo");
        g.Func(new Dictionary<int, string>());
    }

    public class NestedClass : ISomeInterface {
        public string SomeProperty => throw new NotImplementedException();

        public object NestedClassMethod(object someObject)
        {
            return new object();
        }

        public void SomeMethod()
        {
            throw new NotImplementedException();
        }
    }
}
