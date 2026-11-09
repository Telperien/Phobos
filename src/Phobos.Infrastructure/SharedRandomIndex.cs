using Phobos.Application;

namespace Phobos.Infrastructure;

public sealed class SharedRandomIndex : IRandomIndex
{
    public int IndexBelow(int count) => Random.Shared.Next(count);
}
