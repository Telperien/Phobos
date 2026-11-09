using System.Net;
using Microsoft.AspNetCore.Hosting;

namespace Phobos.Api.Tests;

/// <summary>
/// In production the API also serves the built React site (copied into its web root at publish time),
/// so the browser talks to a single origin for the pages, <c>/api</c> and <c>/media</c>.
/// </summary>
public sealed class SiteHostingTests : IClassFixture<PhobosApiFactory>, IDisposable
{
    private const string EntryPage = "<!doctype html><title>phobos-entry</title>";

    private readonly string _webRoot = Path.Combine(Path.GetTempPath(), "phobos-webroot-" + Guid.NewGuid().ToString("N"));
    private readonly HttpClient _client;

    public SiteHostingTests(PhobosApiFactory factory)
    {
        Directory.CreateDirectory(Path.Combine(_webRoot, "assets"));
        File.WriteAllText(Path.Combine(_webRoot, "index.html"), EntryPage);
        File.WriteAllText(Path.Combine(_webRoot, "assets", "app.js"), "console.log('phobos')");
        _client = factory.WithWebHostBuilder(builder => builder.UseWebRoot(_webRoot)).CreateClient();
    }

    public void Dispose()
    {
        _client.Dispose();
        Directory.Delete(_webRoot, recursive: true);
    }

    private Task<HttpResponseMessage> GetAsync(string url) => _client.GetAsync(new Uri(url, UriKind.Relative));

    [Theory]
    [InlineData("/")]
    [InlineData("/dossiers/arachnophobia")]
    [InlineData("/mon-dossier")]
    public async Task Site_pages_are_answered_with_the_entry_page_so_the_router_can_take_over(string url)
    {
        using var response = await GetAsync(url);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/html", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal(EntryPage, await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Built_assets_are_served_from_the_web_root()
    {
        using var response = await GetAsync("/assets/app.js");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("console.log('phobos')", await response.Content.ReadAsStringAsync());
    }

    [Theory]
    [InlineData("/api/unknown")]
    [InlineData("/api/fr/phobias/arachnophobia/extra")]
    public async Task An_unknown_api_route_stays_a_404_instead_of_the_entry_page(string url)
    {
        using var response = await GetAsync(url);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
