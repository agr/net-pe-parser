namespace dotnet_test;

public class Generic<GenericParam1> where GenericParam1: ISomeInterface
{
    private GenericParam1 value;

    public Generic(GenericParam1 value)
    {
        this.value = value;
    }

    public void Func<GenericParam2>(IDictionary<GenericParam2, GenericParam1> n)
    {
    }
}