namespace dotnet_test;

public class Class2
{
    public void AnotherFn(int arg1)
    {
    }

    public class NestedClass : ISomeInterface {
        public string SomeProperty => throw new NotImplementedException();

        public object NestedClassMethod(object someObject) {
            return new object();
        }

        public void SomeMethod()
        {
            throw new NotImplementedException();
        }
    }
}
