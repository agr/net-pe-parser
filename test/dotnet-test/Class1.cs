namespace dotnet_test;

public class Class1
{
    public string TestFn(int arg1, string arg2)
    {
        arg1 = arg2.Length;
        arg2.Substring(2);
        return arg2 + arg1;
    }
}
