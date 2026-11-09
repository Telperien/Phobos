using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Phobos.Application;

namespace Phobos.Infrastructure.Tests;

public sealed class InfrastructureSetupTests : IDisposable
{
    private readonly string _contentRoot = Path.Combine(Path.GetTempPath(), "phobos-setup-" + Guid.NewGuid().ToString("N"));

    public void Dispose()
    {
        if (Directory.Exists(_contentRoot)) Directory.Delete(_contentRoot, recursive: true);
    }

    private IMediaStore MediaStoreFor(string? mediaRootPath)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:Phobos"] = "Host=localhost;Database=unused",
                ["Media:RootPath"] = mediaRootPath,
            })
            .Build();
        return new ServiceCollection()
            .AddPhobosInfrastructure(configuration, _contentRoot)
            .BuildServiceProvider()
            .GetRequiredService<IMediaStore>();
    }

    private void CreateImage(string folder)
    {
        Directory.CreateDirectory(Path.Combine(_contentRoot, folder, "acrophobia"));
        File.WriteAllText(Path.Combine(_contentRoot, folder, "acrophobia", "1-a.webp"), folder);
    }

    [Fact]
    public async Task Media_are_read_from_the_configured_folder_under_the_content_root()
    {
        CreateImage("uploads");

        var file = await MediaStoreFor("uploads").OpenReadAsync("acrophobia/1-a.webp", CancellationToken.None);

        Assert.NotNull(file);
        await file.Content.DisposeAsync();
    }

    [Fact]
    public async Task Media_default_to_a_media_folder_under_the_content_root()
    {
        CreateImage("media");

        var file = await MediaStoreFor(null).OpenReadAsync("acrophobia/1-a.webp", CancellationToken.None);

        Assert.NotNull(file);
        await file.Content.DisposeAsync();
    }

    [Fact]
    public void A_missing_connection_string_is_reported_at_startup()
    {
        var empty = new ConfigurationBuilder().Build();

        var error = Assert.Throws<InvalidOperationException>(() =>
            new ServiceCollection().AddPhobosInfrastructure(empty, _contentRoot));
        Assert.Contains("ConnectionStrings:Phobos", error.Message, StringComparison.Ordinal);
    }
}
