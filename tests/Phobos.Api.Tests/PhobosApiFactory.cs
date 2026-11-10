using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Phobos.Api.Tests;

/// <summary>Runs the API with its shipped catalogue and a throwaway media folder.</summary>
public sealed class PhobosApiFactory : WebApplicationFactory<Program>
{
    public string MediaRoot { get; } = Path.Combine(Path.GetTempPath(), "phobos-api-media-" + Guid.NewGuid().ToString("N"));

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        Directory.CreateDirectory(MediaRoot);
        builder.UseSetting("Media:RootPath", MediaRoot);
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing && Directory.Exists(MediaRoot)) Directory.Delete(MediaRoot, recursive: true);
    }
}
