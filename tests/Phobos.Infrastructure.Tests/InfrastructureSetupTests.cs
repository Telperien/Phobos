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

    private ServiceProvider ServicesFor(string? mediaRootPath = null)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Media:RootPath"] = mediaRootPath })
            .Build();
        return new ServiceCollection().AddPhobosInfrastructure(configuration, _contentRoot).BuildServiceProvider();
    }

    private IMediaStore MediaStoreFor(string? mediaRootPath) => ServicesFor(mediaRootPath).GetRequiredService<IMediaStore>();

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
    public async Task The_catalogue_serves_the_shipped_case_files()
    {
        var catalogue = ServicesFor().GetRequiredService<IPhobiaCatalogue>();

        var phobias = await catalogue.ListAsync(CancellationToken.None);
        var spiders = await catalogue.FindBySlugAsync("arachnophobia", CancellationToken.None);

        Assert.Equal(30, phobias.Count);
        Assert.Equal(1, spiders?.CaseNumber);
        Assert.Null(await catalogue.FindBySlugAsync("unknown", CancellationToken.None));
    }
}
