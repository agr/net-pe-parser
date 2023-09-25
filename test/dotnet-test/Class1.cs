namespace dotnet_test;

public class Class1
{
    const int Constant1 = 42;
    const string StringConst = "foobar";
    const Class1 ClassConst = null;

    public event EventHandler? OnEvent;

    public string TestFn(int arg1, string arg2)
    {
        arg1 = arg2.Length;
        arg2.Substring(2);
        if (OnEvent is not null) {
            OnEvent(this, new EventArgs());
        }
        return arg2 + arg1;
    }
}
