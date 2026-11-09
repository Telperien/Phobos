using System.Text.RegularExpressions;
using Phobos.Application;

namespace Phobos.Infrastructure.Media;

/// <summary>
/// Reads exposure images from a folder. Keys are lowercase relative paths such as
/// <c>arachnophobia/1-a.webp</c>; anything else is refused, so a key can never leave the folder.
/// </summary>
public sealed partial class LocalDiskMediaStore(string rootPath) : IMediaStore
{
    private static readonly Dictionary<string, string> ContentTypes = new()
    {
        [".webp"] = "image/webp",
        [".avif"] = "image/avif",
        [".jpg"] = "image/jpeg",
        [".jpeg"] = "image/jpeg",
        [".png"] = "image/png",
    };

    private readonly string _root = Path.GetFullPath(rootPath);

    public Task<MediaFile?> OpenReadAsync(string key, CancellationToken cancellationToken)
    {
        if (!KeyShape().IsMatch(key)) return Task.FromResult<MediaFile?>(null);
        if (!ContentTypes.TryGetValue(Path.GetExtension(key), out var contentType)) return Task.FromResult<MediaFile?>(null);

        var path = Path.Combine(_root, key);
        if (!File.Exists(path)) return Task.FromResult<MediaFile?>(null);

        Stream content = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read, 4096, useAsync: true);
        return Task.FromResult<MediaFile?>(new MediaFile(content, contentType));
    }

    /// <summary>Lowercase segments separated by '/', no "." or ".." segment, no drive or leading slash.</summary>
    [GeneratedRegex("^[a-z0-9][a-z0-9_-]*(/[a-z0-9][a-z0-9_-]*)*\\.[a-z0-9]+$")]
    private static partial Regex KeyShape();
}
