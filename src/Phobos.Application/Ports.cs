using Phobos.Domain;

namespace Phobos.Application;

/// <summary>Where phobia case files are stored.</summary>
public interface IPhobiaCatalogue
{
    Task<IReadOnlyList<Phobia>> ListAsync(CancellationToken cancellationToken);
    Task<Phobia?> FindBySlugAsync(string slug, CancellationToken cancellationToken);
}

/// <summary>Source of randomness, replaceable in tests.</summary>
public interface IRandomIndex
{
    /// <summary>Returns an index between 0 (included) and <paramref name="count"/> (excluded).</summary>
    int IndexBelow(int count);
}

/// <summary>An image file ready to be streamed.</summary>
public sealed record MediaFile(Stream Content, string ContentType);

/// <summary>Where exposure images are kept (local disk in development, blob storage in production).</summary>
public interface IMediaStore
{
    /// <summary>Opens the file for <paramref name="key"/>, or returns null when it is missing or not allowed.</summary>
    Task<MediaFile?> OpenReadAsync(string key, CancellationToken cancellationToken);
}
