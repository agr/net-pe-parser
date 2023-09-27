namespace dotnet_test;

public class MultiInterface : ISomeInterface, ISomeOtherInterface
{
    public string SomeProperty => throw new NotImplementedException();

    void ISomeInterface.SomeMethod()
    {
        Console.WriteLine("ISomeInterface.SomeMethod");
    }

    void ISomeOtherInterface.SomeMethod()
    {
        Console.WriteLine("ISomeOtherInterface.SomeMethod");
    }
}