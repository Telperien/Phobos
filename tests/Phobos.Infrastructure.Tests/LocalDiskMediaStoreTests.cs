using Phobos.Infrastructure.Media;

namespace Phobos.Infrastructure.Tests;

public sealed class LocalDiskMediaStoreTests : IDisposable
{
    private readonly string _sandbox = Path.Combine(Path.GetTempPath(), "phobos-media-" + Guid.NewGuid().ToString("N"));
    private readonly LocalDiskMediaStore _store;

    public LocalDiskMediaStoreTests()
    {
        var root = Path.Combine(_sandbox, "root");
        Directory.CreateDirectory(Path.Combine(root, "arachnophobia"));
        File.WriteAllText(Path.Combine(root, "arachnophobia", "1-a.webp"), "webp bytes");
        File.WriteAllText(Path.Combine(root, "arachnophobia", "2-a.jpg"), "jpg bytes");
        File.WriteAllText(Path.Combine(root, "arachnophobia", "2-b.jpeg"), "jpeg bytes");
        File.WriteAllText(Path.Combine(root, "arachnophobia", "2-c.png"), "png bytes");
        File.WriteAllText(Path.Combine(root, "arachnophobia", "2-d.avif"), "avif bytes");
        File.WriteAllText(Path.Combine(_sandbox, "secret.webp"), "outside the root");
        _store = new LocalDiskMediaStore(root);
    }

    public void Dispose() => Directory.Delete(_sandbox, recursive: true);

    [Theory]
    [InlineData("arachnophobia/1-a.webp", "image/webp", "webp bytes")]
    [InlineData("arachnophobia/2-a.jpg", "image/jpeg", "jpg bytes")]
    [InlineData("arachnophobia/2-b.jpeg", "image/jpeg", "jpeg bytes")]
    [InlineData("arachnophobia/2-c.png", "image/png", "png bytes")]
    [InlineData("arachnophobia/2-d.avif", "image/avif", "avif bytes")]
    public async Task Opens_an_image_with_its_content_type(string key, string contentType, string content)
    {
        var file = await _store.OpenReadAsync(key, CancellationToken.None);

        Assert.NotNull(file);
        await using var stream = file.Content;
        using var reader = new StreamReader(stream);
        Assert.Equal(contentType, file.ContentType);
        Assert.Equal(content, await reader.ReadToEndAsync());
    }

    [Theory]
    [InlineData("arachnophobia/missing.webp")]
    [InlineData("../secret.webp")]
    [InlineData("arachnophobia/../../secret.webp")]
    [InlineData("/etc/passwd.webp")]
    [InlineData("C:/secret.webp")]
    [InlineData("arachnophobia\\1-a.webp")]
    [InlineData("arachnophobia/1-a.exe")]
    [InlineData("arachnophobia/1-a.svg")]
    [InlineData("Arachnophobia/1-a.webp")]
    [InlineData("")]
    public async Task Refuses_missing_files_and_keys_outside_the_allowed_shape(string key)
    {
        Assert.Null(await _store.OpenReadAsync(key, CancellationToken.None));
    }
}
