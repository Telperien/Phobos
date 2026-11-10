using System.IO.Compression;
using System.Net;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Phobos.Api.Tests;

/// <summary>
/// In production the API also serves the built React site (copied into its web root at publish time),
/// so the browser talks to a single origin for the pages, <c>/api</c> and <c>/media</c>.
/// </summary>
public sealed class SiteHostingTests : IClassFixture<PhobosApiFactory>, IDisposable
{
    private readonly PhobosApiFactory _factory;
    private const string EntryPage = "<!doctype html><title>phobos-entry</title>";

    private readonly string _webRoot = Path.Combine(Path.GetTempPath(), "phobos-webroot-" + Guid.NewGuid().ToString("N"));
    private readonly HttpClient _client;

    public SiteHostingTests(PhobosApiFactory factory)
    {
        _factory = factory;
        Directory.CreateDirectory(Path.Combine(_webRoot, "assets"));
        File.WriteAllText(Path.Combine(_webRoot, "index.html"), EntryPage);
        File.WriteAllText(Path.Combine(_webRoot, "assets", "app.js"), "console.log('phobos')");
        File.WriteAllText(Path.Combine(_webRoot, "favicon.svg"), "<svg xmlns=\"http://www.w3.org/2000/svg\"/>");
        // As in production: from the hosting proxy, which tells the visitor came over https.
        _client = factory.WithWebHostBuilder(builder =>
        {
            builder.UseWebRoot(_webRoot);
            builder.ConfigureTestServices(services => services.AddTransient<IStartupFilter, FromInternalNetwork>());
        }).CreateClient();
        _client.DefaultRequestHeaders.Add("X-Forwarded-Proto", "https");
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

    [Fact]
    public async Task Built_assets_are_cached_for_a_year_since_their_name_changes_with_their_content()
    {
        using var response = await GetAsync("/assets/app.js");

        Assert.Equal(TimeSpan.FromDays(365), response.Headers.CacheControl?.MaxAge);
        Assert.True(response.Headers.CacheControl?.Public);
        Assert.Contains("immutable", response.Headers.CacheControl?.ToString(), StringComparison.Ordinal);
    }

    [Fact]
    public async Task Other_static_files_are_not_kept_forever_since_their_name_never_changes()
    {
        using var response = await GetAsync("/favicon.svg");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Null(response.Headers.CacheControl);
    }

    [Fact]
    public async Task Pages_are_checked_again_on_each_visit_so_a_new_version_shows_at_once()
    {
        using var response = await GetAsync("/fr/dossiers");

        Assert.True(response.Headers.CacheControl?.NoCache);
    }

    [Theory]
    [InlineData("/assets/app.js", "br")]
    [InlineData("/assets/app.js", "gzip")]
    [InlineData("/favicon.svg", "br")]
    [InlineData("/fr/dossiers", "br")]
    public async Task Text_files_and_pages_are_compressed_for_browsers_that_accept_it(string url, string encoding)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, new Uri(url, UriKind.Relative));
        request.Headers.AcceptEncoding.ParseAdd(encoding);

        using var response = await _client.SendAsync(request);

        Assert.Equal([encoding], response.Content.Headers.ContentEncoding);
    }

    [Fact]
    public void Compression_favours_size_since_built_files_are_downloaded_once_then_cached()
    {
        Assert.Equal(CompressionLevel.Optimal, _factory.Services.GetRequiredService<IOptions<BrotliCompressionProviderOptions>>().Value.Level);
        Assert.Equal(CompressionLevel.Optimal, _factory.Services.GetRequiredService<IOptions<GzipCompressionProviderOptions>>().Value.Level);
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
